import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late final Dio _dio;

  // flutter_secure_storage works on both native and web (uses localStorage on web).
  // We instantiate it with web-specific options to use sessionStorage on web.
  static const _storage = FlutterSecureStorage(
    webOptions: WebOptions(dbName: 'abdatahub_secure', publicKey: 'abdatahub'),
  );

  String? _token;

  ApiService._internal() {
    String baseUrl = dotenv.env['API_BASE_URL'] ?? 'https://api.abdatahub.com/api';

    // On Android emulator, 'localhost' resolves to the emulator itself.
    // Rewrite it to 10.0.2.2, which is the host machine's loopback address.
    // dart:io's Platform is NOT available on Flutter Web — guard with !kIsWeb.
    if (!kIsWeb) {
      // ignore: avoid_dynamic_calls, import_of_legacy_library_into_null_safe
      // We use a conditional import pattern by checking kIsWeb first.
      // This block only runs on native platforms where dart:io is available.
      try {
        // Use a safe runtime check without direct dart:io import at the top level
        // by using the Flutter engine's defaultTargetPlatform instead.
        final isAndroid = defaultTargetPlatform == TargetPlatform.android;
        if (isAndroid) {
          baseUrl = baseUrl
              .replaceAll('http://localhost', 'http://10.0.2.2')
              .replaceAll('http://127.0.0.1', 'http://10.0.2.2');
        }
      } catch (_) {}
    }

    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 60), // Data/airtime APIs can take 30-40s
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          if (_token != null) {
            options.headers['Authorization'] = 'Bearer $_token';
          } else {
            final savedToken = await _readToken();
            if (savedToken != null) {
              _token = savedToken;
              options.headers['Authorization'] = 'Bearer $savedToken';
            }
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          if (kDebugMode) {
            debugPrint('API Error [${e.type}]: ${e.response?.statusCode} - ${e.response?.data}');
            debugPrint('Request URL: ${e.requestOptions.uri}');
          }
          return handler.next(e);
        },
      ),
    );
  }

  Future<String?> _readToken() async {
    try {
      return await _storage.read(key: 'auth_token');
    } catch (e) {
      if (kDebugMode) debugPrint('Token read error: $e');
      return null;
    }
  }

  Future<void> saveToken(String token) async {
    _token = token;
    try {
      await _storage.write(key: 'auth_token', value: token);
    } catch (e) {
      if (kDebugMode) debugPrint('Token save error: $e');
    }
  }

  Future<void> clearToken() async {
    _token = null;
    try {
      await _storage.delete(key: 'auth_token');
    } catch (e) {
      if (kDebugMode) debugPrint('Token clear error: $e');
    }
  }

  Future<bool> hasToken() async {
    final token = await _readToken();
    return token != null;
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      return await _dio.get(path, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response> post(String path, {dynamic data}) async {
    try {
      return await _dio.post(path, data: data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Response> patch(String path, {dynamic data}) async {
    try {
      return await _dio.patch(path, data: data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Exception _handleError(DioException e) {
    if (e.response != null) {
      final data = e.response?.data;
      if (data is Map && data.containsKey('message')) {
        final message = data['message'];
        if (message is List) return Exception(message.join(', '));
        return Exception(message.toString());
      }
      return Exception('Server error (${e.response?.statusCode})');
    }

    switch (e.type) {
      case DioExceptionType.connectionTimeout:
        return Exception('Connection timeout. Please check your internet connection.');
      case DioExceptionType.receiveTimeout:
        return Exception(
          'Request timed out. The transaction may still be processing — please check your transaction history.',
        );
      case DioExceptionType.connectionError:
        return Exception('Cannot reach the server. Please check your internet connection.');
      default:
        return Exception(e.message ?? 'Network error. Check your connection.');
    }
  }
}
