import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidad | Xposed",
  description: "Política de privacidad de Xposed.",
};

const UPDATED = "1 de junio de 2026";
const CONTACT = "soporte@xposed.app";

export default function PrivacyPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        color: "#EBE7E1",
        padding: "48px 20px 80px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", lineHeight: 1.6, fontSize: 15 }}>
        <a href="/" style={{ color: "#C6FF00", textDecoration: "none", fontSize: 13 }}>
          ← Volver
        </a>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginTop: 16, color: "#FFFFFF" }}>
          Política de Privacidad
        </h1>
        <p style={{ color: "#888888", fontSize: 13 }}>
          Última actualización: {UPDATED}
        </p>

        <p style={{ marginTop: 24, padding: "12px 16px", background: "#1C1C1C", borderRadius: 10, fontSize: 13, color: "#888888" }}>
          Este documento es un borrador base. Debe ser revisado por un profesional
          legal antes de su publicación definitiva.
        </p>

        <h2 style={h2}>1. Qué datos recopilamos</h2>
        <p>
          Xposed es un servicio de mensajes anónimos. Cuando alguien envía un mensaje
          a través de un link público, <strong>no recopilamos su identidad, nombre,
          correo ni ubicación exacta</strong>. Para prevenir abuso y fraude registramos
          datos <strong>aproximados</strong> del envío:
        </p>
        <ul style={ul}>
          <li>País aproximado (derivado de la dirección IP).</li>
          <li>Tipo de dispositivo / sistema operativo (p. ej. iOS, Android).</li>
          <li>Franja horaria aproximada del envío (mañana, tarde, noche).</li>
          <li>Plataforma de origen del enlace (p. ej. red social), cuando está disponible.</li>
          <li>Dirección IP, usada únicamente para limitar abuso y aplicar límites de envío.</li>
        </ul>
        <p>
          <strong>No registramos la ciudad exacta ni datos que permitan identificar
          personalmente al remitente.</strong>
        </p>
        <p>
          De las personas con cuenta recopilamos: correo electrónico, nombre visible
          y los datos necesarios para operar la cuenta (mensajes recibidos, estado de
          suscripción, saldo de la moneda interna).
        </p>

        <h2 style={h2}>2. Función de “pistas” (reveal)</h2>
        <p>
          El receptor de un mensaje puede desbloquear <strong>pistas aproximadas</strong>
          sobre el origen del mensaje (país, dispositivo, franja horaria, plataforma).
          Estas pistas son <strong>aproximadas y no revelan la identidad</strong> del
          remitente. Al enviar un mensaje, el remitente acepta que estos datos
          aproximados puedan mostrarse al receptor.
        </p>

        <h2 style={h2}>3. Para qué usamos los datos</h2>
        <ul style={ul}>
          <li>Operar el servicio y entregar los mensajes.</li>
          <li>Prevenir abuso, spam y contenido prohibido.</li>
          <li>Mostrar pistas aproximadas al receptor según se describe arriba.</li>
        </ul>
        <p>No vendemos tus datos personales a terceros.</p>

        <h2 style={h2}>4. Edad mínima</h2>
        <p>
          Xposed es solo para personas <strong>mayores de 18 años</strong>. No está
          dirigido a menores y no recopilamos conscientemente datos de menores de edad.
        </p>

        <h2 style={h2}>5. Conservación y eliminación</h2>
        <p>
          Conservamos los mensajes mientras la cuenta esté activa. Puedes solicitar la
          eliminación de tu cuenta y tus datos escribiendo a {CONTACT}.
        </p>

        <h2 style={h2}>6. Contacto</h2>
        <p>
          Para cualquier consulta sobre privacidad: <strong>{CONTACT}</strong>.
        </p>

        <p style={{ marginTop: 32 }}>
          <a href="/terms" style={{ color: "#C6FF00" }}>Ver Términos y Condiciones →</a>
        </p>
      </div>
    </main>
  );
}

const h2: React.CSSProperties = { fontSize: 20, fontWeight: 700, marginTop: 32, color: "#FFFFFF" };
const ul: React.CSSProperties = { paddingLeft: 20, marginTop: 8 };
