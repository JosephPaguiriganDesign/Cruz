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
    if (failed <= 40) console.error("FAIL:", msg);
  }
}

function choiceOk(item) {
  assert(item && item.stem && item.explanation, "missing text " + (item && item.id));
  if (!item) return;
  assert(item.choices && (item.choices.length === 4 || (item.type === "comparison" && item.choices.length === 3)), "choice count " + item.id + " " + (item.choices && item.choices.length));
  assert(item.answer >= 0 && item.answer < item.choices.length, "answer range " + item.id);
  var seen = {};
  item.choices.forEach(function (c, i) {
    assert(typeof c === "string" && c.length > 0, "blank choice " + item.id + " #" + i);
    assert(c.indexOf("NaN") < 0 && c.indexOf("undefined") < 0 && c !== "null", "bad choice " + item.id + " " + c);
    assert(!seen[c], "dup choice " + item.id + " " + c);
    seen[c] = true;
  });
  assert(item.stem.indexOf("NaN") < 0 && item.explanation.indexOf("NaN") < 0, "NaN text " + item.id);
  assert(item.stem.indexOf("undefined") < 0 && item.explanation.indexOf("undefined") < 0, "undefined text " + item.id);
  assert(item.explanation.indexOf(String(item.choices[item.answer]).slice(0, 12)) >= 0 || item.explanation.length > 10, "explanation present " + item.id);
}

function ints(item) {
  item.choices.forEach(function (c) {
    if (item.type === "comparison") return;
    if (item.meta && (item.meta.op === "ineq" || item.meta.op === "what-percent" || item.meta.op === "discount" || String(item.meta.op || "").indexOf("spell") === 0)) return;
  });
}

function expectNumber(item, value) {
  var raw = item.choices[item.answer].replace(/^\$/, "").replace(/%$/, "");
  assert(Number(raw) === value, item.id + " choice " + raw + " != " + value + " :: " + item.stem);
  item.choices.forEach(function (c, i) {
    if (i === item.answer) return;
    var other = c.replace(/^\$/, "").replace(/%$/, "");
    if (other !== "" && !isNaN(Number(other))) {
      assert(Number(other) !== value, item.id + " distractor also " + value);
    }
  });
  assert(item.explanation.indexOf(String(value)) >= 0, item.id + " explanation missing " + value);
}

function checkSeries(item) {
  var m = item.stem.match(/\n\n(.+), ____$/);
  assert(m, "series stem " + item.id);
  if (!m) return;
  var terms = m[1].split(", ").map(Number);
  assert(terms.join(",") === item.meta.terms.join(","), "series terms drift " + item.id);
  var next;
  if (item.meta.op === "add") {
    var step = item.meta.step;
    for (var i = 0; i < 5; i++) assert(terms[i] === item.meta.start + i * step, "add term " + item.id);
    next = terms[4] + step;
    assert(terms[1] - terms[0] === step, "add step " + item.id);
  } else if (item.meta.op === "sub") {
    var sub = item.meta.step;
    for (var j = 0; j < 5; j++) assert(terms[j] === item.meta.start - j * sub, "sub term " + item.id);
    next = terms[4] - sub;
  } else {
    var gap = item.meta.gap;
    var grow = item.meta.grow;
    assert(grow > 0, "grow " + item.id);
    var t = item.meta.start;
    assert(terms[0] === t, "gap start " + item.id);
    for (var k = 0; k < 4; k++) {
      t = t + gap + k * grow;
      assert(terms[k + 1] === t, "gap term " + item.id);
    }
    next = terms[4] + gap + 4 * grow;
    var d0 = terms[1] - terms[0];
    var arithmetic = true;
    for (var n = 2; n < terms.length; n++) {
      if (terms[n] - terms[n - 1] !== d0) arithmetic = false;
    }
    assert(!arithmetic, "gaps collapsed to arithmetic " + item.id);
  }
  assert(next === item.meta.next, "meta next " + item.id);
  expectNumber(item, next);
}

function checkComparison(item) {
  var meta = item.meta;
  var av;
  var bv;
  if (meta.op === "percent") {
    assert((meta.p * meta.n) % 100 === 0 && (meta.q * meta.m) % 100 === 0, "percent div " + item.id);
    av = (meta.p * meta.n) / 100;
    bv = (meta.q * meta.m) / 100;
    assert(item.stem.indexOf(meta.p + "% of " + meta.n) >= 0, "stem p " + item.id);
  } else if (meta.op === "fraction") {
    av = meta.a * meta.d;
    bv = meta.c * meta.b;
  } else if (meta.op === "area") {
    av = meta.l1 * meta.w1;
    bv = meta.l2 * meta.w2;
  } else if (meta.op === "perim") {
    av = 4 * meta.s;
    bv = 2 * (meta.l + meta.w);
  } else {
    assert(false, "cmp op " + item.id);
    return;
  }
  var expect = 2;
  if (av > bv) expect = 0;
  else if (av < bv) expect = 1;
  assert(item.answer === expect, item.id + " cmp " + av + " vs " + bv + " got " + item.answer);
  assert(item.choices[0].indexOf("Column A") >= 0, "label A");
  assert(item.choices[1].indexOf("Column B") >= 0, "label B");
  assert(item.choices[2].indexOf("equal") >= 0, "label eq");
}

function checkNumber(item) {
  var meta = item.meta;
  if (meta.op === "percent-of") {
    assert((meta.p * meta.n) % 100 === 0, "pct " + item.id);
    expectNumber(item, (meta.p * meta.n) / 100);
  } else if (meta.op === "what-percent") {
    assert((meta.p * meta.whole) / 100 === meta.part, "part " + item.id);
    expectNumber(item, meta.p);
  } else if (meta.op === "halfway") {
    assert((meta.low + meta.high) % 2 === 0, "halfway even " + item.id);
    expectNumber(item, (meta.low + meta.high) / 2);
  } else if (meta.op === "twice-plus") {
    expectNumber(item, 2 * meta.n + meta.plus);
  } else assert(false, "num op " + item.id);
}

function checkProblem(item) {
  var meta = item.meta;
  if (meta.op === "eq-add") expectNumber(item, meta.x);
  else if (meta.op === "eq-sub") {
    assert(item.stem.indexOf("= " + (meta.x - meta.a)) >= 0, "eq-sub stem " + item.id);
    expectNumber(item, meta.x);
  } else if (meta.op === "eq-mul") expectNumber(item, meta.x);
  else if (meta.op === "eq-two") expectNumber(item, meta.x);
  else if (meta.op === "ineq") {
    var c = meta.a * meta.boundary + meta.b;
    assert(meta.a * (meta.boundary - 1) + meta.b < c, "ineq below " + item.id);
    assert(meta.a * meta.boundary + meta.b >= c, "ineq edge " + item.id);
    assert(item.choices[item.answer] === "x < " + meta.boundary, "ineq text " + item.id);
    assert(item.stem.indexOf(meta.a + "x + " + meta.b + " < " + c) >= 0, "ineq stem " + item.id);
  } else if (meta.op === "ratio") expectNumber(item, meta.b * meta.k);
  else if (meta.op === "discount") {
    assert((meta.price * (100 - meta.pct)) % 100 === 0, "discount div " + item.id);
    expectNumber(item, meta.price * (100 - meta.pct) / 100);
  } else if (meta.op === "ops") expectNumber(item, meta.a + meta.b * meta.c);
  else if (meta.op === "expon") {
    var pow = 1;
    for (var i = 0; i < meta.exp; i++) pow *= meta.base;
    expectNumber(item, pow + meta.add);
  } else if (meta.op === "rate") expectNumber(item, meta.r * meta.t);
  else assert(false, "problem op " + item.id);
}

function checkGeometry(item) {
  var meta = item.meta;
  if (meta.op === "rect-area") expectNumber(item, meta.l * meta.w);
  else if (meta.op === "rect-perim") expectNumber(item, 2 * (meta.l + meta.w));
  else if (meta.op === "tri-area") {
    assert(meta.base % 2 === 0, "tri base " + item.id);
    expectNumber(item, meta.base * meta.height / 2);
  } else if (meta.op === "supplement") expectNumber(item, 180 - meta.angle);
  else if (meta.op === "tri-angle") {
    assert(meta.a + meta.b < 180, "triangle sum " + item.id);
    expectNumber(item, 180 - meta.a - meta.b);
  } else assert(false, "geom op " + item.id);
}

var words = gen.loadWords();
var byWord = {};
words.forEach(function (w) {
  assert(!byWord[w.word], "dup word " + w.word);
  byWord[w.word] = w;
  assert(w.syn !== w.ant && w.syn !== w.word && w.ant !== w.word, "word overlap " + w.word);
  assert(w.example.toLowerCase().indexOf(w.word.toLowerCase()) >= 0, "example " + w.word);
});
assert(words.length >= 200, "word bank " + words.length);

var clusterOf = {};
gen.clusters().forEach(function (c) {
  var local = {};
  c.words.forEach(function (w) {
    assert(!clusterOf[w], "cluster overlap " + w);
    assert(!local[w], "dup in cluster " + w);
    local[w] = true;
    clusterOf[w] = c.name;
  });
  assert(c.words.length === 4, "cluster size " + c.name);
});

var spellCorrect = {};
gen.spelling().forEach(function (row) {
  assert(!spellCorrect[row[0].toLowerCase()], "dup spelling " + row[0]);
  spellCorrect[row[0].toLowerCase()] = true;
  var seen = {};
  assert(row[1].length === 3, "miss count " + row[0]);
  row[1].forEach(function (bad) {
    assert(bad !== row[0], "miss is correct " + row[0]);
    assert(!seen[bad], "dup miss " + row[0] + " " + bad);
    seen[bad] = true;
    assert(!spellCorrect[bad.toLowerCase()], "miss is another correct word " + bad);
  });
});

function checkVerbal(item) {
  var meta = item.meta;
  if (item.type === "synonym") {
    var w = byWord[meta.word];
    assert(w && item.choices[item.answer] === w.syn, "syn " + item.id);
    assert(item.choices.indexOf(w.word) < 0, "syn stem word in choices " + item.id);
  } else if (item.type === "antonym") {
    var a = byWord[meta.word];
    assert(a && item.choices[item.answer] === a.ant, "ant " + item.id);
  } else if (item.type === "vocab-context") {
    var c = byWord[meta.word];
    assert(c && item.choices[item.answer] === c.def, "ctx " + item.id);
    assert(item.stem.indexOf(c.example) >= 0, "ctx example " + item.id);
  } else if (item.type === "analogy") {
    if (meta.op === "syn-pair") assert(item.choices[item.answer] === byWord[meta.b].syn, "ana syn " + item.id);
    else if (meta.op === "ant-pair") assert(item.choices[item.answer] === byWord[meta.b].ant, "ana ant " + item.id);
    else if (meta.op === "hand") {
      assert(item.choices[item.answer] === meta.correct, "hand " + item.id);
      var hand = gen.handAnalogies().filter(function (row) {
        return row[0] + "|" + row[1] + "|" + row[2] + "|" + row[3] === meta.key;
      })[0];
      assert(hand && hand[3] === meta.correct, "hand key " + item.id);
    } else assert(false, "ana op " + item.id);
  } else if (item.type === "classification") {
    assert(item.choices[item.answer] === meta.odd, "class odd " + item.id);
    meta.members.forEach(function (member) {
      assert(item.choices.indexOf(member) >= 0, "class member " + item.id);
      assert(clusterOf[member] === meta.group, "member cluster " + member);
    });
    assert(clusterOf[meta.odd] === meta.oddGroup && meta.oddGroup !== meta.group, "odd cluster " + item.id);
  } else if (item.type === "logic") {
    var correct = meta.name + " " + meta.action + ".";
    assert(item.choices[item.answer] === correct, "logic " + item.id);
    var converse = "Everyone who " + meta.action + " is in the " + meta.group + ".";
    assert(item.choices.indexOf(converse) >= 0 && item.choices.indexOf(converse) !== item.answer, "converse " + item.id);
    assert(item.stem.indexOf("Everyone in the " + meta.group + " " + meta.action) >= 0, "logic stem " + item.id);
    assert(item.stem.indexOf(meta.name + " is in the " + meta.group) >= 0, "logic name " + item.id);
  }
}

function checkLanguage(item) {
  var meta = item.meta;
  if (meta.op === "spell-correct") {
    assert(item.choices[item.answer] === meta.word, "spell correct " + item.id);
    assert(spellCorrect[meta.word.toLowerCase()], "known spelling " + meta.word);
  } else if (meta.op === "spell-wrong") {
    assert(item.choices[item.answer] !== meta.word, "spell wrong answer " + item.id);
    assert(!spellCorrect[item.choices[item.answer].toLowerCase()], "wrong answer is a real listed word " + item.id);
    item.choices.forEach(function (c, i) {
      if (i !== item.answer) assert(spellCorrect[c.toLowerCase()], "distractor not correct spelling " + c);
    });
  } else if (meta.op === "fewer") {
    var built = "Fewer than " + meta.count + " " + meta.plural + " were left.";
    assert(item.choices[item.answer] === built, "fewer " + item.id);
  } else if (meta.op === "less") {
    assert(item.choices[item.answer] === meta.name + " found less " + meta.mass + " than the others did.", "less " + item.id);
  } else if (meta.op === "its") {
    assert(item.choices[item.answer] === "The " + meta.group + " is proud of its " + meta.thing + ".", "its " + item.id);
  } else if (meta.op === "theyre") {
    assert(item.choices[item.answer] === "The " + meta.group + " say they're finished with their " + meta.noun + ".", "theyre " + item.id);
  } else if (meta.op === "sv-agreement") {
    var agree = "The " + meta.container + " of " + meta.count + " " + meta.plural + " is " + meta.place + ".";
    assert(item.choices[item.answer] === agree, "agree " + item.id);
    var isCount = item.choices.filter(function (c) { return c.indexOf(" is ") >= 0; }).length;
    assert(isCount === 1, "one is " + item.id);
  } else if (meta.op === "intro-comma") {
    assert(item.choices[item.answer] === meta.phrase + ", " + meta.clause + ".", "comma " + item.id);
  } else if (meta.op === "singular-poss") {
    assert(item.choices[item.answer] === meta.name + "'s " + meta.object + " is here.", "poss " + item.id);
  } else if (meta.op === "plural-poss") {
    assert(item.choices[item.answer] === "The " + meta.plural + "' " + meta.thing + " are here.", "plural poss " + item.id);
    assert(item.stem.indexOf("more than one " + meta.singular) >= 0, "plural stem " + item.id);
  } else if (meta.op === "caps") {
    var good = "We " + meta.verb + " the " + meta.place + " in " + meta.month + ".";
    assert(item.choices[item.answer] === good, "caps " + item.id);
    item.choices.forEach(function (c, i) {
      if (i === item.answer) return;
      assert(c !== good, "caps dup " + item.id);
      assert(c.indexOf(meta.place) < 0 || c.indexOf(meta.month) < 0 || c.charAt(0) !== "W", "other caps still correct " + item.id + " :: " + c);
    });
  } else if (meta.op === "specific") {
    var spec = "The " + meta.role + " recorded " + meta.count + " " + meta.unit + " after " + meta.day + " days.";
    assert(item.choices[item.answer] === spec, "specific " + item.id);
    item.choices.forEach(function (c, i) {
      if (i !== item.answer) assert(!/\d/.test(c), "vague choice has a number " + item.id);
    });
  } else if (item.type === "spelling") {
    assert(false, "spell op " + item.id);
  }
}

var checkers = {
  series: checkSeries,
  comparison: checkComparison,
  "number-sense": checkNumber,
  problem: checkProblem,
  geometry: checkGeometry,
  synonym: checkVerbal,
  antonym: checkVerbal,
  "vocab-context": checkVerbal,
  analogy: checkVerbal,
  classification: checkVerbal,
  logic: checkVerbal,
  spelling: checkLanguage,
  usage: checkLanguage,
  agreement: checkLanguage,
  punctuation: checkLanguage,
  apostrophe: checkLanguage,
  capitalization: checkLanguage,
  composition: checkLanguage
};

var open = {};
gen.openTypes.forEach(function (t) { open[t] = true; });

gen.types.forEach(function (type) {
  var sigs = {};
  var made = 0;
  for (var seed = 0; seed < 2000; seed++) {
    var item = gen.make(type, seed);
    if (!item) {
      assert(!open[type], type + " null at " + seed);
      continue;
    }
    made += 1;
    choiceOk(item);
    assert(item.type === type, "type " + item.id);
    var again = gen.make(type, seed);
    assert(JSON.stringify(again) === JSON.stringify(item), "not deterministic " + type + " " + seed);
    var parsed = gen.parseGenId(item.id);
    assert(parsed && parsed.type === type && parsed.seed === seed, "id parse " + item.id);
    assert(JSON.stringify(gen.make(parsed.type, parsed.seed)) === JSON.stringify(item), "round trip " + item.id);
    sigs[sel.signature(item)] = true;
    checkers[type](item);
  }
  if (open[type]) assert(Object.keys(sigs).length === 2000, type + " unique " + Object.keys(sigs).length);
  else assert(made === 2000, type + " made " + made);
  console.log(type, "generated", made, "unique", Object.keys(sigs).length);
});

function q(id, section, type, word) {
  return {
    id: id,
    section: section,
    type: type,
    stem: "Stem " + id,
    choices: ["a", "b", "c", "d"],
    answer: 0,
    explanation: "because",
    word: word || null,
    meta: null
  };
}

var tiny = [q("s1", "verbal", "synonym", "alpha"), q("s2", "verbal", "synonym", "beta"), q("s3", "verbal", "synonym", "gamma")];
var seen = { items: {}, cursors: {}, cycles: {} };
var noGen = { can: function () { return false; }, make: function () { return null; }, parseGenId: gen.parseGenId };
var first = sel.practice({ bank: tiny, seen: seen, section: "verbal", n: 2, now: 1000, gen: noGen });
assert(first.items.length === 2, "first practice length");
assert(!seen.cycles.verbal, "cycle early " + seen.cycles.verbal);
var second = sel.practice({ bank: tiny, seen: seen, section: "verbal", n: 2, now: 2000, gen: noGen });
assert(second.items.length === 2, "second practice length");
var sigs1 = first.items.map(sel.signature);
var sigs2 = second.items.map(sel.signature);
assert(sigs1[0] !== sigs1[1], "dup in set");
var overlap = sigs2.filter(function (s) { return sigs1.indexOf(s) >= 0; });
assert(overlap.length === 1, "expected one recycled, got " + overlap.length);
assert(seen.cycles.verbal >= 1, "cycle after exhaust");

var seenMiss = { items: {}, cursors: {}, cycles: {} };
sel.practice({ bank: tiny.slice(0, 2), seen: seenMiss, section: "verbal", n: 2, now: 3000, gen: noGen });
var keys = Object.keys(seenMiss.items);
seenMiss.items[keys[0]].missed = false;
seenMiss.items[keys[0]].at = 1;
seenMiss.items[keys[1]].missed = true;
seenMiss.items[keys[1]].at = 50;
var pickedMiss = sel.practice({ bank: tiny.slice(0, 2), seen: seenMiss, section: "verbal", n: 1, now: 4000, gen: noGen });
assert(pickedMiss.items.length === 1 && pickedMiss.items[0].id === seenMiss.items[keys[1]].id, "missed preferred over older correct");

var freshGenSeen = { items: {}, cursors: {}, cycles: {} };
var counter = 0;
var fakeGen = {
  can: function (type) { return type === "synonym"; },
  parseGenId: function (id) {
    var m = /^g~synonym~(\d+)$/.exec(id);
    return m ? { type: "synonym", seed: Number(m[1]) } : null;
  },
  make: function (type, seed) {
    if (type !== "synonym" || seed > 6) return null;
    return {
      id: "g~synonym~" + seed,
      section: "verbal",
      type: "synonym",
      stem: "Unique stem " + seed,
      choices: ["a", "b", "c", "d"],
      answer: 0,
      explanation: "a",
      word: "w" + seed,
      meta: null
    };
  }
};
var g1 = sel.practice({ bank: [], seen: freshGenSeen, section: "verbal", n: 3, now: 5000, gen: fakeGen });
var g2 = sel.practice({ bank: [], seen: freshGenSeen, section: "verbal", n: 3, now: 6000, gen: fakeGen });
var gs1 = g1.items.map(sel.signature);
var gs2 = g2.items.map(sel.signature);
assert(g1.items.length === 3 && g2.items.length === 3, "fake gen counts");
assert(gs2.every(function (s) { return gs1.indexOf(s) < 0; }), "generated overlap");
assert(!freshGenSeen.cycles.verbal, "no cycle while fresh remain");

var root = path.join(__dirname, "..");
var sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "data", "bank.js"), "utf8"), sandbox);
vm.runInNewContext(fs.readFileSync(path.join(root, "data", "extra-reading.js"), "utf8"), sandbox);
var extra = sandbox.window.HSPT_EXTRA;
assert(extra.passages.length >= 8, "extra passages " + extra.passages.length);
assert(extra.questions.length === extra.passages.length * 6, "extra questions");
var pids = {};
extra.passages.forEach(function (p) {
  assert(p.text && p.text.length > 400, "short passage " + p.id);
  assert(!pids[p.id], "dup passage " + p.id);
  pids[p.id] = true;
});
extra.questions.forEach(function (item) {
  choiceOk(item);
  assert(item.meta.correct === item.choices[item.answer], "extra answer " + item.id);
  assert(pids[item.passageId], "missing passage " + item.id);
});

var bank = sandbox.window.HSPT_BANK.concat(extra.questions);
var live = { items: {}, cursors: {}, cycles: {} };
var mockA = sel.mock({ bank: bank, seen: live, now: 7000, gen: gen });
var sigA = {};
var counts = {};
mockA.items.forEach(function (item, idx) {
  var sig = sel.signature(item);
  assert(!sigA[sig], "dup in mock " + sig);
  sigA[sig] = true;
  counts[item.section] = (counts[item.section] || 0) + 1;
  if (idx < 60) assert(item.section === "verbal", "order verbal");
  else if (idx < 112) assert(item.section === "quant", "order quant");
  else if (idx < 174) assert(item.section === "reading", "order reading");
  else if (idx < 238) assert(item.section === "math", "order math");
  else assert(item.section === "language", "order language");
});
assert(mockA.items.length === 298, "mock length " + mockA.items.length);
Object.keys(sel.SECTION_COUNTS).forEach(function (section) {
  assert(counts[section] === sel.SECTION_COUNTS[section], section + " " + counts[section]);
});
var mockB = sel.mock({ bank: bank, seen: live, now: 8000, gen: gen });
var overlapB = 0;
mockB.items.forEach(function (item) {
  if (sigA[sel.signature(item)]) overlapB += 1;
});
assert(overlapB === 0, "second mock repeated " + overlapB);
assert(mockB.items.length === 298, "mock B length");

var vocabSandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "data", "vocab.js"), "utf8"), vocabSandbox);
var vocab = vocabSandbox.window.HSPT_VOCAB;
assert(vocab.length === words.length, "vocab.js out of date " + vocab.length + " vs " + words.length);
words.forEach(function (w, i) {
  assert(vocab[i].word === w.word && vocab[i].syn === w.syn && vocab[i].ant === w.ant, "vocab drift " + w.word);
});

if (failed) {
  console.error(failed + " assertion(s) failed");
  process.exit(1);
}
console.log("ok", words.length, "words,", gen.spelling().length, "spelling entries,", extra.passages.length, "extra passages");
