import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/wallet_provider.dart';
import '../theme/app_theme.dart';

class WalletTab extends StatefulWidget {
  const WalletTab({super.key});

  @override
  State<WalletTab> createState() => _WalletTabState();
}

class _WalletTabState extends State<WalletTab> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  String _activeTab = 'gafiapay'; // default to Gafiapay/PalmPay
  Timer? _countdownTimer;
  String _countdownText = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final walletProv = Provider.of<WalletProvider>(context, listen: false);
      walletProv.fetchMonnifyAccount();
      walletProv.fetchActiveGafiapayAccount();
    });
  }

  @override
  void dispose() {
    _amountController.dispose();
    _countdownTimer?.cancel();
    super.dispose();
  }

  void _startCountdown(String expiresAtStr) {
    _countdownTimer?.cancel();
    final expiresAt = DateTime.parse(expiresAtStr).toLocal();

    void updateText() {
      final now = DateTime.now();
      final diff = expiresAt.difference(now);

      if (diff.isNegative) {
        setState(() {
          _countdownText = 'Expired';
        });
        _countdownTimer?.cancel();
        final walletProv = Provider.of<WalletProvider>(context, listen: false);
        walletProv.clearGafiapayAccount();
      } else {
        final hours = diff.inHours;
        final minutes = diff.inMinutes.remainder(60);
        final seconds = diff.inSeconds.remainder(60);
        setState(() {
          _countdownText = '${hours}h ${minutes}m ${seconds}s';
        });
      }
    }

    updateText();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      updateText();
    });
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard!'),
        backgroundColor: AppColors.success,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _generateMonnify() async {
    final walletProv = Provider.of<WalletProvider>(context, listen: false);
    final success = await walletProv.generateMonnifyAccount();
    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Permanent account generated successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(walletProv.errorMessage ?? 'Generation failed'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _generateGafiapay() async {
    final walletProv = Provider.of<WalletProvider>(context, listen: false);
    final success = await walletProv.generateGafiapayAccount();
    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('PalmPay reserved account generated successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(walletProv.errorMessage ?? 'Generation failed'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final walletProvider = Provider.of<WalletProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Fund Wallet'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              walletProvider.fetchWalletData();
              walletProvider.fetchMonnifyAccount();
              walletProvider.fetchActiveGafiapayAccount();
            },
          )
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Display current balances
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.darkBgSecondary,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.silverMuted.withValues(alpha: 0.05)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Available Balance',
                          style: TextStyle(color: AppColors.silverMuted, fontSize: 12),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '₦${walletProvider.balance.toStringAsFixed(2)}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Poppins',
                          ),
                        ),
                      ],
                    ),
                    Container(
                      width: 1,
                      height: 40,
                      color: AppColors.silverMuted.withValues(alpha: 0.1),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          'Ledger Balance',
                          style: TextStyle(color: AppColors.silverMuted, fontSize: 12),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '₦${walletProvider.ledgerBalance.toStringAsFixed(2)}',
                          style: TextStyle(
                            color: AppColors.silverLight,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Tab Bar Selection
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppColors.darkBgSecondary,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.silverMuted.withValues(alpha: 0.05)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _activeTab = 'gafiapay';
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: _activeTab == 'gafiapay'
                                ? AppColors.accentGlow.withValues(alpha: 0.15)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                            border: _activeTab == 'gafiapay'
                                ? Border.all(color: AppColors.accentGlow.withValues(alpha: 0.3))
                                : null,
                          ),
                          child: Center(
                            child: Text(
                              'PalmPay (Perm)',
                              style: TextStyle(
                                color: _activeTab == 'gafiapay' ? Colors.white : AppColors.silverMuted,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: Tooltip(
                        message: 'Monnify is currently unavailable',
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: Text(
                              'Monnify (Unavail)',
                              style: TextStyle(
                                color: AppColors.silverMuted.withValues(alpha: 0.4),
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Active Tab Content
              if (_activeTab == 'monnify')
                _buildMonnifyTab(walletProvider)
              else
                _buildGafiapayTab(walletProvider),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMonnifyTab(WalletProvider walletProvider) {
    if (walletProvider.isMonnifyLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 40.0),
          child: CircularProgressIndicator(),
        ),
      );
    }

    final account = walletProvider.monnifyAccount;

    if (account != null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.darkBgSecondary,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.silverMuted.withValues(alpha: 0.05)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Permanent Reserved Account',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Transfer money to this account to fund your wallet anytime.',
              style: TextStyle(color: AppColors.silverMuted, fontSize: 12),
            ),
            const Divider(height: 32, color: Colors.white10),
            _buildDetailRow('Account Name', account['accountName']),
            const SizedBox(height: 16),
            _buildDetailRowWithCopy('Account Number', account['accountNumber']),
            const SizedBox(height: 16),
            _buildDetailRowWithCopy('Bank Name', account['bankName']),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Monnify Permanent Funding',
          style: TextStyle(
            color: AppColors.silverLight,
            fontSize: 15,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Generate a permanent virtual account bank details dedicated to your profile.',
          style: TextStyle(color: AppColors.silverMuted, fontSize: 12),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 54,
          child: ElevatedButton(
            onPressed: walletProvider.isLoading ? null : _generateMonnify,
            style: ElevatedButton.styleFrom(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: const Text(
              'Generate Reserved Account',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGafiapayTab(WalletProvider walletProvider) {
    if (walletProvider.isGafiapayLoading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 40.0),
          child: CircularProgressIndicator(),
        ),
      );
    }

    final account = walletProvider.gafiapayAccount;

    if (account != null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.darkBgSecondary,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.silverMuted.withValues(alpha: 0.05)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Permanent Reserved Account',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Transfer money to this account to fund your wallet anytime.',
              style: TextStyle(color: AppColors.silverMuted, fontSize: 12),
            ),
            const Divider(height: 32, color: Colors.white10),
            _buildDetailRow('Account Name', account['accountName']),
            const SizedBox(height: 16),
            _buildDetailRowWithCopy('Account Number', account['accountNumber']),
            const SizedBox(height: 16),
            _buildDetailRowWithCopy('Bank Name', account['bankName']),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'PalmPay Permanent Funding',
          style: TextStyle(
            color: AppColors.silverLight,
            fontSize: 15,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Generate a permanent virtual account bank details dedicated to your profile.',
          style: TextStyle(color: AppColors.silverMuted, fontSize: 12),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 54,
          child: ElevatedButton(
            onPressed: walletProvider.isLoading ? null : _generateGafiapay,
            style: ElevatedButton.styleFrom(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: const Text(
              'Generate Reserved Account',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(color: AppColors.silverMuted, fontSize: 13),
        ),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ],
    );
  }

  Widget _buildDetailRowWithCopy(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(color: AppColors.silverMuted, fontSize: 13),
        ),
        Row(
          children: [
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () => _copyToClipboard(value, label),
              child: const Icon(
                Icons.copy,
                color: AppColors.accentGlow,
                size: 16,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
