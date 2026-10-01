import type { ReactNode } from "react";

/**
 * Casca visual partilhada pelas páginas de Vendas (uso exclusivo desta área).
 * Mesmo fundo escuro "full-bleed" do Dashboard: a sombra de 100vmax pinta os
 * lados e a base fora do contentor (sem criar scroll horizontal), estendida
 * para cima para também cobrir a faixa da TopBar (que continua por cima).
 */
export function SalesShell({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 -mt-5 -mb-6 bg-dark-bg px-4 pb-16 pt-5 shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-8rem_-100vmax)] sm:-mx-6 sm:px-6 [background-image:radial-gradient(ellipse_520px_420px_at_50%_-120px,rgba(34,199,102,0.10),transparent)]">
      <div className="space-y-6">{children}</div>
    </div>
  );
}

type SalesHeaderProps = {
  title: string;
  subtitle?: string;
  /** Ação à direita (botão "Nova venda" ou "Cancelar"). */
  action?: ReactNode;
};

export function SalesHeader({ title, subtitle, action }: SalesHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3 sm:items-center">
      <div className="min-w-0">
        <h1 className="break-words text-xl font-semibold tracking-tight text-dark-text sm:text-[28px] sm:leading-9">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-sm text-dark-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
