import Link from "next/link";
import { Clock3, Plus, ShoppingCart, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMT } from "@/lib/format";
import { BUSINESS_TIMEZONE, zonedDayKey, zonedTime } from "@/lib/timezone";
import { Panel } from "@/components/dashboard/Panel";
import { SalesHeader, SalesShell } from "./_components/SalesShell";

export default async function VendasPage() {
  const supabase = createClient();
  const { data: sales } = await supabase.from("sales").select("id, total_amount, payment_method, created_at, customers(name)").order("created_at", { ascending: false }).limit(50);

  // Apresentação da data/hora no fuso do negócio (mesmos helpers do Dashboard).
  const now = new Date();
  const todayKey = zonedDayKey(now, BUSINESS_TIMEZONE);
  const yesterdayKey = zonedDayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000), BUSINESS_TIMEZONE);
  function whenLabel(createdAt: string) {
    const date = new Date(createdAt);
    const day = zonedDayKey(date, BUSINESS_TIMEZONE);
    const time = zonedTime(date, BUSINESS_TIMEZONE);
    if (day === todayKey) return `Hoje, ${time}`;
    if (day === yesterdayKey) return `Ontem, ${time}`;
    return `${date.toLocaleDateString("pt-MZ", { day: "2-digit", month: "short", year: "numeric", timeZone: BUSINESS_TIMEZONE })} · ${time}`;
  }

  return (
    <SalesShell>
      <SalesHeader
        title="Vendas"
        subtitle="As suas vendas mais recentes."
        action={
          <Link
            href="/dashboard/vendas/nova"
            className="group flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand/90 hover:shadow-brand/30 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-brandGlow/40 focus:ring-offset-2 focus:ring-offset-dark-bg sm:px-4 sm:py-3"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" aria-hidden />
            Nova venda
          </Link>
        }
      />

      {sales?.length === 0 && (
        <Panel className="px-6 py-10 text-center sm:py-14">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
            <ShoppingCart className="h-5 w-5 text-dark-muted" aria-hidden />
          </span>
          <p className="mt-4 text-dark-muted">Ainda não há vendas.</p>
          <Link
            href="/dashboard/vendas/nova"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand/90 active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Registar a primeira venda
          </Link>
        </Panel>
      )}

      <ul className="grid gap-3 xl:grid-cols-2">
        {sales?.map((sale) => {
          const customer = sale.customers as unknown as { name: string } | null;
          const credit = sale.payment_method === "credito";
          const Icon = credit ? Clock3 : Wallet;
          return (
            <li key={sale.id}>
              <Panel className="p-3.5 transition-transform duration-200 hover:-translate-y-0.5 sm:p-4">
                <div className="flex items-center gap-3.5">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      credit ? "bg-warning/10 text-warning" : "bg-brandGlow/10 text-brandGlow"
                    }`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-dark-text">{credit ? "Venda a crédito" : "Venda paga"}</p>
                    <p className="truncate text-sm text-dark-muted">{customer?.name ?? "Cliente avulso"}</p>
                    <p className="truncate text-xs text-dark-faint">{whenLabel(sale.created_at)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold tabular-nums text-dark-text">{formatMT(sale.total_amount)}</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        credit ? "bg-warning/10 text-warning" : "bg-brandGlow/10 text-brandGlow"
                      }`}
                    >
                      {credit ? "Crédito" : "Pago"}
                    </span>
                  </div>
                </div>
              </Panel>
            </li>
          );
        })}
      </ul>
    </SalesShell>
  );
}
