"use client";

import { useEffect, useState } from "react";
import { clearOfflinePages } from "@/lib/offline-pages";
import { useFormState } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Package,
  ShieldCheck,
  Wallet,
  WalletCards,
} from "lucide-react";
import { signIn, signInWithGoogle, type AuthActionState } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { GoogleIcon } from "@/components/ui/GoogleIcon";

const initialState: AuthActionState = { error: null };

const highlights = [
  {
    Icon: Wallet,
    title: "Vendas sob controlo",
    description: "Registe e acompanhe cada venda.",
  },
  {
    Icon: WalletCards,
    title: "Dívidas organizadas",
    description: "Saiba quanto tem a receber.",
  },
  {
    Icon: Package,
    title: "Stock actualizado",
    description: "Acompanhe os produtos do negócio.",
  },
];

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const [state, formAction] = useFormState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);

  // Ao chegar ao login (por ex. depois de "Sair"), apaga as páginas do negócio
  // que estavam guardadas no telemóvel para uso sem internet.
  useEffect(() => {
    clearOfflinePages();
  }, []);

  return (
    <main className="force-dark min-h-dvh bg-dark-bg text-dark-text lg:grid lg:grid-cols-[0.92fr_1.08fr]">
      {/* Painel de identidade */}
      <section className="relative hidden min-h-dvh flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-[#0D1713] p-10 xl:p-14 lg:flex">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.60]"
      style={{ backgroundImage: "url('/images/payments/transferir.jpg')" }}
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0D1713]/80 via-[#0D1713]/65 to-[#0D1713]/90"
    />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-36 -top-36 h-[30rem] w-[30rem] rounded-full bg-brand/20 blur-[100px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-28 h-[34rem] w-[34rem] rounded-full bg-brandGlow/[0.10] blur-[110px]"
        />
        

        <Link href="/login" className="relative flex w-fit items-center gap-3">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={42}
            height={42}
            priority
            className="rounded-[13px] ring-1 ring-white/10"
          />
          <span className="text-xl font-semibold tracking-tight">
            ContaCerta
          </span>
        </Link>

        <div className="relative my-12 max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brandGlow/20 bg-brandGlow/[0.08] px-3.5 py-2 text-xs font-medium text-[#8CE6AF]">
            <span className="h-1.5 w-1.5 rounded-full bg-brandGlow" />
            Gestão simples para o seu negócio
          </div>

          <h1 className="max-w-lg text-4xl font-semibold leading-[1.13] tracking-[-0.04em] text-white xl:text-5xl">
            O seu negócio.
            <span className="mt-1 block text-[#71D99A]">
              Sob controlo.
            </span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-7 text-white/55">
            Vendas, stock, clientes e dívidas num só lugar. Menos confusão
            no dia-a-dia, mais clareza para tomar decisões.
          </p>

          <div className="mt-10 space-y-5">
            {highlights.map(({ Icon, title, description }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                  <Icon
                    className="h-[19px] w-[19px] text-[#71D99A]"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">{title}</p>
                  <p className="mt-1 text-sm text-white/45">{description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Elemento visual decorativo, sem dados reais do utilizador */}
          <div className="mt-12 max-w-md rounded-2xl border border-white/[0.10] bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-white/45">O seu negócio, organizado</p>
                <p className="mt-1.5 text-sm font-medium text-white/90">
                  Tudo num só lugar
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brandGlow/10 text-[#71D99A]">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {["Vendas", "Stock", "Dívidas"].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/[0.07] bg-black/10 px-3 py-3"
                >
                  <div className="mb-3 h-1.5 w-7 rounded-full bg-brandGlow/70" />
                  <p className="text-xs text-white/60">{item}</p>
                  <div className="mt-2 h-1 w-full rounded-full bg-white/[0.08]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="relative text-xs text-white/35">
          Feito para pequenos negócios em Moçambique.
        </p>
      </section>

      {/* Área de autenticação */}
      <section className="relative flex min-h-dvh flex-col justify-center px-5 py-8 sm:px-10 lg:px-12 xl:px-20">
        <div className="mx-auto w-full max-w-[420px]">
          <Link
            href="/login"
            className="mb-10 flex w-fit items-center gap-2.5 lg:hidden"
          >
            <Image
              src="/icons/icon-192.png"
              alt=""
              width={34}
              height={34}
              priority
              className="rounded-[10px]"
            />
            <span className="text-lg font-semibold tracking-tight">
              ContaCerta
            </span>
          </Link>

          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#71D99A]">
              Bem-vindo de volta
            </p>
            <h2 className="text-[30px] font-semibold tracking-[-0.035em] text-white sm:text-[34px]">
              Entre na sua conta
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Introduza os seus dados para continuar a gerir o seu negócio.
            </p>
          </div>

          {searchParams.error === "invite" && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3.5 text-sm leading-6 text-[#FFAAA2]"
            >
              Não foi possível concluir a associação do convite. A sua sessão
              pode já estar activa. Tente entrar novamente ou contacte o
              suporte se o problema continuar.
            </div>
          )}

          {searchParams.error === "google" && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3.5 text-sm leading-6 text-[#FFAAA2]"
            >
              Não foi possível iniciar a sessão com Google. Tente novamente.
            </div>
          )}

          <div className="mobile-login-card rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.12)] transition duration-300 hover:border-white/[0.13] hover:bg-white/[0.035] hover:shadow-[0_20px_55px_rgba(0,0,0,0.2)] active:scale-[0.997] sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:hover:border-0 sm:hover:bg-transparent sm:hover:shadow-none sm:active:scale-100">
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="flex min-h-[50px] w-full items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.035] px-4 py-3 text-sm font-medium text-white/90 transition duration-200 hover:border-white/20 hover:bg-white/[0.075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#71D99A] focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg"
            >
              <GoogleIcon />
              Continuar com Google
              <ArrowRight className="ml-auto h-4 w-4 text-white/35" aria-hidden="true" />
            </button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/[0.09]" />
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/35">
              ou entre com email
            </span>
            <div className="h-px flex-1 bg-white/[0.09]" />
          </div>

          <form action={formAction} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[13px] font-medium text-white/75"
              >
                Endereço de email
              </label>
              <div className="group relative">
                <Mail
                  className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-[#71D99A]"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="voce@exemplo.com"
                  className="min-h-[51px] w-full rounded-xl border border-white/[0.10] bg-white/[0.035] pl-11 pr-4 text-base text-white outline-none transition duration-200 placeholder:text-white/25 hover:border-white/[0.16] focus:border-[#71D99A]/70 focus:bg-white/[0.055] focus:ring-4 focus:ring-[#71D99A]/[0.08]"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-[13px] font-medium text-white/75"
                >
                  Palavra-passe
                </label>
              </div>
              <div className="group relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-[#71D99A]"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Introduza a sua palavra-passe"
                  className="min-h-[51px] w-full rounded-xl border border-white/[0.10] bg-white/[0.035] py-3 pl-11 pr-12 text-base text-white outline-none transition duration-200 placeholder:text-white/25 hover:border-white/[0.16] focus:border-[#71D99A]/70 focus:bg-white/[0.055] focus:ring-4 focus:ring-[#71D99A]/[0.08]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={
                    showPassword
                      ? "Esconder palavra-passe"
                      : "Mostrar palavra-passe"
                  }
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#71D99A]"
                >
                  {showPassword ? (
                    <EyeOff className="h-[17px] w-[17px]" aria-hidden="true" />
                  ) : (
                    <Eye className="h-[17px] w-[17px]" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {state.error && (
              <div
                role="alert"
                className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm leading-6 text-[#FFAAA2]"
              >
                <p>{state.error}</p>
                {state.emailNotConfirmed && state.email && (
                  <Link
                    href={`/verificar-email?email=${encodeURIComponent(state.email)}`}
                    className="mt-2 inline-flex items-center gap-1.5 font-medium text-[#FFCCC7] underline underline-offset-4 hover:text-white"
                  >
                    Ver opções de confirmação
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>
            )}

            <SubmitButton>Entrar na minha conta</SubmitButton>
          </form>
          </div>

          <div className="mt-7 flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-[#71D99A]"
              aria-hidden="true"
            />
            <p className="text-xs leading-5 text-white/45">
              Os seus dados de negócio são protegidos e associados à sua conta.
            </p>
          </div>

          <p className="mt-8 text-center text-sm text-white/50">
            Ainda não tem conta?{" "}
            <Link
              href="/signup"
              className="font-semibold text-[#71D99A] transition hover:text-[#A1F0BC]"
            >
              Criar conta
            </Link>
          </p>

          <p className="mt-8 text-center text-[11px] text-white/25 lg:hidden">
            O seu negócio. Sob controlo.
          </p>
        </div>
      </section>
    </main>
  );
}
