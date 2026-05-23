"use client";

import { useState } from 'react';

export default function InboxPage() {
  const [messages] = useState([
    { id: 1, content: "Alguien piensa que eres la persona más inteligente del grupo...", os: "iOS", country: "España" }
  ]);

  return (
    <main className="p-4 max-w-md mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
          Xposed
        </h1>
        <p className="text-gray-400 text-sm mt-2">Tus confesiones, reveladas.</p>
      </header>

      <section className="space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl">
            <p className="text-lg mb-4 leading-relaxed">"{msg.content}"</p>
            <div className="flex gap-4 text-xs text-zinc-500 mb-6 bg-black/30 p-3 rounded-lg">
              <div>OS: <span className="blur-sm select-none text-zinc-300">{msg.os}</span></div>
              <div>País: <span className="blur-sm select-none text-zinc-300">{msg.country}</span></div>
            </div>
            <button className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 py-3 rounded-xl font-bold text-black active:scale-95 transition-transform shadow-[0_0_15px_rgba(217,119,6,0.3)]">
              Revelar Pista (50 ⭐️)
            </button>
          </div>
        ))}
      </section>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black to-transparent">
        <button className="w-full bg-white text-black py-4 rounded-2xl font-bold shadow-2xl active:scale-95 transition-transform">
          Copiar mi enlace y ganar más secretos
        </button>
      </footer>
    </main>
  );
}
