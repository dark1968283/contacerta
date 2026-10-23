// ContaCerta — Service Worker (v2: abrir a app sem internet)
//
// O que este worker faz:
//  1. Guarda as páginas da app (/dashboard...) depois de abertas COM internet,
//     para que a app abra mesmo sem rede (mostrando os últimos dados vistos).
//  2. Guarda os ficheiros da app (JavaScript, CSS, ícones) para funcionar offline.
//  3. Com internet, vai SEMPRE primeiro à rede (os dados estão sempre frescos);
//     só usa as páginas guardadas quando a rede falha.
//
// O que NUNCA faz:
//  - Nunca confirma vendas, stock, pagamentos ou dívidas. Vendas feitas sem
//    internet ficam numa fila no telemóvel e só contam quando o servidor as aceita.
//  - Nunca guarda pedidos ao Supabase, à API, nem formulários (POST).
//  - Ao terminar sessão (abrir /login), apaga todas as páginas guardadas,
//    para os dados do negócio não ficarem no telemóvel.

const VERSION = "v2";
const STATIC_CACHE = `contacerta-static-${VERSION}`;
const PAGES_CACHE = `contacerta-pages-${VERSION}`;
const ASSETS_CACHE = `contacerta-assets-${VERSION}`;
const KEEP = [STATIC_CACHE, PAGES_CACHE, ASSETS_CACHE];

const STATIC_WHITELIST = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/favicon.ico",
  "/manifest.webmanifest",
];

// Páginas preparadas para uso offline logo após o login.
const WARM_PAGES = [
  "/dashboard",
  "/dashboard/vendas/nova",
  "/dashboard/vendas",
  "/dashboard/produtos",
  "/dashboard/dividas",
  "/dashboard/clientes",
];

const NETWORK_TIMEOUT_MS = 7000;
const MAX_ASSETS = 250;

const OFFLINE_HTML = `<!doctype html><html lang="pt"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Sem internet · ContaCerta</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0B1110;color:#F5F6F4;font-family:system-ui,-apple-system,sans-serif;padding:24px;text-align:center}
.c{max-width:340px}h1{font-size:22px;margin:16px 0 8px}p{color:rgba(245,246,244,.7);line-height:1.5;margin:0 0 20px}
button{background:#22C766;color:#06120C;border:0;border-radius:14px;padding:14px 22px;font-size:16px;font-weight:700}</style></head>
<body><div class="c"><div style="font-size:48px">📶</div><h1>Sem internet</h1>
<p>Esta página ainda não foi aberta neste telemóvel com internet. Ligue-se uma vez à internet e depois a app passa a abrir mesmo sem rede.</p>
<button onclick="location.reload()">Tentar de novo</button></div></body></html>`;

// ── Instalação / activação ────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_WHITELIST)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Ajudas ────────────────────────────────────────────────────────────────

function isAppPage(pathname) {
  return pathname === "/" || pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

function isAuthPage(pathname) {
  return pathname.startsWith("/login") || pathname.startsWith("/signup");
}

function pageKey(url) {
  // Uma entrada por página (com os parâmetros, ex.: ?periodo=7-dias).
  const u = new URL(url);
  return u.origin + u.pathname + u.search;
}

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function clearPages() {
  await caches.delete(PAGES_CACHE);
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

/** Guarda a página se for uma resposta boa de uma página da app (nunca redirecções). */
async function storePage(request, response) {
  if (!response || !response.ok || response.type !== "basic" || response.redirected) return;
  const finalPath = new URL(response.url).pathname;
  if (!isAppPage(finalPath) || finalPath === "/") return;
  const cache = await caches.open(PAGES_CACHE);
  await cache.put(pageKey(request.url), response);
}

async function cachedPage(url) {
  const cache = await caches.open(PAGES_CACHE);
  const u = new URL(url);
  let hit = await cache.match(pageKey(url));
  if (!hit) hit = await cache.match(u.origin + u.pathname, { ignoreSearch: true });
  if (!hit && u.pathname === "/dashboard") {
    hit = await cache.match(u.origin + "/dashboard", { ignoreSearch: true });
  }
  return hit;
}

// ── Pedidos ───────────────────────────────────────────────────────────────

async function handleNavigation(event) {
  const { request } = event;
  const url = new URL(request.url);

  // Login / registo: rede normal. Se chegou ao ecrã de login, a sessão
  // terminou — apaga as páginas guardadas do negócio.
  if (isAuthPage(url.pathname)) {
    try {
      const response = await fetch(request);
      if (response.ok && isAuthPage(new URL(response.url).pathname)) event.waitUntil(clearPages());
      return response;
    } catch {
      const cached = await cachedPage(request.url);
      return cached || new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
  }

  const network = fetch(request);
  try {
    const response = await withTimeout(network, NETWORK_TIMEOUT_MS);
    if (response.redirected && isAuthPage(new URL(response.url).pathname)) {
      event.waitUntil(clearPages());
    } else {
      event.waitUntil(storePage(request, response.clone()));
    }
    return response;
  } catch {
    // Rede lenta: continua a actualizar a página guardada em segundo plano.
    event.waitUntil(network.then((r) => storePage(request, r.clone())).catch(() => {}));
    // A app arranca em "/": sem rede, vai directamente para o Início guardado.
    if (url.pathname === "/" && (await cachedPage(url.origin + "/dashboard"))) {
      return Response.redirect(url.origin + "/dashboard", 302);
    }
    const cached = await cachedPage(request.url);
    if (cached) return cached;
    try {
      return await network; // última tentativa, caso a rede ainda responda
    } catch {
      return new Response(OFFLINE_HTML, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
  }
}

async function handleNextAsset(request) {
  const cache = await caches.open(ASSETS_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    trimCache(ASSETS_CACHE, MAX_ASSETS);
  }
  return response;
}

async function handleStatic(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request, { ignoreSearch: true });
  const fromNetwork = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => hit);
  return hit || fromNetwork;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // formulários e acções: sempre pela rede

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Supabase e outros: nunca

  // Navegação para páginas da app ou login.
  if (request.mode === "navigate" && (isAppPage(url.pathname) || isAuthPage(url.pathname))) {
    event.respondWith(handleNavigation(event));
    return;
  }

  // Pedidos internos do Next (dados das páginas, RSC) e API: só rede.
  if (request.headers.get("RSC") || url.searchParams.has("_rsc") || url.pathname.startsWith("/api/")) return;

  // Ficheiros da app (nomes com versão, nunca mudam).
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(handleNextAsset(request));
    return;
  }

  // Ícones, imagens, animações, manifest.
  if (
    STATIC_WHITELIST.includes(url.pathname) ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/animations/") ||
    url.pathname === "/mastercard-logo.svg"
  ) {
    event.respondWith(handleStatic(request));
  }
});

// ── Preparar a app para uso offline (pedido pela app depois do login) ────

async function warmUp() {
  const pages = await caches.open(PAGES_CACHE);
  const assets = await caches.open(ASSETS_CACHE);
  const assetUrls = new Set();

  for (const path of WARM_PAGES) {
    try {
      const response = await fetch(path, { credentials: "same-origin" });
      if (!response.ok || response.redirected) continue; // sessão terminou: não guarda nada
      const html = await response.clone().text();
      await pages.put(new URL(path, self.location.origin).href, response);
      for (const m of html.matchAll(/\/_next\/static\/[^"'\s\\)]+/g)) assetUrls.add(m[0]);
    } catch {
      return; // sem rede: tenta noutra altura
    }
  }

  for (const asset of assetUrls) {
    try {
      if (await assets.match(asset)) continue;
      const response = await fetch(asset);
      if (response.ok) await assets.put(asset, response);
    } catch {
      return;
    }
  }
  await trimCache(ASSETS_CACHE, MAX_ASSETS);
}

self.addEventListener("message", (event) => {
  const type = event.data && event.data.type;
  if (type === "WARM_OFFLINE") event.waitUntil(warmUp());
  if (type === "CLEAR_OFFLINE") event.waitUntil(clearPages());
});
