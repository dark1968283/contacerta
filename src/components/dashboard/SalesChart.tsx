import type { ReactNode } from "react";
import { TrendingUp } from "lucide-react";
import { Panel } from "./Panel";

/** Um ponto REAL da série (já formatado no servidor). Nada é inventado aqui. */
export type ChartPoint = { key: string; label: string; value: number; valueLabel: string };

type SalesChartProps = {
  points: ChartPoint[];
  /** Máximo da série (o mesmo `chartMax` que a página já calcula). */
  max: number;
  periodLabel: string;
  isEmpty: boolean;
  /** Rodapé opcional dentro do cartão (ex.: resumo de métricas). */
  footer?: ReactNode;
};

// Geometria em % da área útil: valor máximo a 12%, zero a 88% (margem para pontos e tooltip).
const TOP = 12;
const SPAN = 76;
const BASE = TOP + SPAN;

/**
 * Gráfico de linha em SVG puro (sem dependências, sem JS no cliente).
 * - A linha/área/grelha são SVG com preserveAspectRatio="none" e traço
 *   non-scaling-stroke: ocupam toda a largura sem distorcer a espessura.
 * - Pontos, etiquetas e tooltip são HTML posicionado em %, por isso o texto
 *   e os círculos nunca ficam esticados.
 * - Tooltip por :hover/:focus em CSS (funciona em toque no Android).
 */
export function SalesChart({ points, max, periodLabel, isEmpty, footer }: SalesChartProps) {
  const n = points.length;
  const geo = points.map((p, i) => ({
    ...p,
    x: n === 1 ? 50 : 4 + (i * 92) / (n - 1),
    y: TOP + (1 - p.value / max) * SPAN,
  }));
  const line = geo.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const first = geo[0];
  const last = geo.at(-1);
  const area = first && last ? `${line} L ${last.x} ${BASE} L ${first.x} ${BASE} Z` : "";

  // Etiquetas do eixo X: no máximo ~7 visíveis, sempre incluindo a mais recente.
  const labelled = geo.map((p, i) => ({ i, has: p.label !== "" })).filter((p) => p.has);
  const step = Math.max(1, Math.ceil(labelled.length / 7));
  const visibleLabels = new Set(
    labelled.filter((_, k) => (labelled.length - 1 - k) % step === 0).map((p) => p.i),
  );

  const colW = n > 0 ? 100 / n : 100;

  return (
    <Panel className="p-5 sm:p-6" glowClassName="bg-brandGlow/10" edgeClassName="via-brandGlow/30">
      <div>
        <h2 className="text-base font-semibold text-dark-text">Vendas</h2>
        <p className="mt-0.5 text-xs text-dark-muted">{periodLabel}</p>
      </div>

      {isEmpty ? (
        <div className="flex h-52 flex-col items-center justify-center gap-2 text-center sm:h-60">
          <TrendingUp className="h-6 w-6 text-white/15" aria-hidden />
          <p className="text-sm text-dark-faint">Ainda não existem vendas neste período.</p>
        </div>
      ) : (
        <div className="mt-5">
          <div className="relative h-52 sm:h-60 lg:h-64" aria-hidden>
            {/* Glow: cópia desfocada da linha, atrás da linha nítida. */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-60 blur-[6px]">
              {line && (
                <path d={line} fill="none" stroke="#22C766" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              )}
            </svg>

            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              <defs>
                <linearGradient id="sales-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C766" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#22C766" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[TOP, (TOP + BASE) / 2, BASE].map((gy) => (
                <line key={gy} x1="0" y1={gy} x2="100" y2={gy} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
              ))}
              {area && <path d={area} fill="url(#sales-area)" />}
              {line && (
                <path d={line} fill="none" stroke="#22C766" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              )}
            </svg>

            {/* Uma coluna por ponto: zona de hover/toque + ponto + tooltip. */}
            {geo.map((p, i) => {
              const colLeft = i * colW;
              const relX = ((p.x - colLeft) / colW) * 100;
              const isLast = i === n - 1;
              const tx = p.x < 20 ? "-12px" : p.x > 80 ? "calc(-100% + 12px)" : "-50%";
              const below = p.y < 30;
              return (
                <div
                  key={p.key}
                  tabIndex={0}
                  className="group absolute inset-y-0 cursor-pointer outline-none hover:z-20 focus:z-20"
                  style={{ left: `${colLeft}%`, width: `${colW}%` }}
                >
                  <span
                    className="absolute inset-y-0 w-px -translate-x-1/2 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100"
                    style={{ left: `${relX}%` }}
                  />
                  <span
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-brandGlow transition-transform duration-150 group-hover:scale-150 group-focus:scale-150 ${
                      isLast ? "h-2.5 w-2.5 shadow-[0_0_0_4px_rgba(34,199,102,0.18)]" : "h-1.5 w-1.5"
                    }`}
                    style={{ left: `${relX}%`, top: `${p.y}%` }}
                  />
                  <div
                    className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-dark-borderStrong bg-dark-strong/95 px-2.5 py-1.5 text-xs opacity-0 shadow-lg shadow-black/40 backdrop-blur transition-opacity group-hover:opacity-100 group-focus:opacity-100"
                    style={{
                      left: `${relX}%`,
                      top: `${p.y}%`,
                      transform: `translate(${tx}, ${below ? "12px" : "calc(-100% - 12px)"})`,
                    }}
                  >
                    <p className="text-dark-muted">{p.label}</p>
                    <p className="font-semibold tabular-nums text-dark-text">{p.valueLabel}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative mt-2 h-4" aria-hidden>
            {geo.map((p, i) =>
              visibleLabels.has(i) ? (
                <span
                  key={p.key}
                  className="absolute -translate-x-1/2 whitespace-nowrap text-[11px] text-dark-faint"
                  style={{ left: `${p.x}%` }}
                >
                  {p.label}
                </span>
              ) : null,
            )}
          </div>

          <ul className="sr-only">
            {points.map((p) => (
              <li key={p.key}>
                {p.label}: {p.valueLabel}
              </li>
            ))}
          </ul>
        </div>
      )}

      {footer && <div className="mt-5 border-t border-dark-border pt-4">{footer}</div>}
    </Panel>
  );
}
