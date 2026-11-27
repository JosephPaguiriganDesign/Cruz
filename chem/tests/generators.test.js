"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");
var gen = require("../data/generators");
var sel = require("../data/select");

var failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    if (failed <= 30) console.error("FAIL:", msg);
  }
}

function ulp(n, sigs) {
  var abs = Math.abs(n);
  if (!abs) return 1;
  var exp = Math.floor(Math.log10(abs));
  var pow = Math.pow(10, exp);
  if (abs / pow >= 10 - 1e-9) exp += 1;
  if (abs / pow < 1 - 1e-12) exp -= 1;
  return Math.pow(10, exp - sigs + 1);
}

function numericChoice(text) {
  return gen.valueOf(String(text).replace(/\s+[A-Za-z/°].*$/, "").replace(/ mL$/, "").replace(/ L$/, "").replace(/ M$/, "").replace(/ mol$/, "").replace(/ g\/mol$/, "").replace(/ g$/, "").replace(/ atm$/, ""));
}

function expectChoice(item) {
  var m = item.meta;
  if (m.op === "count") return String(countSig(m.text));
  if (m.op === "add") return (Number(m.a) + Number(m.b)).toFixed(m.decimals);
  if (m.op === "mm") return cents(m.atoms) + " g/mol";
  if (m.op === "mass") return centsStr(m.moles10 * centsNum(m.atoms) / 10) + " g";
  if (m.op === "mol") return (m.moles10 / 10).toFixed(1) + " mol";
  if (m.op === "particles") return particles(m.halves);
  if (m.op === "mole-mole") return (m.given * m.cTo / m.cFrom) + " mol";
  if (m.op === "mass-mass") {
    var massTo = (m.massFrom / m.mmFrom) * (m.cTo / m.cFrom) * m.mmTo;
    return centsStr(Math.round(massTo)) + " g";
  }
  if (m.op === "boyle") return (m.p1 * m.v1 / m.p2) + " L";
  if (m.op === "charles") return (m.v1 * m.t2 / m.t1) + " L";
  if (m.op === "combined") return (m.p1 * m.v1 * m.t2 / (m.t1 * m.p2)) + " L";
  if (m.op === "ideal") {
    var v100 = m.k * 821 * m.T / (100 * m.p);
    if (m.solve === "V") return (v100 / 100).toFixed(2) + " L";
    if (m.solve === "n") return (m.k / 10).toFixed(1) + " mol";
    return (m.p / 10).toFixed(1) + " atm";
  }
  if (m.op === "molarity") return ((m.a / m.b)).toFixed(2) + " M";
  if (m.op === "dilution") return (m.ask === "v1" ? m.v1 : m.v2) + " mL";
  if (m.op === "ph" || m.op === "poh") return phExpect(m);
  return null;
}

function countSig(str) {
  var p = parse(str);
  return p && p.digits !== "0" ? p.digits.length : 0;
}
function parse(raw) {
  var s = String(raw).replace(/\s+/g, "").replace(/×/g, "x");
  var expExtra = 0;
  var m = s.match(/^([+-]?\d*\.?\d+)x10\^([+-]?\d+)$/i);
  if (m) { s = m[1]; expExtra = Number(m[2]); }
  if (s.charAt(0) === "+" || s.charAt(0) === "-") s = s.slice(s.charAt(0) === "-" ? 1 : 1);
  var dot = s.indexOf(".");
  var intPart = dot >= 0 ? s.slice(0, dot) : s;
  var frac = dot >= 0 ? s.slice(dot + 1) : null;
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
    digits = intPart.replace(/0+$/, "") || "0";
    exp = digits === "0" ? 0 : intPart.length - 1;
  }
  return { digits: digits, exp: exp + expExtra };
}
function centsNum(atoms) {
  var mass = { H: 101, C: 1201, N: 1401, O: 1600, Na: 2299, Mg: 2431, Al: 2698, P: 3097, S: 3207, Cl: 3545, K: 3910, Ca: 4008, Fe: 5585, Cu: 6355, Zn: 6538, Ag: 10787, Br: 7990 };
  var sum = 0;
  Object.keys(atoms).forEach(function (el) { sum += atoms[el] * mass[el]; });
  return sum;
}
function centsStr(cents) {
  var n = Math.abs(Math.round(cents));
  return Math.floor(n / 100) + "." + (n % 100 < 10 ? "0" : "") + (n % 100);
}
function cents(atoms) { return centsStr(centsNum(atoms)); }
function particles(halves) {
  var abs = 6022 * halves / 2;
  var sigs = 4;
  var exp = String(Math.round(abs)).length - 1;
  var scale = Math.pow(10, exp - (sigs - 1));
  var rounded = Math.round(abs / scale);
  if (String(rounded).length > sigs) { rounded = Math.round(rounded / 10); exp += 1; }
  var rs = String(rounded);
  while (rs.length < sigs) rs += "0";
  return rs.charAt(0) + "." + rs.slice(1) + " × 10^" + (exp + 20);
}
function phExpect(m) {
  var exp = m.exp;
  var k = m.kind;
  if (k === "ph-from-h" || k === "strong-acid" || k === "poh-from-oh" || k === "poh-strong-base") return exp.toFixed(2);
  if (k === "ph-from-oh" || k === "strong-base" || k === "poh-from-ph") return (14 - exp).toFixed(2);
  if (k === "h-from-ph") return "1.0 × 10^-" + exp + " M";
  if (k === "oh-from-ph") return "1.0 × 10^-" + (14 - exp) + " M";
  return null;
}

assert(countSig("0.00450") === 3, "count 0.00450");
assert(countSig("3.070") === 4, "count 3.070");
assert(countSig("1500") === 2, "count 1500");

gen.types.forEach(function (type) {
  var sigs = {};
  for (var seed = 0; seed < 2000; seed++) {
    var item = gen.make(type, seed);
    assert(item, type + " null " + seed);
    if (!item) continue;
    assert(JSON.stringify(gen.make(type, seed)) === JSON.stringify(item), "unstable " + item.id);
    assert(item.choices.length === 4, "choices " + item.id);
    assert(item.answer >= 0 && item.answer < 4, "answer " + item.id);
    var seen = {};
    item.choices.forEach(function (c) {
      assert(c && String(c).indexOf("NaN") < 0 && String(c).indexOf("undefined") < 0, "bad choice " + item.id + " " + c);
      assert(!seen[c], "dup " + item.id + " " + c);
      seen[c] = true;
    });
    assert(item.stem.indexOf("NaN") < 0 && item.explanation.indexOf("NaN") < 0, "NaN text " + item.id);
    var parsed = gen.parseGenId(item.id);
    assert(parsed && parsed.type === type && parsed.seed === seed, "id " + item.id);
    sigs[item.sig] = true;
    var m = item.meta;
    var got = item.choices[item.answer];
    if (m.op === "round" || m.op === "product" || m.op === "convert") {
      var raw = m.op === "round" ? gen.valueOf(m.text) : m.op === "product" ? gen.valueOf(m.a) * gen.valueOf(m.b) : gen.valueOf(m.text) * m.num / m.den;
      var shown = numericChoice(got);
      var step = ulp(raw || shown, m.sigs);
      assert(Math.abs(shown - raw) <= step * 0.55 + 1e-9, type + " " + seed + " " + shown + " vs " + raw + " :: " + got);
    } else if (m.op === "charles") {
      assert(m.t1 === m.c1 + 273 && m.t2 === m.c2 + 273, "kelvin " + item.id);
      assert(got === expectChoice(item), item.id + " " + got + " != " + expectChoice(item));
    } else {
      var expect = expectChoice(item);
      assert(expect === got, item.id + " expected " + expect + " got " + got);
    }
    if (m.op === "molarity") {
      var molar = (m.a / 10) / (m.b / 10);
      assert(Math.abs(parseFloat(got) - molar) < 1e-9, "M recompute " + item.id + " " + got);
    }
  }
  console.log(type, "unique signatures in 2000", Object.keys(sigs).length);
});

var bank = require("../data/bank");
var counts = {};
var ids = {};
bank.forEach(function (q) {
  counts[q.topic] = (counts[q.topic] || 0) + 1;
  assert(!ids[q.id], "dup id " + q.id);
  ids[q.id] = true;
  assert(q.choices.length === 4 && q.answer >= 0 && q.answer < 4, "bank " + q.id);
});
Object.keys(counts).forEach(function (topic) {
  assert(counts[topic] >= 25, topic + " count " + counts[topic]);
});
console.log("bank", counts);

var seen = { items: {}, cursors: {}, cycles: {} };
var first = sel.practice({ bank: bank, seen: seen, topic: "gases", n: 8, now: 1000, gen: gen });
var second = sel.practice({ bank: bank, seen: seen, topic: "gases", n: 8, now: 2000, gen: gen });
assert(first.items.length === 8 && second.items.length === 8, "practice length");
var set1 = {};
first.items.forEach(function (item) { set1[sel.signature(item)] = true; });
second.items.forEach(function (item) {
  assert(!set1[sel.signature(item)], "overlap " + sel.signature(item));
});

var root = path.join(__dirname, "..");
["app.js", "data/bank.js", "data/generators.js", "data/select.js", "data/lessons.js", "data/elements.js"].forEach(function (file) {
  var text = fs.readFileSync(path.join(root, file), "utf8");
  assert(text.indexOf("hspt-") < 0, "foreign key in " + file);
  assert(!/Cruz/.test(text), "Cruz in " + file);
});

var elements = require("../data/elements");
assert(elements.elements.length === 118, "118");
elements.elements.forEach(function (el) {
  if (el.z >= 109) assert(el.category === "unknown" && el.label === "Unknown properties", "unk " + el.z);
});

if (failed) {
  console.error(failed + " assertion(s) failed");
  process.exit(1);
}
console.log("ok");
