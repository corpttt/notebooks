(function () {
  const CACHE_NAME = "notebooks-shell-v11";
  const PROTECTED_KEYS = [
    "ucheba-session-progress",
    "ucheba-review-state",
    "ucheba-review-until",
    "ucheba-session-tab",
    "ucheba-theme",
    "nb-open-folders",
  ];

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
    el._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function snapshotProgress() {
    const snap = {};
    for (const k of PROTECTED_KEYS) {
      try {
        snap[k] = localStorage.getItem(k);
      } catch (_) {}
    }
    return snap;
  }

  function restoreProgress(snap) {
    for (const [k, v] of Object.entries(snap || {})) {
      if (v == null) continue;
      try {
        if (localStorage.getItem(k) == null) localStorage.setItem(k, v);
      } catch (_) {}
    }
  }

  async function refillCache() {
    if (!("caches" in window)) return { done: 0, total: 0 };
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
      "./session.css",
      "./session.js",
      "./session/plan.json",
      "./session/catalog.json",
      "./manifest.json",
      "./precache.json",
    ];
    const urls = [...new Set([...shell, ...list])];
    let done = 0;
    const chunk = 8;
    for (let i = 0; i < urls.length; i += chunk) {
      const slice = urls.slice(i, i + chunk);
      await Promise.all(
        slice.map(async (u) => {
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
    }
    return { done, total: urls.length };
  }

  async function softRefresh() {
    const btn = document.getElementById("btn-refresh");
    if (btn) btn.disabled = true;
    const snap = snapshotProgress();
    if (!navigator.onLine) {
      toast("Офлайн — кэш и прогресс не трогаем");
      if (btn) btn.disabled = false;
      return;
    }
    toast("Обновляю кэш… прогресс сессии на месте");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg?.update();
      if (reg?.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "NB_REFRESH" });
      }
      // Refill on top of existing cache — never delete first, never touch localStorage
      const { done, total } = await refillCache();
      restoreProgress(snap);
      toast(`Офлайн готов: ${done}/${total} · отметки сохранены`);
    } catch (_) {
      restoreProgress(snap);
      toast("Обновление не удалось — прогресс на месте");
    }
    if (btn) btn.disabled = false;
    setTimeout(() => location.reload(), 600);
  }

  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("./sw.js?v=11")
      .then((reg) => {
        reg.update().catch(() => {});
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
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
      ?.addEventListener("click", softRefresh);
    window.SessionToday?.wireTabs?.();
    window.SessionToday?.init?.({
      today: document.getElementById("session-today"),
      calendar: document.getElementById("session-calendar"),
    });
    wireFolders();
    registerSW();
  });
})();
