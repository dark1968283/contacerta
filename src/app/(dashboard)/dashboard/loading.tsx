/**
 * Ecrã de carregamento imediato: aparece logo ao tocar num separador,
 * enquanto a página chega do servidor (o menu e a barra de topo ficam).
 */
function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.07] ${className}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-5 pt-1" aria-busy="true" aria-label="A carregar">
      <div className="space-y-2">
        <Bar className="h-7 w-44" />
        <Bar className="h-4 w-64" />
      </div>
      <div className="cc-glass rounded-2xl border border-dark-border bg-dark-surface p-5">
        <Bar className="h-5 w-32" />
        <Bar className="mt-4 h-9 w-48" />
        <Bar className="mt-3 h-4 w-40" />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="cc-glass flex items-center gap-3 rounded-2xl border border-dark-border bg-dark-surface p-4">
          <div className="min-w-0 flex-1 space-y-2">
            <Bar className="h-4 w-1/2" />
            <Bar className="h-3 w-1/3" />
          </div>
          <Bar className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
