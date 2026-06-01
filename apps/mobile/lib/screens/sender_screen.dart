import 'package:flutter/material.dart';
import '../config.dart';
import '../services/api_service.dart';

class SenderScreen extends StatefulWidget {
  final String shareLink;
  const SenderScreen({super.key, required this.shareLink});

  @override
  State<SenderScreen> createState() => _SenderScreenState();
}

class _SenderScreenState extends State<SenderScreen> {
  final _controller = TextEditingController();
  Map<String, dynamic>? _receiver;
  bool _loading = true;
  bool _sending = false;
  bool _sent = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchReceiver();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _fetchReceiver() async {
    try {
      final res = await ApiService.post('/api/user/by-link/${widget.shareLink}', {}, auth: false);
      if (!mounted) return;
      setState(() { _receiver = res; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _send() async {
    if (_controller.text.trim().isEmpty || _sending) return;
    setState(() { _sending = true; _error = null; });
    try {
      final res = await ApiService.post('/api/messages', {
        'share_link': widget.shareLink,
        'content': _controller.text.trim(),
        'sender_os': 'Android',
      }, auth: false);
      if (!mounted) return;
      if (res['ok'] == true) {
        setState(() { _sent = true; _sending = false; });
      } else {
        setState(() { _error = res['error'] ?? 'Error al enviar'; _sending = false; });
      }
    } catch (_) {
      if (mounted) setState(() { _error = 'Error de conexión'; _sending = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: Color(kBg),
        body: Center(child: CircularProgressIndicator(color: Color(kAcid))),
      );
    }

    if (_receiver == null) {
      return Scaffold(
        backgroundColor: const Color(kBg),
        body: const Center(
          child: Text('Link no válido', style: TextStyle(color: Color(kInk), fontSize: 24, fontWeight: FontWeight.w900)),
        ),
      );
    }

    if (_sent) {
      return Scaffold(
        backgroundColor: const Color(kBg),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.mark_email_read_rounded, color: Color(kAcid), size: 80),
                const SizedBox(height: 24),
                const Text('entregado', style: TextStyle(color: Color(kInk), fontSize: 40, fontWeight: FontWeight.w900)),
                const SizedBox(height: 8),
                const Text('sin rastro · sin vuelta atrás', style: TextStyle(color: Color(kInkDim), fontSize: 16, fontStyle: FontStyle.italic)),
                const SizedBox(height: 40),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton(
                    onPressed: () => setState(() { _sent = false; _controller.clear(); }),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(kInkDim),
                      side: const BorderSide(color: Color(kLine)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('← enviar otro secreto'),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(kBg),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 16, 18, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  RichText(text: const TextSpan(children: [
                    TextSpan(text: 'X', style: TextStyle(color: Color(kAcid), fontSize: 20, fontWeight: FontWeight.w900)),
                    TextSpan(text: 'posed', style: TextStyle(color: Color(kInk), fontSize: 20, fontWeight: FontWeight.w900)),
                  ])),
                  Container(
                    width: 8, height: 8,
                    decoration: const BoxDecoration(color: Color(kAcid), shape: BoxShape.circle),
                  ),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Receiver card
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: const Color(kSurface),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(kLine)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 52, height: 52,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(kAcid), Color(kAmethyst)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Center(
                              child: Text(
                                (_receiver!['display_name'] ?? _receiver!['username'] ?? 'X')[0].toUpperCase(),
                                style: const TextStyle(color: Color(kBg), fontSize: 24, fontWeight: FontWeight.w900),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _receiver!['display_name'] ?? '@${_receiver!['username']}',
                                  style: const TextStyle(color: Color(kInk), fontSize: 16, fontWeight: FontWeight.w700),
                                ),
                                Text(
                                  '${_receiver!['message_count'] ?? 0} secretos recibidos',
                                  style: const TextStyle(color: Color(kInkDim), fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Textarea
                    Container(
                      decoration: BoxDecoration(
                        color: const Color(kSurface),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(kLine)),
                      ),
                      padding: const EdgeInsets.all(16),
                      child: TextField(
                        controller: _controller,
                        maxLines: 6,
                        maxLength: 300,
                        style: const TextStyle(color: Color(kInk), fontSize: 16),
                        decoration: const InputDecoration(
                          hintText: 'escribe sin miedo... no sabrá que fuiste tú',
                          hintStyle: TextStyle(color: Color(kInkMuted)),
                          border: InputBorder.none,
                          counterStyle: TextStyle(color: Color(kInkMuted), fontSize: 11),
                        ),
                      ),
                    ),

                    if (_error != null) ...[
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(kHot).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(kHot).withOpacity(0.4)),
                        ),
                        child: Text('⚠ $_error', style: const TextStyle(color: Color(kHot), fontSize: 13)),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // Fixed send button
            Padding(
              padding: EdgeInsets.fromLTRB(18, 10, 18, MediaQuery.of(context).padding.bottom + 16),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _sending ? null : _send,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(kAcid),
                    foregroundColor: const Color(kBg),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                    disabledBackgroundColor: const Color(kSurface2),
                  ),
                  child: _sending
                      ? const CircularProgressIndicator(color: Color(kBg), strokeWidth: 2)
                      : const Text('enviar secreto', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
