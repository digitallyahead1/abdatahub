import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';
import 'package:local_auth/error_codes.dart' as auth_error;

class BiometricAuthResult {
  final bool success;
  final String? errorMessage;
  final bool isCanceled;

  const BiometricAuthResult({
    required this.success,
    this.errorMessage,
    this.isCanceled = false,
  });

  factory BiometricAuthResult.success() => const BiometricAuthResult(success: true);
  factory BiometricAuthResult.failure(String message, {bool isCanceled = false}) =>
      BiometricAuthResult(success: false, errorMessage: message, isCanceled: isCanceled);
}

class BiometricService {
  static final BiometricService _instance = BiometricService._internal();
  factory BiometricService() => _instance;
  BiometricService._internal();

  final LocalAuthentication _auth = LocalAuthentication();
  static const _storage = FlutterSecureStorage(
    webOptions: WebOptions(dbName: 'abdatahub_secure', publicKey: 'abdatahub'),
  );

  static const String _keyBiometricEnabled = 'biometric_enabled';
  static const String _keyBioIdentifier = 'bio_identifier';
  static const String _keyBioPassword = 'bio_password';

  /// Check whether the device hardware supports biometrics
  Future<bool> isDeviceSupported() async {
    if (kIsWeb) return false;
    try {
      final isSupported = await _auth.isDeviceSupported();
      final canCheck = await _auth.canCheckBiometrics;
      return isSupported && canCheck;
    } catch (e) {
      debugPrint('[BiometricService] isDeviceSupported error: $e');
      return false;
    }
  }

  /// Get list of available biometric types (e.g. fingerprint, face)
  Future<List<BiometricType>> getAvailableBiometrics() async {
    if (kIsWeb) return [];
    try {
      return await _auth.getAvailableBiometrics();
    } catch (e) {
      debugPrint('[BiometricService] getAvailableBiometrics error: $e');
      return [];
    }
  }

  /// Check if user has enabled biometric login in settings
  Future<bool> isBiometricEnabled() async {
    if (kIsWeb) return false;
    try {
      final val = await _storage.read(key: _keyBiometricEnabled);
      if (val != 'true') return false;
      
      // Also ensure we have saved credentials
      final hasCreds = await hasSavedCredentials();
      return hasCreds;
    } catch (e) {
      debugPrint('[BiometricService] isBiometricEnabled error: $e');
      return false;
    }
  }

  /// Set biometric enabled/disabled in settings
  Future<void> setBiometricEnabled(bool enabled) async {
    try {
      if (enabled) {
        await _storage.write(key: _keyBiometricEnabled, value: 'true');
      } else {
        await _storage.write(key: _keyBiometricEnabled, value: 'false');
        await clearSavedCredentials();
      }
    } catch (e) {
      debugPrint('[BiometricService] setBiometricEnabled error: $e');
    }
  }

  /// Save user credentials securely for biometric sign-in
  Future<void> saveCredentials({
    required String identifier,
    required String password,
  }) async {
    try {
      await _storage.write(key: _keyBioIdentifier, value: identifier);
      await _storage.write(key: _keyBioPassword, value: password);
    } catch (e) {
      debugPrint('[BiometricService] saveCredentials error: $e');
    }
  }

  /// Check if credentials exist in secure vault
  Future<bool> hasSavedCredentials() async {
    try {
      final id = await _storage.read(key: _keyBioIdentifier);
      final pw = await _storage.read(key: _keyBioPassword);
      return id != null && id.isNotEmpty && pw != null && pw.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  /// Retrieve saved identifier (email or phone)
  Future<String?> getSavedIdentifier() async {
    try {
      return await _storage.read(key: _keyBioIdentifier);
    } catch (e) {
      return null;
    }
  }

  /// Retrieve saved credentials
  Future<Map<String, String>?> getSavedCredentials() async {
    try {
      final id = await _storage.read(key: _keyBioIdentifier);
      final pw = await _storage.read(key: _keyBioPassword);
      if (id != null && pw != null && id.isNotEmpty && pw.isNotEmpty) {
        return {'identifier': id, 'password': pw};
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Clear saved credentials from secure storage
  Future<void> clearSavedCredentials() async {
    try {
      await _storage.delete(key: _keyBioIdentifier);
      await _storage.delete(key: _keyBioPassword);
    } catch (e) {
      debugPrint('[BiometricService] clearSavedCredentials error: $e');
    }
  }

  /// Trigger native biometric authentication prompt
  Future<BiometricAuthResult> authenticate({
    String reason = 'Scan your fingerprint or face to sign in to AB Data Hub',
  }) async {
    if (kIsWeb) {
      return BiometricAuthResult.failure('Biometric authentication is not supported on web');
    }

    final supported = await isDeviceSupported();
    if (!supported) {
      return BiometricAuthResult.failure(
        'Biometric authentication is not available on this device.',
      );
    }

    final availableBiometrics = await getAvailableBiometrics();
    if (availableBiometrics.isEmpty) {
      return BiometricAuthResult.failure(
        'No biometrics enrolled. Please set up fingerprint or face unlock in your device settings.',
      );
    }

    try {
      final authenticated = await _auth.authenticate(
        localizedReason: reason,
        options: const AuthenticationOptions(
          biometricOnly: true,
          stickyAuth: true,
          sensitiveTransaction: true,
          useErrorDialogs: true,
        ),
      );

      if (authenticated) {
        return BiometricAuthResult.success();
      } else {
        return BiometricAuthResult.failure(
          'Biometric verification was not completed.',
          isCanceled: true,
        );
      }
    } on PlatformException catch (e) {
      debugPrint('[BiometricService] PlatformException: ${e.code} - ${e.message}');
      switch (e.code) {
        case auth_error.notEnrolled:
          return BiometricAuthResult.failure(
            'No biometrics enrolled. Please configure fingerprint or face unlock in your device settings.',
          );
        case auth_error.lockedOut:
          return BiometricAuthResult.failure(
            'Too many failed attempts. Biometrics is temporarily locked out. Please use your password.',
          );
        case auth_error.permanentlyLockedOut:
          return BiometricAuthResult.failure(
            'Biometrics is permanently locked. Please unlock using your device PIN or password.',
          );
        case auth_error.passcodeNotSet:
          return BiometricAuthResult.failure(
            'Device security PIN or pattern is not set. Please enable device security in Android settings.',
          );
        case auth_error.notAvailable:
          return BiometricAuthResult.failure(
            'Biometric sensor is currently unavailable. Please try again or use your password.',
          );
        default:
          return BiometricAuthResult.failure(
            e.message ?? 'Biometric verification failed. Please use your password.',
          );
      }
    } catch (e) {
      debugPrint('[BiometricService] General authentication error: $e');
      return BiometricAuthResult.failure('Authentication error. Please use your password.');
    }
  }
}
