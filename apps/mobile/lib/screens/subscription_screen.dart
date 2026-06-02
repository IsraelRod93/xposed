import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import '../config.dart';
import '../fonts.dart';
import '../services/api_service.dart';

const _kSubId     = 'xposed_pro_monthly';
const _kTokens100 = 'xposed_tokens_100';
const _kTokens500 = 'xposed_tokens_500';
const _kTokens1k  = 'xposed_tokens_1000';

const _productIds = {_kSubId, _kTokens100, _kTokens500, _kTokens1k};

class SubscriptionScreen extends StatefulWidget {
  const SubscriptionScreen({super.key});
  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  final InAppPurchase _iap = InAppPurchase.instance;
  late StreamSubscription<List<PurchaseDetails>> _sub;
  List<ProductDetails> _products = [];
  bool _loading = true;
  bool _purchasing = false;
  String? _message;

  @override
  void initState() {
    super.initState();
    _sub = _iap.purchaseStream.listen(_onPurchase, onError: (_) {});
    _loadProducts();
  }

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }

  Future<void> _loadProducts() async {
    final available = await _iap.isAvailable();
    if (!available) {
      setState(() { _loading = false; _message = 'Pagos no disponibles en este dispositivo'; });
      return;
    }
    final res = await _iap.queryProductDetails(_productIds);
    setState(() { _products = res.productDetails; _loading = false; });
  }

  void _onPurchase(List<PurchaseDetails> purchases) async {
    for (final p in purchases) {
      if (p.status == PurchaseStatus.purchased || p.status == PurchaseStatus.restored) {
        await ApiService.post('/api/purchase/verify', {
          'product_id': p.productID,
          'purchase_token': p.verificationData.serverVerificationData,
          'platform': Platform.isAndroid ? 'android' : 'ios',
        });
        if (p.pendingCompletePurchase) await _iap.completePurchase(p);
        if (mounted) setState(() { _message = '✓ Compra activada'; _purchasing = false; });
      } else if (p.status == PurchaseStatus.error) {
        if (mounted) setState(() { _message = 'Error: ${p.error?.message}'; _purchasing = false; });
      } else if (p.status == PurchaseStatus.canceled) {
        if (mounted) setState(() { _purchasing = false; });
      }
    }
  }

  Future<void> _buy(String productId) async {
    final product = _products.firstWhere((p) => p.id == productId,
        orElse: () => throw Exception('Product not found'));
    setState(() { _purchasing = true; _message = null; });
    final param = PurchaseParam(productDetails: product);
    if (productId == _kSubId) {
      await _iap.buyNonConsumable(purchaseParam: param);
    } else {
      await _iap.buyConsumable(purchaseParam: param);
    }
  }

  ProductDetails? _product(String id) {
    try { return _products.firstWhere((p) => p.id == id); } catch (_) { return null; }
  }

  String _price(String id) => _product(id)?.price ?? '...';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(kBg),
      appBar: AppBar(
        backgroundColor: const Color(kBg),
        foregroundColor: const Color(kInk),
        title: Text('Xposed Pro', style: fBody(size: 17, weight: FontWeight.w700, color: const Color(kInk))),
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(kAcid), strokeWidth: 2))
          : SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 24),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                  // ── Pro subscription ───────────────────────
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [const Color(kGold).withOpacity(0.15), const Color(kSurface)],
                        begin: Alignment.topLeft, end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(kGold).withOpacity(0.5)),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('⭐ XPOSED PRO', style: fMono(size: 11, color: const Color(kGold))),
                      const SizedBox(height: 10),
                      Text(_price(_kSubId),
                          style: fDisp(size: 40, color: const Color(kInk))),
                      Text('por mes', style: fBody(size: 15, color: const Color(kInkDim))),
                      const SizedBox(height: 16),
                      ...[
                        '✓  Pistas reveladas ilimitadas',
                        '✓  Cambio de nombre ilimitado',
                        '✓  Sin anuncios',
                        '✓  Badge Pro en tu perfil',
                      ].map((f) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Text(f, style: fBody(size: 14, color: const Color(kInk))),
                      )),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity, height: 52,
                        child: ElevatedButton(
                          onPressed: (_purchasing || _product(_kSubId) == null) ? null : () => _buy(_kSubId),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(kGold),
                            foregroundColor: const Color(kBg),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            elevation: 0,
                            disabledBackgroundColor: const Color(kSurface2),
                          ),
                          child: _purchasing
                              ? const CircularProgressIndicator(color: Color(kBg), strokeWidth: 2)
                              : Text('Suscribirme · ${_price(_kSubId)}',
                                  style: fBody(size: 15, weight: FontWeight.w700, color: const Color(kBg))),
                        ),
                      ),
                    ]),
                  ),

                  const SizedBox(height: 24),

                  // ── Token packs ────────────────────────────
                  Text('COMPRAR TOKENS ★', style: fMono(size: 10, color: const Color(kInkMuted))),
                  const SizedBox(height: 12),
                  _tokenPack(_kTokens100,  '100 ★', 'Starter',  'Revelar ~4 pistas'),
                  const SizedBox(height: 10),
                  _tokenPack(_kTokens500,  '500 ★', 'Popular',  'Revelar ~20 pistas'),
                  const SizedBox(height: 10),
                  _tokenPack(_kTokens1k,  '1000 ★', 'Pro',      'Revelar ~40 pistas'),

                  if (_message != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _message!.startsWith('✓')
                            ? const Color(kAcid).withOpacity(0.1)
                            : const Color(kHot).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: _message!.startsWith('✓')
                              ? const Color(kAcid).withOpacity(0.4)
                              : const Color(kHot).withOpacity(0.4),
                        ),
                      ),
                      child: Text(_message!,
                          style: fBody(size: 13, color: _message!.startsWith('✓')
                              ? const Color(kAcid) : const Color(kHot))),
                    ),
                  ],

                  const SizedBox(height: 16),
                  Center(child: Text(
                    Platform.isIOS
                        ? 'Pago gestionado por App Store · Cancela cuando quieras'
                        : 'Pago gestionado por Google Play · Cancela cuando quieras',
                    textAlign: TextAlign.center,
                    style: fMono(size: 9, color: const Color(kInkFaint)),
                  )),
                ]),
              ),
            ),
    );
  }

  Widget _tokenPack(String id, String tokens, String badge, String desc) {
    final p = _product(id);
    return GestureDetector(
      onTap: (_purchasing || p == null) ? null : () => _buy(id),
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
        decoration: BoxDecoration(
          color: const Color(kSurface),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(kLine)),
        ),
        child: Row(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(kAcid).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(tokens, style: fBody(size: 15, weight: FontWeight.w800, color: const Color(kAcid))),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(badge, style: fBody(size: 14, color: const Color(kInk), weight: FontWeight.w700)),
            Text(desc, style: fMono(size: 9, color: const Color(kInkMuted))),
          ])),
          Text(p?.price ?? '...', style: fBody(size: 15, color: const Color(kInk), weight: FontWeight.w700)),
        ]),
      ),
    );
  }
}
