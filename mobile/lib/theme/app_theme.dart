import 'package:flutter/material.dart';

class AppColors {
  // Primary Blue
  static const Color primaryBlue = Color(0xFF007BFF);
  static const Color primaryDarkBlue = Color(0xFF0066E8);
  
  // Accent
  static const Color accentGlow = Color(0xFF00A8FF);
  
  // Dark Theme
  static const Color darkBg = Color(0xFF0B0F1A);
  static const Color darkBgSecondary = Color(0xFF101827);
  
  // Light Theme
  static const Color silverLight = Color(0xFFF5F7FA);
  static const Color silverMuted = Color(0xFFD9DDE4);
  
  // Additional
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);
}

class AppTheme {
  static ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: AppColors.darkBg,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.darkBgSecondary,
      elevation: 0,
      centerTitle: true,
      foregroundColor: AppColors.silverLight,
    ),
    colorScheme: ColorScheme.dark(
      primary: AppColors.primaryBlue,
      secondary: AppColors.accentGlow,
      surface: AppColors.darkBgSecondary,
      error: AppColors.error,
    ),
    textTheme: const TextTheme(
      displayLarge: TextStyle(
        color: AppColors.silverLight,
        fontSize: 32,
        fontWeight: FontWeight.bold,
        fontFamily: 'Poppins',
      ),
      displayMedium: TextStyle(
        color: AppColors.silverLight,
        fontSize: 28,
        fontWeight: FontWeight.bold,
        fontFamily: 'Poppins',
      ),
      headlineLarge: TextStyle(
        color: AppColors.silverLight,
        fontSize: 24,
        fontWeight: FontWeight.bold,
        fontFamily: 'Inter',
      ),
      headlineMedium: TextStyle(
        color: AppColors.silverLight,
        fontSize: 20,
        fontWeight: FontWeight.w600,
        fontFamily: 'Inter',
      ),
      titleLarge: TextStyle(
        color: AppColors.silverLight,
        fontSize: 18,
        fontWeight: FontWeight.w600,
        fontFamily: 'Inter',
      ),
      bodyLarge: TextStyle(
        color: AppColors.silverLight,
        fontSize: 16,
        fontFamily: 'Inter',
      ),
      bodyMedium: TextStyle(
        color: AppColors.silverMuted,
        fontSize: 14,
        fontFamily: 'Inter',
      ),
      labelLarge: TextStyle(
        color: AppColors.silverLight,
        fontSize: 12,
        fontWeight: FontWeight.w600,
        fontFamily: 'Manrope',
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primaryBlue,
        foregroundColor: AppColors.silverLight,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 0,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.primaryBlue,
        side: const BorderSide(color: AppColors.primaryBlue),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.darkBgSecondary,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.silverMuted),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.silverMuted),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primaryBlue),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.error),
      ),
      labelStyle: const TextStyle(color: AppColors.silverMuted),
      hintStyle: const TextStyle(color: AppColors.silverMuted),
    ),
  );
}
