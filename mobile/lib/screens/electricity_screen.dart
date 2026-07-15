import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/wallet_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/pin_input_dialog.dart';

class ElectricityScreen extends StatefulWidget {
  const ElectricityScreen({super.key});

  @override
  State<ElectricityScreen> createState() => _ElectricityScreenState();
}

class _ElectricityScreenState extends State<ElectricityScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  // Payment Form States
  final _formKey = GlobalKey<FormState>();
  final _meterController = TextEditingController();
  final _amountController = TextEditingController();
  String _selectedDisco = 'IKEDC';
  String _selectedMeterType = 'Prepaid';
  final List<String> _discos = ['IKEDC', 'EKEDC', 'AEDC', 'KEDCO', 'IBEDC'];
  final List<String> _meterTypes = ['Prepaid', 'Postpaid'];
  bool _isVerifying = false;
  Map<String, dynamic>? _verifiedCustomer;
  bool _isVerificationOffline = false;

  // Token Retrieval States
  final _searchController = TextEditingController();
  List<dynamic> _retrievedTokens = [];
  bool _isRetrieving = false;
  bool _hasSearched = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _meterController.addListener(() {
      if (_verifiedCustomer != null || _isVerificationOffline) {
        setState(() {
          _verifiedCustomer = null;
          _isVerificationOffline = false;
        });
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _meterController.dispose();
    _amountController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _verifyMeter() async {
    final meterNo = _meterController.text.trim();
    if (meterNo.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a meter number'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }
    
    setState(() {
      _isVerifying = true;
      _verifiedCustomer = null;
      _isVerificationOffline = false;
    });

    try {
      final wallet = Provider.of<WalletProvider>(context, listen: false);
      final data = await wallet.verifyCustomer(
        customerId: meterNo,
        serviceId: _selectedDisco.toLowerCase(),
        variationId: _selectedMeterType.toLowerCase(),
      );

      if (mounted) {
        if (data != null && (data['status'] == true || data['status'] == 'success' || data['code'] == 'success' || data['customer_name'] != null || data['customerName'] != null)) {
          setState(() {
            _verifiedCustomer = data;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Meter number verified successfully!'),
              backgroundColor: AppColors.success,
            ),
          );
        } else {
          final msg = data?['msg'] ?? data?['message'] ?? 'Verification failed';
          _handleVerificationError(msg);
        }
      }
    } catch (e) {
      if (mounted) {
        _handleVerificationError(e.toString());
      }
    } finally {
      if (mounted) {
        setState(() {
          _isVerifying = false;
        });
      }
    }
  }

  void _handleVerificationError(String errorMsg) {
    final cleanMsg = errorMsg.replaceAll('Exception: ', '');
    final isOffline = cleanMsg.toLowerCase().contains('timeout') ||
        cleanMsg.toLowerCase().contains('504') ||
        cleanMsg.toLowerCase().contains('502') ||
        cleanMsg.toLowerCase().contains('503') ||
        cleanMsg.toLowerCase().contains('upstream') ||
        cleanMsg.toLowerCase().contains('gateway');

    if (isOffline) {
      setState(() {
        _isVerificationOffline = true;
        _verifiedCustomer = {
          'customer_name': 'Proceed without verification (Service Offline)',
          'isOffline': true,
        };
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Verification service offline. You can proceed with caution.'),
          backgroundColor: Colors.orange,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(cleanMsg),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_verifiedCustomer == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please verify the meter number before proceeding'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final amount = double.tryParse(_amountController.text) ?? 0.0;
    
    // Request Transaction PIN via customized first-try auto submit dialog
    final pin = await showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (_) => const PinInputDialog(),
    );

    if (pin == null || pin.isEmpty) return;

    if (!mounted) return;

    try {
      final wallet = Provider.of<WalletProvider>(context, listen: false);
      final payload = {
        'disco': _selectedDisco.toLowerCase(),
        'meterNumber': _meterController.text.trim(),
        'meterType': _selectedMeterType.toLowerCase(),
        'amount': amount,
        'pin': pin,
      };

      final data = await wallet.purchaseService(
        serviceType: 'electricity',
        payload: payload,
      );

      if (mounted) {
        if (data != null) {
          final generatedToken = data['token'] ?? '';
          final customerName = data['customerName'] ?? '';
          final units = data['units'] ?? '';

          _amountController.clear();
          _meterController.clear();
          setState(() {
            _verifiedCustomer = null;
          });

          // Show token dialog
          showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              backgroundColor: AppColors.darkBgSecondary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Text('Purchase Successful!', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (customerName.isNotEmpty) ...[
                    Text('Subscriber: $customerName', style: const TextStyle(color: Colors.white, fontSize: 13)),
                    const SizedBox(height: 8),
                  ],
                  const Text('Prepaid Meter Token:', style: TextStyle(color: AppColors.silverMuted, fontSize: 12)),
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                    decoration: BoxDecoration(
                      color: AppColors.darkBg,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.silverMuted.withOpacity(0.1)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: SelectableText(
                            generatedToken,
                            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1.5, fontFamily: 'monospace'),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.copy, color: AppColors.primaryBlue, size: 20),
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: generatedToken));
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Token copied to clipboard!'), backgroundColor: AppColors.success),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                  if (units.toString().isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text('Units: $units', style: const TextStyle(color: AppColors.silverLight, fontSize: 13, fontWeight: FontWeight.bold)),
                  ],
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text('OK', style: TextStyle(color: AppColors.primaryBlue)),
                )
              ],
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(wallet.errorMessage ?? 'Purchase failed'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString()),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _retrieveTokens() async {
    final meterNo = _searchController.text.trim();
    if (meterNo.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter a meter number to search'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() {
      _isRetrieving = true;
      _hasSearched = true;
      _retrievedTokens = [];
    });

    try {
      final wallet = Provider.of<WalletProvider>(context, listen: false);
      final tokens = await wallet.fetchElectricityTokens(meterNo);
      setState(() {
        _retrievedTokens = tokens;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      setState(() {
        _isRetrieving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final wallet = Provider.of<WalletProvider>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Electricity Bills'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primaryBlue,
          labelColor: Colors.white,
          unselectedLabelColor: AppColors.silverMuted,
          tabs: const [
            Tab(text: 'Pay Utility Bill'),
            Tab(text: 'Token Retrieval'),
          ],
        ),
      ),
      body: SafeArea(
        child: TabBarView(
          controller: _tabController,
          children: [
            // Tab 1: Pay Bill
            SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Choose DisCo',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _selectedDisco,
                      dropdownColor: AppColors.darkBgSecondary,
                      decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
                      items: _discos.map((disco) {
                        return DropdownMenuItem(
                          value: disco,
                          child: Text(disco, style: const TextStyle(color: Colors.white)),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedDisco = val;
                            _verifiedCustomer = null;
                            _isVerificationOffline = false;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Meter Type',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: _meterTypes.map((type) {
                        final isSelected = _selectedMeterType == type;
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4.0),
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: isSelected ? AppColors.primaryBlue : AppColors.darkBgSecondary,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              onPressed: () {
                                setState(() {
                                  _selectedMeterType = type;
                                  _verifiedCustomer = null;
                                  _isVerificationOffline = false;
                                });
                              },
                              child: Text(type, style: TextStyle(color: isSelected ? Colors.white : AppColors.silverMuted)),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Meter Number',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _meterController,
                            keyboardType: TextInputType.number,
                            style: const TextStyle(color: Colors.white),
                            decoration: const InputDecoration(
                              hintText: 'e.g. 04230001234',
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) return 'Enter meter number';
                              if (value.trim().length < 8) return 'Invalid meter number';
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        SizedBox(
                          height: 52,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryBlue),
                            onPressed: _isVerifying ? null : _verifyMeter,
                            child: _isVerifying
                                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : const Text('VERIFY', style: TextStyle(color: Colors.white)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    if (_verifiedCustomer != null) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _isVerificationOffline ? Colors.amber.withOpacity(0.1) : AppColors.primaryBlue.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: _isVerificationOffline ? Colors.amber.withOpacity(0.3) : AppColors.primaryBlue.withOpacity(0.2)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _isVerificationOffline ? '⚠️ Verification Service Offline' : 'Verified Subscriber Details',
                              style: TextStyle(color: _isVerificationOffline ? Colors.amber : AppColors.accentGlow, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _isVerificationOffline
                                  ? "Could not verify meter details because service is offline. Proceed with caution."
                                  : 'Name: ${_verifiedCustomer!['customer_name'] ?? _verifiedCustomer!['customerName'] ?? 'N/A'}',
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                            if (!_isVerificationOffline && (_verifiedCustomer!['customer_address'] != null || _verifiedCustomer!['customerAddress'] != null)) ...[
                              const SizedBox(height: 4),
                              Text(
                                'Address: ${_verifiedCustomer!['customer_address'] ?? _verifiedCustomer!['customerAddress']}',
                                style: const TextStyle(color: AppColors.silverLight, fontSize: 11),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                    const Text(
                      'Payment Amount (₦)',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _amountController,
                      keyboardType: TextInputType.number,
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(
                        hintText: 'Minimum ₦500',
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) return 'Enter amount';
                        final parsed = double.tryParse(value);
                        if (parsed == null || parsed < 500) return 'Minimum is ₦500';
                        return null;
                      },
                    ),
                    const SizedBox(height: 40),
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: wallet.isLoading ? null : _submit,
                        child: wallet.isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : const Text('Pay Utility Bill', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Tab 2: Token Retrieval
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Retrieve Prepaid Tokens',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Enter your meter number below to fetch all active prepaid tokens purchased under this account.',
                    style: TextStyle(color: AppColors.silverMuted, fontSize: 12, height: 1.4),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _searchController,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: Colors.white),
                          decoration: const InputDecoration(
                            hintText: 'Enter Meter Number',
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        height: 52,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryBlue),
                          onPressed: _isRetrieving ? null : _retrieveTokens,
                          child: _isRetrieving
                              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Text('SEARCH', style: TextStyle(color: Colors.white)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Expanded(
                    child: _isRetrieving
                        ? const Center(child: CircularProgressIndicator(color: AppColors.primaryBlue))
                        : _retrievedTokens.isNotEmpty
                            ? ListView.builder(
                                itemCount: _retrievedTokens.length,
                                itemBuilder: (context, index) {
                                  final tx = _retrievedTokens[index];
                                  final tokenStr = tx['token'] ?? '';
                                  final dateStr = tx['date'] != null ? DateTime.parse(tx['date']).toLocal().toString().substring(0, 16) : '';
                                  return Card(
                                    color: AppColors.darkBgSecondary,
                                    margin: const EdgeInsets.symmetric(vertical: 8.0),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    child: Padding(
                                      padding: const EdgeInsets.all(16.0),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(tx['disco'].toString().toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                              Text('₦${tx['amount']}', style: const TextStyle(color: AppColors.accentGlow, fontWeight: FontWeight.bold, fontSize: 13)),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Text(dateStr, style: const TextStyle(color: AppColors.silverMuted, fontSize: 11)),
                                          const SizedBox(height: 12),
                                          const Text('Prepaid Token:', style: TextStyle(color: AppColors.silverMuted, fontSize: 10)),
                                          const SizedBox(height: 4),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                            decoration: BoxDecoration(
                                              color: AppColors.darkBg,
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Expanded(
                                                  child: SelectableText(
                                                    tokenStr.isNotEmpty ? tokenStr : 'Pending / Processing',
                                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 1.2, fontSize: 15),
                                                  ),
                                                ),
                                                if (tokenStr.isNotEmpty)
                                                  IconButton(
                                                    icon: const Icon(Icons.copy, color: AppColors.primaryBlue, size: 18),
                                                    onPressed: () {
                                                      Clipboard.setData(ClipboardData(text: tokenStr));
                                                      ScaffoldMessenger.of(context).showSnackBar(
                                                        const SnackBar(content: Text('Copied token!'), backgroundColor: AppColors.success),
                                                      );
                                                    },
                                                    padding: EdgeInsets.zero,
                                                    constraints: const BoxConstraints(),
                                                  ),
                                              ],
                                            ),
                                          ),
                                          if (tx['customerName'] != null && tx['customerName'].toString().isNotEmpty) ...[
                                            const SizedBox(height: 8),
                                            Text('Subscriber: ${tx['customerName']}', style: const TextStyle(color: AppColors.silverLight, fontSize: 11)),
                                          ],
                                          if (tx['units'] != null && tx['units'].toString().isNotEmpty) ...[
                                            const SizedBox(height: 4),
                                            Text('Units: ${tx['units']}', style: const TextStyle(color: AppColors.silverLight, fontSize: 11)),
                                          ]
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              )
                            : Center(
                                child: Text(
                                  _hasSearched ? 'No tokens found for this meter' : 'No queries performed yet',
                                  style: const TextStyle(color: AppColors.silverMuted),
                                ),
                              ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
