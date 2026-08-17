import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:dio/dio.dart';

// Top-level background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> firebaseBackgroundMessageHandler(RemoteMessage message) async {
  debugPrint('[FCM] Background message: ${message.notification?.title}');
}

class PushNotificationService {
  static final PushNotificationService _instance = PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'ab_data_hub_alerts',
    'AB Data Hub Alerts',
    description: 'Push notifications from AB Data Hub admin and transaction alerts',
    importance: Importance.high,
    playSound: true,
    enableVibration: true,
  );

  /// Call once from main.dart after Firebase.initializeApp()
  Future<void> initialize({
    required String baseUrl,
    required Future<String?> Function() getToken,
  }) async {
    // Request permission (Android 13+, iOS)
    final settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      announcement: false,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.denied) {
      debugPrint('[FCM] Notification permission denied');
      return;
    }

    // Create Android notification channel
    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);

    // Init local notifications (for foreground display)
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidSettings);
    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (details) {
        debugPrint('[FCM] Local notification tapped: ${details.payload}');
      },
    );

    // Register background handler
    FirebaseMessaging.onBackgroundMessage(firebaseBackgroundMessageHandler);

    // Foreground messages → show local notification banner
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('[FCM] Foreground message: ${message.notification?.title}');
      _showLocalNotification(message);
    });

    // App opened from notification (background → foreground)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('[FCM] App opened from notification: ${message.notification?.title}');
    });

    // App launched from terminated state via notification
    final initialMessage = await _fcm.getInitialMessage();
    if (initialMessage != null) {
      debugPrint('[FCM] App launched from terminated via notification');
    }

    // Refresh token if it rotates
    _fcm.onTokenRefresh.listen((newToken) {
      _registerTokenWithBackend(
        baseUrl: baseUrl,
        token: newToken,
        getToken: getToken,
      );
    });

    // Register current token
    final token = await _fcm.getToken();
    if (token != null) {
      await _registerTokenWithBackend(
        baseUrl: baseUrl,
        token: token,
        getToken: getToken,
      );
    }
  }

  void _showLocalNotification(RemoteMessage message) {
    final notification = message.notification;
    final android = message.notification?.android;
    if (notification == null) return;

    _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: android?.smallIcon ?? '@mipmap/ic_launcher',
          largeIcon: android?.imageUrl != null
              ? FilePathAndroidBitmap(android!.imageUrl!)
              : null,
          playSound: true,
          enableVibration: true,
        ),
      ),
      payload: jsonEncode(message.data),
    );
  }

  Future<void> _registerTokenWithBackend({
    required String baseUrl,
    required String token,
    required Future<String?> Function() getToken,
  }) async {
    try {
      final authToken = await getToken();
      if (authToken == null) {
        debugPrint('[FCM] No auth token — skipping device-token registration');
        return;
      }
      final dio = Dio(BaseOptions(baseUrl: baseUrl));
      await dio.post(
        '/notifications/device-token',
        data: {
          'token': token,
          'platform': defaultTargetPlatform.name.toLowerCase(),
        },
        options: Options(headers: {'Authorization': 'Bearer $authToken'}),
      );
      debugPrint('[FCM] Device token registered with backend');
    } catch (e) {
      debugPrint('[FCM] Failed to register device token: $e');
    }
  }

  Future<String?> getToken() => _fcm.getToken();
}
