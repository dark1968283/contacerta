import type { ReactNode } from "react";

/**
 * Superfície base do Dashboard: gradiente dark-elevated → dark-surface, borda
 * discreta e sombra neumórfica subtil (sombra escura em baixo-direita, luz
 * muito ténue em cima-esquerda, brilho interno de 1px no topo).
 * Só usa tokens existentes do tailwind.config.ts.
 */
export const SURFACE =
  "relative rounded-2xl border border-dark-border bg-gradient-to-b from-dark-elevated to-dark-surface shadow-[8px_8px_20px_rgba(0,0,0,0.45),-4px_-4px_12px_rgba(255,255,255,0.02),inset_0_1px_0_rgba(255,255,255,0.04)]";

type PanelProps = {
  as?: "section" | "article" | "div";
  className?: string;
  /** Cor do glow no canto superior direito, ex.: "bg-brandGlow/15". */
  glowClassName?: string;
  /** Cor central da linha de luz no topo, ex.: "via-brandGlow/40". */
  edgeClassName?: string;
  /** Camadas decorativas extra (recortadas pelo raio da superfície). */
  decor?: ReactNode;
  children: ReactNode;
};

export function Panel({
  as: Tag = "section",
  className = "",
  glowClassName,
  edgeClassName = "via-white/10",
  decor,
  children,
}: PanelProps) {
  return (
    <Tag className={`${SURFACE} ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        {glowClassName && (
          <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl ${glowClassName}`} />
        )}
        <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${edgeClassName} to-transparent`} />
        {decor}
      </div>
      <div className="relative">{children}</div>
    </Tag>
  );
}
