import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  WalletCards,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMT } from "@/lib/format";
import { Panel } from "@/components/dashboard/Panel";

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  parcial: "Parcial",
  paga: "Paga",
  vencida: "Vencida",
};

const statusStyle: Record<string, string> = {
  pendente: "bg-warning/10 text-warning ring-warning/20",
  parcial: "bg-warning/10 text-warning ring-warning/20",
  paga: "bg-brandGlow/10 text-brandGlow ring-brandGlow/20",
  vencida: "bg-danger/10 text-danger ring-danger/20",
};

export default async function DividasPage({
  searchParams,
}: {
  searchParams: { customer?: string };
}) {
  const supabase = createClient();

  let debtsQuery = supabase
    .from("debts")
    .select(
      "id, customer_id, sale_id, total_amount, amount_paid, status, created_at"
    )
    .order("created_at", { ascending: false });

  if (searchParams.customer) {
    debtsQuery = debtsQuery.eq("customer_id", searchParams.customer);
  }

  const [{ data: debts }, { data: customers }] = await Promise.all([
    debtsQuery,
    supabase.from("customers").select("id, name"),
  ]);

  const customerNames = new Map(
    (customers ?? []).map((customer) => [customer.id, customer.name])
  );

  const totalOutstanding = (debts ?? []).reduce(
    (sum, debt) =>
      sum +
      Math.max(
        0,
        Number(debt.total_amount) - Number(debt.amount_paid)
      ),
    0
  );

  const openCount = (debts ?? []).filter(
    (debt) => Number(debt.total_amount) > Number(debt.amount_paid)
  ).length;

  const paidCount = (debts ?? []).filter(
    (debt) => debt.status === "paga"
  ).length;

  return (
    <div className="-mx-4 -mt-5 -mb-6 min-h-[calc(100dvh-5rem)] bg-dark-bg px-4 pb-16 pt-5 shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-100vmax_-100vmax)] [background-image:radial-gradient(ellipse_520px_420px_at_50%_-120px,rgba(34,199,102,0.10),transparent)] sm:-mx-6 sm:px-6">
      <div className="space-y-6">
        <header className="space-y-4">
          {searchParams.customer && (
            <Link
              href={`/dashboard/clientes/${searchParams.customer}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-dark-muted transition-colors hover:text-dark-text"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Voltar ao cliente
            </Link>
          )}

          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/10 ring-1 ring-warning/15">
              <WalletCards className="h-5 w-5 text-warning" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-dark-text sm:text-[28px]">
                Dívidas
              </h1>
              <p className="mt-0.5 text-sm text-dark-muted">
                Acompanhe os valores a receber.
              </p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Panel className="p-4 sm:p-5">
            <p className="text-xs font-medium text-dark-muted">
              Total em aberto
            </p>
            <p className="mt-2 break-words text-xl font-bold tracking-tight text-warning tabular-nums sm:text-2xl">
              {formatMT(totalOutstanding)}
            </p>
            <p className="mt-1 text-xs text-dark-faint">
              Saldo das dívidas listadas
            </p>
          </Panel>

          <Panel className="p-4 sm:p-5">
            <p className="text-xs font-medium text-dark-muted">
              Por regularizar
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-dark-text tabular-nums">
              {openCount}
            </p>
            <p className="mt-1 text-xs text-dark-faint">
              Dívidas com saldo
            </p>
          </Panel>

          <Panel className="col-span-2 p-4 sm:col-span-1 sm:p-5">
            <p className="text-xs font-medium text-dark-muted">
              Dívidas pagas
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-brandGlow tabular-nums">
              {paidCount}
            </p>
            <p className="mt-1 text-xs text-dark-faint">
              Total de registos pagos
            </p>
          </Panel>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-faint">
              Registos de dívidas
            </h2>
            <span className="rounded-full border border-dark-border bg-white/[0.03] px-2.5 py-1 text-xs text-dark-muted">
              {debts?.length ?? 0} registos
            </span>
          </div>

          {debts?.length === 0 && (
            <Panel className="px-6 py-10 text-center sm:py-14">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
                <CheckCircle2
                  className="h-5 w-5 text-dark-muted"
                  aria-hidden
                />
              </span>
              <p className="mt-4 font-medium text-dark-text">
                Ainda não há dívidas registadas.
              </p>
              <p className="mt-1 text-sm text-dark-muted">
                Quando registar uma venda a crédito, a dívida aparecerá aqui.
              </p>
            </Panel>
          )}

          <ul className="grid gap-3 xl:grid-cols-2">
            {debts?.map((debt) => {
              const remaining = Math.max(
                0,
                Number(debt.total_amount) - Number(debt.amount_paid)
              );

              const badge =
                statusStyle[debt.status] ??
                "bg-white/[0.05] text-dark-muted ring-white/10";

              return (
                <li key={debt.id} className="min-w-0">
                  <Link
                    href={`/dashboard/dividas/${debt.id}`}
                    className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-brandGlow/50"
                  >
                    <Panel className="p-4 transition-transform duration-200 group-hover:-translate-y-0.5 sm:p-5">
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            debt.status === "paga"
                              ? "bg-brandGlow/10 text-brandGlow"
                              : debt.status === "vencida"
                                ? "bg-danger/10 text-danger"
                                : "bg-warning/10 text-warning"
                          }`}
                        >
                          {debt.status === "paga" ? (
                            <CheckCircle2 className="h-5 w-5" aria-hidden />
                          ) : (
                            <Clock3 className="h-5 w-5" aria-hidden />
                          )}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-dark-text">
                            {customerNames.get(debt.customer_id) ?? "Cliente"}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-dark-muted">
                            <CalendarDays
                              className="h-3.5 w-3.5 shrink-0"
                              aria-hidden
                            />
                            {new Date(debt.created_at).toLocaleDateString(
                              "pt-MZ",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                timeZone: "Africa/Maputo",
                              }
                            )}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badge}`}
                        >
                          {statusLabel[debt.status] ?? debt.status}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-dark-border pt-4">
                        <div className="min-w-0">
                          <p className="text-xs text-dark-muted">Valor total</p>
                          <p className="mt-1 break-words text-sm font-semibold text-dark-text tabular-nums">
                            {formatMT(Number(debt.total_amount))}
                          </p>
                        </div>
                        <div className="min-w-0 text-right">
                          <p className="text-xs text-dark-muted">
                            {remaining > 0 ? "Por receber" : "Saldo"}
                          </p>
                          <p
                            className={`mt-1 break-words text-sm font-semibold tabular-nums ${
                              remaining > 0
                                ? "text-warning"
                                : "text-brandGlow"
                            }`}
                          >
                            {formatMT(remaining)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-1 text-xs font-medium text-brandGlow">
                        Ver detalhes
                        <ArrowUpRight
                          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </div>
                    </Panel>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
