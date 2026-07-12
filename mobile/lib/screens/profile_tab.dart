import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';


class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  void _copyToClipboard(BuildContext context, String text, String message) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.success,
      ),
    );
  }

  void _logout(BuildContext context) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    await auth.logout();
    if (context.mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  void _launchURL(BuildContext context, String urlString) async {
    final Uri url = Uri.parse(urlString);
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Could not launch $urlString'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    final name = user?['fullName'] ?? 'User';
    final email = user?['email'] ?? 'No email';
    final phone = user?['phoneNumber'] ?? 'No phone';
    final refCode = user?['referralCode'] ?? 'ABDATAHUB';
    
    // Construct unique referral link
    final refLink = 'http://localhost:3000/register?ref=$refCode';

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
          child: Column(
            children: [
              // User Avatar Card
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 90,
                      height: 90,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [AppColors.primaryBlue, AppColors.accentGlow],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primaryBlue.withValues(alpha: 0.25),
                            blurRadius: 15,
                            offset: const Offset(0, 5),
                          )
                        ],
                      ),
                      child: Center(
                        child: Text(
                          name.isNotEmpty ? name[0].toUpperCase() : 'U',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 36,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      name,
                      style: TextStyle(
                        color: AppColors.silverLight,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Poppins',
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      email,
                      style: TextStyle(
                        color: AppColors.silverMuted,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),

              // Referral Section Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.darkBgSecondary, const Color(0xFF0F172A)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppColors.accentGlow.withValues(alpha: 0.15),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.card_giftcard, color: AppColors.accentGlow, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Refer and Earn ₦500!',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Share your unique referral link below. Get ₦500 immediately when your friend signs up and funds their wallet for the first time.',
                      style: TextStyle(
                        color: AppColors.silverMuted,
                        fontSize: 11,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: AppColors.darkBg,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.silverMuted.withValues(alpha: 0.1)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              refLink,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: AppColors.accentGlow,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          GestureDetector(
                            onTap: () => _copyToClipboard(
                              context,
                              refLink,
                              'Referral link copied to clipboard!',
                            ),
                            child: Icon(
                              Icons.copy,
                              color: AppColors.silverLight,
                              size: 18,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    Center(
                      child: Text(
                        'Your Referral Code: $refCode',
                        style: TextStyle(
                          color: AppColors.silverLight,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Profile Details List
              Container(
                decoration: BoxDecoration(
                  color: AppColors.darkBgSecondary,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.silverMuted.withValues(alpha: 0.05)),
                ),
                child: Column(
                  children: [
                    _buildProfileTile(
                      icon: Provider.of<ThemeProvider>(context).themeMode == ThemeMode.dark
                          ? Icons.dark_mode_outlined
                          : Icons.light_mode_outlined,
                      title: 'Theme Mode',
                      value: Provider.of<ThemeProvider>(context).themeMode == ThemeMode.dark
                          ? 'Dark Mode'
                          : 'Light Mode',
                      onTap: () => Provider.of<ThemeProvider>(context, listen: false).toggleTheme(),
                    ),
                    const Divider(height: 1, color: Color(0xFF1F2937)),
                    _buildProfileTile(
                      icon: Icons.phone_android,
                      title: 'Phone Number',
                      value: phone,
                    ),
                    const Divider(height: 1, color: Color(0xFF1F2937)),
                    _buildProfileTile(
                      icon: Icons.support_agent,
                      title: 'Support Desk',
                      value: '07045357195',
                      onTap: () => _copyToClipboard(
                        context,
                        '07045357195',
                        'Customer Care line copied!',
                      ),
                    ),
                    const Divider(height: 1, color: Color(0xFF1F2937)),
                    _buildProfileTile(
                      icon: Icons.alternate_email_outlined,
                      title: 'Twitter / X',
                      value: '@asserdiq360',
                      onTap: () => _launchURL(context, 'https://x.com/asserdiq360'),
                    ),
                    const Divider(height: 1, color: Color(0xFF1F2937)),
                    _buildProfileTile(
                      icon: Icons.facebook_outlined,
                      title: 'Facebook Page',
                      value: 'AB Data Hub',
                      onTap: () => _launchURL(context, 'https://www.facebook.com/share/1JD9G8vaVH/'),
                    ),
                    const Divider(height: 1, color: Color(0xFF1F2937)),
                    _buildProfileTile(
                      icon: Icons.info_outline,
                      title: 'App Version',
                      value: 'v1.0.0 (Beta)',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 36),

              // Logout Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: OutlinedButton.icon(
                  onPressed: () => _logout(context),
                  icon: const Icon(Icons.logout, color: AppColors.error),
                  label: const Text(
                    'Logout Account',
                    style: TextStyle(
                      color: AppColors.error,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.error),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileTile({
    required IconData icon,
    required String title,
    required String value,
    VoidCallback? onTap,
  }) {
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, color: AppColors.primaryBlue),
      title: Text(
        title,
        style: TextStyle(
          color: AppColors.silverMuted,
          fontSize: 12,
        ),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            value,
            style: TextStyle(
              color: AppColors.silverLight,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
          if (onTap != null) ...[
            const SizedBox(width: 8),
            Icon(
              Icons.chevron_right,
              color: AppColors.silverMuted.withValues(alpha: 0.5),
              size: 16,
            )
          ]
        ],
      ),
    );
  }
}
