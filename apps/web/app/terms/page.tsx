import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos | Xposed",
  description: "Términos y condiciones de Xposed.",
};

const UPDATED = "1 de junio de 2026";
const CONTACT = "soporte@xposed.app";

export default function TermsPage() {
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
          Términos y Condiciones
        </h1>
        <p style={{ color: "#888888", fontSize: 13 }}>Última actualización: {UPDATED}</p>

        <p style={{ marginTop: 24, padding: "12px 16px", background: "#1C1C1C", borderRadius: 10, fontSize: 13, color: "#888888" }}>
          Este documento es un borrador base. Debe ser revisado por un profesional
          legal antes de su publicación definitiva.
        </p>

        <h2 style={h2}>1. Aceptación</h2>
        <p>
          Al usar Xposed aceptas estos Términos y nuestra{" "}
          <a href="/privacy" style={{ color: "#C6FF00" }}>Política de Privacidad</a>.
          Si no estás de acuerdo, no uses el servicio.
        </p>

        <h2 style={h2}>2. Edad mínima (+18)</h2>
        <p>
          Debes tener <strong>al menos 18 años</strong> para usar Xposed. Al continuar
          declaras que eres mayor de edad. Las cuentas de menores serán eliminadas.
        </p>

        <h2 style={h2}>3. Conducta prohibida</h2>
        <p>Al enviar o publicar contenido, te comprometes a NO:</p>
        <ul style={ul}>
          <li>Amenazar, acosar, intimidar o incitar a la violencia o autolesión.</li>
          <li>Publicar discurso de odio, insultos graves o slurs.</li>
          <li>Compartir datos personales de terceros (doxxing).</li>
          <li>Enviar contenido sexual no consentido o relativo a menores.</li>
          <li>Hacer spam, fraude o suplantación de identidad.</li>
        </ul>
        <p>
          Podemos ocultar, eliminar contenido y bloquear el acceso (incluida la IP) de
          quien incumpla, sin previo aviso.
        </p>

        <h2 style={h2}>4. Anonimato y pistas</h2>
        <p>
          Los mensajes enviados por el link público son anónimos: <strong>no revelamos
          la identidad del remitente</strong>. El receptor puede desbloquear pistas
          <strong> aproximadas</strong> (país, dispositivo, franja horaria, plataforma),
          que no identifican a la persona. Consulta la{" "}
          <a href="/privacy" style={{ color: "#C6FF00" }}>Política de Privacidad</a>.
        </p>

        <h2 style={h2}>5. Compras y moneda interna</h2>
        <p>
          Algunas funciones usan una moneda interna o suscripción adquirida mediante
          las tiendas de aplicaciones (App Store / Google Play). Las compras se rigen
          además por las políticas de la tienda correspondiente.
        </p>

        <h2 style={h2}>6. Sin garantías</h2>
        <p>
          El servicio se ofrece “tal cual”, sin garantías de disponibilidad continua.
          Podemos modificar o suspender funciones en cualquier momento.
        </p>

        <h2 style={h2}>7. Contacto</h2>
        <p>Para dudas sobre estos Términos: <strong>{CONTACT}</strong>.</p>

        <p style={{ marginTop: 32 }}>
          <a href="/privacy" style={{ color: "#C6FF00" }}>← Ver Política de Privacidad</a>
        </p>
      </div>
    </main>
  );
}

const h2: React.CSSProperties = { fontSize: 20, fontWeight: 700, marginTop: 32, color: "#FFFFFF" };
const ul: React.CSSProperties = { paddingLeft: 20, marginTop: 8 };
