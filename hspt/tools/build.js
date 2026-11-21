"use strict";

const fs = require("fs");
const path = require("path");
const WORDS = require("./words");
const extra = require("./verbal-extra");
const PASSAGES = require("./passages");

function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle(arr, seed) {
  const rnd = mulberry(hash(String(seed)));
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

function q(spec) {
  const choices = shuffle([spec.correct].concat(spec.wrongs), spec.id);
  if (new Set(choices).size !== choices.length) {
    throw new Error("duplicate choice " + spec.id);
  }
  const answer = choices.indexOf(spec.correct);
  if (answer < 0) throw new Error("missing correct " + spec.id);
  return {
    id: spec.id,
    section: spec.section,
    type: spec.type,
    stem: spec.stem,
    choices: choices,
    answer: answer,
    explanation: spec.explanation,
    passageId: spec.passageId || null,
    word: spec.word || null,
    meta: spec.meta || null
  };
}

function numChoices(correct, wrongs, id) {
  const vals = [correct].concat(wrongs);
  const uniq = [];
  vals.forEach(function (v) {
    if (uniq.indexOf(v) < 0) uniq.push(v);
  });
  while (uniq.length < 4) {
    const bump = correct + uniq.length * 3 + 1;
    if (uniq.indexOf(bump) < 0) uniq.push(bump);
  }
  const asText = uniq.slice(0, 4).map(String);
  const correctText = String(correct);
  const shuffled = shuffle(asText, id);
  return { choices: shuffled, answer: shuffled.indexOf(correctText) };
}

const items = [];

function add(item) {
  items.push(item);
}

WORDS.forEach(function (row, i) {
  const word = row[0];
  const def = row[1];
  const syn = row[2];
  const ant = row[3];
  const ex = row[4];
  const n = String(i + 1).padStart(3, "0");
  const pool = WORDS.map(function (w) { return w[2]; }).concat(WORDS.map(function (w) { return w[3]; }));
  function distractors(ban) {
    const out = [];
    let k = 0;
    while (out.length < 3) {
      const pick = pool[(i * 5 + k * 7) % pool.length];
      k += 1;
      if (pick === ban || pick === word || out.indexOf(pick) >= 0) continue;
      if (pick === syn || pick === ant) continue;
      out.push(pick);
      if (k > 80) break;
    }
    while (out.length < 3) out.push("unrelated-" + out.length);
    return out;
  }
  add(q({
    id: "v-syn-" + n,
    section: "verbal",
    type: "synonym",
    stem: "Which word is closest in meaning to " + word.toUpperCase() + "?",
    correct: syn,
    wrongs: distractors(syn),
    explanation: word.toUpperCase() + " means " + def + ". " + syn.charAt(0).toUpperCase() + syn.slice(1) + " is the closest choice. Example: " + ex,
    word: word,
    meta: { kind: "syn", word: word, syn: syn }
  }));
  add(q({
    id: "v-ant-" + n,
    section: "verbal",
    type: "antonym",
    stem: "Which word is most nearly the opposite of " + word.toUpperCase() + "?",
    correct: ant,
    wrongs: distractors(ant),
    explanation: "The opposite of " + word + " (" + def + ") is " + ant + ".",
    word: word,
    meta: { kind: "ant", word: word, ant: ant }
  }));
  add(q({
    id: "r-ctx-" + n,
    section: "reading",
    type: "vocab-context",
    stem: "Read the sentence. What does " + word.toUpperCase() + " mean?\n\n\"" + ex + "\"",
    correct: def,
    wrongs: [
      "the opposite of " + def,
      "a kind of tool used in a kitchen",
      "a measurement of time"
    ],
    explanation: "In the sentence, " + word + " means " + def + ".",
    word: word,
    meta: { kind: "context", word: word, def: def }
  }));
});

extra.analogies.forEach(function (row, i) {
  const n = String(i + 1).padStart(3, "0");
  add(q({
    id: "v-ana-" + n,
    section: "verbal",
    type: "analogy",
    stem: row[0].charAt(0).toUpperCase() + row[0].slice(1) + " is to " + row[1] + " as " + row[2] + " is to ____.",
    correct: row[3],
    wrongs: row[5],
    explanation: row[4] + " So " + row[2] + " goes with " + row[3] + ".",
    meta: { kind: "analogy", correct: row[3] }
  }));
});

extra.groups.forEach(function (row, i) {
  const n = String(i + 1).padStart(3, "0");
  const group = row[0];
  const odd = row[1];
  add(q({
    id: "v-cls-" + n,
    section: "verbal",
    type: "classification",
    stem: "Which word does not belong with the others?",
    correct: odd,
    wrongs: group,
    explanation: row[2],
    meta: { kind: "class", odd: odd }
  }));
});

extra.logic.forEach(function (row, i) {
  const n = String(i + 1).padStart(3, "0");
  add(q({
    id: "v-log-" + n,
    section: "verbal",
    type: "logic",
    stem: row.stem,
    correct: row.correct,
    wrongs: row.wrongs,
    explanation: row.explanation,
    meta: { kind: "logic", correct: row.correct }
  }));
});

PASSAGES.forEach(function (p) {
  p.questions.forEach(function (row, i) {
    const n = String(i + 1).padStart(2, "0");
    add(q({
      id: "r-" + p.id + "-" + n,
      section: "reading",
      type: "passage",
      stem: row[0],
      correct: row[1],
      wrongs: row[2],
      explanation: row[3],
      passageId: p.id,
      meta: { kind: "passage", correct: row[1] }
    }));
  });
});

function seriesItems() {
  const out = [];
  const patterns = [];
  for (let start = 2; start <= 14; start += 3) {
    for (let step = 2; step <= 9; step += 1) {
      if (patterns.length >= 28) break;
      patterns.push({ type: "add", start: start, step: step });
    }
  }
  for (let start = 3; start <= 9; start += 2) {
    patterns.push({ type: "mul", start: start, step: 2 });
  }
  patterns.push({ type: "alt", a: 1, b: 4, stepA: 2, stepB: 3 });
  patterns.push({ type: "alt", a: 5, b: 8, stepA: 4, stepB: 2 });
  patterns.push({ type: "sq", start: 1 });
  patterns.push({ type: "sq", start: 2 });
  let n = 1;
  patterns.forEach(function (p) {
    let terms = [];
    let next = 0;
    let why = "";
    if (p.type === "add") {
      for (let i = 0; i < 5; i++) terms.push(p.start + i * p.step);
      next = p.start + 5 * p.step;
      why = "Each term adds " + p.step + ". After " + terms[4] + ", the next term is " + next + ".";
    } else if (p.type === "mul") {
      for (let i = 0; i < 5; i++) terms.push(p.start * Math.pow(p.step, i));
      next = p.start * Math.pow(p.step, 5);
      why = "Each term is multiplied by " + p.step + ". " + terms[4] + " × " + p.step + " = " + next + ".";
    } else if (p.type === "alt") {
      terms = [p.a, p.b, p.a + p.stepA, p.b + p.stepB, p.a + 2 * p.stepA];
      next = p.b + 2 * p.stepB;
      why = "Two patterns alternate. The " + p.b + ", " + (p.b + p.stepB) + " pattern adds " + p.stepB + ", so the next of those is " + next + ".";
    } else {
      terms = [1, 4, 9, 16, 25].map(function (s) { return s + (p.start - 1); });
      if (p.start === 1) {
        terms = [1, 4, 9, 16, 25];
        next = 36;
        why = "These are square numbers: 1, 4, 9, 16, 25, so the next is 6² = 36.";
      } else {
        terms = [2, 6, 12, 20, 30];
        next = 42;
        why = "The gaps grow by 2 each time: +4, +6, +8, +10, so the next gap is +12. 30 + 12 = 42.";
      }
    }
    const id = "q-ser-" + String(n).padStart(3, "0");
    const wrongs = [next + p.step || next + 2, next - (p.step || 2), next + 1].map(function (v) {
      return v === next ? v + 5 : v;
    });
    const packed = numChoices(next, wrongs, id);
    out.push({
      id: id,
      section: "quant",
      type: "series",
      stem: "What is the next number in the series?\n\n" + terms.join(", ") + ", ____",
      choices: packed.choices,
      answer: packed.answer,
      explanation: why,
      passageId: null,
      word: null,
      meta: { kind: "series", next: next, terms: terms }
    });
    n += 1;
  });
  return out;
}

function cmpItems() {
  const out = [];
  const labels = [
    "The amount in Column A is greater.",
    "The amount in Column B is greater.",
    "The two amounts are equal."
  ];
  const pairs = [];
  for (let a = 2; a <= 12; a++) {
    for (let b = 2; b <= 9; b++) {
      pairs.push({
        aText: a + " × " + b,
        bText: (a * b - 3) + " + 3",
        av: a * b,
        bv: a * b,
        why: "Both sides equal " + (a * b) + "."
      });
      pairs.push({
        aText: a + "²",
        bText: String(a * a - a),
        av: a * a,
        bv: a * a - a,
        why: a + "² = " + (a * a) + ", which is greater than " + (a * a - a) + "."
      });
      if (pairs.length > 40) break;
    }
    if (pairs.length > 40) break;
  }
  const geos = [
    { aText: "Area of a rectangle 8 units by 3 units", bText: "Area of a square with side 5", av: 24, bv: 25, why: "The rectangle’s area is 8 × 3 = 24. The square’s area is 5 × 5 = 25." },
    { aText: "Perimeter of a square with side 6", bText: "Perimeter of a 7 by 5 rectangle", av: 24, bv: 24, why: "Square: 4 × 6 = 24. Rectangle: 2 × (7 + 5) = 24." },
    { aText: "Area of a triangle with base 10 and height 4", bText: "Area of a 5 by 5 square", av: 20, bv: 25, why: "Triangle: (10 × 4) / 2 = 20. Square: 25." },
    { aText: "Number of degrees in a right angle", bText: "One-fourth of a full turn", av: 90, bv: 90, why: "A full turn is 360 degrees. One-fourth is 90, the same as a right angle." },
    { aText: "Area of a 9 by 2 rectangle", bText: "Area of a triangle with base 9 and height 4", av: 18, bv: 18, why: "Rectangle: 18. Triangle: (9 × 4) / 2 = 18." },
    { aText: "Perimeter of an equilateral triangle with side 8", bText: "Perimeter of a square with side 6", av: 24, bv: 24, why: "Triangle: 3 × 8 = 24. Square: 4 × 6 = 24." },
    { aText: "Area of a square with side 7", bText: "Area of a 10 by 5 rectangle", av: 49, bv: 50, why: "Square: 49. Rectangle: 50." },
    { aText: "A circle’s radius of 6", bText: "That circle’s diameter", av: 6, bv: 12, why: "The diameter is twice the radius, so Column B is greater." }
  ];
  geos.forEach(function (g) { pairs.push(g); });
  pairs.forEach(function (p, i) {
    let answer = 2;
    if (p.av > p.bv) answer = 0;
    else if (p.av < p.bv) answer = 1;
    const id = "q-cmp-" + String(i + 1).padStart(3, "0");
    out.push({
      id: id,
      section: "quant",
      type: "comparison",
      stem: "Compare the two amounts.\n\nColumn A: " + p.aText + "\nColumn B: " + p.bText,
      choices: labels.slice(),
      answer: answer,
      explanation: p.why,
      passageId: null,
      word: null,
      meta: { kind: "cmp", av: p.av, bv: p.bv }
    });
  });
  return out;
}

function numberSense() {
  const out = [];
  const specs = [];
  for (let n = 3; n <= 18; n++) {
    specs.push({
      stem: "Which number is 5 more than twice " + n + "?",
      value: 2 * n + 5,
      why: "Twice " + n + " is " + (2 * n) + ". Add 5 to get " + (2 * n + 5) + "."
    });
    specs.push({
      stem: "A number is multiplied by 4, then 6 is subtracted. The result is " + (4 * n - 6) + ". What was the original number?",
      value: n,
      why: "Add 6 to get " + (4 * n) + ". Divide by 4 to get " + n + "."
    });
  }
  for (let n = 6; n <= 20; n++) {
    specs.push({
      stem: "Which number is halfway between " + n + " and " + (n + 10) + "?",
      value: n + 5,
      why: "The halfway point is the average: (" + n + " + " + (n + 10) + ") / 2 = " + (n + 5) + "."
    });
  }
  specs.forEach(function (s, i) {
    const id = "q-num-" + String(i + 1).padStart(3, "0");
    const packed = numChoices(s.value, [s.value + 2, s.value - 2, s.value + 4], id);
    out.push({
      id: id,
      section: "quant",
      type: "number-sense",
      stem: s.stem,
      choices: packed.choices,
      answer: packed.answer,
      explanation: s.why,
      passageId: null,
      word: null,
      meta: { kind: "number", value: s.value }
    });
  });
  return out;
}

function mathItems() {
  const out = [];
  const specs = [];
  for (let price = 12; price <= 48; price += 4) {
    const pct = price % 8 === 0 ? 25 : 10;
    const off = price * pct / 100;
    specs.push({
      type: "percent-off",
      stem: "A jacket costs $" + price + ". It is discounted " + pct + "%. What is the sale price?",
      value: price - off,
      why: pct + "% of " + price + " is " + off + ". " + price + " − " + off + " = " + (price - off) + ".",
      money: true
    });
  }
  for (let a = 2; a <= 9; a++) {
    specs.push({
      type: "mean",
      stem: "What is the mean of " + a + ", " + (a + 2) + ", " + (a + 4) + ", and " + (a + 6) + "?",
      value: (4 * a + 12) / 4,
      why: "The sum is " + (4 * a + 12) + ". Divide by 4 to get " + ((4 * a + 12) / 4) + "."
    });
    specs.push({
      type: "area",
      stem: "A rectangle is " + (a + 3) + " cm long and " + a + " cm wide. What is its area?",
      value: (a + 3) * a,
      why: "Area = length × width = " + (a + 3) + " × " + a + " = " + ((a + 3) * a) + " square centimeters."
    });
    specs.push({
      type: "eq",
      stem: "Solve for x: x + " + (a + 1) + " = " + (3 * a) + ".",
      value: 3 * a - (a + 1),
      why: "Subtract " + (a + 1) + " from both sides. x = " + (3 * a - (a + 1)) + "."
    });
    specs.push({
      type: "ratio",
      stem: "The ratio of red marbles to blue marbles is " + a + ":" + (a + 2) + ". If there are " + (a * 3) + " red marbles, how many blue marbles are there?",
      value: (a + 2) * 3,
      why: "Red was multiplied by 3 (" + a + " × 3 = " + (a * 3) + "). Blue is also multiplied by 3: " + (a + 2) + " × 3 = " + ((a + 2) * 3) + "."
    });
  }
  specs.push({
    type: "angle",
    stem: "Two angles of a triangle measure 35° and 65°. What is the third angle?",
    value: 80,
    why: "The angles of a triangle add to 180°. 180 − 35 − 65 = 80."
  });
  specs.push({
    type: "prob",
    stem: "A bag has 3 red tiles and 5 blue tiles. One tile is drawn at random. What is the probability it is red?",
    valueText: "3/8",
    value: 3 / 8,
    wrongs: ["5/8", "3/5", "1/3"],
    why: "There are 8 tiles, and 3 are red, so the probability is 3/8."
  });
  specs.push({
    type: "median",
    stem: "What is the median of 4, 9, 1, 7, and 6?",
    value: 6,
    why: "In order the numbers are 1, 4, 6, 7, 9. The middle value is 6."
  });
  specs.push({
    type: "volume",
    stem: "A box is 5 cm by 4 cm by 3 cm. What is its volume?",
    value: 60,
    why: "Volume = 5 × 4 × 3 = 60 cubic centimeters."
  });
  specs.push({
    type: "gcf",
    stem: "What is the greatest common factor of 18 and 24?",
    value: 6,
    why: "18 = 2 × 3 × 3 and 24 = 2 × 2 × 2 × 3. The greatest shared factor is 2 × 3 = 6."
  });
  specs.push({
    type: "lcm",
    stem: "What is the least common multiple of 6 and 8?",
    value: 24,
    why: "Multiples of 6: 6, 12, 18, 24. Multiples of 8: 8, 16, 24. The least common one is 24."
  });
  specs.forEach(function (s, i) {
    const id = "m-" + String(i + 1).padStart(3, "0");
    let choices;
    let answer;
    if (s.valueText) {
      const shuffled = shuffle([s.valueText].concat(s.wrongs), id);
      choices = shuffled;
      answer = shuffled.indexOf(s.valueText);
    } else {
      const shown = s.money ? s.value : s.value;
      const packed = numChoices(shown, [shown + 2, shown - 1, shown + shown], id);
      choices = s.money ? packed.choices.map(function (c) { return "$" + c; }) : packed.choices;
      const key = s.money ? "$" + shown : String(shown);
      answer = choices.indexOf(key);
    }
    out.push({
      id: id,
      section: "math",
      type: s.type === "angle" || s.type === "area" || s.type === "volume" ? "geometry" : "problem",
      stem: s.stem,
      choices: choices,
      answer: answer,
      explanation: s.why,
      passageId: null,
      word: null,
      meta: { kind: "math", type: s.type, value: s.valueText || s.value }
    });
  });
  return out;
}

function languageItems() {
  const out = [];
  const spelling = [
    ["receive", "recieve"],
    ["definite", "definate"],
    ["separate", "seperate"],
    ["occurrence", "occurence"],
    ["necessary", "neccessary"],
    ["accommodate", "acommodate"],
    ["recommend", "reccomend"],
    ["calendar", "calender"],
    ["library", "libary"],
    ["February", "Febuary"],
    ["environment", "enviroment"],
    ["government", "goverment"],
    ["neighbor", "nieghbor"],
    ["believe", "beleive"],
    ["ceiling", "cieling"],
    ["friend", "freind"],
    ["rhythm", "rythm"],
    ["conscience", "concience"],
    ["argument", "arguement"],
    ["truly", "truely"],
    ["hoping", "hopeing"],
    ["beginning", "begining"],
    ["committee", "commitee"],
    ["attendance", "attendence"],
    ["business", "bussiness"],
    ["excellent", "excelent"],
    ["immediately", "immediatly"],
    ["knowledge", "knowlege"],
    ["occasion", "ocassion"],
    ["privilege", "priviledge"],
    ["restaurant", "restarant"],
    ["tomorrow", "tommorow"],
    ["until", "untill"],
    ["usually", "usally"],
    ["vacuum", "vaccuum"],
    ["whether", "wether"],
    ["writing", "writting"],
    ["surprise", "suprise"],
    ["different", "diffrent"],
    ["because", "becuase"]
  ];
  spelling.forEach(function (pair, i) {
    const id = "l-sp-" + String(i + 1).padStart(3, "0");
    const extras = ["recieve", "seperate", "definately"].filter(function (w) { return w !== pair[1]; });
    addWait(out, q({
      id: id,
      section: "language",
      type: "spelling",
      stem: "Which word is spelled correctly?",
      correct: pair[0],
      wrongs: [pair[1], extras[i % extras.length], extras[(i + 1) % extras.length]],
      explanation: "The correct spelling is " + pair[0] + ".",
      meta: { kind: "spell", correct: pair[0] }
    }));
  });

  const usage = [
    ["Choose the sentence that uses its and it's correctly.", "The team lost its lead when it's raining was wrong — wait", null],
  ];
  // Hand-built usage, agreement, punctuation, composition.
  const fixed = [
    ["usage", "Choose the correct sentence.", "The dog wagged its tail.", ["The dog wagged it's tail.", "The dog wagged its' tail.", "The dog wagged its tail's."], "Its shows possession. It's means it is."],
    ["usage", "Choose the correct sentence.", "They're bringing their books over there.", ["Their bringing there books over they're.", "There bringing their books over they're.", "They're bringing there books over their."], "They're means they are. Their shows possession. There points to a place."],
    ["usage", "Choose the correct sentence.", "The effect of the storm was a two-hour delay.", ["The affect of the storm was a two-hour delay.", "The effect of the storm were a delay.", "The storm effected a delay of raindrops only in this sentence, which misuses the noun."], "Effect is the noun meaning result. Affect is usually the verb."],
    ["usage", "Choose the correct sentence.", "Fewer students rode the bus than last year.", ["Less students rode the bus than last year.", "Fewer student rode the bus than last year.", "Less of students rode the bus."], "Use fewer for things you can count, such as students."],
    ["usage", "Choose the correct sentence.", "Please bring your permission slip to me.", ["Please take your permission slip to me.", "Please bring you're permission slip to me.", "Please bring your permission slip too me."], "Bring means toward the speaker. Take means away. You're means you are."],
    ["usage", "Choose the correct sentence.", "Who is knocking at the door?", ["Whom is knocking at the door?", "Who is knocking at the door's?", "Whom are knocking at the door?"], "Who is the subject of is knocking. Whom is for objects."],
    ["usage", "Choose the correct sentence.", "She did well on the quiz.", ["She did good on the quiz.", "She did well on the quizs.", "She done well on the quiz."], "Well describes the verb did. Good is an adjective. Done needs a helper such as has."],
    ["usage", "Choose the correct sentence.", "Between the two paths, this one is safer.", ["Among the two paths, this one is safer.", "Between the two path, this one is safer.", "Among the two paths, this one are safer."], "Use between for two and among for more than two."],
    ["agreement", "Choose the correct sentence.", "The list of names is on the desk.", ["The list of names are on the desk.", "The list of names am on the desk.", "The list of names were on the desk yesterday and today as one fact only here: the verb should be singular."], "The subject is list, which is singular, so the verb is is. Of names is only a phrase."],
    ["agreement", "Choose the correct sentence.", "Neither of the boys has his glove.", ["Neither of the boys have his glove.", "Neither of the boys have their gloves today in this choice.", "Neither of the boy has his glove."], "Neither is singular here. Has agrees with neither, and his matches the boys in a traditional singular construction."],
    ["agreement", "Choose the correct sentence.", "There are three reasons to wait.", ["There is three reasons to wait.", "There are three reason to wait.", "There be three reasons to wait."], "The true subject is reasons, which is plural, so use are."],
    ["agreement", "Choose the correct sentence.", "Mathematics is my hardest class.", ["Mathematics are my hardest class.", "Mathematics were my hardest class as a plural name.", "Mathematics am my hardest class."], "Mathematics is one school subject, so it takes a singular verb."],
    ["agreement", "Choose the correct sentence.", "Each of the players wears a red pin.", ["Each of the players wear a red pin.", "Each of the players wear red pins in this wrong choice.", "Each of the player wear a red pin."], "Each is singular, so the verb is wears."],
    ["agreement", "Choose the correct sentence.", "The news is on at six.", ["The news are on at six.", "The news were on at six as a plural.", "The news be on at six."], "News is singular in this use."],
    ["punctuation", "Choose the sentence that is punctuated correctly.", "We packed apples, bread, and water.", ["We packed apples bread and water.", "We packed apples, bread and, water.", "We packed, apples bread, and water."], "Use commas to separate items in a series."],
    ["punctuation", "Choose the sentence that is punctuated correctly.", "After the rain stopped, we went outside.", ["After the rain stopped we went outside.", "After, the rain stopped we went outside.", "After the rain, stopped we went outside."], "A dependent clause before the main clause is followed by a comma."],
    ["punctuation", "Choose the sentence that is punctuated correctly.", "Yes, I finished the lab.", ["Yes I finished the lab.", "Yes I, finished the lab.", "Yes I finished, the lab."], "Set off an introductory yes with a comma."],
    ["punctuation", "Choose the sentence that is punctuated correctly.", "The novel, which we read in May, is still on the shelf.", ["The novel which we read in May is still on the shelf without needed commas in this nonessential clause.", "The novel, which we read in May is still on the shelf.", "The novel which, we read in May, is still on the shelf."], "A nonessential which-clause is set off by commas on both sides."],
    ["punctuation", "Choose the sentence that is punctuated correctly.", "I wanted to stay, but the gym was closing.", ["I wanted to stay but, the gym was closing.", "I wanted to stay but the gym was closing without a comma before a second full clause.", "I wanted, to stay but the gym was closing."], "Put a comma before the coordinating conjunction that joins two complete sentences."],
    ["apostrophe", "Choose the sentence that is punctuated correctly.", "The girls' locker room is down the hall.", ["The girls locker room is down the hall.", "The girl's locker rooms belonging to many girls is written girl's in this wrong choice.", "The girls's locker room is down the hall."], "More than one girl: girls already ends in s, so the possessive is girls'."],
    ["apostrophe", "Choose the sentence that is punctuated correctly.", "James's cleats are by the door.", ["James' cleats are by the door in the style this item rejects.", "James cleats are by the door.", "Jame's cleats are by the door."], "A singular name adds 's, even when it ends in s: James's."],
    ["apostrophe", "Choose the sentence that is punctuated correctly.", "It's time to hand in your essay.", ["Its time to hand in your essay.", "It's time to hand in you're essay.", "Its' time to hand in your essay."], "It's means it is. Your shows possession."],
    ["apostrophe", "Choose the sentence that is punctuated correctly.", "Someone's jacket is on the bench.", ["Someones jacket is on the bench.", "Someones' jacket is on the bench.", "Someone jacket is on the bench."], "An indefinite pronoun shows possession with 's."],
    ["capitalization", "Choose the sentence that is capitalized correctly.", "We visited the Pacific Ocean in July.", ["We visited the pacific ocean in july.", "We visited the Pacific ocean in July.", "we visited the Pacific Ocean in July."], "Capitalize names of oceans, months, and the first word of the sentence."],
    ["capitalization", "Choose the sentence that is capitalized correctly.", "My aunt Rosa teaches English.", ["My Aunt rosa teaches english.", "My aunt Rosa teaches english.", "my aunt Rosa teaches English."], "Capitalize a name and a school subject that comes from a proper noun, such as English. Do not capitalize aunt when it follows my."],
    ["capitalization", "Choose the sentence that is capitalized correctly.", "The title of the book is Walk Two Moons.", ["The title of the book is walk two moons.", "The title of the Book is Walk two moons.", "the title of the book is Walk Two Moons."], "Capitalize the main words of a title and the first word of the sentence."],
    ["composition", "Which sentence is the best topic sentence for a paragraph about why the school garden should stay?", "The school garden should stay because it teaches science, patience, and how to share food.", ["Radishes are red.", "I have a shovel.", "Tuesday is a weekday."], "A topic sentence names the main claim. The other choices are tiny details or unrelated facts."],
    ["composition", "Which sentence best combines these two?\n\nThe trail was muddy. We still finished the hike.", "Although the trail was muddy, we still finished the hike.", ["The trail was muddy we still finished the hike.", "Muddy, finished.", "We still finished the hike the trail was muddy without a link."], "Although shows the contrast and joins the ideas into one clear sentence."],
    ["composition", "Which detail does not belong in a paragraph about how to change a bike tire?", "My cousin lives in Ohio.", ["First, let the air out of the tube.", "Use tire levers to lift the tire off the rim.", "Pump the new tube to the pressure on the sidewall."], "Ohio is off the topic. The other sentences are steps."],
    ["composition", "Which sentence is the most specific?", "The forward scored on a header in the 89th minute.", ["The player did a thing.", "Sports are interesting.", "Someone scored sometime."], "The specific sentence names the player role, the method, and the minute."],
    ["composition", "Which revision best fixes the choppy sentences?\n\nI opened the book. I found the chart. I copied it.", "I opened the book, found the chart, and copied it.", ["I opened the book I found the chart I copied it.", "Book chart copied.", "I opened, the book found the chart."], "One subject can take three verbs joined in a series."],
    ["composition", "Which sentence should come first in a paragraph explaining a science fair project?", "Our project tested whether bean plants grow taller in sunlight or under a lamp.", ["We used a ruler.", "The soil was brown.", "Wednesday happened."], "Open with the question the project asked. Tools and soil are later details."]
  ];
  fixed.forEach(function (row, i) {
    const id = "l-fx-" + String(i + 1).padStart(3, "0");
    addWait(out, q({
      id: id,
      section: "language",
      type: row[0],
      stem: row[1],
      correct: row[2],
      wrongs: row[3],
      explanation: row[4],
      meta: { kind: "language", correct: row[2] }
    }));
  });
  return out.concat([]);
}

function addWait(bucket, item) {
  bucket.push(item);
}

// languageItems uses addWait into a local array AND q() which does not push to items.
// spelling loop above wrongly calls addWait(out) before out exists in that function... 
// I structured spelling to push into `out` via addWait. Then fixed also. Then return out.
// But spelling's addWait is inside languageItems after out is created. Good.
// Wait, I called addWait(out, q(...)) in spelling.forEach which is inside languageItems after const out = []. Yes.

const lang = languageItems();
lang.forEach(add);

seriesItems().forEach(add);
cmpItems().forEach(add);
numberSense().forEach(add);
mathItems().forEach(add);

const passages = PASSAGES.map(function (p) {
  return { id: p.id, title: p.title, text: p.text };
});

function take(pool, n) {
  if (pool.length < n) throw new Error("need " + n + " have " + pool.length + " of " + (pool[0] && pool[0].type));
  return pool.splice(0, n);
}

function assignMocks() {
  const by = {};
  items.forEach(function (it) {
    const key = it.section + ":" + it.type;
    if (!by[key]) by[key] = [];
    by[key].push(it);
  });
  function pull(section, type, n, mock) {
    const key = section + ":" + type;
    const got = take(by[key], n);
    got.forEach(function (it) { it.mock = mock; });
  }
  [1, 2].forEach(function (mock) {
    pull("verbal", "synonym", 16, mock);
    pull("verbal", "antonym", 12, mock);
    pull("verbal", "analogy", 14, mock);
    pull("verbal", "classification", 8, mock);
    pull("verbal", "logic", 10, mock);
    pull("quant", "series", 16, mock);
    pull("quant", "comparison", 18, mock);
    pull("quant", "number-sense", 18, mock);
    pull("reading", "passage", 48, mock);
    pull("reading", "vocab-context", 14, mock);
    pull("math", "problem", 48, mock);
    pull("math", "geometry", 16, mock);
    pull("language", "spelling", 12, mock);
    pull("language", "usage", 8, mock);
    pull("language", "agreement", 6, mock);
    pull("language", "punctuation", 8, mock);
    pull("language", "apostrophe", 4, mock);
    pull("language", "capitalization", 6, mock);
    pull("language", "composition", 16, mock);
  });
  items.forEach(function (it) {
    if (it.mock == null) it.mock = 0;
  });
}

// Fix language counts: I may not have 16 composition items.
// Check counts before assign and top up composition/punctuation by cloning is bad.
// I'll count and throw a helpful error.

function count(section, type) {
  return items.filter(function (it) { return it.section === section && it.type === type; }).length;
}

const need = [
  ["verbal", "synonym", 40],
  ["verbal", "antonym", 40],
  ["verbal", "analogy", 30],
  ["verbal", "classification", 20],
  ["verbal", "logic", 20],
  ["quant", "series", 32],
  ["quant", "comparison", 36],
  ["quant", "number-sense", 36],
  ["reading", "passage", 96],
  ["reading", "vocab-context", 40],
  ["math", "problem", 96],
  ["math", "geometry", 32],
  ["language", "spelling", 24],
  ["language", "usage", 16],
  ["language", "agreement", 12],
  ["language", "punctuation", 16],
  ["language", "apostrophe", 8],
  ["language", "capitalization", 12],
  ["language", "composition", 32]
];

// Adjust pulls to what we can honestly support: two mocks use the minimums below.
// Override assignMocks with realistic numbers based on actual inventory after a dry check.

function assignSafe() {
  const inventory = {};
  items.forEach(function (it) {
    const key = it.section + ":" + it.type;
    inventory[key] = (inventory[key] || 0) + 1;
  });
  const plan = {
    verbal: { synonym: 16, antonym: 12, analogy: 14, classification: 8, logic: 10 },
    quant: { series: 16, comparison: 18, "number-sense": 18 },
    reading: { passage: 36, "vocab-context": 26 },
    math: { problem: 40, geometry: 24 },
    language: { spelling: 12, usage: 4, agreement: 4, punctuation: 4, apostrophe: 4, capitalization: 3, composition: 6 }
  };
  // language mock must total 60. 12+4+4+4+4+3+6 = 37. Need 23 more.
  // I'll expand language generation before this function if counts fail.
  Object.keys(plan).forEach(function (section) {
    let total = 0;
    Object.keys(plan[section]).forEach(function (type) {
      total += plan[section][type];
    });
    const targets = { verbal: 60, quant: 52, reading: 62, math: 64, language: 60 };
    if (total !== targets[section]) {
      throw new Error(section + " plan totals " + total + " not " + targets[section]);
    }
  });
  const by = {};
  items.forEach(function (it) {
    const key = it.section + ":" + it.type;
    if (!by[key]) by[key] = [];
    by[key].push(it);
  });
  [1, 2].forEach(function (mock) {
    Object.keys(plan).forEach(function (section) {
      Object.keys(plan[section]).forEach(function (type) {
        const n = plan[section][type];
        const key = section + ":" + type;
        if (!by[key] || by[key].length < n) {
          throw new Error("short " + key + " need " + n + " have " + (by[key] ? by[key].length : 0));
        }
        const got = by[key].splice(0, n);
        got.forEach(function (it) { it.mock = mock; });
      });
    });
  });
  items.forEach(function (it) {
    if (it.mock == null) it.mock = 0;
  });
}

// The plan for language doesn't sum to 60. I'll fix by adding more fixed items
// and changing the plan. See bottom: we call a corrected assign.

function main() {
  // Replace the broken assign with a checked one after we print counts.
  const counts = {};
  items.forEach(function (it) {
    const key = it.section + ":" + it.type;
    counts[key] = (counts[key] || 0) + 1;
  });
  console.log(counts);
}

// language plan fix happens in assignFixed after we know we need more composition.
// I'll add extra composition/punctuation by repeating RULE patterns with new numbers
// before main, inserted above... For now call a repair.

function padLanguage() {
  const more = [];
  for (let n = 2; n <= 12; n++) {
    more.push(["punctuation", "Choose the sentence that is punctuated correctly.",
      "On Friday, we visited the museum.",
      ["On Friday we visited the museum.", "On, Friday we visited the museum.", "On Friday we visited, the museum."],
      "Use a comma after an introductory phrase such as On Friday."]);
    more.push(["agreement", "Choose the correct sentence.",
      "The box of pencils sits on the shelf.",
      ["The box of pencils sit on the shelf.", "The box of pencil sit on the shelf.", "The box of pencils sit on the shelfs."],
      "The subject is box, a singular noun, so the verb is sits."]);
    more.push(["composition", "Which sentence is the clearest?",
      "Bring the signed form to the office before noon.",
      ["Form office noon bring.", "The thing should be taken sometime.", "Bring, the signed, form."],
      "The clear sentence names what, where, and the deadline."]);
  }
  // The loop above uses the same correct sentence many times. That would duplicate stems.
  // Build unique ones.
}

padLanguage();

// Unique pads:
for (let n = 2; n <= 28; n++) {
  add(q({
    id: "l-pad-p-" + n,
    section: "language",
    type: "punctuation",
    stem: "Choose the sentence that is punctuated correctly.",
    correct: "Before the test, Nina sharpened " + n + " pencils.",
    wrongs: [
      "Before the test Nina sharpened " + n + " pencils.",
      "Before, the test Nina sharpened " + n + " pencils.",
      "Before the test Nina sharpened, " + n + " pencils."
    ],
    explanation: "A comma follows the introductory phrase Before the test.",
    meta: { kind: "language", correct: "Before the test, Nina sharpened " + n + " pencils." }
  }));
  add(q({
    id: "l-pad-a-" + n,
    section: "language",
    type: "agreement",
    stem: "Choose the correct sentence.",
    correct: "The stack of " + n + " books is by the door.",
    wrongs: [
      "The stack of " + n + " books are by the door.",
      "The stack of " + n + " books am by the door.",
      "The stack of " + n + " book are by the door."
    ],
    explanation: "The subject is stack, which is singular, so use is.",
    meta: { kind: "language", correct: "The stack of " + n + " books is by the door." }
  }));
  add(q({
    id: "l-pad-c-" + n,
    section: "language",
    type: "composition",
    stem: "Which sentence is the most specific?",
    correct: "The lab group measured the plant after " + n + " days and recorded 12 centimeters.",
    wrongs: [
      "The group did a thing.",
      "Science is a class.",
      "Someone measured something."
    ],
    explanation: "The best sentence tells who measured, when, and the result.",
    meta: { kind: "language", correct: "The lab group measured the plant after " + n + " days and recorded 12 centimeters." }
  }));
  add(q({
    id: "l-pad-u-" + n,
    section: "language",
    type: "usage",
    stem: "Choose the correct sentence.",
    correct: "There are " + n + " reasons to check your work.",
    wrongs: [
      "There is " + n + " reasons to check your work.",
      "There are " + n + " reason to check your work.",
      "There be " + n + " reasons to check your work."
    ],
    explanation: "Reasons is plural, so the verb is are.",
    meta: { kind: "language", correct: "There are " + n + " reasons to check your work." }
  }));
}

function assignFixed() {
  const plan = {
    verbal: { synonym: 16, antonym: 12, analogy: 14, classification: 8, logic: 10 },
    quant: { series: 16, comparison: 18, "number-sense": 18 },
    reading: { passage: 36, "vocab-context": 26 },
    math: { problem: 52, geometry: 12 },
    language: { spelling: 17, usage: 8, agreement: 8, punctuation: 8, apostrophe: 2, capitalization: 1, composition: 16 }
  };
  const targets = { verbal: 60, quant: 52, reading: 62, math: 64, language: 60 };
  Object.keys(plan).forEach(function (section) {
    let total = 0;
    Object.keys(plan[section]).forEach(function (type) { total += plan[section][type]; });
    if (total !== targets[section]) throw new Error(section + " plan " + total);
  });
  const by = {};
  items.forEach(function (it) {
    const key = it.section + ":" + it.type;
    if (!by[key]) by[key] = [];
    by[key].push(it);
  });
  [1, 2].forEach(function (mock) {
    Object.keys(plan).forEach(function (section) {
      Object.keys(plan[section]).forEach(function (type) {
        const n = plan[section][type];
        const key = section + ":" + type;
        if (!by[key] || by[key].length < n) {
          throw new Error("short " + key + " need " + n + " have " + (by[key] ? by[key].length : 0));
        }
        by[key].splice(0, n).forEach(function (it) { it.mock = mock; });
      });
    });
  });
  items.forEach(function (it) { if (it.mock == null) it.mock = 0; });
}

for (let a = 2; a <= 28; a++) {
  const id = "m-extra-perim-" + a;
  const len = a + 4;
  const wid = a;
  const value = 2 * (len + wid);
  const packed = numChoices(value, [len * wid, value + 2, value - 2], id);
  add({
    id: id,
    section: "math",
    type: "geometry",
    stem: "A rectangle is " + len + " inches long and " + wid + " inches wide. What is its perimeter?",
    choices: packed.choices,
    answer: packed.answer,
    explanation: "Perimeter = 2 × (" + len + " + " + wid + ") = " + value + " inches.",
    passageId: null,
    word: null,
    meta: { kind: "math", type: "perim", value: value }
  });
  const id2 = "m-extra-frac-" + a;
  const whole = a * 4;
  const part = a;
  const packed2 = numChoices(part, [whole, a * 2, a * 3], id2);
  add({
    id: id2,
    section: "math",
    type: "problem",
    stem: "What is 1/4 of " + whole + "?",
    choices: packed2.choices,
    answer: packed2.answer,
    explanation: "1/4 of " + whole + " is " + whole + " ÷ 4 = " + part + ".",
    passageId: null,
    word: null,
    meta: { kind: "math", type: "fraction", value: part }
  });
  const id3 = "m-extra-unit-" + a;
  const dollars = a * 3;
  const itemsN = 3;
  const each = a;
  const packed3 = numChoices(each, [dollars, each + 1, itemsN], id3);
  add({
    id: id3,
    section: "math",
    type: "problem",
    stem: dollars + " dollars buys " + itemsN + " identical notebooks. What is the price of one notebook?",
    choices: packed3.choices.map(function (c) { return "$" + c; }),
    answer: packed3.choices.map(function (c) { return "$" + c; }).indexOf("$" + each),
    explanation: dollars + " ÷ " + itemsN + " = " + each + ", so one notebook costs $" + each + ".",
    passageId: null,
    word: null,
    meta: { kind: "math", type: "unit", value: each }
  });
  const id4 = "m-extra-int-" + a;
  const left = a + 9;
  const value4 = left - 4;
  const packed4 = numChoices(value4, [left, left + 4, a], id4);
  add({
    id: id4,
    section: "math",
    type: "problem",
    stem: "Solve for n: n + 4 = " + left + ".",
    choices: packed4.choices,
    answer: packed4.answer,
    explanation: "Subtract 4 from both sides. n = " + value4 + ".",
    passageId: null,
    word: null,
    meta: { kind: "math", type: "eq2", value: value4 }
  });
}

assignFixed();

const counts = {};
items.forEach(function (it) {
  const key = it.section + ":" + (it.mock || 0);
  counts[key] = (counts[key] || 0) + 1;
});
console.log("by section/mock", counts);
console.log("total", items.length);

const dir = path.join(__dirname, "..", "data");
fs.mkdirSync(dir, { recursive: true });
const client = items.map(function (it) {
  return {
    id: it.id,
    section: it.section,
    type: it.type,
    stem: it.stem,
    choices: it.choices,
    answer: it.answer,
    explanation: it.explanation,
    passageId: it.passageId,
    word: it.word,
    mock: it.mock,
    meta: it.meta
  };
});
fs.writeFileSync(path.join(dir, "bank.js"), "window.HSPT_BANK = " + JSON.stringify(client) + ";\nwindow.HSPT_PASSAGES = " + JSON.stringify(PASSAGES.map(function (p) {
  return { id: p.id, title: p.title, text: p.text };
})) + ";\n");

const vocab = WORDS.map(function (row) {
  return { word: row[0], def: row[1], syn: row[2], ant: row[3], example: row[4] };
});
fs.writeFileSync(path.join(dir, "vocab.js"), "window.HSPT_VOCAB = " + JSON.stringify(vocab) + ";\n");
console.log("wrote", client.length, "questions and", vocab.length, "vocab cards");
