import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config.dart';
import '../fonts.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _messages = [
    '«Necesito decirte algo importante.»',
    '«Me gustas desde hace tiempo...»',
    '«Eres la persona más auténtica.»',
    '«Nunca me atreví a decírtelo.»',
  ];
  int _msgIdx = 0;
  bool _msgVisible = true;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (!mounted) return;
      setState(() => _msgVisible = false);
      Future.delayed(const Duration(milliseconds: 400), () {
        if (!mounted) return;
        setState(() {
          _msgIdx = (_msgIdx + 1) % _messages.length;
          _msgVisible = true;
        });
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _start() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getBool('age_ok') == true) {
      if (mounted) context.go('/login');
      return;
    }
    if (!mounted) return;
    final ok = await _showAgeGate();
    if (ok == true) {
      await prefs.setBool('age_ok', true);
      if (mounted) context.go('/login');
    }
  }

  Future<bool?> _showAgeGate() {
    return showModalBottomSheet<bool>(
      context: context,
      backgroundColor: const Color(kSurface),
      isDismissible: false,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('+18', style: fDisp(size: 40, color: const Color(kAcid))),
          const SizedBox(height: 8),
          Text('Contenido para mayores de 18',
              textAlign: TextAlign.center,
              style: fDisp(size: 22, color: const Color(kInk))),
          const SizedBox(height: 10),
          Text(
            'Xposed contiene mensajes anónimos de otras personas. '
            'Debes ser mayor de 18 años para continuar.',
            textAlign: TextAlign.center,
            style: fBody(size: 13, color: const Color(kInkDim)),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity, height: 52,
            child: ElevatedButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(kAcid),
                foregroundColor: const Color(kBg),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 0,
              ),
              child: Text('Soy mayor de 18 años',
                  style: fBody(size: 15, weight: FontWeight.w700, color: const Color(kBg))),
            ),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text('Salir', style: fBody(size: 13, color: const Color(kInkMuted))),
          ),
          const SizedBox(height: 4),
          Wrap(
            alignment: WrapAlignment.center,
            children: [
              Text('Al continuar aceptas los ',
                  style: fMono(size: 9, color: const Color(kInkFaint))),
              GestureDetector(
                onTap: () => launchUrl(Uri.parse('$kWebUrl/terms'),
                    mode: LaunchMode.externalApplication),
                child: Text('Términos',
                    style: fMono(size: 9, color: const Color(kInkMuted))),
              ),
              Text(' y la ', style: fMono(size: 9, color: const Color(kInkFaint))),
              GestureDetector(
                onTap: () => launchUrl(Uri.parse('$kWebUrl/privacy'),
                    mode: LaunchMode.externalApplication),
                child: Text('Privacidad',
                    style: fMono(size: 9, color: const Color(kInkMuted))),
              ),
              Text('.', style: fMono(size: 9, color: const Color(kInkFaint))),
            ],
          ),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(kBg),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── TOP BAR ─────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(children: [
                    Text('✕', style: fDisp(size: 20, color: const Color(kAcid))),
                    const SizedBox(width: 5),
                    Text('xposed', style: fDisp(size: 20, color: const Color(kInk))),
                  ]),
                  Row(children: [
                    Container(width: 8, height: 8,
                        decoration: const BoxDecoration(color: Color(kHot), shape: BoxShape.circle)),
                    const SizedBox(width: 6),
                    Text('2.4M USUARIOS', style: fMono(size: 9, color: const Color(kInkDim))),
                  ]),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ── FLOATING MESSAGE PREVIEW ─────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: AnimatedOpacity(
                opacity: _msgVisible ? 1.0 : 0.0,
                duration: const Duration(milliseconds: 400),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(kSurface),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(kAcid).withOpacity(0.3)),
                    boxShadow: [BoxShadow(color: const Color(kAcid).withOpacity(0.1), blurRadius: 20)],
                  ),
                  child: Row(children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(kSurface2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(children: [
                        Text('✕', style: fMono(size: 9, color: const Color(kAcid))),
                        const SizedBox(width: 4),
                        Text('XPOSED · ANÓNIMO', style: fMono(size: 9, color: const Color(kInkMuted))),
                      ]),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(_messages[_msgIdx],
                          style: fSerif(size: 13, color: const Color(kInkDim))),
                    ),
                  ]),
                ),
              ),
            ),

            const SizedBox(height: 32),

            // ── HEADLINE ─────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('tus amigos', style: fDisp(size: 42, color: const Color(kInk))),
                RichText(
                  text: TextSpan(children: [
                    TextSpan(text: 'tienen', style: fDisp(size: 42, color: const Color(kAcid))),
                  ]),
                ),
                Text('algo que decirte', style: fDisp(size: 36, color: const Color(kInk))),
                const SizedBox(height: 14),
                Text(
                  'Crea tu link. Mándalo a tus historias.\nRecibe secretos anónimos. Paga ★ para\ndescubrir quién fue.',
                  style: fBody(size: 14, color: const Color(kInkDim)),
                ),
              ]),
            ),

            const Spacer(),

            // ── STATS BAR ────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Row(children: [
                _stat('100%', 'ANÓNIMO'),
                _divider(),
                _stat('2.4M', 'USUARIOS'),
                _divider(),
                _stat('4.9★', 'EN STORE'),
              ]),
            ),

            // ── CTA ──────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
              child: SizedBox(
                width: double.infinity, height: 60,
                child: ElevatedButton(
                  onPressed: _start,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(kAcid),
                    foregroundColor: const Color(kBg),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    elevation: 0,
                  ),
                  child: Text('crear mi link →', style: fDisp(size: 22, color: const Color(kBg))),
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Center(
                child: Text('GRATIS · SIN COMPROMISO · 100% ANÓNIMO',
                    style: fMono(size: 9, color: const Color(kInkFaint))),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stat(String value, String label) => Expanded(
    child: Column(children: [
      Text(value, style: fDisp(size: 20, color: const Color(kInk))),
      Text(label, style: fMono(size: 8, color: const Color(kInkMuted))),
    ]),
  );

  Widget _divider() => Container(width: 1, height: 30, color: const Color(kLine));
}
