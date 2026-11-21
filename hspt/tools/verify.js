"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const file = path.join(__dirname, "..", "data", "bank.js");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(file, "utf8"), sandbox);
const bank = sandbox.window.HSPT_BANK;
const passages = sandbox.window.HSPT_PASSAGES;

const ids = new Set();
const errors = [];
function bad(msg) { errors.push(msg); }

const mockTotals = { 1: {}, 2: {} };
bank.forEach(function (it) {
  if (ids.has(it.id)) bad("dup id " + it.id);
  ids.add(it.id);
  if (!it.stem || !it.explanation) bad("empty text " + it.id);
  if (!it.choices || it.choices.length < 3 || it.choices.length > 4) bad("choices " + it.id);
  if (new Set(it.choices).size !== it.choices.length) bad("dup choice " + it.id);
  if (it.answer < 0 || it.answer >= it.choices.length) bad("answer range " + it.id);
  if (it.mock === 1 || it.mock === 2) {
    mockTotals[it.mock][it.section] = (mockTotals[it.mock][it.section] || 0) + 1;
  }
  if (it.meta && it.meta.kind === "syn" && it.choices[it.answer] !== it.meta.syn) bad("syn " + it.id);
  if (it.meta && it.meta.kind === "ant" && it.choices[it.answer] !== it.meta.ant) bad("ant " + it.id);
  if (it.meta && it.meta.kind === "context" && it.choices[it.answer] !== it.meta.def) bad("ctx " + it.id);
  if (it.meta && it.meta.kind === "analogy" && it.choices[it.answer] !== it.meta.correct) bad("ana " + it.id);
  if (it.meta && it.meta.kind === "class" && it.choices[it.answer] !== it.meta.odd) bad("cls " + it.id);
  if (it.meta && it.meta.kind === "logic" && it.choices[it.answer] !== it.meta.correct) bad("log " + it.id);
  if (it.meta && it.meta.kind === "passage" && it.choices[it.answer] !== it.meta.correct) bad("pass " + it.id);
  if (it.meta && it.meta.kind === "language" && it.choices[it.answer] !== it.meta.correct) bad("lang " + it.id);
  if (it.meta && it.meta.kind === "spell" && it.choices[it.answer] !== it.meta.correct) bad("spell " + it.id);
  if (it.meta && it.meta.kind === "series") {
    if (String(it.meta.next) !== it.choices[it.answer]) bad("series " + it.id);
    const terms = it.meta.terms;
    if (terms.length < 3) bad("series short " + it.id);
  }
  if (it.meta && it.meta.kind === "cmp") {
    let expect = 2;
    if (it.meta.av > it.meta.bv) expect = 0;
    else if (it.meta.av < it.meta.bv) expect = 1;
    if (it.answer !== expect) bad("cmp " + it.id + " " + it.meta.av + " " + it.meta.bv);
  }
  if (it.meta && it.meta.kind === "number") {
    const raw = it.choices[it.answer].replace("$", "");
    if (Number(raw) !== it.meta.value) bad("number " + it.id);
  }
  if (it.meta && it.meta.kind === "math") {
    const raw = it.choices[it.answer].replace("$", "");
    if (String(it.meta.value) !== raw && Number(raw) !== Number(it.meta.value)) bad("math " + it.id + " " + raw + " vs " + it.meta.value);
  }
  if (it.passageId && !passages.some(function (p) { return p.id === it.passageId; })) bad("missing passage " + it.id);
});

[1, 2].forEach(function (m) {
  const t = mockTotals[m];
  const expect = { verbal: 60, quant: 52, reading: 62, math: 64, language: 60 };
  Object.keys(expect).forEach(function (s) {
    if (t[s] !== expect[s]) bad("mock " + m + " " + s + " = " + t[s]);
  });
});

// Recompute a sample of math stories from the stem is not fully general.
// The meta value is the generator's computed answer, and the choice must match it.
// Also recompute known patterns from the stem when possible.
let recomputed = 0;
bank.forEach(function (it) {
  if (!it.meta || it.meta.kind !== "math") return;
  if (it.meta.type === "fraction") {
    const m = it.stem.match(/1\/4 of (\d+)/);
    if (!m) bad("frac stem " + it.id);
    else if (Number(m[1]) / 4 !== it.meta.value) bad("frac math " + it.id);
    recomputed++;
  }
  if (it.meta.type === "perim") {
    const m = it.stem.match(/(\d+) inches long and (\d+) inches wide/);
    if (!m) bad("perim stem " + it.id);
    else if (2 * (Number(m[1]) + Number(m[2])) !== it.meta.value) bad("perim math " + it.id);
    recomputed++;
  }
  if (it.meta.type === "unit") {
    const m = it.stem.match(/(\d+) dollars buys (\d+)/);
    if (!m) bad("unit stem " + it.id);
    else if (Number(m[1]) / Number(m[2]) !== it.meta.value) bad("unit math " + it.id);
    recomputed++;
  }
  if (it.meta.type === "eq2") {
    const m = it.stem.match(/n \+ 4 = (\d+)/);
    if (!m) bad("eq stem " + it.id);
    else if (Number(m[1]) - 4 !== it.meta.value) bad("eq math " + it.id);
    recomputed++;
  }
  if (it.meta.type === "percent-off") {
    const m = it.stem.match(/\$(\d+).*?(\d+)%/);
    if (!m) bad("pct stem " + it.id);
    else {
      const price = Number(m[1]);
      const pct = Number(m[2]);
      const sale = price - price * pct / 100;
      if (sale !== it.meta.value) bad("pct math " + it.id);
    }
    recomputed++;
  }
  if (it.meta.type === "area") {
    const m = it.stem.match(/(\d+) cm long and (\d+) cm wide/);
    if (!m) bad("area stem " + it.id);
    else if (Number(m[1]) * Number(m[2]) !== it.meta.value) bad("area math " + it.id);
    recomputed++;
  }
  if (it.meta.type === "eq") {
    const m = it.stem.match(/x \+ (\d+) = (\d+)/);
    if (!m) bad("eqx stem " + it.id);
    else if (Number(m[2]) - Number(m[1]) !== it.meta.value) bad("eqx math " + it.id);
    recomputed++;
  }
  if (it.meta.type === "mean") {
    const m = it.stem.match(/mean of (\d+), (\d+), (\d+), and (\d+)/);
    if (!m) bad("mean stem " + it.id);
    else {
      const nums = [1, 2, 3, 4].map(function (i) { return Number(m[i]); });
      const mean = nums.reduce(function (a, b) { return a + b; }, 0) / 4;
      if (mean !== it.meta.value) bad("mean math " + it.id);
    }
    recomputed++;
  }
  if (it.meta.type === "ratio") {
    const m = it.stem.match(/(\d+):(\d+).*?(\d+) red/);
    if (!m) bad("ratio stem " + it.id);
    else {
      const red = Number(m[1]);
      const blue = Number(m[2]);
      const have = Number(m[3]);
      const factor = have / red;
      if (blue * factor !== it.meta.value) bad("ratio math " + it.id);
    }
    recomputed++;
  }
});

if (recomputed < 50) bad("too few recomputed math items " + recomputed);

if (errors.length) {
  console.log(errors.slice(0, 30).join("\n"));
  console.log("ERRORS", errors.length);
  process.exit(1);
}
console.log("verified", bank.length, "questions;", recomputed, "math items recomputed from the stems");
