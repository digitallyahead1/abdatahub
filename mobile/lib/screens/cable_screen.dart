import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/wallet_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/pin_input_dialog.dart';

class CableScreen extends StatefulWidget {
  const CableScreen({super.key});

  @override
  State<CableScreen> createState() => _CableScreenState();
}

class _CableScreenState extends State<CableScreen> {
  final _formKey = GlobalKey<FormState>();
  final _smartCardController = TextEditingController();
  
  String _selectedProvider = 'DSTV';
  Map<String, dynamic>? _selectedPackage;

  final List<String> _providers = ['DSTV', 'GOTV', 'Startimes'];

  // Mock standard packages
  final List<Map<String, dynamic>> _packages = [
    {'id': 'dstv-yanga', 'provider': 'DSTV', 'name': 'DSTV Yanga Bouquet', 'price': 4200.0},
    {'id': 'dstv-confam', 'provider': 'DSTV', 'name': 'DSTV Confam Bouquet', 'price': 7400.0},
    {'id': 'dstv-compact', 'provider': 'DSTV', 'name': 'DSTV Compact Bouquet', 'price': 10500.0},
    
    {'id': 'gotv-lite', 'provider': 'GOTV', 'name': 'GOTV Lite Bouquet', 'price': 1300.0},
    {'id': 'gotv-value', 'provider': 'GOTV', 'name': 'GOTV Value Bouquet', 'price': 2400.0},
    {'id': 'gotv-max', 'provider': 'GOTV', 'name': 'GOTV Max Bouquet', 'price': 4800.0},
    
    {'id': 'star-basic', 'provider': 'Startimes', 'name': 'Startimes Basic', 'price': 2600.0},
    {'id': 'star-classic', 'provider': 'Startimes', 'name': 'Startimes Classic', 'price': 3800.0},
    {'id': 'star-super', 'provider': 'Startimes', 'name': 'Startimes Super', 'price': 6500.0},
  ];

  @override
  void dispose() {
    _smartCardController.dispose();
    super.dispose();
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedPackage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a bouquet package'),
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
      serviceType: 'cable',
      payload: {
        'provider': _selectedProvider,
        'smartCardNumber': _smartCardController.text.trim(),
        'packageName': _selectedPackage!['name'],
        'amount': _selectedPackage!['price'],
        'pin': pin,
      },
    );

    if (mounted) {
      if (response != null) {
        _smartCardController.clear();
        setState(() {
          _selectedPackage = null;
        });

        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppColors.darkBgSecondary,
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: AppColors.success),
                SizedBox(width: 8),
                Text('Renewal Success', style: TextStyle(color: Colors.white)),
              ],
            ),
            content: Text(
              'Your Cable TV subscription renewed successfully!\n\nReference: ${response['reference']}\nProvider: ${response['provider']}\nSmartCard/IUC: ${response['smartCardNumber']}\nBouquet: ${response['packageName']}',
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
            content: Text(wallet.errorMessage ?? 'Renewal failed'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final wallet = Provider.of<WalletProvider>(context);
    final activePackages = _packages.where((p) => p['provider'] == _selectedProvider).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Renew Cable TV'),
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
                    // Provider select row
                    Text(
                      'Select Cable Service Provider',
                      style: TextStyle(
                        color: AppColors.silverLight,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: _providers.map((p) {
                        final isSel = _selectedProvider == p;
                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedProvider = p;
                              _selectedPackage = null; // Reset plan
                            });
                          },
                          child: Container(
                            width: MediaQuery.of(context).size.width * 0.26,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: isSel ? AppColors.primaryBlue : AppColors.darkBgSecondary,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSel ? AppColors.primaryBlue : AppColors.silverMuted.withValues(alpha: 0.1),
                              ),
                            ),
                            child: Text(
                              p,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: isSel ? Colors.white : AppColors.silverMuted,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),

                    // SmartCard Number input
                    TextFormField(
                      controller: _smartCardController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'SmartCard / IUC / Decoder Number',
                        prefixIcon: Icon(Icons.credit_card, color: AppColors.silverMuted),
                        hintText: 'Enter decoder identification code',
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter decoder number';
                        }
                        if (value.trim().length < 8) {
                          return 'Please enter a valid decoder number';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),

                    // Package selection dropdown
                    Text(
                      'Select Bouquet Package',
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
                        child: DropdownButton<Map<String, dynamic>>(
                          isExpanded: true,
                          value: _selectedPackage,
                          hint: Text(
                            'Choose bouquet package',
                            style: TextStyle(color: AppColors.silverMuted, fontSize: 14),
                          ),
                          dropdownColor: AppColors.darkBgSecondary,
                          style: TextStyle(color: AppColors.silverLight),
                          onChanged: (Map<String, dynamic>? pkg) {
                            setState(() {
                              _selectedPackage = pkg;
                            });
                          },
                          items: activePackages.map((pkg) {
                            return DropdownMenuItem<Map<String, dynamic>>(
                              value: pkg,
                              child: Text(
                                '${pkg['name']} - ₦${pkg['price'].toStringAsFixed(0)}',
                                style: const TextStyle(fontSize: 14),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                    const SizedBox(height: 40),

                    // Pricing review details
                    if (_selectedPackage != null) ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.primaryBlue.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.2)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Bouquet Cost:',
                              style: TextStyle(color: AppColors.silverLight, fontWeight: FontWeight.bold),
                            ),
                            Text(
                              '₦${_selectedPackage!['price'].toStringAsFixed(2)}',
                              style: const TextStyle(
                                color: AppColors.accentGlow,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],

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
                                'Activate Bouquet',
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
