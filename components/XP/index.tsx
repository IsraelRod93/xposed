'use client';

import React, { useState, useEffect } from 'react';
import { XP } from '@/lib/tokens';

// --- Logo Mark ---
interface XPLogoMarkProps {
  size?: number;
  color?: string;
}

export function XPLogoMark({ size = 28, color = XP.acid }: XPLogoMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`xp-x-g-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={XP.acidDeep} />
        </linearGradient>
      </defs>
      <rect x="-2" y="12.5" width="36" height="7" rx="1.5"
            transform="rotate(-32 16 16)" fill={`url(#xp-x-g-${size})`} />
      <rect x="-2" y="12.5" width="36" height="7" rx="1.5"
            transform="rotate(32 16 16)" fill={XP.ink} />
      <rect x="13.5" y="13.5" width="5" height="5" fill={XP.bg} />
    </svg>
  );
}

// --- Wordmark ---
interface XPWordmarkProps {
  size?: number;
  withMark?: boolean;
  light?: boolean;
  kerning?: number;
}

export function XPWordmark({ size = 30, withMark = true, light = false, kerning = -0.04 }: XPWordmarkProps) {
  const c = light ? XP.ink : XP.ink;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.28 }}>
      {withMark && <XPLogoMark size={size * 0.95} />}
      <span style={{
        fontFamily: XP.fDisp, fontSize: size, lineHeight: 0.85,
        letterSpacing: `${kerning}em`, color: c,
        textTransform: 'lowercase', fontWeight: 400,
      }}>
        xposed
      </span>
    </div>
  );
}

// --- Mono Label ---
interface XPMonoLabelProps {
  children: React.ReactNode;
  color?: string;
  size?: number;
  weight?: number;
  style?: React.CSSProperties;
}

export function XPMonoLabel({ children, color = XP.inkMuted, size = 9.5, weight = 500, style = {} }: XPMonoLabelProps) {
  return (
    <span style={{
      fontFamily: XP.fMono, fontSize: size, fontWeight: weight,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color, ...style,
    }}>
      {children}
    </span>
  );
}

// --- Pulse Dot ---
interface XPPulseDotProps {
  color?: string;
  size?: number;
}

export function XPPulseDot({ color = XP.acid, size = 7 }: XPPulseDotProps) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: 999, background: color,
        animation: 'xp-ring 1.6s ease-out infinite',
      }} />
      <span style={{
        position: 'absolute', inset: 0, borderRadius: 999, background: color,
      }} />
    </span>
  );
}

// --- Redacted ---
interface XPRedactedProps {
  width?: number | string;
  height?: number | string;
  color?: string;
  dark?: boolean;
  style?: React.CSSProperties;
}

export function XPRedacted({ width = 80, height = 14, color = XP.ink, dark = false, style = {} }: XPRedactedProps) {
  return (
    <span style={{
      display: 'inline-block', width, height, position: 'relative', overflow: 'hidden',
      background: dark ? XP.surface2 : color, borderRadius: 2, verticalAlign: 'middle', ...style,
    }}>
      <span style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(90deg, transparent 0%, ${XP.acid}30 50%, transparent 100%)`,
        animation: 'xp-scan 2.4s linear infinite',
      }} />
    </span>
  );
}

// --- Counter ---
interface XPCounterProps {
  to?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
}

export function XPCounter({ to = 0, duration = 1400, prefix = '', suffix = '', format = (n) => n.toLocaleString('es') }: XPCounterProps) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{prefix}{format(n)}{suffix}</span>;
}

// --- Tiers ---
export const TIERS = {
  bronze:  { label: 'BRONCE',   color: '#C97B45', glyph: '◆' },
  silver:  { label: 'PLATA',    color: '#C8C2B8', glyph: '◆◆' },
  gold:    { label: 'ORO',      color: XP.gold,   glyph: '◆◆◆' },
  diamond: { label: 'DIAMANTE', color: XP.diamond, glyph: '◆◆◆◆' },
  legend:  { label: 'LEYENDA',  color: XP.acid,   glyph: '◆◆◆◆◆' },
} as const;

type TierKey = keyof typeof TIERS;

interface XPTierChipProps {
  tier?: TierKey;
  percentile?: number;
  compact?: boolean;
}

export function XPTierChip({ tier = 'gold', percentile, compact = false }: XPTierChipProps) {
  const t = TIERS[tier];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: compact ? '3px 7px' : '5px 9px',
      background: `${t.color}1A`, border: `1px solid ${t.color}55`,
      borderRadius: 999,
    }}>
      <span style={{ color: t.color, fontSize: 8, letterSpacing: 1 }}>{t.glyph}</span>
      <XPMonoLabel color={t.color} size={9} weight={600}>
        {t.label}{percentile !== undefined && ` · TOP ${percentile}%`}
      </XPMonoLabel>
    </span>
  );
}

// --- Star Chip ---
interface XPStarChipProps {
  amount?: number;
  color?: string;
}

export function XPStarChip({ amount = 50, color = XP.gold }: XPStarChipProps) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px 3px 6px', background: `${color}1F`,
      border: `1px solid ${color}55`, borderRadius: 999,
      fontFamily: XP.fMono, fontSize: 11, fontWeight: 600, color,
    }}>
      <svg width="11" height="11" viewBox="0 0 12 12" fill={color}>
        <path d="M6 .5l1.6 3.3 3.7.5-2.7 2.6.6 3.6L6 8.9 2.7 10.5l.6-3.6L.6 4.3l3.7-.5z"/>
      </svg>
      {amount}
    </span>
  );
}

// --- Divider ---
interface XPDividerProps {
  label?: string;
  color?: string;
  padded?: boolean;
}

export function XPDivider({ label, color = XP.line, padded = true }: XPDividerProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: padded ? '14px 0' : 0 }}>
      <div style={{ flex: 1, height: 1, background: color }} />
      {label && <XPMonoLabel size={9}>{label}</XPMonoLabel>}
      {label && <div style={{ flex: 1, height: 1, background: color }} />}
    </div>
  );
}

// --- Corners ---
interface XPCornersProps {
  color?: string;
  size?: number;
  inset?: number;
  thickness?: number;
}

export function XPCorners({ color = XP.acid, size = 10, inset = 0, thickness = 1.5 }: XPCornersProps) {
  const c: React.CSSProperties = { position: 'absolute', width: size, height: size, borderColor: color, borderStyle: 'solid', borderWidth: 0 };
  return (
    <>
      <div style={{ ...c, top: inset, left: inset, borderTopWidth: thickness, borderLeftWidth: thickness }} />
      <div style={{ ...c, top: inset, right: inset, borderTopWidth: thickness, borderRightWidth: thickness }} />
      <div style={{ ...c, bottom: inset, left: inset, borderBottomWidth: thickness, borderLeftWidth: thickness }} />
      <div style={{ ...c, bottom: inset, right: inset, borderBottomWidth: thickness, borderRightWidth: thickness }} />
    </>
  );
}

// --- Tape ---
interface XPTapeProps {
  children: React.ReactNode;
  color?: string;
  rotate?: number;
  style?: React.CSSProperties;
}

export function XPTape({ children, color = XP.acid, rotate = -3, style = {} }: XPTapeProps) {
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px',
      background: color, color: XP.bg,
      transform: `rotate(${rotate}deg)`,
      fontFamily: XP.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', ...style,
    }}>
      {children}
    </span>
  );
}
