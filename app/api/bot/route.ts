import { Bot } from "grammy";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.warn("TELEGRAM_BOT_TOKEN is not set, bot will not function.");
}
const bot = new Bot(botToken || "dummy_token");

bot.command("start", async (ctx) => {
  const telegramId = ctx.from?.id;
  const username = ctx.from?.username || "anonimo";

  if (!telegramId) return;
  if (!supabase) {
    console.error("Supabase client not initialized");
    return ctx.reply("Error de configuración del servidor.");
  }

  try {
    // 1. Verificar si el usuario ya existe
    let { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegramId)
      .single();

    // 2. Si no existe, crearlo con un share_link único
    if (!user && !error) {
      const shareLink = `${username}_${Math.random().toString(36).substring(2, 7)}`;
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([{ 
          telegram_id: telegramId, 
          username: username, 
          share_link: shareLink 
        }])
        .select()
        .single();
      
      if (createError) throw createError;
      user = newUser;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tu-app.vercel.app";
    const personalLink = `${appUrl}/u/${user.share_link}`;

    await ctx.reply(
      `¡Bienvenido a Xposed, @${username}! 🤫\n\n` +
      `Tu enlace personal para recibir secretos es:\n` +
      `👉 ${personalLink}\n\n` +
      `Compártelo en tu bio de Instagram o TikTok.`,
      {
        reply_markup: {
          inline_keyboard: [[{ 
            text: "Ver mi Inbox", 
            web_app: { url: appUrl } 
          }]]
        }
      }
    );
  } catch (err) {
    console.error("Error en /start:", err);
    await ctx.reply("Hubo un error al iniciar. Inténtalo de nuevo más tarde.");
  }
});

// Middleware para procesar el webhook de Telegram
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error en webhook:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
