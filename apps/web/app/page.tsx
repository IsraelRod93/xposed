import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Xposed | Mensajes anónimos",
  description: "Recibe mensajes anónimos. Descubre qué piensan de ti, sin filtros.",
};

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 24px",
        background: "#0A0A0A",
        color: "#FFFFFF",
      }}
    >
      <div
        style={{
          color: "#C6FF00",
          fontSize: 72,
          fontWeight: 900,
          letterSpacing: "-3px",
          lineHeight: 1,
        }}
      >
        xposed
      </div>

      <p
        style={{
          marginTop: 20,
          maxWidth: 460,
          fontSize: 20,
          lineHeight: 1.4,
          color: "#EBE7E1",
        }}
      >
        Recibe mensajes anónimos. Descubre qué piensan de ti, sin filtros.
      </p>

      <p style={{ marginTop: 12, maxWidth: 420, fontSize: 15, color: "#888888" }}>
        Crea tu cuenta en la app y comparte tu link. Quien lo abra puede dejarte
        un secreto sin que sepas quién fue.
      </p>

      <div
        style={{
          marginTop: 36,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <a
          href="#"
          style={{
            padding: "14px 28px",
            borderRadius: 14,
            background: "#C6FF00",
            color: "#0A0A0A",
            fontWeight: 800,
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          Descargar en App Store
        </a>
        <a
          href="#"
          style={{
            padding: "14px 28px",
            borderRadius: 14,
            background: "#1C1C1C",
            color: "#FFFFFF",
            fontWeight: 800,
            fontSize: 15,
            textDecoration: "none",
            border: "1px solid #2A2A2A",
          }}
        >
          Descargar en Google Play
        </a>
      </div>
    </main>
  );
}
