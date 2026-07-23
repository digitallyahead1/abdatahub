import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'theme/app_theme.dart';
import 'providers/theme_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/wallet_provider.dart';
import 'screens/welcome_screen.dart';
import 'screens/dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.load(fileName: ".env");
  } catch (e) {
    print("Error loading .env file: $e");
  }
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => WalletProvider()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          return MaterialApp(
            title: 'AB Data Hub',
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeProvider.themeMode,
            debugShowCheckedModeBanner: false,
            home: const AuthWrapper(),
          );
        },
      ),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  void _checkAuth() async {
    bool isAuthenticated = false;
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      isAuthenticated = await authProvider.checkAuthStatus().timeout(
        const Duration(seconds: 4),
        onTimeout: () {
          debugPrint('Auth check timed out — proceeding to welcome screen');
          return false;
        },
      );
    } catch (e) {
      debugPrint('Auth check error: $e');
      isAuthenticated = false;
    }

    if (!mounted) return;

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => isAuthenticated ? const DashboardScreen() : const WelcomeScreen(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0B0F1A) : const Color(0xFFF8FAFC),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Glowing brand logo container
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.accentGlow.withValues(alpha: 0.15),
                    blurRadius: 20,
                    offset: const Offset(0, 5),
                  )
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Image.asset(
                  'assets/images/logo.png',
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: const Color(0xFF1E293B),
                      child: const Center(
                        child: Icon(
                          Icons.cell_tower,
                          color: Color(0xFF3B82F6),
                          size: 48,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'AB Data Hub',
              style: TextStyle(
                color: isDark ? const Color(0xFFF5F7FA) : const Color(0xFF0F172A),
                fontSize: 26,
                fontWeight: FontWeight.bold,
                fontFamily: 'Poppins',
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'The Pride of Data',
              style: TextStyle(
                color: isDark ? const Color(0xFFD9DDE4) : const Color(0xFF475569),
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 40),
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: AppColors.accentGlow,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
