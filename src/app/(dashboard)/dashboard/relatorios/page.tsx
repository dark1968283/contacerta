import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Printer,
  TriangleAlert,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { formatMT } from "@/lib/format";
import { Panel } from "@/components/dashboard/Panel";
import { SalesHeader, SalesShell } from "../vendas/_components/SalesShell";
import {
  MONTH_NAMES,
  change,
  loadMonthReport,
  monthLabel,
  monthParam,
  parseMonth,
  shiftMonth,
} from "@/lib/reports";

export const metadata = { title: "Relatórios | ContaCerta" };

function Delta({ value }: { value: number | null }) {
  if (value === null || !Number.isFinite(value)) {
    return <span className="text-xs text-dark-faint">sem mês anterior</span>;
  }
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? "text-brandGlow" : "text-danger"}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {Math.abs(value).toFixed(0)}% vs mês anterior
    </span>
  );
}

function Kpi({ label, value, delta, hint }: { label: string; value: string; delta?: React.ReactNode; hint?: string }) {
  return (
    <Panel className="p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-dark-faint">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums text-dark-text">{value}</p>
      <div className="mt-1 min-h-[1rem]">{delta}</div>
      {hint && <p className="mt-1 text-xs text-dark-muted">{hint}</p>}
    </Panel>
  );
}

export default async function RelatoriosPage({ searchParams }: { searchParams: { mes?: string } }) {
  const { businessId, role } = await getBusinessContext();

  if (role !== "admin") {
    return (
      <SalesShell>
        <SalesHeader title="Relatórios" />
        <Panel className="p-6 text-center text-dark-muted">
          Só o administrador do negócio pode ver os relatórios.
        </Panel>
      </SalesShell>
    );
  }

  const supabase = createClient();
  const key = parseMonth(searchParams.mes);
  const prevKey = shiftMonth(key, -1);
  const nextKey = shiftMonth(key, 1);
  const current = parseMonth(undefined);
  const isCurrentMonth = key.year === current.year && key.month === current.month;

  const [report, previous] = await Promise.all([
    loadMonthReport(supabase, businessId, key),
    loadMonthReport(supabase, businessId, prevKey),
  ]);

  const monthName = MONTH_NAMES[key.month - 1];
  const prevName = MONTH_NAMES[prevKey.month - 1];
  const revenueChange = change(report.revenue, previous.revenue);
  const topByQty = [...report.products].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  const topByRevenue = report.products.slice(0, 10);
  const bestWeekday = [...report.weekdays].sort((a, b) => b.revenue - a.revenue)[0];
  const maxWeekday = Math.max(...report.weekdays.map((w) => w.revenue), 1);
  const bestDay = [...report.days].sort((a, b) => b.revenue - a.revenue)[0];
  const maxQty = Math.max(...topByQty.map((p) => p.quantity), 1);

  // Ordem Seg → Dom, como no calendário local.
  const weekOrder = [1, 2, 3, 4, 5, 6, 0].flatMap((d) => report.weekdays[d] ?? []);

  let summary: string;
  if (report.salesCount === 0) {
    summary = `Ainda não há vendas em ${monthName}.`;
  } else if (revenueChange === null) {
    summary = `Vendeu ${formatMT(report.revenue)} em ${monthName}.`;
  } else if (revenueChange >= 0) {
    summary = `Vendeu mais ${revenueChange.toFixed(0)}% do que em ${prevName}. Continue assim!`;
  } else {
    summary = `Vendeu menos ${Math.abs(revenueChange).toFixed(0)}% do que em ${prevName}.`;
  }

  return (
    <SalesShell>
      <SalesHeader
        title="Relatórios"
        subtitle="Como correu o seu negócio no mês."
        action={
          <div className="flex gap-2">
            <a
              href={`/dashboard/relatorios/exportar?mes=${monthParam(key)}`}
              className="flex items-center gap-1.5 rounded-xl border border-dark-borderStrong px-3 py-2.5 text-sm font-semibold text-dark-text hover:bg-white/[0.05]"
            >
              <FileSpreadsheet className="h-4 w-4 text-brandGlow" aria-hidden />
              Excel
            </a>
            <a
              href={`/imprimir/relatorio?mes=${monthParam(key)}`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-onbrand hover:bg-brand/90"
            >
              <Printer className="h-4 w-4" aria-hidden />
              PDF
            </a>
          </div>
        }
      />

      {/* Escolher o mês */}
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-dark-border bg-dark-surface/60 p-1.5">
        <Link
          href={`/dashboard/relatorios?mes=${monthParam(prevKey)}`}
          className="grid h-10 w-10 place-items-center rounded-xl text-dark-text hover:bg-white/[0.06]"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Link>
        <p className="text-base font-semibold text-dark-text">{monthLabel(key)}</p>
        {isCurrentMonth ? (
          <span className="h-10 w-10" aria-hidden />
        ) : (
          <Link
            href={`/dashboard/relatorios?mes=${monthParam(nextKey)}`}
            className="grid h-10 w-10 place-items-center rounded-xl text-dark-text hover:bg-white/[0.06]"
            aria-label="Mês seguinte"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </Link>
        )}
      </div>

      <p className="text-base font-medium text-dark-text">{summary}</p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Vendido" value={formatMT(report.revenue)} delta={<Delta value={revenueChange} />} />
        <Kpi
          label="Lucro"
          value={report.hasProfitData ? formatMT(report.profit) : "—"}
          delta={
            report.hasProfitData && previous.hasProfitData ? <Delta value={change(report.profit, previous.profit)} /> : undefined
          }
          hint={report.hasProfitData ? "Vendas menos o custo dos produtos" : "Ponha o preço de compra nos produtos"}
        />
        <Kpi
          label="Recebido"
          value={formatMT(report.received)}
          delta={<Delta value={change(report.received, previous.received)} />}
          hint={report.receivedFromDebts > 0 ? `Inclui ${formatMT(report.receivedFromDebts)} de dívidas` : undefined}
        />
        <Kpi
          label="Vendas"
          value={String(report.salesCount)}
          delta={<Delta value={change(report.salesCount, previous.salesCount)} />}
          hint={report.avgTicket !== null ? `Média de ${formatMT(report.avgTicket)} por venda` : undefined}
        />
      </div>

      {report.missingCostCount > 0 && (
        <Link
          href="/dashboard/produtos"
          className="flex items-start gap-3 rounded-2xl border border-warning/25 bg-warning/[0.07] px-4 py-3 text-sm"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <span className="text-dark-text">
            {report.missingCostCount === 1
              ? "1 produto vendido não tem preço de compra, por isso fica fora do lucro."
              : `${report.missingCostCount} produtos vendidos não têm preço de compra, por isso ficam fora do lucro.`}{" "}
            <span className="font-semibold underline">Completar produtos</span>
          </span>
        </Link>
      )}

      {report.salesCount > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="p-5">
            <h2 className="text-base font-semibold text-dark-text">Mais vendidos</h2>
            <p className="text-sm text-dark-muted">Por quantidade</p>
            <ul className="mt-4 space-y-3">
              {topByQty.map((p, i) => (
                <li key={p.id}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium text-dark-text">
                      {i + 1}. {p.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-dark-muted">{p.quantity} un.</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-brandGlow" style={{ width: `${(p.quantity / maxQty) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-base font-semibold text-dark-text">Melhor dia da semana</h2>
            <p className="text-sm text-dark-muted">
              {bestWeekday && bestWeekday.revenue > 0 ? `${bestWeekday.name} é o dia em que mais vende.` : "Ainda sem dados."}
            </p>
            <ul className="mt-4 space-y-2">
              {weekOrder.map((w) => (
                <li key={w.day} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-sm">
                  <span className={w.day === bestWeekday?.day ? "font-semibold text-dark-text" : "text-dark-muted"}>
                    {w.name}
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full ${w.day === bestWeekday?.day ? "bg-brandGlow" : "bg-brand/70"}`}
                      style={{ width: `${(w.revenue / maxWeekday) * 100}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-dark-muted">{formatMT(w.revenue)}</span>
                </li>
              ))}
            </ul>
            {bestDay && (
              <p className="mt-4 rounded-xl bg-white/[0.04] px-3 py-2 text-sm text-dark-muted">
                Melhor dia do mês:{" "}
                <span className="font-semibold text-dark-text">{bestDay.key.split("-").reverse().slice(0, 2).join("/")}</span>, com{" "}
                {formatMT(bestDay.revenue)} ({bestDay.count} {bestDay.count === 1 ? "venda" : "vendas"}).
              </p>
            )}
          </Panel>

          <Panel className="p-5 lg:col-span-2">
            <h2 className="text-base font-semibold text-dark-text">Produtos do mês</h2>
            <p className="text-sm text-dark-muted">Ordenados pelo valor vendido</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm">
                <thead>
                  <tr className="border-b border-dark-border text-left text-xs uppercase tracking-wider text-dark-faint">
                    <th className="py-2 pr-3 font-semibold">Produto</th>
                    <th className="py-2 pr-3 text-right font-semibold">Qtd.</th>
                    <th className="py-2 pr-3 text-right font-semibold">Vendido</th>
                    <th className="py-2 text-right font-semibold">Lucro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {topByRevenue.map((p) => (
                    <tr key={p.id}>
                      <td className="max-w-[12rem] truncate py-2.5 pr-3 font-medium text-dark-text">{p.name}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-dark-muted">{p.quantity}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums text-dark-text">{formatMT(p.revenue)}</td>
                      <td className="py-2.5 text-right tabular-nums text-dark-muted">
                        {p.profit === null ? "—" : formatMT(p.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {report.products.length > 10 && (
              <p className="mt-3 text-xs text-dark-faint">
                A mostrar 10 de {report.products.length} produtos. O ficheiro Excel tem todos.
              </p>
            )}
          </Panel>
        </div>
      )}
    </SalesShell>
  );
}
