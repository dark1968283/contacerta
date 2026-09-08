/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA (Fase 7.1) implementada sem plugin externo: manifest em
  // src/app/manifest.ts, service worker em public/sw.js, registo em
  // src/components/pwa/ServiceWorkerRegister.tsx. Nenhuma configuração
  // adicional é necessária aqui.
};

module.exports = nextConfig;
