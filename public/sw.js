// ContaCerta — Service Worker (Fase 7.1)
//
// REGRA CRÍTICA: este ficheiro nunca decide, sozinho, se uma venda, stock,
// pagamento, dívida ou assinatura está confirmada. Isso é sempre resolvido
// pelo servidor/Supabase. O único papel deste worker é acelerar o
// carregamento de um conjunto pequeno e explícito de assets estáticos.
//
// Estratégia: cache-first, mas SÓ para os caminhos na whitelist abaixo.
// Qualquer outro pedido (páginas, API, Supabase, tudo o resto) passa
// diretamente para a rede, sem interceção — o navegador trata-o
// normalmente, como se este ficheiro não existisse.

const CACHE_NAME = "contacerta-static-v1";

// Whitelist explícita — apenas ícones e o manifest. Nada de HTML,
// nada de rotas do dashboard, nada de Supabase.
const STATIC_WHITELIST = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/favicon.ico",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_WHITELIST)).catch(() => {
      // Falha de pré-cache não deve impedir a instalação do worker —
      // os assets continuam a funcionar normalmente pela rede.
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

function isWhitelistedStaticAsset(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  return STATIC_WHITELIST.includes(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Fora da whitelist (isto inclui TODAS as páginas, toda a API, e
  // qualquer pedido ao Supabase) → não interceta, deixa a rede tratar.
  if (!isWhitelistedStaticAsset(request)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});
