import { Bot } from "grammy";
import { NextRequest, NextResponse } from "next/server";

// IMPORTANTE: Define estas variables en tu archivo .env.local
// TELEGRAM_BOT_TOKEN=tu_token_aqui
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.warn("TELEGRAM_BOT_TOKEN is not set, bot will not function.");
}
const bot = new Bot(botToken || "dummy_token");

bot.command("start", async (ctx) => {
  await ctx.reply("¡Bienvenido a Xposed! 🤫\n\nAlguien te ha dejado un secreto.", {
    reply_markup: {
      inline_keyboard: [[{ 
        text: "Abrir Xposed", 
        web_app: { url: process.env.NEXT_PUBLIC_APP_URL! } 
      }]]
    }
  });
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
