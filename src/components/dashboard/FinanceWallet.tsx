"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Eye,
  EyeOff,
  ArrowUpRight,
  Wifi,
  ShieldCheck,
} from "lucide-react";

type FinanceWalletProps = {
  profit: string;
  sales: string;
  received: string;
  outstanding: string;
  periodLabel: string;
  hasProfitData: boolean;
  /** Linha por baixo do lucro (ex.: despesas já descontadas). */
  profitNote?: string;
};

export function FinanceWallet({
  profit,
  sales,
  received,
  outstanding,
  periodLabel,
  hasProfitData,
  profitNote,
}: FinanceWalletProps) {
  const [hidden, setHidden] = useState(false);
  const reduceMotion = useReducedMotion();

  const metrics = [
    {
      label: "Vendas",
      value: sales,
      description: "Total vendido no período",
      color: "text-dark-text",
      marker: "bg-white/50",
    },
    {
      label: "Recebido",
      value: received,
      description: "Pagamentos recebidos no período",
      color: "text-accent",
      marker: "bg-accent",
    },
    {
      label: "A receber",
      value: outstanding,
      description: "Dívidas ainda em aberto",
      color: "text-warning",
      marker: "bg-warning",
    },
  ];

  const display = (value: string) =>
    hidden ? "••••••••" : value;

  return (
    <section
      aria-label="Resumo financeiro"
      className="grid grid-cols-1 items-center gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(250px,0.65fr)] lg:gap-6"
    >
      {/* Cartão físico estilizado à esquerda no desktop */}
      <div className="force-dark w-full min-w-0">
        <motion.article
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.35 }}
          className="group relative isolate aspect-[1.586/1] w-full overflow-hidden rounded-[5.5%/8.7%] border border-white/[0.16] bg-[#10251C] text-white shadow-[0_24px_55px_-24px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)]"
        >
          {/* Base verde escura com acabamento mate */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(122deg,#1B4431 0%,#143423 30%,#10251C 66%,#09150F 100%)",
            }}
          />

          {/* Linhas ornamentais desenhadas, sem imagens externas */}
          <svg
            aria-hidden="true"
            viewBox="0 0 600 380"
            preserveAspectRatio="xMidYMid slice"
            className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
            fill="none"
          >
            <defs>
              <linearGradient id="walletLine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#78E6A0" stopOpacity=".28" />
                <stop offset="100%" stopColor="#D6C58B" stopOpacity=".02" />
              </linearGradient>
            </defs>
            <path d="M360 -35 C510 45 430 130 620 175" stroke="url(#walletLine)" strokeWidth="1.2" />
            <path d="M325 -30 C470 48 395 135 610 205" stroke="url(#walletLine)" strokeWidth="1" />
            <path d="M292 -20 C435 55 365 145 600 235" stroke="url(#walletLine)" strokeWidth=".8" />
            <circle cx="520" cy="55" r="100" stroke="#FFFFFF" strokeOpacity=".055" />
            <circle cx="520" cy="55" r="78" stroke="#FFFFFF" strokeOpacity=".045" />
            <path d="M0 310 C115 260 165 355 300 325 S485 275 620 325" stroke="#78E6A0" strokeOpacity=".07" />
          </svg>

          {/* Reflexo superior e textura visual */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 opacity-30"
            style={{
              background:
                "radial-gradient(ellipse at 12% 0%,rgba(255,255,255,.12),transparent 42%)",
            }}
          />

          {/* Marca de água com o símbolo original do ContaCerta */}
          <img
            src="/icons/icon-512.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute right-[4%] top-1/2 z-0 h-[72%] w-auto max-w-[52%] -translate-y-1/2 object-contain opacity-[0.07] grayscale mix-blend-screen"
          />

          <div className="relative z-10 flex h-full flex-col justify-between p-[5.5%] sm:p-[6%]">
            {/* Marca */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#78E6A0]/25 bg-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] sm:h-10 sm:w-10 sm:rounded-xl">
                  <img
                    src="/icons/icon-192.png"
                    alt=""
                    aria-hidden="true"
                    className="h-7 w-7 rounded-md object-contain sm:h-9 sm:w-9"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold tracking-[0.16em] sm:text-sm">
                    CONTACERTA
                  </p>
                  <p className="mt-0.5 truncate text-[9px] tracking-wide text-white/55 sm:text-[11px]">
                    O seu negócio. Sob controlo.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setHidden((value) => !value)}
                aria-label={
                  hidden
                    ? "Mostrar valores financeiros"
                    : "Ocultar valores financeiros"
                }
                aria-pressed={hidden}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/10 text-white/75 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78E6A0] sm:h-9 sm:w-9"
              >
                {hidden ? (
                  <Eye className="h-4 w-4" aria-hidden />
                ) : (
                  <EyeOff className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>

            {/* Chip com segmentos metálicos */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex aspect-[1.3/1] w-[12%] max-w-[52px] items-center justify-center overflow-hidden rounded-[5px] border border-[#F0E1A9]/65 bg-gradient-to-br from-[#F0E2AE] via-[#C9B777] to-[#8A7644] shadow-[inset_0_1px_2px_rgba(255,255,255,.65),0_2px_5px_rgba(0,0,0,.15)]">
                <div
                  aria-hidden="true"
                  className="absolute inset-[12%] rounded-[3px] border border-[#78663B]/65"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-y-[12%] left-1/2 w-px bg-[#78663B]/65"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-[12%] top-1/2 h-px bg-[#78663B]/65"
                />
                <div
                  aria-hidden="true"
                  className="absolute left-[27%] top-[27%] h-[46%] w-[46%] rounded-[2px] border border-[#78663B]/70"
                />
              </div>
              <Wifi
                className="h-4 w-4 rotate-90 text-white/55 sm:h-5 sm:w-5"
                strokeWidth={1.5}
                aria-label="Símbolo contactless decorativo"
              />
            </div>

            {/* Informação principal */}
            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-white/60 sm:text-[11px]">
                Lucro · {periodLabel}
              </p>
              <div className="mt-1 flex min-w-0 items-center gap-2">
                <p className="min-w-0 truncate text-[clamp(1.25rem,5.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.045em] tabular-nums sm:text-[clamp(1.8rem,3vw,2.5rem)]">
                  {display(hasProfitData ? profit : "—")}
                </p>
                {hasProfitData && (
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-[#A4F0BC] sm:h-5 sm:w-5"
                    aria-hidden
                  />
                )}
              </div>
              <p className="mt-1 truncate text-[9px] text-white/50 sm:text-[11px]">
                {hasProfitData
                  ? profitNote ?? "Vendas menos o custo dos produtos"
                  : "Indique o preço de compra para ver o lucro"}
              </p>
            </div>

            {/* Rodapé gravado no cartão */}
            <div className="flex items-end justify-between gap-3 border-t border-white/[0.12] pt-[2.5%]">
              <div>
                <p className="text-[8px] font-medium uppercase tracking-[0.2em] text-white/60 sm:text-[9px]">
                  Moeda
                </p>
                <p className="mt-0.5 text-[10px] font-semibold tracking-[0.12em] text-white/75 sm:text-xs">
                  MZN
                </p>
              </div>
            </div>
          </div>

          {/* Brilho discreto apenas ao passar o rato */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "linear-gradient(115deg,transparent 20%,rgba(255,255,255,.07) 44%,transparent 63%)",
            }}
          />
        </motion.article>

      </div>

      {/* Indicadores: abaixo no celular, coluna vertical no desktop */}
      <div className="grid min-w-0 grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/[0.08] bg-dark-surface lg:grid-cols-1 lg:divide-x-0 lg:divide-y">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex min-w-0 items-center gap-2 px-3 py-3.5 sm:px-5 sm:py-4 lg:gap-3 lg:px-5 lg:py-5"
          >
            <span
              aria-hidden="true"
              className={`hidden h-8 w-1 shrink-0 rounded-full lg:block ${metric.marker}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-dark-muted sm:text-xs">
                {metric.label}
              </p>
              <p
                className={`mt-1.5 break-words text-xs font-semibold leading-snug tabular-nums sm:text-base ${metric.color}`}
              >
                {display(metric.value)}
              </p>
              <p className="mt-1 hidden text-xs text-dark-faint lg:block">
                {metric.description}
              </p>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}
