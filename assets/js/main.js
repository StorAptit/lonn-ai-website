/* Lönn AI — scroll effects and small interactive pieces. No libraries. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---------- nav: solid on scroll, progress bar, mobile menu ---------- */
  var nav = $(".nav"), bar = $(".progress");
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle("scrolled", y > 40);
    if (bar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  var tog = $(".nav-toggle");
  if (tog) tog.addEventListener("click", function () { nav.classList.toggle("open"); });
  $$(".nav ul a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); }); });

  /* ---------- prepare line-drawing paths ---------- */
  $$(".draw").forEach(function (p) {
    try { p.style.setProperty("--len", Math.ceil(p.getTotalLength()) + 1); } catch (e) {}
  });

  /* ---------- reveal on scroll ---------- */
  var countDone = new WeakSet();
  function countUp(node) {
    if (countDone.has(node)) return;
    countDone.add(node);
    var end = parseFloat(node.getAttribute("data-count"));
    var dec = parseInt(node.getAttribute("data-dec") || "0", 10);
    var pre = node.getAttribute("data-pre") || "", suf = node.getAttribute("data-suf") || "";
    var fmt = function (v) { return pre + v.toFixed(dec).replace("-", "−") + suf; };
    if (reduce) { node.textContent = fmt(end); return; }
    var t0 = null, dur = 1400;
    function tick(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      node.textContent = fmt(end * e);
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        $$("[data-count]", en.target).forEach(countUp);
        if (en.target.hasAttribute("data-count")) countUp(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    $$(".reveal, .reveal-l, [data-observe], [data-count]").forEach(function (n) { io.observe(n); });
  } else {
    $$(".reveal, .reveal-l, [data-observe]").forEach(function (n) { n.classList.add("in"); });
    $$("[data-count]").forEach(countUp);
  }

  /* ---------- branching-route art (hero + final CTA) ---------- */
  function buildRoutes(svg, opts) {
    if (!svg) return;
    var W = 820, H = 600, n = 8, sx = 70, sy = H / 2, mx = 440, ex = 770;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    var g = el("g", {}, svg), paths = [], nodes = [];
    for (var i = 0; i < n; i++) {
      var y = 70 + i * ((H - 140) / (n - 1));
      var d = "M" + sx + "," + sy + " C" + (sx + 190) + "," + sy + " " + (mx - 190) + "," + y + " " + mx + "," + y +
              " S" + (ex - 150) + "," + sy + " " + ex + "," + sy;
      var p = el("path", { d: d, class: "route" }, g);
      paths.push(p);
      nodes.push(el("circle", { cx: mx, cy: y, r: 7, class: "node" }, g));
    }
    el("circle", { cx: sx, cy: sy, r: 15, fill: "#EAF1EC" }, g);
    var end = el("circle", { cx: ex, cy: sy, r: 15, class: "node hot" }, g);
    var pulse = el("circle", { r: 6, class: "pulse", cx: sx, cy: sy }, g);
    if (opts && opts.labels) {
      var t1 = el("text", { x: sx - 8, y: sy + 42, fill: "#8FA597", "font-size": 14, "font-family": "DM Sans, sans-serif", "text-anchor": "start" }, g); t1.textContent = "Your request";
      var t2 = el("text", { x: ex + 8, y: sy + 42, fill: "#8FA597", "font-size": 14, "font-family": "DM Sans, sans-serif", "text-anchor": "end" }, g); t2.textContent = "Answer";
    }
    var order = [3, 1, 5, 2, 6, 4, 0, 7], idx = 0, cur = order[0];
    function setHot(k) {
      paths.forEach(function (p, j) { p.classList.toggle("hot", j === k); });
      nodes.forEach(function (c, j) { c.classList.toggle("hot", j === k); c.setAttribute("r", j === k ? 10 : 7); });
    }
    setHot(cur);
    if (reduce) { pulse.style.display = "none"; return; }
    // a pulse travels along the chosen route, then the router picks another one
    var len = paths[cur].getTotalLength(), t0 = null, dur = 2300, pause = 700;
    function frame(t) {
      if (!t0) t0 = t;
      var k = (t - t0) / dur;
      if (k <= 1) {
        var e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        var pt = paths[cur].getPointAtLength(e * len);
        pulse.setAttribute("cx", pt.x); pulse.setAttribute("cy", pt.y);
        pulse.style.opacity = 1;
      } else if (k > 1 + pause / dur) {
        idx = (idx + 1) % order.length; cur = order[idx]; setHot(cur);
        len = paths[cur].getTotalLength(); t0 = t;
      } else { pulse.style.opacity = 0; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  buildRoutes($("#hero-routes"), { labels: true });
  buildRoutes($("#final-routes"));

  /* ---------- scrollytelling: how it works ---------- */
  var dg = $(".dg"), steps = $$(".step");
  if (dg && steps.length && "IntersectionObserver" in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          steps.forEach(function (s) { s.classList.remove("active"); });
          en.target.classList.add("active");
          dg.setAttribute("data-step", en.target.getAttribute("data-step"));
        }
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    steps.forEach(function (s) { so.observe(s); });
  }

  /* ---------- videos: custom play button + missing-file placeholder ---------- */
  $$(".video-frame").forEach(function (f) {
    var v = $("video", f), b = $(".play", f);
    if (!v) return;
    function missing() { f.classList.add("missing"); }
    var src = $("source", v);
    if (src) src.addEventListener("error", missing);
    v.addEventListener("error", missing);
    if (b) b.addEventListener("click", function () {
      f.classList.add("playing"); v.setAttribute("controls", "");
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    });
    v.addEventListener("play", function () { f.classList.add("playing"); v.setAttribute("controls", ""); });
  });

  /* ---------- results chart + λ dial ---------- */
  // Router at each λ: pre-study Appendix A4 (cross-fitted, with answer check).
  var LAMBDA = [
    { l: 0, acc: 89.0, cost: 6.90, vs: "+0.9 points, −9% cost", esc: 3 },
    { l: 10, acc: 89.6, cost: 3.91, vs: "+1.5 points, −48% cost", esc: 6 },
    { l: 20, acc: 85.8, cost: 1.58, vs: "−2.3 points, −79% cost", esc: 8 },
    { l: 30, acc: 84.0, cost: 1.00, vs: "−4.2 points, −87% cost", esc: 9 },
    { l: 40, acc: 82.3, cost: 0.82, vs: "−5.8 points, −89% cost", esc: 9 },
    { l: 50, acc: 81.4, cost: 0.63, vs: "−6.7 points, −92% cost", esc: 9 },
    { l: 60, acc: 81.2, cost: 0.53, vs: "−7.0 points, −93% cost", esc: 8 },
    { l: 70, acc: 81.0, cost: 0.48, vs: "−7.1 points, −94% cost", esc: 7 },
    { l: 80, acc: 80.7, cost: 0.44, vs: "−7.4 points, −94% cost", esc: 7 },
    { l: 90, acc: 80.6, cost: 0.42, vs: "−7.5 points, −94% cost", esc: 7 },
    { l: 100, acc: 80.3, cost: 0.39, vs: "−7.9 points, −95% cost", esc: 7 }
  ];
  // Single models on all 690 prompts. Sonnet and the oracle are exact (pre-study §7.4);
  // the other points are read from the report figure used in the pitch deck.
  var SINGLE = [
    { n: "gpt-oss-20b", c: 0.18, a: 70.0, dx: 10, dy: 4 },
    { n: "GLM 5.3 Flash", c: 0.37, a: 71.7, dx: 10, dy: 4 },
    { n: "gpt-oss-120b", c: 0.29, a: 75.8, dx: 10, dy: 4 },
    { n: "DeepSeek V4.1 Flash", c: 1.16, a: 78.6, dx: 10, dy: 14 },
    { n: "DeepSeek V4 Pro", c: 3.98, a: 75.5, dx: 10, dy: 4 },
    { n: "Gemini 3.8 Flash", c: 4.52, a: 85.4, dx: 10, dy: 15 },
    { n: "Muse Spark 1.3", c: 7.37, a: 84.5, dx: -10, dy: 17, end: true }
  ];
  var chart = $("#chart");
  var lp = [];
  if (chart) {
    var W = 720, H = 450, m = { l: 48, r: 16, t: 18, b: 50 };
    var X = function (c) { return m.l + (c / 8) * (W - m.l - m.r); };
    var Y = function (a) { return m.t + ((96 - a) / (96 - 66)) * (H - m.t - m.b); };
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Accuracy versus cost for single models and the Lönn Router" }, chart);
    var grid = el("g", { class: "grid axis" }, svg);
    [70, 75, 80, 85, 90, 95].forEach(function (a) {
      el("line", { x1: m.l, x2: W - m.r, y1: Y(a), y2: Y(a) }, grid);
      var t = el("text", { x: m.l - 10, y: Y(a) + 4, "text-anchor": "end" }, grid); t.textContent = a + "%";
    });
    [0, 2, 4, 6, 8].forEach(function (c) {
      var t = el("text", { x: X(c), y: H - m.b + 22, "text-anchor": "middle" }, grid); t.textContent = "$" + c;
    });
    var xt = el("text", { x: (m.l + W - m.r) / 2, y: H - 6, "text-anchor": "middle", class: "axis-title" }, svg);
    xt.textContent = "Cost to answer all 690 prompts (USD)";
    var yt = el("text", { x: m.l - 40, y: m.t - 4, class: "axis-title" }, svg); yt.textContent = "";

    // best single models (dashed frontier)
    var fr = [[0.18, 70.0], [0.29, 75.8], [1.16, 78.6], [4.52, 85.4], [7.58, 88.1]];
    el("path", { d: "M" + fr.map(function (p) { return X(p[0]) + "," + Y(p[1]); }).join(" L"), class: "frontier fade s-d", style: "--d:.5s" }, svg);
    var sg = el("g", { class: "single" }, svg);
    SINGLE.forEach(function (s, i) {
      var g = el("g", { class: "fade s-d", style: "--d:" + (0.08 * i) + "s" }, sg);
      el("circle", { cx: X(s.c), cy: Y(s.a), r: 6 }, g);
      var t = el("text", { x: X(s.c) + s.dx, y: Y(s.a) + s.dy, "text-anchor": s.end ? "end" : "start" }, g); t.textContent = s.n;
    });
    // Sonnet + oracle
    var so2 = el("g", { class: "fade s-d", style: "--d:.6s" }, svg);
    el("circle", { cx: X(7.58), cy: Y(88.1), r: 7, class: "sonnet" }, so2);
    var st = el("text", { x: X(7.58) + 4, y: Y(88.1) + 24, "text-anchor": "end", class: "tag" }, so2); st.textContent = "Claude Sonnet 5.5";
    var og = el("g", { class: "fade s-d", style: "--d:.7s" }, svg);
    el("circle", { cx: X(1.08), cy: Y(94.1), r: 6.5, class: "oracle" }, og);
    var ot = el("text", { x: X(1.08) + 13, y: Y(94.1) + 4, class: "tag", style: "font-weight:500;fill:#5F6E64" }, og); ot.textContent = "Oracle (perfect hindsight)";

    // router curve, drawn on scroll
    var pts = LAMBDA.slice().sort(function (a, b) { return a.cost - b.cost; });
    var curve = el("path", { d: "M" + pts.map(function (p) { return X(p.cost).toFixed(1) + "," + Y(p.acc).toFixed(1); }).join(" L"), class: "curve draw", style: "--d:.9s" }, svg);
    try { curve.style.setProperty("--len", Math.ceil(curve.getTotalLength()) + 1); } catch (e) {}
    var lg = el("g", { class: "fade s-d", style: "--d:2.2s" }, svg);
    LAMBDA.forEach(function (p, i) {
      var c = el("circle", { cx: X(p.cost), cy: Y(p.acc), r: 5.5, class: "lp", "data-i": i }, lg);
      var ti = el("title", {}, c); ti.textContent = "λ = " + p.l + ": " + p.acc + "% correct, $" + p.cost.toFixed(2);
      c.addEventListener("click", function () { setLambda(i); });
      lp.push(c);
    });
    var rl = el("text", { x: X(3.91) - 4, y: Y(89.6) - 16, class: "tag g", "text-anchor": "middle" }, lg); rl.textContent = "Lönn Router";
    var bracket = el("text", { x: X(2.6), y: Y(91.7), class: "tag", "text-anchor": "middle", style: "fill:#1E6B3C;font-weight:500" }, lg);
    bracket.textContent = "";
  }
  var range = $("#lambda");
  function setLambda(i) {
    var p = LAMBDA[i];
    if (!p) return;
    if (range) { range.value = i; range.style.setProperty("--p", (i / (LAMBDA.length - 1)) * 100 + "%"); }
    var q = function (s) { return document.getElementById(s); };
    if (q("r-lam")) q("r-lam").textContent = p.l + (p.l === 20 ? " (default)" : "");
    if (q("r-acc")) q("r-acc").textContent = p.acc.toFixed(1) + "%";
    if (q("r-cost")) q("r-cost").textContent = "$" + p.cost.toFixed(2);
    if (q("r-vs")) q("r-vs").textContent = p.vs;
    if (q("r-esc")) q("r-esc").textContent = p.esc + "% of requests";
    lp.forEach(function (c, j) { c.classList.toggle("on", j === i); c.setAttribute("r", j === i ? 8 : 5.5); });
  }
  if (range) {
    range.addEventListener("input", function () { setLambda(parseInt(range.value, 10)); });
    setLambda(parseInt(range.value, 10));
  }

  /* ---------- pre-study: table-of-contents scroll spy ---------- */
  var toc = $$(".toc a");
  if (toc.length && "IntersectionObserver" in window) {
    var map = {};
    toc.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var to = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          toc.forEach(function (a) { a.classList.remove("active"); });
          map[en.target.id].classList.add("active");
        }
      });
    }, { rootMargin: "-30% 0px -65% 0px" });
    $$(".ps-sec[id]").forEach(function (s) { to.observe(s); });
  }
})();
