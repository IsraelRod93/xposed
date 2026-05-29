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
  const refCode = (ctx.match as string)?.trim() || null; // referral share_link passed as /start REFCODE

  if (!telegramId) return;
  if (!sql) {
    return ctx.reply("❌ Error: La variable DATABASE_URL no está configurada en Vercel.");
  }

  try {
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
          sender_city TEXT,
          sender_platform TEXT,
          sender_hour INTEGER,
          sender_ip TEXT,
          is_clue_revealed BOOLEAN DEFAULT FALSE,
          revealed_premium TEXT DEFAULT '',
          hidden_by_user BOOLEAN DEFAULT FALSE,
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
    }

    const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tu-app.vercel.app";
    const appUrl = rawAppUrl.endsWith("/") ? rawAppUrl.slice(0, -1) : rawAppUrl;

    const users = await sql`SELECT * FROM users WHERE telegram_id = ${telegramId}`;
    let user = users.length > 0 ? users[0] : null;

    if (!user) {
      const shareLink = `${username}_${Math.random().toString(36).substring(2, 7)}`;

      // Check for valid referral
      let referrerId: number | null = null;
      if (refCode) {
        const referrers = await sql`SELECT telegram_id FROM users WHERE share_link = ${refCode}`;
        if (referrers.length > 0 && Number(referrers[0].telegram_id) !== telegramId) {
          referrerId = Number(referrers[0].telegram_id);
        }
      }

      const initialStars = referrerId ? 150 : 100;

      const newUser = await sql`
        INSERT INTO users (telegram_id, username, share_link, stars, referred_by)
        VALUES (${telegramId}, ${username}, ${shareLink}, ${initialStars}, ${referrerId})
        RETURNING *
      `;
      user = newUser[0];

      if (referrerId) {
        // Grant 50 tokens to referrer and bump their count
        await sql`
          UPDATE users SET stars = stars + 50, referral_count = referral_count + 1
          WHERE telegram_id = ${referrerId}
        `;
        // Record in transactions
        try {
          await sql`INSERT INTO transactions (user_id, type, amount) VALUES (${referrerId}, 'referral', 50)`;
        } catch {}
        // Notify referrer
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: referrerId,
            text: `🎁 ¡Tu invitación funcionó!\n@${username} se unió con tu link y ambos ganaron +50 🪙 tokens.`,
            reply_markup: { inline_keyboard: [[{ text: "Ver mi Inbox 📩", web_app: { url: appUrl } }]] }
          })
        }).catch(() => {});
      }
    }

    const personalLink = `${appUrl}/u/${user.share_link}`;
    const referralLink = `https://t.me/${ctx.me.username}?start=${user.share_link}`;
    const isNew = !users.length;

    try {
      await ctx.setChatMenuButton({
        menu_button: { type: "web_app", text: "Abrir Xposed", web_app: { url: appUrl } }
      });
    } catch (e) {}

    const welcomeMsg = isNew
      ? `¡Bienvenido a Xposed, @${username}! 🤫\n\n` +
        `Te hemos regalado ${refCode ? '150' : '100'} 🪙 tokens para empezar${refCode ? ' (50 extra por invitación 🎁)' : ''}.\n\n` +
        `Tu enlace personal:\n👉 ${personalLink}\n\n` +
        `Invita amigos y ambos ganan 50 🪙:\n🔗 ${referralLink}`
      : `¡Hola de nuevo, @${username}! 👋\n\n` +
        `Tu enlace personal:\n👉 ${personalLink}`;

    const affiliateUrl = `tg://settings/stars_affiliate_programs`;

    await ctx.reply(welcomeMsg, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Ver mi Inbox 📩", web_app: { url: appUrl } }],
          [{ text: "💸 Ganar comisión como afiliado", url: affiliateUrl }],
        ]
      }
    });
  } catch (err: any) {
    console.error("[BOT] Error in /start handler:", err);
    await ctx.reply(`❌ Error: ${err.message}`);
  }
});

bot.command("affiliate", async (ctx) => {
  const affiliateUrl = `tg://settings/stars_affiliate_programs`;
  await ctx.reply(
    `💸 *Programa de Afiliados Xposed*\n\n` +
    `Gana el *90% de comisión* durante 3 meses por cada pago que generen los usuarios que traigas.\n\n` +
    `Toca el botón para unirte:`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "🚀 Unirme como afiliado", url: affiliateUrl }]]
      }
    }
  );
});

bot.callbackQuery(/^adm_del_(.+)$/, async (ctx) => {
  const adminId = process.env.ADMIN_TELEGRAM_ID;
  if (String(ctx.from.id) !== adminId) {
    await ctx.answerCallbackQuery({ text: '⛔ No autorizado' });
    return;
  }
  const messageId = ctx.match[1];
  if (sql) {
    try {
      await sql`DELETE FROM messages WHERE id = ${messageId}::uuid`;
      await sql`DELETE FROM reports WHERE message_id = ${messageId}::uuid`;
    } catch {}
  }
  await ctx.answerCallbackQuery({ text: '✅ Eliminado' });
  await ctx.editMessageText('🗑 Mensaje eliminado permanentemente.').catch(() => {});
});

bot.callbackQuery(/^adm_ign_(.+)$/, async (ctx) => {
  const adminId = process.env.ADMIN_TELEGRAM_ID;
  if (String(ctx.from.id) !== adminId) {
    await ctx.answerCallbackQuery({ text: '⛔ No autorizado' });
    return;
  }
  await ctx.answerCallbackQuery({ text: '✅ Reporte ignorado' });
  await ctx.editMessageText('✅ Reporte ignorado — mensaje conservado.').catch(() => {});
});

bot.on("pre_checkout_query", async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});

bot.on("message:successful_payment", async (ctx) => {
  const payment = ctx.message?.successful_payment;
  if (!payment || !sql) return;

  const payload = payment.invoice_payload;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tu-app.vercel.app";

  try {
    if (payload.startsWith("sub_")) {
      // Subscription payment
      const telegramId = parseInt(payload.split("_")[1]);
      if (!telegramId) return;

      await sql`
        UPDATE users
        SET subscribed_until = NOW() + INTERVAL '30 days'
        WHERE telegram_id = ${telegramId}
      `;
      await sql`
        INSERT INTO transactions (user_id, type, amount)
        VALUES (${telegramId}, 'subscription', -250)
      `;

      await ctx.reply(
        `🌟 ¡Xposed Pro activado por 30 días!\n\n` +
        `✅ Pistas reveladas ilimitadas\n` +
        `✅ Cambio de nombre ilimitado\n\n` +
        `Disfruta tu suscripción 🎉`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: "Abrir Xposed 🚀", web_app: { url: appUrl } }]]
          }
        }
      );
    } else if (payload.startsWith("stars_")) {
      // Token purchase: stars_TELEGRAMID_AMOUNT
      const parts = payload.split("_");
      if (parts.length !== 3) return;
      const telegramId = parseInt(parts[1]);
      const amount = parseInt(parts[2]);
      if (!telegramId || !amount) return;

      await sql`
        WITH updated_user AS (
          UPDATE users SET stars = stars + ${amount}
          WHERE telegram_id = ${telegramId}
          RETURNING telegram_id
        )
        INSERT INTO transactions (user_id, type, amount)
        SELECT telegram_id, 'purchase', ${amount} FROM updated_user
      `;

      await ctx.reply(
        `✅ ¡Recibiste ${amount} 🪙 tokens!\n\nYa puedes revelar pistas en tu inbox.`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: "Ver mi Inbox 📩", web_app: { url: appUrl } }]]
          }
        }
      );
    }
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
