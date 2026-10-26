/*
 * UCHEBA notebook visuals — shared widgets (no dependencies, works offline).
 *
 * Include in a notebook <head>:
 *   <link rel="stylesheet" href="../_viz/viz.css">
 *   <script src="../_viz/viz.js" defer></script>
 *
 * Built-in widgets (markup only, no JS in the notebook):
 *   <div class="sort-anim" data-algo="quick|merge|insertion" data-title="…"
 *        data-items="5,2,8" | "Анна:4,Борис:5" data-presets="random,sorted,reversed"></div>
 *   <div class="lab" data-lab="switches|gates|fulladder|ripple|rs|vn|timeline|bfs|dfs|stackqueue|epsn|induct|recur
 *        |bisect|heap|countsort|binsearch|vecgrow|sqrtdec"></div>
 *   heap: optional data-mode="ops|sort"
 *   recur: optional data-preset="cbrt7|heron|sqrt2|half|p68"
 *   bisect: optional data-preset="sq2|cub|cos"
 *
 * Notebook-specific widget (inline script, any order relative to viz.js):
 *   <div class="lab" data-lab="mywidget"></div>
 *   <script>(window.VizLabs = window.VizLabs || {}).mywidget = function (box, V) {
 *     V.head(box, 'Заголовок');
 *     // V.gate(type,x,y,h,label) V.wire(sig,pts) V.txt V.dot V.lamp V.paint(root,vals)
 *     // V.el V.btn V.bitButtons(ctr,state,keys,names,render) V.stepper(ctr,{count,render,delay})
 *   };</script>
 */
window.Viz = window.Viz || {};

(function () {
  function parseItems(s) {
    return s.split(',').map(function (t, idx) {
      var p = t.trim().split(':');
      return p.length === 2 ? { v: +p[1], l: p[0], id: idx } : { v: +p[0], l: '', id: idx };
    });
  }
  function fmt(it) { return it.l ? it.l + ' (' + it.v + ')' : String(it.v); }
  function copy(o) { var r = {}; for (var k in o) r[k] = o[k]; return r; }

  function quickSteps(src) {
    var a = src.slice(), steps = [], done = {}, cmp = 0;
    function snap(o) {
      var st = { arr: a.slice(), done: copy(done), cmp: cmp };
      for (var k in o) st[k] = o[k];
      steps.push(st);
    }
    function qs(lo, hi) {
      if (lo > hi) return;
      if (lo === hi) {
        done[lo] = 1;
        snap({ msg: 'Отрезок из одного элемента ' + fmt(a[lo]) + ' — он уже на своём месте.' });
        return;
      }
      var p = a[hi], i = lo;
      snap({ lo: lo, hi: hi, pivot: hi, lessEnd: i,
        msg: 'Отрезок позиций ' + lo + '…' + hi + '. Опорный — последний элемент: ' + fmt(p) + '.' });
      for (var j = lo; j < hi; j++) {
        cmp++;
        var isLess = a[j].v < p.v;
        snap({ lo: lo, hi: hi, pivot: hi, cur: j, lessEnd: i,
          msg: 'Сравниваем ' + fmt(a[j]) + ' с опорным ' + p.v + ': ' +
            (isLess ? 'меньше → отправляем в левую группу.' : 'не меньше → остаётся справа.') });
        if (isLess) {
          if (i !== j) {
            var t = a[i]; a[i] = a[j]; a[j] = t;
            snap({ lo: lo, hi: hi, pivot: hi, cur: i, lessEnd: i + 1,
              msg: 'Обмен: ' + fmt(a[i]) + ' переезжает в конец левой группы.' });
          }
          i++;
        }
      }
      var t2 = a[i]; a[i] = a[hi]; a[hi] = t2;
      done[i] = 1;
      snap({ lo: lo, hi: hi, pivot: i, lessEnd: i,
        msg: 'Опорный ' + fmt(p) + ' встаёт на позицию ' + i + ': слева все меньше, справа — не меньше. ' +
          'Части: ' + (i - lo) + ' и ' + (hi - i) + ' элементов — сортируем их отдельно.' });
      qs(lo, i - 1);
      qs(i + 1, hi);
    }
    snap({ msg: 'Исходный массив. Нажми «▶» или «Шаг →».' });
    qs(0, a.length - 1);
    snap({ all: true, msg: 'Готово. Всего сравнений: ' + cmp + '.' });
    return steps;
  }

  function mergeSteps(src) {
    var a = src.slice(), steps = [], cmp = 0;
    function snap(o) {
      var st = { arr: a.slice(), cmp: cmp };
      for (var k in o) st[k] = o[k];
      steps.push(st);
    }
    function rec(lo, hi) {
      if (hi - lo <= 1) return;
      var mid = (lo + hi) >> 1;
      rec(lo, mid);
      rec(mid, hi);
      var L = a.slice(lo, mid), R = a.slice(mid, hi), i = 0, j = 0, out = [];
      function view() { return a.slice(0, lo).concat(out, L.slice(i), R.slice(j), a.slice(hi)); }
      function marks(msg) {
        return { arr: view(), lo: lo, hi: hi, mergedEnd: lo + out.length,
          leftEnd: lo + out.length + (L.length - i), msg: msg };
      }
      snap(marks('Сливаем отсортированные половины [' + L.map(fmt).join(', ') + '] и [' +
        R.map(fmt).join(', ') + '].'));
      while (i < L.length && j < R.length) {
        cmp++;
        var l = L[i], r = R[j], takeL = l.v <= r.v;
        var msg = l.v === r.v
          ? 'Ключи равны: ' + fmt(l) + ' и ' + fmt(r) + ' — берём из левой половины, так порядок равных сохраняется (устойчивость).'
          : 'Сравниваем головы ' + fmt(l) + ' и ' + fmt(r) + ' → берём меньшую: ' + fmt(takeL ? l : r) + '.';
        if (takeL) i++; else j++;
        out.push(takeL ? l : r);
        snap(marks(msg));
      }
      var rest = L.length - i + R.length - j;
      out = out.concat(L.slice(i), R.slice(j));
      i = L.length; j = R.length;
      for (var k = 0; k < out.length; k++) a[lo + k] = out[k];
      snap(marks((rest ? 'Одна половина кончилась — остаток (' + rest + ' шт.) дописываем без сравнений. ' : '') +
        'Отрезок позиций ' + lo + '…' + (hi - 1) + ' отсортирован.'));
    }
    snap({ msg: 'Исходный массив. Рекурсия сначала дробит его до отрезков длины 1, потом сливает пары. Нажми «▶» или «Шаг →».' });
    rec(0, a.length);
    snap({ all: true, msg: 'Готово. Всего сравнений: ' + cmp + '.' });
    return steps;
  }

  function insertionSteps(src) {
    var a = src.slice(), steps = [], cmp = 0, swaps = 0;
    function snap(o) {
      var st = { arr: a.slice(), cmp: cmp, swaps: swaps };
      for (var k in o) st[k] = o[k];
      steps.push(st);
    }
    snap({ sorted: 1, msg: 'Исходный массив. Префикс из одного элемента ' + fmt(a[0]) +
      ' уже отсортирован. Нажми «▶» или «Шаг →».' });
    for (var i = 1; i < a.length; i++) {
      var j = i;
      snap({ sorted: i, cur: j, msg: 'Берём ' + fmt(a[j]) + ' (позиция ' + i +
        ') и двигаем влево, пока сосед слева больше него.' });
      while (j > 0) {
        cmp++;
        if (a[j - 1].v > a[j].v) {
          var big = a[j - 1];
          a[j - 1] = a[j]; a[j] = big; swaps++; j--;
          snap({ sorted: i + 1, cur: j, msg: 'Слева стоял ' + fmt(big) + ' — он больше ' + fmt(a[j]) +
            ' → swap. ' + fmt(a[j]) + ' теперь на позиции ' + j + '.' });
        } else {
          snap({ sorted: i + 1, cur: j, msg: 'Сосед слева ' + fmt(a[j - 1]) + ' не больше ' + fmt(a[j]) +
            ' → стоп, элемент на месте. Отсортирован префикс длины ' + (i + 1) + '.' });
          break;
        }
      }
      if (j === 0) {
        snap({ sorted: i + 1, cur: 0, msg: fmt(a[0]) + ' дошёл до начала — он меньше всех левее. ' +
          'Отсортирован префикс длины ' + (i + 1) + '.' });
      }
    }
    snap({ all: true, msg: 'Готово. Сравнений: ' + cmp + ', обменов: ' + swaps +
      '. Обменов ровно столько, сколько пар стояло «не по порядку» (инверсий).' });
    return steps;
  }

  function classFor(st, k, algo) {
    if (st.all) return 'done';
    if (algo === 'insertion') {
      if (k === st.cur) return 'cur';
      if (st.sorted !== undefined && k < st.sorted) return 'less';
      return '';
    }
    if (algo === 'quick') {
      if (k === st.pivot) return 'pivot';
      if (st.done && st.done[k]) return 'done';
      if (k === st.cur) return 'cur';
      if (st.lo !== undefined && k >= st.lo && k < st.lessEnd) return 'less';
      if (st.lo !== undefined && k >= st.lo && k <= st.hi) return 'range';
      return '';
    }
    if (st.lo === undefined || k < st.lo || k >= st.hi) return '';
    if (k < st.mergedEnd) return 'merged';
    if (k < st.leftEnd) return 'left';
    return 'right';
  }

  function randomItems(n) {
    var r = [];
    for (var i = 0; i < n; i++) r.push({ v: 1 + Math.floor(Math.random() * 20), l: '', id: i });
    return r;
  }
  function sortedItems(n) {
    var r = [];
    for (var i = 0; i < n; i++) r.push({ v: i + 1, l: '', id: i });
    return r;
  }
  function reversedItems(n) {
    var r = [];
    for (var i = 0; i < n; i++) r.push({ v: n - i, l: '', id: i });
    return r;
  }

  function init(box) {
    var algo = box.dataset.algo;
    var initial = parseItems(box.dataset.items);
    var presets = (box.dataset.presets || '').split(',').filter(Boolean);
    box.innerHTML = '';
    var title = document.createElement('div'); title.className = 'sa-title';
    title.textContent = box.dataset.title || ''; box.appendChild(title);
    var stage = document.createElement('div'); stage.className = 'sa-stage'; box.appendChild(stage);
    var msg = document.createElement('div'); msg.className = 'sa-msg'; box.appendChild(msg);
    var stats = document.createElement('div'); stats.className = 'sa-stats'; box.appendChild(stats);
    var ctr = document.createElement('div'); ctr.className = 'sa-controls'; box.appendChild(ctr);
    var legend = document.createElement('div'); legend.className = 'sa-legend'; box.appendChild(legend);
    legend.innerHTML = algo === 'quick'
      ? '<i style="background:#c45c26"></i>опорный<i style="background:#e0a24a"></i>сравниваем<i style="background:#7fb8a4"></i>меньше опорного<i style="background:#b9d3c9"></i>текущий отрезок<i style="background:#1f5c4d"></i>на своём месте'
      : algo === 'insertion'
        ? '<i style="background:#e0a24a"></i>двигаем влево<i style="background:#7fb8a4"></i>отсортированный префикс<i style="background:#1f5c4d"></i>всё готово'
        : '<i style="background:#1f5c4d"></i>уже слито<i style="background:#7fb8a4"></i>левая половина<i style="background:#e7c7a0"></i>правая половина';

    function btn(text, fn) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = text;
      b.addEventListener('click', fn); ctr.appendChild(b); return b;
    }
    var steps, pos, timer = null, els, n, maxV, minV, playBtn;

    function load(items) {
      stop();
      steps = algo === 'quick' ? quickSteps(items)
        : algo === 'insertion' ? insertionSteps(items) : mergeSteps(items);
      pos = 0; n = items.length; stage.innerHTML = ''; els = {};
      maxV = Math.max.apply(null, items.map(function (x) { return x.v; }));
      minV = Math.min.apply(null, items.map(function (x) { return x.v; }));
      items.forEach(function (it) {
        var item = document.createElement('div'); item.className = 'sa-item';
        item.style.width = (100 / n) + '%';
        var bar = document.createElement('div'); bar.className = 'sa-bar'; bar.textContent = it.v;
        var lab = document.createElement('div'); lab.className = 'sa-label'; lab.textContent = it.l;
        item.appendChild(bar); item.appendChild(lab); stage.appendChild(item);
        els[it.id] = { item: item, bar: bar };
      });
      render();
    }
    function render() {
      var st = steps[pos];
      var hasLabels = st.arr.some(function (x) { return x.l; });
      st.arr.forEach(function (it, k) {
        var e = els[it.id];
        e.item.style.left = (k * 100 / n) + '%';
        var h = 25 + 75 * (it.v - minV + 1) / (maxV - minV + 1);
        e.bar.style.height = 'calc(' + h + '% - ' + (hasLabels ? '1.3rem' : '0.2rem') + ')';
        e.bar.className = 'sa-bar ' + classFor(st, k, algo);
      });
      msg.textContent = st.msg || '';
      var s = 'Шаг ' + pos + ' из ' + (steps.length - 1) + ' · сравнений: ' + st.cmp;
      if (st.swaps !== undefined) s += ' · обменов: ' + st.swaps;
      if ((algo === 'quick' || algo === 'insertion') && n > 3) {
        s += ' · для сравнения при n = ' + n + ': n(n−1)/2 = ' + (n * (n - 1) / 2) +
          ', n·log₂n ≈ ' + Math.round(n * Math.log2(n));
      }
      stats.textContent = s;
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      if (playBtn) playBtn.textContent = '▶ Пуск';
    }
    function play() {
      if (timer) { stop(); return; }
      if (pos >= steps.length - 1) pos = 0;
      playBtn.textContent = '⏸ Пауза';
      timer = setInterval(function () {
        if (pos >= steps.length - 1) { stop(); return; }
        pos++; render();
      }, +speed.value);
    }
    playBtn = btn('▶ Пуск', play);
    btn('← Шаг', function () { stop(); if (pos > 0) { pos--; render(); } });
    btn('Шаг →', function () { stop(); if (pos < steps.length - 1) { pos++; render(); } });
    btn('⟲ Сначала', function () { stop(); pos = 0; render(); });
    var speed = document.createElement('select');
    [['1400', 'медленно'], ['800', 'обычно'], ['350', 'быстро']].forEach(function (o) {
      var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1]; speed.appendChild(op);
    });
    speed.value = '800';
    speed.addEventListener('change', function () { if (timer) { stop(); play(); } });
    ctr.appendChild(speed);
    if (presets.length) btn('Исходный', function () { load(initial); });
    if (presets.indexOf('random') >= 0) btn('Случайный', function () { load(randomItems(initial.length)); });
    if (presets.indexOf('sorted') >= 0) btn('Уже отсортированный', function () { load(sortedItems(initial.length)); });
    if (presets.indexOf('reversed') >= 0) btn('Обратный порядок', function () { load(reversedItems(initial.length)); });
    load(initial);
  }

  window.Viz.sortInit = init;
})();

(function () {
  var SH = {
    AND: '<path d="M0,0 H30 A20,20 0 0 1 30,40 H0 Z"/>',
    OR: '<path d="M0,0 Q28,0 50,20 Q28,40 0,40 Q12,20 0,0 Z"/>',
    NOT: '<path d="M0,2 L42,20 L0,38 Z"/><circle cx="46" cy="20" r="4"/>'
  };
  SH.XOR = '<path class="gx" d="M-7,0 Q5,20 -7,40"/>' + SH.OR;
  SH.NAND = SH.AND + '<circle cx="54" cy="20" r="4"/>';
  SH.NOR = SH.OR + '<circle cx="54" cy="20" r="4"/>';
  SH.XNOR = SH.XOR + '<circle cx="54" cy="20" r="4"/>';

  function gate(t, x, y, h, label) {
    h = h || 40;
    var s = '<g class="g" transform="translate(' + x + ',' + y + ') scale(1,' + (h / 40) + ')">' + SH[t] + '</g>';
    if (label) s += '<text x="' + (x + 22) + '" y="' + (y + h / 2 + 4) + '" text-anchor="middle" font-size="10">' + label + '</text>';
    return s;
  }
  function wire(sig, pts) { return '<polyline class="w" data-s="' + sig + '" points="' + pts + '"/>'; }
  function txt(x, y, s, extra) { return '<text x="' + x + '" y="' + y + '"' + (extra || '') + '>' + s + '</text>'; }
  function dot(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="3" fill="#6b665c"/>'; }
  function lamp(sig, x, y, r) {
    return '<circle class="lamp" data-lamp="' + sig + '" cx="' + x + '" cy="' + y + '" r="' + (r || 10) + '"/>' +
      '<text data-val="' + sig + '" x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" font-size="11" font-weight="600"></text>';
  }
  function paint(root, v) {
    root.querySelectorAll('[data-s]').forEach(function (e) { e.classList.toggle('on', !!v[e.getAttribute('data-s')]); });
    root.querySelectorAll('[data-lamp]').forEach(function (e) { e.classList.toggle('on', !!v[e.getAttribute('data-lamp')]); });
    root.querySelectorAll('[data-val]').forEach(function (e) { e.textContent = v[e.getAttribute('data-val')] ? 1 : 0; });
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function btn(parent, text, fn) {
    var b = el('button'); b.type = 'button'; b.textContent = text;
    b.addEventListener('click', fn); parent.appendChild(b); return b;
  }
  function bitButtons(ctr, st, keys, names, render) {
    var bs = {};
    keys.forEach(function (k) {
      var b = btn(ctr, '', function () { st[k] = st[k] ? 0 : 1; render(); });
      b.classList.add('bit-btn'); bs[k] = b;
    });
    return function () {
      keys.forEach(function (k) {
        bs[k].textContent = (names[k] || k) + ' = ' + st[k];
        bs[k].classList.toggle('on', !!st[k]);
      });
    };
  }
  function stepper(ctr, api) {
    var pos = 0, timer = null, play;
    function go(p) { pos = Math.max(0, Math.min(api.count() - 1, p)); api.render(pos); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } play.textContent = '▶ Пуск'; }
    play = btn(ctr, '▶ Пуск', function () {
      if (timer) { stop(); return; }
      if (pos >= api.count() - 1) go(0);
      play.textContent = '⏸ Пауза';
      timer = setInterval(function () {
        if (pos >= api.count() - 1) { stop(); return; }
        go(pos + 1);
      }, api.delay || 1500);
    });
    btn(ctr, '← Шаг', function () { stop(); go(pos - 1); });
    btn(ctr, 'Шаг →', function () { stop(); go(pos + 1); });
    btn(ctr, '⟲ Сначала', function () { stop(); go(0); });
    return { reset: function () { stop(); go(0); } };
  }
  function head(box, title) {
    box.appendChild(el('div', 'sa-title', title));
  }
  function copy(o) { var r = {}; for (var k in o) r[k] = o[k]; return r; }

  /* ---------- транзисторы: последовательно / параллельно ---------- */
  function sw(k, x, y) {
    return '<circle cx="' + x + '" cy="' + y + '" r="3.5" fill="#1c1b19"/><circle cx="' + x + '" cy="' + (y + 30) + '" r="3.5" fill="#1c1b19"/>' +
      '<line class="lever" data-k="' + k + '" data-x="' + x + '" data-y="' + y + '" x1="' + x + '" y1="' + (y + 30) + '" x2="' + x + '" y2="' + y + '"/>' +
      txt(x - 10, y + 20, k, ' text-anchor="end" font-size="13" font-weight="600"');
  }
  function ground(x, y) {
    return '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y + 10) + '" stroke="#1c1b19"/>' +
      '<line x1="' + (x - 10) + '" y1="' + (y + 10) + '" x2="' + (x + 10) + '" y2="' + (y + 10) + '" stroke="#1c1b19" stroke-width="2"/>' +
      '<line x1="' + (x - 6) + '" y1="' + (y + 14) + '" x2="' + (x + 6) + '" y2="' + (y + 14) + '" stroke="#1c1b19" stroke-width="2"/>';
  }
  function labSwitches(box) {
    var st = { A: 1, B: 0 };
    head(box, 'Транзисторы как краны: подряд = AND, рядом = OR');
    var svg = '<svg viewBox="0 0 400 215" xmlns="http://www.w3.org/2000/svg">' +
      txt(100, 14, 'последовательно → AND', ' text-anchor="middle" font-size="12" font-weight="600"') +
      txt(48, 34, '+U', ' text-anchor="end" font-size="11"') +
      '<polyline class="w on" points="52,30 150,30"/><polyline class="w on" points="100,30 100,50"/>' +
      sw('A', 100, 50) + wire('A', '100,80 100,100') + sw('B', 100, 100) + wire('AB', '100,130 100,163') +
      lamp('AB', 100, 175, 12) + ground(100, 187) +
      txt(300, 14, 'параллельно → OR', ' text-anchor="middle" font-size="12" font-weight="600"') +
      txt(238, 34, '+U', ' text-anchor="end" font-size="11"') +
      '<polyline class="w on" points="242,30 360,30"/><polyline class="w on" points="270,30 270,50"/><polyline class="w on" points="330,30 330,50"/>' +
      sw('A', 270, 50) + sw('B', 330, 50) +
      wire('A', '270,80 270,115 300,115') + wire('B', '330,80 330,115 300,115') + wire('AorB', '300,115 300,163') +
      lamp('AorB', 300, 175, 12) + ground(300, 187) + '</svg>';
    var holder = el('div', null, svg); box.appendChild(holder);
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var upd = bitButtons(ctr, st, ['A', 'B'], {}, render);
    function render() {
      upd();
      holder.querySelectorAll('.lever').forEach(function (l) {
        var x = +l.getAttribute('data-x'), y = +l.getAttribute('data-y'), on = st[l.getAttribute('data-k')];
        l.setAttribute('x2', on ? x : x + 18); l.setAttribute('y2', on ? y : y + 6);
      });
      var v = { A: st.A, B: st.B, AB: st.A && st.B, AorB: st.A || st.B };
      paint(holder, v);
      msg.textContent = 'A = ' + st.A + ', B = ' + st.B + ': последовательно ток ' + (v.AB ? 'проходит (оба ключа замкнуты) → 1' : 'не проходит → 0') +
        '; параллельно ' + (v.AorB ? 'проходит хотя бы по одной ветке → 1' : 'обе ветки разомкнуты → 0') + '.';
    }
    render();
  }

  /* ---------- семь вентилей ---------- */
  var GATES = [
    ['NOT', 'НЕ', 'Y = ¬A', function (a) { return a ? 0 : 1; }, 1],
    ['AND', 'И', 'Y = A ∧ B', function (a, b) { return a & b; }],
    ['OR', 'ИЛИ', 'Y = A ∨ B', function (a, b) { return a | b; }],
    ['XOR', 'исключающее ИЛИ', 'Y = A ⊕ B', function (a, b) { return a ^ b; }],
    ['NAND', 'И‑НЕ', 'Y = ¬(A ∧ B)', function (a, b) { return (a & b) ? 0 : 1; }],
    ['NOR', 'ИЛИ‑НЕ', 'Y = ¬(A ∨ B)', function (a, b) { return (a | b) ? 0 : 1; }],
    ['XNOR', 'равенство', 'Y = ¬(A ⊕ B)', function (a, b) { return a === b ? 1 : 0; }]
  ];
  function labGates(box) {
    var st = { A: 1, B: 1 };
    head(box, 'Семь вентилей: переключай входы');
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    var upd = bitButtons(ctr, st, ['A', 'B'], {}, render);
    var grid = el('div', 'gate-grid'); box.appendChild(grid);
    var cards = GATES.map(function (g) {
      var one = g[4] === 1;
      var svg = '<svg viewBox="0 0 140 50" xmlns="http://www.w3.org/2000/svg">' +
        (one ? wire('a', '12,25 48,25') + txt(2, 29, 'A', ' font-size="10"')
             : wire('a', '12,15 48,15') + wire('b', '12,35 48,35') + txt(2, 19, 'A', ' font-size="10"') + txt(2, 39, 'B', ' font-size="10"')) +
        wire('y', '90,25 112,25') + gate(g[0], 40, 5) + lamp('y', 123, 25, 9) + '</svg>';
      var c = el('div', 'gate-card', '<b>' + g[0] + '</b> · ' + g[1] + svg + '<div class="mono">' + g[2] + '</div>');
      grid.appendChild(c);
      return c;
    });
    function render() {
      upd();
      GATES.forEach(function (g, i) {
        paint(cards[i], { a: st.A, b: st.B, y: g[3](st.A, st.B) });
      });
    }
    render();
  }

  /* ---------- полный сумматор ---------- */
  function labFullAdder(box) {
    var st = { A: 1, B: 0, C: 1 };
    head(box, 'Полный одноразрядный сумматор (схема со слайда 15)');
    var svg = '<svg viewBox="0 0 530 240" xmlns="http://www.w3.org/2000/svg">' +
      wire('A', '22,40 158,40') + wire('A', '100,40 100,195 308,195') +
      wire('B', '22,70 158,70') + wire('B', '120,70 120,215 308,215') +
      wire('C', '22,110 270,110') + wire('C', '270,110 270,95 298,95') + wire('C', '270,110 270,160 308,160') +
      wire('P', '200,55 250,55 250,65 298,65') + wire('P', '230,55 230,140 308,140') +
      wire('S', '340,80 472,80') +
      wire('G1', '350,150 380,150 380,165 408,165') + wire('G2', '350,205 380,205 380,195 408,195') +
      wire('Co', '450,180 472,180') +
      dot(100, 40) + dot(120, 70) + dot(230, 55) + dot(270, 110) +
      gate('XOR', 150, 25, 60, 'XOR') + gate('XOR', 290, 50, 60, 'XOR') +
      gate('AND', 300, 130, 40, 'AND') + gate('AND', 300, 185, 40, 'AND') + gate('OR', 400, 150, 60, 'OR') +
      txt(4, 44, 'A', ' font-size="13" font-weight="600"') + txt(4, 74, 'B', ' font-size="13" font-weight="600"') +
      txt(0, 114, 'C<tspan font-size="9" dy="3">in</tspan>', ' font-size="13" font-weight="600"') +
      txt(205, 50, 'A⊕B', ' font-size="10" fill="#6b665c"') +
      lamp('S', 485, 80, 11) + txt(502, 85, 'S', ' font-size="13" font-weight="600"') +
      lamp('Co', 485, 180, 11) + txt(500, 185, 'C<tspan font-size="9" dy="3">out</tspan>', ' font-size="13" font-weight="600"') +
      '</svg>';
    var row = el('div', 'lab-row'); box.appendChild(row);
    var holder = el('div', null, svg); holder.style.flex = '1 1 360px'; row.appendChild(holder);
    var rows = '';
    for (var r = 0; r < 8; r++) {
      var a = r >> 2 & 1, b = r >> 1 & 1, c = r & 1, s = a + b + c;
      rows += '<tr data-r="' + r + '"><td>' + a + '</td><td>' + b + '</td><td>' + c + '</td><td>' + (s >> 1) + '</td><td>' + (s & 1) + '</td></tr>';
    }
    var table = el('table', 'tt', '<tr><th>A</th><th>B</th><th>C<sub>in</sub></th><th>C<sub>out</sub></th><th>S</th></tr>' + rows);
    row.appendChild(table);
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var upd = bitButtons(ctr, st, ['A', 'B', 'C'], { C: 'Cin' }, render);
    function render() {
      upd();
      var P = st.A ^ st.B, S = P ^ st.C, G1 = P & st.C, G2 = st.A & st.B, Co = G1 | G2;
      paint(holder, { A: st.A, B: st.B, C: st.C, P: P, S: S, G1: G1, G2: G2, Co: Co });
      var idx = st.A * 4 + st.B * 2 + st.C;
      table.querySelectorAll('tr[data-r]').forEach(function (tr) { tr.classList.toggle('act', +tr.getAttribute('data-r') === idx); });
      var sum = st.A + st.B + st.C;
      msg.textContent = 'A + B + Cin = ' + st.A + ' + ' + st.B + ' + ' + st.C + ' = ' + sum + ' = ' + Co + '' + S + '₂ → S = ' + S + ', Cout = ' + Co +
        '. Сверху: первый XOR даёт A⊕B = ' + P + ', второй — S. Снизу: AND(A,B) = ' + G2 + ', AND(A⊕B, Cin) = ' + G1 + ', их OR = Cout.';
    }
    render();
  }

  /* ---------- многоразрядный сумматор ---------- */
  function labRipple(box) {
    head(box, '4‑разрядный сумматор: перенос бежит от разряда к разряду (слайд 16)');
    var holder = el('div'); box.appendChild(holder);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    var A, B, a, b, s, c;
    function X(i) { return 390 - i * 112; }
    var svg = '<svg viewBox="0 0 520 190" xmlns="http://www.w3.org/2000/svg">';
    for (var i = 0; i < 4; i++) {
      var x = X(i);
      svg += txt(x + 40, 22, 'A<tspan font-size="9" dy="3">' + i + '</tspan><tspan dy="-3"> = </tspan><tspan data-a="' + i + '"></tspan>', ' text-anchor="middle" font-size="13"') +
        txt(x + 40, 42, 'B<tspan font-size="9" dy="3">' + i + '</tspan><tspan dy="-3"> = </tspan><tspan data-b="' + i + '"></tspan>', ' text-anchor="middle" font-size="13"') +
        '<rect class="rbox" data-box="' + i + '" x="' + x + '" y="55" width="80" height="60" rx="6"/>' +
        txt(x + 40, 82, 'Σ' + i, ' text-anchor="middle" font-size="14" font-weight="600"') +
        txt(x + 40, 102, 'полный', ' text-anchor="middle" font-size="10" fill="#6b665c"') +
        '<line x1="' + (x + 40) + '" y1="115" x2="' + (x + 40) + '" y2="135" stroke="#6b665c"/>' +
        txt(x + 40, 155, 'S<tspan font-size="9" dy="3">' + i + '</tspan><tspan dy="-3"> = </tspan><tspan data-sum="' + i + '"></tspan>', ' text-anchor="middle" font-size="13" font-weight="600"');
      svg += wire('c' + (i + 1), (x) + ',85 ' + (x - 32) + ',85') +
        txt(x - 16, 78, '', ' data-c="' + (i + 1) + '" text-anchor="middle" font-size="12" font-weight="600" fill="#c45c26"');
    }
    svg += wire('c0', '505,85 470,85') + txt(492, 78, '0', ' text-anchor="middle" font-size="12" fill="#6b665c"') +
      txt(492, 106, 'PI', ' text-anchor="middle" font-size="10" fill="#6b665c"') +
      txt(30, 106, 'PO', ' text-anchor="middle" font-size="10" fill="#6b665c"') + '</svg>';
    holder.innerHTML = svg;
    function load(x, y) {
      A = x; B = y; a = []; b = []; s = []; c = [0];
      for (var i = 0; i < 4; i++) {
        a[i] = x >> i & 1; b[i] = y >> i & 1;
        var t = a[i] + b[i] + c[i]; s[i] = t & 1; c[i + 1] = t >> 1;
      }
      holder.querySelectorAll('[data-a]').forEach(function (e) { e.textContent = a[+e.getAttribute('data-a')]; });
      holder.querySelectorAll('[data-b]').forEach(function (e) { e.textContent = b[+e.getAttribute('data-b')]; });
      if (sp) sp.reset();
    }
    function bin(v, n) { var r = ''; for (var i = n - 1; i >= 0; i--) r += v >> i & 1; return r; }
    function render(p) {
      holder.querySelectorAll('[data-box]').forEach(function (e) {
        var i = +e.getAttribute('data-box');
        e.setAttribute('class', 'rbox' + (p >= 1 && p <= 4 && i === p - 1 ? ' act' : (i < p - 1 || p === 5 ? ' done' : '')));
      });
      holder.querySelectorAll('[data-sum]').forEach(function (e) { var i = +e.getAttribute('data-sum'); e.textContent = i < p ? s[i] : '?'; });
      holder.querySelectorAll('[data-c]').forEach(function (e) { var k = +e.getAttribute('data-c'); e.textContent = k <= p ? c[k] : ''; });
      var v = { c0: 0 };
      for (var k = 1; k <= 4; k++) v['c' + k] = k <= p ? c[k] : 0;
      paint(holder, v);
      if (p === 0) msg.textContent = 'Складываем A = ' + bin(A, 4) + '₂ = ' + A + ' и B = ' + bin(B, 4) + '₂ = ' + B + '. В младший разряд входит перенос PI = 0.';
      else if (p <= 4) {
        var i = p - 1, t = a[i] + b[i] + c[i];
        msg.textContent = 'Разряд ' + i + ': A' + i + ' + B' + i + ' + перенос = ' + a[i] + ' + ' + b[i] + ' + ' + c[i] + ' = ' + t + ' = ' + c[i + 1] + s[i] + '₂ → S' + i + ' = ' + s[i] +
          ', перенос ' + c[i + 1] + (i < 3 ? ' уходит в разряд ' + (i + 1) + ' — тот его ждал.' : ' выходит наружу (PO).');
      } else {
        msg.textContent = 'Итог: ' + A + ' + ' + B + ' = ' + (A + B) + ' = ' + c[4] + bin(A + B & 15, 4) + '₂ (PO = ' + c[4] + ', затем S3…S0). ' +
          (c[4] ? 'PO = 1: результат не влез в 4 бита — переполнение.' : 'Каждый разряд ждал перенос справа: 4 разряда — 4 «шага ожидания».');
      }
    }
    var sp = stepper(ctr, { count: function () { return 6; }, render: render, delay: 1700 });
    btn(ctr, '7 + 3', function () { load(7, 3); });
    btn(ctr, '15 + 1', function () { load(15, 1); });
    btn(ctr, '5 + 6', function () { load(5, 6); });
    load(7, 3);
  }

  /* ---------- RS-триггер ---------- */
  function labRS(box) {
    var st = { S: 0, R: 0 }, Q = 0, hist = [{ S: 0, R: 0, Q: 0 }];
    head(box, 'RS‑триггер: Q = (S ∨ Q₋₁) ∧ ¬R (схема со слайда 19)');
    var svg = '<svg viewBox="0 0 470 200" xmlns="http://www.w3.org/2000/svg">' +
      wire('S', '30,120 160,120') + wire('O', '200,110 268,110') + wire('R', '30,170 240,170 240,130 252,130') +
      wire('Q', '310,120 430,120') + wire('Q', '380,120 380,45 120,45 120,100 160,100') + dot(380, 120) +
      gate('OR', 150, 90, 40, 'OR') + gate('AND', 260, 100, 40, 'AND') +
      '<circle class="g1" cx="256" cy="130" r="4"/>' +
      txt(12, 125, 'S', ' font-size="14" font-weight="600"') + txt(12, 175, 'R', ' font-size="14" font-weight="600"') +
      txt(250, 38, 'обратная связь: Q снова на входе OR (цикл)', ' text-anchor="middle" font-size="11" fill="#6b665c"') +
      lamp('Q', 443, 120, 12) + txt(443, 100, 'Q', ' text-anchor="middle" font-size="14" font-weight="600"') +
      txt(214, 166, 'инверсия R', ' font-size="10" fill="#6b665c"') + '</svg>';
    var holder = el('div', null, svg); box.appendChild(holder);
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var histBox = el('div'); box.appendChild(histBox);
    var upd = bitButtons(ctr, st, ['S', 'R'], { S: 'S (set)', R: 'R (reset)' }, step);
    btn(ctr, '⟲ Сброс', function () { st.S = 0; st.R = 0; Q = 0; hist = [{ S: 0, R: 0, Q: 0 }]; draw('Начальное состояние: Q = 0, S = R = 0.'); });
    function step() {
      var prev = Q;
      Q = (st.S || Q) && !st.R ? 1 : 0;
      hist.push({ S: st.S, R: st.R, Q: Q });
      if (hist.length > 16) hist.shift();
      var m;
      if (st.S && st.R) m = 'S = R = 1 — запрещённая комбинация (на слайде «—»): одновременно «записать 1» и «стереть». В этой схеме побеждает R (Q = 0); в классическом триггере на ИЛИ‑НЕ результат не определён.';
      else if (st.S) m = 'S = 1 (set): OR выдаёт 1, R = 0 → инверсия R = 1, AND пропускает → Q = 1.';
      else if (st.R) m = 'R = 1 (reset): инверсия R = 0 «запирает» AND → Q = 0, что бы ни было на OR.';
      else m = 'S = R = 0: на OR приходит только обратная связь Q₋₁ = ' + prev + ' → Q = ' + Q + '. Схема хранит последний записанный бит!';
      draw(m);
    }
    function draw(m) {
      upd();
      paint(holder, { S: st.S, R: st.R, O: st.S || Q, Q: Q });
      msg.textContent = m;
      var cw = 26, h = '<svg viewBox="0 0 ' + (40 + cw * 16) + ' 74" xmlns="http://www.w3.org/2000/svg">';
      ['S', 'R', 'Q'].forEach(function (k, row) {
        var y = 6 + row * 22;
        h += txt(4, y + 13, k, ' font-size="12" font-weight="600"');
        hist.forEach(function (e, i) {
          h += '<rect x="' + (30 + i * cw) + '" y="' + y + '" width="' + (cw - 3) + '" height="16" rx="3" fill="' + (e[k] ? (k === 'Q' ? '#f2b53a' : '#c45c26') : '#e2ddd2') + '"/>';
        });
      });
      histBox.innerHTML = h + '</svg><div class="caption">История нажатий (слева направо): видно, что Q держит значение, когда S и R уже выключены.</div>';
    }
    draw('Начальное состояние: Q = 0, S = R = 0. Включи S, затем выключи его.');
  }

  /* ---------- цикл фон Неймана ---------- */
  function labVN(box) {
    head(box, 'Анимация: процессор выполняет программу из памяти');
    var rows = [[0, 'LOAD 7'], [1, 'ADD 8'], [2, 'STORE 9'], [3, 'HALT'], [null, '…'], [7, '5'], [8, '3'], [9, '0']];
    var svg = '<svg viewBox="0 0 600 290" xmlns="http://www.w3.org/2000/svg">' +
      txt(105, 22, 'Память', ' text-anchor="middle" font-size="13" font-weight="600"');
    rows.forEach(function (r, i) {
      var y = 34 + i * 30;
      if (r[0] === null) { svg += txt(105, y + 17, '…', ' text-anchor="middle" font-size="14" fill="#6b665c"'); return; }
      svg += '<rect class="cell" data-addr="' + r[0] + '" x="20" y="' + y + '" width="170" height="26" rx="4"/>' +
        txt(36, y + 18, r[0], ' font-size="12" fill="#6b665c" font-family="Consolas, monospace"') +
        txt(115, y + 18, r[1], ' text-anchor="middle" font-size="13" font-family="Consolas, monospace"' + (r[0] === 9 ? ' data-m9="1"' : ''));
    });
    svg += txt(30, 284, 'адрес', ' font-size="10" fill="#6b665c"') +
      '<rect x="200" y="128" width="190" height="34" rx="4" fill="#f0ebe3" stroke="#cfc8ba"/>' +
      txt(295, 182, 'одна общая шина', ' text-anchor="middle" font-size="11" fill="#6b665c"') +
      '<rect x="400" y="20" width="185" height="262" rx="8" fill="none" stroke="#1f5c4d" stroke-dasharray="5 4"/>' +
      txt(492, 38, 'Процессор', ' text-anchor="middle" font-size="13" font-weight="600"') +
      '<rect class="unit" data-u="cu" x="410" y="48" width="165" height="104" rx="6"/>' +
      txt(492, 68, 'Управляющее устройство', ' text-anchor="middle" font-size="11" font-weight="600"') +
      txt(422, 100, '', ' data-pc="1" font-size="13" font-family="Consolas, monospace"') +
      txt(422, 130, '', ' data-ir="1" font-size="13" font-family="Consolas, monospace"') +
      '<rect class="unit" data-u="alu" x="410" y="164" width="165" height="106" rx="6"/>' +
      txt(492, 184, 'АЛУ', ' text-anchor="middle" font-size="11" font-weight="600"') +
      txt(422, 216, '', ' data-acc="1" font-size="13" font-family="Consolas, monospace"') +
      txt(422, 248, '', ' data-op="1" font-size="12" fill="#c45c26" font-family="Consolas, monospace"') +
      '<g class="tok" style="opacity:0"><rect x="-38" y="-12" width="76" height="24" rx="12" fill="#c45c26"/>' +
      '<text y="5" text-anchor="middle" font-size="12" fill="#fff" font-family="Consolas, monospace"></text></g></svg>';
    var holder = el('div', null, svg); box.appendChild(holder);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var stats = el('div', 'sa-stats'); box.appendChild(stats);
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);

    var S = [], cur = { pc: 0, ir: '—', acc: 0, op: '', m9: '0' };
    function push(ch, ex) {
      for (var k in ch) cur[k] = ch[k];
      var o = {}; for (var k2 in cur) o[k2] = cur[k2]; for (var k3 in ex) o[k3] = ex[k3];
      S.push(o);
    }
    function fetch(ad, cmd) {
      push({}, { hl: ad, u: 'cu', mv: ['адрес ' + ad, 'toMem'], msg: 'Выборка: CU берёт номер из PC = ' + ad + ' и выставляет адрес на шину (принцип адресности).' });
      push({ ir: cmd, pc: ad + 1 }, { hl: ad, u: 'cu', mv: [cmd, 'toCPU'], msg: 'По той же шине из ячейки ' + ad + ' приходит команда «' + cmd + '» → регистр IR. PC = ' + (ad + 1) + ': команды идут подряд (программное управление).' });
    }
    push({}, { msg: 'Программа (ячейки 0–3) и данные (7–9) лежат в одной памяти и выглядят одинаково — однородность памяти. PC = 0: начинаем с ячейки 0.' });
    fetch(0, 'LOAD 7');
    push({}, { u: 'cu', msg: 'Декодирование: LOAD 7 = «загрузи в аккумулятор ACC число из ячейки 7».' });
    push({}, { hl: 7, u: 'cu', mv: ['адрес 7', 'toMem'], msg: 'Исполнение: нужен операнд — снова выставляем адрес на ту же шину.' });
    push({ acc: 5 }, { hl: 7, u: 'alu', mv: ['5', 'toCPU'], msg: 'Число 5 едет по шине в ACC. ACC = 5.' });
    fetch(1, 'ADD 8');
    push({}, { u: 'cu', msg: 'Декодирование: ADD 8 = «прибавь к ACC число из ячейки 8».' });
    push({}, { hl: 8, u: 'cu', mv: ['адрес 8', 'toMem'], msg: 'Адрес операнда 8 — на шину.' });
    push({}, { hl: 8, u: 'alu', mv: ['3', 'toCPU'], msg: 'Число 3 приходит в АЛУ.' });
    push({ acc: 8, op: '5 + 3 = 8' }, { u: 'alu', msg: 'АЛУ складывает: ACC = 5 + 3 = 8 (внутри — многоразрядный сумматор из блока выше).' });
    fetch(2, 'STORE 9');
    push({}, { u: 'cu', msg: 'Декодирование: STORE 9 = «запиши ACC в ячейку 9».' });
    push({}, { hl: 9, u: 'cu', mv: ['адрес 9', 'toMem'], msg: 'Адрес 9 — на шину.' });
    push({ m9: '8' }, { hl: 9, u: 'alu', mv: ['8', 'toMem'], msg: 'ACC = 8 едет по шине в ячейку 9. Результат работы машины — изменение памяти.' });
    fetch(3, 'HALT');
    var nBus = S.filter(function (x) { return x.mv; }).length;
    push({}, { u: 'cu', msg: 'HALT — стоп. Итого ' + nBus + ' пересылок, и все — по одной шине, строго по очереди: пока едет команда, данные ждут, и наоборот. Процессор то и дело простаивает в ожидании памяти — это и есть «узкое место» фон Неймана.' });

    var tok = holder.querySelector('.tok'), tokText = tok.querySelector('text');
    function busCount(p) { var n = 0; for (var i = 1; i <= p; i++) if (S[i].mv) n++; return n; }
    function render(p) {
      var o = S[p];
      holder.querySelectorAll('.cell').forEach(function (c) { c.classList.toggle('hl', +c.getAttribute('data-addr') === o.hl); });
      holder.querySelectorAll('.unit').forEach(function (u) { u.classList.toggle('act', u.getAttribute('data-u') === o.u); });
      holder.querySelector('[data-pc]').textContent = 'PC  = ' + o.pc;
      holder.querySelector('[data-ir]').textContent = 'IR  = ' + o.ir;
      holder.querySelector('[data-acc]').textContent = 'ACC = ' + o.acc;
      holder.querySelector('[data-op]').textContent = o.op;
      holder.querySelector('[data-m9]').textContent = o.m9;
      msg.textContent = o.msg;
      stats.textContent = 'Шаг ' + p + ' из ' + (S.length - 1) + ' · пересылок по шине: ' + busCount(p);
      if (o.mv) {
        var from = o.mv[1] === 'toCPU' ? 222 : 368, to = o.mv[1] === 'toCPU' ? 368 : 222;
        tokText.textContent = o.mv[0];
        tok.style.transition = 'none';
        tok.style.transform = 'translate(' + from + 'px, 145px)';
        tok.style.opacity = 1;
        tok.getBoundingClientRect();
        tok.style.transition = '';
        requestAnimationFrame(function () { tok.style.transform = 'translate(' + to + 'px, 145px)'; });
      } else {
        tok.style.opacity = 0;
      }
    }
    stepper(ctr, { count: function () { return S.length; }, render: render, delay: 1900 });
    render(0);
  }

  /* ---------- последовательно / параллельно / асинхронно ---------- */
  function labTimeline(box) {
    var D = [20, 7, 10, 8], K = 10.4, X0 = 100;
    head(box, 'Четыре задачи: как меняется общее время');
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    var holder = el('div'); box.appendChild(holder);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var stats = el('div', 'sa-stats'); box.appendChild(stats);
    function plan(mode) {
      var rows = [], thread = [], t = 0, n = D.length;
      if (mode === 'seq' || mode === 'cpu') {
        D.forEach(function (d) { rows.push([[t, t + d, 'cpu']]); t += d; });
        thread = [[0, t, 'cpu']];
      } else if (mode === 'par') {
        D.forEach(function (d) { rows.push([[0, d, 'cpu']]); });
        thread = null;
      } else {
        D.forEach(function (d, i) { rows.push([[i, i + 1, 'cpu'], [i + 1, i + d - 1, 'wait']]); });
        thread = [[0, n, 'cpu']];
        var free = n;
        D.map(function (d, i) { return { i: i, r: i + d - 1 }; }).sort(function (x, y) { return x.r - y.r; }).forEach(function (e) {
          var s0 = Math.max(e.r, free);
          rows[e.i].push([s0, s0 + 1, 'cpu']); thread.push([s0, s0 + 1, 'cpu']); free = s0 + 1;
        });
      }
      var total = 0;
      rows.forEach(function (r) { r.forEach(function (sg) { total = Math.max(total, sg[1]); }); });
      return { rows: rows, thread: thread, total: total };
    }
    var TEXT = {
      seq: ['Последовательно (синхронно)', 'Один поток, задачи строго по очереди: каждая ждёт конца предыдущей. Итого 20 + 7 + 10 + 8 = 45 с.'],
      par: ['Параллельно (4 потока)', 'Четыре потока/ядра работают одновременно. Итого = самая долгая задача = 20 с. Параллельность всегда требует нескольких исполнителей.'],
      async: ['Асинхронно, 1 поток', 'Задачи — запросы к серверу: тёмное — работа нашего потока (отправить запрос, обработать ответ), штриховка — ожидание. Поток не ждёт ответа, а сразу отправляет следующий запрос и обрабатывает ответы по мере прихода. Итого ≈ 20 с одним потоком! Параллельно здесь работает сервер, а не наш код: асинхронность ≠ параллельность.'],
      cpu: ['Асинхронно, но задачи — вычисления', 'Если задачи — чистые вычисления, ждать нечего: считать может только наш единственный поток → снова 45 с. Поэтому «асинхронно — всегда быстрее» неверно.']
    };
    var mode = 'seq', P, t = 0, raf = null, modeBtns = {};
    Object.keys(TEXT).forEach(function (m) {
      modeBtns[m] = btn(ctr, TEXT[m][0], function () { setMode(m); play(); });
    });
    var playBtn = btn(ctr, '▶ Пуск', function () { if (raf) stop(); else play(); });
    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; playBtn.textContent = '▶ Пуск'; }
    function setMode(m) {
      stop(); mode = m; P = plan(m); t = 0;
      Object.keys(modeBtns).forEach(function (k) { modeBtns[k].classList.toggle('on', k === m); });
      var h = '<svg viewBox="0 0 600 220" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
        '<rect width="6" height="6" fill="#fff4e5"/><line x1="0" y1="0" x2="0" y2="6" stroke="#e0a24a" stroke-width="2.5"/></pattern></defs>';
      P.rows.forEach(function (r, i) {
        var y = 14 + i * 30;
        h += txt(8, y + 15, 'Задача ' + (i + 1) + ' (' + D[i] + ' с)', ' font-size="11"');
        h += '<rect x="' + X0 + '" y="' + y + '" width="' + (45 * K) + '" height="20" fill="#f6f4ef"/>';
        r.forEach(function (sg) {
          h += '<rect class="seg-' + sg[2] + '" data-s0="' + sg[0] + '" data-s1="' + sg[1] + '" x="' + (X0 + sg[0] * K) + '" y="' + y + '" width="0" height="20" rx="2"/>';
        });
      });
      var ty = 14 + 4 * 30 + 12;
      h += txt(8, ty + 15, P.thread ? 'наш поток' : '4 потока', ' font-size="11" font-weight="600"');
      if (P.thread) {
        h += '<rect x="' + X0 + '" y="' + ty + '" width="' + (45 * K) + '" height="20" fill="#f6f4ef"/>';
        P.thread.forEach(function (sg) {
          h += '<rect class="seg-cpu" data-s0="' + sg[0] + '" data-s1="' + sg[1] + '" x="' + (X0 + sg[0] * K) + '" y="' + ty + '" width="0" height="20" rx="2" fill-opacity="0.55"/>';
        });
      } else {
        h += txt(X0, ty + 15, 'каждая задача — на своём ядре', ' font-size="11" fill="#6b665c"');
      }
      for (var s = 0; s <= 45; s += 5) {
        h += '<line x1="' + (X0 + s * K) + '" y1="176" x2="' + (X0 + s * K) + '" y2="182" stroke="#6b665c"/>' + txt(X0 + s * K, 196, s, ' text-anchor="middle" font-size="10" fill="#6b665c"');
      }
      h += '<line x1="' + X0 + '" y1="176" x2="' + (X0 + 45 * K) + '" y2="176" stroke="#6b665c"/>' + txt(X0 + 45 * K, 212, 'секунды', ' text-anchor="end" font-size="10" fill="#6b665c"');
      h += '<line class="cursor" x1="' + X0 + '" y1="8" x2="' + X0 + '" y2="176" stroke="#c45c26" stroke-width="2"/>';
      h += '<text class="tot" x="0" y="0" font-size="12" font-weight="700" fill="#c45c26"></text></svg>';
      holder.innerHTML = h;
      msg.textContent = TEXT[m][1];
      draw();
    }
    function draw() {
      holder.querySelectorAll('[data-s0]').forEach(function (r) {
        var a = +r.getAttribute('data-s0'), b = +r.getAttribute('data-s1');
        r.setAttribute('width', Math.max(0, Math.min(t, b) - a) * K);
      });
      var cx = X0 + t * K, cur = holder.querySelector('.cursor'), tot = holder.querySelector('.tot');
      cur.setAttribute('x1', cx); cur.setAttribute('x2', cx);
      if (t >= P.total) {
        tot.textContent = 'итого ' + P.total + ' с';
        tot.setAttribute('x', Math.min(cx + 6, 540)); tot.setAttribute('y', 172);
      } else tot.textContent = '';
      stats.textContent = 't = ' + Math.floor(t) + ' с' + (t >= P.total ? ' · все задачи завершены за ' + P.total + ' с' : '');
    }
    function play() {
      stop();
      if (t >= P.total) t = 0;
      playBtn.textContent = '⏸ Пауза';
      var last = null;
      function frame(ts) {
        if (last !== null) t = Math.min(P.total, t + (ts - last) / 1000 * 8);
        last = ts; draw();
        if (t < P.total) raf = requestAnimationFrame(frame); else stop();
      }
      raf = requestAnimationFrame(frame);
    }
    setMode('seq');
  }

  /* ---------- общий граф для BFS / DFS ---------- */
  var GRAPH = {
    nodes: [
      { id: 0, x: 80, y: 100 }, { id: 1, x: 200, y: 40 }, { id: 2, x: 320, y: 40 },
      { id: 3, x: 200, y: 160 }, { id: 4, x: 320, y: 160 }, { id: 5, x: 420, y: 100 }
    ],
    adj: { 0: [1, 3], 1: [0, 2, 4], 2: [1, 5], 3: [0, 4], 4: [1, 3, 5], 5: [2, 4] }
  };

  function graphSvgShell() {
    var g = GRAPH, s = '<svg viewBox="0 0 500 210" xmlns="http://www.w3.org/2000/svg">';
    Object.keys(g.adj).forEach(function (u) {
      g.adj[u].forEach(function (v) {
        if (+u < v) {
          var a = g.nodes[u], b = g.nodes[v];
          s += '<line class="gedge" data-e="' + u + '-' + v + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
        }
      });
    });
    g.nodes.forEach(function (n) {
      s += '<circle class="gnode" data-n="' + n.id + '" cx="' + n.x + '" cy="' + n.y + '" r="18"/>' +
        txt(n.x, n.y + 5, String(n.id), ' text-anchor="middle" font-size="14" font-weight="600"');
    });
    return s + '</svg>';
  }

  function edgeKey(a, b) { return a < b ? a + '-' + b : b + '-' + a; }

  function paintGraph(holder, o) {
    holder.querySelectorAll('.gnode').forEach(function (c) {
      var id = +c.getAttribute('data-n'), cls = 'gnode';
      if (o.done && o.done[id]) cls += ' done';
      else if (o.cur === id) cls += ' cur';
      else if (o.frontier && o.frontier[id]) cls += ' frontier';
      c.setAttribute('class', cls);
      var t = c.nextElementSibling;
      if (t && t.tagName === 'text') {
        t.setAttribute('fill', (o.done && o.done[id]) ? '#fff' : '#1c1b19');
      }
    });
    holder.querySelectorAll('.gedge').forEach(function (e) {
      var k = e.getAttribute('data-e'), on = o.tree && o.tree[k];
      e.setAttribute('class', 'gedge' + (on ? ' on' : ''));
    });
  }

  function labBFS(box) {
    head(box, 'Обход в ширину (BFS): очередь — сначала ближайшие соседи');
    var holder = el('div', null, graphSvgShell()); box.appendChild(holder);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var stats = el('div', 'sa-stats'); box.appendChild(stats);
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    var S = [], start = 0;
    function build() {
      S = [];
      var q = [start], seen = {}, done = {}, tree = {}, dist = {};
      seen[start] = 1; dist[start] = 0;
      function fr() { var f = {}; q.forEach(function (x) { f[x] = 1; }); return f; }
      S.push({ cur: null, frontier: fr(), done: copy(done), tree: copy(tree),
        msg: 'Старт: в очередь кладём вершину ' + start + '. BFS идёт «волнами»: сначала все на расстоянии 1, потом 2, …',
        queue: q.slice(), note: 'очередь: [' + q.join(', ') + ']' });
      while (q.length) {
        var u = q.shift();
        S.push({ cur: u, frontier: fr(), done: copy(done), tree: copy(tree),
          msg: 'Достаём из головы очереди вершину ' + u + ' (FIFO). Смотрим её соседей.',
          queue: q.slice(), note: 'очередь: [' + q.join(', ') + ']' });
        GRAPH.adj[u].forEach(function (v) {
          if (seen[v]) {
            S.push({ cur: u, frontier: fr(), done: copy(done), tree: copy(tree),
              msg: 'Ребро ' + u + '–' + v + ': вершина ' + v + ' уже встречалась — пропускаем (иначе был бы цикл в дереве обхода).',
              queue: q.slice(), note: 'очередь: [' + q.join(', ') + ']' });
            return;
          }
          seen[v] = 1; dist[v] = dist[u] + 1; tree[edgeKey(u, v)] = 1; q.push(v);
          S.push({ cur: u, frontier: fr(), done: copy(done), tree: copy(tree),
            msg: 'Сосед ' + v + ' новый → в конец очереди. Расстояние от старта: ' + dist[v] + '. Ребро ' + u + '–' + v + ' — в дереве BFS.',
            queue: q.slice(), note: 'очередь: [' + q.join(', ') + ']' });
        });
        done[u] = 1;
        S.push({ cur: null, frontier: fr(), done: copy(done), tree: copy(tree),
          msg: 'Вершина ' + u + ' обработана (все соседи просмотрены).',
          queue: q.slice(), note: 'очередь: [' + q.join(', ') + ']' });
      }
      S.push({ cur: null, frontier: {}, done: copy(done), tree: copy(tree),
        msg: 'Очередь пуста — обход окончен. Оранжевые рёбра — дерево BFS (кратчайшие пути в рёбрах от старта).',
        queue: [], note: 'очередь пуста' });
    }
    function render(p) {
      var o = S[p];
      paintGraph(holder, o);
      msg.textContent = o.msg;
      stats.textContent = 'Шаг ' + p + ' из ' + (S.length - 1) + ' · ' + o.note;
    }
    var sp = stepper(ctr, { count: function () { return S.length; }, render: render, delay: 1600 });
    btn(ctr, 'Старт 0', function () { start = 0; build(); sp.reset(); });
    btn(ctr, 'Старт 3', function () { start = 3; build(); sp.reset(); });
    box.appendChild(el('div', 'sa-legend',
      '<i style="background:#e0a24a"></i>текущая <i style="background:#b9d3c9"></i>в очереди <i style="background:#1f5c4d"></i>обработана <i style="background:#c45c26"></i>ребро дерева BFS'));
    build(); render(0);
  }

  function labDFS(box) {
    head(box, 'Обход в глубину (DFS): стек — уходим по ветке до конца');
    var holder = el('div', null, graphSvgShell()); box.appendChild(holder);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var stats = el('div', 'sa-stats'); box.appendChild(stats);
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    var S = [], start = 0;
    function build() {
      S = [];
      var stack = [start], seen = {}, done = {}, tree = {};
      seen[start] = 1;
      function fr() { var f = {}; stack.forEach(function (x) { f[x] = 1; }); return f; }
      S.push({ cur: null, frontier: fr(), done: copy(done), tree: copy(tree),
        msg: 'Старт: в стек кладём ' + start + '. DFS идёт вглубь: берём вершину с вершины стека (LIFO).',
        note: 'стек (верх справа): [' + stack.join(', ') + ']' });
      while (stack.length) {
        var u = stack[stack.length - 1];
        S.push({ cur: u, frontier: fr(), done: copy(done), tree: copy(tree),
          msg: 'Смотрим вершину стека: ' + u + '. Ищем ещё не посещённого соседа.',
          note: 'стек: [' + stack.join(', ') + ']' });
        var nxt = null;
        for (var i = 0; i < GRAPH.adj[u].length; i++) {
          var v = GRAPH.adj[u][i];
          if (!seen[v]) { nxt = v; break; }
        }
        if (nxt !== null) {
          seen[nxt] = 1; tree[edgeKey(u, nxt)] = 1; stack.push(nxt);
          S.push({ cur: nxt, frontier: fr(), done: copy(done), tree: copy(tree),
            msg: 'Нашли нового соседа ' + nxt + ' → кладём в стек и сразу идём туда (вглубь).',
            note: 'стек: [' + stack.join(', ') + ']' });
        } else {
          stack.pop(); done[u] = 1;
          S.push({ cur: null, frontier: fr(), done: copy(done), tree: copy(tree),
            msg: 'У ' + u + ' новых соседей нет → вынимаем из стека (backtrack), вершина обработана.',
            note: 'стек: [' + stack.join(', ') + ']' });
        }
      }
      S.push({ cur: null, frontier: {}, done: copy(done), tree: copy(tree),
        msg: 'Стек пуст — DFS окончен. Порядок обработки иной, чем у BFS: сначала «длинные» ветки.',
        note: 'стек пуст' });
    }
    function render(p) {
      var o = S[p];
      paintGraph(holder, o);
      msg.textContent = o.msg;
      stats.textContent = 'Шаг ' + p + ' из ' + (S.length - 1) + ' · ' + o.note;
    }
    var sp = stepper(ctr, { count: function () { return S.length; }, render: render, delay: 1600 });
    btn(ctr, 'Старт 0', function () { start = 0; build(); sp.reset(); });
    btn(ctr, 'Старт 2', function () { start = 2; build(); sp.reset(); });
    box.appendChild(el('div', 'sa-legend',
      '<i style="background:#e0a24a"></i>текущая <i style="background:#b9d3c9"></i>в стеке <i style="background:#1f5c4d"></i>обработана <i style="background:#c45c26"></i>ребро дерева DFS'));
    build(); render(0);
  }

  /* ---------- стек vs очередь ---------- */
  function labStackQueue(box) {
    head(box, 'Стек (LIFO) и очередь (FIFO): одно и то же «положить / взять», разный конец');
    var holder = el('div'); box.appendChild(holder);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var stats = el('div', 'sa-stats'); box.appendChild(stats);
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    var ops = [
      { op: 'in', v: 'A', m: 'Кладём A.' },
      { op: 'in', v: 'B', m: 'Кладём B.' },
      { op: 'in', v: 'C', m: 'Кладём C.' },
      { op: 'out', m: 'Забираем один элемент — кто выйдет, зависит от структуры.' },
      { op: 'out', m: 'Забираем ещё один.' },
      { op: 'in', v: 'D', m: 'Кладём D.' },
      { op: 'out', m: 'И снова забираем.' }
    ];
    function run(mode) {
      var arr = [], steps = [];
      function snap(extra) {
        steps.push({ arr: arr.slice(), mode: mode, msg: extra.msg, act: extra.act || '', out: extra.out || '' });
      }
      snap({ msg: mode === 'stack'
        ? 'Стек: кладём и берём с одного конца (верх). Последний вошёл — первый вышел (LIFO).'
        : 'Очередь: кладём в хвост, берём из головы. Первый вошёл — первый вышел (FIFO).' });
      ops.forEach(function (o) {
        if (o.op === 'in') {
          arr.push(o.v);
          snap({ msg: o.m + (mode === 'stack' ? ' На верх стека.' : ' В хвост очереди.'), act: 'in:' + o.v });
        } else {
          var x = mode === 'stack' ? arr.pop() : arr.shift();
          snap({ msg: o.m + ' Вышло: ' + x + '.', act: 'out', out: x });
        }
      });
      snap({ msg: mode === 'stack'
        ? 'Итог порядка выхода при таком сценарии: C, B, D… — типичный LIFO.'
        : 'Итог порядка выхода: A, B, C… — типичный FIFO. Сравни со стеком на тех же операциях.' });
      return steps;
    }
    var mode = 'stack', S = run(mode);
    function draw(p) {
      var o = S[p], isStack = o.mode === 'stack';
      var w = 56, h = 40, n = Math.max(o.arr.length, 1);
      var svg = '<svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg">';
      svg += txt(210, 22, isStack ? 'Стек (верх справа)' : 'Очередь (голова слева, хвост справа)',
        ' text-anchor="middle" font-size="13" font-weight="600"');
      if (!o.arr.length) {
        svg += txt(210, 110, 'пусто', ' text-anchor="middle" font-size="14" fill="#6b665c"');
      } else {
        o.arr.forEach(function (v, i) {
          var x = isStack ? 80 + i * (w + 8) : 80 + i * (w + 8);
          var y = 70;
          var hot = (o.act.indexOf('in:') === 0 && i === o.arr.length - 1) ||
            (o.act === 'out' && false);
          svg += '<rect class="sqcell' + (hot ? ' hot' : '') + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6"/>' +
            txt(x + w / 2, y + 26, v, ' text-anchor="middle" font-size="16" font-weight="600"');
        });
      }
      if (isStack) {
        svg += txt(80 + Math.max(o.arr.length - 1, 0) * (w + 8) + w / 2, 130, '↑ верх', ' text-anchor="middle" font-size="11" fill="#c45c26"');
      } else if (o.arr.length) {
        svg += txt(80 + w / 2, 130, 'голова', ' text-anchor="middle" font-size="11" fill="#c45c26"');
        svg += txt(80 + (o.arr.length - 1) * (w + 8) + w / 2, 130, 'хвост', ' text-anchor="middle" font-size="11" fill="#1f5c4d"');
      }
      if (o.out) svg += txt(210, 170, 'только что вышло: ' + o.out, ' text-anchor="middle" font-size="13" fill="#c45c26" font-weight="600"');
      holder.innerHTML = svg + '</svg>';
      msg.textContent = o.msg;
      stats.textContent = 'Шаг ' + p + ' из ' + (S.length - 1) + ' · содержимое: [' + o.arr.join(', ') + ']';
    }
    var sp = stepper(ctr, { count: function () { return S.length; }, render: draw, delay: 1400 });
    var bStack = btn(ctr, 'Стек LIFO', function () { mode = 'stack'; S = run(mode); sp.reset(); bStack.classList.add('on'); bQueue.classList.remove('on'); });
    var bQueue = btn(ctr, 'Очередь FIFO', function () { mode = 'queue'; S = run(mode); sp.reset(); bQueue.classList.add('on'); bStack.classList.remove('on'); });
    bStack.classList.add('on');
    draw(0);
  }

  /* ---------- ε–N: предел последовательности ---------- */
  function labEpsN(box) {
    head(box, 'Предел последовательности: хвост в ε‑трубе (aₙ = 1/n → 0)');
    var holder = el('div'); box.appendChild(holder);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var stats = el('div', 'sa-stats'); box.appendChild(stats);
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    var eps = 0.25, L = 0;
    function Nof() { return Math.ceil(1 / eps); }
    function build() {
      var N = Nof(), steps = [];
      steps.push({ nShow: 0, msg: 'Хотим: aₙ = 1/n → L = 0. Задай «трубу» ε > 0: все точки с номерами n > N должны лежать в (L − ε, L + ε).', N: N });
      steps.push({ nShow: 0, msg: 'Сейчас ε = ' + eps + '. Нужно |1/n − 0| < ε, то есть 1/n < ε ⇒ n > 1/ε. Берём N = ⌈1/ε⌉ = ' + N + '.', N: N });
      for (var n = 1; n <= N + 4; n++) {
        var inside = n > N;
        steps.push({
          nShow: n, N: N,
          msg: inside
            ? 'n = ' + n + ' > N: aₙ = 1/' + n + ' ≈ ' + (1 / n).toFixed(3) + ' уже внутри трубы. Весь хвост с этого места — «в ε».'
            : 'n = ' + n + ' ≤ N: aₙ = 1/' + n + ' ≈ ' + (1 / n).toFixed(3) + ' ещё может быть снаружи трубы — это не страшно: определение смотрит только на хвост после N.'
        });
      }
      steps.push({ nShow: N + 4, N: N, msg: 'Итог: для этого ε подошёл N = ' + N + '. Чем меньше ε, тем больше N — но для каждого ε свой конечный N.' });
      return steps;
    }
    var S = build();
    function draw(p) {
      var o = S[p], W = 520, H = 160, pad = 40, N = o.N;
      var xMax = Math.max(N + 5, 12);
      function X(n) { return pad + (n / xMax) * (W - 2 * pad); }
      function Y(a) { return H / 2 - a * 180; }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
      svg += '<rect x="' + pad + '" y="' + (Y(eps)) + '" width="' + (W - 2 * pad) + '" height="' + (Y(-eps) - Y(eps)) + '" fill="#e8f1ee" stroke="none"/>';
      svg += '<line x1="' + pad + '" y1="' + Y(0) + '" x2="' + (W - pad) + '" y2="' + Y(0) + '" stroke="#6b665c"/>';
      svg += '<line x1="' + pad + '" y1="' + Y(eps) + '" x2="' + (W - pad) + '" y2="' + Y(eps) + '" stroke="#1f5c4d" stroke-dasharray="4 3"/>';
      svg += '<line x1="' + pad + '" y1="' + Y(-eps) + '" x2="' + (W - pad) + '" y2="' + Y(-eps) + '" stroke="#1f5c4d" stroke-dasharray="4 3"/>';
      svg += txt(W - pad, Y(eps) - 4, '+ε', ' text-anchor="end" font-size="11" fill="#1f5c4d"');
      svg += txt(W - pad, Y(-eps) + 12, '−ε', ' text-anchor="end" font-size="11" fill="#1f5c4d"');
      svg += txt(pad - 6, Y(0) + 4, 'L=0', ' text-anchor="end" font-size="11" fill="#6b665c"');
      if (N) {
        svg += '<line x1="' + X(N) + '" y1="20" x2="' + X(N) + '" y2="' + (H - 16) + '" stroke="#c45c26" stroke-dasharray="3 3"/>';
        svg += txt(X(N), 16, 'N=' + N, ' text-anchor="middle" font-size="11" fill="#c45c26" font-weight="600"');
      }
      for (var n = 1; n <= o.nShow; n++) {
        var a = 1 / n, inside = n > N;
        svg += '<circle cx="' + X(n) + '" cy="' + Y(a) + '" r="5" fill="' + (inside ? '#1f5c4d' : '#e0a24a') + '"/>';
      }
      svg += txt(W / 2, H - 4, 'номер n →', ' text-anchor="middle" font-size="11" fill="#6b665c"');
      holder.innerHTML = svg + '</svg>';
      msg.textContent = o.msg;
      stats.textContent = 'ε = ' + eps + ' · N = ' + N + ' · показаны точки n = 1…' + o.nShow;
    }
    var sp = stepper(ctr, { count: function () { return S.length; }, render: draw, delay: 1500 });
    function setEps(e) { eps = e; S = build(); sp.reset(); }
    btn(ctr, 'ε = 0.5', function () { setEps(0.5); });
    btn(ctr, 'ε = 0.25', function () { setEps(0.25); });
    btn(ctr, 'ε = 0.1', function () { setEps(0.1); });
    box.appendChild(el('div', 'sa-legend',
      '<i style="background:#e0a24a"></i>n ≤ N (ещё не обязаны) <i style="background:#1f5c4d"></i>n > N (хвост в трубе) <i style="background:#e8f1ee"></i>ε‑труба'));
    draw(0);
  }

  /* ---------- индукция: база → шаг ---------- */
  function labInduct(box) {
    head(box, 'Математическая индукция: база, предположение, шаг (сумма 1+…+n)');
    var holder = el('div'); box.appendChild(holder);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var stats = el('div', 'sa-stats'); box.appendChild(stats);
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    var claim = 'P(n): 1 + 2 + … + n = n(n+1)/2';
    var S = [
      { stage: 'goal', msg: 'Утверждение для всех натуральных n: ' + claim + '. Индукция = домино: валим первое и доказываем «если упало k‑е, упадёт (k+1)‑е».' },
      { stage: 'base', msg: 'База n = 1: слева 1, справа 1·2/2 = 1. Совпало — первое домино стоит (упало).' },
      { stage: 'hyp', msg: 'Предположение индукции: пусть для n = k верно P(k), то есть 1+…+k = k(k+1)/2. Этим можно пользоваться.' },
      { stage: 'step', msg: 'Шаг: доказываем P(k+1). Слева 1+…+k+(k+1) = [k(k+1)/2] + (k+1) = (k+1)(k/2 + 1) = (k+1)(k+2)/2 — это как раз правая часть для n = k+1.' },
      { stage: 'done', msg: 'База + шаг ⇒ P(n) для всех n ∈ ℕ. Не проверили «все n вручную» — проверили механизм передачи.' }
    ];
    function draw(p) {
      var o = S[p], stages = ['goal', 'base', 'hyp', 'step', 'done'];
      var labels = {
        goal: 'Цель: P(n) для всех n',
        base: '1. База P(1)',
        hyp: '2. Предположение P(k)',
        step: '3. Шаг P(k) ⇒ P(k+1)',
        done: '4. Вывод'
      };
      var svg = '<svg viewBox="0 0 520 200" xmlns="http://www.w3.org/2000/svg">';
      stages.forEach(function (id, i) {
        var y = 18 + i * 34, on = stages.indexOf(o.stage) >= i, cur = o.stage === id;
        svg += '<rect class="indcell' + (cur ? ' cur' : (on ? ' on' : '')) + '" x="24" y="' + y + '" width="472" height="28" rx="6"/>';
        svg += txt(40, y + 19, labels[id], ' font-size="13"' + (cur ? ' font-weight="700"' : ''));
        if (i < stages.length - 1) {
          svg += '<line x1="40" y1="' + (y + 28) + '" x2="40" y2="' + (y + 34) + '" stroke="#cfc8ba"/>';
        }
      });
      holder.innerHTML = svg + '</svg>';
      msg.textContent = o.msg;
      stats.textContent = 'Шаг ' + (p + 1) + ' из ' + S.length + ' · ' + claim;
    }
    stepper(ctr, { count: function () { return S.length; }, render: draw, delay: 2200 });
    draw(0);
  }

  /* ---------- рекуррентная последовательность: «лестница» xₙ₊₁ = f(xₙ) ---------- */
  var RECUR = {
    cbrt7: { title: 'xₙ₊₁ = ∛(7xₙ), x₁ = ∛7', f: function (x) { return Math.cbrt(7 * x); },
      fs: '∛(7x)', x1: Math.cbrt(7), lo: 0, hi: 3, L: Math.sqrt(7), Ls: '√7', n: 7 },
    heron: { title: 'xₙ₊₁ = (xₙ + 2/xₙ)/2, x₁ = 2', f: function (x) { return (x + 2 / x) / 2; },
      fs: '(x + 2/x)/2', x1: 2, lo: 1, hi: 2.2, L: Math.SQRT2, Ls: '√2', n: 5 },
    sqrt2: { title: 'xₙ₊₁ = √(2 + xₙ), x₁ = 1', f: function (x) { return Math.sqrt(2 + x); },
      fs: '√(2+x)', x1: 1, lo: 0, hi: 2.5, L: 2, Ls: '2', n: 7 },
    half: { title: 'xₙ₊₁ = (xₙ + 2)/2, x₁ = 1', f: function (x) { return (x + 2) / 2; },
      fs: '(x + 2)/2', x1: 1, lo: 0, hi: 2.5, L: 2, Ls: '2', n: 7 },
    p68: { title: 'xₙ₊₁ = 1/(4(1 − xₙ)), x₁ = 0', f: function (x) { return 1 / (4 * (1 - x)); },
      fs: '1/(4(1−x))', x1: 0, lo: 0, hi: 0.6, L: 0.5, Ls: '1/2', n: 8 }
  };
  function sub(n) { return String(n).replace(/\d/g, function (d) { return '₀₁₂₃₄₅₆₇₈₉'[d]; }); }
  function labRecur(box) {
    var key = box.getAttribute('data-preset') || 'cbrt7';
    var title = el('div', 'sa-title'); box.appendChild(title);
    var holder = el('div'); box.appendChild(holder);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var stats = el('div', 'sa-stats'); box.appendChild(stats);
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    var P, S;
    function f4(v) { return v.toFixed(4).replace('.', ','); }
    function build() {
      P = RECUR[key];
      var xs = [P.x1];
      for (var i = 1; i < P.n; i++) xs.push(P.f(xs[i - 1]));
      var steps = [{ k: 0, xs: xs, msg: 'Рисуем график y = ' + P.fs + ' и прямую y = x. Старт: x₁ = ' + f4(P.x1) + ' (оранжевая точка на оси).' }];
      for (var k = 1; k < xs.length; k++) {
        steps.push({ k: k, xs: xs, msg: 'x' + sub(k + 1) + ' = f(x' + sub(k) + ') = ' + f4(xs[k]) +
          ': вертикаль от x' + sub(k) + ' до графика, затем горизонталь до прямой y = x. ' +
          (xs[k] > xs[k - 1] ? 'Член вырос' : 'Член уменьшился') + '; до предела осталось ' + f4(Math.abs(P.L - xs[k])) + '.' });
      }
      steps.push({ k: xs.length - 1, xs: xs, msg: 'Лестница упирается в пересечение графика с прямой y = x. В этой точке x = f(x), поэтому предел L = ' +
        P.Ls + ' ≈ ' + f4(P.L) + ' — корень уравнения L = f(L). Картинка подсказывает ответ, а доказательство — монотонность + ограниченность.' });
      return steps;
    }
    function draw(p) {
      var o = S[p], W = 520, H = 320, pad = 36, lo = P.lo, hi = P.hi, xs = o.xs;
      function X(v) { return pad + (v - lo) / (hi - lo) * (W - 2 * pad); }
      function Y(v) { return H - pad - (v - lo) / (hi - lo) * (H - 2 * pad); }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
      svg += '<line x1="' + X(lo) + '" y1="' + Y(lo) + '" x2="' + X(hi) + '" y2="' + Y(lo) + '" stroke="#6b665c"/>';
      svg += '<line x1="' + X(lo) + '" y1="' + Y(lo) + '" x2="' + X(lo) + '" y2="' + Y(hi) + '" stroke="#6b665c"/>';
      svg += '<line x1="' + X(lo) + '" y1="' + Y(lo) + '" x2="' + X(hi) + '" y2="' + Y(hi) + '" stroke="#9a948a" stroke-dasharray="4 3"/>';
      var pts = [];
      for (var i = 0; i <= 120; i++) {
        var x = lo + (hi - lo) * i / 120, y = P.f(x);
        if (isFinite(y) && y >= lo && y <= hi) pts.push(X(x).toFixed(1) + ',' + Y(y).toFixed(1));
      }
      svg += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#1f5c4d" stroke-width="2.2"/>';
      svg += '<line x1="' + X(P.L) + '" y1="' + Y(lo) + '" x2="' + X(P.L) + '" y2="' + Y(P.L) + '" stroke="#c45c26" stroke-dasharray="3 3"/>';
      svg += txt(X(P.L), Y(lo) + 14, 'L = ' + P.Ls, ' text-anchor="middle" font-size="11" fill="#c45c26" font-weight="600"');
      svg += '<circle cx="' + X(xs[0]) + '" cy="' + Y(lo) + '" r="4.5" fill="#e0a24a"/>';
      svg += txt(X(xs[0]), Y(lo) + 28, 'x₁', ' text-anchor="middle" font-size="11" fill="#6b665c"');
      for (var j = 1; j <= o.k; j++) {
        var a = xs[j - 1], b = xs[j], col = j === o.k ? '#c45c26' : '#8a4b1f';
        svg += '<line x1="' + X(a) + '" y1="' + Y(j === 1 ? lo : a) + '" x2="' + X(a) + '" y2="' + Y(b) + '" stroke="' + col + '" stroke-width="1.6"/>';
        svg += '<line x1="' + X(a) + '" y1="' + Y(b) + '" x2="' + X(b) + '" y2="' + Y(b) + '" stroke="' + col + '" stroke-width="1.6"/>';
        svg += '<circle cx="' + X(b) + '" cy="' + Y(b) + '" r="3.5" fill="' + col + '"/>';
      }
      svg += txt(X(hi) - 4, Y(hi) + 14, 'y = x', ' text-anchor="end" font-size="11" fill="#6b665c"');
      svg += txt(X(lo) + 8, Y(hi) + 12, 'y = ' + P.fs, ' font-size="11" fill="#1f5c4d"');
      holder.innerHTML = svg + '</svg>';
      title.textContent = 'Рекуррентная последовательность «лестницей»: ' + P.title;
      msg.textContent = o.msg;
      stats.textContent = 'Шаг ' + (p + 1) + ' из ' + S.length + ' · построено членов: ' + (o.k + 1);
    }
    S = build();
    var sp = stepper(ctr, { count: function () { return S.length; }, render: draw, delay: 1600 });
    function setKey(k) { key = k; S = build(); sp.reset(); }
    btn(ctr, '∛(7x)', function () { setKey('cbrt7'); });
    btn(ctr, 'Герон, √2', function () { setKey('heron'); });
    btn(ctr, '√(2+x)', function () { setKey('sqrt2'); });
    btn(ctr, '(x+2)/2', function () { setKey('half'); });
    btn(ctr, '1/(4(1−x))', function () { setKey('p68'); });
    box.appendChild(el('div', 'sa-legend',
      '<i style="background:#1f5c4d"></i>график y = f(x) <i style="background:#9a948a"></i>прямая y = x <i style="background:#c45c26"></i>текущий шаг <i style="background:#8a4b1f"></i>прошлые шаги'));
    draw(0);
  }

  /* ---------- деление отрезка пополам (теорема Больцано–Коши о нуле) ---------- */
  var BISECT = {
    sq2: { f: function (x) { return x * x - 2; }, fs: 'x² − 2', a: 0, b: 2, ylo: -2.5, yhi: 2.5, root: '√2' },
    cub: { f: function (x) { return x * x * x - x - 1; }, fs: 'x³ − x − 1', a: 1, b: 2, ylo: -1.5, yhi: 5.5, root: '≈ 1,3247' },
    cos: { f: function (x) { return Math.cos(x) - x; }, fs: 'cos x − x', a: 0, b: 1, ylo: -0.6, yhi: 1.1, root: '≈ 0,7391' }
  };
  function labBisect(box) {
    var key = box.getAttribute('data-preset') || 'sq2';
    var title = el('div', 'sa-title'); box.appendChild(title);
    var holder = el('div'); box.appendChild(holder);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var stats = el('div', 'sa-stats'); box.appendChild(stats);
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    var P, S, N = 7;
    function f4(v) { return v.toFixed(4).replace('.', ','); }
    function sg(v) { return v > 0 ? '+' : v < 0 ? '−' : '0'; }
    function build() {
      P = BISECT[key];
      var a = P.a, b = P.b, steps = [];
      steps.push({ a: a, b: b, n: 1, msg: 'Отрезок [a₁, b₁] = [' + f4(a) + '; ' + f4(b) + ']. На концах знаки разные: f(a₁) = ' +
        f4(P.f(a)) + ' (' + sg(P.f(a)) + '), f(b₁) = ' + f4(P.f(b)) + ' (' + sg(P.f(b)) + '), т.е. f(a₁)·f(b₁) < 0.' });
      for (var n = 1; n <= N; n++) {
        var c = (a + b) / 2, fc = P.f(c);
        steps.push({ a: a, b: b, c: c, n: n, msg: 'Середина c' + sub(n) + ' = (a' + sub(n) + ' + b' + sub(n) + ')/2 = ' + f4(c) +
          ', f(c' + sub(n) + ') = ' + f4(fc) + ' (' + sg(fc) + '). Ноль в середине не попал — смотрим, на какой половине знаки разные.' });
        if (P.f(a) * fc < 0) { b = c; steps.push({ a: a, b: b, n: n + 1, msg: 'f(a' + sub(n) + ')·f(c' + sub(n) + ') < 0 → берём ЛЕВУЮ половину: a' + sub(n + 1) + ' = a' + sub(n) + ', b' + sub(n + 1) + ' = c' + sub(n) + '. Длина стала ' + f4(b - a) + '.' }); }
        else { a = c; steps.push({ a: a, b: b, n: n + 1, msg: 'f(c' + sub(n) + ')·f(b' + sub(n) + ') < 0 → берём ПРАВУЮ половину: a' + sub(n + 1) + ' = c' + sub(n) + ', b' + sub(n + 1) + ' = b' + sub(n) + '. Длина стала ' + f4(b - a) + '.' }); }
      }
      steps.push({ a: a, b: b, n: N + 1, fin: true, msg: 'Отрезки вложены и их длины (b − a)/2ⁿ⁻¹ → 0. По теореме Кантора у них одна общая точка x₀, и aₙ → x₀, bₙ → x₀. ' +
        'Так как f(aₙ)·f(bₙ) < 0 и f непрерывна, в пределе f(x₀)² ≤ 0, т.е. f(x₀) = 0. Здесь x₀ = ' + P.root + '.' });
      return steps;
    }
    function draw(p) {
      var o = S[p], W = 520, H = 300, pad = 34, lo = P.a, hi = P.b;
      function X(v) { return pad + (v - lo) / (hi - lo) * (W - 2 * pad); }
      function Y(v) { return H - pad - (v - P.ylo) / (P.yhi - P.ylo) * (H - 2 * pad); }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
      svg += '<rect x="' + X(o.a) + '" y="' + pad + '" width="' + Math.max(1, X(o.b) - X(o.a)) + '" height="' + (H - 2 * pad) + '" fill="#e0a24a" opacity="0.18"/>';
      svg += '<line x1="' + X(lo) + '" y1="' + Y(0) + '" x2="' + X(hi) + '" y2="' + Y(0) + '" stroke="#6b665c"/>';
      var pts = [];
      for (var i = 0; i <= 160; i++) { var x = lo + (hi - lo) * i / 160; pts.push(X(x).toFixed(1) + ',' + Y(P.f(x)).toFixed(1)); }
      svg += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#1f5c4d" stroke-width="2.2"/>';
      [['a', o.a], ['b', o.b]].forEach(function (q) {
        var fv = P.f(q[1]);
        svg += '<line x1="' + X(q[1]) + '" y1="' + Y(0) + '" x2="' + X(q[1]) + '" y2="' + Y(fv) + '" stroke="#8a4b1f" stroke-dasharray="3 3"/>';
        svg += '<circle cx="' + X(q[1]) + '" cy="' + Y(fv) + '" r="4" fill="' + (fv > 0 ? '#1f5c4d' : '#c45c26') + '"/>';
        if (!o.fin) svg += txt(X(q[1]), Y(0) + 15, q[0] + sub(o.n), ' text-anchor="middle" font-size="11" fill="#6b665c"');
        svg += txt(X(q[1]) + (q[0] === 'a' ? -6 : 6), Y(fv) - 7, sg(fv), ' text-anchor="middle" font-size="13" font-weight="700" fill="' + (fv > 0 ? '#1f5c4d' : '#c45c26') + '"');
      });
      if (o.c != null) {
        var fc = P.f(o.c);
        svg += '<line x1="' + X(o.c) + '" y1="' + Y(0) + '" x2="' + X(o.c) + '" y2="' + Y(fc) + '" stroke="#e0a24a" stroke-width="1.6"/>';
        svg += '<circle cx="' + X(o.c) + '" cy="' + Y(fc) + '" r="4.5" fill="#e0a24a"/>';
        svg += txt(X(o.c), Y(0) - 6, 'c' + sub(o.n), ' text-anchor="middle" font-size="11" font-weight="600" fill="#8a4b1f"');
      }
      if (o.fin) {
        var m = (o.a + o.b) / 2;
        svg += '<circle cx="' + X(m) + '" cy="' + Y(0) + '" r="5" fill="none" stroke="#c45c26" stroke-width="2"/>';
        svg += txt(X(m), Y(0) + 30, 'x₀', ' text-anchor="middle" font-size="12" font-weight="700" fill="#c45c26"');
      }
      svg += txt(X(lo) + 6, pad - 8, 'y = ' + P.fs, ' font-size="11" fill="#1f5c4d"');
      holder.innerHTML = svg + '</svg>';
      title.textContent = 'Деление пополам: ищем ноль f(x) = ' + P.fs + ' на [' + P.a + '; ' + P.b + ']';
      msg.textContent = o.msg;
      stats.textContent = 'Шаг ' + (p + 1) + ' из ' + S.length + ' · текущий отрезок [' + f4(o.a) + '; ' + f4(o.b) + '], длина ' + f4(o.b - o.a);
    }
    S = build();
    var sp = stepper(ctr, { count: function () { return S.length; }, render: draw, delay: 1700 });
    function setKey(k) { key = k; S = build(); sp.reset(); }
    btn(ctr, 'x² − 2', function () { setKey('sq2'); });
    btn(ctr, 'x³ − x − 1', function () { setKey('cub'); });
    btn(ctr, 'cos x − x', function () { setKey('cos'); });
    box.appendChild(el('div', 'sa-legend',
      '<i style="background:#1f5c4d"></i>график, точка «+» <i style="background:#c45c26"></i>точка «−» <i style="background:#e0a24a"></i>середина cₙ и текущий отрезок'));
    draw(0);
  }

  function randDistinct(n, maxV) {
    var pool = [];
    for (var v = 0; v <= maxV; v++) pool.push(v);
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    return pool.slice(0, n);
  }
  function cell(x, y, w, h, fill, label, extra) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="' + fill +
      '" stroke="' + (extra && extra.stroke || '#1f5c4d') + '" stroke-width="' + (extra && extra.sw || 1.5) + '"' +
      (extra && extra.dash ? ' stroke-dasharray="4 3"' : '') + '/>' +
      (label === '' || label == null ? '' : txt(x + w / 2, y + h / 2 + 5, label,
        ' text-anchor="middle" font-size="' + (extra && extra.fs || 14) + '" font-weight="600"' +
        (extra && extra.white ? ' fill="#fff"' : '')));
  }

  /* ---------- двоичная куча (минимум в корне): sift up / sift down, сортировка кучей ---------- */
  function labHeap(box) {
    var mode = box.dataset.mode === 'sort' ? 'sort' : 'ops';
    var OPS = [7, 3, 9, 1, 5, 2, 8], SORT = [9, 4, 7, 1, 8, 2, 6, 3, 5, 0];
    head(box, 'Двоичная куча (минимум в корне): дерево сверху, тот же массив снизу');
    var holder = el('div'); box.appendChild(holder);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var stats = el('div', 'sa-stats'); box.appendChild(stats);
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    box.appendChild(el('div', 'sa-legend',
      '<i style="background:#e0a24a"></i>просеиваемый элемент <i style="background:#b9d3c9"></i>с кем сравниваем ' +
      '<i style="background:#1f5c4d"></i>уже в ответе <i style="background:#c45c26"></i>дуги: дети в массиве (2i+1, 2i+2)'));

    function build(md, input) {
      var a = [], out = [], steps = [], cmp = 0, sw = 0;
      function snap(m, hl) { steps.push({ a: a.slice(), out: out.slice(), msg: m, hl: hl || {}, cmp: cmp, sw: sw }); }
      function one(i, c) { var h = {}; h[i] = c || 'cur'; return h; }
      function siftUp(i) {
        while (i > 0) {
          var p = (i - 1) >> 1, h = one(i);
          h[p] = 'cmp'; cmp++;
          if (a[p] > a[i]) {
            snap('Родитель ' + a[p] + ' (позиция (' + i + '−1)/2 = ' + p + ') больше ' + a[i] +
              ' → свойство кучи нарушено, меняем их местами.', h);
            var t = a[p]; a[p] = a[i]; a[i] = t; sw++; i = p;
            snap(a[i] + ' поднялся на позицию ' + i + '.', one(i));
          } else {
            snap('Родитель ' + a[p] + ' ≤ ' + a[i] + ' → стоп, ' + a[i] + ' на своём месте.', h);
            return;
          }
        }
        snap(a[0] + ' дошёл до корня — теперь это минимум кучи.', one(0));
      }
      function siftDown(i) {
        var n = a.length;
        while (true) {
          var l = 2 * i + 1, r = 2 * i + 2, m = i;
          if (l >= n) {
            snap(a[i] + ' — лист (позиции 2·' + i + '+1 = ' + l + ' уже нет) → стоп.', one(i));
            return;
          }
          var h = one(i);
          h[l] = 'cmp'; if (r < n) h[r] = 'cmp';
          cmp++; if (a[l] < a[m]) m = l;
          if (r < n) { cmp++; if (a[r] < a[m]) m = r; }
          var kids = r < n ? 'дети ' + a[l] + ' и ' + a[r] : 'один ребёнок ' + a[l];
          if (m === i) {
            snap('У ' + a[i] + ' ' + kids + ' — ' + (r < n ? 'оба' : 'он') + ' не меньше → стоп, свойство кучи выполнено.', h);
            return;
          }
          snap('У ' + a[i] + ' ' + kids + '. Меньший ребёнок ' + a[m] + ' < ' + a[i] +
            ' → меняем ' + a[i] + ' с ним (берём именно меньшего, иначе наверху окажется не минимум).', h);
          var t = a[m]; a[m] = a[i]; a[i] = t; sw++; i = m;
        }
      }
      function extract() {
        var mn = a[0], last = a.pop();
        out.push(mn);
        if (!a.length) { snap('Достали ' + mn + ' — куча опустела.'); return; }
        a[0] = last;
        snap('extract_min: корень ' + mn + ' уходит в ответ. На его место ставим последний элемент ' + last +
          ' — форма дерева не испортилась, но порядок нарушен.', one(0));
        siftDown(0);
      }
      if (md === 'ops') {
        snap('Пустая куча. Добавим ' + input.join(', ') + ', потом трижды достанем минимум. Нажми «▶» или «Шаг →».');
        input.forEach(function (x) {
          a.push(x);
          snap('add(' + x + '): кладём в конец массива, позиция ' + (a.length - 1) +
            ' — это следующее свободное место нижнего ряда дерева.', one(a.length - 1));
          siftUp(a.length - 1);
        });
        for (var e = 0; e < 3; e++) extract();
        snap('Итог: минимум всегда в a[0] — посмотреть его O(1). add и extract_min идут по одному пути корень↔лист: O(log n).');
      } else {
        a = input.slice();
        snap('Сортировка кучей. Шаг 1 — сделать из массива кучу «снизу вверх»: просеиваем вниз каждый узел, у которого есть дети, ' +
          'начиная с последнего такого (позиция ' + ((a.length >> 1) - 1) + ') и до корня.');
        for (var i = (a.length >> 1) - 1; i >= 0; i--) {
          snap('Просеиваем вниз ' + a[i] + ' (позиция ' + i + '). Под ним поддеревья уже являются кучами.', one(i));
          siftDown(i);
        }
        snap('Куча построена (это O(n), а не O(n log n) — см. текст). Шаг 2 — n раз достаём минимум в ответ.');
        while (a.length) extract();
        snap('Готово: ответ отсортирован. Сравнений: ' + cmp + ', обменов: ' + sw + '.');
      }
      return steps;
    }

    var S;
    function draw(p) {
      var o = S[p], n = o.a.length, W = 600;
      function pos(i) {
        var d = Math.floor(Math.log2(i + 1)), cnt = Math.pow(2, d);
        return { x: (i - (cnt - 1) + 0.5) * W / cnt, y: 30 + d * 56 };
      }
      var svg = '<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">';
      if (!n) svg += txt(300, 100, 'куча пуста', ' text-anchor="middle" font-size="14" fill="#6b665c"');
      for (var i = 1; i < n; i++) {
        var pa = pos((i - 1) >> 1), ch = pos(i), on = o.hl[i] && o.hl[(i - 1) >> 1];
        svg += '<line class="gedge' + (on ? ' on' : '') + '" x1="' + pa.x + '" y1="' + pa.y + '" x2="' + ch.x + '" y2="' + ch.y + '"/>';
      }
      for (i = 0; i < n; i++) {
        var q = pos(i), c = o.hl[i] === 'cur' ? ' cur' : o.hl[i] === 'cmp' ? ' frontier' : '';
        svg += '<circle class="gnode' + c + '" cx="' + q.x + '" cy="' + q.y + '" r="17"/>' +
          txt(q.x, q.y + 5, o.a[i], ' text-anchor="middle" font-size="14" font-weight="600"') +
          txt(q.x + 21, q.y - 12, i, ' font-size="10" fill="#6b665c"');
      }
      var cw = 44, x0 = 90, y0 = 262;
      svg += txt(x0 - 10, y0 + 27, 'a:', ' text-anchor="end" font-size="13" font-weight="600"');
      for (i = 0; i < n; i++) {
        var f = o.hl[i] === 'cur' ? '#e0a24a' : o.hl[i] === 'cmp' ? '#b9d3c9' : '#fff';
        svg += cell(x0 + i * (cw + 4), y0, cw, 40, f, o.a[i]) +
          txt(x0 + i * (cw + 4) + cw / 2, y0 - 6, i, ' text-anchor="middle" font-size="10" fill="#6b665c"');
      }
      for (var k in o.hl) {
        if (o.hl[k] !== 'cur') continue;
        var ci = +k;
        [2 * ci + 1, 2 * ci + 2].forEach(function (cc) {
          if (cc >= n) return;
          var xa = x0 + ci * (cw + 4) + cw / 2, xb = x0 + cc * (cw + 4) + cw / 2;
          svg += '<path d="M' + xa + ',' + (y0 + 42) + ' Q' + ((xa + xb) / 2) + ',' + (y0 + 42 + 12 + (xb - xa) / 6) + ' ' + xb + ',' + (y0 + 42) +
            '" fill="none" stroke="#c45c26" stroke-width="1.8"/>';
        });
      }
      if (o.out.length) {
        svg += txt(x0 - 10, 368, 'ответ:', ' text-anchor="end" font-size="13" font-weight="600"');
        o.out.forEach(function (v, j) { svg += cell(x0 + j * (cw + 4), 342, cw, 40, '#1f5c4d', v, { white: true }); });
      }
      holder.innerHTML = svg + '</svg>';
      msg.textContent = o.msg;
      stats.textContent = 'Шаг ' + p + ' из ' + (S.length - 1) + ' · размер кучи: ' + n +
        ' · сравнений: ' + o.cmp + ' · обменов: ' + o.sw;
    }
    var sp = stepper(ctr, { count: function () { return S.length; }, render: draw, delay: 1300 });
    var bOps, bSort;
    function setMode(m, input) {
      mode = m; S = build(m, input || (m === 'ops' ? OPS : SORT)); sp.reset();
      bOps.classList.toggle('on', m === 'ops'); bSort.classList.toggle('on', m === 'sort');
    }
    bOps = btn(ctr, 'add + extract_min', function () { setMode('ops'); });
    bSort = btn(ctr, 'Сортировка кучей', function () { setMode('sort'); });
    btn(ctr, 'Случайные числа', function () { setMode(mode, randDistinct(mode === 'ops' ? 7 : 10, 30)); });
    setMode(mode);
  }

  /* ---------- сортировка подсчётом ---------- */
  function labCountSort(box) {
    head(box, 'Сортировка подсчётом: сравнений нет — считаем, сколько раз встретилось каждое значение');
    var holder = el('div'); box.appendChild(holder);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var stats = el('div', 'sa-stats'); box.appendChild(stats);
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    box.appendChild(el('div', 'sa-legend',
      '<i style="background:#e0a24a"></i>текущая клетка <i style="background:#e8f1ee"></i>cnt[v] &gt; 0 <i style="background:#1f5c4d"></i>выписано в ответ'));
    var A, C, S;
    function build() {
      var cnt = [], out = [], steps = [], ops = 0;
      for (var v = 0; v <= C; v++) cnt.push(0);
      function snap(m, o) {
        var st = { cnt: cnt.slice(), out: out.slice(), msg: m, ai: -1, ci: -1, oi: -1, ops: ops };
        for (var q in o) st[q] = o[q];
        steps.push(st);
      }
      snap('Массив из n = ' + A.length + ' чисел, все от 0 до C = ' + C + '. Заводим cnt[0…' + C + '] из нулей — это O(C).', {});
      A.forEach(function (x, i) {
        cnt[x]++; ops++;
        snap('a[' + i + '] = ' + x + ' → cnt[' + x + ']++ (стало ' + cnt[x] + ').', { ai: i, ci: x });
      });
      snap('Проход по массиву закончен: n шагов. Теперь идём по значениям v = 0…' + C + ' и выписываем v ровно cnt[v] раз.', {});
      for (v = 0; v <= C; v++) {
        ops++;
        if (!cnt[v]) {
          snap('cnt[' + v + '] = 0 → значения ' + v + ' не было, ничего не пишем. Но клетку посмотрели — отсюда слагаемое C.', { ci: v });
          continue;
        }
        for (var j = 0; j < cnt[v]; j++) {
          out.push(v); ops++;
          snap('cnt[' + v + '] = ' + cnt[v] + ' → пишем ' + v + ' (' + (j + 1) + '-й раз из ' + cnt[v] + ').', { ci: v, oi: out.length - 1 });
        }
      }
      snap('Готово: ' + out.join(', ') + '. Ни одного сравнения элементов. Время O(n + C), память O(C).', {});
      return steps;
    }
    function draw(p) {
      var o = S[p], w = 40, gap = 4, x0 = 110;
      var svg = '<svg viewBox="0 0 600 270" xmlns="http://www.w3.org/2000/svg">';
      svg += txt(x0 - 12, 52, 'a:', ' text-anchor="end" font-size="13" font-weight="600"');
      A.forEach(function (v, i) {
        svg += cell(x0 + i * (w + gap), 28, w, 38, i === o.ai ? '#e0a24a' : '#fff', v) +
          txt(x0 + i * (w + gap) + w / 2, 22, i, ' text-anchor="middle" font-size="10" fill="#6b665c"');
      });
      svg += txt(x0 - 12, 142, 'cnt:', ' text-anchor="end" font-size="13" font-weight="600"');
      svg += txt(x0 - 12, 112, 'v =', ' text-anchor="end" font-size="11" fill="#6b665c"');
      o.cnt.forEach(function (c, v) {
        var f = v === o.ci ? '#e0a24a' : c ? '#e8f1ee' : '#fff';
        svg += cell(x0 + v * (w + gap), 118, w, 38, f, c) +
          txt(x0 + v * (w + gap) + w / 2, 112, v, ' text-anchor="middle" font-size="11" fill="#8a4b1f" font-weight="600"');
      });
      svg += txt(x0 - 12, 232, 'ответ:', ' text-anchor="end" font-size="13" font-weight="600"');
      for (var i = 0; i < A.length; i++) {
        var has = i < o.out.length;
        svg += cell(x0 + i * (w + gap), 208, w, 38, has ? (i === o.oi ? '#c45c26' : '#1f5c4d') : '#fff', has ? o.out[i] : '',
          { white: true, dash: !has });
      }
      holder.innerHTML = svg + '</svg>';
      msg.textContent = o.msg;
      stats.textContent = 'Шаг ' + p + ' из ' + (S.length - 1) + ' · элементарных действий: ' + o.ops +
        ' · n + C = ' + (A.length + C + 1) + ' (+ n на выписывание)';
    }
    var sp = stepper(ctr, { count: function () { return S.length; }, render: draw, delay: 1100 });
    function load(a, c) { A = a; C = c; S = build(); sp.reset(); }
    btn(ctr, 'Пример', function () { load([3, 1, 4, 1, 5, 2, 0, 3, 1, 4], 5); });
    btn(ctr, 'Случайный', function () {
      var a = []; for (var i = 0; i < 10; i++) a.push(Math.floor(Math.random() * 8)); load(a, 7);
    });
    btn(ctr, 'Большое C, мало чисел', function () { load([9, 0, 9, 4, 2], 9); });
    load([3, 1, 4, 1, 5, 2, 0, 3, 1, 4], 5);
  }

  /* ---------- бинарный поиск: L = -1, R = n ---------- */
  function labBinSearch(box) {
    var arr = [1, 3, 3, 5, 7, 7, 7, 9, 12, 15], x = 7, mode = 'lower', S;
    head(box, 'Бинарный поиск: L = −1, R = n; слева от ответа нули, справа единицы');
    var holder = el('div'); box.appendChild(holder);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var stats = el('div', 'sa-stats'); box.appendChild(stats);
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    var ctr2 = el('div', 'sa-controls'); ctr2.style.marginTop = '0.35rem'; box.appendChild(ctr2);
    box.appendChild(el('div', 'sa-legend',
      '<i style="background:#1f5c4d"></i>L — последний известный 0 <i style="background:#c45c26"></i>R — первый известный 1 ' +
      '<i style="background:#e0a24a"></i>M — середина <i style="background:#e2ddd2"></i>уже отброшено'));
    function pred(v) { return mode === 'lower' ? (v >= x ? 1 : 0) : (v > x ? 1 : 0); }
    function build() {
      var n = arr.length, L = -1, R = n, steps = [], it = 0;
      var name = (mode === 'lower' ? 'lower_bound(' : 'upper_bound(') + x + ')';
      var cond = mode === 'lower' ? 'a[i] ≥ ' + x : 'a[i] > ' + x;
      steps.push({ L: L, R: R, M: null, it: 0, msg: name + ' ищет первый индекс, где ' + cond +
        '. Под числами — 0/1: выполнено ли условие. L = −1 и R = n — «воображаемые» клетки за краями: там считаем 0 и 1.' });
      while (R - L > 1) {
        var M = (L + R) >> 1, b = pred(arr[M]);
        it++;
        steps.push({ L: L, R: R, M: M, it: it, msg: 'R − L = ' + (R - L) + ' > 1 → M = (' + L + ' + ' + R + ') / 2 = ' + M +
          '. a[' + M + '] = ' + arr[M] + ' → условие ' + (b ? 'выполнено (1).' : 'не выполнено (0).') });
        if (b) R = M; else L = M;
        steps.push({ L: L, R: R, M: null, it: it, msg: b
          ? 'Единица → ответ не правее M: R = ' + M + '. Половина справа отброшена.'
          : 'Ноль → ответ правее M: L = ' + M + '. Половина слева отброшена.' });
      }
      steps.push({ L: L, R: R, M: null, it: it, done: true, msg: 'R − L = 1: L — последний 0, R — первый 1. Ответ ' + name + ' = ' + R +
        (R === n ? ' = n: подходящих элементов нет.' : ' (a[' + R + '] = ' + arr[R] + ').') +
        ' Итераций: ' + it + ', а log₂(n + 1) ≈ ' + Math.log2(n + 1).toFixed(1) + '.' });
      return steps;
    }
    function draw(p) {
      var o = S[p], n = arr.length, w = 42, gap = 4, x0 = 22;
      function cx(i) { return x0 + (i + 1) * (w + gap); }
      var svg = '<svg viewBox="0 0 600 205" xmlns="http://www.w3.org/2000/svg">';
      for (var i = -1; i <= n; i++) {
        var virt = i === -1 || i === n, out = !virt && (i <= o.L || i >= o.R);
        var f = virt ? '#faf9f6' : i === o.M ? '#e0a24a' : out ? '#e2ddd2' : '#fff';
        svg += cell(cx(i), 62, w, 38, f, virt ? '' : arr[i], { dash: virt, stroke: virt ? '#9a948a' : '#1f5c4d' });
        var b = i === -1 ? 0 : i === n ? 1 : pred(arr[i]);
        svg += txt(cx(i) + w / 2, 124, b, ' text-anchor="middle" font-size="14" font-weight="700" fill="' + (b ? '#c45c26' : '#1f5c4d') + '"' +
          (virt ? ' opacity="0.55"' : ''));
        svg += txt(cx(i) + w / 2, 146, i, ' text-anchor="middle" font-size="11" fill="#6b665c"');
      }
      svg += txt(x0 + 2, 128, '0/1', ' font-size="10" fill="#6b665c"');
      function ptr(i, label, color, dy) {
        var xm = cx(i) + w / 2;
        return '<path d="M' + (xm - 7) + ',' + (42 - dy) + ' L' + (xm + 7) + ',' + (42 - dy) + ' L' + xm + ',' + (55 - dy) + ' Z" fill="' + color + '"/>' +
          txt(xm, 36 - dy, label, ' text-anchor="middle" font-size="13" font-weight="700" fill="' + color + '"');
      }
      svg += ptr(o.L, 'L', '#1f5c4d', 0) + ptr(o.R, 'R', '#c45c26', 0);
      if (o.M != null) svg += ptr(o.M, 'M', '#e0a24a', 0);
      if (o.done) svg += txt(300, 185, 'ответ = R = ' + o.R, ' text-anchor="middle" font-size="15" font-weight="700" fill="#c45c26"');
      holder.innerHTML = svg + '</svg>';
      msg.textContent = o.msg;
      stats.textContent = 'Шаг ' + p + ' из ' + (S.length - 1) + ' · L = ' + o.L + ', R = ' + o.R + ' · итераций: ' + o.it;
    }
    var sp = stepper(ctr, { count: function () { return S.length; }, render: draw, delay: 1400 });
    var bL, bU, bx = {};
    function reload() {
      S = build(); sp.reset();
      bL.classList.toggle('on', mode === 'lower'); bU.classList.toggle('on', mode === 'upper');
      for (var k in bx) bx[k].classList.toggle('on', +k === x);
    }
    bL = btn(ctr2, 'lower_bound', function () { mode = 'lower'; reload(); });
    bU = btn(ctr2, 'upper_bound', function () { mode = 'upper'; reload(); });
    [7, 4, 20].forEach(function (v) { bx[v] = btn(ctr2, 'x = ' + v, function () { x = v; reload(); }); });
    reload();
  }

  /* ---------- push_back: удвоение и потенциал ---------- */
  function labVecGrow(box) {
    var N = 17, S;
    head(box, 'push_back в вектор: удвоение ёмкости, реальная и амортизированная стоимость');
    var holder = el('div'); box.appendChild(holder);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var stats = el('div', 'sa-stats'); box.appendChild(stats);
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    box.appendChild(el('div', 'sa-legend',
      '<i style="background:#1f5c4d"></i>живые элементы <i style="background:#e0a24a"></i>скопированы при переезде ' +
      '<i style="background:#c45c26"></i>только что записан <i style="background:#9aa59f"></i>столбик = реальное время tᵢ, пунктир = 3'));
    function build() {
      var size = 0, cap = 1, total = 0, steps = [], costs = [], phi = -1;
      steps.push({ size: 0, cap: 1, copied: 0, total: 0, costs: [], msg: 'Пустой вектор, ёмкость cap = 1. Потенциал φ = 2·size − cap = −1. Нажми «▶».' });
      for (var k = 1; k <= N; k++) {
        var copied = 0, oldCap = cap, before = phi;
        if (size === cap) { copied = size; cap *= 2; }
        size++;
        var t = copied + 1;
        total += t; costs.push(t);
        phi = 2 * size - cap;
        var d = phi - before;
        steps.push({ size: size, cap: cap, copied: copied, total: total, costs: costs.slice(), msg:
          (copied ? 'push_back(' + k + '): места нет (size = cap = ' + oldCap + '). Новый буфер на ' + cap + ', копируем ' + copied +
            ' старых и пишем новый: t = ' + t + '. '
            : 'push_back(' + k + '): место есть, просто пишем: t = 1. ') +
          'φ: ' + before + ' → ' + phi + ', Δφ = ' + d + ', aᵢ = t + Δφ = ' + (t + d) + '.' });
      }
      steps.push({ size: size, cap: cap, copied: 0, total: total, costs: costs.slice(), final: true, msg:
        'Итого ' + N + ' push_back: реальное время ' + total + ' ≤ 3·' + N + ' = ' + (3 * N) + '. В среднем ' + (total / N).toFixed(2) +
        ' на операцию — O(1), хотя отдельные операции стоили до ' + Math.max.apply(null, costs) + '.' });
      return steps;
    }
    function draw(p) {
      var o = S[p], cw = Math.min(34, 560 / o.cap), x0 = 20;
      var svg = '<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">';
      svg += txt(x0, 18, 'буфер: size = ' + o.size + ', cap = ' + o.cap, ' font-size="13" font-weight="600"');
      for (var i = 0; i < o.cap; i++) {
        var live = i < o.size, isNew = !o.final && p > 0 && i === o.size - 1, cop = i < o.copied;
        var f = !live ? '#fff' : isNew ? '#c45c26' : cop ? '#e0a24a' : '#1f5c4d';
        svg += cell(x0 + i * cw, 28, cw - 2, 32, f, live ? i + 1 : '', { dash: !live, fs: cw < 24 ? 10 : 13, white: live && !cop });
      }
      var base = 278, bw = 560 / (N + 1), unit = 9;
      svg += txt(x0, 96, 'реальное время каждой операции tᵢ', ' font-size="12" fill="#6b665c"');
      svg += '<line x1="' + x0 + '" y1="' + base + '" x2="' + (x0 + 560) + '" y2="' + base + '" stroke="#9a948a"/>';
      o.costs.forEach(function (t, j) {
        var h = t * unit, x = x0 + j * bw + 3;
        svg += '<rect x="' + x + '" y="' + (base - h) + '" width="' + (bw - 6) + '" height="' + h + '" rx="3" fill="' +
          (t > 1 ? '#e0a24a' : '#9aa59f') + '"/>' +
          txt(x + (bw - 6) / 2, base - h - 4, t, ' text-anchor="middle" font-size="10"') +
          txt(x + (bw - 6) / 2, base + 14, j + 1, ' text-anchor="middle" font-size="9" fill="#6b665c"');
      });
      svg += '<line x1="' + x0 + '" y1="' + (base - 3 * unit) + '" x2="' + (x0 + 560) + '" y2="' + (base - 3 * unit) +
        '" stroke="#c45c26" stroke-width="1.6" stroke-dasharray="6 4"/>' +
        txt(x0 + 560, base - 3 * unit - 5, 'aᵢ = 3', ' text-anchor="end" font-size="11" fill="#c45c26" font-weight="600"');
      holder.innerHTML = svg + '</svg>';
      msg.textContent = o.msg;
      stats.textContent = 'Шаг ' + p + ' из ' + (S.length - 1) + ' · сумма tᵢ = ' + o.total + ' · 3 · (число push) = ' + 3 * o.costs.length;
    }
    S = build();
    stepper(ctr, { count: function () { return S.length; }, render: draw, delay: 1100 });
    draw(0);
  }

  /* ---------- корневая декомпозиция ---------- */
  function labSqrtDec(box) {
    var base = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3], k = 4, S;
    head(box, 'Корневая декомпозиция: n = 16, блоки по k = √16 = 4, b[j] — сумма блока j');
    var holder = el('div'); box.appendChild(holder);
    var msg = el('div', 'sa-msg'); box.appendChild(msg);
    var stats = el('div', 'sa-stats'); box.appendChild(stats);
    var ctr = el('div', 'sa-controls'); box.appendChild(ctr);
    var ctr2 = el('div', 'sa-controls'); ctr2.style.marginTop = '0.35rem'; box.appendChild(ctr2);
    box.appendChild(el('div', 'sa-legend',
      '<i style="background:#e0a24a"></i>берём сейчас <i style="background:#b9d3c9"></i>уже учтено <i style="background:#fff4e5"></i>отрезок запроса'));
    function build(kind, l, r) {
      var a = base.slice(), b = [], steps = [];
      for (var j = 0; j < base.length / k; j++) b.push(a.slice(j * k, j * k + k).reduce(function (s, v) { return s + v; }, 0));
      function snap(m, o) {
        var st = { a: a.slice(), b: b.slice(), msg: m, cells: {}, blocks: {}, sum: null, ops: 0, l: l, r: r, curCell: -1, curBlock: -1 };
        for (var q in o) st[q] = o[q];
        steps.push(st);
      }
      if (kind === 'query') {
        var s = 0, ops = 0, i = l, cells = {}, blocks = {};
        snap('Запрос sum(' + l + ', ' + r + '). Наивно это ' + (r - l + 1) + ' сложений. Идём слева: неполный блок — по элементам, ' +
          'целый блок — одним b[j], правый хвост — снова по элементам.', {});
        while (i <= r) {
          if (i % k === 0 && i + k - 1 <= r) {
            var jb = i / k;
            s += b[jb]; ops++; blocks[jb] = 1;
            snap('Блок ' + jb + ' (позиции ' + i + '…' + (i + k - 1) + ') целиком внутри → прибавляем b[' + jb + '] = ' + b[jb] +
              ' за один шаг. Сумма = ' + s + '.', { cells: copy(cells), blocks: copy(blocks), sum: s, ops: ops, curBlock: jb });
            i += k;
          } else {
            s += a[i]; ops++; cells[i] = 1;
            snap('Позиция ' + i + ' лежит в блоке ' + Math.floor(i / k) + ', который не входит целиком → прибавляем a[' + i + '] = ' + a[i] +
              '. Сумма = ' + s + '.', { cells: copy(cells), blocks: copy(blocks), sum: s, ops: ops, curCell: i });
            i++;
          }
        }
        snap('Ответ: ' + s + '. Шагов ' + ops + ' вместо ' + (r - l + 1) + '. Хвостов не больше 2(k − 1), целых блоков не больше n/k — ' +
          'при k = √n это O(√n).', { cells: copy(cells), blocks: copy(blocks), sum: s, ops: ops });
      } else {
        var x = r;
        snap('Запрос a[' + l + '] += ' + x + '. Меняются ровно две вещи: сама ячейка и сумма её блока.', { r: l });
        a[l] += x;
        snap('a[' + l + '] = ' + (a[l] - x) + ' + ' + x + ' = ' + a[l] + '.', { curCell: l, ops: 1, r: l });
        var jj = Math.floor(l / k);
        b[jj] += x;
        snap('Номер блока = ' + l + ' / ' + k + ' (нацело) = ' + jj + ': b[' + jj + '] += ' + x + ' → ' + b[jj] + '. Всё за O(1).',
          { curCell: l, curBlock: jj, ops: 2, r: l });
      }
      return steps;
    }
    function draw(p) {
      var o = S[p], w = 32;
      function cx(i) { return 14 + i * (w + 2) + Math.floor(i / k) * 12; }
      var svg = '<svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">';
      for (var j = 0; j < o.b.length; j++) {
        var x1 = cx(j * k), x2 = cx(j * k + k - 1) + w;
        var f = j === o.curBlock ? '#e0a24a' : o.blocks[j] ? '#b9d3c9' : '#e8f1ee';
        svg += cell(x1, 20, x2 - x1, 34, f, 'b[' + j + '] = ' + o.b[j], { fs: 13 });
      }
      for (var i = 0; i < o.a.length; i++) {
        var inQ = i >= o.l && i <= o.r;
        var fc = i === o.curCell ? '#e0a24a' : o.cells[i] ? '#b9d3c9' : inQ ? '#fff4e5' : '#fff';
        svg += cell(cx(i), 92, w, 36, fc, o.a[i], { stroke: inQ ? '#8a4b1f' : '#1f5c4d' }) +
          txt(cx(i) + w / 2, 146, i, ' text-anchor="middle" font-size="10" fill="#6b665c"');
      }
      svg += '<line x1="' + (cx(o.l) + 2) + '" y1="160" x2="' + (cx(o.r) + w - 2) + '" y2="160" stroke="#8a4b1f" stroke-width="2.5"/>' +
        txt((cx(o.l) + cx(o.r) + w) / 2, 178, o.l === o.r ? 'i = ' + o.l : '[' + o.l + ', ' + o.r + ']',
          ' text-anchor="middle" font-size="12" fill="#8a4b1f" font-weight="600"');
      if (o.sum != null) svg += txt(590, 178, 'сумма = ' + o.sum, ' text-anchor="end" font-size="13" font-weight="700" fill="#c45c26"');
      holder.innerHTML = svg + '</svg>';
      msg.textContent = o.msg;
      stats.textContent = 'Шаг ' + p + ' из ' + (S.length - 1) + ' · действий: ' + o.ops;
    }
    var sp = stepper(ctr, { count: function () { return S.length; }, render: draw, delay: 1300 });
    function load(kind, l, r) { S = build(kind, l, r); sp.reset(); }
    btn(ctr2, 'sum(2, 13)', function () { load('query', 2, 13); });
    btn(ctr2, 'sum(5, 6)', function () { load('query', 5, 6); });
    btn(ctr2, 'sum(0, 15)', function () { load('query', 0, 15); });
    btn(ctr2, 'a[6] += 4', function () { load('update', 6, 4); });
    load('query', 2, 13);
  }

  var LABS = {
    switches: labSwitches, gates: labGates, fulladder: labFullAdder, ripple: labRipple,
    rs: labRS, vn: labVN, timeline: labTimeline,
    bfs: labBFS, dfs: labDFS, stackqueue: labStackQueue, epsn: labEpsN, induct: labInduct,
    recur: labRecur, bisect: labBisect, heap: labHeap, countsort: labCountSort, binsearch: labBinSearch,
    vecgrow: labVecGrow, sqrtdec: labSqrtDec
  };
  var Viz = window.Viz;
  var api = {
    gate: gate, wire: wire, txt: txt, dot: dot, lamp: lamp, paint: paint, el: el, btn: btn,
    bitButtons: bitButtons, stepper: stepper, head: head, sw: sw, ground: ground
  };
  for (var k in api) Viz[k] = api[k];
  Viz.labs = LABS;

  function boot() {
    var extra = window.VizLabs || {};
    for (var n in extra) LABS[n] = extra[n];
    document.querySelectorAll('.sort-anim').forEach(Viz.sortInit);
    document.querySelectorAll('.lab[data-lab]').forEach(function (b) {
      var f = LABS[b.getAttribute('data-lab')];
      if (f) f(b, Viz);
      else b.textContent = 'Нет виджета «' + b.getAttribute('data-lab') + '» в _viz/viz.js';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
