const CACHE = "notebooks-shell-v3";
const SHELL = [
  "./",
  "./index.html",
  "./site.css",
  "./site.css?v=3",
  "./site.js",
  "./site.js?v=3",
  "./theme.js",
  "./theme.js?v=3",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(SHELL.map((url) => cache.add(url).catch(() => undefined)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))).then(
        () => self.clients.claim()
      )
    )
  );
});

function isShellHtml(url) {
  const p = url.pathname;
  return /\/index\.html$/i.test(p) || /\/notebooks\/?$/i.test(p);
}

function isShellAsset(url) {
  const p = url.pathname;
  return /\/(site\.css|site\.js|theme\.js|sw\.js)$/i.test(p) || /\/_viz\/[^/]+$/i.test(p);
}

function isNotebookHtml(url) {
  return /\.html$/i.test(url.pathname) && url.origin === self.location.origin;
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
  return (
    (await cache.match(event.request)) ||
    (await cache.match(event.request, { ignoreSearch: true })) ||
    Response.error()
  );
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;

  // KaTeX CDN — network only, do not cache aggressively in SW
  if (url.origin !== self.location.origin) return;

  if (
    isShellHtml(url) ||
    isShellAsset(url) ||
    isNotebookHtml(url) ||
    event.request.mode === "navigate"
  ) {
    event.respondWith(networkFirst(event));
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(event.request, { ignoreSearch: true });
      if (hit) return hit;
      try {
        const res = await fetch(event.request);
        if (res && res.ok) {
          cache.put(event.request, res.clone());
        }
        return res;
      } catch {
        if (event.request.mode === "navigate") {
          return (
            (await cache.match("./index.html")) ||
            (await cache.match("./")) ||
            Response.error()
          );
        }
        return Response.error();
      }
    })()
  );
});
