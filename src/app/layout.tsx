import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import IntroBootScript from "@/components/intro/IntroBootScript";
import ContaCertaSplash from "@/components/intro/ContaCertaSplash";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: "ContaCerta — O seu negócio. Sob controlo.",
  description:
    "Gestão simples de vendas, stock, clientes e dívidas para pequenos negócios em Moçambique.",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ContaCerta",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#166C4E",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-MZ" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Aplica o tema guardado antes de desenhar a página. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="bg-paper text-ink antialiased min-h-dvh">
        <IntroBootScript />
        <ContaCertaSplash />

        {children}

        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
