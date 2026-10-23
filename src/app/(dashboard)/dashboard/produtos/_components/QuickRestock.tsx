"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, PackagePlus, X } from "lucide-react";
import { quickRestock } from "../actions";

const QUICK = [5, 10, 20, 50];

/** Botão "Repor" na lista de produtos: adiciona unidades em dois toques. */
export function QuickRestock({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(null), 2500);
    return () => clearTimeout(t);
  }, [done]);

  function submit(value: number) {
    setError(null);
    startTransition(async () => {
      const result = await quickRestock(productId, value);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setAmount("");
      setDone(`+${value}`);
      router.refresh();
    });
  }

  const typed = parseInt(amount, 10);

  return (
    <div ref={boxRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setError(null);
        }}
        aria-expanded={open}
        aria-label={`Repor stock de ${productName}`}
        className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition active:scale-95 ${
          done ? "bg-[#22C766] text-[#06120C]" : "bg-white/[0.06] text-dark-text hover:bg-white/[0.1]"
        }`}
      >
        {done ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : <PackagePlus className="h-4 w-4" aria-hidden />}
        {done ?? "Repor"}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`Repor ${productName}`}
          className="absolute right-0 top-12 z-40 w-[min(84vw,300px)] rounded-2xl border border-white/[0.12] bg-[#16201C] p-4 shadow-2xl shadow-black/50"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-dark-text">Quantas chegaram?</p>
              <p className="truncate text-xs text-dark-muted">{productName}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-dark-muted hover:bg-white/[0.06]"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                disabled={pending}
                onClick={() => submit(q)}
                className="rounded-xl bg-[#22C766]/[0.12] py-2.5 text-sm font-bold text-[#78E6A0] transition hover:bg-[#22C766]/[0.2] active:scale-95 disabled:opacity-50"
              >
                +{q}
              </button>
            ))}
          </div>

          <div className="mt-2 flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && typed > 0) submit(typed);
              }}
              placeholder="Outro número"
              aria-label="Outra quantidade"
              className="min-w-0 flex-1 rounded-xl border border-white/[0.12] bg-[#0B1110] px-3 py-2.5 text-base text-dark-text outline-none focus:border-[#22C766]/60"
            />
            <button
              type="button"
              disabled={pending || !(typed > 0)}
              onClick={() => submit(typed)}
              className="rounded-xl bg-[#22C766] px-4 text-sm font-bold text-[#06120C] disabled:opacity-40"
            >
              {pending ? "…" : "OK"}
            </button>
          </div>

          {error && <p className="mt-2 text-xs text-[#FF9A90]">{error}</p>}
        </div>
      )}
    </div>
  );
}
