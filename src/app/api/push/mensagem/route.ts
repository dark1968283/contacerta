import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { loadNotices } from "@/lib/notifications";
import { formatMT } from "@/lib/format";
import { BUSINESS_TIMEZONE, zonedStartOfDay } from "@/lib/timezone";

export const dynamic = "force-dynamic";

/**
 * Texto da notificação, pedido pelo service worker quando chega um toque.
 * Usa a sessão de quem está no celular, por isso cada pessoa só vê o
 * seu negócio. Exemplo: "Ontem vendeu 3 450 MT · 2 produtos a acabar".
 */
export async function GET() {
  try {
    const { businessId } = await getBusinessContext();
    const supabase = createClient();
    const today = zonedStartOfDay(new Date(), BUSINESS_TIMEZONE);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const [notices, { data: sales }] = await Promise.all([
      loadNotices(),
      supabase
        .from("sales")
        .select("total_amount")
        .eq("business_id", businessId)
        .neq("status", "anulada")
        .gte("created_at", yesterday.toISOString())
        .lt("created_at", today.toISOString()),
    ]);

    const soldYesterday = (sales ?? []).reduce((s, x) => s + Number(x.total_amount), 0);
    const out = notices.stock.filter((n) => n.tone === "danger").length;
    const low = notices.stock.length - out;
    const overdue = notices.debts.filter((n) => n.tone === "danger").length;
    const account = [...notices.subscription, ...notices.payments].find((n) => n.tone !== "info");

    const parts: string[] = [];
    parts.push(soldYesterday > 0 ? `Ontem vendeu ${formatMT(soldYesterday)}.` : "Ontem não houve vendas.");
    if (out) parts.push(`${out} ${out === 1 ? "produto esgotado" : "produtos esgotados"}.`);
    if (low) parts.push(`${low} ${low === 1 ? "produto a acabar" : "produtos a acabar"}.`);
    if (overdue) parts.push(`${overdue} ${overdue === 1 ? "dívida em atraso" : "dívidas em atraso"}.`);
    if (account) parts.push(account.title);

    const urgent = out > 0 || overdue > 0 || Boolean(account);
    return NextResponse.json(
      {
        title: urgent ? "ContaCerta · Atenção" : "ContaCerta · Bom dia!",
        body: parts.join(" "),
        url: urgent ? "/dashboard/notificacoes" : "/dashboard",
        tag: "contacerta-diario",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { title: "ContaCerta", body: "Abra a app para ver o resumo do seu negócio.", url: "/dashboard", tag: "contacerta-diario" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
