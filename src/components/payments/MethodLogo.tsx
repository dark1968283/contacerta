/* eslint-disable @next/next/no-img-element */
/**
 * Imagem e nome de cada forma de pagamento (as mesmas imagens do
 * pagamento de dívidas), para usar em todo o lado onde se fala de pagamentos.
 */

const METHODS: Record<string, { src: string; label: string }> = {
  mpesa: { src: "/images/payments/mpesa.png", label: "M-Pesa" },
  emola: { src: "/images/payments/emola.png", label: "e-Mola" },
  mkesh: { src: "/images/payments/outro.svg", label: "mKesh" },
  dinheiro: { src: "/images/payments/dinheiro.png", label: "Dinheiro" },
  cash: { src: "/images/payments/dinheiro.png", label: "Dinheiro" },
  transferencia: { src: "/images/payments/transferencia.png", label: "Transferência" },
  bank_transfer: { src: "/images/payments/transferencia.png", label: "Transferência" },
  outro: { src: "/images/payments/outro.svg", label: "Outro" },
  other: { src: "/images/payments/outro.svg", label: "Outro" },
};

export function methodInfo(method: string | null | undefined) {
  const key = (method ?? "").toLowerCase();
  return METHODS[key] ?? { src: "/images/payments/outro.svg", label: method || "Outro" };
}

export function MethodLogo({ method, size = 36, className = "" }: { method: string | null | undefined; size?: number; className?: string }) {
  const m = methodInfo(method);
  return (
    <img
      src={m.src}
      alt={m.label}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-lg object-contain ${className}`}
    />
  );
}

/** Logo pequeno + nome, para usar dentro de uma linha de texto. */
export function MethodChip({ method, label }: { method: string | null | undefined; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <MethodLogo method={method} size={18} className="rounded" />
      <span>{label ?? methodInfo(method).label}</span>
    </span>
  );
}
