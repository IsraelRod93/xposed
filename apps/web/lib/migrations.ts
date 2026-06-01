import { sql } from './db';

// Columnas opcionales de `messages` que algunos despliegues antiguos no tenían.
// Se asegura su existencia de forma idempotente antes de insertar mensajes.
export async function ensureMessageColumns() {
  if (!sql) return;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_city TEXT`;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_platform TEXT`;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_hour INTEGER`;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_ip TEXT`;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS revealed_premium TEXT DEFAULT ''`;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS hidden_by_user BOOLEAN DEFAULT FALSE`;
}
