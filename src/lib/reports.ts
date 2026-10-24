import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { BUSINESS_TIMEZONE, zonedDayKey, zonedStartOfDay } from "@/lib/timezone";
import { grossProfitOf, itemCost, type ProfitItem } from "@/lib/profit";

type Client = SupabaseClient<Database>;

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
export const WEEKDAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export type MonthKey = { year: number; month: number }; // month: 1-12

export function parseMonth(value: string | undefined, now = new Date()): MonthKey {
  const m = value?.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    if (month >= 1 && month <= 12 && year >= 2020 && year <= 2100) return { year, month };
  }
  const [y, mo] = zonedDayKey(now, BUSINESS_TIMEZONE).split("-").map(Number);
  return { year: y ?? now.getUTCFullYear(), month: mo ?? now.getUTCMonth() + 1 };
}

export function shiftMonth({ year, month }: MonthKey, delta: number): MonthKey {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function monthParam({ year, month }: MonthKey) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function monthLabel({ year, month }: MonthKey) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Início (inclusive) e fim (exclusivo) do mês na hora de Maputo, como instantes UTC. */
export function monthRange(key: MonthKey) {
  const next = shiftMonth(key, 1);
  const start = zonedStartOfDay(new Date(Date.UTC(key.year, key.month - 1, 1, 12)));
  const end = zonedStartOfDay(new Date(Date.UTC(next.year, next.month - 1, 1, 12)));
  return { start, end };
}

type SaleRow = {
  id: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  customer_id: string | null;
  sale_items: (ProfitItem & { subtotal: number })[];
};

const PAGE = 1000;

async function fetchSales(supabase: Client, businessId: string, start: Date, end: Date) {
  const rows: SaleRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("sales")
      // "*" para ler também o desconto da 0025 quando existir.
      .select("*,sale_items(product_id,quantity,unit_price,subtotal,cost_price)")
      .eq("business_id", businessId)
      .neq("status", "anulada")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as unknown as SaleRow[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function fetchDebtPayments(supabase: Client, businessId: string, start: Date, end: Date) {
  let total = 0;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("debt_payments")
      .select("amount")
      .eq("business_id", businessId)
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .range(from, from + PAGE - 1);
    if (error) throw error;
    total += (data ?? []).reduce((s, p) => s + Number(p.amount), 0);
    if (!data || data.length < PAGE) break;
  }
  return total;
}

/** Total das despesas do mês (tabela da migração 0025; sem ela devolve 0). */
async function fetchExpenses(supabase: Client, businessId: string, start: Date, end: Date) {
  const db = supabase as unknown as SupabaseClient;
  let total = 0;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("expenses")
      .select("amount")
      .eq("business_id", businessId)
      .gte("spent_at", start.toISOString())
      .lt("spent_at", end.toISOString())
      .range(from, from + PAGE - 1);
    if (error) return 0;
    total += ((data ?? []) as { amount: number | string }[]).reduce((s, e) => s + Number(e.amount), 0);
    if (!data || data.length < PAGE) break;
  }
  return total;
}

export type ProductStat = { id: string; name: string; quantity: number; revenue: number; profit: number | null };

export type MonthReport = {
  key: MonthKey;
  salesCount: number;
  revenue: number;
  paidNow: number;
  credit: number;
  receivedFromDebts: number;
  received: number;
  /** Lucro depois dos descontos e das despesas. */
  profit: number;
  /** Lucro só dos produtos (vendas − custo), antes de descontos e despesas. */
  grossProfit: number;
  discounts: number;
  expenses: number;
  hasProfitData: boolean;
  missingCostCount: number;
  avgTicket: number | null;
  products: ProductStat[];
  weekdays: { day: number; name: string; revenue: number; count: number }[];
  days: { key: string; revenue: number; count: number }[];
  sales: SaleRow[];
  productNames: Map<string, string>;
  /** Custo actual dos produtos (só para vendas antigas sem custo guardado). */
  currentCosts: Map<string, number | null>;
};

/**
 * Junta tudo o que os relatórios precisam de um mês. Só leituras com a
 * sessão do utilizador (RLS do Supabase continua a proteger os dados).
 */
export async function loadMonthReport(supabase: Client, businessId: string, key: MonthKey): Promise<MonthReport> {
  const { start, end } = monthRange(key);
  const [sales, receivedFromDebts, expenses] = await Promise.all([
    fetchSales(supabase, businessId, start, end),
    fetchDebtPayments(supabase, businessId, start, end),
    fetchExpenses(supabase, businessId, start, end),
  ]);
  const discounts = sales.reduce((s, x) => s + Number((x as { discount_amount?: number | string | null }).discount_amount ?? 0), 0);

  const items = sales.flatMap((s) => s.sale_items ?? []);
  const productIds = [...new Set(items.map((i) => i.product_id))];
  const productNames = new Map<string, string>();
  const currentCosts = new Map<string, number | null>();
  for (let i = 0; i < productIds.length; i += 200) {
    const { data } = await supabase
      .from("products")
      .select("id,name,cost_price")
      .in("id", productIds.slice(i, i + 200));
    (data ?? []).forEach((p) => {
      productNames.set(p.id, p.name);
      currentCosts.set(p.id, p.cost_price === null ? null : Number(p.cost_price));
    });
  }

  const revenue = sales.reduce((s, x) => s + Number(x.total_amount), 0);
  const paidNow = sales.filter((x) => x.payment_method === "pago").reduce((s, x) => s + Number(x.total_amount), 0);
  const profitResult = grossProfitOf(items, currentCosts);

  const byProduct = new Map<string, ProductStat>();
  for (const item of items) {
    const stat = byProduct.get(item.product_id) ?? {
      id: item.product_id,
      name: productNames.get(item.product_id) ?? "Produto",
      quantity: 0,
      revenue: 0,
      profit: 0 as number | null,
    };
    const lineRevenue = Number(item.quantity) * Number(item.unit_price);
    stat.quantity += Number(item.quantity);
    stat.revenue += lineRevenue;
    const cost = itemCost(item, currentCosts);
    if (cost === null) stat.profit = null;
    else if (stat.profit !== null) stat.profit += lineRevenue - Number(item.quantity) * cost;
    byProduct.set(item.product_id, stat);
  }

  const weekdays = WEEKDAY_NAMES.map((name, day) => ({ day, name, revenue: 0, count: 0 }));
  const dayMap = new Map<string, { key: string; revenue: number; count: number }>();
  const weekdayFmt = new Intl.DateTimeFormat("en-US", { timeZone: BUSINESS_TIMEZONE, weekday: "short" });
  const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  for (const sale of sales) {
    const at = new Date(sale.created_at);
    const wd = WD[weekdayFmt.format(at)] ?? 0;
    const weekday = weekdays[wd];
    if (weekday) {
      weekday.revenue += Number(sale.total_amount);
      weekday.count += 1;
    }
    const dk = zonedDayKey(at, BUSINESS_TIMEZONE);
    const entry = dayMap.get(dk) ?? { key: dk, revenue: 0, count: 0 };
    entry.revenue += Number(sale.total_amount);
    entry.count += 1;
    dayMap.set(dk, entry);
  }

  return {
    key,
    salesCount: sales.length,
    revenue,
    paidNow,
    credit: revenue - paidNow,
    receivedFromDebts,
    received: paidNow + receivedFromDebts,
    profit: profitResult.profit - discounts - expenses,
    grossProfit: profitResult.profit,
    discounts,
    expenses,
    hasProfitData: profitResult.hasData,
    missingCostCount: profitResult.missingProductIds.size,
    avgTicket: sales.length ? revenue / sales.length : null,
    products: [...byProduct.values()].sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name)),
    weekdays,
    days: [...dayMap.values()].sort((a, b) => a.key.localeCompare(b.key)),
    sales,
    productNames,
    currentCosts,
  };
}

/** Variação percentual (null quando não há base de comparação). */
export function change(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
