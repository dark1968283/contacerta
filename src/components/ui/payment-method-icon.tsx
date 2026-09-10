import { Banknote, Clock3, CreditCard, HelpCircle, Smartphone, Wallet, type LucideIcon } from "lucide-react";

/**
 * Métodos de pagamento realmente usados no schema atual:
 * - sales.payment_method: "pago" | "credito"
 * - debt_payments.payment_method: "dinheiro" | "mpesa" | "emola" | "transferencia" | "outro"
 * - subscription_payments.payment_method: "mpesa" | "emola" | "mkesh" | "bank_transfer" | "cash" | "other"
 *
 * NÃO existe integração real com M-Pesa/e-Mola — isto é só representação
 * visual do método já guardado na base de dados, nunca uma chamada a uma
 * API de pagamento.
 */
const METHOD_META: Record<string, { label: string; Icon: LucideIcon; className: string }> = {
  pago: { label: "Pago", Icon: Wallet, className: "bg-brand-soft text-brand" },
  credito: { label: "Crédito", Icon: Clock3, className: "bg-warn-soft text-warn" },
  dinheiro: { label: "Dinheiro", Icon: Banknote, className: "bg-brand-soft text-brand" },
  cash: { label: "Dinheiro", Icon: Banknote, className: "bg-brand-soft text-brand" },
  mpesa: { label: "M-Pesa", Icon: Smartphone, className: "bg-alert-soft text-alert" },
  emola: { label: "e-Mola", Icon: Smartphone, className: "bg-warn-soft text-warn" },
  mkesh: { label: "mKesh", Icon: Smartphone, className: "bg-brand-soft text-brand" },
  transferencia: { label: "Transferência", Icon: CreditCard, className: "bg-ink/5 text-ink/60" },
  bank_transfer: { label: "Transferência", Icon: CreditCard, className: "bg-ink/5 text-ink/60" },
  outro: { label: "Outro", Icon: HelpCircle, className: "bg-ink/5 text-ink/60" },
  other: { label: "Outro", Icon: HelpCircle, className: "bg-ink/5 text-ink/60" },
};

const FALLBACK = { Icon: CreditCard, className: "bg-ink/5 text-ink/60" };

/** Rótulo em português para um payment_method — usa o valor em bruto se for desconhecido. */
export function paymentMethodLabel(method: string): string {
  return METHOD_META[method]?.label ?? method;
}

/** Selo circular com ícone, cor de destaque e title acessível para um payment_method. */
export function PaymentMethodIcon({ method, className }: { method: string; className?: string }) {
  const meta = METHOD_META[method];
  const Icon = meta?.Icon ?? FALLBACK.Icon;
  const colorClassName = meta?.className ?? FALLBACK.className;
  return (
    <span
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${colorClassName} ${className ?? ""}`}
      title={paymentMethodLabel(method)}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </span>
  );
}
