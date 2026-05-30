'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
const WatchAdButton = lazy(() => import('@/components/WatchAdButton'));
import {
  XPWordmark,
  XPPulseDot,
  XPMonoLabel,
  XPCounter,
  XPStarChip,
  XPTierChip,
  TIERS,
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
  const [discover, setDiscover] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState('inbox');
  const [copied, setCopied] = useState(false);
  const [mission, setMission] = useState<any>(null);
  const [missionClaiming, setMissionClaiming] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initTg = () => {
      const tg = (window as any).Telegram?.WebApp;
      if (tg && tg.initDataUnsafe?.user) {
        tg.expand();
        if (tg.requestFullscreen) tg.requestFullscreen();
        const tgUser = tg.initDataUnsafe.user;
        setUser(tgUser);
        fetchInbox(tgUser.id);
      } else {
        // Retry once after 500ms if not found, then give up
        setTimeout(() => {
          const retryTg = (window as any).Telegram?.WebApp;
          if (retryTg && retryTg.initDataUnsafe?.user) {
            retryTg.expand();
            if (retryTg.requestFullscreen) retryTg.requestFullscreen();
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
    if (tab === 'rank') fetchRanking();
    if (tab === 'discover') fetchDiscover();
  }, [tab]);

  useEffect(() => {
    if (user?.id) fetchMission(user.id);
  }, [user]);

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

  async function fetchMission(telegramId: number) {
    try {
      const res = await fetch(`/api/mission?telegram_id=${telegramId}`);
      if (res.ok) setMission(await res.json());
    } catch {}
  }

  async function claimMission(missionId: string, telegramId: number) {
    if (missionClaiming) return;
    setMissionClaiming(true);
    try {
      const res = await fetch('/api/mission/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramId, mission_id: missionId }),
      });
      if (res.ok) {
        await fetchMission(telegramId);
        await fetchInbox(telegramId);
      }
    } catch {}
    finally { setMissionClaiming(false); }
  }

  async function fetchRanking() {
    try {
      const res = await fetch('/api/ranking');
      if (res.ok) setRanking(await res.json());
    } catch (err) {
      console.error("Error fetching ranking:", err);
    }
  }

  async function fetchDiscover() {
    try {
      const res = await fetch('/api/discover');
      if (res.ok) setDiscover(await res.json());
    } catch {}
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
      height: 'var(--tg-viewport-height, 100vh)',
      background: XP.bg, color: XP.ink,
      fontFamily: XP.fBody, position: 'relative',
      overflowY: 'auto', overflowX: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -100, left: -80, width: 300, height: 300,
        background: `radial-gradient(closest-side, ${XP.acid}1F, transparent 70%)`,
        filter: 'blur(20px)', pointerEvents: 'none',
      }} />

      {/* TOP BAR */}
      <div style={{
        paddingTop: 'calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 16px)',
        paddingLeft: 18, paddingRight: 18, paddingBottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 2,
      }}>
        <XPWordmark size={20} />
        <XPStarChip amount={userData?.stars || 0} />
      </div>

      {/* CARD ZONE — contenedor único para consistencia de altura */}
      <div style={{ padding: '18px 18px 0', position: 'relative', zIndex: 2 }}>
        {tab === 'inbox' && (
          <div style={{
            ...CARD_STYLE,
            background: `linear-gradient(135deg, ${XP.surface}, ${XP.surface2})`,
            border: `1px solid ${XP.line}`,
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg, transparent, ${XP.acid}, transparent)`,
              opacity: 0.6, animation: 'xp-scan 4s linear infinite',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <XPMonoLabel size={9}>TU XPOSURE</XPMonoLabel>
              <XPTierChip tier={
                stats.rank <= 3 ? 'legend'
                : stats.rank <= 10 ? 'gold'
                : stats.rank <= 25 ? 'silver'
                : 'bronze'
              } compact />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 8 }}>
              <div style={{ fontFamily: XP.fDisp, fontSize: 62, lineHeight: 0.85, color: XP.ink }}>
                <XPCounter to={messages.length} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontFamily: XP.fSerif, fontStyle: 'italic', fontSize: 18, color: XP.acid, lineHeight: 1 }}>secretos</div>
                <div style={{ marginTop: 4 }}><XPMonoLabel size={9}>+{stats.today} HOY · DÍA {userData?.streak_count || 1}</XPMonoLabel></div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <XPMonoLabel size={9}>ACTUAL · {
                  stats.rank <= 3 ? TIERS.legend.label
                  : stats.rank <= 10 ? TIERS.gold.label
                  : stats.rank <= 25 ? TIERS.silver.label
                  : TIERS.bronze.label
                }</XPMonoLabel>
                <XPMonoLabel size={9} color={XP.inkMuted}>PRÓXIMO NIVEL</XPMonoLabel>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: XP.bg, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 3,
                  width: `${
                    stats.rank <= 3 ? 100
                    : stats.rank <= 10 ? Math.round(((10 - stats.rank) / 7) * 100)
                    : stats.rank <= 25 ? Math.round(((25 - stats.rank) / 15) * 100)
                    : Math.max(5, Math.round((1 / stats.rank) * 100))
                  }%`,
                  background: `linear-gradient(90deg, ${
                    stats.rank <= 3 ? TIERS.legend.color
                    : stats.rank <= 10 ? TIERS.gold.color
                    : stats.rank <= 25 ? TIERS.silver.color
                    : TIERS.bronze.color
                  }, ${XP.diamond})`,
                }} />
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <MiniBadge icon="🔥" value={`Día ${userData?.streak_count || 1}`} label="racha" color={XP.hot} />
              <MiniBadge icon="#" value={stats.rank?.toString() || '?'} label="RANK" color={XP.acid} />
              <MiniBadge icon="🪙" value={userData?.stars?.toString() || '0'} label="tokens" color={XP.gold} />
            </div>
          </div>
        )}
        {tab === 'rank' && (
          <MissionPanel
            mission={mission}
            claiming={missionClaiming}
            onClaim={(id) => claimMission(id, user?.id)}
          />
        )}
        {tab === 'discover' && (
          <DiscoverCard />
        )}
        {tab === 'link' && (
          <DisplayNameCard
            telegramId={user?.id}
            currentDisplayName={userData?.display_name || ''}
            stars={userData?.stars ?? 0}
            isSubscribed={!!(userData?.subscribed_until && new Date(userData.subscribed_until) > new Date())}
            onSaved={() => user?.id && fetchInbox(user.id)}
          />
        )}
      </div>

      {/* TABS */}
      <div style={{
        padding: '12px 18px 0', display: 'flex', gap: 6,
        position: 'relative', zIndex: 2,
      }}>
        {[
          { id: 'inbox',    label: 'Inbox',    count: messages.filter(m => (!m.revealed_premium || m.revealed_premium === '') && !m.is_clue_revealed).length || undefined },
          { id: 'rank',     label: 'Misión',   count: mission && !mission.allDone ? Math.max(0, mission.total - (mission.claimed?.length ?? 0)) || undefined : undefined },
          { id: 'discover', label: 'Descubrir' },
          { id: 'link',     label: 'Link', count: (userData?.referral_count ?? 0) > 0 ? (userData?.referral_count ?? 0) : undefined },
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
        {tab === 'rank' && <RankingMini ranking={ranking} currentUserId={user?.id} />}
        {tab === 'discover' && <DiscoverFeed discover={discover} appUrl={process.env.NEXT_PUBLIC_APP_URL || ''} telegramId={user?.id} stars={userData?.stars ?? 0} onBoosted={() => user?.id && fetchInbox(user.id)} />}
        {tab === 'link' && user?.id && (
          <>
            <BuyTokensCard
              telegramId={user.id}
              onPurchased={() => user?.id && fetchInbox(user.id)}
            />
            <div style={{ marginBottom: 14 }}>
              <XPMonoLabel size={10}>GANAR GRATIS</XPMonoLabel>
              <div style={{ marginTop: 10 }}>
                <Suspense fallback={null}>
                  <WatchAdButton
                    telegramId={user.id}
                    adsToday={userData?.daily_ads_watched ?? 0}
                    onRewarded={() => user?.id && fetchInbox(user.id)}
                  />
                </Suspense>
              </div>
            </div>
          </>
        )}
        {tab === 'link'  && (
          <LinkPanel
            key={userData?.share_link}
            shareLink={userData?.share_link}
            onCopy={copyLink}
            copied={copied}
            telegramId={user?.id}
            linkChanges={userData?.link_changes ?? 0}
            referralCount={userData?.referral_count ?? 0}
            onLinkUpdated={() => user?.id && fetchInbox(user.id)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Mission Panel ────────────────────────────────────────────────────────────

const CARD_H = 226;
const CARD_STYLE = {
  position: 'relative' as const,
  padding: '18px 18px 16px',
  height: CARD_H,
  boxSizing: 'border-box' as const,
  borderRadius: 22,
  overflow: 'hidden' as const,
};

function MissionPanel({ mission, claiming, onClaim }: {
  mission: any;
  claiming: boolean;
  onClaim: (id: string) => void;
}) {
  if (!mission) return null;

  const { active, claimed, total, progress, allDone } = mission;
  const completedCount = claimed?.length ?? 0;

  if (allDone) {
    return (
      <div style={{
        ...CARD_STYLE,
        background: `linear-gradient(135deg, ${XP.surface}, ${XP.surface2})`,
        border: `1px solid ${XP.gold}55`,
        boxShadow: `0 0 30px -10px ${XP.gold}44`,
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${XP.gold}, transparent)`, animation: 'xp-scan 4s linear infinite' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <XPMonoLabel size={9} color={XP.gold}>MISIONES HOY</XPMonoLabel>
          <XPMonoLabel size={9} color={XP.gold}>{completedCount}/{total} ✓</XPMonoLabel>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 8 }}>
          <div style={{ fontFamily: XP.fDisp, fontSize: 62, lineHeight: 0.85, color: XP.gold }}>🏆</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontFamily: XP.fSerif, fontStyle: 'italic', fontSize: 18, color: XP.gold, lineHeight: 1 }}>completadas</div>
            <div style={{ marginTop: 4 }}><XPMonoLabel size={9}>+{completedCount * 20} 🪙 ganados</XPMonoLabel></div>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <XPMonoLabel size={9} color={XP.gold}>MISIONES HOY</XPMonoLabel>
            <XPMonoLabel size={9} color={XP.gold}>100%</XPMonoLabel>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: XP.bg, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '100%', background: `linear-gradient(90deg, ${XP.gold}, ${XP.acid})`, borderRadius: 3 }} />
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          {['🏆', '⭐', '🎯', '✓'].map((icon, i) => (
            <div key={i} style={{ flex: 1, padding: '8px 6px', borderRadius: 12, background: `${XP.gold}0D`, border: `1px solid ${XP.gold}33`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <div style={{ fontSize: 11 }}>{icon}</div>
              <div style={{ fontFamily: XP.fMono, fontWeight: 700, fontSize: 12, color: XP.gold }}>✓</div>
              <XPMonoLabel size={7.5} color={XP.gold}>hecho</XPMonoLabel>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!active) return null;

  return (
    <div style={{
      ...CARD_STYLE,
      background: `linear-gradient(135deg, ${XP.surface}, ${XP.surface2})`,
      border: `1px solid ${XP.line}`,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${XP.acid}, transparent)`, animation: 'xp-scan 3s linear infinite' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <XPMonoLabel size={9} color={XP.acid}>MISIÓN ACTIVA</XPMonoLabel>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 10 }}>
        <div style={{ fontFamily: XP.fDisp, fontSize: 56, lineHeight: 0.85, color: XP.ink }}>🎯</div>
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontFamily: XP.fSerif, fontStyle: 'italic', fontSize: 16, color: XP.acid, lineHeight: 1.1 }}>{active.label}</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <XPMonoLabel size={9} color={XP.inkMuted}>MISIONES DEL DÍA</XPMonoLabel>
          <XPMonoLabel size={9} color={XP.inkMuted}>{completedCount}/{total}</XPMonoLabel>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: XP.bg, overflow: 'hidden', position: 'relative', marginBottom: 28 }}>
          <div style={{ position: 'absolute', inset: 0, width: `${Math.min(100, (completedCount / total) * 100)}%`, background: XP.acid, borderRadius: 2, transition: 'width .4s ease' }} />
        </div>
        <button
          onClick={() => onClaim(active.id)}
          disabled={progress < active.goal || claiming}
          style={{
            width: '100%', height: 40, borderRadius: 12, border: 'none',
            background: progress >= active.goal ? XP.acid : XP.surface2,
            color: progress >= active.goal ? XP.bg : XP.inkFaint,
            fontFamily: XP.fDisp, fontSize: 14,
            cursor: progress >= active.goal ? 'pointer' : 'default',
            boxShadow: progress >= active.goal ? `inset 0 -2px 0 ${XP.acidDeep}` : 'none',
            transition: 'all .2s',
          }}
        >
          {claiming ? '...' : `cobrar recompensa · +${active.reward} 🪙`}
        </button>
      </div>
    </div>
  );
}

// ─── Mini Badge ───────────────────────────────────────────────────────────────

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
  const [showMenu, setShowMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);

  let revealedClues: string[] = [];
  if (msg.is_clue_revealed && (!msg.revealed_premium || msg.revealed_premium === '')) {
    revealedClues = ['country', 'os'];
  } else {
    revealedClues = (msg.revealed_premium || '').split(',').filter(Boolean);
  }
  const revealedCount = revealedClues.length;
  const hasAnyRevealed = revealedCount > 0;
  const allRevealed = revealedCount >= 5;

  const handleReveal = async () => {
    router.push(`/reveal/${msg.id}`);
  };

  const hideMessage = async (report: boolean) => {
    if (busy) return;
    setBusy(true);
    const endpoint = report ? '/api/report' : '/api/messages/hide';
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramId, message_id: msg.id }),
      });
      setGone(true);
      onReveal();
    } catch {}
    setBusy(false);
    setShowMenu(false);
  };

  if (gone) return null;

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
      background: XP.surface, border: `1px solid ${!hasAnyRevealed ? XP.acid + '88' : XP.line}`,
      overflow: 'hidden',
      boxShadow: !hasAnyRevealed ? `0 0 24px -8px ${XP.acid}66` : 'none',
    }}>
      {!hasAnyRevealed && (
        <div style={{
          position: 'absolute', top: 14, right: 10, zIndex: 2,
        }}>
          <XPTape color={XP.acid} rotate={32}>NUEVO</XPTape>
        </div>
      )}

      <div style={{ padding: '14px 16px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={!hasAnyRevealed ? XP.acid : XP.inkMuted} strokeWidth="1.4">
              <rect x="1" y="3" width="12" height="9" rx="1"/>
              <path d="M1 4l6 4 6-4"/>
            </svg>
            <XPMonoLabel size={9} color={!hasAnyRevealed ? XP.acid : XP.inkMuted}>
              ANÓNIMO · {timeAgo(msg.created_at)}
            </XPMonoLabel>
          </div>
          <button onClick={() => setShowMenu(m => !m)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: XP.inkFaint, fontSize: 18, lineHeight: 1, padding: '0 4px',
          }}>⋯</button>
        </div>

        {showMenu && (
          <div style={{
            display: 'flex', gap: 8, marginBottom: 10,
            padding: '8px 10px', background: XP.bg, borderRadius: 10,
            border: `1px solid ${XP.line}`,
          }}>
            <button onClick={() => hideMessage(true)} disabled={busy} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
              background: `${XP.hot}18`, color: XP.hot,
              fontFamily: XP.fMono, fontSize: 10, fontWeight: 700, cursor: 'pointer',
            }}>🚩 Reportar</button>
            <button onClick={() => hideMessage(false)} disabled={busy} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
              background: XP.surface2, color: XP.inkMuted,
              fontFamily: XP.fMono, fontSize: 10, fontWeight: 700, cursor: 'pointer',
            }}>🗑 Eliminar</button>
          </div>
        )}

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
          <ClueSlot icon="⌬" label="DISPOSITIVO" value={msg.sender_os} revealed={revealedClues.includes('os')} />
          <div style={{ width: 1, height: 24, background: XP.line }} />
          <ClueSlot icon="◎" label="PAÍS" value={msg.sender_country} revealed={revealedClues.includes('country')} />
        </div>

        <button onClick={handleReveal} style={{
          marginTop: 10, width: '100%', height: 44, borderRadius: 12, border: 'none',
          background: allRevealed ? `${XP.surface2}` : hasAnyRevealed ? `${XP.amethyst}22` : XP.acid,
          color: allRevealed ? XP.inkMuted : hasAnyRevealed ? XP.amethyst : XP.bg,
          fontFamily: XP.fBody, fontWeight: 700, fontSize: 14,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: allRevealed ? 'none' : hasAnyRevealed ? `inset 0 0 0 1px ${XP.amethyst}55` : `inset 0 -2px 0 ${XP.acidDeep}`,
        }}>
          {allRevealed ? (
            <>✓ todas las pistas reveladas</>
          ) : hasAnyRevealed ? (
            <>{revealedCount}/5 pistas · revelar más →</>
          ) : (
            <>
              revelar primera pista
              <XPStarChip amount={25} color={XP.bg} />
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

// ─── Discover Card (header card for discover tab) ─────────────────────────────

function DiscoverCard() {
  return (
    <div style={{
      ...CARD_STYLE,
      background: `linear-gradient(135deg, ${XP.surface}, ${XP.surface2})`,
      border: `1px solid ${XP.amethyst}55`,
      boxShadow: `0 0 30px -10px ${XP.amethyst}44`,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${XP.amethyst}, transparent)`, animation: 'xp-scan 4s linear infinite' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <XPMonoLabel size={9} color={XP.amethyst}>DESCUBRIR</XPMonoLabel>
        <XPMonoLabel size={8} color={XP.inkMuted}>IMPULSA TU PERFIL</XPMonoLabel>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 8 }}>
        <div style={{ fontFamily: XP.fDisp, fontSize: 56, lineHeight: 0.85, color: XP.amethyst }}>🔍</div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: XP.fSerif, fontStyle: 'italic', fontSize: 18, color: XP.ink, lineHeight: 1 }}>perfiles activos</div>
          <div style={{ marginTop: 4 }}><XPMonoLabel size={9}>recibe más secretos apareciendo aquí</XPMonoLabel></div>
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <XPMonoLabel size={9} color={XP.amethyst}>BOOST · 100 🪙 · 24H</XPMonoLabel>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: XP.bg, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '60%', background: `linear-gradient(90deg, ${XP.amethyst}, ${XP.acid})`, borderRadius: 3 }} />
        </div>
      </div>
      <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
        <MiniBadge icon="🚀" value="top" label="boost" color={XP.amethyst} />
        <MiniBadge icon="👁️" value="más" label="visitas" color={XP.acid} />
        <MiniBadge icon="📩" value="++" label="secretos" color={XP.hot} />
      </div>
    </div>
  );
}

// ─── Discover Feed ────────────────────────────────────────────────────────────

function DiscoverFeed({ discover, appUrl, telegramId, stars, onBoosted }: {
  discover: any[];
  appUrl: string;
  telegramId?: number;
  stars: number;
  onBoosted: () => void;
}) {
  const [boosting, setBoosting] = useState(false);
  const [boostMsg, setBoostMsg] = useState<string | null>(null);

  const handleBoost = async () => {
    if (!telegramId || boosting) return;
    setBoosting(true);
    setBoostMsg(null);
    try {
      const res = await fetch('/api/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramId }),
      });
      const data = await res.json();
      if (res.ok) {
        setBoostMsg('🚀 ¡Perfil impulsado 24h!');
        onBoosted();
        (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      } else {
        setBoostMsg(data.error || 'Error');
      }
    } catch {
      setBoostMsg('Error de conexión');
    } finally {
      setBoosting(false);
    }
  };

  const shareUrl = (shareLink: string) => `${appUrl || window.location.origin}/u/${shareLink}`;

  return (
    <div style={{ marginTop: 4 }}>
      {/* Boost button */}
      <button
        onClick={handleBoost}
        disabled={boosting || stars < 100}
        style={{
          width: '100%', padding: '14px 16px', borderRadius: 14,
          background: stars >= 100 ? `${XP.amethyst}22` : XP.surface,
          border: `1.5px solid ${stars >= 100 ? XP.amethyst + '88' : XP.line}`,
          display: 'flex', alignItems: 'center', gap: 12,
          cursor: stars >= 100 ? 'pointer' : 'not-allowed',
          opacity: boosting ? 0.6 : 1, marginBottom: 10, transition: 'opacity .15s',
        }}
      >
        <span style={{ fontSize: 22 }}>🚀</span>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontFamily: XP.fDisp, fontSize: 16, color: stars >= 100 ? XP.amethyst : XP.inkMuted, lineHeight: 1 }}>
            {boosting ? 'impulsando...' : 'impulsar mi perfil · 24h'}
          </div>
          <XPMonoLabel size={8} color={XP.inkMuted}>aparecer primero en Descubrir</XPMonoLabel>
        </div>
        <div style={{ fontFamily: XP.fDisp, fontSize: 16, color: XP.amethyst }}>100 🪙</div>
      </button>
      {boostMsg && (
        <div style={{ marginBottom: 10, textAlign: 'center' }}>
          <XPMonoLabel size={9} color={boostMsg.includes('🚀') ? XP.acid : XP.hot}>{boostMsg}</XPMonoLabel>
        </div>
      )}

      {/* User cards */}
      {discover.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: XP.inkDim }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>👻</div>
          <div style={{ fontFamily: XP.fSerif, fontStyle: 'italic' }}>Aún no hay perfiles.<br/>¡Sé el primero!</div>
        </div>
      ) : (
        discover.map((u: any, i: number) => (
          <a
            key={u.telegram_id}
            href={shareUrl(u.share_link)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', marginBottom: 8,
              background: u.is_boosted ? `${XP.amethyst}10` : XP.surface,
              border: `1px solid ${u.is_boosted ? XP.amethyst + '55' : XP.line}`,
              borderRadius: 14, textDecoration: 'none', color: 'inherit',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {u.is_boosted && (
              <div style={{ position: 'absolute', top: 6, right: 8 }}>
                <XPMonoLabel size={7} color={XP.amethyst}>🚀 BOOST</XPMonoLabel>
              </div>
            )}
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: `linear-gradient(135deg, ${XP.acid}, ${XP.amethyst})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: XP.fDisp, fontSize: 22, color: XP.bg,
            }}>
              {(u.display_name || u.username)?.[0]?.toUpperCase() || 'X'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: XP.ink }}>
                {u.display_name || `@${u.username}`}
              </div>
              <XPMonoLabel size={8} color={XP.inkMuted}>{u.message_count} secretos recibidos</XPMonoLabel>
            </div>
            <div style={{ fontFamily: XP.fDisp, fontSize: 13, color: XP.acid }}>enviar →</div>
          </a>
        ))
      )}
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
          <XPMonoLabel size={10}>TOP 10</XPMonoLabel>
          <XPMonoLabel size={9} color={XP.acid}>MÁS SECRETOS</XPMonoLabel>
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

function DisplayNameCard({ telegramId, currentDisplayName, stars, isSubscribed, onSaved }: {
  telegramId?: number;
  currentDisplayName: string;
  stars: number;
  isSubscribed: boolean;
  onSaved: () => void;
}) {
  const [displayName, setDisplayName] = useState(currentDisplayName || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFirstChange = !currentDisplayName;
  const canAfford = isFirstChange || isSubscribed || stars >= 200;

  const save = async () => {
    if (!telegramId || saving) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch('/api/user/display-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramId, display_name: displayName }),
      });
      const data = await res.json();
      if (res.ok) { setSaved(true); onSaved(); }
      else setError(data.error || 'Error al guardar');
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const btnLabel = saving ? '...' : saved ? '✓ OK' : isFirstChange ? 'GUARDAR' : isSubscribed ? 'CAMBIAR · GRATIS ⭐' : `CAMBIAR · 200 🪙`;

  return (
    <div style={{
      ...CARD_STYLE,
      background: `linear-gradient(135deg, ${XP.surface}, ${XP.surface2})`,
      border: `1px solid ${XP.line}`,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${XP.acid}, transparent)`, opacity: 0.6, animation: 'xp-scan 4s linear infinite' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minHeight: 16 }}>
        {saved && <XPMonoLabel size={9} color={XP.acid}>✓ guardado</XPMonoLabel>}
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <XPMonoLabel size={9} color={XP.inkMuted}>así apareces en el ranking</XPMonoLabel>
          <XPMonoLabel size={9} color={saved ? XP.acid : XP.inkFaint}>{displayName.length}/32</XPMonoLabel>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={displayName}
            onChange={e => { setDisplayName(e.target.value.slice(0, 32)); setSaved(false); setError(null); }}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="ej: Ana👑, ElRey, 🦊 Nico..."
            maxLength={32}
            style={{
              flex: 1, height: 36, padding: '0 12px', background: XP.bg,
              border: `1px solid ${error ? XP.hot : saved ? XP.acid : XP.line}`,
              borderRadius: 10, color: XP.ink, fontFamily: XP.fBody, fontSize: 16,
              outline: 'none', transition: 'border-color .2s',
            }}
          />
          <button onClick={save} disabled={saving || !displayName.trim() || !canAfford} style={{
            height: 36, padding: '0 14px', borderRadius: 10, border: 'none',
            background: saved ? `${XP.acid}33` : canAfford ? XP.acid : XP.surface2,
            color: saved ? XP.acid : canAfford ? XP.bg : XP.inkFaint,
            fontFamily: XP.fMono, fontWeight: 700, fontSize: 10,
            cursor: canAfford ? 'pointer' : 'default', whiteSpace: 'nowrap',
            opacity: saving || !displayName.trim() ? 0.5 : 1, transition: 'all .2s',
          }}>
            {btnLabel}
          </button>
        </div>
        {error && <div style={{ marginTop: 4 }}><XPMonoLabel size={8} color={XP.hot}>⚠ {error}</XPMonoLabel></div>}
      </div>

      <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
        <MiniBadge icon="✏️" value={currentDisplayName ? '✓' : '—'} label="nombre" color={currentDisplayName ? XP.acid : XP.inkFaint} />
        <MiniBadge icon="📊" value={currentDisplayName ? 'activo' : '—'} label="ranking" color={XP.inkDim} />
        <MiniBadge icon="🔒" value="único" label="verif." color={XP.gold} />
        <MiniBadge icon="🪙" value={isFirstChange || isSubscribed ? 'gratis' : '200'} label="costo" color={isFirstChange || isSubscribed ? XP.acid : XP.gold} />
      </div>
    </div>
  );
}

function LinkPanel({ shareLink, onCopy, copied, telegramId, linkChanges, referralCount, onLinkUpdated }: {
  shareLink?: string;
  onCopy: () => void;
  copied: boolean;
  telegramId?: number;
  linkChanges: number;
  referralCount: number;
  onLinkUpdated: () => void;
}) {
  const [sharing, setSharing] = useState(false);
  const [refCopied, setRefCopied] = useState(false);

  const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME || 'MyXposed_bot';
  const fullLink = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/u/${shareLink}`;
  const referralLink = `https://t.me/${BOT_USERNAME}?start=${shareLink}`;
  const shareText = `Dime tus secretos anónimos en Xposed 🤫\n${fullLink}`;
  const referralShareText = encodeURIComponent(`¡Únete a Xposed y ambos ganamos 50 🪙!\n`);

  const handleNativeShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Xposed', text: shareText, url: fullLink });
      } else {
        navigator.clipboard.writeText(fullLink);
        onCopy();
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') onCopy();
    } finally {
      setSharing(false);
    }
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2000);
  };

  const shareReferralTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${referralShareText}`, '_blank');
  };

  const nextMilestone = referralCount < 1 ? 1 : referralCount < 3 ? 3 : referralCount < 5 ? 5 : referralCount < 10 ? 10 : Math.ceil(referralCount / 10) * 10 + 10;
  const prevMilestone = referralCount < 1 ? 0 : referralCount < 3 ? 1 : referralCount < 5 ? 3 : referralCount < 10 ? 5 : Math.floor(referralCount / 10) * 10;
  const milestoneProgress = nextMilestone === prevMilestone ? 100 : Math.round(((referralCount - prevMilestone) / (nextMilestone - prevMilestone)) * 100);
  const tokensEarned = referralCount * 50;

  return (
    <div style={{ marginTop: 4 }}>

      {/* REFERRAL HERO — main CTA */}
      <div style={{
        padding: 18, marginBottom: 12,
        background: `linear-gradient(135deg, ${XP.gold}14, ${XP.surface})`,
        border: `1.5px solid ${XP.gold}55`,
        borderRadius: 20, position: 'relative', overflow: 'hidden',
        boxShadow: `0 0 30px -10px ${XP.gold}44`,
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${XP.gold}, transparent)`,
          animation: 'xp-scan 3s linear infinite',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <XPMonoLabel size={9} color={XP.gold}>PROGRAMA DE REFERIDOS</XPMonoLabel>
          <div style={{
            background: `${XP.gold}22`, border: `1px solid ${XP.gold}55`,
            borderRadius: 8, padding: '3px 8px',
            fontFamily: XP.fMono, fontSize: 10, fontWeight: 700, color: XP.gold,
          }}>+50 🪙 c/u</div>
        </div>

        {/* counter row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{
            flex: 1, padding: '12px 10px', background: XP.bg,
            borderRadius: 14, border: `1px solid ${XP.gold}33`, textAlign: 'center',
          }}>
            <div style={{ fontFamily: XP.fDisp, fontSize: 32, color: XP.gold, lineHeight: 1 }}>{referralCount}</div>
            <XPMonoLabel size={8} color={XP.inkMuted}>amigos invitados</XPMonoLabel>
          </div>
          <div style={{
            flex: 1, padding: '12px 10px', background: XP.bg,
            borderRadius: 14, border: `1px solid ${XP.acid}33`, textAlign: 'center',
          }}>
            <div style={{ fontFamily: XP.fDisp, fontSize: 32, color: XP.acid, lineHeight: 1 }}>{tokensEarned}</div>
            <XPMonoLabel size={8} color={XP.inkMuted}>🪙 ganados gratis</XPMonoLabel>
          </div>
        </div>

        {/* progress to next milestone */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <XPMonoLabel size={8.5} color={XP.inkMuted}>hacia {nextMilestone} amigos</XPMonoLabel>
            <XPMonoLabel size={8.5} color={XP.gold}>{referralCount}/{nextMilestone}</XPMonoLabel>
          </div>
          <div style={{ height: 6, borderRadius: 4, background: XP.bg, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${milestoneProgress}%`,
              background: `linear-gradient(90deg, ${XP.gold}, ${XP.acid})`,
              borderRadius: 4, transition: 'width .4s ease',
            }} />
          </div>
          <div style={{ marginTop: 5 }}>
            <XPMonoLabel size={8} color={XP.inkFaint}>
              {nextMilestone - referralCount === 0
                ? '¡Nivel alcanzado! Sigue invitando'
                : `invita ${nextMilestone - referralCount} más · ganas ${(nextMilestone - referralCount) * 50} 🪙 extra`}
            </XPMonoLabel>
          </div>
        </div>

        {/* referral link */}
        <div style={{
          padding: '10px 12px', background: XP.bg, border: `1px dashed ${XP.gold}55`,
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
        }}>
          <span style={{ fontFamily: XP.fMono, fontSize: 11, color: XP.inkMuted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            t.me/{BOT_USERNAME}?start={shareLink || '...'}
          </span>
          <button onClick={copyReferral} style={{
            background: refCopied ? XP.gold : `${XP.gold}22`,
            color: refCopied ? XP.bg : XP.gold, border: `1px solid ${XP.gold}55`,
            height: 28, padding: '0 10px', borderRadius: 6,
            fontWeight: 700, fontSize: 10, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}>
            {refCopied ? '✓ copiado' : 'copiar link'}
          </button>
        </div>

        {/* share via Telegram */}
        <button onClick={shareReferralTelegram} style={{
          width: '100%', height: 42, borderRadius: 12, border: 'none',
          background: XP.gold, color: XP.bg,
          fontFamily: XP.fDisp, fontSize: 16,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: `inset 0 -2px 0 rgba(0,0,0,0.2)`,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={XP.bg}>
            <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.93 8.2l-2.02 9.52c-.15.68-.54.85-1.09.53l-3-2.21-1.45 1.4c-.16.16-.3.3-.61.3l.21-3.03 5.56-5.02c.24-.21-.05-.33-.37-.12L6.8 14.49 3.85 13.6c-.67-.21-.68-.67.14-.99l11.61-4.48c.55-.2 1.04.13.86.99l-.53-.92z"/>
          </svg>
          compartir en Telegram
        </button>
      </div>

      {/* Link display */}
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
          <button onClick={onCopy} style={{
            background: copied ? '#4ade80' : XP.surface2,
            color: copied ? XP.bg : XP.ink, border: `1px solid ${XP.line}`,
            height: 32, padding: '0 14px', borderRadius: 8,
            fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {copied ? '✓ copiado' : 'copiar'}
          </button>
        </div>
      </div>

      {/* Share button */}
      <button
        onClick={handleNativeShare}
        disabled={sharing}
        style={{
          width: '100%', height: 56, borderRadius: 18, border: 'none',
          background: XP.acid, color: XP.bg,
          fontFamily: XP.fDisp, fontSize: 20, letterSpacing: '-0.01em',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: `0 8px 24px -8px ${XP.acid}88, inset 0 -3px 0 ${XP.acidDeep}`,
          transition: 'opacity .15s', opacity: sharing ? 0.6 : 1,
          marginBottom: 8,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={XP.bg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        {sharing ? 'compartiendo...' : 'compartir mi link'}
      </button>

      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <XPMonoLabel size={9} color={XP.inkFaint}>
          WhatsApp · Telegram · Instagram · cualquier app
        </XPMonoLabel>
      </div>

    </div>
  );
}

// ─── Buy Tokens Card ──────────────────────────────────────────────────────────

const PACKAGES = [
  { id: '100',  label: '100 🪙',  xtr: 10,  desc: 'Starter' },
  { id: '500',  label: '500 🪙',  xtr: 50,  desc: 'Popular' },
  { id: '1000', label: '1000 🪙', xtr: 100, desc: 'Pro' },
  { id: 'sub',  label: 'Xposed Pro', xtr: 250, desc: '30 días · pistas ilimitadas' },
];

function BuyTokensCard({ telegramId, onPurchased }: { telegramId: number; onPurchased: () => void }) {
  const [loading, setLoading] = useState<string | null>(null);

  const buy = async (packageId: string) => {
    if (loading) return;
    setLoading(packageId);
    try {
      const res = await fetch('/api/stars/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramId, package_id: packageId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) return;

      const tg = (window as any).Telegram?.WebApp;
      if (tg?.openInvoice) {
        tg.openInvoice(data.url, (status: string) => {
          if (status === 'paid') onPurchased();
        });
      } else {
        window.open(data.url, '_blank');
      }
    } catch {}
    finally { setLoading(null); }
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <XPMonoLabel size={10}>COMPRAR TOKENS</XPMonoLabel>
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {PACKAGES.map(pkg => (
          <button
            key={pkg.id}
            onClick={() => buy(pkg.id)}
            disabled={!!loading}
            style={{
              padding: '12px 10px', borderRadius: 14, border: `1px solid ${XP.line}`,
              background: pkg.id === 'sub' ? `${XP.gold}14` : XP.surface,
              cursor: 'pointer', opacity: loading === pkg.id ? 0.6 : 1,
              transition: 'opacity .15s', textAlign: 'center',
              gridColumn: pkg.id === 'sub' ? 'span 2' : undefined,
            }}
          >
            <div style={{ fontFamily: XP.fDisp, fontSize: 18, color: pkg.id === 'sub' ? XP.gold : XP.acid, lineHeight: 1 }}>
              {loading === pkg.id ? '...' : pkg.label}
            </div>
            <div style={{ marginTop: 4 }}>
              <XPMonoLabel size={8} color={XP.inkMuted}>{pkg.desc} · {pkg.xtr} ⭐</XPMonoLabel>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
