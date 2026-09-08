import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
} from "lucide-react";

type BalanceCardProps = {
  result: number;
  sales: number;
  debts: number;
  percentageChange?: number;
};

function formatMT(value: number) {
  return `${value.toLocaleString("pt-MZ", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} MT`;
}

export function BalanceCard({
  result,
  sales,
  debts,
  percentageChange = 0,
}: BalanceCardProps) {
  const isPositive = percentageChange >= 0;

  return (
    <section className="card-lg overflow-hidden bg-brand text-white shadow-floating">
      <div className="p-5 sm:p-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-white/10 p-2">
              <Wallet size={18} strokeWidth={2} />
            </div>

            <span className="text-sm font-medium text-white/75">
              Resultado do negócio
            </span>
          </div>

          <div
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isPositive
                ? "bg-white/10 text-white"
                : "bg-black/10 text-white"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight size={14} />
            ) : (
              <ArrowDownRight size={14} />
            )}

            {isPositive ? "+" : ""}
            {percentageChange}%
          </div>
        </div>

        {/* Valor principal */}
        <div className="mt-6">
          <p className="text-3xl font-bold tracking-tight sm:text-4xl">
            {formatMT(result)}
          </p>

          <p className="mt-2 text-xs text-white/60">
            Comparado ao período anterior
          </p>
        </div>

        {/* Resumo */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/15 pt-5">
          <div>
            <p className="text-xs text-white/60">
              Vendas
            </p>

            <p className="mt-1 text-sm font-semibold sm:text-base">
              {formatMT(sales)}
            </p>
          </div>

          <div>
            <p className="text-xs text-white/60">
              A receber
            </p>

            <p className="mt-1 text-sm font-semibold sm:text-base">
              {formatMT(debts)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}