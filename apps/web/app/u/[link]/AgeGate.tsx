'use client';

import { useEffect, useState } from 'react';

const KEY = 'xposed_age_ok';

export default function AgeGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'blocked' | 'ok'>('checking');

  useEffect(() => {
    try {
      setStatus(localStorage.getItem(KEY) === '1' ? 'ok' : 'blocked');
    } catch {
      setStatus('blocked');
    }
  }, []);

  if (status === 'ok') return <>{children}</>;

  // 'checking' o 'blocked' → fondo neutro; solo mostramos el gate cuando ya sabemos
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0A0A',
        color: '#EBE7E1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {status === 'blocked' && (
        <div style={{ maxWidth: 360, textAlign: 'center' }}>
          <div style={{ color: '#C6FF00', fontSize: 44, fontWeight: 900, letterSpacing: '-2px' }}>
            +18
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 12, color: '#FFFFFF' }}>
            Contenido para mayores de 18
          </h1>
          <p style={{ fontSize: 14, color: '#888888', marginTop: 10, lineHeight: 1.5 }}>
            Xposed contiene mensajes anónimos de otras personas. Debes ser mayor de
            18 años para continuar.
          </p>

          <button
            onClick={() => {
              try { localStorage.setItem(KEY, '1'); } catch {}
              setStatus('ok');
            }}
            style={{
              marginTop: 24, width: '100%', height: 52, borderRadius: 14, border: 'none',
              background: '#C6FF00', color: '#0A0A0A', fontWeight: 800, fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Soy mayor de 18 años
          </button>

          <a
            href="https://www.google.com"
            style={{
              display: 'block', marginTop: 12, fontSize: 13, color: '#888888',
              textDecoration: 'none',
            }}
          >
            Salir
          </a>

          <p style={{ marginTop: 20, fontSize: 11, color: '#555555', lineHeight: 1.5 }}>
            Al continuar aceptas los{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#888888' }}>
              Términos
            </a>{' '}
            y la{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#888888' }}>
              Política de Privacidad
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
