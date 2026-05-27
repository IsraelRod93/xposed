'use client';

import React, { useState, useEffect } from 'react';
import { XP } from '@/lib/tokens';
import { 
  XPMonoLabel, 
  XPTierChip,
  XPPulseDot
} from '@/components/XP';

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    if (user) {
      fetchData(user.id);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchData(telegramId: number) {
    try {
      const res = await fetch(`/api/inbox/${telegramId}`);
      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: XP.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <XPPulseDot size={12} />
    </div>
  );

  const badges = [
    { icon: '🔥', label: 'INFERNO',    sub: 'racha 14d', owned: (userData?.streak_count >= 14), color: XP.hot },
    { icon: '👁', label: 'OJO',        sub: '5000 🪙 usados', owned: (userData?.stars_spent >= 5000), color: XP.acid },
    { icon: '✦',  label: 'POPULAR',    sub: 'top 5% MX',  owned: true,  color: XP.gold },
    { icon: '✉',  label: 'BUZÓN PLENO',sub: '247 secretos', owned: true, color: XP.diamond },
    { icon: '◍',  label: 'NOCTURNO',   sub: 'recibe 3am', owned: false, color: XP.amethyst },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: XP.bg, color: XP.ink,
      fontFamily: XP.fBody, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -100, right: -80, width: 300, height: 300,
        background: `radial-gradient(closest-side, ${XP.gold}22, transparent 70%)`,
        filter: 'blur(20px)', pointerEvents: 'none',
      }} />

      <div style={{ padding: '54px 18px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => window.history.back()}
            style={{
              width: 32, height: 32, borderRadius: 10, background: XP.surface,
              border: `1px solid ${XP.line}`, color: XP.ink, cursor: 'pointer',
            }}>←</button>
          <XPMonoLabel size={10}>TU PERFIL</XPMonoLabel>
          <div style={{ width: 32 }} />
        </div>
      </div>

      {/* AVATAR HERO */}
      <div style={{
        padding: '24px 22px 0', position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 96, height: 96, borderRadius: 28,
            background: `linear-gradient(135deg, ${XP.acid}, ${XP.amethyst})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: XP.fDisp, fontSize: 46, color: XP.bg,
            boxShadow: `0 0 0 3px ${XP.bg}, 0 0 0 4px ${XP.gold}`,
          }}>{userData?.username?.[0].toUpperCase() || 'X'}</div>
          <div style={{
            position: 'absolute', bottom: -6, right: -10,
            background: XP.bg, border: `1px solid ${XP.gold}`, borderRadius: 999,
            padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ fontSize: 9, color: XP.gold }}>◆◆◆</span>
            <XPMonoLabel size={8} color={XP.gold}>NV.{Math.floor((userData?.stars || 0) / 100) + 1}</XPMonoLabel>
          </div>
        </div>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: XP.fDisp, fontSize: 26, lineHeight: 1 }}>@{userData?.username || 'usuario'}</span>
          <svg width="16" height="16" viewBox="0 0 14 14" fill={XP.acid}>
            <path d="M7 0l1.6 1.7 2.3-.3.5 2.3 2 1.1-1 2.2 1 2.2-2 1.1-.5 2.3-2.3-.3L7 14l-1.6-1.7-2.3.3-.5-2.3-2-1.1 1-2.2-1-2.2 2-1.1.5-2.3 2.3.3z"/>
            <path d="M4.5 7l1.7 1.7L9.5 5.4" stroke={XP.bg} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ marginTop: 6 }}>
          <XPTierChip tier={stats?.weekly > 50 ? 'gold' : 'silver'} percentile={3} compact />
        </div>
      </div>

      {/* STAT GRID */}
      <div style={{ padding: '22px 18px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <BigStat
            value={stats?.weekly?.toString() || '0'}
            label="SECRETOS SEMANALES"
            extra="esta semana"
            color={XP.acid}
          />
          <BigStat
            value={userData?.streak_count?.toString() || '0'}
            label="DÍAS DE RACHA"
            extra="récord personal"
            color={XP.hot}
            glyph="🔥"
          />
          <BigStat
            value={stats?.rank ? `#${stats.rank}` : '?'}
            label="RANK NACIONAL"
            extra="semanal"
            color={XP.diamond}
          />
          <BigStat
            value={userData?.stars?.toString() || '0'}
            label="TOKENS"
            extra="saldo actual"
            color={XP.gold}
            glyph="◆"
          />
        </div>
      </div>

      {/* BADGES */}
      <div style={{ padding: '20px 18px 28px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <XPMonoLabel size={10}>INSIGNIAS</XPMonoLabel>
          <XPMonoLabel size={9} color={XP.acid}>VER TODAS →</XPMonoLabel>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {badges.map((b, i) => (
            <div key={i} style={{
              aspectRatio: '1', padding: 8, borderRadius: 14,
              background: b.owned ? XP.surface : 'transparent',
              border: `1px ${b.owned ? 'solid' : 'dashed'} ${b.owned ? (b.color || XP.line) + '55' : XP.line}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              opacity: b.owned ? 1 : 0.45,
            }}>
              <div style={{
                fontSize: 22, color: b.color || XP.inkMuted,
                filter: b.owned ? 'none' : 'grayscale(1)',
              }}>{b.icon}</div>
              <div style={{ marginTop: 4 }}>
                <XPMonoLabel size={8} color={b.owned ? (b.color || XP.ink) : XP.inkFaint} weight={700}>
                  {b.label}
                </XPMonoLabel>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BigStat({ value, label, extra, color = XP.ink, glyph }: any) {
  return (
    <div style={{
      padding: '14px 14px 12px', background: XP.surface,
      border: `1px solid ${XP.line}`, borderRadius: 16,
      position: 'relative', overflow: 'hidden',
    }}>
      {glyph && (
        <div style={{
          position: 'absolute', top: 8, right: 10, fontSize: 14, opacity: 0.5,
        }}>{glyph}</div>
      )}
      <div style={{ fontFamily: XP.fDisp, fontSize: 32, color, lineHeight: 0.9 }}>{value}</div>
      <div style={{ marginTop: 6 }}>
        <XPMonoLabel size={9}>{label}</XPMonoLabel>
      </div>
      {extra && (
        <div style={{ marginTop: 3, fontSize: 11, color: XP.inkDim }}>{extra}</div>
      )}
    </div>
  );
}
