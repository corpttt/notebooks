/* Notebooks PWA — offline-first shell + notebooks + local/CDN KaTeX. */
const CACHE = "notebooks-shell-v12";
const NETWORK_MS = 3000;

const SHELL = [
  "./",
  "./index.html",
  "./site.css",
  "./site.css?v=12",
  "./site.js",
  "./site.js?v=12",
  "./theme.js",
  "./theme.js?v=12",
  "./session.css",
  "./session.css?v=12",
  "./session.js",
  "./session.js?v=12",
  "./session/plan.json",
  "./session/catalog.json",
  "./session/my-progress.json",
  "./manifest.json",
  "./precache.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

/* Replaced at publish with the full asset list. */
const PRECACHE = [
  "./_viz/discrete-tickets.js",
  "./_viz/matan-tickets.js",
  "./_viz/viz.css",
  "./_viz/viz.js",
  "./algebra-colloquium-checklist.html",
  "./algebra-colloquium.html",
  "./algebra-exam.html",
  "./algebra-kr2.html",
  "./algebra-practice.html",
  "./algebra-theory.html",
  "./algorithms.html",
  "./cpp.html",
  "./discrete-theory.html",
  "./discrete-tickets.html",
  "./discrete.html",
  "./english-media/img-001.jpg",
  "./english-media/img-002.jpg",
  "./english-media/img-003.png",
  "./english-media/img-004.png",
  "./english-media/img-005.jpg",
  "./english-media/img-006.png",
  "./english-media/img-007.png",
  "./english-media/img-008.png",
  "./english-media/img-009.png",
  "./english-media/img-010.png",
  "./english-media/img-011.png",
  "./english-media/img-012.png",
  "./english-media/img-013.png",
  "./english-media/img-014.png",
  "./english-media/img-015.png",
  "./english-media/img-016.png",
  "./english-media/img-017.jpg",
  "./english-media/img-018.jpg",
  "./english-media/img-019.jpg",
  "./english-media/img-020.jpg",
  "./english-media/img-021.jpg",
  "./english-media/img-022.jpg",
  "./english-media/img-023.png",
  "./english-media/img-024.jpg",
  "./english-media/img-025.jpg",
  "./english-media/img-026.jpg",
  "./english-media/img-027.jpg",
  "./english-media/img-028.jpg",
  "./english-media/img-029.png",
  "./english-media/img-030.png",
  "./english-media/img-031.png",
  "./english-media/img-032.png",
  "./english-media/img-033.jpg",
  "./english-media/img-034.jpg",
  "./english-media/img-035.jpg",
  "./english.html",
  "./favicon.ico",
  "./geometry-exam.html",
  "./geometry-practice.html",
  "./geometry-theory.html",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/subjects/algebra.png",
  "./icons/subjects/algorithms.png",
  "./icons/subjects/cpp.png",
  "./icons/subjects/discrete.png",
  "./icons/subjects/english.png",
  "./icons/subjects/geometry.png",
  "./icons/subjects/informatics.png",
  "./icons/subjects/matan.png",
  "./index.html",
  "./informatics.html",
  "./manifest.json",
  "./matan-cheat.html",
  "./matan-exam.html",
  "./matan-kr1.html",
  "./matan-kr2.html",
  "./matan-practice.html",
  "./matan-theory.html",
  "./review/cards-exam.json",
  "./review/ticket-sources.json",
  "./review.css",
  "./review.html",
  "./review.js",
  "./session/catalog.json",
  "./session/plan.json",
  "./session.css",
  "./session.js",
  "./site.css",
  "./site.js",
  "./styles.css",
  "./theme.js",
  "./vendor/katex/contrib/auto-render.min.js",
  "./vendor/katex/fonts/KaTeX_AMS-Regular.woff2",
  "./vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2",
  "./vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2",
  "./vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2",
  "./vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2",
  "./vendor/katex/fonts/KaTeX_Main-Bold.woff2",
  "./vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2",
  "./vendor/katex/fonts/KaTeX_Main-Italic.woff2",
  "./vendor/katex/fonts/KaTeX_Main-Regular.woff2",
  "./vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2",
  "./vendor/katex/fonts/KaTeX_Math-Italic.woff2",
  "./vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2",
  "./vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2",
  "./vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2",
  "./vendor/katex/fonts/KaTeX_Script-Regular.woff2",
  "./vendor/katex/fonts/KaTeX_Size1-Regular.woff2",
  "./vendor/katex/fonts/KaTeX_Size2-Regular.woff2",
  "./vendor/katex/fonts/KaTeX_Size3-Regular.woff2",
  "./vendor/katex/fonts/KaTeX_Size4-Regular.woff2",
  "./vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2",
  "./vendor/katex/katex.min.css",
  "./vendor/katex/katex.min.js",
  "./общее/тетрадь.css",
  "./общее/тетрадь.js",
  "./site.css?v=12",
  "./site.js?v=12",
  "./theme.js?v=12"
];

const KATEX = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist";
const KATEX_FONTS = [
  "KaTeX_AMS-Regular",
  "KaTeX_Caligraphic-Bold",
  "KaTeX_Caligraphic-Regular",
  "KaTeX_Fraktur-Bold",
  "KaTeX_Fraktur-Regular",
  "KaTeX_Main-Bold",
  "KaTeX_Main-BoldItalic",
  "KaTeX_Main-Italic",
  "KaTeX_Main-Regular",
  "KaTeX_Math-BoldItalic",
  "KaTeX_Math-Italic",
  "KaTeX_SansSerif-Bold",
  "KaTeX_SansSerif-Italic",
  "KaTeX_SansSerif-Regular",
  "KaTeX_Script-Regular",
  "KaTeX_Size1-Regular",
  "KaTeX_Size2-Regular",
  "KaTeX_Size3-Regular",
  "KaTeX_Size4-Regular",
  "KaTeX_Typewriter-Regular",
];
const KATEX_ASSETS = [
  `${KATEX}/katex.min.css`,
  `${KATEX}/katex.min.js`,
  `${KATEX}/contrib/auto-render.min.js`,
  ...KATEX_FONTS.map((f) => `${KATEX}/fonts/${f}.woff2`),
  "./vendor/katex/katex.min.css",
  "./vendor/katex/katex.min.js",
  "./vendor/katex/contrib/auto-render.min.js",
  ...KATEX_FONTS.map((f) => `./vendor/katex/fonts/${f}.woff2`),
];

function toAbs(url) {
  try {
    return new URL(url, self.location.href).href;
  } catch {
    return url;
  }
}

async function putAll(cache, urls) {
  await Promise.all(
    urls.map(async (url) => {
      try {
        const abs = toAbs(url);
        const res = await fetch(abs, { cache: "reload", mode: "cors" });
        if (res && res.ok) {
          await cache.put(abs, res.clone());
          const u = new URL(abs);
          if (u.search) {
            await cache.put(u.origin + u.pathname, res.clone());
          }
        }
      } catch (_) {
        /* one miss must not break install */
      }
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const urls = [...new Set([...SHELL, ...PRECACHE, ...KATEX_ASSETS])];
      await putAll(cache, urls);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ).then(() => self.clients.claim())
    )
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "NB_REFRESH") {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE);
        const urls = [...new Set([...SHELL, ...PRECACHE, ...KATEX_ASSETS])];
        await putAll(cache, urls);
      })()
    );
  }
});

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isKatexCdn(url) {
  return (
    url.hostname.endsWith("jsdelivr.net") &&
    url.pathname.includes("/katex@")
  );
}

function isAppNavigate(url) {
  const p = url.pathname.replace(/\/+$/, "") || "/";
  return (
    /\/notebooks$/i.test(p) ||
    /\/index\.html$/i.test(url.pathname) ||
    /\/notebooks\/?$/i.test(url.pathname)
  );
}

async function fromCache(request) {
  const cache = await caches.open(CACHE);
  const direct =
    (await cache.match(request)) ||
    (await cache.match(request, { ignoreSearch: true, ignoreVary: true }));
  if (direct) return direct;

  try {
    const url = typeof request === "string" ? new URL(toAbs(request)) : new URL(request.url);
    const candidates = [
      url.href,
      url.origin + url.pathname,
      url.origin + url.pathname.replace(/\/$/, "") + "/",
      url.origin + url.pathname.replace(/\/$/, "") + "/index.html",
      toAbs("./"),
      toAbs("./index.html"),
    ];
    for (const href of [...new Set(candidates)]) {
      const hit =
        (await cache.match(href)) ||
        (await cache.match(href, { ignoreSearch: true }));
      if (hit) return hit;
    }
  } catch (_) {}
  return null;
}

async function putBoth(cache, request, res) {
  await cache.put(request, res.clone());
  try {
    const u = new URL(typeof request === "string" ? toAbs(request) : request.url);
    if (u.search) {
      await cache.put(u.origin + u.pathname, res.clone());
    }
  } catch (_) {}
}

async function fetchWithTimeout(request, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(request, { cache: "no-cache", signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function staleWhileRevalidate(event) {
  const cache = await caches.open(CACHE);
  const cached = await fromCache(event.request);

  const networkPromise = fetchWithTimeout(event.request, NETWORK_MS)
    .then(async (res) => {
      if (res && res.ok) await putBoth(cache, event.request, res);
      return res;
    })
    .catch(() => null);

  if (cached) {
    event.waitUntil(networkPromise);
    return cached;
  }

  const net = await networkPromise;
  if (net && net.ok) return net;

  if (event.request.mode === "navigate" || isAppNavigate(new URL(event.request.url))) {
    return (
      (await fromCache("./index.html")) ||
      (await fromCache("./")) ||
      new Response(
        "<!doctype html><meta charset=utf-8><title>Офлайн</title><p>Нет кэша тетрадей. Открой сайт один раз онлайн и дождись установки.</p>",
        { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
      )
    );
  }
  return new Response("", { status: 503, statusText: "Offline" });
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (isKatexCdn(url)) {
    event.respondWith(staleWhileRevalidate(event));
    return;
  }

  if (!isSameOrigin(url)) return;

  event.respondWith(staleWhileRevalidate(event));
});
