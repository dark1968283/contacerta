import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Package, ShoppingCart, WalletCards, WifiOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "ContaCerta — Gestão de vendas, stock e dívidas para pequenos negócios",
  description:
    "ContaCerta é uma app simples para pequenos negócios em Moçambique registarem vendas, controlarem o stock, os clientes e as dívidas.",
  alternates: { canonical: "https://contacertamz.site" },
};

const features = [
  {
    Icon: ShoppingCart,
    title: "Vender num toque",
    text: "Toque nos produtos, escolha se pagou ou fica a dever, e a venda fica registada.",
  },
  {
    Icon: Package,
    title: "Stock sempre certo",
    text: "Cada venda tira do stock sozinha. Sabe logo o que está a acabar.",
  },
  {
    Icon: WalletCards,
    title: "Dívidas organizadas",
    text: "Veja quem lhe deve e envie um lembrete por WhatsApp.",
  },
  {
    Icon: WifiOff,
    title: "Funciona sem internet",
    text: "Continue a vender quando a rede falha. Tudo é enviado quando voltar.",
  },
];

/**
 * Página inicial pública do ContaCerta.
 * Quem já tem sessão vai directo para o painel; os restantes (e o Google,
 * na verificação da marca) vêem o nome, o logótipo e o que a app faz.
 */
export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="force-dark relative min-h-dvh overflow-hidden bg-dark-bg text-dark-text">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-brand/25 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-[30rem] h-[30rem] w-[30rem] rounded-full bg-brandGlow/10 blur-[120px]"
      />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="ContaCerta">
          <Image src="/icons/icon-512.png" alt="Logótipo ContaCerta" width={40} height={40} priority />
          <span className="text-xl font-extrabold tracking-tight">ContaCerta</span>
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-dark-borderStrong px-4 py-2 text-sm font-semibold hover:bg-dark-surface"
        >
          Entrar
        </Link>
      </header>

      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
        <div>
          {/* Logótipo oficial (o mesmo do ecrã de início de sessão com Google). */}
          <Image
            src="/images/contacerta-google-branding-1024.png"
            alt="ContaCerta — logótipo"
            width={1024}
            height={1024}
            priority
            className="h-28 w-28 rounded-3xl shadow-xl sm:h-32 sm:w-32"
          />
          <h1 className="mt-8 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
            O seu negócio.
            <br />
            <span className="text-brandGlow">Sob controlo.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-dark-muted">
            A forma mais simples de registar vendas, controlar o stock e saber quem lhe deve.
            Feito para pequenos negócios em Moçambique, em Meticais.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-brandGlow px-7 text-base font-bold text-onglow"
            >
              Criar conta grátis <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/descarregar"
              className="flex h-14 items-center justify-center rounded-2xl border border-dark-borderStrong px-7 text-base font-semibold hover:bg-dark-surface"
            >
              Descarregar a app
            </Link>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-sm justify-center gap-4">
          <Image
            src="/screenshots/inicio.webp"
            alt="Ecrã inicial do ContaCerta com o resumo do negócio"
            width={739}
            height={1514}
            className="w-1/2 rounded-[1.75rem] border border-dark-border shadow-2xl"
          />
          <Image
            src="/screenshots/nova-venda.webp"
            alt="Ecrã de nova venda do ContaCerta"
            width={739}
            height={1514}
            className="mt-10 w-1/2 rounded-[1.75rem] border border-dark-border shadow-2xl"
          />
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ Icon, title, text }) => (
            <div key={title} className="rounded-3xl border border-dark-border bg-dark-surface/60 p-5">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/20">
                <Icon className="h-5 w-5 text-brandGlow" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-bold">{title}</h2>
              <p className="mt-1.5 text-sm leading-6 text-dark-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative border-t border-dark-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-dark-faint sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Image src="/icons/icon-192.png" alt="" width={24} height={24} />
            <span>© {new Date().getFullYear()} ContaCerta</span>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/politica-de-privacidade" className="hover:text-dark-text">
              Política de Privacidade
            </Link>
            <Link href="/termos-de-servico" className="hover:text-dark-text">
              Termos de Serviço
            </Link>
            <a href="mailto:fernandoorlandobanda@gmail.com" className="hover:text-dark-text">
              Contacto
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
