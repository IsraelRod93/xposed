import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config.dart';
import '../fonts.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});
  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  String _tab = 'inbox';
  Map<String, dynamic>? _user;
  List<dynamic> _messages = [];
  List<dynamic> _ranking = [];
  Map<String, dynamic> _stats = {};
  bool _loading = true;
  bool _rankingLoaded = false;
  bool _copied = false;
  bool _savingName = false;
  final _nameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    try {
      final results = await Future.wait([
        ApiService.get('/api/auth/me'),
        ApiService.get('/api/inbox'),
      ]);
      if (!mounted) return;
      final me = results[0] as Map<String, dynamic>;
      final inbox = results[1] as Map<String, dynamic>;
      setState(() {
        _user = me;
        _messages = inbox['messages'] ?? [];
        _stats = inbox['stats'] ?? {};
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _fetchRanking() async {
    try {
      final res = await ApiService.get('/api/ranking');
      if (!mounted) return;
      setState(() { _ranking = res is List ? res : []; _rankingLoaded = true; });
    } catch (_) {
      if (mounted) setState(() => _rankingLoaded = true);
    }
  }

  Future<void> _saveDisplayName() async {
    final name = _nameController.text.trim();
    if (name.isEmpty || _savingName) return;
    setState(() => _savingName = true);
    try {
      final res = await ApiService.post('/api/user/display-name', {'display_name': name});
      if (res['ok'] == true && mounted) {
        setState(() { _user = {...?_user, 'display_name': name}; });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✓ Nombre actualizado'), backgroundColor: Color(kAcid)));
      }
    } catch (_) {}
    if (mounted) setState(() => _savingName = false);
  }

  Future<void> _copyLink() async {
    if (_user == null) return;
    await Clipboard.setData(ClipboardData(text: '$kApiUrl/u/${_user!['share_link']}'));
    setState(() => _copied = true);
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) setState(() => _copied = false);
  }

  Future<void> _signOut() async {
    await AuthService.signOut();
    if (mounted) context.go('/');
  }

  String _tierLabel(int rank) {
    if (rank <= 3) return 'LEYENDA';
    if (rank <= 10) return 'ORO';
    if (rank <= 25) return 'PLATA';
    return 'BRONCE';
  }

  Color _tierColor(int rank) {
    if (rank <= 3) return const Color(kAcid);
    if (rank <= 10) return const Color(kGold);
    if (rank <= 25) return Colors.grey.shade400;
    return const Color(0xFFCD7F32);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: Color(kBg),
        body: Center(child: CircularProgressIndicator(color: Color(kAcid), strokeWidth: 2)),
      );
    }

    final rank = _stats['rank'] as int? ?? 99;

    return Scaffold(
      backgroundColor: const Color(kBg),
      body: SafeArea(
        child: Column(
          children: [
            // ── TOP BAR ──────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 14, 18, 0),
              child: Center(
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Text('X', style: fDisp(size: 22, color: const Color(kAcid))),
                  Text('posed', style: fDisp(size: 22, color: const Color(kInk))),
                ]),
              ),
            ),

            // ── HERO CARD (only on inbox tab) ────────────────────
            if (_tab == 'inbox')
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 14, 18, 0),
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(kSurface),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(kLine)),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Column(children: [
                      // ── Neon scanning line ──────────────────
                      _NeonScanLine(color: _tierColor(rank)),
                      // ── Content ─────────────────────────────
                      Padding(
                        padding: const EdgeInsets.fromLTRB(18, 12, 18, 16),
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                            _monoLabel('TU XPOSURE'),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                border: Border.all(color: _tierColor(rank).withOpacity(0.6)),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Row(children: [
                                ...List.generate(5, (i) => Padding(
                                  padding: const EdgeInsets.only(right: 2),
                                  child: Container(
                                    width: 5, height: 5,
                                    decoration: BoxDecoration(
                                      color: i < (rank <= 3 ? 5 : rank <= 10 ? 4 : rank <= 25 ? 3 : 2)
                                          ? _tierColor(rank) : const Color(kSurface2),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                )),
                                const SizedBox(width: 4),
                                Text(_tierLabel(rank), style: TextStyle(
                                    color: _tierColor(rank), fontSize: 9,
                                    fontWeight: FontWeight.w800, letterSpacing: 1)),
                              ]),
                            ),
                          ]),
                          const SizedBox(height: 8),
                          Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                            Text('${_messages.length}', style: fDisp(size: 56, color: const Color(kInk))),
                            const SizedBox(width: 10),
                            Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text('secretos', style: fSerif(size: 18, color: const Color(kAcid))),
                                _monoLabel('+${_stats['today'] ?? 0} HOY · DÍA ${_user?['streak_count'] ?? 1}'),
                              ]),
                            ),
                          ]),
                          const SizedBox(height: 10),
                          // Progress bar labels
                          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                            _monoLabel('ACTUAL · ${_tierLabel(rank)}'),
                            _monoLabel('PRÓXIMO NIVEL'),
                          ]),
                          const SizedBox(height: 6),
                          // Gradient progress bar
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: Container(
                              height: 5,
                              decoration: BoxDecoration(color: const Color(kBg),
                                  borderRadius: BorderRadius.circular(4)),
                              child: FractionallySizedBox(
                                alignment: Alignment.centerLeft,
                                widthFactor: (rank <= 3 ? 1.0 : rank <= 10 ? (10 - rank) / 7 : rank <= 25 ? (25 - rank) / 15 : 0.15).clamp(0.05, 1.0),
                                child: Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [_tierColor(rank), const Color(0xFF00CFFF)],
                                    ),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(children: [
                            _miniBadge('🔥', 'Día ${_user?['streak_count'] ?? 1}', 'racha', const Color(kHot)),
                            const SizedBox(width: 6),
                            _miniBadge('#', '${_stats['rank'] ?? '?'}', 'RANK', const Color(kAcid)),
                            const SizedBox(width: 6),
                            _miniBadge('🪙', '${_user?['stars'] ?? 0}', 'tokens', const Color(kGold)),
                          ]),
                        ]),
                      ),
                    ]),
                  ),
                ),
              ),

            // ── CONTENT ──────────────────────────────────────────
            Expanded(child: _buildContent()),

            // ── BOTTOM NAV ───────────────────────────────────────
            _buildBottomNav(),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    switch (_tab) {
      case 'inbox':   return _buildInbox();
      case 'ranking': return _buildRanking();
      case 'link':    return _buildLink();
      case 'perfil':  return _buildPerfil();
      default:        return _buildInbox();
    }
  }

  Widget _buildInbox() {
    if (_messages.isEmpty) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 0),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(kLine), width: 1.5,
                strokeAlign: BorderSide.strokeAlignInside),
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            const Text('📩', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 16),
            Text('Aún no tienes secretos.\n¡Comparte tu link!',
                textAlign: TextAlign.center,
                style: fSerif(size: 17, color: const Color(kInkDim))),
          ]),
        ),
      );
    }
    return RefreshIndicator(
      color: const Color(kAcid),
      backgroundColor: const Color(kSurface),
      onRefresh: _fetchData,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 100),
        itemCount: _messages.length,
        itemBuilder: (ctx, i) => _MessageCard(message: _messages[i], onAction: _fetchData),
      ),
    );
  }

  Widget _buildRanking() {
    if (_ranking.isEmpty && !_rankingLoaded) {
      return const Center(child: CircularProgressIndicator(color: Color(kAcid), strokeWidth: 2));
    }

    return RefreshIndicator(
      color: const Color(kAcid),
      backgroundColor: const Color(kSurface),
      onRefresh: _fetchRanking,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 14, 18, 100),
        children: [
          // Header
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('RANKING NACIONAL · MÉXICO', style: fMono(size: 9, color: const Color(kInkMuted))),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(kAcid).withOpacity(0.12),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text('SEMANAL', style: fMono(size: 9, color: const Color(kAcid))),
            ),
          ]),
          const SizedBox(height: 12),

          if (_ranking.isEmpty)
            Center(child: Padding(
              padding: const EdgeInsets.all(40),
              child: Text('Sin datos aún', style: fBody(size: 15, color: const Color(kInkDim))),
            ))
          else
            ..._ranking.map((u) {
              final rank = u['rank'] as int;
              final isMe = u['id'] == _user?['id'];
              final tierData = _tierData(rank);

              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                decoration: BoxDecoration(
                  color: isMe ? const Color(kAcid).withOpacity(0.06) : const Color(kSurface),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isMe ? const Color(kAcid).withOpacity(0.5) : const Color(kLine),
                  ),
                ),
                child: Row(children: [
                  // Rank number
                  SizedBox(
                    width: 38,
                    child: Text('$rank',
                        style: fDisp(size: rank <= 3 ? 26 : 20, color: tierData.color)),
                  ),
                  const SizedBox(width: 8),
                  // Name + tier badge
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Text('@${u['share_link'] ?? u['name'] ?? ''}',
                          style: fBody(size: 14, color: const Color(kInk), weight: FontWeight.w700)),
                      if (isMe) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(kAcid).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text('TÚ', style: fMono(size: 8, color: const Color(kAcid))),
                        ),
                      ],
                    ]),
                    const SizedBox(height: 5),
                    // Tier badge with dots
                    Row(children: [
                      ...List.generate(tierData.dots, (i) => Container(
                        width: 6, height: 6, margin: const EdgeInsets.only(right: 3),
                        decoration: BoxDecoration(color: tierData.color, shape: BoxShape.circle),
                      )),
                      const SizedBox(width: 4),
                      Text(tierData.label, style: fMono(size: 8, color: tierData.color)),
                    ]),
                  ])),
                  // Count
                  Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                    Text('${u['count']}',
                        style: fDisp(size: rank <= 3 ? 22 : 18, color: const Color(kInk))),
                    Text('SECRETOS', style: fMono(size: 8, color: const Color(kInkMuted))),
                  ]),
                ]),
              );
            }),
        ],
      ),
    );
  }

  _TierData _tierData(int rank) {
    if (rank == 1) return _TierData(const Color(kAcid), 'LEYENDA', 5);
    if (rank <= 3) return _TierData(const Color(kAcid), 'LEYENDA', 4);
    if (rank <= 10) return _TierData(const Color(0xFF00CFFF), 'DIAMANTE', 4);
    if (rank <= 25) return _TierData(const Color(kGold), 'ORO', 3);
    return _TierData(Colors.grey.shade500, 'PLATA', 2);
  }

  Widget _buildLink() {
    final shareLink = _user?['share_link'] ?? '';
    final fullLink = '$kApiUrl/u/$shareLink';
    final encoded = Uri.encodeComponent(fullLink);
    final text = Uri.encodeComponent('Mándame un secreto anónimo 🤫');
    final isSubscribed = _user?['subscribed_until'] != null &&
        DateTime.tryParse(_user!['subscribed_until'].toString())?.isAfter(DateTime.now()) == true;

    // Mission: receive 5 messages today
    final todayCount = (_stats['today'] as int?) ?? 0;
    final missionGoal = 5;
    final missionProgress = (todayCount / missionGoal).clamp(0.0, 1.0);
    final missionDone = todayCount >= missionGoal;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 100),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

        // ── Link card ──────────────────────────────────────────
        Text('TU LINK DE XPOSED', style: fMono(size: 10, color: const Color(kInkMuted))),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
          decoration: BoxDecoration(
            color: const Color(kSurface),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(kLine)),
          ),
          child: Row(children: [
            Expanded(child: Text('xpos.ed/$shareLink',
                style: fMono(size: 13, color: const Color(kInk)), overflow: TextOverflow.ellipsis)),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: _copyLink,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: _copied ? const Color(kAcid) : const Color(kAcid),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(_copied ? '✓ copiado' : 'copiar',
                    style: fBody(size: 12, color: const Color(kBg), weight: FontWeight.w800)),
              ),
            ),
          ]),
        ),

        const SizedBox(height: 16),

        // ── Social share ───────────────────────────────────────
        Text('COMPÁRTELO EN', style: fMono(size: 10, color: const Color(kInkMuted))),
        const SizedBox(height: 10),
        Row(children: [
          _shareBtn('INST', 'https://www.instagram.com/'),
          const SizedBox(width: 8),
          _shareBtn('TIKT', 'https://www.tiktok.com/'),
          const SizedBox(width: 8),
          _shareBtn('TWIT', 'https://twitter.com/intent/tweet?text=$text%20$encoded'),
          const SizedBox(width: 8),
          _shareBtn('WHAT', 'https://wa.me/?text=$text%20$encoded'),
        ]),

        const SizedBox(height: 20),

        // ── Misión del día ─────────────────────────────────────
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: missionDone ? const Color(kAcid).withOpacity(0.08) : const Color(kSurface),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(kAcid).withOpacity(missionDone ? 0.6 : 0.3)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('🎯 MISIÓN DEL DÍA', style: fMono(size: 9, color: const Color(kAcid))),
              Text(missionDone ? '✓ COMPLETADA' : 'EXPIRA EN 4H',
                  style: fMono(size: 9, color: missionDone ? const Color(kAcid) : const Color(kInkMuted))),
            ]),
            const SizedBox(height: 10),
            Text('recibe $missionGoal secretos hoy',
                style: fDisp(size: 20, color: const Color(kInk))),
            const SizedBox(height: 2),
            Text('+30 ★ gratis', style: fBody(size: 13, color: const Color(kAcid))),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: missionProgress,
                backgroundColor: const Color(kBg),
                valueColor: const AlwaysStoppedAnimation(Color(kAcid)),
                minHeight: 5,
              ),
            ),
            const SizedBox(height: 6),
            Text('$todayCount / $missionGoal secretos',
                style: fMono(size: 9, color: const Color(kInkMuted))),
          ]),
        ),

        const SizedBox(height: 20),

        // ── Xposed Pro ─────────────────────────────────────────
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(kSurface),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(kGold).withOpacity(isSubscribed ? 0.7 : 0.3)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('XPOSED PRO', style: fMono(size: 10, color: const Color(kGold))),
              if (isSubscribed)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(kGold).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text('ACTIVO ✓', style: fMono(size: 9, color: const Color(kGold))),
                ),
            ]),
            const SizedBox(height: 8),
            Text(isSubscribed ? 'Suscripción activa 🎉' : 'Pistas ilimitadas · sin anuncios',
                style: fBody(size: 15, color: const Color(kInk), weight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(isSubscribed ? 'Gracias por tu apoyo' : '\$10 / mes',
                style: fBody(size: 14, color: const Color(kGold))),
            if (!isSubscribed) ...[
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity, height: 44,
                child: ElevatedButton(
                  onPressed: () => context.push('/subscription'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(kGold),
                    foregroundColor: const Color(kBg),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: Text('Suscribirme · \$10/mes',
                      style: fBody(size: 14, weight: FontWeight.w700, color: const Color(kBg))),
                ),
              ),
            ],
          ]),
        ),
      ]),
    );
  }

  Widget _shareBtn(String label, String url) => Expanded(
    child: GestureDetector(
      onTap: () => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: const Color(kSurface),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(kLine)),
        ),
        child: Center(child: Text(label, style: fMono(size: 10, color: const Color(kInk)))),
      ),
    ),
  );

  // ── Helpers ──────────────────────────────────────────────────

  Widget _buildBottomNav() {
    final items = [
      _NavItem('inbox',   Icons.mail_outline_rounded,      Icons.mail_rounded,         'Inbox',   _messages.length),
      _NavItem('ranking', Icons.leaderboard_outlined,       Icons.leaderboard_rounded,  'Ranking', 0),
      _NavItem('link',    Icons.link_outlined,              Icons.link_rounded,         'Link',    0),
      _NavItem('perfil',  Icons.person_outline_rounded,     Icons.person_rounded,       'Perfil',  0),
    ];

    return Container(
      decoration: BoxDecoration(
        color: const Color(kSurface),
        border: Border(top: BorderSide(color: const Color(kLine))),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).padding.bottom + 4,
        top: 8,
      ),
      child: Row(
        children: items.map((item) {
          final active = _tab == item.id;
          return Expanded(
            child: GestureDetector(
              onTap: () {
                setState(() => _tab = item.id);
                if (item.id == 'ranking' && !_rankingLoaded) _fetchRanking();
              },
              behavior: HitTestBehavior.opaque,
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Stack(clipBehavior: Clip.none, children: [
                  Icon(
                    active ? item.activeIcon : item.icon,
                    color: active ? const Color(kAcid) : const Color(kInkMuted),
                    size: 24,
                  ),
                  if (item.badge > 0)
                    Positioned(
                      top: -4, right: -6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(
                          color: const Color(kHot),
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: Text('${item.badge}',
                            style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800)),
                      ),
                    ),
                ]),
                const SizedBox(height: 3),
                Text(item.label,
                    style: TextStyle(
                      color: active ? const Color(kAcid) : const Color(kInkMuted),
                      fontSize: 10,
                      fontWeight: active ? FontWeight.w700 : FontWeight.w400,
                    )),
              ]),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildPerfil() {
    final name = _user?['display_name'] ?? '';
    final shareLink = _user?['share_link'] ?? '';
    final stars = _user?['stars'] ?? 0;
    final streak = _user?['streak_count'] ?? 0;
    final rank = _stats['rank'] ?? 99;
    final tierD = _tierData(rank as int);
    final totalMessages = _messages.length;
    final weeklyCount = _stats['weekly'] ?? 0;

    // Mock weekly activity (replace with real data when available)
    final weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    final weekActivity = [2, 5, 3, 8, 1, 12, weeklyCount as int];
    final maxActivity = weekActivity.reduce((a, b) => a > b ? a : b).toDouble();

    // Badges
    final badges = [
      _Badge('🔥', 'INFIERNO', streak >= 7),
      _Badge('👁', 'OJO', totalMessages >= 10),
      _Badge('⭐', 'POPULAR', rank <= 25),
      _Badge('📩', 'BUZÓN PLENO', totalMessages >= 50),
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(18, 0, 18, 100),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

        // ── Header ──────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('TU PERFIL', style: fMono(size: 10, color: const Color(kInkMuted))),
            GestureDetector(
              onTap: () async { await AuthService.signOut(); if (context.mounted) context.go('/'); },
              child: const Icon(Icons.logout_rounded, color: Color(kInkMuted), size: 18),
            ),
          ]),
        ),

        // ── Avatar ──────────────────────────────────────────
        Center(child: Column(children: [
          Stack(children: [
            Container(
              width: 86, height: 86,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(kAcid), Color(kAmethyst)],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(26),
                boxShadow: [BoxShadow(color: const Color(kAcid).withOpacity(0.25), blurRadius: 24)],
              ),
              child: Center(child: Text(
                (name.isNotEmpty ? name : shareLink)[0].toUpperCase(),
                style: fDisp(size: 38, color: const Color(kBg)),
              )),
            ),
            Positioned(bottom: 0, right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: tierD.color.withOpacity(0.2), borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: tierD.color.withOpacity(0.6))),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  ...List.generate(tierD.dots, (_) => Container(
                    width: 4, height: 4, margin: const EdgeInsets.only(right: 2),
                    decoration: BoxDecoration(color: tierD.color, shape: BoxShape.circle),
                  )),
                  Text(' ${tierD.label}', style: fMono(size: 7, color: tierD.color)),
                ]),
              ),
            ),
          ]),
          const SizedBox(height: 12),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text('@${name.isNotEmpty ? name : shareLink}',
                style: fBody(size: 20, color: const Color(kInk), weight: FontWeight.w800)),
            const SizedBox(width: 6),
            const Icon(Icons.verified_rounded, color: Color(kAcid), size: 18),
          ]),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: tierD.color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: tierD.color.withOpacity(0.4)),
            ),
            child: Text('●●● ${tierD.label} · TOP ${rank <= 3 ? '1%' : rank <= 10 ? '3%' : rank <= 25 ? '10%' : '25%'}',
                style: fMono(size: 9, color: tierD.color)),
          ),
        ])),

        const SizedBox(height: 22),

        // ── Stats 2x2 grid ───────────────────────────────────
        GridView.count(
          shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2, mainAxisSpacing: 10, crossAxisSpacing: 10,
          childAspectRatio: 1.6,
          children: [
            _statGrid('$totalMessages', 'SECRETOS', '+$weeklyCount esta semana', const Color(kAcid)),
            _statGrid('$streak', 'DÍAS DE RACHA', 'récord personal', const Color(kHot)),
            _statGrid('#$rank', 'RANK', 'posición global', const Color(0xFF00CFFF)),
            _statGrid('$stars', 'TOKENS ★', 'disponibles', const Color(kGold)),
          ],
        ),

        const SizedBox(height: 20),

        // ── Weekly activity chart ─────────────────────────────
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(kSurface),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(kLine)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('ACTIVIDAD SEMANAL', style: fMono(size: 9, color: const Color(kInkMuted))),
              Text('+$weeklyCount ESTA SEMANA', style: fMono(size: 9, color: const Color(kAcid))),
            ]),
            const SizedBox(height: 16),
            SizedBox(
              height: 60,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: List.generate(7, (i) {
                  final h = maxActivity > 0 ? (weekActivity[i] / maxActivity) : 0.0;
                  final isToday = i == 6;
                  return Expanded(child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: Column(mainAxisAlignment: MainAxisAlignment.end, children: [
                      AnimatedContainer(
                        duration: Duration(milliseconds: 400 + i * 50),
                        height: 4 + (56 * h),
                        decoration: BoxDecoration(
                          color: isToday ? const Color(kAcid) : const Color(kSurface2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(weekDays[i], style: fMono(size: 8,
                          color: isToday ? const Color(kAcid) : const Color(kInkMuted))),
                    ]),
                  ));
                }),
              ),
            ),
          ]),
        ),

        const SizedBox(height: 20),

        // ── Badges ───────────────────────────────────────────
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('INSIGNIAS · ${badges.where((b) => b.unlocked).length} DE ${badges.length}',
              style: fMono(size: 9, color: const Color(kInkMuted))),
          Text('VER TODAS →', style: fMono(size: 9, color: const Color(kAcid))),
        ]),
        const SizedBox(height: 10),
        Row(children: badges.map((b) => Expanded(child: Padding(
          padding: const EdgeInsets.only(right: 8),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: b.unlocked ? const Color(kSurface) : const Color(kBg),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: b.unlocked ? const Color(kAcid).withOpacity(0.4) : const Color(kLine),
              ),
            ),
            child: Column(children: [
              Text(b.icon, style: TextStyle(fontSize: 22,
                  color: b.unlocked ? null : const Color(kInkFaint))),
              const SizedBox(height: 4),
              Text(b.label, style: fMono(size: 7,
                  color: b.unlocked ? const Color(kInkDim) : const Color(kInkFaint))),
            ]),
          ),
        ))).toList()),

        const SizedBox(height: 20),

        // ── Editar nombre ─────────────────────────────────────
        Text('NOMBRE VISIBLE', style: fMono(size: 10, color: const Color(kInkMuted))),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(kSurface),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(kLine)),
          ),
          child: Row(children: [
            Expanded(child: TextField(
              controller: _nameController..text = name,
              style: fBody(size: 15, color: const Color(kInk)),
              maxLength: 32,
              decoration: InputDecoration(
                hintText: 'Tu nombre visible...',
                hintStyle: fBody(size: 15, color: const Color(kInkMuted)),
                border: InputBorder.none, counterText: '',
                isDense: true, contentPadding: EdgeInsets.zero,
              ),
            )),
            const SizedBox(width: 10),
            GestureDetector(
              onTap: _saveDisplayName,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(color: const Color(kAcid), borderRadius: BorderRadius.circular(10)),
                child: _savingName
                    ? const SizedBox(width: 16, height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Color(kBg)))
                    : Text('guardar', style: fBody(size: 12, weight: FontWeight.w700, color: const Color(kBg))),
              ),
            ),
          ]),
        ),
      ]),
    );
  }

  Widget _statGrid(String value, String label, String sub, Color color) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: const Color(kSurface),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: const Color(kLine)),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
      Text(value, style: fDisp(size: 26, color: color)),
      Text(label, style: fMono(size: 9, color: const Color(kInkMuted))),
      const SizedBox(height: 2),
      Text(sub, style: fMono(size: 8, color: const Color(kInkFaint))),
    ]),
  );

  Widget _statCard(String value, String label, Color color) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: const Color(kSurface),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(kLine)),
      ),
      child: Column(children: [
        Text(value, style: fDisp(size: 22, color: color)),
        const SizedBox(height: 4),
        Text(label, style: fMono(size: 8, color: const Color(kInkMuted))),
      ]),
    ),
  );

  Widget _miniBadge(String icon, String value, String label, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: const Color(kBg),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(kLine)),
        ),
        child: Column(children: [
          Text(icon, style: TextStyle(color: color, fontSize: 11)),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w800)),
          Text(label, style: const TextStyle(color: Color(kInkMuted), fontSize: 8, letterSpacing: 0.5)),
        ]),
      ),
    );
  }

  Widget _monoLabel(String text) => Text(text, style: fMono(size: 9, color: const Color(kInkMuted)));
  Widget _monoLabelColor(String text, Color color) => Text(text, style: fMono(size: 9, color: color));
}

// ─── Neon Scan Line ───────────────────────────────────────────────────────────

class _NeonScanLine extends StatefulWidget {
  final Color color;
  const _NeonScanLine({required this.color});
  @override
  State<_NeonScanLine> createState() => _NeonScanLineState();
}

class _NeonScanLineState extends State<_NeonScanLine>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 3))
      ..repeat();
    _anim = Tween<double>(begin: -0.3, end: 1.3).animate(
        CurvedAnimation(parent: _ctrl, curve: Curves.linear));
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 2,
      child: AnimatedBuilder(
        animation: _anim,
        builder: (_, __) => CustomPaint(
          painter: _ScanPainter(_anim.value, widget.color),
          child: const SizedBox.expand(),
        ),
      ),
    );
  }
}

class _ScanPainter extends CustomPainter {
  final double progress;
  final Color color;
  _ScanPainter(this.progress, this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.width * progress;
    final gradient = LinearGradient(
      colors: [Colors.transparent, color.withOpacity(0.8), Colors.transparent],
      stops: const [0.0, 0.5, 1.0],
    ).createShader(Rect.fromLTWH(center - 80, 0, 160, size.height));
    canvas.drawRect(
      Rect.fromLTWH(center - 80, 0, 160, size.height),
      Paint()..shader = gradient,
    );
  }

  @override
  bool shouldRepaint(_ScanPainter old) => old.progress != progress;
}

// ─── Badge ────────────────────────────────────────────────────────────────────

class _Badge {
  final String icon;
  final String label;
  final bool unlocked;
  const _Badge(this.icon, this.label, this.unlocked);
}

// ─── Tier Data ────────────────────────────────────────────────────────────────

class _TierData {
  final Color color;
  final String label;
  final int dots;
  const _TierData(this.color, this.label, this.dots);
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

class _NavItem {
  final String id;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final int badge;
  const _NavItem(this.id, this.icon, this.activeIcon, this.label, this.badge);
}

// ─── Message Card ─────────────────────────────────────────────────────────────

class _MessageCard extends StatefulWidget {
  final Map<String, dynamic> message;
  final VoidCallback onAction;
  const _MessageCard({required this.message, required this.onAction});

  @override
  State<_MessageCard> createState() => _MessageCardState();
}

class _MessageCardState extends State<_MessageCard> {
  bool _showMenu = false;

  String _timeAgo(String? dateStr) {
    if (dateStr == null) return '';
    final diff = DateTime.now().difference(DateTime.parse(dateStr));
    if (diff.inMinutes < 1) return 'ahora';
    if (diff.inHours < 1) return 'hace ${diff.inMinutes}min';
    if (diff.inDays < 1) return 'hace ${diff.inHours}h';
    return '${DateTime.parse(dateStr).day}/${DateTime.parse(dateStr).month}/${DateTime.parse(dateStr).year}';
  }

  @override
  Widget build(BuildContext context) {
    final msg = widget.message;
    final revealed = (msg['revealed_premium'] ?? '').toString().split(',').where((s) => s.isNotEmpty).toSet();
    final hasRevealed = revealed.isNotEmpty;
    final allRevealed = revealed.length >= 5 ||
        (revealed.isNotEmpty &&
            msg['sender_os'] != null &&
            msg['sender_country'] != null &&
            revealed.length >= [
              if (msg['sender_os'] != null) 'os',
              if (msg['sender_country'] != null) 'country',
              if (msg['sender_city'] != null) 'city',
              if (msg['sender_platform'] != null) 'platform',
              if (msg['sender_hour'] != null) 'hour',
            ].length);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: const Color(kSurface),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: hasRevealed ? const Color(kLine) : const Color(kAcid).withOpacity(0.5),
        ),
        boxShadow: hasRevealed ? [] : [
          BoxShadow(color: const Color(kAcid).withOpacity(0.08), blurRadius: 16),
        ],
      ),
      child: Stack(children: [
        // NUEVO tape badge — esquina superior derecha rotado
        if (!hasRevealed)
          Positioned(
            top: 10, right: -2,
            child: Transform.rotate(
              angle: 0.55,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                color: const Color(kAcid),
                child: Text('NUEVO', style: fMono(size: 8, color: const Color(kBg))),
              ),
            ),
          ),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 10, 0),
          child: Row(children: [
            Icon(Icons.mail_outline_rounded, size: 13, color: hasRevealed ? const Color(kInkMuted) : const Color(kAcid)),
            const SizedBox(width: 6),
            Text('ANÓNIMO · ${_timeAgo(msg['created_at'])}',
                style: fMono(size: 9, color: hasRevealed ? const Color(kInkMuted) : const Color(kAcid))),
            const Spacer(),
            GestureDetector(
              onTap: () => setState(() => _showMenu = !_showMenu),
              child: const Text('⋯', style: TextStyle(color: Color(kInkMuted), fontSize: 18)),
            ),
          ]),
        ),

        // Menu
        if (_showMenu)
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 8, 14, 0),
            child: Row(children: [
              _menuBtn('🚩 Reportar', const Color(kHot)),
              const SizedBox(width: 8),
              _menuBtn('🗑 Eliminar', const Color(kInkMuted)),
            ]),
          ),

        // Content
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 10, 14, 12),
          child: Text('"${msg['content']}"',
              style: fSerif(size: 17, color: const Color(kInk))),
        ),

        // Clue slots
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 0, 14, 0),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(kBg),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(kLine)),
            ),
            child: Row(children: [
              _clueSlot('DISPOSITIVO', msg['sender_os'], revealed.contains('os')),
              Container(width: 1, height: 24, color: const Color(kLine), margin: const EdgeInsets.symmetric(horizontal: 12)),
              _clueSlot('PAÍS', msg['sender_country'], revealed.contains('country')),
            ]),
          ),
        ),

        const SizedBox(height: 10),

        // Reveal button
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
          child: SizedBox(
            width: double.infinity, height: 42,
            child: ElevatedButton(
              onPressed: () => context.push('/reveal/${msg['id']}').then((_) => widget.onAction()),
              style: ElevatedButton.styleFrom(
                backgroundColor: allRevealed
                    ? const Color(kSurface2)
                    : hasRevealed
                        ? const Color(kAmethyst).withOpacity(0.25)
                        : const Color(kAcid),
                foregroundColor: allRevealed
                    ? const Color(kInkMuted)
                    : hasRevealed
                        ? const Color(kAmethyst)
                        : const Color(kBg),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: Text(
                allRevealed
                    ? '✓ todas las pistas reveladas'
                    : hasRevealed
                        ? '${revealed.length}/5 pistas · ver más →'
                        : 'revelar primera pista · 25 🪙',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ),
      ]),
      ]),
    );
  }

  Widget _menuBtn(String label, Color color) => Expanded(
    child: GestureDetector(
      onTap: () => setState(() => _showMenu = false),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Text(label, textAlign: TextAlign.center,
            style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
      ),
    ),
  );

  Widget _clueSlot(String label, String? value, bool revealed) => Expanded(
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: fMono(size: 8, color: const Color(kInkMuted))),
      const SizedBox(height: 4),
      revealed && value != null
          ? Text(value, style: fMono(size: 13, color: const Color(kAcid)))
          : Container(height: 10, width: 50, decoration: BoxDecoration(color: const Color(kLine), borderRadius: BorderRadius.circular(3))),
    ]),
  );
}
