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
  String _activeTab = 'gafiapay'; // default to Gafiapay/PalmPay

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
    super.dispose();
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

  void _showGafiapayNinDialog() {
    final ninController = TextEditingController();
    String? localError;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.darkBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalContext, setModalState) {
            final walletProv = Provider.of<WalletProvider>(modalContext);

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 24,
                bottom: MediaQuery.of(modalContext).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Text('🛡️', style: TextStyle(fontSize: 20)),
                          const SizedBox(width: 8),
                          Text(
                            'PalmPay Verification',
                            style: TextStyle(
                              color: AppColors.silverLight,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        onPressed: walletProv.isGafiapayLoading ? null : () => Navigator.pop(modalContext),
                        icon: Icon(Icons.close, color: AppColors.silverMuted, size: 20),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Central Bank of Nigeria (CBN) regulations require a valid 11-digit NIN or BVN to link and issue your dedicated PalmPay virtual account.',
                    style: TextStyle(color: AppColors.silverMuted, fontSize: 13, height: 1.4),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'National Identification Number (NIN) / BVN',
                    style: TextStyle(
                      color: AppColors.silverLight,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: ninController,
                    keyboardType: TextInputType.number,
                    maxLength: 11,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    style: const TextStyle(
                      color: Colors.white,
                      letterSpacing: 3,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Enter 11-digit NIN',
                      hintStyle: TextStyle(color: AppColors.silverMuted.withValues(alpha: 0.5), letterSpacing: 1),
                      filled: true,
                      fillColor: Colors.white.withValues(alpha: 0.05),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      counterText: '',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(color: AppColors.accentGlow),
                      ),
                    ),
                    onChanged: (val) {
                      if (localError != null) {
                        setModalState(() => localError = null);
                      }
                    },
                  ),
                  if (localError != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      localError!,
                      style: const TextStyle(color: AppColors.error, fontSize: 12),
                    ),
                  ],
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: walletProv.isGafiapayLoading
                          ? null
                          : () async {
                              final nin = ninController.text.trim();
                              if (nin.length != 11) {
                                setModalState(() {
                                  localError = 'Please enter a valid 11-digit NIN or BVN';
                                });
                                return;
                              }

                              final success = await walletProv.generateGafiapayAccount(nin: nin);
                              if (!modalContext.mounted) return;

                              if (success) {
                                Navigator.pop(modalContext);
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('PalmPay reserved account generated successfully!'),
                                      backgroundColor: AppColors.success,
                                    ),
                                  );
                                }
                              } else {
                                setModalState(() {
                                  localError = walletProv.errorMessage ?? 'Generation failed. Please check details.';
                                });
                              }
                            },
                      style: ElevatedButton.styleFrom(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: walletProv.isGafiapayLoading
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text(
                              'Verify & Generate Account',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
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
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _activeTab = 'monnify';
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: _activeTab == 'monnify'
                                ? AppColors.accentGlow.withValues(alpha: 0.15)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                            border: _activeTab == 'monnify'
                                ? Border.all(color: AppColors.accentGlow.withValues(alpha: 0.3))
                                : null,
                          ),
                          child: Center(
                            child: Text(
                              'Monnify (Perm)',
                              style: TextStyle(
                                color: _activeTab == 'monnify' ? Colors.white : AppColors.silverMuted,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
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
            onPressed: walletProvider.isLoading ? null : _showGafiapayNinDialog,
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
