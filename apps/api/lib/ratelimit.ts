import { NextRequest } from 'next/server';
import { sql } from './db';

export function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || '0.0.0.0';
}

let tableEnsured = false;
async function ensureTable() {
  if (!sql || tableEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limit_hits (
      id         BIGSERIAL PRIMARY KEY,
      bucket     TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_rate_limit_bucket ON rate_limit_hits (bucket, created_at)`;
  tableEnsured = true;
}

/**
 * Rate limit basado en BD (funciona en serverless distribuido, a diferencia de
 * un contador en memoria). Registra el intento y devuelve `true` si está dentro
 * del límite, `false` si debe bloquearse. Ante cualquier fallo NO bloquea.
 */
export async function rateLimitOk(bucket: string, max: number, windowSec: number): Promise<boolean> {
  if (!sql) return true;
  try {
    await ensureTable();
    const [row] = await sql`
      SELECT COUNT(*)::int AS c FROM rate_limit_hits
      WHERE bucket = ${bucket} AND created_at > NOW() - make_interval(secs => ${windowSec})
    `;
    if ((row?.c ?? 0) >= max) return false;

    await sql`INSERT INTO rate_limit_hits (bucket) VALUES (${bucket})`;

    // Limpieza oportunista de registros viejos (5% de las veces).
    if (Math.random() < 0.05) {
      await sql`DELETE FROM rate_limit_hits WHERE created_at < NOW() - INTERVAL '1 hour'`.catch(() => {});
    }
    return true;
  } catch {
    return true;
  }
}
