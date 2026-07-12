import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/wallet_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/pin_input_dialog.dart';

class BuyAirtimeScreen extends StatefulWidget {
  const BuyAirtimeScreen({super.key});

  @override
  State<BuyAirtimeScreen> createState() => _BuyAirtimeScreenState();
}

class _BuyAirtimeScreenState extends State<BuyAirtimeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _amountController = TextEditingController();
  
  String _selectedNetwork = 'MTN';
  final List<String> _networks = ['MTN', 'Airtel', 'Glo', '9mobile'];
  List<dynamic> _airtimePricing = [];
  bool _isLoadingRates = true;

  @override
  void initState() {
    super.initState();
    _amountController.addListener(_onAmountChanged);
    _fetchRates();
  }

  void _onAmountChanged() {
    setState(() {}); // Re-build widget to update calculation
  }

  Future<void> _fetchRates() async {
    setState(() {
      _isLoadingRates = true;
    });
    try {
      final wallet = Provider.of<WalletProvider>(context, listen: false);
      final rates = await wallet.fetchAirtimePricing();
      setState(() {
        _airtimePricing = rates;
      });
    } catch (e) {
      debugPrint('Error fetching airtime pricing: $e');
    } finally {
      setState(() {
        _isLoadingRates = false;
      });
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _amountController.removeListener(_onAmountChanged);
    _amountController.dispose();
    super.dispose();
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final amount = double.tryParse(_amountController.text) ?? 0.0;
    if (amount < 10 || amount > 50000) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Airtime amount must be between ₦10 and ₦50,000'),
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
      serviceType: 'airtime',
      payload: {
        'phoneNumber': _phoneController.text.trim(),
        'network': _selectedNetwork.toLowerCase(),
        'amount': amount,
        'pin': pin,
      },
    );

    if (mounted) {
      if (response != null) {
        _phoneController.clear();
        _amountController.clear();

        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppColors.darkBgSecondary,
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: AppColors.success),
                SizedBox(width: 8),
                Text('Recharge Success', style: TextStyle(color: Colors.white)),
              ],
            ),
            content: Text(
              'Your Airtime recharge has been sent successfully!\n\nReference: ${response['reference']}\nRecipient: ${response['phoneNumber']}\nNetwork: ${response['network']}\nAmount: ₦${amount.toStringAsFixed(2)}',
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
            content: Text(wallet.errorMessage ?? 'Purchase failed'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final wallet = Provider.of<WalletProvider>(context);

    final match = _airtimePricing.where(
      (p) => p['network']?.toString().toLowerCase() == _selectedNetwork.toLowerCase()
    );
    final pricing = match.isNotEmpty ? match.first : null;
    final sellingRate = pricing != null
        ? (double.tryParse(pricing['sellingRate'].toString()) ?? 1.0)
        : 1.0;
    final enteredAmount = double.tryParse(_amountController.text) ?? 0.0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Airtime Recharge'),
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
                    // Network select row
                    Text(
                      'Select Mobile Network',
                      style: TextStyle(
                        color: AppColors.silverLight,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: _networks.map((net) {
                        final isSel = _selectedNetwork == net;
                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedNetwork = net;
                            });
                          },
                          child: Container(
                            width: MediaQuery.of(context).size.width * 0.2,
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            decoration: BoxDecoration(
                              color: isSel ? AppColors.primaryBlue : AppColors.darkBgSecondary,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSel ? AppColors.primaryBlue : AppColors.silverMuted.withValues(alpha: 0.1),
                              ),
                            ),
                            child: Text(
                              net,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: isSel ? Colors.white : AppColors.silverMuted,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),

                    // Phone input
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        labelText: 'Recipient Phone Number',
                        prefixIcon: Icon(Icons.phone, color: AppColors.silverMuted),
                        hintText: 'e.g. 08031234567',
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter phone number';
                        }
                        if (value.trim().length < 11) {
                          return 'Please enter a valid 11-digit phone number';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),

                    // Amount input
                    TextFormField(
                      controller: _amountController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Recharge Amount (₦)',
                        prefixIcon: Icon(Icons.monetization_on_outlined, color: AppColors.silverMuted),
                        hintText: 'Minimum ₦10',
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter recharge amount';
                        }
                        final valNum = double.tryParse(value);
                        if (valNum == null || valNum < 10) {
                          return 'Minimum airtime amount is ₦10';
                        }
                        return null;
                      },
                    ),
                    
                    // Pricing breakdown display
                    if (enteredAmount > 0) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.primaryBlue.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.2)),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Selling Rate:',
                                  style: TextStyle(color: AppColors.silverMuted, fontSize: 13),
                                ),
                                Text(
                                  '${(sellingRate * 100).toStringAsFixed(1)}%',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                            const Divider(height: 16, color: Colors.white10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'You Pay:',
                                  style: TextStyle(color: AppColors.silverLight, fontWeight: FontWeight.bold),
                                ),
                                Text(
                                  '₦${(enteredAmount * sellingRate).toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    color: AppColors.accentGlow,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
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
                                'Recharge Airtime',
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
