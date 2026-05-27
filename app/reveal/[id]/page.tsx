'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { XP } from '@/lib/tokens';
import { 
  XPMonoLabel, 
  XPPulseDot, 
  XPCorners, 
  XPStarChip 
} from '@/components/XP';

export default function RevealPage() {
  const { id } = useParams();
  const router = useRouter();
  const [phase, setPhase] = useState('scanning'); // 'idle' | 'scanning' | 'done'
  const [scrambleOs, setScrambleOs] = useState('iOS');
  const [scrambleCountry, setScrambleCountry] = useState('España');
  const [error, setError] = useState<string | null>(null);
  const [tgUser, setTgUser] = useState<any>(null);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      setTgUser(tg.initDataUnsafe?.user);
    }
  }, []);

  useEffect(() => {
    if (!tgUser || !id) return;

    const startReveal = async () => {
      try {
        const res = await fetch('/api/reveal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_id: tgUser.id,
            message_id: id
          })
        });

        const data = await res.json();
        if (res.ok) {
          runAnimation(data.sender_os || 'Desconocido', data.sender_country || 'Desconocido');
        } else {
          setError(data.error || "Error al revelar pista");
          setPhase('idle');
        }
      } catch (err) {
        console.error(err);
        setError("Error de conexión");
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

      {error ? (
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
                “Localizando datos del remitente...”
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

            <SlotRow
              icon="⌬"
              label="DISPOSITIVO"
              value={scrambleOs}
              state={phase}
            />
            <div style={{ height: 1, background: XP.line, margin: '14px 0' }} />
            <SlotRow
              icon="◎"
              label="ORIGEN"
              value={scrambleCountry}
              state={phase}
            />

            {phase === 'scanning' && (
              <div style={{
                marginTop: 18, height: 3, background: XP.bg, borderRadius: 2, overflow: 'hidden', position: 'relative',
              }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
              </div>
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
      {isDone && (
        <span style={{ color: XP.acid, fontSize: 18 }}>✓</span>
      )}
    </div>
  );
}
