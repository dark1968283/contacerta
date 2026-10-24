"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, ShieldCheck } from "lucide-react";

type Platform = "android" | "ios" | "other";

const APK_URL = "/download/ContaCerta.apk";

function detect(): Platform {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  // iPadOS apresenta-se como Mac, mas tem ecrã táctil.
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) {
    return "ios";
  }
  return "other";
}

function AndroidCard({ highlight }: { highlight: boolean }) {
  return (
    <section
      className={`rounded-3xl border p-5 ${
        highlight ? "border-brandGlow/40 bg-brand/15" : "border-dark-border bg-dark-surface/60"
      }`}
    >
      <h2 className="text-lg font-bold">Android</h2>
      <a
        href={APK_URL}
        download="ContaCerta.apk"
        className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brandGlow text-base font-bold text-onglow active:scale-[0.98]"
      >
        <Download className="h-5 w-5" aria-hidden="true" />
        Descarregar app (1,5 MB)
      </a>
      <ol className="mt-4 space-y-2 text-sm leading-6 text-dark-muted">
        <li>
          <b className="text-dark-text">1.</b> Toque em <b className="text-dark-text">Descarregar app</b>.
        </li>
        <li>
          <b className="text-dark-text">2.</b> Abra o ficheiro <b className="text-dark-text">ContaCerta.apk</b>{" "}
          quando terminar.
        </li>
        <li>
          <b className="text-dark-text">3.</b> Se o telemóvel pedir, permita{" "}
          <b className="text-dark-text">instalar apps desta origem</b> e toque em{" "}
          <b className="text-dark-text">Instalar</b>.
        </li>
      </ol>
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-dark-faint">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brandGlow" aria-hidden="true" />
        O aviso aparece porque a app ainda não está na Play Store. É a app oficial do
        ContaCerta, assinada por nós.
      </p>
    </section>
  );
}

function IosCard({ highlight }: { highlight: boolean }) {
  return (
    <section
      className={`rounded-3xl border p-5 ${
        highlight ? "border-brandGlow/40 bg-brand/15" : "border-dark-border bg-dark-surface/60"
      }`}
    >
      <h2 className="text-lg font-bold">iPhone</h2>
      <p className="mt-1 text-sm text-dark-muted">No Safari, em 2 passos:</p>
      <ol className="mt-4 space-y-3 text-sm leading-6 text-dark-muted">
        <li className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-dark-elevated">
            <Share className="h-5 w-5 text-brandGlow" aria-hidden="true" />
          </span>
          <span>
            Toque em <b className="text-dark-text">Partilhar</b>, no fundo do ecrã.
          </span>
        </li>
        <li className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-dark-elevated">
            <SquarePlus className="h-5 w-5 text-brandGlow" aria-hidden="true" />
          </span>
          <span>
            Escolha <b className="text-dark-text">Adicionar ao ecrã principal</b>.
          </span>
        </li>
      </ol>
      <p className="mt-4 text-xs leading-5 text-dark-faint">
        O ícone do ContaCerta aparece junto das outras apps e abre em ecrã inteiro.
      </p>
    </section>
  );
}

export function DownloadOptions() {
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    setPlatform(detect());
  }, []);

  // Antes de saber o aparelho (ou num computador), mostra as duas opções.
  if (platform === "ios") {
    return (
      <div className="mt-8 space-y-4">
        <IosCard highlight />
      </div>
    );
  }
  if (platform === "android") {
    return (
      <div className="mt-8 space-y-4">
        <AndroidCard highlight />
      </div>
    );
  }
  return (
    <div className="mt-8 space-y-4">
      <AndroidCard highlight={false} />
      <IosCard highlight={false} />
    </div>
  );
}
