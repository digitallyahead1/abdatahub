import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/auth_provider.dart';
import '../providers/wallet_provider.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';
import 'buy_data_screen.dart';
import 'buy_airtime_screen.dart';
import 'electricity_screen.dart';
import 'cable_screen.dart';
import 'exam_pins_screen.dart';
import 'wallet_tab.dart';
import 'transactions_tab.dart';
import '../widgets/transaction_details_sheet.dart';
import '../widgets/wallet_topup_sheet.dart';
import '../widgets/select_network_sheet.dart';
import '../services/api_service.dart';

class HomeTab extends StatefulWidget {
  const HomeTab({super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  static bool _hasShownNotification = false;
  bool _isBalanceVisible = true;
  bool _isRefreshing = false;

  Future<void> _refreshWalletAndProfile() async {
    if (_isRefreshing) return;
    setState(() => _isRefreshing = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final walletProvider = Provider.of<WalletProvider>(context, listen: false);
      await Future.wait([
        walletProvider.fetchWalletData(),
        authProvider.fetchProfile(),
      ]);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                SizedBox(width: 8),
                Text('Wallet balance refreshed', style: TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
            backgroundColor: const Color(0xFF10B981),
            duration: const Duration(seconds: 2),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } catch (_) {
    } finally {
      if (mounted) {
        setState(() => _isRefreshing = false);
      }
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkNotification();
    });
  }

  Future<void> _checkNotification() async {
    if (_hasShownNotification) return;
    try {
      final response = await ApiService().get('/services/notification');
      final resData = response.data;
      final data = resData != null ? resData['data'] : null;
      if (data != null &&
          data['notificationEnabled'] == true &&
          data['notificationMessage'] != null &&
          data['notificationMessage'].toString().trim().isNotEmpty) {
        _hasShownNotification = true;
        if (!mounted) return;

        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppColors.darkBgSecondary,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Row(
              children: [
                Icon(Icons.campaign, color: AppColors.primaryBlue, size: 28),
                SizedBox(width: 10),
                Text(
                  'Announcement',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                ),
              ],
            ),
            content: SingleChildScrollView(
              child: Text(
                data['notificationMessage'].toString(),
                style: TextStyle(color: AppColors.silverLight, fontSize: 14, height: 1.5),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Understood', style: TextStyle(color: AppColors.primaryBlue, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      // Ignore notification fetch error silently
    }
  }

  void _navigateToService(BuildContext context, Widget screen) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  Future<void> _openUrl(String url) async {
    try {
      final uri = Uri.parse(url);
      final launched = await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );
      if (!launched) {
        await launchUrl(uri, mode: LaunchMode.platformDefault);
      }
    } catch (e) {
      debugPrint('Error launching URL ($url): $e');
    }
  }

  void _confirmSignOut(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF101626),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.logout_rounded, color: Color(0xFFEF4444), size: 24),
            SizedBox(width: 10),
            Text(
              'Sign Out',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        content: const Text(
          'Are you sure you want to log out of your account?',
          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF94A3B8))),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              final authProvider = Provider.of<AuthProvider>(context, listen: false);
              await authProvider.logout();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final walletProvider = Provider.of<WalletProvider>(context);
    final user = authProvider.user;

    final userName = user?['fullName'] ?? 'User';
    final userRole = user?['role'] ?? 'User';

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await walletProvider.fetchWalletData();
            await authProvider.fetchProfile();
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Profile Section
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Hi, $userName 👋',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: AppColors.silverLight,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Poppins',
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryBlue.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: AppColors.primaryBlue.withValues(alpha: 0.3)),
                                ),
                                child: Text(
                                  userRole.toUpperCase(),
                                  style: const TextStyle(
                                    color: AppColors.accentGlow,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const CircleAvatar(
                                    radius: 3,
                                    backgroundColor: Color(0xFF22C55E),
                                  ),
                                  const SizedBox(width: 5),
                                  Text(
                                    'Always Connected',
                                    style: TextStyle(
                                      color: AppColors.silverMuted,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    // Header Right Actions: Sleek Logout Icon & Logo Badge
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Sleek Frosted Sign Out Icon Button
                        Tooltip(
                          message: 'Sign Out',
                          child: Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: () => _confirmSignOut(context),
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                width: 38,
                                height: 38,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEF4444).withValues(alpha: 0.14),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: const Color(0xFFEF4444).withValues(alpha: 0.30),
                                    width: 1,
                                  ),
                                ),
                                child: const Center(
                                  child: Icon(
                                    Icons.power_settings_new_rounded,
                                    color: Color(0xFFF87171),
                                    size: 19,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Logo Badge
                        Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: AppColors.darkBgSecondary,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.silverMuted.withValues(alpha: 0.12)),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.asset(
                              'assets/images/logo.png',
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  color: AppColors.darkBgSecondary,
                                  child: const Center(
                                    child: Icon(
                                      Icons.cell_tower,
                                      color: AppColors.primaryBlue,
                                      size: 20,
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Premium Modern Blue Wallet Card (Exact Redesign from Image)
                Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [
                        Color(0xFF0052FF),
                        Color(0xFF0036D2),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(26),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.22),
                      width: 1.2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0036D2).withValues(alpha: 0.45),
                        blurRadius: 28,
                        offset: const Offset(0, 10),
                        spreadRadius: -2,
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(26),
                    child: Stack(
                      children: [
                        // Fluid organic background waves on the right
                        Positioned.fill(
                          child: CustomPaint(
                            painter: _WalletFluidCurvesPainter(),
                          ),
                        ),
                        // 3D Blue Leather Wallet Graphic (Bottom-Right)
                        Positioned(
                          right: 14,
                          bottom: 12,
                          child: _build3DWalletGraphic(),
                        ),
                        // Top accent micro-glow line
                        Positioned(
                          top: 0,
                          left: 20,
                          right: 20,
                          child: Container(
                            height: 1.5,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.white.withValues(alpha: 0.0),
                                  Colors.white.withValues(alpha: 0.7),
                                  Colors.white.withValues(alpha: 0.0),
                                ],
                              ),
                            ),
                          ),
                        ),
                        // Card content
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 18.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Top Row: Glowing Wallet Squircle + Available Balance Pill + Active Status Badge
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      // Glowing Wallet Icon Squircle
                                      Container(
                                        width: 42,
                                        height: 42,
                                        decoration: BoxDecoration(
                                          gradient: const LinearGradient(
                                            colors: [Color(0xFF0088FF), Color(0xFF0055FF)],
                                            begin: Alignment.topLeft,
                                            end: Alignment.bottomRight,
                                          ),
                                          borderRadius: BorderRadius.circular(13),
                                          border: Border.all(
                                            color: Colors.white.withValues(alpha: 0.40),
                                            width: 1.0,
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: const Color(0xFF0070FF).withValues(alpha: 0.45),
                                              blurRadius: 10,
                                              offset: const Offset(0, 3),
                                            ),
                                          ],
                                        ),
                                        child: const Center(
                                          child: Icon(
                                            Icons.account_balance_wallet_rounded,
                                            size: 21,
                                            color: Colors.white,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      // Available Balance + Eye Capsule
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF002A88).withValues(alpha: 0.45),
                                          borderRadius: BorderRadius.circular(20),
                                          border: Border.all(
                                            color: Colors.white.withValues(alpha: 0.15),
                                            width: 0.8,
                                          ),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Text(
                                              'AVAILABLE BALANCE',
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontSize: 10.5,
                                                fontWeight: FontWeight.w800,
                                                letterSpacing: 0.6,
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Material(
                                              color: Colors.transparent,
                                              child: InkWell(
                                                onTap: () {
                                                  setState(() {
                                                    _isBalanceVisible = !_isBalanceVisible;
                                                  });
                                                },
                                                borderRadius: BorderRadius.circular(12),
                                                child: Icon(
                                                  _isBalanceVisible
                                                      ? Icons.visibility_outlined
                                                      : Icons.visibility_off_outlined,
                                                  size: 15,
                                                  color: Colors.white.withValues(alpha: 0.95),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  // Solid Active Status Badge
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF00A859),
                                      borderRadius: BorderRadius.circular(20),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFF00A859).withValues(alpha: 0.40),
                                          blurRadius: 8,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Container(
                                          width: 7,
                                          height: 7,
                                          decoration: const BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: Color(0xFF22FF66),
                                            boxShadow: [
                                              BoxShadow(
                                                color: Color(0xFF22FF66),
                                                blurRadius: 4,
                                                spreadRadius: 1,
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        const Text(
                                          'Active',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 11.5,
                                            fontWeight: FontWeight.w700,
                                            letterSpacing: 0.2,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              // Balance Amount with show/hide
                              walletProvider.isLoading
                                  ? const SizedBox(
                                      height: 38,
                                      width: 38,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : Text(
                                      _isBalanceVisible
                                          ? '₦${walletProvider.balance.toStringAsFixed(2)}'
                                          : '₦ • • • • • •',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 36,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: -0.5,
                                        fontFamily: 'Poppins',
                                      ),
                                    ),
                              const SizedBox(height: 5),
                              // Instant Funding Subtitle Tag
                              Row(
                                children: [
                                  Icon(
                                    Icons.verified_user_rounded,
                                    size: 13,
                                    color: Colors.white.withValues(alpha: 0.90),
                                  ),
                                  const SizedBox(width: 5),
                                  Text(
                                    'Moniepoint & PalmPay Ready • Instant Funding',
                                    style: TextStyle(
                                      color: Colors.white.withValues(alpha: 0.88),
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              // Action Buttons Row
                              Row(
                                children: [
                                  // White Fund Wallet Button
                                  ElevatedButton(
                                    onPressed: () => WalletTopUpSheet.show(context),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.white,
                                      foregroundColor: const Color(0xFF0052FF),
                                      elevation: 3,
                                      shadowColor: Colors.black.withValues(alpha: 0.20),
                                      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(24),
                                      ),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.add_rounded, size: 20, color: Color(0xFF0052FF)),
                                        SizedBox(width: 6),
                                        Text(
                                          'Fund Wallet',
                                          style: TextStyle(
                                            color: Color(0xFF0052FF),
                                            fontWeight: FontWeight.w800,
                                            fontSize: 14.5,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  // Blue Refresh Button
                                  Tooltip(
                                    message: 'Refresh Balance',
                                    child: Container(
                                      height: 46,
                                      width: 46,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF0062FF).withValues(alpha: 0.90),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(
                                          color: Colors.white.withValues(alpha: 0.35),
                                          width: 1.2,
                                        ),
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFF0036D2).withValues(alpha: 0.40),
                                            blurRadius: 8,
                                            offset: const Offset(0, 3),
                                          ),
                                        ],
                                      ),
                                      child: Material(
                                        color: Colors.transparent,
                                        child: InkWell(
                                          onTap: _isRefreshing ? null : _refreshWalletAndProfile,
                                          borderRadius: BorderRadius.circular(16),
                                          child: Center(
                                            child: _isRefreshing
                                                ? const SizedBox(
                                                    width: 18,
                                                    height: 18,
                                                    child: CircularProgressIndicator(
                                                      strokeWidth: 2,
                                                      color: Colors.white,
                                                    ),
                                                  )
                                                : const Icon(
                                                    Icons.history_rounded,
                                                    size: 22,
                                                    color: Colors.white,
                                                  ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),

                // WhatsApp Community Banner (Ultra Smooth Emerald Gradient)
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => _openUrl('https://chat.whatsapp.com/G40DE7gJE5i3AEFTOYUmec?s=cl&p=a&mlu=4&ilr=4'),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [
                            Color(0xFF042F1A),
                            Color(0xFF064E3B),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: const Color(0xFF10B981).withValues(alpha: 0.35),
                          width: 1.0,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF042F1A).withValues(alpha: 0.40),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          // WhatsApp Green Squircle Icon
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: const Color(0xFF25D366),
                              borderRadius: BorderRadius.circular(14),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF25D366).withValues(alpha: 0.40),
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: const Center(
                              child: Icon(
                                Icons.chat_rounded,
                                color: Colors.white,
                                size: 22,
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          // Title & Subtitle
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      'WhatsApp Community',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 14.5,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: -0.1,
                                      ),
                                    ),
                                    SizedBox(width: 6),
                                    CircleAvatar(
                                      radius: 3,
                                      backgroundColor: Color(0xFF25D366),
                                    ),
                                  ],
                                ),
                                SizedBox(height: 3),
                                Text(
                                  'Real-time updates, price alerts & support',
                                  style: TextStyle(
                                    color: Color(0xFF94A3B8),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Join Pill Button
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFF25D366),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF25D366).withValues(alpha: 0.35),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'Join',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                SizedBox(width: 4),
                                Icon(
                                  Icons.arrow_forward_ios_rounded,
                                  color: Colors.white,
                                  size: 11,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Quick Services Section
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Quick Services',
                      style: TextStyle(
                        color: AppColors.silverLight,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.2,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF161B29),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: const Color(0xFF283149),
                        ),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.bolt_rounded, size: 12, color: Color(0xFF10B981)),
                          SizedBox(width: 4),
                          Text(
                            '8 services',
                            style: TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.05,
                  children: [
                    _ModernServiceCard(
                      title: 'Wallet Top-Up',
                      subtitle: 'Instant funding',
                      badgeText: 'INSTANT',
                      icon: Icons.account_balance_wallet_rounded,
                      accentColor: const Color(0xFF6366F1),
                      onTap: () => WalletTopUpSheet.show(context),
                    ),
                    _ModernServiceCard(
                      title: 'Buy Data',
                      subtitle: 'Cheap data plans',
                      badgeText: 'HOT',
                      icon: Icons.wifi_rounded,
                      accentColor: const Color(0xFF10B981),
                      onTap: () => SelectNetworkSheet.show(context),
                    ),
                    _ModernServiceCard(
                      title: 'Airtime Top-Up',
                      subtitle: 'Instant recharge',
                      badgeText: 'POPULAR',
                      icon: Icons.phone_iphone_rounded,
                      accentColor: const Color(0xFF3B82F6),
                      onTap: () => _navigateToService(context, const BuyAirtimeScreen()),
                    ),
                    _ModernServiceCard(
                      title: 'Cable TV',
                      subtitle: 'DSTV, GOTV & more',
                      badgeText: 'PAY TV',
                      icon: Icons.tv_rounded,
                      accentColor: const Color(0xFF06B6D4),
                      onTap: () => _navigateToService(context, const CableScreen()),
                    ),
                    _ModernServiceCard(
                      title: 'Electricity',
                      subtitle: 'Pay utility bills',
                      badgeText: 'INSTANT',
                      icon: Icons.bolt_rounded,
                      accentColor: const Color(0xFFF59E0B),
                      onTap: () => _navigateToService(context, const ElectricityScreen()),
                    ),
                    _ModernServiceCard(
                      title: 'Exam Pins',
                      subtitle: 'WAEC, NECO pins',
                      badgeText: 'ACTIVE',
                      icon: Icons.school_rounded,
                      accentColor: const Color(0xFFA855F7),
                      onTap: () => _navigateToService(context, const ExamPinsScreen()),
                    ),
                    _ModernServiceCard(
                      title: 'Airtime to Cash',
                      subtitle: 'Instant conversion',
                      badgeText: 'WHATSAPP',
                      icon: Icons.currency_exchange_rounded,
                      accentColor: const Color(0xFF25D366),
                      onTap: () => _openUrl('https://chat.whatsapp.com/G40DE7gJE5i3AEFTOYUmec?s=cl&p=a&mlu=4&ilr=4'),
                    ),
                    _ModernServiceCard(
                      title: 'Support',
                      subtitle: '24/7 Live chat',
                      badgeText: 'ONLINE',
                      icon: Icons.headset_mic_rounded,
                      accentColor: const Color(0xFFEC4899),
                      onTap: () => _openUrl('https://wa.me/2347045357195?text=Hello%20AB%20Data%20Hub%20Support,%20I%20need%20help.'),
                    ),
                  ],
                ),
                const SizedBox(height: 28),

                // Recent Transactions List Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Recent Activity',
                          style: TextStyle(
                            color: AppColors.silverLight,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.2,
                          ),
                        ),
                        if (walletProvider.transactions.isNotEmpty) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E2538),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '${walletProvider.transactions.length > 5 ? 5 : walletProvider.transactions.length}',
                              style: const TextStyle(
                                color: Color(0xFF94A3B8),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => _navigateToService(context, const TransactionsTab()),
                        borderRadius: BorderRadius.circular(8),
                        child: const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'View All',
                                style: TextStyle(
                                  color: Color(0xFF3B82F6),
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12.5,
                                ),
                              ),
                              SizedBox(width: 4),
                              Icon(
                                Icons.arrow_forward_ios_rounded,
                                size: 10,
                                color: Color(0xFF3B82F6),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Recent Transactions list
                walletProvider.isLoading && walletProvider.transactions.isEmpty
                    ? const Center(
                        child: Padding(
                          padding: EdgeInsets.all(20.0),
                          child: CircularProgressIndicator(),
                        ),
                      )
                    : walletProvider.transactions.isEmpty
                        ? Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 36.0),
                            decoration: BoxDecoration(
                              color: const Color(0xFF131722),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(color: const Color(0xFF232838)),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.receipt_long_rounded, size: 44, color: AppColors.silverMuted.withValues(alpha: 0.4)),
                                const SizedBox(height: 10),
                                Text(
                                  'No transactions yet',
                                  style: TextStyle(color: AppColors.silverMuted.withValues(alpha: 0.6), fontSize: 13),
                                ),
                              ],
                            ),
                          )
                        : Column(
                            children: [
                              ListView.separated(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: walletProvider.transactions.length > 5
                                    ? 5
                                    : walletProvider.transactions.length,
                                separatorBuilder: (_, __) => const SizedBox(height: 10),
                                itemBuilder: (context, index) {
                                  final tx = walletProvider.transactions[index];
                                  return GestureDetector(
                                    onTap: () => TransactionDetailsSheet.show(context, tx as Map<String, dynamic>),
                                    child: _buildTransactionCard(tx),
                                  );
                                },
                              ),
                              const SizedBox(height: 12),
                              // Full-width View All Transactions Button
                              SizedBox(
                                width: double.infinity,
                                height: 46,
                                child: OutlinedButton(
                                  onPressed: () => _navigateToService(context, const TransactionsTab()),
                                  style: OutlinedButton.styleFrom(
                                    backgroundColor: const Color(0xFF131722),
                                    side: const BorderSide(color: Color(0xFF232838)),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(Icons.receipt_long_rounded, size: 17, color: Color(0xFF3B82F6)),
                                      const SizedBox(width: 8),
                                      Text(
                                        'View All Transactions (${walletProvider.transactions.length})',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w700,
                                          fontSize: 13,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      const Icon(Icons.arrow_forward_rounded, size: 14, color: Color(0xFF3B82F6)),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),

                const SizedBox(height: 30),

                // ================= SYSTEM STATUS SECTION =================
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Text(
                          'System Status',
                          style: TextStyle(
                            color: AppColors.silverLight,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.2,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                const Color(0xFF10B981).withValues(alpha: 0.16),
                                const Color(0xFF059669).withValues(alpha: 0.08),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFF10B981).withValues(alpha: 0.35),
                              width: 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF10B981).withValues(alpha: 0.12),
                                blurRadius: 6,
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF10B981),
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: Color(0xFF10B981),
                                      blurRadius: 4,
                                      spreadRadius: 1,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 5),
                              const Text(
                                'All Systems Live',
                                style: TextStyle(
                                  color: Color(0xFF34D399),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.2,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF131724),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: const Color(0xFF222B3D),
                          width: 0.8,
                        ),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 12),
                          SizedBox(width: 4),
                          Text(
                            '99.9% Uptime',
                            style: TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 10.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // 2-Column Modern Grid of System Services
                Column(
                  children: [
                    // Row 1: MTN & Airtel
                    Row(
                      children: [
                        Expanded(
                          child: _buildSystemStatusTile(
                            name: 'MTN Network',
                            service: 'Airtime, SME & CG',
                            icon: Icons.wifi_rounded,
                            accentColor: const Color(0xFFFBBF24),
                            status: 'Operational',
                            uptime: '100%',
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildSystemStatusTile(
                            name: 'Airtel Network',
                            service: 'Airtime & Direct',
                            icon: Icons.wifi_rounded,
                            accentColor: const Color(0xFFEF4444),
                            status: 'Operational',
                            uptime: '100%',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Row 2: Glo & 9mobile
                    Row(
                      children: [
                        Expanded(
                          child: _buildSystemStatusTile(
                            name: 'Glo Network',
                            service: 'Airtime & Corporate',
                            icon: Icons.wifi_rounded,
                            accentColor: const Color(0xFF10B981),
                            status: 'Operational',
                            uptime: '99.9%',
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildSystemStatusTile(
                            name: '9mobile Network',
                            service: 'Airtime & SME Gift',
                            icon: Icons.wifi_rounded,
                            accentColor: const Color(0xFF84CC16),
                            status: 'Operational',
                            uptime: '100%',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Row 3: Utilities & Auto-Wallet Funding
                    Row(
                      children: [
                        Expanded(
                          child: _buildSystemStatusTile(
                            name: 'Bills & Cable TV',
                            service: 'Token & Decoders',
                            icon: Icons.bolt_rounded,
                            accentColor: const Color(0xFF06B6D4),
                            status: 'Operational',
                            uptime: '100%',
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _buildSystemStatusTile(
                            name: 'Auto-Funding',
                            service: 'PalmPay & Moniepoint',
                            icon: Icons.account_balance_wallet_rounded,
                            accentColor: const Color(0xFF8B5CF6),
                            status: 'Instant',
                            uptime: '100%',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Smooth Live Telemetry Bar
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [
                            Color(0xFF131826),
                            Color(0xFF0F121C),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: const Color(0xFF1F263A),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.speed_rounded, size: 15, color: Color(0xFF38BDF8)),
                              SizedBox(width: 7),
                              Text(
                                'Avg. Response: ~1.4s',
                                style: TextStyle(
                                  color: Color(0xFFE2E8F0),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          Row(
                            children: [
                              Container(
                                width: 5,
                                height: 5,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF10B981),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'Auto-checked live',
                                style: TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 36),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Modern System Status 2-Column Tile
  Widget _buildSystemStatusTile({
    required String name,
    required String service,
    required IconData icon,
    required Color accentColor,
    required String status,
    required String uptime,
  }) {
    final isInstant = status.toLowerCase() == 'instant';
    final statusColor = isInstant ? const Color(0xFF8B5CF6) : const Color(0xFF10B981);

    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF141825),
            Color(0xFF0E121B),
          ],
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: const Color(0xFF1F2538),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top row: Brand Squircle Icon + Status Live Pill
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(11),
                  border: Border.all(
                    color: accentColor.withValues(alpha: 0.35),
                    width: 0.8,
                  ),
                ),
                child: Icon(icon, color: accentColor, size: 17),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: statusColor.withValues(alpha: 0.3),
                    width: 0.8,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 5,
                      height: 5,
                      decoration: BoxDecoration(
                        color: statusColor,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: statusColor.withValues(alpha: 0.6),
                            blurRadius: 4,
                            spreadRadius: 0.8,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      status,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Service Name
          Text(
            name,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.1,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),

          // Subtitle / Scope
          Text(
            service,
            style: const TextStyle(
              color: Color(0xFF94A3B8),
              fontSize: 10.5,
              fontWeight: FontWeight.w500,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 10),

          // Micro SLA / Health Bar
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(2),
                  child: Container(
                    height: 3,
                    color: const Color(0xFF1E2536),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        height: 3,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: statusColor,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 7),
              Text(
                uptime,
                style: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 9.5,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Modern Transaction Card with Smart Icons & High-End Aesthetics
  Widget _buildTransactionCard(dynamic tx) {
    final isCredit = tx['type'] == 'credit';
    final amount = (tx['amount'] as num).toDouble();
    final desc = tx['description'] ?? 'Transaction';
    final ref = tx['reference'] ?? 'REF';
    final dateStr = tx['createdAt'] != null
        ? tx['createdAt'].toString().substring(0, 10)
        : '';

    // Smart icon & accent determination based on transaction description
    final lowerDesc = desc.toString().toLowerCase();
    IconData txIcon;
    Color txAccent;

    if (lowerDesc.contains('airtime')) {
      txIcon = Icons.phone_iphone_rounded;
      txAccent = const Color(0xFF3B82F6);
    } else if (lowerDesc.contains('data')) {
      txIcon = Icons.wifi_rounded;
      txAccent = const Color(0xFF10B981);
    } else if (lowerDesc.contains('electricity') || lowerDesc.contains('power') || lowerDesc.contains('bill')) {
      txIcon = Icons.bolt_rounded;
      txAccent = const Color(0xFFF59E0B);
    } else if (lowerDesc.contains('cable') || lowerDesc.contains('tv') || lowerDesc.contains('dstv') || lowerDesc.contains('gotv')) {
      txIcon = Icons.tv_rounded;
      txAccent = const Color(0xFF06B6D4);
    } else if (lowerDesc.contains('exam') || lowerDesc.contains('waec') || lowerDesc.contains('neco')) {
      txIcon = Icons.school_rounded;
      txAccent = const Color(0xFFA855F7);
    } else if (isCredit) {
      txIcon = Icons.arrow_downward_rounded;
      txAccent = const Color(0xFF10B981);
    } else {
      txIcon = Icons.arrow_upward_rounded;
      txAccent = const Color(0xFFF43F5E);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 12.0),
      decoration: BoxDecoration(
        color: const Color(0xFF131722),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF212738), width: 1.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.18),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          // Squircle Icon Badge
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: txAccent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(13),
              border: Border.all(
                color: txAccent.withValues(alpha: 0.22),
                width: 1,
              ),
            ),
            child: Icon(
              txIcon,
              color: txAccent,
              size: 20,
            ),
          ),
          const SizedBox(width: 13),
          // Description & Subline
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  desc,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.1,
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Ref: $ref  •  $dateStr',
                        style: TextStyle(
                          color: const Color(0xFF94A3B8).withValues(alpha: 0.8),
                          fontSize: 10.5,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          // Amount & Mini chevron
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${isCredit ? "+" : "-"}₦${amount.toStringAsFixed(2)}',
                style: TextStyle(
                  color: isCredit ? const Color(0xFF10B981) : const Color(0xFFF43F5E),
                  fontWeight: FontWeight.w800,
                  fontSize: 14.5,
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 2),
              const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircleAvatar(radius: 2.5, backgroundColor: Color(0xFF10B981)),
                  SizedBox(width: 3),
                  Text(
                    'Success',
                    style: TextStyle(
                      color: Color(0xFF10B981),
                      fontSize: 9.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// 3D Blue Leather Wallet Graphic (Matches reference image)
  Widget _build3DWalletGraphic() {
    return Transform.rotate(
      angle: -0.22, // ~-12 degrees tilt
      child: Container(
        width: 76,
        height: 72,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF001B6B).withValues(alpha: 0.60),
              blurRadius: 18,
              offset: const Offset(4, 10),
              spreadRadius: 2,
            ),
          ],
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Back body / flap layer
            Positioned(
              top: 0,
              left: 4,
              right: 4,
              height: 24,
              child: Container(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1E60E8), Color(0xFF1044B8)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFF60A5FA).withValues(alpha: 0.40),
                    width: 1.0,
                  ),
                ),
              ),
            ),
            // Main wallet front body
            Positioned(
              top: 8,
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [
                      Color(0xFF2272FF),
                      Color(0xFF1252D6),
                      Color(0xFF0B38A8),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(
                    color: const Color(0xFF93C5FD).withValues(alpha: 0.70),
                    width: 1.4,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF00227A).withValues(alpha: 0.50),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Stack(
                  children: [
                    // Top highlight sheen
                    Positioned(
                      top: 1.5,
                      left: 10,
                      right: 10,
                      child: Container(
                        height: 1.2,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.white.withValues(alpha: 0.0),
                              Colors.white.withValues(alpha: 0.75),
                              Colors.white.withValues(alpha: 0.0),
                            ],
                          ),
                        ),
                      ),
                    ),
                    // Wallet closure strap & snap button
                    Positioned(
                      right: -1,
                      top: 18,
                      child: Container(
                        width: 32,
                        height: 22,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF2E7BFF), Color(0xFF1557E0)],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(11),
                            bottomLeft: Radius.circular(11),
                            topRight: Radius.circular(5),
                            bottomRight: Radius.circular(5),
                          ),
                          border: Border.all(
                            color: const Color(0xFF93C5FD).withValues(alpha: 0.85),
                            width: 1.2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.35),
                              blurRadius: 5,
                              offset: const Offset(-2, 2),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Container(
                            width: 11,
                            height: 11,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                colors: [Color(0xFF60A5FA), Color(0xFF2563EB)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.90),
                                width: 1.0,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF38BDF8).withValues(alpha: 0.8),
                                  blurRadius: 4,
                                  spreadRadius: 0.5,
                                ),
                              ],
                            ),
                          ),
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
}

/// Modern fintech service card with soft ambient glow, squircle icon, pill badge and circular forward button
class _ModernServiceCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String badgeText;
  final IconData icon;
  final Color accentColor;
  final VoidCallback onTap;

  const _ModernServiceCard({
    required this.title,
    required this.subtitle,
    required this.badgeText,
    required this.icon,
    required this.accentColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        splashColor: accentColor.withValues(alpha: 0.15),
        highlightColor: accentColor.withValues(alpha: 0.08),
        child: Ink(
          decoration: BoxDecoration(
            color: const Color(0xFF131722),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: const Color(0xFF232838),
              width: 1.0,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.25),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(22),
            child: Stack(
              children: [
                // Soft ambient glow in top-right corner
                Positioned(
                  top: -20,
                  right: -20,
                  child: Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          accentColor.withValues(alpha: 0.22),
                          accentColor.withValues(alpha: 0.0),
                        ],
                      ),
                    ),
                  ),
                ),
                // Card content
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top row: Squircle Icon + Badge
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              color: accentColor.withValues(alpha: 0.14),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: accentColor.withValues(alpha: 0.22),
                                width: 1,
                              ),
                            ),
                            child: Icon(
                              icon,
                              color: accentColor,
                              size: 21,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
                            decoration: BoxDecoration(
                              color: accentColor.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: accentColor.withValues(alpha: 0.22),
                                width: 0.8,
                              ),
                            ),
                            child: Text(
                              badgeText,
                              style: TextStyle(
                                color: accentColor,
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.6,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const Spacer(),
                      // Bottom row: Title & Subtitle on left, Circular Arrow on right
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  title,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: -0.2,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  subtitle,
                                  style: TextStyle(
                                    color: const Color(0xFF94A3B8).withValues(alpha: 0.85),
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            width: 26,
                            height: 26,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: accentColor.withValues(alpha: 0.12),
                              border: Border.all(
                                color: accentColor.withValues(alpha: 0.20),
                                width: 0.8,
                              ),
                            ),
                            child: Icon(
                              Icons.arrow_forward_rounded,
                              size: 13,
                              color: accentColor,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Organic 3D fluid gradient curves for the wallet card background
class _WalletFluidCurvesPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // 1. Ambient soft glow on the right
    final glowPaint = Paint()
      ..shader = RadialGradient(
        center: const Alignment(0.85, 0.4),
        radius: 0.9,
        colors: [
          const Color(0xFF0077FF).withValues(alpha: 0.45),
          const Color(0xFF0044CC).withValues(alpha: 0.15),
          Colors.transparent,
        ],
        stops: const [0.0, 0.5, 1.0],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), glowPaint);

    // 2. Large organic fluid wave
    final wavePath1 = Path();
    wavePath1.moveTo(size.width * 0.40, size.height);
    wavePath1.cubicTo(
      size.width * 0.52,
      size.height * 0.68,
      size.width * 0.60,
      size.height * 0.36,
      size.width * 0.78,
      size.height * 0.42,
    );
    wavePath1.cubicTo(
      size.width * 0.88,
      size.height * 0.46,
      size.width * 0.92,
      size.height * 0.65,
      size.width,
      size.height * 0.60,
    );
    wavePath1.lineTo(size.width, size.height);
    wavePath1.close();

    final wavePaint1 = Paint()
      ..shader = LinearGradient(
        colors: [
          const Color(0xFF0066FF).withValues(alpha: 0.35),
          const Color(0xFF0040D0).withValues(alpha: 0.20),
        ],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(Rect.fromLTWH(size.width * 0.4, 0, size.width * 0.6, size.height));

    canvas.drawPath(wavePath1, wavePaint1);

    // 3. Secondary overlapping organic fluid wave
    final wavePath2 = Path();
    wavePath2.moveTo(size.width * 0.55, size.height);
    wavePath2.cubicTo(
      size.width * 0.68,
      size.height * 0.75,
      size.width * 0.72,
      size.height * 0.52,
      size.width * 0.88,
      size.height * 0.68,
    );
    wavePath2.cubicTo(
      size.width * 0.95,
      size.height * 0.75,
      size.width * 0.98,
      size.height * 0.85,
      size.width,
      size.height * 0.82,
    );
    wavePath2.lineTo(size.width, size.height);
    wavePath2.close();

    final wavePaint2 = Paint()
      ..shader = LinearGradient(
        colors: [
          const Color(0xFF0088FF).withValues(alpha: 0.28),
          const Color(0xFF0050E0).withValues(alpha: 0.15),
        ],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(Rect.fromLTWH(size.width * 0.5, 0, size.width * 0.5, size.height));

    canvas.drawPath(wavePath2, wavePaint2);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

