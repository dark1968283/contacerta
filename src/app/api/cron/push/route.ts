import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";
import { pushConfigured, sendPushTick } from "@/lib/push/webpush";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Resumo diário (Vercel Cron, todos os dias às 08:00 de Maputo).
 * A Vercel envia "Authorization: Bearer <CRON_SECRET>"; sem isso, recusa.
 * Só "toca" nos telemóveis — o texto é montado por /api/push/mensagem.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!pushConfigured()) {
    return NextResponse.json({ error: "push not configured" }, { status: 503 });
  }

  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data: subs, error } = await admin.from("push_subscriptions").select("id, endpoint").limit(5000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let ok = 0;
  let gone = 0;
  const list = (subs ?? []) as { id: string; endpoint: string }[];
  // Em lotes pequenos para não sobrecarregar.
  for (let i = 0; i < list.length; i += 20) {
    const batch = list.slice(i, i + 20);
    const results = await Promise.all(batch.map((s) => sendPushTick(s.endpoint)));
    const goneIds = batch.filter((_, j) => results[j] === "gone").map((s) => s.id);
    const okIds = batch.filter((_, j) => results[j] === "ok").map((s) => s.id);
    if (goneIds.length) await admin.from("push_subscriptions").delete().in("id", goneIds);
    if (okIds.length) await admin.from("push_subscriptions").update({ last_sent_at: new Date().toISOString() }).in("id", okIds);
    ok += okIds.length;
    gone += goneIds.length;
  }

  return NextResponse.json({ total: list.length, ok, gone });
}
