import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../config.dart';
import '../fonts.dart';
import '../services/api_service.dart';

class RevealScreen extends StatefulWidget {
  final String messageId;
  const RevealScreen({super.key, required this.messageId});

  @override
  State<RevealScreen> createState() => _RevealScreenState();
}

class _RevealScreenState extends State<RevealScreen> {
  bool _loading = true;
  bool _revealing = false;
  String? _error;
  Map<String, dynamic>? _msgData;
  List<String> _revealed = [];
  Map<String, String> _values = {};
  bool _allRevealed = false;
  int _userStars = 0;

  static const _cost = 25;

  static const _clueIcons = {
    'os':       Icons.phone_android_rounded,
    'country':  Icons.location_on_rounded,
    'city':     Icons.location_city_rounded,
    'hour':     Icons.access_time_rounded,
    'platform': Icons.open_in_new_rounded,
  };

  static const _clueLabels = {
    'os':       'DISPOSITIVO',
    'country':  'ORIGEN',
    'city':     'CIUDAD',
    'hour':     'HORA',
    'platform': 'VÍA',
  };

  @override
  void initState() {
    super.initState();
    _loadMessage();
  }

  Future<void> _loadMessage() async {
    try {
      final results = await Future.wait([
        ApiService.get('/api/auth/me'),
        ApiService.post('/api/reveal/info', {'message_id': widget.messageId}),
      ]);
      if (!mounted) return;
      final me = results[0] as Map<String, dynamic>;
      final msg = results[1] as Map<String, dynamic>;
      setState(() {
        _userStars = me['stars'] ?? 0;
        _msgData = msg;
        _revealed = (msg['revealed'] as List? ?? []).map((e) => e.toString()).toList();
        _values = Map<String, String>.from(msg['values'] ?? {});
        _allRevealed = msg['allRevealed'] == true;
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _reveal() async {
    if (_revealing || _userStars < _cost) return;
    setState(() { _revealing = true; _error = null; });
    try {
      final res = await ApiService.post('/api/reveal', {'message_id': widget.messageId});
      if (!mounted) return;
      if (res['ok'] == true) {
        setState(() {
          _revealed = (res['revealed'] as List? ?? []).map((e) => e.toString()).toList();
          _values = Map<String, String>.from(res['values'] ?? {});
          _allRevealed = res['allRevealed'] == true;
          _userStars -= _cost;
          _revealing = false;
        });
      } else {
        setState(() { _error = res['error']; _revealing = false; });
      }
    } catch (_) {
      if (mounted) setState(() { _error = 'Error de conexión'; _revealing = false; });
    }
  }

  String _buildSummary() {
    if (_revealed.isEmpty) return '';
    final parts = <String>[];
    if (_values.containsKey('os')) parts.add(_values['os']!);
    if (_values.containsKey('city')) parts.add('en ${_values['city']}');
    else if (_values.containsKey('country')) parts.add('en ${_values['country']}');
    if (_values.containsKey('hour')) parts.add(_values['hour']!.toLowerCase());
    return parts.join(', ');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(kBg),
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: Color(kAcid), strokeWidth: 2))
            : Column(children: [
                // ── Header ──────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                  child: Row(children: [
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: const Icon(Icons.arrow_back_rounded, color: Color(kInkDim), size: 22),
                    ),
                    const Spacer(),
                    Text('ANALIZANDO REMITENTE',
                        style: fMono(size: 10, color: const Color(kInkMuted))),
                    const Spacer(),
                    // Stars balance
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(kSurface),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(kLine)),
                      ),
                      child: Text('★ $_userStars',
                          style: fMono(size: 11, color: const Color(kGold))),
                    ),
                  ]),
                ),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(18, 20, 18, 20),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                      // ── Message card ─────────────────────────
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(kSurface),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(kLine)),
                        ),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('MENSAJE EN PROCESO',
                              style: fMono(size: 9, color: const Color(kInkMuted))),
                          const SizedBox(height: 10),
                          Text('"${_msgData?['content'] ?? ''}"',
                              style: fSerif(size: 16, color: const Color(kInkDim))),
                        ]),
                      ),

                      const SizedBox(height: 20),

                      // ── Revealed clues ───────────────────────
                      if (_revealed.isNotEmpty) ...[
                        Row(children: [
                          Text('TRAZA RECUPERADA', style: fMono(size: 9, color: const Color(kAcid))),
                          const SizedBox(width: 8),
                          ...List.generate(
                            _revealed.length,
                            (_) => Container(
                              width: 6, height: 6,
                              margin: const EdgeInsets.only(right: 3),
                              decoration: const BoxDecoration(
                                color: Color(kAcid), shape: BoxShape.circle),
                            ),
                          ),
                        ]),
                        const SizedBox(height: 12),
                        GridView.count(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisCount: 2,
                          mainAxisSpacing: 10,
                          crossAxisSpacing: 10,
                          childAspectRatio: 2.2,
                          children: _revealed.map((clue) => _clueCard(clue)).toList(),
                        ),
                        const SizedBox(height: 20),

                        // ── Summary ──────────────────────────
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(kSurface),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(kAcid).withOpacity(0.3)),
                          ),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            _buildSummaryText(),
                            const SizedBox(height: 8),
                            Text('basado en las pistas reveladas',
                                style: fMono(size: 9, color: const Color(kInkMuted))),
                          ]),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // ── Not yet revealed ─────────────────────
                      if (_revealed.isEmpty) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: const Color(kSurface),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(kLine)),
                          ),
                          child: Column(children: [
                            const Icon(Icons.search_rounded, color: Color(kAcid), size: 40),
                            const SizedBox(height: 12),
                            Text('¿Quieres saber quién fue?',
                                style: fBody(size: 16, color: const Color(kInk), weight: FontWeight.w700),
                                textAlign: TextAlign.center),
                            const SizedBox(height: 6),
                            Text('Cada pista cuesta $_cost ★',
                                style: fBody(size: 13, color: const Color(kInkDim)),
                                textAlign: TextAlign.center),
                          ]),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // ── Error ────────────────────────────────
                      if (_error != null) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(kHot).withOpacity(0.08),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(kHot).withOpacity(0.4)),
                          ),
                          child: Text('⚠ $_error',
                              style: fBody(size: 13, color: const Color(kHot))),
                        ),
                        const SizedBox(height: 16),
                      ],
                    ]),
                  ),
                ),

                // ── Bottom actions ────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(18, 0, 18, 20),
                  child: Column(children: [
                    if (!_allRevealed) ...[
                      SizedBox(
                        width: double.infinity, height: 58,
                        child: ElevatedButton(
                          onPressed: (_revealing || _userStars < _cost) ? null : _reveal,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(kAcid),
                            foregroundColor: const Color(kBg),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                            elevation: 0,
                            disabledBackgroundColor: const Color(kSurface2),
                          ),
                          child: _revealing
                              ? const CircularProgressIndicator(color: Color(kBg), strokeWidth: 2)
                              : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                                  Text(
                                    _revealed.isEmpty ? 'jugar "¿quién fue?"' : 'revelar otra pista',
                                    style: fDisp(size: 20, color: const Color(kBg)),
                                  ),
                                  const SizedBox(width: 10),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(kBg).withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text('★ $_cost',
                                        style: fMono(size: 11, color: const Color(kBg))),
                                  ),
                                ]),
                        ),
                      ),
                      const SizedBox(height: 10),
                    ],
                    TextButton(
                      onPressed: () => context.pop(),
                      child: Text('volver al inbox',
                          style: fBody(size: 14, color: const Color(kInkMuted))),
                    ),
                  ]),
                ),
              ]),
      ),
    );
  }

  Widget _clueCard(String clue) {
    final icon = _clueIcons[clue] ?? Icons.help_outline_rounded;
    final label = _clueLabels[clue] ?? clue.toUpperCase();
    final value = _values[clue] ?? '';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(kSurface),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(kAcid).withOpacity(0.3)),
      ),
      child: Row(children: [
        Container(
          width: 32, height: 32,
          decoration: BoxDecoration(
            color: const Color(kAcid).withOpacity(0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: const Color(kAcid), size: 16),
        ),
        const SizedBox(width: 8),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
          Text(label, style: fMono(size: 7, color: const Color(kInkMuted))),
          Text(value, style: fBody(size: 13, color: const Color(kInk), weight: FontWeight.w700),
              overflow: TextOverflow.ellipsis),
        ])),
        const Icon(Icons.check_rounded, color: Color(kAcid), size: 14),
      ]),
    );
  }

  Widget _buildSummaryText() {
    final os = _values['os'];
    final country = _values['country'];
    final city = _values['city'];

    if (os == null && country == null) {
      return Text('Analizando datos...', style: fBody(size: 16, color: const Color(kInkDim)));
    }

    return RichText(
      text: TextSpan(children: [
        TextSpan(text: 'alguien con ', style: fBody(size: 17, color: const Color(kInk))),
        if (os != null)
          TextSpan(text: os, style: fBody(size: 17, color: const Color(kAcid), weight: FontWeight.w800)),
        if (country != null || city != null) ...[
          TextSpan(text: ' en ', style: fBody(size: 17, color: const Color(kInk))),
          TextSpan(
            text: city ?? country ?? '',
            style: fBody(size: 17, color: const Color(kAcid), weight: FontWeight.w800),
          ),
        ],
      ]),
    );
  }
}
