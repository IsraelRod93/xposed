'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { XP } from '@/lib/tokens';
import { XPMonoLabel, XPPulseDot } from '@/components/XP';
import WatchAdButton from '@/components/WatchAdButton';

const REVEAL_COST = 25;

const STAR_PACKAGES = [
  { id: '100',  tokens: 100,  xtr: 10,  popular: false },
  { id: '500',  tokens: 500,  xtr: 50,  popular: true  },
  { id: '1000', tokens: 1000, xtr: 100, popular: false },
] as const;

const CLUE_META: Record<string, { icon: string; label: string }> = {
  country:  { icon: '◎', label: 'ORIGEN' },
  os:       { icon: '⌬', label: 'DISPOSITIVO' },
  hour:     { icon: '🕐', label: 'HORA DEL DÍA' },
  city:     { icon: '🏙️', label: 'CIUDAD' },
  platform: { icon: '📱', label: 'RED SOCIAL' },
};

const ALL_CLUES = ['country', 'os', 'hour', 'city', 'platform'];

function computeAvailable(msg: any): string[] {
  if (!msg) return ALL_CLUES;
  const av: string[] = ['country', 'os'];
  if (msg.sender_city !== null && msg.sender_city !== undefined) av.push('city');
  if (msg.sender_platform !== null && msg.sender_platform !== undefined) av.push('platform');
  if (msg.sender_hour !== null && msg.sender_hour !== undefined) av.push('hour');
  return av;
}

export default function RevealPage() {
  const { id } = useParams();
  const router = useRouter();

  const [tgUser, setTgUser] = useState<any>(null);
  const [userStars, setUserStars] = useState<number | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [adsToday, setAdsToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const [revealed, setRevealed] = useState<string[]>([]);
  const [availableClues, setAvailableClues] = useState<string[]>(ALL_CLUES);
  const [values, setValues] = useState<Record<string, string>>({});
  const [allRevealed, setAllRevealed] = useState(false);
  const [lastRevealed, setLastRevealed] = useState<string | null>(null);

  const [revealing, setRevealing] = useState(false);
  const [noStars, setNoStars] = useState(false);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) setTgUser(tg.initDataUnsafe?.user);
  }, []);

  useEffect(() => {
    if (!tgUser || !id) return;

    fetch(`/api/inbox/${tgUser.id}`)
      .then(r => r.json())
      .then(async data => {
        const stars = data.user?.stars ?? null;
        setUserStars(stars);
        setAdsToday(data.user?.daily_ads_watched ?? 0);
        const sub = data.user?.subscribed_until;
        const isSub = !!(sub && new Date(sub) > new Date());
        setIsSubscribed(isSub);

        const msg = data.messages?.find((m: any) => m.id === id);
        const av = computeAvailable(msg);
        setAvailableClues(av);

        let currentRevealed: string[] = [];
        if (msg) {
          if (msg.is_clue_revealed && (!msg.revealed_premium || msg.revealed_premium === '')) {
            currentRevealed = ['country', 'os'];
          } else {
            currentRevealed = (msg.revealed_premium || '').split(',').filter(Boolean);
          }
        }

        if (isSub) {
          // Subscribers: auto-reveal all available for free
          const res = await fetch('/api/reveal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegram_id: tgUser.id, message_id: id }),
          });
          const d = await res.json();
          if (res.ok) {
            setRevealed(d.revealed || []);
            setValues(d.values || {});
            setAllRevealed(d.allRevealed || false);
            if (d.available) setAvailableClues(d.available);
          }
        } else if (currentRevealed.length > 0) {
          // Has existing reveals — load values, no auto-charge
          setRevealed(currentRevealed);
          setAllRevealed(currentRevealed.length >= av.length);
          const fetchedValues: Record<string, string> = {};
          await Promise.all(currentRevealed.map(async (type) => {
            try {
              const r = await fetch('/api/reveal/premium', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: tgUser.id, message_id: id, clue_type: type }),
              });
              const rd = await r.json();
              if (rd.ok) fetchedValues[type] = rd.value;
            } catch {}
          }));
          setValues(fetchedValues);
        }
        // 0 reveals, non-subscriber: just show locked state — user clicks button
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tgUser, id]);

  const doReveal = async () => {
    if (!tgUser || revealing) return;
    setRevealing(true);
    setLastRevealed(null);
    try {
      const res = await fetch('/api/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: tgUser.id, message_id: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setRevealed(data.revealed || []);
        setValues(data.values || {});
        setAllRevealed(data.allRevealed || false);
        setLastRevealed(data.clue_type || null);
        if (data.available) setAvailableClues(data.available);
        if (data.clue_type) setUserStars(prev => prev !== null ? prev - REVEAL_COST : null);
        (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      } else if (res.status === 403) {
        setNoStars(true);
      }
    } catch {}
    finally { setRevealing(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: XP.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <XPPulseDot size={12} />
    </div>
  );

  if (noStars) return (
    <NoStarsState
      currentStars={userStars}
      adsToday={adsToday}
      telegramId={tgUser?.id}
      onBack={() => router.back()}
      onEarn={() => router.push('/')}
      onAdRewarded={(stars) => { setUserStars(stars); setNoStars(false); }}
    />
  );

  const unrevealed = availableClues.filter(c => !revealed.includes(c));

  return (
    <div style={{
      minHeight: '100vh', background: XP.bg, color: XP.ink,
      fontFamily: XP.fBody, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 50% 30%, ${XP.acid}18, transparent 55%)`,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ padding: '54px 18px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => router.back()} style={{
            width: 32, height: 32, borderRadius: 10, background: XP.surface,
            border: `1px solid ${XP.line}`, color: XP.ink, cursor: 'pointer',
          }}>←</button>
          <XPMonoLabel size={10}>PISTAS DEL REMITENTE</XPMonoLabel>
          <div style={{
            padding: '4px 10px', background: XP.surface, border: `1px solid ${XP.line}`,
            borderRadius: 999, fontFamily: XP.fMono, fontSize: 11, fontWeight: 700,
          }}>
            {revealed.length}/{availableClues.length}
          </div>
        </div>
      </div>

      {/* Clue grid */}
      <div style={{ padding: '20px 18px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ALL_CLUES.map(type => {
            const meta = CLUE_META[type];
            const isAvailable = availableClues.includes(type);
            const isRevealed = revealed.includes(type);
            const isNew = lastRevealed === type;
            const val = values[type];

            if (!isAvailable) {
              return (
                <div key={type} style={{
                  padding: '14px 16px', borderRadius: 16,
                  background: XP.surface, border: `1.5px dashed ${XP.line}`,
                  display: 'flex', alignItems: 'center', gap: 14, opacity: 0.4,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: XP.bg, border: `1px solid ${XP.line}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    color: XP.inkFaint,
                  }}>—</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <XPMonoLabel size={8} color={XP.inkFaint}>{meta.label}</XPMonoLabel>
                    <div style={{ marginTop: 4, fontFamily: XP.fMono, fontSize: 12, color: XP.inkFaint }}>
                      sin datos
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={type} style={{
                padding: '14px 16px', borderRadius: 16,
                background: isRevealed ? (isNew ? `${XP.acid}18` : `${XP.surface}`) : XP.surface,
                border: `1.5px solid ${isRevealed ? (isNew ? XP.acid + '88' : XP.line) : XP.line}`,
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'all .3s',
                boxShadow: isNew ? `0 0 20px -4px ${XP.acid}66` : 'none',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: isRevealed ? (isNew ? `${XP.acid}22` : `${XP.surface2}`) : XP.bg,
                  border: `1px solid ${isRevealed ? (isNew ? XP.acid + '55' : XP.line) : XP.line}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, transition: 'all .3s',
                  color: isRevealed ? (isNew ? XP.acid : XP.inkMuted) : XP.inkFaint,
                }}>
                  {isRevealed ? meta.icon : '🔒'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <XPMonoLabel size={8} color={isRevealed ? XP.inkMuted : XP.inkFaint}>{meta.label}</XPMonoLabel>
                  <div style={{
                    marginTop: 4, fontFamily: XP.fDisp, fontSize: 20, lineHeight: 1,
                    color: isRevealed ? (isNew ? XP.acid : XP.ink) : XP.inkFaint,
                    filter: isRevealed ? 'none' : 'blur(4px)',
                    transition: 'all .4s',
                  }}>
                    {isRevealed ? (val || '...') : '???'}
                  </div>
                </div>
                {isNew && (
                  <div style={{
                    padding: '3px 8px', background: XP.acid, color: XP.bg,
                    borderRadius: 999, fontFamily: XP.fMono, fontSize: 8, fontWeight: 700,
                  }}>NUEVO</div>
                )}
                {isRevealed && !isNew && <span style={{ color: XP.acid, fontSize: 16 }}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action zone */}
      <div style={{ padding: '20px 18px 32px', position: 'relative', zIndex: 2 }}>
        {allRevealed ? (
          <>
            <div style={{
              padding: '12px 16px', background: `${XP.acid}14`, border: `1px solid ${XP.acid}44`,
              borderRadius: 14, marginBottom: 14, textAlign: 'center',
            }}>
              <div style={{ fontFamily: XP.fDisp, fontSize: 20, color: XP.acid }}>🎯 todas las pistas reveladas</div>
              <XPMonoLabel size={9} color={XP.inkMuted}>ya sabes todo sobre quien te escribió</XPMonoLabel>
            </div>
            <button onClick={() => router.push('/')} style={{
              width: '100%', height: 52, borderRadius: 16, border: 'none',
              background: XP.acid, color: XP.bg,
              fontFamily: XP.fDisp, fontSize: 18, cursor: 'pointer',
              boxShadow: `inset 0 -2px 0 ${XP.acidDeep}`,
            }}>volver al inbox</button>
          </>
        ) : (
          <>
            <button
              onClick={doReveal}
              disabled={revealing || (userStars !== null && userStars < REVEAL_COST)}
              style={{
                width: '100%', height: 56, borderRadius: 18, border: 'none',
                background: (userStars ?? 0) >= REVEAL_COST ? XP.acid : XP.surface2,
                color: (userStars ?? 0) >= REVEAL_COST ? XP.bg : XP.inkMuted,
                fontFamily: XP.fDisp, fontSize: 20,
                cursor: (userStars ?? 0) >= REVEAL_COST ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: (userStars ?? 0) >= REVEAL_COST ? `inset 0 -3px 0 ${XP.acidDeep}` : 'none',
                opacity: revealing ? 0.6 : 1, transition: 'opacity .15s',
                marginBottom: 10,
              }}
            >
              {revealing ? '🎲 revelando...' : `revelar pista aleatoria · ${REVEAL_COST} 🪙`}
            </button>
            <button onClick={() => router.back()} style={{
              width: '100%', background: 'none', border: 'none', color: XP.inkMuted,
              fontFamily: XP.fMono, fontSize: 11, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>↼ volver</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── No Stars ─────────────────────────────────────────────────────────────────

function NoStarsState({ currentStars, adsToday, telegramId, onBack, onEarn, onAdRewarded }: {
  currentStars: number | null;
  adsToday: number;
  telegramId?: number;
  onBack: () => void;
  onEarn: () => void;
  onAdRewarded: (stars: number, remaining: number) => void;
}) {
  const [buying, setBuying] = useState<string | null>(null);

  const purchase = async (packageId: string) => {
    if (!telegramId || buying) return;
    setBuying(packageId);
    try {
      const res = await fetch('/api/stars/invoice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramId, package_id: packageId }),
      });
      const data = await res.json();
      if (data.url) {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.openTelegramLink) tg.openTelegramLink(data.url);
        else window.open(data.url, '_blank');
      }
    } catch {} finally { setBuying(null); }
  };

  return (
    <div style={{ minHeight: '100vh', background: XP.bg, color: XP.ink, fontFamily: XP.fBody }}>
      <div style={{ padding: '24px 20px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: '0 auto 14px',
            background: `${XP.gold}18`, border: `1.5px solid ${XP.gold}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
          }}>🪙</div>
          <div style={{ fontFamily: XP.fDisp, fontSize: 32, lineHeight: 0.95 }}>sin tokens</div>
          <div style={{ fontFamily: XP.fSerif, fontStyle: 'italic', fontSize: 15, color: XP.inkDim, marginTop: 6 }}>
            necesitas {REVEAL_COST} 🪙 para revelar una pista
          </div>
          <div style={{
            marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 12px', background: XP.surface, border: `1px solid ${XP.line}`, borderRadius: 999,
          }}>
            <XPMonoLabel size={9} color={XP.inkMuted}>TIENES</XPMonoLabel>
            <span style={{ fontFamily: XP.fMono, fontWeight: 700, fontSize: 13, color: XP.hot }}>
              {currentStars ?? '…'} 🪙
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <button onClick={() => purchase('sub')} disabled={!!buying} style={{
            width: '100%', padding: '16px', borderRadius: 18, cursor: 'pointer',
            background: `linear-gradient(135deg, ${XP.amethyst}22, ${XP.acid}18)`,
            border: `2px solid ${XP.acid}88`,
            display: 'flex', alignItems: 'center', gap: 14,
            opacity: buying && buying !== 'sub' ? 0.5 : 1, position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -11, left: 16, background: XP.acid, color: XP.bg,
              fontSize: 8, fontFamily: XP.fMono, fontWeight: 700, padding: '3px 10px',
              borderRadius: 999, letterSpacing: '0.1em',
            }}>MEJOR OPCIÓN</div>
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: `${XP.acid}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>🌟</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontFamily: XP.fDisp, fontSize: 18, color: XP.acid, lineHeight: 1 }}>
                {buying === 'sub' ? '...' : 'Xposed Pro · 1 mes'}
              </div>
              <XPMonoLabel size={8} color={XP.inkMuted}>✓ todas las pistas gratis · ✓ nombre ilimitado</XPMonoLabel>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: XP.fDisp, fontSize: 20, color: XP.ink, lineHeight: 1 }}>250 ⭐</div>
              <XPMonoLabel size={8} color={XP.inkMuted}>/ mes</XPMonoLabel>
            </div>
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <XPMonoLabel size={10}>GRATIS · VER ANUNCIO</XPMonoLabel>
          <div style={{ marginTop: 10 }}>
            <WatchAdButton telegramId={telegramId} adsToday={adsToday} onRewarded={onAdRewarded} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <XPMonoLabel size={10}>O COMPRA TOKENS</XPMonoLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {STAR_PACKAGES.map(pkg => (
              <button key={pkg.id} onClick={() => purchase(pkg.id)} disabled={!!buying} style={{
                width: '100%', padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                background: pkg.popular ? `${XP.gold}14` : XP.surface,
                border: `1.5px solid ${pkg.popular ? XP.gold + '88' : XP.line}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                opacity: buying && buying !== pkg.id ? 0.5 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>⭐</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontFamily: XP.fDisp, fontSize: 18, color: XP.ink, lineHeight: 1 }}>
                      {buying === pkg.id ? '...' : `${pkg.xtr} Stars`}
                    </div>
                    <XPMonoLabel size={8} color={XP.inkMuted}>PAGAS</XPMonoLabel>
                  </div>
                </div>
                <span style={{ color: XP.inkFaint, fontSize: 12 }}>→</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: XP.fDisp, fontSize: 18, color: XP.gold, lineHeight: 1 }}>{pkg.tokens} 🪙</div>
                  <XPMonoLabel size={8} color={XP.inkMuted}>RECIBES</XPMonoLabel>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{
          padding: 12, background: `${XP.acid}0D`, border: `1px solid ${XP.acid}2A`,
          borderRadius: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>🎁</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: XP.fDisp, fontSize: 14, color: XP.ink }}>gana tokens gratis</div>
            <div style={{ fontSize: 12, color: XP.inkDim }}>completa misiones diarias</div>
          </div>
          <button onClick={onEarn} style={{
            background: XP.acid, color: XP.bg, border: 'none',
            padding: '6px 12px', borderRadius: 8, fontFamily: XP.fMono, fontSize: 9, fontWeight: 700, cursor: 'pointer',
          }}>IR →</button>
        </div>

        <button onClick={onBack} style={{
          width: '100%', background: 'none', border: 'none', color: XP.inkMuted,
          fontFamily: XP.fMono, fontSize: 11, cursor: 'pointer',
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>↼ volver</button>
      </div>
    </div>
  );
}
