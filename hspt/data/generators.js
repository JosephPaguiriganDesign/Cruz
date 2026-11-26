// Seeded HSPT-style items. make(type, seed) is deterministic.
// A canonical signature (computed in select.js from the stem, answer, or word)
// keeps the same item from being served twice.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HSPT_GEN = api;
})(typeof window !== "undefined" ? window : null, function () {
  var cachedWords = null;
  var CONCRETE = ["ladder", "marble", "canyon", "pencil", "harbor", "saddle", "comet", "bucket", "lantern", "orchard", "anchor", "velvet"];

  function loadWords() {
    if (cachedWords) return cachedWords;
    var rows = [];
    if (typeof window !== "undefined" && window.HSPT_VOCAB && window.HSPT_VOCAB.length) {
      rows = window.HSPT_VOCAB.map(function (c) {
        return { word: c.word, def: c.def, syn: c.syn, ant: c.ant, example: c.example };
      });
    } else if (typeof require === "function") {
      rows = require("../tools/words.js").map(function (r) {
        return { word: r[0], def: r[1], syn: r[2], ant: r[3], example: r[4] };
      });
    }
    cachedWords = rows;
    return rows;
  }

  function hash(s) {
    var h = 2166136261;
    var text = String(s);
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function shuffle(arr, seed) {
    var a = (hash(seed) || 1) >>> 0;
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      a = (a * 1664525 + 1013904223) >>> 0;
      var j = Math.floor((a / 4294967296) * (i + 1));
      var t = copy[i];
      copy[i] = copy[j];
      copy[j] = t;
    }
    return copy;
  }

  function ipow(base, exp) {
    var v = 1;
    for (var i = 0; i < exp; i++) v *= base;
    return v;
  }

  function cap(s) {
    s = String(s);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function distinctNums(correct, candidates) {
    var out = [];
    var seen = {};
    seen[String(correct)] = true;
    function push(v) {
      if (typeof v !== "number" || !isFinite(v)) return;
      var key = String(v);
      if (seen[key]) return;
      seen[key] = true;
      out.push(v);
    }
    for (var i = 0; i < candidates.length; i++) push(candidates[i]);
    var bump = 1;
    while (out.length < 3 && bump < 40) {
      push(correct + bump * 3 + 4);
      if (out.length < 3) push(correct - bump * 3 - 4);
      bump += 1;
    }
    return out.length >= 3 ? out.slice(0, 3) : null;
  }

  function pack(correctText, wrongTexts, id) {
    if (correctText == null || wrongTexts == null || wrongTexts.length < 2) return null;
    var all = [String(correctText)].concat(wrongTexts.map(String));
    var seen = {};
    for (var i = 0; i < all.length; i++) {
      if (!all[i] || all[i] === "NaN" || all[i] === "undefined" || all[i].indexOf("NaN") >= 0 || all[i].indexOf("undefined") >= 0) return null;
      if (seen[all[i]]) return null;
      seen[all[i]] = true;
    }
    var choices = all.length === 3 ? all.slice() : shuffle(all, id);
    if (all.length === 3) choices = all.slice();
    var answer = choices.indexOf(String(correctText));
    if (answer < 0) return null;
    return { choices: choices, answer: answer };
  }

  function packShuffled(correctText, wrongTexts, id) {
    if (!wrongTexts || wrongTexts.length !== 3) return null;
    var all = [String(correctText)].concat(wrongTexts.map(String));
    var seen = {};
    for (var i = 0; i < all.length; i++) {
      if (all[i] == null || all[i] === "" || String(all[i]).indexOf("NaN") >= 0 || String(all[i]).indexOf("undefined") >= 0) return null;
      if (seen[all[i]]) return null;
      seen[all[i]] = true;
    }
    var choices = shuffle(all, id);
    return { choices: choices, answer: choices.indexOf(String(correctText)) };
  }

  function emit(spec) {
    if (!spec.packed) return null;
    if (!spec.stem || !spec.explanation) return null;
    if (spec.explanation.indexOf("NaN") >= 0 || spec.explanation.indexOf("undefined") >= 0) return null;
    if (spec.stem.indexOf("NaN") >= 0 || spec.stem.indexOf("undefined") >= 0) return null;
    return {
      id: spec.id,
      section: spec.section,
      type: spec.type,
      stem: spec.stem,
      choices: spec.packed.choices,
      answer: spec.packed.answer,
      explanation: spec.explanation,
      passageId: null,
      word: spec.word || null,
      mock: 0,
      meta: spec.meta || null
    };
  }

  function gid(type, seed) {
    return "g~" + type + "~" + seed;
  }

  function parseGenId(id) {
    if (!id || id.indexOf("g~") !== 0) return null;
    var rest = id.slice(2);
    var cut = rest.lastIndexOf("~");
    if (cut <= 0) return null;
    var type = rest.slice(0, cut);
    var seed = Number(rest.slice(cut + 1));
    if (!isFinite(seed)) return null;
    return { type: type, seed: seed };
  }

  function numItem(type, section, seed, correct, wrongNums, stem, explanation, meta) {
    var wrongs = distinctNums(correct, wrongNums);
    if (!wrongs) return null;
    var packed = packShuffled(String(correct), wrongs.map(String), gid(type, seed));
    if (!packed) return null;
    meta = meta || {};
    meta.value = correct;
    return emit({
      id: gid(type, seed),
      section: section,
      type: type,
      stem: stem,
      packed: packed,
      explanation: explanation,
      meta: meta
    });
  }

  function seriesTerms(op, start, step, gap, grow) {
    var terms = [];
    if (op === "add") {
      for (var i = 0; i < 5; i++) terms.push(start + i * step);
      return { terms: terms, next: start + 5 * step };
    }
    if (op === "sub") {
      for (var j = 0; j < 5; j++) terms.push(start - j * step);
      return { terms: terms, next: start - 5 * step };
    }
    var t = start;
    terms.push(t);
    for (var k = 0; k < 4; k++) {
      t = t + gap + k * grow;
      terms.push(t);
    }
    return { terms: terms, next: terms[4] + gap + 4 * grow };
  }

  function makeSeries(seed) {
    if (seed < 0 || seed >= 2000) return null;
    var op, start, step, gap, grow, why;
    if (seed < 800) {
      op = "add";
      start = 1 + (seed % 40);
      step = 2 + Math.floor(seed / 40);
      why = "Each term adds " + step + ".";
    } else if (seed < 1600) {
      var index = seed - 800;
      op = "sub";
      step = 2 + (index % 16);
      start = 90 + Math.floor(index / 16);
      why = "Each term subtracts " + step + ".";
    } else {
      var g = seed - 1600;
      op = "gaps";
      start = 1 + (g % 20);
      gap = 2 + (Math.floor(g / 20) % 5);
      grow = 2 + Math.floor(g / 100);
      why = "The gaps grow by " + grow + " each time, starting with a gap of " + gap + ".";
    }
    var built = seriesTerms(op, start, step, gap, grow);
    if (built.next <= 0 || built.terms[0] <= 0) return null;
    for (var i = 1; i < built.terms.length; i++) {
      if (built.terms[i] === built.terms[i - 1]) return null;
    }
    var stem = "What is the next number in the series?\n\n" + built.terms.join(", ") + ", ____";
    var explanation = why + " After " + built.terms[4] + ", the next term is " + built.next + ".";
    return numItem("series", "quant", seed, built.next, [built.next + (step || grow || 2), built.next - (step || grow || 2), built.next + 1, built.terms[4]], stem, explanation, {
      op: op,
      start: start,
      step: step || 0,
      gap: gap || 0,
      grow: grow || 0,
      terms: built.terms,
      next: built.next
    });
  }

  var CMP = [
    "The amount in Column A is greater.",
    "The amount in Column B is greater.",
    "The two amounts are equal."
  ];

  function cmpItem(seed, aText, bText, av, bv, why, meta) {
    if (!isFinite(av) || !isFinite(bv)) return null;
    var answer = 2;
    if (av > bv) answer = 0;
    else if (av < bv) answer = 1;
    meta.av = av;
    meta.bv = bv;
    meta.op = meta.op || "cmp";
    return emit({
      id: gid("comparison", seed),
      section: "quant",
      type: "comparison",
      stem: "Compare the two amounts.\n\nColumn A: " + aText + "\nColumn B: " + bText,
      packed: { choices: CMP.slice(), answer: answer },
      explanation: why,
      meta: meta
    });
  }

  function makeComparison(seed) {
    if (seed < 0 || seed >= 2000) return null;
    var family = seed % 4;
    var index = Math.floor(seed / 4);
    var pcts = [10, 20, 25, 50, 75];
    if (family === 0) {
      var p = pcts[index % 5];
      var q = pcts[Math.floor(index / 5) % 5];
      var n = 20 * (1 + (Math.floor(index / 25) % 10));
      var m = 20 * (1 + Math.floor(index / 250));
      var av = (p * n) / 100;
      var bv = (q * m) / 100;
      return cmpItem(seed, p + "% of " + n, q + "% of " + m, av, bv,
        p + "% of " + n + " is " + av + ". " + q + "% of " + m + " is " + bv + ".",
        { op: "percent", p: p, n: n, q: q, m: m });
    }
    if (family === 1) {
      var a = 1 + (index % 5);
      var b = 2 + (Math.floor(index / 5) % 5);
      var c = 1 + (Math.floor(index / 25) % 5);
      var d = 2 + (Math.floor(index / 125) % 4);
      var left = a * d;
      var right = c * b;
      return cmpItem(seed, a + "/" + b, c + "/" + d, left, right,
        "Cross multiply. " + a + " × " + d + " = " + left + " and " + c + " × " + b + " = " + right + ".",
        { op: "fraction", a: a, b: b, c: c, d: d });
    }
    if (family === 2) {
      var l1 = 2 + (index % 5);
      var w1 = 2 + (Math.floor(index / 5) % 5);
      var l2 = 2 + (Math.floor(index / 25) % 5);
      var w2 = 2 + (Math.floor(index / 125) % 4);
      return cmpItem(seed, "Area of a " + l1 + " by " + w1 + " rectangle", "Area of a " + l2 + " by " + w2 + " rectangle", l1 * w1, l2 * w2,
        "Areas: " + l1 + " × " + w1 + " = " + (l1 * w1) + " and " + l2 + " × " + w2 + " = " + (l2 * w2) + ".",
        { op: "area", l1: l1, w1: w1, l2: l2, w2: w2 });
    }
    var s = 3 + (index % 10);
    var l = 2 + (Math.floor(index / 10) % 10);
    var w = 2 + Math.floor(index / 100);
    var pa = 4 * s;
    var pb = 2 * (l + w);
    return cmpItem(seed, "Perimeter of a square with side " + s, "Perimeter of a " + l + " by " + w + " rectangle", pa, pb,
      "Square: 4 × " + s + " = " + pa + ". Rectangle: 2 × (" + l + " + " + w + ") = " + pb + ".",
      { op: "perim", s: s, l: l, w: w });
  }

  function makeNumberSense(seed) {
    if (seed < 0 || seed >= 2000) return null;
    var family = seed % 4;
    var index = Math.floor(seed / 4);
    var pcts = [10, 20, 25, 50, 75];
    if (family === 0) {
      var n = 20 * (1 + (index % 100));
      var p = pcts[Math.floor(index / 100)];
      var value = (p * n) / 100;
      return numItem("number-sense", "quant", seed, value, [value + 2, value - 2, value + p, n],
        "What number is " + p + "% of " + n + "?",
        p + "% of " + n + " is " + n + " × " + p + "/100 = " + value + ".",
        { op: "percent-of", p: p, n: n });
    }
    if (family === 1) {
      var whole = 20 * (1 + (index % 100));
      var pp = pcts[Math.floor(index / 100)];
      var part = (pp * whole) / 100;
      var wrongs = distinctNums(pp, [pp + 10, pp - 10, 100 - pp, pp + 5, 50]);
      if (!wrongs) return null;
      var packed = packShuffled(pp + "%", wrongs.map(function (x) { return x + "%"; }), gid("number-sense", seed));
      return emit({
        id: gid("number-sense", seed),
        section: "quant",
        type: "number-sense",
        stem: "What percent of " + whole + " is " + part + "?",
        packed: packed,
        explanation: part + " ÷ " + whole + " = " + pp + "/100, which is " + pp + "%.",
        meta: { op: "what-percent", whole: whole, p: pp, part: part, value: pp }
      });
    }
    if (family === 2) {
      var low = 1 + (index % 40);
      var gap = 2 + 2 * Math.floor(index / 40);
      var high = low + gap;
      var mid = low + gap / 2;
      return numItem("number-sense", "quant", seed, mid, [low, high, mid + gap, mid - 1],
        "Which number is halfway between " + low + " and " + high + "?",
        "The halfway point is the average: (" + low + " + " + high + ") / 2 = " + mid + ".",
        { op: "halfway", low: low, high: high });
    }
    var baseN = 1 + (index % 50);
    var plus = 3 + Math.floor(index / 50);
    var twice = 2 * baseN + plus;
    return numItem("number-sense", "quant", seed, twice, [baseN + plus, 2 * baseN, twice + 2, baseN * plus],
      "Which number is " + plus + " more than twice " + baseN + "?",
      "Twice " + baseN + " is " + (2 * baseN) + ". Add " + plus + " to get " + twice + ".",
      { op: "twice-plus", n: baseN, plus: plus });
  }

  function makeProblem(seed) {
    if (seed < 0 || seed >= 2000) return null;
    var family = seed % 10;
    var index = Math.floor(seed / 10);
    var id = gid("problem", seed);
    if (family === 0) {
      var x = index % 20;
      var a = 3 + Math.floor(index / 20);
      var b = x + a;
      return numItem("problem", "math", seed, x, [x + 1, x - 1, b, a],
        "Solve for x: x + " + a + " = " + b + ".",
        "Subtract " + a + " from both sides. x = " + b + " − " + a + " = " + x + ".",
        { op: "eq-add", x: x, a: a });
    }
    if (family === 1) {
      var xs = 30 + (index % 10);
      var asub = 2 + Math.floor(index / 10);
      var right = xs - asub;
      return numItem("problem", "math", seed, xs, [right, xs + asub, asub, xs - 1],
        "Solve for x: x - " + asub + " = " + right + ".",
        "Add " + asub + " to both sides. x = " + right + " + " + asub + " = " + xs + ".",
        { op: "eq-sub", x: xs, a: asub });
    }
    if (family === 2) {
      var am = 2 + (index % 8);
      var xm = 3 + Math.floor(index / 8);
      var prod = am * xm;
      return numItem("problem", "math", seed, xm, [prod, am, xm + am, prod - am],
        "Solve for x: " + am + "x = " + prod + ".",
        "Divide both sides by " + am + ". x = " + prod + " ÷ " + am + " = " + xm + ".",
        { op: "eq-mul", a: am, x: xm });
    }
    if (family === 3) {
      var at = 2 + (index % 5);
      var xt = 1 + (Math.floor(index / 5) % 8);
      var bt = 1 + Math.floor(index / 40);
      var ct = at * xt + bt;
      return numItem("problem", "math", seed, xt, [ct, ct - bt, xt + bt, at],
        "Solve for x: " + at + "x + " + bt + " = " + ct + ".",
        "Subtract " + bt + " to get " + at + "x = " + (ct - bt) + ". Divide by " + at + ". x = " + xt + ".",
        { op: "eq-two", a: at, x: xt, b: bt });
    }
    if (family === 4) {
      var ai = 2 + (index % 4);
      var boundary = 3 + (Math.floor(index / 4) % 10);
      var bi = 1 + Math.floor(index / 40);
      var ci = ai * boundary + bi;
      var correct = "x < " + boundary;
      var wrongs = ["x > " + boundary, "x < " + (boundary + 1), "x < " + (boundary - 1)];
      var packed = packShuffled(correct, wrongs, id);
      return emit({
        id: id,
        section: "math",
        type: "problem",
        stem: "Which inequality is equivalent to " + ai + "x + " + bi + " < " + ci + "?",
        packed: packed,
        explanation: "Subtract " + bi + " to get " + ai + "x < " + (ci - bi) + ". Divide by " + ai + ". x < " + boundary + ".",
        meta: { op: "ineq", a: ai, boundary: boundary, b: bi, value: boundary }
      });
    }
    if (family === 5) {
      var ar = 2 + (index % 5);
      var br = 3 + (Math.floor(index / 5) % 8);
      var k = 2 + Math.floor(index / 40);
      var cr = ar * k;
      var nr = br * k;
      return numItem("problem", "math", seed, nr, [cr, br, k, nr + ar],
        "The ratio " + ar + " to " + br + " equals the ratio " + cr + " to n. What is n?",
        ar + " × " + k + " = " + cr + ", so " + br + " × " + k + " = " + nr + ". n = " + nr + ".",
        { op: "ratio", a: ar, b: br, k: k });
    }
    if (family === 6) {
      var prices = [20, 40, 60, 80, 100, 120, 140, 160, 180, 200];
      var pctList = [10, 20, 25, 50];
      var names = ["jacket", "backpack", "helmet", "trumpet", "calculator"];
      var price = prices[index % 10];
      var pct = pctList[Math.floor(index / 10) % 4];
      var name = names[Math.floor(index / 40)];
      var sale = price * (100 - pct) / 100;
      var wrongVals = distinctNums(sale, [price, sale + pct, price - pct, sale - 1]);
      if (!wrongVals) return null;
      var packedD = packShuffled("$" + sale, wrongVals.map(function (v) { return "$" + v; }), id);
      return emit({
        id: id,
        section: "math",
        type: "problem",
        stem: "A " + name + " costs $" + price + ". It is discounted " + pct + "%. What is the sale price?",
        packed: packedD,
        explanation: pct + "% of " + price + " is " + (price - sale) + ". " + price + " − " + (price - sale) + " = " + sale + ".",
        meta: { op: "discount", price: price, pct: pct, name: name, value: sale }
      });
    }
    if (family === 7) {
      var ao = 1 + (index % 12);
      var bo = 2 + (Math.floor(index / 12) % 8);
      var co = 2 + Math.floor(index / 96);
      var value = ao + bo * co;
      return numItem("problem", "math", seed, value, [(ao + bo) * co, ao * bo + co, ao * bo * co, ao + bo + co],
        "What is " + ao + " + " + bo + " × " + co + "?",
        "Multiply first: " + bo + " × " + co + " = " + (bo * co) + ". Then add " + ao + ". The result is " + value + ".",
        { op: "ops", a: ao, b: bo, c: co });
    }
    if (family === 8) {
      var base;
      var exp;
      var add;
      if (index < 160) {
        base = 2 + (index % 10);
        exp = 2;
        add = Math.floor(index / 10);
      } else {
        var sub = index - 160;
        var powers = [[2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8], [3, 3], [3, 4], [3, 5], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3]];
        var pair = powers[Math.floor(sub / 3)];
        base = pair[0];
        exp = pair[1];
        add = sub % 3;
      }
      var powv = ipow(base, exp) + add;
      var shown = exp === 2 ? base + "²" : base + "^" + exp;
      var stem = add === 0 ? "What is " + shown + "?" : "What is " + shown + " + " + add + "?";
      return numItem("problem", "math", seed, powv, [ipow(base, exp), powv + base, powv - add - 1, base * exp + add],
        stem,
        shown + " = " + ipow(base, exp) + (add ? " and " + ipow(base, exp) + " + " + add + " = " + powv : "") + ". The value is " + powv + ".",
        { op: "expon", base: base, exp: exp, add: add });
    }
    var r = 15 + (index % 12) * 5;
    var t = 2 + Math.floor(index / 12);
    var miles = r * t;
    return numItem("problem", "math", seed, miles, [r + t, r * t + r, t, miles - r],
      "A bus travels " + r + " miles per hour for " + t + " hours. How many miles does it travel?",
      "Distance = rate × time = " + r + " × " + t + " = " + miles + ".",
      { op: "rate", r: r, t: t });
  }

  function makeGeometry(seed) {
    if (seed < 0 || seed >= 2000) return null;
    var family = seed % 4;
    var index = Math.floor(seed / 4);
    if (family === 0) {
      var l = 4 + (index % 20);
      var w = 3 + Math.floor(index / 20);
      var area = l * w;
      return numItem("geometry", "math", seed, area, [2 * (l + w), l + w, area + l, area - w],
        "A rectangle is " + l + " cm long and " + w + " cm wide. What is its area in square centimeters?",
        "Area = length × width = " + l + " × " + w + " = " + area + ".",
        { op: "rect-area", l: l, w: w });
    }
    if (family === 1) {
      var lp = 4 + (index % 20);
      var wp = 3 + Math.floor(index / 20);
      var per = 2 * (lp + wp);
      return numItem("geometry", "math", seed, per, [lp * wp, lp + wp, per + 2, per - 2],
        "A rectangle is " + lp + " inches long and " + wp + " inches wide. What is its perimeter in inches?",
        "Perimeter = 2 × (" + lp + " + " + wp + ") = " + per + ".",
        { op: "rect-perim", l: lp, w: wp });
    }
    if (family === 2) {
      var base = 2 * (1 + (index % 20));
      var height = 2 + Math.floor(index / 20);
      var tri = base * height / 2;
      return numItem("geometry", "math", seed, tri, [base * height, base + height, tri + base, tri - 1],
        "A triangle has a base of " + base + " cm and a height of " + height + " cm. What is its area in square centimeters?",
        "Area = (base × height) / 2 = (" + base + " × " + height + ") / 2 = " + tri + ".",
        { op: "tri-area", base: base, height: height });
    }
    if (index < 179) {
      var angle = 1 + index;
      var supp = 180 - angle;
      return numItem("geometry", "math", seed, supp, [angle, 90, 360 - angle, supp + 10],
        "Two angles form a straight line. One measures " + angle + "°. What is the other angle?",
        "Angles on a straight line add to 180°. 180 − " + angle + " = " + supp + ".",
        { op: "supplement", angle: angle });
    }
    var sub = index - 179;
    var aa = 20 + (sub % 15);
    var bb = 30 + Math.floor(sub / 15);
    var third = 180 - aa - bb;
    return numItem("geometry", "math", seed, third, [aa + bb, 180, aa, bb],
      "Two angles of a triangle measure " + aa + "° and " + bb + "°. What is the third angle?",
      "The angles of a triangle add to 180°. 180 − " + aa + " − " + bb + " = " + third + ".",
      { op: "tri-angle", a: aa, b: bb });
  }

  function fillWrongs(correct, preferred) {
    var out = [];
    var seen = {};
    seen[String(correct)] = true;
    function push(w) {
      if (w == null || w === "" || seen[w]) return;
      seen[w] = true;
      out.push(w);
    }
    preferred.forEach(push);
    var k = 0;
    while (out.length < 3 && k < CONCRETE.length * 2) {
      push(CONCRETE[k % CONCRETE.length]);
      k += 1;
    }
    return out.length >= 3 ? out.slice(0, 3) : null;
  }

  function wordAt(seed) {
    var words = loadWords();
    if (!words.length) return null;
    return { words: words, row: words[seed % words.length], n: words.length };
  }

  function makeSynonym(seed) {
    var found = wordAt(seed);
    if (!found) return null;
    var w = found.row;
    var wrongs = fillWrongs(w.syn, [w.ant]);
    if (!wrongs) return null;
    var packed = packShuffled(w.syn, wrongs, gid("synonym", seed));
    return emit({
      id: gid("synonym", seed),
      section: "verbal",
      type: "synonym",
      stem: "Which word is closest in meaning to " + w.word.toUpperCase() + "?",
      packed: packed,
      explanation: w.word.toUpperCase() + " means " + w.def + ". " + cap(w.syn) + " is the closest choice. Example: " + w.example,
      word: w.word,
      meta: { kind: "syn", op: "syn", word: w.word, syn: w.syn }
    });
  }

  function makeAntonym(seed) {
    var found = wordAt(seed);
    if (!found) return null;
    var w = found.row;
    var wrongs = fillWrongs(w.ant, [w.syn]);
    if (!wrongs) return null;
    var packed = packShuffled(w.ant, wrongs, gid("antonym", seed));
    return emit({
      id: gid("antonym", seed),
      section: "verbal",
      type: "antonym",
      stem: "Which word is most nearly the opposite of " + w.word.toUpperCase() + "?",
      packed: packed,
      explanation: "The opposite of " + w.word + " (" + w.def + ") is " + w.ant + ".",
      word: w.word,
      meta: { kind: "ant", op: "ant", word: w.word, ant: w.ant }
    });
  }

  function makeContext(seed) {
    var found = wordAt(seed);
    if (!found) return null;
    var w = found.row;
    var other = found.words[(seed + 7) % found.n];
    var other2 = found.words[(seed + 19) % found.n];
    var wrongs = fillWrongs(w.def, ["the opposite of " + w.def, other.def, other2.def]);
    if (!wrongs) return null;
    var packed = packShuffled(w.def, wrongs, gid("vocab-context", seed));
    return emit({
      id: gid("vocab-context", seed),
      section: "reading",
      type: "vocab-context",
      stem: "Read the sentence. What does " + w.word.toUpperCase() + " mean?\n\n\"" + w.example + "\"",
      packed: packed,
      explanation: "In the sentence, " + w.word + " means " + w.def + ".",
      word: w.word,
      meta: { kind: "context", op: "context", word: w.word, def: w.def }
    });
  }

  var HAND = [
    ["glove", "hand", "helmet", "head", "Clothing or gear is matched with the body part it protects.", "foot", "hat", "sport"],
    ["author", "book", "chef", "meal", "A maker is matched with what that person produces.", "kitchen", "spoon", "menu"],
    ["seed", "tree", "acorn", "oak", "A beginning form is matched with the plant that grows from it.", "leaf", "forest", "nut"],
    ["minute", "hour", "inch", "foot", "A smaller unit is matched with a larger unit of the same kind.", "clock", "ruler", "yard"],
    ["thirsty", "drink", "sleepy", "rest", "A need is matched with what answers it.", "pillow", "night", "yawn"],
    ["knife", "cut", "broom", "sweep", "A tool is matched with its action.", "floor", "dust", "handle"],
    ["puppy", "dog", "kitten", "cat", "A young animal is matched with the adult.", "milk", "pet", "paw"],
    ["teacher", "classroom", "captain", "ship", "A person is matched with the place that person directs.", "ocean", "uniform", "student"],
    ["winter", "cold", "summer", "hot", "A season is matched with its usual temperature.", "snow", "sun", "July"],
    ["painter", "brush", "writer", "pen", "A worker is matched with the tool used to make the work.", "canvas", "ink", "desk"],
    ["flock", "birds", "school", "fish", "A group word is matched with the animals in that group.", "water", "nest", "net"],
    ["toe", "foot", "finger", "hand", "A smaller part is matched with the limb it belongs to.", "glove", "ring", "arm"],
    ["doctor", "hospital", "librarian", "library", "A worker is matched with the usual workplace.", "book", "nurse", "quiet"],
    ["bread", "bakery", "book", "printer", "A product is matched with the place that produces it.", "oven", "page", "shelf"],
    ["cowardice", "courage", "noise", "silence", "A thing is matched with its opposite.", "shout", "fear", "music"],
    ["petal", "flower", "page", "book", "A part is matched with the whole it belongs to.", "read", "stem", "title"],
    ["oar", "row", "pedal", "cycle", "The part a person pushes is matched with the action.", "boat", "bike", "wheel"],
    ["thermometer", "temperature", "scale", "weight", "A tool is matched with what it measures.", "fever", "heavy", "number"],
    ["drought", "water", "darkness", "light", "A lack is matched with the thing that is missing.", "desert", "lamp", "night"],
    ["chorus", "sing", "team", "play", "A group is matched with its action.", "song", "coach", "score"],
    ["cub", "bear", "fawn", "deer", "The young is matched with the adult animal.", "zoo", "forest", "paw"],
    ["salty", "pretzel", "sweet", "honey", "A taste is matched with a food known for it.", "snack", "bee", "sour"],
    ["roof", "house", "lid", "pot", "A cover is matched with what it covers.", "kitchen", "tile", "steam"],
    ["pilot", "plane", "driver", "bus", "A person is matched with the vehicle that person guides.", "sky", "ticket", "road"]
  ];

  function makeAnalogy(seed) {
    if (seed < 0 || seed >= 2000) return null;
    if (seed < HAND.length) {
      var row = HAND[seed];
      var wrongs = fillWrongs(row[3], [row[5], row[6], row[7]]);
      if (!wrongs) return null;
      var packed = packShuffled(row[3], wrongs, gid("analogy", seed));
      return emit({
        id: gid("analogy", seed),
        section: "verbal",
        type: "analogy",
        stem: cap(row[0]) + " is to " + row[1] + " as " + row[2] + " is to ____.",
        packed: packed,
        explanation: row[4] + " So " + row[2] + " goes with " + row[3] + ".",
        meta: { op: "hand", key: row[0] + "|" + row[1] + "|" + row[2] + "|" + row[3], correct: row[3] }
      });
    }
    var words = loadWords();
    if (words.length < 2) return null;
    var index = seed - HAND.length;
    var mode = index % 2;
    var pair = Math.floor(index / 2);
    var n = words.length;
    var i = pair % n;
    var j0 = Math.floor(pair / n) % (n - 1);
    var j = j0 >= i ? j0 + 1 : j0;
    var a = words[i];
    var b = words[j];
    if (mode === 0) {
      var wrongsS = fillWrongs(b.syn, [b.ant, a.syn]);
      if (!wrongsS) return null;
      var packedS = packShuffled(b.syn, wrongsS, gid("analogy", seed));
      return emit({
        id: gid("analogy", seed),
        section: "verbal",
        type: "analogy",
        stem: cap(a.word) + " is to " + a.syn + " as " + b.word + " is to ____.",
        packed: packedS,
        explanation: "The first pair are synonyms. " + cap(b.word) + " means " + b.def + ", so the synonym is " + b.syn + ".",
        meta: { op: "syn-pair", a: a.word, b: b.word, correct: b.syn }
      });
    }
    var wrongsA = fillWrongs(b.ant, [b.syn, a.ant]);
    if (!wrongsA) return null;
    var packedA = packShuffled(b.ant, wrongsA, gid("analogy", seed));
    return emit({
      id: gid("analogy", seed),
      section: "verbal",
      type: "analogy",
      stem: cap(a.word) + " is to " + a.ant + " as " + b.word + " is to ____.",
      packed: packedA,
      explanation: "The first pair are antonyms. The opposite of " + b.word + " (" + b.def + ") is " + b.ant + ".",
      meta: { op: "ant-pair", a: a.word, b: b.word, correct: b.ant }
    });
  }

  var CLUSTERS = [
    { name: "trees", words: ["oak", "maple", "birch", "cedar"] },
    { name: "flowers", words: ["tulip", "daisy", "rose", "violet"] },
    { name: "coins", words: ["penny", "nickel", "dime", "quarter"] },
    { name: "ball sports", words: ["soccer", "basketball", "tennis", "baseball"] },
    { name: "instruments", words: ["flute", "violin", "drum", "trumpet"] },
    { name: "months", words: ["January", "March", "July", "October"] },
    { name: "days", words: ["Monday", "Wednesday", "Friday", "Sunday"] },
    { name: "fish", words: ["shark", "trout", "salmon", "tuna"] },
    { name: "utensils", words: ["spoon", "fork", "knife", "ladle"] },
    { name: "units of length", words: ["inch", "foot", "yard", "mile"] },
    { name: "units of weight", words: ["ounce", "pound", "gram", "ton"] },
    { name: "colors", words: ["red", "blue", "yellow", "green"] },
    { name: "cold-weather clothes", words: ["jacket", "scarf", "mitten", "coat"] },
    { name: "boats", words: ["canoe", "kayak", "raft", "rowboat"] },
    { name: "tools", words: ["hammer", "saw", "wrench", "drill"] },
    { name: "kinds of writing", words: ["poem", "novel", "essay", "fable"] },
    { name: "gases", words: ["hydrogen", "oxygen", "nitrogen", "helium"] },
    { name: "operations", words: ["addition", "subtraction", "multiplication", "division"] },
    { name: "bird features", words: ["beak", "feather", "wing", "talon"] },
    { name: "lawmaking bodies", words: ["senate", "congress", "parliament", "legislature"] },
    { name: "figures of speech", words: ["metaphor", "simile", "personification", "hyperbole"] },
    { name: "oceans", words: ["Pacific", "Atlantic", "Indian", "Arctic"] },
    { name: "meals", words: ["breakfast", "lunch", "dinner", "supper"] },
    { name: "planets", words: ["Mercury", "Venus", "Mars", "Jupiter"] }
  ];

  function makeClassification(seed) {
    if (seed < 0 || seed >= 2000) return null;
    var drop = seed % 4;
    var oddI = Math.floor(seed / 4) % 4;
    var main = Math.floor(seed / 16) % CLUSTERS.length;
    var oddC0 = Math.floor(seed / (16 * CLUSTERS.length)) % (CLUSTERS.length - 1);
    var oddC = oddC0 >= main ? oddC0 + 1 : oddC0;
    var group = CLUSTERS[main];
    var other = CLUSTERS[oddC];
    var members = [];
    for (var i = 0; i < group.words.length; i++) if (i !== drop) members.push(group.words[i]);
    var odd = other.words[oddI];
    var packed = packShuffled(odd, members, gid("classification", seed));
    if (!packed) return null;
    return emit({
      id: gid("classification", seed),
      section: "verbal",
      type: "classification",
      stem: "Which word does not belong with the others?",
      packed: packed,
      explanation: members.join(", ") + " are " + group.name + ". " + cap(odd) + " is not one of those, so it does not belong.",
      meta: { op: "class", group: group.name, oddGroup: other.name, members: members, odd: odd }
    });
  }

  var LOGIC_NAMES = ["Mina", "Andre", "Priya", "Leo", "Sofia", "Jonah", "Elena", "Marcus", "Aisha", "Diego", "Nora", "Caleb", "Hugo", "Irene", "Pablo", "Ruth", "Samir", "Leah", "Owen", "Grace"];
  var LOGIC_GROUPS = ["chess club", "band", "science club", "yearbook staff", "soccer team", "art club", "debate team", "robotics club", "drama club", "math team"];
  var LOGIC_ACTIONS = ["stays after school on Thursday", "practices on Monday", "meets in the library", "brings a notebook", "wears a blue pin", "signs the attendance sheet", "arrives before the bell", "sits in the front row", "helps put the chairs away", "reads the posted notes"];

  function makeLogic(seed) {
    if (seed < 0 || seed >= 2000) return null;
    var name = LOGIC_NAMES[seed % 20];
    var group = LOGIC_GROUPS[Math.floor(seed / 20) % 10];
    var action = LOGIC_ACTIONS[Math.floor(seed / 200)];
    var correct = name + " " + action + ".";
    var wrongs = [
      "Everyone who " + action + " is in the " + group + ".",
      name + " is the only member of the " + group + ".",
      "No one in the " + group + " " + action + "."
    ];
    var packed = packShuffled(correct, wrongs, gid("logic", seed));
    return emit({
      id: gid("logic", seed),
      section: "verbal",
      type: "logic",
      stem: "Everyone in the " + group + " " + action + ". " + name + " is in the " + group + ". Which must be true?",
      packed: packed,
      explanation: "Everyone in the " + group + " " + action + ", and " + name + " is in that group, so " + correct + " The other choices reverse the rule, claim " + name + " is the only member, or deny the rule.",
      meta: { op: "all-members", name: name, group: group, action: action }
    });
  }

  var SPELLING = [
    ["receive", ["recieve", "receve", "recive"]],
    ["believe", ["beleive", "belive", "beleave"]],
    ["separate", ["seperate", "seperete", "separat"]],
    ["definitely", ["definately", "definitly", "definetly"]],
    ["occurrence", ["occurence", "occurrance", "ocurrence"]],
    ["necessary", ["neccessary", "necessery", "necesary"]],
    ["accommodate", ["acommodate", "accomodate", "accommadate"]],
    ["recommend", ["reccomend", "recomend", "reccommend"]],
    ["calendar", ["calander", "calandar", "calendor"]],
    ["library", ["libary", "librery", "libarary"]],
    ["February", ["Febuary", "Febrary", "Febraury"]],
    ["environment", ["enviroment", "enviornment", "enviromint"]],
    ["government", ["goverment", "governement", "govement"]],
    ["neighbor", ["nieghbor", "neighber", "neigbor"]],
    ["ceiling", ["cieling", "ceilng", "cealing"]],
    ["friend", ["freind", "frend", "friand"]],
    ["rhythm", ["rythm", "rhythym", "rhytm"]],
    ["conscience", ["concience", "consciance", "consince"]],
    ["argument", ["arguement", "argumant", "arguament"]],
    ["truly", ["truely", "trully", "trueley"]],
    ["hoping", ["hopeing", "hopng", "hopein"]],
    ["beginning", ["begining", "beggining", "begening"]],
    ["committee", ["commitee", "comittee", "committe"]],
    ["attendance", ["attendence", "attendanse", "attandance"]],
    ["business", ["bussiness", "busness", "buisness"]],
    ["excellent", ["excelent", "excellant", "exelent"]],
    ["immediately", ["immediatly", "imediately", "immediatley"]],
    ["knowledge", ["knowlege", "knowladge", "knowlegee"]],
    ["occasion", ["ocassion", "ocasion", "occation"]],
    ["privilege", ["priviledge", "privilige", "privelege"]],
    ["restaurant", ["restarant", "restraunt", "restaraunt"]],
    ["tomorrow", ["tommorow", "tommorrow", "tomorow"]],
    ["until", ["untill", "untl", "unitl"]],
    ["usually", ["usally", "usualy", "usully"]],
    ["vacuum", ["vaccuum", "vacume", "vaccum"]],
    ["whether", ["wheter", "whethar", "whther"]],
    ["surprise", ["suprise", "surprize", "suprisee"]],
    ["different", ["diffrent", "diferent", "diffarent"]],
    ["because", ["becuase", "becaus", "beacuse"]],
    ["piece", ["peice", "peece", "piec"]],
    ["their", ["thier", "thair", "theri"]],
    ["weird", ["wierd", "weerd", "wierdly"]],
    ["height", ["heigth", "heighth", "hieght"]],
    ["weight", ["wieght", "weght", "weigth"]],
    ["leisure", ["liesure", "leisur", "leasure"]],
    ["foreign", ["foriegn", "foregn", "forign"]],
    ["science", ["sciense", "scince", "sciance"]],
    ["probably", ["probally", "probibly", "probaly"]],
    ["describe", ["discribe", "descrbe", "describle"]],
    ["judgment", ["judgmant", "jugment", "judgemant"]],
    ["license", ["lisence", "licens", "lisense"]],
    ["occasionally", ["ocasionally", "occassionally", "occasionly"]],
    ["parallel", ["paralel", "parrallel", "paralell"]],
    ["pastime", ["passtime", "pasttime", "passtiem"]],
    ["perseverance", ["perseverence", "perserverance", "perseveranse"]],
    ["possession", ["posession", "possesion", "possesssion"]],
    ["prejudice", ["predjudice", "prejudise", "prejudace"]],
    ["principle", ["princible", "principel", "principl"]],
    ["pronunciation", ["pronounciation", "pronunciaton", "pronounciationn"]],
    ["publicly", ["publically", "publiclyy", "publicaly"]],
    ["questionnaire", ["questionnair", "questionaire", "questionnare"]],
    ["receipt", ["reciept", "receit", "recipt"]],
    ["recognize", ["recogize", "reconize", "recogonize"]],
    ["relevance", ["relevence", "relavance", "relevanse"]],
    ["religious", ["religous", "religeous", "religius"]],
    ["repetition", ["repitition", "repetion", "reppetition"]],
    ["resistance", ["resistence", "resistense", "resistanse"]],
    ["schedule", ["schedual", "scedule", "scheduel"]],
    ["secretary", ["secratary", "secretery", "seceretary"]],
    ["sentence", ["sentance", "sentense", "sentince"]],
    ["similar", ["similiar", "similer", "simmilar"]],
    ["sincerely", ["sincerly", "sincerley", "sincereley"]],
    ["speech", ["speach", "speeche", "speachh"]],
    ["success", ["sucess", "succes", "successs"]],
    ["supersede", ["supercede", "supersed", "superseed"]],
    ["temperament", ["temperment", "temprement", "temperamant"]],
    ["tendency", ["tendancy", "tendensy", "tendencie"]],
    ["thorough", ["thorogh", "thourough", "thoro"]],
    ["twelfth", ["twelth", "twelvth", "twelf"]],
    ["unfortunately", ["unfortunatly", "unfortunetly", "unforunately"]],
    ["unnecessary", ["unnecesary", "unneccessary", "unnecessery"]],
    ["visible", ["visable", "visibel", "vizible"]],
    ["writing", ["writting", "writeing", "writng"]]
  ];

  function makeSpelling(seed) {
    var entry = SPELLING[seed % SPELLING.length];
    var missIndex = seed % entry[1].length;
    var mode = Math.floor(seed / SPELLING.length) % 2;
    var id = gid("spelling", seed);
    if (mode === 0) {
      var wrongs = entry[1].slice();
      var packed = packShuffled(entry[0], wrongs, id);
      return emit({
        id: id,
        section: "language",
        type: "spelling",
        stem: "Which word is spelled correctly?",
        packed: packed,
        explanation: "The correct spelling is " + entry[0] + ".",
        meta: { kind: "spell", op: "spell-correct", word: entry[0], correct: entry[0], spellMode: "correct" }
      });
    }
    var miss = entry[1][missIndex];
    var distractors = [];
    var k = 1;
    while (distractors.length < 3) {
      var other = SPELLING[(seed + k) % SPELLING.length][0];
      k += 1;
      if (other !== entry[0] && distractors.indexOf(other) < 0) distractors.push(other);
      if (k > SPELLING.length + 3) break;
    }
    var packedW = packShuffled(miss, distractors, id);
    return emit({
      id: id,
      section: "language",
      type: "spelling",
      stem: "Which word is spelled incorrectly?",
      packed: packedW,
      explanation: miss + " is not how to spell " + entry[0] + ". The other choices are spelled correctly.",
      meta: { kind: "spell", op: "spell-wrong", word: entry[0], correct: miss, spellMode: "wrong", missIndex: missIndex }
    });
  }

  var COUNT_NOUNS = [["students", "student"], ["tickets", "ticket"], ["apples", "apple"], ["chairs", "chair"], ["pencils", "pencil"], ["questions", "question"], ["players", "player"], ["buses", "bus"], ["books", "book"], ["cookies", "cookie"], ["riders", "rider"], ["painters", "painter"], ["flags", "flag"], ["gloves", "glove"], ["lockers", "locker"], ["medals", "medal"], ["poems", "poem"], ["folders", "folder"], ["markers", "marker"], ["rabbits", "rabbit"], ["windows", "window"], ["baskets", "basket"], ["candles", "candle"], ["puzzles", "puzzle"], ["ribbons", "ribbon"], ["helmets", "helmet"], ["oranges", "orange"], ["napkins", "napkin"], ["posters", "poster"], ["sandals", "sandal"], ["trumpets", "trumpet"], ["whistles", "whistle"], ["notebooks", "notebook"], ["erasers", "eraser"], ["batteries", "battery"], ["envelopes", "envelope"], ["badges", "badge"], ["cameras", "camera"], ["jackets", "jacket"], ["bottles", "bottle"]];
  var MASS_NOUNS = ["time", "water", "sand", "money", "homework", "rain", "soup", "rice", "juice", "paint", "glue", "paper", "music", "noise", "space", "light", "salt", "sugar", "milk", "air"];
  var USAGE_NAMES = ["Mina", "Andre", "Priya", "Leo", "Sofia", "Jonah", "Elena", "Marcus", "Aisha", "Diego", "Nora", "Caleb", "Hugo", "Irene", "Pablo", "Ruth", "Samir", "Leah", "Owen", "Grace"];
  var ITS_GROUPS = ["team", "club", "class", "band", "school", "city", "company", "choir", "staff", "crew", "family", "committee", "group", "herd", "flock", "pack", "crowd", "jury", "cast", "squad"];
  var ITS_THINGS = ["record", "name", "history", "banner", "mascot", "colors", "title", "motto", "home", "leader", "work", "story", "plan", "score", "uniform", "sound", "path", "goal", "prize", "schedule"];
  var THEY_GROUPS = ["captains", "players", "artists", "editors", "riders", "cooks", "guides", "judges", "pilots", "nurses", "students", "authors", "builders", "coaches", "drummers", "helpers", "mentors", "partners", "singers", "tutors"];
  var THEY_NOUNS = ["books", "bags", "coats", "notes", "tools", "maps", "badges", "tickets", "lunches", "posters", "folders", "helmets", "cameras", "projects", "uniforms", "instruments", "bottles", "markers", "whistles", "jackets"];

  function makeUsage(seed) {
    if (seed < 0 || seed >= 2000) return null;
    var id = gid("usage", seed);
    if (seed < 800) {
      var pair = COUNT_NOUNS[Math.floor(seed / 20)];
      var count = 3 + (seed % 20);
      var correct = "Fewer than " + count + " " + pair[0] + " were left.";
      var wrongs = [
        "Less than " + count + " " + pair[0] + " were left.",
        "Fewer than " + count + " " + pair[1] + " were left.",
        "Less of " + pair[0] + " were left."
      ];
      return emit({
        id: id, section: "language", type: "usage",
        stem: "Choose the correct sentence.",
        packed: packShuffled(correct, wrongs, id),
        explanation: "Use fewer for things you can count, such as " + pair[0] + ". The noun stays plural.",
        meta: { op: "fewer", count: count, plural: pair[0], singular: pair[1], correct: correct }
      });
    }
    if (seed < 1200) {
      var u = seed - 800;
      var mass = MASS_NOUNS[Math.floor(u / 20)];
      var person = USAGE_NAMES[u % 20];
      var correctM = person + " found less " + mass + " than the others did.";
      var wrongsM = [
        person + " found fewer " + mass + " than the others did.",
        person + " found less " + mass + "s than the others did.",
        person + " found fewer of " + mass + " than the others did."
      ];
      return emit({
        id: id, section: "language", type: "usage",
        stem: "Choose the correct sentence.",
        packed: packShuffled(correctM, wrongsM, id),
        explanation: mass.charAt(0).toUpperCase() + mass.slice(1) + " is not counted one by one here, so use less, not fewer.",
        meta: { op: "less", mass: mass, name: person, correct: correctM }
      });
    }
    if (seed < 1600) {
      var v = seed - 1200;
      var group = ITS_GROUPS[Math.floor(v / 20)];
      var thing = ITS_THINGS[v % 20];
      var correctI = "The " + group + " is proud of its " + thing + ".";
      var wrongsI = [
        "The " + group + " is proud of it's " + thing + ".",
        "The " + group + " is proud of its' " + thing + ".",
        "The " + group + " is proud of its's " + thing + "."
      ];
      return emit({
        id: id, section: "language", type: "usage",
        stem: "Choose the correct sentence.",
        packed: packShuffled(correctI, wrongsI, id),
        explanation: "Its shows possession. It's means it is.",
        meta: { op: "its", group: group, thing: thing, correct: correctI }
      });
    }
    var w = seed - 1600;
    var tg = THEY_GROUPS[Math.floor(w / 20)];
    var tn = THEY_NOUNS[w % 20];
    var correctT = "The " + tg + " say they're finished with their " + tn + ".";
    var wrongsT = [
      "The " + tg + " say their finished with they're " + tn + ".",
      "The " + tg + " say there finished with their " + tn + ".",
      "The " + tg + " say they're finished with there " + tn + "."
    ];
    return emit({
      id: id, section: "language", type: "usage",
      stem: "Choose the correct sentence.",
      packed: packShuffled(correctT, wrongsT, id),
      explanation: "They're means they are. Their shows possession. There points to a place.",
      meta: { op: "theyre", group: tg, noun: tn, correct: correctT }
    });
  }

  var CONTAINERS = [
    ["stack", "books"], ["box", "pencils"], ["list", "names"], ["pile", "jackets"], ["row", "chairs"],
    ["bag", "apples"], ["line", "students"], ["bowl", "oranges"], ["pack", "cards"], ["crate", "bottles"]
  ];
  var PLACES = ["by the door", "on the shelf", "in the hall", "under the desk", "near the stage", "beside the gym", "in the office", "on the table", "by the window", "in the closet"];

  function makeAgreement(seed) {
    if (seed < 0 || seed >= 2000) return null;
    var box = CONTAINERS[seed % 10];
    var count = 3 + (Math.floor(seed / 10) % 20);
    var place = PLACES[Math.floor(seed / 200)];
    var correct = "The " + box[0] + " of " + count + " " + box[1] + " is " + place + ".";
    var wrongs = [
      "The " + box[0] + " of " + count + " " + box[1] + " are " + place + ".",
      "The " + box[0] + " of " + count + " " + box[1] + " am " + place + ".",
      "The " + box[0] + " of " + count + " " + box[1].replace(/s$/, "") + " are " + place + "."
    ];
    var id = gid("agreement", seed);
    return emit({
      id: id, section: "language", type: "agreement",
      stem: "Choose the correct sentence.",
      packed: packShuffled(correct, wrongs, id),
      explanation: "The subject is " + box[0] + ", which is singular, so the verb is is. Of " + count + " " + box[1] + " only describes it.",
      meta: { op: "sv-agreement", container: box[0], plural: box[1], count: count, place: place, correct: correct }
    });
  }

  var PREPS = ["After", "Before"];
  var PREP_RESTS = ["the bell", "the game", "the storm", "the test", "the song", "the speech", "the drill", "the race", "the meeting", "the lesson", "the concert", "the practice", "the announcement", "the warmup", "the rehearsal", "lunch", "sunrise", "the quiz", "the delay", "the interview"];
  var CLAUSE_NAMES = ["Mina", "Andre", "Priya", "Leo", "Sofia", "Jonah", "Elena", "Marcus", "Aisha", "Diego"];
  var CLAUSE_ACTIONS = ["opened the notebook", "checked the map", "raised one hand", "found a pencil", "started the timer"];

  function makePunctuation(seed) {
    if (seed < 0 || seed >= 2000) return null;
    var phrase = PREPS[seed % 2] + " " + PREP_RESTS[Math.floor(seed / 2) % 20];
    var clauseIndex = Math.floor(seed / 40);
    var clause = CLAUSE_NAMES[clauseIndex % 10] + " " + CLAUSE_ACTIONS[Math.floor(clauseIndex / 10)];
    var lastSpace = clause.lastIndexOf(" ");
    var head = clause.slice(0, lastSpace);
    var tail = clause.slice(lastSpace + 1);
    var correct = phrase + ", " + clause + ".";
    var wrongs = [
      phrase + " " + clause + ".",
      phrase.split(" ")[0] + ", " + phrase.split(" ").slice(1).join(" ") + " " + clause + ".",
      phrase + " " + head + ", " + tail + "."
    ];
    var id = gid("punctuation", seed);
    return emit({
      id: id, section: "language", type: "punctuation",
      stem: "Choose the sentence that is punctuated correctly.",
      packed: packShuffled(correct, wrongs, id),
      explanation: "A comma follows the introductory phrase " + phrase + ".",
      meta: { op: "intro-comma", phrase: phrase, clause: clause, correct: correct }
    });
  }

  var APOST_NAMES = ["Mina", "Andre", "Priya", "Leo", "Sofia", "Jonah", "Elena", "Marcus", "Aisha", "Diego", "Nora", "Caleb", "Hugo", "Irene", "Pablo", "Ruth", "Samir", "Leah", "Owen", "Grace", "Helen", "Victor", "Nadia", "Omar", "Clara", "Felix", "Rosa", "Simon", "Lila", "Theo"];
  var APOST_OBJECTS = ["notebook", "backpack", "poster", "trumpet", "helmet", "essay", "project", "bicycle", "camera", "jersey", "poem", "compass", "flashlight", "calculator", "watercolor", "clarinet", "sketchbook", "uniform", "trophy", "folder", "whistle", "marker", "bottle", "badge", "ribbon", "sandal", "glove", "medal", "lantern", "basket", "candle", "puzzle", "map", "coat", "lunch", "ticket", "tool", "book", "bag", "note", "flag", "chair", "pencil", "apple", "orange", "napkin", "eraser", "envelope", "jacket", "cookie"];
  var APOST_GROUPS = [["girls", "girl"], ["boys", "boy"], ["players", "player"], ["teachers", "teacher"], ["riders", "rider"], ["painters", "painter"], ["writers", "writer"], ["musicians", "musician"], ["students", "student"], ["coaches", "coach"], ["artists", "artist"], ["editors", "editor"], ["pilots", "pilot"], ["nurses", "nurse"], ["authors", "author"], ["builders", "builder"], ["drummers", "drummer"], ["helpers", "helper"], ["mentors", "mentor"], ["singers", "singer"], ["tutors", "tutor"], ["judges", "judge"], ["guides", "guide"], ["cooks", "cook"], ["partners", "partner"]];
  var APOST_THINGS = ["notebooks", "posters", "helmets", "essays", "cameras", "jerseys", "poems", "calculators", "uniforms", "trophies", "folders", "whistles", "markers", "badges", "ribbons", "gloves", "medals", "baskets", "maps", "coats"];

  function makeApostrophe(seed) {
    if (seed < 0 || seed >= 2000) return null;
    var id = gid("apostrophe", seed);
    if (seed < 1500) {
      var name = APOST_NAMES[seed % 30];
      var obj = APOST_OBJECTS[Math.floor(seed / 30)];
      var correct = name + "'s " + obj + " is here.";
      var wrongs = [
        name + "s " + obj + " is here.",
        name + " " + obj + " is here.",
        name + "s' " + obj + " is here."
      ];
      return emit({
        id: id, section: "language", type: "apostrophe",
        stem: "The " + obj + " belongs to " + name + ". Choose the correct sentence.",
        packed: packShuffled(correct, wrongs, id),
        explanation: "A singular name shows possession with 's: " + name + "'s.",
        meta: { op: "singular-poss", name: name, object: obj, correct: correct }
      });
    }
    var g = seed - 1500;
    var group = APOST_GROUPS[g % 25];
    var thing = APOST_THINGS[Math.floor(g / 25)];
    var correctP = "The " + group[0] + "' " + thing + " are here.";
    var wrongsP = [
      "The " + group[1] + "'s " + thing + " are here.",
      "The " + group[0] + " " + thing + " are here.",
      "The " + group[0] + "'s " + thing + " are here."
    ];
    return emit({
      id: id, section: "language", type: "apostrophe",
      stem: "These belong to more than one " + group[1] + ". Choose the correct sentence.",
      packed: packShuffled(correctP, wrongsP, id),
      explanation: "More than one " + group[1] + ": the plural " + group[0] + " already ends in s, so the possessive is " + group[0] + "'.",
      meta: { op: "plural-poss", plural: group[0], singular: group[1], thing: thing, correct: correctP }
    });
  }

  var CAP_PLACES = ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Mississippi River", "Nile River", "Amazon River", "Colorado River", "Rocky Mountains", "Andes Mountains", "Alps", "Himalayas", "Sahara Desert", "Gobi Desert", "Mojave Desert", "Great Barrier Reef", "Grand Canyon", "Golden Gate Bridge", "Brooklyn Bridge", "Great Wall", "Panama Canal", "Suez Canal", "Dead Sea", "Red Sea", "Black Sea", "Gulf of Mexico", "Hudson River", "Ohio River", "Thames River", "Seine River", "Caspian Sea", "Mediterranean Sea", "Caribbean Sea", "Bering Strait", "English Channel", "Strait of Gibraltar", "Mount Everest range", "Serengeti Plain", "Great Plains", "Kalahari Desert"];
  var CAP_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October"];
  var CAP_VERBS = ["read about", "wrote about", "learned about", "reported on", "asked about"];

  function lowerPlace(place) {
    return place.toLowerCase();
  }

  function makeCapitalization(seed) {
    if (seed < 0 || seed >= 2000) return null;
    var place = CAP_PLACES[seed % 40];
    var month = CAP_MONTHS[Math.floor(seed / 40) % 10];
    var verb = CAP_VERBS[Math.floor(seed / 400)];
    var correct = "We " + verb + " the " + place + " in " + month + ".";
    var wrongs = [
      "We " + verb + " the " + lowerPlace(place) + " in " + month + ".",
      "We " + verb + " the " + place + " in " + month.toLowerCase() + ".",
      "we " + verb + " the " + place + " in " + month + "."
    ];
    var id = gid("capitalization", seed);
    return emit({
      id: id, section: "language", type: "capitalization",
      stem: "Choose the sentence that is capitalized correctly.",
      packed: packShuffled(correct, wrongs, id),
      explanation: "Capitalize the first word, the proper name " + place + ", and the month " + month + ".",
      meta: { op: "caps", place: place, month: month, verb: verb, correct: correct }
    });
  }

  var ROLES = ["lab group", "field team", "nurse", "coach", "editor", "ranger", "librarian", "captain", "builder", "gardener", "drummer", "tutor", "judge", "pilot", "painter", "guide", "mentor", "clerk", "keeper", "scout"];
  var UNITS = ["centimeters", "minutes", "points", "seedlings", "laps"];

  function makeComposition(seed) {
    if (seed < 0 || seed >= 2000) return null;
    var role = ROLES[seed % 20];
    var count = 2 + (Math.floor(seed / 20) % 10);
    var unit = UNITS[Math.floor(seed / 200) % 5];
    var day = 2 + Math.floor(seed / 1000);
    var correct = "The " + role + " recorded " + count + " " + unit + " after " + day + " days.";
    var wrongs = [
      "Someone recorded something.",
      "A person was busy.",
      "It happened sometime."
    ];
    var id = gid("composition", seed);
    return emit({
      id: id, section: "language", type: "composition",
      stem: "Which sentence is the most specific?",
      packed: packShuffled(correct, wrongs, id),
      explanation: "The best sentence names who measured, how many " + unit + ", and when. The others stay vague.",
      meta: { op: "specific", role: role, count: count, unit: unit, day: day, correct: correct }
    });
  }

  var MAKERS = {
    series: makeSeries,
    comparison: makeComparison,
    "number-sense": makeNumberSense,
    problem: makeProblem,
    geometry: makeGeometry,
    synonym: makeSynonym,
    antonym: makeAntonym,
    analogy: makeAnalogy,
    classification: makeClassification,
    logic: makeLogic,
    spelling: makeSpelling,
    usage: makeUsage,
    agreement: makeAgreement,
    punctuation: makePunctuation,
    apostrophe: makeApostrophe,
    capitalization: makeCapitalization,
    composition: makeComposition,
    "vocab-context": makeContext
  };

  var OPEN = ["series", "comparison", "number-sense", "problem", "geometry", "analogy", "classification", "logic", "usage", "agreement", "punctuation", "apostrophe", "capitalization", "composition"];

  function make(type, seed) {
    var fn = MAKERS[type];
    if (!fn) return null;
    seed = Number(seed);
    if (!isFinite(seed) || seed < 0) return null;
    return fn(seed);
  }

  return {
    make: make,
    can: function (type) { return !!MAKERS[type]; },
    types: Object.keys(MAKERS),
    openTypes: OPEN,
    parseGenId: parseGenId,
    loadWords: loadWords,
    clusters: function () { return CLUSTERS; },
    spelling: function () { return SPELLING; },
    handAnalogies: function () { return HAND; }
  };
});
