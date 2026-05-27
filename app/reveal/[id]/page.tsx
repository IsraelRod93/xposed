'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { XP } from '@/lib/tokens';
import {
  XPMonoLabel,
  XPPulseDot,
  XPCorners,
  XPStarChip,
} from '@/components/XP';

const REVEAL_COST = 50;

const STAR_PACKAGES = [
  { id: '100',  stars: 100,  xtr: 1,  popular: false, bonus: null },
  { id: '500',  stars: 500,  xtr: 5,  popular: true,  bonus: '+100 gratis' },
  { id: '1000', stars: 1000, xtr: 10, popular: false, bonus: '+250 gratis' },
] as const;

export default function RevealPage() {
  const { id } = useParams();
  const router = useRouter();
  const [phase, setPhase] = useState('scanning');
  const [scrambleOs, setScrambleOs] = useState('iOS');
  const [scrambleCountry, setScrambleCountry] = useState('España');
  const [error, setError] = useState<string | null>(null);
  const [noStars, setNoStars] = useState(false);
  const [userStars, setUserStars] = useState<number | null>(null);
  const [tgUser, setTgUser] = useState<any>(null);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) setTgUser(tg.initDataUnsafe?.user);
  }, []);

  // Fetch star balance as soon as we know the user
  useEffect(() => {
    if (!tgUser) return;
    fetch(`/api/inbox/${tgUser.id}`)
      .then(r => r.json())
      .then(data => setUserStars(data.user?.stars ?? null))
      .catch(() => {});
  }, [tgUser]);

  useEffect(() => {
    if (!tgUser || !id) return;

    const startReveal = async () => {
      try {
        const res = await fetch('/api/reveal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_id: tgUser.id, message_id: id }),
        });

        const data = await res.json();
        if (res.ok) {
          runAnimation(data.sender_os || 'Desconocido', data.sender_country || 'Desconocido');
        } else if (res.status === 403) {
          setNoStars(true);
          setPhase('idle');
        } else {
          setError(data.error || 'Error al revelar pista');
          setPhase('idle');
        }
      } catch {
        setError('Error de conexión');
        setPhase('idle');
      }
    };

    startReveal();
  }, [tgUser, id]);

  const runAnimation = (finalOs: string, finalCountry: string) => {
    const osPool = ['Windows', 'Android', 'iOS', 'MacOS', 'Linux', 'iPad'];
    const ctyPool = ['España', 'México', 'Chile', 'Argentina', 'Colombia', 'Perú', 'USA', 'Brasil'];
    let i = 0;
    const interval = setInterval(() => {
      setScrambleOs(osPool[i % osPool.length]);
      setScrambleCountry(ctyPool[i % ctyPool.length]);
      i++;
      if (i > 20) {
        clearInterval(interval);
        setScrambleOs(finalOs);
        setScrambleCountry(finalCountry);
        setTimeout(() => setPhase('done'), 400);
      }
    }, 90);
  };

  return (
    <div style={{
      minHeight: '100vh', background: XP.bg, color: XP.ink,
      fontFamily: XP.fBody, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 50% 35%, ${XP.acid}1F, transparent 55%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(${XP.line} 1px, transparent 1px), linear-gradient(90deg, ${XP.line} 1px, transparent 1px)`,
        backgroundSize: '36px 36px', opacity: 0.4, pointerEvents: 'none',
      }} />

      <div style={{ padding: '54px 18px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => router.back()}
            style={{
              width: 32, height: 32, borderRadius: 10, background: XP.surface,
              border: `1px solid ${XP.line}`, color: XP.ink, cursor: 'pointer',
            }}>←</button>
          <XPMonoLabel size={10}>ANALIZANDO REMITENTE</XPMonoLabel>
          <div style={{ width: 32 }} />
        </div>
      </div>

      {noStars ? (
        <NoStarsState
          currentStars={userStars}
          telegramId={tgUser?.id}
          onBack={() => router.back()}
          onEarn={() => router.push('/')}
        />
      ) : error ? (
        <div style={{ padding: '40px 22px', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>⚠️</div>
          <h2 style={{ fontFamily: XP.fDisp, fontSize: 24, marginBottom: 10 }}>{error}</h2>
          <button
            onClick={() => router.back()}
            style={{ background: XP.surface, color: XP.ink, padding: '10px 20px', borderRadius: 10, border: `1px solid ${XP.line}` }}
          >Volver</button>
        </div>
      ) : (
        <>
          <div style={{ padding: '20px 22px 0', position: 'relative', zIndex: 2 }}>
            <div style={{
              padding: '14px 16px', background: XP.surface,
              border: `1px solid ${XP.line}`, borderRadius: 16,
            }}>
              <XPMonoLabel size={9}>MENSAJE EN PROCESO</XPMonoLabel>
              <div style={{
                marginTop: 6, fontFamily: XP.fSerif, fontStyle: 'italic',
                fontSize: 15, color: XP.inkDim, lineHeight: 1.35,
              }}>
                "Localizando datos del remitente..."
              </div>
            </div>
          </div>

          <div style={{
            margin: '24px 22px 0', position: 'relative', zIndex: 2,
            padding: 22, background: XP.surface,
            border: `1px solid ${phase === 'scanning' ? XP.acid : XP.line}`,
            borderRadius: 24, overflow: 'hidden',
            boxShadow: phase === 'scanning' ? `0 0 40px -10px ${XP.acid}88` : 'none',
            transition: 'box-shadow .3s, border-color .3s',
          }}>
            <XPCorners color={phase === 'scanning' ? XP.acid : XP.line} size={12} inset={10} thickness={1.5} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <XPPulseDot size={6} color={phase === 'scanning' ? XP.acid : XP.inkFaint} />
                <XPMonoLabel size={9} color={phase === 'scanning' ? XP.acid : XP.inkMuted}>
                  {phase === 'scanning' ? 'TRIANGULANDO...' : phase === 'done' ? 'TRAZA RECUPERADA' : 'EN ESPERA'}
                </XPMonoLabel>
              </div>
              <XPMonoLabel size={9} color={XP.inkFaint}>#X-{phase === 'done' ? id?.toString().slice(0, 6).toUpperCase() : '????'}</XPMonoLabel>
            </div>

            <SlotRow icon="⌬" label="DISPOSITIVO" value={scrambleOs} state={phase} />
            <div style={{ height: 1, background: XP.line, margin: '14px 0' }} />
            <SlotRow icon="◎" label="ORIGEN" value={scrambleCountry} state={phase} />

            {phase === 'scanning' && (
              <div style={{ marginTop: 18, height: 3, background: XP.bg, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  position: 'absolute', inset: 0, width: '50%',
                  background: `linear-gradient(90deg, transparent, ${XP.acid}, transparent)`,
                  animation: 'xp-scan 1.4s linear infinite',
                }} />
              </div>
            )}
          </div>

          <div style={{ padding: '18px 22px 0', position: 'relative', zIndex: 2 }}>
            {phase === 'done' && (
              <div style={{
                padding: '12px 14px', background: `${XP.acid}14`, border: `1px solid ${XP.acid}55`,
                borderRadius: 14, animation: 'xp-rise .4s ease-out',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🎯</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: XP.fDisp, fontSize: 18, lineHeight: 1 }}>
                      alguien con <span style={{ color: XP.acid }}>{scrambleOs}</span> en <span style={{ color: XP.acid }}>{scrambleCountry}</span>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <XPMonoLabel size={9} color={XP.inkMuted}>DATOS EXTRAÍDOS EXITOSAMENTE</XPMonoLabel>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '20px 22px 28px', position: 'relative', zIndex: 2 }}>
            {phase === 'done' ? (
              <button
                onClick={() => router.push('/')}
                style={{
                  width: '100%', height: 52, borderRadius: 16, border: 'none',
                  background: XP.acid, color: XP.bg,
                  fontFamily: XP.fDisp, fontSize: 18, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: `inset 0 -2px 0 ${XP.acidDeep}`,
                }}>
                volver al inbox
              </button>
            ) : (
              <button style={{
                width: '100%', height: 56, borderRadius: 16, border: 'none',
                background: XP.surface2, color: XP.inkDim,
                fontFamily: XP.fBody, fontSize: 14,
              }}>
                escaneando...
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── No Stars Screen ──────────────────────────────────────────────────────────

function NoStarsState({
  currentStars,
  telegramId,
  onBack,
  onEarn,
}: {
  currentStars: number | null;
  telegramId?: number;
  onBack: () => void;
  onEarn: () => void;
}) {
  const [buying, setBuying] = useState<string | null>(null);

  const buyStars = async (packageId: string) => {
    if (!telegramId || buying) return;
    setBuying(packageId);
    try {
      const res = await fetch('/api/stars/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramId, package_id: packageId }),
      });
      const data = await res.json();
      if (data.url) {
        const tg = (window as any).Telegram?.WebApp;
        if (tg?.openTelegramLink) {
          tg.openTelegramLink(data.url);
        } else {
          window.open(data.url, '_blank');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBuying(null);
    }
  };

  return (
    <div style={{ padding: '28px 20px 32px', position: 'relative', zIndex: 2 }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22, margin: '0 auto 16px',
          background: `${XP.gold}18`, border: `1.5px solid ${XP.gold}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 34,
        }}>★</div>
        <div style={{ fontFamily: XP.fDisp, fontSize: 36, lineHeight: 0.95, color: XP.ink }}>
          sin tokens
        </div>
        <div style={{
          fontFamily: XP.fSerif, fontStyle: 'italic', fontSize: 16,
          color: XP.inkDim, marginTop: 8,
        }}>
          necesitas {REVEAL_COST} 🪙 tokens para revelar esta pista
        </div>

        {/* Balance badge */}
        <div style={{
          marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', background: XP.surface,
          border: `1px solid ${XP.line}`, borderRadius: 999,
        }}>
          <XPMonoLabel size={9} color={XP.inkMuted}>SALDO ACTUAL</XPMonoLabel>
          <span style={{
            fontFamily: XP.fMono, fontWeight: 700, fontSize: 13,
            color: (currentStars ?? 0) < REVEAL_COST ? XP.hot : XP.gold,
          }}>
            {currentStars ?? '…'} 🪙
          </span>
          <XPMonoLabel size={9} color={XP.inkFaint}>/ necesitas {REVEAL_COST} 🪙</XPMonoLabel>
        </div>
      </div>

      {/* Buy packages */}
      <div style={{ marginBottom: 12 }}>
        <XPMonoLabel size={10}>COMPRAR CON TELEGRAM STARS</XPMonoLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {STAR_PACKAGES.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => buyStars(pkg.id)}
              disabled={!!buying}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 16, cursor: 'pointer',
                background: pkg.popular ? `${XP.gold}18` : XP.surface,
                border: `1.5px solid ${pkg.popular ? XP.gold : XP.line}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                opacity: buying && buying !== pkg.id ? 0.5 : 1,
                transition: 'opacity .15s', position: 'relative',
              }}
            >
              {pkg.popular && (
                <div style={{
                  position: 'absolute', top: -10, right: 12,
                  background: XP.gold, color: XP.bg, fontSize: 8,
                  fontFamily: XP.fMono, fontWeight: 700, padding: '2px 8px',
                  borderRadius: 999, whiteSpace: 'nowrap', letterSpacing: '0.08em',
                }}>
                  MEJOR VALOR
                </div>
              )}

              {/* Left: what you pay */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>⭐</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontFamily: XP.fDisp, fontSize: 20, color: XP.ink, lineHeight: 1 }}>
                    {buying === pkg.id ? '...' : `${pkg.xtr} Telegram Star${pkg.xtr > 1 ? 's' : ''}`}
                  </div>
                  <div style={{ marginTop: 2 }}>
                    <XPMonoLabel size={8} color={XP.inkMuted}>PAGAS</XPMonoLabel>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <span style={{ color: XP.inkFaint, fontSize: 14 }}>→</span>

              {/* Right: what you get */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: XP.fDisp, fontSize: 20, color: XP.gold, lineHeight: 1 }}>
                  {pkg.stars} 🪙
                </div>
                <div style={{ marginTop: 2 }}>
                  <XPMonoLabel size={8} color={XP.inkMuted}>RECIBES</XPMonoLabel>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Earn free */}
      <div style={{
        padding: 14, background: `${XP.acid}12`,
        border: `1px solid ${XP.acid}33`, borderRadius: 14, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🎁</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: XP.fDisp, fontSize: 15, lineHeight: 1.1, color: XP.ink }}>
              gana {REVEAL_COST} 🪙 tokens gratis
            </div>
            <div style={{ marginTop: 3, color: XP.inkDim, fontSize: 12 }}>
              recibe 5 secretos hoy → misión completada
            </div>
          </div>
          <button
            onClick={onEarn}
            style={{
              background: XP.acid, color: XP.bg, border: 'none',
              padding: '7px 14px', borderRadius: 10,
              fontFamily: XP.fMono, fontSize: 10, fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            IR →
          </button>
        </div>
      </div>

      {/* Back */}
      <button
        onClick={onBack}
        style={{
          width: '100%', background: 'none', border: 'none', color: XP.inkMuted,
          fontFamily: XP.fMono, fontSize: 11, cursor: 'pointer',
          textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: 4,
        }}
      >
        ↼ volver
      </button>
    </div>
  );
}

// ─── Slot Row ─────────────────────────────────────────────────────────────────

function SlotRow({ icon, label, value, state }: any) {
  const isScan = state === 'scanning';
  const isDone = state === 'done';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: isDone ? `${XP.acid}22` : XP.bg,
        border: `1px solid ${isDone ? XP.acid + '88' : XP.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isDone ? XP.acid : XP.inkDim, fontSize: 18,
        transition: 'all .3s',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <XPMonoLabel size={9}>{label}</XPMonoLabel>
        <div style={{
          marginTop: 4, height: 28, position: 'relative', overflow: 'hidden',
          fontFamily: XP.fDisp, fontSize: 24, lineHeight: 1, letterSpacing: '-0.01em',
          color: isDone ? XP.ink : isScan ? XP.inkDim : XP.inkFaint,
          textTransform: isDone ? 'none' : 'uppercase',
          filter: isScan ? 'blur(0.3px)' : 'none',
          transition: 'color .3s',
        }}>
          {value}
          {isScan && (
            <span style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(90deg, transparent, ${XP.acid}11, transparent)`,
              animation: 'xp-scan 0.9s linear infinite',
            }} />
          )}
        </div>
      </div>
      {isDone && <span style={{ color: XP.acid, fontSize: 18 }}>✓</span>}
    </div>
  );
}
