import 'package:flutter/material.dart';
import '../services/api_service.dart';

class WalletProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  double _balance = 0.0;
  double _ledgerBalance = 0.0;
  double _referralEarnings = 0.0;
  List<dynamic> _transactions = [];
  bool _isLoading = false;
  String? _errorMessage;

  double get balance => _balance;
  double get ledgerBalance => _ledgerBalance;
  double get referralEarnings => _referralEarnings;
  List<dynamic> get transactions => _transactions;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchWalletData() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Fetch balance
      final balanceResponse = await _apiService.get('/wallet/balance');
      if (balanceResponse.data != null && balanceResponse.data['success'] == true) {
        final walletData = balanceResponse.data['data'];
        _balance = (walletData['balance'] as num).toDouble();
        _ledgerBalance = (walletData['ledgerBalance'] as num).toDouble();
      }

      // Fetch stats for referral earnings
      final statsResponse = await _apiService.get('/wallet/stats');
      if (statsResponse.data != null && statsResponse.data['success'] == true) {
        final statsData = statsResponse.data['data'];
        _referralEarnings = (statsData['referralEarnings'] as num).toDouble();
      }

      // Fetch history
      await fetchHistoryInternal();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchHistoryInternal() async {
    final response = await _apiService.get('/wallet/history');
    if (response.data != null && response.data['success'] == true) {
      _transactions = response.data['data'] as List<dynamic>;
    }
  }

  Future<bool> deposit(double amount, String paymentMethod) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/wallet/deposit',
        data: {
          'amount': amount,
          'paymentMethod': paymentMethod,
        },
      );

      if (response.data != null && response.data['success'] == true) {
        await fetchWalletData(); // Refresh all wallet info
        return true;
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return false;
  }

  Future<Map<String, dynamic>?> purchaseService({
    required String serviceType, // 'data', 'airtime', 'electricity', 'cable', 'exam-pin'
    required Map<String, dynamic> payload,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/services/$serviceType',
        data: payload,
      );

      if (response.data != null && response.data['success'] == true) {
        await fetchWalletData(); // Refresh wallet
        return response.data['data'];
      } else {
        _errorMessage = response.data?['message'] ?? 'Service purchase failed';
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return null;
  }

  Future<List<dynamic>> fetchDataPlans() async {
    try {
      final response = await _apiService.get('/services/data/plans');
      if (response.data != null && response.data['success'] == true) {
        return response.data['data'] as List<dynamic>;
      }
    } catch (e) {
      debugPrint('Error fetching data plans: $e');
    }
    return [];
  }

  Future<List<dynamic>> fetchAirtimePricing() async {
    try {
      final response = await _apiService.get('/services/airtime/pricing');
      if (response.data != null && response.data['success'] == true) {
        return response.data['data'] as List<dynamic>;
      }
    } catch (e) {
      debugPrint('Error fetching airtime pricing: $e');
    }
    return [];
  }
}
