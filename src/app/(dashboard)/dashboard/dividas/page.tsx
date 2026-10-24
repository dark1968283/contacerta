import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  HandCoins,
  MessageCircle,
  WalletCards,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMT } from "@/lib/format";
import { Panel } from "@/components/dashboard/Panel";

const DAY = 24 * 60 * 60 * 1000;

function ageLabel(createdAt: string, now: number) {
  const days = Math.floor((now - new Date(createdAt).getTime()) / DAY);
  if (days <= 0) return "Hoje";
  if (days === 1) return "Ontem";
  if (days < 30) return `Há ${days} dias`;
  const months = Math.floor(days / 30);
  return months === 1 ? "Há 1 mês" : `Há ${months} meses`;
}

function whatsappNumber(phone: string | null | undefined) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("258")) return digits;
  if (digits.length === 9) return `258${digits}`;
  return null;
}

export default async function DividasPage({
  searchParams,
}: {
  searchParams: { customer?: string };
}) {
  const supabase = createClient();

  let debtsQuery = supabase
    .from("debts")
    .select("id, customer_id, sale_id, total_amount, amount_paid, status, created_at")
    .order("created_at", { ascending: true });

  if (searchParams.customer) {
    debtsQuery = debtsQuery.eq("customer_id", searchParams.customer);
  }

  const [{ data: debts }, { data: customers }] = await Promise.all([
    debtsQuery,
    supabase.from("customers").select("id, name, phone"),
  ]);

  const customerById = new Map((customers ?? []).map((c) => [c.id, c]));
  const now = Date.now();

  const rows = (debts ?? []).map((debt) => {
    const total = Number(debt.total_amount);
    const paid = Number(debt.amount_paid);
    return { ...debt, total, paid, remaining: Math.max(0, total - paid) };
  });

  // Por receber: as mais antigas primeiro (são as mais urgentes).
  const open = rows.filter((d) => d.remaining > 0);
  // Pagas: as mais recentes primeiro.
  const paid = rows.filter((d) => d.remaining === 0).reverse();

  const totalOutstanding = open.reduce((sum, d) => sum + d.remaining, 0);
  const openCustomers = new Set(open.map((d) => d.customer_id)).size;

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
          <h1 className="text-xl font-semibold tracking-tight text-dark-text sm:text-[28px]">Dívidas</h1>
        </header>

        {/* Resumo: uma só resposta — quanto me devem e quantos clientes. */}
        <Panel className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              totalOutstanding > 0 ? "bg-warning/10 text-warning" : "bg-brandGlow/10 text-brandGlow"
            }`}
          >
            {totalOutstanding > 0 ? (
              <WalletCards className="h-6 w-6" aria-hidden />
            ) : (
              <CheckCircle2 className="h-6 w-6" aria-hidden />
            )}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-dark-muted">{totalOutstanding > 0 ? "Tem a receber" : "Ninguém lhe deve nada"}</p>
            <p
              className={`break-words text-3xl font-bold tracking-tight tabular-nums ${
                totalOutstanding > 0 ? "text-warning" : "text-brandGlow"
              }`}
            >
              {formatMT(totalOutstanding)}
            </p>
            {totalOutstanding > 0 && (
              <p className="mt-0.5 text-sm text-dark-muted">
                de {openCustomers} cliente{openCustomers === 1 ? "" : "s"}
              </p>
            )}
          </div>
          </div>
        </Panel>

        {/* Por receber */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-faint">
            Por receber {open.length > 0 && <span className="text-dark-muted">· {open.length}</span>}
          </h2>

          {open.length === 0 ? (
            <Panel className="px-6 py-8 text-center">
              <p className="font-medium text-dark-text">Não há dívidas por receber.</p>
              <p className="mt-1 text-sm text-dark-muted">
                Quando vender a crédito (“Fica a dever”), a dívida aparece aqui.
              </p>
            </Panel>
          ) : (
            <ul className="grid gap-3 xl:grid-cols-2">
              {open.map((debt) => {
                const customer = customerById.get(debt.customer_id);
                const name = customer?.name ?? "Cliente";
                const phone = whatsappNumber(customer?.phone);
                const overdue = debt.status === "vencida";
                const message = `Olá ${name} 👋\n\nEste é um lembrete sobre o valor de ${formatMT(
                  debt.remaining,
                )} que está pendente.\n\nQuando puder, por favor passe para regularizar.\n\nObrigado!`;

                return (
                  <li key={debt.id} className="min-w-0">
                    <Panel className="p-4 sm:p-5">
                      <Link
                        href={`/dashboard/dividas/${debt.id}`}
                        className="group flex items-start gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brandGlow/50"
                      >
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            overdue ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning"
                          }`}
                        >
                          {name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-dark-text">{name}</p>
                          <p className={`text-sm ${overdue ? "text-danger" : "text-dark-muted"}`}>
                            {ageLabel(debt.created_at, now)}
                            {overdue && " · em atraso"}
                          </p>
                          {debt.paid > 0 && (
                            <p className="text-xs text-dark-muted">
                              Já pagou {formatMT(debt.paid)} de {formatMT(debt.total)}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-lg font-bold tabular-nums text-warning">{formatMT(debt.remaining)}</p>
                          <ChevronRight className="ml-auto mt-1 h-4 w-4 text-dark-faint" aria-hidden />
                        </div>
                      </Link>

                      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-dark-border pt-4">
                        <Link
                          href={`/dashboard/dividas/${debt.id}#receber`}
                          className="flex items-center justify-center gap-2 rounded-xl bg-brandGlow py-3 text-sm font-bold text-onglow transition active:scale-[0.98]"
                        >
                          <HandCoins className="h-4 w-4" aria-hidden />
                          Receber
                        </Link>
                        {phone ? (
                          <a
                            href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] py-3 text-sm font-semibold text-dark-text transition hover:bg-white/[0.07] active:scale-[0.98]"
                          >
                            <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden />
                            Lembrar
                          </a>
                        ) : (
                          <Link
                            href={`/dashboard/clientes/${debt.customer_id}`}
                            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.14] py-3 text-xs font-medium text-dark-muted transition hover:text-dark-text"
                          >
                            Adicionar telefone
                          </Link>
                        )}
                      </div>
                    </Panel>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Já pagas: arrumadas, abrem com um toque. */}
        {paid.length > 0 && (
          <details className="group rounded-2xl border border-dark-border bg-white/[0.02]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-medium text-dark-muted [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brandGlow" aria-hidden />
                Já pagas · {paid.length}
              </span>
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <ul className="divide-y divide-dark-border border-t border-dark-border">
              {paid.map((debt) => (
                <li key={debt.id}>
                  <Link
                    href={`/dashboard/dividas/${debt.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition hover:bg-white/[0.03]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-dark-text">
                        {customerById.get(debt.customer_id)?.name ?? "Cliente"}
                      </span>
                      <span className="block text-xs text-dark-muted">{ageLabel(debt.created_at, now)}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-dark-muted">{formatMT(debt.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
