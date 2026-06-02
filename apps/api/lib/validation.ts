// Límite de longitud para nombres visibles (evita romper el frontend).
export const DISPLAY_NAME_MAX = 30;

/**
 * Limpia un nombre visible: quita caracteres de control, colapsa espacios,
 * recorta a DISPLAY_NAME_MAX. Si queda vacío, usa `fallback`.
 */
export function sanitizeDisplayName(raw: string | null | undefined, fallback = ''): string {
  const cleaned = (raw ?? '')
    .split('')
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code > 31 && code !== 127; // descarta caracteres de control
    })
    .join('')
    .replace(/\s+/g, ' ') // colapsa espacios/saltos
    .trim()
    .slice(0, DISPLAY_NAME_MAX);
  return cleaned.length > 0 ? cleaned : fallback;
}
