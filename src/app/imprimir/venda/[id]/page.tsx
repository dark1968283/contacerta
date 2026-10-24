import { notFound } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getBusinessContext } from "@/lib/supabase/business";
import { formatMT } from "@/lib/format";
import { BUSINESS_TIMEZONE } from "@/lib/timezone";
import { PrintToolbar } from "@/components/print/PrintToolbar";

export const metadata = { title: "Recibo | ContaCerta", robots: { index: false } };

type Invoice = {
  series: string;
  year: number;
  number: number;
  customer_name: string | null;
  customer_nuit: string | null;
  issued_at: string;
};

export default async function PrintSalePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { imprimir?: string };
}) {
  const { businessId, businessName } = await getBusinessContext();
  // Tabelas/colunas da migração 0021 ainda não estão nos tipos gerados.
  const db = createClient() as unknown as SupabaseClient;

  const { data: sale } = await db
    .from("sales")
    .select("id, total_amount, payment_method, created_at, customer_id, customers(name, phone)")
    .eq("id", params.id)
    .eq("business_id", businessId)
    .maybeSingle();
  if (!sale) notFound();

  const [{ data: items }, { data: business }, { data: invoice }] = await Promise.all([
    db.from("sale_items").select("quantity, unit_price, products(name)").eq("sale_id", sale.id),
    db.from("businesses").select("name, nuit, phone, address").eq("id", businessId).maybeSingle(),
    db
      .from("invoices")
      .select("series, year, number, customer_name, customer_nuit, issued_at")
      .eq("sale_id", sale.id)
      .maybeSingle(),
  ]);

  const inv = (invoice ?? null) as Invoice | null;
  const biz = (business ?? { name: businessName }) as { name: string; nuit?: string | null; phone?: string | null; address?: string | null };
  const customer = sale.customers as unknown as { name: string; phone: string | null } | null;
  const credit = sale.payment_method === "credito";
  const total = Number(sale.total_amount);
  const date = new Date(inv?.issued_at ?? sale.created_at);
  const saleDate = new Date(sale.created_at);

  const lines = (items ?? []).map((item) => ({
    name: (item.products as unknown as { name: string } | null)?.name ?? "Produto",
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
  }));

  const docTitle = inv ? (credit ? "Factura" : "Factura-recibo") : "Recibo de venda";
  const docNumber = inv ? `${inv.series} ${inv.year}/${inv.number}` : `Venda ${sale.id.slice(0, 8).toUpperCase()}`;
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("pt-MZ", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: BUSINESS_TIMEZONE });
  const fmtTime = (d: Date) => d.toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit", timeZone: BUSINESS_TIMEZONE });

  return (
    <div className="min-h-dvh bg-neutral-100 text-neutral-900 print:bg-[#fff]">
      <PrintToolbar backHref={`/dashboard/vendas/${sale.id}`} autoPrint={searchParams.imprimir === "1"} />

      <article className="mx-auto my-6 max-w-[148mm] bg-[#fff] p-7 shadow-sm print:my-0 print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold leading-tight">{biz.name}</h1>
            {biz.address && <p className="text-sm text-neutral-600">{biz.address}</p>}
            {biz.phone && <p className="text-sm text-neutral-600">Tel.: {biz.phone}</p>}
            {biz.nuit && <p className="text-sm text-neutral-600">NUIT: {biz.nuit}</p>}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#166C4E]">{docTitle}</p>
            <p className="text-lg font-bold">{docNumber}</p>
            <p className="text-sm text-neutral-600">
              {fmtDate(date)} {fmtTime(date)}
            </p>
          </div>
        </header>

        <section className="mt-5 rounded-lg bg-neutral-50 px-4 py-3 text-sm print:border print:border-neutral-200 print:bg-[#fff]">
          <p>
            <span className="text-neutral-500">Cliente: </span>
            <span className="font-semibold">{inv?.customer_name ?? customer?.name ?? "Consumidor final"}</span>
          </p>
          {inv?.customer_nuit && (
            <p>
              <span className="text-neutral-500">NUIT do cliente: </span>
              {inv.customer_nuit}
            </p>
          )}
          {inv && (
            <p>
              <span className="text-neutral-500">Data da venda: </span>
              {fmtDate(saleDate)} {fmtTime(saleDate)}
            </p>
          )}
        </section>

        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-neutral-800 text-left">
              <th className="py-2 font-semibold">Descrição</th>
              <th className="py-2 text-right font-semibold">Qtd.</th>
              <th className="py-2 text-right font-semibold">Preço</th>
              <th className="py-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-neutral-200">
                <td className="py-2">{l.name}</td>
                <td className="py-2 text-right tabular-nums">{l.quantity}</td>
                <td className="py-2 text-right tabular-nums">{formatMT(l.unitPrice)}</td>
                <td className="py-2 text-right tabular-nums">{formatMT(l.unitPrice * l.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-56 space-y-1 text-sm">
            <div className="flex justify-between border-t-2 border-neutral-800 pt-2 text-base font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatMT(total)}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Pagamento</span>
              <span>{credit ? "A crédito (por pagar)" : "Pago"}</span>
            </div>
          </div>
        </div>

        <footer className="mt-10 border-t border-neutral-200 pt-3 text-center text-xs text-neutral-500">
          Obrigado pela preferência! · Documento processado por ContaCerta (contacertamz.site)
        </footer>
      </article>
    </div>
  );
}
