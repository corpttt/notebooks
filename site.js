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
      const url = location.href.split("#")[0];
      await fetch(url, { cache: "reload", credentials: "same-origin" });
      const assets = ["./site.css", "./site.js", "./theme.js", "./index.html"];
      await Promise.all(
        assets.map((u) =>
          fetch(u + "?t=" + Date.now(), { cache: "reload" }).catch(() => null)
        )
      );
    } catch (_) {}
    location.reload();
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn-refresh")?.addEventListener("click", hardRefresh);
  });
})();
