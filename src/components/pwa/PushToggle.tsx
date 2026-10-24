"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";

type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function keyToBytes(base64url: string) {
  const padded = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Activar/desactivar avisos no celular (resumo diário às 8h:
 * vendas de ontem, stock a acabar, dívidas em atraso, assinatura).
 */
export function PushToggle({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported || !PUBLIC_KEY) {
        setState(isIos() && !isStandalone() ? "ios-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setState(sub ? "on" : "off");
      } catch {
        setState("off");
      }
    })();
  }, []);

  async function enable() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(PUBLIC_KEY) }));
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage(data.error ?? "Não foi possível activar.");
        return;
      }
      setState("on");
      setMessage("Avisos activados. Todos os dias às 8h recebe o resumo do negócio.");
    } catch {
      setMessage("Não foi possível activar neste aparelho.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/push/teste", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { sent?: number; error?: string };
      setMessage(data.error ?? (data.sent ? "Enviado! Deve chegar em segundos." : "Nenhum aparelho activo."));
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return null;

  const hint: Record<Exclude<State, "loading" | "on" | "off">, string> = {
    unsupported: "Este navegador não recebe avisos. Use o Chrome no Android ou a app instalada.",
    "ios-install": "No iPhone, primeiro adicione o ContaCerta ao ecrã principal e abra-o a partir do ícone.",
    denied: "Os avisos estão bloqueados. Permita-os nas definições do navegador para este site.",
  };

  return (
    <section
      className={`rounded-2xl border border-dark-border bg-dark-surface ${compact ? "p-4" : "p-4 sm:p-5"}`}
      aria-label="Avisos no celular"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/15">
          {state === "on" ? (
            <BellRing className="h-5 w-5 text-brandGlow" aria-hidden />
          ) : state === "off" ? (
            <Bell className="h-5 w-5 text-brandGlow" aria-hidden />
          ) : (
            <BellOff className="h-5 w-5 text-dark-muted" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-dark-text">Avisos no celular</h2>
          <p className="mt-0.5 text-sm text-dark-muted">
            {state === "on"
              ? "Activos. Recebe às 8h as vendas de ontem, o stock a acabar e as dívidas em atraso."
              : state === "off"
                ? "Receba às 8h as vendas de ontem, o stock a acabar e as dívidas em atraso, mesmo com a app fechada."
                : hint[state]}
          </p>

          {(state === "on" || state === "off") && (
            <div className="mt-3 flex flex-wrap gap-2">
              {state === "off" ? (
                <button
                  type="button"
                  onClick={enable}
                  disabled={busy}
                  className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-onbrand hover:bg-brand/90 disabled:opacity-60"
                >
                  {busy ? "A activar…" : "Activar avisos"}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={test}
                    disabled={busy}
                    className="rounded-xl border border-dark-borderStrong px-4 py-2.5 text-sm font-semibold text-dark-text hover:bg-white/[0.05] disabled:opacity-60"
                  >
                    Enviar teste
                  </button>
                  <button
                    type="button"
                    onClick={disable}
                    disabled={busy}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-dark-muted hover:bg-white/[0.05] disabled:opacity-60"
                  >
                    Desactivar
                  </button>
                </>
              )}
            </div>
          )}
          {message && <p className="mt-2 text-sm text-dark-text">{message}</p>}
        </div>
      </div>
    </section>
  );
}
