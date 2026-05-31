/**
 * One-time script to enable Telegram Star Referral Program for your bot.
 * Run: node scripts/setup-affiliate.mjs
 *
 * Requirements:
 *   npm install telegram input   (solo para este script, no afecta el proyecto)
 *
 * Credentials needed from https://my.telegram.org:
 *   - API ID
 *   - API Hash
 */

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Api } from "telegram";
import input from "input";

// ─── Config ───────────────────────────────────────────────────────────────────
const BOT_USERNAME  = process.env.BOT_USERNAME  || "MyXposed_bot";  // sin @
const COMMISSION    = 900;   // permille → 900 = 90 %
const DURATION_MONTHS = 3;   // meses
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n=== Xposed — Star Affiliate Program setup ===\n");
console.log(`Bot:        @${BOT_USERNAME}`);
console.log(`Comisión:   ${COMMISSION / 10}%`);
console.log(`Duración:   ${DURATION_MONTHS ? DURATION_MONTHS + " meses" : "permanente"}\n`);

const apiId   = parseInt(await input.text("API ID (my.telegram.org): "));
const apiHash = await input.text("API Hash: ");

const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
  connectionRetries: 5,
});

await client.start({
  phoneNumber: async () => await input.text("Tu número de teléfono (+34...): "),
  password:    async () => await input.text("Contraseña 2FA (si tienes): "),
  phoneCode:   async () => await input.text("Código de Telegram: "),
  onError: (err) => console.error("[auth error]", err.message),
});

console.log("\nConectado. Configurando programa de afiliados...");

try {
  const bot = await client.getInputEntity(`@${BOT_USERNAME}`);

  await client.invoke(
    new Api.bots.UpdateStarRefProgram({
      bot,
      program: new Api.StarRefProgram({
        commissionPermille: COMMISSION,
        durationMonths: DURATION_MONTHS,
      }),
    })
  );

  console.log("\n✅ Star Referral Program activado correctamente.");
  console.log(`   Tu bot @${BOT_USERNAME} ya aparecerá en la lista de apps afiliadas.\n`);
} catch (err) {
  console.error("\n❌ Error:", err.message);
  if (err.message.includes("BOT_NOT_FOUND")) {
    console.error("   Asegúrate de que el username del bot es correcto.");
  }
  if (err.message.includes("COMMISSION_INVALID")) {
    console.error("   La comisión debe estar entre 10 y 990 (1%-99%).");
  }
}

await client.disconnect();
