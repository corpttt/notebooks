/*
 * Matan exam tickets — VizLabs extras (nested intervals, ε–δ, derivative, MVT, Taylor, BW).
 * Load with viz.js (defer). Boot merges window.VizLabs into LABS.
 */
(function () {
  var Labs = (window.VizLabs = window.VizLabs || {});

  function txt(x, y, s, extra) {
    return '<text x="' + x + '" y="' + y + '"' + (extra || '') + '>' + s + '</text>';
  }
  function mount(box, V, title) {
    V.head(box, title);
    var holder = V.el('div');
    var msg = V.el('div', 'sa-msg');
    var stats = V.el('div', 'sa-stats');
    var ctr = V.el('div', 'sa-controls');
    box.appendChild(holder); box.appendChild(msg); box.appendChild(stats); box.appendChild(ctr);
    return { holder: holder, msg: msg, stats: stats, ctr: ctr };
  }
  function legend(box, html) {
    box.appendChild(Object.assign(document.createElement('div'), { className: 'sa-legend', innerHTML: html }));
  }

  /* ----- вложенные отрезки (Кантор) ----- */
  Labs.nested = function (box, V) {
    var ui = mount(box, V, 'Теорема Кантора: вложенные отрезки, длины → 0');
    var a0 = 0, b0 = 1, N = 7, steps = [];
    var a = a0, b = b0;
    steps.push({ a: a, b: b, n: 0, msg: 'Стартовый отрезок I₀ = [' + a + '; ' + b + ']. Берём вложенную систему: Iₙ₊₁ ⊂ Iₙ, длины → 0.' });
    for (var n = 1; n <= N; n++) {
      var mid = (a + b) / 2;
      /* alternate: shrink from left / right a bit asymmetrically */
      if (n % 2) { a = a + (b - a) * 0.15; b = mid + (b - mid) * 0.35; }
      else { a = mid - (mid - a) * 0.4; b = b - (b - a) * 0.12; }
      steps.push({
        a: a, b: b, n: n,
        msg: 'Iₙ = [' + a.toFixed(4) + '; ' + b.toFixed(4) + '], длина ' + (b - a).toFixed(4) +
          '. Отрезки вложены: Iₙ ⊂ Iₙ₋₁. Общая точка — пересечение всех Iₙ.'
      });
    }
    steps.push({
      a: a, b: b, n: N, fin: true,
      msg: 'Длины → 0 ⇒ пересечение ∩ Iₙ — ровно одна точка x₀. Это и есть утверждение теоремы Кантора.'
    });
    function draw(p) {
      var o = steps[p], W = 520, H = 140, pad = 36;
      function X(v) { return pad + (v - a0) / (b0 - a0) * (W - 2 * pad); }
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
      s += '<line x1="' + X(a0) + '" y1="70" x2="' + X(b0) + '" y2="70" stroke="#cfc8ba" stroke-width="2"/>';
      for (var i = 0; i <= o.n; i++) {
        var t = steps[Math.min(i + 1, steps.length - 1)];
        /* show all previous as thin; current thick */
      }
      var y = 70;
      s += '<rect x="' + X(o.a) + '" y="' + (y - 14) + '" width="' + Math.max(2, X(o.b) - X(o.a)) +
        '" height="28" rx="4" fill="#e8f1ee" stroke="#1f5c4d" stroke-width="2"/>';
      s += txt(X(o.a), y - 22, 'aₙ', ' text-anchor="middle" font-size="12" fill="#1f5c4d"');
      s += txt(X(o.b), y - 22, 'bₙ', ' text-anchor="middle" font-size="12" fill="#1f5c4d"');
      if (o.fin) {
        var m = (o.a + o.b) / 2;
        s += '<circle cx="' + X(m) + '" cy="' + y + '" r="6" fill="#c45c26"/>';
        s += txt(X(m), y + 28, 'x₀', ' text-anchor="middle" font-size="13" font-weight="700" fill="#c45c26"');
      }
      s += txt(X(a0), H - 10, '0', ' text-anchor="middle" font-size="11" fill="#6b665c"');
      s += txt(X(b0), H - 10, '1', ' text-anchor="middle" font-size="11" fill="#6b665c"');
      ui.holder.innerHTML = s + '</svg>';
      ui.msg.textContent = o.msg;
      ui.stats.textContent = 'Шаг ' + (p + 1) + '/' + steps.length + ' · длина ' + (o.b - o.a).toFixed(4);
    }
    V.stepper(ui.ctr, { count: function () { return steps.length; }, render: draw, delay: 1400 });
    legend(box, '<i style="background:#e8f1ee;border:1px solid #1f5c4d"></i>текущий Iₙ <i style="background:#c45c26"></i>общая точка x₀');
    draw(0);
  };

  /* ----- Больцано–Вейерштрасс: деление пополам ограниченной последовательности ----- */
  Labs.bw = function (box, V) {
    var ui = mount(box, V, 'Больцано–Вейерштрасс: вложенные половины, сходящаяся подпоследовательность');
    var pts = [0.12, 0.91, 0.33, 0.78, 0.41, 0.62, 0.55, 0.48, 0.71, 0.29, 0.84, 0.18, 0.66, 0.37, 0.52];
    var a = 0, b = 1, steps = [], chosen = [];
    steps.push({ a: a, b: b, pick: -1, msg: 'Ограниченная последовательность на [0; 1]. Делим отрезок пополам и выбираем половину, где бесконечно много членов.' });
    for (var k = 0; k < 6; k++) {
      var mid = (a + b) / 2;
      var left = pts.filter(function (x) { return x >= a && x < mid; }).length;
      var right = pts.filter(function (x) { return x >= mid && x <= b; }).length;
      if (right >= left) a = mid; else b = mid;
      var pick = -1;
      for (var i = 0; i < pts.length; i++) {
        if (pts[i] >= a && pts[i] <= b && chosen.indexOf(i) < 0) { pick = i; chosen.push(i); break; }
      }
      steps.push({
        a: a, b: b, pick: pick,
        msg: 'Шаг ' + (k + 1) + ': остаётся [' + a.toFixed(3) + '; ' + b.toFixed(3) + ']. Берём член подпоследовательности в этой половине' +
          (pick >= 0 ? ' (x ≈ ' + pts[pick].toFixed(2) + ')' : '') + '.'
      });
    }
    steps.push({ a: a, b: b, pick: -1, fin: true, msg: 'Длины половин → 0 ⇒ подпоследовательность сходится к общей точке вложенных отрезков.' });
    function draw(p) {
      var o = steps[p], W = 520, H = 160, pad = 30;
      function X(v) { return pad + v * (W - 2 * pad); }
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
      s += '<rect x="' + X(o.a) + '" y="40" width="' + Math.max(2, X(o.b) - X(o.a)) + '" height="50" fill="#e8f1ee" stroke="#1f5c4d"/>';
      s += '<line x1="' + pad + '" y1="110" x2="' + (W - pad) + '" y2="110" stroke="#6b665c"/>';
      pts.forEach(function (x, i) {
        var inSeg = x >= o.a && x <= o.b;
        s += '<circle cx="' + X(x) + '" cy="110" r="' + (o.pick === i ? 7 : 4) + '" fill="' +
          (o.pick === i ? '#c45c26' : (inSeg ? '#1f5c4d' : '#cfc8ba')) + '"/>';
      });
      ui.holder.innerHTML = s + '</svg>';
      ui.msg.textContent = o.msg;
      ui.stats.textContent = 'Шаг ' + (p + 1) + '/' + steps.length;
    }
    V.stepper(ui.ctr, { count: function () { return steps.length; }, render: draw, delay: 1500 });
    legend(box, '<i style="background:#e8f1ee;border:1px solid #1f5c4d"></i>текущая половина <i style="background:#c45c26"></i>выбранный член подпоследовательности');
    draw(0);
  };

  /* ----- ε–δ для предела функции ----- */
  Labs.epsdelta = function (box, V) {
    var ui = mount(box, V, 'Предел функции: ε–δ (f(x) = 2x → 2 при x → 1)');
    var eps = 0.4, L = 2, a = 1, slope = 2;
    function deltaOf() { return eps / slope; }
    function build() {
      var d = deltaOf(), steps = [];
      steps.push({ show: 0, msg: 'Нужно: ∀ε>0 ∃δ>0 такое, что 0 < |x − a| < δ ⇒ |f(x) − L| < ε. Здесь f(x)=2x, a=1, L=2.' });
      steps.push({ show: 1, msg: '|2x − 2| = 2|x − 1| < ε ⇔ |x − 1| < ε/2. Берём δ = ε/2 = ' + d.toFixed(2) + '.' });
      steps.push({ show: 2, msg: 'Горизонтальная ε-полоса вокруг y=L и вертикальная δ-полоса вокруг x=a: график над δ-проколом лежит в ε-полосе.' });
      steps.push({ show: 3, msg: 'Итог: для данного ε подошла δ = ' + d.toFixed(2) + '. Чем меньше ε, тем меньше δ.' });
      return steps;
    }
    var S = build();
    function draw(p) {
      var o = S[p], d = deltaOf(), W = 520, H = 260, pad = 36;
      var x0 = 0, x1 = 2, y0 = 0, y1 = 4;
      function X(v) { return pad + (v - x0) / (x1 - x0) * (W - 2 * pad); }
      function Y(v) { return H - pad - (v - y0) / (y1 - y0) * (H - 2 * pad); }
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
      if (o.show >= 1) {
        s += '<rect x="' + pad + '" y="' + Y(L + eps) + '" width="' + (W - 2 * pad) + '" height="' + (Y(L - eps) - Y(L + eps)) +
          '" fill="#e8f1ee"/>';
      }
      if (o.show >= 2) {
        s += '<rect x="' + X(a - d) + '" y="' + pad + '" width="' + (X(a + d) - X(a - d)) + '" height="' + (H - 2 * pad) +
          '" fill="#fde3c8" opacity="0.55"/>';
      }
      s += '<line x1="' + pad + '" y1="' + Y(0) + '" x2="' + (W - pad) + '" y2="' + Y(0) + '" stroke="#6b665c"/>';
      s += '<line x1="' + X(0) + '" y1="' + pad + '" x2="' + X(0) + '" y2="' + (H - pad) + '" stroke="#6b665c"/>';
      var pts = [];
      for (var i = 0; i <= 80; i++) {
        var x = x0 + (x1 - x0) * i / 80;
        pts.push(X(x).toFixed(1) + ',' + Y(slope * x).toFixed(1));
      }
      s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#1f5c4d" stroke-width="2.2"/>';
      s += '<circle cx="' + X(a) + '" cy="' + Y(L) + '" r="5" fill="#c45c26"/>';
      s += txt(X(a) + 8, Y(L) - 8, '(a, L)', ' font-size="12" fill="#c45c26"');
      ui.holder.innerHTML = s + '</svg>';
      ui.msg.textContent = o.msg;
      ui.stats.textContent = 'ε = ' + eps + ' · δ = ' + d.toFixed(2);
    }
    var sp = V.stepper(ui.ctr, { count: function () { return S.length; }, render: draw, delay: 1600 });
    function setE(e) { eps = e; S = build(); sp.reset(); }
    V.btn(ui.ctr, 'ε = 0.8', function () { setE(0.8); });
    V.btn(ui.ctr, 'ε = 0.4', function () { setE(0.4); });
    V.btn(ui.ctr, 'ε = 0.2', function () { setE(0.2); });
    legend(box, '<i style="background:#e8f1ee"></i>ε-полоса <i style="background:#fde3c8"></i>δ-окрестность <i style="background:#1f5c4d"></i>график');
    draw(0);
  };

  /* ----- производная = касательная ----- */
  Labs.deriv = function (box, V) {
    var ui = mount(box, V, 'Производная: секущие → касательная (f(x)=x² в x₀=1)');
    var hs = [1.2, 0.8, 0.5, 0.3, 0.15, 0.05];
    var steps = [];
    steps.push({ h: null, msg: 'f′(x₀) = lim_{h→0} (f(x₀+h)−f(x₀))/h. Геометрически: угловой коэффициент касательной.' });
    hs.forEach(function (h) {
      var sec = ((1 + h) * (1 + h) - 1) / h;
      steps.push({
        h: h,
        msg: 'h = ' + h + ': секущая через (1, 1) и (1+h, (1+h)²), наклон = ' + sec.toFixed(3) + ' → к 2 = f′(1).'
      });
    });
    steps.push({ h: 0, msg: 'В пределе секущая становится касательной y = 1 + 2(x − 1).' });
    function draw(p) {
      var o = steps[p], W = 520, H = 260, pad = 36, x0 = -0.2, x1 = 2.4, y0 = -0.2, y1 = 5;
      function X(v) { return pad + (v - x0) / (x1 - x0) * (W - 2 * pad); }
      function Y(v) { return H - pad - (v - y0) / (y1 - y0) * (H - 2 * pad); }
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
      s += '<line x1="' + pad + '" y1="' + Y(0) + '" x2="' + (W - pad) + '" y2="' + Y(0) + '" stroke="#6b665c"/>';
      s += '<line x1="' + X(0) + '" y1="' + pad + '" x2="' + X(0) + '" y2="' + (H - pad) + '" stroke="#6b665c"/>';
      var pts = [];
      for (var i = 0; i <= 100; i++) {
        var x = x0 + (x1 - x0) * i / 100; if (x < 0) continue;
        pts.push(X(x).toFixed(1) + ',' + Y(x * x).toFixed(1));
      }
      s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#1f5c4d" stroke-width="2.2"/>';
      s += '<circle cx="' + X(1) + '" cy="' + Y(1) + '" r="5" fill="#c45c26"/>';
      if (o.h != null && o.h > 0) {
        var x2 = 1 + o.h, y2 = x2 * x2;
        s += '<line x1="' + X(1) + '" y1="' + Y(1) + '" x2="' + X(x2) + '" y2="' + Y(y2) + '" stroke="#e0a24a" stroke-width="2"/>';
        s += '<circle cx="' + X(x2) + '" cy="' + Y(y2) + '" r="4" fill="#e0a24a"/>';
      }
      if (o.h === 0) {
        s += '<line x1="' + X(0.2) + '" y1="' + Y(1 + 2 * (0.2 - 1)) + '" x2="' + X(2.2) + '" y2="' + Y(1 + 2 * (2.2 - 1)) +
          '" stroke="#c45c26" stroke-width="2.2"/>';
      }
      ui.holder.innerHTML = s + '</svg>';
      ui.msg.textContent = o.msg;
      ui.stats.textContent = 'Шаг ' + (p + 1) + '/' + steps.length;
    }
    V.stepper(ui.ctr, { count: function () { return steps.length; }, render: draw, delay: 1400 });
    legend(box, '<i style="background:#1f5c4d"></i>график x² <i style="background:#e0a24a"></i>секущая <i style="background:#c45c26"></i>касательная / точка');
    draw(0);
  };

  /* ----- Лагранж: существует c с f'(c) = наклон хорды ----- */
  Labs.lagrange = function (box, V) {
    var ui = mount(box, V, 'Теорема Лагранжа: касательная || хорде');
    function f(x) { return 0.35 * x * x + 0.2 * x + 0.5; }
    function fp(x) { return 0.7 * x + 0.2; }
    var A = 0.5, B = 3.2, chord = (f(B) - f(A)) / (B - A);
    var c = (chord - 0.2) / 0.7;
    var steps = [
      { stage: 0, msg: 'На [a; b] непрерывна f, на (a; b) дифференцируема. Хорда соединяет (a, f(a)) и (b, f(b)).' },
      { stage: 1, msg: 'Наклон хорды = (f(b)−f(a))/(b−a) = ' + chord.toFixed(3) + '.' },
      { stage: 2, msg: 'Существует c ∈ (a; b), где f′(c) равен этому наклону — касательная параллельна хорде. Здесь c ≈ ' + c.toFixed(3) + '.' }
    ];
    function draw(p) {
      var o = steps[p], W = 520, H = 260, pad = 36, x0 = 0, x1 = 4, y0 = 0, y1 = 5;
      function X(v) { return pad + (v - x0) / (x1 - x0) * (W - 2 * pad); }
      function Y(v) { return H - pad - (v - y0) / (y1 - y0) * (H - 2 * pad); }
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
      var pts = [];
      for (var i = 0; i <= 100; i++) {
        var x = x0 + (x1 - x0) * i / 100;
        pts.push(X(x).toFixed(1) + ',' + Y(f(x)).toFixed(1));
      }
      s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#1f5c4d" stroke-width="2.2"/>';
      if (o.stage >= 0) {
        s += '<line x1="' + X(A) + '" y1="' + Y(f(A)) + '" x2="' + X(B) + '" y2="' + Y(f(B)) +
          '" stroke="#e0a24a" stroke-width="' + (o.stage >= 1 ? 2.4 : 1.5) + '" stroke-dasharray="5 3"/>';
        s += '<circle cx="' + X(A) + '" cy="' + Y(f(A)) + '" r="4" fill="#e0a24a"/>';
        s += '<circle cx="' + X(B) + '" cy="' + Y(f(B)) + '" r="4" fill="#e0a24a"/>';
      }
      if (o.stage >= 2) {
        var len = 1.1;
        s += '<line x1="' + X(c - len) + '" y1="' + Y(f(c) - chord * len) + '" x2="' + X(c + len) + '" y2="' + Y(f(c) + chord * len) +
          '" stroke="#c45c26" stroke-width="2.2"/>';
        s += '<circle cx="' + X(c) + '" cy="' + Y(f(c)) + '" r="5" fill="#c45c26"/>';
        s += txt(X(c), Y(f(c)) - 12, 'c', ' text-anchor="middle" font-size="13" font-weight="700" fill="#c45c26"');
      }
      ui.holder.innerHTML = s + '</svg>';
      ui.msg.textContent = o.msg;
      ui.stats.textContent = 'Шаг ' + (p + 1) + '/' + steps.length + ' · f′(c) = ' + fp(c).toFixed(3);
    }
    V.stepper(ui.ctr, { count: function () { return steps.length; }, render: draw, delay: 1700 });
    legend(box, '<i style="background:#e0a24a"></i>хорда <i style="background:#c45c26"></i>касательная в c');
    draw(0);
  };

  /* ----- Тейлор: полиномы приближают e^x ----- */
  Labs.taylor = function (box, V) {
    var ui = mount(box, V, 'Формула Тейлора: многочлены Тейлора для eˣ');
    function fact(n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }
    function Tn(n, x) {
      var s = 0;
      for (var k = 0; k <= n; k++) s += Math.pow(x, k) / fact(k);
      return s;
    }
    var orders = [0, 1, 2, 3, 5];
    var steps = orders.map(function (n) {
      return { n: n, msg: 'Tₙ(x) = Σ_{k=0}^n xᵏ/k!. Порядок n = ' + n + ': график многочлена всё ближе к eˣ около 0.' };
    });
    steps.push({ n: 5, fin: true, msg: 'Остаток Пеано: eˣ = Tₙ(x) + o(xⁿ) при x→0. На картинке — как растёт точность при росте n.' });
    function draw(p) {
      var o = steps[p], W = 520, H = 260, pad = 36, x0 = -2, x1 = 2.5, y0 = -1, y1 = 8;
      function X(v) { return pad + (v - x0) / (x1 - x0) * (W - 2 * pad); }
      function Y(v) { return H - pad - (v - y0) / (y1 - y0) * (H - 2 * pad); }
      var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">';
      s += '<line x1="' + pad + '" y1="' + Y(0) + '" x2="' + (W - pad) + '" y2="' + Y(0) + '" stroke="#6b665c"/>';
      function poly(fn, stroke, sw) {
        var pts = [];
        for (var i = 0; i <= 120; i++) {
          var x = x0 + (x1 - x0) * i / 120, y = fn(x);
          if (y < y0 || y > y1) { if (pts.length) break; continue; }
          pts.push(X(x).toFixed(1) + ',' + Y(y).toFixed(1));
        }
        s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + stroke + '" stroke-width="' + sw + '"/>';
      }
      poly(function (x) { return Math.exp(x); }, '#1f5c4d', 2.4);
      poly(function (x) { return Tn(o.n, x); }, '#c45c26', 2);
      s += txt(W - pad, pad + 8, 'n = ' + o.n, ' text-anchor="end" font-size="13" font-weight="700" fill="#c45c26"');
      ui.holder.innerHTML = s + '</svg>';
      ui.msg.textContent = o.msg;
      ui.stats.textContent = 'Шаг ' + (p + 1) + '/' + steps.length;
    }
    V.stepper(ui.ctr, { count: function () { return steps.length; }, render: draw, delay: 1400 });
    legend(box, '<i style="background:#1f5c4d"></i>eˣ <i style="background:#c45c26"></i>многочлен Тейлора Tₙ');
    draw(0);
  };
})();
