import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import '../config.dart';
import '../fonts.dart';
import '../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

const _taglines = [
  'Díselo sin miedo.\nEntérate sin filtros.',
  '¿Qué piensas de mí... de verdad?',
  'Suelta el chisme.\nYo no sabré quién fuiste.',
  'Dime ese secreto que\nnunca te atreviste.',
  'Sin rastro.\nSin vuelta atrás.',
  '¿Algún crush?\n¿Algún beef?',
];

class _RotatingTagline extends StatefulWidget {
  const _RotatingTagline();
  @override
  State<_RotatingTagline> createState() => _RotatingTaglineState();
}

class _RotatingTaglineState extends State<_RotatingTagline> {
  int _idx = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) setState(() => _idx = (_idx + 1) % _taglines.length);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 800),
      transitionBuilder: (child, anim) => FadeTransition(opacity: anim, child: child),
      child: Text(
        _taglines[_idx],
        key: ValueKey(_idx),
        textAlign: TextAlign.center,
        style: fSerif(size: 16, color: const Color(kInkDim)),
      ),
    );
  }
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl    = TextEditingController();
  final _passCtrl     = TextEditingController();
  final _nameCtrl     = TextEditingController();
  bool _isRegister    = false;
  bool _loading       = false;
  bool _obscure       = true;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _submitEmail() async {
    final email = _emailCtrl.text.trim();
    final pass  = _passCtrl.text.trim();

    if (email.isEmpty || pass.isEmpty) {
      setState(() => _error = 'Completa todos los campos');
      return;
    }
    if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
      setState(() => _error = 'Email inválido');
      return;
    }
    if (pass.length < 6) {
      setState(() => _error = 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (_isRegister && _nameCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Escribe tu nombre visible');
      return;
    }

    setState(() { _loading = true; _error = null; });

    final result = await AuthService.signInWithEmail(
      email: email,
      password: pass,
      displayName: _isRegister ? _nameCtrl.text.trim() : null,
      register: _isRegister,
    );

    if (!mounted) return;
    setState(() => _loading = false);

    if (result.user != null) {
      if (mounted) context.go('/inbox');
    } else {
      setState(() => _error = result.error ?? 'Error desconocido');
    }
  }

  void _comingSoon(String provider) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$provider disponible próximamente',
            style: fBody(size: 13, color: const Color(kInk))),
        backgroundColor: const Color(kSurface2),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(kBg),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const SizedBox(height: 60),

              // ── Logo centrado ───────────────────────────────────
              Center(
                child: Column(children: [
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text('X', style: fDisp(size: 40, color: const Color(kAcid))),
                    Text('posed', style: fDisp(size: 40, color: const Color(kInk))),
                  ]),
                  const SizedBox(height: 10),
                  const SizedBox(height: 52, child: _RotatingTagline()),
                ]),
              ),

              const SizedBox(height: 40),

              // ── Formulario ─────────────────────────────────────
              if (_isRegister)
                _field(_nameCtrl, 'Nombre visible', Icons.person_outline_rounded, false),

              _field(_emailCtrl, 'Email', Icons.mail_outline_rounded, false,
                  type: TextInputType.emailAddress),

              _field(_passCtrl, 'Contraseña', Icons.lock_outline_rounded, _obscure,
                  suffix: GestureDetector(
                    onTap: () => setState(() => _obscure = !_obscure),
                    child: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                        color: const Color(kInkMuted), size: 20),
                  )),

              if (_error != null) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(kHot).withOpacity(0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(kHot).withOpacity(0.4)),
                  ),
                  child: Row(children: [
                    const Icon(Icons.warning_amber_rounded, color: Color(kHot), size: 16),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_error!, style: fBody(size: 13, color: const Color(kHot)))),
                  ]),
                ),
              ],

              const SizedBox(height: 16),

              // Botón principal
              SizedBox(
                width: double.infinity, height: 52,
                child: ElevatedButton(
                  onPressed: _loading ? null : _submitEmail,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(kAcid),
                    foregroundColor: const Color(kBg),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                    disabledBackgroundColor: const Color(kSurface2),
                  ),
                  child: _loading
                      ? const SizedBox(width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Color(kBg)))
                      : Text(_isRegister ? 'Crear cuenta' : 'Iniciar sesión',
                            style: fBody(size: 16, weight: FontWeight.w700, color: const Color(kBg))),
                ),
              ),

              const SizedBox(height: 12),

              // Toggle registro/login
              GestureDetector(
                onTap: () => setState(() { _isRegister = !_isRegister; _error = null; }),
                child: Text(
                  _isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate',
                  style: fBody(size: 13, color: const Color(kInkDim)),
                ),
              ),

              const SizedBox(height: 110),

              // Separador
              Row(children: [
                const Expanded(child: Divider(color: Color(kLine))),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text('o continúa con', style: fMono(size: 10, color: const Color(kInkMuted))),
                ),
                const Expanded(child: Divider(color: Color(kLine))),
              ]),

              const SizedBox(height: 20),

              // Botones sociales
              Row(children: [
                _socialBtnCustom(
                  label: 'Google',
                  onTap: () => _comingSoon('Google'),
                  child: SvgPicture.string(_googleSvg, width: 22, height: 22),
                ),
                const SizedBox(width: 10),
                _socialBtnCustom(
                  label: 'Facebook',
                  onTap: () => _comingSoon('Facebook'),
                  child: SvgPicture.string(_facebookSvg, width: 22, height: 22),
                ),
                const SizedBox(width: 10),
                _socialBtnCustom(
                  label: 'Apple',
                  onTap: () => _comingSoon('Apple'),
                  child: SvgPicture.string(_appleSvg, width: 22, height: 22),
                ),
              ]),

              const SizedBox(height: 32),

              Text(
                'Al continuar aceptas nuestros términos.\nTus mensajes son anónimos y cifrados.',
                textAlign: TextAlign.center,
                style: fMono(size: 9, color: const Color(kInkFaint)),
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController ctrl,
    String hint,
    IconData icon,
    bool obscure, {
    TextInputType type = TextInputType.text,
    Widget? suffix,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(kSurface),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(kLine)),
        ),
        child: TextField(
          controller: ctrl,
          obscureText: obscure,
          keyboardType: type,
          style: fBody(size: 15, color: const Color(kInk)),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: fBody(size: 15, color: const Color(kInkMuted)),
            prefixIcon: Icon(icon, color: const Color(kInkMuted), size: 20),
            suffixIcon: suffix,
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(vertical: 16),
          ),
        ),
      ),
    );
  }

  Widget _socialBtnCustom({
    required String label,
    required Widget child,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: _loading ? null : onTap,
        child: Container(
          height: 52,
          decoration: BoxDecoration(
            color: const Color(kSurface),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(kLine)),
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            child,
            const SizedBox(height: 3),
            Text(label, style: fMono(size: 9, color: const Color(kInkMuted))),
          ]),
        ),
      ),
    );
  }
}

const _googleSvg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>''';

const _facebookSvg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#1877F2" d="M48 24C48 10.745 37.255 0 24 0S0 10.745 0 24c0 11.979 8.776 21.908 20.25 23.708V30.938h-6.094V24h6.094v-5.288c0-6.014 3.583-9.337 9.065-9.337 2.625 0 5.372.469 5.372.469v5.906h-3.026c-2.981 0-3.911 1.85-3.911 3.75V24h6.656l-1.064 6.938H27.75v16.77C39.224 45.908 48 35.979 48 24z"/><path fill="#fff" d="M33.342 30.938L34.406 24H27.75v-4.5c0-1.9.93-3.75 3.911-3.75h3.026V9.844s-2.747-.469-5.372-.469c-5.482 0-9.065 3.323-9.065 9.337V24h-6.094v6.938h6.094v16.77a24.2 24.2 0 007.5 0V30.938h5.592z"/></svg>''';

const _appleSvg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 814 1000"><path fill="#ffffff" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-42.3-150.3-109.2c-52.8-79.5-95.5-196.4-95.5-304.8 0-203.1 133.2-319.3 263.7-319.3 67.3 0 122.9 44.4 164.4 44.4 39.5 0 101.7-47.8 176.7-47.8zm-23.6-190.5c31.2-37.5 53.4-90.2 53.4-142.9 0-7.7-.6-15.4-1.9-21.8-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.8-55.1 137.2 0 8.3 1.3 16.6 1.9 19.2 3.2.6 8.3 1.3 13.4 1.3 45.4 0 102.5-30.4 135.4-68.8z"/></svg>''';
