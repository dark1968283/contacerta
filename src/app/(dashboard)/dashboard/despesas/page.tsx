import Link from "next/link";
import { ArrowLeft, CheckCircle2, Plus, Trash2, Wallet } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { formatMT } from "@/lib/format";
import { BUSINESS_TIMEZONE, zonedDayKey } from "@/lib/timezone";
import { monthRange, parseMonth, monthLabel } from "@/lib/reports";
import { expenseCategory, type ExpenseRow } from "@/lib/expenses";
import { Panel } from "@/components/dashboard/Panel";
import { deleteExpense } from "./actions";

export const metadata = { title: "Despesas · ContaCerta" };

export default async function DespesasPage({ searchParams }: { searchParams: { guardado?: string } }) {
  const { businessId, userId, role } = await getBusinessContext();
  const db = createClient() as unknown as SupabaseClient;
  const now = new Date();
  const key = parseMonth(undefined, now);
  const { start, end } = monthRange(key);

  const { data, error } = await db
    .from("expenses")
    .select("id, category, amount, note, spent_at, created_by")
    .eq("business_id", businessId)
    .gte("spent_at", start.toISOString())
    .lt("spent_at", end.toISOString())
    .order("spent_at", { ascending: false });
  const rows = (data ?? []) as ExpenseRow[];
  const total = rows.reduce((s, r) => s + Number(r.amount), 0);
  const notReady = Boolean(error);
  const todayKey = zonedDayKey(now, BUSINESS_TIMEZONE);

  const byCategory = new Map<string, number>();
  rows.forEach((r) => byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + Number(r.amount)));
  const top = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-10 text-dark-text">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-dark-muted hover:text-dark-text">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Início
      </Link>

      {searchParams.guardado === "1" && (
        <p className="flex items-center gap-2 rounded-2xl bg-brandGlow/10 px-4 py-3 text-sm font-medium text-brandGlow">
          <CheckCircle2 className="h-5 w-5" aria-hidden /> Despesa guardada.
        </p>
      )}

      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Despesas</h1>
          <p className="text-sm text-dark-muted">{monthLabel(key)}</p>
        </div>
        <Link
          href="/dashboard/despesas/nova"
          className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-onbrand hover:bg-brand/90"
        >
          <Plus className="h-4 w-4" aria-hidden /> Gastei dinheiro
        </Link>
      </div>

      {notReady ? (
        <Panel className="p-5 text-sm text-dark-muted">As despesas ficam activas depois de aplicar a actualização 0025 no Supabase.</Panel>
      ) : (
        <>
          <Panel className="p-5">
            <p className="text-sm text-dark-muted">Gastou este mês</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{formatMT(total)}</p>
            {top.length > 0 && (
              <p className="mt-2 text-sm text-dark-muted">
                {top.map(([k, v]) => `${expenseCategory(k).label} ${formatMT(v)}`).join(" · ")}
              </p>
            )}
          </Panel>

          {rows.length === 0 ? (
            <Panel className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <Wallet className="h-6 w-6 text-dark-faint" aria-hidden />
              <p className="text-sm text-dark-muted">Ainda não registou despesas este mês.</p>
            </Panel>
          ) : (
            <Panel as="div" className="px-4 py-1">
              <ul className="divide-y divide-dark-border">
                {rows.map((r) => {
                  const c = expenseCategory(r.category);
                  const at = new Date(r.spent_at);
                  const canDelete = role === "admin" || (r.created_by === userId && zonedDayKey(at, BUSINESS_TIMEZONE) === todayKey);
                  return (
                    <li key={r.id} className="flex items-center gap-3 py-3.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-dark-muted">
                        <c.Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{r.note || c.label}</p>
                        <p className="text-xs text-dark-faint">
                          {r.note ? `${c.label} · ` : ""}
                          {at.toLocaleDateString("pt-MZ", { day: "2-digit", month: "short", timeZone: BUSINESS_TIMEZONE })}
                        </p>
                      </div>
                      <span className="shrink-0 font-semibold tabular-nums">{formatMT(Number(r.amount))}</span>
                      {canDelete && (
                        <form action={deleteExpense}>
                          <input type="hidden" name="expense_id" value={r.id} />
                          <button
                            type="submit"
                            aria-label={`Apagar ${c.label}`}
                            className="-mr-1 flex h-9 w-9 items-center justify-center rounded-lg text-dark-faint hover:bg-danger/10 hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </form>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
