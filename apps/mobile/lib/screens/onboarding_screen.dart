import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
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
                  onPressed: () => context.go('/login'),
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
