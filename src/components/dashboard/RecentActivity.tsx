import Link from "next/link";
import { ArrowUpRight, Clock3, Receipt, Wallet, type LucideIcon } from "lucide-react";
import { Panel } from "./Panel";

/** Uma venda REAL do período (rótulos já calculados no servidor, no fuso de Maputo). */
export type ActivityItem = {
  id: string;
  method: string;
  customerLabel: string;
  timeLabel: string;
  amountLabel: string;
};

const KIND: Record<string, { Icon: LucideIcon; chip: string; badge: string; badgeLabel: string }> = {
  pago: { Icon: Wallet, chip: "bg-brandGlow/10 text-brandGlow", badge: "bg-brandGlow/10 text-brandGlow", badgeLabel: "Pago" },
  credito: { Icon: Clock3, chip: "bg-warning/10 text-warning", badge: "bg-warning/10 text-warning", badgeLabel: "Crédito" },
};
const FALLBACK = { Icon: Receipt, chip: "bg-white/5 text-dark-muted", badge: "", badgeLabel: "" };

/**
 * Hoje o Dashboard só tem dados reais de VENDAS (os pagamentos de dívidas são
 * carregados apenas como soma, sem data nem cliente), por isso a lista mostra
 * só vendas — nada é inventado.
 */
export function RecentActivity({ items, periodLabel }: { items: ActivityItem[]; periodLabel: string }) {
  return (
    <Panel className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-dark-text">Atividade recente</h2>
          <p className="mt-0.5 text-xs text-dark-muted">Últimas vendas · {periodLabel}</p>
        </div>
        <Link
          href="/dashboard/vendas"
          className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-brandGlow transition-colors hover:text-brandGlow/70"
        >
          Ver todas <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {items.length ? (
        <ul className="mt-3 divide-y divide-dark-border">
          {items.map((item) => {
            const kind = KIND[item.method] ?? FALLBACK;
            return (
              <li key={item.id} className="flex items-center gap-3 py-3.5 first:pt-2 last:pb-0">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${kind.chip}`}>
                  <kind.Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-dark-text">{item.customerLabel}</p>
                  <p className="truncate text-xs text-dark-muted">{item.timeLabel}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-dark-text">{item.amountLabel}</p>
                  {kind.badgeLabel && (
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${kind.badge}`}>
                      {kind.badgeLabel}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-dark-faint">Ainda não existem vendas. Registe uma venda para começar.</p>
      )}
    </Panel>
  );
}
