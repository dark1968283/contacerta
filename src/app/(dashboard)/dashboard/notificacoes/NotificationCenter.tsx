"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Package,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

export type NoticeItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  action: string;
  tone: "warning" | "danger" | "info";
};

type Props = {
  stock: NoticeItem[];
  subscription: NoticeItem[];
  payments: NoticeItem[];
  hasError: boolean;
};

const STORAGE_KEY = "contacerta-dismissed-notifications";
const COUNT_KEY = "contacerta-unread-notifications";
const EVENT_NAME = "contacerta-notifications-updated";

function readDismissed(): string[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function NoticeCard({
  item,
  dismiss,
}: {
  item: NoticeItem;
  dismiss: (id: string) => void;
}) {
  const tone = {
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    info: "bg-white/[0.05] text-dark-text",
  }[item.tone];

  return (
    <article className="flex items-start gap-2 rounded-xl border border-dark-border bg-white/[0.02] p-3 sm:items-center sm:gap-3 sm:p-4">
      <div className={`mt-0.5 flex shrink-0 items-center sm:mt-0 ${tone}`}>
        <AlertTriangle size={16} aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium leading-5 text-dark-text sm:text-sm">
          {item.title}
        </p>
        <p className="mt-0.5 text-xs leading-5 text-dark-muted sm:mt-1 sm:text-sm">
          {item.description}
        </p>
        <Link
          href={item.href}
          onClick={() => dismiss(item.id)}
          className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-dark-border px-2.5 py-1.5 text-xs font-medium text-dark-text transition hover:border-brandGlow/30 hover:bg-brandGlow/5 sm:mt-2.5"
        >
          {item.action}
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => dismiss(item.id)}
          title="Marcar como vista"
          aria-label={`Marcar como vista: ${item.title}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-dark-muted transition hover:bg-white/[0.06] hover:text-dark-text"
        >
          <X size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => dismiss(item.id)}
          title="Apagar aviso"
          aria-label={`Apagar aviso: ${item.title}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-dark-muted transition hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export default function NotificationCenter({
  stock,
  subscription,
  payments,
  hasError,
}: Props) {
  const all = useMemo(
    () => [...stock, ...subscription, ...payments],
    [stock, subscription, payments],
  );
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDismissed(readDismissed());
    setReady(true);
  }, []);

  const visible = useMemo(
    () => all.filter((item) => !dismissed.includes(item.id)),
    [all, dismissed],
  );
  const visibleStock = visible.filter((item) => item.id.startsWith("stock:"));
  const visibleSubscription = visible.filter((item) => item.id.startsWith("subscription:"));
  const visiblePayments = visible.filter((item) => item.id.startsWith("payment:"));

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(COUNT_KEY, String(visible.length));
      window.dispatchEvent(
        new CustomEvent(EVENT_NAME, { detail: visible.length }),
      );
    } catch {
      // A página continua funcional se o armazenamento estiver indisponível.
    }
  }, [ready, visible.length]);

  function dismiss(id: string) {
    setDismissed((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // A remoção da interface não depende do armazenamento.
      }
      return next;
    });
  }

  function section(
    title: string,
    description: string,
    items: NoticeItem[],
    Icon: typeof Bell,
    empty: string,
  ) {
    return (
      <section className="space-y-3 rounded-2xl border border-dark-border bg-dark-surface p-3 sm:space-y-4 sm:p-6">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="flex shrink-0 items-center text-brandGlow">
            <Icon size={18} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-dark-text sm:text-base">{title}</h2>
            <p className="mt-0.5 text-xs leading-5 text-dark-muted sm:mt-1 sm:text-sm">{description}</p>
          </div>
          <span className="rounded-full border border-dark-border bg-white/[0.04] px-2 py-0.5 text-xs tabular-nums text-dark-muted">
            {items.length}
          </span>
        </div>

        {items.length === 0 ? (
          <p className="rounded-xl border border-dark-border px-3 py-2.5 text-xs leading-5 text-dark-muted sm:px-4 sm:py-3 sm:text-sm">
            {empty}
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <NoticeCard key={item.id} item={item} dismiss={dismiss} />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="-mx-4 -mt-5 -mb-6 min-h-[calc(100dvh-5rem)] bg-dark-bg px-3 pb-16 pt-5 text-dark-text shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-100vmax_-100vmax)] sm:-mx-6 sm:px-6 sm:pt-6">
      <div className="mx-auto max-w-5xl space-y-4 sm:space-y-7">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-dark-muted sm:mb-3 sm:text-xs sm:tracking-[0.18em]">
              <Bell size={14} />
              Centro de alertas
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Notificações</h1>
            <p className="mt-1.5 max-w-xl text-xs leading-5 text-dark-muted sm:mt-2 sm:text-sm sm:leading-6">
              Avisos importantes sobre o stock, a assinatura e os pagamentos do seu negócio.
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-dark-border bg-dark-surface px-2.5 py-2 text-xs text-dark-muted sm:gap-2 sm:px-3.5 sm:py-2.5 sm:text-sm">
            <Bell size={15} className="text-brandGlow" aria-hidden="true" />
            <span>{visible.length} por ler</span>
          </div>
        </header>

        {hasError && (
          <div className="rounded-xl border border-danger/20 bg-danger/[0.06] p-3 text-xs leading-5 text-danger sm:p-4 sm:text-sm sm:leading-6">
            Não foi possível carregar algumas notificações. Actualize a página ou tente novamente.
          </div>
        )}

        {ready && visible.length === 0 && (
          <div className="rounded-2xl border border-dark-border bg-dark-surface p-6 text-center sm:p-12">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-brandGlow/20 bg-brandGlow/10 text-brandGlow sm:h-14 sm:w-14">
              <CheckCircle2 size={25} aria-hidden="true" />
            </div>
            <h2 className="mt-3 text-base font-semibold sm:mt-4 sm:text-lg">Está tudo em ordem</h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-dark-muted sm:text-sm sm:leading-6">
              Não existem avisos por ler. Os novos avisos aparecerão aqui quando forem necessários.
            </p>
            {dismissed.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDismissed([]);
                  try {
                    localStorage.removeItem(STORAGE_KEY);
                  } catch {}
                }}
                className="mt-4 rounded-lg border border-dark-border px-3 py-2 text-xs font-medium text-dark-text hover:bg-white/5"
              >
                Restaurar avisos dispensados
              </button>
            )}
          </div>
        )}

        {section("Stock", "Produtos esgotados ou com poucas unidades.", visibleStock, Package, "Não existem avisos de stock por ler.")}
        {section("Subscrição", "Estado do plano e fim do período contratado.", visibleSubscription, Wallet, "Não existem avisos de subscrição por ler.")}
        {section("Pagamentos", "Pedidos pendentes ou pagamentos rejeitados.", visiblePayments, CreditCard, "Não existem avisos de pagamentos por ler.")}

        <div className="flex items-start gap-2.5 rounded-2xl border border-dark-border bg-dark-surface/60 p-3 sm:gap-3 sm:p-4">
          <CalendarClock size={17} className="mt-0.5 shrink-0 text-dark-muted" aria-hidden="true" />
          <p className="text-xs leading-5 text-dark-muted sm:text-sm sm:leading-6">
            Os avisos dispensados ficam ocultos neste navegador. Esta acção não apaga os registos originais do negócio.
          </p>
        </div>
      </div>
    </div>
  );
}
