import type { MetadataRoute } from "next";

/**
 * Next.js gera automaticamente /manifest.webmanifest a partir deste ficheiro
 * (convenção oficial do App Router) e injeta o <link rel="manifest">
 * no <head> sozinho — não é preciso adicionar nada manualmente ao layout.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ContaCerta",
    short_name: "ContaCerta",
    description:
      "Gestão simples de vendas, stock, clientes e dívidas para pequenos negócios em Moçambique.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    // Mesmas cores já usadas em tailwind.config.ts (brand / paper) e no
    // viewport.themeColor do layout — não introduz nenhuma cor nova.
    background_color: "#FAFAF7",
    theme_color: "#166C4E",
    lang: "pt",
    categories: ["business", "finance", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
