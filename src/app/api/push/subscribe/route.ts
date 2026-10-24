import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";

type Body = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

/** Guarda este telemóvel/computador para receber avisos. */
export async function POST(request: NextRequest) {
  const { userId, businessId } = await getBusinessContext();
  const body = (await request.json().catch(() => ({}))) as Body;
  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh;
  const auth = body.keys?.auth;

  if (!endpoint || !endpoint.startsWith("https://") || !p256dh || !auth) {
    return NextResponse.json({ error: "Subscrição inválida" }, { status: 400 });
  }

  // push_subscriptions vem da migração 0022 (ainda fora dos tipos gerados).
  const db = createClient() as unknown as SupabaseClient;
  // Se o mesmo telemóvel já estava registado (por exemplo, por outra conta), substitui.
  await db.from("push_subscriptions").delete().eq("endpoint", endpoint);
  const { error } = await db.from("push_subscriptions").insert({
    user_id: userId,
    business_id: businessId,
    endpoint,
    p256dh,
    auth,
    user_agent: request.headers.get("user-agent")?.slice(0, 200) ?? null,
  });

  if (error) {
    const missing = /does not exist|schema cache/i.test(error.message);
    return NextResponse.json(
      { error: missing ? "Falta aplicar a actualização 0022 no Supabase." : "Não foi possível activar." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}

/** Deixa de receber avisos neste aparelho. */
export async function DELETE(request: NextRequest) {
  await getBusinessContext();
  const body = (await request.json().catch(() => ({}))) as Body;
  if (!body.endpoint) return NextResponse.json({ ok: true });
  const db = createClient() as unknown as SupabaseClient;
  await db.from("push_subscriptions").delete().eq("endpoint", body.endpoint);
  return NextResponse.json({ ok: true });
}
