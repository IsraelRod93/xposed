import { NextRequest, NextResponse } from "next/server";
import { Api } from "grammy";

export const PACKAGES: Record<string, { tokens: number; xtr: number; label: string; type: 'tokens' | 'subscription' }> = {
  "100":  { tokens: 100,  xtr: 10,  label: "100 Tokens Xposed",   type: 'tokens' },
  "500":  { tokens: 500,  xtr: 50,  label: "500 Tokens Xposed",   type: 'tokens' },
  "1000": { tokens: 1000, xtr: 100, label: "1000 Tokens Xposed",  type: 'tokens' },
  "sub":  { tokens: 0,    xtr: 250, label: "Xposed Pro — 1 mes",  type: 'subscription' },
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

    const payload = pkg.type === 'subscription'
      ? `sub_${telegram_id}`
      : `stars_${telegram_id}_${pkg.tokens}`;

    const description = pkg.type === 'subscription'
      ? 'Pistas reveladas ilimitadas + cambio de nombre ilimitado por 30 días'
      : `Recibe ${pkg.tokens} tokens para revelar pistas en Xposed`;

    const url = await api.createInvoiceLink(
      pkg.label,
      description,
      payload,
      "",
      "XTR",
      [{ label: pkg.label, amount: pkg.xtr }]
    );

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Error creating invoice:", err);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
