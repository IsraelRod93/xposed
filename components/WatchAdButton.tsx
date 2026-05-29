'use client';

import { useState, useEffect, useRef } from 'react';
import { XP } from '@/lib/tokens';
import { XPMonoLabel } from '@/components/XP';

const AD_REWARD = 20;
const MAX_ADS = 10;
const BLOCK_ID = process.env.NEXT_PUBLIC_ADSGRAM_BLOCK_ID || '';

interface Props {
  telegramId?: number;
  adsToday?: number;
  onRewarded?: (newStars: number, remaining: number) => void;
}

export default function WatchAdButton({ telegramId, adsToday = 0, onRewarded }: Props) {
  const [loading, setLoading] = useState(false);
  const [watched, setWatched] = useState(adsToday);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const controllerRef = useRef<any>(null);

  const remaining = MAX_ADS - watched;
  const canWatch = remaining > 0 && !!telegramId;

  // Load Adsgram SDK once
  useEffect(() => {
    if (!BLOCK_ID) return;
    if ((window as any).Adsgram) {
      initController();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sad.adsgram.ai/js/sad.min.js';
    script.async = true;
    script.onload = initController;
    document.head.appendChild(script);
  }, []);

  async function initController() {
    try {
      controllerRef.current = await (window as any).Adsgram.init({ blockId: BLOCK_ID });
    } catch {}
  }

  const handleWatch = async () => {
    if (!canWatch || loading) return;
    setLoading(true);
    setMsg(null);

    try {
      // Show the ad (Adsgram)
      if (BLOCK_ID && controllerRef.current) {
        try {
          const result = await controllerRef.current.show();
          if (!result?.done) {
            setMsg({ text: 'Mira el anuncio completo para ganar tokens', ok: false });
            setLoading(false);
            return;
          }
        } catch {
          // If ad fails (no fill, etc.) still reward in dev/test mode
          if (BLOCK_ID !== 'test') {
            setMsg({ text: 'No hay anuncios disponibles ahora, intenta más tarde', ok: false });
            setLoading(false);
            return;
          }
        }
      }

      // Grant reward via API
      const res = await fetch('/api/reward-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramId }),
      });
      const data = await res.json();

      if (res.ok) {
        setWatched(data.ads_today);
        setMsg({ text: `+${AD_REWARD} 🪙 tokens ganados`, ok: true });
        onRewarded?.(data.stars, data.ads_remaining);
        // Haptic feedback
        (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      } else {
        setMsg({ text: data.error || 'Error al procesar', ok: false });
      }
    } catch {
      setMsg({ text: 'Error de conexión', ok: false });
    } finally {
      setLoading(false);
    }
  };

  const remainingAfter = MAX_ADS - watched;

  return (
    <div>
      <button
        onClick={handleWatch}
        disabled={!canWatch || loading}
        style={{
          width: '100%', padding: '13px 16px', borderRadius: 14,
          background: canWatch ? `${XP.amethyst}22` : XP.surface,
          border: `1.5px solid ${canWatch ? XP.amethyst + '88' : XP.line}`,
          display: 'flex', alignItems: 'center', gap: 12,
          cursor: canWatch ? 'pointer' : 'not-allowed',
          opacity: loading ? 0.7 : 1, transition: 'opacity .15s',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: canWatch ? `${XP.amethyst}33` : XP.bg,
          border: `1px solid ${canWatch ? XP.amethyst + '55' : XP.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          {loading ? '⏳' : '📺'}
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontFamily: XP.fDisp, fontSize: 16, color: canWatch ? XP.ink : XP.inkMuted, lineHeight: 1 }}>
            {loading ? 'cargando anuncio...' : canWatch ? 'ver anuncio' : 'límite diario alcanzado'}
          </div>
          <div style={{ marginTop: 3 }}>
            <XPMonoLabel size={8} color={XP.inkMuted}>
              {canWatch
                ? `+${AD_REWARD} 🪙 · quedan ${remainingAfter} de ${MAX_ADS} hoy`
                : 'vuelve mañana para más tokens'}
            </XPMonoLabel>
          </div>
        </div>
        {canWatch && !loading && (
          <div style={{ fontFamily: XP.fDisp, fontSize: 16, color: XP.amethyst }}>+{AD_REWARD} 🪙</div>
        )}
      </button>

      {msg && (
        <div style={{ marginTop: 6, textAlign: 'center' }}>
          <XPMonoLabel size={9} color={msg.ok ? XP.acid : XP.hot}>
            {msg.ok ? '✓ ' : '⚠ '}{msg.text}
          </XPMonoLabel>
        </div>
      )}
    </div>
  );
}
