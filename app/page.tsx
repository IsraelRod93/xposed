"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

declare global {
  interface Window {
    Telegram?: any;
  }
}

export default function InboxPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 1. Obtener datos de Telegram
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.expand();
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        setUser(tgUser);
        fetchMessages(tgUser.id);
      }
    } else {
      // Para pruebas locales si no hay Telegram
      setLoading(false);
    }
  }, []);

  async function fetchMessages(telegramId: number) {
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('receiver_id', telegramId)
      .order('created_at', { ascending: false });

    if (data) setMessages(data);
    setLoading(false);
  }

  const copyLink = async () => {
    if (!user || !supabase) return;

    // Obtener el share_link del usuario
    const { data } = await supabase
      .from('users')
      .select('share_link')
      .eq('telegram_id', user.id)
      .single();

    if (data) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const fullLink = `${appUrl}/u/${data.share_link}`;
      
      navigator.clipboard.writeText(fullLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-yellow-500"></div>
    </div>
  );

  return (
    <main className="p-4 max-w-md mx-auto pb-32">
      <header className="mb-8 text-center pt-4">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
          Xposed
        </h1>
        <p className="text-gray-400 text-sm mt-2">Tus confesiones, reveladas.</p>
      </header>

      {messages.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-3xl">
          <span className="text-4xl mb-4 block">📩</span>
          <p className="text-zinc-500 font-medium">Aún no tienes secretos.<br/>¡Comparte tu link!</p>
        </div>
      ) : (
        <section className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-lg mb-4 leading-relaxed font-medium">"{msg.content}"</p>
              <div className="flex gap-4 text-[10px] text-zinc-500 mb-6 bg-black/30 p-3 rounded-lg uppercase tracking-wider">
                <div>OS: <span className={msg.is_clue_revealed ? "text-zinc-300" : "blur-sm select-none"}>{msg.sender_os}</span></div>
                <div>País: <span className={msg.is_clue_revealed ? "text-zinc-300" : "blur-sm select-none"}>{msg.sender_country}</span></div>
              </div>
              <button 
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 py-3 rounded-xl font-bold text-black active:scale-95 transition-transform shadow-[0_0_15px_rgba(217,119,6,0.3)] disabled:opacity-50"
                disabled={msg.is_clue_revealed}
              >
                {msg.is_clue_revealed ? "Pista Revelada" : "Revelar Pista (50 ⭐️)"}
              </button>
            </div>
          ))}
        </section>
      )}

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent">
        <button 
          onClick={copyLink}
          className={`w-full py-4 rounded-2xl font-bold shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 ${
            copied ? "bg-green-500 text-white" : "bg-white text-black"
          }`}
        >
          {copied ? (
            <><span>✓</span> Enlace Copiado</>
          ) : (
            <><span>🔗</span> Copiar mi enlace</>
          )}
        </button>
      </footer>
    </main>
  );
}
