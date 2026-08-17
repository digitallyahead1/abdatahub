import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
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

  Future<void> _handleApply() async {
    setState(() => _submitting = true);
    try {
      final response = await _api.post('/users/apply-agent');
      final data = response.data;
      if (data != null && data['success'] == true) {
        // Refresh profile so agentStatus updates everywhere
        if (mounted) {
          await Provider.of<AuthProvider>(context, listen: false).fetchProfile();
        }
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Application Submitted! Your request is now pending approval.'),
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
    final agentStatus = auth.user?['agentStatus'] as String? ?? 'none';

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
                          Row(
                            children: [
                              Expanded(
                                child: _buildBenefitCard(
                                  icon: Icons.trending_up,
                                  color: AppColors.primaryBlue,
                                  title: 'Reseller Data Pricing',
                                  description: 'Save significantly on every GB of data across all networks.',
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildBenefitCard(
                                  icon: Icons.monetization_on_outlined,
                                  color: const Color(0xFF8B5CF6),
                                  title: 'Discounted Airtime',
                                  description: 'Cheaper rates for top-ups on all networks instantly.',
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          _buildBenefitCard(
                            icon: Icons.description_outlined,
                            color: AppColors.success,
                            title: 'Bulk Exam Checkers',
                            description: 'Purchase WAEC result checker PINs and NECO tokens at low wholesale rates.',
                            wide: true,
                          ),

                          const SizedBox(height: 24),
                          Divider(color: AppColors.silverMuted.withValues(alpha: 0.1)),
                          const SizedBox(height: 20),

                          // Action Area
                          _buildActionArea(agentStatus),
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
                icon: Icons.flash_on_outlined,
                title: 'Instant Price Updates',
                body: 'Once approved, your account pricing updates automatically with no action needed from you.',
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg;
    Color fg;
    String label;
    switch (status) {
      case 'pending':
        bg = const Color(0xFFF59E0B).withValues(alpha: 0.15);
        fg = const Color(0xFFF59E0B);
        label = 'Pending';
        break;
      case 'approved':
        bg = AppColors.success.withValues(alpha: 0.15);
        fg = AppColors.success;
        label = 'Approved';
        break;
      case 'rejected':
        bg = AppColors.error.withValues(alpha: 0.15);
        fg = AppColors.error;
        label = 'Rejected';
        break;
      default:
        bg = AppColors.silverMuted.withValues(alpha: 0.12);
        fg = AppColors.silverMuted;
        label = 'Not Applied';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(color: fg, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8),
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
      child: wide
          ? Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 18),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: TextStyle(color: AppColors.silverLight, fontSize: 13, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Text(description, style: TextStyle(color: AppColors.silverMuted, fontSize: 11, height: 1.4)),
                    ],
                  ),
                ),
              ],
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: color, size: 18),
                ),
                const SizedBox(height: 10),
                Text(title, style: TextStyle(color: AppColors.silverLight, fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(description, style: TextStyle(color: AppColors.silverMuted, fontSize: 11, height: 1.4)),
              ],
            ),
    );
    return wide ? SizedBox(width: double.infinity, child: card) : card;
  }

  Widget _buildActionArea(String agentStatus) {
    if (agentStatus == 'none') {
      return Column(
        children: [
          Text(
            'Click the button below to request an upgrade to an Agent account.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.silverMuted, fontSize: 13),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton.icon(
              onPressed: _submitting ? null : _handleApply,
              icon: _submitting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.verified_user),
              label: Text(_submitting ? 'Submitting Request...' : 'Apply to Become Agent'),
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
                'Your agent application is under review by our administration. Once approved, your account pricing will update automatically.',
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
            SizedBox(
              width: double.infinity,
              height: 44,
              child: ElevatedButton(
                onPressed: _submitting ? null : _handleApply,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryBlue,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                child: _submitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Re-apply for Agent Status'),
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
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primaryBlue.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.primaryBlue, size: 18),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(color: AppColors.silverLight, fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(body, style: TextStyle(color: AppColors.silverMuted, fontSize: 12, height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
