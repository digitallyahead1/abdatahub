import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/wallet_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class AgentServicesScreen extends StatefulWidget {
  final bool showBackButton;
  const AgentServicesScreen({super.key, this.showBackButton = true});

  @override
  State<AgentServicesScreen> createState() => _AgentServicesScreenState();
}

class _AgentServicesScreenState extends State<AgentServicesScreen> {
  bool _submitting = false;
  final ApiService _api = ApiService();
  static const double _agentFee = 3000.0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<WalletProvider>(context, listen: false).fetchWalletData();
    });
  }

  Future<void> _handleApply(bool hasSufficientBalance) async {
    if (!hasSufficientBalance) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Insufficient wallet balance. You need at least ₦3,000 to apply.'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkBgSecondary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Text(
          'Confirm Application Fee',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: const Text(
          'A fee of ₦3,000 will be deducted from your wallet balance to submit your Agent upgrade application.\n\nDo you want to proceed?',
          style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('Cancel', style: TextStyle(color: AppColors.silverMuted)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryBlue,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Pay ₦3,000 & Apply', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _submitting = true);
    try {
      final response = await _api.post('/users/apply-agent');
      final data = response.data;
      if (data != null && data['success'] == true) {
        // Refresh profile and wallet so agentStatus and balance update everywhere
        if (mounted) {
          await Provider.of<AuthProvider>(context, listen: false).fetchProfile();
          if (!mounted) return;
          await Provider.of<WalletProvider>(context, listen: false).fetchWalletData();
        }
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Application Submitted! ₦3,000 debited from wallet. Your request is now pending approval.'),
              backgroundColor: AppColors.success,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        final msg = e.toString().replaceAll('Exception: ', '').replaceAll('DioException: ', '');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg.isNotEmpty ? msg : 'Something went wrong. Please try again.'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final wallet = Provider.of<WalletProvider>(context);
    final agentStatus = auth.user?['agentStatus'] as String? ?? 'none';
    final balance = wallet.balance;
    final hasSufficientBalance = balance >= _agentFee;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Agent Services'),
        elevation: 0,
        automaticallyImplyLeading: widget.showBackButton,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Text(
                'Agent Services',
                style: TextStyle(
                  color: AppColors.silverLight,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Poppins',
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Upgrade your account to Agent status and enjoy reseller prices',
                style: TextStyle(color: AppColors.silverMuted, fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 24),

              // Main Card
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.darkBgSecondary,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.silverMuted.withValues(alpha: 0.1)),
                ),
                child: Stack(
                  children: [
                    // Decorative glow
                    Positioned(
                      top: -30,
                      right: -30,
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primaryBlue.withValues(alpha: 0.12),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Title & Status Row
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Why become an Agent?',
                                      style: TextStyle(
                                        color: AppColors.silverLight,
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        fontFamily: 'Inter',
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      'As an approved agent on AB Data Hub, you get access to discounted reseller rates for mobile data, airtime, and exam checkers. Perfect for resellers, students, and businesses.',
                                      style: TextStyle(
                                        color: AppColors.silverMuted,
                                        fontSize: 12,
                                        height: 1.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              _buildStatusBadge(agentStatus),
                            ],
                          ),

                          const SizedBox(height: 24),
                          Divider(color: AppColors.silverMuted.withValues(alpha: 0.1)),
                          const SizedBox(height: 20),

                          // Benefits Grid
                          Text(
                            'AGENT BENEFITS',
                            style: TextStyle(
                              color: AppColors.silverMuted.withValues(alpha: 0.7),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 12),

                          _buildBenefitCard(
                            icon: Icons.wifi,
                            color: AppColors.primaryBlue,
                            title: 'Reseller Data Pricing',
                            description: 'Save significantly on every gigabyte of MTN, Airtel, Glo, and 9mobile plans.',
                          ),
                          const SizedBox(height: 10),

                          _buildBenefitCard(
                            icon: Icons.phone_android,
                            color: const Color(0xFFA855F7),
                            title: 'Discounted Airtime',
                            description: 'Enjoy cheaper rates for top-ups on all networks with instant automated delivery.',
                          ),
                          const SizedBox(height: 10),

                          _buildBenefitCard(
                            icon: Icons.school,
                            color: AppColors.success,
                            title: 'Bulk Exam Checkers',
                            description: 'Purchase WAEC result checker PINs and NECO tokens at low wholesale rates.',
                            wide: true,
                          ),

                          const SizedBox(height: 24),
                          Divider(color: AppColors.silverMuted.withValues(alpha: 0.1)),
                          const SizedBox(height: 20),

                          // Action Area
                          _buildActionArea(agentStatus, balance, hasSufficientBalance),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Info cards
              _buildInfoCard(
                icon: Icons.verified_user_outlined,
                title: 'Verified & Trusted',
                body: 'All agent applications are manually reviewed by our team for security and quality assurance.',
              ),
              const SizedBox(height: 12),
              _buildInfoCard(
                icon: Icons.support_agent_outlined,
                title: 'Dedicated Support',
                body: 'Approved agents receive priority support from our customer care team.',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String agentStatus) {
    Color bg;
    Color fg;
    String label;
    IconData icon;

    switch (agentStatus) {
      case 'approved':
        bg = AppColors.success.withValues(alpha: 0.12);
        fg = AppColors.success;
        label = 'Approved Agent';
        icon = Icons.check_circle;
        break;
      case 'pending':
        bg = const Color(0xFFF59E0B).withValues(alpha: 0.12);
        fg = const Color(0xFFF59E0B);
        label = 'Pending Review';
        icon = Icons.hourglass_top_rounded;
        break;
      case 'rejected':
        bg = AppColors.error.withValues(alpha: 0.12);
        fg = AppColors.error;
        label = 'Rejected';
        icon = Icons.cancel_outlined;
        break;
      default:
        bg = AppColors.silverMuted.withValues(alpha: 0.1);
        fg = AppColors.silverMuted;
        label = 'Not Applied';
        icon = Icons.circle_outlined;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: fg.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: fg),
          const SizedBox(width: 5),
          Text(
            label,
            style: TextStyle(
              color: fg,
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBenefitCard({
    required IconData icon,
    required Color color,
    required String title,
    required String description,
    bool wide = false,
  }) {
    final card = Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.darkBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.silverMuted.withValues(alpha: 0.06)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: AppColors.silverLight,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  description,
                  style: TextStyle(
                    color: AppColors.silverMuted,
                    fontSize: 11,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
    return wide ? SizedBox(width: double.infinity, child: card) : card;
  }

  Widget _buildFeeNoticeCard(double balance, bool hasSufficientBalance) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.primaryBlue.withValues(alpha: 0.08),
        border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.25)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primaryBlue.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.payments_rounded, color: AppColors.accentGlow, size: 20),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Upgrade Fee: ₦3,000',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      Text(
                        'One-time wallet payment',
                        style: TextStyle(color: AppColors.silverMuted.withValues(alpha: 0.7), fontSize: 10),
                      ),
                    ],
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    'WALLET BALANCE',
                    style: TextStyle(color: AppColors.silverMuted.withValues(alpha: 0.7), fontSize: 9, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    '₦${balance.toStringAsFixed(2)}',
                    style: TextStyle(
                      color: hasSufficientBalance ? AppColors.success : AppColors.error,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.darkBg.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.info_outline_rounded, color: AppColors.warning, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'A one-time application fee of ₦3,000 will be deducted from your wallet balance upon submitting this request. Please ensure you have funded your wallet before applying.',
                    style: TextStyle(color: AppColors.silverMuted.withValues(alpha: 0.9), fontSize: 11, height: 1.4),
                  ),
                ),
              ],
            ),
          ),
          if (!hasSufficientBalance) ...[
            const SizedBox(height: 10),
            const Row(
              children: [
                Icon(Icons.error_outline_rounded, color: AppColors.error, size: 14),
                SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Insufficient balance. Please fund your wallet with at least ₦3,000.',
                    style: TextStyle(color: AppColors.error, fontSize: 11, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildActionArea(String agentStatus, double balance, bool hasSufficientBalance) {
    if (agentStatus == 'none') {
      return Column(
        children: [
          _buildFeeNoticeCard(balance, hasSufficientBalance),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: (_submitting || !hasSufficientBalance)
                  ? null
                  : () => _handleApply(hasSufficientBalance),
              icon: _submitting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.verified_user),
              label: Text(_submitting ? 'Processing Payment...' : 'Pay ₦3,000 & Apply'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryBlue,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),
          ),
        ],
      );
    }

    if (agentStatus == 'pending') {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFF59E0B).withValues(alpha: 0.08),
          border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.25)),
          borderRadius: BorderRadius.circular(14),
        ),
        child: const Row(
          children: [
            Icon(Icons.hourglass_top_rounded, color: Color(0xFFF59E0B), size: 20),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Your agent application is under review by our administration. Your ₦3,000 fee was received. Once approved, your account pricing will update automatically.',
                style: TextStyle(color: Color(0xFFF59E0B), fontSize: 12, height: 1.5),
              ),
            ),
          ],
        ),
      );
    }

    if (agentStatus == 'approved') {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.success.withValues(alpha: 0.08),
          border: Border.all(color: AppColors.success.withValues(alpha: 0.25)),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          children: [
            const Row(
              children: [
                Icon(Icons.check_circle, color: AppColors.success, size: 20),
                SizedBox(width: 10),
                Text(
                  '🎉 Congratulations! You are an Approved Agent.',
                  style: TextStyle(color: AppColors.success, fontSize: 13, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'You are currently logged in with active agent privileges. All services automatically reflect your discounted prices.',
              style: TextStyle(color: AppColors.silverMuted, fontSize: 12, height: 1.5),
            ),
          ],
        ),
      );
    }

    if (agentStatus == 'rejected') {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.error.withValues(alpha: 0.08),
          border: Border.all(color: AppColors.error.withValues(alpha: 0.25)),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.cancel_outlined, color: AppColors.error, size: 18),
                SizedBox(width: 10),
                Text(
                  'Your agent application was not approved.',
                  style: TextStyle(color: AppColors.error, fontSize: 13, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildFeeNoticeCard(balance, hasSufficientBalance),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton(
                onPressed: (_submitting || !hasSufficientBalance)
                    ? null
                    : () => _handleApply(hasSufficientBalance),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryBlue,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                child: _submitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Re-apply & Pay ₦3,000'),
              ),
            ),
          ],
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildInfoCard({required IconData icon, required String title, required String body}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.darkBgSecondary,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.silverMuted.withValues(alpha: 0.08)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.silverLight, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: AppColors.silverLight,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  body,
                  style: TextStyle(
                    color: AppColors.silverMuted,
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
