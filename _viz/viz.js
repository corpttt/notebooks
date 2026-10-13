/*
 * UCHEBA notebook visuals — shared widgets (no dependencies, works offline).
 *
 * Include in a notebook <head>:
 *   <link rel="stylesheet" href="../_viz/viz.css">
 *   <script src="../_viz/viz.js" defer></script>
 *
 * Built-in widgets (markup only, no JS in the notebook):
 *   <div class="sort-anim" data-algo="quick|merge" data-title="…"
 *        data-items="5,2,8" | "Анна:4,Борис:5" data-presets="random,sorted"></div>
 *   <div class="lab" data-lab="switches|gates|fulladder|ripple|rs|vn|timeline|bfs|dfs|stackqueue|epsn|induct"></div>
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

  function classFor(st, k, algo) {
    if (st.all) return 'done';
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
      : '<i style="background:#1f5c4d"></i>уже слито<i style="background:#7fb8a4"></i>левая половина<i style="background:#e7c7a0"></i>правая половина';

    function btn(text, fn) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = text;
      b.addEventListener('click', fn); ctr.appendChild(b); return b;
    }
    var steps, pos, timer = null, els, n, maxV, minV, playBtn;

    function load(items) {
      stop();
      steps = algo === 'quick' ? quickSteps(items) : mergeSteps(items);
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
      if (algo === 'quick' && n > 3) {
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

  var LABS = {
    switches: labSwitches, gates: labGates, fulladder: labFullAdder, ripple: labRipple,
    rs: labRS, vn: labVN, timeline: labTimeline,
    bfs: labBFS, dfs: labDFS, stackqueue: labStackQueue, epsn: labEpsN, induct: labInduct
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
