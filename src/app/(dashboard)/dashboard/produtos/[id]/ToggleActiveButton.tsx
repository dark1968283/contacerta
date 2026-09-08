"use client";

import { useTransition } from "react";
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
      className="w-full rounded-xl border border-line py-3 text-sm font-medium text-ink/70 disabled:opacity-50"
    >
      {isPending ? "A processar…" : isActive ? "Desativar produto" : "Reativar produto"}
    </button>
  );
}
