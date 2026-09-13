import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
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

  FirebaseMessaging? get _fcm {
    if (kIsWeb) return null;
    try {
      return FirebaseMessaging.instance;
    } catch (e) {
      debugPrint('[FCM] FirebaseMessaging not available: $e');
      return null;
    }
  }

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
    final fcm = _fcm;
    if (fcm == null) return;

    try {
      // 1. Register background handler early
      FirebaseMessaging.onBackgroundMessage(firebaseBackgroundMessageHandler);

      // 2. Request permission (Android 13+, iOS)
      final settings = await fcm.requestPermission(
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

      // 3. Create Android notification channel
      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_channel);

      // 4. Init local notifications (both Android and iOS)
      const androidSettings = AndroidInitializationSettings('@drawable/ic_notification');
      const darwinSettings = DarwinInitializationSettings(
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      );
      const initSettings = InitializationSettings(
        android: androidSettings,
        iOS: darwinSettings,
      );
      await _localNotifications.initialize(
        initSettings,
        onDidReceiveNotificationResponse: (details) {
          debugPrint('[FCM] Local notification tapped: ${details.payload}');
        },
      );

      // 5. Foreground messages -> show local notification banner
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('[FCM] Foreground message received: ${message.notification?.title ?? message.data['title']}');
        _showLocalNotification(message);
      });

      // 6. App opened from notification (background -> foreground)
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('[FCM] App opened from notification: ${message.notification?.title ?? message.data['title']}');
      });

      // 7. App launched from terminated state via notification
      final initialMessage = await fcm.getInitialMessage();
      if (initialMessage != null) {
        debugPrint('[FCM] App launched from terminated via notification: ${initialMessage.notification?.title ?? initialMessage.data['title']}');
      }

      // 8. Refresh token listener
      fcm.onTokenRefresh.listen((newToken) {
        debugPrint('[FCM] Token refresh: $newToken');
        _registerTokenWithBackend(newToken);
      });

      // 9. Register current token
      final token = await fcm.getToken();
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
      final fcm = _fcm;
      if (fcm == null) return;
      final token = await fcm.getToken();
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
          icon: '@drawable/ic_notification',
          color: const Color(0xFF1E40AF),
          largeIcon: imageUrl != null ? FilePathAndroidBitmap(imageUrl) : null,
          playSound: true,
          enableVibration: true,
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: jsonEncode(message.data),
    );
  }

  Future<void> _registerTokenWithBackend([String? explicitToken]) async {
    if (kIsWeb) return;
    try {
      final token = explicitToken ?? await _fcm?.getToken();
      if (token == null) return;

      await ApiService().post(
        '/notifications/device-token',
        data: {
          'token': token,
          'platform': defaultTargetPlatform.name.toLowerCase(),
        },
      );
      debugPrint('[FCM] Device token registered with backend successfully');
    } catch (e) {
      debugPrint('[FCM] Failed to register device token: $e');
    }
  }

  Future<String?> getToken() async => _fcm?.getToken();
}

