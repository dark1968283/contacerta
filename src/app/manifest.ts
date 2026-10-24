import type { MetadataRoute } from "next";

/**
 * Next.js gera automaticamente /manifest.webmanifest a partir deste ficheiro
 * (convenção oficial do App Router) e injeta o <link rel="manifest">
 * no <head> sozinho — não é preciso adicionar nada manualmente ao layout.
 */
/** Campos do manifesto que o tipo do Next ainda não conhece. */
type ExtraManifest = {
  /** Tocar no ícone com a app já aberta volta à mesma janela, em vez de abrir outra. */
  launch_handler?: { client_mode: string | string[] };
  /** O tipo do Next não conhece form_factor/label, que o Android usa no ecrã de instalação. */
  screenshots?: {
    src: string;
    sizes?: string;
    type?: string;
    form_factor?: "narrow" | "wide";
    label?: string;
  }[];
};

export default function manifest(): Omit<MetadataRoute.Manifest, "screenshots"> & ExtraManifest {
  return {
    // Identificador fixo da app: não muda mesmo que a página inicial mude.
    id: "/",
    name: "ContaCerta",
    short_name: "ContaCerta",
    description:
      "Gestão simples de vendas, stock, clientes e dívidas para pequenos negócios em Moçambique.",
    start_url: "/",
    // Tudo dentro do site abre na app (sem barra do browser).
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Mesmas cores já usadas em tailwind.config.ts (brand / paper) e no
    // viewport.themeColor do layout — não introduz nenhuma cor nova.
    // Ecrã de arranque escuro, igual ao tema por defeito (evita um "clarão" branco ao abrir).
    background_color: "#0B1110",
    theme_color: "#166C4E",
    lang: "pt",
    dir: "ltr",
    launch_handler: { client_mode: ["focus-existing", "auto"] },
    categories: ["business", "finance", "productivity"],
    // Atalhos ao manter o dedo no ícone da app (Android).
    shortcuts: [
      {
        name: "Nova venda",
        short_name: "Vender",
        description: "Registar uma venda",
        url: "/dashboard/vendas/nova",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Produtos",
        short_name: "Produtos",
        description: "Ver stock e repor produtos",
        url: "/dashboard/produtos",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Dívidas",
        short_name: "Dívidas",
        description: "Ver quem lhe deve e receber",
        url: "/dashboard/dividas",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
    // Imagens mostradas no ecrã de instalação (Android) e na loja.
    screenshots: [
      {
        src: "/screenshots/inicio.webp",
        sizes: "739x1514",
        type: "image/webp",
        form_factor: "narrow",
        label: "Resumo do negócio: vendas, lucro e o que tem a receber",
      },
      {
        src: "/screenshots/nova-venda.webp",
        sizes: "739x1514",
        type: "image/webp",
        form_factor: "narrow",
        label: "Vender é tocar nos produtos",
      },
      {
        src: "/screenshots/confirmar.webp",
        sizes: "739x1514",
        type: "image/webp",
        form_factor: "narrow",
        label: "Confirmar a venda: pagou agora ou fica a dever",
      },
      {
        src: "/screenshots/venda-registada.webp",
        sizes: "739x1514",
        type: "image/webp",
        form_factor: "narrow",
        label: "Venda registada e stock actualizado",
      },
      {
        src: "/screenshots/produto.webp",
        sizes: "739x1514",
        type: "image/webp",
        form_factor: "narrow",
        label: "Repor stock de um produto",
      },
    ],
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
