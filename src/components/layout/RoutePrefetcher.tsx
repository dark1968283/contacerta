"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Prepara em segundo plano as páginas principais logo após o login, para
 * abrirem instantaneamente ao tocar no menu (sem os segundos de espera).
 *
 * - Usa o pré-carregamento do próprio Next.js (router.prefetch), que guarda
 *   a página pronta no browser durante ~5 minutos.
 * - Renova a cada 4 minutos enquanto a app está aberta e visível.
 * - Pede uma página de cada vez, com pausas, para não sobrecarregar a rede
 *   em telemóveis com internet fraca.
 * - Depois de vender/repor/etc. o Next limpa estas cópias; voltamos a
 *   prepará-las no minuto seguinte, com os dados novos.
 */
const ROUTES = [
  "/dashboard",
  "/dashboard/vendas/nova",
  "/dashboard/produtos",
  "/dashboard/dividas",
  "/dashboard/vendas",
  "/dashboard/clientes",
  "/dashboard/notificacoes",
  "/dashboard/mais",
];

const REFRESH_MS = 4 * 60 * 1000;
const AFTER_NAV_MIN_MS = 60 * 1000;

function idle(cb: () => void) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(cb, { timeout: 2000 });
  else window.setTimeout(cb, 300);
}

export function RoutePrefetcher() {
  const router = useRouter();
  const pathname = usePathname();
  const lastRun = useRef(0);
  const running = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (running.current || cancelled) return;
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;
      if (document.visibilityState !== "visible") return;
      // Poupança de dados activada no celular: não pré-carrega.
      const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      if (conn?.saveData) return;

      running.current = true;
      lastRun.current = Date.now();
      const queue = ROUTES.filter((r) => r !== window.location.pathname);
      const next = () => {
        if (cancelled || !queue.length) {
          running.current = false;
          return;
        }
        const route = queue.shift()!;
        try {
          router.prefetch(route);
        } catch {
          /* ignora */
        }
        window.setTimeout(() => idle(next), 350);
      };
      idle(next);
    };

    // Primeira preparação pouco depois de abrir a app.
    const first = window.setTimeout(run, 800);
    const timer = window.setInterval(run, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRun.current > AFTER_NAV_MIN_MS) run();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", run);

    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", run);
    };
  }, [router]);

  // Depois de mudar de página (e de acções que limpam as cópias), volta a preparar.
  useEffect(() => {
    if (Date.now() - lastRun.current < AFTER_NAV_MIN_MS) return;
    const t = window.setTimeout(() => {
      if (running.current) return;
      lastRun.current = Date.now();
      for (const [i, route] of ROUTES.entries()) {
        window.setTimeout(() => {
          try {
            router.prefetch(route);
          } catch {
            /* ignora */
          }
        }, 400 * i);
      }
    }, 1500);
    return () => window.clearTimeout(t);
  }, [pathname, router]);

  return null;
}
