"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "contacerta-dismissed-notifications";
const COUNT_KEY = "contacerta-unread-notifications";
const EVENT_NAME = "contacerta-notifications-updated";

function readDismissed(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Número de avisos por ler.
 * Com `ids` (vindos do servidor em cada página), conta os avisos actuais que
 * o utilizador ainda não escondeu — fica sempre certo. Sem `ids`, usa o
 * último número guardado pela página de Notificações.
 */
export function NotificationCountBadge({ ids }: { ids?: string[] }) {
  const [count, setCount] = useState(0);
  const key = ids?.join("|");

  useEffect(() => {
    function recompute() {
      if (ids) {
        const dismissed = readDismissed();
        setCount(ids.filter((id) => !dismissed.includes(id)).length);
        return;
      }
      try {
        const value = Number(localStorage.getItem(COUNT_KEY) ?? 0);
        setCount(Number.isFinite(value) ? Math.max(0, value) : 0);
      } catch {
        setCount(0);
      }
    }

    recompute();
    window.addEventListener(EVENT_NAME, recompute);
    window.addEventListener("storage", recompute);
    return () => {
      window.removeEventListener(EVENT_NAME, recompute);
      window.removeEventListener("storage", recompute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (count < 1) return null;

  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-onbrand">
      {count > 99 ? "99+" : count}
    </span>
  );
}
