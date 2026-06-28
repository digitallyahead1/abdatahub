import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/wallet_provider.dart';
import '../theme/app_theme.dart';

class ElectricityScreen extends StatefulWidget {
  const ElectricityScreen({Key? key}) : super(key: key);

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

  @override
  void dispose() {
    _meterController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

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

    final wallet = Provider.of<WalletProvider>(context, listen: false);
    final response = await wallet.purchaseService(
      serviceType: 'electricity',
      payload: {
        'disco': _selectedDisco,
        'meterNumber': _meterController.text.trim(),
        'meterType': _selectedMeterType,
        'amount': amount,
      },
    );

    if (mounted) {
      if (response != null) {
        _meterController.clear();
        _amountController.clear();

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
              style: const TextStyle(color: AppColors.silverLight),
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
                    const Text(
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
                    const Text(
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
                          style: const TextStyle(color: AppColors.silverLight),
                          onChanged: (String? val) {
                            if (val != null) {
                              setState(() {
                                _selectedDisco = val;
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
                    const Text(
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
                              });
                            },
                            child: Container(
                              margin: const EdgeInsets.only(right: 10),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: isSel ? AppColors.primaryBlue : AppColors.darkBgSecondary,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: isSel ? AppColors.primaryBlue : AppColors.silverMuted.withOpacity(0.1),
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
                      decoration: const InputDecoration(
                        labelText: 'Meter Number',
                        prefixIcon: Icon(Icons.speed, color: AppColors.silverMuted),
                        hintText: 'Enter 11 or 13-digit meter number',
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

                    // Amount input
                    TextFormField(
                      controller: _amountController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
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
