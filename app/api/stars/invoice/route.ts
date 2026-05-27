import { NextRequest, NextResponse } from "next/server";
import { Api } from "grammy";

const PACKAGES: Record<string, { stars: number; xtr: number; label: string }> = {
  "100":  { stars: 100,  xtr: 1,  label: "100 Tokens Xposed"  },
  "500":  { stars: 500,  xtr: 5,  label: "500 Tokens Xposed"  },
  "1000": { stars: 1000, xtr: 10, label: "1000 Tokens Xposed" },
};

export async function POST(req: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "Bot not configured" }, { status: 500 });
  }

  try {
    const { telegram_id, package_id } = await req.json();

    if (!telegram_id || !package_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pkg = PACKAGES[package_id];
    if (!pkg) {
      return NextResponse.json({ error: "Invalid package" }, { status: 400 });
    }

    const api = new Api(botToken);
    const payload = `stars_${telegram_id}_${pkg.stars}`;

    const url = await api.createInvoiceLink(
      pkg.label,
      `Recibe ${pkg.stars} tokens para revelar pistas en Xposed`,
      payload,
      "",    // provider_token: empty string for Telegram Stars (XTR)
      "XTR",
      [{ label: pkg.label, amount: pkg.xtr }]
    );

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Error creating invoice:", err);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
