import { neon } from '@neondatabase/serverless';
const sql = neon('');
const rows = await sql`SELECT telegram_id, username, display_name, stars FROM users ORDER BY created_at ASC LIMIT 20`;
console.log(JSON.stringify(rows, null, 2));
