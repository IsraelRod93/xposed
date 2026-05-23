import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xposed | Confesiones Anónimas",
  description: "Díselo sin miedo. Entérate sin filtros.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-black text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
