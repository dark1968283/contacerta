"use client";

import { useTransition } from "react";
import { Power, PowerOff } from "lucide-react";
import { toggleProductActive } from "../actions";

export function ToggleActiveButton({
  productId,
  isActive,
}: {
  productId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => toggleProductActive(productId, !isActive))}
      className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 disabled:opacity-50 ${
        isActive
          ? "border-danger/30 bg-danger/5 text-danger hover:bg-danger/10 focus-visible:ring-danger/40"
          : "border-brandGlow/30 bg-brandGlow/5 text-brandGlow hover:bg-brandGlow/10 focus-visible:ring-brandGlow/40"
      }`}
    >
      {isActive ? <PowerOff className="h-4 w-4" aria-hidden /> : <Power className="h-4 w-4" aria-hidden />}
      {isPending ? "A processar…" : isActive ? "Desativar produto" : "Reativar produto"}
    </button>
  );
}
