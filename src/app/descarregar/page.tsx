import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DownloadOptions } from "./DownloadOptions";

export const metadata: Metadata = {
  title: "Descarregar a app | ContaCerta",
  description:
    "Instale o ContaCerta no telemóvel: app para Android ou atalho no ecrã principal do iPhone.",
  alternates: { canonical: "https://contacertamz.site/descarregar" },
};

export default function DownloadPage() {
  return (
    <main className="force-dark relative min-h-dvh overflow-hidden bg-dark-bg text-dark-text">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-brand/25 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-brandGlow/10 blur-[120px]"
      />

      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10 pt-8">
        <Link href="/" className="flex items-center gap-2.5 self-start">
          <Image src="/icons/icon-192.png" alt="" width={36} height={36} className="rounded-xl" />
          <span className="text-lg font-extrabold tracking-tight">ContaCerta</span>
        </Link>

        <h1 className="mt-10 text-[2rem] font-extrabold leading-tight tracking-tight">
          Leve o seu negócio no bolso
        </h1>
        <p className="mt-3 text-base leading-7 text-dark-muted">
          Venda, veja o stock e saiba quem lhe deve, com um toque. Funciona mesmo quando a
          internet falha.
        </p>

        <DownloadOptions />

        <ul className="mt-8 space-y-3 text-sm text-dark-muted">
          <li className="flex gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brandGlow" />
            Gratuita para descarregar. Usa a mesma conta do site.
          </li>
          <li className="flex gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brandGlow" />
            Ocupa menos de 2 MB e actualiza-se sozinha.
          </li>
          <li className="flex gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brandGlow" />
            Vendas feitas sem internet são enviadas quando a ligação voltar.
          </li>
        </ul>

        <div className="mt-auto pt-10 text-center text-sm text-dark-faint">
          Já tem a app?{" "}
          <Link href="/login" className="font-semibold text-brandGlow hover:underline">
            Entrar na conta
          </Link>
        </div>
      </div>
    </main>
  );
}
