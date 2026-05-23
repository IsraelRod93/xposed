import { Bot, Webhook } from "grammy";
import { NextRequest, NextResponse } from "next/server";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

bot.command("start", async (ctx) => {
  await ctx.reply("Alguien te ha dejado un secreto... ¿te atreves a descubrirlo?", {
    reply_markup: {
      inline_keyboard: [[{ text: "Abrir Xposed", web_app: { url: process.env.NEXT_PUBLIC_APP_URL! } }]]
    }
  });
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
