/** Comunicação com o service worker para a app abrir sem internet. */

const WARM_KEY = "contacerta-offline-warm-at";
const WARM_EVERY_MS = 10 * 60 * 1000;

async function postToWorker(message: { type: string }) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    (navigator.serviceWorker.controller ?? registration.active)?.postMessage(message);
  } catch {
    /* sem service worker: a app funciona na mesma, só não abre offline */
  }
}

/** Prepara as páginas principais para abrirem sem internet (no máximo a cada 10 min). */
export function warmOfflinePages(force = false) {
  if (typeof navigator === "undefined" || !navigator.onLine) return;
  try {
    const last = Number(localStorage.getItem(WARM_KEY) ?? 0);
    if (!force && Date.now() - last < WARM_EVERY_MS) return;
    localStorage.setItem(WARM_KEY, String(Date.now()));
  } catch {
    /* continua mesmo sem localStorage */
  }
  void postToWorker({ type: "WARM_OFFLINE" });
}

/** Apaga as páginas do negócio guardadas no telemóvel (ao terminar sessão). */
export function clearOfflinePages() {
  try {
    localStorage.removeItem(WARM_KEY);
  } catch {
    /* ignora */
  }
  void postToWorker({ type: "CLEAR_OFFLINE" });
}
