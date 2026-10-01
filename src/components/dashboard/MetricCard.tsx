import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Panel } from "./Panel";

type Accent = "brand" | "warn" | "danger" | "neutral";
type ValueTone = "default" | "brand" | "warn" | "danger" | "muted";

// Strings completas (não montadas dinamicamente) para o Tailwind as detetar.
const ACCENT: Record<Accent, { bar: string; glow: string; icon: string }> = {
  brand: { bar: "bg-brandGlow", glow: "bg-brandGlow/15", icon: "text-brandGlow" },
  warn: { bar: "bg-warning", glow: "bg-warning/15", icon: "text-warning" },
  danger: { bar: "bg-danger", glow: "bg-danger/15", icon: "text-danger" },
  neutral: { bar: "bg-white/20", glow: "bg-white/5", icon: "text-dark-muted" },
};

const VALUE: Record<ValueTone, string> = {
  default: "text-dark-text",
  brand: "text-brandGlow",
  warn: "text-warning",
  danger: "text-danger",
  muted: "text-dark-faint",
};

type MetricCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Informação secundária — só passar se o dado realmente existir. */
  hint?: ReactNode;
  /** Cor do detalhe lateral, do glow e do ícone. */
  accent?: Accent;
  /** Cor do valor principal. */
  valueTone?: ValueTone;
  /** Cartão de destaque (Vendas): leve tom de marca na superfície. */
  featured?: boolean;
  className?: string;
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = "neutral",
  valueTone = "default",
  featured = false,
  className = "",
}: MetricCardProps) {
  const a = ACCENT[accent];

  return (
    <Panel
      as="article"
      glowClassName={featured ? "bg-brandGlow/20" : a.glow}
      edgeClassName={featured ? "via-brandGlow/40" : "via-white/10"}
      className={`p-4 transition-transform duration-200 hover:-translate-y-0.5 sm:p-5 ${className}`}
      decor={
        <>
          {featured && <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-transparent to-transparent" />}
          <span className={`absolute left-0 top-5 h-8 w-[3px] rounded-r-full ${a.bar}`} />
        </>
      }
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-dark-muted">{label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06]">
          <Icon className={`h-4 w-4 ${a.icon}`} aria-hidden />
        </span>
      </div>

      <p
        className={`mt-3 break-words font-bold leading-tight tracking-tight tabular-nums ${VALUE[valueTone]} ${
          featured ? "text-[26px] sm:text-[32px] md:text-[28px]" : "text-[22px] sm:text-[28px]"
        }`}
      >
        {value}
      </p>

      {hint && <p className="mt-2 text-xs leading-snug text-dark-muted">{hint}</p>}
    </Panel>
  );
}
