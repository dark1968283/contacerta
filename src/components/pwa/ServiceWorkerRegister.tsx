"use client";

import { useEffect } from "react";

export type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

declare global {
  interface Window {
    __contacertaInstallPrompt?: DeferredInstallPrompt;
  }
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      window.__contacertaInstallPrompt = event as DeferredInstallPrompt;
      window.dispatchEvent(new Event("contacerta:pwa-install-available"));
    };

    const handleAppInstalled = () => {
      delete window.__contacertaInstallPrompt;
      window.dispatchEvent(new Event("contacerta:pwa-installed"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // A aplicação continua funcional mesmo sem service worker.
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
