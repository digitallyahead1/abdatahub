import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  Map<String, dynamic>? _user;
  bool _isLoading = false;
  String? _errorMessage;
  bool _isAuthenticated = false;

  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _isAuthenticated;

  Future<bool> checkAuthStatus() async {
    _isLoading = true;
    notifyListeners();

    try {
      final hasToken = await _apiService.hasToken();
      if (hasToken) {
        final success = await fetchProfile();
        if (success) {
          _isAuthenticated = true;
          _isLoading = false;
          notifyListeners();
          return true;
        }
      }
    } catch (e) {
      print('Check Auth Status Error: $e');
    }

    _isAuthenticated = false;
    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> login(String emailOrPhone, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/auth/login',
        data: {
          'email': emailOrPhone, // Backend expects 'email' but handles phone inside auth service
          'password': password,
        },
      );

      final responseData = response.data;
      final data = responseData != null ? responseData['data'] : null;
      if (data != null && data['accessToken'] != null) {
        await _apiService.saveToken(data['accessToken']);
        _user = data['user'];
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = 'Invalid response from server';
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> register({
    required String fullName,
    required String email,
    required String phoneNumber,
    required String password,
    String? referralCode,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/auth/register',
        data: {
          'fullName': fullName,
          'email': email,
          'phoneNumber': phoneNumber,
          'password': password,
          if (referralCode != null && referralCode.isNotEmpty) 'referralCode': referralCode,
        },
      );

      final responseData = response.data;
      final data = responseData != null ? responseData['data'] : null;
      // Auto login after registration if backend returns access token, else user logs in manually
      if (data != null && data['accessToken'] != null) {
        await _apiService.saveToken(data['accessToken']);
        _user = data['user'];
        _isAuthenticated = true;
      }
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> fetchProfile() async {
    try {
      final response = await _apiService.get('/auth/profile');
      final data = response.data;
      if (data != null) {
        // Handle response wrapping (sometimes profile data is inside a 'data' key)
        _user = data['data'] ?? data;
        notifyListeners();
        return true;
      }
    } catch (e) {
      print('Fetch Profile Error: $e');
      if (e.toString().contains('401') || e.toString().contains('Unauthorized')) {
        logout();
      }
    }
    return false;
  }

  Future<void> logout() async {
    await _apiService.clearToken();
    _user = null;
    _isAuthenticated = false;
    _errorMessage = null;
    notifyListeners();
  }

  Future<bool> forgotPassword(String email) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/auth/forgot-password',
        data: {
          'email': email,
        },
      );
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<String?> verifyOtp(String email, String otp) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/auth/verify-otp',
        data: {
          'email': email,
          'otp': otp,
        },
      );

      final responseData = response.data;
      final resetToken = responseData != null ? responseData['resetToken'] : null;

      _isLoading = false;
      notifyListeners();
      return resetToken;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
    return null;
  }

  Future<bool> resetPassword(String resetToken, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _apiService.post(
        '/auth/reset-password',
        data: {
          'resetToken': resetToken,
          'password': password,
        },
      );

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }
}
