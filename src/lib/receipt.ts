import { formatMT } from "./format";
import { BUSINESS_TIMEZONE } from "./timezone";

export type ReceiptLine = { name: string; quantity: number; unitPrice: number };

/** Texto do recibo, pronto para WhatsApp (o *negrito* do WhatsApp usa asteriscos). */
export function buildReceiptText({
  businessName,
  createdAt,
  lines,
  total,
  paymentMethod,
  customerName,
  received,
}: {
  businessName: string;
  createdAt: string | Date;
  lines: ReceiptLine[];
  total: number;
  paymentMethod: "pago" | "credito" | string;
  customerName?: string | null;
  received?: number | null;
}) {
  const date = new Date(createdAt);
  const when = `${date.toLocaleDateString("pt-MZ", { timeZone: BUSINESS_TIMEZONE })} ${date.toLocaleTimeString("pt-MZ", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BUSINESS_TIMEZONE,
  })}`;
  const change = received != null && received >= total ? received - total : null;

  return [
    `*${businessName}*`,
    `Recibo de venda · ${when}`,
    customerName ? `Cliente: ${customerName}` : null,
    "",
    ...lines.map((l) => `${l.quantity} × ${l.name} — ${formatMT(l.unitPrice * l.quantity)}`),
    "",
    `*Total: ${formatMT(total)}*`,
    paymentMethod === "credito"
      ? "Pagamento: a crédito (em dívida)"
      : `Pagamento: pago${change != null ? ` · Recebido ${formatMT(received!)} · Troco ${formatMT(change)}` : ""}`,
    "",
    "Obrigado pela preferência!",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

/** Converte "84 123 4567" em "258841234567". Devolve "" se não for um número válido. */
export function whatsappNumber(phone: string | null | undefined) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("258") && digits.length >= 11) return digits;
  if (digits.length === 9 && digits.startsWith("8")) return `258${digits}`;
  return "";
}

/** Link do WhatsApp; sem número, o WhatsApp deixa escolher o contacto. */
export function whatsappLink(text: string, phone?: string | null) {
  return `https://wa.me/${whatsappNumber(phone)}?text=${encodeURIComponent(text)}`;
}
