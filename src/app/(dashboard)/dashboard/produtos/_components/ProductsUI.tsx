import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowLeft, type LucideIcon } from "lucide-react";

/**
 * Peças visuais partilhadas pela área Produtos (uso exclusivo desta área).
 * Sem hooks nem imports de servidor: podem ser usadas em Server e Client Components.
 */

/** Rótulo e campo no estilo dark (equivalentes escuros de .field-label / .input-field). */
export const FIELD_LABEL = "mb-1.5 block text-sm font-medium text-dark-muted";
export const FIELD_INPUT =
  "w-full rounded-xl border border-dark-border bg-dark-bg/60 px-4 py-3 text-base text-dark-text placeholder:text-dark-faint outline-none transition-all duration-200 [color-scheme:dark] focus:border-brandGlow/50 focus:ring-2 focus:ring-brandGlow/15";
export const FIELD_HINT = "mt-1.5 text-xs leading-relaxed text-dark-faint";

/** Botão principal de cabeçalho ("Novo produto"), igual ao "Nova venda" do Dashboard/Vendas. */
export const PRIMARY_LINK =
  "group flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand/90 hover:shadow-brand/30 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-brandGlow/40 focus:ring-offset-2 focus:ring-offset-dark-bg sm:px-4 sm:py-3";
export const GHOST_LINK =
  "flex items-center gap-1.5 rounded-xl border border-dark-border bg-white/[0.03] px-3.5 py-2.5 text-sm font-medium text-dark-muted transition-colors hover:border-dark-borderStrong hover:text-dark-text sm:py-3";

/**
 * Fundo escuro "full-bleed" (igual ao Dashboard): a sombra de 100vmax pinta os
 * lados, o topo e a base fora do contentor (inclusive em páginas curtas) sem criar scroll.
 * `narrow` limita a largura em páginas de formulário.
 */
export function ProductsShell({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div className="-mx-4 -mt-5 -mb-6 bg-dark-bg px-4 pb-16 pt-5 shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-100vmax_-100vmax)] sm:-mx-6 sm:px-6 [background-image:radial-gradient(ellipse_520px_420px_at_50%_-120px,rgba(34,199,102,0.10),transparent)]">
      <div className={`space-y-6 ${narrow ? "mx-auto w-full max-w-2xl" : ""}`}>{children}</div>
    </div>
  );
}

type ProductsHeaderProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  back?: { href: string; label: string };
};

export function ProductsHeader({ title, subtitle, action, back }: ProductsHeaderProps) {
  return (
    <header className="space-y-3">
      {back && (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-dark-muted transition-colors hover:text-dark-text"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {back.label}
        </Link>
      )}
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 sm:items-center">
          <div className="min-w-0">
            {title && (
              <h1 className="break-words text-xl font-semibold tracking-tight text-dark-text sm:text-[28px] sm:leading-9">
                {title}
              </h1>
            )}
            {subtitle && <p className="mt-0.5 text-sm text-dark-muted">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
    </header>
  );
}

/** Título de secção (mesmo estilo dos títulos de painel do Dashboard). */
export function SectionTitle({ icon: Icon, children }: { icon?: LucideIcon; children: ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-dark-faint">
      {Icon && <Icon className="h-4 w-4" aria-hidden />}
      {children}
    </h2>
  );
}

/** Cabeçalho de um bloco dentro de um formulário. */
export function BlockTitle({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06]">
        <Icon className="h-4 w-4 text-brandGlow" aria-hidden />
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-dark-text">{title}</h3>
        {description && <p className="text-xs text-dark-muted">{description}</p>}
      </div>
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}

/** Mesmas regras do StockBadge existente (0 = esgotado; ≤ limite = baixo). */
export type StockState = "out" | "low" | "ok";
export function stockState(quantity: number, threshold: number): StockState {
  if (quantity === 0) return "out";
  if (quantity <= threshold) return "low";
  return "ok";
}

/** Versão dark do StockBadge: só aparece quando o stock está esgotado ou baixo. */
export function StockStatus({ quantity, threshold }: { quantity: number; threshold: number }) {
  const state = stockState(quantity, threshold);
  if (state === "ok") return null;
  return state === "out" ? (
    <span className="inline-flex items-center rounded-full bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger">Esgotado</span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">Stock baixo</span>
  );
}
