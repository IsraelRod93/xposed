"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SendSecretPage() {
  const { link } = useParams();
  const [receiverName, setReceiverName] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReceiver() {
      const { data, error } = await supabase
        .from("users")
        .select("username")
        .eq("share_link", link)
        .single();
      
      if (data) setReceiverName(data.username);
      setLoading(false);
    }
    fetchReceiver();
  }, [link]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    setIsSending(true);

    // Detectar OS sencillo
    const ua = window.navigator.userAgent;
    let os = "Otro";
    if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "MacOS";

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          share_link: link,
          content,
          sender_os: os,
          sender_country: "España", // Simplificado por ahora
        }),
      });

      if (res.ok) setSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-yellow-500"></div>
    </div>
  );

  if (!receiverName && !loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 text-center">
      <div>
        <h1 className="text-2xl font-bold text-zinc-500 mb-2">Enlace no válido</h1>
        <p className="text-zinc-600">Este link de Xposed no existe o ha sido eliminado.</p>
      </div>
    </div>
  );

  if (sent) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
        <span className="text-4xl">✅</span>
      </div>
      <h1 className="text-3xl font-black mb-2">¡Enviado!</h1>
      <p className="text-zinc-400 mb-8">Tu secreto ha sido entregado de forma anónima.</p>
      <button 
        onClick={() => window.location.href = "/"}
        className="bg-white text-black px-8 py-3 rounded-2xl font-bold active:scale-95 transition-transform"
      >
        Crear mi propio Xposed
      </button>
    </div>
  );

  return (
    <main className="p-6 max-w-md mx-auto min-h-screen flex flex-col justify-center">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 mb-2">
          Xposed
        </h1>
        <p className="text-zinc-400">
          Envía un secreto anónimo a <span className="text-white font-bold">@{receiverName}</span>
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative group">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe algo aquí... no sabrán que fuiste tú 🤫"
            className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-6 h-48 focus:outline-none focus:border-yellow-600 transition-colors text-lg resize-none placeholder:text-zinc-700"
            maxLength={300}
            required
          />
          <div className="absolute bottom-4 right-6 text-xs text-zinc-600">
            {content.length}/300
          </div>
        </div>

        <button
          disabled={isSending}
          className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 py-4 rounded-2xl font-black text-black text-lg shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
        >
          {isSending ? "Enviando..." : "Enviar Secreto 🚀"}
        </button>
      </form>

      <p className="text-center text-[10px] text-zinc-600 mt-12 uppercase tracking-widest">
        100% Anónimo & Seguro
      </p>
    </main>
  );
}
