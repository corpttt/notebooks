/* Общая оболочка тетрадей: тема, меню, разделы, таблицы, лайтбокс */
(function () {
  "use strict";

  var THEME_KEY = "ucheba-theme"; /* light | dark | system */

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function resolveTheme(pref) {
    if (pref === "light" || pref === "dark") return pref;
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }

  function getPref() {
    try {
      var v = localStorage.getItem(THEME_KEY);
      if (v === "light" || v === "dark" || v === "system") return v;
      /* старый формат theme.js — только light/dark */
      if (v === "light" || v === "dark") return v;
    } catch (e) {}
    return "system";
  }

  function setPref(pref) {
    try {
      localStorage.setItem(THEME_KEY, pref);
    } catch (e) {}
  }

  function applyTheme(pref) {
    var resolved = resolveTheme(pref);
    document.documentElement.setAttribute("data-theme", resolved);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", resolved === "light" ? "#f4f1ea" : "#0d1117");
    }
    document.querySelectorAll(".nb-theme-row button").forEach(function (btn) {
      btn.setAttribute(
        "aria-pressed",
        btn.getAttribute("data-theme-pref") === pref ? "true" : "false"
      );
    });
  }

  /* ——— Меню ——— */
  function buildMenu() {
    if (document.querySelector(".nb-menu-btn")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nb-menu-btn";
    btn.setAttribute("aria-label", "Меню тетради");
    btn.textContent = "☰";

    var backdrop = document.createElement("div");
    backdrop.className = "nb-menu-backdrop";

    var panel = document.createElement("div");
    panel.className = "nb-menu-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Меню");

    var close = document.createElement("button");
    close.type = "button";
    close.className = "nb-menu-close";
    close.textContent = "Закрыть";

    var hTheme = document.createElement("h2");
    hTheme.textContent = "Тема";

    var themeRow = document.createElement("div");
    themeRow.className = "nb-theme-row";
    [
      ["light", "Светлая"],
      ["dark", "Тёмная"],
      ["system", "Как в системе"],
    ].forEach(function (pair) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("data-theme-pref", pair[0]);
      b.textContent = pair[1];
      b.addEventListener("click", function () {
        setPref(pair[0]);
        applyTheme(pair[0]);
      });
      themeRow.appendChild(b);
    });

    var hToc = document.createElement("h2");
    hToc.textContent = "Оглавление";

    var tocList = document.createElement("ul");
    tocList.className = "nb-menu-toc";

    var links = collectTocLinks();
    links.forEach(function (item) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.text;
      a.addEventListener("click", function () {
        closeMenu();
      });
      li.appendChild(a);
      tocList.appendChild(li);
    });

    var extra = document.createElement("div");
    extra.className = "nb-menu-links";

    var home = document.createElement("a");
    home.href = resolveHomeHref();
    home.textContent = "← Все тетради";
    extra.appendChild(home);

    var refresh = document.createElement("button");
    refresh.type = "button";
    refresh.textContent = "↻ Обновить";
    refresh.addEventListener("click", function () {
      try {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: "NB_REFRESH" });
        }
      } catch (e) {}
      location.reload();
    });
    extra.appendChild(refresh);

    panel.appendChild(close);
    panel.appendChild(hTheme);
    panel.appendChild(themeRow);
    panel.appendChild(hToc);
    panel.appendChild(tocList);
    panel.appendChild(extra);

    document.body.appendChild(btn);
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    function openMenu() {
      panel.classList.add("open");
      backdrop.classList.add("open");
    }
    function closeMenu() {
      panel.classList.remove("open");
      backdrop.classList.remove("open");
    }

    btn.addEventListener("click", openMenu);
    close.addEventListener("click", closeMenu);
    backdrop.addEventListener("click", closeMenu);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  function resolveHomeHref() {
    var a = document.querySelector(".nb-brand");
    if (a && a.getAttribute("href")) return a.getAttribute("href");
    if (location.pathname.indexOf("/notebooks/") !== -1) return "./index.html";
    return "../";
  }

  function collectTocLinks() {
    var out = [];
    var seen = {};
    document.querySelectorAll("nav.toc a[href^='#']").forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href || seen[href]) return;
      seen[href] = true;
      out.push({ href: href, text: (a.textContent || "").trim() || href });
    });
    if (out.length) return out;

    findSections().forEach(function (s) {
      if (!s.id || seen["#" + s.id]) return;
      seen["#" + s.id] = true;
      out.push({ href: "#" + s.id, text: s.title });
    });
    return out;
  }

  /* ——— Разделы ——— */
  function findSections() {
    var sections = [];
    var nodes = document.querySelectorAll(
      "main > section[id], main > .card[id], main section.card[id]"
    );
    if (nodes.length >= 2) {
      nodes.forEach(function (el) {
        var h = el.querySelector("h2, h1");
        sections.push({
          el: el,
          id: el.id,
          title: cleanTitle(h ? h.textContent : el.id),
        });
      });
      return sections;
    }

    var proseHs = document.querySelectorAll(".prose > h2[id], main .prose h2[id]");
    if (proseHs.length >= 2) {
      proseHs.forEach(function (h) {
        if ((h.id || "").toLowerCase() === "оглавление") return;
        sections.push({
          el: h,
          id: h.id,
          title: cleanTitle(h.textContent),
        });
      });
      return sections;
    }

    var anyH2 = document.querySelectorAll("main h2[id]");
    anyH2.forEach(function (h) {
      if ((h.id || "").toLowerCase() === "оглавление") return;
      sections.push({
        el: h,
        id: h.id,
        title: cleanTitle(h.textContent),
      });
    });
    return sections;
  }

  function cleanTitle(t) {
    return String(t || "")
      .replace(/\s+/g, " ")
      .replace(/⚡.*$/, "")
      .trim()
      .slice(0, 72);
  }

  function buildSectionNav() {
    if (document.body.hasAttribute("data-no-section-nav")) return;
    var sections = findSections();
    if (sections.length < 2) return;

    sections.forEach(function (s, i) {
      var host = s.el;
      if (host.tagName && /^H[12]$/i.test(host.tagName)) {
        /* вставить навигацию перед следующим h2 или в конец prose */
        var block = document.createElement("div");
        block.className = "nb-sec-nav";
        fillNav(block, sections, i);
        var next = null;
        for (var j = i + 1; j < sections.length; j++) {
          next = sections[j].el;
          break;
        }
        if (next) {
          next.parentNode.insertBefore(block, next);
        } else {
          var prose = host.closest(".prose") || host.parentNode;
          prose.appendChild(block);
        }
      } else {
        var nav = document.createElement("div");
        nav.className = "nb-sec-nav";
        fillNav(nav, sections, i);
        host.appendChild(nav);
      }
    });

    var float = document.createElement("div");
    float.className = "nb-float-nav";
    float.setAttribute("aria-hidden", "false");
    document.body.appendChild(float);

    function updateFloat() {
      var idx = 0;
      var mid = window.scrollY + window.innerHeight * 0.35;
      for (var i = 0; i < sections.length; i++) {
        var top = sections[i].el.getBoundingClientRect().top + window.scrollY;
        if (top <= mid) idx = i;
      }
      float.innerHTML = "";
      if (idx > 0) {
        var prev = sections[idx - 1];
        var a1 = document.createElement("a");
        a1.href = "#" + prev.id;
        a1.textContent = "← " + prev.title;
        float.appendChild(a1);
      }
      if (idx < sections.length - 1) {
        var next = sections[idx + 1];
        var a2 = document.createElement("a");
        a2.className = "nb-sec-next";
        a2.href = "#" + next.id;
        a2.textContent = next.title + " →";
        float.appendChild(a2);
      }
    }
    updateFloat();
    window.addEventListener("scroll", updateFloat, { passive: true });
  }

  function fillNav(nav, sections, i) {
    if (i > 0) {
      var prev = sections[i - 1];
      var a = document.createElement("a");
      a.href = "#" + prev.id;
      a.innerHTML =
        "<span>← предыдущий раздел</span>" + escapeHtml(prev.title);
      nav.appendChild(a);
    }
    if (i < sections.length - 1) {
      var next = sections[i + 1];
      var b = document.createElement("a");
      b.className = "nb-sec-next";
      b.href = "#" + next.id;
      b.innerHTML =
        "<span>следующий раздел →</span>" + escapeHtml(next.title);
      nav.appendChild(b);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* ——— Таблицы ——— */
  function wrapTables() {
    document.querySelectorAll("table").forEach(function (table) {
      if (table.closest(".nb-table-scroll")) return;
      if (table.closest(".nb-lightbox")) return;
      var wrap = document.createElement("div");
      wrap.className = "nb-table-scroll";
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  /* ——— Лайтбокс ——— */
  var lb = {
    el: null,
    stage: null,
    inner: null,
    scale: 1,
    tx: 0,
    ty: 0,
    source: null,
    clone: null,
  };

  function ensureLightbox() {
    if (lb.el) return;
    var root = document.createElement("div");
    root.className = "nb-lightbox";
    root.innerHTML =
      '<div class="nb-lightbox-bar"><button type="button" class="nb-lightbox-close" aria-label="Закрыть">×</button></div>' +
      '<div class="nb-lightbox-stage"><div class="nb-lightbox-inner"></div></div>';
    document.body.appendChild(root);
    lb.el = root;
    lb.stage = root.querySelector(".nb-lightbox-stage");
    lb.inner = root.querySelector(".nb-lightbox-inner");
    root.querySelector(".nb-lightbox-close").addEventListener("click", closeLightbox);
    root.addEventListener("click", function (e) {
      if (e.target === root || e.target === lb.stage) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.classList.contains("open")) closeLightbox();
    });
    bindPinch(lb.stage);
  }

  function openLightbox(source) {
    ensureLightbox();
    lb.source = source;
    lb.inner.innerHTML = "";
    lb.scale = 1;
    lb.tx = 0;
    lb.ty = 0;
    applyTransform();

    var isWidget =
      source.classList.contains("sort-anim") || source.classList.contains("lab");

    if (isWidget) {
      /* переносим живой узел, чтобы анимация и кнопки продолжали работать */
      var placeholder = document.createComment("nb-lb-ph");
      source.parentNode.insertBefore(placeholder, source);
      lb.placeholder = placeholder;
      lb.inner.appendChild(source);
      source.classList.add("nb-lb-live");
    } else {
      var node = source.cloneNode(true);
      if (node.tagName === "FIGURE" || node.classList.contains("fig")) {
        /* ok */
      } else if (/^(IMG|SVG|CANVAS)$/i.test(source.tagName)) {
        /* ok */
      }
      lb.inner.appendChild(node);
      lb.clone = node;
    }

    lb.el.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lb.el) return;
    if (lb.source && lb.source.classList.contains("nb-lb-live") && lb.placeholder) {
      lb.placeholder.parentNode.insertBefore(lb.source, lb.placeholder);
      lb.placeholder.remove();
      lb.source.classList.remove("nb-lb-live");
      lb.placeholder = null;
    }
    lb.inner.innerHTML = "";
    lb.el.classList.remove("open");
    document.body.style.overflow = "";
    lb.source = null;
    lb.clone = null;
  }

  function applyTransform() {
    if (!lb.inner) return;
    lb.inner.style.transform =
      "translate(" + lb.tx + "px," + lb.ty + "px) scale(" + lb.scale + ")";
  }

  function bindPinch(stage) {
    var pointers = new Map();
    var startDist = 0;
    var startScale = 1;
    var startTx = 0;
    var startTy = 0;
    var lastTap = 0;
    var dragOrigin = null;

    stage.addEventListener(
      "pointerdown",
      function (e) {
        if (e.target.closest("button, select, input, a, .sa-controls, .lab")) {
          return;
        }
        stage.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 1) {
          var now = Date.now();
          if (now - lastTap < 280) {
            lb.scale = lb.scale > 1.2 ? 1 : 2.2;
            lb.tx = 0;
            lb.ty = 0;
            applyTransform();
            lastTap = 0;
          } else {
            lastTap = now;
            dragOrigin = {
              x: e.clientX,
              y: e.clientY,
              tx: lb.tx,
              ty: lb.ty,
            };
          }
        } else if (pointers.size === 2) {
          var pts = Array.from(pointers.values());
          startDist = dist(pts[0], pts[1]);
          startScale = lb.scale;
          startTx = lb.tx;
          startTy = lb.ty;
          dragOrigin = null;
        }
      },
      { passive: true }
    );

    stage.addEventListener(
      "pointermove",
      function (e) {
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 2) {
          var pts = Array.from(pointers.values());
          var d = dist(pts[0], pts[1]);
          if (startDist > 0) {
            lb.scale = Math.min(5, Math.max(0.5, startScale * (d / startDist)));
            applyTransform();
          }
        } else if (pointers.size === 1 && dragOrigin && lb.scale > 1.01) {
          lb.tx = dragOrigin.tx + (e.clientX - dragOrigin.x);
          lb.ty = dragOrigin.ty + (e.clientY - dragOrigin.y);
          applyTransform();
        }
      },
      { passive: true }
    );

    function endPtr(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) startDist = 0;
      if (pointers.size === 0) dragOrigin = null;
    }
    stage.addEventListener("pointerup", endPtr);
    stage.addEventListener("pointercancel", endPtr);

    /* свайп вниз для закрытия при scale≈1 */
    var swipeY0 = null;
    stage.addEventListener(
      "touchstart",
      function (e) {
        if (e.touches.length === 1 && lb.scale <= 1.05) {
          swipeY0 = e.touches[0].clientY;
        } else swipeY0 = null;
      },
      { passive: true }
    );
    stage.addEventListener(
      "touchend",
      function (e) {
        if (swipeY0 == null) return;
        var y = (e.changedTouches[0] && e.changedTouches[0].clientY) || 0;
        if (y - swipeY0 > 90) closeLightbox();
        swipeY0 = null;
      },
      { passive: true }
    );
  }

  function dist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function wireZoomables() {
    var sels = [
      ".fig",
      "figure",
      "main img",
      "main svg",
      "main canvas",
      ".sort-anim",
      ".lab",
    ];
    document.querySelectorAll(sels.join(",")).forEach(function (el) {
      if (el.closest(".nb-lightbox, .nb-menu-panel, nav, header")) return;
      if (el.tagName === "SVG" && el.closest(".fig, .lab, .sort-anim, figure")) {
        return; /* клик по контейнеру */
      }
      if (el.tagName === "IMG" && el.closest(".fig, figure")) return;
      el.classList.add("nb-zoomable");
      el.addEventListener("click", function (e) {
        if (e.target.closest("a, button, select, input, .sa-controls")) return;
        e.preventDefault();
        openLightbox(el);
      });
    });

    document.querySelectorAll(".fig svg, .fig img").forEach(function (el) {
      var wide = el.getAttribute("viewBox") || "";
      var parts = wide.split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 700) {
        el.closest(".fig")?.classList.add("nb-wide-scheme");
      }
      if (el.tagName === "SVG" && el.getBoundingClientRect().width > 0) {
        /* min-width already via CSS class when marked */
      }
    });
  }

  ready(function () {
    var pref = getPref();
    applyTheme(pref);
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", function () {
        if (getPref() === "system") applyTheme("system");
      });

    wrapTables();
    buildMenu();
    buildSectionNav();
    wireZoomables();
  });
})();
