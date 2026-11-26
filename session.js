/* Session «Сегодня»: plan + progress + ticket SRS. Progress in localStorage only. */
(function (global) {
  "use strict";

  const STATE_KEY = "ucheba-session-progress";
  const TAB_KEY = "ucheba-session-tab";
  const SUBJECT_TITLE = {
    matan: "Матанализ",
    algebra: "Алгебра",
    geometry: "Геометрия",
    discrete: "Дискрет",
  };
  const DEFAULT_SRS = [0, 1, 3, 7];

  const REVIEW_STATE_KEY = "ucheba-review-state";
  const REVIEW_UNTIL_KEY = "ucheba-review-until";
  const PROGRESS_URL = "./session/my-progress.json";

  /** @type {any} */
  let plan = null;
  /** @type {Map<string, any>} */
  let catalog = new Map();
  /** @type {Map<string, string[]>} ticketId → fact-card ids */
  let cardsByTicket = new Map();
  /** @type {string} */
  let viewDate = "";
  /** @type {HTMLElement | null} */
  let todayRoot = null;
  /** @type {HTMLElement | null} */
  let calendarRoot = null;
  /** @type {(name: string) => void} */
  let activateTab = () => {};

  function todayStr() {
    const d = new Date();
    return isoDate(d);
  }

  function isoDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function parseIso(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function addDays(iso, n) {
    const dt = parseIso(iso);
    dt.setDate(dt.getDate() + n);
    return isoDate(dt);
  }

  function fmtRu(iso) {
    const dt = parseIso(iso);
    return dt.toLocaleDateString("ru-RU", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
      if (!raw || typeof raw !== "object") return emptyState();
      return {
        version: 1,
        tickets: raw.tickets && typeof raw.tickets === "object" ? raw.tickets : {},
        checks: raw.checks && typeof raw.checks === "object" ? raw.checks : {},
      };
    } catch (_) {
      return emptyState();
    }
  }

  function emptyState() {
    return { version: 1, tickets: {}, checks: {} };
  }

  function saveState(state) {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function toast(msg) {
    const el =
      document.getElementById("toast") || document.getElementById("nb-toast");
    if (!el) {
      try {
        console.log(msg);
      } catch (_) {}
      return;
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2400);
  }

  function loadReviewState() {
    try {
      const raw = JSON.parse(localStorage.getItem(REVIEW_STATE_KEY) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch (_) {
      return {};
    }
  }

  function loadReviewUntil() {
    try {
      const raw = JSON.parse(localStorage.getItem(REVIEW_UNTIL_KEY) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch (_) {
      return {};
    }
  }

  function buildProgressBlob() {
    const session = loadState();
    return {
      version: 1,
      kind: "ucheba-session-progress",
      exportedAt: new Date().toISOString(),
      session: {
        version: 1,
        tickets: session.tickets || {},
        checks: session.checks || {},
      },
      review: loadReviewState(),
      reviewUntil: loadReviewUntil(),
    };
  }

  function betterTicket(a, b) {
    if (!a) return b;
    if (!b) return a;
    const af = a.firstDone ? 1 : 0;
    const bf = b.firstDone ? 1 : 0;
    if (af !== bf) return af > bf ? a : b;
    const al = Number(a.level) || 0;
    const bl = Number(b.level) || 0;
    if (al !== bl) return al > bl ? a : b;
    if (a.firstDone && b.firstDone && a.firstDone !== b.firstDone) {
      return a.firstDone <= b.firstDone ? a : b;
    }
    if (a.due && b.due && a.due !== b.due) return a.due >= b.due ? a : b;
    return a;
  }

  function betterReview(a, b) {
    if (!a) return b;
    if (!b) return a;
    const al = Number(a.level) || 0;
    const bl = Number(b.level) || 0;
    if (al !== bl) return al > bl ? a : b;
    if (a.due && b.due && a.due !== b.due) return a.due >= b.due ? a : b;
    return a;
  }

  function applyProgressBlob(blob, mode) {
    if (!blob || typeof blob !== "object") throw new Error("пустой файл");
    const remoteSession = blob.session || blob;
    const remoteTickets =
      (remoteSession && remoteSession.tickets) || blob.tickets || {};
    const remoteChecks =
      (remoteSession && remoteSession.checks) || blob.checks || {};
    const remoteReview = blob.review || {};
    const remoteUntil = blob.reviewUntil || {};

    const local = loadState();
    const next = {
      version: 1,
      tickets: {},
      checks: {},
    };

    if (mode === "replace") {
      next.tickets = { ...remoteTickets };
      next.checks = { ...remoteChecks };
    } else {
      const ids = new Set([
        ...Object.keys(local.tickets || {}),
        ...Object.keys(remoteTickets || {}),
      ]);
      for (const id of ids) {
        next.tickets[id] = betterTicket(
          local.tickets[id],
          remoteTickets[id]
        );
      }
      next.checks = { ...(local.checks || {}), ...(remoteChecks || {}) };
    }
    saveState(next);

    if (mode === "replace") {
      try {
        localStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(remoteReview || {}));
        localStorage.setItem(REVIEW_UNTIL_KEY, JSON.stringify(remoteUntil || {}));
      } catch (_) {}
    } else {
      const localR = loadReviewState();
      const mergedR = { ...localR };
      for (const id of Object.keys(remoteReview || {})) {
        mergedR[id] = betterReview(localR[id], remoteReview[id]);
      }
      const localU = loadReviewUntil();
      const mergedU = { ...localU, ...remoteUntil };
      try {
        localStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(mergedR));
        localStorage.setItem(REVIEW_UNTIL_KEY, JSON.stringify(mergedU));
      } catch (_) {}
    }
    return next;
  }

  function downloadProgress() {
    const blob = buildProgressBlob();
    const text = JSON.stringify(blob, null, 2);
    const stamp = todayStr();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([text], { type: "application/json;charset=utf-8" })
    );
    a.download = `ucheba-session-progress-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    toast("Скачан JSON — положи в репо и сделай publish");
  }

  function importProgressFile(file, mode) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result || ""));
          applyProgressBlob(data, mode);
          refreshAll();
          toast(
            mode === "replace"
              ? "Прогресс заменён из файла"
              : "Прогресс слит с файлом"
          );
          resolve();
        } catch (e) {
          toast("Не удалось прочитать JSON");
          reject(e);
        }
      };
      reader.onerror = () => {
        toast("Ошибка чтения файла");
        reject(reader.error);
      };
      reader.readAsText(file, "utf-8");
    });
  }

  async function pullProgressFromSite(mode) {
    toast("Тяну прогресс с GitHub Pages…");
    try {
      const res = await fetch(PROGRESS_URL + "?t=" + Date.now(), {
        cache: "no-cache",
      });
      if (res.status === 404) {
        toast("На сайте ещё нет my-progress.json — сначала publish");
        return;
      }
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      if (!data || (data.kind && data.kind !== "ucheba-session-progress")) {
        // allow raw session shape too
        if (!data.session && !data.tickets) {
          throw new Error("не тот формат");
        }
      }
      applyProgressBlob(data, mode);
      refreshAll();
      toast(
        mode === "replace"
          ? "Прогресс с сайта подставлен"
          : "Прогресс с сайта слит"
      );
    } catch (e) {
      toast("Не удалось подтянуть: " + (e && e.message ? e.message : e));
    }
  }

  function wireSyncUi(root) {
    root.querySelector('[data-sync="export"]')?.addEventListener("click", () => {
      downloadProgress();
    });
    root.querySelector('[data-sync="pull-merge"]')?.addEventListener("click", () => {
      pullProgressFromSite("merge");
    });
    root.querySelector('[data-sync="pull-replace"]')?.addEventListener("click", () => {
      if (
        confirm(
          "Заменить весь локальный прогресс тем, что на сайте? Локальное, чего нет на сайте, пропадёт."
        )
      ) {
        pullProgressFromSite("replace");
      }
    });
    const fileInput = root.querySelector("#ss-progress-file");
    root.querySelector('[data-sync="import"]')?.addEventListener("click", () => {
      fileInput?.click();
    });
    fileInput?.addEventListener("change", () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      importProgressFile(f, "merge").finally(() => {
        fileInput.value = "";
      });
    });
    root
      .querySelector('[data-sync="import-replace"]')
      ?.addEventListener("click", () => {
        const input = root.querySelector("#ss-progress-file-replace");
        input?.click();
      });
    const fileReplace = root.querySelector("#ss-progress-file-replace");
    fileReplace?.addEventListener("change", () => {
      const f = fileReplace.files && fileReplace.files[0];
      if (!f) return;
      if (
        confirm("Заменить весь локальный прогресс содержимым файла?")
      ) {
        importProgressFile(f, "replace").finally(() => {
          fileReplace.value = "";
        });
      } else {
        fileReplace.value = "";
      }
    });
  }

  function ticketState(state, id) {
    const t = state.tickets[id];
    if (!t || typeof t !== "object") {
      return { firstDone: null, level: 0, due: null };
    }
    return {
      firstDone: typeof t.firstDone === "string" ? t.firstDone : null,
      level: Number.isFinite(+t.level) ? Math.max(0, Math.min(3, +t.level)) : 0,
      due: typeof t.due === "string" ? t.due : null,
    };
  }

  function srsDays() {
    const arr = plan && Array.isArray(plan.ticketSrsDays) ? plan.ticketSrsDays : DEFAULT_SRS;
    return arr.length ? arr : DEFAULT_SRS;
  }

  function syncFactCards(ticketId, level, due) {
    const ids = cardsByTicket.get(ticketId) || [];
    if (!ids.length) return;
    let review;
    try {
      review = JSON.parse(localStorage.getItem(REVIEW_STATE_KEY) || "{}");
      if (!review || typeof review !== "object") review = {};
    } catch (_) {
      review = {};
    }
    for (const cid of ids) {
      review[cid] = { level, due };
    }
    try {
      localStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(review));
    } catch (_) {}
  }

  function markFirstDone(id, when) {
    const state = loadState();
    const cur = ticketState(state, id);
    const day = when || todayStr();
    let level = 1;
    let due = addDays(day, srsDays()[1] || 1);
    if (!cur.firstDone) {
      state.tickets[id] = { firstDone: day, level, due };
    } else {
      level = cur.level || 1;
      due = cur.due || due;
      state.tickets[id] = { firstDone: cur.firstDone, level, due };
    }
    saveState(state);
    syncFactCards(id, level, due);
  }

  function gradeTicket(id, kind) {
    const state = loadState();
    const today = todayStr();
    const cur = ticketState(state, id);
    let level = cur.level;
    let due = today;
    const ladder = srsDays();

    if (kind === "again") {
      level = 0;
      due = today;
    } else if (kind === "hard") {
      level = Math.max(1, Math.min(level, 1));
      due = addDays(today, ladder[1] || 1);
    } else {
      if (level < 1) level = 1;
      else if (level === 1) level = 2;
      else level = 3;
      const days = ladder[level] != null ? ladder[level] : 7;
      due = addDays(today, Math.max(1, days));
    }
    if (!cur.firstDone) {
      state.tickets[id] = { firstDone: today, level, due };
    } else {
      state.tickets[id] = { firstDone: cur.firstDone, level, due };
    }
    saveState(state);
    syncFactCards(id, level, due);
  }

  function checkKey(dateIso, id) {
    return dateIso + "|" + id;
  }

  function isChecked(state, dateIso, id) {
    return !!state.checks[checkKey(dateIso, id)];
  }

  function setChecked(dateIso, id, on) {
    const state = loadState();
    const key = checkKey(dateIso, id);
    if (on) state.checks[key] = true;
    else delete state.checks[key];
    let synced = null;
    if (on) {
      const cur = ticketState(state, id);
      if (!cur.firstDone) {
        const level = 1;
        const due = addDays(dateIso, srsDays()[1] || 1);
        state.tickets[id] = { firstDone: dateIso, level, due };
        synced = { level, due };
      }
    }
    saveState(state);
    if (synced) syncFactCards(id, synced.level, synced.due);
  }

  function dayByDate(iso) {
    if (!plan || !Array.isArray(plan.days)) return null;
    return plan.days.find((d) => d.date === iso) || null;
  }

  function allPlannedBefore(iso) {
    if (!plan) return [];
    const out = [];
    for (const day of plan.days) {
      if (day.date >= iso) break;
      for (const it of day.new || []) out.push({ ...it, planned: day.date });
    }
    return out;
  }

  function progressStats(state) {
    const total = catalog.size;
    let done = 0;
    const bySubject = {};
    for (const sid of Object.keys(SUBJECT_TITLE)) {
      bySubject[sid] = { done: 0, total: 0 };
    }
    for (const [id, meta] of catalog) {
      const sid = meta.subject || id.split(":")[0];
      if (!bySubject[sid]) bySubject[sid] = { done: 0, total: 0 };
      bySubject[sid].total += 1;
      if (ticketState(state, id).firstDone) {
        done += 1;
        bySubject[sid].done += 1;
      }
    }
    return {
      done,
      total,
      pct: total ? Math.round((100 * done) / total) : 0,
      bySubject,
    };
  }

  function dayProgress(state, day) {
    const items = day.new || [];
    if (!items.length) {
      return { done: 0, total: 0, pct: 100, status: day.mode === "review_only" ? "review" : "empty" };
    }
    let done = 0;
    for (const it of items) {
      if (ticketState(state, it.id).firstDone) done += 1;
    }
    const total = items.length;
    const pct = Math.round((100 * done) / total);
    let status = "todo";
    if (done === total) status = "done";
    else if (done > 0) status = "partial";
    return { done, total, pct, status };
  }

  function fmtShort(iso) {
    const dt = parseIso(iso);
    return dt.toLocaleDateString("ru-RU", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  function subjectChips(items) {
    const counts = {};
    for (const it of items || []) {
      counts[it.subject] = (counts[it.subject] || 0) + 1;
    }
    return Object.keys(counts)
      .map(
        (s) =>
          `<span class="${chipClass(s)}">${esc(SUBJECT_TITLE[s] || s)} ${counts[s]}</span>`
      )
      .join(" ");
  }

  function dayFocus(day) {
    if (day && Array.isArray(day.focus)) return day.focus;
    return [];
  }

  function dueTickets(state, iso, focusIds) {
    const focus = Array.isArray(focusIds) ? focusIds : [];
    const list = [];
    for (const [id, meta] of catalog) {
      const st = ticketState(state, id);
      if (!st.firstDone) continue;
      if (!st.due || st.due <= iso) list.push({ id, meta, st });
    }
    list.sort((a, b) => {
      const af = focus.includes(a.meta.subject) ? 0 : 1;
      const bf = focus.includes(b.meta.subject) ? 0 : 1;
      if (af !== bf) return af - bf;
      if (a.st.due !== b.st.due) return (a.st.due || "").localeCompare(b.st.due || "");
      return a.id.localeCompare(b.id);
    });
    return list;
  }

  /** Extra focus-subject tickets (already learned) to drill before an exam. */
  function accentTickets(state, iso, focusIds, excludeIds) {
    const focus = Array.isArray(focusIds) ? focusIds : [];
    if (!focus.length) return [];
    const skip = new Set(excludeIds || []);
    const list = [];
    for (const [id, meta] of catalog) {
      if (!focus.includes(meta.subject)) continue;
      if (skip.has(id)) continue;
      const st = ticketState(state, id);
      if (!st.firstDone) continue;
      list.push({ id, meta, st, accent: true });
    }
    list.sort((a, b) => {
      const ad = a.st.due || "9999";
      const bd = b.st.due || "9999";
      if (ad !== bd) return ad.localeCompare(bd);
      return a.id.localeCompare(b.id);
    });
    const kind = (dayByDate(iso) || {}).focusKind;
    const limit = kind === "exam_day" ? 10 : kind === "pre_exam" ? 8 : 4;
    return list.slice(0, limit);
  }

  function debtItems(state, iso) {
    const maxCarry = (plan && plan.maxCarry) || 6;
    const pending = [];
    for (const it of allPlannedBefore(iso)) {
      const st = ticketState(state, it.id);
      if (st.firstDone) continue;
      if (isChecked(state, it.planned, it.id)) continue;
      pending.push(it);
    }
    return {
      show: pending.slice(0, maxCarry),
      more: Math.max(0, pending.length - maxCarry),
      total: pending.length,
    };
  }

  function chipClass(subject) {
    return "ss-chip ss-chip-" + subject;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isLocalHub() {
    const path = (global.location && global.location.pathname) || "";
    // Only the timetable app shell (…/notebooks.html). Published Pages is
    // /notebooks/ or /notebooks/index.html — flat HTML next to index.
    return /notebooks\.html$/i.test(path);
  }

  function ticketHref(meta) {
    if (!meta) return "#";
    let href = meta.href || "#";
    if (!isLocalHub()) {
      // catalog stores ./notebooks/file.html#… for the local app layout
      href = href.replace(/^\.\/notebooks\//, "./");
    }
    return href || "#";
  }

  function renderLearnItem(it, state, dateIso, opts) {
    const meta = catalog.get(it.id) || {};
    const title = meta.title || "Билет " + it.n;
    const done =
      !!ticketState(state, it.id).firstDone || isChecked(state, dateIso, it.id);
    const debt = opts && opts.debt;
    const plannedNote =
      debt && it.planned
        ? `<span class="ss-meta">долг с ${esc(it.planned.slice(5))}</span>`
        : "";
    const theory =
      meta.theory && meta.theory.href
        ? `<a class="ss-btn ss-btn-ghost" href="${esc(
            ticketHref({ href: meta.theory.href })
          )}">Теория</a>`
        : "";
    return `<div class="ss-item${done ? " is-done" : ""}" data-id="${esc(it.id)}">
      <input class="ss-check" type="checkbox" ${done ? "checked" : ""} data-act="check" aria-label="Пройден">
      <div class="ss-item-main">
        <span class="${chipClass(it.subject)}">${esc(SUBJECT_TITLE[it.subject] || it.subject)}</span>
        <a class="ss-item-title" href="${esc(ticketHref(meta))}">№ ${it.n}. ${esc(title)}</a>
        ${plannedNote}
        <div class="ss-item-actions">
          <a class="ss-btn ss-btn-primary" href="${esc(ticketHref(meta))}">Открыть</a>
          ${theory}
          <button type="button" class="ss-btn" data-act="done">Пройден · вспомню завтра</button>
        </div>
      </div>
    </div>`;
  }

  function renderRecall(list) {
    if (!list.length) {
      return `<p class="ss-empty">На сегодня нет due-повторов — можно спокойно брать новое.</p>`;
    }
    return list
      .slice(0, 16)
      .map(({ id, meta, st, accent }) => {
        const title = meta.title || id;
        return `<div class="ss-recall${accent ? " is-accent" : ""}" data-id="${esc(id)}">
          <span class="${chipClass(meta.subject)}">${esc(SUBJECT_TITLE[meta.subject] || meta.subject)}</span>
          ${accent ? '<span class="ss-chip ss-chip-accent">акцент</span>' : ""}
          <strong>№ ${meta.n}. ${esc(title)}</strong>
          <p class="ss-recall-prompt">Закрой глаза на формулировку. Объясни вслух другому человеку. Потом открой билет и оцени.</p>
          <div class="ss-item-actions">
            <a class="ss-btn ss-btn-primary" href="${esc(ticketHref(meta))}">Открыть билет</a>
            <button type="button" class="ss-btn" data-grade="again">Не вспомнил</button>
            <button type="button" class="ss-btn" data-grade="hard">Шатко</button>
            <button type="button" class="ss-btn" data-grade="good">Вспомнил</button>
          </div>
          <p class="ss-meta">${accent ? "акцент перед экзаменом" : "due " + esc(st.due || "—")} · уровень ${st.level}</p>
        </div>`;
      })
      .join("");
  }

  function refreshAll() {
    if (todayRoot) renderToday(todayRoot);
    if (calendarRoot) renderCalendar(calendarRoot);
  }

  function renderCalendar(root) {
    if (!root || !plan) return;
    const state = loadState();
    const today = todayStr();
    const stats = progressStats(state);
    const debt = debtItems(state, today);
    const todayDay = dayByDate(today);
    const due = dueTickets(state, today, dayFocus(todayDay));

    const examsHtml = (plan.exams || [])
      .map((ex) => {
        const title = ex.title || SUBJECT_TITLE[ex.subject] || ex.subject;
        return `<li><span class="${chipClass(ex.subject)}">${esc(
          title
        )}</span> ${esc(ex.date)}</li>`;
      })
      .join("");

    const subjectBars = Object.keys(SUBJECT_TITLE)
      .map((sid) => {
        const s = stats.bySubject[sid] || { done: 0, total: 0 };
        if (!s.total) return "";
        const pct = Math.round((100 * s.done) / s.total);
        return `<div class="ss-cal-subj">
          <div class="ss-cal-subj-head">
            <span class="${chipClass(sid)}">${esc(SUBJECT_TITLE[sid])}</span>
            <span class="ss-meta">${s.done}/${s.total}</span>
          </div>
          <div class="ss-progress-bar" aria-hidden="true"><div class="ss-progress-fill" style="width:${pct}%"></div></div>
        </div>`;
      })
      .join("");

    const rows = (plan.days || [])
      .map((day) => {
        const prog = dayProgress(state, day);
        const isToday = day.date === today;
        const isPast = day.date < today;
        const cls = [
          "ss-cal-day",
          "is-" + prog.status,
          isToday ? "is-today" : "",
          isPast && prog.status !== "done" && prog.total ? "is-debt" : "",
        ]
          .filter(Boolean)
          .join(" ");
        const statusLabel =
          prog.status === "done"
            ? "готово"
            : prog.status === "partial"
              ? `${prog.done}/${prog.total}`
              : prog.status === "review"
                ? "повтор"
                : prog.status === "empty"
                  ? "—"
                  : isPast
                    ? "долг"
                    : `${prog.total} нов.`;
          const focus = dayFocus(day);
        const focusChip = focus.length
          ? focus
              .map(
                (s) =>
                  `<span class="${chipClass(s)}">акцент · ${esc(
                    SUBJECT_TITLE[s] || s
                  )}</span>`
              )
              .join(" ")
          : "";
        const ticketsPreview = (day.new || [])
          .slice(0, 4)
          .map((it) => {
            const meta = catalog.get(it.id) || {};
            const ok = !!ticketState(state, it.id).firstDone;
            return `<li class="${ok ? "is-done" : ""}"><span class="${chipClass(
              it.subject
            )}">${esc(SUBJECT_TITLE[it.subject] || it.subject)}</span> №${it.n}${
              meta.title ? " · " + esc(meta.title) : ""
            }</li>`;
          })
          .join("");
        const more =
          (day.new || []).length > 4
            ? `<li class="ss-meta">…ещё ${(day.new || []).length - 4}</li>`
            : "";
        return `<button type="button" class="${cls}" data-open-day="${esc(day.date)}">
          <div class="ss-cal-day-top">
            <span class="ss-cal-date">${esc(fmtShort(day.date))}${
          isToday ? " · сегодня" : ""
        }</span>
            <span class="ss-cal-status">${esc(statusLabel)}</span>
          </div>
          <div class="ss-cal-label">${esc(day.label || "")}</div>
          <div class="ss-cal-chips">${focusChip || subjectChips(day.new)}</div>
          ${
            ticketsPreview
              ? `<ul class="ss-cal-tickets">${ticketsPreview}${more}</ul>`
              : `<p class="ss-empty">Только повтор due-билетов</p>`
          }
          ${
            prog.total
              ? `<div class="ss-progress-bar ss-cal-mini" aria-hidden="true"><div class="ss-progress-fill" style="width:${prog.pct}%"></div></div>`
              : ""
          }
        </button>`;
      })
      .join("");

    root.innerHTML = `
      <div class="ss-hero">
        <p class="ss-kicker">Календарь сессии</p>
        <h1 class="ss-title">План и прогресс</h1>
        <p class="ss-meta">${esc(plan.start)} → все билеты к ${esc(
      plan.firstPassEnd
    )}${
      plan.holidayStart
        ? ` · каникулы ${esc(plan.holidayStart)}–${esc(plan.holidayEnd)} (меньше нового)`
        : ""
    } → ${esc(plan.end)}</p>
        <div class="ss-progress">
          <div class="ss-progress-bar" aria-hidden="true"><div class="ss-progress-fill" style="width:${stats.pct}%"></div></div>
          <p class="ss-progress-label">Первый проход: ${stats.done} / ${stats.total} (${stats.pct}%)</p>
        </div>
      </div>

      <section class="ss-section">
        <h2>Экзамены</h2>
        <ul class="ss-exam-list">${examsHtml || '<li class="ss-empty">Нет дат</li>'}</ul>
        <p class="ss-section-lead" style="margin-top:.55rem">За ${plan.focusWindow || 6} дней до предмета — акцент повтора именно на нём.</p>
      </section>

      <section class="ss-section">
        <h2>По предметам</h2>
        <div class="ss-cal-subjects">${subjectBars || '<p class="ss-empty">Нет каталога</p>'}</div>
        <p class="ss-meta" style="margin-top:.75rem">Долг сейчас: ${debt.total} · due на сегодня: ${due.length}</p>
      </section>

      <section class="ss-section">
        <h2>Синхронизация · GitHub</h2>
        <p class="ss-section-lead">
          Прогресс в браузере. Через GitHub Pages: скачай JSON → на ПК
          <code>python scripts/install_session_progress.py файл.json</code>
          → <code>publish_notebooks</code> → на другом устройстве «С сайта».
        </p>
        <div class="ss-item-actions ss-sync-actions">
          <button type="button" class="ss-btn ss-btn-primary" data-sync="export">Скачать JSON</button>
          <button type="button" class="ss-btn" data-sync="import">Слить из файла</button>
          <button type="button" class="ss-btn" data-sync="import-replace">Заменить из файла</button>
          <button type="button" class="ss-btn" data-sync="pull-merge">С сайта · слить</button>
          <button type="button" class="ss-btn" data-sync="pull-replace">С сайта · заменить</button>
        </div>
        <input id="ss-progress-file" type="file" accept="application/json,.json" hidden>
        <input id="ss-progress-file-replace" type="file" accept="application/json,.json" hidden>
      </section>

      <section class="ss-section">
        <h2>Дни</h2>
        <p class="ss-section-lead">Нажми день — откроется занятие на вкладке «Сегодня».</p>
        <div class="ss-cal-list">${rows}</div>
      </section>
    `;

    wireSyncUi(root);

    root.querySelectorAll("[data-open-day]").forEach((btn) => {
      btn.addEventListener("click", () => {
        viewDate = btn.getAttribute("data-open-day") || todayStr();
        activateTab("today");
        refreshAll();
        todayRoot?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      });
    });

    const todayBtn = root.querySelector(".ss-cal-day.is-today");
    if (todayBtn) {
      try {
        todayBtn.scrollIntoView({ block: "nearest", behavior: "instant" });
      } catch (_) {}
    }
  }

  function renderToday(root) {
    if (!root || !plan) return;
    const state = loadState();
    if (!viewDate) viewDate = todayStr();
    // clamp to plan range
    if (viewDate < plan.start) viewDate = plan.start;
    if (viewDate > plan.end) viewDate = plan.end;

    const day = dayByDate(viewDate) || {
      date: viewDate,
      minutes: plan.minutes || 120,
      mode: viewDate > plan.firstPassEnd ? "review_only" : "first_pass",
      label: "День",
      new: [],
    };
    const stats = progressStats(state);
    const debt = debtItems(state, viewDate);
    const focus = dayFocus(day);
    const due = dueTickets(state, viewDate, focus);
    const accent = accentTickets(
      state,
      viewDate,
      focus,
      due.map((x) => x.id)
    );
    const recallList = due.concat(accent);
    const isToday = viewDate === todayStr();
    const principles = (plan.principles || [])
      .map((p) => `<li>${esc(p)}</li>`)
      .join("");
    const focusNote = focus.length
      ? `Акцент: ${focus.map((s) => SUBJECT_TITLE[s] || s).join(", ")}.`
      : "";

    const newHtml = (day.new || []).length
      ? (day.new || []).map((it) => renderLearnItem(it, state, viewDate, {})).join("")
      : `<p class="ss-empty">${
          day.mode === "review_only"
            ? day.focusKind === "exam_day"
              ? "День экзамена — лёгкий повтор по предмету, без нового."
              : "Первый проход закрыт по плану — только повтор."
            : "На этот день новых билетов нет."
        }</p>`;

    root.innerHTML = `
      <div class="ss-hero">
        <p class="ss-kicker">${isToday ? "Сегодня" : "День плана"} · ${esc(fmtRu(viewDate))}</p>
        <h1 class="ss-title">${esc(day.label || "Занятие")}</h1>
        <p class="ss-meta">${day.minutes || plan.minutes || 120} мин · режим ${
      day.mode === "review_only" ? "только повтор" : "первый проход"
    } · до первого прохода ${esc(plan.firstPassEnd)}${
      focusNote ? " · " + esc(focusNote) : ""
    }</p>
        <div class="ss-progress">
          <div class="ss-progress-bar" aria-hidden="true"><div class="ss-progress-fill" style="width:${stats.pct}%"></div></div>
          <p class="ss-progress-label">Первый проход: ${stats.done} / ${stats.total} (${stats.pct}%)</p>
        </div>
      </div>

      <div class="ss-nav">
        <button type="button" class="ss-btn" data-nav="-1">← Вчера</button>
        <button type="button" class="ss-btn ss-btn-primary" data-nav="today">Сегодня</button>
        <button type="button" class="ss-btn" data-nav="1">Завтра →</button>
      </div>

      <div class="ss-tip">
        <strong>20 минут:</strong> один билет из долга или нового — сначала вспомни вслух, потом открой текст.
        Полное занятие (~2 ч): долг → вспомни${
          focus.length ? " (сначала акцент-предмет)" : ""
        } → новое → отметь пройденное.
      </div>

      ${
        debt.total
          ? `<div class="ss-debt"><section class="ss-section">
        <h2>Долг · не закрыто раньше</h2>
        <p class="ss-section-lead">${debt.total} билет(ов); показываем до ${
              plan.maxCarry || 6
            }${debt.more ? `, ещё ${debt.more} в очереди на следующие дни` : ""}.</p>
        ${debt.show.map((it) => renderLearnItem(it, state, viewDate, { debt: true })).join("")}
      </section></div>`
          : ""
      }

      <section class="ss-section">
        <h2>Вспомни · due${focus.length ? " + акцент" : ""}</h2>
        <p class="ss-section-lead">Не читай сразу. Сначала retrieval, потом оценка.${
          focusNote ? " " + esc(focusNote) : ""
        }</p>
        ${renderRecall(recallList)}
      </section>

      <section class="ss-section">
        <h2>Новое · первый проход</h2>
        <p class="ss-section-lead">Отметь «пройден», когда можешь назвать условия и идею доказательства вслух.</p>
        ${newHtml}
      </section>

      <section class="ss-section">
        <h2>Принципы</h2>
        <ul class="ss-principles">${principles}</ul>
        <p class="ss-meta" style="margin-top:.75rem">Прогресс хранится в браузере (localStorage). Кнопка «Обновить» кэш не стирает отметки.</p>
      </section>
    `;

    root.querySelectorAll("[data-nav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const v = btn.getAttribute("data-nav");
        if (v === "today") viewDate = todayStr();
        else viewDate = addDays(viewDate, Number(v));
        refreshAll();
      });
    });

    root.querySelectorAll(".ss-item").forEach((row) => {
      const id = row.getAttribute("data-id");
      row.querySelector('[data-act="check"]')?.addEventListener("change", (e) => {
        const on = !!e.target.checked;
        setChecked(viewDate, id, on);
        refreshAll();
      });
      row.querySelector('[data-act="done"]')?.addEventListener("click", () => {
        setChecked(viewDate, id, true);
        markFirstDone(id, viewDate);
        refreshAll();
      });
    });

    root.querySelectorAll(".ss-recall").forEach((box) => {
      const id = box.getAttribute("data-id");
      box.querySelectorAll("[data-grade]").forEach((btn) => {
        btn.addEventListener("click", () => {
          gradeTicket(id, btn.getAttribute("data-grade"));
          refreshAll();
        });
      });
    });
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTP " + res.status + " " + url);
    return res.json();
  }

  function indexFactCards(cards) {
    cardsByTicket = new Map();
    if (!Array.isArray(cards)) return;
    for (const card of cards) {
      if (!card || !card.id || !card.subject) continue;
      const m = String(card.anchor || "").match(/Билет\s+(\d+)/i);
      if (!m) continue;
      const tid = card.subject + ":" + m[1];
      if (!cardsByTicket.has(tid)) cardsByTicket.set(tid, []);
      cardsByTicket.get(tid).push(card.id);
    }
  }

  async function init(rootOrOpts) {
    if (rootOrOpts && rootOrOpts.nodeType === 1) {
      todayRoot = rootOrOpts;
      calendarRoot = document.getElementById("session-calendar");
    } else {
      todayRoot =
        (rootOrOpts && rootOrOpts.today) ||
        document.getElementById("session-today");
      calendarRoot =
        (rootOrOpts && rootOrOpts.calendar) ||
        document.getElementById("session-calendar");
    }
    if (todayRoot) todayRoot.innerHTML = `<p class="ss-empty">Загрузка плана сессии…</p>`;
    if (calendarRoot) calendarRoot.innerHTML = `<p class="ss-empty">Загрузка календаря…</p>`;
    try {
      const [p, c] = await Promise.all([
        fetchJson("./session/plan.json"),
        fetchJson("./session/catalog.json"),
      ]);
      plan = p;
      catalog = new Map();
      for (const t of c.tickets || []) catalog.set(t.id, t);
      try {
        const bank = await fetchJson("./review/cards-exam.json");
        indexFactCards(bank.cards || []);
      } catch (_) {
        cardsByTicket = new Map();
      }
      viewDate = todayStr();
      if (viewDate < plan.start) viewDate = plan.start;
      refreshAll();
    } catch (e) {
      const msg = `<p class="ss-empty">Не удалось загрузить session/plan.json (${esc(
        String(e && e.message ? e.message : e)
      )}). Проверь офлайн-кэш или нажми «Обновить» онлайн.</p>`;
      if (todayRoot) todayRoot.innerHTML = msg;
      if (calendarRoot) calendarRoot.innerHTML = msg;
    }
  }

  function wireTabs() {
    const tabs = document.querySelectorAll(".nb-tab");
    const panels = {
      today: document.getElementById("panel-today"),
      calendar: document.getElementById("panel-calendar"),
      notebooks: document.getElementById("panel-notebooks"),
    };
    const allowed = new Set(["today", "calendar", "notebooks"]);
    activateTab = function activate(name) {
      if (!allowed.has(name)) name = "today";
      tabs.forEach((t) => {
        const on = t.getAttribute("data-tab") === name;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      Object.entries(panels).forEach(([k, el]) => {
        if (!el) return;
        el.hidden = k !== name;
      });
      if (name === "calendar" && calendarRoot && plan) renderCalendar(calendarRoot);
      try {
        localStorage.setItem(TAB_KEY, name);
      } catch (_) {}
    };
    tabs.forEach((t) =>
      t.addEventListener("click", () => activateTab(t.getAttribute("data-tab")))
    );
    let start = "today";
    try {
      const saved = localStorage.getItem(TAB_KEY);
      if (allowed.has(saved)) start = saved;
    } catch (_) {}
    const q = new URLSearchParams(location.search).get("tab");
    if (allowed.has(q)) start = q;
    activateTab(start);
  }

  global.SessionToday = {
    init,
    wireTabs,
    STATE_KEY,
  };
})(window);
