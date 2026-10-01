import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { formatMT } from "@/lib/format";
import { BUSINESS_TIMEZONE, zonedDayKey, zonedShortDate, zonedStartOfDay, zonedTime } from "@/lib/timezone";
import { buildEmptyBuckets, fillBuckets } from "@/lib/dashboard-chart";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Panel } from "@/components/dashboard/Panel";
import { RecentActivity, type ActivityItem } from "@/components/dashboard/RecentActivity";
import { SalesChart, type ChartPoint } from "@/components/dashboard/SalesChart";
import {
  Wallet,
  Clock3,
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
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

  const todayKey = zonedDayKey(now, BUSINESS_TIMEZONE);

  const lowStockCount = activeProducts?.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold).length ?? 0;
  const outOfStockCount = activeProducts?.filter((p) => p.stock_quantity === 0).length ?? 0;

  // ── Apresentação (sem lógica de dados) ───────────────────────────────────
  const localHour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: BUSINESS_TIMEZONE, hour: "numeric", hourCycle: "h23" }).format(now),
  );
  const greeting = localHour < 12 ? "Bom dia" : localHour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = profile?.name?.split(" ")[0] ?? "";

  const chartPoints: ChartPoint[] = chart.map((p) => ({
    key: String(p.key),
    label: String(p.label),
    value: p.value,
    valueLabel: formatMT(p.value),
  }));

  const activity: ActivityItem[] = (sales ?? []).slice(0, 5).map((s) => {
    const saleDate = new Date(s.created_at);
    const isToday = zonedDayKey(saleDate, BUSINESS_TIMEZONE) === todayKey;
    return {
      id: s.id,
      method: s.payment_method,
      customerLabel: s.customer_id ? customerNames.get(s.customer_id) ?? "Cliente" : "Cliente avulso",
      timeLabel: isToday ? `Hoje, ${zonedTime(saleDate, BUSINESS_TIMEZONE)}` : zonedShortDate(saleDate),
      amountLabel: formatMT(s.total_amount),
    };
  });

  // Fundo escuro "full-bleed": a sombra de 100vmax pinta os lados e a base fora do
  // contentor (sem criar scroll), estendida para cima para também cobrir a faixa da TopBar (que continua por cima, sticky z-20).
  return (
    <div className="-mx-4 -mt-5 -mb-6 bg-dark-bg px-4 pb-16 pt-5 shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-8rem_-100vmax)] sm:-mx-6 sm:px-6 [background-image:radial-gradient(ellipse_520px_420px_at_50%_-120px,rgba(34,199,102,0.10),transparent)]">
      <div className="space-y-6 sm:space-y-8">
        {/* Header — saudação, contexto temporal, ação principal e período (todos já existentes). */}
        <header className="space-y-4">
          <div className="flex items-start justify-between gap-3 sm:items-center">
            <div className="min-w-0">
              <h1 className="break-words text-xl font-semibold tracking-tight text-dark-text sm:text-[28px] sm:leading-9">
                {greeting}
                {firstName && <>, {firstName}</>}
              </h1>
              <p className="mt-0.5 text-sm text-dark-muted">Aqui está o resumo do seu negócio.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-1.5 rounded-full border border-dark-border bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-dark-muted lg:inline-flex">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {periods[period]} · {zonedShortDate(now)}
              </span>
              <Link
                href="/dashboard/vendas/nova"
                className="group flex shrink-0 items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand/90 hover:shadow-brand/30 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-brandGlow/40 focus:ring-offset-2 focus:ring-offset-dark-bg sm:px-4 sm:py-3"
              >
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" aria-hidden />
                Nova Venda
              </Link>
            </div>
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

        {/* Métricas — Vendas é o destaque; "A receber" muda de cor conforme o estado das dívidas (lógica original). */}
        <section aria-label="Resumo financeiro" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <MetricCard
            featured
            className="col-span-2 md:col-span-1"
            label="Vendas"
            value={formatMT(total)}
            icon={ShoppingCart}
            accent="brand"
            hint={
              hasSalesInPeriod ? (
                <>
                  <span className="font-medium text-dark-text/80">{sales!.length}</span> venda
                  {sales!.length === 1 ? "" : "s"} · ticket médio{" "}
                  <span className="font-medium tabular-nums text-dark-text/80">{formatMT(avgTicket ?? 0)}</span>
                </>
              ) : (
                "Ainda não existem vendas neste período."
              )
            }
          />
          <MetricCard
            label="Recebido"
            value={formatMT(received)}
            icon={Wallet}
            accent="brand"
            hint={
              receivedFromDebts > 0
                ? `Inclui ${formatMT(receivedFromDebts)} de dívidas cobradas`
                : "Vendas pagas no período"
            }
          />
          <MetricCard
            label="A receber"
            value={formatMT(outstanding)}
            icon={Clock3}
            accent={outstanding === 0 ? "neutral" : hasOverdueDebt ? "danger" : "warn"}
            valueTone={outstanding === 0 ? "muted" : hasOverdueDebt ? "danger" : "warn"}
            hint={
              outstanding === 0
                ? "Sem dívidas em aberto"
                : `${debtCustomers} cliente${debtCustomers === 1 ? "" : "s"}${hasOverdueDebt ? " · há dívidas vencidas" : ""}`
            }
          />
          <MetricCard
            className="col-span-2 md:col-span-1"
            label="Lucro bruto"
            value={hasProfitData ? formatMT(grossProfit) : "—"}
            icon={TrendingUp}
            accent={hasProfitData ? "brand" : "neutral"}
            valueTone={hasProfitData ? "brand" : "muted"}
            hint={
              hasProfitData
                ? "Só itens com custo registado"
                : hasSalesInPeriod
                  ? "Sem custo registado nos produtos vendidos"
                  : "Sem vendas neste período"
            }
          />
        </section>

        {/* Gráfico + atividade recente. */}
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SalesChart
              points={chartPoints}
              max={chartMax}
              periodLabel={periods[period]}
              isEmpty={chart.every((p) => p.value === 0) && !hasSalesInPeriod}
              footer={
                <dl className="grid grid-cols-3 gap-3">
                  <MiniStat label="Ticket médio" value={avgTicket !== null ? formatMT(avgTicket) : "—"} />
                  <MiniStat label="Nº de vendas" value={String(sales?.length ?? 0)} />
                  <MiniStat label="Produtos vendidos" value={String(distinctProductsSold)} />
                </dl>
              }
            />
          </div>
          <div className="lg:col-span-2">
            <RecentActivity items={activity} periodLabel={periods[period]} />
          </div>
        </div>

        {/* Operação: atenção necessária + rankings. */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="p-5 sm:p-6">
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
          </Panel>

          <Panel className="p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-dark-faint">Rankings</h2>

            <div className="mt-3">
              <p className="mb-1 text-sm font-medium text-dark-text">Produtos mais vendidos</p>
              {topProducts.length ? (
                <ol className="divide-y divide-dark-border">
                  {topProducts.map((p, i) => (
                    <li key={p.name} className="flex items-center justify-between gap-2 py-2 text-sm">
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
                    <li key={d.name} className="flex items-center justify-between gap-2 py-2 text-sm">
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
          </Panel>
        </div>
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

/** Métrica compacta do rodapé do gráfico (antigo cartão "Resumo"). */
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-dark-faint">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold tabular-nums text-dark-text sm:text-base">{value}</dd>
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
