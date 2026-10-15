'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './ContaCertaSplash.module.css';
import { INTRO_SEEN_KEY, INTRO_SKIP_ATTR, INTRO_TOTAL_MS } from './introConfig';

export default function ContaCertaSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (document.documentElement.getAttribute(INTRO_SKIP_ATTR) === 'skip') {
      setVisible(false);
      return;
    }

    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      // A intro continua a funcionar se o armazenamento estiver bloqueado.
    }

    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, INTRO_TOTAL_MS + 150);

    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.root} role="img" aria-label="ContaCerta">
      <Image
        className={styles.logo}
        src="/images/introo-logo.png"
        alt="ContaCerta"
        width={500}
        height={500}
        priority
      />
    </div>
  );
}
