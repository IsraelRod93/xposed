import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { share_link, content, sender_os, sender_country } = await req.json();

    if (!share_link || !content) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // 1. Buscar al destinatario por su share_link
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("telegram_id")
      .eq("share_link", share_link)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // 2. Insertar el mensaje
    const { error: insertError } = await supabase
      .from("messages")
      .insert([{
        receiver_id: user.telegram_id,
        content,
        sender_os,
        sender_country,
        is_clue_revealed: false
      }]);

    if (insertError) throw insertError;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error al guardar mensaje:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
