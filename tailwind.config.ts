import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],

  theme: {
    extend: {
      colors: {
        // Cores que mudam com o tema (claro/escuro): valores em src/app/globals.css.
        ink: "rgb(var(--c-text) / <alpha-value>)",
        paper: "rgb(var(--c-bg) / <alpha-value>)",
        // "white" passa a ser a cor de primeiro plano: branco no escuro, quase preto no claro.
        // Assim todos os bg-white/5, border-white/10, text-white/60... funcionam nos dois temas.
        white: "rgb(var(--c-fg) / <alpha-value>)",
        // Branco verdadeiro, para texto sobre botões/etiquetas coloridos.
        onbrand: "#FFFFFF",
        // Verde de destaque para texto (claro no escuro, escuro no claro).
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        line: "#E4E2DC",

        brand: {
          DEFAULT: "#166C4E",
          soft: "#E4F1EB",
        },

        alert: {
          DEFAULT: "#B4472B",
          soft: "#F6E7E1",
        },

        warn: {
          DEFAULT: "#9A6B14",
          soft: "#F6EEDD",
        },

        info: {
          DEFAULT: "#38BDF8",
          soft: "#E0F2FE",
        },

        // Nome histórico "dark", mas os valores seguem o tema activo.
        dark: {
          bg: "rgb(var(--c-bg) / <alpha-value>)",
          surface: "rgb(var(--c-surface) / <alpha-value>)",
          elevated: "rgb(var(--c-elevated) / <alpha-value>)",
          strong: "rgb(var(--c-strong) / <alpha-value>)",
          border: "rgb(var(--c-fg) / 0.09)",
          borderStrong: "rgb(var(--c-fg) / 0.16)",
          text: "rgb(var(--c-text) / <alpha-value>)",
          muted: "rgb(var(--c-text) / var(--a-muted))",
          faint: "rgb(var(--c-text) / var(--a-faint))",
        },

        brandGlow: "rgb(var(--c-brand-glow) / <alpha-value>)",
        warning: "rgb(var(--c-warning) / <alpha-value>)",
        danger: "rgb(var(--c-danger) / <alpha-value>)",

        surface: "#FFFFFF",
        muted: "#6B6B67",
      },

      borderRadius: {
        card: "1rem",
        "card-lg": "1.25rem",
      },

      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.08)",
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
        app: "480px",
      },
    },
  },

  plugins: [],
};

export default config;