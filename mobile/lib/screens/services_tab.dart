import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'buy_data_screen.dart';
import 'buy_airtime_screen.dart';
import 'electricity_screen.dart';
import 'cable_screen.dart';
import 'exam_pins_screen.dart';

class ServicesTab extends StatelessWidget {
  const ServicesTab({Key? key}) : super(key: key);

  void _navigateToScreen(BuildContext context, Widget screen) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('VTU Services'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Utility & Telecommunications',
              style: TextStyle(
                color: AppColors.silverLight,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildServiceRow(
              context,
              'Mobile Data Subscription',
              'Purchase high-speed internet bundles for MTN, Airtel, Glo, and 9mobile.',
              Icons.signal_cellular_alt,
              Colors.orange,
              const BuyDataScreen(),
            ),
            const SizedBox(height: 12),
            _buildServiceRow(
              context,
              'Airtime Recharge',
              'Instantly top up airtime credit for any mobile network number.',
              Icons.phone_android,
              Colors.green,
              const BuyAirtimeScreen(),
            ),
            const SizedBox(height: 24),
            const Text(
              'Bills & Subscriptions',
              style: TextStyle(
                color: AppColors.silverLight,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildServiceRow(
              context,
              'Cable TV Subscription',
              'Renew DSTV, GOTV, and StarTimes subscription packages instantly.',
              Icons.tv,
              Colors.blue,
              const CableScreen(),
            ),
            const SizedBox(height: 12),
            _buildServiceRow(
              context,
              'Electricity Bill Tokens',
              'Purchase prepaid tokens and pay utility bills for all DisCos.',
              Icons.bolt,
              Colors.yellow,
              const ElectricityScreen(),
            ),
            const SizedBox(height: 24),
            const Text(
              'Education & Business',
              style: TextStyle(
                color: AppColors.silverLight,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildServiceRow(
              context,
              'Exam Result Checkers',
              'WAEC, NECO, JAMB result checker tokens and registration pins.',
              Icons.school,
              Colors.purple,
              const ExamPinsScreen(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildServiceRow(
    BuildContext context,
    String title,
    String description,
    IconData icon,
    Color color,
    Widget targetScreen,
  ) {
    return GestureDetector(
      onTap: () => _navigateToScreen(context, targetScreen),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.darkBgSecondary,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: AppColors.silverMuted.withOpacity(0.05),
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: color,
                size: 28,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: AppColors.silverLight,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: TextStyle(
                      color: AppColors.silverMuted.withOpacity(0.8),
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              Icons.chevron_right,
              color: AppColors.silverMuted.withOpacity(0.6),
            ),
          ],
        ),
      ),
    );
  }
}
