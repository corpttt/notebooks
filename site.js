(function () {
  const CACHE_NAME = "notebooks-shell-v6";

  function toast(msg) {
    let el = document.getElementById("nb-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "nb-toast";
      el.className = "nb-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 1600);
  }

  async function refillCache() {
    if (!("caches" in window)) return;
    const cache = await caches.open(CACHE_NAME);
    let list = [];
    try {
      const res = await fetch("./precache.json", {
        cache: "reload",
        credentials: "same-origin",
      });
      if (res.ok) list = await res.json();
    } catch (_) {}
    if (!Array.isArray(list)) list = [];
    const shell = [
      "./",
      "./index.html",
      "./site.css",
      "./site.js",
      "./theme.js",
      "./manifest.json",
      "./precache.json",
    ];
    const urls = [...new Set([...shell, ...list])];
    let done = 0;
    await Promise.all(
      urls.map(async (u) => {
        try {
          const res = await fetch(u, {
            cache: "reload",
            credentials: "same-origin",
          });
          if (res && res.ok) {
            await cache.put(u, res.clone());
            done += 1;
          }
        } catch (_) {}
      })
    );
    return { done, total: urls.length };
  }

  async function hardRefresh() {
    const btn = document.getElementById("btn-refresh");
    if (btn) btn.disabled = true;
    toast("Кэширую тетради…");
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      const reg = await navigator.serviceWorker.getRegistration();
      await reg?.update();
      const { done, total } = await refillCache();
      toast(`Офлайн: ${done}/${total}`);
    } catch (_) {
      toast("Обновление не удалось");
    }
    setTimeout(() => location.reload(), 500);
  }

  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("./sw.js?v=6")
      .then((reg) => {
        reg.update().catch(() => {});
        reg.addEventListener("updatefound", () => {
          const w = reg.installing;
          if (!w) return;
          w.addEventListener("statechange", () => {
            if (w.state === "installed" && navigator.serviceWorker.controller) {
              location.reload();
            }
          });
        });
      })
      .catch(() => {});
  }

  function wireFolders() {
    const root = document.querySelector(".nb-folders");
    if (!root) return;
    const key = "nb-open-folders";
    let open = new Set();
    try {
      open = new Set(JSON.parse(localStorage.getItem(key) || "[]"));
    } catch (_) {}

    root.querySelectorAll(".nb-folder").forEach((folder) => {
      const id = folder.dataset.folder;
      const btn = folder.querySelector(".nb-folder-toggle");
      if (!btn) return;
      if (open.has(id)) {
        folder.classList.add("is-open");
        folder.setAttribute("open", "");
        btn.setAttribute("aria-expanded", "true");
      }
      btn.addEventListener("click", () => {
        const next = !folder.classList.contains("is-open");
        folder.classList.toggle("is-open", next);
        if (next) folder.setAttribute("open", "");
        else folder.removeAttribute("open");
        btn.setAttribute("aria-expanded", next ? "true" : "false");
        if (next) open.add(id);
        else open.delete(id);
        try {
          localStorage.setItem(key, JSON.stringify([...open]));
        } catch (_) {}
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document
      .getElementById("btn-refresh")
      ?.addEventListener("click", hardRefresh);
    wireFolders();
    registerSW();
  });
})();
