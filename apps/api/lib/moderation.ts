const THREAT_PATTERNS = [
  /te\s+voy\s+a\s+matar/i,
  /voy\s+a\s+matarte/i,
  /te\s+mato\b/i,
  /te\s+voy\s+a\s+(encontrar|golpear|pegar|partir|violar|matar)/i,
  /voy\s+a\s+violarte/i,
  /sé\s+d[oó]nde\s+vives/i,
  /kill\s+your\s*self/i,
  /\bkys\b/i,
  /(i'?ll|i\s+will|gonna)\s+kill\s+you/i,
  /i\s+know\s+where\s+you\s+live/i,
  /publicar[eé]\s+(tus\s+)?(fotos|videos|nudes)/i,
  /voy\s+a\s+hackear/i,
];

export function containsThreat(text: string): boolean {
  return THREAT_PATTERNS.some(p => p.test(text));
}
