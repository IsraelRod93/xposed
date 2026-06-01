'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { XP } from '@/lib/tokens';
import { 
  XPWordmark, 
  XPPulseDot, 
  XPMonoLabel, 
  XPCorners, 
  XPTierChip, 
  XPCounter 
} from '@/components/XP';

const publicPromptRotation = [
  '¿Qué piensas de mí... de verdad?',
  'Dime ese secreto que nunca te atreviste',
  '¿Algún crush? ¿Algún beef?',
  'Suelta el chisme. Yo no sabré quién fuiste.',
  'Una cosa que cambiarías de mí',
];

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora mismo';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function getTierByRank(rank: number): 'legend' | 'gold' | 'silver' | 'bronze' {
  if (rank <= 3) return 'legend';
  if (rank <= 10) return 'gold';
  if (rank <= 25) return 'silver';
  return 'bronze';
}

export default function PublicSender({ initialReceiver }: { initialReceiver?: any }) {
  const { link } = useParams();
  const [receiver, setReceiver] = useState<any>(initialReceiver);
  const [content, setContent] = useState('');
  const [promptIdx, setPromptIdx] = useState(0);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(!initialReceiver);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialReceiver && link) {
      async function fetchReceiver() {
        try {
          const res = await fetch(`/api/user/by-link/${link}`);
          if (res.ok) {
            const data = await res.json();
            setReceiver(data);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
      fetchReceiver();
    }
  }, [link, initialReceiver]);

  useEffect(() => {
    if (focused || sent) return;
    const t = setInterval(() => setPromptIdx(i => (i + 1) % publicPromptRotation.length), 3200);
    return () => clearInterval(t);
  }, [focused, sent]);

  const send = async () => {
    if (!content.trim() || isSending || !receiver) return;
    setIsSending(true);
    setSendError(null);

    const ua = window.navigator.userAgent;
    let os = "Otro";
    if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "MacOS";

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          share_link: link,
          content,
          sender_os: os,
        }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setSendError(data.error || 'No se pudo enviar. Inténtalo de nuevo.');
      }
    } catch (err) {
      console.error(err);
      setSendError('Error de conexión. Revisa tu internet.');
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: XP.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <XPPulseDot size={12} />
    </div>
  );

  if (!receiver && !loading) return (
    <div style={{ minHeight: '100vh', background: XP.bg, color: XP.ink, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
      <h1 style={{ fontFamily: XP.fDisp, fontSize: 32, marginBottom: 10 }}>Link no válido</h1>
      <p style={{ color: XP.inkDim }}>Este link de Xposed no existe o ha sido eliminado.</p>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: XP.bg, color: XP.ink,
      fontFamily: XP.fBody, position: 'relative', overflowX: 'hidden',
    }}>
      {/* ambient lime glow blob */}
      <div style={{
        position: 'absolute', top: -80, right: -60, width: 260, height: 260,
        background: `radial-gradient(closest-side, ${XP.acid}33, transparent 70%)`,
        filter: 'blur(20px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: 120, left: -90, width: 220, height: 220,
        background: `radial-gradient(closest-side, ${XP.amethyst}22, transparent 70%)`,
        filter: 'blur(20px)', pointerEvents: 'none',
      }} />

      {/* HUD top */}
      <div style={{
        padding: '54px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 2,
      }}>
        <XPWordmark size={20} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <XPPulseDot size={6} />
          <XPMonoLabel size={9}>EN VIVO</XPMonoLabel>
        </div>
      </div>

      {sent ? <SentState onReset={() => { setSent(false); setContent(''); }} referralCode={receiver?.share_link} /> : (
        <>
          {/* RECEIVER CARD */}
          <div style={{ padding: '20px 18px 0', position: 'relative', zIndex: 2 }}>
            <div style={{
              position: 'relative', padding: 20, background: XP.surface,
              border: `1px solid ${XP.line}`, borderRadius: 22,
            }}>
              <XPCorners color={XP.acid} size={10} inset={8} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 18,
                  background: `linear-gradient(135deg, ${XP.acid}, ${XP.amethyst})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: XP.fDisp, fontSize: 28, color: XP.bg,
                  boxShadow: `0 0 0 2px ${XP.bg}, 0 0 0 3px ${XP.acid}55`,
                }}>{(receiver.display_name || receiver.username)?.[0].toUpperCase() || 'X'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 17 }}>{receiver.display_name || `@${receiver.username}`}</span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill={XP.acid}>
                      <path d="M7 0l1.6 1.7 2.3-.3.5 2.3 2 1.1-1 2.2 1 2.2-2 1.1-.5 2.3-2.3-.3L7 14l-1.6-1.7-2.3.3-.5-2.3-2-1.1 1-2.2-1-2.2 2-1.1.5-2.3 2.3.3z"/>
                      <path d="M4.5 7l1.7 1.7L9.5 5.4" stroke={XP.bg} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>  
                    </svg>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <XPTierChip tier={getTierByRank(receiver.rank ?? 999)} compact />
                  </div>
                </div>
              </div>

              {/* gamification strip */}
              <div style={{
                marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${XP.line}`,
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              }}>
                <StatCell value={(receiver.message_count ?? 0).toString()} label="SECRETOS" />
                <StatCell value={`🔥 ${receiver.streak_count ?? 0}`} label="RACHA DÍAS" color={XP.hot} />
                <StatCell value={receiver.rank ? `#${receiver.rank}` : '?'} label="EN RANK" color={XP.acid} />
              </div>
            </div>
          </div>

          {/* FOMO strip */}
          <div style={{ padding: '10px 18px 0', position: 'relative', zIndex: 2 }}>
            <div style={{
              padding: '10px 14px', background: `${XP.hot}0D`,
              border: `1px solid ${XP.hot}33`, borderRadius: 14,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <XPPulseDot size={5} color={XP.hot} />
              <span style={{ fontFamily: XP.fMono, fontSize: 11, color: XP.inkDim, letterSpacing: '0.04em', flex: 1 }}>
                {(receiver.recent_count ?? 0) >= 2
                  ? `${receiver.recent_count} personas ya enviaron hoy`
                  : (receiver.recent_count ?? 0) === 1
                  ? '1 persona ya envió hoy · ¿y tú?'
                  : (receiver.message_count ?? 0) > 0
                  ? 'sé el primero en enviar hoy'
                  : 'sé el primero en enviarle algo'}
                {receiver.last_message_at && (receiver.recent_count ?? 0) > 0
                  ? ` · hace ${relativeTime(receiver.last_message_at)}`
                  : ''}
              </span>
            </div>
          </div>

          {/* HOOK */}
          <div style={{ padding: '22px 22px 0', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: XP.fDisp, fontSize: 28, lineHeight: 1, color: XP.ink }}>
                {receiver.display_name || receiver.username}
              </span>
              <span style={{ fontFamily: XP.fSerif, fontStyle: 'italic', fontSize: 26, color: XP.acid, lineHeight: 1 }}>
                quiere saber
              </span>
            </div>
            <div style={{ position: 'relative', height: 26, marginTop: 6 }}>
              {publicPromptRotation.map((p, i) => (
                <div key={i} style={{
                  position: 'absolute', inset: 0,
                  opacity: i === promptIdx ? 1 : 0,
                  transform: i === promptIdx ? 'translateY(0)' : 'translateY(6px)',
                  transition: 'opacity .5s, transform .5s',
                  color: XP.inkDim, fontSize: 15, fontStyle: 'italic',
                  fontFamily: XP.fSerif,
                }}>
                  «{p}»
                </div>
              ))}
            </div>
          </div>

          {/* TEXTAREA */}
          <div style={{ padding: '18px 18px 0', position: 'relative', zIndex: 2 }}>
            <div style={{
              position: 'relative', background: XP.surface2,
              border: `1.5px solid ${focused ? XP.acid : XP.line}`,
              borderRadius: 22, padding: 16, transition: 'border-color .2s',
              boxShadow: focused ? `0 0 0 4px ${XP.acid}1F` : 'none',
            }}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="escribe sin miedo... no sabrá que fuiste tú"
                maxLength={300}
                style={{
                  width: '100%', minHeight: 110, background: 'transparent',
                  border: 'none', outline: 'none', resize: 'none',
                  color: XP.ink, fontFamily: XP.fBody, fontSize: 16, lineHeight: 1.4,
                  caretColor: XP.acid,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill={XP.inkMuted}>
                    <path d="M6 1.5a3 3 0 0 0-3 3v1.2A2.3 2.3 0 0 0 1.5 8v1.7A1.3 1.3 0 0 0 2.8 11h6.4a1.3 1.3 0 0 0 1.3-1.3V8a2.3 2.3 0 0 0-1.5-2.3V4.5a3 3 0 0 0-3-3zm-2 4.2V4.5a2 2 0 0 1 4 0v1.2H4z"/>
                  </svg>
                  <XPMonoLabel size={9}>CIFRADO · ANÓNIMO</XPMonoLabel>
                </div>
                <XPMonoLabel size={10} color={content.length > 250 ? XP.hot : XP.inkMuted}>
                  {content.length}/300
                </XPMonoLabel>
              </div>
            </div>
          </div>

          {/* live counter */}
          <div style={{
            padding: '16px 18px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 6, position: 'relative', zIndex: 2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <XPPulseDot size={5} color={XP.hot} />
              <span style={{ fontFamily: XP.fMono, fontSize: 11, color: XP.inkDim, letterSpacing: '0.05em' }}>
                <XPCounter to={142903} /> secretos enviados HOY
              </span>
            </div>
            <XPMonoLabel size={8.5} color={XP.inkFaint}>
              TU IDENTIDAD NUNCA SE REVELA · SE REGISTRAN DATOS APROXIMADOS (PAÍS, DISPOSITIVO, HORA) PARA SEGURIDAD
            </XPMonoLabel>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: XP.fMono, fontSize: 8.5, color: XP.inkMuted,
                textDecoration: 'underline', marginTop: 2,
              }}
            >
              Privacidad y términos
            </a>
          </div>

          {/* spacer so content isn't hidden behind fixed send bar */}
          <div style={{ height: 'calc(84px + env(safe-area-inset-bottom, 20px))' }} />
        </>
      )}

      {/* FIXED SEND BAR — always above Safari toolbar */}
      {!sent && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          padding: `10px 18px calc(10px + env(safe-area-inset-bottom, 20px))`,
          background: `linear-gradient(to top, ${XP.bg} 75%, transparent)`,
        }}>
          {sendError && (
            <div style={{
              marginBottom: 8, padding: '8px 14px',
              background: `${XP.hot}0D`, border: `1px solid ${XP.hot}55`,
              borderRadius: 10, fontFamily: XP.fMono, fontSize: 11,
              color: XP.hot, textAlign: 'center',
            }}>
              ⚠ {sendError}
            </div>
          )}
          <button
            onClick={send}
            disabled={!content.trim() || isSending}
            style={{
              width: '100%', height: 60, borderRadius: 18, border: 'none',
              background: content.trim() ? XP.acid : XP.surface2,
              color: content.trim() ? XP.bg : XP.inkMuted,
              fontFamily: XP.fDisp, fontSize: 22, letterSpacing: '-0.01em',
              cursor: content.trim() ? 'pointer' : 'not-allowed',
              position: 'relative', overflow: 'hidden',
              boxShadow: content.trim() ? `0 12px 30px -10px ${XP.acid}99, inset 0 -3px 0 ${XP.acidDeep}` : 'none',
              transition: 'all .15s',
              opacity: isSending ? 0.7 : 1,
            }}>
            <span style={{ position: 'relative', zIndex: 2 }}>{isSending ? 'enviando...' : 'enviar secreto'}</span>
            {content.trim() && !isSending && (
              <span style={{
                position: 'absolute', top: 0, bottom: 0, width: '40%',
                background: `linear-gradient(90deg, transparent, ${XP.ink}55, transparent)`,
                animation: 'xp-scan 2.4s linear infinite',
              }} />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function StatCell({ value, label, color = XP.ink }: { value: string, label: string, color?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 4px', borderLeft: `1px dashed ${XP.line}`, marginLeft: -1 }}>
      <div style={{ fontFamily: XP.fDisp, fontSize: 20, color, lineHeight: 1 }}>{value}</div>
      <div style={{ marginTop: 4 }}>
        <XPMonoLabel size={8}>{label}</XPMonoLabel>
      </div>
    </div>
  );
}

function SentState({ onReset, referralCode }: { onReset: () => void; referralCode?: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '/';
  const joinUrl = referralCode ? `${appUrl}?ref=${referralCode}` : appUrl;
  return (
    <div style={{
      padding: '40px 22px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 2,
    }}>
      <div style={{
        width: 96, height: 96, marginBottom: 22, position: 'relative',
        animation: 'xp-bob 2.4s ease-in-out infinite',
      }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 24,
          background: XP.surface, border: `1.5px solid ${XP.acid}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 40px ${XP.acid}55`,
        }}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <path d="M6 14l16 12 16-12" stroke={XP.acid} strokeWidth="2" strokeLinejoin="round"/>
            <rect x="6" y="10" width="32" height="24" rx="3" stroke={XP.acid} strokeWidth="2"/>
            <path d="M14 22l8 6 8-6" stroke={XP.bg} strokeWidth="6" />
          </svg>
        </div>
      </div>
      <div style={{ fontFamily: XP.fDisp, fontSize: 38, lineHeight: 0.95 }}>
        entregado
      </div>
      <div style={{ fontFamily: XP.fSerif, fontStyle: 'italic', fontSize: 19, color: XP.inkDim, marginTop: 8 }}>
        sin rastro · sin vuelta atrás
      </div>

      <div style={{
        marginTop: 28, padding: '14px 16px', background: XP.surface,
        border: `1px dashed ${XP.line}`, borderRadius: 16, width: '100%', maxWidth: 320,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <XPMonoLabel size={9}>SUMA TU NOMBRE A LA LISTA</XPMonoLabel>
          <XPPulseDot size={5} />
        </div>
        <div style={{ fontFamily: XP.fDisp, fontSize: 17, lineHeight: 1.15, marginBottom: 10 }}>
          crea tu propio link.<br/>
          mira qué dicen de ti.
        </div>
        <button
          onClick={() => window.location.href = joinUrl}
          style={{
            width: '100%', height: 42, borderRadius: 12, border: 'none',
            background: XP.ink, color: XP.bg, fontFamily: XP.fBody,
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>
          crea tu propio link →
        </button>
      </div>

      <button onClick={onReset} style={{
        marginTop: 18, background: 'none', border: 'none', color: XP.inkMuted,
        fontFamily: XP.fMono, fontSize: 11, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>
        ↼ enviar otro secreto
      </button>
    </div>
  );
}
