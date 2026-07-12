import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/wallet_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/pin_input_dialog.dart';

class ElectricityScreen extends StatefulWidget {
  const ElectricityScreen({super.key});

  @override
  State<ElectricityScreen> createState() => _ElectricityScreenState();
}

class _ElectricityScreenState extends State<ElectricityScreen> {
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

  @override
  void initState() {
    super.initState();
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
    _meterController.dispose();
    _amountController.dispose();
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
    if (amount < 500) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Minimum bill payment is ₦500'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final pin = await showDialog<String>(
      context: context,
      builder: (_) => const PinInputDialog(),
    );
    if (pin == null || pin.length != 4) return;

    final wallet = Provider.of<WalletProvider>(context, listen: false);
    final response = await wallet.purchaseService(
      serviceType: 'electricity',
      payload: {
        'disco': _selectedDisco.toLowerCase(),
        'meterNumber': _meterController.text.trim(),
        'meterType': _selectedMeterType.toLowerCase(),
        'amount': amount,
        'pin': pin,
      },
    );

    if (mounted) {
      if (response != null) {
        _meterController.clear();
        _amountController.clear();
        setState(() {
          _verifiedCustomer = null;
          _isVerificationOffline = false;
        });

        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppColors.darkBgSecondary,
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: AppColors.success),
                SizedBox(width: 8),
                Text('Payment Success', style: TextStyle(color: Colors.white)),
              ],
            ),
            content: Text(
              'Your electricity bill payment was processed successfully!\n\nReference: ${response['reference']}\nDisCo: ${response['disco']}\nMeter: ${response['meterNumber']}\n\nPREPAID TOKEN:\n${response['token']}',
              style: TextStyle(color: AppColors.silverLight),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.pop(context); // Go back to Home
                },
                child: const Text('OK', style: TextStyle(color: AppColors.accentGlow)),
              )
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(wallet.errorMessage ?? 'Payment failed'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final wallet = Provider.of<WalletProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pay Electricity Bill'),
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Balance Indicator Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.darkBgSecondary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Wallet Balance:',
                      style: TextStyle(color: AppColors.silverMuted, fontSize: 13),
                    ),
                    Text(
                      '₦${wallet.balance.toStringAsFixed(2)}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // DisCo selector
                    Text(
                      'Select Distribution Company (DisCo)',
                      style: TextStyle(
                        color: AppColors.silverLight,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: AppColors.darkBgSecondary,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.silverMuted),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          isExpanded: true,
                          value: _selectedDisco,
                          dropdownColor: AppColors.darkBgSecondary,
                          style: TextStyle(color: AppColors.silverLight),
                          onChanged: (String? val) {
                            if (val != null) {
                              setState(() {
                                _selectedDisco = val;
                                _verifiedCustomer = null;
                                _isVerificationOffline = false;
                              });
                            }
                          },
                          items: _discos.map((d) {
                            return DropdownMenuItem<String>(
                              value: d,
                              child: Text(
                                '$d Power Distribution',
                                style: const TextStyle(fontSize: 14),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Meter Type select row
                    Text(
                      'Meter Type',
                      style: TextStyle(
                        color: AppColors.silverLight,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: _meterTypes.map((t) {
                        final isSel = _selectedMeterType == t;
                        return Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedMeterType = t;
                                _verifiedCustomer = null;
                                _isVerificationOffline = false;
                              });
                            },
                            child: Container(
                              margin: const EdgeInsets.only(right: 10),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: isSel ? AppColors.primaryBlue : AppColors.darkBgSecondary,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: isSel ? AppColors.primaryBlue : AppColors.silverMuted.withValues(alpha: 0.1),
                                ),
                              ),
                              child: Text(
                                t,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: isSel ? Colors.white : AppColors.silverMuted,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),

                    // Meter Number input
                    TextFormField(
                      controller: _meterController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Meter Number',
                        prefixIcon: Icon(Icons.speed, color: AppColors.silverMuted),
                        hintText: 'Enter 11 or 13-digit meter number',
                        suffixIcon: Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: TextButton(
                            onPressed: _isVerifying ? null : _verifyMeter,
                            child: _isVerifying
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: AppColors.accentGlow,
                                    ),
                                  )
                                : const Text(
                                    'VERIFY',
                                    style: TextStyle(
                                      color: AppColors.accentGlow,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                          ),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter meter number';
                        }
                        if (value.trim().length < 8) {
                          return 'Please enter a valid meter number';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),

                    // Verified Customer details / Warning
                    if (_verifiedCustomer != null) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _isVerificationOffline
                              ? Colors.amber.withValues(alpha: 0.1)
                              : AppColors.primaryBlue.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: _isVerificationOffline
                                ? Colors.amber.withValues(alpha: 0.3)
                                : AppColors.primaryBlue.withValues(alpha: 0.2),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _isVerificationOffline
                                  ? '⚠️ Verification Service Offline'
                                  : 'Verified Subscriber Details',
                              style: TextStyle(
                                color: _isVerificationOffline
                                    ? Colors.amber
                                    : AppColors.accentGlow,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _isVerificationOffline
                                  ? "Could not verify meter details because the provider's service is offline. You can proceed, but please double-check your meter number."
                                  : 'Name: ${_verifiedCustomer!['customer_name'] ?? _verifiedCustomer!['customerName'] ?? 'N/A'}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            if (!_isVerificationOffline && (_verifiedCustomer!['customer_address'] != null || _verifiedCustomer!['customerAddress'] != null)) ...[
                              const SizedBox(height: 4),
                              Text(
                                'Address: ${_verifiedCustomer!['customer_address'] ?? _verifiedCustomer!['customerAddress']}',
                                style: TextStyle(
                                  color: AppColors.silverLight,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),

                    // Amount input
                    TextFormField(
                      controller: _amountController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Payment Amount (₦)',
                        prefixIcon: Icon(Icons.monetization_on_outlined, color: AppColors.silverMuted),
                        hintText: 'Minimum ₦500',
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter amount';
                        }
                        final parsed = double.tryParse(value);
                        if (parsed == null || parsed < 500) {
                          return 'Minimum amount is ₦500';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 40),

                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: wallet.isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: wallet.isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : const Text(
                                'Pay Utility Bill',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
