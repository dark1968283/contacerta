"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Mostra "✓ Alterações guardadas" durante alguns segundos sempre que um
 * formulário (useFormState) termina sem erro.
 */
export function SavedNotice({ state, text = "Alterações guardadas." }: { state: { error: string | null }; text?: string }) {
  const [visible, setVisible] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (state.error) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, [state]);

  if (!visible) return null;
  return (
    <p role="status" className="rounded-xl bg-brandGlow/10 px-4 py-3 text-sm font-medium text-brandGlow">
      ✓ {text}
    </p>
  );
}
