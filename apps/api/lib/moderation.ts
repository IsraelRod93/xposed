// Filtro de entrada para mensajes anónimos. No pretende ser exhaustivo, pero
// cubre las categorías de mayor riesgo en una app de mensajes anónimos.
// Complementado por reportes de usuarios + auto-ocultado (ver /api/report).

const PATTERNS: { category: string; rx: RegExp }[] = [
  // Amenazas de muerte / violencia física
  { category: 'threat', rx: /te\s+(voy\s+a|vas?\s+a)\s+(matar|golpear|pegar|partir|reventar|destrozar)/i },
  { category: 'threat', rx: /voy\s+a\s+(matarte|golpearte|pegarte|encontrarte|violarte)/i },
  { category: 'threat', rx: /\bte\s+mato\b/i },
  { category: 'threat', rx: /(i'?ll|i\s+will|gonna)\s+(kill|hurt|find)\s+you/i },

  // Autolesión / incitación al suicidio
  { category: 'self_harm', rx: /m[aá]tate|su[ií]c[ií]date|c[oó]rtate\s+las\s+venas|cu[eé]lgate/i },
  { category: 'self_harm', rx: /kill\s*your\s*self|\bkys\b|go\s+die/i },
  { category: 'self_harm', rx: /deber[ií]as\s+(morirte|suicidarte|matarte)/i },

  // Doxxing / amenaza de exposición
  { category: 'doxxing', rx: /s[eé]\s+d[oó]nde\s+vives|i\s+know\s+where\s+you\s+live/i },
  { category: 'doxxing', rx: /(publicar[eé]|filtrar[eé]|voy\s+a\s+publicar|leak)\s+(tus\s+)?(fotos|v[ií]deos|videos|nudes|datos|direcci[oó]n)/i },
  { category: 'doxxing', rx: /voy\s+a\s+hackear|i'?ll\s+hack/i },

  // Contenido sexual explícito / no consentido
  { category: 'sexual', rx: /m[aá]ndame\s+(tus\s+)?(nudes|fotos\s+desnud)/i },
  { category: 'sexual', rx: /\b(viol(ar|arte|aci[oó]n)|abusar\s+de\s+ti)\b/i },

  // Slurs / discurso de odio (lista mínima, ampliable)
  { category: 'hate', rx: /\b(maric[oó]n|puto\s+gay|sudaca|negro\s+de\s+mierda|retrasad[oa])\b/i },
  { category: 'hate', rx: /\b(faggot|nigger|retard)\b/i },
];

/** Devuelve la categoría infringida, o null si el texto pasa el filtro. */
export function moderationReason(text: string): string | null {
  const match = PATTERNS.find(p => p.rx.test(text));
  return match ? match.category : null;
}

/** True si el texto contiene contenido prohibido. */
export function containsThreat(text: string): boolean {
  return moderationReason(text) !== null;
}
