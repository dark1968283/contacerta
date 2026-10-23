/**
 * Visto animado do ecrã "Venda registada".
 * Mesma forma, cor e tempos da animação Lottie "Exam Passed Checkmark"
 * (ver public/animations/venda-sucesso.json), feita em SVG para não
 * precisar de biblioteca e carregar instantaneamente.
 */
export function SaleSuccessCheck({ size = 112 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Venda concluída"
      className="mx-auto drop-shadow-[0_0_36px_rgba(27,158,106,0.45)]"
    >
      <circle className="cc-success-circle" cx="100" cy="100" r="75" fill="#1B9E6A" />
      <path
        className="cc-success-check"
        d="M64 102 L90 127 L138 74"
        pathLength={1}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={14}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
