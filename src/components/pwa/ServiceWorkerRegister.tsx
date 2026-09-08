"use client";

import { useEffect } from "react";

/**
 * Regista o service worker (public/sw.js) apenas no browser, depois da
 * página carregar. Não usa nenhuma biblioteca externa. Não faz nada no
 * servidor — o "use client" + useEffect garante isso.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registo falhou (ex.: browser sem suporte, ambiente de dev
        // estrito) — a aplicação continua a funcionar normalmente sem
        // o service worker, por isso o erro é silenciosamente ignorado.
      });
    };

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
