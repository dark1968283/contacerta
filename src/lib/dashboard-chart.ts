import { BUSINESS_TIMEZONE, zonedDayKey, zonedDayLabel, zonedHour, zonedHourLabel } from "./timezone";

export type ChartPoint = { key: string; label: string; value: number };

/**
 * Gera os buckets vazios (valor 0) para o período, na ordem cronológica
 * correta — garante que intervalos sem vendas aparecem como 0 em vez de
 * simplesmente desaparecerem do gráfico.
 */
export function buildEmptyBuckets(
  period: "hoje" | "7-dias" | "30-dias" | "mes",
  now: Date,
  timeZone: string = BUSINESS_TIMEZONE
): ChartPoint[] {
  if (period === "hoje") {
    const currentHour = zonedHour(now, timeZone);
    const buckets: ChartPoint[] = [];
    for (let h = 0; h <= currentHour; h++) {
      const label = `${h.toString().padStart(2, "0")}h`;
      buckets.push({ key: label, label, value: 0 });
    }
    return buckets;
  }

  const daysBack = period === "7-dias" ? 6 : period === "30-dias" ? 29 : null;
  const buckets: ChartPoint[] = [];

  if (daysBack !== null) {
    for (let i = daysBack; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      buckets.push({ key: zonedDayKey(d, timeZone), label: zonedDayLabel(d, timeZone), value: 0 });
    }
    return buckets;
  }

  // "mes": do dia 1 do mês local até hoje (inclusive).
  const todayKey = zonedDayKey(now, timeZone);
  let cursor = new Date(now);
  const seen: Date[] = [];
  // Anda para trás dia a dia até sair do mês local atual.
  const currentMonthLabel = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit" }).format(now);
  while (true) {
    const cursorMonthLabel = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit" }).format(cursor);
    if (cursorMonthLabel !== currentMonthLabel) break;
    seen.push(cursor);
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  seen.reverse();
  for (const d of seen) {
    buckets.push({ key: zonedDayKey(d, timeZone), label: zonedDayLabel(d, timeZone), value: 0 });
  }
  void todayKey;
  return buckets;
}

/** Chave do bucket a que uma venda pertence, consistente com buildEmptyBuckets. */
export function bucketKeyFor(
  saleDate: Date,
  period: "hoje" | "7-dias" | "30-dias" | "mes",
  timeZone: string = BUSINESS_TIMEZONE
): string {
  return period === "hoje" ? zonedHourLabel(saleDate, timeZone) : zonedDayKey(saleDate, timeZone);
}

/** Preenche os buckets vazios com os valores reais das vendas. */
export function fillBuckets(
  emptyBuckets: ChartPoint[],
  sales: { created_at: string; total_amount: number }[],
  period: "hoje" | "7-dias" | "30-dias" | "mes",
  timeZone: string = BUSINESS_TIMEZONE
): ChartPoint[] {
  const byKey = new Map(emptyBuckets.map((b) => [b.key, { ...b }]));
  for (const sale of sales) {
    const key = bucketKeyFor(new Date(sale.created_at), period, timeZone);
    const bucket = byKey.get(key);
    if (bucket) bucket.value += sale.total_amount;
  }
  return [...byKey.values()];
}
