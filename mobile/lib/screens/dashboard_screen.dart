import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/wallet_provider.dart';
import '../services/push_notification_service.dart';
import '../theme/app_theme.dart';
import 'home_tab.dart';
import 'services_tab.dart';
import 'transactions_tab.dart';
import 'agent_tab.dart';
import 'profile_tab.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;

  List<Widget> get _tabs => const [
    HomeTab(),
    ServicesTab(),
    TransactionsTab(),
    AgentTab(),
    ProfileTab(),
  ];

  @override
  void initState() {
    super.initState();
    // High-speed parallel initialization & background prefetching
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final wallet = Provider.of<WalletProvider>(context, listen: false);
      final auth = Provider.of<AuthProvider>(context, listen: false);

      Future.wait([
        wallet.fetchWalletData(),
        auth.fetchProfile(),
        wallet.fetchDataPlans(), // Prefetched in background so Buy Data loads instantly!
        wallet.fetchAirtimePricing(), // Prefetched in background so Airtime loads instantly!
      ]);
      PushNotificationService().syncTokenWithBackend();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _tabs,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF0F131E),
          border: Border(
            top: BorderSide(
              color: Color(0xFF1E2536),
              width: 1.0,
            ),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          elevation: 0,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
            // Refresh data when toggling between tabs
            if (index == 0 || index == 2) {
              Provider.of<WalletProvider>(context, listen: false).fetchWalletData();
            } else if (index == 3 || index == 4) {
              Provider.of<AuthProvider>(context, listen: false).fetchProfile();
            }
          },
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.transparent,
          selectedItemColor: const Color(0xFF3B82F6),
          unselectedItemColor: const Color(0xFF64748B),
          selectedLabelStyle: const TextStyle(
            fontFamily: 'Inter',
            fontWeight: FontWeight.w700,
            fontSize: 11.5,
          ),
          unselectedLabelStyle: const TextStyle(
            fontFamily: 'Inter',
            fontSize: 11,
          ),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home_rounded),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.grid_view_outlined),
              activeIcon: Icon(Icons.grid_view_rounded),
              label: 'Services',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.receipt_long_outlined),
              activeIcon: Icon(Icons.receipt_long_rounded),
              label: 'Transactions',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.badge_outlined),
              activeIcon: Icon(Icons.badge_rounded),
              label: 'Agent',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline_rounded),
              activeIcon: Icon(Icons.person_rounded),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
