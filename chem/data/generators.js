// Seeded chemistry items. make(type, seed) is deterministic.
// A canonical signature (operands, not the seed) is stored on item.sig
// so the same problem is not served again under a new seed.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CHEM_GEN = api;
})(typeof window !== "undefined" ? window : null, function () {
  var TYPES = [
    "sigfig", "unit", "molar-mass", "moles", "stoich",
    "boyle", "charles", "combined", "ideal",
    "molarity", "dilution", "ph", "poh"
  ];

  var TYPE_TOPIC = {
    sigfig: "matter",
    unit: "matter",
    "molar-mass": "mole",
    moles: "mole",
    stoich: "mole",
    boyle: "gases",
    charles: "gases",
    combined: "gases",
    ideal: "gases",
    molarity: "solutions",
    dilution: "solutions",
    ph: "acids",
    poh: "acids"
  };

  var MASS = {
    H: 101, C: 1201, N: 1401, O: 1600, Na: 2299, Mg: 2431, Al: 2698,
    P: 3097, S: 3207, Cl: 3545, K: 3910, Ca: 4008, Fe: 5585, Cu: 6355,
    Zn: 6538, Ag: 10787, Br: 7990
  };

  var COMPOUNDS = [
    { formula: "H2O", name: "water", atoms: { H: 2, O: 1 } },
    { formula: "CO2", name: "carbon dioxide", atoms: { C: 1, O: 2 } },
    { formula: "O2", name: "oxygen", atoms: { O: 2 } },
    { formula: "N2", name: "nitrogen", atoms: { N: 2 } },
    { formula: "H2", name: "hydrogen", atoms: { H: 2 } },
    { formula: "NH3", name: "ammonia", atoms: { N: 1, H: 3 } },
    { formula: "CH4", name: "methane", atoms: { C: 1, H: 4 } },
    { formula: "NaCl", name: "sodium chloride", atoms: { Na: 1, Cl: 1 } },
    { formula: "HCl", name: "hydrogen chloride", atoms: { H: 1, Cl: 1 } },
    { formula: "NaOH", name: "sodium hydroxide", atoms: { Na: 1, O: 1, H: 1 } },
    { formula: "KOH", name: "potassium hydroxide", atoms: { K: 1, O: 1, H: 1 } },
    { formula: "CaCl2", name: "calcium chloride", atoms: { Ca: 1, Cl: 2 } },
    { formula: "MgO", name: "magnesium oxide", atoms: { Mg: 1, O: 1 } },
    { formula: "CaCO3", name: "calcium carbonate", atoms: { Ca: 1, C: 1, O: 3 } },
    { formula: "H2SO4", name: "sulfuric acid", atoms: { H: 2, S: 1, O: 4 } },
    { formula: "HNO3", name: "nitric acid", atoms: { H: 1, N: 1, O: 3 } },
    { formula: "H3PO4", name: "phosphoric acid", atoms: { H: 3, P: 1, O: 4 } },
    { formula: "Na2SO4", name: "sodium sulfate", atoms: { Na: 2, S: 1, O: 4 } },
    { formula: "KNO3", name: "potassium nitrate", atoms: { K: 1, N: 1, O: 3 } },
    { formula: "CuSO4", name: "copper(II) sulfate", atoms: { Cu: 1, S: 1, O: 4 } },
    { formula: "AgNO3", name: "silver nitrate", atoms: { Ag: 1, N: 1, O: 3 } },
    { formula: "Fe2O3", name: "iron(III) oxide", atoms: { Fe: 2, O: 3 } },
    { formula: "Al2O3", name: "aluminum oxide", atoms: { Al: 2, O: 3 } },
    { formula: "C6H12O6", name: "glucose", atoms: { C: 6, H: 12, O: 6 } },
    { formula: "C2H6", name: "ethane", atoms: { C: 2, H: 6 } },
    { formula: "SO2", name: "sulfur dioxide", atoms: { S: 1, O: 2 } },
    { formula: "NH4Cl", name: "ammonium chloride", atoms: { N: 1, H: 4, Cl: 1 } },
    { formula: "ZnCl2", name: "zinc chloride", atoms: { Zn: 1, Cl: 2 } },
    { formula: "Na2CO3", name: "sodium carbonate", atoms: { Na: 2, C: 1, O: 3 } },
    { formula: "Ca(OH)2", name: "calcium hydroxide", atoms: { Ca: 1, O: 2, H: 2 } }
  ];

  var REACTIONS = [
    { eq: "N2 + 3 H2 → 2 NH3", parts: [{ f: "N2", c: 1 }, { f: "H2", c: 3 }, { f: "NH3", c: 2 }] },
    { eq: "2 H2 + O2 → 2 H2O", parts: [{ f: "H2", c: 2 }, { f: "O2", c: 1 }, { f: "H2O", c: 2 }] },
    { eq: "CH4 + 2 O2 → CO2 + 2 H2O", parts: [{ f: "CH4", c: 1 }, { f: "O2", c: 2 }, { f: "CO2", c: 1 }, { f: "H2O", c: 2 }] },
    { eq: "2 KClO3 → 2 KCl + 3 O2", parts: [{ f: "KClO3", c: 2 }, { f: "KCl", c: 2 }, { f: "O2", c: 3 }] },
    { eq: "4 Fe + 3 O2 → 2 Fe2O3", parts: [{ f: "Fe", c: 4 }, { f: "O2", c: 3 }, { f: "Fe2O3", c: 2 }] },
    { eq: "CaCO3 → CaO + CO2", parts: [{ f: "CaCO3", c: 1 }, { f: "CaO", c: 1 }, { f: "CO2", c: 1 }] },
    { eq: "C3H8 + 5 O2 → 3 CO2 + 4 H2O", parts: [{ f: "C3H8", c: 1 }, { f: "O2", c: 5 }, { f: "CO2", c: 3 }, { f: "H2O", c: 4 }] },
    { eq: "2 Na + Cl2 → 2 NaCl", parts: [{ f: "Na", c: 2 }, { f: "Cl2", c: 1 }, { f: "NaCl", c: 2 }] }
  ];

  var MASS_FORMULAS = {
    N2: { N: 2 }, H2: { H: 2 }, NH3: { N: 1, H: 3 }, O2: { O: 2 }, H2O: { H: 2, O: 1 },
    CH4: { C: 1, H: 4 }, CO2: { C: 1, O: 2 }, KClO3: { K: 1, Cl: 1, O: 3 }, KCl: { K: 1, Cl: 1 },
    Fe: { Fe: 1 }, Fe2O3: { Fe: 2, O: 3 }, CaCO3: { Ca: 1, C: 1, O: 3 }, CaO: { Ca: 1, O: 1 },
    C3H8: { C: 3, H: 8 }, Na: { Na: 1 }, Cl2: { Cl: 2 }, NaCl: { Na: 1, Cl: 1 }
  };

  var UNIT_PAIRS = [
    { from: "km", to: "m", num: 1000, den: 1 },
    { from: "m", to: "km", num: 1, den: 1000 },
    { from: "m", to: "cm", num: 100, den: 1 },
    { from: "cm", to: "m", num: 1, den: 100 },
    { from: "m", to: "mm", num: 1000, den: 1 },
    { from: "mm", to: "m", num: 1, den: 1000 },
    { from: "cm", to: "mm", num: 10, den: 1 },
    { from: "kg", to: "g", num: 1000, den: 1 },
    { from: "g", to: "kg", num: 1, den: 1000 },
    { from: "g", to: "mg", num: 1000, den: 1 },
    { from: "mg", to: "g", num: 1, den: 1000 },
    { from: "L", to: "mL", num: 1000, den: 1 },
    { from: "mL", to: "L", num: 1, den: 1000 },
    { from: "min", to: "s", num: 60, den: 1 },
    { from: "h", to: "min", num: 60, den: 1 },
    { from: "h", to: "s", num: 3600, den: 1 }
  ];

  function mmCents(atoms) {
    var sum = 0;
    Object.keys(atoms).forEach(function (el) { sum += atoms[el] * MASS[el]; });
    return sum;
  }

  function centsToStr(cents) {
    var sign = cents < 0 ? "-" : "";
    var n = Math.abs(cents);
    var whole = Math.floor(n / 100);
    var frac = n % 100;
    return sign + whole + "." + (frac < 10 ? "0" : "") + frac;
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

  function parseMeasure(raw) {
    var s = String(raw).replace(/\s+/g, "");
    s = s.replace(/×/g, "x").replace(/\*/g, "x");
    var expExtra = 0;
    var m = s.match(/^([+-]?\d*\.?\d+)x10\^([+-]?\d+)$/i);
    if (!m) m = s.match(/^([+-]?\d*\.?\d+)e([+-]?\d+)$/i);
    if (m) {
      s = m[1];
      expExtra = Number(m[2]);
    }
    var sign = 1;
    if (s.charAt(0) === "+") s = s.slice(1);
    else if (s.charAt(0) === "-") { sign = -1; s = s.slice(1); }
    if (!/^\d*\.?\d+$/.test(s)) return null;
    var dot = s.indexOf(".");
    var intPart;
    var frac = null;
    if (dot >= 0) {
      intPart = s.slice(0, dot);
      frac = s.slice(dot + 1);
    } else intPart = s;
    if (!intPart) intPart = "0";
    intPart = intPart.replace(/^0+/, "") || "0";
    var digits;
    var exp;
    if (frac !== null) {
      var all = (intPart === "0" ? "" : intPart) + frac;
      var i = 0;
      while (i < all.length && all.charAt(i) === "0") i++;
      digits = all.slice(i) || "0";
      exp = intPart === "0" ? -(i + 1) : intPart.length - 1;
      if (digits === "0") exp = 0;
    } else {
      var trimmed = intPart.replace(/0+$/, "") || "0";
      digits = trimmed;
      exp = digits === "0" ? 0 : intPart.length - 1;
    }
    return { sign: sign, digits: digits, exp: exp + expExtra };
  }

  function countSig(str) {
    var p = parseMeasure(str);
    if (!p || p.digits === "0") return 0;
    return p.digits.length;
  }

  function roundParts(parts, sigs) {
    var digits = parts.digits;
    var exp = parts.exp;
    if (digits === "0" || digits.length <= sigs) return { sign: parts.sign, digits: digits, exp: exp };
    var keep = digits.slice(0, sigs);
    var next = digits.charCodeAt(sigs) - 48;
    if (next >= 5) {
      var arr = keep.split("");
      var i = arr.length - 1;
      while (i >= 0 && arr[i] === "9") {
        arr[i] = "0";
        i--;
      }
      if (i < 0) {
        arr.unshift("1");
        exp += 1;
        arr.pop();
      } else arr[i] = String(Number(arr[i]) + 1);
      keep = arr.join("");
    }
    return { sign: parts.sign, digits: keep, exp: exp };
  }

  function formatParts(parts) {
    if (!parts || parts.digits === "0") return "0";
    var digits = parts.digits;
    var exp = parts.exp;
    var sign = parts.sign < 0 ? "-" : "";
    var body = digits.charAt(0) + (digits.length > 1 ? "." + digits.slice(1) : "");
    if (exp >= 0 && exp < digits.length) {
      var cut = exp + 1;
      var plain = digits.slice(0, cut);
      var rest = digits.slice(cut);
      if (rest) plain += "." + rest;
      if (plain.indexOf(".") < 0 && /0$/.test(plain)) return sign + body + " × 10^" + exp;
      return sign + plain;
    }
    return sign + body + " × 10^" + exp;
  }

  function formatSigStr(str, sigs) {
    var p = parseMeasure(str);
    if (!p) return null;
    return formatParts(roundParts(p, sigs));
  }

  function valueOf(str) {
    var p = parseMeasure(str);
    if (!p) return NaN;
    return p.sign * Number(p.digits) * Math.pow(10, p.exp - p.digits.length + 1);
  }

  function decimalsOf(str) {
    var s = String(str);
    var sci = s.indexOf("10^") >= 0 || s.indexOf("e") >= 0 || s.indexOf("E") >= 0;
    if (sci) return null;
    var dot = s.indexOf(".");
    if (dot < 0) return 0;
    return s.length - dot - 1;
  }

  function uniqueTexts(correct, candidates) {
    var out = [];
    var seen = {};
    seen[String(correct)] = true;
    function add(v) {
      if (v == null) return;
      var s = String(v);
      if (!s || seen[s]) return;
      if (s.indexOf("NaN") >= 0 || s.indexOf("undefined") >= 0) return;
      seen[s] = true;
      out.push(s);
    }
    for (var i = 0; i < candidates.length; i++) add(candidates[i]);
    return out.length >= 3 ? out.slice(0, 3) : null;
  }

  function pack(correct, wrongs, sig) {
    var bad = uniqueTexts(correct, wrongs);
    if (!bad) return null;
    var all = [String(correct)].concat(bad);
    var choices = shuffle(all, sig);
    return { choices: choices, answer: choices.indexOf(String(correct)) };
  }

  function emit(type, seed, built) {
    if (!built || !built.packed) return null;
    if (!built.stem || !built.explanation || !built.sig) return null;
    var blob = built.stem + built.explanation + built.packed.choices.join("|");
    if (blob.indexOf("NaN") >= 0 || blob.indexOf("undefined") >= 0) return null;
    return {
      id: gid(type, seed),
      topic: TYPE_TOPIC[type],
      type: type,
      stem: built.stem,
      choices: built.packed.choices,
      answer: built.packed.answer,
      explanation: built.explanation,
      sig: built.sig,
      honors: false,
      meta: built.meta
    };
  }

  function massLine() {
    return "Use these atomic masses, in g/mol: H 1.01, C 12.01, N 14.01, O 16.00, Na 22.99, Mg 24.31, Al 26.98, P 30.97, S 32.07, Cl 35.45, K 39.10, Ca 40.08, Fe 55.85, Cu 63.55, Zn 65.38, Ag 107.87, Br 79.90.";
  }

  function measurement(seed, sigs) {
    var first = 1 + (seed % 9);
    var x = Math.floor(seed / 9) + 17;
    var rest = "";
    for (var i = 1; i < sigs; i++) {
      var d = x % 10;
      if (i === sigs - 1 && seed % 4 === 0) d = 0;
      rest += String(d);
      x = Math.floor(x / 10) + 3;
    }
    var lead = Math.floor(seed / 11) % 4;
    if (lead === 0) return String(first) + "." + rest;
    return "0." + new Array(lead + 1).join("0") + String(first) + rest;
  }

  function makeSigfig(seed) {
    var mode = seed % 4;
    if (mode === 0) {
      var sigs = 2 + (seed % 5);
      var text = measurement(seed, sigs);
      if (countSig(text) !== sigs) text = measurement(seed + 101, sigs);
      if (countSig(text) !== sigs) return null;
      var correct = String(sigs);
      var wrongs = [String(sigs - 1), String(sigs + 1), String(sigs + 2), String(sigs + leadCount(text))];
      var sig = "matter|sigfig|count|" + text;
      var packed = pack(correct, wrongs, sig);
      if (!packed) return null;
      return {
        stem: "How many significant figures are in " + text + "?",
        explanation: text + " has " + sigs + " significant figures. Leading zeros are not significant. Zeros between nonzero digits are significant, and trailing zeros are significant when a decimal point is written.",
        sig: sig,
        packed: packed,
        meta: { op: "count", text: text }
      };
    }
    if (mode === 1) {
      var target = 2 + (seed % 3);
      var longer = measurement(seed + 3, target + 2);
      var rounded = formatSigStr(longer, target);
      if (!rounded || countSig(rounded) !== target) return null;
      var sigR = "matter|sigfig|round|" + longer + "|" + target;
      var wrongR = [
        formatSigStr(longer, target + 1),
        formatSigStr(longer, Math.max(1, target - 1)),
        formatParts(shiftExp(parseMeasure(rounded), 1)),
        formatParts(shiftExp(parseMeasure(rounded), -1))
      ];
      var packedR = pack(rounded, wrongR, sigR);
      if (!packedR) return null;
      return {
        stem: "Round " + longer + " to " + target + " significant figures.",
        explanation: "Keep " + target + " significant figures and round the next digit. " + longer + " rounds to " + rounded + ".",
        sig: sigR,
        packed: packedR,
        meta: { op: "round", text: longer, sigs: target }
      };
    }
    if (mode === 2) {
      var a = measurement(seed + 5, 2 + (seed % 3));
      var b = measurement(seed + 9, 2 + ((seed + 1) % 3));
      var sa = countSig(a);
      var sb = countSig(b);
      var use = Math.min(sa, sb);
      var productParts = mulMeasure(a, b);
      if (!productParts || productParts.digits === "0") return null;
      var shown = formatParts(roundParts(productParts, use));
      if (!shown) return null;
      var sigP = "matter|sigfig|product|" + a + "|" + b;
      var wrongP = [
        formatParts(roundParts(productParts, use + 1)),
        formatParts(roundParts(productParts, Math.max(1, use - 1))),
        formatParts(shiftExp(parseMeasure(shown), 1)),
        formatParts(shiftExp(parseMeasure(shown), -1))
      ];
      var packedP = pack(shown, wrongP, sigP);
      if (!packedP) return null;
      return {
        stem: "Multiply " + a + " by " + b + ". The answer should have the right number of significant figures.",
        explanation: a + " has " + sa + " significant figures and " + b + " has " + sb + ". For multiplication, the product keeps the smaller count, so the result is " + shown + ".",
        sig: sigP,
        packed: packedP,
        meta: { op: "product", a: a, b: b, sigs: use }
      };
    }
    var left = addend(seed, 2);
    var right = addend(seed + 4, 1);
    var dec = Math.min(decimalsOf(left), decimalsOf(right));
    var sum = Number(left) + Number(right);
    var shownA = sum.toFixed(dec);
    if (shownA.indexOf("NaN") >= 0) return null;
    var sigA = "matter|sigfig|add|" + left + "|" + right;
    var wrongA = [
      sum.toFixed(dec + 1),
      (dec > 0 ? sum.toFixed(dec - 1) : sum.toFixed(0) + "0"),
      (sum + 1).toFixed(dec),
      (sum - 1).toFixed(dec)
    ];
    var packedA = pack(shownA, wrongA, sigA);
    if (!packedA) return null;
    return {
      stem: "Add " + left + " and " + right + ". Round the sum to the least precise decimal place.",
      explanation: left + " is known to " + decimalsOf(left) + " decimal place(s) and " + right + " to " + decimalsOf(right) + ". The sum is rounded to " + dec + " decimal place(s): " + shownA + ".",
      sig: sigA,
      packed: packedA,
      meta: { op: "add", a: left, b: right, decimals: dec }
    };
  }

  function leadCount(text) {
    var m = /^0\.0*/.exec(text);
    return m ? m[0].length - 2 : 0;
  }

  function addend(seed, places) {
    var whole = 2 + (seed % 40);
    if (places <= 0) return String(whole);
    var frac = "";
    var x = seed + 13;
    for (var i = 0; i < places; i++) {
      var d = (x + i * 3) % 10;
      if (i === places - 1 && d === 5) d = 4;
      frac += String(d);
    }
    return whole + "." + frac;
  }

function toPlain(n) {
  if (!isFinite(n)) return "0";
  var s = n.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
  return s;
}

function mulMeasure(aStr, bStr) {
  var a = parseMeasure(aStr);
  var b = parseMeasure(bStr);
  if (!a || !b) return null;
  var big = String(Number(a.digits) * Number(b.digits));
  if (big === "0") return { sign: 1, digits: "0", exp: 0 };
  var exp = a.exp + b.exp - a.digits.length - b.digits.length + big.length + 1;
  var sign = (a.sign < 0) !== (b.sign < 0) ? -1 : 1;
  return { sign: sign, digits: big, exp: exp };
}

  function shiftExp(parts, delta) {
    if (!parts) return null;
    return { sign: parts.sign, digits: parts.digits, exp: parts.exp + delta };
  }

function scaleMeasure(str, num, den) {
  var p = parseMeasure(str);
  if (!p) return null;
  var big = Number(p.digits) * num;
  var extra = 0;
  while (big % den !== 0) {
    big *= 10;
    extra += 1;
    if (extra > 8) return null;
  }
  var q = String(big / den);
  if (q === "0") return { sign: 1, digits: "0", exp: 0 };
  return {
    sign: p.sign,
    digits: q,
    exp: p.exp - p.digits.length - extra + q.length
  };
}

function makeUnit(seed) {
  var pair = UNIT_PAIRS[seed % UNIT_PAIRS.length];
  var sigs = 2 + (seed % 3);
  var text = measurement(seed + 21, sigs);
  if (countSig(text) !== sigs) return null;
  var scaled = scaleMeasure(text, pair.num, pair.den);
  if (!scaled || scaled.digits === "0") return null;
  if (scaled.digits.length < sigs) {
    scaled = {
      sign: scaled.sign,
      digits: scaled.digits + new Array(sigs - scaled.digits.length + 1).join("0"),
      exp: scaled.exp
    };
  }
  var shown = formatParts(roundParts(scaled, sigs));
  if (!shown) return null;
    var correct = shown + " " + pair.to;
    var alt1 = formatParts(shiftExp(parseMeasure(shown), 1)) + " " + pair.to;
    var alt2 = formatParts(shiftExp(parseMeasure(shown), -1)) + " " + pair.to;
    var flipped = scaleMeasure(text, pair.den, pair.num);
    var inv = flipped ? formatParts(roundParts(flipped, sigs)) : null;
    var alt3 = (inv || "0") + " " + pair.to;
    var alt4 = text + " " + pair.to;
    var sig = "matter|unit|" + text + "|" + pair.from + "|" + pair.to;
    var packed = pack(correct, [alt1, alt2, alt3, alt4], sig);
    if (!packed) return null;
    return {
      stem: "Convert " + text + " " + pair.from + " to " + pair.to + ". The conversion factor is exact. Keep the significant figures of the measurement.",
      explanation: "Multiply by the exact factor (" + pair.num + "/" + pair.den + " " + pair.to + " per " + pair.from + "). " + text + " has " + sigs + " significant figures, so the result is " + correct + ".",
      sig: sig,
      packed: packed,
      meta: { op: "convert", text: text, num: pair.num, den: pair.den, from: pair.from, to: pair.to, sigs: sigs }
    };
  }

  function compoundBy(seed) {
    return COMPOUNDS[seed % COMPOUNDS.length];
  }

  function makeMolarMass(seed) {
    var c = compoundBy(seed);
    var cents = mmCents(c.atoms);
    var correct = centsToStr(cents) + " g/mol";
    var keys = Object.keys(c.atoms);
    var dropped = 0;
    if (keys.length) {
      var copy = {};
      keys.forEach(function (k) { copy[k] = c.atoms[k]; });
      var drop = keys[seed % keys.length];
      copy[drop] = Math.max(0, copy[drop] - 1);
      dropped = mmCents(copy);
    }
    var wrongs = [
      centsToStr(cents + 100) + " g/mol",
      centsToStr(Math.max(1, cents - 100)) + " g/mol",
      centsToStr(dropped || cents + 201) + " g/mol",
      centsToStr(cents + 1600) + " g/mol"
    ];
    var sig = "mole|mm|" + c.formula;
    var packed = pack(correct, wrongs, sig);
    if (!packed) return null;
    var bits = keys.map(function (k) { return k + " " + c.atoms[k] + " × " + centsToStr(MASS[k]); });
    return {
      stem: "What is the molar mass of " + c.formula + " (" + c.name + ")? " + massLine(),
      explanation: "Add the atomic masses: " + bits.join(", ") + ". The molar mass is " + correct + ".",
      sig: sig,
      packed: packed,
      meta: { op: "mm", formula: c.formula, atoms: c.atoms }
    };
  }

  function makeMoles(seed) {
    var c = compoundBy(seed + 3);
    var cents = mmCents(c.atoms);
    var mode = seed % 3;
    if (mode === 0) {
      var moles10 = 5 + (seed % 36);
      if ((moles10 * cents) % 10 !== 0) moles10 += 1;
      if ((moles10 * cents) % 10 !== 0) return null;
      var massC = moles10 * cents / 10;
      var correct = centsToStr(massC) + " g";
      var sig = "mole|mass|" + c.formula + "|" + moles10;
      var wrongs = [
        centsToStr(massC + cents) + " g",
        centsToStr(Math.max(1, massC - cents)) + " g",
        centsToStr(Math.floor(massC / 2)) + " g",
        centsToStr(massC + 100) + " g"
      ];
      var packed = pack(correct, wrongs, sig);
      if (!packed) return null;
      var molShown = (moles10 / 10).toFixed(1).replace(/\.0$/, ".0");
      return {
        stem: "What is the mass of " + molShown + " mol of " + c.formula + "? " + massLine() + " Give the mass to the hundredths place.",
        explanation: "Molar mass of " + c.formula + " is " + centsToStr(cents) + " g/mol. Mass = " + molShown + " × " + centsToStr(cents) + " = " + correct + ".",
        sig: sig,
        packed: packed,
        meta: { op: "mass", formula: c.formula, atoms: c.atoms, moles10: moles10 }
      };
    }
    if (mode === 1) {
      var m10 = 10 + (seed % 40);
      if ((m10 * cents) % 10 !== 0) return null;
      var mass = m10 * cents / 10;
      var correctM = (m10 / 10).toFixed(1) + " mol";
      var sigM = "mole|mol|" + c.formula + "|" + m10;
      var wrongM = [
        ((m10 + 10) / 10).toFixed(1) + " mol",
        ((m10 - 10) / 10).toFixed(1) + " mol",
        (m10 / 5).toFixed(1) + " mol",
        centsToStr(mass) + " mol"
      ];
      var packedM = pack(correctM, wrongM, sigM);
      if (!packedM) return null;
      return {
        stem: "How many moles are in " + centsToStr(mass) + " g of " + c.formula + "? " + massLine(),
        explanation: "Moles = mass / molar mass = " + centsToStr(mass) + " / " + centsToStr(cents) + " = " + correctM + ".",
        sig: sigM,
        packed: packedM,
        meta: { op: "mol", formula: c.formula, atoms: c.atoms, moles10: m10 }
      };
    }
    var halves = 1 + (seed % 10);
    var thousandths = 6022 * halves / 2;
    if (thousandths !== Math.round(thousandths)) return null;
    var shownP = formatParticles(thousandths);
    var molesP = (halves / 2);
    var molLabel = (halves % 2 === 0) ? String(halves / 2) : (halves / 2).toFixed(1);
    var sigN = "mole|particles|" + halves;
    var wrongN = [
      formatParticles(thousandths * 2),
      formatParticles(Math.max(1000, Math.round(thousandths / 2))),
      formatParticles(thousandths + 6022),
      formatParticles(Math.round(thousandths * 10))
    ];
    var packedN = pack(shownP, wrongN, sigN);
    if (!packedN) return null;
    return {
      stem: "How many particles are in " + molLabel + " mol? Use 6.022 × 10^23 particles in 1 mol, and keep four significant figures.",
      explanation: molLabel + " × 6.022 × 10^23 = " + shownP + " particles.",
      sig: sigN,
      packed: packedN,
      meta: { op: "particles", halves: halves }
    };
  }

  function formatParticles(thousandths) {
    var abs = Math.round(thousandths);
    if (abs <= 0) return null;
    var sigs = 4;
    var exp = String(abs).length - 1;
    var scale = Math.pow(10, exp - (sigs - 1));
    var rounded = Math.round(abs / scale);
    if (String(rounded).length > sigs) {
      rounded = Math.round(rounded / 10);
      exp += 1;
    }
    var rs = String(rounded);
    while (rs.length < sigs) rs += "0";
    var coeff = rs.charAt(0) + "." + rs.slice(1);
    return coeff + " × 10^" + (exp + 20);
  }

  function makeStoich(seed) {
    var rx = REACTIONS[seed % REACTIONS.length];
    var iFrom = seed % rx.parts.length;
    var iTo = (seed + 1 + (Math.floor(seed / 3) % (rx.parts.length - 1))) % rx.parts.length;
    if (iTo === iFrom) iTo = (iFrom + 1) % rx.parts.length;
    var from = rx.parts[iFrom];
    var to = rx.parts[iTo];
    var mode = Math.floor(seed / REACTIONS.length) % 2;
    var mult = 1 + (seed % 12);
    if (mode === 0) {
      var given = mult * from.c;
      var result = mult * to.c;
      var correct = result + " mol";
      var sig = "mole|stoich|mol|" + rx.eq + "|" + from.f + "|" + to.f + "|" + mult;
      var wrongs = [
        (result + from.c) + " mol",
        Math.max(1, result - 1) + " mol",
        given + " mol",
        (mult * from.c * to.c) + " mol"
      ];
      var packed = pack(correct, wrongs, sig);
      if (!packed) return null;
      return {
        stem: "For the reaction " + rx.eq + ", how many moles of " + to.f + " are produced or required when " + given + " mol of " + from.f + " reacts completely?",
        explanation: "The mole ratio of " + to.f + " to " + from.f + " is " + to.c + ":" + from.c + ". " + given + " × (" + to.c + "/" + from.c + ") = " + correct + ".",
        sig: sig,
        packed: packed,
        meta: { op: "mole-mole", given: given, cFrom: from.c, cTo: to.c }
      };
    }
    var atomsFrom = MASS_FORMULAS[from.f];
    var atomsTo = MASS_FORMULAS[to.f];
    if (!atomsFrom || !atomsTo) return null;
    var mmFrom = mmCents(atomsFrom);
    var mmTo = mmCents(atomsTo);
    var molesFromHalves = mult * 2;
    var massFrom = molesFromHalves * mmFrom / 2;
    var molesToHalves = molesFromHalves * to.c / from.c;
    if (molesToHalves !== Math.round(molesToHalves)) return null;
    if ((molesToHalves * mmTo) % 2 !== 0) return null;
    var massTo = molesToHalves * mmTo / 2;
    var correctG = centsToStr(massTo) + " g";
    var sigG = "mole|stoich|mass|" + from.f + "|" + to.f + "|" + mult + "|" + rx.eq;
    var wrongG = [
      centsToStr(massFrom) + " g",
      centsToStr(Math.max(1, massTo - mmTo)) + " g",
      centsToStr(massTo + mmFrom) + " g",
      centsToStr(Math.floor(massTo / 2) || massTo + 50) + " g"
    ];
    var packedG = pack(correctG, wrongG, sigG);
    if (!packedG) return null;
    return {
      stem: "For the reaction " + rx.eq + ", what mass of " + to.f + " forms or is used when " + centsToStr(massFrom) + " g of " + from.f + " reacts completely? " + massLine() + " Give the mass to the hundredths place.",
      explanation: "Moles of " + from.f + " = " + centsToStr(massFrom) + " / " + centsToStr(mmFrom) + ". Multiply by " + to.c + "/" + from.c + ", then by the molar mass of " + to.f + " (" + centsToStr(mmTo) + " g/mol). The mass is " + correctG + ".",
      sig: sigG,
      packed: packedG,
      meta: { op: "mass-mass", massFrom: massFrom, mmFrom: mmFrom, mmTo: mmTo, cFrom: from.c, cTo: to.c }
    };
  }

  var CACHE = {};

  function enumerateBoyle() {
    var out = [];
    for (var p1 = 1; p1 <= 20; p1++) {
      for (var v1 = 2; v1 <= 40; v1++) {
        for (var p2 = 1; p2 <= 20; p2++) {
          if (p2 === p1) continue;
          if ((p1 * v1) % p2 !== 0) continue;
          var v2 = (p1 * v1) / p2;
          if (v2 < 1 || v2 > 160 || v2 === v1) continue;
          out.push({ p1: p1, v1: v1, p2: p2, v2: v2 });
          if (out.length >= 2400) return out;
        }
      }
    }
    return out;
  }

  function enumerateCharles() {
    var out = [];
    for (var t1 = 280; t1 <= 380; t1 += 5) {
      for (var t2 = 280; t2 <= 380; t2 += 5) {
        if (t2 === t1) continue;
        for (var v1 = 2; v1 <= 24; v1++) {
          if ((v1 * t2) % t1 !== 0) continue;
          var v2 = (v1 * t2) / t1;
          if (v2 < 1 || v2 > 80 || v2 === v1) continue;
          out.push({ v1: v1, t1: t1, v2: v2, t2: t2 });
          if (out.length >= 2400) return out;
        }
      }
    }
    return out;
  }

  function enumerateCombined() {
    var out = [];
    for (var p1 = 1; p1 <= 6; p1++) {
      for (var v1 = 2; v1 <= 18; v1++) {
        for (var t1 = 280; t1 <= 360; t1 += 20) {
          for (var p2 = 1; p2 <= 6; p2++) {
            for (var t2 = 280; t2 <= 360; t2 += 20) {
              if (p1 === p2 && t1 === t2) continue;
              var den = t1 * p2;
              var num = p1 * v1 * t2;
              if (num % den !== 0) continue;
              var v2 = num / den;
              if (v2 < 1 || v2 > 120 || v2 === v1) continue;
              out.push({ p1: p1, v1: v1, t1: t1, p2: p2, t2: t2, v2: v2 });
              if (out.length >= 2400) return out;
            }
          }
        }
      }
    }
    return out;
  }

  function enumerateIdeal() {
    var out = [];
    for (var k = 2; k <= 40; k++) {
      for (var p = 5; p <= 30; p++) {
        for (var T = 250; T <= 400; T += 10) {
          var den = 100 * p;
          var num = k * 821 * T;
          if (num % den !== 0) continue;
          var v100 = num / den;
          if (v100 < 50 || v100 > 8000) continue;
          out.push({ k: k, p: p, T: T, v100: v100 });
          if (out.length >= 2400) return out;
        }
      }
    }
    return out;
  }

  function enumerateMolarity() {
    var out = [];
    for (var a = 1; a <= 40; a++) {
      for (var b = 2; b <= 40; b++) {
        if ((a * 100) % b !== 0) continue;
        var m100 = (a * 100) / b;
        if (m100 < 5 || m100 > 800) continue;
        out.push({ a: a, b: b, m100: m100 });
        if (out.length >= 2400) return out;
      }
    }
    return out;
  }

  function enumerateDilution() {
    var out = [];
    for (var m1 = 2; m1 <= 40; m1++) {
      for (var v1 = 10; v1 <= 200; v1 += 5) {
        for (var m2 = 1; m2 < m1; m2++) {
          if ((m1 * v1) % m2 !== 0) continue;
          var v2 = (m1 * v1) / m2;
          if (v2 <= v1 || v2 > 2000) continue;
          out.push({ m1: m1, v1: v1, m2: m2, v2: v2 });
          if (out.length >= 2400) return out;
        }
      }
    }
    return out;
  }

  function list(name, builder) {
    if (!CACHE[name]) CACHE[name] = builder();
    return CACHE[name];
  }

  function fixed1(n) {
    return (Math.round(n * 10) / 10).toFixed(1);
  }

  function makeBoyle(seed) {
    var rows = list("boyle", enumerateBoyle);
    var row = rows[seed % rows.length];
    var correct = row.v2 + " L";
    var sig = "gases|boyle|" + row.p1 + "|" + row.v1 + "|" + row.p2;
    var wrongs = [
      (row.v1 * row.p2 / row.p1) + " L",
      (row.v1 + row.p1) + " L",
      (row.v2 * 2) + " L",
      Math.max(1, row.v2 - row.p1) + " L"
    ];
    var packed = pack(correct, wrongs.map(function (w) {
      return String(w).indexOf(".") >= 0 ? String(Math.round(Number(w) * 100) / 100) + " L" : w;
    }), sig);
    if (!packed) return null;
    return {
      stem: "A gas has a volume of " + row.v1 + " L at " + row.p1 + " atm. The temperature stays the same and the pressure becomes " + row.p2 + " atm. What is the new volume?",
      explanation: "Boyle's law: P1 V1 = P2 V2. V2 = (" + row.p1 + " × " + row.v1 + ") / " + row.p2 + " = " + correct + ".",
      sig: sig,
      packed: packed,
      meta: { op: "boyle", p1: row.p1, v1: row.v1, p2: row.p2 }
    };
  }

  function makeCharles(seed) {
    var rows = list("charles", enumerateCharles);
    var row = rows[seed % rows.length];
    var correct = row.v2 + " L";
    var sig = "gases|charles|" + row.v1 + "|" + row.t1 + "|" + row.t2;
    var c1 = row.t1 - 273;
    var c2 = row.t2 - 273;
    var wrongs = [
      (row.v1 * c2 / c1) + " L",
      (row.v1 * row.t1 / row.t2) + " L",
      (row.v2 + row.v1) + " L",
      Math.max(1, row.v1 - 1) + " L"
    ];
    var packed = pack(correct, wrongs.map(function (w) {
      var n = Number(String(w).replace(" L", ""));
      if (!isFinite(n)) return "0 L";
      if (Math.abs(n - Math.round(n)) < 1e-9) return Math.round(n) + " L";
      return (Math.round(n * 100) / 100) + " L";
    }), sig);
    if (!packed) return null;
    return {
      stem: "A gas has a volume of " + row.v1 + " L at " + c1 + "°C. Pressure stays the same and the temperature becomes " + c2 + "°C. What is the new volume? Use T(K) = t(°C) + 273.",
      explanation: "Charles's law uses kelvin. T1 = " + row.t1 + " K and T2 = " + row.t2 + " K. V2 = " + row.v1 + " × (" + row.t2 + "/" + row.t1 + ") = " + correct + ".",
      sig: sig,
      packed: packed,
      meta: { op: "charles", v1: row.v1, t1: row.t1, t2: row.t2, c1: c1, c2: c2 }
    };
  }

  function makeCombined(seed) {
    var rows = list("combined", enumerateCombined);
    var row = rows[seed % rows.length];
    var correct = row.v2 + " L";
    var sig = "gases|combined|" + row.p1 + "|" + row.v1 + "|" + row.t1 + "|" + row.p2 + "|" + row.t2;
    var wrongs = [
      (row.v1 * row.p2 * row.t1 / (row.p1 * row.t2)) + " L",
      (row.v1 * row.t2 / row.t1) + " L",
      (row.v1 * row.p1 / row.p2) + " L",
      (row.v2 + 2) + " L"
    ];
    var packed = pack(correct, wrongs.map(function (w) {
      var n = Number(String(w).replace(" L", ""));
      if (!isFinite(n)) return "0 L";
      if (Math.abs(n - Math.round(n)) < 1e-9) return Math.round(n) + " L";
      return (Math.round(n * 100) / 100) + " L";
    }), sig);
    if (!packed) return null;
    return {
      stem: "A gas sample has P1 = " + row.p1 + " atm, V1 = " + row.v1 + " L, and T1 = " + row.t1 + " K. It changes to P2 = " + row.p2 + " atm and T2 = " + row.t2 + " K. What is V2?",
      explanation: "Combined gas law: P1 V1 / T1 = P2 V2 / T2. V2 = (" + row.p1 + " × " + row.v1 + " × " + row.t2 + ") / (" + row.t1 + " × " + row.p2 + ") = " + correct + ".",
      sig: sig,
      packed: packed,
      meta: { op: "combined", p1: row.p1, v1: row.v1, t1: row.t1, p2: row.p2, t2: row.t2 }
    };
  }

  function makeIdeal(seed) {
    var rows = list("ideal", enumerateIdeal);
    var row = rows[seed % rows.length];
    var solve = seed % 3;
    var n = row.k / 10;
    var P = row.p / 10;
    var V = row.v100 / 100;
    var T = row.T;
    var nText = n.toFixed(1);
    var pText = P.toFixed(1);
    var vText = V.toFixed(2);
    var correct;
    var sig;
    var explanation;
    var stem;
    var meta;
    if (solve === 0) {
      correct = vText + " L";
      sig = "gases|ideal|V|" + row.k + "|" + row.p + "|" + row.T;
      stem = "What is the volume of " + nText + " mol of gas at " + pText + " atm and " + T + " K? Use R = 0.0821 L·atm/(mol·K), and give the volume to the hundredths place.";
      explanation = "V = nRT / P = (" + nText + " × 0.0821 × " + T + ") / " + pText + " = " + correct + ".";
      meta = { op: "ideal", solve: "V", k: row.k, p: row.p, T: row.T };
    } else if (solve === 1) {
      correct = nText + " mol";
      sig = "gases|ideal|n|" + row.k + "|" + row.p + "|" + row.T;
      stem = "How many moles of gas are in " + vText + " L at " + pText + " atm and " + T + " K? Use R = 0.0821 L·atm/(mol·K).";
      explanation = "n = PV / RT = (" + pText + " × " + vText + ") / (0.0821 × " + T + ") = " + correct + ".";
      meta = { op: "ideal", solve: "n", k: row.k, p: row.p, T: row.T };
    } else {
      correct = pText + " atm";
      sig = "gases|ideal|P|" + row.k + "|" + row.p + "|" + row.T;
      stem = "What is the pressure of " + nText + " mol of gas in " + vText + " L at " + T + " K? Use R = 0.0821 L·atm/(mol·K).";
      explanation = "P = nRT / V = (" + nText + " × 0.0821 × " + T + ") / " + vText + " = " + correct + ".";
      meta = { op: "ideal", solve: "P", k: row.k, p: row.p, T: row.T };
    }
    var wrongs = [
      (solve === 0 ? (V * 10).toFixed(2) + " L" : solve === 1 ? (n * 10).toFixed(1) + " mol" : (P * 2).toFixed(1) + " atm"),
      (solve === 0 ? (V / 10).toFixed(2) + " L" : solve === 1 ? (n / 2).toFixed(1) + " mol" : (P / 2).toFixed(1) + " atm"),
      (solve === 0 ? nText + " L" : solve === 1 ? vText + " mol" : vText + " atm"),
      (solve === 0 ? (V + 1).toFixed(2) + " L" : solve === 1 ? (n + 1).toFixed(1) + " mol" : (P + 1).toFixed(1) + " atm")
    ];
    var packed = pack(correct, wrongs, sig);
    if (!packed) return null;
    return { stem: stem, explanation: explanation, sig: sig, packed: packed, meta: meta };
  }

  function makeMolarity(seed) {
    var rows = list("molarity", enumerateMolarity);
    var row = rows[seed % rows.length];
    var moles = row.a / 10;
    var liters = row.b / 10;
    var M = row.m100 / 100;
    var correct = M.toFixed(2) + " M";
    var sig = "solutions|molarity|" + row.a + "|" + row.b;
    var wrongs = [
      (moles / (liters * 1000)).toFixed(2) + " M",
      (moles * liters).toFixed(2) + " M",
      (row.m100 / 10).toFixed(2) + " M",
      Math.max(0.01, M - 0.5).toFixed(2) + " M"
    ];
    var packed = pack(correct, wrongs, sig);
    if (!packed) return null;
    return {
      stem: "What is the molarity of a solution that contains " + moles.toFixed(1) + " mol of solute in " + liters.toFixed(1) + " L of solution?",
      explanation: "Molarity = moles / liters = " + moles.toFixed(1) + " / " + liters.toFixed(1) + " = " + correct + ".",
      sig: sig,
      packed: packed,
      meta: { op: "molarity", a: row.a, b: row.b }
    };
  }

  function makeDilution(seed) {
    var rows = list("dilution", enumerateDilution);
    var row = rows[seed % rows.length];
    var askV1 = seed % 2 === 0;
    var m1 = (row.m1 / 10).toFixed(1);
    var m2 = (row.m2 / 10).toFixed(1);
    var correct = (askV1 ? row.v1 : row.v2) + " mL";
    var sig = "solutions|dilution|" + (askV1 ? "v1" : "v2") + "|" + row.m1 + "|" + row.v1 + "|" + row.m2 + "|" + row.v2;
    var wrongs = [
      (askV1 ? row.v2 : row.v1) + " mL",
      (row.v2 + row.v1) + " mL",
      Math.max(1, (askV1 ? row.v1 : row.v2) * 2) + " mL",
      Math.max(1, Math.round((askV1 ? row.v1 : row.v2) / 2)) + " mL"
    ];
    var packed = pack(correct, wrongs, sig);
    if (!packed) return null;
    var stem = askV1
      ? "What volume of " + m1 + " M stock solution is needed to prepare " + row.v2 + " mL of " + m2 + " M solution?"
      : "A " + row.v1 + " mL sample of " + m1 + " M solution is diluted to " + m2 + " M. What is the final volume?";
    return {
      stem: stem,
      explanation: "Dilution keeps moles constant: M1 V1 = M2 V2. " + m1 + " × " + row.v1 + " = " + m2 + " × " + row.v2 + ". The asked volume is " + correct + ".",
      sig: sig,
      packed: packed,
      meta: { op: "dilution", m1: row.m1, v1: row.v1, m2: row.m2, v2: row.v2, ask: askV1 ? "v1" : "v2" }
    };
  }

  function phText(n) {
    return n.toFixed(2);
  }

  function hText(exp) {
    return "1.0 × 10^-" + exp;
  }

function makePhFamily(seed, wantPoh) {
  var exp = 1 + (seed % 6);
  var kinds = wantPoh
    ? ["poh-from-ph", "poh-from-oh", "poh-strong-base"]
    : ["ph-from-h", "ph-from-oh", "strong-acid", "strong-base", "h-from-ph", "oh-from-ph"];
  var kind = kinds[Math.floor(seed / 6) % kinds.length];
    var correct;
    var stem;
    var explanation;
    if (kind === "ph-from-h") {
      correct = phText(exp);
      stem = "What is the pH of a solution with [H+] = " + hText(exp) + " M?";
      explanation = "pH = −log[H+]. For 1.0 × 10^-" + exp + ", the pH is " + correct + ".";
    } else if (kind === "strong-acid") {
      correct = phText(exp);
      stem = "What is the pH of " + hText(exp) + " M HCl? Treat HCl as a strong acid that ionizes completely.";
      explanation = "A strong acid of concentration 1.0 × 10^-" + exp + " M has [H+] = 1.0 × 10^-" + exp + ", so the pH is " + correct + ".";
    } else if (kind === "ph-from-oh" || kind === "strong-base") {
      correct = phText(14 - exp);
      stem = kind === "strong-base"
        ? "What is the pH of " + hText(exp) + " M NaOH? Treat NaOH as a strong base."
        : "What is the pH when [OH−] = " + hText(exp) + " M? Use pH + pOH = 14.00.";
      explanation = "[OH−] = 1.0 × 10^-" + exp + " so pOH = " + phText(exp) + ". pH = 14.00 − " + phText(exp) + " = " + correct + ".";
    } else if (kind === "h-from-ph") {
      correct = hText(exp) + " M";
      stem = "A solution has pH " + phText(exp) + ". What is [H+]?";
      explanation = "[H+] = 10^(−pH) = " + correct + ".";
    } else if (kind === "oh-from-ph") {
      correct = hText(14 - exp) + " M";
      stem = "A solution has pH " + phText(exp) + ". What is [OH−]? Use [H+][OH−] = 1.0 × 10^−14.";
      explanation = "pOH = 14.00 − " + phText(exp) + " = " + phText(14 - exp) + ", so [OH−] = " + correct + ".";
    } else if (kind === "poh-from-ph") {
      correct = phText(14 - exp);
      stem = "What is the pOH of a solution with pH " + phText(exp) + "?";
      explanation = "pOH = 14.00 − pH = 14.00 − " + phText(exp) + " = " + correct + ".";
    } else if (kind === "poh-from-oh") {
      correct = phText(exp);
      stem = "What is the pOH when [OH−] = " + hText(exp) + " M?";
      explanation = "pOH = −log[OH−] = " + correct + ".";
    } else {
      correct = phText(exp);
      stem = "What is the pOH of " + hText(exp) + " M NaOH? Treat NaOH as a strong base.";
      explanation = "The base is strong, so [OH−] = 1.0 × 10^-" + exp + " and pOH = " + correct + ".";
    }
    var numeric = /^\d/.test(correct) && correct.indexOf("×") < 0;
    var wrongs;
    if (numeric) {
      var val = Number(correct);
      wrongs = [phText(val + 1), phText(Math.max(0, val - 1)), phText(14 - val), phText(val + 2)];
    } else {
      wrongs = [hText(exp + 1) + " M", hText(Math.max(1, exp - 1)) + " M", hText(exp) + " M", hText(14 - exp + 1) + " M"];
      if (kind === "h-from-ph") wrongs[2] = hText(14 - exp) + " M";
    }
    var sig = "acids|" + (wantPoh ? "poh" : "ph") + "|" + kind + "|" + exp;
    var packed = pack(correct, wrongs, sig);
    if (!packed) return null;
    return {
      stem: stem,
      explanation: explanation,
      sig: sig,
      packed: packed,
      meta: { op: wantPoh ? "poh" : "ph", kind: kind, exp: exp }
    };
  }

  var BUILDERS = {
    sigfig: makeSigfig,
    unit: makeUnit,
    "molar-mass": makeMolarMass,
    moles: makeMoles,
    stoich: makeStoich,
    boyle: makeBoyle,
    charles: makeCharles,
    combined: makeCombined,
    ideal: makeIdeal,
    molarity: makeMolarity,
    dilution: makeDilution,
    ph: function (seed) { return makePhFamily(seed, false); },
    poh: function (seed) { return makePhFamily(seed, true); }
  };

  function make(type, seed) {
    var build = BUILDERS[type];
    if (!build) return null;
    var n = seed >>> 0;
    for (var hop = 0; hop < 12; hop++) {
      var built = build(n + hop * 997);
      var item = emit(type, seed, built);
      if (item) return item;
    }
    return null;
  }

  function can(type) {
    return !!BUILDERS[type];
  }

  function typesForTopic(topic) {
    return TYPES.filter(function (t) { return TYPE_TOPIC[t] === topic; });
  }

  return {
    types: TYPES,
    typeTopic: TYPE_TOPIC,
    make: make,
    can: can,
    parseGenId: parseGenId,
    typesForTopic: typesForTopic,
    countSig: countSig,
    parseMeasure: parseMeasure,
    formatParts: formatParts,
    roundParts: roundParts,
    valueOf: valueOf,
    centsToStr: centsToStr,
    mmCents: mmCents,
    MASS: MASS,
    compounds: COMPOUNDS,
    formatParticles: formatParticles
  };
});
