"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Trash2, X } from "lucide-react";

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  action: string;
  tone?: "warning" | "danger" | "info";
};

const STORAGE_KEY = "contacerta-dismissed-notifications";
const COUNT_KEY = "contacerta-unread-notifications";
const EVENT_NAME = "contacerta-notifications-updated";

function readDismissed(): string[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function NotificationCard({
  item,
  onDismiss,
}: {
  item: NotificationItem;
  onDismiss: (id: string) => void;
}) {
  const toneClasses = {
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    info: "bg-white/[0.05] text-dark-text",
  };

  function dismiss() {
    onDismiss(item.id);
  }

  return (
    <article className="flex items-start gap-2.5 rounded-xl border border-dark-border bg-white/[0.02] p-3 sm:items-center sm:gap-3 sm:p-4">
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:mt-0 sm:h-9 sm:w-9 ${
          toneClasses[item.tone ?? "warning"]
        }`}
      >
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
          onClick={dismiss}
          className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-dark-border px-2.5 py-1.5 text-xs font-medium text-dark-text transition hover:border-brandGlow/30 hover:bg-brandGlow/5 sm:mt-2.5"
        >
          {item.action}
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={dismiss}
          aria-label={`Marcar como vista: ${item.title}`}
          title="Marcar como vista"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-dark-muted transition hover:bg-white/[0.06] hover:text-dark-text"
        >
          <X size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={`Apagar notificação: ${item.title}`}
          title="Apagar notificação"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-dark-muted transition hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export function useNotificationDismissals(initialCount: number) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDismissed(readDismissed());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    try {
      const count = Math.max(0, initialCount - dismissed.length);
      localStorage.setItem(COUNT_KEY, String(count));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: count }));
    } catch {
      // A lista continua utilizável mesmo se o navegador bloquear o armazenamento.
    }
  }, [dismissed, initialCount, ready]);

  function dismiss(id: string) {
    setDismissed((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Mantém a remoção na interface mesmo sem armazenamento disponível.
      }

      return next;
    });
  }

  return {
    ready,
    dismissed,
    dismiss,
  };
}
