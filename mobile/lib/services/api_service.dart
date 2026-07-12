import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late final Dio _dio;
  final _storage = const FlutterSecureStorage();
  String? _token;

  ApiService._internal() {
    String baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:3001/api';

    // On Android emulator, 'localhost' resolves to the emulator itself.
    // Rewrite it to 10.0.2.2, which is the host machine's loopback address.
    if (!kIsWeb && Platform.isAndroid) {
      baseUrl = baseUrl
          .replaceAll('http://localhost', 'http://10.0.2.2')
          .replaceAll('http://127.0.0.1', 'http://10.0.2.2');
    }

    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
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
            final savedToken = await _storage.read(key: 'auth_token');
            if (savedToken != null) {
              _token = savedToken;
              options.headers['Authorization'] = 'Bearer $savedToken';
            }
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          // Log errors in debug mode
          print('API Error: ${e.response?.statusCode} - ${e.response?.data}');
          return handler.next(e);
        },
      ),
    );
  }

  Future<void> saveToken(String token) async {
    _token = token;
    await _storage.write(key: 'auth_token', value: token);
  }

  Future<void> clearToken() async {
    _token = null;
    await _storage.delete(key: 'auth_token');
  }

  Future<bool> hasToken() async {
    final token = await _storage.read(key: 'auth_token');
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

  Exception _handleError(DioException e) {
    if (e.response != null) {
      final message = e.response?.data['message'];
      if (message is List) {
        return Exception(message.join(', '));
      }
      return Exception(message ?? 'Server error occurred');
    }
    
    if (e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.receiveTimeout) {
      return Exception('Connection timeout. Please check your internet connection.');
    }
    
    return Exception('Network error. Check your connection.');
  }
}
