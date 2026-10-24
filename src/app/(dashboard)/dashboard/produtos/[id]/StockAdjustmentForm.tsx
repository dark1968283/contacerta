"use client";

import { useFormState } from "react-dom";
import { useRef, useEffect, useState } from "react";
import { ClipboardCheck, PackagePlus } from "lucide-react";
import { adjustStock, type ProductActionState } from "../actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Panel } from "@/components/dashboard/Panel";
import { FIELD_INPUT, FIELD_LABEL, FormError } from "../_components/ProductsUI";

const initialState: ProductActionState = { error: null };

type Mode = "entrada" | "contagem";

/**
 * Duas situações simples:
 *  - "Chegou mercadoria": indica quantas unidades entraram.
 *  - "Contei o stock": indica quantas tem agora; a app calcula a diferença
 *    e regista um ajuste (+ ou −), sem o utilizador ter de fazer contas.
 */
export function StockAdjustmentForm({
  productId,
  currentStock,
  currentCost = null,
  suppliers = [],
}: {
  productId: string;
  currentStock: number;
  /** Preço de compra actual (por unidade). */
  currentCost?: number | null;
  /** Fornecedores já usados, para sugerir. */
  suppliers?: string[];
}) {
  const action = adjustStock.bind(null, productId);
  const [state, formAction] = useFormState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<Mode>("entrada");
  const [value, setValue] = useState("");
  const [paid, setPaid] = useState("");
  const [saved, setSaved] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!state.error) {
      formRef.current?.reset();
      setValue("");
      setPaid("");
      setMode("entrada");
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 2500);
      return () => clearTimeout(t);
    }
  }, [state]);

  const typed = parseInt(value, 10);
  const valid = !Number.isNaN(typed);
  const delta = mode === "entrada" ? typed : typed - currentStock;
  const paidValue = Number(paid.replace(/\s/g, "").replace(",", "."));
  const unitCost = mode === "entrada" && valid && typed > 0 && paid.trim() !== "" && paidValue > 0 ? paidValue / typed : null;
  const fmt = (v: number) => `${(Math.round(v * 100) / 100).toLocaleString("pt-MZ")} MT`;

  return (
    <Panel as="div" className="p-4 sm:p-5">
      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2.5">
          <ModeButton
            active={mode === "entrada"}
            onClick={() => setMode("entrada")}
            icon={<PackagePlus className="h-5 w-5" aria-hidden />}
            title="Chegou mercadoria"
            hint="Somar unidades"
          />
          <ModeButton
            active={mode === "contagem"}
            onClick={() => setMode("contagem")}
            icon={<ClipboardCheck className="h-5 w-5" aria-hidden />}
            title="Contei o stock"
            hint="Corrigir o número"
          />
        </div>

        <input type="hidden" name="type" value={mode === "entrada" ? "entrada" : "ajuste"} />
        <input type="hidden" name="quantity" value={valid ? String(delta) : ""} />

        <div>
          <label htmlFor="stock-value" className={FIELD_LABEL}>
            {mode === "entrada" ? "Quantas unidades chegaram?" : "Quantas unidades tem agora?"}
          </label>
          <input
            id="stock-value"
            type="text"
            inputMode="numeric"
            required
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
            placeholder={mode === "entrada" ? "10" : String(currentStock)}
            className={FIELD_INPUT}
          />
          {valid && (
            <p className="mt-2 text-sm text-dark-muted">
              {mode === "entrada" ? (
                <>
                  Fica com <strong className="text-dark-text">{currentStock + typed}</strong> unidades.
                </>
              ) : delta === 0 ? (
                "O stock já está certo, não é preciso mudar nada."
              ) : (
                <>
                  Tinha {currentStock}, passa a ter <strong className="text-dark-text">{typed}</strong> (
                  {delta > 0 ? `+${delta}` : delta}).
                </>
              )}
            </p>
          )}
        </div>

        {mode === "entrada" ? (
          <>
            <div>
              <label htmlFor="total-paid" className={FIELD_LABEL}>
                Quanto pagou por tudo? <span className="font-normal text-dark-faint">(opcional)</span>
              </label>
              <input
                id="total-paid"
                name="total_paid"
                type="text"
                inputMode="decimal"
                value={paid}
                onChange={(e) => setPaid(e.target.value.replace(/[^\d.,\s]/g, ""))}
                placeholder="Ex.: 3 000"
                className={FIELD_INPUT}
              />
              {unitCost !== null && (
                <p className="mt-2 text-sm text-dark-muted">
                  Fica a <strong className="text-dark-text">{fmt(unitCost)}</strong> cada um
                  {currentCost !== null && Math.abs(currentCost - unitCost) >= 0.01 ? ` (antes ${fmt(currentCost)})` : ""}. O preço
                  de compra do produto actualiza sozinho.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="supplier" className={FIELD_LABEL}>
                Fornecedor <span className="font-normal text-dark-faint">(opcional)</span>
              </label>
              <input
                id="supplier"
                name="supplier"
                type="text"
                list="supplier-list"
                maxLength={80}
                autoComplete="off"
                placeholder="Ex.: Armazém Xiquelene"
                className={FIELD_INPUT}
              />
              <datalist id="supplier-list">
                {suppliers.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="note" className={FIELD_LABEL}>
              Nota (opcional)
            </label>
            <input id="note" name="note" type="text" placeholder="Ex.: contagem do fim do mês" className={FIELD_INPUT} />
          </div>
        )}

        {state.error && <FormError>{state.error}</FormError>}
        {saved && !state.error && (
          <p role="status" className="rounded-xl bg-brandGlow/10 px-4 py-3 text-sm font-medium text-brandGlow">
            ✓ Stock actualizado.
          </p>
        )}

        <SubmitButton>Guardar</SubmitButton>
      </form>
    </Panel>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brandGlow/50 ${
        active ? "border-brandGlow/40 bg-brandGlow/10" : "border-dark-border bg-white/[0.02] hover:border-dark-borderStrong"
      }`}
    >
      <span className={active ? "text-brandGlow" : "text-dark-muted"}>{icon}</span>
      <span className="mt-2 block text-sm font-semibold text-dark-text">{title}</span>
      <span className="block text-xs text-dark-muted">{hint}</span>
    </button>
  );
}
