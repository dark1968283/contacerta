import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { Panel } from "./Panel";

/** Um ponto REAL da série (já formatado no servidor). Nada é inventado aqui. */
export type ChartPoint = { key: string; label: string; value: number; valueLabel: string };

type SalesChartProps = {
  points: ChartPoint[];
  /** Máximo da série (o mesmo `chartMax` que a página já calcula). */
  max: number;
  periodLabel: string;
  isEmpty: boolean;
  /** Total do período, já formatado (ex.: "12 400 MT"). */
  totalLabel?: string;
  /** Comparação com o período anterior equivalente. */
  comparison?: { percent: number; text: string } | null;
  /** "Melhor dia" ou "Melhor hora". */
  bestWord?: string;
  /** Rodapé opcional dentro do cartão (ex.: resumo de métricas). */
  footer?: ReactNode;
};

// Geometria em % da área do gráfico: topo das barras a 16% (espaço para a etiqueta
// do melhor dia), base a 100%.
const TOP = 16;
const SPAN = 100 - TOP;

/** 1 250 → "1,3 mil"; 2 400 000 → "2,4 M". */
function compactMT(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString("pt-MZ", { maximumFractionDigits: 1 })} M`;
  if (v >= 1_000) return `${(v / 1_000).toLocaleString("pt-MZ", { maximumFractionDigits: 1 })} mil`;
  return Math.round(v).toLocaleString("pt-MZ");
}

/** Curva suave (Catmull-Rom → Bézier) pelos pontos, em coordenadas 0–100. */
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/**
 * Gráfico de barras em SVG/HTML puro (sem dependências, sem JS no cliente).
 * - Uma barra por dia (ou hora, em "Hoje"); a mais alta fica destacada com o valor.
 * - Por cima, uma curva suave mostra a tendência (média de 3 pontos).
 * - Toque/hover numa barra mostra o valor exacto.
 */
export function SalesChart({
  points,
  max,
  periodLabel,
  isEmpty,
  totalLabel,
  comparison,
  bestWord = "Melhor dia",
  footer,
}: SalesChartProps) {
  const n = points.length;
  const colW = n > 0 ? 100 / n : 100;
  const bestIndex = points.reduce((best, p, i) => (p.value > (points[best]?.value ?? 0) ? i : best), 0);
  const hasBest = (points[bestIndex]?.value ?? 0) > 0;

  const bars = points.map((p, i) => {
    const h = max > 0 ? (p.value / max) * SPAN : 0;
    return { ...p, i, cx: (i + 0.5) * colW, top: 100 - h, h };
  });

  // Tendência: média móvel (mais larga quando há muitos pontos), desenhada como curva suave.
  const half = Math.max(1, Math.round(n / 10));
  const trendPts = bars.map((b, i) => {
    const win = bars.slice(Math.max(0, i - half), i + half + 1);
    const avg = win.reduce((s, w) => s + w.value, 0) / win.length;
    return { x: b.cx, y: 100 - (max > 0 ? (avg / max) * SPAN : 0) * 0.92 };
  });
  const trend = n >= 4 ? smoothPath(trendPts) : "";
  const trendEnd = trendPts.at(-1);

  // Etiquetas do eixo X: no máximo ~7 visíveis, sempre incluindo a mais recente.
  const labelled = bars.filter((b) => b.label !== "");
  const step = Math.max(1, Math.ceil(labelled.length / 7));
  const visibleLabels = new Set(labelled.filter((_, k) => (labelled.length - 1 - k) % step === 0).map((b) => b.i));

  const up = comparison ? comparison.percent >= 0 : true;

  return (
    <Panel className="p-5 sm:p-6" glowClassName="bg-brandGlow/10" edgeClassName="via-brandGlow/30">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-dark-muted">Vendas · {periodLabel}</p>
          {totalLabel && (
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-dark-text sm:text-[2rem]">{totalLabel}</p>
          )}
        </div>
        {comparison && (
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
              up ? "bg-brandGlow/12 text-brandGlow" : "bg-warning/12 text-warning"
            }`}
          >
            {up ? <ArrowUpRight className="h-4 w-4" aria-hidden /> : <ArrowDownRight className="h-4 w-4" aria-hidden />}
            <span className="tabular-nums">
              {up ? "+" : "−"}
              {Math.abs(comparison.percent)}%
            </span>
            <span className="font-medium opacity-80">{comparison.text}</span>
          </div>
        )}
      </div>

      {isEmpty ? (
        <div className="flex h-52 flex-col items-center justify-center gap-2 text-center sm:h-60">
          <TrendingUp className="h-6 w-6 text-dark-faint" aria-hidden />
          <p className="text-sm text-dark-faint">Ainda não existem vendas neste período.</p>
        </div>
      ) : (
        <div className="mt-5">
          <div className="relative h-52 sm:h-60 lg:h-64" aria-hidden>
            {/* Linhas de referência; o valor fica na margem à direita, fora das barras. */}
            {[1, 0.5].map((f) => (
              <div key={f} className="absolute left-0 right-0 border-t border-dashed border-dark-border" style={{ top: `${100 - f * SPAN}%` }}>
                <span className="absolute -top-2 right-0 text-[10px] leading-none tabular-nums text-dark-faint">{compactMT(max * f)}</span>
              </div>
            ))}
            <div className="absolute bottom-0 left-0 right-10 border-t border-dark-border" />
            <div className="absolute inset-y-0 left-0 right-10">

            {/* Barras + zona de toque + valor. */}
            {bars.map((b) => {
              const isBest = hasBest && b.i === bestIndex;
              const isLast = b.i === n - 1;
              const tx = b.cx < 18 ? "-14%" : b.cx > 82 ? "-86%" : "-50%";
              return (
                <div
                  key={b.key}
                  tabIndex={0}
                  className="group absolute inset-y-0 cursor-pointer outline-none hover:z-20 focus:z-20"
                  style={{ left: `${b.i * colW}%`, width: `${colW}%` }}
                >
                  <span
                    className={`cc-bar absolute bottom-0 left-1/2 w-[64%] max-w-[30px] -translate-x-1/2 rounded-t-[6px] transition-[filter,opacity] duration-150 group-hover:brightness-125 group-focus:brightness-125 ${
                      isBest
                        ? "bg-gradient-to-t from-brandGlow/30 to-brandGlow shadow-[0_0_18px_rgba(34,199,102,0.45)]"
                        : isLast
                          ? "bg-gradient-to-t from-brandGlow/20 to-brandGlow/80"
                          : "bg-gradient-to-t from-brandGlow/10 to-brandGlow/45"
                    }`}
                    style={{
                      height: b.value > 0 ? `max(${b.h}%, 4px)` : "3px",
                      opacity: b.value > 0 ? 1 : 0.35,
                      animationDelay: `${Math.min(b.i * 28, 600)}ms`,
                    }}
                  />
                  {isBest && (
                    <span
                      className="absolute -translate-x-1/2 whitespace-nowrap text-center leading-tight transition-opacity group-hover:opacity-0 group-focus:opacity-0"
                      style={{ left: "50%", top: `calc(${b.top}% - 34px)` }}
                    >
                      <span className="cc-fade-in block">
                        <span className="block text-[10px] font-medium uppercase tracking-wide text-dark-muted">{bestWord}</span>
                        <span className="block text-xs font-bold tabular-nums text-brandGlow">{compactMT(b.value)}</span>
                      </span>
                    </span>
                  )}
                  <div
                    className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-dark-borderStrong bg-dark-strong/95 px-2.5 py-1.5 text-xs opacity-0 shadow-lg shadow-black/40 backdrop-blur transition-opacity group-hover:opacity-100 group-focus:opacity-100"
                    style={{ left: "50%", top: `${b.top}%`, transform: `translate(${tx}, calc(-100% - 10px))` }}
                  >
                    <p className="text-dark-muted">{b.label || "—"}</p>
                    <p className="font-semibold tabular-nums text-dark-text">{b.valueLabel}</p>
                  </div>
                </div>
              );
            })}

            {/* Curva de tendência por cima das barras (decorativa, não recebe toques). */}
            {trend && (
              <>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="cc-trend pointer-events-none absolute inset-0 h-full w-full opacity-50 blur-[5px]">
                  <path d={trend} fill="none" stroke="rgb(var(--c-fg))" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                </svg>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="cc-trend pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                  <path
                    d={trend}
                    fill="none"
                    stroke="rgb(var(--c-fg))"
                    strokeOpacity="0.9"
                    strokeWidth="2"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                {trendEnd && (
                  <span
                    className="cc-fade-in pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(var(--c-fg))] shadow-[0_0_0_4px_rgba(34,199,102,0.25)]"
                    style={{ left: `${trendEnd.x}%`, top: `${trendEnd.y}%` }}
                  />
                )}
              </>
            )}
            </div>
          </div>

          <div className="relative ml-0 mr-10 mt-2 h-4" aria-hidden>
            {bars.map((b) =>
              visibleLabels.has(b.i) ? (
                <span
                  key={b.key}
                  className={`absolute -translate-x-1/2 whitespace-nowrap text-[11px] ${b.i === n - 1 ? "font-semibold text-dark-muted" : "text-dark-faint"}`}
                  style={{ left: `${b.cx}%` }}
                >
                  {b.label}
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
