import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { BUSINESS_TIMEZONE, zonedDayKey, zonedTime } from "@/lib/timezone";
import { itemCost } from "@/lib/profit";
import { loadMonthReport, monthLabel, monthParam, parseMonth } from "@/lib/reports";

/**
 * Exporta o mês em CSV (abre directamente no Excel e no Google Sheets).
 * Separador ";" e vírgula decimal, como o Excel em português espera,
 * e BOM UTF-8 para os acentos aparecerem certos.
 */
export async function GET(request: NextRequest) {
  const { businessId, businessName, role } = await getBusinessContext();
  if (role !== "admin") {
    return new NextResponse("Só o administrador pode exportar relatórios.", { status: 403 });
  }

  const supabase = createClient();
  const key = parseMonth(request.nextUrl.searchParams.get("mes") ?? undefined);
  const report = await loadMonthReport(supabase, businessId, key);

  const num = (n: number | null) => (n === null ? "" : n.toFixed(2).replace(".", ","));
  const cell = (v: string | number | null) => {
    const s = v === null ? "" : String(v);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const row = (...cells: (string | number | null)[]) => cells.map(cell).join(";");

  // Custos actuais só servem de recurso para vendas antigas sem custo guardado.
  const currentCosts = report.currentCosts;

  const lines: string[] = [];
  lines.push(row(`Relatório ContaCerta — ${businessName}`));
  lines.push(row("Mês", monthLabel(key)));
  lines.push(row("Total vendido (MT)", num(report.revenue)));
  lines.push(row("Lucro dos produtos (MT)", report.hasProfitData ? num(report.grossProfit) : "sem dados"));
  lines.push(row("Descontos (MT)", num(report.discounts)));
  lines.push(row("Despesas (MT)", num(report.expenses)));
  lines.push(row("Lucro depois das despesas (MT)", report.hasProfitData ? num(report.profit) : "sem dados"));
  lines.push(row("Recebido (MT)", num(report.received)));
  lines.push(row("Vendido a crédito (MT)", num(report.credit)));
  lines.push(row("Número de vendas", report.salesCount));
  lines.push("");
  lines.push(
    row(
      "Data",
      "Hora",
      "Venda",
      "Produto",
      "Quantidade",
      "Preço unitário (MT)",
      "Subtotal (MT)",
      "Custo unitário (MT)",
      "Lucro (MT)",
      "Pagamento",
    ),
  );

  for (const sale of report.sales) {
    const at = new Date(sale.created_at);
    const day = zonedDayKey(at, BUSINESS_TIMEZONE).split("-").reverse().join("/");
    const time = zonedTime(at, BUSINESS_TIMEZONE);
    const payment = sale.payment_method === "credito" ? "A crédito" : "Pago";
    for (const item of sale.sale_items ?? []) {
      const qty = Number(item.quantity);
      const price = Number(item.unit_price);
      const cost = itemCost(item, currentCosts);
      lines.push(
        row(
          day,
          time,
          sale.id.slice(0, 8).toUpperCase(),
          report.productNames.get(item.product_id) ?? "Produto",
          qty,
          num(price),
          num(qty * price),
          num(cost),
          cost === null ? "" : num(qty * (price - cost)),
          payment,
        ),
      );
    }
  }

  const body = "﻿" + lines.join("\r\n");
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contacerta-relatorio-${monthParam(key)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
