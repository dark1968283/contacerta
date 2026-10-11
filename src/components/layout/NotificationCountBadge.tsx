"use client";

import { useEffect, useState } from "react";

const COUNT_KEY = "contacerta-unread-notifications";
const EVENT_NAME = "contacerta-notifications-updated";

export function NotificationCountBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function readCount() {
      try {
        const value = Number(localStorage.getItem(COUNT_KEY) ?? 0);
        setCount(Number.isFinite(value) ? Math.max(0, value) : 0);
      } catch {
        setCount(0);
      }
    }

    function onUpdate(event: Event) {
      const value = (event as CustomEvent<number>).detail;
      if (typeof value === "number") setCount(Math.max(0, value));
      else readCount();
    }

    readCount();
    window.addEventListener(EVENT_NAME, onUpdate);
    window.addEventListener("storage", readCount);
    return () => {
      window.removeEventListener(EVENT_NAME, onUpdate);
      window.removeEventListener("storage", readCount);
    };
  }, []);

  if (count < 1) return null;

  return (
    <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
