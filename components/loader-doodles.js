/* =========================================================================
   White Crown Academy — hand-drawn illustrations
   Every <svg data-doodle="…"> and <svg data-icon="…"> on a page is drawn here
   with rough.js. Each drawing is made three times with different random seeds;
   the .boil rules in style.css show one copy at a time, every 500 ms, so the
   lines shimmer like a hand-made stop-motion cartoon.
   ========================================================================= */
export function drawLoaderDoodles(root, rough) {
  'use strict';
  if (!rough) return;

  var NS = 'http://www.w3.org/2000/svg';
  var INK = 'currentColor';
  var TAU = Math.PI * 2;
  var C = {
    charcoal: '#2b2a28', orange: '#f78532', orangeDeep: '#d9661a', orangePale: '#ffe2c9',
    blue: '#137fae', sky: '#5db7e0', skyLight: '#9fd4ef', bluePale: '#d3eaf6', cloudHatch: '#a9d8f0',
    sun: '#ffc93c', sunPale: '#ffe08a', leaf: '#7cc95a', leafDeep: '#5aa83a', grassPale: '#d2efbf',
    grassPale2: '#e2f5d6', grassMid: '#9ed27c', berry: '#f06c95', red: '#e8463c', violet: '#a77ce0',
    bark: '#9a6a3a', sand: '#e9b866', sandPale: '#fbeacb', wood: '#e8c48a', stone: '#b5aea6', white: '#ffffff'
  };

  /* ---------- small helpers ---------- */
  function f1(n) { return Math.round(n * 10) / 10; }
  function pt(p) { return f1(p[0]) + ',' + f1(p[1]); }
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rot(points, cx, cy, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return points.map(function (p) { return [cx + p[0] * c - p[1] * s, cy + p[0] * s + p[1] * c]; });
  }
  // bumpy closed outline (clouds, tree tops): arcs bulging outwards between points on an ellipse
  function blob(cx, cy, rx, ry, n, bulge, rotation) {
    var pts = [];
    for (var k = 0; k < n; k++) {
      var a = rotation + (k / n) * TAU;
      pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
    var d = 'M' + pt(pts[0]);
    for (var j = 1; j <= n; j++) {
      var p = pts[j % n], q = pts[j - 1];
      var r = f1(Math.hypot(p[0] - q[0], p[1] - q[1]) * bulge);
      d += ' A' + r + ',' + r + ' 0 0 1 ' + pt(p);
    }
    return d + ' Z';
  }
  // smooth curve through points (Catmull-Rom converted to cubic Béziers), without the leading M
  function curveThrough(pts) {
    var d = '';
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ' C' + pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]) +
           ' ' + pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]) +
           ' ' + pt(p2);
    }
    return d;
  }
  function smooth(pts) { return 'M' + pt(pts[0]) + curveThrough(pts); }
  // rising loop-the-loop line (a prolate cycloid on its side)
  function loopPath(x0, y0, r, d, turns, drift) {
    var steps = 90, t0 = Math.PI / 2, T = turns * TAU;
    var a0 = r * t0 - d * Math.sin(t0), l0 = d * Math.cos(t0), s = '';
    for (var k = 0; k <= steps; k++) {
      var t = t0 + (k / steps) * T;
      var along = r * t - d * Math.sin(t) - a0, lat = d * Math.cos(t) - l0;
      s += (k ? ' L' : 'M') + pt([x0 + lat + drift * along, y0 - along]);
    }
    return s;
  }
  function starPoints(cx, cy, R, r, n) {
    var pts = [];
    for (var k = 0; k < n * 2; k++) {
      var a = -Math.PI / 2 + (k * Math.PI) / n, rr = k % 2 ? r : R;
      pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
    return pts;
  }
  function sparkle(x, y, s) {
    var t = s * 0.28;
    return 'M' + x + ',' + (y - s) + ' L' + (x + t) + ',' + (y - t) + ' L' + (x + s) + ',' + y + ' L' + (x + t) + ',' + (y + t) +
      ' L' + x + ',' + (y + s) + ' L' + (x - t) + ',' + (y + t) + ' L' + (x - s) + ',' + y + ' L' + (x - t) + ',' + (y - t) + ' Z';
  }
  function nonScaling(root) {
    root.querySelectorAll('path').forEach(function (p) { p.setAttribute('vector-effect', 'non-scaling-stroke'); });
  }

  /* ---------- the stop-motion engine ----------
     draw() is called once per frame with: rc (rough canvas), i (frame index),
     o(opts) (options with this frame's seed), put(node), plain(tag, attrs). */
  var seedBase = 7;
  function boil(svg, parent, draw, frames) {
    frames = frames || 3;
    var rc = rough.svg(svg);
    var wrap = el('g', frames > 1 ? { 'class': 'boil' } : null, parent);
    var base = (seedBase += 41);
    for (var i = 0; i < frames; i++) {
      var g = frames > 1 ? el('g', null, wrap) : wrap;
      (function (g, i) {
        draw({
          rc: rc, i: i, g: g,
          o: function (x) {
            return Object.assign({ seed: base + i * 1013, stroke: INK, strokeWidth: 2.4, roughness: 1.3, bowing: 1 }, x || {});
          },
          put: function (node) { g.appendChild(node); return node; },
          plain: function (tag, attrs) { return el(tag, attrs, g); }
        });
      })(g, i);
    }
    return wrap;
  }

  /* =======================================================================
     ICONS — all drawn in a 100 × 100 box
     ======================================================================= */
  var ICONS = {
    ball: function (a) {
      a.plain('circle', { cx: 50, cy: 52, r: 35, fill: C.white });
      a.put(a.rc.path('M50,17 A35,35 0 0 0 50,87 C34,70 34,35 50,17 Z', a.o({ fill: C.orange, hachureGap: 4, fillWeight: 2, stroke: 'none' })));
      a.put(a.rc.path('M50,17 A35,35 0 0 1 50,87 C66,70 66,35 50,17 Z', a.o({ fill: C.sky, hachureGap: 4, fillWeight: 2, stroke: 'none' })));
      a.put(a.rc.circle(50, 52, 70, a.o({ strokeWidth: 2.6 })));
      a.put(a.rc.path('M50,17 C34,35 34,70 50,87', a.o({ strokeWidth: 2 })));
      a.put(a.rc.path('M50,17 C66,35 66,70 50,87', a.o({ strokeWidth: 2 })));
    },
    crayons: function (a) {
      var cols = [C.berry, C.sun, C.sky];
      [[36, 38], [50, 52], [64, 66]].forEach(function (c, k) {
        var ang = -Math.PI / 4;
        a.plain('path', { d: 'M' + rot([[-26, -7], [22, -7], [36, 0], [22, 7], [-26, 7]], c[0], c[1], ang).map(pt).join(' L') + ' Z', fill: C.white });
        a.put(a.rc.polygon(rot([[-26, -7], [22, -7], [22, 7], [-26, 7]], c[0], c[1], ang), a.o({ fill: cols[k], hachureGap: 3.5, fillWeight: 1.8, strokeWidth: 2 })));
        a.put(a.rc.polygon(rot([[22, -7], [36, 0], [22, 7]], c[0], c[1], ang), a.o({ fill: cols[k], fillStyle: 'solid', strokeWidth: 2 })));
        var band = rot([[-12, -7], [-12, 7]], c[0], c[1], ang);
        a.put(a.rc.line(band[0][0], band[0][1], band[1][0], band[1][1], a.o({ strokeWidth: 1.6 })));
      });
    },
    blocks: function (a) {
      function cube(x, y, s, col, letter) {
        var d = s * 0.33;
        a.plain('path', { d: 'M' + [[x, y + s], [x, y], [x + d, y - d], [x + s + d, y - d], [x + s + d, y + s - d], [x + s, y + s]].map(pt).join(' L') + ' Z', fill: C.white });
        a.put(a.rc.polygon([[x, y], [x + d, y - d], [x + s + d, y - d], [x + s, y]], a.o({ fill: col, hachureGap: 6, fillWeight: 1.3, strokeWidth: 2 })));
        a.put(a.rc.polygon([[x + s, y], [x + s + d, y - d], [x + s + d, y + s - d], [x + s, y + s]], a.o({ fill: col, hachureGap: 2.8, fillWeight: 2, strokeWidth: 2 })));
        a.put(a.rc.rectangle(x, y, s, s, a.o({ strokeWidth: 2.2 })));
        var t = a.plain('text', { x: x + s / 2, y: y + s * 0.74, 'text-anchor': 'middle', 'class': 'scene-text', 'font-size': f1(s * 0.66) });
        t.style.fill = col === C.sun ? C.orangeDeep : col;
        t.textContent = letter;
      }
      cube(12, 58, 30, C.orange, 'A');
      cube(48, 58, 30, C.blue, 'B');
      cube(30, 28, 30, C.leafDeep, 'C');
    },
    book: function (a) {
      a.put(a.rc.polygon([[6, 40], [50, 50], [94, 40], [94, 84], [50, 94], [6, 84]], a.o({ fill: C.blue, hachureGap: 3.5, fillWeight: 2 })));
      a.plain('path', { d: 'M12,30 L48,38 L48,86 L12,78 Z', fill: C.white });
      a.plain('path', { d: 'M52,38 L88,30 L88,78 L52,86 Z', fill: C.white });
      a.put(a.rc.polygon([[12, 30], [48, 38], [48, 86], [12, 78]], a.o({ strokeWidth: 2.2 })));
      a.put(a.rc.polygon([[52, 38], [88, 30], [88, 78], [52, 86]], a.o({ strokeWidth: 2.2 })));
      for (var k = 0; k < 3; k++) {
        a.put(a.rc.line(18, 46 + k * 10, 42, 51 + k * 10, a.o({ strokeWidth: 1.5, stroke: C.stone })));
        a.put(a.rc.line(58, 51 + k * 10, 82, 46 + k * 10, a.o({ strokeWidth: 1.5, stroke: C.stone })));
      }
      a.put(a.rc.polygon([[46, 37], [54, 37], [54, 70], [50, 64], [46, 70]], a.o({ fill: C.orange, fillStyle: 'solid', strokeWidth: 1.6 })));
    },
    heart: function (a) {
      var d = 'M50,84 C20,62 10,46 14,32 C18,18 38,14 50,30 C62,14 82,18 86,32 C90,46 80,62 50,84 Z';
      a.plain('path', { d: d, fill: C.white });
      a.put(a.rc.path(d, a.o({ fill: C.berry, hachureGap: 4, fillWeight: 2, strokeWidth: 2.6 })));
      a.put(a.rc.arc(32, 36, 22, 22, Math.PI * 1.1, Math.PI * 1.6, false, a.o({ stroke: C.white, strokeWidth: 3 })));
    },
    note: function (a) {
      a.put(a.rc.ellipse(33, 74, 24, 17, a.o({ fill: C.violet, hachureGap: 2.8, fillWeight: 2, strokeWidth: 2.2 })));
      a.put(a.rc.ellipse(69, 66, 24, 17, a.o({ fill: C.violet, hachureGap: 2.8, fillWeight: 2, strokeWidth: 2.2 })));
      a.put(a.rc.line(44, 72, 44, 26, a.o({ strokeWidth: 2.6 })));
      a.put(a.rc.line(80, 64, 80, 18, a.o({ strokeWidth: 2.6 })));
      a.put(a.rc.polygon([[44, 26], [80, 18], [80, 28], [44, 36]], a.o({ fill: INK, fillStyle: 'solid', strokeWidth: 2 })));
    },
    magnifier: function (a) {
      a.plain('circle', { cx: 44, cy: 44, r: 25, fill: C.white });
      a.put(a.rc.polygon([[59, 65], [65, 59], [90, 82], [83, 89]], a.o({ fill: C.orange, hachureGap: 3, fillWeight: 2, strokeWidth: 2.2 })));
      a.put(a.rc.circle(44, 44, 50, a.o({ fill: C.skyLight, hachureGap: 6, fillWeight: 1.3, strokeWidth: 3 })));
      a.put(a.rc.arc(44, 44, 34, 34, Math.PI * 1.1, Math.PI * 1.55, false, a.o({ stroke: C.white, strokeWidth: 3.5 })));
    },
    apple: function (a) {
      var d = 'M50,32 C34,22 14,30 16,54 C18,78 36,90 50,84 C64,90 82,78 84,54 C86,30 66,22 50,32 Z';
      a.plain('path', { d: d, fill: C.white });
      a.put(a.rc.path(d, a.o({ fill: C.red, hachureGap: 3.8, fillWeight: 2, strokeWidth: 2.6 })));
      a.put(a.rc.line(50, 32, 54, 15, a.o({ strokeWidth: 2.6 })));
      a.put(a.rc.path('M54,22 C62,10 76,12 79,16 C71,25 61,27 54,22 Z', a.o({ fill: C.leafDeep, fillStyle: 'solid', strokeWidth: 1.8 })));
      a.put(a.rc.arc(32, 48, 18, 22, Math.PI * 1.05, Math.PI * 1.5, false, a.o({ stroke: C.white, strokeWidth: 3 })));
    },
    sprout: function (a) {
      a.put(a.rc.curve([[50, 64], [47, 50], [50, 36]], a.o({ stroke: C.leafDeep, strokeWidth: 3 })));
      a.put(a.rc.path('M50,46 C40,32 24,32 18,36 C24,48 40,52 50,46 Z', a.o({ fill: C.leaf, hachureGap: 3, fillWeight: 1.8, strokeWidth: 2 })));
      a.put(a.rc.path('M50,40 C58,24 76,22 83,26 C77,40 62,44 50,40 Z', a.o({ fill: C.leaf, hachureGap: 3, fillWeight: 1.8, strokeWidth: 2 })));
      a.plain('path', { d: 'M28,62 L72,62 L65,90 L35,90 Z', fill: C.white });
      a.put(a.rc.polygon([[28, 62], [72, 62], [65, 90], [35, 90]], a.o({ fill: C.orange, hachureGap: 4, fillWeight: 2, strokeWidth: 2.4 })));
      a.put(a.rc.line(25, 62, 75, 62, a.o({ strokeWidth: 3 })));
    },
    star: function (a) {
      var pts = starPoints(50, 54, 40, 17, 5);
      a.plain('path', { d: 'M' + pts.map(pt).join(' L') + ' Z', fill: C.white });
      a.put(a.rc.polygon(pts, a.o({ fill: C.sun, hachureGap: 4, fillWeight: 2, strokeWidth: 2.6 })));
      a.put(a.rc.circle(43, 54, 5, a.o({ fill: INK, fillStyle: 'solid', strokeWidth: 1 })));
      a.put(a.rc.circle(57, 54, 5, a.o({ fill: INK, fillStyle: 'solid', strokeWidth: 1 })));
      a.put(a.rc.arc(50, 60, 14, 10, 0.1 * Math.PI, 0.9 * Math.PI, false, a.o({ strokeWidth: 2 })));
    },
    gem: function (a, svg) {
      var col = C[svg.getAttribute('data-color')] || C.sky;
      var pts = [[20, 40], [34, 22], [66, 22], [80, 40], [50, 86]];
      a.plain('path', { d: 'M' + pts.map(pt).join(' L') + ' Z', fill: C.white });
      a.put(a.rc.polygon(pts, a.o({ fill: col, hachureGap: 4, fillWeight: 2, strokeWidth: 2.6 })));
      a.put(a.rc.line(20, 40, 80, 40, a.o({ strokeWidth: 2 })));
      [[34, 22, 42, 40], [66, 22, 58, 40], [50, 22, 42, 40], [50, 22, 58, 40], [42, 40, 50, 86], [58, 40, 50, 86]].forEach(function (l) {
        a.put(a.rc.line(l[0], l[1], l[2], l[3], a.o({ strokeWidth: 1.6 })));
      });
      [[86, 18], [12, 24], [88, 64], [14, 70]].forEach(function (p, k) {
        if ((k + a.i) % 2 === 0) a.put(a.rc.path(sparkle(p[0], p[1], 9), a.o({ fill: C.sun, fillStyle: 'solid', strokeWidth: 1.4 })));
      });
    },
    palette: function (a) {
      var d = 'M50,16 C24,16 10,34 12,54 C14,74 32,86 50,84 C60,83 60,74 56,68 C52,62 58,56 66,58 C80,62 90,52 88,40 C86,26 70,16 50,16 Z';
      a.plain('path', { d: d, fill: C.white });
      a.put(a.rc.path(d, a.o({ fill: C.wood, hachureGap: 5, fillWeight: 1.6, strokeWidth: 2.6 })));
      [[30, 38, C.berry], [48, 28, C.sun], [68, 32, C.blue], [26, 58, C.leafDeep], [40, 70, C.violet]].forEach(function (p) {
        a.put(a.rc.circle(p[0], p[1], 13, a.o({ fill: p[2], fillStyle: 'solid', strokeWidth: 1.6 })));
      });
    },
    crown: function (a) {
      var pts = [[14, 66], [20, 30], [35, 50], [50, 22], [65, 50], [80, 30], [86, 66]];
      a.plain('path', { d: 'M' + pts.map(pt).join(' L') + ' Z', fill: C.white });
      a.plain('path', { d: 'M14,62 H86 V82 H14 Z', fill: C.white });
      a.put(a.rc.polygon(pts, a.o({ fill: C.sunPale, hachureGap: 5, fillWeight: 1.6, strokeWidth: 2.6 })));
      a.put(a.rc.rectangle(14, 62, 72, 20, a.o({ fill: C.sun, hachureGap: 3.5, fillWeight: 2, strokeWidth: 2.6 })));
      [[20, 26], [50, 18], [80, 26]].forEach(function (p) { a.put(a.rc.circle(p[0], p[1], 9, a.o({ fill: C.sun, fillStyle: 'solid', strokeWidth: 1.8 }))); });
      a.put(a.rc.circle(30, 72, 9, a.o({ fill: C.sky, fillStyle: 'solid', strokeWidth: 1.6 })));
      a.put(a.rc.polygon([[50, 65], [57, 72], [50, 79], [43, 72]], a.o({ fill: C.orange, fillStyle: 'solid', strokeWidth: 1.6 })));
      a.put(a.rc.circle(70, 72, 9, a.o({ fill: C.berry, fillStyle: 'solid', strokeWidth: 1.6 })));
      [[8, 14], [92, 12], [50, 6]].forEach(function (p, k) {
        if ((k + a.i) % 2 === 0) a.put(a.rc.path(sparkle(p[0], p[1], 6), a.o({ fill: C.sun, fillStyle: 'solid', strokeWidth: 1.2 })));
      });
    },
    bucket: function (a) {
      a.put(a.rc.arc(50, 46, 46, 46, Math.PI, TAU, false, a.o({ strokeWidth: 2.4 })));
      a.plain('path', { d: 'M26,46 L74,46 L67,88 L33,88 Z', fill: C.white });
      a.put(a.rc.polygon([[26, 46], [74, 46], [67, 88], [33, 88]], a.o({ fill: C.sky, hachureGap: 4, fillWeight: 2, strokeWidth: 2.4 })));
      a.put(a.rc.line(26, 54, 74, 54, a.o({ strokeWidth: 1.8 })));
      a.put(a.rc.line(84, 30, 76, 62, a.o({ strokeWidth: 3, stroke: C.bark })));
      a.put(a.rc.path('M70,58 L82,62 L78,80 L68,74 Z', a.o({ fill: C.orange, fillStyle: 'solid', strokeWidth: 1.8 })));
      a.put(a.rc.ellipse(50, 92, 70, 10, a.o({ fill: C.sand, hachureGap: 3, strokeWidth: 1.6 })));
    },
    abacus: function (a) {
      a.plain('path', { d: 'M14,18 H86 V84 H14 Z', fill: C.white });
      a.put(a.rc.rectangle(14, 18, 72, 66, a.o({ stroke: C.bark, strokeWidth: 3.4 })));
      var rows = [[36, [24, 35, 46], C.orange], [52, [28, 39, 64, 75], C.sky], [68, [24, 54, 65], C.berry]];
      rows.forEach(function (r) {
        a.put(a.rc.line(14, r[0], 86, r[0], a.o({ strokeWidth: 1.6 })));
        r[1].forEach(function (x) { a.put(a.rc.circle(x, r[0], 11, a.o({ fill: r[2], fillStyle: 'solid', strokeWidth: 1.6 }))); });
      });
      a.put(a.rc.line(20, 84, 14, 94, a.o({ stroke: C.bark, strokeWidth: 3 })));
      a.put(a.rc.line(80, 84, 86, 94, a.o({ stroke: C.bark, strokeWidth: 3 })));
    },
    mail: function (a) {
      a.plain('path', { d: 'M12,26 H88 V78 H12 Z', fill: C.white });
      a.put(a.rc.rectangle(12, 26, 76, 52, a.o({ fill: C.skyLight, hachureGap: 7, fillWeight: 1.4, strokeWidth: 2.6 })));
      a.put(a.rc.linearPath([[12, 26], [50, 56], [88, 26]], a.o({ strokeWidth: 2.4 })));
      a.put(a.rc.line(12, 78, 40, 50, a.o({ strokeWidth: 1.8 })));
      a.put(a.rc.line(88, 78, 60, 50, a.o({ strokeWidth: 1.8 })));
      a.put(a.rc.path('M50,64 C44,58 40,54 42,50 C44,46 48,47 50,50 C52,47 56,46 58,50 C60,54 56,58 50,64 Z', a.o({ fill: C.berry, fillStyle: 'solid', strokeWidth: 1.4 })));
    },
    castle: function (a) {
      var w = [-2, 2, 0][a.i];
      a.put(a.rc.line(2, 90, 98, 90, a.o({ strokeWidth: 2.4 })));
      a.plain('path', { d: 'M14,54 H34 V90 H14 Z M66,54 H86 V90 H66 Z M34,42 H66 V90 H34 Z', fill: C.white });
      a.put(a.rc.rectangle(14, 54, 20, 36, a.o({ strokeWidth: 2.2 })));
      a.put(a.rc.rectangle(66, 54, 20, 36, a.o({ strokeWidth: 2.2 })));
      a.put(a.rc.rectangle(34, 42, 32, 48, a.o({ strokeWidth: 2.4 })));
      a.put(a.rc.polygon([[10, 56], [24, 30], [38, 56]], a.o({ fill: C.orange, hachureGap: 3.5, fillWeight: 1.8, strokeWidth: 2.2 })));
      a.put(a.rc.polygon([[62, 56], [76, 30], [90, 56]], a.o({ fill: C.blue, hachureGap: 3.5, fillWeight: 1.8, strokeWidth: 2.2 })));
      a.put(a.rc.line(24, 30, 24, 16, a.o({ strokeWidth: 1.8 })));
      a.put(a.rc.polygon([[24, 16], [35, 19 + w], [24, 24]], a.o({ fill: C.sky, fillStyle: 'solid', strokeWidth: 1.4 })));
      a.put(a.rc.line(76, 30, 76, 16, a.o({ strokeWidth: 1.8 })));
      a.put(a.rc.polygon([[76, 16], [87, 19 - w], [76, 24]], a.o({ fill: C.orange, fillStyle: 'solid', strokeWidth: 1.4 })));
      a.put(a.rc.polygon([[33, 44], [35, 28], [42, 36], [50, 22], [58, 36], [65, 28], [67, 44]], a.o({ fill: C.sun, hachureGap: 3, fillWeight: 1.6, strokeWidth: 2 })));
      a.put(a.rc.path('M43,90 L43,78 A7,7 0 0 1 57,78 L57,90 Z', a.o({ fill: INK, fillStyle: 'solid', strokeWidth: 1.6 })));
      a.put(a.rc.path('M19,74 L19,66 A5,5 0 0 1 29,66 L29,74 Z', a.o({ fill: C.skyLight, fillStyle: 'solid', strokeWidth: 1.4 })));
      a.put(a.rc.path('M71,74 L71,66 A5,5 0 0 1 81,66 L81,74 Z', a.o({ fill: C.skyLight, fillStyle: 'solid', strokeWidth: 1.4 })));
    },
    pin: function (a) {
      var dy = [0, -6, -2][a.i];
      a.put(a.rc.ellipse(50, 92, 34 - dy, 8, a.o({ fill: C.stone, fillStyle: 'solid', stroke: 'none' })));
      var d = 'M50,' + (86 + dy) + ' C40,' + (68 + dy) + ' 22,' + (56 + dy) + ' 22,' + (38 + dy) + ' C22,' + (22 + dy) + ' 34,' + (10 + dy) +
        ' 50,' + (10 + dy) + ' C66,' + (10 + dy) + ' 78,' + (22 + dy) + ' 78,' + (38 + dy) + ' C78,' + (56 + dy) + ' 60,' + (68 + dy) + ' 50,' + (86 + dy) + ' Z';
      a.plain('path', { d: d, fill: C.white });
      a.put(a.rc.path(d, a.o({ fill: C.orange, hachureGap: 4, fillWeight: 2, strokeWidth: 2.6 })));
      a.plain('circle', { cx: 50, cy: 38 + dy, r: 11, fill: C.white });
      a.put(a.rc.circle(50, 38 + dy, 22, a.o({ strokeWidth: 2.2 })));
    },
    teddy: function (a) {
      var fur = function (x) { return a.o(Object.assign({ fill: C.bark, hachureGap: 3.5, fillWeight: 1.8, strokeWidth: 2.3 }, x || {})); };
      a.put(a.rc.circle(30, 22, 18, fur()));
      a.put(a.rc.circle(70, 22, 18, fur()));
      a.put(a.rc.ellipse(27, 68, 14, 24, fur()));
      a.put(a.rc.ellipse(73, 68, 14, 24, fur()));
      a.put(a.rc.ellipse(38, 92, 18, 10, fur()));
      a.put(a.rc.ellipse(62, 92, 18, 10, fur()));
      a.plain('ellipse', { cx: 50, cy: 72, rx: 25, ry: 22, fill: C.white });
      a.put(a.rc.ellipse(50, 72, 50, 44, fur()));
      a.put(a.rc.ellipse(50, 75, 26, 22, a.o({ fill: C.wood, fillStyle: 'solid', strokeWidth: 1.6 })));
      a.plain('circle', { cx: 50, cy: 40, r: 23, fill: C.white });
      a.put(a.rc.circle(50, 40, 46, fur()));
      a.put(a.rc.ellipse(50, 48, 22, 15, a.o({ fill: C.wood, fillStyle: 'solid', strokeWidth: 1.6 })));
      a.put(a.rc.circle(41, 35, 5, a.o({ fill: INK, fillStyle: 'solid', strokeWidth: 1 })));
      a.put(a.rc.circle(59, 35, 5, a.o({ fill: INK, fillStyle: 'solid', strokeWidth: 1 })));
      a.put(a.rc.circle(50, 45, 6, a.o({ fill: INK, fillStyle: 'solid', strokeWidth: 1 })));
      a.put(a.rc.arc(50, 49, 10, 7, 0.1 * Math.PI, 0.9 * Math.PI, false, a.o({ strokeWidth: 1.6 })));
      a.put(a.rc.polygon([[39, 19], [41, 6], [46, 12], [50, 3], [54, 12], [59, 6], [61, 19]], a.o({ fill: C.sun, fillStyle: 'solid', strokeWidth: 1.6 })));
    },
    chat: function (a) {
      var d = 'M12,20 H88 V66 H46 L26,86 L30,66 H12 Z';
      a.plain('path', { d: d, fill: C.white });
      a.put(a.rc.path(d, a.o({ fill: C.leaf, hachureGap: 4.5, fillWeight: 1.8, strokeWidth: 2.6 })));
      // typing dots: a different one hops up in each frame
      [34, 50, 66].forEach(function (x, k) {
        a.put(a.rc.circle(x, 43 - (k === a.i ? 5 : 0), 10, a.o({ fill: INK, fillStyle: 'solid', strokeWidth: 1.2 })));
      });
    },
    phone: function (a) {
      a.plain('path', { d: 'M30,10 H70 V90 H30 Z', fill: C.white });
      a.put(a.rc.rectangle(30, 10, 40, 80, a.o({ fill: C.sky, hachureGap: 4, fillWeight: 1.8, strokeWidth: 2.6 })));
      a.plain('path', { d: 'M36,20 H64 V72 H36 Z', fill: C.white });
      a.put(a.rc.rectangle(36, 20, 28, 52, a.o({ strokeWidth: 2 })));
      a.put(a.rc.circle(50, 81, 7, a.o({ strokeWidth: 1.8 })));
      if (a.i !== 1) {
        a.put(a.rc.arc(72, 30, 20, 20, -Math.PI / 3, Math.PI / 3, false, a.o({ strokeWidth: 2.2 })));
        a.put(a.rc.arc(72, 30, 34, 34, -Math.PI / 3, Math.PI / 3, false, a.o({ strokeWidth: 2.2 })));
      }
    },
    clock: function (a) {
      a.plain('circle', { cx: 50, cy: 52, r: 37, fill: C.white });
      a.put(a.rc.circle(50, 52, 74, a.o({ fill: C.sun, hachureGap: 7, fillWeight: 1.3, strokeWidth: 2.8 })));
      for (var k = 0; k < 12; k++) {
        var ang = (k / 12) * TAU;
        a.put(a.rc.line(50 + 29 * Math.cos(ang), 52 + 29 * Math.sin(ang), 50 + 33 * Math.cos(ang), 52 + 33 * Math.sin(ang), a.o({ strokeWidth: 1.8 })));
      }
      var m = -Math.PI / 2 + a.i * (Math.PI / 15);
      a.put(a.rc.line(50, 52, 50 + 25 * Math.cos(m), 52 + 25 * Math.sin(m), a.o({ strokeWidth: 2.6 })));
      a.put(a.rc.line(50, 52, 50 + 16 * Math.cos(-Math.PI / 6), 52 + 16 * Math.sin(-Math.PI / 6), a.o({ strokeWidth: 3.2 })));
      a.put(a.rc.circle(50, 52, 6, a.o({ fill: INK, fillStyle: 'solid', strokeWidth: 1 })));
    },
    plane: function (a) {
      var off = [[0, 0], [2, -3], [-1, -5]][a.i];
      var P = function (pts) { return pts.map(function (p) { return [p[0] + off[0], p[1] + off[1]]; }); };
      var trail = a.plain('path', { d: 'M28,50 C12,56 4,70 12,80 C20,90 34,82 28,74 C22,66 10,74 4,94', fill: 'none', stroke: C.orangeDeep, 'stroke-width': 2.4, 'stroke-dasharray': '3 6', 'stroke-linecap': 'round' });
      trail.setAttribute('transform', 'translate(' + off[0] + ' ' + off[1] + ')');
      a.plain('path', { d: 'M' + P([[28, 50], [96, 16], [58, 58]]).map(pt).join(' L') + ' Z M' + P([[58, 58], [96, 16], [70, 84]]).map(pt).join(' L') + ' Z', fill: C.white });
      a.put(a.rc.polygon(P([[28, 50], [96, 16], [58, 58]]), a.o({ fill: C.skyLight, hachureGap: 5, fillWeight: 1.4, strokeWidth: 2.4 })));
      a.put(a.rc.polygon(P([[58, 58], [96, 16], [70, 84]]), a.o({ fill: C.sky, hachureGap: 4, fillWeight: 1.6, strokeWidth: 2.4 })));
      a.put(a.rc.polygon(P([[58, 58], [70, 84], [62, 66]]), a.o({ fill: INK, fillStyle: 'solid', strokeWidth: 1.4 })));
    },
    camera: function (a) {
      a.plain('path', { d: 'M12,32 H88 V84 H12 Z M30,22 H52 V32 H30 Z', fill: C.white });
      a.put(a.rc.rectangle(30, 22, 22, 12, a.o({ fill: INK, hachureGap: 3, strokeWidth: 2 })));
      a.put(a.rc.rectangle(12, 32, 76, 52, a.o({ fill: C.sky, hachureGap: 4.5, fillWeight: 1.8, strokeWidth: 2.6 })));
      a.plain('circle', { cx: 50, cy: 58, r: 17, fill: C.white });
      a.put(a.rc.circle(50, 58, 34, a.o({ strokeWidth: 2.4 })));
      a.put(a.rc.circle(50, 58, 18, a.o({ fill: C.blue, hachureGap: 3, fillWeight: 2, strokeWidth: 2 })));
      a.put(a.rc.rectangle(70, 38, 11, 7, a.o({ fill: C.sun, fillStyle: 'solid', strokeWidth: 1.6 })));
      if (a.i === 1) {
        [[76, 26, 76, 14], [84, 30, 94, 20], [68, 30, 60, 20]].forEach(function (l) { a.put(a.rc.line(l[0], l[1], l[2], l[3], a.o({ stroke: C.orangeDeep, strokeWidth: 2.4 }))); });
      }
    }
  };

  /* =======================================================================
     SCENES
     ======================================================================= */
  function drawButterfly(svg, parent) {
    var hop = el('g', { 'class': 'hop' }, parent);
    var inner = el('g', { transform: 'scale(1.2)' }, hop);
    boil(svg, inner, function (a) {
      var wings = el('g', { 'class': 'bwing' }, a.g);
      var wo = a.o({ fill: C.orange, hachureGap: 3.5, strokeWidth: 2 });
      [[-13, -7, 24, 20], [13, -7, 24, 20], [-10, 8, 16, 14], [10, 8, 16, 14]].forEach(function (e) {
        wings.appendChild(a.rc.ellipse(e[0], e[1], e[2], e[3], wo));
      });
      wings.appendChild(a.rc.circle(-14, -8, 6, a.o({ fill: C.blue, fillStyle: 'solid', strokeWidth: 1.2 })));
      wings.appendChild(a.rc.circle(14, -8, 6, a.o({ fill: C.blue, fillStyle: 'solid', strokeWidth: 1.2 })));
      a.put(a.rc.line(0, -12, 0, 14, a.o({ strokeWidth: 3.4 })));
      a.put(a.rc.curve([[0, -12], [-4, -22], [-10, -26]], a.o({ strokeWidth: 1.8 })));
      a.put(a.rc.curve([[0, -12], [4, -22], [10, -26]], a.o({ strokeWidth: 1.8 })));
    });
  }

  function drawCloud(svg, parent, cx, cy, rx, ry, n, dx) {
    var g = el('g', { 'class': 'drift', style: '--dx:' + dx }, parent);
    boil(svg, g, function (a) {
      var d = blob(cx, cy, rx, ry, n, 0.62, 0.3 + a.i * 0.05);
      a.plain('path', { d: d, fill: C.white });
      a.put(a.rc.path(d, a.o({ fill: C.cloudHatch, hachureAngle: -35, hachureGap: 6, fillWeight: 1.6, strokeWidth: 2.4 })));
    });
  }

  function drawSun(svg, parent, cx, cy, size) {
    boil(svg, parent, function (a) {
      var r0 = size * 0.64;
      for (var k = 0; k < 12; k++) {
        var ang = (k / 12) * TAU + (a.i % 2 ? Math.PI / 12 : 0) + a.i * 0.04;
        var len = (k + a.i) % 2 ? size * 0.32 : size * 0.2;
        a.put(a.rc.line(cx + r0 * Math.cos(ang), cy + r0 * Math.sin(ang), cx + (r0 + len) * Math.cos(ang), cy + (r0 + len) * Math.sin(ang), a.o({ strokeWidth: 3 })));
      }
      a.put(a.rc.circle(cx, cy, size, a.o({ fill: C.sun, hachureGap: 4.5, fillWeight: 2.2, hachureAngle: -40 + a.i * 25 })));
      var s = size / 100;
      a.put(a.rc.arc(cx - 18 * s, cy - 8 * s, 18 * s, 12 * s, 0, Math.PI, false, a.o({ strokeWidth: 2.6 })));
      a.put(a.rc.arc(cx + 18 * s, cy - 8 * s, 18 * s, 12 * s, 0, Math.PI, false, a.o({ strokeWidth: 2.6 })));
      a.put(a.rc.arc(cx, cy + 10 * s, 42 * s, 28 * s, 0.15 * Math.PI, 0.85 * Math.PI, false, a.o({ strokeWidth: 2.6 })));
      a.put(a.rc.circle(cx - 30 * s, cy + 8 * s, 10 * s, a.o({ fill: C.berry, fillStyle: 'solid', stroke: 'none' })));
      a.put(a.rc.circle(cx + 30 * s, cy + 8 * s, 10 * s, a.o({ fill: C.berry, fillStyle: 'solid', stroke: 'none' })));
    });
  }

  function drawLollipopTree(svg, parent, x, cy, r, baseY, seed) {
    boil(svg, parent, function (a) {
      a.put(a.rc.polygon([[x - 10, baseY], [x - 6, cy + r * 0.5], [x + 6, cy + r * 0.5], [x + 10, baseY]], a.o({ fill: C.bark, hachureAngle: 80, hachureGap: 4.5, fillWeight: 2 })));
    });
    el('circle', { cx: x, cy: cy, r: r + 2, fill: '#cdeebb' }, parent);
    var R = rng(seed);
    var loops = [];
    for (var k = 0; k < Math.round(r * 0.45); k++) {
      var ang = R() * TAU, rr = Math.sqrt(R());
      loops.push([x + Math.cos(ang) * rr * (r - 16), cy + Math.sin(ang) * rr * (r - 16), 18 + R() * 16]);
    }
    boil(svg, parent, function (a) {
      loops.forEach(function (l, k) {
        a.put(a.rc.circle(l[0] + ((k + a.i) % 3 - 1) * 1.5, l[1] + ((k * 2 + a.i) % 3 - 1) * 1.5, l[2], a.o({ stroke: C.leafDeep, strokeWidth: 2.2, roughness: 1.6 })));
      });
      a.put(a.rc.path(blob(x, cy, r + 6, r + 2, 11, 0.6, a.i * 0.07), a.o({ strokeWidth: 2.8 })));
    });
  }

  function drawFlower(a, x, base, col, k) {
    var top = base - 34;
    a.put(a.rc.curve([[x, base], [x - 3, base - 16], [x + 1, top]], a.o({ stroke: C.leafDeep, strokeWidth: 2.6 })));
    a.put(a.rc.ellipse(x - 9, base - 14, 14, 7, a.o({ fill: C.leafDeep, fillStyle: 'solid', stroke: C.leafDeep, strokeWidth: 1 })));
    for (var p = 0; p < 5; p++) {
      var ang = (p / 5) * TAU + a.i * 0.12 + k;
      a.put(a.rc.circle(x + 1 + 8 * Math.cos(ang), top + 8 * Math.sin(ang), 11, a.o({ fill: col, hachureGap: 2.6, strokeWidth: 1.6 })));
    }
    a.put(a.rc.circle(x + 1, top, 7, a.o({ fill: col === C.sun ? C.orange : C.sun, fillStyle: 'solid', strokeWidth: 1.4 })));
  }
  function drawTuft(a, x, b) {
    a.put(a.rc.linearPath([[x - 9, b - 11], [x - 2, b]], a.o({ stroke: C.leafDeep, strokeWidth: 2.6 })));
    a.put(a.rc.linearPath([[x, b - 17], [x, b]], a.o({ stroke: C.leafDeep, strokeWidth: 2.6 })));
    a.put(a.rc.linearPath([[x + 9, b - 11], [x + 2, b]], a.o({ stroke: C.leafDeep, strokeWidth: 2.6 })));
  }

  var DOODLES = {
    /* Home page panorama: castle with a crown, rainbow, kite, trees (viewBox 0 0 1200 520) */
    hero: function (svg) {
      var bh = function (x) { return 395 - 70 * Math.sin(Math.PI * (x + 10) / 1220); };
      var fh = function (x) { return 432 + 36 * Math.cos(TAU * (x - 600) / 1200); };

      drawSun(svg, svg, 1090, 92, 100);

      // rainbow that draws itself in when the page opens
      var rainbow = boil(svg, svg, function (a) {
        [C.berry, C.orange, C.sun, C.leaf, C.sky].forEach(function (col, k) {
          var r = 300 - k * 14;
          var node = a.put(a.rc.arc(600, 345, r * 2, r * 2, Math.PI, TAU, false, a.o({ stroke: col, strokeWidth: 11, roughness: 1.1, bowing: 0.5 })));
          node.setAttribute('style', '--d:' + (0.4 + k * 0.25) + 's');
        });
      });
      rainbow.classList.add('draw-in');
      rainbow.querySelectorAll('path').forEach(function (p) { p.setAttribute('pathLength', '100'); });

      drawCloud(svg, svg, 300, 80, 82, 30, 9, '30px');
      drawCloud(svg, svg, 770, 62, 64, 24, 8, '-24px');
      drawCloud(svg, svg, 930, 182, 50, 20, 7, '18px');

      // kite and its string
      boil(svg, svg, function (a) { a.put(a.rc.curve([[190, 178], [160, 280], [118, 400], [70, 540]], a.o({ strokeWidth: 1.6, roughness: 1 }))); });
      var kite = el('g', { 'class': 'bob-step' }, svg);
      boil(svg, kite, function (a) {
        var T = [190, 62], R = [228, 116], B = [190, 178], L = [152, 116], M = [190, 116];
        a.plain('path', { d: 'M' + [T, R, B, L].map(pt).join(' L') + ' Z', fill: C.white });
        var ko = function (col) { return a.o({ fill: col, hachureGap: 4, fillWeight: 2, strokeWidth: 2.2 }); };
        a.put(a.rc.polygon([T, R, M], ko(C.orange)));
        a.put(a.rc.polygon([R, B, M], ko(C.blue)));
        a.put(a.rc.polygon([B, L, M], ko(C.orange)));
        a.put(a.rc.polygon([L, T, M], ko(C.blue)));
        var ph = [0, 1.2, 2.4][a.i], tail = [];
        for (var k = 0; k <= 8; k++) { var t = k / 8; tail.push([190 + 12 * Math.sin(t * 7 + ph) - 26 * t, 178 + 110 * t]); }
        a.put(a.rc.curve(tail, a.o({ strokeWidth: 1.8 })));
        [2, 5, 8].forEach(function (k, j) {
          var x = tail[k][0], y = tail[k][1], col = [C.sun, C.berry, C.leaf][j];
          a.put(a.rc.polygon([[x - 9, y - 6], [x, y], [x - 9, y + 6]], a.o({ fill: col, fillStyle: 'solid', strokeWidth: 1.4 })));
          a.put(a.rc.polygon([[x + 9, y - 6], [x, y], [x + 9, y + 6]], a.o({ fill: col, fillStyle: 'solid', strokeWidth: 1.4 })));
        });
      });

      // extra sky for wide screens (the viewBox runs from -500 to 1700)
      drawCloud(svg, svg, -220, 110, 70, 26, 8, '24px');
      drawCloud(svg, svg, 1570, 196, 58, 22, 7, '-20px');
      var balloon = el('g', { 'class': 'bob-step' }, svg);
      boil(svg, balloon, function (a) {
        var env = 'M1360,58 C1318,58 1302,94 1312,124 C1321,150 1346,164 1352,176 L1368,176 C1374,164 1399,150 1408,124 C1418,94 1402,58 1360,58 Z';
        a.plain('path', { d: env, fill: C.white });
        a.put(a.rc.path(env, a.o({ fill: C.orange, hachureGap: 5, fillWeight: 2, strokeWidth: 2.6 })));
        a.put(a.rc.path('M1360,58 C1340,80 1338,140 1356,176', a.o({ strokeWidth: 1.8 })));
        a.put(a.rc.path('M1360,58 C1380,80 1382,140 1364,176', a.o({ strokeWidth: 1.8 })));
        a.put(a.rc.path('M1313,116 C1340,128 1380,128 1407,116', a.o({ stroke: C.blue, strokeWidth: 6 })));
        a.put(a.rc.line(1352, 176, 1349, 194, a.o({ strokeWidth: 1.6 })));
        a.put(a.rc.line(1368, 176, 1371, 194, a.o({ strokeWidth: 1.6 })));
        a.plain('path', { d: 'M1346,194 H1374 V212 H1346 Z', fill: C.white });
        a.put(a.rc.rectangle(1346, 194, 28, 18, a.o({ fill: C.bark, hachureGap: 3.5, strokeWidth: 2 })));
      });

      // back hill
      var backPts = [];
      for (var x = -540; x <= 1740; x += 40) backPts.push([x, bh(x)]);
      var backD = smooth(backPts) + ' L1740,560 L-540,560 Z';
      el('path', { d: backD, fill: C.grassPale2 }, svg);
      boil(svg, svg, function (a) { a.put(a.rc.path(backD, a.o({ fill: C.grassMid, hachureAngle: 55, hachureGap: 8, fillWeight: 1.6, strokeWidth: 2.6 }))); });

      // little tree on the back hill
      boil(svg, svg, function (a) {
        a.put(a.rc.polygon([[244, 360], [246, 300], [254, 300], [256, 360]], a.o({ fill: C.bark, hachureGap: 3.5, strokeWidth: 2 })));
        var d = blob(250, 282, 32, 30, 8, 0.6, a.i * 0.1);
        a.plain('path', { d: d, fill: '#cdeebb' });
        a.put(a.rc.path(d, a.o({ fill: C.leafDeep, hachureGap: 5, fillWeight: 1.6, strokeWidth: 2.4 })));
      });

      /* ----- the castle (a link: hover or focus opens the gate) ----- */
      var castle = el('g', { 'class': 'castle-link' }, svg);
      el('rect', { 'class': 'castle-focus', x: 400, y: 36, width: 400, height: 324, rx: 24 }, castle);
      el('path', { d: 'M430,215 H500 V350 H430 Z M700,215 H770 V350 H700 Z M500,254 H520 V350 H500 Z M680,254 H700 V350 H680 Z M520,190 H680 V350 H520 Z', fill: C.white }, castle);
      boil(svg, castle, function (a) {
        var o = a.o, rc = a.rc;
        a.put(rc.rectangle(430, 215, 70, 135, o({ strokeWidth: 2.8 })));
        a.put(rc.rectangle(700, 215, 70, 135, o({ strokeWidth: 2.8 })));
        a.put(rc.linearPath([[500, 350], [500, 254], [507, 254], [507, 262], [513, 262], [513, 254], [520, 254]], o({ strokeWidth: 2.4 })));
        a.put(rc.linearPath([[680, 254], [687, 254], [687, 262], [693, 262], [693, 254], [700, 254], [700, 350]], o({ strokeWidth: 2.4 })));
        a.put(rc.rectangle(520, 190, 160, 160, o({ strokeWidth: 2.8 })));
        [[440, 300], [474, 324], [532, 302], [650, 294], [536, 330], [652, 330], [712, 298], [744, 324]].forEach(function (b) {
          a.put(rc.rectangle(b[0], b[1], 16, 8, o({ stroke: C.stone, strokeWidth: 1.6, roughness: 1 })));
        });
        // roofs
        a.plain('path', { d: 'M418,222 L465,120 L512,222 Z', fill: C.orangePale });
        a.put(rc.polygon([[418, 222], [465, 120], [512, 222]], o({ fill: C.orange, fillStyle: 'zigzag', hachureGap: 7, fillWeight: 2, strokeWidth: 2.8 })));
        a.plain('path', { d: 'M688,222 L735,120 L782,222 Z', fill: C.bluePale });
        a.put(rc.polygon([[688, 222], [735, 120], [782, 222]], o({ fill: C.blue, fillStyle: 'zigzag', hachureGap: 7, fillWeight: 2, strokeWidth: 2.8 })));
        // flags flap differently in each frame
        var w = [-4, 3, -1][a.i];
        a.put(rc.line(465, 120, 465, 80, o({ strokeWidth: 2.4 })));
        a.put(rc.path('M465,80 Q483,' + (76 + w) + ' 503,' + (88 + w / 2) + ' Q484,' + (96 + w) + ' 465,100 Z', o({ fill: C.sky, fillStyle: 'solid', strokeWidth: 2 })));
        a.put(rc.line(735, 120, 735, 80, o({ strokeWidth: 2.4 })));
        a.put(rc.path('M735,80 Q753,' + (76 - w) + ' 773,' + (88 - w / 2) + ' Q754,' + (96 - w) + ' 735,100 Z', o({ fill: C.orange, fillStyle: 'solid', strokeWidth: 2 })));
        // arched windows
        [[540, 208], [634, 208], [452, 250], [722, 250]].forEach(function (p) {
          var x = p[0], y = p[1];
          a.put(rc.path('M' + x + ',' + (y + 32) + ' L' + x + ',' + (y + 13) + ' A13,13 0 0 1 ' + (x + 26) + ',' + (y + 13) + ' L' + (x + 26) + ',' + (y + 32) + ' Z',
            o({ fill: C.skyLight, hachureGap: 5, fillWeight: 1.4, strokeWidth: 2.2 })));
          a.put(rc.line(x + 13, y, x + 13, y + 32, o({ strokeWidth: 1.6 })));
        });
        // the white crown
        var crown = [[512, 170], [528, 118], [546, 148], [564, 102], [582, 148], [600, 86], [618, 148], [636, 102], [654, 148], [672, 118], [688, 170]];
        a.plain('path', { d: 'M' + crown.map(pt).join(' L') + ' Z M512,166 H688 V196 H512 Z', fill: C.white });
        a.put(rc.polygon(crown, o({ fill: C.sunPale, hachureGap: 8, fillWeight: 1.4, strokeWidth: 2.8 })));
        a.put(rc.rectangle(512, 166, 176, 28, o({ fill: C.sun, hachureGap: 5, fillWeight: 1.8, strokeWidth: 2.8 })));
        [[528, 113], [564, 97], [600, 81], [636, 97], [672, 113]].forEach(function (p) {
          a.put(rc.circle(p[0], p[1], 12, o({ fill: C.sun, fillStyle: 'solid', strokeWidth: 2 })));
        });
        a.put(rc.circle(552, 180, 13, o({ fill: C.blue, fillStyle: 'solid', strokeWidth: 1.8 })));
        a.put(rc.polygon([[600, 170], [610, 180], [600, 190], [590, 180]], o({ fill: C.orange, fillStyle: 'solid', strokeWidth: 1.8 })));
        a.put(rc.circle(648, 180, 13, o({ fill: C.berry, fillStyle: 'solid', strokeWidth: 1.8 })));
        // twinkles: a different set in each frame
        [[486, 118], [716, 112], [548, 70], [654, 64], [600, 42]].forEach(function (p, k) {
          if ((k + a.i) % 2 === 0) a.put(rc.path(sparkle(p[0], p[1], 10), o({ fill: C.sun, fillStyle: 'solid', strokeWidth: 1.4 })));
        });
        // sign above the gate
        a.plain('path', { d: 'M556,246 H644 L652,256 L644,266 H556 L548,256 Z', fill: C.white });
        a.put(rc.polygon([[556, 246], [644, 246], [652, 256], [644, 266], [556, 266], [548, 256]], o({ fill: C.sun, hachureGap: 4, fillWeight: 1.6, strokeWidth: 2 })));
      });
      var gateD = 'M574,350 L574,298 A26,26 0 0 1 626,298 L626,350 Z';
      el('path', { d: gateD, fill: C.charcoal }, castle);
      var door = el('g', { 'class': 'door' }, castle);
      el('path', { d: gateD, fill: C.white }, door);
      boil(svg, door, function (a) {
        a.put(a.rc.path(gateD, a.o({ fill: C.blue, hachureGap: 4.5, fillWeight: 2, hachureAngle: 80, strokeWidth: 2.6 })));
        a.put(a.rc.line(591, 280, 591, 350, a.o({ strokeWidth: 1.6 })));
        a.put(a.rc.line(609, 280, 609, 350, a.o({ strokeWidth: 1.6 })));
        a.put(a.rc.circle(617, 320, 7, a.o({ fill: C.sun, fillStyle: 'solid', strokeWidth: 1.4 })));
      });
      var label = el('text', { x: 600, y: 262, 'text-anchor': 'middle', 'class': 'scene-text', 'font-size': 18 }, castle);
      label.textContent = 'come in!';

      // front hill
      var frontPts = [];
      for (var fx = -540; fx <= 1740; fx += 40) frontPts.push([fx, fh(fx)]);
      var frontD = smooth(frontPts) + ' L1740,560 L-540,560 Z';
      el('path', { d: frontD, fill: C.grassPale }, svg);
      boil(svg, svg, function (a) { a.put(a.rc.path(frontD, a.o({ fill: C.leafDeep, hachureAngle: -50, hachureGap: 7.5, fillWeight: 1.8, strokeWidth: 2.8 }))); });

      // winding path from the gate
      var cl = [[600, 350], [584, 392], [622, 440], [598, 530]], wd = [22, 38, 62, 120];
      var left = cl.map(function (p, k) { return [p[0] - wd[k] / 2, p[1]]; });
      var right = cl.map(function (p, k) { return [p[0] + wd[k] / 2, p[1]]; }).reverse();
      var pathD = 'M' + pt(left[0]) + curveThrough(left) + ' L' + pt(right[0]) + curveThrough(right) + ' Z';
      el('path', { d: pathD, fill: C.sandPale }, svg);
      boil(svg, svg, function (a) { a.put(a.rc.path(pathD, a.o({ fill: C.sand, hachureGap: 7, fillWeight: 1.4, hachureAngle: 20, strokeWidth: 2.4 }))); });

      drawLollipopTree(svg, svg, 110, 262, 62, fh(110) + 10, 7);
      drawLollipopTree(svg, svg, 1062, 292, 50, fh(1062) + 10, 13);
      drawLollipopTree(svg, svg, -260, 300, 52, fh(-260) + 10, 21);
      drawLollipopTree(svg, svg, 1450, 292, 56, fh(1450) + 10, 29);

      boil(svg, svg, function (a) {
        [[-400, C.sun], [-130, C.violet], [205, C.berry], [275, C.sun], [372, C.violet], [826, C.sky], [905, C.berry],
          [978, C.sun], [1250, C.berry], [1600, C.sky]].forEach(function (f, k) {
          drawFlower(a, f[0], fh(f[0]) + 22, f[1], k);
        });
        [-460, -320, -40, 160, 330, 470, 740, 860, 1010, 1140, 1320, 1530, 1670].forEach(function (x) { drawTuft(a, x, fh(x) + 18); });
      });

      drawButterfly(svg, svg);
    },

    /* Inner page sun (viewBox 0 0 200 200) and cloud (viewBox 0 0 200 90) */
    sun: function (svg) { drawSun(svg, svg, 100, 100, 100); },
    cloud: function (svg) { drawCloud(svg, svg, 92, 46, 76, 28, 9, '16px'); },

    /* Grassy strip under inner page heroes (viewBox 0 0 1200 96) */
    hills: function (svg) {
      var hy = function (x) { return 46 + 12 * Math.sin(TAU * x / 640); };
      var pts = [];
      for (var x = -20; x <= 1220; x += 40) pts.push([x, hy(x)]);
      var d = smooth(pts) + ' L1220,130 L-20,130 Z';
      el('path', { d: d, fill: C.grassPale }, svg);
      boil(svg, svg, function (a) {
        a.put(a.rc.path(d, a.o({ fill: C.leafDeep, hachureAngle: -50, hachureGap: 7.5, fillWeight: 1.6, strokeWidth: 2.6 })));
        [[90, C.berry], [260, C.sun], [470, C.violet], [690, C.sky], [880, C.berry], [1110, C.sun]].forEach(function (f, k) {
          drawFlower(a, f[0], hy(f[0]) + 24, f[1], k);
        });
        [170, 380, 590, 790, 990].forEach(function (x) { drawTuft(a, x, hy(x) + 22); });
      });
    },

    /* The crowned bird that flies across the sky (viewBox 0 0 130 100) */
    bird: function (svg) {
      el('ellipse', { cx: 60, cy: 58, rx: 31, ry: 21, fill: C.white }, svg);
      el('circle', { cx: 92, cy: 40, r: 19, fill: C.white }, svg);
      boil(svg, svg, function (a) {
        a.put(a.rc.polygon([[34, 52], [8, 38], [14, 55], [6, 70], [36, 64]], a.o({ fill: C.sky, hachureGap: 3.5, strokeWidth: 2 })));
        a.put(a.rc.ellipse(60, 58, 64, 44, a.o({ fill: C.sky, hachureGap: 3.5, fillWeight: 1.8, strokeWidth: 2.2 })));
        a.put(a.rc.circle(92, 40, 40, a.o({ fill: C.sky, hachureGap: 3.5, fillWeight: 1.8, strokeWidth: 2.2 })));
        a.put(a.rc.polygon([[109, 38], [126, 45], [109, 51]], a.o({ fill: C.orange, fillStyle: 'solid', strokeWidth: 2 })));
        a.put(a.rc.circle(98, 35, 15, a.o({ fill: C.white, fillStyle: 'solid', strokeWidth: 2 })));
        a.put(a.rc.circle(100, 36, 6, a.o({ fill: C.charcoal, fillStyle: 'solid', stroke: C.charcoal, strokeWidth: 1 })));
        a.put(a.rc.circle(86, 50, 8, a.o({ fill: C.berry, fillStyle: 'solid', stroke: C.berry, strokeWidth: 0.6 })));
        a.put(a.rc.polygon([[81, 24], [83, 8], [88, 16], [93, 4], [98, 16], [103, 8], [105, 24]], a.o({ fill: C.sun, fillStyle: 'solid', strokeWidth: 1.6 })));
      });
      var wing = el('g', { 'class': 'wing' }, svg);
      var wingD = 'M60,54 C48,24 28,12 16,15 C24,32 36,52 60,64 Z';
      boil(svg, wing, function (a) {
        a.plain('path', { d: wingD, fill: C.white });
        a.put(a.rc.path(wingD, a.o({ fill: C.blue, hachureGap: 3, strokeWidth: 2.2 })));
      });
    },

    /* Bunting string across the navigation (viewBox 0 0 1000 24, stretched) */
    string: function (svg) {
      var g = boil(svg, svg, function (a) {
        a.put(a.rc.curve([[0, 8], [250, 13], [500, 15], [750, 13], [1000, 8]], a.o({ strokeWidth: 2.5, roughness: 0.9 })));
      });
      nonScaling(g);
    },

    /* Clothesline for the gallery (viewBox 0 0 1000 40, stretched) */
    rope: function (svg) {
      var g = boil(svg, svg, function (a) {
        a.put(a.rc.curve([[0, 9], [250, 12], [500, 14], [750, 12], [1000, 9]], a.o({ strokeWidth: 3.4, roughness: 0.9 })));
      });
      nonScaling(g);
    },

    /* Dotted trail joining the "day" stops (viewBox 0 0 700 66, stretched) */
    trail: function (svg) {
      var pts = [];
      for (var k = 0; k < 7; k++) pts.push([50 + k * 100, k % 2 ? 66 : 0]);
      el('path', { d: smooth(pts) }, svg);
    },

    /* Chalk doodles on the footer blackboard (viewBox 0 0 300 200) */
    chalk: function (svg) {
      boil(svg, svg, function (a) {
        var o = function (x) { return a.o(Object.assign({ strokeWidth: 2.6, roughness: 1.8 }, x || {})); };
        a.put(a.rc.polygon([[150, 92], [158, 40], [180, 72], [200, 30], [220, 72], [242, 40], [250, 92]], o()));
        a.put(a.rc.rectangle(150, 92, 100, 22, o()));
        a.put(a.rc.polygon(starPoints(60, 52, 20, 8, 5), o()));
        a.put(a.rc.polygon(starPoints(276, 150, 14, 6, 5), o()));
        a.put(a.rc.polygon(starPoints(112, 162, 11, 5, 5), o()));
        a.put(a.rc.path(loopPath(30, 192, 4.5, 10, 1.6, 0.5), o({ strokeWidth: 2.2, roughness: 1 })));
        [[100, 30], [278, 40], [200, 160]].forEach(function (p, k) {
          if ((k + a.i) % 2 === 0) a.put(a.rc.path(sparkle(p[0], p[1], 8), o({ strokeWidth: 2 })));
        });
      });
    },

    /* Treasure-map style directions doodle for the contact page (viewBox 0 0 640 420) */
    map: function (svg) {
      boil(svg, svg, function (a) {
        var o = a.o, rc = a.rc;
        a.put(rc.curve([[-10, 330], [120, 300], [260, 345], [420, 300], [650, 322]], o({ stroke: C.sky, strokeWidth: 14, roughness: 1.2 })));
        a.put(rc.line(-10, 168, 650, 150, o({ strokeWidth: 2.4 })));
        a.put(rc.line(-10, 200, 650, 182, o({ strokeWidth: 2.4 })));
        a.put(rc.line(388, -10, 410, 430, o({ strokeWidth: 2.4 })));
        a.put(rc.line(420, -10, 442, 430, o({ strokeWidth: 2.4 })));
        [[80, 80], [150, 108], [250, 70], [330, 58], [560, 368], [612, 392], [300, 392], [196, 384]].forEach(function (p) {
          a.put(rc.line(p[0], p[1] + 12, p[0], p[1] + 28, o({ strokeWidth: 2.2, stroke: C.bark })));
          a.put(rc.circle(p[0], p[1], 30, o({ fill: C.leafDeep, hachureGap: 4, strokeWidth: 2 })));
        });
        [[200, 250], [272, 236]].forEach(function (p) {
          a.put(rc.rectangle(p[0], p[1], 40, 30, o({ strokeWidth: 2 })));
          a.put(rc.polygon([[p[0] - 6, p[1]], [p[0] + 20, p[1] - 22], [p[0] + 46, p[1]]], o({ fill: C.berry, hachureGap: 4, strokeWidth: 2 })));
        });
        // the castle
        a.put(rc.rectangle(470, 220, 44, 52, o({ strokeWidth: 2.4 })));
        a.put(rc.rectangle(452, 234, 18, 38, o({ strokeWidth: 2.2 })));
        a.put(rc.rectangle(514, 234, 18, 38, o({ strokeWidth: 2.2 })));
        a.put(rc.polygon([[448, 236], [461, 212], [474, 236]], o({ fill: C.orange, hachureGap: 3.5, strokeWidth: 2 })));
        a.put(rc.polygon([[510, 236], [523, 212], [536, 236]], o({ fill: C.blue, hachureGap: 3.5, strokeWidth: 2 })));
        a.put(rc.polygon([[470, 222], [473, 204], [482, 214], [492, 198], [502, 214], [511, 204], [514, 222]], o({ fill: C.sun, hachureGap: 3, strokeWidth: 2 })));
        a.put(rc.line(482, 284, 502, 304, o({ stroke: C.orangeDeep, strokeWidth: 4.5 })));
        a.put(rc.line(502, 284, 482, 304, o({ stroke: C.orangeDeep, strokeWidth: 4.5 })));
        // compass
        a.put(rc.circle(585, 70, 64, o({ strokeWidth: 2 })));
        a.put(rc.polygon([[585, 36], [593, 70], [585, 104], [577, 70]], o({ fill: C.orange, hachureGap: 3, strokeWidth: 1.8 })));
        if (a.i !== 2) a.put(rc.path(sparkle(470, 186, 9), o({ fill: C.sun, fillStyle: 'solid', strokeWidth: 1.4 })));
      });
      el('path', { d: 'M40,404 C110,396 150,362 210,330 S330,300 380,272 S452,300 490,292', fill: 'none', stroke: C.orangeDeep, 'stroke-width': 4, 'stroke-dasharray': '2 11', 'stroke-linecap': 'round' }, svg);
      var t1 = el('text', { x: 24, y: 396, 'class': 'scene-text', 'font-size': 22 }, svg); t1.textContent = 'start';
      var t2 = el('text', { x: 632, y: 304, 'text-anchor': 'end', 'class': 'scene-text', 'font-size': 24 }, svg); t2.textContent = "we're here!";
      t2.style.fill = C.orangeDeep;
      var t3 = el('text', { x: 585, y: 30, 'text-anchor': 'middle', 'class': 'scene-text', 'font-size': 20 }, svg); t3.textContent = 'N';
    }
  };

  /* ---------- draw everything on the page ---------- */
  root.querySelectorAll('svg[data-doodle]').forEach(function (svg) {
    var fn = DOODLES[svg.getAttribute('data-doodle')];
    if (fn) fn(svg);
  });
  root.querySelectorAll('svg[data-icon]').forEach(function (svg) {
    var fn = ICONS[svg.getAttribute('data-icon')];
    if (!fn) return;
    if (!svg.getAttribute('viewBox')) svg.setAttribute('viewBox', '0 0 100 100');
    boil(svg, svg, function (a) { fn(a, svg); }, svg.hasAttribute('data-static') ? 1 : 3);
  });
}
