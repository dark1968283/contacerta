import Link from "next/link";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { formatMT } from "@/lib/format";
import {
  BUSINESS_TIMEZONE,
  zonedShortDate,
  zonedStartOfDay,
} from "@/lib/timezone";
import { buildEmptyBuckets, fillBuckets } from "@/lib/dashboard-chart";

const periods = {
  hoje: "Hoje",
  "7-dias": "7 dias",
  "30-dias": "30 dias",
  mes: "Este mês",
} as const;

type Period = keyof typeof periods;

type SaleItem = {
  sale_id: string;
  product_id: string;
  quantity: number;
  subtotal: number | string;
  cost_price: number | string | null;
};

/**
 * Início do período, como instante UTC real correspondente à meia-noite
 * local (Africa/Maputo) do dia relevante — nunca a meia-noite do
 * servidor, que pode estar noutro fuso horário.
 */
function periodStart(period: Period, now: Date): Date {
  const todayStart = zonedStartOfDay(now, BUSINESS_TIMEZONE);

  if (period === "7-dias") {
    return new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
  }

  if (period === "30-dias") {
    return new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000);
  }

  if (period === "mes") {
    // Meia-noite local do dia 1 do mês corrente.
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: BUSINESS_TIMEZONE,
    }).formatToParts(now);

    const year = parts.find((p) => p.type === "year")!.value;
    const month = parts.find((p) => p.type === "month")!.value;

    return zonedStartOfDay(
      new Date(`${year}-${month}-01T12:00:00Z`),
      BUSINESS_TIMEZONE,
    );
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
  const period: Period =
    rawPeriod in periods ? (rawPeriod as Period) : "hoje";

  const start = periodStart(period, now);

  const [
    { data: profile },
    { data: sales },
    { data: debts },
    { data: debtPayments },
    { data: activeProducts },
  ] = await Promise.all([
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
      .select("id,customer_id,total_amount,amount_paid")
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
      ...(sales
        ?.map((s) => s.customer_id)
        .filter((id): id is string => id !== null) ?? []),
      ...(debts?.map((d) => d.customer_id) ?? []),
    ]),
  ];

  const [{ data: items }, { data: customers }] = await Promise.all([
    saleIds.length
      ? supabase
          .from("sale_items")
          .select("sale_id,product_id,quantity,subtotal,cost_price")
          .in("sale_id", saleIds)
      : Promise.resolve({
          data: [] as SaleItem[],
        }),

    customerIds.length
      ? supabase
          .from("customers")
          .select("id,name")
          .eq("business_id", businessId)
          .in("id", customerIds)
      : Promise.resolve({
          data: [] as { id: string; name: string }[],
        }),
  ]);

  // Ranking histórico de produtos: usa os IDs realmente vendidos no período,
  // SEM filtrar por is_active — um produto entretanto desativado continua
  // a contar no histórico.
  const soldProductIds = [
    ...new Set((items ?? []).map((i) => i.product_id)),
  ];

  const { data: soldProducts } = soldProductIds.length
    ? await supabase
        .from("products")
        .select("id,name")
        .in("id", soldProductIds)
    : {
        data: [] as { id: string; name: string }[],
      };

  const total =
    sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) ?? 0;

  const paidDirectly =
    sales
      ?.filter((s) => s.payment_method === "pago")
      .reduce((sum, s) => sum + Number(s.total_amount), 0) ?? 0;

  const receivedFromDebts =
    debtPayments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  const received = paidDirectly + receivedFromDebts;

  const outstanding =
    debts?.reduce(
      (sum, d) =>
        sum + (Number(d.total_amount) - Number(d.amount_paid)),
      0,
    ) ?? 0;

  const debtCustomers = new Set(
    debts?.map((d) => d.customer_id),
  ).size;

  /*
   * ================================================================
   * LUCRO BRUTO — FASE 10
   * ================================================================
   *
   * O custo é lido do snapshot existente em sale_items.cost_price.
   *
   * IMPORTANTE:
   * - cost_price NULL = custo desconhecido
   * - itens sem custo NÃO entram no lucro bruto
   * - nunca usamos products.cost_price para reconstruir vendas antigas
   */
  const saleItems = (items ?? []) as SaleItem[];

  let grossProfit = 0;
  let itemsWithCost = 0;
  let itemsWithoutCost = 0;

  saleItems.forEach((item) => {
    if (item.cost_price === null) {
      itemsWithoutCost += 1;
      return;
    }

    const subtotal = Number(item.subtotal);
    const quantity = Number(item.quantity);
    const costPrice = Number(item.cost_price);

    grossProfit += subtotal - quantity * costPrice;
    itemsWithCost += 1;
  });

  const totalItems = saleItems.length;

  const costCoverage =
    totalItems > 0
      ? Math.round((itemsWithCost / totalItems) * 100)
      : 0;

  const customerNames = new Map(
    (customers ?? []).map((c) => [c.id, c.name]),
  );

  const productNames = new Map(
    (soldProducts ?? []).map((p) => [p.id, p.name]),
  );

  const ranking = new Map<
    string,
    { name: string; quantity: number }
  >();

  items?.forEach((item) => {
    const name = productNames.get(item.product_id);

    if (!name) return;

    const entry = ranking.get(item.product_id) ?? {
      name,
      quantity: 0,
    };

    entry.quantity += Number(item.quantity);
    ranking.set(item.product_id, entry);
  });

  const topProducts = [...ranking.values()]
    .sort(
      (a, b) =>
        b.quantity - a.quantity ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 3);

  const chart = fillBuckets(
    buildEmptyBuckets(period, now),
    sales ?? [],
    period,
  );

  const chartMax = Math.max(
    ...chart.map((p) => p.value),
    1,
  );

  const lowStockCount =
    activeProducts?.filter(
      (p) =>
        p.stock_quantity > 0 &&
        p.stock_quantity <= p.low_stock_threshold,
    ).length ?? 0;

  const outOfStockCount =
    activeProducts?.filter(
      (p) => p.stock_quantity === 0,
    ).length ?? 0;

  const isGrossProfitPositive = grossProfit >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">
            Olá, {profile?.name?.split(" ")[0] ?? ""} 👋
          </h1>

          <p className="text-sm text-ink/60">
            Como está o seu negócio hoje?
          </p>
        </div>

        <Link
          href="/dashboard/vendas/nova"
          className="shrink-0 rounded-xl bg-brand px-3 py-2 text-sm font-medium text-white"
        >
          + Nova Venda
        </Link>
      </div>

      <section className="grid grid-cols-3 gap-2">
        <Card label="Vendas" value={total} />
        <Card label="Recebido" value={received} green />
        <Card label="Por receber" value={outstanding} />
      </section>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {(Object.entries(periods) as [Period, string][]).map(
          ([value, label]) => (
            <Link
              key={value}
              href={
                value === "hoje"
                  ? "/dashboard"
                  : `/dashboard?periodo=${value}`
              }
              className={`shrink-0 rounded-full px-3 py-2 text-sm ${
                value === period
                  ? "bg-brand text-white"
                  : "border border-line bg-white text-ink/60"
              }`}
            >
              {label}
            </Link>
          ),
        )}
      </nav>

      {/* ============================================================
          LUCRO BRUTO
          ============================================================ */}
      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-brand-soft p-2.5 text-brand">
                  {isGrossProfitPositive ? (
                    <TrendingUp size={19} strokeWidth={2} />
                  ) : (
                    <TrendingDown size={19} strokeWidth={2} />
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Resultado
                  </p>

                  <h2 className="text-base font-semibold text-ink">
                    Lucro bruto
                  </h2>
                </div>
              </div>

              <p
                className={`mt-5 text-3xl font-bold tracking-tight ${
                  isGrossProfitPositive
                    ? "text-brand"
                    : "text-alert"
                }`}
              >
                {formatMT(grossProfit)}
              </p>

              <p className="mt-1 text-xs text-ink/50">
                No período selecionado
              </p>
            </div>

            {totalItems > 0 && (
              <span
                className={
                  itemsWithoutCost > 0
                    ? "badge-warning"
                    : "badge-success"
                }
              >
                {costCoverage}% com custo
              </span>
            )}
          </div>

          {itemsWithoutCost > 0 && (
            <div className="mt-5 flex items-start gap-3 rounded-xl bg-warn-soft p-3">
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-warn"
              />

              <div>
                <p className="text-sm font-medium text-ink">
                  Existem vendas sem custo registado
                </p>

                <p className="mt-1 text-xs leading-5 text-ink/60">
                  {itemsWithoutCost === 1
                    ? "1 item não entra"
                    : `${itemsWithoutCost} itens não entram`}{" "}
                  no cálculo do lucro bruto porque o custo do produto
                  não está registado.
                </p>
              </div>
            </div>
          )}

          {totalItems === 0 && (
            <p className="mt-4 text-sm text-ink/50">
              Ainda não existem vendas neste período.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white p-4">
        <h2 className="font-semibold text-ink">
          Vendas ao longo do tempo
        </h2>

        <p className="text-sm text-ink/60">
          Acompanhe o movimento das suas vendas
        </p>

        {chart.every((p) => p.value === 0) &&
        sales?.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink/50">
            Ainda não existem vendas neste período.
          </p>
        ) : (
          <svg
            viewBox="0 0 300 130"
            className="mt-4 h-36 w-full"
            role="img"
            aria-label="Gráfico de vendas"
          >
            {chart.map((point, i) => {
              const x =
                chart.length === 1
                  ? 150
                  : 12 +
                    (i * 276) / (chart.length - 1);

              const y =
                112 -
                (point.value / chartMax) * 88;

              const prev = chart[i - 1];

              const prevX =
                chart.length === 1
                  ? 150
                  : 12 +
                    ((i - 1) * 276) /
                      (chart.length - 1);

              const prevY = prev
                ? 112 -
                  (prev.value / chartMax) * 88
                : y;

              return (
                <g key={point.key}>
                  <title>
                    {`${point.label}: ${formatMT(
                      point.value,
                    )}`}
                  </title>

                  {i > 0 && (
                    <line
                      x1={prevX}
                      y1={prevY}
                      x2={x}
                      y2={y}
                      stroke="#168f5b"
                      strokeWidth="2"
                    />
                  )}

                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#168f5b"
                  />

                  <text
                    x={x}
                    y="128"
                    textAnchor="middle"
                    fontSize="9"
                    fill="#697386"
                  >
                    {point.label}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </section>

      <section className="rounded-xl border border-line bg-white p-4">
        <div className="flex justify-between">
          <div>
            <h2 className="font-semibold text-ink">
              Por receber
            </h2>

            <p className="mt-1 text-lg font-semibold text-alert">
              {formatMT(outstanding)}
            </p>

            <p className="text-sm text-ink/60">
              {debtCustomers} cliente
              {debtCustomers === 1 ? "" : "s"} com dívida
            </p>
          </div>

          <Link
            href="/dashboard/dividas"
            className="text-sm font-medium text-brand"
          >
            Ver dívidas →
          </Link>
        </div>

        {outstanding === 0 && (
          <p className="mt-3 text-sm text-ink/60">
            Tudo certo! Não existem valores por receber.
          </p>
        )}
      </section>

      <Section
        title="Produtos mais vendidos"
        link="/dashboard/vendas"
        action="Ver vendas"
      >
        {topProducts.length ? (
          topProducts.map((p, i) => (
            <p
              key={p.name}
              className="flex justify-between py-2 text-sm"
            >
              <span>
                {["🥇", "🥈", "🥉"][i]} {p.name}
              </span>

              <span className="text-ink/60">
                {p.quantity} unidades
              </span>
            </p>
          ))
        ) : (
          <p className="text-sm text-ink/50">
            Ainda não existem produtos vendidos neste período.
          </p>
        )}
      </Section>

      <Section
        title="Stock"
        link="/dashboard/produtos"
        action="Ver stock"
      >
        <div className="grid grid-cols-2 gap-3">
          <p className="rounded-lg bg-warn-soft p-3 text-sm">
            Stock baixo
            <br />
            <b>{lowStockCount} produtos</b>
          </p>

          <p className="rounded-lg bg-alert-soft p-3 text-sm">
            Esgotados
            <br />
            <b>{outOfStockCount} produtos</b>
          </p>
        </div>

        {lowStockCount === 0 &&
          outOfStockCount === 0 && (
            <p className="mt-3 text-sm text-ink/60">
              O seu stock está em ordem.
            </p>
          )}
      </Section>

      <Section
        title="Últimas vendas"
        link="/dashboard/vendas"
        action="Ver todas →"
      >
        {sales?.slice(0, 5).map((s) => (
          <div
            key={s.id}
            className="flex justify-between border-t border-line py-3 text-sm"
          >
            <div>
              <p className="font-medium text-ink">
                {s.customer_id
                  ? customerNames.get(s.customer_id) ??
                    "Cliente"
                  : "Cliente avulso"}
              </p>

              <p className="text-ink/50">
                {zonedShortDate(
                  new Date(s.created_at),
                )}
              </p>
            </div>

            <b>{formatMT(Number(s.total_amount))}</b>
          </div>
        ))}

        {!sales?.length && (
          <p className="text-sm text-ink/50">
            Ainda não existem vendas. Registe uma venda
            para começar.
          </p>
        )}
      </Section>
    </div>
  );
}

function Card({
  label,
  value,
  green,
}: {
  label: string;
  value: number;
  green?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-white p-3">
      <p className="truncate text-xs text-ink/50">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-sm font-semibold leading-snug sm:text-base ${
          green ? "text-brand" : "text-ink"
        }`}
      >
        {formatMT(value)}
      </p>
    </div>
  );
}

function Section({
  title,
  link,
  action,
  children,
}: {
  title: string;
  link: string;
  action: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-white p-4">
      <div className="mb-3 flex justify-between">
        <h2 className="font-semibold text-ink">
          {title}
        </h2>

        <Link
          href={link}
          className="text-sm font-medium text-brand"
        >
          {action}
        </Link>
      </div>

      {children}
    </section>
  );
}