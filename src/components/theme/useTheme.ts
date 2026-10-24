"use client";

import { useEffect, useState } from "react";
import { THEME_EVENT, applyThemePref, readThemePref, resolveTheme, type ThemePref } from "@/lib/theme";

/** Preferência de tema actual + forma de a mudar. Mantém "automático" sincronizado com o celular. */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>("dark");
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const sync = () => {
      const p = readThemePref();
      setPref(p);
      setResolved(resolveTheme(p));
    };
    sync();
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onSystem = () => {
      if (readThemePref() === "system") applyThemePref("system");
    };
    window.addEventListener(THEME_EVENT, sync);
    window.addEventListener("storage", sync);
    media.addEventListener("change", onSystem);
    return () => {
      window.removeEventListener(THEME_EVENT, sync);
      window.removeEventListener("storage", sync);
      media.removeEventListener("change", onSystem);
    };
  }, []);

  return { pref, resolved, setTheme: applyThemePref };
}
