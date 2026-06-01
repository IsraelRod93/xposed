import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'config.dart';
import 'services/auth_service.dart';
import 'screens/onboarding_screen.dart';
import 'screens/login_screen.dart';
import 'screens/inbox_screen.dart';
import 'screens/reveal_screen.dart';
import 'screens/sender_screen.dart';
import 'screens/subscription_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(kBg),
    systemNavigationBarIconBrightness: Brightness.light,
  ));
  runApp(const XposedApp());
}

final _router = GoRouter(
  initialLocation: '/',
  redirect: (context, state) async {
    final loggedIn = await AuthService.isLoggedIn();
    final loc = state.matchedLocation;
    final publicRoutes = ['/', '/login', '/u/'];
    final isPublic = publicRoutes.any((r) => loc.startsWith(r));
    if (loggedIn && (loc == '/' || loc == '/login')) return '/inbox';
    if (!loggedIn && !isPublic) return '/';
    return null;
  },
  routes: [
    GoRoute(path: '/',             builder: (_, __) => const OnboardingScreen()),
    GoRoute(path: '/login',        builder: (_, __) => const LoginScreen()),
    GoRoute(path: '/inbox',        builder: (_, __) => const InboxScreen()),
    GoRoute(path: '/subscription', builder: (_, __) => const SubscriptionScreen()),
    GoRoute(
      path: '/reveal/:id',
      builder: (_, state) => RevealScreen(messageId: state.pathParameters['id']!),
    ),
    GoRoute(
      path: '/u/:link',
      builder: (_, state) => SenderScreen(shareLink: state.pathParameters['link']!),
    ),
  ],
);

class XposedApp extends StatelessWidget {
  const XposedApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Xposed',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: const ColorScheme.dark(
          surface: Color(kSurface),
          primary: Color(kAcid),
        ),
        scaffoldBackgroundColor: const Color(kBg),
        useMaterial3: true,
        tabBarTheme: const TabBarThemeData(dividerColor: Colors.transparent),
      ),
      routerConfig: _router,
    );
  }
}
