import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowLeft, type LucideIcon } from "lucide-react";

/**
 * Peças puramente visuais da área Clientes (sem Supabase, sem Server Actions,
 * sem cálculos). Podem ser usadas em Server e Client Components.
 */

/** Rótulo e campo no estilo dark (equivalentes escuros de .field-label / .input-field). */
export const FIELD_LABEL = "mb-1.5 block text-sm font-medium text-dark-muted";
export const FIELD_INPUT =
  "w-full rounded-xl border border-dark-border bg-dark-bg/60 px-4 py-3 text-base text-dark-text placeholder:text-dark-faint outline-none transition-all duration-200 [color-scheme:dark] focus:border-brandGlow/50 focus:ring-2 focus:ring-brandGlow/15";
/** Variante com ícone à esquerda (usar dentro de <FieldIcon>). */
export const FIELD_INPUT_ICON = `${FIELD_INPUT} pl-10`;

export const PRIMARY_LINK =
  "group flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2.5 text-sm font-medium text-white shadow-lg shadow-brand/20 transition-all hover:bg-brand/90 hover:shadow-brand/30 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-brandGlow/40 focus:ring-offset-2 focus:ring-offset-dark-bg sm:px-4 sm:py-3";
export const GHOST_LINK =
  "flex items-center gap-1.5 rounded-xl border border-dark-border bg-white/[0.03] px-3.5 py-2.5 text-sm font-medium text-dark-muted transition-colors hover:border-dark-borderStrong hover:text-dark-text sm:py-3";

/**
 * Fundo escuro "full-bleed" (igual ao Dashboard/Vendas/Produtos): a sombra de
 * 100vmax pinta lados, topo e base fora do contentor sem criar scroll.
 */
export function CustomersShell({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div className="-mx-4 -mt-5 -mb-6 bg-dark-bg px-4 pb-16 pt-5 shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-100vmax_-100vmax)] sm:-mx-6 sm:px-6 [background-image:radial-gradient(ellipse_520px_420px_at_50%_-120px,rgba(34,199,102,0.10),transparent)]">
      <div className={`space-y-6 ${narrow ? "mx-auto w-full max-w-2xl" : ""}`}>{children}</div>
    </div>
  );
}

type CustomersHeaderProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  back?: { href: string; label: string };
};

export function CustomersHeader({ title, subtitle, action, back }: CustomersHeaderProps) {
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

/** Título de secção (mesmo estilo dos painéis do Dashboard). */
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

/** Ícone decorativo à esquerda de um campo (o <input> segue dentro, com FIELD_INPUT_ICON). */
export function FieldIcon({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-faint" aria-hidden />
      {children}
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

/** Iniciais (até 2 letras) — mesma regra usada no ranking de devedores do Dashboard. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return "?";
  const last = parts[parts.length - 1];
  if (parts.length === 1 || !last) return first.slice(0, 2).toUpperCase();
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

const AVATAR_SIZE = { md: "h-11 w-11 text-sm", lg: "h-16 w-16 text-xl" } as const;

export function CustomerAvatar({ name, size = "md" }: { name: string; size?: keyof typeof AVATAR_SIZE }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-brandGlow/10 font-semibold text-brandGlow ring-1 ring-brandGlow/20 ${AVATAR_SIZE[size]}`}
    >
      {initialsOf(name)}
    </span>
  );
}
