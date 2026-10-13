"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type LogoLayers = {
  c: string;
  green: string;
  o: string;
};

const LOGO_SRC = "/icons/icon-512.png";
const INTRO_KEY = "contacerta:intro:v1";

export function ContaCertaIntro() {
  const [visible, setVisible] = useState(true);
  const [rendered, setRendered] = useState(true);
  const [layers, setLayers] = useState<LogoLayers | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(INTRO_KEY) === "done") {
        setVisible(false);
        return;
      }
    } catch {
      // A intro continua funcional se o armazenamento estiver indisponível.
    }

    let cancelled = false;
    let timeout: number | undefined;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    setReducedMotion(reduce);

    const finish = () => {
      try {
        window.sessionStorage.setItem(INTRO_KEY, "done");
      } catch {
        // A conclusão da intro não depende do armazenamento.
      }

      if (!cancelled) setVisible(false);
    };

    const image = new window.Image();

    image.onload = () => {
      if (cancelled) return;

      try {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;

        const context = canvas.getContext("2d", {
          willReadFrequently: true,
        });

        if (!context) throw new Error("Canvas indisponível");

        context.drawImage(image, 0, 0, 512, 512);

        const original = context.getImageData(0, 0, 512, 512);
        const cPixels = new Uint8ClampedArray(original.data.length);
        const greenPixels = new Uint8ClampedArray(original.data.length);
        const oPixels = new Uint8ClampedArray(original.data.length);

        // C verde-escuro e círculo verde-claro.
        // A classificação preserva os píxeis e a transparência originais.
        const colors: Array<[number, number, number]> = [
          [20, 83, 45],
          [220, 252, 231],
          [34, 197, 94],
        ];

        for (let i = 0; i < original.data.length; i += 4) {
          const alpha = original.data[i + 3];
          if (alpha === 0) continue;

          const r = original.data[i] ?? 0;
          const g = original.data[i + 1] ?? 0;
          const b = original.data[i + 2] ?? 0;

          const distances = colors.map(([cr, cg, cb]) => {
            return (
              (r - cr) * (r - cr) +
              (g - cg) * (g - cg) +
              (b - cb) * (b - cb)
            );
          });

          const nearest = distances.indexOf(Math.min(...distances));

          if (nearest === 0) {
            cPixels.set(original.data.slice(i, i + 4), i);
          } else if (nearest === 1) {
            oPixels.set(original.data.slice(i, i + 4), i);
          } else if (nearest === 2) {
            greenPixels.set(original.data.slice(i, i + 4), i);
          }
        }

        // Limpar resíduos quase brancos nas camadas animadas.
        // A logo oficial original permanece intacta.
        for (let i = 0; i < original.data.length; i += 4) {
          const alpha = original.data[i + 3] ?? 0;
          if (alpha === 0) continue;

          const r = original.data[i] ?? 0;
          const g = original.data[i + 1] ?? 0;
          const b = original.data[i + 2] ?? 0;

          const nearlyWhite = r > 235 && g > 235 && b > 235;
          if (nearlyWhite) {
            cPixels.fill(0, i, i + 4);
            greenPixels.fill(0, i, i + 4);
            oPixels.fill(0, i, i + 4);
          }
        }

        // Separar o círculo dos fragmentos claros do C.
        // O maior componente conectado fica no círculo; os fragmentos
        // pequenos regressam à camada fixa do C.
        {
          const width = 512;
          const height = 512;
          const visited = new Uint8Array(width * height);
          const components = [];
          const neighbors = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0],            [1, 0],
            [-1, 1],  [0, 1],  [1, 1],
          ];

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const start = y * width + x;
              if (visited[start] || oPixels[start * 4 + 3] === 0) continue;

              const queue = [start];
              const component = [];
              visited[start] = 1;

              for (let head = 0; head < queue.length; head++) {
                const pixel = queue[head]!;
                component.push(pixel);

                const px = pixel % width;
                const py = Math.floor(pixel / width);

                for (const [dx, dy] of neighbors) {
                  if (dx === undefined || dy === undefined) continue;
                  const nx = px + dx;
                  const ny = py + dy;
                  if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

                  const next = ny * width + nx;
                  if (visited[next] || oPixels[next * 4 + 3] === 0) continue;

                  visited[next] = 1;
                  queue.push(next);
                }
              }

              components.push(component);
            }
          }

          if (components.length > 1) {
            components.sort((a, b) => b.length - a.length);
            for (const component of components.slice(1)) {
              for (const pixel of component) {
                const offset = pixel * 4;
                cPixels.fill(0, offset, offset + 4);
                oPixels.fill(0, offset, offset + 4);
              }
            }
          }
        }

        const cCanvas = document.createElement("canvas");
        cCanvas.width = 512;
        cCanvas.height = 512;

        const cContext = cCanvas.getContext("2d");
        if (!cContext) throw new Error("Canvas do C indisponível");

        cContext.putImageData(new ImageData(cPixels, 512, 512), 0, 0);

        const oCanvas = document.createElement("canvas");
        oCanvas.width = 512;
        oCanvas.height = 512;

        const oContext = oCanvas.getContext("2d");
        if (!oContext) throw new Error("Canvas do O indisponível");

        oContext.putImageData(new ImageData(oPixels, 512, 512), 0, 0);

        const greenCanvas = document.createElement("canvas");
        greenCanvas.width = 512;
        greenCanvas.height = 512;

        const greenContext = greenCanvas.getContext("2d");
        if (!greenContext) throw new Error("Canvas verde indisponível");

        greenContext.putImageData(
          new ImageData(greenPixels, 512, 512),
          0,
          0
        );

        if (!cancelled) {
          setLayers({
            c: cCanvas.toDataURL("image/png"),
            green: greenCanvas.toDataURL("image/png"),
            o: oCanvas.toDataURL("image/png"),
          });
        }

        timeout = window.setTimeout(finish, reduce ? 700 : 3200);
      } catch {
        // Se a separação falhar, apresenta a logo original sem a decompor.
        timeout = window.setTimeout(finish, 900);
      }
    };

    image.onerror = () => {
      if (!cancelled) {
        timeout = window.setTimeout(finish, 900);
      }
    };

    image.src = LOGO_SRC;

    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;

      if (timeout !== undefined) {
        window.clearTimeout(timeout);
      }
    };
  }, []);

  if (!rendered) return null;

  return (
    <motion.div
      className={`cc-intro__overlay${reducedMotion ? " cc-intro--reduced" : ""}${!layers ? " cc-intro--fallback" : ""}`}
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      onAnimationComplete={() => {
        if (!visible) setRendered(false);
      }}
      aria-hidden="true"
    >
      <div className="cc-intro__content">
        <div className="cc-intro__mark">
          {layers && !reducedMotion && (
            <>
              <div className="cc-intro__layer cc-intro__c">
                <Image
                  src={layers.c}
                  alt=""
                  width={512}
                  height={512}
                  unoptimized
                  priority
                />
              </div>

              <motion.div
                className="cc-intro__layer cc-intro__green"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 1.3,
                  duration: 0.42,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Image
                  src={layers.green}
                  alt=""
                  width={512}
                  height={512}
                  unoptimized
                  priority
                />
              </motion.div>

              <motion.div
                className="cc-intro__layer cc-intro__o"
                initial={{ y: -145, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: 1.85,
                  duration: 0.62,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Image
                  src={layers.o}
                  alt=""
                  width={512}
                  height={512}
                  unoptimized
                  priority
                />
              </motion.div>
            </>
          )}

          <div className="cc-intro__layer cc-intro__final">
            <Image
              src={LOGO_SRC}
              alt=""
              width={512}
              height={512}
              priority
              unoptimized
            />
          </div>
        </div>

        <div className="cc-intro__wordmark">
          Conta<span>Certa</span>
        </div>

        <div className="cc-intro__tagline">
          O seu negócio. Sob controlo.
        </div>
      </div>
    </motion.div>
  );
}
