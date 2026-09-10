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
        // Sistema dark, usado pelo Dashboard, Login e navegação (Fase "Visual System V5").
        // Aditivo — não substitui nem reduz os tokens claros acima, que continuam a
        // ser a base de todas as outras páginas nesta ronda.
        dark: {
          bg: "#0B1110", // fundo da aplicação
          surface: "#101816", // painel padrão
          elevated: "#141F1C", // painel elevado (ex.: hero financeiro)
          strong: "#182722", // superfície de maior destaque (ex.: nav ativa)
          border: "rgba(255,255,255,0.08)",
          borderStrong: "rgba(255,255,255,0.14)",
          text: "#F5F6F4",
          muted: "rgba(245,246,244,0.55)",
          faint: "rgba(245,246,244,0.35)",
        },
        brandGlow: "#22C766", // verde mais luminoso para texto/ícones sobre fundo dark
        info: "#38BDF8",
        warning: "#F5B754",
        danger: "#F2685C",
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