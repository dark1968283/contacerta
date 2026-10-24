"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Download,
  Smartphone,
} from "lucide-react";

export function InstallAppCard() {
  const [installAvailable, setInstallAvailable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [message, setMessage] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");

    const updateInstalledState = () => {
      const navigatorWithStandalone = navigator as Navigator & {
        standalone?: boolean;
      };

      setIsInstalled(
        standaloneQuery.matches || navigatorWithStandalone.standalone === true
      );
    };

    const updateInstallAvailability = () => {
      setInstallAvailable(Boolean(window.__contacertaInstallPrompt));
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallAvailable(false);
      setMessage("ContaCerta instalado com sucesso.");
      setShowInstructions(false);
    };

    const userAgent = navigator.userAgent;
    const appleMobile =
      /iPhone|iPad|iPod/i.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    setIsIOS(appleMobile);
    updateInstalledState();
    updateInstallAvailability();

    window.addEventListener(
      "contacerta:pwa-install-available",
      updateInstallAvailability
    );
    window.addEventListener("contacerta:pwa-installed", handleInstalled);
    standaloneQuery.addEventListener("change", updateInstalledState);

    return () => {
      window.removeEventListener(
        "contacerta:pwa-install-available",
        updateInstallAvailability
      );
      window.removeEventListener("contacerta:pwa-installed", handleInstalled);
      standaloneQuery.removeEventListener("change", updateInstalledState);
    };
  }, []);

  async function installApp() {
    const promptEvent = window.__contacertaInstallPrompt;

    if (!promptEvent) {
      setInstallAvailable(false);
      setShowInstructions(true);
      return;
    }

    setIsInstalling(true);
    setMessage("");

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;

      delete window.__contacertaInstallPrompt;
      setInstallAvailable(false);

      if (choice.outcome === "accepted") {
        setMessage("Pedido de instalação aceite pelo navegador.");
      } else {
        setMessage("Sem problema. Pode instalar mais tarde, quando quiser.");
      }
    } catch {
      setMessage("Não foi possível abrir a instalação. Tente pelo menu do navegador.");
      setShowInstructions(true);
    } finally {
      setIsInstalling(false);
    }
  }

  return (
    <section className="rounded-2xl border border-dark-border bg-dark-surface p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brandGlow/15 bg-brandGlow/10 text-brandGlow">
          <Smartphone size={21} aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-dark-text">
            {isInstalled ? "ContaCerta instalado" : "Instalar ContaCerta"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-dark-muted">
            {isInstalled
              ? "Já pode aceder à aplicação a partir do seu ecrã inicial."
              : "Aceda ao seu negócio directamente do celular, sem precisar de procurar o site no navegador."}
          </p>
        </div>
      </div>

      {!isInstalled && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {installAvailable && (
            <button
              type="button"
              onClick={installApp}
              disabled={isInstalling}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brandGlow px-4 py-2.5 text-sm font-semibold text-dark-bg transition hover:brightness-110 disabled:opacity-60"
            >
              <Download size={16} aria-hidden />
              {isInstalling ? "A abrir instalação…" : "Instalar aplicação"}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowInstructions((current) => !current)}
            aria-expanded={showInstructions}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dark-border bg-dark-bg px-4 py-2.5 text-sm font-medium text-dark-text transition hover:border-brandGlow/40 hover:bg-white/[0.03]"
          >
            {installAvailable ? "Como funciona?" : "Ver como instalar"}
            <ChevronDown
              size={16}
              aria-hidden
              className={`transition-transform ${showInstructions ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      )}

      {showInstructions && !isInstalled && (
        <div className="mt-4 rounded-xl border border-dark-border bg-dark-bg/70 p-4">
          <p className="text-sm font-medium text-dark-text">
            {isIOS
              ? "Adicionar ao ecrã principal"
              : "Instalar pelo navegador"}
          </p>

          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-dark-muted">
            {isIOS ? (
              <>
                <li>Abra o ContaCerta no Safari.</li>
                <li>Toque em Partilhar, na barra do navegador.</li>
                <li>Escolha “Adicionar ao ecrã principal” e confirme.</li>
              </>
            ) : (
              <>
                <li>Abra o menu do navegador (⋮ ou equivalente).</li>
                <li>Procure “Instalar aplicação” ou “Adicionar ao ecrã principal”.</li>
                <li>Se essa opção não aparecer, o navegador pode não suportar a instalação neste momento.</li>
              </>
            )}
          </ol>
        </div>
      )}

      {message && (
        <p
          role="status"
          className="mt-3 flex items-start gap-2 text-sm leading-5 text-dark-muted"
        >
          <CheckCircle2
            size={16}
            className="mt-0.5 shrink-0 text-brandGlow"
            aria-hidden
          />
          {message}
        </p>
      )}

      {!isInstalled && (
        <p className="mt-3 text-xs leading-5 text-dark-faint">
          Opcional. A instalação só começa quando escolher essa opção.
        </p>
      )}
    </section>
  );
}
