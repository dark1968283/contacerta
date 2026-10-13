// Configuração partilhada entre o componente da intro e o script de arranque.
// Sem 'use client' de propósito: é importado por componentes de servidor e de cliente.

/** Chave em sessionStorage. Depois de a intro correr uma vez, não volta a correr nessa sessão do separador. */
export const INTRO_SEEN_KEY = 'ca_intro_seen';

/** Atributo escrito em <html> pelo script de arranque quando a intro deve ser ignorada. */
export const INTRO_SKIP_ATTR = 'data-ca-intro';

/**
 * Duração total da intro em ms. Tem de coincidir com `--ca-intro-d` no CSS
 * (a linha do tempo no CSS usa percentagens desta duração).
 */
export const INTRO_TOTAL_MS = 3800;
