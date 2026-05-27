import { Bot } from "grammy";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.warn("TELEGRAM_BOT_TOKEN is not set, bot will not function.");
}
const bot = new Bot(botToken || "dummy_token");

bot.command("start", async (ctx) => {
  const telegramId = ctx.from?.id;
  const username = ctx.from?.username || "anonimo";

  console.log(`[BOT] /start from user ${telegramId} (${username})`);

  if (!telegramId) return;
  if (!sql) {
    console.error("[BOT] SQL client is missing!");
    return ctx.reply("❌ Error: La variable DATABASE_URL no está configurada en Vercel.");
  }

  try {
    // 1. Intentar crear las tablas si no existen (Auto-init)
    console.log("[BOT] Ensuring tables exist...");
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          telegram_id BIGINT PRIMARY KEY,
          username TEXT,
          share_link TEXT UNIQUE NOT NULL,
          stars INTEGER DEFAULT 100,
          streak_count INTEGER DEFAULT 0,
          last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_mission_completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          receiver_id BIGINT REFERENCES users(telegram_id),
          content TEXT NOT NULL,
          sender_os TEXT,
          sender_country TEXT,
          is_clue_revealed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id BIGINT REFERENCES users(telegram_id),
          type TEXT NOT NULL,
          amount INTEGER NOT NULL,
          message_id UUID REFERENCES messages(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
    } catch (dbInitErr: any) {
      console.error("[BOT] Table init failed:", dbInitErr);
      // Ignoramos si fallan por permisos, pero si es error de usuario (auth), caerá en el catch principal
    }

    // 2. Verificar si el usuario ya existe
    const users = await sql`
      SELECT * FROM users WHERE telegram_id = ${telegramId}
    `;

    let user = users.length > 0 ? users[0] : null;

    // 3. Si no existe, crearlo
    if (!user) {
      console.log(`[BOT] Creating new user for ${telegramId}...`);
      const shareLink = `${username}_${Math.random().toString(36).substring(2, 7)}`;
      
      const newUser = await sql`
        INSERT INTO users (telegram_id, username, share_link, stars)
        VALUES (${telegramId}, ${username}, ${shareLink}, 100)
        RETURNING *
      `;
      user = newUser[0];
    }

    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tu-app.vercel.app";
    const appUrl = rawAppUrl.endsWith("/") ? rawAppUrl.slice(0, -1) : rawAppUrl;
    const personalLink = `${appUrl}/u/${user.share_link}`;

    // Forzar la configuración del Menu Button para este usuario
    try {
      await ctx.setChatMenuButton({
        menu_button: {
          type: "web_app",
          text: "Abrir Xposed",
          web_app: { url: appUrl }
        }
      });
    } catch (e) {
      console.error("[BOT] Error setting menu button in /start:", e);
    }

    await ctx.reply(
      `¡Bienvenido a Xposed, @${username}! 🤫\n\n` +
      `Te hemos regalado 100 ★ estrellas para empezar.\n\n` +
      `Tu enlace personal para recibir secretos es:\n` +
      `👉 ${personalLink}\n\n` +
      `Compártelo en tu bio de Instagram o TikTok.`,
      {
        reply_markup: {
          inline_keyboard: [[{ 
            text: "Ver mi Inbox 📩", 
            web_app: { url: appUrl } 
          }]]
        }
      }
    );
  } catch (err: any) {
    console.error("[BOT] Error in /start handler:", err);
    let msg = "Hubo un error al iniciar.";
    if (err.message?.includes("user")) {
      msg = "❌ Error de Base de Datos: El usuario de la base de datos no existe o la contraseña es incorrecta. Revisa tu DATABASE_URL en Neon.";
    } else if (err.message?.includes("relation")) {
      msg = "❌ Error de Base de Datos: Faltan las tablas. Intenta de nuevo, estoy intentando crearlas automáticamente.";
    } else {
      msg = `❌ Error: ${err.message}`;
    }
    await ctx.reply(msg);
  }
});

bot.on("pre_checkout_query", async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});

bot.on("message:successful_payment", async (ctx) => {
  const payment = ctx.message?.successful_payment;
  if (!payment) return;

  const payload = payment.invoice_payload;
  // payload format: "stars_TELEGRAMID_AMOUNT"
  const parts = payload.split("_");
  if (parts.length !== 3 || parts[0] !== "stars") return;

  const telegramId = parseInt(parts[1]);
  const amount = parseInt(parts[2]);

  if (!telegramId || !amount || !sql) return;

  try {
    await sql`
      WITH updated_user AS (
        UPDATE users
        SET stars = stars + ${amount}
        WHERE telegram_id = ${telegramId}
        RETURNING telegram_id
      )
      INSERT INTO transactions (user_id, type, amount)
      SELECT telegram_id, 'purchase', ${amount}
      FROM updated_user
    `;

    await ctx.reply(
      `✅ ¡Recibiste ${amount} ★ estrellas!\n\nYa puedes revelar pistas en tu inbox.`,
      {
        reply_markup: {
          inline_keyboard: [[{
            text: "Ver mi Inbox 📩",
            web_app: { url: process.env.NEXT_PUBLIC_APP_URL || "https://tu-app.vercel.app" }
          }]]
        }
      }
    );
  } catch (err) {
    console.error("[BOT] Error processing payment:", err);
  }
});

// Middleware para procesar el webhook de Telegram
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host")}`;

    if (!botToken || botToken === "dummy_token") {
      return NextResponse.json({ ok: false, error: "Token config error" });
    }

    // Inicializar y configurar botón de menú en cada instancia caliente
    if (!bot.isInited()) {
      await bot.init();
      console.log(`[BOT] Configurando Menu Button con URL: ${appUrl}`);
      await bot.api.setChatMenuButton({
        menu_button: {
          type: "web_app",
          text: "Abrir Xposed",
          web_app: { url: appUrl }
        }
      });
    }

    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("ERROR EN WEBHOOK:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
