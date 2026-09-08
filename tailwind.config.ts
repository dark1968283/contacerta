import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],

  theme: {
    extend: {
      colors: {
        ink: "#1C1B19",
        paper: "#F7F8F7",
        line: "#E8E9E7",
        surface: "#FFFFFF",
        muted: "#6B7280",

        brand: {
          DEFAULT: "#166C4E",
          dark: "#10523B",
          soft: "#E8F5EE",
        },

        alert: {
          DEFAULT: "#B4472B",
          soft: "#FCEDEA",
        },

        warn: {
          DEFAULT: "#B7791F",
          soft: "#FFF6DF",
        },

        info: {
          DEFAULT: "#3B82F6",
          soft: "#EFF6FF",
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
        app: "480px",
      },

      borderRadius: {
        card: "20px",
        "card-lg": "28px",
      },

      boxShadow: {
        card: "0 2px 12px rgba(0, 0, 0, 0.04)",
        floating: "0 12px 32px rgba(0, 0, 0, 0.08)",
      },

      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
    },
  },

  plugins: [],
};

export default config;