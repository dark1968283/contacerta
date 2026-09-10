import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { formatMT } from "@/lib/format";
import { BUSINESS_TIMEZONE, zonedDayKey, zonedShortDate, zonedStartOfDay, zonedTime } from "@/lib/timezone";
import { buildEmptyBuckets, fillBuckets } from "@/lib/dashboard-chart";
import { PaymentMethodIcon } from "@/components/ui/payment-method-icon";
import {
  Wallet,
  Clock3,
  TrendingUp,
  Receipt,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Plus,
} from "lucide-react";

const periods = { hoje: "Hoje", "7-dias": "7 dias", "30-dias": "30 dias", mes: "Este mês" } as const;
type Period = keyof typeof periods;

/**
 * Início do período, como instante UTC real correspondente à meia-noite
 * local (Africa/Maputo) do dia relevante — nunca a meia-noite do
 * servidor, que pode estar noutro fuso horário.
 */
function periodStart(period: Period, now: Date): Date {
  const todayStart = zonedStartOfDay(now, BUSINESS_TIMEZONE);
  if (period === "7-dias") return new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
  if (period === "30-dias") return new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000);
  if (period === "mes") {
    // Meia-noite local do dia 1 do mês corrente.
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIMEZONE }).formatToParts(now);
    const year = parts.find((p) => p.type === "year")!.value;
    const month = parts.find((p) => p.type === "month")!.value;
    return zonedStartOfDay(new Date(`${year}-${month}-01T12:00:00Z`), BUSINESS_TIMEZONE);
  }
  return todayStart;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { periodo?: string };
}) {
  const { userId, businessId } = await getBusinessContext();
  const supabase = createClient();

  const now = new Date();
  const rawPeriod = searchParams.periodo ?? "hoje";
  const period: Period = rawPeriod in periods ? (rawPeriod as Period) : "hoje";
  const start = periodStart(period, now);

  const [{ data: profile }, { data: sales }, { data: debts }, { data: debtPayments }, { data: activeProducts }] =
    await Promise.all([
      supabase.from("users").select("name").eq("id", userId).single(),
      supabase
        .from("sales")
        .select("id,total_amount,payment_method,customer_id,created_at")
        .eq("business_id", businessId)
        .gte("created_at", start.toISOString())
        .order("created_at", { ascending: false }),
      // "Por receber" é o saldo em aberto AGORA, não depende do período selecionado.
      supabase
        .from("debts")
        .select("id,customer_id,total_amount,amount_paid,status")
        .eq("business_id", businessId)
        .in("status", ["pendente", "parcial", "vencida"]),
      supabase
        .from("debt_payments")
        .select("amount")
        .eq("business_id", businessId)
        .gte("created_at", start.toISOString()),
      supabase
        .from("products")
        .select("id,name,stock_quantity,low_stock_threshold")
        .eq("business_id", businessId)
        .eq("is_active", true),
    ]);

  const saleIds = sales?.map((s) => s.id) ?? [];
  const customerIds = [
    ...new Set([
      ...(sales?.map((s) => s.customer_id).filter((id): id is string => id !== null) ?? []),
      ...(debts?.map((d) => d.customer_id) ?? []),
    ]),
  ];

  const [{ data: items }, { data: customers }] = await Promise.all([
    saleIds.length
      ? supabase.from("sale_items").select("sale_id,product_id,quantity,unit_price").in("sale_id", saleIds)
      : Promise.resolve({
          data: [] as { sale_id: string; product_id: string; quantity: number; unit_price: number }[],
        }),
    customerIds.length
      ? supabase.from("customers").select("id,name").eq("business_id", businessId).in("id", customerIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  // Ranking histórico de produtos: usa os IDs realmente vendidos no período,
  // SEM filtrar por is_active — um produto entretanto desativado continua
  // a contar no histórico (corrige o bug descrito na Fase 6). A secção de
  // Stock, mais abaixo, continua a usar só `activeProducts`. Também traz
  // cost_price para o cálculo de lucro bruto — quando o produto não tem
  // custo registado, esse item simplesmente não entra na conta (nunca
  // assumimos custo 0).
  const soldProductIds = [...new Set((items ?? []).map((i) => i.product_id))];
  const { data: soldProducts } = soldProductIds.length
    ? await supabase.from("products").select("id,name,cost_price").in("id", soldProductIds)
    : { data: [] as { id: string; name: string; cost_price: number | null }[] };

  const total = sales?.reduce((sum, s) => sum + s.total_amount, 0) ?? 0;
  const paidDirectly = sales?.filter((s) => s.payment_method === "pago").reduce((sum, s) => sum + s.total_amount, 0) ?? 0;
  const receivedFromDebts = debtPayments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const received = paidDirectly + receivedFromDebts;
  const outstanding = debts?.reduce((sum, d) => sum + (d.total_amount - d.amount_paid), 0) ?? 0;
  const debtCustomers = new Set(debts?.map((d) => d.customer_id)).size;
  const hasOverdueDebt = debts?.some((d) => d.status === "vencida") ?? false;
  const avgTicket = sales?.length ? total / sales.length : null;

  const customerNames = new Map((customers ?? []).map((c) => [c.id, c.name]));
  const productNames = new Map((soldProducts ?? []).map((p) => [p.id, p.name]));
  const productCosts = new Map((soldProducts ?? []).map((p) => [p.id, p.cost_price]));

  // Lucro bruto: soma apenas os itens cujo produto tem custo registado.
  // Se nenhum item tiver custo, não há dados para calcular lucro — não
  // inventamos custo 0, que inflacionaria o valor.
  let grossProfit = 0;
  let itemsWithCost = 0;
  items?.forEach((item) => {
    const cost = productCosts.get(item.product_id);
    if (cost === undefined || cost === null) return;
    grossProfit += item.quantity * item.unit_price - item.quantity * cost;
    itemsWithCost += 1;
  });
  const hasProfitData = itemsWithCost > 0;

  const ranking = new Map<string, { name: string; quantity: number }>();
  items?.forEach((item) => {
    const name = productNames.get(item.product_id);
    if (!name) return; // produto não encontrado (não deveria acontecer, mas defensivo)
    const entry = ranking.get(item.product_id) ?? { name, quantity: 0 };
    entry.quantity += item.quantity;
    ranking.set(item.product_id, entry);
  });
  const topProducts = [...ranking.values()]
    .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name))
    .slice(0, 3);
  const distinctProductsSold = ranking.size;

  // Principais clientes devedores — a partir dos mesmos `debts` já
  // carregados para "Por receber" (nenhuma query nova).
  const debtByCustomer = new Map<string, number>();
  debts?.forEach((d) => {
    const remaining = d.total_amount - d.amount_paid;
    debtByCustomer.set(d.customer_id, (debtByCustomer.get(d.customer_id) ?? 0) + remaining);
  });
  const topDebtors = [...debtByCustomer.entries()]
    .map(([customerId, amount]) => ({ name: customerNames.get(customerId) ?? "Cliente", amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  const chart = fillBuckets(buildEmptyBuckets(period, now), sales ?? [], period);
  const chartMax = Math.max(...chart.map((p) => p.value), 1);
  const hasSalesInPeriod = (sales?.length ?? 0) > 0;

  // Geometria do gráfico calculada uma vez para ser reutilizada na linha,
  // na área preenchida e nas gridlines.
  const chartPoints = chart.map((point, i) => ({
    ...point,
    x: chart.length === 1 ? 150 : 12 + (i * 276) / (chart.length - 1),
    y: 112 - (point.value / chartMax) * 88,
  }));
  const linePath = chartPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const firstPoint = chartPoints[0];
  const lastPoint = chartPoints.at(-1);
  const areaPath =
    firstPoint && lastPoint ? `${linePath} L ${lastPoint.x} 112 L ${firstPoint.x} 112 Z` : "";

  const todayKey = zonedDayKey(now, BUSINESS_TIMEZONE);

  const lowStockCount = activeProducts?.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold).length ?? 0;
  const outOfStockCount = activeProducts?.filter((p) => p.stock_quantity === 0).length ?? 0;

  return (
    <div className="-mx-4 -mt-5 -mb-6 bg-dark-bg px-4 pb-16 pt-5 sm:-mx-6 sm:px-6 [background-image:radial-gradient(ellipse_900px_420px_at_50%_-120px,rgba(34,199,102,0.10),transparent)]">
      <div className="space-y-8">
        {/* Command bar — o nome do negócio já vive na navegação flutuante partilhada; aqui só saudação + ação + período. */}
        <header className="space-y-4">
          <div className="flex items-start justify-between gap-3 sm:items-center">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-dark-text sm:text-2xl">
                Olá, {profile?.name?.split(" ")[0] ?? ""} 👋
              </h1>
              <p className="mt-0.5 text-sm text-dark-muted">Como está o seu negócio hoje?</p>
            </div>
            <Link
              href="/dashboard/vendas/nova"
              className="group flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand/90 hover:shadow-brand/30 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-brandGlow/40 focus:ring-offset-2 focus:ring-offset-dark-bg sm:px-4 sm:py-3"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" aria-hidden />
              Nova Venda
            </Link>
          </div>

          <nav
            aria-label="Período"
            className="inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-dark-border bg-white/[0.03] p-1"
          >
            {(Object.entries(periods) as [Period, string][]).map(([value, label]) => (
              <Link
                key={value}
                href={value === "hoje" ? "/dashboard" : `/dashboard?periodo=${value}`}
                className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                  value === period ? "bg-brand text-white shadow-sm" : "text-dark-muted hover:bg-white/5 hover:text-dark-text"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>

        {/* Nível 1 — Visão financeira. Superfície "elevated", a mais destacada da página. */}
        <section className="relative overflow-hidden rounded-3xl border border-dark-border bg-dark-elevated p-6 shadow-2xl shadow-black/40 sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brandGlow/40 to-transparent" />

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brandGlow">
              <Wallet className="h-3 w-3" aria-hidden />
              Visão financeira · {periods[period]}
            </span>
            <p className="mt-4 text-[2.75rem] font-bold leading-none tracking-tight tabular-nums text-dark-text sm:text-6xl">
              {formatMT(total)}
            </p>
            <p className="mt-3 text-sm text-dark-muted">
              {hasSalesInPeriod ? (
                <>
                  <span className="font-medium text-dark-text/80">{sales!.length}</span> venda
                  {sales!.length === 1 ? "" : "s"} · ticket médio{" "}
                  <span className="font-medium tabular-nums text-dark-text/80">{formatMT(avgTicket ?? 0)}</span>
                </>
              ) : (
                "Ainda não existem vendas neste período."
              )}
            </p>
          </div>

          <div className="relative mt-6 grid grid-cols-3 divide-x divide-dark-border border-t border-dark-border pt-5">
            <SubMetric label="Recebido" value={formatMT(received)} tone="brand" />
            <SubMetric
              label="Por receber"
              value={formatMT(outstanding)}
              tone={outstanding === 0 ? "neutral" : hasOverdueDebt ? "alert" : "warn"}
            />
            <SubMetric
              label="Lucro bruto"
              value={hasProfitData ? formatMT(grossProfit) : "—"}
              tone={hasProfitData ? "brand" : "neutral"}
            />
          </div>
          <p className="relative mt-3 text-[11px] text-dark-faint">Recebido inclui vendas pagas + dívidas cobradas no período.</p>
        </section>

        {/* Nível 2 — Performance: gráfico + resumo, lado a lado no desktop. Superfície "surface". */}
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl border border-dark-border bg-dark-surface p-5 shadow-lg shadow-black/20 lg:col-span-2">
            <h2 className="font-semibold text-dark-text">Vendas ao longo do tempo</h2>
            <p className="text-sm text-dark-muted">Acompanhe o movimento das suas vendas</p>
            {chart.every((p) => p.value === 0) && !hasSalesInPeriod ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <TrendingUp className="h-6 w-6 text-white/15" aria-hidden />
                <p className="text-sm text-dark-faint">Ainda não existem vendas neste período.</p>
              </div>
            ) : (
              <svg viewBox="0 0 300 136" className="mt-4 h-40 w-full" role="img" aria-label="Gráfico de vendas">
                <defs>
                  <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C766" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#22C766" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {[24, 68, 112].map((gy) => (
                  <line key={gy} x1="8" y1={gy} x2="292" y2={gy} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                ))}

                {areaPath && <path d={areaPath} fill="url(#chart-area)" />}
                {linePath && (
                  <path d={linePath} fill="none" stroke="#22C766" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                )}

                {chartPoints.map((point, i) => {
                  const isLast = i === chartPoints.length - 1;
                  return (
                    <g key={point.key}>
                      <title>{`${point.label}: ${formatMT(point.value)}`}</title>
                      {isLast && <circle cx={point.x} cy={point.y} r="8" fill="#22C766" opacity="0.2" />}
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={isLast ? 4 : 2.5}
                        fill="#22C766"
                        stroke="#101816"
                        strokeWidth={isLast ? 1.5 : 0}
                      />
                      <text x={point.x} y="130" textAnchor="middle" fontSize="9" fill="rgba(245,246,244,0.4)">
                        {point.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </section>

          <section className="rounded-2xl border border-dark-border bg-dark-surface p-5 shadow-lg shadow-black/20">
            <h2 className="flex items-center gap-1.5 font-semibold text-dark-text">
              <Receipt className="h-4 w-4 text-dark-faint" aria-hidden />
              Resumo
            </h2>
            <dl className="mt-3 divide-y divide-dark-border">
              <div className="flex items-center justify-between py-2.5 text-sm">
                <dt className="text-dark-muted">Ticket médio</dt>
                <dd className="font-medium tabular-nums text-dark-text">{avgTicket !== null ? formatMT(avgTicket) : "—"}</dd>
              </div>
              <div className="flex items-center justify-between py-2.5 text-sm">
                <dt className="text-dark-muted">Nº de vendas</dt>
                <dd className="font-medium tabular-nums text-dark-text">{sales?.length ?? 0}</dd>
              </div>
              <div className="flex items-center justify-between py-2.5 text-sm">
                <dt className="text-dark-muted">Produtos vendidos</dt>
                <dd className="font-medium tabular-nums text-dark-text">{distinctProductsSold}</dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Nível 3 — Operação: atenção necessária + rankings, lado a lado no desktop. */}
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-dark-border bg-dark-surface p-5 shadow-lg shadow-black/20">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-faint">Atenção necessária</h2>
            <div className="mt-3 divide-y divide-dark-border">
              <AttentionRow
                icon={<AlertTriangle className={`h-4 w-4 ${outstanding > 0 ? "text-danger" : "text-white/20"}`} aria-hidden />}
                title="Dívidas"
                detail={`${formatMT(outstanding)} · ${debtCustomers} cliente${debtCustomers === 1 ? "" : "s"}`}
                ok={outstanding === 0}
                href="/dashboard/dividas"
                cta="Ver detalhes"
              />
              <AttentionRow
                icon={<Clock3 className={`h-4 w-4 ${lowStockCount > 0 ? "text-warning" : "text-white/20"}`} aria-hidden />}
                title="Stock baixo"
                detail={
                  lowStockCount > 0 ? `${lowStockCount} produto${lowStockCount === 1 ? "" : "s"}` : "Nenhum produto em risco"
                }
                ok={lowStockCount === 0}
                href="/dashboard/produtos"
                cta="Ver stock"
              />
              <AttentionRow
                icon={<Package className={`h-4 w-4 ${outOfStockCount > 0 ? "text-danger" : "text-white/20"}`} aria-hidden />}
                title="Esgotados"
                detail={
                  outOfStockCount > 0 ? `${outOfStockCount} produto${outOfStockCount === 1 ? "" : "s"}` : "Nenhum produto esgotado"
                }
                ok={outOfStockCount === 0}
                href="/dashboard/produtos"
                cta="Ver stock"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-dark-border bg-dark-surface p-5 shadow-lg shadow-black/20">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-faint">Rankings</h2>

            <div className="mt-3">
              <p className="mb-1 text-sm font-medium text-dark-text">Produtos mais vendidos</p>
              {topProducts.length ? (
                <ol className="divide-y divide-dark-border">
                  {topProducts.map((p, i) => (
                    <li key={p.name} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                      <span className="flex min-w-0 items-center gap-2 text-dark-text/80">
                        <span className="w-4 shrink-0 font-mono text-xs text-dark-faint">{String(i + 1).padStart(2, "0")}</span>
                        <span className="truncate">{p.name}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-dark-muted">{p.quantity} un.</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-dark-faint">Ainda não existem produtos vendidos neste período.</p>
              )}
            </div>

            <div className="mt-4 border-t border-dark-border pt-3">
              <p className="mb-1 text-sm font-medium text-dark-text">Clientes em dívida</p>
              {topDebtors.length ? (
                <ul className="divide-y divide-dark-border">
                  {topDebtors.map((d) => (
                    <li key={d.name} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                      <span className="flex min-w-0 items-center gap-2 text-dark-text/80">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger/15 text-[10px] font-semibold text-danger">
                          {initials(d.name)}
                        </span>
                        <span className="truncate">{d.name}</span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-dark-text">{formatMT(d.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-dark-faint">Não existem clientes com dívida.</p>
              )}
            </div>
          </section>
        </div>

        {/* Nível 4 — Histórico: a camada mais discreta, não compete com a informação financeira. */}
        <section className="rounded-2xl border border-white/[0.04] bg-white/[0.015] p-5">
          <div className="mb-2 flex justify-between">
            <h2 className="text-sm font-medium text-dark-muted">Últimas vendas</h2>
            <Link
              href="/dashboard/vendas"
              className="flex items-center gap-0.5 text-sm font-medium text-brandGlow transition-colors hover:text-brandGlow/70"
            >
              Ver todas <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          {sales?.slice(0, 5).map((s) => {
            const saleDate = new Date(s.created_at);
            const isToday = zonedDayKey(saleDate, BUSINESS_TIMEZONE) === todayKey;
            const timeLabel = isToday ? `Hoje, ${zonedTime(saleDate, BUSINESS_TIMEZONE)}` : zonedShortDate(saleDate);
            return (
              <div key={s.id} className="flex items-center justify-between gap-3 border-t border-white/[0.04] py-2.5 text-sm">
                <PaymentMethodIcon method={s.payment_method} className="h-6 w-6" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-dark-text/80">
                    {s.customer_id ? customerNames.get(s.customer_id) ?? "Cliente" : "Cliente avulso"}
                  </p>
                  <p className="text-xs text-dark-faint">{timeLabel}</p>
                </div>
                <span className="shrink-0 tabular-nums text-dark-text/70">{formatMT(s.total_amount)}</span>
              </div>
            );
          })}
          {!sales?.length && (
            <p className="text-sm text-dark-faint">Ainda não existem vendas. Registe uma venda para começar.</p>
          )}
        </section>
      </div>
    </div>
  );
}


/** Iniciais (até 2 letras) a partir do nome do cliente, para o avatar circular. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return "?";
  const last = parts[parts.length - 1];
  if (parts.length === 1 || !last) return first.slice(0, 2).toUpperCase();
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

/** Uma métrica secundária integrada na mesma superfície do total vendido (não um card à parte). */
function SubMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "brand" | "warn" | "alert" | "neutral";
}) {
  const valueTone = { brand: "text-brandGlow", warn: "text-warning", alert: "text-danger", neutral: "text-dark-faint" }[
    tone
  ];
  return (
    <div className="min-w-0 px-3 first:pl-0 last:pr-0">
      <p className="truncate text-[11px] uppercase tracking-wide text-dark-faint">{label}</p>
      <p className={`mt-1 truncate text-base font-semibold tabular-nums sm:text-lg ${valueTone}`}>{value}</p>
    </div>
  );
}

/** Uma linha de estado dentro do painel "Atenção necessária" — ícone, título, detalhe e CTA. */
function AttentionRow({
  icon,
  title,
  detail,
  ok,
  href,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  ok: boolean;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-dark-text">{title}</p>
          <p className={`truncate text-xs ${ok ? "text-dark-faint" : "text-dark-muted"}`}>{detail}</p>
        </div>
      </div>
      <Link
        href={href}
        className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-brandGlow transition-colors hover:text-brandGlow/70"
      >
        {cta} <ArrowUpRight className="h-3 w-3" aria-hidden />
      </Link>
    </div>
  );
}