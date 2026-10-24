import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { formatMT } from "@/lib/format";
import { BUSINESS_TIMEZONE } from "@/lib/timezone";
import { PrintToolbar } from "@/components/print/PrintToolbar";
import { MONTH_NAMES, change, loadMonthReport, monthLabel, monthParam, parseMonth, shiftMonth } from "@/lib/reports";

export const metadata = { title: "Relatório mensal | ContaCerta", robots: { index: false } };

function pct(v: number | null) {
  if (v === null || !Number.isFinite(v)) return "—";
  return `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(0)}%`;
}

export default async function PrintReportPage({ searchParams }: { searchParams: { mes?: string } }) {
  const { businessId, businessName, role } = await getBusinessContext();
  const key = parseMonth(searchParams.mes);

  if (role !== "admin") {
    return <p className="p-8 text-center">Só o administrador pode ver os relatórios.</p>;
  }

  const supabase = createClient();
  const prevKey = shiftMonth(key, -1);
  const [report, previous] = await Promise.all([
    loadMonthReport(supabase, businessId, key),
    loadMonthReport(supabase, businessId, prevKey),
  ]);

  const weekOrder = [1, 2, 3, 4, 5, 6, 0].flatMap((d) => report.weekdays[d] ?? []);
  const bestWeekday = [...report.weekdays].sort((a, b) => b.revenue - a.revenue)[0];
  const generated = new Date().toLocaleString("pt-MZ", { timeZone: BUSINESS_TIMEZONE });

  const rows: [string, string, string][] = [
    ["Total vendido", formatMT(report.revenue), pct(change(report.revenue, previous.revenue))],
    [
      "Lucro",
      report.hasProfitData ? formatMT(report.profit) : "—",
      report.hasProfitData && previous.hasProfitData ? pct(change(report.profit, previous.profit)) : "—",
    ],
    ["Recebido", formatMT(report.received), pct(change(report.received, previous.received))],
    ["Vendido a crédito", formatMT(report.credit), "—"],
    ["Número de vendas", String(report.salesCount), pct(change(report.salesCount, previous.salesCount))],
    ["Valor médio por venda", report.avgTicket !== null ? formatMT(report.avgTicket) : "—", "—"],
  ];

  return (
    <div className="min-h-dvh bg-neutral-100 text-neutral-900 print:bg-[#fff]">
      <PrintToolbar backHref={`/dashboard/relatorios?mes=${monthParam(key)}`} />

      <article className="mx-auto my-6 max-w-[210mm] bg-[#fff] p-8 shadow-sm print:my-0 print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-2 border-[#166C4E] pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#166C4E]">Relatório mensal</p>
            <h1 className="mt-1 text-2xl font-extrabold">{businessName}</h1>
            <p className="text-neutral-600">{monthLabel(key)}</p>
          </div>
          <div className="text-right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="" className="ml-auto h-10 w-10" />
            <p className="mt-1 text-sm font-bold">ContaCerta</p>
          </div>
        </header>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Resumo</h2>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-300 text-left text-neutral-500">
                <th className="py-1.5 font-semibold">Indicador</th>
                <th className="py-1.5 text-right font-semibold">{MONTH_NAMES[key.month - 1]}</th>
                <th className="py-1.5 text-right font-semibold">vs {MONTH_NAMES[prevKey.month - 1]}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, value, delta]) => (
                <tr key={label} className="border-b border-neutral-100">
                  <td className="py-1.5">{label}</td>
                  <td className="py-1.5 text-right font-semibold tabular-nums">{value}</td>
                  <td className="py-1.5 text-right tabular-nums text-neutral-600">{delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {report.missingCostCount > 0 && (
            <p className="mt-2 text-xs text-neutral-500">
              Nota: {report.missingCostCount} produto(s) sem preço de compra não entram no lucro.
            </p>
          )}
        </section>

        <section className="mt-6 break-inside-avoid">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Vendas por dia da semana</h2>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {weekOrder.map((w) => (
                <tr key={w.day} className="border-b border-neutral-100">
                  <td className={`py-1.5 ${w.day === bestWeekday?.day && w.revenue > 0 ? "font-bold" : ""}`}>{w.name}</td>
                  <td className="py-1.5 text-right tabular-nums text-neutral-600">{w.count} vendas</td>
                  <td className="py-1.5 text-right font-semibold tabular-nums">{formatMT(w.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Produtos vendidos</h2>
          {report.products.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-500">Sem vendas neste mês.</p>
          ) : (
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-300 text-left text-neutral-500">
                  <th className="py-1.5 font-semibold">Produto</th>
                  <th className="py-1.5 text-right font-semibold">Qtd.</th>
                  <th className="py-1.5 text-right font-semibold">Vendido</th>
                  <th className="py-1.5 text-right font-semibold">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {report.products.map((p) => (
                  <tr key={p.id} className="border-b border-neutral-100">
                    <td className="py-1.5">{p.name}</td>
                    <td className="py-1.5 text-right tabular-nums">{p.quantity}</td>
                    <td className="py-1.5 text-right tabular-nums">{formatMT(p.revenue)}</td>
                    <td className="py-1.5 text-right tabular-nums text-neutral-600">
                      {p.profit === null ? "—" : formatMT(p.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer className="mt-8 border-t border-neutral-200 pt-3 text-xs text-neutral-500">
          Gerado em {generated} · ContaCerta — contacertamz.site
        </footer>
      </article>
    </div>
  );
}
