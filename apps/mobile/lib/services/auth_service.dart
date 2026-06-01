import 'storage_service.dart';
import 'api_service.dart';

class AuthService {
  static Future<({Map<String, dynamic>? user, String? error})> signInWithEmail({
    required String email,
    required String password,
    String? displayName,
    bool register = false,
  }) async {
    try {
      final res = await ApiService.post('/api/auth/email', {
        'action': register ? 'register' : 'login',
        'email': email,
        'password': password,
        if (displayName != null && displayName.isNotEmpty) 'display_name': displayName,
      }, auth: false);

      if (res['token'] != null) {
        await StorageService.saveToken(res['token']);
        return (user: res['user'] as Map<String, dynamic>, error: null);
      }
      return (user: null, error: res['error'] as String? ?? 'Error desconocido');
    } catch (_) {
      return (user: null, error: 'Error de conexión');
    }
  }

  static Future<Map<String, dynamic>?> signInWithGoogle() async {
    return await _demoSignIn();
  }

  static Future<Map<String, dynamic>?> signInWithApple() async {
    return await _demoSignIn();
  }

  static Future<Map<String, dynamic>?> signInWithFacebook() async {
    return await _demoSignIn();
  }

  static Future<Map<String, dynamic>?> _demoSignIn() async {
    try {
      final res = await ApiService.post(
        '/api/auth/demo',
        {'share_link': 'Victorxposed'},
        auth: false,
      );
      if (res['token'] != null) {
        await StorageService.saveToken(res['token']);
        return res['user'];
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  static Future<void> signOut() async {
    await StorageService.deleteToken();
  }

  static Future<bool> isLoggedIn() async {
    final token = await StorageService.getToken();
    return token != null;
  }
}
