/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // O Android só verifica a ligação site↔app se este ficheiro vier como JSON.
        source: "/.well-known/assetlinks.json",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      {
        // Faz o telemóvel reconhecer o ficheiro como app Android para instalar.
        source: "/download/ContaCerta.apk",
        headers: [
          { key: "Content-Type", value: "application/vnd.android.package-archive" },
          { key: "Content-Disposition", value: 'attachment; filename="ContaCerta.apk"' },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
  // PWA (Fase 7.1) implementada sem plugin externo: manifest em
  // src/app/manifest.ts, service worker em public/sw.js, registo em
  // src/components/pwa/ServiceWorkerRegister.tsx. Nenhuma configuração
  // adicional é necessária aqui.
};

module.exports = nextConfig;
