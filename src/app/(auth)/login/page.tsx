"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff, Wallet, WalletCards, Package } from "lucide-react";
import { signIn, type AuthActionState } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

const initialState: AuthActionState = { error: null };

const highlights = [
  { Icon: Wallet, text: "Registe vendas em segundos" },
  { Icon: WalletCards, text: "Saiba sempre quem lhe deve dinheiro" },
  { Icon: Package, text: "Acompanhe o stock em tempo real" },
];

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex min-h-dvh bg-dark-bg">
      {/* Painel de marca — visível a partir de lg:, escondido em mobile. */}
      <div className="relative hidden w-[42%] shrink-0 overflow-hidden bg-dark-elevated lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:repeating-linear-gradient(135deg,#fff_0px,#fff_1px,transparent_1px,transparent_16px)]" />

        <div className="relative flex items-center gap-2">
          <Image src="/icons/icon-192.png" alt="" width={32} height={32} className="rounded-lg" />
          <span className="text-lg font-semibold text-dark-text">ContaCerta</span>
        </div>

        <div className="relative max-w-sm">
          <p className="text-3xl font-semibold leading-tight tracking-tight text-dark-text">
            O seu negócio. Sob controlo.
          </p>
          <ul className="mt-8 space-y-4">
            {highlights.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-dark-muted">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5">
                  <Icon className="h-4 w-4 text-brandGlow" aria-hidden />
                </span>
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-dark-faint">Feito para pequenos negócios em Moçambique.</p>
      </div>

      {/* Formulário */}
      <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Image src="/icons/icon-192.png" alt="" width={28} height={28} className="rounded-lg" />
            <span className="font-semibold text-dark-text">ContaCerta</span>
          </div>

          <h1 className="text-2xl font-semibold text-dark-text">Entrar</h1>
          <p className="mt-1 text-sm text-dark-muted">Aceda à sua conta ContaCerta.</p>

          <form action={formAction} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-dark-muted">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-faint" aria-hidden />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="voce@exemplo.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-base text-dark-text outline-none transition-colors placeholder:text-dark-faint focus:border-brandGlow"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-dark-muted">
                Palavra-passe
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-faint" aria-hidden />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-11 text-base text-dark-text outline-none transition-colors placeholder:text-dark-faint focus:border-brandGlow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Esconder palavra-passe" : "Mostrar palavra-passe"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-faint transition-colors hover:text-dark-text"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </button>
              </div>
            </div>

            {state.error && <p className="text-sm text-danger">{state.error}</p>}

            <SubmitButton>Entrar</SubmitButton>
          </form>

          <p className="mt-8 text-center text-sm text-dark-muted">
            Ainda não tem conta?{" "}
            <Link href="/signup" className="font-medium text-brandGlow">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}