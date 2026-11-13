/* Notebooks PWA — precache shell + all notebooks + KaTeX (offline). */
const CACHE = "notebooks-shell-v6";
const SHELL = [
  "./",
  "./index.html",
  "./site.css",
  "./site.css?v=6",
  "./site.js",
  "./site.js?v=6",
  "./theme.js",
  "./theme.js?v=6",
  "./manifest.json",
  "./precache.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

/* Replaced at publish with the full asset list. */
const PRECACHE = [
  "./_viz/viz.css",
  "./_viz/viz.js",
  "./algebra-colloquium-checklist.html",
  "./algebra-colloquium.html",
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
  "./matan-kr1.html",
  "./matan-practice.html",
  "./matan-theory.html",
  "./review/cards-current.json",
  "./review/cards-exam.json",
  "./review.css",
  "./review.html",
  "./review.js",
  "./site.css",
  "./site.js",
  "./styles.css",
  "./theme.js",
  "./общее/тетрадь.css",
  "./общее/тетрадь.js",
  "./site.css?v=6",
  "./site.js?v=6",
  "./theme.js?v=6"
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
];

async function putAll(cache, urls) {
  await Promise.all(
    urls.map((url) =>
      cache.add(url).catch(() => undefined)
    )
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

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isKatexCdn(url) {
  return (
    url.hostname.endsWith("jsdelivr.net") &&
    url.pathname.includes("/katex@")
  );
}

function isShellHtml(url) {
  const p = url.pathname;
  return /\/index\.html$/i.test(p) || /\/notebooks\/?$/i.test(p);
}

function isHtml(url) {
  return /\.html$/i.test(url.pathname);
}

async function fromCache(request) {
  const cache = await caches.open(CACHE);
  return (
    (await cache.match(request)) ||
    (await cache.match(request, { ignoreSearch: true })) ||
    null
  );
}

async function networkFirst(event) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(event.request, { cache: "no-cache" });
    if (res && res.ok) {
      await cache.put(event.request, res.clone());
      try {
        const u = new URL(event.request.url);
        if (u.search) {
          await cache.put(new Request(u.origin + u.pathname), res.clone());
        }
      } catch (_) {}
      return res;
    }
  } catch {
    /* offline */
  }
  return (await fromCache(event.request)) || Response.error();
}

async function cacheFirst(event) {
  const hit = await fromCache(event.request);
  if (hit) return hit;
  try {
    const res = await fetch(event.request);
    if (res && res.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(event.request, res.clone());
    }
    return res;
  } catch {
    if (event.request.mode === "navigate") {
      return (
        (await fromCache("./index.html")) ||
        (await fromCache("./")) ||
        Response.error()
      );
    }
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (isKatexCdn(url)) {
    event.respondWith(cacheFirst(event));
    return;
  }

  if (!isSameOrigin(url)) return;

  if (
    isShellHtml(url) ||
    isHtml(url) ||
    event.request.mode === "navigate"
  ) {
    event.respondWith(networkFirst(event));
    return;
  }

  event.respondWith(cacheFirst(event));
});
