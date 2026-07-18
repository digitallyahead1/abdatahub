import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../providers/wallet_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/pin_input_dialog.dart';

class BuyDataScreen extends StatefulWidget {
  const BuyDataScreen({super.key});

  @override
  State<BuyDataScreen> createState() => _BuyDataScreenState();
}

class _BuyDataScreenState extends State<BuyDataScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  
  String _selectedNetwork = 'MTN';
  Map<String, dynamic>? _selectedPlan;
  bool _isLoadingPlans = true;
  String _selectedType = 'All';

  final List<String> _networks = ['MTN', 'Airtel', 'Glo', '9mobile'];
  List<dynamic> _dataPlans = [];

  @override
  void initState() {
    super.initState();
    _fetchPlans();
  }

  Future<void> _fetchPlans() async {
    setState(() {
      _isLoadingPlans = true;
    });
    try {
      final wallet = Provider.of<WalletProvider>(context, listen: false);
      final plans = await wallet.fetchDataPlans();
      setState(() {
        _dataPlans = plans;
      });
    } catch (e) {
      debugPrint('Error fetching data plans: $e');
    } finally {
      setState(() {
        _isLoadingPlans = false;
      });
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Map<String, String> _parsePlanName(String name) {
    name = name.trim();
    
    // Extract size
    final sizeRegExp = RegExp(r'(\d+(?:\.\d+)?)\s*(GB|MB|TB)', caseSensitive: false);
    final sizeMatch = sizeRegExp.firstMatch(name);
    String size = '';
    if (sizeMatch != null) {
      final numVal = double.tryParse(sizeMatch.group(1) ?? '') ?? 0.0;
      final numStr = numVal % 1 == 0 ? numVal.toInt().toString() : numVal.toString();
      final unit = (sizeMatch.group(2) ?? '').toUpperCase();
      size = '$numStr$unit';
    } else {
      size = name.split('-')[0].trim();
    }

    // Extract type
    String type = 'Data';
    final upperName = name.toUpperCase();
    if (upperName.contains('SME')) {
      type = 'SME';
    } else if (upperName.contains('CORPORATE GIFTING') || upperName.contains('CORP GIFTING') || upperName.contains(' CG')) {
      type = 'CG';
    } else if (upperName.contains('GIFTING')) {
      type = 'Gifting';
    } else if (upperName.contains('DIRECT') || upperName.contains('DG')) {
      type = 'Direct';
    } else {
      final typeRegExp = RegExp(r'\b([A-Z]{2,4})\b');
      final typeMatch = typeRegExp.firstMatch(name);
      if (typeMatch != null) {
        type = typeMatch.group(1) ?? 'Data';
      }
    }

    // Extract validity
    final validityRegExp = RegExp(r'(\d+)\s*(day|month|week|hr|hour)s?', caseSensitive: false);
    final validityMatch = validityRegExp.firstMatch(name);
    String validity = '30 Days';
    if (validityMatch != null) {
      final num = int.tryParse(validityMatch.group(1) ?? '') ?? 30;
      final unit = validityMatch.group(2) ?? 'Day';
      final capitalizedUnit = unit[0].toUpperCase() + unit.substring(1).toLowerCase();
      validity = '$num $capitalizedUnit${num > 1 ? 's' : ''}';
    } else {
      final lowerName = name.toLowerCase();
      if (lowerName.contains('monthly')) {
        validity = '30 Days';
      } else if (lowerName.contains('weekly')) {
        validity = '7 Days';
      } else if (lowerName.contains('daily')) {
        validity = '1 Day';
      }
    }

    return {'size': size, 'type': type, 'validity': validity};
  }

  Color _getTypeColor(String type) {
    switch (type.toUpperCase()) {
      case 'SME':
        return Colors.amber;
      case 'CG':
      case 'CORPORATE':
        return Colors.purpleAccent;
      case 'GIFTING':
        return Colors.greenAccent;
      case 'DIRECT':
      case 'DG':
        return Colors.blueAccent;
      default:
        return Colors.grey;
    }
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedPlan == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a data plan'),
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
      serviceType: 'data',
      payload: {
        'phoneNumber': _phoneController.text.trim(),
        'network': _selectedNetwork.toLowerCase(),
        'planId': _selectedPlan!['id'],
        'pin': pin,
      },
    );

    if (mounted) {
      if (response != null) {
        _phoneController.clear();
        setState(() {
          _selectedPlan = null;
        });

        _showReceiptDialog(response);
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

  void _showReceiptDialog(Map<String, dynamic> data) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 20),
        child: Container(
          decoration: BoxDecoration(
            color: AppColors.darkBgSecondary,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Success icon
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.15),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.green.withOpacity(0.3)),
                ),
                child: const Icon(Icons.check_rounded, color: Colors.greenAccent, size: 32),
              ),
              const SizedBox(height: 12),
              const Text(
                'Purchase Successful!',
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const Text(
                'Your data has been sent',
                style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13),
              ),
              const SizedBox(height: 20),

              // Receipt rows
              Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withOpacity(0.05)),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Column(
                  children: [
                    _receiptRow('Phone Number', data['phoneNumber']?.toString() ?? ''),
                    _receiptRow('Network', (data['network'] ?? '').toString().toUpperCase()),
                    _receiptRow('Plan', data['planName']?.toString() ?? ''),
                    _receiptRow('Amount Paid', '₦${_formatAmount(data['amount'])}'),
                    _receiptRow('Reference', data['reference']?.toString() ?? '', mono: true),
                    _receiptRow('Status', '✅ Successful'),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        await _shareReceiptPdf(data);
                      },
                      icon: const Icon(Icons.share_outlined, size: 16, color: Colors.white),
                      label: const Text('Share PDF', style: TextStyle(color: Colors.white)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: BorderSide(color: Colors.white.withOpacity(0.15)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryBlue,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Done', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _shareReceiptPdf(Map<String, dynamic> data) async {
    try {
      final pdf = pw.Document();

      pdf.addPage(
        pw.Page(
          pageFormat: PdfPageFormat(80 * PdfPageFormat.mm, 150 * PdfPageFormat.mm, marginAll: 5 * PdfPageFormat.mm),
          build: (pw.Context context) {
            return pw.Container(
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.grey300, width: 1),
                borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
              ),
              padding: const pw.EdgeInsets.all(10),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Center(
                    child: pw.Text('AB DATA HUB', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold, color: PdfColors.blue800)),
                  ),
                  pw.Center(
                    child: pw.Text('TRANSACTION RECEIPT', style: pw.TextStyle(fontSize: 8, color: PdfColors.grey600)),
                  ),
                  pw.SizedBox(height: 8),
                  pw.Divider(thickness: 1, borderStyle: pw.BorderStyle.dashed),
                  pw.SizedBox(height: 8),
                  _pdfRow('Phone Number', data['phoneNumber']?.toString() ?? ''),
                  _pdfRow('Network', (data['network'] ?? '').toString().toUpperCase()),
                  _pdfRow('Plan', data['planName']?.toString() ?? ''),
                  _pdfRow('Amount Paid', 'N${_formatAmount(data['amount'])}'),
                  _pdfRow('Reference', data['reference']?.toString() ?? ''),
                  _pdfRow('Status', 'Successful'),
                  pw.SizedBox(height: 12),
                  pw.Divider(thickness: 1, borderStyle: pw.BorderStyle.dashed),
                  pw.SizedBox(height: 8),
                  pw.Center(
                    child: pw.Text('Thank you for choosing AB Data Hub!', style: pw.TextStyle(fontSize: 8, color: PdfColors.grey600, fontStyle: pw.FontStyle.italic)),
                  ),
                ],
              ),
            );
          },
        ),
      );

      final output = await getTemporaryDirectory();
      final file = File('${output.path}/receipt_${data['reference']}.pdf');
      await file.writeAsBytes(await pdf.save());

      final xFile = XFile(file.path);
      await Share.shareXFiles([xFile], text: 'AB Data Hub Transaction Receipt');
    } catch (e) {
      debugPrint('Error generating/sharing PDF: $e');
      // Fallback to text copy
      final receiptText =
          'AB Data Hub Receipt\n-------------------'
          '\nPhone: ${data['phoneNumber'] ?? ''}'
          '\nNetwork: ${(data['network'] ?? '').toString().toUpperCase()}'
          '\nPlan: ${data['planName'] ?? ''}'
          '\nAmount: ₦${_formatAmount(data['amount'])}'
          '\nReference: ${data['reference'] ?? ''}'
          '\nStatus: Successful';
      await _copyToClipboard(receiptText, context);
    }
  }

  pw.Widget _pdfRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 3),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey700)),
          pw.Text(value, style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold)),
        ],
      ),
    );
  }

  String _formatAmount(dynamic amount) {
    if (amount == null) return '0';
    final num = double.tryParse(amount.toString()) ?? 0;
    return num.toStringAsFixed(num.truncateToDouble() == num ? 0 : 2)
        .replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
  }

  Future<void> _copyToClipboard(String text, BuildContext ctx) async {
    // Copy to clipboard since Share plugin may not be installed
    final clipboard = await _tryShare(text);
    if (!clipboard && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Receipt copied to clipboard'), backgroundColor: Colors.green),
      );
    }
  }

  Future<bool> _tryShare(String text) async {
    try {
      // Use Clipboard as fallback; if share_plus is added it can be used here
      final data = ClipboardData(text: text);
      await Clipboard.setData(data);
      return false; // returns false to show "copied" snackbar
    } catch (_) {
      return false;
    }
  }

  Widget _receiptRow(String label, String value, {bool mono = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13)),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                color: Colors.white,
                fontSize: mono ? 11 : 13,
                fontWeight: FontWeight.w600,
                fontFamily: mono ? 'monospace' : null,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final wallet = Provider.of<WalletProvider>(context);
    final activePlans = _dataPlans
        .where((p) => p['network']?.toString().toLowerCase() == _selectedNetwork.toLowerCase())
        .toList();

    final parsedPlans = activePlans.map((plan) {
      final mapPlan = Map<String, dynamic>.from(plan as Map);
      final parsed = _parsePlanName(mapPlan['bundleName'] ?? '');
      return {
        'plan': mapPlan,
        'parsed': parsed,
      };
    }).toList();

    final uniqueTypes = ['All', ...parsedPlans.map((p) => p['parsed']!['type'] as String).toSet()];

    final filteredPlans = _selectedType == 'All'
        ? parsedPlans
        : parsedPlans.where((p) => p['parsed']!['type'] == _selectedType).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Buy Data Bundle'),
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
                              _selectedPlan = null; // Reset plan
                              _selectedType = 'All'; // Reset type filter
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

                    // Plan selection grid
                    Text(
                      'Select Data Plan',
                      style: TextStyle(
                        color: AppColors.silverLight,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _isLoadingPlans
                        ? const Center(
                            child: Padding(
                              padding: EdgeInsets.symmetric(vertical: 24.0),
                              child: CircularProgressIndicator(color: AppColors.primaryBlue),
                            ),
                          )
                        : filteredPlans.isEmpty
                            ? Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(vertical: 24),
                                decoration: BoxDecoration(
                                  color: AppColors.darkBgSecondary,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: AppColors.silverMuted.withValues(alpha: 0.1),
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    activePlans.isEmpty
                                        ? 'No plans available for this network'
                                        : 'No plans match the selected category',
                                    style: TextStyle(
                                      color: AppColors.silverMuted,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              )
                            : Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Category Filters Pills
                                  if (uniqueTypes.length > 2) ...[
                                    SingleChildScrollView(
                                      scrollDirection: Axis.horizontal,
                                      child: Row(
                                        children: uniqueTypes.map((type) {
                                          final isSel = _selectedType == type;
                                          return GestureDetector(
                                            onTap: () {
                                              setState(() {
                                                _selectedType = type;
                                              });
                                            },
                                            child: Container(
                                              margin: const EdgeInsets.only(right: 8, bottom: 12),
                                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                              decoration: BoxDecoration(
                                                color: isSel ? AppColors.primaryBlue : AppColors.darkBgSecondary,
                                                borderRadius: BorderRadius.circular(20),
                                                border: Border.all(
                                                  color: isSel ? AppColors.primaryBlue : AppColors.silverMuted.withValues(alpha: 0.1),
                                                ),
                                              ),
                                              child: Text(
                                                type.toUpperCase(),
                                                style: TextStyle(
                                                  color: isSel ? Colors.white : AppColors.silverMuted,
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          );
                                        }).toList(),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                  ],
                                  
                                  // Grid view of plans
                                  GridView.builder(
                                    shrinkWrap: true,
                                    physics: const NeverScrollableScrollPhysics(),
                                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: 3,
                                      crossAxisSpacing: 10,
                                      mainAxisSpacing: 10,
                                      childAspectRatio: 0.85,
                                    ),
                                    itemCount: filteredPlans.length,
                                    itemBuilder: (context, idx) {
                                      final item = filteredPlans[idx];
                                      final plan = item['plan'] as Map<String, dynamic>;
                                      final parsed = item['parsed'] as Map<String, String>;
                                      final price = double.tryParse(plan['sellingPrice'].toString()) ?? 0.0;
                                      final isSelected = _selectedPlan != null && _selectedPlan!['id'] == plan['id'];
                                      final typeColor = _getTypeColor(parsed['type'] ?? '');

                                      return GestureDetector(
                                        onTap: () {
                                          setState(() {
                                            _selectedPlan = plan;
                                          });
                                        },
                                        child: Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                            color: isSelected 
                                                ? AppColors.primaryBlue.withValues(alpha: 0.12) 
                                                : AppColors.darkBgSecondary,
                                            borderRadius: BorderRadius.circular(12),
                                            border: Border.all(
                                              color: isSelected 
                                                  ? AppColors.primaryBlue 
                                                  : AppColors.silverMuted.withValues(alpha: 0.1),
                                              width: isSelected ? 2 : 1,
                                            ),
                                            boxShadow: isSelected ? [
                                              BoxShadow(
                                                color: AppColors.primaryBlue.withValues(alpha: 0.25),
                                                blurRadius: 8,
                                                offset: const Offset(0, 2),
                                              )
                                            ] : null,
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.stretch,
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Row(
                                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                children: [
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                                    decoration: BoxDecoration(
                                                      color: typeColor.withValues(alpha: 0.1),
                                                      borderRadius: BorderRadius.circular(4),
                                                      border: Border.all(color: typeColor.withValues(alpha: 0.2)),
                                                    ),
                                                    child: Text(
                                                      parsed['type'] ?? '',
                                                      style: TextStyle(
                                                        color: typeColor,
                                                        fontSize: 8,
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                    ),
                                                  ),
                                                  Flexible(
                                                    child: Text(
                                                      parsed['validity'] ?? '',
                                                      overflow: TextOverflow.ellipsis,
                                                      style: TextStyle(
                                                        color: AppColors.silverMuted.withValues(alpha: 0.5),
                                                        fontSize: 8,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 4),
                                              Center(
                                                child: Text(
                                                  parsed['size'] ?? '',
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Center(
                                                child: Text(
                                                  '₦${price.toStringAsFixed(0)}',
                                                  style: const TextStyle(
                                                    color: AppColors.accentGlow,
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ],
                              ),
                    const SizedBox(height: 40),

                    // Pricing review details
                    if (_selectedPlan != null) ...[
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
                              'Total Cost:',
                              style: TextStyle(color: AppColors.silverLight, fontWeight: FontWeight.bold),
                            ),
                            Text(
                              '₦${(double.tryParse(_selectedPlan!['sellingPrice'].toString()) ?? 0.0).toStringAsFixed(2)}',
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
                                'Purchase Now',
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
