import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ThemeProvider with ChangeNotifier {
  static const _storage = FlutterSecureStorage();
  static const _themeKey = 'app_theme_mode';

  ThemeMode _themeMode = ThemeMode.dark; // Default is dark theme

  ThemeMode get themeMode => _themeMode;

  static bool isDarkMode = true;

  ThemeProvider() {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final savedTheme = await _storage.read(key: _themeKey);
    if (savedTheme == 'light') {
      _themeMode = ThemeMode.light;
      isDarkMode = false;
    } else {
      _themeMode = ThemeMode.dark;
      isDarkMode = true;
    }
    notifyListeners();
  }

  Future<void> toggleTheme() async {
    if (_themeMode == ThemeMode.dark) {
      _themeMode = ThemeMode.light;
      isDarkMode = false;
      await _storage.write(key: _themeKey, value: 'light');
    } else {
      _themeMode = ThemeMode.dark;
      isDarkMode = true;
      await _storage.write(key: _themeKey, value: 'dark');
    }
    notifyListeners();
  }
}
