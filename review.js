(function () {
  "use strict";

  const STATE_KEY = "ucheba-review-state";
  const LEVEL_DAYS = [0, 2, 7, 30];
  const SUBJECTS = [
    { id: "matan", title: "Матанализ" },
    { id: "algebra", title: "Алгебра" },
    { id: "geometry", title: "Геометрия" },
    { id: "discrete", title: "Дискрет" },
  ];
  const SUBJECT_TITLE = Object.fromEntries(SUBJECTS.map((s) => [s.id, s.title]));
  const HELLOS = [
    "Снова сюда — хорошо.",
    "Давай спокойно повторим.",
    "Небольшой заход — уже польза.",
    "Ты на месте. Можно начинать.",
  ];

  const els = {};
  let allCards = [];
  let mode = "current"; // current | exam
  let subjectsOn = new Set(SUBJECTS.map((s) => s.id));
  let examSubject = "matan"; // single subject for Билеты
  let queue = [];
  let idx = 0;
  let flipped = false;
  let freeMode = false;
  let flipping = false;

  const LEAD = {
    current: "Выбери предметы и начинай — обычный повтор по ходу семестра.",
    exam: "Выбери один предмет и разбирай его билеты перед экзаменом.",
  };

  function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function addDays(iso, n) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + n);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  }

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch (_) {
      return {};
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function pruneState(state, validIds) {
    const next = {};
    for (const id of Object.keys(state)) {
      if (validIds.has(id)) next[id] = state[id];
    }
    return next;
  }

  function cardState(state, id) {
    const s = state[id];
    if (!s || typeof s !== "object") return { level: 0, due: todayStr() };
    return {
      level: Number.isFinite(+s.level) ? Math.max(0, Math.min(3, +s.level)) : 0,
      due: typeof s.due === "string" ? s.due : todayStr(),
    };
  }

  function isNew(state, id) {
    return !state[id];
  }

  function isDue(state, id, today) {
    if (isNew(state, id)) return true;
    return cardState(state, id).due <= today;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function filteredPool() {
    return allCards.filter((c) => {
      if (c.deck !== mode) return false;
      if (mode === "exam") return c.subject === examSubject;
      return subjectsOn.has(c.subject);
    });
  }

  function syncHubPanels() {
    const exam = mode === "exam";
    els.panelCurrent.classList.toggle("rv-hidden", exam);
    els.panelExam.classList.toggle("rv-hidden", !exam);
    if (els.lead) els.lead.textContent = LEAD[mode] || LEAD.current;
  }

  function renderMath(root) {
    if (typeof renderMathInElement !== "function" || !root) return;
    try {
      renderMathInElement(root, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false },
        ],
        throwOnError: false,
      });
    } catch (_) {}
  }

  function showView(name) {
    const map = { hub: els.hub, session: els.session, done: els.done };
    Object.entries(map).forEach(([key, node]) => {
      const on = key === name;
      node.classList.toggle("rv-hidden", !on);
      if (on) {
        node.classList.remove("rv-view");
        void node.offsetWidth;
        node.classList.add("rv-view");
      }
    });
  }

  function buildQueue({ includeAll }) {
    const state = loadState();
    const today = todayStr();
    const pool = filteredPool();
    if (includeAll || freeMode) return shuffle(pool);
    const due = pool.filter((c) => isDue(state, c.id, today));
    return shuffle(due.length ? due : pool);
  }

  function startSession({ includeAll }) {
    freeMode = !!includeAll;
    queue = buildQueue({ includeAll: freeMode });
    idx = 0;
    flipped = false;
    if (!queue.length) {
      showEmptyDone(true);
      return;
    }
    showView("session");
    renderCard(true);
  }

  function currentCard() {
    return queue[idx] || null;
  }

  function sanitizeSvg(svg) {
    let s = String(svg || "");
    if (!/<svg[\s>]/i.test(s)) return "";
    s = s.replace(/<script\b[\s\S]*?<\/script>/gi, "");
    s = s.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    s = s.replace(/javascript:/gi, "");
    return s.trim();
  }

  function mediaSide(card) {
    const side = card.imageSide || "front";
    if (side === "both") return true;
    if (side === "back") return flipped;
    return !flipped; // front
  }

  function paintMedia(card) {
    const box = els.cardMedia;
    box.innerHTML = "";
    const show = mediaSide(card) && (card.svg || card.image);
    box.classList.toggle("rv-hidden", !show);
    if (!show) return;
    if (card.svg) {
      const clean = sanitizeSvg(card.svg);
      if (clean) {
        box.innerHTML = clean;
        const svg = box.querySelector("svg");
        if (svg) {
          svg.setAttribute("focusable", "false");
          svg.removeAttribute("width");
          svg.removeAttribute("height");
        }
        return;
      }
    }
    if (card.image) {
      const src = "./review/" + String(card.image).replace(/^\.\//, "");
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.loading = "lazy";
      box.appendChild(img);
    }
  }

  function paintFace() {
    const card = currentCard();
    if (!card) return;
    els.cardLabel.textContent = flipped ? "Ответ" : "Вопрос";
    els.cardBody.innerHTML = flipped ? card.back || "" : card.front || "";
    paintMedia(card);
    els.cardHint.classList.remove("rv-hidden");
    els.cardHint.textContent = flipped
      ? "нажми, чтобы вернуть вопрос"
      : "нажми, чтобы перевернуть";
    els.grade.classList.toggle("rv-hidden", !flipped);
    if (flipped) {
      els.grade.classList.remove("rv-view");
      void els.grade.offsetWidth;
    }
    els.card.classList.toggle("is-flipped", flipped);
    els.card.setAttribute(
      "aria-label",
      flipped ? "Вернуть вопрос" : "Показать ответ"
    );
    renderMath(els.cardBody);
  }

  function renderCard(animateIn) {
    const card = currentCard();
    if (!card) {
      showEmptyDone(false);
      return;
    }
    flipped = false;
    const subj = SUBJECT_TITLE[card.subject] || card.subject;
    els.chipSubject.textContent =
      mode === "exam" ? "Билеты · " + subj : subj;
    els.chipSubject.className = "rv-chip rv-chip-" + card.subject;
    els.card.classList.remove("is-flipped", "is-exit", "is-enter", "is-turning");
    if (animateIn) {
      void els.card.offsetWidth;
      els.card.classList.add("is-enter");
    }
    paintFace();
  }

  function toggleFlip() {
    const card = currentCard();
    if (!card || flipping) return;
    flipping = true;
    els.card.classList.add("is-turning");
    window.setTimeout(() => {
      flipped = !flipped;
      paintFace();
      els.card.classList.remove("is-turning");
      flipping = false;
    }, 160);
  }

  function advanceAfterGrade() {
    els.card.classList.remove("is-enter");
    els.card.classList.add("is-exit");
    window.setTimeout(() => {
      idx += 1;
      if (idx >= queue.length) {
        showEmptyDone(false);
        return;
      }
      renderCard(true);
    }, 220);
  }

  function grade(kind) {
    const card = currentCard();
    if (!card || !flipped || flipping) return;
    const state = loadState();
    const today = todayStr();
    const cur = cardState(state, card.id);
    let level = cur.level;
    let due = today;

    if (kind === "again") {
      level = 0;
      due = today;
      queue.push(card);
    } else if (kind === "hard") {
      level = 1;
      due = addDays(today, 2);
    } else {
      if (level < 1) level = 1;
      else if (level === 1) level = 2;
      else level = 3;
      const days = LEVEL_DAYS[level] || 30;
      due = addDays(today, days < 2 ? 2 : days);
    }

    state[card.id] = { level, due };
    saveState(pruneState(state, new Set(allCards.map((c) => c.id))));
    advanceAfterGrade();
  }

  function deferToEnd() {
    const card = currentCard();
    if (!card || flipping) return;
    queue.push(card);
    advanceAfterGrade();
  }

  function showEmptyDone(emptyBank) {
    if (emptyBank) {
      els.doneTitle.textContent = "Пока пусто";
      els.doneBody.textContent =
        "В этой колоде ещё нет карточек для выбранных предметов. Можно сменить колоду или предметы.";
    } else {
      els.doneTitle.textContent = "На сегодня по этой очереди всё";
      els.doneBody.textContent =
        "Можно продолжить спокойно — сколько захочешь. Или вернуться к колодам.";
    }
    showView("done");
  }

  function backToHub() {
    freeMode = false;
    flipped = false;
    showView("hub");
  }

  async function loadBanks() {
    const paths = ["./review/cards-current.json", "./review/cards-exam.json"];
    const out = [];
    for (const p of paths) {
      try {
        const res = await fetch(p + "?v=" + Date.now(), { cache: "no-cache" });
        if (!res.ok) continue;
        const data = await res.json();
        const cards = Array.isArray(data.cards) ? data.cards : [];
        for (const c of cards) {
          if (!c || !c.id) continue;
          const row = {
            id: String(c.id),
            subject: String(c.subject || ""),
            deck: String(c.deck || (p.includes("exam") ? "exam" : "current")),
            anchor: String(c.anchor || ""),
            type: String(c.type || "def"),
            front: String(c.front || ""),
            back: String(c.back || ""),
          };
          if (c.svg) row.svg = String(c.svg);
          if (c.image) row.image = String(c.image);
          if (c.imageSide) row.imageSide = String(c.imageSide);
          out.push(row);
        }
      } catch (_) {}
    }
    return out;
  }

  function wireHub() {
    els.hello.textContent = HELLOS[Math.floor(Math.random() * HELLOS.length)];

    els.hub.querySelectorAll("[data-deck]").forEach((btn) => {
      btn.addEventListener("click", () => {
        mode = btn.getAttribute("data-deck") || "current";
        els.hub.querySelectorAll("[data-deck]").forEach((b) => {
          b.classList.toggle("is-on", b === btn);
        });
        syncHubPanels();
      });
    });

    SUBJECTS.forEach((s) => {
      const lab = document.createElement("label");
      lab.className = "is-on";
      lab.innerHTML = `<input type="checkbox" checked data-subject="${s.id}"> ${s.title}`;
      const input = lab.querySelector("input");
      input.addEventListener("change", () => {
        if (input.checked) subjectsOn.add(s.id);
        else subjectsOn.delete(s.id);
        lab.classList.toggle("is-on", input.checked);
      });
      els.subjects.appendChild(lab);
    });

    SUBJECTS.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rv-exam-subj" + (s.id === examSubject ? " is-on" : "");
      btn.dataset.subject = s.id;
      btn.textContent = s.title;
      btn.addEventListener("click", () => {
        examSubject = s.id;
        els.examSubjects.querySelectorAll(".rv-exam-subj").forEach((b) => {
          b.classList.toggle("is-on", b.dataset.subject === examSubject);
        });
      });
      els.examSubjects.appendChild(btn);
    });

    els.btnStart.addEventListener("click", () => startSession({ includeAll: false }));
    els.btnAll.addEventListener("click", () => startSession({ includeAll: true }));
    els.btnExamStart.addEventListener("click", () => startSession({ includeAll: false }));
    els.btnExamAll.addEventListener("click", () => startSession({ includeAll: true }));
    els.btnContinue.addEventListener("click", () => startSession({ includeAll: true }));
    els.btnHub.addEventListener("click", backToHub);
    syncHubPanels();
  }

  function wireSession() {
    els.card.addEventListener("click", () => toggleFlip());
    els.card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleFlip();
      }
    });
    els.btnAgain.addEventListener("click", (e) => {
      e.stopPropagation();
      grade("again");
    });
    els.btnHard.addEventListener("click", (e) => {
      e.stopPropagation();
      grade("hard");
    });
    els.btnGood.addEventListener("click", (e) => {
      e.stopPropagation();
      grade("good");
    });
    els.btnDefer.addEventListener("click", (e) => {
      e.stopPropagation();
      deferToEnd();
    });
    els.btnStop.addEventListener("click", backToHub);
  }

  function bindEls() {
    els.hub = document.getElementById("rv-hub");
    els.session = document.getElementById("rv-session");
    els.done = document.getElementById("rv-done");
    els.hello = document.getElementById("rv-hello");
    els.lead = document.getElementById("rv-lead");
    els.panelCurrent = document.getElementById("rv-panel-current");
    els.panelExam = document.getElementById("rv-panel-exam");
    els.subjects = document.getElementById("rv-subjects");
    els.examSubjects = document.getElementById("rv-exam-subjects");
    els.btnStart = document.getElementById("rv-btn-start");
    els.btnAll = document.getElementById("rv-btn-all");
    els.btnExamStart = document.getElementById("rv-btn-exam-start");
    els.btnExamAll = document.getElementById("rv-btn-exam-all");
    els.chipSubject = document.getElementById("rv-chip-subject");
    els.card = document.getElementById("rv-card");
    els.cardLabel = document.getElementById("rv-card-label");
    els.cardMedia = document.getElementById("rv-card-media");
    els.cardBody = document.getElementById("rv-card-body");
    els.cardHint = document.getElementById("rv-card-hint");
    els.grade = document.getElementById("rv-grade");
    els.btnAgain = document.getElementById("rv-btn-again");
    els.btnHard = document.getElementById("rv-btn-hard");
    els.btnGood = document.getElementById("rv-btn-good");
    els.btnDefer = document.getElementById("rv-btn-defer");
    els.btnStop = document.getElementById("rv-btn-stop");
    els.doneTitle = document.getElementById("rv-done-title");
    els.doneBody = document.getElementById("rv-done-body");
    els.btnContinue = document.getElementById("rv-btn-continue");
    els.btnHub = document.getElementById("rv-btn-hub");
    els.status = document.getElementById("rv-status");
  }

  async function init() {
    bindEls();
    wireHub();
    wireSession();
    allCards = await loadBanks();
    const state = loadState();
    saveState(pruneState(state, new Set(allCards.map((c) => c.id))));
    if (!allCards.length) {
      els.status.hidden = false;
      els.status.textContent =
        "Банк пока пуст — добавь карточки через промпт и merge_review_cards.py.";
    }
    showView("hub");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
