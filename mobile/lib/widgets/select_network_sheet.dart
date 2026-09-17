import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/wallet_provider.dart';
import '../screens/buy_data_screen.dart';

class SelectNetworkSheet extends StatelessWidget {
  const SelectNetworkSheet({super.key});

  /// Displays the Select Network bottom sheet modal matching user's reference design
  static void show(BuildContext context) {
    // Proactively prefetch data plans while user is choosing network
    try {
      final wallet = Provider.of<WalletProvider>(context, listen: false);
      if (wallet.cachedDataPlans.isEmpty) {
        wallet.fetchDataPlans();
      }
    } catch (_) {}

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0D111D),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
      builder: (_) => const SelectNetworkSheet(),
    );
  }

  void _selectNetwork(BuildContext context, String network) {
    Navigator.pop(context);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BuyDataScreen(
          initialNetwork: network,
          lockNetwork: true,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 18,
          bottom: MediaQuery.of(context).viewInsets.bottom + 26,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ================= HEADER ROW =================
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: const Color(0xFF2E384D),
                          width: 1,
                        ),
                      ),
                      child: const Icon(
                        Icons.wifi_rounded,
                        color: Color(0xFF38BDF8),
                        size: 21,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Buy Data',
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
                    onTap: () => Navigator.pop(context),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: const Color(0xFF192033),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: const Color(0xFF263048),
                          width: 0.8,
                        ),
                      ),
                      child: const Icon(
                        Icons.close_rounded,
                        color: Colors.white70,
                        size: 18,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // "← Close" back link in blue
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => Navigator.pop(context),
                borderRadius: BorderRadius.circular(6),
                child: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.arrow_back_rounded,
                        size: 14,
                        color: Color(0xFF3B82F6),
                      ),
                      SizedBox(width: 4),
                      Text(
                        'Close',
                        style: TextStyle(
                          color: Color(0xFF3B82F6),
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 18),

            // Section label: SELECT NETWORK PROVIDER
            const Text(
              'SELECT NETWORK PROVIDER',
              style: TextStyle(
                color: Color(0xFF8E98AB),
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 14),

            // ================= 2x2 NETWORK GRID =================
            // Row 1: MTN & Airtel
            Row(
              children: [
                Expanded(
                  child: _buildNetworkCard(
                    context: context,
                    name: 'MTN',
                    accentColor: const Color(0xFFFBBF24),
                    icon: Icons.language_rounded,
                    onTap: () => _selectNetwork(context, 'MTN'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildNetworkCard(
                    context: context,
                    name: 'Airtel',
                    accentColor: const Color(0xFFEF4444),
                    icon: Icons.language_rounded,
                    onTap: () => _selectNetwork(context, 'Airtel'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Row 2: Glo & 9mobile
            Row(
              children: [
                Expanded(
                  child: _buildNetworkCard(
                    context: context,
                    name: 'Glo',
                    accentColor: const Color(0xFF10B981),
                    icon: Icons.language_rounded,
                    onTap: () => _selectNetwork(context, 'Glo'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildNetworkCard(
                    context: context,
                    name: '9mobile',
                    accentColor: const Color(0xFF84CC16),
                    icon: Icons.language_rounded,
                    onTap: () => _selectNetwork(context, '9mobile'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// Builds a single 2x2 Network Provider Card matching the user's reference image
  Widget _buildNetworkCard({
    required BuildContext context,
    required String name,
    required Color accentColor,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF141826),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: const Color(0xFF1F2638),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.25),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Squircle network icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: accentColor.withValues(alpha: 0.35),
                    width: 0.8,
                  ),
                ),
                child: Icon(
                  icon,
                  color: accentColor,
                  size: 24,
                ),
              ),
              const SizedBox(height: 12),

              // Network Name
              Text(
                name,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
