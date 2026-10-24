/**
 * Som de "venda concluída".
 * O iPhone só deixa tocar som depois de um toque do utilizador, e a venda
 * termina mais tarde (depois de falar com o servidor). Por isso o som é
 * "desbloqueado" no toque em Confirmar e tocado quando aparece o visto.
 */
const SRC = "/sounds/venda-concluida.mp3";
let audio: HTMLAudioElement | null = null;

function get() {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio(SRC);
    audio.preload = "auto";
  }
  return audio;
}

/** Chamar no toque do botão Confirmar. */
export function primeSaleSound() {
  const a = get();
  if (!a) return;
  try {
    a.muted = true;
    const p = a.play();
    const reset = () => {
      a.pause();
      a.currentTime = 0;
      a.muted = false;
    };
    if (p && typeof p.then === "function") p.then(reset).catch(() => { a.muted = false; });
    else reset();
  } catch {
    /* sem som neste dispositivo */
  }
}

/** Chamar quando aparece o visto da venda concluída. */
export function playSaleSound() {
  const a = get();
  if (!a) return;
  try {
    a.muted = false;
    a.currentTime = 0;
    a.volume = 0.8;
    void a.play()?.catch(() => {});
  } catch {
    /* sem som neste dispositivo */
  }
}
