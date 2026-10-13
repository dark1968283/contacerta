'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import styles from './ContaCertaSplash.module.css';
import { INTRO_SEEN_KEY, INTRO_SKIP_ATTR, INTRO_TOTAL_MS } from './introConfig';
import { ERTA_D, FRAME4_OFFSET_X, ONTA_D } from './splashPaths';

/**
 * Intro de abertura do ContaCerta, reproduzida a partir do Figma «Splash screen tutorial» (4 frames, 393×852):
 *   1. logo (106×106) centrado sobre preto
 *   2. logo a 2,098× (222,365 px), rodado −135°
 *   3. logo (106×106) deslocado 72 px para a esquerda (no Figma a imagem tem um deslocamento de −0,123 no preenchimento) + «onta»
 *   4. fundo em gradiente verde, logo a 50 px do centro original + «onta / erta.»
 * As posições, tamanhos, rotação, cores do gradiente e contornos das letras vêm do SVG exportado.
 * As durações e curvas são estimadas (o SVG não leva a informação do protótipo): ver a tabela no CSS.
 *
 * A animação corre só em CSS. O React apenas desmonta a intro no fim, permite saltá-la com um toque
 * e evita repeti-la na mesma sessão. Se o JavaScript falhar, o CSS termina sozinho com a intro invisível.
 */
export default function ContaCertaSplash() {
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setVisible(false);
  }, []);

  // Salto manual: desvanece depressa a partir da opacidade actual e depois desmonta.
  const skip = useCallback(() => {
    const el = rootRef.current;
    if (closing.current || !el) return;
    try {
      const from = getComputedStyle(el).opacity;
      const anim = el.animate([{ opacity: from }, { opacity: 0 }], { duration: 200, fill: 'forwards', easing: 'ease-out' });
      anim.onfinish = close;
      closing.current = true;
      window.setTimeout(() => setVisible(false), 400);
    } catch {
      close();
    }
  }, [close]);

  useEffect(() => {
    let isDesktop = false;
    try {
      isDesktop = window.matchMedia('(min-width: 768px)').matches;
    } catch {
      /* ignorar */
    }
    if (isDesktop) {
      close();
      return;
    }

    let skipNow = false;
    try {
      skipNow = document.documentElement.getAttribute(INTRO_SKIP_ATTR) === 'skip' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      /* ignorar */
    }
    if (skipNow) {
      close();
      return;
    }
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      /* storage bloqueado: a intro pode repetir-se, nada mais */
    }
    const t = window.setTimeout(close, INTRO_TOTAL_MS + 400); // rede de segurança
    return () => window.clearTimeout(t);
  }, [close]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, skip]);

  if (!visible) return null;

  const shift = `translate(${-FRAME4_OFFSET_X} 0)`;

  return (
    <div
      ref={rootRef}
      className={styles.root}
      style={{ '--ca-intro-d': `${INTRO_TOTAL_MS}ms` } as CSSProperties}
      role="img"
      aria-label="ContaCerta"
      onClick={skip}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && e.animationName.includes('rootExit')) close();
      }}
    >
      {/* Fundo em gradiente (frame 4): cobre o ecrã todo. */}
      <svg className={styles.bg} viewBox="0 0 393 852" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="ca-splash-grad" gradientUnits="userSpaceOnUse" x1="69.35" y1="35.5" x2="611.01" y2="634.616">
            <stop stopColor="#34C759" />
            <stop offset="0.0432692" stopColor="#34C759" />
            <stop offset="0.346154" stopColor="#18191F" />
            <stop offset="0.346254" stopColor="#18191F" />
            <stop offset="0.543069" />
            <stop offset="0.649038" stopColor="#25693A" />
            <stop offset="0.754808" stopColor="#25693A" />
            <stop offset="0.932692" stopColor="#34C759" />
          </linearGradient>
        </defs>
        <rect width="393" height="852" fill="url(#ca-splash-grad)" />
      </svg>

      {/* Logo e wordmark, no espaço de desenho 393×852 do Figma. */}
      <svg className={styles.stage} viewBox="0 0 393 852" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
        <g className={styles.logoPos}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <image className={styles.logo} href="/icons/icon-512.png" x="143" y="373" width="106" height="106" />
        </g>
        <g className={styles.onta}>
          <g transform={shift}>
            <path d={ONTA_D} fill="#fff" />
          </g>
        </g>
        <g className={styles.erta}>
          <g transform={shift}>
            <path d={ERTA_D} fill="#fff" />
          </g>
        </g>
      </svg>
    </div>
  );
}
