export default function Inbox() {
  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans">
      <h1 className="text-2xl font-bold mb-6 text-yellow-500 text-center">Tus Secretos</h1>
      
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4 shadow-lg">
        <p className="text-lg mb-4">"Alguien piensa que eres la persona más inteligente del grupo..."</p>
        <div className="text-sm text-gray-400 space-y-1 mb-4">
          <p>Sistema Operativo: <span className="text-yellow-600 blur-sm select-none">iOS</span></p>
          <p>País: <span className="text-yellow-600 blur-sm select-none">España</span></p>
        </div>
        <button className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 py-3 rounded-lg font-bold text-black hover:scale-[1.02] transition-transform">
          Revelar Pista (50 ⭐️)
        </button>
      </div>

      <div className="fixed bottom-6 left-4 right-4">
        <button className="w-full bg-white text-black py-4 rounded-xl font-bold shadow-xl">
          Copiar mi enlace y conseguir más secretos
        </button>
      </div>
    </div>
  );
}
