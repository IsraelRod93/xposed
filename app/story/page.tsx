'use client';

import React, { useState, useEffect } from 'react';
import { XP } from '@/lib/tokens';
import { 
  XPWordmark, 
  XPPulseDot, 
  XPMonoLabel, 
  XPCorners, 
  XPTape,
  XPRedacted
} from '@/components/XP';

export default function StoryPage() {
  const [user, setUser] = useState<any>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.initDataUnsafe?.user) {
      const tgUser = tg.initDataUnsafe.user;
      setUser(tgUser);
      fetch(`/api/inbox/${tgUser.id}`)
        .then(r => r.json())
        .then(data => { if (data.user?.share_link) setShareLink(data.user.share_link); })
        .catch(() => {});
    }
  }, []);

  const username = user?.username || 'tu_nombre';
  const displayLink = `xpos.ed/${shareLink || '...'}`;

  return (
    <div style={{
      width: '100vw', height: '100dvh', position: 'relative', overflow: 'hidden',
      background: '#000', // Deep black for max contrast
      fontFamily: XP.fBody, color: XP.ink,
      display: 'grid', placeItems: 'center', // Robust centering
    }}>
      {/* --- PREMIUM AMBIENT BACKGROUND --- */}
      
      {/* Heavy animated-like glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(circle at 10% 10%, ${XP.acid}33 0%, transparent 50%),
          radial-gradient(circle at 90% 90%, ${XP.amethyst}33 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, ${XP.surface} 0%, #000 100%)
        `,
        opacity: 1,
      }} />

      {/* Brand Grid Layer */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(${XP.line} 1px, transparent 1px),
          linear-gradient(90deg, ${XP.line} 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        opacity: 0.2,
        maskImage: 'radial-gradient(circle, black, transparent 80%)',
      }} />

      {/* Design accents (Redacted bars) */}
      <div style={{ position: 'absolute', top: '12%', left: '-5%', transform: 'rotate(-15deg)', opacity: 0.6 }}>
        <XPRedacted width={200} height={32} color={XP.line} />
      </div>
      <div style={{ position: 'absolute', bottom: '15%', right: '-10%', transform: 'rotate(10deg)', opacity: 0.6 }}>
        <XPRedacted width={250} height={40} color={XP.line} />
      </div>

      {/* --- THE STICKER CARD --- */}
      <div style={{
        position: 'relative', zIndex: 30,
        width: '88%', maxWidth: 340,
        transform: 'rotate(-2deg)',
        filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.8))',
      }}>
        {/* Neon outer glow */}
        <div style={{
          position: 'absolute', inset: -4,
          background: `linear-gradient(135deg, ${XP.acid}, ${XP.amethyst})`,
          borderRadius: 32,
          opacity: 0.3,
          filter: 'blur(20px)',
        }} />

        <div style={{
          background: XP.surface, // Slightly lighter than black to see the card shape
          borderRadius: 30, 
          padding: '28px 22px 22px',
          position: 'relative',
          border: `2.5px solid ${XP.line}`,
          boxShadow: `inset 0 0 20px rgba(214,255,61,0.05)`, // Subtle inner lime glow
          overflow: 'hidden',
        }}>
          {/* Decorative Crosshair Corners */}
          <XPCorners color={XP.acid} size={18} inset={12} thickness={2.5} />

          {/* Floating Tape */}
          <div style={{
            position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%) rotate(1deg)',
            zIndex: 10,
          }}>
            <XPTape color={XP.acid} rotate={0} style={{ padding: '6px 18px', fontSize: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
              · MENSAJE ANÓNIMO ·
            </XPTape>
          </div>

          {/* Wordmark Header */}
          <div style={{
            marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <XPWordmark size={20} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <XPPulseDot size={8} />
              <XPMonoLabel size={10} weight={700}>EN VIVO</XPMonoLabel>
            </div>
          </div>

          {/* The "Hook" Content */}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <div style={{ fontFamily: XP.fDisp, fontSize: 36, lineHeight: 0.85, letterSpacing: '-0.03em', color: XP.ink }}>
              dime ese
            </div>
            <div style={{
              fontFamily: XP.fSerif, fontStyle: 'italic',
              fontSize: 48, lineHeight: 1, color: XP.acid,
              margin: '4px 0',
              textShadow: `0 0 15px ${XP.acid}33`,
            }}>
              secreto
            </div>
            <div style={{ fontFamily: XP.fDisp, fontSize: 24, color: XP.inkDim }}>
              que no te atreves
            </div>
          </div>

          {/* Simulated Input Field */}
          <div style={{
            marginTop: 24, padding: '18px 16px', background: XP.bg,
            border: `1.5px dashed ${XP.line}`, borderRadius: 18,
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
          }}>
            <span style={{
              width: 3, height: 26, background: XP.acid,
              animation: 'xp-tick 1s steps(2) infinite',
            }} />
            <span style={{ color: XP.inkMuted, fontSize: 17, fontStyle: 'italic', fontFamily: XP.fSerif }}>
              escribe algo aquí...
            </span>
          </div>

          {/* Button CTA */}
          <div style={{
            marginTop: 20, padding: '14px 16px', background: XP.acid,
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: `0 10px 25px -5px ${XP.acid}66, inset 0 -4px 0 ${XP.acidDeep}`,
          }}>
            <span style={{ fontFamily: XP.fDisp, fontSize: 18, color: XP.bg }}>
              toca para enviar
            </span>
            <span style={{ color: XP.bg, fontSize: 22, fontWeight: 900 }}>→</span>
          </div>

          {/* Personalized Footer */}
          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <div style={{ width: '40%', height: 1, background: XP.line, margin: '0 auto 12px' }} />
            <XPMonoLabel size={10} color={XP.inkFaint} style={{ letterSpacing: '0.2em' }}>
              {displayLink.toUpperCase()}
            </XPMonoLabel>
          </div>
        </div>
      </div>

      {/* --- INSTRUCTIONS FOR USER --- */}
      <div style={{
        position: 'absolute', bottom: 60, width: '100%', textAlign: 'center',
        animation: 'xp-rise 1s ease-out both',
        animationDelay: '0.5s',
      }}>
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
          padding: '10px 20px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <span style={{ fontSize: 20 }}>📸</span>
          <XPMonoLabel size={11} color="#fff">TOMA CAPTURA Y COMPARTE</XPMonoLabel>
        </div>
      </div>

      {/* Visual cleanup for Story Interface */}
      <style jsx global>{`
        body { background: #000 !important; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
