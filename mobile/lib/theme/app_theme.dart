import 'package:flutter/material.dart';
import '../providers/theme_provider.dart';

class AppColors {
  // Primary Blue
  static const Color primaryBlue = Color(0xFF007BFF);
  static const Color primaryDarkBlue = Color(0xFF0066E8);
  
  // Accent
  static const Color accentGlow = Color(0xFF00A8FF);
  
  // Dynamic Getters for theme compatibility
  static Color get darkBg => ThemeProvider.isDarkMode ? const Color(0xFF0B0F1A) : const Color(0xFFF8FAFC);
  static Color get darkBgSecondary => ThemeProvider.isDarkMode ? const Color(0xFF101827) : Colors.white;
  static Color get silverLight => ThemeProvider.isDarkMode ? const Color(0xFFF5F7FA) : const Color(0xFF0F172A);
  static Color get silverMuted => ThemeProvider.isDarkMode ? const Color(0xFFD9DDE4) : const Color(0xFF475569);
  
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
    scaffoldBackgroundColor: const Color(0xFF0B0F1A),
    appBarTheme: const AppBarTheme(
      backgroundColor: Color(0xFF101827),
      elevation: 0,
      centerTitle: true,
      foregroundColor: Color(0xFFF5F7FA),
    ),
    colorScheme: const ColorScheme.dark(
      primary: AppColors.primaryBlue,
      secondary: AppColors.accentGlow,
      surface: Color(0xFF101827),
      error: AppColors.error,
    ),
    textTheme: const TextTheme(
      displayLarge: TextStyle(
        color: Color(0xFFF5F7FA),
        fontSize: 32,
        fontWeight: FontWeight.bold,
        fontFamily: 'Poppins',
      ),
      displayMedium: TextStyle(
        color: Color(0xFFF5F7FA),
        fontSize: 28,
        fontWeight: FontWeight.bold,
        fontFamily: 'Poppins',
      ),
      headlineLarge: TextStyle(
        color: Color(0xFFF5F7FA),
        fontSize: 24,
        fontWeight: FontWeight.bold,
        fontFamily: 'Inter',
      ),
      headlineMedium: TextStyle(
        color: Color(0xFFF5F7FA),
        fontSize: 20,
        fontWeight: FontWeight.w600,
        fontFamily: 'Inter',
      ),
      titleLarge: TextStyle(
        color: Color(0xFFF5F7FA),
        fontSize: 18,
        fontWeight: FontWeight.w600,
        fontFamily: 'Inter',
      ),
      bodyLarge: TextStyle(
        color: Color(0xFFF5F7FA),
        fontSize: 16,
        fontFamily: 'Inter',
      ),
      bodyMedium: TextStyle(
        color: Color(0xFFD9DDE4),
        fontSize: 14,
        fontFamily: 'Inter',
      ),
      labelLarge: TextStyle(
        color: Color(0xFFF5F7FA),
        fontSize: 12,
        fontWeight: FontWeight.w600,
        fontFamily: 'Manrope',
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primaryBlue,
        foregroundColor: const Color(0xFFF5F7FA),
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
      fillColor: const Color(0xFF101827),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFD9DDE4)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFD9DDE4)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primaryBlue),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.error),
      ),
      labelStyle: const TextStyle(color: Color(0xFFD9DDE4)),
      hintStyle: const TextStyle(color: Color(0xFFD9DDE4)),
    ),
  );

  static ThemeData lightTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: const Color(0xFFF8FAFC),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      elevation: 0,
      centerTitle: true,
      foregroundColor: Color(0xFF0F172A),
    ),
    colorScheme: const ColorScheme.light(
      primary: AppColors.primaryBlue,
      secondary: AppColors.accentGlow,
      surface: Colors.white,
      error: AppColors.error,
    ),
    textTheme: const TextTheme(
      displayLarge: TextStyle(
        color: Color(0xFF0F172A),
        fontSize: 32,
        fontWeight: FontWeight.bold,
        fontFamily: 'Poppins',
      ),
      displayMedium: TextStyle(
        color: Color(0xFF0F172A),
        fontSize: 28,
        fontWeight: FontWeight.bold,
        fontFamily: 'Poppins',
      ),
      headlineLarge: TextStyle(
        color: Color(0xFF0F172A),
        fontSize: 24,
        fontWeight: FontWeight.bold,
        fontFamily: 'Inter',
      ),
      headlineMedium: TextStyle(
        color: Color(0xFF0F172A),
        fontSize: 20,
        fontWeight: FontWeight.w600,
        fontFamily: 'Inter',
      ),
      titleLarge: TextStyle(
        color: Color(0xFF0F172A),
        fontSize: 18,
        fontWeight: FontWeight.w600,
        fontFamily: 'Inter',
      ),
      bodyLarge: TextStyle(
        color: Color(0xFF0F172A),
        fontSize: 16,
        fontFamily: 'Inter',
      ),
      bodyMedium: TextStyle(
        color: Color(0xFF475569),
        fontSize: 14,
        fontFamily: 'Inter',
      ),
      labelLarge: TextStyle(
        color: Color(0xFF0F172A),
        fontSize: 12,
        fontWeight: FontWeight.w600,
        fontFamily: 'Manrope',
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primaryBlue,
        foregroundColor: Colors.white,
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
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primaryBlue),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.error),
      ),
      labelStyle: const TextStyle(color: Color(0xFF94A3B8)),
      hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
    ),
  );
}
