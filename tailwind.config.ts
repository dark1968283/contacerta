import type { Config } from "tailwindcss";

// Paleta pensada para o contexto: clareza sobre elegância.
// Verde = dinheiro/positivo (vendas, pago). Terracota = atenção (dívida, stock baixo).
// Fundo neutro claro para máxima legibilidade em ecrãs pequenos ao sol.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C1B19", // texto principal, quase-preto quente
        paper: "#FAFAF7", // fundo
        line: "#E4E2DC", // divisórias
        brand: {
          DEFAULT: "#166C4E", // verde profundo — ações principais, valores positivos
          soft: "#E4F1EB",
        },
        alert: {
          DEFAULT: "#B4472B", // terracota — dívidas vencidas, esgotado
          soft: "#F6E7E1",
        },
        warn: {
          DEFAULT: "#9A6B14", // âmbar — stock baixo
          soft: "#F6EEDD",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      maxWidth: {
        app: "480px", // corpo centrado tipo app móvel mesmo em desktop
      },
    },
  },
  plugins: [],
};

export default config;
