import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/biometric_service.dart';
import '../theme/app_theme.dart';
import 'register_screen.dart';
import 'dashboard_screen.dart';
import 'forgot_password_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _canUseBiometrics = false;

  @override
  void initState() {
    super.initState();
    _checkBiometrics();
  }

  void _checkBiometrics() async {
    final bio = BiometricService();
    final savedId = await bio.getSavedIdentifier();
    if (mounted && savedId != null && savedId.isNotEmpty && _emailController.text.isEmpty) {
      setState(() {
        _emailController.text = savedId;
      });
    }
  }

  void _handleBiometricTap() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.isLoading) return;

    final bio = BiometricService();
    final hasCreds = await bio.hasSavedCredentials();

    if (hasCreds) {
      _loginWithBiometrics();
    } else {
      _showBiometricInfoModal();
    }
  }

  void _loginWithBiometrics() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.isLoading) return;

    final success = await auth.loginWithBiometrics();
    if (mounted) {
      if (success) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const DashboardScreen()),
        );
      } else if (auth.errorMessage != null && auth.errorMessage!.isNotEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(auth.errorMessage!),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _showBiometricInfoModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        final emailFilled = _emailController.text.trim().isNotEmpty;
        final passFilled = _passwordController.text.isNotEmpty;

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          decoration: BoxDecoration(
            color: const Color(0xFF070E20),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border.all(
              color: const Color(0xFF00A3FF).withValues(alpha: 0.25),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0052FF).withValues(alpha: 0.35),
                blurRadius: 30,
                offset: const Offset(0, -6),
              ),
            ],
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 20),
                // Glowing Biometrics Icon Badge
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0052FF), Color(0xFF00A3FF)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0052FF).withValues(alpha: 0.55),
                        blurRadius: 20,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.fingerprint_rounded,
                      color: Colors.white,
                      size: 36,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Biometric Authentication',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    fontFamily: 'Poppins',
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Sign in seamlessly with your Fingerprint, Touch ID, or Face ID.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 13.5,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0D1B36),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: const Color(0xFF00A3FF).withValues(alpha: 0.15),
                    ),
                  ),
                  child: Column(
                    children: [
                      _buildSetupStep(
                        icon: Icons.vpn_key_outlined,
                        step: '1',
                        title: 'Sign In with Password',
                        description: 'Log in once with your email or phone number and password.',
                      ),
                      const SizedBox(height: 12),
                      _buildSetupStep(
                        icon: Icons.security_rounded,
                        step: '2',
                        title: 'Auto-Activated',
                        description: 'Your biometric login is securely linked to this device.',
                      ),
                      const SizedBox(height: 12),
                      _buildSetupStep(
                        icon: Icons.fingerprint,
                        step: '3',
                        title: 'Instant 1-Tap Access',
                        description: 'Use the Biometric button anytime for swift sign-in!',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                if (emailFilled && passFilled) ...[
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        _submit();
                      },
                      icon: const Icon(Icons.fingerprint, color: Colors.white, size: 20),
                      label: const Text(
                        'Sign In & Save Biometrics',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0052FF),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(ctx).pop(),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: const Color(0xFF00A3FF).withValues(alpha: 0.3)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text(
                      'Got It, Sign In with Password',
                      style: TextStyle(color: Color(0xFF00A3FF), fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSetupStep({
    required IconData icon,
    required String step,
    required String title,
    required String description,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: const Color(0xFF0052FF).withValues(alpha: 0.25),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFF00A3FF).withValues(alpha: 0.3)),
          ),
          child: Center(
            child: Icon(icon, color: const Color(0xFF00A3FF), size: 16),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                description,
                style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 11.5,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final email = _emailController.text.trim();
    final pass = _passwordController.text;
    final success = await auth.login(
      email,
      pass,
    );

    if (mounted) {
      if (success) {
        // Auto-save credentials so biometric is ready
        final bio = BiometricService();
        await bio.saveCredentials(identifier: email, password: pass);
        await bio.setBiometricEnabled(true);

        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const DashboardScreen()),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(auth.errorMessage ?? 'Login failed'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFF040814),
      body: Stack(
        children: [
          // Background Blue Light Glow (Top-Left Beam)
          Positioned(
            top: -70,
            left: -70,
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF0052FF).withValues(alpha: 0.50),
                    const Color(0xFF00A3FF).withValues(alpha: 0.15),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // Right Background Dot-Matrix Graphics Grid
          Positioned(
            top: 70,
            right: 20,
            child: Opacity(
              opacity: 0.30,
              child: SizedBox(
                width: 70,
                height: 80,
                child: GridView.builder(
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 5,
                    crossAxisSpacing: 6,
                    mainAxisSpacing: 6,
                  ),
                  itemCount: 25,
                  itemBuilder: (context, index) {
                    return Container(
                      decoration: const BoxDecoration(
                        color: Color(0xFF00A3FF),
                        shape: BoxShape.circle,
                      ),
                    );
                  },
                ),
              ),
            ),
          ),

          // Bottom Background Blue Ambient Wave Glow
          Positioned(
            bottom: -60,
            right: -60,
            left: -60,
            child: Container(
              height: 220,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF0038FF).withValues(alpha: 0.35),
                    const Color(0xFF0052FF).withValues(alpha: 0.10),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // Main Scrollable Content
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minHeight: constraints.maxHeight),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
                      child: IntrinsicHeight(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 12),

                            // ================= BRAND LOGO & HEADER =================
                            Center(
                              child: Column(
                                children: [
                                  // Logo Container with Vibrant Blue Outer Glow
                                  Container(
                                    width: 82,
                                    height: 82,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF070E20),
                                      borderRadius: BorderRadius.circular(24),
                                      border: Border.all(
                                        color: const Color(0xFF00A3FF).withValues(alpha: 0.50),
                                        width: 1.2,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFF0052FF).withValues(alpha: 0.50),
                                          blurRadius: 26,
                                          spreadRadius: 2,
                                          offset: const Offset(0, 8),
                                        ),
                                      ],
                                    ),
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(24),
                                      child: Image.asset(
                                        'assets/images/logo.png',
                                        fit: BoxFit.cover,
                                        errorBuilder: (context, error, stackTrace) {
                                          return const Center(
                                            child: Icon(
                                              Icons.cell_tower,
                                              color: Color(0xFF00A3FF),
                                              size: 40,
                                            ),
                                          );
                                        },
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 14),

                                  // Brand Title (AB Data Hub)
                                  RichText(
                                    text: const TextSpan(
                                      children: [
                                        TextSpan(
                                          text: 'AB ',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 26,
                                            fontWeight: FontWeight.w900,
                                            fontFamily: 'Poppins',
                                            letterSpacing: -0.5,
                                          ),
                                        ),
                                        TextSpan(
                                          text: 'Data Hub',
                                          style: TextStyle(
                                            color: Color(0xFF00A3FF),
                                            fontSize: 26,
                                            fontWeight: FontWeight.w900,
                                            fontFamily: 'Poppins',
                                            letterSpacing: -0.5,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 6),

                                  // Tagline with Accent Lines
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Container(
                                        width: 22,
                                        height: 1.2,
                                        color: const Color(0xFF00A3FF).withValues(alpha: 0.5),
                                      ),
                                      const SizedBox(width: 8),
                                      const Text(
                                        'The Pride of Data',
                                        style: TextStyle(
                                          color: Color(0xFF94A3B8),
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          letterSpacing: 0.6,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Container(
                                        width: 22,
                                        height: 1.2,
                                        color: const Color(0xFF00A3FF).withValues(alpha: 0.5),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 36),

                            // ================= GREETING TITLE =================
                            RichText(
                              text: const TextSpan(
                                children: [
                                  TextSpan(
                                    text: 'Welcome ',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 28,
                                      fontWeight: FontWeight.w900,
                                      fontFamily: 'Poppins',
                                      letterSpacing: -0.5,
                                    ),
                                  ),
                                  TextSpan(
                                    text: 'Back',
                                    style: TextStyle(
                                      color: Color(0xFF00A3FF),
                                      fontSize: 28,
                                      fontWeight: FontWeight.w900,
                                      fontFamily: 'Poppins',
                                      letterSpacing: -0.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Sign in to continue managing your VTU services',
                              style: TextStyle(
                                color: Color(0xFF94A3B8),
                                fontSize: 13.5,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 24),

                            // ================= FORM FIELDS =================
                            Form(
                              key: _formKey,
                              child: Column(
                                children: [
                                  // Email / Phone Field
                                  TextFormField(
                                    controller: _emailController,
                                    style: const TextStyle(color: Colors.white, fontSize: 14),
                                    decoration: InputDecoration(
                                      hintText: 'Email Address or Phone Number',
                                      hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 13.5),
                                      filled: true,
                                      fillColor: const Color(0xFF0B1426),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                                      prefixIcon: Padding(
                                        padding: const EdgeInsets.all(8.0),
                                        child: Container(
                                          width: 38,
                                          height: 38,
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF0052FF),
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: const Icon(
                                            Icons.email_rounded,
                                            color: Colors.white,
                                            size: 19,
                                          ),
                                        ),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(16),
                                        borderSide: BorderSide(
                                          color: const Color(0xFF00A3FF).withValues(alpha: 0.22),
                                          width: 1.2,
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(16),
                                        borderSide: const BorderSide(
                                          color: Color(0xFF00A3FF),
                                          width: 1.6,
                                        ),
                                      ),
                                      errorBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(16),
                                        borderSide: const BorderSide(
                                          color: Color(0xFFEF4444),
                                          width: 1.2,
                                        ),
                                      ),
                                      focusedErrorBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(16),
                                        borderSide: const BorderSide(
                                          color: Color(0xFFEF4444),
                                          width: 1.6,
                                        ),
                                      ),
                                    ),
                                    validator: (value) {
                                      if (value == null || value.trim().isEmpty) {
                                        return 'Please enter your email or phone number';
                                      }
                                      return null;
                                    },
                                  ),
                                  const SizedBox(height: 16),

                                  // Password Field
                                  TextFormField(
                                    controller: _passwordController,
                                    obscureText: _obscurePassword,
                                    style: const TextStyle(color: Colors.white, fontSize: 14),
                                    decoration: InputDecoration(
                                      hintText: 'Password',
                                      hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 13.5),
                                      filled: true,
                                      fillColor: const Color(0xFF0B1426),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                                      prefixIcon: Padding(
                                        padding: const EdgeInsets.all(8.0),
                                        child: Container(
                                          width: 38,
                                          height: 38,
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF0052FF),
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: const Icon(
                                            Icons.lock_rounded,
                                            color: Colors.white,
                                            size: 19,
                                          ),
                                        ),
                                      ),
                                      suffixIcon: IconButton(
                                        icon: Icon(
                                          _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                          color: const Color(0xFF94A3B8),
                                          size: 20,
                                        ),
                                        onPressed: () {
                                          setState(() {
                                            _obscurePassword = !_obscurePassword;
                                          });
                                        },
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(16),
                                        borderSide: BorderSide(
                                          color: const Color(0xFF00A3FF).withValues(alpha: 0.22),
                                          width: 1.2,
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(16),
                                        borderSide: const BorderSide(
                                          color: Color(0xFF00A3FF),
                                          width: 1.6,
                                        ),
                                      ),
                                      errorBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(16),
                                        borderSide: const BorderSide(
                                          color: Color(0xFFEF4444),
                                          width: 1.2,
                                        ),
                                      ),
                                      focusedErrorBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(16),
                                        borderSide: const BorderSide(
                                          color: Color(0xFFEF4444),
                                          width: 1.6,
                                        ),
                                      ),
                                    ),
                                    validator: (value) {
                                      if (value == null || value.isEmpty) {
                                        return 'Please enter your password';
                                      }
                                      return null;
                                    },
                                  ),
                                  const SizedBox(height: 8),

                                  // Forgot Password Link
                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: TextButton(
                                      onPressed: () {
                                        Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (_) => const ForgotPasswordScreen(),
                                          ),
                                        );
                                      },
                                      child: const Text(
                                        'Forgot Password?',
                                        style: TextStyle(
                                          color: Color(0xFF00A3FF),
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 16),

                                  // ================= SIGN IN BUTTON =================
                                  SizedBox(
                                    width: double.infinity,
                                    height: 54,
                                    child: Container(
                                      decoration: BoxDecoration(
                                        gradient: const LinearGradient(
                                          colors: [
                                            Color(0xFF0052FF),
                                            Color(0xFF00A3FF),
                                          ],
                                          begin: Alignment.centerLeft,
                                          end: Alignment.centerRight,
                                        ),
                                        borderRadius: BorderRadius.circular(28),
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFF0052FF).withValues(alpha: 0.45),
                                            blurRadius: 18,
                                            offset: const Offset(0, 6),
                                          ),
                                        ],
                                      ),
                                      child: ElevatedButton(
                                        onPressed: auth.isLoading ? null : _submit,
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.transparent,
                                          shadowColor: Colors.transparent,
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(28),
                                          ),
                                        ),
                                        child: auth.isLoading
                                            ? const SizedBox(
                                                width: 24,
                                                height: 24,
                                                child: CircularProgressIndicator(
                                                  color: Colors.white,
                                                  strokeWidth: 2.5,
                                                ),
                                              )
                                            : const Row(
                                                mainAxisAlignment: MainAxisAlignment.center,
                                                children: [
                                                  Text(
                                                    'Sign In',
                                                    style: TextStyle(
                                                      fontSize: 16,
                                                      fontWeight: FontWeight.w800,
                                                      color: Colors.white,
                                                      letterSpacing: 0.3,
                                                    ),
                                                  ),
                                                  SizedBox(width: 8),
                                                  Icon(
                                                    Icons.arrow_forward_rounded,
                                                    color: Colors.white,
                                                    size: 20,
                                                  ),
                                                ],
                                              ),
                                      ),
                                    ),
                                  ),

                                  const SizedBox(height: 18),

                                  // Elegant Divider
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Container(
                                          height: 1,
                                          decoration: BoxDecoration(
                                            gradient: LinearGradient(
                                              colors: [
                                                Colors.transparent,
                                                const Color(0xFF00A3FF).withValues(alpha: 0.25),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 14),
                                        child: Text(
                                          'OR QUICK ACCESS',
                                          style: TextStyle(
                                            color: const Color(0xFF94A3B8).withValues(alpha: 0.85),
                                            fontSize: 10.5,
                                            fontWeight: FontWeight.w700,
                                            letterSpacing: 1.2,
                                          ),
                                        ),
                                      ),
                                      Expanded(
                                        child: Container(
                                          height: 1,
                                          decoration: BoxDecoration(
                                            gradient: LinearGradient(
                                              colors: [
                                                const Color(0xFF00A3FF).withValues(alpha: 0.25),
                                                Colors.transparent,
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 16),

                                  // Professional Biometric Login Button
                                  Container(
                                    width: double.infinity,
                                    height: 52,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF081126),
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(
                                        color: const Color(0xFF00A3FF).withValues(alpha: 0.35),
                                        width: 1.2,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFF0052FF).withValues(alpha: 0.22),
                                          blurRadius: 16,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: Material(
                                      color: Colors.transparent,
                                      child: InkWell(
                                        onTap: auth.isLoading ? null : _handleBiometricTap,
                                        borderRadius: BorderRadius.circular(16),
                                        splashColor: const Color(0xFF00A3FF).withValues(alpha: 0.2),
                                        highlightColor: const Color(0xFF0052FF).withValues(alpha: 0.1),
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 16),
                                          child: Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Container(
                                                width: 32,
                                                height: 32,
                                                decoration: BoxDecoration(
                                                  gradient: const LinearGradient(
                                                    colors: [Color(0xFF0052FF), Color(0xFF00A3FF)],
                                                    begin: Alignment.topLeft,
                                                    end: Alignment.bottomRight,
                                                  ),
                                                  borderRadius: BorderRadius.circular(9),
                                                  boxShadow: [
                                                    BoxShadow(
                                                      color: const Color(0xFF0052FF).withValues(alpha: 0.45),
                                                      blurRadius: 8,
                                                      offset: const Offset(0, 2),
                                                    ),
                                                  ],
                                                ),
                                                child: const Center(
                                                  child: Icon(
                                                    Icons.fingerprint_rounded,
                                                    color: Colors.white,
                                                    size: 20,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 12),
                                              const Text(
                                                'Login with Biometrics',
                                                style: TextStyle(
                                                  color: Colors.white,
                                                  fontSize: 14.5,
                                                  fontWeight: FontWeight.w700,
                                                  letterSpacing: 0.2,
                                                ),
                                              ),
                                              const SizedBox(width: 10),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFF00A3FF).withValues(alpha: 0.15),
                                                  borderRadius: BorderRadius.circular(6),
                                                  border: Border.all(
                                                    color: const Color(0xFF00A3FF).withValues(alpha: 0.35),
                                                    width: 0.8,
                                                  ),
                                                ),
                                                child: Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: const [
                                                    Icon(
                                                      Icons.face_rounded,
                                                      color: Color(0xFF00A3FF),
                                                      size: 13,
                                                    ),
                                                    SizedBox(width: 4),
                                                    Text(
                                                      'Touch / Face ID',
                                                      style: TextStyle(
                                                        color: Color(0xFF00A3FF),
                                                        fontSize: 10,
                                                        fontWeight: FontWeight.w700,
                                                        letterSpacing: 0.3,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 22),

                                  // Register Link
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Text(
                                        "Don't have an account? ",
                                        style: TextStyle(
                                          color: Color(0xFF94A3B8),
                                          fontSize: 13,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      GestureDetector(
                                        onTap: () {
                                          Navigator.of(context).push(
                                            MaterialPageRoute(builder: (_) => const RegisterScreen()),
                                          );
                                        },
                                        child: const Text(
                                          'Register Now',
                                          style: TextStyle(
                                            color: Color(0xFF00A3FF),
                                            fontSize: 13,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),

                            const Spacer(),
                            const SizedBox(height: 24),

                            // ================= BOTTOM FEATURES FOOTER BAR =================
                            Center(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.04),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.08),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    _buildBottomFeature(
                                      icon: Icons.bolt_rounded,
                                      label: 'Fast',
                                    ),
                                    const SizedBox(width: 24),
                                    Container(
                                      width: 1,
                                      height: 28,
                                      color: Colors.white.withValues(alpha: 0.12),
                                    ),
                                    const SizedBox(width: 24),
                                    _buildBottomFeature(
                                      icon: Icons.shield_outlined,
                                      label: 'Secure',
                                    ),
                                    const SizedBox(width: 24),
                                    Container(
                                      width: 1,
                                      height: 28,
                                      color: Colors.white.withValues(alpha: 0.12),
                                    ),
                                    const SizedBox(width: 24),
                                    _buildBottomFeature(
                                      icon: Icons.headset_mic_rounded,
                                      label: 'Reliable',
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomFeature({
    required IconData icon,
    required String label,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFF0052FF).withValues(alpha: 0.20),
            border: Border.all(
              color: const Color(0xFF00A3FF).withValues(alpha: 0.35),
              width: 1,
            ),
          ),
          child: Icon(
            icon,
            color: const Color(0xFF00A3FF),
            size: 18,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF94A3B8),
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
