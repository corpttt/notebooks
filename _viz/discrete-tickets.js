/*
 * Discrete exam tickets — step animations (VizLabs for билеты-осень-2025.html).
 * Load before or with viz.js (defer). Registers window.VizLabs.*; boot merges them.
 */
(function () {
  var Labs = (window.VizLabs = window.VizLabs || {});

  function txt(x, y, s, extra) {
    return '<text x="' + x + '" y="' + y + '"' + (extra || '') + '>' + s + '</text>';
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function mount(box, V, title) {
    V.head(box, title);
    var holder = V.el('div');
    var msg = V.el('div', 'sa-msg');
    var stats = V.el('div', 'sa-stats');
    var ctr = V.el('div', 'sa-controls');
    box.appendChild(holder);
    box.appendChild(msg);
    box.appendChild(stats);
    box.appendChild(ctr);
    return { holder: holder, msg: msg, stats: stats, ctr: ctr };
  }

  function runSteps(ui, V, steps, delay, legend) {
    function render(p) {
      var o = steps[p];
      ui.holder.innerHTML = o.svg;
      ui.msg.textContent = o.msg;
      ui.stats.textContent = 'Шаг ' + p + ' из ' + (steps.length - 1);
    }
    V.stepper(ui.ctr, { count: function () { return steps.length; }, render: render, delay: delay || 1600 });
    if (legend) boxLegend(ui.ctr.parentNode, legend);
    render(0);
  }

  function boxLegend(box, html) {
    box.appendChild(Object.assign(document.createElement('div'), { className: 'sa-legend', innerHTML: html }));
  }

  /* ===== Билет 1: произведение разбиений (матрица) ===== */
  Labs['dm-partprod'] = function (box, V) {
    var ui = mount(box, V, 'Произведение разбиений: сетка блоков P₁ × P₂');
    var A = [1, 2, 3, 4, 5, 6];
    var P1 = [[1, 2], [3, 4, 5], [6]];
    var P2 = [[1, 3, 5], [2, 4], [6]];
    var colors = ['#7fb8a4', '#e0a24a', '#8a9fd4', '#c45c26', '#1f5c4d'];
    function cellSet(i, j) {
      var a = {}, b = {}, out = [];
      P1[i].forEach(function (x) { a[x] = 1; });
      P2[j].forEach(function (x) { b[x] = 1; });
      A.forEach(function (x) { if (a[x] && b[x]) out.push(x); });
      return out;
    }
    function grid(hl, filled) {
      var W = 420, H = 280, ox = 90, oy = 50, cw = 90, ch = 60;
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
      s += txt(210, 20, 'строки = блоки P₁, столбцы = блоки P₂', ' text-anchor="middle" font-size="12" font-weight="600"');
      for (var j = 0; j < 3; j++) {
        s += txt(ox + j * cw + cw / 2, oy - 8, 'B' + (j + 1) + '={' + P2[j].join(',') + '}',
          ' text-anchor="middle" font-size="10" fill="#6b665c"');
      }
      for (var i = 0; i < 3; i++) {
        s += txt(12, oy + i * ch + ch / 2 + 4, 'A' + (i + 1), ' font-size="11" font-weight="600" fill="#1f5c4d"');
        s += txt(12, oy + i * ch + ch / 2 + 18, '{' + P1[i].join(',') + '}', ' font-size="9" fill="#6b665c"');
        for (var j2 = 0; j2 < 3; j2++) {
          var set = cellSet(i, j2);
          var key = i + ',' + j2;
          var on = filled && set.length;
          var hot = hl && hl[0] === i && hl[1] === j2;
          var fill = hot ? '#fde3c8' : (on ? colors[(i * 3 + j2) % colors.length] : '#fff');
          var stroke = hot || on ? '#c45c26' : '#cfc8ba';
          s += '<rect x="' + (ox + j2 * cw) + '" y="' + (oy + i * ch) + '" width="' + (cw - 4) + '" height="' + (ch - 4) +
            '" rx="6" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + (hot ? 2.4 : 1.2) + '"/>';
          s += txt(ox + j2 * cw + cw / 2 - 2, oy + i * ch + ch / 2 + 4,
            set.length ? '{' + set.join(',') + '}' : '∅',
            ' text-anchor="middle" font-size="12" font-weight="600" fill="' + (set.length ? '#1c1b19' : '#9aa59f') + '"');
        }
      }
      return s + '</svg>';
    }
    var steps = [];
    steps.push({ svg: grid(null, false), msg: 'A = {1…6}. P₁ = {A₁,A₂,A₃}, P₂ = {B₁,B₂,B₃}. Сетка: строка × столбец = пересечение блоков.' });
    for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) {
      var set = cellSet(i, j);
      steps.push({
        svg: grid([i, j], false),
        msg: set.length
          ? 'A' + (i + 1) + ' ∩ B' + (j + 1) + ' = {' + set.join(', ') + '} — непусто → блок произведения P₁·P₂.'
          : 'A' + (i + 1) + ' ∩ B' + (j + 1) + ' = ∅ — в произведение не входит.'
      });
    }
    steps.push({
      svg: grid(null, true),
      msg: 'Итог: непустые ячейки — блоки P₁·P₂. Они дизъюнктны и покрывают A (каждый x в ровно одной паре блоков).'
    });
    runSteps(ui, V, steps, 1500,
      '<i style="background:#fde3c8"></i>текущая ячейка <i style="background:#7fb8a4"></i>блок произведения <i style="background:#fff;border:1px solid #cfc8ba"></i>пустое пересечение');
  };

  /* ===== Билет 2: отношение → Хассе ===== */
  Labs['dm-hasse'] = function (box, V) {
    var ui = mount(box, V, 'От ориентированного графа порядка к диаграмме Хассе');
    var nodes = {
      a: { x: 70, y: 160, label: 'a' },
      b: { x: 180, y: 160, label: 'b' },
      c: { x: 125, y: 90, label: 'c' },
      d: { x: 125, y: 30, label: 'd' }
    };
    var levels = {
      a: { x: 80, y: 170 }, b: { x: 200, y: 170 },
      c: { x: 140, y: 95 }, d: { x: 140, y: 25 }
    };
    function draw(pos, edges, loops, msgExtra) {
      var s = '<svg viewBox="0 0 280 210" xmlns="http://www.w3.org/2000/svg">';
      s += '<defs><marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#c45c26"/></marker></defs>';
      edges.forEach(function (e) {
        var u = pos[e[0]], v = pos[e[1]];
        var fade = e[2] === 'gone';
        var tr = e[2] === 'trans';
        s += '<line x1="' + u.x + '" y1="' + u.y + '" x2="' + v.x + '" y2="' + v.y +
          '" stroke="' + (fade ? '#e2ddd2' : (tr ? '#e0a24a' : '#1f5c4d')) +
          '" stroke-width="' + (fade ? 1 : 2.2) + '" stroke-dasharray="' + (fade ? '4 3' : (tr ? '6 3' : '0')) +
          '" marker-end="' + (fade ? 'none' : 'url(#ah)') + '" opacity="' + (fade ? 0.35 : 1) + '"/>';
      });
      (loops || []).forEach(function (id) {
        var p = pos[id];
        s += '<path d="M' + (p.x + 12) + ',' + p.y + ' A14,14 0 1,0 ' + (p.x + 12) + ',' + (p.y - 1) +
          '" fill="none" stroke="#c45c26" stroke-width="1.8" marker-end="url(#ah)"/>';
      });
      Object.keys(pos).forEach(function (id) {
        var p = pos[id];
        s += '<circle class="gnode" cx="' + p.x + '" cy="' + p.y + '" r="16"/>' +
          txt(p.x, p.y + 5, nodes[id].label, ' text-anchor="middle" font-size="14" font-weight="600"');
      });
      return s + '</svg>';
    }
    var allE = [['a', 'c'], ['b', 'c'], ['c', 'd'], ['a', 'd'], ['b', 'd']];
    var steps = [
      { svg: draw(nodes, allE.map(function (e) { return e.concat(['ok']); }), ['a', 'b', 'c', 'd']),
        msg: 'Полный граф нестрогого порядка ≤: петли (рефлексивность) и все сравнимости, включая транзитивные a→d, b→d.' },
      { svg: draw(nodes, allE.map(function (e) { return e.concat(['ok']); }), []),
        msg: 'Удаляем рефлексивные петли x→x — на Хассе их не рисуют.' },
      { svg: draw(nodes, [['a', 'c', 'ok'], ['b', 'c', 'ok'], ['c', 'd', 'ok'], ['a', 'd', 'trans'], ['b', 'd', 'trans']], []),
        msg: 'Помечаем транзитивные рёбра: a→d следует из a→c→d (и то же для b→d).' },
      { svg: draw(nodes, [['a', 'c', 'ok'], ['b', 'c', 'ok'], ['c', 'd', 'ok'], ['a', 'd', 'gone'], ['b', 'd', 'gone']], []),
        msg: 'Удаляем транзитивные рёбра. Остаются только покрытия x ≺̇ y.' },
      { svg: draw(levels, [['a', 'c', 'ok'], ['b', 'c', 'ok'], ['c', 'd', 'ok']], []),
        msg: 'Выравниваем по уровням снизу вверх: минимальные a,b → c → d. Это диаграмма Хассе.' }
    ];
    runSteps(ui, V, steps, 1700,
      '<i style="background:#c45c26"></i>петля/транзитивное <i style="background:#1f5c4d"></i>покрытие <i style="background:#e2ddd2"></i>удалено');
  };

  /* ===== Билет 3: Kahn topo sort ===== */
  Labs['dm-topo'] = function (box, V) {
    var ui = mount(box, V, 'Топологическая сортировка: алгоритм Кана');
    var pos = { A: [60, 40], B: [60, 120], C: [160, 80], D: [260, 40], E: [260, 140] };
    var edges0 = [['A', 'C'], ['B', 'C'], ['C', 'D'], ['C', 'E'], ['A', 'D']];
    function draw(indeg, removed, order, hot, cutEdges) {
      var s = '<svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg">';
      s += '<defs><marker id="tk" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#6b665c"/></marker></defs>';
      edges0.forEach(function (e) {
        if (removed[e[0]] || removed[e[1]]) return;
        var gone = cutEdges && cutEdges[e[0] + e[1]];
        var u = pos[e[0]], v = pos[e[1]];
        s += '<line x1="' + u[0] + '" y1="' + u[1] + '" x2="' + v[0] + '" y2="' + v[1] +
          '" stroke="' + (gone ? '#e2ddd2' : '#cfc8ba') + '" stroke-width="2" marker-end="url(#tk)" opacity="' + (gone ? 0.3 : 1) + '"/>';
      });
      Object.keys(pos).forEach(function (id) {
        if (removed[id]) return;
        var p = pos[id], cls = 'gnode';
        if (hot === id) cls += ' cur';
        else if (indeg[id] === 0) cls += ' frontier';
        s += '<circle class="' + cls + '" cx="' + p[0] + '" cy="' + p[1] + '" r="18"/>' +
          txt(p[0], p[1] + 5, id, ' text-anchor="middle" font-size="13" font-weight="600"') +
          txt(p[0], p[1] + 32, 'in=' + indeg[id], ' text-anchor="middle" font-size="10" fill="#6b665c"');
      });
      s += txt(210, 190, 'порядок: [' + order.join(', ') + ']', ' text-anchor="middle" font-size="13" font-weight="600" fill="#1f5c4d"');
      return s + '</svg>';
    }
    var adj = { A: ['C', 'D'], B: ['C'], C: ['D', 'E'], D: [], E: [] };
    var indeg = { A: 0, B: 0, C: 2, D: 2, E: 1 };
    var steps = [], removed = {}, order = [], cut = {};
    steps.push({ svg: draw(Object.assign({}, indeg), {}, [], null, {}), msg: 'DAG задач. Источники — вершины с входящей степенью 0 (сейчас A и B).' });
    ['A', 'B', 'C', 'D', 'E'].forEach(function () {
      var sources = Object.keys(indeg).filter(function (v) { return !removed[v] && indeg[v] === 0; }).sort();
      if (!sources.length) return;
      var u = sources[0];
      steps.push({ svg: draw(Object.assign({}, indeg), Object.assign({}, removed), order.slice(), u, Object.assign({}, cut)),
        msg: 'Берём источник ' + u + ' (in = 0) и «вытягиваем» влинейный порядок слева направо.' });
      order.push(u);
      removed[u] = 1;
      (adj[u] || []).forEach(function (v) {
        cut[u + v] = 1;
        if (!removed[v]) indeg[v]--;
      });
      steps.push({ svg: draw(Object.assign({}, indeg), Object.assign({}, removed), order.slice(), null, Object.assign({}, cut)),
        msg: 'Удаляем исходящие рёбра из ' + u + '. Обновляем входящие степени соседей. Порядок: [' + order.join(', ') + '].' });
    });
    steps.push({ svg: draw({ A: 0, B: 0, C: 0, D: 0, E: 0 }, { A: 1, B: 1, C: 1, D: 1, E: 1 }, order, null, {}),
      msg: 'Готово: топологическая сортировка [' + order.join(', ') + ']. Любой край u→v идёт слева направо.' });
    runSteps(ui, V, steps, 1500,
      '<i style="background:#b9d3c9"></i>источник (in=0) <i style="background:#e0a24a"></i>берём сейчас');
  };

  /* ===== Билет 4: критический путь / слои ===== */
  Labs['dm-critpath'] = function (box, V) {
    var ui = mount(box, V, 'Поуровневое расписание и критический путь');
    var layers = [
      [{ id: 'a', x: 80 }, { id: 'b', x: 180 }],
      [{ id: 'c', x: 130 }],
      [{ id: 'd', x: 80 }, { id: 'e', x: 180 }],
      [{ id: 'f', x: 130 }]
    ];
    var edges = [['a', 'c'], ['b', 'c'], ['c', 'd'], ['c', 'e'], ['d', 'f'], ['e', 'f']];
    var crit = { 'a|c': 1, 'c|d': 1, 'd|f': 1 };
    var ypos = [40, 90, 140, 190];
    function nodePos(id) {
      for (var i = 0; i < layers.length; i++)
        for (var j = 0; j < layers[i].length; j++)
          if (layers[i][j].id === id) return { x: layers[i][j].x + 40, y: ypos[i] };
      return { x: 0, y: 0 };
    }
    function draw(showLayers, showCrit, activeLayer) {
      var s = '<svg viewBox="0 0 280 230" xmlns="http://www.w3.org/2000/svg">';
      if (showLayers) {
        for (var i = 0; i < 4; i++) {
          var y = ypos[i];
          s += '<line x1="20" y1="' + y + '" x2="260" y2="' + y + '" stroke="#cfc8ba" stroke-dasharray="4 3"/>' +
            txt(8, y + 4, 'S' + (i + 1), ' font-size="10" fill="#6b665c"');
          if (activeLayer === i)
            s += '<rect x="30" y="' + (y - 22) + '" width="220" height="44" rx="8" fill="#e8f1ee" opacity="0.7"/>';
        }
      }
      edges.forEach(function (e) {
        var u = nodePos(e[0]), v = nodePos(e[1]);
        var isC = showCrit && crit[e[0] + '|' + e[1]];
        s += '<line x1="' + u.x + '" y1="' + u.y + '" x2="' + v.x + '" y2="' + v.y +
          '" stroke="' + (isC ? '#c45c26' : '#cfc8ba') + '" stroke-width="' + (isC ? 3.2 : 2) + '"/>';
      });
      layers.forEach(function (L) {
        L.forEach(function (n) {
          var p = nodePos(n.id);
          s += '<circle class="gnode' + (showCrit && 'adf'.indexOf(n.id) >= 0 ? ' cur' : '') + '" cx="' + p.x + '" cy="' + p.y + '" r="15"/>' +
            txt(p.x, p.y + 5, n.id, ' text-anchor="middle" font-size="13" font-weight="600"');
        });
      });
      return s + '</svg>';
    }
    var steps = [
      { svg: draw(false, false, -1), msg: 'DAG задач: каждая вершина — работа на 1 такт, рёбра — зависимости.' },
      { svg: draw(true, false, -1), msg: 'Ранг L(x) = длина самой длинной цепи, оканчивающейся в x. Слои Sⱼ = {x : L(x)=j}.' },
      { svg: draw(true, false, 0), msg: 'Такт 1: параллельно S₁ = {a,b} (антицепь — внутри слоя нет рёбер).' },
      { svg: draw(true, false, 1), msg: 'Такт 2: S₂ = {c}.' },
      { svg: draw(true, false, 2), msg: 'Такт 3: S₃ = {d,e} параллельно.' },
      { svg: draw(true, false, 3), msg: 'Такт 4: S₄ = {f}. Время = h = 4.' },
      { svg: draw(true, true, -1), msg: 'Критический путь a→c→d→f длины h=4: нижняя граница T_min ≥ h, расписание достигает её.' }
    ];
    runSteps(ui, V, steps, 1600,
      '<i style="background:#e8f1ee"></i>текущий такт Sⱼ <i style="background:#c45c26"></i>критический путь');
  };

  /* ===== Билет 5: антицепи / теорема о высоте ===== */
  Labs['dm-antichain'] = function (box, V) {
    var ui = mount(box, V, 'Разбиение poset на h антицепей (теорема о высоте)');
    var nodes = [
      { id: 'a', x: 70, y: 160, L: 1 }, { id: 'b', x: 170, y: 160, L: 1 },
      { id: 'c', x: 120, y: 100, L: 2 },
      { id: 'd', x: 70, y: 45, L: 3 }, { id: 'e', x: 170, y: 45, L: 3 }
    ];
    var edges = [['a', 'c'], ['b', 'c'], ['c', 'd'], ['c', 'e']];
    function draw(cuts, hlLayer) {
      var s = '<svg viewBox="0 0 260 200" xmlns="http://www.w3.org/2000/svg">';
      edges.forEach(function (e) {
        var u = nodes.filter(function (n) { return n.id === e[0]; })[0];
        var v = nodes.filter(function (n) { return n.id === e[1]; })[0];
        s += '<line x1="' + u.x + '" y1="' + u.y + '" x2="' + v.x + '" y2="' + v.y + '" stroke="#1f5c4d" stroke-width="2"/>';
      });
      if (cuts) {
        [130, 70].forEach(function (y, i) {
          s += '<line x1="20" y1="' + y + '" x2="240" y2="' + y + '" stroke="#c45c26" stroke-dasharray="6 4" stroke-width="1.6"/>' +
            txt(248, y + 4, 'разрез', ' font-size="9" fill="#c45c26"');
        });
      }
      nodes.forEach(function (n) {
        var hot = hlLayer === n.L;
        s += '<circle cx="' + n.x + '" cy="' + n.y + '" r="16" fill="' + (hot ? '#fde3c8' : '#fff') +
          '" stroke="' + (hot ? '#c45c26' : '#1f5c4d') + '" stroke-width="' + (hot ? 2.4 : 1.6) + '"/>' +
          txt(n.x, n.y + 5, n.id, ' text-anchor="middle" font-size="13" font-weight="600"');
      });
      return s + '</svg>';
    }
    var steps = [
      { svg: draw(false, 0), msg: 'Диаграмма Хассе. Высота h = длина наибольшей цепи = 3 (например a≺c≺d).' },
      { svg: draw(true, 0), msg: 'Режем горизонтальными пунктирами на h=3 слоя A₁, A₂, A₃ по рангу L(x).' },
      { svg: draw(true, 1), msg: 'A₁ = {a,b}: внутри слоя нет рёбер → антицепь.' },
      { svg: draw(true, 2), msg: 'A₂ = {c}: антицепь из одного элемента.' },
      { svg: draw(true, 3), msg: 'A₃ = {d,e}: снова антицепь. Итого P = A₁ ⊔ A₂ ⊔ A₃, меньше h антицепей нельзя (Дирихле на цепи длины h).' }
    ];
    runSteps(ui, V, steps, 1600,
      '<i style="background:#fde3c8"></i>текущая антицепь Aᵢ <i style="background:#c45c26"></i>горизонтальный разрез');
  };

  /* ===== Билет 6: Patience / LIS ===== */
  Labs['dm-lis'] = function (box, V) {
    var ui = mount(box, V, 'LIS O(n log n): раскладка карт (Patience Sorting)');
    var seq = [3, 1, 4, 2, 5];
    function draw(piles, cur, lo, hi, mid, msgPhase) {
      var s = '<svg viewBox="0 0 440 200" xmlns="http://www.w3.org/2000/svg">';
      s += txt(220, 18, 'последовательность: ' + seq.join(', '), ' text-anchor="middle" font-size="12" font-weight="600"');
      if (cur != null) s += txt(220, 36, 'карта x = ' + cur, ' text-anchor="middle" font-size="12" fill="#c45c26"');
      piles.forEach(function (top, i) {
        var x = 50 + i * 70;
        var hl = mid === i || (lo != null && i >= lo && i <= hi);
        s += '<rect x="' + x + '" y="60" width="54" height="70" rx="8" fill="' + (hl ? '#fde3c8' : '#fff') +
          '" stroke="' + (mid === i ? '#c45c26' : '#1f5c4d') + '" stroke-width="' + (mid === i ? 2.5 : 1.4) + '"/>' +
          txt(x + 27, 100, String(top), ' text-anchor="middle" font-size="18" font-weight="700"') +
          txt(x + 27, 150, 'M[' + (i + 1) + ']', ' text-anchor="middle" font-size="10" fill="#6b665c"');
      });
      if (!piles.length) s += txt(220, 100, 'стопок пока нет', ' text-anchor="middle" font-size="13" fill="#6b665c"');
      if (msgPhase === 'bin') s += txt(220, 180, 'бинарный поиск: lo=' + lo + ', hi=' + hi + (mid != null ? ', mid=' + mid : ''),
        ' text-anchor="middle" font-size="11" fill="#8a4b1f"');
      return s + '</svg>';
    }
    var piles = [], steps = [];
    steps.push({ svg: draw([], null), msg: 'M[len] — минимальный хвост возрастающей подпоследовательности длины len. Стопки = массив M.' });
    seq.forEach(function (x) {
      if (!piles.length || x > piles[piles.length - 1]) {
        steps.push({ svg: draw(piles.slice(), x), msg: 'x = ' + x + (piles.length ? ' > M[k] — новая рекордная длина.' : ' — первая карта, новая стопка.') });
        piles.push(x);
        steps.push({ svg: draw(piles.slice(), x), msg: 'Положили новую стопку. M = [' + piles.join(', ') + '], длина LIS ≥ ' + piles.length + '.' });
      } else {
        var lo = 0, hi = piles.length - 1;
        steps.push({ svg: draw(piles.slice(), x, lo, hi, null, 'bin'), msg: 'x = ' + x + ' ≤ M[k]. Ищем leftmost j с M[j] ≥ x бинарным поиском.' });
        while (lo < hi) {
          var mid = (lo + hi) >> 1;
          steps.push({ svg: draw(piles.slice(), x, lo, hi, mid, 'bin'),
            msg: piles[mid] >= x ? 'M[mid]=' + piles[mid] + ' ≥ ' + x + ' → ищем левее (hi = mid).' : 'M[mid]=' + piles[mid] + ' < ' + x + ' → ищем правее (lo = mid+1).' });
          if (piles[mid] >= x) hi = mid; else lo = mid + 1;
        }
        steps.push({ svg: draw(piles.slice(), x, lo, lo, lo, 'bin'), msg: 'Заменяем M[' + (lo + 1) + '] = ' + piles[lo] + ' на ' + x + ' — улучшаем хвост длины ' + (lo + 1) + '.' });
        piles[lo] = x;
        steps.push({ svg: draw(piles.slice(), x), msg: 'M = [' + piles.join(', ') + '] остаётся строго возрастающим.' });
      }
    });
    steps.push({ svg: draw(piles.slice(), null), msg: 'Готово: число стопок = длина LIS = ' + piles.length + ' (здесь 3, например 1,2,5 или 3,4,5).' });
    runSteps(ui, V, steps, 1400,
      '<i style="background:#fde3c8"></i>диапазон / mid поиска <i style="background:#fff;border:1px solid #1f5c4d"></i>верх стопки M[i]');
  };

  /* ===== Билет 7: Дилуорс ===== */
  Labs['dm-dilworth'] = function (box, V) {
    var ui = mount(box, V, 'Теорема Дилуорса: склейка цепей через антицепь A');
    var nodes = {
      a: [60, 160], b: [140, 160], c: [220, 160],
      p: [60, 90], q: [140, 90], r: [220, 90],
      x: [60, 30], y: [140, 30], z: [220, 30]
    };
    var A = ['p', 'q', 'r'];
    function draw(phase) {
      var s = '<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">';
      var edges = [['a', 'p'], ['b', 'q'], ['c', 'r'], ['p', 'x'], ['q', 'y'], ['r', 'z']];
      edges.forEach(function (e) {
        var u = nodes[e[0]], v = nodes[e[1]];
        var glue = phase >= 3 && A.indexOf(e[0]) >= 0;
        s += '<line x1="' + u[0] + '" y1="' + u[1] + '" x2="' + v[0] + '" y2="' + v[1] +
          '" stroke="' + (glue ? '#c45c26' : '#cfc8ba') + '" stroke-width="' + (glue ? 3 : 2) + '"/>';
      });
      if (phase >= 1) {
        s += '<rect x="20" y="70" width="260" height="40" rx="6" fill="#e8f1ee" opacity="0.5"/>' +
          txt(150, 64, 'A — макс. антицепь', ' text-anchor="middle" font-size="11" fill="#1f5c4d"');
      }
      if (phase >= 2) {
        s += txt(10, 170, 'P⁻', ' font-size="12" font-weight="700" fill="#8a4b1f"');
        s += txt(10, 40, 'P⁺', ' font-size="12" font-weight="700" fill="#8a4b1f"');
      }
      Object.keys(nodes).forEach(function (id) {
        var p = nodes[id], inA = A.indexOf(id) >= 0;
        var fill = inA && phase >= 1 ? '#fde3c8' : '#fff';
        var stroke = inA ? '#c45c26' : '#1f5c4d';
        s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="14" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.8"/>' +
          txt(p[0], p[1] + 4, id, ' text-anchor="middle" font-size="12" font-weight="600"');
      });
      if (phase >= 3) {
        s += txt(150, 195, 'цепи: a–p–x , b–q–y , c–r–z  (w = |A| = 3)', ' text-anchor="middle" font-size="11" fill="#1f5c4d"');
      }
      return s + '</svg>';
    }
    var steps = [
      { svg: draw(0), msg: 'Poset ширины w=3: максимальная антицепь имеет 3 элемента.' },
      { svg: draw(1), msg: 'Выделяем максимальную антицепь A = {p,q,r}.' },
      { svg: draw(2), msg: 'P⁻ = {x ≤ a∈A}, P⁺ = {a ≤ x}. Здесь P⁻ — нижний слой+A, P⁺ — A+верхний.' },
      { svg: draw(3), msg: 'По индукции P⁻ и P⁺ кроются w цепями; склеиваем через элементы A → покрытие P ровно w цепями.' }
    ];
    runSteps(ui, V, steps, 1700,
      '<i style="background:#fde3c8"></i>антицепь A <i style="background:#c45c26"></i>склейка цепей');
  };

  /* ===== Билет 8: код Лемера ===== */
  Labs['dm-lehmer'] = function (box, V) {
    var ui = mount(box, V, 'Код Лемера: подсчёт меньших справа');
    var pi = [3, 1, 4, 2];
    var L = [0, 0, 0, 0];
    function draw(i, mark) {
      var s = '<svg viewBox="0 0 420 160" xmlns="http://www.w3.org/2000/svg">';
      s += txt(210, 22, 'π = (' + pi.join(', ') + ')', ' text-anchor="middle" font-size="13" font-weight="600"');
      pi.forEach(function (v, j) {
        var x = 50 + j * 90;
        var cls = j === i ? '#fde3c8' : (mark && mark[j] ? '#b9d3c9' : '#fff');
        var stroke = j === i ? '#c45c26' : (mark && mark[j] ? '#1f5c4d' : '#cfc8ba');
        s += '<rect x="' + x + '" y="45" width="70" height="50" rx="8" fill="' + cls + '" stroke="' + stroke + '" stroke-width="2"/>' +
          txt(x + 35, 75, String(v), ' text-anchor="middle" font-size="18" font-weight="700"') +
          txt(x + 35, 115, 'поз ' + (j + 1), ' text-anchor="middle" font-size="10" fill="#6b665c"');
      });
      s += txt(210, 145, 'L = (' + L.map(function (x, k) { return k <= i ? x : '?'; }).join(', ') + ')',
        ' text-anchor="middle" font-size="13" font-weight="600" fill="#1f5c4d"');
      return s + '</svg>';
    }
    var steps = [{ svg: draw(-1), msg: 'Для каждого i: lᵢ = |{j > i : πⱼ < πᵢ}| — сколько справа строго меньше текущего.' }];
    for (var i = 0; i < pi.length; i++) {
      var mark = {}, cnt = 0;
      steps.push({ svg: draw(i, mark), msg: 'Смотрим πᵢ = ' + pi[i] + '. Подсвечиваем элементы справа, меньшие ' + pi[i] + '.' });
      for (var j = i + 1; j < pi.length; j++) {
        if (pi[j] < pi[i]) { mark[j] = 1; cnt++; }
      }
      L[i] = cnt;
      steps.push({ svg: draw(i, mark), msg: 'Справа меньше ' + pi[i] + ': ' + cnt + ' шт. → lᵢ = ' + cnt + '.' });
    }
    steps.push({ svg: draw(pi.length, {}), msg: 'Код Лемера L=(2,0,1,0). Index = Σ lᵢ·(n−i)! = 2·3! + 0·2! + 1·1! + 0 = 13.' });
    runSteps(ui, V, steps, 1400,
      '<i style="background:#fde3c8"></i>текущий πᵢ <i style="background:#b9d3c9"></i>справа и меньше');
  };

  /* ===== Билет 10: PIE / Venn ===== */
  Labs['dm-pie'] = function (box, V) {
    var ui = mount(box, V, 'Включения-исключения: тепловая карта пересчёта');
    function venn(mode) {
      // mode: 0 empty, 1 only singles (1x), 2 pairs overcount (2x mid), 3 triple fix
      var s = '<svg viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg">';
      function heat(mult) {
        if (mult <= 0) return '#f4f1ea';
        if (mult === 1) return '#b9d3c9';
        if (mult === 2) return '#e0a24a';
        return '#c45c26';
      }
      var onlyA = mode >= 1 ? 1 : 0, onlyB = mode >= 1 ? 1 : 0, onlyC = mode >= 1 ? 1 : 0;
      var ab = mode === 0 ? 0 : mode === 1 ? 2 : mode === 2 ? 0 : 1;
      var ac = ab, bc = ab, abc = mode === 0 ? 0 : mode === 1 ? 3 : mode === 2 ? 1 : 1;
      // simplified regions as labeled blobs
      s += '<circle cx="130" cy="110" r="70" fill="' + heat(onlyA) + '" fill-opacity="0.55" stroke="#1f5c4d"/>';
      s += '<circle cx="200" cy="110" r="70" fill="' + heat(onlyB) + '" fill-opacity="0.55" stroke="#1f5c4d"/>';
      s += '<circle cx="165" cy="165" r="70" fill="' + heat(onlyC) + '" fill-opacity="0.55" stroke="#1f5c4d"/>';
      if (mode >= 1) {
        s += '<circle cx="165" cy="120" r="28" fill="' + heat(mode === 1 ? 2 : (mode === 2 ? 0 : 1)) +
          '" fill-opacity="0.85" stroke="#c45c26" stroke-width="1.5"/>';
        s += txt(165, 124, mode === 1 ? '2×/3×' : (mode === 2 ? '0×' : '1×'),
          ' text-anchor="middle" font-size="12" font-weight="700"');
      }
      s += txt(90, 70, 'A', ' font-size="14" font-weight="700"');
      s += txt(230, 70, 'B', ' font-size="14" font-weight="700"');
      s += txt(165, 220, 'C', ' text-anchor="middle" font-size="14" font-weight="700"');
      var label = ['ничего не считали', 'Σ|Aᵢ|: пересечения 2× и 3×', 'вычли пары: тройка 0× (перевычли)', 'вернули тройку: всюду ровно 1×'][mode];
      s += txt(180, 20, label, ' text-anchor="middle" font-size="11" font-weight="600" fill="#8a4b1f"');
      return s + '</svg>';
    }
    var steps = [
      { svg: venn(0), msg: 'Три множества A,B,C. Хотим |A∪B∪C| — каждый элемент объединения ровно один раз.' },
      { svg: venn(1), msg: 'Складываем |A|+|B|+|C|: одноэлементные области 1×, попарные 2×, тройное 3×.' },
      { svg: venn(2), msg: 'Вычитаем попарные |A∩B|+… : пары стали 0×? Нет — пары стали 1×, но тройка 3−3=0 (перевычли).' },
      { svg: venn(3), msg: 'Прибавляем |A∩B∩C|: тройка снова 1×. Везде ровно один слой — формула PIE.' }
    ];
    // Fix step 2 message accuracy for pairwise: after adding singles, pairwise are 2x; after subtract pairs, pairwise are 1x, triple is 0x
    steps[2].msg = 'Вычитаем |A∩B|+|A∩C|+|B∩C|: попарные области становятся 1×, тройка 3−3=0 (её вычли трижды).';
    runSteps(ui, V, steps, 1700,
      '<i style="background:#b9d3c9"></i>1× <i style="background:#e0a24a"></i>2× <i style="background:#c45c26"></i>3× пересчёт');
  };

  /* ===== Билет 11: Stirling branching ===== */
  Labs['dm-stirling'] = function (box, V) {
    var ui = mount(box, V, 'Стирлинг: куда деть элемент n');
    function draw(kind, highlight) {
      var s = '<svg viewBox="0 0 440 210" xmlns="http://www.w3.org/2000/svg">';
      s += txt(220, 22, kind === 'II' ? 'Стирлинг II рода S(n,k): разбиения на k блоков' : 'Стирлинг I рода [n k]: перестановки с k циклами',
        ' text-anchor="middle" font-size="12" font-weight="600"');
      s += '<rect x="170" y="40" width="100" height="36" rx="8" fill="#fde3c8" stroke="#c45c26" stroke-width="2"/>' +
        txt(220, 63, 'элемент n', ' text-anchor="middle" font-size="13" font-weight="700"');
      s += '<line x1="220" y1="76" x2="110" y2="120" stroke="#1f5c4d" stroke-width="2"/>';
      s += '<line x1="220" y1="76" x2="330" y2="120" stroke="#1f5c4d" stroke-width="2"/>';
      var leftOn = highlight === 'L', rightOn = highlight === 'R';
      s += '<rect x="40" y="120" width="140" height="70" rx="8" fill="' + (leftOn ? '#e8f1ee' : '#fff') + '" stroke="#1f5c4d" stroke-width="' + (leftOn ? 2.4 : 1.4) + '"/>';
      s += '<rect x="260" y="120" width="140" height="70" rx="8" fill="' + (rightOn ? '#e8f1ee' : '#fff') + '" stroke="#1f5c4d" stroke-width="' + (rightOn ? 2.4 : 1.4) + '"/>';
      if (kind === 'II') {
        s += txt(110, 148, 'новый блок {n}', ' text-anchor="middle" font-size="12" font-weight="600"');
        s += txt(110, 168, 'S(n−1, k−1)', ' text-anchor="middle" font-size="11" fill="#6b665c"');
        s += txt(330, 148, 'в один из k блоков', ' text-anchor="middle" font-size="12" font-weight="600"');
        s += txt(330, 168, 'k · S(n−1, k)', ' text-anchor="middle" font-size="11" fill="#6b665c"');
      } else {
        s += txt(110, 148, 'цикл (n)', ' text-anchor="middle" font-size="12" font-weight="600"');
        s += txt(110, 168, '[n−1 k−1]', ' text-anchor="middle" font-size="11" fill="#6b665c"');
        s += txt(330, 148, 'после любого из n−1', ' text-anchor="middle" font-size="12" font-weight="600"');
        s += txt(330, 168, '(n−1)·[n−1 k]', ' text-anchor="middle" font-size="11" fill="#6b665c"');
      }
      return s + '</svg>';
    }
    var steps = [
      { svg: draw('II', null), msg: 'Фиксируем элемент n. Все разбиения / перестановки делятся на два непересекающихся класса.' },
      { svg: draw('II', 'L'), msg: 'II род, ветка 1: n один в блоке {n} → остальные на k−1 блоков: S(n−1,k−1).' },
      { svg: draw('II', 'R'), msg: 'II род, ветка 2: n подселяется в один из k блоков уже готового разбиения: k·S(n−1,k).' },
      { svg: draw('I', 'L'), msg: 'I род, ветка 1: n образует цикл длины 1 → [n−1 k−1].' },
      { svg: draw('I', 'R'), msg: 'I род, ветка 2: вставить n сразу после любого из n−1 элементов в циклах: (n−1)·[n−1 k].' }
    ];
    runSteps(ui, V, steps, 1600,
      '<i style="background:#e8f1ee"></i>активная ветка <i style="background:#fde3c8"></i>элемент n');
  };

  /* ===== Билет 13: Monty Hall ===== */
  Labs['dm-monty'] = function (box, V) {
    var ui = mount(box, V, 'Монти Холл: перетекание вероятностной массы');
    function frac(p) {
      if (Math.abs(p - 1 / 3) < 1e-9) return '1/3';
      if (Math.abs(p - 2 / 3) < 1e-9) return '2/3';
      if (Math.abs(p) < 1e-9) return '0';
      return String(p);
    }
    function doors(mass, open, pick) {
      var s = '<svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg">';
      for (var i = 0; i < 3; i++) {
        var x = 40 + i * 130;
        var h = Math.max(4, Math.round(mass[i] * 110));
        s += '<rect x="' + x + '" y="40" width="100" height="120" rx="8" fill="#fff" stroke="#1f5c4d" stroke-width="1.6"/>';
        if (open === i) {
          s += '<rect x="' + (x + 8) + '" y="50" width="84" height="100" rx="4" fill="#efece4"/>' +
            txt(x + 50, 105, 'коза', ' text-anchor="middle" font-size="16" font-weight="700" fill="#6b665c"');
        } else {
          s += '<rect x="' + (x + 8) + '" y="' + (152 - h) + '" width="84" height="' + h + '" rx="4" fill="#7fb8a4"/>' +
            txt(x + 50, 110, frac(mass[i]), ' text-anchor="middle" font-size="16" font-weight="700"');
        }
        s += txt(x + 50, 30, 'дверь ' + (i + 1), ' text-anchor="middle" font-size="12" font-weight="600"');
        if (pick === i) s += txt(x + 50, 175, 'ваш выбор', ' text-anchor="middle" font-size="11" fill="#c45c26" font-weight="600"');
      }
      return s + '</svg>';
    }
    var steps = [
      { svg: doors([1 / 3, 1 / 3, 1 / 3], -1, -1), msg: 'Авто равновероятно за любой дверью: по 1/3.' },
      { svg: doors([1 / 3, 1 / 3, 1 / 3], -1, 0), msg: 'Игрок выбирает дверь 1. Масса 1/3 «прилипает» к выбору; 2/3 — на двух других вместе.' },
      { svg: doors([1 / 3, 2 / 3, 0], 2, 0), msg: 'Ведущий открывает козу на двери 3. Масса 2/3 с {2,3} вся стекает на оставшуюся закрытую дверь 2.' },
      { svg: doors([1 / 3, 2 / 3, 0], 2, 0), msg: 'Остаться на 1 → 1/3; сменить на 2 → 2/3. Смена удваивает шанс.' }
    ];
    runSteps(ui, V, steps, 1700,
      '<i style="background:#7fb8a4"></i>вероятностная масса <i style="background:#efece4"></i>открытая коза');
  };

  /* ===== Билет 14: Bayes area model ===== */
  Labs['dm-bayes'] = function (box, V) {
    var ui = mount(box, V, 'Area model: полная вероятность и Байес');
    // H1=0.5, H2=0.3, H3=0.2; P(A|H)=0.8,0.4,0.1
    var widths = [0.5, 0.3, 0.2], heights = [0.8, 0.4, 0.1], labels = ['H₁', 'H₂', 'H₃'];
    function draw(phase) {
      var W = 360, H = 200, ox = 40, oy = 30, bw = 300, bh = 150;
      var s = '<svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg">';
      s += '<rect x="' + ox + '" y="' + oy + '" width="' + bw + '" height="' + bh + '" fill="#faf9f6" stroke="#1c1b19"/>';
      var x = ox;
      for (var i = 0; i < 3; i++) {
        var w = widths[i] * bw, h = heights[i] * bh;
        s += '<rect x="' + x + '" y="' + oy + '" width="' + w + '" height="' + bh + '" fill="none" stroke="#cfc8ba"/>';
        s += txt(x + w / 2, oy + bh + 16, labels[i] + ' (' + widths[i] + ')', ' text-anchor="middle" font-size="11"');
        if (phase >= 1) {
          s += '<rect x="' + x + '" y="' + (oy + bh - h) + '" width="' + w + '" height="' + h +
            '" fill="' + (phase >= 2 && i === 0 ? '#c45c26' : '#7fb8a4') + '" opacity="0.85"/>';
          s += txt(x + w / 2, oy + bh - h / 2 + 4, 'P(A|H)=' + heights[i], ' text-anchor="middle" font-size="10" font-weight="600"');
        }
        x += w;
      }
      if (phase >= 2) {
        s += txt(200, 18, 'P(H₁|A) = площадь H₁∩A / вся закрашенная', ' text-anchor="middle" font-size="11" font-weight="600" fill="#8a4b1f"');
      }
      return s + '</svg>';
    }
    var pA = 0.5 * 0.8 + 0.3 * 0.4 + 0.2 * 0.1;
    var steps = [
      { svg: draw(0), msg: 'Единичный квадрат: вертикальные полосы — гипотезы Hᵢ шириной P(Hᵢ).' },
      { svg: draw(1), msg: 'Закрашиваем снизу долю P(A|Hᵢ). Площадь полосы = P(Hᵢ)P(A|Hᵢ). Сумма = P(A) = ' + pA.toFixed(2) + '.' },
      { svg: draw(2), msg: 'Байес: P(H₁|A) = (0.5·0.8)/' + pA.toFixed(2) + ' = ' + (0.4 / pA).toFixed(2) + ' — доля нужной закрашенной площади.' }
    ];
    runSteps(ui, V, steps, 1700,
      '<i style="background:#7fb8a4"></i>A ∩ Hᵢ <i style="background:#c45c26"></i>интересующая гипотеза');
  };

  /* ===== Билет 16: inverse CDF ===== */
  Labs['dm-inverse'] = function (box, V) {
    var ui = mount(box, V, 'Метод обратной функции: u падает на [0,1)');
    var p = [0.1, 0.35, 0.25, 0.3];
    var S = [0];
    for (var i = 0; i < p.length; i++) S.push(+(S[i] + p[i]).toFixed(2));
    var u = 0.55;
    function draw(showU, hit) {
      var ox = 40, oy = 80, W = 360;
      var s = '<svg viewBox="0 0 440 180" xmlns="http://www.w3.org/2000/svg">';
      s += '<line x1="' + ox + '" y1="' + oy + '" x2="' + (ox + W) + '" y2="' + oy + '" stroke="#1c1b19" stroke-width="2"/>';
      var colors = ['#7fb8a4', '#e0a24a', '#8a9fd4', '#c45c26'];
      for (var i = 0; i < p.length; i++) {
        var x1 = ox + S[i] * W, x2 = ox + S[i + 1] * W;
        var on = hit === i;
        s += '<rect x="' + x1 + '" y="' + (oy - 28) + '" width="' + (x2 - x1) + '" height="28" fill="' + colors[i] +
          '" opacity="' + (on ? 1 : 0.55) + '" stroke="' + (on ? '#1c1b19' : 'none') + '" stroke-width="2"/>';
        s += txt((x1 + x2) / 2, oy - 10, 'x' + (i + 1), ' text-anchor="middle" font-size="11" font-weight="600"');
        s += txt(x1, oy + 16, String(S[i]), ' text-anchor="middle" font-size="10" fill="#6b665c"');
      }
      s += txt(ox + W, oy + 16, '1', ' text-anchor="middle" font-size="10" fill="#6b665c"');
      if (showU) {
        var ux = ox + u * W;
        s += '<circle cx="' + ux + '" cy="' + oy + '" r="6" fill="#c45c26"/>' +
          txt(ux, oy + 36, 'u=' + u, ' text-anchor="middle" font-size="12" font-weight="700" fill="#c45c26"');
      }
      return s + '</svg>';
    }
    var hit = 0;
    for (var k = 0; k < p.length; k++) if (u >= S[k] && u < S[k + 1]) hit = k;
    var steps = [
      { svg: draw(false, -1), msg: 'Отрезок [0,1) режем полуинтервалами длины pₖ: Iₖ = [Sₖ₋₁, Sₖ).' },
      { svg: draw(true, -1), msg: 'Генерируем u ~ U[0,1). Здесь u = ' + u + '.' },
      { svg: draw(true, hit), msg: 'u попал в I' + (hit + 1) + ' → возвращаем x' + (hit + 1) + '. P(попасть) = длина = p' + (hit + 1) + '.' }
    ];
    runSteps(ui, V, steps, 1600,
      '<i style="background:#c45c26"></i>точка u <i style="background:#7fb8a4"></i>интервалы pₖ');
  };

  /* ===== Билет 17: Alias Walker ===== */
  Labs['dm-alias'] = function (box, V) {
    var ui = mount(box, V, 'Alias Вокера: переливание массы до высоты 1');
    // p = [0.1, 0.2, 0.3, 0.4], n=4, q = n*p
    var labels = ['1', '2', '3', '4'];
    function draw(q, small, large, pour) {
      var s = '<svg viewBox="0 0 420 210" xmlns="http://www.w3.org/2000/svg">';
      s += '<line x1="30" y1="50" x2="400" y2="50" stroke="#c45c26" stroke-dasharray="5 3"/>' +
        txt(410, 54, '1', ' font-size="11" fill="#c45c26"');
      q.forEach(function (h, i) {
        var x = 50 + i * 90;
        var pxH = Math.round(h * 100);
        var isS = small.indexOf(i) >= 0, isL = large.indexOf(i) >= 0;
        var fill = pour && pour.from === i ? '#e0a24a' : (pour && pour.to === i ? '#8a9fd4' : (isS ? '#fde3c8' : (isL ? '#b9d3c9' : '#e8f1ee')));
        s += '<rect x="' + x + '" y="' + (150 - pxH) + '" width="60" height="' + pxH + '" fill="' + fill + '" stroke="#1f5c4d"/>' +
          txt(x + 30, 170, labels[i], ' text-anchor="middle" font-size="12" font-weight="600"') +
          txt(x + 30, 150 - pxH - 6, h.toFixed(2), ' text-anchor="middle" font-size="10"');
      });
      if (pour) s += txt(210, 195, 'перелив ' + pour.amt.toFixed(2) + ' из ' + labels[pour.from] + ' → ' + labels[pour.to],
        ' text-anchor="middle" font-size="12" fill="#8a4b1f"');
      return s + '</svg>';
    }
    var q = [0.4, 0.8, 1.2, 1.6];
    var steps = [];
    steps.push({ svg: draw(q.slice(), [], [], null), msg: 'qᵢ = n·pᵢ. Сумма q = n, среднее = 1. Цель — все столбцы высоты ровно 1.' });
    function classify(qq) {
      var S = [], L = [];
      qq.forEach(function (v, i) { if (v < 1 - 1e-9) S.push(i); else if (v > 1 + 1e-9) L.push(i); });
      return { S: S, L: L };
    }
    var c = classify(q);
    steps.push({ svg: draw(q.slice(), c.S, c.L, null), msg: 'Small = {q<1}, Large = {q≥1}. Будем заливать недогруз из избытка.' });
    // simulate a few pours
    var guard = 0;
    while (c.S.length && c.L.length && guard++ < 8) {
      var sIdx = c.S[0], lIdx = c.L[0];
      var need = 1 - q[sIdx];
      steps.push({ svg: draw(q.slice(), c.S, c.L, { from: lIdx, to: sIdx, amt: need }),
        msg: 'Корзина ' + labels[sIdx] + ': Prob=' + q[sIdx].toFixed(2) + ', Alias=' + labels[lIdx] + '. Отливаем ' + need.toFixed(2) + ' из Large.' });
      q[lIdx] -= need;
      q[sIdx] = 1;
      c = classify(q);
      steps.push({ svg: draw(q.slice(), c.S, c.L, null),
        msg: 'Столбец ' + labels[sIdx] + ' закрыт на высоте 1. Обновляем Small/Large.' });
    }
    q = q.map(function () { return 1; });
    steps.push({ svg: draw(q, [], [], null), msg: 'Все n корзин высоты 1. Генерация: выбрать корзину равномерно + бросок по Prob/Alias за O(1).' });
    runSteps(ui, V, steps, 1500,
      '<i style="background:#fde3c8"></i>Small <i style="background:#b9d3c9"></i>Large <i style="background:#e0a24a"></i>источник перелива');
  };

  /* ===== Билет 18: Knuth-Yao tree ===== */
  Labs['dm-knuthyao'] = function (box, V) {
    var ui = mount(box, V, 'Дерево Кнута–Яо: биты и двоичные разряды pᵢ');
    // Simple tree for p=(1/2, 1/4, 1/4) = (0.1, 0.01, 0.01)_2
    function draw(depth, path, leaves) {
      var s = '<svg viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg">';
      var levels = [
        [{ id: 'r', x: 210, y: 30, label: 'старт' }],
        [{ id: '0', x: 110, y: 90, label: '0' }, { id: '1', x: 310, y: 90, label: '1' }],
        [{ id: '00', x: 60, y: 160, label: 'x₁' }, { id: '01', x: 160, y: 160, label: 'x₂' },
         { id: '10', x: 260, y: 160, label: 'x₃' }, { id: '11', x: 360, y: 160, label: '—' }]
      ];
      function find(id) {
        for (var i = 0; i < levels.length; i++)
          for (var j = 0; j < levels[i].length; j++)
            if (levels[i][j].id === id) return levels[i][j];
        return null;
      }
      [['r', '0'], ['r', '1'], ['0', '00'], ['0', '01'], ['1', '10'], ['1', '11']].forEach(function (e) {
        var u = find(e[0]), v = find(e[1]);
        var onPath = path && path.indexOf(e[1]) >= 0;
        s += '<line x1="' + u.x + '" y1="' + u.y + '" x2="' + v.x + '" y2="' + v.y +
          '" stroke="' + (onPath ? '#c45c26' : '#cfc8ba') + '" stroke-width="' + (onPath ? 3 : 1.8) + '"/>';
        s += txt((u.x + v.x) / 2 + (v.x < u.x ? -12 : 12), (u.y + v.y) / 2, e[1].slice(-1),
          ' font-size="11" fill="#6b665c"');
      });
      levels.forEach(function (L, di) {
        if (di > depth) return;
        L.forEach(function (n) {
          var isLeaf = di === 2;
          var lit = leaves && leaves[n.id];
          var dead = n.label === '—';
          s += '<circle cx="' + n.x + '" cy="' + n.y + '" r="16" fill="' +
            (lit ? '#fde3c8' : (dead ? '#efece4' : '#fff')) + '" stroke="' +
            (lit ? '#c45c26' : '#1f5c4d') + '" stroke-width="' + (lit ? 2.4 : 1.5) + '"/>' +
            txt(n.x, n.y + 5, n.label, ' text-anchor="middle" font-size="11" font-weight="600"');
        });
      });
      s += txt(210, 210, 'p₁=1/2 = 0.1₂ · p₂=p₃=1/4 = 0.01₂', ' text-anchor="middle" font-size="11" fill="#8a4b1f"');
      return s + '</svg>';
    }
    var steps = [
      { svg: draw(0, null, null), msg: 'Корень: читаем случайные биты. Ребро влево = 0, вправо = 1.' },
      { svg: draw(1, null, null), msg: 'Уровень k соответствует разряду 2⁻ᵏ в двоичной записи вероятностей.' },
      { svg: draw(2, null, { '00': 1 }), msg: 'Разряд 2⁻¹: бит 1 у p₁ → лист x₁ на пути «0»? Упростим: лист на глубине 1 для массы 1/2.' },
      { svg: draw(2, ['0', '00'], { '00': 1 }), msg: 'На глубине 1 вероятность 1/2 отдаём исходу x₁ (бит 0.1₂).' },
      { svg: draw(2, ['0', '01'], { '01': 1 }), msg: 'На глубине 2: лист x₂ для p₂=2⁻².' },
      { svg: draw(2, ['1', '10'], { '10': 1 }), msg: 'Лист x₃ для p₃=2⁻². Недостижимые листья («—») отбрасываем. Среднее число бит = энтропия.' }
    ];
    // clearer narrative for KY
    steps[2] = { svg: draw(2, null, { '00': 1, '01': 1, '10': 1 }), msg: 'Терминальные листья расставляем по двоичным разрядам pᵢ: где бит = 1, вешаем исход xᵢ.' };
    steps[3] = { svg: draw(2, ['0'], { '00': 1 }), msg: 'Бит B₁=0: идём влево. На этом уровне «срабатывает» масса 1/2 → можно выдать x₁.' };
    steps[4] = { svg: draw(2, ['1', '10'], { '10': 1 }), msg: 'Иначе читаем ещё биты и попадаем в листья x₂ или x₃ с вероятностями 1/4.' };
    steps[5] = { svg: draw(2, null, { '00': 1, '01': 1, '10': 1 }), msg: 'Алгоритм несмещённый: P(лист xᵢ) = pᵢ. Ожидаемое число бит близко к энтропии Шеннона.' };
    runSteps(ui, V, steps, 1600,
      '<i style="background:#fde3c8"></i>терминальный лист <i style="background:#c45c26"></i>путь по битам');
  };
})();
