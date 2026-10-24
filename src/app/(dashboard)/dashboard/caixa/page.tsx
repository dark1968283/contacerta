import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { formatMT } from "@/lib/format";
import { BUSINESS_TIMEZONE, zonedDayKey } from "@/lib/timezone";
import { Panel } from "@/components/dashboard/Panel";
import { CashCountCard } from "@/components/dashboard/CashCountCard";

export const metadata = { title: "Caixa · ContaCerta" };

type CountRow = { id: string; day: string; expected: number | string; counted_cash: number | string; counted_mobile: number | string; difference: number | string };

export default async function CaixaPage() {
  const { businessId } = await getBusinessContext();
  const db = createClient() as unknown as SupabaseClient;
  const today = zonedDayKey(new Date(), BUSINESS_TIMEZONE);

  const [{ data: expected, error }, { data: history }] = await Promise.all([
    db.rpc("cash_expected_today", { p_business_id: businessId }),
    db.from("cash_counts").select("id, day, expected, counted_cash, counted_mobile, difference").eq("business_id", businessId).order("day", { ascending: false }).limit(30),
  ]);
  const rows = (history ?? []) as CountRow[];
  const todayRow = rows.find((r) => r.day === today);

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-10 text-dark-text">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-dark-muted hover:text-dark-text">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Início
      </Link>
      <h1 className="text-2xl font-semibold">Contar a caixa</h1>

      {error ? (
        <Panel className="p-5 text-sm text-dark-muted">Contar a caixa fica activo depois de aplicar a actualização 0025 no Supabase.</Panel>
      ) : (
        <>
          <CashCountCard
            expected={Number(expected ?? 0)}
            done={todayRow ? { counted: Number(todayRow.counted_cash) + Number(todayRow.counted_mobile), difference: Number(todayRow.difference) } : null}
            alwaysOpen={!todayRow}
          />

          {rows.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-dark-muted">Dias anteriores</h2>
              <Panel as="div" className="px-4 py-1">
                <ul className="divide-y divide-dark-border">
                  {rows.map((r) => {
                    const diff = Number(r.difference);
                    const ok = Math.abs(diff) < 1;
                    return (
                      <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <span>
                          {new Date(`${r.day}T12:00:00Z`).toLocaleDateString("pt-MZ", { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" })}
                        </span>
                        <span className="tabular-nums text-dark-muted">{formatMT(Number(r.counted_cash) + Number(r.counted_mobile))}</span>
                        <span className={`font-semibold tabular-nums ${ok ? "text-brandGlow" : diff < 0 ? "text-danger" : "text-warning"}`}>
                          {ok ? "Certo ✓" : diff < 0 ? `−${formatMT(-diff)}` : `+${formatMT(diff)}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </section>
          )}
        </>
      )}
    </div>
  );
}
