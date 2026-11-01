(function () {
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

  async function hardRefresh() {
    const btn = document.getElementById("btn-refresh");
    if (btn) btn.disabled = true;
    toast("Обновляю…");
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      const reg = await navigator.serviceWorker.getRegistration();
      await reg?.update();
      const url = location.href.split("#")[0];
      await fetch(url, { cache: "reload", credentials: "same-origin" });
      const assets = [
        "./site.css",
        "./site.js",
        "./theme.js",
        "./index.html",
        "./manifest.json",
      ];
      await Promise.all(
        assets.map((u) =>
          fetch(u, { cache: "reload", credentials: "same-origin" }).catch(
            () => null
          )
        )
      );
    } catch (_) {}
    location.reload();
  }

  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("./sw.js?v=4")
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
