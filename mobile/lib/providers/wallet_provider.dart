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

  // Payment gateways state
  Map<String, dynamic>? _monnifyAccount;
  Map<String, dynamic>? _gafiapayAccount;
  bool _isMonnifyLoading = false;
  bool _isGafiapayLoading = false;

  // In-memory caching for instant loading (<1ms)
  List<dynamic> _cachedDataPlans = [];
  DateTime? _dataPlansCachedAt;
  bool _isFetchingPlans = false;

  List<dynamic> _cachedAirtimePricing = [];
  DateTime? _airtimePricingCachedAt;
  bool _isFetchingAirtimePricing = false;

  double get balance => _balance;
  double get ledgerBalance => _ledgerBalance;
  double get referralEarnings => _referralEarnings;
  List<dynamic> get transactions => _transactions;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  List<dynamic> get cachedDataPlans => _cachedDataPlans;
  List<dynamic> get cachedAirtimePricing => _cachedAirtimePricing;

  Map<String, dynamic>? get monnifyAccount => _monnifyAccount;
  Map<String, dynamic>? get gafiapayAccount => _gafiapayAccount;
  bool get isMonnifyLoading => _isMonnifyLoading;
  bool get isGafiapayLoading => _isGafiapayLoading;

  Future<void> fetchWalletData() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Parallel execution for 3x faster loading!
      await Future.wait([
        _fetchBalance(),
        _fetchStats(),
        fetchHistoryInternal(),
      ]);
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _fetchBalance() async {
    try {
      final balanceResponse = await _apiService.get('/wallet/balance');
      if (balanceResponse.data != null && balanceResponse.data['success'] == true) {
        final walletData = balanceResponse.data['data'];
        _balance = (walletData['balance'] as num).toDouble();
        _ledgerBalance = (walletData['ledgerBalance'] as num).toDouble();
      }
    } catch (_) {}
  }

  Future<void> _fetchStats() async {
    try {
      final statsResponse = await _apiService.get('/wallet/stats');
      if (statsResponse.data != null && statsResponse.data['success'] == true) {
        final statsData = statsResponse.data['data'];
        _referralEarnings = (statsData['referralEarnings'] as num).toDouble();
      }
    } catch (_) {}
  }

  Future<void> fetchHistoryInternal() async {
    final response = await _apiService.get('/wallet/history');
    if (response.data != null && response.data['success'] == true) {
      _transactions = response.data['data'] as List<dynamic>;
    }
  }

  // ================= MONNIFY & GAFIAPAY METHODS =================

  Future<void> fetchMonnifyAccount() async {
    _isMonnifyLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final response = await _apiService.get('/user/monnify-account');
      if (response.data != null && response.data['success'] == true) {
        if (response.data['exists'] == true) {
          _monnifyAccount = response.data['account'];
        } else {
          _monnifyAccount = null;
        }
      }
    } catch (e) {
      debugPrint('Error fetching Monnify account: $e');
    } finally {
      _isMonnifyLoading = false;
      notifyListeners();
    }
  }

  Future<bool> generateMonnifyAccount() async {
    _isMonnifyLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final response = await _apiService.post('/user/monnify-account/generate');
      if (response.data != null && response.data['success'] == true) {
        _monnifyAccount = response.data['account'];
        return true;
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isMonnifyLoading = false;
      notifyListeners();
    }
    return false;
  }

  Future<void> fetchActiveGafiapayAccount() async {
    _isGafiapayLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final response = await _apiService.get('/user/gafiapay/active');
      if (response.data != null && response.data['success'] == true) {
        if (response.data['exists'] == true) {
          _gafiapayAccount = response.data['account'];
        } else {
          _gafiapayAccount = null;
        }
      }
    } catch (e) {
      debugPrint('Error fetching active Gafiapay account: $e');
    } finally {
      _isGafiapayLoading = false;
      notifyListeners();
    }
  }

  Future<bool> generateGafiapayAccount({String? nin, String? bvn, String idType = 'auto'}) async {
    _isGafiapayLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final payload = <String, dynamic>{
        'idType': idType,
      };
      if (nin != null && nin.trim().isNotEmpty) payload['nin'] = nin.trim();
      if (bvn != null && bvn.trim().isNotEmpty) payload['bvn'] = bvn.trim();
      final idNumber = (bvn ?? nin ?? '').trim();
      if (idNumber.isNotEmpty) payload['idNumber'] = idNumber;

      final response = await _apiService.post('/user/gafiapay/generate', data: payload);
      if (response.data != null && response.data['success'] == true) {
        _gafiapayAccount = response.data['account'];
        return true;
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isGafiapayLoading = false;
      notifyListeners();
    }
    return false;
  }

  void clearGafiapayAccount() {
    _gafiapayAccount = null;
    notifyListeners();
  }

  // ================= END MONNIFY & GAFIAPAY METHODS =================

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

  Future<Map<String, dynamic>?> verifyCustomer({
    required String customerId,
    required String serviceId,
    required String variationId,
  }) async {
    try {
      final response = await _apiService.post(
        '/services/verify-customer',
        data: {
          'customerId': customerId,
          'serviceId': serviceId,
          'variationId': variationId,
        },
      );

      if (response.data != null && response.data['success'] == true) {
        return response.data['data'] != null ? Map<String, dynamic>.from(response.data['data']) : null;
      }
    } catch (e) {
      debugPrint('Error verifying customer: $e');
      rethrow;
    }
    return null;
  }

  Future<List<dynamic>> fetchDataPlans({bool forceRefresh = false}) async {
    final now = DateTime.now();
    final isCacheValid = _cachedDataPlans.isNotEmpty &&
        _dataPlansCachedAt != null &&
        now.difference(_dataPlansCachedAt!) < const Duration(minutes: 5);

    // Return cached plans immediately (<1ms) if valid and not forced
    if (isCacheValid && !forceRefresh) {
      // Revalidate in background if older than 2 minutes
      if (now.difference(_dataPlansCachedAt!) > const Duration(minutes: 2) && !_isFetchingPlans) {
        _revalidatePlansInBackground();
      }
      return _cachedDataPlans;
    }

    _isFetchingPlans = true;
    try {
      final response = await _apiService.get('/services/data/plans');
      if (response.data != null && response.data['success'] == true) {
        _cachedDataPlans = response.data['data'] as List<dynamic>;
        _dataPlansCachedAt = DateTime.now();
        notifyListeners();
        return _cachedDataPlans;
      }
    } catch (e) {
      debugPrint('Error fetching data plans: $e');
    } finally {
      _isFetchingPlans = false;
    }
    return _cachedDataPlans;
  }

  Future<void> _revalidatePlansInBackground() async {
    if (_isFetchingPlans) return;
    _isFetchingPlans = true;
    try {
      final response = await _apiService.get('/services/data/plans');
      if (response.data != null && response.data['success'] == true) {
        _cachedDataPlans = response.data['data'] as List<dynamic>;
        _dataPlansCachedAt = DateTime.now();
        notifyListeners();
      }
    } catch (_) {
    } finally {
      _isFetchingPlans = false;
    }
  }

  Future<List<dynamic>> fetchAirtimePricing({bool forceRefresh = false}) async {
    final now = DateTime.now();
    final isCacheValid = _cachedAirtimePricing.isNotEmpty &&
        _airtimePricingCachedAt != null &&
        now.difference(_airtimePricingCachedAt!) < const Duration(minutes: 5);

    if (isCacheValid && !forceRefresh) {
      return _cachedAirtimePricing;
    }

    _isFetchingAirtimePricing = true;
    try {
      final response = await _apiService.get('/services/airtime/pricing');
      if (response.data != null && response.data['success'] == true) {
        _cachedAirtimePricing = response.data['data'] as List<dynamic>;
        _airtimePricingCachedAt = DateTime.now();
        notifyListeners();
        return _cachedAirtimePricing;
      }
    } catch (e) {
      debugPrint('Error fetching airtime pricing: $e');
    } finally {
      _isFetchingAirtimePricing = false;
    }
    return _cachedAirtimePricing;
  }

  Future<List<dynamic>> fetchElectricityTokens(String meterNumber) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final response = await _apiService.get(
        '/services/electricity/tokens',
        queryParameters: {'meterNumber': meterNumber},
      );
      if (response.data != null && response.data['success'] == true) {
        _isLoading = false;
        notifyListeners();
        return response.data['data'] as List<dynamic>;
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return [];
  }
}
