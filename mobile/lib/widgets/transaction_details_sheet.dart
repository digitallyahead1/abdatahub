import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';

class TransactionDetailsSheet extends StatelessWidget {
  final Map<String, dynamic> tx;

  const TransactionDetailsSheet({super.key, required this.tx});

  static void show(BuildContext context, Map<String, dynamic> tx) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkBgSecondary,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      isScrollControlled: true,
      builder: (_) => TransactionDetailsSheet(tx: tx),
    );
  }

  void _copyToClipboard(BuildContext context, String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard!'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final metadata = tx['metadata'] as Map<String, dynamic>? ?? {};
    final status = (tx['status'] ?? 'pending').toString().toLowerCase();
    final service = (tx['service'] ?? '').toString().toLowerCase();
    final desc = tx['description'] ?? 'Transaction';
    final ref = tx['reference'] ?? 'REF';
    final isCredit = tx['type'] == 'credit';
    final amount = (tx['amount'] as num).toDouble();
    final dateStr = tx['createdAt'] != null
        ? tx['createdAt'].toString().replaceAll('T', ' ').substring(0, 19)
        : '';
    final previousBalance = tx['previousBalance'] != null
        ? (tx['previousBalance'] as num).toDouble()
        : 0.0;
    final newBalance = tx['newBalance'] != null
        ? (tx['newBalance'] as num).toDouble()
        : 0.0;

    // Extract service-specific details
    String? token;
    String? customerName;
    String? units;
    String? address;
    String? phone;
    String? network;
    String? smartCard;
    String? bouquet;
    String? examPin;

    final isElectricity = service == 'electricity' || service == 'utility' || desc.toLowerCase().contains('electricity');
    final isDataOrAirtime = service == 'data' || service == 'airtime' || desc.toLowerCase().contains('data') || desc.toLowerCase().contains('airtime');
    final isCable = service == 'cable' || desc.toLowerCase().contains('cable') || desc.toLowerCase().contains('dstv') || desc.toLowerCase().contains('gotv') || desc.toLowerCase().contains('startimes');
    final isExam = service == 'exam' || desc.toLowerCase().contains('exam') || desc.toLowerCase().contains('pin');

    if (isElectricity) {
      token = metadata['tokenKey'] ?? metadata['token'] ?? metadata['token_key'];
      customerName = metadata['customerName'] ?? metadata['customer_name'];
      units = metadata['unitsPurchased'] ?? metadata['units'] ?? metadata['units_purchased'];
      address = metadata['customerAddress'] ?? metadata['address'] ?? metadata['customerAddress'];
    } else if (isDataOrAirtime) {
      phone = metadata['phoneNumber'] ?? metadata['phone'] ?? metadata['recipient'];
      network = metadata['network'] ?? metadata['provider'] ?? metadata['operator'];
    } else if (isCable) {
      smartCard = metadata['smartCardNumber'] ?? metadata['cardNumber'] ?? metadata['smartcard_number'];
      bouquet = metadata['bouquet'] ?? metadata['packageName'] ?? metadata['package'];
      customerName = metadata['customerName'] ?? metadata['customer_name'];
    } else if (isExam) {
      examPin = metadata['pin'] ?? metadata['serial'] ?? metadata['pinCode'];
    }

    Color statusColor;
    IconData statusIcon;

    if (status == 'success') {
      statusColor = AppColors.success;
      statusIcon = Icons.check_circle_rounded;
    } else if (status == 'failed') {
      statusColor = AppColors.error;
      statusIcon = Icons.cancel_rounded;
    } else {
      statusColor = AppColors.warning;
      statusIcon = Icons.timelapse_rounded;
    }

    return Padding(
      padding: EdgeInsets.only(
        left: 20.0,
        right: 20.0,
        top: 14.0,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24.0,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle indicator
          Container(
            width: 40,
            height: 5,
            decoration: BoxDecoration(
              color: AppColors.silverMuted.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 24),

          // Circle Status Icon
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(statusIcon, color: statusColor, size: 38),
          ),
          const SizedBox(height: 16),

          // Amount display
          Text(
            '${isCredit ? "+" : "-"}₦${amount.toStringAsFixed(2)}',
            style: TextStyle(
              color: isCredit ? AppColors.success : AppColors.error,
              fontSize: 28,
              fontWeight: FontWeight.bold,
              fontFamily: 'Poppins',
            ),
          ),
          const SizedBox(height: 6),

          // Description label
          Text(
            desc,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.silverLight,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 24),
          const Divider(height: 1, color: Color(0xFF1F2937)),
          const SizedBox(height: 16),

          // Details List
          _buildRowDetail('Reference', ref, context, isCopyable: true),
          _buildRowDetail('Date & Time', dateStr, context),
          _buildRowDetail(
            'Status',
            status.toUpperCase(),
            context,
            customValWidget: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: statusColor.withValues(alpha: 0.3)),
              ),
              child: Text(
                status.toUpperCase(),
                style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          _buildRowDetail('Type', isCredit ? 'CREDIT' : 'DEBIT', context),
          _buildRowDetail('Previous Balance', '₦${previousBalance.toStringAsFixed(2)}', context),
          _buildRowDetail('New Balance', '₦${newBalance.toStringAsFixed(2)}', context),

          // Service-Specific metadata rows
          if (isElectricity) ...[
            if (token != null && token.isNotEmpty)
              _buildRowDetail('Prepaid Token', token, context, isCopyable: true, isHighlighted: true),
            if (customerName != null && customerName.isNotEmpty)
              _buildRowDetail('Customer Name', customerName, context),
            if (units != null && units.toString().isNotEmpty)
              _buildRowDetail('Units Purchased', '$units units', context),
            if (address != null && address.isNotEmpty)
              _buildRowDetail('Meter Address', address, context),
          ],
          if (isDataOrAirtime) ...[
            if (phone != null && phone.isNotEmpty)
              _buildRowDetail('Recipient Number', phone, context),
            if (network != null && network.isNotEmpty)
              _buildRowDetail('Network Operator', network, context),
          ],
          if (isCable) ...[
            if (smartCard != null && smartCard.isNotEmpty)
              _buildRowDetail('Decoder Number', smartCard, context),
            if (bouquet != null && bouquet.isNotEmpty)
              _buildRowDetail('Bouquet/Package', bouquet, context),
            if (customerName != null && customerName.isNotEmpty)
              _buildRowDetail('Customer Name', customerName, context),
          ],
          if (isExam) ...[
            if (examPin != null && examPin.isNotEmpty)
              _buildRowDetail('Exam Token PIN', examPin, context, isCopyable: true, isHighlighted: true),
          ],

          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.darkBg,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: AppColors.silverMuted.withValues(alpha: 0.1)),
                ),
              ),
              child: Text(
                'Close Receipt',
                style: TextStyle(
                  color: AppColors.silverLight,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRowDetail(String label, String value, BuildContext context,
      {bool isCopyable = false, bool isHighlighted = false, Widget? customValWidget}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(color: AppColors.silverMuted.withValues(alpha: 0.7), fontSize: 13),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Align(
              alignment: Alignment.centerRight,
              child: customValWidget ??
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Flexible(
                        child: Text(
                          value,
                          textAlign: TextAlign.right,
                          style: TextStyle(
                            color: isHighlighted ? AppColors.accentGlow : AppColors.silverLight,
                            fontWeight: isHighlighted || isCopyable ? FontWeight.bold : FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      if (isCopyable) ...[
                        const SizedBox(width: 6),
                        GestureDetector(
                          onTap: () => _copyToClipboard(context, value, label),
                          child: const Icon(Icons.copy_rounded, color: AppColors.accentGlow, size: 14),
                        ),
                      ],
                    ],
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
