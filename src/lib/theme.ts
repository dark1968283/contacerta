/** Tema da app: claro, escuro ou automático (segue o celular). */
export type ThemePref = "light" | "dark" | "system";

export const THEME_KEY = "contacerta-theme";
export const THEME_EVENT = "contacerta-theme-changed";

/** Script que corre antes da página aparecer (evita "piscar" com a cor errada). */
export const THEME_BOOT_SCRIPT = `(function(){try{var p=localStorage.getItem('${THEME_KEY}')||'dark';var t=p==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p;document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export function readThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "system" ? v : "dark";
  } catch {
    return "dark";
  }
}

export function resolveTheme(pref: ThemePref): "light" | "dark" {
  if (pref !== "system") return pref;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    /* sem armazenamento: aplica só nesta visita */
  }
  document.documentElement.setAttribute("data-theme", resolveTheme(pref));
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: pref }));
}
