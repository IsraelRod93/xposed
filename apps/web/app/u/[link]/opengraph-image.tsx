import { ImageResponse } from 'next/og';
import { sql } from '@/lib/db';

export const alt = 'Xposed - Mensaje anónimo';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ link: string }> }) {
  const { link } = await params;

  let username = 'Alguien';
  if (sql) {
    try {
      const users = await sql`SELECT username FROM users WHERE share_link = ${link}`;
      if (users.length > 0 && users[0].username) username = users[0].username;
    } catch {
      // fallback to default
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0B0A08',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        <div
          style={{
            color: '#D6FF3D',
            fontSize: 112,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-4px',
          }}
        >
          xposed
        </div>
        <div
          style={{
            color: '#EBE7E1',
            fontSize: 52,
            fontWeight: 700,
            marginTop: 28,
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          @{username} quiere saber tus secretos
        </div>
        <div
          style={{
            color: '#6E6760',
            fontSize: 30,
            marginTop: 20,
            textAlign: 'center',
          }}
        >
          Mándame un mensaje anónimo · No sabré que fuiste tú 🤫
        </div>
        <div
          style={{
            marginTop: 48,
            padding: '14px 32px',
            background: '#D6FF3D',
            color: '#0B0A08',
            borderRadius: 16,
            fontSize: 28,
            fontWeight: 800,
          }}
        >
          enviar secreto →
        </div>
      </div>
    ),
    { ...size }
  );
}
