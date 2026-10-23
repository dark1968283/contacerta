"use client";

import { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

/**
 * Ecrã mostrado quando algo falha dentro da app — na maioria das vezes,
 * uma acção feita sem internet (ex.: guardar um cliente offline).
 */
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center px-4 text-center text-dark-text">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/15 text-warning">
        <WifiOff className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="mt-4 text-xl font-semibold">{offline ? "Sem internet" : "Algo correu mal"}</h1>
      <p className="mt-2 text-sm leading-relaxed text-dark-muted">
        {offline
          ? "Esta acção precisa de internet. Pode continuar a vender: as vendas ficam guardadas e são enviadas quando a rede voltar."
          : "Não foi possível concluir. Verifique a ligação e tente de novo."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 flex items-center gap-2 rounded-xl bg-[#22C766] px-5 py-3 font-semibold text-[#06120C]"
      >
        <RefreshCw className="h-4 w-4" aria-hidden /> Tentar de novo
      </button>
    </div>
  );
}
