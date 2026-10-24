"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { Banknote, Building2, CheckCircle2, Package, Store, WalletCards } from "lucide-react";
import { createBusiness } from "./actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { AuthActionState } from "../(auth)/actions";

const initialState: AuthActionState = { error: null };

const highlights = [
  { Icon: Package, title: "Produtos organizados", description: "Tenha o stock mais controlado." },
  { Icon: WalletCards, title: "Valores a receber", description: "Saiba o que os clientes devem." },
  { Icon: Banknote, title: "Gestão financeira", description: "Acompanhe o movimento do negócio." },
];

export default function OnboardingPage() {
  const [state, formAction] = useFormState(createBusiness, initialState);

  return (
    <main className="force-dark min-h-dvh bg-dark-bg text-dark-text lg:grid lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="relative hidden min-h-dvh flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-[#0D1713] p-10 lg:flex xl:p-14">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.60]"
      style={{ backgroundImage: "url('/images/payments/transferir.jpg')" }}
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0D1713]/80 via-[#0D1713]/65 to-[#0D1713]/90"
    />
        
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-brand/10 blur-[100px]" />

        <Link href="/login" className="relative flex w-fit items-center gap-3">
          <Image src="/icons/icon-192.png" alt="" width={42} height={42} priority className="rounded-[13px] ring-1 ring-white/10" />
          <span className="text-xl font-semibold tracking-tight">ContaCerta</span>
        </Link>

        <div className="relative my-12 max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brandGlow/20 bg-brandGlow/[0.07] px-3.5 py-2 text-xs font-medium text-[#8CE6AF]">
            <span className="h-1.5 w-1.5 rounded-full bg-brandGlow" />
            Só falta um passo
          </div>

          <h1 className="max-w-lg text-4xl font-semibold leading-[1.13] tracking-[-0.04em] text-white xl:text-5xl">
            O seu negócio.
            <span className="mt-1 block text-[#71D99A]">Sob controlo.</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-7 text-white/50">
            Dê um nome ao seu espaço para começar a organizar vendas, stock, clientes e valores a receber.
          </p>

          <div className="mt-9 space-y-5">
            {highlights.map(({ Icon, title, description }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025]">
                  <Icon className="h-[19px] w-[19px] text-[#71D99A]" strokeWidth={1.7} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/85">{title}</p>
                  <p className="mt-1 text-sm text-white/40">{description}</p>
                </div>
              </div>
            ))}
          </div>

          <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 right-0 flex items-center gap-3 opacity-[0.07]">
            <Package className="h-16 w-16" strokeWidth={1} />
            <WalletCards className="h-20 w-20" strokeWidth={1} />
            <Banknote className="h-14 w-14" strokeWidth={1} />
          </div>
        </div>

        <p className="relative text-xs text-white/30">Feito para pequenos negócios em Moçambique.</p>
      </aside>

      <section className="flex min-h-dvh flex-col justify-center px-5 py-8 sm:px-10 lg:px-12 xl:px-20">
        <div className="mx-auto w-full max-w-[420px]">
          <Link href="/login" className="mb-10 flex w-fit items-center gap-2.5 lg:hidden">
            <Image src="/icons/icon-192.png" alt="" width={34} height={34} priority className="rounded-[10px]" />
            <span className="text-lg font-semibold tracking-tight">ContaCerta</span>
          </Link>

          <div className="mb-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-brandGlow/15 bg-brandGlow/[0.08] text-[#71D99A]">
              <Building2 className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#71D99A]">Configuração inicial</p>
            <h2 className="text-[30px] font-semibold tracking-[-0.035em] text-white sm:text-[34px]">Como se chama o seu negócio?</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Este nome identifica o seu negócio no ContaCerta. Pode alterá-lo mais tarde.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-[13px] font-medium text-white/75">Nome do negócio</label>
              <div className="group relative">
                <Store className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-white/35 transition-colors group-focus-within:text-[#71D99A]" aria-hidden="true" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoFocus
                  autoComplete="organization"
                  required
                  maxLength={100}
                  placeholder="Ex.: Loja do Bairro"
                  className="min-h-[51px] w-full rounded-xl border border-white/[0.10] bg-white/[0.035] pl-11 pr-4 text-base text-white outline-none transition placeholder:text-white/25 hover:border-white/[0.16] focus:border-[#71D99A]/70 focus:bg-white/[0.055] focus:ring-4 focus:ring-[#71D99A]/[0.08]"
                />
              </div>
              <p className="mt-2 text-xs leading-5 text-white/35">Pode usar o nome da loja, mercearia ou actividade.</p>
            </div>

            {state.error && (
              <div role="alert" className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm leading-6 text-[#FFAAA2]">
                {state.error}
              </div>
            )}

            <SubmitButton>Continuar</SubmitButton>
          </form>

          <div className="mt-7 flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#71D99A]" aria-hidden="true" />
            <p className="text-xs leading-5 text-white/40">Pode alterar o nome do negócio mais tarde nas definições.</p>
          </div>

          <p className="mt-8 text-center text-[11px] text-white/25 lg:hidden">O seu negócio. Sob controlo.</p>
        </div>
      </section>
    </main>
  );
}
