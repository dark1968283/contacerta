"use client";

import { useEffect } from "react";
import { ArrowLeft, Printer } from "lucide-react";

/**
 * Barra das páginas de impressão. Some no papel/PDF.
 * "Guardar PDF" abre o diálogo de impressão do telemóvel ou computador,
 * onde se escolhe "Guardar como PDF" (Android, iPhone, Windows e Mac).
 */
export function PrintToolbar({ backHref, autoPrint = false }: { backHref: string; autoPrint?: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    const t = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(t);
  }, [autoPrint]);

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-neutral-200 bg-[#fff]/95 px-4 py-3 backdrop-blur print:hidden">
      <a
        href={backHref}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Voltar
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-xl bg-[#166C4E] px-4 py-2.5 text-sm font-semibold text-[#fff] hover:bg-[#13593f]"
      >
        <Printer className="h-4 w-4" aria-hidden />
        Guardar PDF / Imprimir
      </button>
    </div>
  );
}
