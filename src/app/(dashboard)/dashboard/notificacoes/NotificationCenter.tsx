"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Info, MessageCircle, X } from "lucide-react";
import { IconDebts, IconPlan, IconProducts, type NavIcon } from "@/components/icons/NavIcons";
import { LightGlass } from "@/components/ui/liquid-glass";
import { QuickRestock } from "../produtos/_components/QuickRestock";

export type NoticeKind = "stock" | "debt" | "account" | "info";

export type NoticeItem = {
  id: string;
  kind?: NoticeKind;
  title: string;
  description: string;
  href: string;
  action: string;
  tone: "warning" | "danger" | "info";
  /** Acção secundária (ex.: lembrar por WhatsApp). */
  secondary?: { label: string; href: string; external?: boolean };
  /** Para o botão "Repor" nos alertas de stock. */
  productId?: string;
  productName?: string;
};

type Props = {
  stock: NoticeItem[];
  debts: NoticeItem[];
  subscription: NoticeItem[];
  payments: NoticeItem[];
  info: NoticeItem[];
  hasError: boolean;
  isAdmin: boolean;
};

const STORAGE_KEY = "contacerta-dismissed-notifications";
const COUNT_KEY = "contacerta-unread-notifications";
const EVENT_NAME = "contacerta-notifications-updated";

const TONE_ORDER = { danger: 0, warning: 1, info: 2 } as const;

const KIND_ICON: Record<NoticeKind, NavIcon> = {
  stock: IconProducts,
  debt: IconDebts,
  account: IconPlan,
  info: ({ className }) => <Info className={className} aria-hidden />,
};

type Filter = "all" | "stock" | "debt" | "account";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "stock", label: "Stock" },
  { key: "debt", label: "Dívidas" },
  { key: "account", label: "Conta" },
];

function readDismissed(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function saveDismissed(list: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* sem armazenamento: esconde só nesta visita */
  }
}

function NoticeCard({
  item,
  hidden,
  onToggle,
  isAdmin,
}: {
  item: NoticeItem;
  hidden: boolean;
  onToggle: (id: string) => void;
  isAdmin: boolean;
}) {
  const kind = item.kind ?? "info";
  const Icon = KIND_ICON[kind];
  const toneText = { danger: "text-danger", warning: "text-warning", info: "text-dark-muted" }[item.tone];
  const toneBar = { danger: "bg-danger", warning: "bg-warning", info: "bg-white/20" }[item.tone];

  return (
    <li>
      <article
        className={`cc-glass relative overflow-hidden rounded-2xl border border-dark-border bg-dark-surface p-4 ${
          hidden ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 shrink-0 ${toneText}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[15px] font-semibold leading-snug text-dark-text">{item.title}</p>
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                aria-label={hidden ? `Mostrar de novo: ${item.title}` : `Esconder: ${item.title}`}
                title={hidden ? "Mostrar de novo" : "Esconder"}
                className="-mr-1.5 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-dark-muted transition hover:bg-white/[0.06] hover:text-dark-text"
              >
                {hidden ? <Eye className="h-4 w-4" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
              </button>
            </div>
            <p className="mt-0.5 text-sm text-dark-muted">{item.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href={item.href}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-semibold text-dark-text transition hover:bg-white/[0.1]"
              >
                {item.action}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              {item.secondary && (
                <a
                  href={item.secondary.href}
                  target={item.secondary.external ? "_blank" : undefined}
                  rel={item.secondary.external ? "noopener noreferrer" : undefined}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#25D366]/[0.12] px-3 py-2 text-sm font-semibold text-dark-text transition hover:bg-[#25D366]/[0.2]"
                >
                  <MessageCircle className="h-4 w-4 text-[#25D366]" aria-hidden />
                  {item.secondary.label}
                </a>
              )}
              {kind === "stock" && isAdmin && item.productId && (
                <QuickRestock productId={item.productId} productName={item.productName ?? item.title} />
              )}
            </div>
          </div>
        </div>
        <span aria-hidden className={`absolute inset-y-3 left-0 w-[3px] rounded-r-full ${toneBar}`} />
      </article>
    </li>
  );
}

export default function NotificationCenter({ stock, debts, subscription, payments, info, hasError, isAdmin }: Props) {
  const all = useMemo(
    () =>
      [...stock, ...debts, ...subscription, ...payments, ...info].sort(
        (a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone],
      ),
    [stock, debts, subscription, payments, info],
  );
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => {
    // Limpa ids de avisos que já não existem (o armazenamento não cresce para sempre).
    const current = new Set(all.map((n) => n.id));
    const kept = readDismissed().filter((id) => current.has(id));
    saveDismissed(kept);
    setDismissed(kept);
    setReady(true);
  }, [all]);

  const visible = all.filter((n) => !dismissed.includes(n.id));
  const hidden = all.filter((n) => dismissed.includes(n.id));
  const countable = visible.filter((n) => n.tone !== "info");

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(COUNT_KEY, String(countable.length));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: countable.length }));
    } catch {
      /* ignora */
    }
  }, [ready, countable.length]);

  function toggle(id: string) {
    setDismissed((current) => {
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      saveDismissed(next);
      return next;
    });
  }

  function hideAll() {
    const next = Array.from(new Set([...dismissed, ...visible.map((n) => n.id)]));
    saveDismissed(next);
    setDismissed(next);
  }

  const matches = (n: NoticeItem) => filter === "all" || (n.kind ?? "info") === filter || (filter === "account" && n.kind === "info");
  const list = (showHidden ? hidden : visible).filter(matches);
  const urgent = visible.filter((n) => n.tone === "danger").length;
  const attention = visible.filter((n) => n.tone === "warning").length;
  const countFor = (key: Filter) => visible.filter((n) => key === "all" || (n.kind ?? "info") === key || (key === "account" && n.kind === "info")).length;

  return (
    <div className="-mx-4 -mt-5 -mb-6 min-h-[calc(100dvh-5rem)] bg-dark-bg px-4 pb-16 pt-6 text-dark-text shadow-[0_0_0_100vmax_theme(colors.dark.bg)] [clip-path:inset(-6rem_-100vmax_-100vmax_-100vmax)] sm:-mx-6 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Alertas</h1>
            <p className="mt-1 text-sm text-dark-muted">
              {!ready
                ? "A verificar…"
                : visible.length === 0
                  ? "Está tudo em dia."
                  : [urgent && `${urgent} urgente${urgent === 1 ? "" : "s"}`, attention && `${attention} de atenção`, visible.length - urgent - attention > 0 && `${visible.length - urgent - attention} informativo${visible.length - urgent - attention === 1 ? "" : "s"}`]
                      .filter(Boolean)
                      .join(" · ")}
            </p>
          </div>
          {ready && !showHidden && visible.length > 1 && (
            <button
              type="button"
              onClick={hideAll}
              className="shrink-0 rounded-xl px-3 py-2 text-sm font-medium text-dark-muted transition hover:bg-white/[0.06] hover:text-dark-text"
            >
              Esconder todos
            </button>
          )}
        </header>

        {hasError && (
          <p role="alert" className="rounded-xl border border-danger/25 bg-danger/[0.08] p-3 text-sm text-danger">
            Alguns alertas não puderam ser carregados. Verifique a internet e actualize a página.
          </p>
        )}

        <LightGlass material="clear" refraction={10} dispersion={0.3}>
          <nav aria-label="Filtrar alertas" className="inline-flex max-w-full gap-1 rounded-full border border-dark-border bg-white/[0.03] p-1">
            {FILTERS.map(({ key, label }) => {
              const n = countFor(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  aria-pressed={filter === key}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    filter === key ? "bg-brand text-onbrand" : "text-dark-muted hover:text-dark-text"
                  }`}
                >
                  {label}
                  {ready && n > 0 && <span className="ml-1 tabular-nums opacity-80">{n}</span>}
                </button>
              );
            })}
          </nav>
        </LightGlass>

        {ready && list.length === 0 ? (
          <div className="cc-glass rounded-2xl border border-dark-border bg-dark-surface px-6 py-12 text-center">
            <CheckCircle2 className="mx-auto h-9 w-9 text-brandGlow" aria-hidden />
            <p className="mt-3 font-semibold">{showHidden ? "Não há alertas escondidos." : "Nada a tratar aqui."}</p>
            <p className="mt-1 text-sm text-dark-muted">
              {showHidden ? "Os alertas que esconder aparecem aqui." : "Avisamos quando houver stock a acabar ou dívidas por receber."}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((item) => (
              <NoticeCard key={item.id} item={item} hidden={showHidden} onToggle={toggle} isAdmin={isAdmin} />
            ))}
          </ul>
        )}

        {ready && (hidden.length > 0 || showHidden) && (
          <button
            type="button"
            onClick={() => setShowHidden((v) => !v)}
            className="mx-auto flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-dark-muted transition hover:bg-white/[0.06] hover:text-dark-text"
          >
            {showHidden ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            {showHidden ? "Voltar aos alertas" : `Mostrar escondidos (${hidden.length})`}
          </button>
        )}
      </div>
    </div>
  );
}
