# Mobile App Development Guide

## Overview

AB Data Hub mobile app is built with Flutter, providing a native experience for iOS and Android users.

## Getting Started

### Prerequisites

- Flutter SDK 3.13+
- Dart SDK
- Xcode (for iOS)
- Android Studio (for Android)

### Installation

```bash
cd mobile

# Get dependencies
flutter pub get

# Get specific packages
flutter pub get --offline
```

### Development

```bash
# Run on connected device or emulator
flutter run

# Run on specific device
flutter devices          # List devices
flutter run -d <device-id>

# Run with verbose logging
flutter run -v
```

### Build

```bash
# Android APK
flutter build apk --release

# Android App Bundle
flutter build appbundle --release

# iOS
flutter build ios --release
```

---

## Project Structure

```
mobile/lib/
├── main.dart              # App entry point
├── screens/               # App screens
│   ├── splash_screen.dart
│   ├── login_screen.dart
│   ├── register_screen.dart
│   ├── home_screen.dart
│   ├── dashboard_screen.dart
│   ├── transactions_screen.dart
│   ├── wallet_screen.dart
│   └── profile_screen.dart
├── widgets/               # Reusable widgets
│   ├── custom_button.dart
│   ├── custom_input.dart
│   └── service_card.dart
├── models/                # Data models
│   ├── user.dart
│   ├── transaction.dart
│   └── wallet.dart
├── services/              # API services
│   ├── api_service.dart
│   ├── auth_service.dart
│   └── transaction_service.dart
├── providers/             # State management
│   ├── auth_provider.dart
│   └── transaction_provider.dart
├── theme/                 # Theme configuration
│   └── app_theme.dart
└── utils/                 # Utilities
    ├── constants.dart
    └── validators.dart
```

---

## State Management

### Provider Package

Using `flutter_riverpod` for state management:

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Define provider
final userProvider = StateNotifierProvider<UserNotifier, User?>((ref) {
  return UserNotifier(null);
});

class UserNotifier extends StateNotifier<User?> {
  UserNotifier(User? state) : super(state);

  void updateUser(User user) {
    state = user;
  }
}

// Use in widget
class MyWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProvider);
    return Text(user?.name ?? 'No user');
  }
}
```

---

## API Integration

### HTTP Client (Dio)

```dart
import 'package:dio/dio.dart';

class ApiService {
  final Dio _dio = Dio();

  ApiService() {
    _dio.options.baseUrl = 'http://localhost:3001/api';
    _dio.options.headers = {
      'Content-Type': 'application/json',
    };
  }

  Future<Response> login(String email, String password) async {
    try {
      return await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
    } on DioException catch (e) {
      rethrow;
    }
  }
}
```

---

## UI Components

### Custom Button

```dart
class CustomButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  final bool isLoading;

  const CustomButton({
    required this.label,
    required this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      child: isLoading
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Text(label),
    );
  }
}
```

### Custom Input Field

```dart
class CustomInput extends StatefulWidget {
  final String label;
  final String? hint;
  final TextEditingController controller;
  final TextInputType keyboardType;
  final bool obscureText;

  const CustomInput({
    required this.label,
    this.hint,
    required this.controller,
    this.keyboardType = TextInputType.text,
    this.obscureText = false,
  });

  @override
  State<CustomInput> createState() => _CustomInputState();
}

class _CustomInputState extends State<CustomInput> {
  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: widget.controller,
      keyboardType: widget.keyboardType,
      obscureText: widget.obscureText,
      decoration: InputDecoration(
        labelText: widget.label,
        hintText: widget.hint,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        filled: true,
        fillColor: const Color(0xFF101827),
      ),
    );
  }
}
```

---

## Navigation

### Named Routes

```dart
void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      routes: {
        '/': (context) => SplashScreen(),
        '/login': (context) => LoginScreen(),
        '/register': (context) => RegisterScreen(),
        '/home': (context) => HomeScreen(),
        '/dashboard': (context) => DashboardScreen(),
      },
    );
  }
}

// Navigation
Navigator.pushNamed(context, '/dashboard');
Navigator.pop(context);
```

---

## Forms & Validation

```dart
class LoginScreen extends StatefulWidget {
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _emailController;
  late TextEditingController _passwordController;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          TextFormField(
            controller: _emailController,
            validator: (value) {
              if (value?.isEmpty ?? true) {
                return 'Email is required';
              }
              if (!value!.contains('@')) {
                return 'Invalid email';
              }
              return null;
            },
          ),
          TextFormField(
            controller: _passwordController,
            obscureText: true,
            validator: (value) {
              if (value?.isEmpty ?? true) {
                return 'Password is required';
              }
              if ((value?.length ?? 0) < 8) {
                return 'Password must be at least 8 characters';
              }
              return null;
            },
          ),
          ElevatedButton(
            onPressed: () {
              if (_formKey.currentState!.validate()) {
                // Submit form
              }
            },
            child: const Text('Login'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
```

---

## Testing

### Unit Tests

```bash
flutter test
```

### Example Test

```dart
void main() {
  group('User', () {
    test('User creation', () {
      final user = User(
        id: '1',
        fullName: 'John Doe',
        email: 'john@example.com',
      );

      expect(user.fullName, 'John Doe');
      expect(user.email, 'john@example.com');
    });
  });
}
```

---

## Storage

### Local Storage (GetStorage)

```dart
import 'package:get_storage/get_storage.dart';

final box = GetStorage();

// Save
box.write('user', userJson);

// Read
final user = box.read('user');

// Delete
box.remove('user');
```

### Secure Storage

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();

// Save
await storage.write(key: 'token', value: token);

// Read
final token = await storage.read(key: 'token');

// Delete
await storage.delete(key: 'token');
```

---

## Deployment

### Android

```bash
# Create keystore
keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 4096 -validity 10000 -alias upload

# Build
flutter build appbundle --release

# Upload to Google Play
```

### iOS

```bash
# Build
flutter build ios --release

# Archive and upload to App Store
# Use Xcode or Transporter
```

---

## Troubleshooting

### Dependency conflicts

```bash
flutter pub upgrade
flutter pub get
flutter pub cache clean
```

### Build errors

```bash
flutter clean
flutter pub get
flutter run
```

---

## Resources

- [Flutter Documentation](https://flutter.dev/docs)
- [Dart Documentation](https://dart.dev/guides)
- [Riverpod Documentation](https://riverpod.dev)
- [Material Design 3](https://m3.material.io)

---

## Support

For questions or issues, refer to:
- GitHub Issues
- Flutter Discord
- Documentation
