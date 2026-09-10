import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],

  theme: {
    extend: {
      colors: {
        ink: "#1C1B19",
        paper: "#FAFAF7",
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

        dark: {
          bg: "#0B1110",
          surface: "#101816",
          elevated: "#141F1C",
          strong: "#182722",
          border: "rgba(255,255,255,0.08)",
          borderStrong: "rgba(255,255,255,0.14)",
          text: "#F5F6F4",
          muted: "rgba(245,246,244,0.55)",
          faint: "rgba(245,246,244,0.35)",
        },

        brandGlow: "#22C766",
        warning: "#F5B754",
        danger: "#F2685C",

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