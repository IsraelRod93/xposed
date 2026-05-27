'use client';

import React, { useState, useEffect } from 'react';
import { 
  XPWordmark, 
  XPPulseDot, 
  XPMonoLabel, 
  XPCounter, 
  XPStarChip, 
  XPTierChip, 
  XPTape, 
  XPRedacted 
} from '@/components/XP';
import { XP } from '@/lib/tokens';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    Telegram?: any;
  }
}

const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME || 'xposed_bot';

export default function InboxPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState<any>({ weekly: 0, today: 0 });
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('inbox');
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initTg = () => {
      const tg = (window as any).Telegram?.WebApp;
      if (tg && tg.initDataUnsafe?.user) {
        tg.expand();
        const tgUser = tg.initDataUnsafe.user;
        setUser(tgUser);
        fetchInbox(tgUser.id);
      } else {
        // Retry once after 500ms if not found, then give up
        setTimeout(() => {
          const retryTg = (window as any).Telegram?.WebApp;
          if (retryTg && retryTg.initDataUnsafe?.user) {
            retryTg.expand();
            const retryUser = retryTg.initDataUnsafe.user;
            setUser(retryUser);
            fetchInbox(retryUser.id);
          } else {
            setLoading(false);
          }
        }, 500);
      }
    };

    initTg();
  }, []);

  useEffect(() => {
    if (tab === 'rank') {
      fetchRanking();
    }
  }, [tab]);

  async function fetchInbox(telegramId: number) {
    try {
      const res = await fetch(`/api/inbox/${telegramId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setUserData(data.user);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching inbox:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRanking() {
    try {
      const res = await fetch('/api/ranking');
      if (res.ok) {
        const data = await res.json();
        setRanking(data);
      }
    } catch (err) {
      console.error("Error fetching ranking:", err);
    }
  }

  const copyLink = async () => {
    if (!userData) return;
    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const appUrl = rawAppUrl.endsWith("/") ? rawAppUrl.slice(0, -1) : rawAppUrl;
    const fullLink = `${appUrl}/u/${userData.share_link}`;
    
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: XP.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <XPPulseDot size={12} />
    </div>
  );

  if (!user && !loading) return (
    <div style={{ minHeight: '100vh', background: XP.bg, color: XP.ink, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center' }}>
      <h1 style={{ fontFamily: XP.fDisp, fontSize: 32, marginBottom: 10 }}>Acceso denegado</h1>
      <p style={{ color: XP.inkDim, marginBottom: 20 }}>Esta aplicación solo funciona dentro de Telegram.</p>
      <button 
        onClick={() => window.location.href = `https://t.me/${BOT_USERNAME}`}
        style={{ background: XP.acid, color: XP.bg, padding: '12px 24px', borderRadius: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}
      >
        Abrir en Telegram
      </button>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: XP.bg, color: XP.ink,
      fontFamily: XP.fBody, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -100, left: -80, width: 300, height: 300,
        background: `radial-gradient(closest-side, ${XP.acid}1F, transparent 70%)`,
        filter: 'blur(20px)', pointerEvents: 'none',
      }} />

      {/* TOP BAR */}
      <div style={{
        padding: '54px 18px 0', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 2,
      }}>
        <XPWordmark size={20} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <XPStarChip amount={userData?.stars || 0} />
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: XP.surface, border: `1px solid ${XP.line}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={XP.ink} strokeWidth="1.6">
              <circle cx="6" cy="6" r="4"/>
              <path d="m9 9 3.5 3.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* HERO — your status */}
      <div style={{ padding: '18px 18px 0', position: 'relative', zIndex: 2 }}>
        <div style={{
          position: 'relative', padding: '18px 18px 16px',
          background: `linear-gradient(135deg, ${XP.surface}, ${XP.surface2})`,
          border: `1px solid ${XP.line}`, borderRadius: 22, overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: `linear-gradient(90deg, transparent, ${XP.acid}, transparent)`,
            opacity: 0.6, animation: 'xp-scan 4s linear infinite',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <XPMonoLabel size={9}>TU XPOSURE</XPMonoLabel>
            <XPTierChip tier={stats.weekly > 50 ? 'gold' : 'silver'} percentile={3} compact />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 8 }}>
            <div style={{ fontFamily: XP.fDisp, fontSize: 62, lineHeight: 0.85, color: XP.ink }}>
              <XPCounter to={messages.length} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: XP.fSerif, fontStyle: 'italic', fontSize: 18, color: XP.acid, lineHeight: 1 }}>
                secretos
              </div>
              <div style={{ marginTop: 4 }}>
                <XPMonoLabel size={9}>+{stats.weekly} ESTA SEMANA</XPMonoLabel>
              </div>
            </div>
          </div>

          {/* progression bar to next tier */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <XPMonoLabel size={9}>ACTUAL</XPMonoLabel>
              <XPMonoLabel size={9} color={XP.diamond}>PRÓXIMO NIVEL</XPMonoLabel>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: XP.bg, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: 0, width: `${Math.min(100, (stats.weekly / 100) * 100)}%`,
                background: `linear-gradient(90deg, ${XP.gold}, ${XP.diamond})`,
                borderRadius: 3,
              }} />
            </div>
          </div>

          {/* mini stat row */}
          <div style={{
            marginTop: 14, display: 'flex', gap: 8,
          }}>
            <MiniBadge icon="🔥" value={userData?.streak_count?.toString() || '0'} label="días" />
            <MiniBadge icon="#" value={stats.rank?.toString() || '?'} label="RANK" color={XP.acid} />
            <MiniBadge icon="◆" value={stats.weekly > 100 ? 'LEGEND' : stats.weekly > 50 ? 'GOLD' : stats.weekly > 10 ? 'SILVER' : 'BRONCE'} label="tier" color={XP.gold} />
            <MiniBadge icon="🪙" value={userData?.stars?.toString() || '0'} label="tokens" color={XP.gold} />
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{
        padding: '18px 18px 0', display: 'flex', gap: 8,
        position: 'relative', zIndex: 2,
      }}>
        {[
          { id: 'inbox', label: 'Inbox', count: messages.filter(m => !m.is_clue_revealed).length || undefined },
          { id: 'rank',  label: 'Ranking' },
          { id: 'link',  label: 'Mi link' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px 0', borderRadius: 12,
            background: tab === t.id ? XP.ink : XP.surface,
            color: tab === t.id ? XP.bg : XP.ink,
            border: `1px solid ${tab === t.id ? XP.ink : XP.line}`,
            fontFamily: XP.fBody, fontWeight: 600, fontSize: 13,
            cursor: 'pointer', transition: 'all .15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {t.label}
            {t.count !== undefined && (
              <span style={{
                background: tab === t.id ? XP.acid : XP.hot, color: XP.bg,
                fontSize: 10, fontFamily: XP.fMono, padding: '1px 6px',
                borderRadius: 999, fontWeight: 700,
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ padding: '14px 18px 28px', position: 'relative', zIndex: 2 }}>
        {tab === 'inbox' && (
          messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', border: `2px dashed ${XP.line}`, borderRadius: 22, marginTop: 10 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📩</div>
              <div style={{ fontFamily: XP.fSerif, fontStyle: 'italic', fontSize: 18, color: XP.inkDim }}>
                Aún no tienes secretos.<br/>¡Comparte tu link!
              </div>
            </div>
          ) : (
            messages.map(m => <SealedEnvelope key={m.id} msg={m} telegramId={user?.id} onReveal={() => fetchInbox(user.id)} />)
          )
        )}
        {tab === 'rank'  && <RankingMini ranking={ranking} currentUserId={user?.id} />}
        {tab === 'link'  && (
          <LinkPanel
            shareLink={userData?.share_link}
            onCopy={copyLink}
            copied={copied}
            todayCount={stats.today}
            telegramId={user?.id}
            onClaim={() => fetchInbox(user.id)}
            currentDisplayName={userData?.display_name || ''}
          />
        )}
      </div>
    </div>
  );
}

function MiniBadge({ icon, value, label, color = XP.ink }: { icon: string, value: string, label: string, color?: string }) {
  return (
    <div style={{
      flex: 1, padding: '8px 6px', borderRadius: 12,
      background: XP.bg, border: `1px solid ${XP.line}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
    }}>
      <div style={{ fontSize: 11, color }}>{icon}</div>
      <div style={{ fontFamily: XP.fMono, fontWeight: 700, fontSize: 12, color }}>{value}</div>
      <XPMonoLabel size={7.5} color={XP.inkFaint}>{label}</XPMonoLabel>
    </div>
  );
}

function SealedEnvelope({ msg, telegramId, onReveal }: { msg: any, telegramId: number, onReveal: () => void }) {
  const router = useRouter();
  const revealed = msg.is_clue_revealed;

  const handleReveal = async () => {
    if (revealed) return;
    router.push(`/reveal/${msg.id}`);
  };

  const timeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours} h`;
    return then.toLocaleDateString();
  };

  return (
    <div style={{
      marginTop: 10, position: 'relative', borderRadius: 18,
      background: XP.surface, border: `1px solid ${!revealed ? XP.acid + '88' : XP.line}`,
      overflow: 'hidden',
      boxShadow: !revealed ? `0 0 24px -8px ${XP.acid}66` : 'none',
    }}>
      {!revealed && (
        <div style={{
          position: 'absolute', top: 10, right: -28, zIndex: 2,
        }}>
          <XPTape color={XP.acid} rotate={32}>NUEVO</XPTape>
        </div>
      )}

      <div style={{ padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={!revealed ? XP.acid : XP.inkMuted} strokeWidth="1.4">
              <rect x="1" y="3" width="12" height="9" rx="1"/>
              <path d="M1 4l6 4 6-4"/>
            </svg>
            <XPMonoLabel size={9} color={!revealed ? XP.acid : XP.inkMuted}>
              ANÓNIMO · {timeAgo(msg.created_at)}
            </XPMonoLabel>
          </div>
        </div>

        <div style={{
          fontFamily: XP.fSerif, fontStyle: 'italic', fontSize: 17, lineHeight: 1.35, color: XP.ink,
        }}>
          “{msg.content}”
        </div>

        <div style={{
          marginTop: 14, padding: '10px 12px', background: XP.bg,
          border: `1px dashed ${XP.line}`, borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <ClueSlot icon="⌬" label="DISPOSITIVO" value={msg.sender_os} revealed={revealed} />
          <div style={{ width: 1, height: 24, background: XP.line }} />
          <ClueSlot icon="◎" label="PAÍS" value={msg.sender_country} revealed={revealed} />
        </div>

        <button onClick={handleReveal} disabled={revealed} style={{
          marginTop: 10, width: '100%', height: 44, borderRadius: 12, border: 'none',
          background: revealed ? XP.surface2 : XP.acid,
          color: revealed ? XP.inkMuted : XP.bg,
          fontFamily: XP.fBody, fontWeight: 700, fontSize: 14,
          cursor: revealed ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: revealed ? 'none' : `inset 0 -2px 0 ${XP.acidDeep}`,
        }}>
          {revealed ? (
            <>
              <span>✓</span> pistas reveladas
            </>
          ) : (
            <>
              revelar pista
              <XPStarChip amount={50} color={XP.bg} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ClueSlot({ icon, label, value, revealed }: { icon: string, label: string, value: string, revealed: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: XP.acid, fontSize: 10 }}>{icon}</span>
        <XPMonoLabel size={8}>{label}</XPMonoLabel>
      </div>
      <div style={{ marginTop: 3 }}>
        {revealed ? (
          <span style={{ fontFamily: XP.fMono, fontSize: 13, fontWeight: 600, color: XP.acid }}>
            {value}
          </span>
        ) : (
          <XPRedacted width={Math.min(64, value.length * 8)} height={11} color={XP.line} />
        )}
      </div>
    </div>
  );
}

function RankingMini({ ranking, currentUserId }: { ranking: any[], currentUserId?: number }) {
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{
        padding: '12px 14px', background: XP.surface, border: `1px solid ${XP.line}`,
        borderRadius: 14, marginBottom: 10,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <XPMonoLabel size={10}>RANKING NACIONAL</XPMonoLabel>
          <XPMonoLabel size={9} color={XP.acid}>SEMANAL</XPMonoLabel>
        </div>
      </div>
      {ranking.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20, color: XP.inkDim }}>Cargando ranking...</div>
      ) : (
        ranking.map((u: any) => (
          <div key={u.rank} style={{
            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
            background: u.telegram_id === currentUserId ? `${XP.acid}10` : 'transparent',
            border: `1px solid ${u.telegram_id === currentUserId ? XP.acid + '55' : XP.line}`,
            borderRadius: 12, marginBottom: 6,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              width: 32, textAlign: 'center', fontFamily: XP.fDisp, fontSize: 22,
              color: u.rank <= 3 ? XP.acid : XP.inkDim, lineHeight: 1,
            }}>
              {u.rank}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {u.name}{u.telegram_id === currentUserId && <span style={{ color: XP.acid, fontFamily: XP.fMono, fontSize: 10, marginLeft: 6 }}>· TÚ</span>}
              </div>
              <div style={{ marginTop: 3 }}>
                <XPTierChip tier={u.tier} compact />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: XP.fDisp, fontSize: 18, color: XP.ink, lineHeight: 1 }}>
                {u.count.toLocaleString('es')}
              </div>
              <XPMonoLabel size={8}>SECRETOS</XPMonoLabel>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function LinkPanel({ shareLink, onCopy, copied, todayCount = 0, telegramId, onClaim, currentDisplayName }: { shareLink?: string, onCopy: () => void, copied: boolean, todayCount?: number, telegramId?: number, onClaim?: () => void, currentDisplayName?: string }) {
  const router = useRouter();
  const MISSION_GOAL = 5;
  const MISSION_REWARD = 100;
  const progress = Math.min(100, (todayCount / MISSION_GOAL) * 100);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(currentDisplayName || '');
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const fullLink = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/u/${shareLink}`;
  const shareText = `Dime tus secretos anónimos en Xposed 🤫: ${fullLink}`;

  const handleShare = (platform: string) => {
    onCopy();

    switch(platform) {
      case 'WhatsApp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'Twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'Instagram':
      case 'TikTok':
        router.push('/story');
        break;
    }
  };

  const [nameError, setNameError] = useState<string | null>(null);

  const saveName = async () => {
    if (!telegramId || savingName) return;
    setSavingName(true);
    setNameSaved(false);
    setNameError(null);
    try {
      const res = await fetch('/api/user/display-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramId, display_name: displayName }),
      });
      const data = await res.json();
      if (res.ok) {
        setNameSaved(true);
      } else {
        setNameError(data.error || 'Error al guardar');
      }
    } catch {
      setNameError('Error de conexión');
    } finally {
      setSavingName(false);
    }
  };

  const claimReward = async () => {
    if (todayCount < MISSION_GOAL || claiming || claimed) return;
    setClaiming(true);
    setClaimError(null);
    try {
      const res = await fetch('/api/mission/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramId })
      });
      const data = await res.json();
      if (res.ok) {
        setClaimed(true);
        onClaim?.();
      } else if (data.error === 'Mission already completed today') {
        setClaimed(true);
      } else {
        setClaimError(data.error || 'Error al reclamar');
      }
    } catch {
      setClaimError('Error de conexión');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div style={{ marginTop: 4 }}>

      {/* Display name */}
      <div style={{
        padding: 18, background: XP.surface, border: `1px solid ${XP.line}`,
        borderRadius: 18, marginBottom: 12,
      }}>
        <XPMonoLabel size={10}>TU NOMBRE EN EL RANKING</XPMonoLabel>
        <div style={{ marginTop: 4, marginBottom: 10 }}>
          <XPMonoLabel size={8} color={XP.inkMuted}>Elige cómo apareces en el ranking — puede ser tu nombre, apodo, lo que quieras</XPMonoLabel>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={displayName}
            onChange={e => { setDisplayName(e.target.value.slice(0, 32)); setNameSaved(false); setNameError(null); }}
            onKeyDown={e => e.key === 'Enter' && saveName()}
            placeholder="ej: Ana👑, ElRey, 🦊 Nico..."
            maxLength={32}
            style={{
              flex: 1, height: 40, padding: '0 12px',
              background: XP.bg,
              border: `1px solid ${nameError ? XP.hot : nameSaved ? XP.acid : XP.line}`,
              borderRadius: 10, color: XP.ink,
              fontFamily: XP.fBody, fontSize: 14,
              outline: 'none', transition: 'border-color .2s',
            }}
          />
          <button
            onClick={saveName}
            disabled={savingName || !displayName.trim()}
            style={{
              height: 40, padding: '0 16px', borderRadius: 10, border: 'none',
              background: nameSaved ? `${XP.acid}33` : XP.acid,
              color: nameSaved ? XP.acid : XP.bg,
              fontFamily: XP.fMono, fontWeight: 700, fontSize: 11,
              cursor: 'pointer', whiteSpace: 'nowrap',
              opacity: savingName || !displayName.trim() ? 0.5 : 1,
              transition: 'all .2s',
            }}
          >
            {savingName ? '...' : nameSaved ? '✓ GUARDADO' : 'GUARDAR'}
          </button>
        </div>
        {nameError && (
          <div style={{ marginTop: 8 }}>
            <XPMonoLabel size={8} color={XP.hot}>⚠ {nameError}</XPMonoLabel>
          </div>
        )}
        {nameSaved && !nameError && (
          <div style={{ marginTop: 8 }}>
            <XPMonoLabel size={8} color={XP.acid}>✓ Nombre guardado — ya aparece en el ranking</XPMonoLabel>
          </div>
        )}
      </div>

      <div style={{
        padding: 18, background: XP.surface, border: `1px solid ${XP.line}`,
        borderRadius: 18, marginBottom: 12,
      }}>
        <XPMonoLabel size={10}>TU LINK DE XPOSED</XPMonoLabel>
        <div style={{
          marginTop: 10, padding: 14, background: XP.bg, border: `1px dashed ${XP.line}`,
          borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontFamily: XP.fMono, fontSize: 13, color: XP.ink, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            xpos.ed/{shareLink || '...'}
          </span>
          <button 
            onClick={onCopy}
            style={{
              background: copied ? '#4ade80' : XP.acid, 
              color: XP.bg, border: 'none', height: 32, padding: '0 14px',
              borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
            {copied ? 'copiado' : 'copiar'}
          </button>
        </div>
      </div>

      <div style={{
        padding: 16, background: XP.surface, border: `1px solid ${XP.line}`,
        borderRadius: 18, marginBottom: 12,
      }}>
        <XPMonoLabel size={10}>COMPÁRTELO EN</XPMonoLabel>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {['Instagram', 'TikTok', 'Twitter', 'WhatsApp'].map(p => (
            <button 
              key={p} 
              onClick={() => handleShare(p)}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: 12,
                background: XP.bg, border: `1px solid ${XP.line}`, color: XP.ink,
                fontFamily: XP.fMono, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>{p.slice(0,4)}</button>
          ))}
        </div>
      </div>

      <div style={{
        padding: 16, background: `linear-gradient(135deg, ${XP.acid}1A, transparent)`,
        border: `1px solid ${XP.acid}44`, borderRadius: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 16 }}>🎁</span>
          <XPMonoLabel size={10} color={XP.acid}>MISIÓN DEL DÍA</XPMonoLabel>
        </div>
        <div style={{ fontFamily: XP.fDisp, fontSize: 17, lineHeight: 1.15 }}>
          recibe 5 secretos hoy<br/>
          <span style={{ color: XP.acid }}>+100 🪙 tokens gratis</span>
        </div>
        
        <div style={{ marginTop: 10, height: 5, borderRadius: 3, background: XP.bg, overflow: 'hidden', position: 'relative' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: XP.acid, borderRadius: 3, transition: 'width 0.5s ease' }} />
        </div>
        
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <XPMonoLabel size={9}>{todayCount} / {MISSION_GOAL}</XPMonoLabel>
          {todayCount >= MISSION_GOAL ? (
            <button
              onClick={claimReward}
              disabled={claiming || claimed}
              style={{
                background: claimed ? XP.surface2 : XP.acid,
                color: claimed ? XP.inkDim : XP.bg,
                border: 'none', padding: '4px 10px', borderRadius: 6,
                fontFamily: XP.fMono, fontSize: 9, fontWeight: 700, cursor: 'pointer'
              }}
            >
              {claimed ? '✓ RECLAMADO' : claiming ? 'PROCESANDO...' : 'RECLAMAR 🪙'}
            </button>
          ) : (
            <XPMonoLabel size={9} color={XP.inkMuted}>FALTAN {MISSION_GOAL - todayCount}</XPMonoLabel>
          )}
        </div>
        {claimError && (
          <div style={{ marginTop: 6 }}>
            <XPMonoLabel size={8} color={XP.hot}>⚠ {claimError}</XPMonoLabel>
          </div>
        )}
      </div>
    </div>
  );
}
