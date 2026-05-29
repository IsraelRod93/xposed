'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'capturing' | 'done' | 'error'>('idle');
  const cardRef = useRef<HTMLDivElement>(null);

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

  const displayLink = `xpos.ed/${shareLink || '...'}`;

  const handleShare = async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);
    setStatus('capturing');

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        logging: false,
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png', 1);
      });

      const file = new File([blob], 'xposed-story.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Xposed' });
        setStatus('done');
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'xposed-story.png';
        a.click();
        URL.revokeObjectURL(url);
        setStatus('done');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') setStatus('error');
      else setStatus('idle');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div style={{
      width: '100vw', height: '100dvh', position: 'relative', overflow: 'hidden',
      background: '#000',
      fontFamily: XP.fBody, color: XP.ink,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Ambient background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(circle at 10% 10%, ${XP.acid}33 0%, transparent 50%),
          radial-gradient(circle at 90% 90%, ${XP.amethyst}33 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, ${XP.surface} 0%, #000 100%)
        `,
      }} />
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

      {/* Decorative bars */}
      <div style={{ position: 'absolute', top: '12%', left: '-5%', transform: 'rotate(-15deg)', opacity: 0.4 }}>
        <XPRedacted width={200} height={32} color={XP.line} />
      </div>
      <div style={{ position: 'absolute', bottom: '20%', right: '-10%', transform: 'rotate(10deg)', opacity: 0.4 }}>
        <XPRedacted width={250} height={40} color={XP.line} />
      </div>

      {/* THE CARD — this is what gets captured */}
      <div ref={cardRef} style={{
        position: 'relative', zIndex: 30,
        width: '88%', maxWidth: 340,
        transform: 'rotate(-2deg)',
        filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.8))',
      }}>
        <div style={{
          position: 'absolute', inset: -4,
          background: `linear-gradient(135deg, ${XP.acid}, ${XP.amethyst})`,
          borderRadius: 32, opacity: 0.3, filter: 'blur(20px)',
        }} />
        <div style={{
          background: XP.surface, borderRadius: 30,
          padding: '28px 22px 22px', position: 'relative',
          border: `2.5px solid ${XP.line}`,
          boxShadow: `inset 0 0 20px rgba(214,255,61,0.05)`,
          overflow: 'hidden',
        }}>
          <XPCorners color={XP.acid} size={18} inset={12} thickness={2.5} />
          <div style={{
            position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%) rotate(1deg)',
            zIndex: 10,
          }}>
            <XPTape color={XP.acid} rotate={0} style={{ padding: '6px 18px', fontSize: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
              · MENSAJE ANÓNIMO ·
            </XPTape>
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <XPWordmark size={20} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <XPPulseDot size={8} />
              <XPMonoLabel size={10} weight={700}>EN VIVO</XPMonoLabel>
            </div>
          </div>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <div style={{ fontFamily: XP.fDisp, fontSize: 36, lineHeight: 0.85, letterSpacing: '-0.03em', color: XP.ink }}>dime ese</div>
            <div style={{ fontFamily: XP.fSerif, fontStyle: 'italic', fontSize: 48, lineHeight: 1, color: XP.acid, margin: '4px 0', textShadow: `0 0 15px ${XP.acid}33` }}>
              secreto
            </div>
            <div style={{ fontFamily: XP.fDisp, fontSize: 24, color: XP.inkDim }}>que no te atreves</div>
          </div>
          <div style={{
            marginTop: 24, padding: '18px 16px', background: XP.bg,
            border: `1.5px dashed ${XP.line}`, borderRadius: 18,
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
          }}>
            <span style={{ width: 3, height: 26, background: XP.acid, display: 'inline-block' }} />
            <span style={{ color: XP.inkMuted, fontSize: 17, fontStyle: 'italic', fontFamily: XP.fSerif }}>escribe algo aquí...</span>
          </div>
          <div style={{
            marginTop: 20, padding: '14px 16px', background: XP.acid,
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: `0 10px 25px -5px ${XP.acid}66, inset 0 -4px 0 ${XP.acidDeep}`,
          }}>
            <span style={{ fontFamily: XP.fDisp, fontSize: 18, color: XP.bg }}>toca para enviar</span>
            <span style={{ color: XP.bg, fontSize: 22, fontWeight: 900 }}>→</span>
          </div>
          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <div style={{ width: '40%', height: 1, background: XP.line, margin: '0 auto 12px' }} />
            <XPMonoLabel size={10} color={XP.inkFaint} style={{ letterSpacing: '0.2em' }}>
              {displayLink.toUpperCase()}
            </XPMonoLabel>
          </div>
        </div>
      </div>

      {/* SHARE BUTTON */}
      <div style={{
        position: 'absolute', bottom: 48, width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        padding: '0 24px', boxSizing: 'border-box',
      }}>
        <button
          onClick={handleShare}
          disabled={sharing}
          style={{
            width: '100%', maxWidth: 340, height: 54, borderRadius: 18, border: 'none',
            background: sharing ? XP.surface2 : `linear-gradient(135deg, ${XP.acid}, #a8ff3e)`,
            color: sharing ? XP.inkMuted : XP.bg,
            fontFamily: XP.fDisp, fontSize: 20, letterSpacing: '-0.01em',
            cursor: sharing ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: sharing ? 'none' : `0 12px 30px -8px ${XP.acid}88, inset 0 -3px 0 ${XP.acidDeep}`,
            transition: 'all .2s',
            opacity: sharing ? 0.6 : 1,
          }}
        >
          {sharing ? (
            <>
              <span style={{ fontSize: 18 }}>⏳</span>
              {status === 'capturing' ? 'generando...' : 'compartiendo...'}
            </>
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              compartir historia
            </>
          )}
        </button>

        {status === 'done' && (
          <XPMonoLabel size={10} color={XP.acid}>✓ imagen lista — elige Instagram Stories en el menú</XPMonoLabel>
        )}
        {status === 'error' && (
          <XPMonoLabel size={10} color={XP.hot}>⚠ toma captura manual y comparte desde galería</XPMonoLabel>
        )}
      </div>

      <style jsx global>{`
        body { background: #000 !important; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
