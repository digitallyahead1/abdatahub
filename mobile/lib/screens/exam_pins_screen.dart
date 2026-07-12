import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/wallet_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/pin_input_dialog.dart';

class ExamPinsScreen extends StatefulWidget {
  const ExamPinsScreen({super.key});

  @override
  State<ExamPinsScreen> createState() => _ExamPinsScreenState();
}

class _ExamPinsScreenState extends State<ExamPinsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _quantityController = TextEditingController(text: '1');
  
  String _selectedExamType = 'WAEC';
  final List<String> _examTypes = ['WAEC', 'NECO', 'JAMB', 'NABTEB'];

  // Pricing map
  final Map<String, double> _pinPrices = {
    'WAEC': 2500.0,
    'NECO': 2000.0,
    'JAMB': 4500.0,
    'NABTEB': 2200.0,
  };

  @override
  void dispose() {
    _quantityController.dispose();
    super.dispose();
  }

  double get _totalPrice {
    final qty = int.tryParse(_quantityController.text) ?? 1;
    final unitPrice = _pinPrices[_selectedExamType] ?? 0.0;
    return unitPrice * qty;
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final qty = int.tryParse(_quantityController.text) ?? 1;
    if (qty < 1 || qty > 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Quantity must be between 1 and 10 pins per purchase'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final totalCost = _totalPrice;

    final pin = await showDialog<String>(
      context: context,
      builder: (_) => const PinInputDialog(),
    );
    if (pin == null || pin.length != 4) return;

    final wallet = Provider.of<WalletProvider>(context, listen: false);
    
    final response = await wallet.purchaseService(
      serviceType: 'exam-pin',
      payload: {
        'examType': _selectedExamType,
        'quantity': qty,
        'amount': totalCost,
        'pin': pin,
      },
    );

    if (mounted) {
      if (response != null) {
        _quantityController.text = '1';
        final List<dynamic> pins = response['pins'] ?? [];

        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppColors.darkBgSecondary,
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: AppColors.success),
                SizedBox(width: 8),
                Text('Purchase Success', style: TextStyle(color: Colors.white)),
              ],
            ),
            content: SizedBox(
              width: double.maxFinite,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Reference: ${response['reference']}\nExam: ${response['examType']}\nQuantity: ${response['quantity']}\n\nGenerated Pin Codes:',
                    style: TextStyle(color: AppColors.silverLight),
                  ),
                  const SizedBox(height: 12),
                  ...pins.map((p) => Container(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        padding: const EdgeInsets.all(10),
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: AppColors.darkBg,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.3)),
                        ),
                        child: Text(
                          p.toString(),
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: AppColors.accentGlow,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.1,
                          ),
                        ),
                      )),
                ],
              ),
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

    return Scaffold(
      appBar: AppBar(
        title: const Text('Buy Exam Pin'),
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
                    // Exam Type selection
                    Text(
                      'Select Exam Body Type',
                      style: TextStyle(
                        color: AppColors.silverLight,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: _examTypes.map((type) {
                        final isSel = _selectedExamType == type;
                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedExamType = type;
                            });
                          },
                          child: Container(
                            width: MediaQuery.of(context).size.width * 0.2,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: isSel ? AppColors.primaryBlue : AppColors.darkBgSecondary,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: isSel ? AppColors.primaryBlue : AppColors.silverMuted.withValues(alpha: 0.1),
                              ),
                            ),
                            child: Text(
                              type,
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

                    // Unit Price indicator
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: AppColors.darkBgSecondary,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Unit Price:',
                            style: TextStyle(color: AppColors.silverMuted, fontSize: 13),
                          ),
                          Text(
                            '₦${(_pinPrices[_selectedExamType] ?? 0.0).toStringAsFixed(2)}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Quantity input
                    TextFormField(
                      controller: _quantityController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Quantity of Pins',
                        prefixIcon: Icon(Icons.pin_outlined, color: AppColors.silverMuted),
                        hintText: 'Enter quantity (1 - 10)',
                      ),
                      onChanged: (val) {
                        setState(() {}); // Recalculate price
                      },
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter quantity';
                        }
                        final q = int.tryParse(value);
                        if (q == null || q < 1 || q > 10) {
                          return 'Quantity must be between 1 and 10';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 40),

                    // Pricing review details
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
                            'Total Pin Cost:',
                            style: TextStyle(color: AppColors.silverLight, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            '₦${_totalPrice.toStringAsFixed(2)}',
                            style: const TextStyle(
                              color: AppColors.accentGlow,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 30),

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
                                'Generate Pin(s)',
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
