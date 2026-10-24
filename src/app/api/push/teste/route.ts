import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { pushConfigured, sendPushTick } from "@/lib/push/webpush";

/** "Enviar notificação de teste": toca nos aparelhos da própria pessoa. */
export async function POST() {
  const { userId } = await getBusinessContext();
  if (!pushConfigured()) {
    return NextResponse.json({ error: "As notificações ainda não estão configuradas no servidor." }, { status: 503 });
  }

  const db = createClient() as unknown as SupabaseClient;
  const { data: subs } = await db.from("push_subscriptions").select("id, endpoint").eq("user_id", userId);

  let sent = 0;
  for (const sub of (subs ?? []) as { id: string; endpoint: string }[]) {
    const result = await sendPushTick(sub.endpoint);
    if (result === "gone") await db.from("push_subscriptions").delete().eq("id", sub.id);
    if (result === "ok") sent += 1;
  }
  return NextResponse.json({ sent });
}
