import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';
import '../utils/pdf_helper.dart';

class TransactionDetailsSheet extends StatelessWidget {
  final Map<String, dynamic> tx;

  const TransactionDetailsSheet({super.key, required this.tx});

  /// Shows the receipt as a centered popup dialog over a darkened backdrop
  static void show(BuildContext context, Map<String, dynamic> tx) {
    showDialog(
      context: context,
      barrierDismissible: true,
      barrierColor: Colors.black.withValues(alpha: 0.8),
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
        child: TransactionDetailsSheet(tx: tx),
      ),
    );
  }

  void _copyToClipboard(BuildContext context, String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: Colors.white, size: 16),
            const SizedBox(width: 8),
            Text('$label copied to clipboard!'),
          ],
        ),
        backgroundColor: const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(milliseconds: 1600),
      ),
    );
  }

  /// Shows share options bottom sheet
  void _showShareOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF101422),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (bCtx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 38,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFF2C354E),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                'Share Receipt',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 14),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.image_rounded, color: Color(0xFF10B981), size: 22),
                ),
                title: const Text(
                  'Share as Image',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14),
                ),
                subtitle: const Text(
                  'Ideal for WhatsApp, status & socials',
                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11.5),
                ),
                trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF64748B)),
                onTap: () {
                  Navigator.pop(bCtx);
                  PdfHelper.shareTransactionReceiptAsImage(context, tx);
                },
              ),
              const Divider(color: Color(0xFF1E2638), height: 16),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB).withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.picture_as_pdf_rounded, color: Color(0xFF38BDF8), size: 22),
                ),
                title: const Text(
                  'Share as PDF Document',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14),
                ),
                subtitle: const Text(
                  'Download official transaction PDF',
                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11.5),
                ),
                trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF64748B)),
                onTap: () {
                  Navigator.pop(bCtx);
                  PdfHelper.shareTransactionReceipt(context, tx);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final metadata = tx['metadata'] as Map<String, dynamic>? ?? {};
    final rawStatus = tx['status']?.toString().toLowerCase();
    String status;
    if (rawStatus == null ||
        rawStatus.isEmpty ||
        rawStatus == 'success' ||
        rawStatus == 'successful' ||
        rawStatus == 'completed' ||
        rawStatus == 'approved') {
      status = 'success';
    } else if (rawStatus == 'failed' || rawStatus == 'cancelled' || rawStatus == 'declined') {
      status = 'failed';
    } else {
      status = rawStatus;
    }

    final service = (tx['service'] ?? '').toString().toLowerCase();
    final desc = tx['description'] ?? 'Transaction';
    final ref = tx['reference'] ?? 'REF';
    final isCredit = tx['type'] == 'credit';
    final amount = (tx['amount'] as num?)?.toDouble() ?? 0.0;
    final dateStr = tx['createdAt'] != null
        ? tx['createdAt'].toString().replaceAll('T', ', ').substring(0, 20)
        : '';
    final previousBalance = tx['previousBalance'] != null
        ? (tx['previousBalance'] as num).toDouble()
        : null;
    final newBalance = tx['newBalance'] != null
        ? (tx['newBalance'] as num).toDouble()
        : null;

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
      address = metadata['customerAddress'] ?? metadata['address'];
    } else if (isDataOrAirtime) {
      phone = metadata['phoneNumber'] ?? metadata['phone'] ?? metadata['recipient'] ?? tx['phoneNumber'];
      network = metadata['network'] ?? metadata['provider'] ?? metadata['operator'] ?? tx['network'];
    } else if (isCable) {
      smartCard = metadata['smartCardNumber'] ?? metadata['cardNumber'] ?? metadata['smartcard_number'];
      bouquet = metadata['bouquet'] ?? metadata['packageName'] ?? metadata['package'];
      customerName = metadata['customerName'] ?? metadata['customer_name'];
    } else if (isExam) {
      examPin = metadata['pin'] ?? metadata['serial'] ?? metadata['pinCode'];
    }

    // Extract data plan for data purchases
    String? dataPlan;
    if (service == 'data' || desc.toLowerCase().contains('data')) {
      dataPlan = metadata['planName']?.toString() ??
          metadata['bundleName']?.toString() ??
          metadata['plan']?.toString() ??
          tx['planName']?.toString();
      // Fallback: extract size from description e.g. "MTN 1.0GB SME Data for ..."
      if (dataPlan == null || dataPlan.isEmpty) {
        final sizeMatch = RegExp(r'(\d+(?:\.\d+)?\s*(?:GB|MB|TB)[^,]+)', caseSensitive: false)
            .firstMatch(desc.toString());
        if (sizeMatch != null) {
          dataPlan = sizeMatch.group(1)?.trim();
        }
      }
    }

    // Determine Clean Service Type Name
    String serviceTypeName = 'Service';
    if (service == 'airtime' || desc.toLowerCase().contains('airtime')) {
      serviceTypeName = 'Airtime';
    } else if (service == 'data' || desc.toLowerCase().contains('data')) {
      serviceTypeName = 'Data Bundle';
    } else if (service == 'electricity' || isElectricity) {
      serviceTypeName = 'Electricity';
    } else if (service == 'cable' || isCable) {
      serviceTypeName = 'Cable TV';
    } else if (service == 'exam' || isExam) {
      serviceTypeName = 'Exam PIN';
    } else if (isCredit) {
      serviceTypeName = 'Wallet Deposit';
    } else {
      serviceTypeName = 'Wallet Debit';
    }

    // Determine Provider Name
    String? providerName = network;
    if (providerName == null || providerName.isEmpty) {
      if (desc.toLowerCase().contains('mtn')) providerName = 'MTN';
      else if (desc.toLowerCase().contains('airtel')) providerName = 'Airtel';
      else if (desc.toLowerCase().contains('glo')) providerName = 'Glo';
      else if (desc.toLowerCase().contains('9mobile')) providerName = '9mobile';
    }

    // Header gradient and icon per status
    List<Color> headerGradient;
    IconData statusIcon;
    String statusTitle;

    if (status == 'success') {
      headerGradient = const [Color(0xFF5345E6), Color(0xFF3B82F6)];
      statusIcon = Icons.check_rounded;
      statusTitle = 'Transaction Successful';
    } else if (status == 'failed') {
      headerGradient = const [Color(0xFFDC2626), Color(0xFFEF4444)];
      statusIcon = Icons.close_rounded;
      statusTitle = 'Transaction Failed';
    } else {
      headerGradient = const [Color(0xFFD97706), Color(0xFFF59E0B)];
      statusIcon = Icons.timelapse_rounded;
      statusTitle = 'Transaction Pending';
    }

    return ConstrainedBox(
      constraints: BoxConstraints(
        maxWidth: 400,
        maxHeight: MediaQuery.of(context).size.height * 0.90,
      ),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF101422),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(
            color: const Color(0xFF22293E),
            width: 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.6),
              blurRadius: 30,
              spreadRadius: 4,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ================= TOP CURVED BANNER (Premium Redesign) =================
            Stack(
              children: [
                // Mesh gradient background
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 28),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      stops: const [0.0, 0.45, 1.0],
                      colors: status == 'success'
                          ? const [Color(0xFF1E40AF), Color(0xFF2563EB), Color(0xFF3B82F6)]
                          : (status == 'failed'
                              ? const [Color(0xFF7F1D1D), Color(0xFFDC2626), Color(0xFFEF4444)]
                              : const [Color(0xFF78350F), Color(0xFFD97706), Color(0xFFF59E0B)]),
                    ),
                  ),
                ),
                // Large ambient halo (outermost)
                Positioned(
                  top: -40,
                  left: -40,
                  child: Container(
                    width: 180,
                    height: 180,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withValues(alpha: 0.05),
                    ),
                  ),
                ),
                // Medium ambient halo
                Positioned(
                  bottom: -30,
                  right: -30,
                  child: Container(
                    width: 140,
                    height: 140,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withValues(alpha: 0.06),
                    ),
                  ),
                ),
                // Content
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 28),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Frosted glass close button
                      Positioned(
                        top: 0,
                        right: 0,
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: () => Navigator.pop(context),
                            borderRadius: BorderRadius.circular(20),
                            child: Container(
                              width: 34,
                              height: 34,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.15),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.25),
                                  width: 1,
                                ),
                              ),
                              child: const Icon(
                                Icons.close_rounded,
                                color: Colors.white,
                                size: 17,
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Centered content
                      SizedBox(
                        width: double.infinity,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const SizedBox(height: 4),
                            // Three-ring halo badge
                            Stack(
                              alignment: Alignment.center,
                              children: [
                                // Outermost soft ring
                                Container(
                                  width: 84,
                                  height: 84,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Colors.white.withValues(alpha: 0.09),
                                  ),
                                ),
                                // Middle ring
                                Container(
                                  width: 68,
                                  height: 68,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Colors.white.withValues(alpha: 0.13),
                                  ),
                                ),
                                // Inner white badge
                                Container(
                                  width: 52,
                                  height: 52,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: Colors.white,
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.25),
                                        blurRadius: 16,
                                        offset: const Offset(0, 6),
                                      ),
                                    ],
                                  ),
                                  child: Icon(
                                    statusIcon,
                                    color: status == 'success'
                                        ? const Color(0xFF2563EB)
                                        : (status == 'failed' ? const Color(0xFFDC2626) : const Color(0xFFD97706)),
                                    size: 28,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            // Verified pill badge
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.18),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.30),
                                  width: 0.8,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 6,
                                    height: 6,
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: Color(0xFF4ADE80),
                                    ),
                                  ),
                                  const SizedBox(width: 5),
                                  Text(
                                    status == 'success' ? 'VERIFIED PAYMENT' : (status == 'failed' ? 'PAYMENT FAILED' : 'PENDING'),
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 9,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 1.4,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 10),
                            // Status title
                            Text(
                              statusTitle,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.3,
                              ),
                            ),
                            const SizedBox(height: 5),
                            // Subtitle
                            Text(
                              'RECEIPT FOR TRANSACTION',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.70),
                                fontSize: 9.5,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 2.0,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                // Illuminated bottom divider line
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    height: 1,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.transparent,
                          Colors.white.withValues(alpha: 0.30),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // ================= SCROLLABLE RECEIPT BODY =================
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 16),
                child: Column(
                  children: [
                    // Brand / Verification Pill (matches sample image "CMANverify" -> "ABDATAverify")
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                      decoration: BoxDecoration(
                        color: const Color(0xFF14192A),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: const Color(0xFF232D44),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(3.5),
                            decoration: BoxDecoration(
                              color: const Color(0xFF2563EB),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Icon(
                              Icons.shield_rounded,
                              color: Colors.white,
                              size: 13,
                            ),
                          ),
                          const SizedBox(width: 8),
                          RichText(
                            text: const TextSpan(
                              text: 'ABDATA',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                fontSize: 13,
                                letterSpacing: 0.5,
                              ),
                              children: [
                                TextSpan(
                                  text: 'verify',
                                  style: TextStyle(
                                    color: Color(0xFF38BDF8),
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Amount Paid Box (Large bold green typography matching screenshot)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF131725),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: const Color(0xFF1E2638),
                          width: 1,
                        ),
                      ),
                      child: Column(
                        children: [
                          Text(
                            isCredit ? 'AMOUNT RECEIVED' : 'AMOUNT PAID',
                            style: const TextStyle(
                              color: Color(0xFF8E98AB),
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${isCredit ? "+" : ""}₦${amount.toStringAsFixed(2)}',
                            style: const TextStyle(
                              color: Color(0xFF00E676),
                              fontSize: 32,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Receipt Rows List
                    _buildReceiptRow('SERVICE TYPE', serviceTypeName),
                    if (providerName != null && providerName.isNotEmpty)
                      _buildReceiptRow('NETWORK PROVIDER', providerName.toUpperCase()),
                    if (dataPlan != null && dataPlan.isNotEmpty)
                      _buildReceiptRow('DATA PLAN', dataPlan, isHighlighted: true),
                    if (phone != null && phone.isNotEmpty)
                      _buildReceiptRow(
                        'RECIPIENT PHONE',
                        phone,
                        isCopyable: true,
                        context: context,
                      ),
                    if (token != null && token.isNotEmpty)
                      _buildReceiptRow(
                        'PREPAID TOKEN',
                        token,
                        isCopyable: true,
                        isHighlighted: true,
                        context: context,
                      ),
                    if (customerName != null && customerName.isNotEmpty)
                      _buildReceiptRow('CUSTOMER NAME', customerName),
                    if (smartCard != null && smartCard.isNotEmpty)
                      _buildReceiptRow(
                        'DECODER NUMBER',
                        smartCard,
                        isCopyable: true,
                        context: context,
                      ),
                    if (bouquet != null && bouquet.isNotEmpty)
                      _buildReceiptRow('BOUQUET / PLAN', bouquet),
                    if (examPin != null && examPin.isNotEmpty)
                      _buildReceiptRow(
                        'EXAM PIN',
                        examPin,
                        isCopyable: true,
                        isHighlighted: true,
                        context: context,
                      ),
                    _buildReceiptRow(
                      'REFERENCE',
                      ref,
                      isCopyable: true,
                      context: context,
                    ),
                    _buildReceiptRow(
                      'STATUS',
                      status == 'success' ? 'SUCCESSFUL' : status.toUpperCase(),
                      statusBadge: true,
                      statusColor: status == 'success'
                          ? const Color(0xFF10B981)
                          : (status == 'failed' ? const Color(0xFFEF4444) : const Color(0xFFF59E0B)),
                    ),
                    if (dateStr.isNotEmpty)
                      _buildReceiptRow('DATE & TIME', dateStr),
                    if (previousBalance != null && newBalance != null) ...[
                      _buildReceiptRow('PREVIOUS BALANCE', '₦${previousBalance.toStringAsFixed(2)}'),
                      _buildReceiptRow('NEW BALANCE', '₦${newBalance.toStringAsFixed(2)}'),
                    ],
                  ],
                ),
              ),
            ),

            // ================= BOTTOM ACTION BUTTONS =================
            Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
              decoration: const BoxDecoration(
                color: Color(0xFF0D101C),
                border: Border(
                  top: BorderSide(color: Color(0xFF1A2234), width: 1),
                ),
              ),
              child: Row(
                children: [
                  // 'Done' Button
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF181D2E),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: const BorderSide(color: Color(0xFF263048), width: 1),
                          ),
                        ),
                        child: const Text(
                          'Done',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // 'Share' Button
                  Expanded(
                    child: SizedBox(
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: () => _showShareOptions(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB),
                          foregroundColor: Colors.white,
                          elevation: 2,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        icon: const Icon(Icons.share_rounded, size: 17),
                        label: const Text(
                          'Share',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
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
    );
  }

  /// Builds a single receipt row matching the sample screenshot
  Widget _buildReceiptRow(
    String label,
    String value, {
    bool isCopyable = false,
    bool isHighlighted = false,
    bool statusBadge = false,
    Color? statusColor,
    BuildContext? context,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 9.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Left: Label in muted uppercase
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF8E98AB),
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
            ),
          ),
          const SizedBox(width: 14),

          // Right: Value
          Flexible(
            child: statusBadge
                ? Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3.5),
                    decoration: BoxDecoration(
                      color: (statusColor ?? const Color(0xFF10B981)).withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: (statusColor ?? const Color(0xFF10B981)).withValues(alpha: 0.35),
                        width: 0.8,
                      ),
                    ),
                    child: Text(
                      value,
                      style: TextStyle(
                        color: statusColor ?? const Color(0xFF10B981),
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5,
                      ),
                    ),
                  )
                : Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: (isCopyable && context != null)
                          ? () => _copyToClipboard(context, value, label)
                          : null,
                      borderRadius: BorderRadius.circular(8),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Flexible(
                              child: Text(
                                value,
                                textAlign: TextAlign.right,
                                style: TextStyle(
                                  color: isHighlighted
                                      ? const Color(0xFF38BDF8)
                                      : Colors.white,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -0.1,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (isCopyable) ...[
                              const SizedBox(width: 6),
                              const Icon(
                                Icons.copy_rounded,
                                color: Color(0xFF8E98AB),
                                size: 14,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

