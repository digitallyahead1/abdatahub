import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/wallet_provider.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';

/// Professional Wallet Top-Up Sheet matching user's reference design
/// Displays PalmPay, Moniepoint & other reserved account details with scrollable view,
/// highlighted tap-to-copy account numbers, deposit status banner, and payment verification.
class WalletTopUpSheet extends StatefulWidget {
  const WalletTopUpSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.75),
      builder: (_) => const WalletTopUpSheet(),
    );
  }

  @override
  State<WalletTopUpSheet> createState() => _WalletTopUpSheetState();
}

class _WalletTopUpSheetState extends State<WalletTopUpSheet> {
  bool _isCheckingStatus = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final walletProv = Provider.of<WalletProvider>(context, listen: false);
      walletProv.fetchActiveGafiapayAccount();
      walletProv.fetchMonnifyAccount();
    });
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Text('$label copied to clipboard!'),
          ],
        ),
        backgroundColor: const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Future<void> _checkPaymentStatus() async {
    setState(() => _isCheckingStatus = true);
    final walletProv = Provider.of<WalletProvider>(context, listen: false);
    await walletProv.fetchWalletData();
    await walletProv.fetchActiveGafiapayAccount();
    await walletProv.fetchMonnifyAccount();

    if (!mounted) return;
    setState(() => _isCheckingStatus = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.verified_rounded, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Text('Balance synced: ₦${walletProv.balance.toStringAsFixed(2)}'),
          ],
        ),
        backgroundColor: const Color(0xFF0F56FA),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  void _showPalmPayVerificationDialog() {
    final ninController = TextEditingController();
    String selectedIdType = 'nin';
    String? localError;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF10141E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            final walletProv = Provider.of<WalletProvider>(modalCtx);
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 24,
                bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'PalmPay Verification',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(modalCtx),
                        icon: const Icon(Icons.close_rounded, color: Colors.white70),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'CBN regulations require a valid 11-digit NIN or BVN to issue your dedicated PalmPay virtual account.',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12.5, height: 1.4),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setModalState(() => selectedIdType = 'nin'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 9),
                            decoration: BoxDecoration(
                              color: selectedIdType == 'nin'
                                  ? const Color(0xFF2563EB).withValues(alpha: 0.25)
                                  : const Color(0xFF161B29),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: selectedIdType == 'nin'
                                    ? const Color(0xFF3B82F6)
                                    : const Color(0xFF263045),
                              ),
                            ),
                            alignment: Alignment.center,
                            child: const Text(
                              'NIN (National ID)',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setModalState(() => selectedIdType = 'bvn'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 9),
                            decoration: BoxDecoration(
                              color: selectedIdType == 'bvn'
                                  ? const Color(0xFF2563EB).withValues(alpha: 0.25)
                                  : const Color(0xFF161B29),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: selectedIdType == 'bvn'
                                    ? const Color(0xFF3B82F6)
                                    : const Color(0xFF263045),
                              ),
                            ),
                            alignment: Alignment.center,
                            child: const Text(
                              'BVN',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: ninController,
                    keyboardType: TextInputType.number,
                    maxLength: 11,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                    decoration: InputDecoration(
                      hintText: 'Enter 11-digit ${selectedIdType.toUpperCase()}',
                      hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
                      counterText: '',
                      filled: true,
                      fillColor: const Color(0xFF161B29),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF263045)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF263045)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFF3B82F6)),
                      ),
                    ),
                  ),
                  if (localError != null) ...[
                    const SizedBox(height: 8),
                    Text(localError!, style: const TextStyle(color: Color(0xFFEF4444), fontSize: 12)),
                  ],
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    height: 46,
                    child: ElevatedButton(
                      onPressed: walletProv.isGafiapayLoading
                          ? null
                          : () async {
                              final idVal = ninController.text.trim();
                              if (idVal.length != 11) {
                                setModalState(() => localError = 'Please enter a valid 11-digit ${selectedIdType.toUpperCase()}');
                                return;
                              }
                              final ok = await walletProv.generateGafiapayAccount(
                                nin: selectedIdType == 'nin' ? idVal : null,
                                bvn: selectedIdType == 'bvn' ? idVal : null,
                                idType: selectedIdType,
                              );
                              if (!modalCtx.mounted) return;
                              if (ok) {
                                Navigator.pop(modalCtx);
                              } else {
                                setModalState(() => localError = walletProv.errorMessage ?? 'Verification failed');
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: walletProv.isGafiapayLoading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text('Verify & Generate PalmPay', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5)),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final walletProv = Provider.of<WalletProvider>(context);
    final authProv = Provider.of<AuthProvider>(context);
    final user = authProv.user;
    final userName = (user?['fullName'] ?? 'Customer').toString().toUpperCase();

    final gafiapay = walletProv.gafiapayAccount;
    final monnify = walletProv.monnifyAccount;

    // Collect all accounts for scrollable rendering
    final List<Map<String, String>> accountsList = [];

    // 1. PalmPay Account
    if (gafiapay != null && gafiapay['accountNumber'] != null) {
      accountsList.add({
        'bankTitle': 'PalmPay',
        'bankName': 'Palmpay',
        'accountNumber': gafiapay['accountNumber'].toString(),
        'accountName': (gafiapay['accountName'] ?? userName).toString(),
        'badge': 'PERMANENT',
      });
    }

    // 2. Moniepoint / Monnify Accounts
    if (monnify != null) {
      final monnifyBank = monnify['bankName']?.toString() ?? 'Moniepoint';
      final monnifyNum = monnify['accountNumber']?.toString() ?? '';
      final monnifyName = (monnify['accountName'] ?? userName).toString();

      if (monnifyNum.isNotEmpty) {
        accountsList.add({
          'bankTitle': monnifyBank.contains('Moniepoint') ? 'Moniepoint' : monnifyBank,
          'bankName': monnifyBank,
          'accountNumber': monnifyNum,
          'accountName': monnifyName,
          'badge': 'PERMANENT',
        });
      }

      // If monnify response contains multiple accounts array
      if (monnify['accounts'] is List) {
        for (var acc in monnify['accounts']) {
          final bName = acc['bankName']?.toString() ?? '';
          final aNum = acc['accountNumber']?.toString() ?? '';
          if (aNum.isNotEmpty && aNum != monnifyNum) {
            accountsList.add({
              'bankTitle': bName.contains('Moniepoint') ? 'Moniepoint' : bName,
              'bankName': bName,
              'accountNumber': aNum,
              'accountName': monnifyName,
              'badge': 'PERMANENT',
            });
          }
        }
      }
    }

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 20),
      decoration: BoxDecoration(
        color: const Color(0xFF10141E),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(
          color: const Color(0xFF1E2536),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.6),
            blurRadius: 30,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(26),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Modal Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 16, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: const Color(0xFF2563EB).withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: const Color(0xFF3B82F6).withValues(alpha: 0.35),
                            width: 1,
                          ),
                        ),
                        child: const Icon(
                          Icons.account_balance_wallet_rounded,
                          color: Color(0xFF3B82F6),
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'Wallet Top-Up',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.2,
                        ),
                      ),
                    ],
                  ),
                  Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => Navigator.of(context).pop(),
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.08),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.close_rounded,
                          color: Colors.white70,
                          size: 20,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFF1E2536)),

            // Scrollable Content
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(18, 16, 18, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1. PALMPAY CARD (Active or NIN/BVN Verification Prompt)
                    if (gafiapay != null && gafiapay['accountNumber'] != null)
                      _buildAccountCard({
                        'bankTitle': 'PalmPay',
                        'bankName': 'Palmpay',
                        'accountNumber': gafiapay['accountNumber'].toString(),
                        'accountName': (gafiapay['accountName'] ?? userName).toString(),
                        'badge': 'PERMANENT',
                      })
                    else
                      _buildPalmPayPrompt(),

                    const SizedBox(height: 16),

                    // 2. MONIEPOINT CARD (Active or Generate Button Prompt)
                    if (monnify != null && monnify['accountNumber'] != null && monnify['accountNumber'].toString().isNotEmpty)
                      _buildAccountCard({
                        'bankTitle': 'Moniepoint',
                        'bankName': monnify['bankName']?.toString() ?? 'Moniepoint Microfinance Bank',
                        'accountNumber': monnify['accountNumber'].toString(),
                        'accountName': (monnify['accountName'] ?? userName).toString(),
                        'badge': 'PERMANENT',
                      })
                    else
                      _buildMoniepointPrompt(walletProv),

                    // 3. ANY ADDITIONAL ACCOUNTS (e.g. Wema Bank, Sterling Bank)
                    if (monnify != null && monnify['accounts'] is List) ...[
                      for (var acc in monnify['accounts']) ...[
                        if (acc['accountNumber'] != null && acc['accountNumber'].toString() != monnify['accountNumber']?.toString()) ...[
                          const SizedBox(height: 16),
                          _buildAccountCard({
                            'bankTitle': (acc['bankName'] ?? 'Reserved Bank').toString(),
                            'bankName': (acc['bankName'] ?? 'Bank').toString(),
                            'accountNumber': acc['accountNumber'].toString(),
                            'accountName': (monnify['accountName'] ?? userName).toString(),
                            'badge': 'PERMANENT',
                          }),
                        ],
                      ],
                    ],

                    const SizedBox(height: 18),

                    // Deposit Status Banner (matching user screenshot)
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFF131828),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: const Color(0xFF222B45),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: const Color(0xFF3B82F6).withValues(alpha: 0.16),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.info_outline_rounded,
                              color: Color(0xFF60A5FA),
                              size: 17,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'DEPOSIT STATUS',
                                  style: TextStyle(
                                    color: Color(0xFF60A5FA),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.6,
                                  ),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'All Moniepoint & PalmPay deposits are automatically credited directly to your wallet.',
                                  style: TextStyle(
                                    color: Color(0xFF94A3B8),
                                    fontSize: 11.5,
                                    height: 1.35,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 18),

                    // "⚡ I've Paid — Check Status" button (matching screenshot)
                    SizedBox(
                      width: double.infinity,
                      height: 46,
                      child: OutlinedButton(
                        onPressed: _isCheckingStatus ? null : _checkPaymentStatus,
                        style: OutlinedButton.styleFrom(
                          backgroundColor: const Color(0xFF0C241B),
                          side: const BorderSide(
                            color: Color(0xFF10B981),
                            width: 1.2,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(24),
                          ),
                        ),
                        child: _isCheckingStatus
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Color(0xFF10B981),
                                ),
                              )
                            : const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.bolt_rounded,
                                    color: Color(0xFF10B981),
                                    size: 18,
                                  ),
                                  SizedBox(width: 6),
                                  Text(
                                    "I've Paid — Check Status",
                                    style: TextStyle(
                                      color: Color(0xFF10B981),
                                      fontWeight: FontWeight.w800,
                                      fontSize: 13,
                                      letterSpacing: 0.2,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Builds a single bank account card exactly as seen in the user reference image
  Widget _buildAccountCard(Map<String, String> data) {
    final bankTitle = data['bankTitle'] ?? 'Bank';
    final bankName = data['bankName'] ?? 'Bank';
    final accountNumber = data['accountNumber'] ?? '';
    final accountName = data['accountName'] ?? '';
    final badge = data['badge'] ?? 'PERMANENT';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141724),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFF23283B),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top row: Bank Title + Badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                bankTitle,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFF3B82F6).withValues(alpha: 0.4),
                    width: 0.8,
                  ),
                ),
                child: Text(
                  badge,
                  style: const TextStyle(
                    color: Color(0xFF60A5FA),
                    fontSize: 9.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Field 1: BANK NAME
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => _copyToClipboard(bankName, 'Bank Name'),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F121C),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFF1D2233),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'BANK NAME',
                          style: TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 9.5,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.6,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          bankName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    const Icon(
                      Icons.copy_rounded,
                      color: Color(0xFF64748B),
                      size: 16,
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Field 2: ACCOUNT NUMBER (TAP TO COPY) - Glowing blue highlight box!
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => _copyToClipboard(accountNumber, 'Account Number'),
              borderRadius: BorderRadius.circular(14),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFF0D121F),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: const Color(0xFF2563EB),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF2563EB).withValues(alpha: 0.15),
                      blurRadius: 10,
                      spreadRadius: -2,
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'ACCOUNT NUMBER (TAP TO COPY)',
                          style: TextStyle(
                            color: Color(0xFF60A5FA),
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.6,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          accountNumber,
                          style: const TextStyle(
                            color: Color(0xFF38BDF8),
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: const Color(0xFF2563EB),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.copy_rounded,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Field 3: ACCOUNT NAME
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => _copyToClipboard(accountName, 'Account Name'),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F121C),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFF1D2233),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'ACCOUNT NAME',
                            style: TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 9.5,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.6,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            accountName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13.5,
                              fontWeight: FontWeight.w700,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.copy_rounded,
                      color: Color(0xFF64748B),
                      size: 16,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// PalmPay card shown when account is not yet generated (requires NIN/BVN verification)
  Widget _buildPalmPayPrompt() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141724),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFF23283B),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'PalmPay',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                decoration: BoxDecoration(
                  color: const Color(0xFF2C1E14),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFFF59E0B).withValues(alpha: 0.5),
                    width: 0.8,
                  ),
                ),
                child: const Text(
                  'NIN / BVN REQUIRED',
                  style: TextStyle(
                    color: Color(0xFFF59E0B),
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.7,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'CBN regulation requires NIN or BVN verification before generating your dedicated PalmPay virtual account.',
            style: TextStyle(
              color: Color(0xFF94A3B8),
              fontSize: 12,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton.icon(
              onPressed: _showPalmPayVerificationDialog,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              icon: const Icon(Icons.verified_user_rounded, size: 17),
              label: const Text(
                'Verify NIN / BVN & Generate PalmPay',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Moniepoint card shown when account is not yet generated
  Widget _buildMoniepointPrompt(WalletProvider walletProv) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141724),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFF23283B),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Moniepoint',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFF3B82F6).withValues(alpha: 0.4),
                    width: 0.8,
                  ),
                ),
                child: const Text(
                  'PERMANENT',
                  style: TextStyle(
                    color: Color(0xFF60A5FA),
                    fontSize: 9.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Instant automated wallet top-up with a dedicated Moniepoint account number.',
            style: TextStyle(
              color: Color(0xFF94A3B8),
              fontSize: 12,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton.icon(
              onPressed: walletProv.isMonnifyLoading
                  ? null
                  : () async {
                      final ok = await walletProv.generateMonnifyAccount();
                      if (ok && mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: const Row(
                              children: [
                                Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                                SizedBox(width: 8),
                                Text(
                                  'Moniepoint account created successfully!',
                                  style: TextStyle(fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                            backgroundColor: const Color(0xFF10B981),
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        );
                      } else if (!ok && mounted && walletProv.errorMessage != null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(walletProv.errorMessage!),
                            backgroundColor: const Color(0xFFEF4444),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1E293B),
                foregroundColor: Colors.white,
                side: const BorderSide(color: Color(0xFF3B82F6), width: 1.2),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              icon: walletProv.isMonnifyLoading
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.bolt_rounded, size: 18, color: Color(0xFF60A5FA)),
              label: const Text(
                'Generate Account Number',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
