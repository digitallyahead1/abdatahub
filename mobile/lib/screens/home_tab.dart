import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/wallet_provider.dart';
import '../theme/app_theme.dart';
import 'buy_data_screen.dart';
import 'buy_airtime_screen.dart';
import 'electricity_screen.dart';
import 'cable_screen.dart';
import 'exam_pins_screen.dart';
import 'wallet_tab.dart';
import '../widgets/transaction_details_sheet.dart';


class HomeTab extends StatelessWidget {
  const HomeTab({super.key});

  void _navigateToService(BuildContext context, Widget screen) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => screen),
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
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Hi, $userName 👋',
                          style: TextStyle(
                            color: AppColors.silverLight,
                            fontSize: 20,
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
                    // Logo Badge
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppColors.darkBgSecondary,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.silverMuted.withValues(alpha: 0.1)),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.asset(
                          'assets/images/logo.png',
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Wallet Neon Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24.0),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0066E8), Color(0xFF0B0F1A)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: AppColors.accentGlow.withValues(alpha: 0.3),
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primaryBlue.withValues(alpha: 0.2),
                        blurRadius: 25,
                        spreadRadius: -5,
                        offset: const Offset(0, 10),
                      )
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'AVAILABLE BALANCE',
                        style: TextStyle(
                          color: AppColors.silverMuted,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      walletProvider.isLoading
                          ? const SizedBox(
                              height: 38,
                              width: 38,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Text(
                              '₦${walletProvider.balance.toStringAsFixed(2)}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Poppins',
                              ),
                            ),
                      const SizedBox(height: 18),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Ledger Balance',
                                style: TextStyle(
                                  color: AppColors.silverMuted,
                                  fontSize: 11,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '₦${walletProvider.ledgerBalance.toStringAsFixed(2)}',
                                style: TextStyle(
                                  color: AppColors.silverLight,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                'Referral Commission',
                                style: TextStyle(
                                  color: AppColors.silverMuted,
                                  fontSize: 11,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '₦${walletProvider.referralEarnings.toStringAsFixed(2)}',
                                style: const TextStyle(
                                  color: AppColors.success,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                // Quick Services Section
                Text(
                  'Quick Services',
                  style: TextStyle(
                    color: AppColors.silverLight,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                GridView.count(
                  crossAxisCount: 3,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.95,
                  children: [
                    _buildServiceItem(
                      context,
                      'Fund Wallet',
                      Icons.account_balance_wallet_rounded,
                      Colors.teal,
                      const WalletTab(),
                    ),
                    _buildServiceItem(
                      context,
                      'Buy Data',
                      Icons.signal_cellular_alt_rounded,
                      Colors.orange,
                      const BuyDataScreen(),
                    ),
                    _buildServiceItem(
                      context,
                      'Airtime',
                      Icons.phone_android_rounded,
                      Colors.green,
                      const BuyAirtimeScreen(),
                    ),
                    _buildServiceItem(
                      context,
                      'Cable TV',
                      Icons.tv_rounded,
                      Colors.blue,
                      const CableScreen(),
                    ),
                    _buildServiceItem(
                      context,
                      'Electricity',
                      Icons.bolt_rounded,
                      Colors.yellow,
                      const ElectricityScreen(),
                    ),
                    _buildServiceItem(
                      context,
                      'Exam Pins',
                      Icons.school_rounded,
                      Colors.purple,
                      const ExamPinsScreen(),
                    ),
                  ],
                ),
                const SizedBox(height: 28),

                // Recent Transactions List Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Recent Activity',
                      style: TextStyle(
                        color: AppColors.silverLight,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (walletProvider.transactions.isNotEmpty)
                      Text(
                        'Swipe to refresh',
                        style: TextStyle(
                          color: AppColors.silverMuted,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),

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
                            padding: const EdgeInsets.symmetric(vertical: 40.0),
                            decoration: BoxDecoration(
                              color: AppColors.darkBgSecondary,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.receipt_long, size: 48, color: AppColors.silverMuted),
                                const SizedBox(height: 12),
                                Text(
                                  'No transactions yet',
                                  style: TextStyle(color: AppColors.silverMuted),
                                ),
                              ],
                            ),
                          )
                        : ListView.separated(
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
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildServiceItem(
    BuildContext context,
    String title,
    IconData icon,
    Color color,
    Widget targetScreen,
  ) {
    return GestureDetector(
      onTap: () => _navigateToService(context, targetScreen),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.darkBgSecondary,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: AppColors.silverMuted.withValues(alpha: 0.05),
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: color,
                size: 26,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.silverLight,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTransactionCard(dynamic tx) {
    final isCredit = tx['type'] == 'credit';
    final amount = (tx['amount'] as num).toDouble();
    final desc = tx['description'] ?? 'Transaction';
    final ref = tx['reference'] ?? 'REF';
    final dateStr = tx['createdAt'] != null
        ? tx['createdAt'].toString().substring(0, 10)
        : '';

    return Container(
      padding: const EdgeInsets.all(14.0),
      decoration: BoxDecoration(
        color: AppColors.darkBgSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.silverMuted.withValues(alpha: 0.05)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isCredit
                  ? AppColors.success.withValues(alpha: 0.1)
                  : AppColors.error.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isCredit ? Icons.arrow_downward : Icons.arrow_upward,
              color: isCredit ? AppColors.success : AppColors.error,
              size: 20,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  desc,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: AppColors.silverLight,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Ref: $ref  •  $dateStr',
                  style: TextStyle(
                    color: AppColors.silverMuted.withValues(alpha: 0.6),
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '${isCredit ? "+" : "-"}₦${amount.toStringAsFixed(2)}',
            style: TextStyle(
              color: isCredit ? AppColors.success : AppColors.error,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}
