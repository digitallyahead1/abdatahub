import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';

// Top-level background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> firebaseBackgroundMessageHandler(RemoteMessage message) async {
  debugPrint('[FCM] Background message: ${message.notification?.title ?? message.data['title']}');
}

class PushNotificationService {
  static final PushNotificationService _instance = PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  bool _isInitialized = false;

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'ab_data_hub_alerts',
    'AB Data Hub Alerts',
    description: 'Push notifications from AB Data Hub admin and transaction alerts',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
  );

  /// Call once from main.dart after Firebase.initializeApp()
  Future<void> initialize({
    String? baseUrl,
    Future<String?> Function()? getToken,
  }) async {
    if (_isInitialized) return;
    if (kIsWeb) {
      // FCM foreground/background channels are specific to native mobile apps
      return;
    }
    try {
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
        debugPrint('[FCM] Notification permission denied by user');
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
        debugPrint('[FCM] Foreground message: ${message.notification?.title ?? message.data['title']}');
        _showLocalNotification(message);
      });

      // App opened from notification (background → foreground)
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('[FCM] App opened from notification: ${message.notification?.title ?? message.data['title']}');
      });

      // App launched from terminated state via notification
      final initialMessage = await _fcm.getInitialMessage();
      if (initialMessage != null) {
        debugPrint('[FCM] App launched from terminated via notification: ${initialMessage.notification?.title ?? initialMessage.data['title']}');
      }

      // Refresh token if it rotates
      _fcm.onTokenRefresh.listen((newToken) {
        debugPrint('[FCM] Token refresh: $newToken');
        _registerTokenWithBackend(newToken);
      });

      // Register current token
      final token = await _fcm.getToken();
      if (token != null) {
        debugPrint('[FCM] Device FCM token obtained: $token');
        await _registerTokenWithBackend(token);
      }

      _isInitialized = true;
    } catch (e) {
      debugPrint('[FCM] PushNotificationService init error: $e');
    }
  }

  /// Manually trigger token synchronization (e.g. after login/register or on dashboard load)
  Future<void> syncTokenWithBackend() async {
    if (kIsWeb) return;
    try {
      final token = await _fcm.getToken();
      if (token != null) {
        await _registerTokenWithBackend(token);
      }
    } catch (e) {
      debugPrint('[FCM] Error syncing token with backend: $e');
    }
  }

  void _showLocalNotification(RemoteMessage message) {
    final title = message.notification?.title ?? message.data['title'] ?? 'AB Data Hub';
    final body = message.notification?.body ?? message.data['body'] ?? '';
    final imageUrl = message.notification?.android?.imageUrl ?? message.data['imageUrl'];

    if (title.isEmpty && body.isEmpty) return;

    _localNotifications.show(
      message.hashCode,
      title,
      body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.max,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
          largeIcon: imageUrl != null ? FilePathAndroidBitmap(imageUrl) : null,
          playSound: true,
          enableVibration: true,
        ),
      ),
      payload: jsonEncode(message.data),
    );
  }

  Future<void> _registerTokenWithBackend([String? explicitToken]) async {
    try {
      final token = explicitToken ?? await _fcm.getToken();
      if (token == null) return;

      await ApiService().post(
        '/notifications/device-token',
        data: {
          'token': token,
          'platform': defaultTargetPlatform.name.toLowerCase(),
        },
      );
      debugPrint('[FCM] Device token registered with backend');
    } catch (e) {
      debugPrint('[FCM] Failed to register device token: $e');
    }
  }

  Future<String?> getToken() => _fcm.getToken();
}
