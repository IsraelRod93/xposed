'use client';

import React from 'react';
import { XP } from '@/lib/tokens';
import { 
  XPWordmark, 
  XPPulseDot, 
  XPMonoLabel, 
  XPLogoMark 
} from '@/components/XP';

export default function OnboardingPage() {
  const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME || 'xposed_bot';
  return (
    <div style={{
      minHeight: '100vh', background: XP.bg, color: XP.ink,
      fontFamily: XP.fBody, position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* drifting blobs */}
      <div style={{
        position: 'absolute', top: 60, right: -80, width: 240, height: 240,
        background: `radial-gradient(closest-side, ${XP.acid}33, transparent 70%)`,
        filter: 'blur(20px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -60, left: -60, width: 240, height: 240,
        background: `radial-gradient(closest-side, ${XP.amethyst}33, transparent 70%)`,
        filter: 'blur(20px)', pointerEvents: 'none',
      }} />
      {/* faint grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(${XP.line} 1px, transparent 1px)`,
        backgroundSize: '20px 20px', opacity: 0.25, pointerEvents: 'none',
      }} />

      <div style={{ padding: '54px 18px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <XPWordmark size={20} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <XPPulseDot size={6} color={XP.hot} />
            <XPMonoLabel size={9}>2.4M USUARIOS</XPMonoLabel>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div style={{
        flex: 1, padding: '8px 22px 0',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        position: 'relative', zIndex: 2,
      }}>
        {/* fake notifications stack */}
        <div style={{ position: 'relative', height: 200, marginBottom: 8 }}>
          <FakeNotif
            text="«No te has dado cuenta, pero…»"
            offset={{ top: 0, left: 8, right: 8 }}
            tilt={-2.5}
            scale={0.94}
            opacity={0.5}
          />
          <FakeNotif
            text="«Me gustas desde hace…»"
            offset={{ top: 22, left: 4, right: 4 }}
            tilt={1.5}
            scale={0.97}
            opacity={0.75}
          />
          <FakeNotif
            text="«Necesito decirte algo importante.»"
            offset={{ top: 48, left: 0, right: 0 }}
            tilt={-0.5}
            scale={1}
            opacity={1}
            highlight
          />
        </div>

        <div style={{
          fontFamily: XP.fDisp, fontSize: 50, lineHeight: 0.86,
          letterSpacing: '-0.02em', marginTop: 22,
        }}>
          <span>tus amigos </span>
          <span style={{ color: XP.acid }}>tienen</span>
          <br/>
          <span style={{ fontFamily: XP.fSerif, fontStyle: 'italic', fontWeight: 400 }}>algo que decirte</span>
        </div>

        <div style={{
          marginTop: 14, color: XP.inkDim, fontSize: 15, lineHeight: 1.4, maxWidth: 290,
        }}>
          Crea tu link. Mándalo a tus historias. Recibe secretos anónimos. Paga ★ para descubrir quién fue.
        </div>
      </div>

      {/* trust strip */}
      <div style={{
        padding: '14px 22px 0', display: 'flex', gap: 12,
        position: 'relative', zIndex: 2,
      }}>
        <Trust value="100%" label="ANÓNIMO" />
        <Trust value="2.4M" label="USUARIOS" color={XP.acid} />
        <Trust value="4.9★" label="EN STORE" />
      </div>

      {/* CTA */}
      <div style={{ padding: '20px 18px 28px', position: 'relative', zIndex: 2 }}>
        <button 
          onClick={() => window.location.href = `https://t.me/${BOT_USERNAME}`}
          style={{
            width: '100%', height: 60, borderRadius: 18, border: 'none',
            background: XP.acid, color: XP.bg,
            fontFamily: XP.fDisp, fontSize: 22, letterSpacing: '-0.01em',
            cursor: 'pointer', position: 'relative', overflow: 'hidden',
            boxShadow: `0 12px 30px -10px ${XP.acid}99, inset 0 -3px 0 ${XP.acidDeep}`,
          }}>
          <span style={{ position: 'relative', zIndex: 2 }}>crear mi link →</span>
          <span style={{
            position: 'absolute', top: 0, bottom: 0, width: '40%',
            background: `linear-gradient(90deg, transparent, ${XP.ink}55, transparent)`,
            animation: 'xp-scan 2.4s linear infinite',
          }} />
        </button>
        <div style={{
          marginTop: 10, textAlign: 'center',
        }}>
          <XPMonoLabel size={9.5} color={XP.inkFaint}>
            GRATIS · SIN APP · SIN REGISTRO
          </XPMonoLabel>
        </div>
      </div>
    </div>
  );
}

function FakeNotif({ text, offset, tilt, scale, opacity, highlight }: any) {
  return (
    <div style={{
      position: 'absolute', ...offset, height: 64,
      transform: `rotate(${tilt}deg) scale(${scale})`, opacity,
      background: highlight ? XP.surface : XP.surface2,
      border: `1px solid ${highlight ? XP.acid + '88' : XP.line}`,
      borderRadius: 16, padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: highlight ? `0 12px 32px -10px ${XP.acid}66` : 'none',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: XP.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <XPLogoMark size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <XPMonoLabel size={9} color={highlight ? XP.acid : XP.inkMuted}>
            XPOSED · ANÓNIMO
          </XPMonoLabel>
          <XPMonoLabel size={9} color={XP.inkFaint}>AHORA</XPMonoLabel>
        </div>
        <div style={{
          marginTop: 3, fontFamily: XP.fSerif, fontStyle: 'italic',
          fontSize: 14, color: XP.ink, lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {text}
        </div>
      </div>
    </div>
  );
}

function Trust({ value, label, color = XP.ink }: any) {
  return (
    <div style={{
      flex: 1, padding: '10px 6px', borderRadius: 12,
      background: XP.surface, border: `1px solid ${XP.line}`,
      textAlign: 'center',
    }}>
      <div style={{ fontFamily: XP.fDisp, fontSize: 18, color, lineHeight: 1 }}>{value}</div>
      <div style={{ marginTop: 4 }}>
        <XPMonoLabel size={8}>{label}</XPMonoLabel>
      </div>
    </div>
  );
}
