(function () {
  "use strict";

  var BANK = window.CHEM_BANK || [];
  var LESSONS = window.CHEM_LESSONS || [];
  var TABLE = window.CHEM_ELEMENTS || { elements: [], categories: [], note: "" };
  var ELEMENTS = TABLE.elements || [];
  var PREP_STORE = "chem-prep-v1";
  var EXAM_STORE = "chem-exam-v1";
  var SEEN_STORE = "chem-seen-v1";
  var CHEM_LOG_URL = "";
  var TIME_STORE = "chem-time-v1";
  var TIME_TAB = "chem-time-tab";
  var IDLE_MS = 60 * 1000;
  var FLUSH_MS = 5 * 60 * 1000;
  var QUEUE_MAX = 100;
  var TIME_SECTIONS = ["study", "practice", "test", "other"];

  var TOPICS = [
    { id: "matter", name: "Matter and measurement", no: "01", symbol: "ρ" },
    { id: "atomic", name: "Atomic structure", no: "02", symbol: "e<sup>−</sup>" },
    { id: "periodic", name: "Periodic table", no: "03", symbol: "IE" },
    { id: "bonding", name: "Bonding", no: "04", symbol: "δ<sup>+</sup>δ<sup>−</sup>" },
    { id: "nomenclature", name: "Nomenclature", no: "05", symbol: "SO<sub>4</sub><sup>2−</sup>" },
    { id: "mole", name: "The mole", no: "06", symbol: "mol" },
    { id: "reactions", name: "Reactions", no: "07", symbol: "→" },
    { id: "gases", name: "Gases", no: "08", symbol: "PV" },
    { id: "solutions", name: "Solutions", no: "09", symbol: "M" },
    { id: "acids", name: "Acids and bases", no: "10", symbol: "pH" },
    { id: "thermo", name: "Thermochemistry", no: "11", symbol: "ΔH" },
    { id: "kinetics", name: "Kinetics", no: "12", symbol: "⇌", honors: true }
  ];

  var FORMS = [
    ["C6H12O6", "C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>"],
    ["Al2O3", "Al<sub>2</sub>O<sub>3</sub>"],
    ["Fe2O3", "Fe<sub>2</sub>O<sub>3</sub>"],
    ["H2SO4", "H<sub>2</sub>SO<sub>4</sub>"],
    ["H2SO3", "H<sub>2</sub>SO<sub>3</sub>"],
    ["H3PO4", "H<sub>3</sub>PO<sub>4</sub>"],
    ["Na2SO4", "Na<sub>2</sub>SO<sub>4</sub>"],
    ["Na2CO3", "Na<sub>2</sub>CO<sub>3</sub>"],
    ["CuSO4", "CuSO<sub>4</sub>"],
    ["CaCO3", "CaCO<sub>3</sub>"],
    ["CaCl2", "CaCl<sub>2</sub>"],
    ["NH4Cl", "NH<sub>4</sub>Cl"],
    ["KClO3", "KClO<sub>3</sub>"],
    ["C3H8", "C<sub>3</sub>H<sub>8</sub>"],
    ["C2H6", "C<sub>2</sub>H<sub>6</sub>"],
    ["ZnCl2", "ZnCl<sub>2</sub>"],
    ["FeCl3", "FeCl<sub>3</sub>"],
    ["FeCl2", "FeCl<sub>2</sub>"],
    ["AgNO3", "AgNO<sub>3</sub>"],
    ["HNO3", "HNO<sub>3</sub>"],
    ["HNO2", "HNO<sub>2</sub>"],
    ["KNO3", "KNO<sub>3</sub>"],
    ["KNO2", "KNO<sub>2</sub>"],
    ["N2O4", "N<sub>2</sub>O<sub>4</sub>"],
    ["P2O5", "P<sub>2</sub>O<sub>5</sub>"],
    ["Ca(OH)2", "Ca(OH)<sub>2</sub>"],
    ["SO3", "SO<sub>3</sub>"],
    ["SO2", "SO<sub>2</sub>"],
    ["CO2", "CO<sub>2</sub>"],
    ["H2O", "H<sub>2</sub>O"],
    ["NH3", "NH<sub>3</sub>"],
    ["CH4", "CH<sub>4</sub>"],
    ["SF6", "SF<sub>6</sub>"],
    ["Cl2", "Cl<sub>2</sub>"],
    ["O2", "O<sub>2</sub>"],
    ["N2", "N<sub>2</sub>"],
    ["H2", "H<sub>2</sub>"]
  ].sort(function (a, b) { return b[0].length - a[0].length; });

  var main = document.getElementById("main");
  var ICON_OK = '<svg viewBox="0 0 16 16" width="16" height="16" focusable="false"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/></svg>';
  var ICON_NO = '<svg viewBox="0 0 16 16" width="16" height="16" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/></svg>';
  var timerHandle = null;
  var tryState = { lesson: "", picked: null, shown: false };
  var GEN_CACHE = {};

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* private mode */ }
  }
  function prep() {
    var store = load(PREP_STORE, { answers: {}, tests: [], lessons: {} });
    if (!store.answers) store.answers = {};
    if (!store.tests) store.tests = [];
    if (!store.lessons) store.lessons = {};
    return store;
  }
  function topicMeta(id) {
    for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i].id === id) return TOPICS[i];
    return { id: id, name: id, no: "", symbol: "" };
  }
  function lessonById(id) {
    for (var i = 0; i < LESSONS.length; i++) if (LESSONS[i].id === id) return LESSONS[i];
    return null;
  }
  function byId(id) {
    if (GEN_CACHE[id]) return GEN_CACHE[id];
    for (var i = 0; i < BANK.length; i++) if (BANK[i].id === id) return BANK[i];
    if (window.CHEM_GEN && id && id.indexOf("g~") === 0) {
      var parsed = window.CHEM_GEN.parseGenId(id);
      if (parsed) {
        var made = window.CHEM_GEN.make(parsed.type, parsed.seed);
        if (made) {
          GEN_CACHE[id] = made;
          return made;
        }
      }
    }
    return null;
  }
  function seenState() {
    var existing = load(SEEN_STORE, null);
    if (existing && existing.items) {
      if (!existing.cursors) existing.cursors = {};
      if (!existing.cycles) existing.cycles = {};
      return existing;
    }
    return { v: 1, items: {}, cursors: {}, cycles: {} };
  }
  function noteSeenResult(item, correct) {
    if (!item || !window.CHEM_SELECT) return;
    var state = seenState();
    var sig = window.CHEM_SELECT.signature(item);
    var rec = state.items[sig];
    if (!rec) {
      rec = { id: item.id, topic: item.topic, type: item.type, at: Date.now(), missed: false };
      state.items[sig] = rec;
    }
    rec.missed = !correct;
    save(SEEN_STORE, state);
  }
  function chemHTML(text) {
    var s = text == null ? "" : String(text);
    if (s.indexOf("<") >= 0) return s;
    for (var i = 0; i < FORMS.length; i++) s = s.split(FORMS[i][0]).join(FORMS[i][1]);
    s = s.replace(/10\^(-?\d+)/g, "10<sup>$1</sup>");
    s = s.replace(/\[H\+\]/g, "[H<sup>+</sup>]");
    s = s.replace(/\[OH−\]/g, "[OH<sup>−</sup>]");
    s = s.replace(/\[OH-\]/g, "[OH<sup>−</sup>]");
    return s;
  }
  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") node.className = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else if (k.indexOf("on") === 0 && typeof attrs[k] === "function") node.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] === false || attrs[k] == null) return;
      else node.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    (kids || []).forEach(function (kid) {
      if (kid == null || kid === false) return;
      node.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    });
    return node;
  }
  function rich(tag, className, text) {
    return el(tag, { class: className || "", html: chemHTML(text) });
  }
  function clearTimer() {
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
  }
  function navTarget() {
    var path = (location.hash || "#/").replace(/^#/, "").split("?")[0] || "/";
    if (path === "/" || path === "") return "#/";
    if (path === "/lessons" || path.indexOf("/lesson/") === 0) return "#/lessons";
    if (path === "/practice" || path === "/focus") return "#/practice";
    if (path === "/quiz" || path === "/review" || path === "/results") {
      var ex = exam();
      var kind = ex && ex.kind;
      if (!kind && path === "/results") {
        try {
          var raw = sessionStorage.getItem("chem-last-result");
          if (raw) kind = JSON.parse(raw).kind;
        } catch (err) { kind = ""; }
      }
      if (kind === "practice" || kind === "focus") return "#/practice";
      return "#/tests";
    }
    if (path === "/tests") return "#/tests";
    if (path === "/table") return "#/table";
    if (path === "/progress") return "#/progress";
    return null;
  }
  function markNav() {
    var target = navTarget();
    var links = document.querySelectorAll(".nav a");
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute("href") === target) links[i].setAttribute("aria-current", "page");
      else links[i].removeAttribute("aria-current");
    }
  }
  function show(node) {
    clearTimer();
    main.innerHTML = "";
    main.appendChild(node);
    markNav();
    main.focus();
    window.scrollTo(0, 0);
  }
  function exam() { return load(EXAM_STORE, null); }

  function topicStats(id) {
    var store = prep();
    var correct = 0;
    var total = 0;
    Object.keys(store.answers).forEach(function (qid) {
      var row = store.answers[qid];
      if (!row || row.topic !== id) return;
      total += 1;
      if (row.correct) correct += 1;
    });
    var pct = total ? Math.round(100 * correct / total) : 0;
    var word = "Not started";
    if (total && pct >= 85 && total >= 5) word = "Cleared";
    else if (total && pct >= 70) word = "Building";
    else if (total) word = "Learning";
    return { correct: correct, total: total, pct: pct, word: word };
  }
  function nextTopic() {
    for (var i = 0; i < TOPICS.length; i++) {
      if (topicStats(TOPICS[i].id).word !== "Cleared") return TOPICS[i].id;
    }
    return TOPICS[0].id;
  }
  function unitLink(meta, href) {
    var stat = topicStats(meta.id);
    var current = meta.id === nextTopic() && stat.word !== "Cleared";
    var attrs = {
      class: "unit level",
      href: href,
      style: "--level:" + stat.pct + "%"
    };
    if (current) attrs["aria-current"] = "step";
    var z = el("span", { class: "unit-z" }, [meta.no]);
    if (meta.honors) z.appendChild(el("span", null, ["Honors"]));
    return el("a", attrs, [
      z,
      el("span", { class: "unit-sym", html: meta.symbol }),
      el("span", { class: "unit-name" }, [meta.name]),
      el("span", { class: "unit-meta" }, [stat.word + " · " + stat.pct + "%"])
    ]);
  }
  function todayMinutes() {
    var store = load(TIME_STORE, null);
    if (!store || !store.days) return 0;
    var day = store.days[localDateStr(Date.now())];
    if (!day) return 0;
    return Math.round(((day.study || 0) + (day.practice || 0) + (day.test || 0) + (day.other || 0)) / 60);
  }

  function home() {
    var store = prep();
    var answered = Object.keys(store.answers).length;
    var correct = 0;
    Object.keys(store.answers).forEach(function (id) { if (store.answers[id].correct) correct += 1; });
    var pct = answered ? Math.round(100 * correct / answered) : 0;
    var next = topicMeta(nextTopic());
    var wrap = el("div", null, [
      el("div", { class: "hero" }, [
        el("div", null, [
          el("span", { class: "eyebrow" }, ["10th grade"]),
          el("h1", null, ["Hi Sam."]),
          el("p", { class: "lede" }, ["Twelve units, from measurement through equilibrium. The questions are original, and they are not tied to a textbook."])
        ]),
        el("div", { class: "row" }, [
          el("a", { class: "btn", href: "#/lesson/" + next.id }, ["Continue"]),
          el("a", { class: "btn secondary", href: "#/focus" }, ["Your misses"])
        ]),
        el("dl", { class: "stats" }, [
          el("div", null, [el("dt", null, ["Answered"]), el("dd", null, [String(answered)])]),
          el("div", null, [el("dt", null, ["Correct"]), el("dd", null, [pct + "%"])]),
          el("div", null, [el("dt", null, ["Today"]), el("dd", null, [String(todayMinutes()), el("small", null, [" min"])])])
        ])
      ]),
      el("h2", null, ["Next: " + next.name]),
      el("ul", { class: "units" })
    ]);
    var list = wrap.querySelector(".units");
    TOPICS.forEach(function (meta) {
      list.appendChild(el("li", null, [unitLink(meta, "#/lesson/" + meta.id)]));
    });
    show(wrap);
  }

  function lessons() {
    var wrap = el("div", null, [
      el("h1", null, ["Lessons"]),
      el("p", { class: "lede" }, ["Short lessons, Sam. Each one ends with a question you can check immediately."])
    ]);
    var list = el("ul", { class: "units" });
    TOPICS.forEach(function (meta) {
      list.appendChild(el("li", null, [unitLink(meta, "#/lesson/" + meta.id)]));
    });
    wrap.appendChild(list);
    show(wrap);
  }

  function lessonView(id) {
    var lesson = lessonById(id);
    if (!lesson) return home();
    if (tryState.lesson !== id) tryState = { lesson: id, picked: null, shown: false };
    var meta = topicMeta(lesson.topic);
    var article = el("article", { class: "lesson" }, [
      el("p", { class: "crumb" }, [el("a", { href: "#/lessons" }, ["Lessons"]), " / " + meta.no]),
      meta.honors || lesson.honors ? el("span", { class: "tag focus" }, ["Honors"]) : null,
      el("h1", null, [lesson.title])
    ]);
    if (lesson.eq) article.appendChild(el("p", { class: "eq", html: chemHTML(lesson.eq) }));
    (lesson.paragraphs || []).forEach(function (p) { article.appendChild(rich("p", "", p)); });
    if (lesson.steps && lesson.steps.length) {
      var steps = el("ol");
      lesson.steps.forEach(function (step) {
        steps.appendChild(el("li", null, [el("div", { html: chemHTML(step) })]));
      });
      article.appendChild(el("div", { class: "worked" }, [
        el("span", { class: "label" }, ["Worked example"]),
        steps
      ]));
    }
    if (lesson.remember) {
      article.appendChild(el("div", { class: "remember" }, [
        el("span", { class: "label" }, ["Remember"]),
        el("p", { html: chemHTML(lesson.remember) })
      ]));
    }
    article.appendChild(el("h2", null, ["Try one"]));
    var tryBox = el("div", { class: "try" });
    tryBox.appendChild(rich("p", "qstem", lesson.example.stem));
    tryBox.appendChild(choiceList(lesson.example, tryState.picked, tryState.shown, function (idx) {
      tryState.picked = idx;
      lessonView(id);
    }));
    if (tryState.shown) tryBox.appendChild(feedbackBox(lesson.example, tryState.picked));
    var tryRow = el("div", { class: "row" });
    if (!tryState.shown) {
      tryRow.appendChild(el("button", { type: "button", onclick: function () {
        if (tryState.picked == null) return;
        tryState.shown = true;
        var store = prep();
        store.lessons[id] = true;
        save(PREP_STORE, store);
        lessonView(id);
      } }, ["Check"]));
    } else {
      tryRow.appendChild(el("button", { type: "button", class: "secondary", onclick: function () {
        tryState.picked = null;
        tryState.shown = false;
        lessonView(id);
      } }, ["Try another"]));
    }
    tryBox.appendChild(tryRow);
    article.appendChild(tryBox);
    var nextLesson = null;
    for (var li = 0; li < LESSONS.length; li++) if (LESSONS[li].id === id && LESSONS[li + 1]) nextLesson = LESSONS[li + 1];
    var cta = el("div", { class: "row" }, [
      el("a", { class: "btn", href: "#/practice?topic=" + lesson.topic }, ["Practice this unit"])
    ]);
    if (nextLesson) cta.appendChild(el("a", { class: "btn secondary", href: "#/lesson/" + nextLesson.id }, ["Next: " + nextLesson.title]));
    article.appendChild(cta);

    var toc = el("nav", { class: "toc", "aria-label": "Lessons" }, [
      el("span", { class: "label" }, ["Lessons"])
    ]);
    var ol = el("ol");
    var doneMap = prep().lessons || {};
    LESSONS.forEach(function (item) {
      var attrs = { href: "#/lesson/" + item.id };
      if (item.id === id) attrs["aria-current"] = "page";
      if (doneMap[item.id]) attrs.class = "done";
      ol.appendChild(el("li", null, [el("a", attrs, [item.title])]));
    });
    toc.appendChild(ol);
    show(el("div", { class: "lesson-layout" }, [article, toc]));
  }

  function choiceList(item, picked, revealed, onPick) {
    var list = el("div", { class: "choices", role: "radiogroup", "aria-label": "Answer choices" });
    item.choices.forEach(function (choice, idx) {
      var input = el("input", { type: "radio", name: "choice", class: "choice-input", value: String(idx) });
      if (picked === idx) input.checked = true;
      if (revealed) input.disabled = true;
      input.addEventListener("change", function () { onPick(idx); });
      var state = "";
      var letter = String.fromCharCode(65 + idx);
      var tag = "";
      if (revealed && idx === item.answer) {
        state = "is-right";
        letter = "✓";
        tag = picked === idx ? "Your answer" : "Answer";
      } else if (revealed && idx === picked) {
        state = "is-wrong";
        letter = "✕";
        tag = "Your answer";
      }
      var sr = state === "is-right" ? " (correct answer)" : state === "is-wrong" ? " (your answer, incorrect)" : "";
      list.appendChild(el("label", { class: state }, [
        input,
        el("span", { class: "letter", "aria-hidden": "true" }, [letter]),
        el("span", { class: "choice-text", html: chemHTML(choice) }),
        tag ? el("span", { class: "state" }, [tag]) : null,
        sr ? el("span", { class: "sr" }, [sr]) : null
      ]));
    });
    return list;
  }
  function feedbackBox(item, picked) {
    var ok = picked === item.answer;
    return el("div", { class: "fb " + (ok ? "fb-good" : "fb-bad") }, [
      el("p", { class: "fb-head" }, [
        el("span", { class: "fb-ico", "aria-hidden": "true", html: ok ? ICON_OK : ICON_NO }),
        el("strong", null, [ok ? "Correct" : "Not quite"])
      ]),
      ok ? null : el("p", { class: "fb-answer", html: "The answer is " + String.fromCharCode(65 + item.answer) + ". " + chemHTML(item.choices[item.answer]) }),
      el("p", { class: "fb-why", html: chemHTML(item.explanation) })
    ]);
  }

  function practiceSetup() {
    var params = new URLSearchParams(location.hash.split("?")[1] || "");
    var preset = params.get("topic") || "matter";
    var wrap = el("div", null, [
      el("h1", null, ["Practice"]),
      el("p", null, ["You get the explanation as soon as you answer, Sam. A new set starts with questions you have not seen."])
    ]);
    var form = el("form");
    form.appendChild(el("label", { class: "field-label", for: "topic" }, ["Unit"]));
    var select = el("select", { class: "field", id: "topic" });
    TOPICS.forEach(function (meta) {
      var opt = el("option", { value: meta.id }, [meta.name]);
      if (meta.id === preset) opt.selected = true;
      select.appendChild(opt);
    });
    form.appendChild(select);
    form.appendChild(el("label", { class: "field-label", for: "n" }, ["How many"]));
    var count = el("select", { class: "field", id: "n" });
    [5, 10, 20].forEach(function (n) { count.appendChild(el("option", { value: String(n) }, [n + " questions"])); });
    count.value = "10";
    form.appendChild(count);
    form.appendChild(el("div", { class: "row" }, [el("button", { type: "submit" }, ["Start"])]));
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      startPractice(select.value, Number(count.value));
    });
    wrap.appendChild(form);
    var saved = exam();
    if (saved && saved.kind === "practice") {
      wrap.appendChild(el("p", null, [el("a", { href: "#/quiz" }, ["Resume the set you already started"])]));
    }
    show(wrap);
  }

  function focusHome() {
    var wrap = el("div", null, [
      el("span", { class: "tag focus" }, ["Misses"]),
      el("h1", null, ["Your misses, Sam."]),
      el("p", null, ["This drill starts with questions you got wrong. If there are not enough of those yet, it fills in with new questions."])
    ]);
    wrap.appendChild(el("div", { class: "row" }, [
      el("button", { type: "button", onclick: function () { startFocus(10); } }, ["Start 10"])
    ]));
    var saved = exam();
    if (saved && saved.kind === "focus") {
      wrap.appendChild(el("p", null, [el("a", { href: "#/quiz" }, ["Resume the drill you already started"])]));
    }
    show(wrap);
  }

  function testsHome() {
    var wrap = el("div", null, [
      el("h1", null, ["Tests"]),
      el("p", null, ["A unit test is 12 questions. The practice final is 36, three from each unit. You can flag and come back. Nothing is marked until you submit."])
    ]);
    var saved = exam();
    if (saved && (saved.kind === "unit" || saved.kind === "final")) {
      wrap.appendChild(el("p", null, [el("a", { class: "btn", href: saved.phase === "review" ? "#/review" : "#/quiz" }, ["Resume " + saved.label])]));
    }
    var list = el("ul", { class: "units" });
    TOPICS.forEach(function (meta) {
      var stat = topicStats(meta.id);
      var a = el("a", { class: "unit", href: "#/tests", onclick: function (e) {
        e.preventDefault();
        startUnit(meta.id);
      } }, [
        el("span", { class: "unit-z" }, [meta.no]),
        el("span", { class: "unit-sym", html: meta.symbol }),
        el("span", { class: "unit-name" }, [meta.name]),
        el("span", { class: "unit-meta" }, [stat.word + " · 12 questions"])
      ]);
      list.appendChild(el("li", null, [a]));
    });
    wrap.appendChild(list);
    wrap.appendChild(el("div", { class: "row" }, [
      el("button", { type: "button", onclick: function () { startFinal(); } }, ["Practice final"])
    ]));
    show(wrap);
  }

  function startPractice(topic, n) {
    var seen = seenState();
    var picked = window.CHEM_SELECT.practice({
      bank: BANK, seen: seen, topic: topic, n: n, now: Date.now(), gen: window.CHEM_GEN
    });
    launch("practice", topicMeta(topic).name + " practice", picked, { topic: topic, seconds: 0 });
  }
  function startFocus(n) {
    var seen = seenState();
    var picked = window.CHEM_SELECT.focus({
      bank: BANK, seen: seen, n: n, now: Date.now(), gen: window.CHEM_GEN
    });
    launch("focus", "Focus drill", picked, { topic: "", seconds: 0 });
  }
  function startUnit(topic) {
    var seen = seenState();
    var meta = topicMeta(topic);
    var picked = window.CHEM_SELECT.unit({
      bank: BANK, seen: seen, topics: [topic], n: 12, now: Date.now(), gen: window.CHEM_GEN
    });
    launch("unit", meta.name + " test", picked, { topic: topic, seconds: 15 * 60, symbol: meta.symbol, unitNo: meta.no });
  }
  function startFinal() {
    var seen = seenState();
    var picked = window.CHEM_SELECT.finalExam({
      bank: BANK, seen: seen, topics: TOPICS.map(function (t) { return t.id; }), per: 3, now: Date.now(), gen: window.CHEM_GEN
    });
    launch("final", "Practice final", picked, { topic: "", seconds: 45 * 60, symbol: "Ch", unitNo: "10" });
  }
  function launch(kind, label, picked, extra) {
    save(SEEN_STORE, picked.seen);
    save(EXAM_STORE, {
      kind: kind,
      label: label,
      ids: picked.items.map(function (q) { return q.id; }),
      index: 0,
      answers: {},
      flags: {},
      revealed: false,
      phase: "ask",
      started: Date.now(),
      deadline: extra.seconds ? Date.now() + extra.seconds * 1000 : 0,
      topic: extra.topic || "",
      symbol: extra.symbol || topicMeta(extra.topic || "").symbol || "",
      unitNo: extra.unitNo || topicMeta(extra.topic || "").no || ""
    });
    location.hash = "#/quiz";
  }

  function quiz() {
    var ex = exam();
    if (!ex) return testsHome();
    var n = Number(new URLSearchParams((location.hash.split("?")[1] || "")).get("n"));
    if (n >= 1 && n <= ex.ids.length) {
      ex.index = n - 1;
      ex.phase = "ask";
      save(EXAM_STORE, ex);
    }
    if (ex.phase === "review") return review();
    var item = byId(ex.ids[ex.index]);
    if (!item) return finishExam();
    var timed = ex.kind === "unit" || ex.kind === "final";
    var wrap = el("div");
    if (ex.kind === "focus") {
      wrap.appendChild(el("span", { class: "tag focus" }, [topicMeta(item.topic).name]));
    }
    var barLabel = ex.kind === "focus" ? topicMeta(item.topic).name + " · miss" : ex.label;
    var bar = el("div", { class: "bar" });
    bar.appendChild(el("div", { class: "bar-meta" }, [
      el("span", { class: "label" }, [barLabel]),
      el("span", { class: "qcount" }, ["Question " + (ex.index + 1) + " of " + ex.ids.length])
    ]));
    if (timed) {
      bar.appendChild(el("div", { class: "timer-box", role: "timer", "aria-label": "Time left" }, [
        el("span", { class: "label timer-label" }, [
          el("span", { class: "tl-normal" }, ["Time left"]),
          el("span", { class: "tl-warn" }, ["Under 1 min"])
        ]),
        el("span", { class: "timer", id: "timer" }, ["--:--"])
      ]));
    }
    wrap.appendChild(bar);
    wrap.appendChild(el("div", { class: "qprog", "aria-hidden": "true" }, [
      el("span", { style: "width:" + Math.round(100 * (ex.index + (ex.revealed ? 1 : 0)) / ex.ids.length) + "%" })
    ]));
    if (timed) wrap.appendChild(questionNav(ex, "scroll"));
    wrap.appendChild(rich("p", "qstem", item.stem));
    var form = el("form");
    form.appendChild(choiceList(item, ex.answers[item.id], ex.revealed, function (idx) {
      var first = ex.answers[item.id] == null;
      ex.answers[item.id] = idx;
      save(EXAM_STORE, ex);
      if (first) noteQuestionAnswered();
      if (timed) quiz();
    }));
    if (ex.revealed) form.appendChild(feedbackBox(item, ex.answers[item.id]));
    var buttons = el("div", { class: timed ? "row test-actions" : "row" });
    if (ex.kind === "practice" || ex.kind === "focus") {
      if (!ex.revealed) buttons.appendChild(el("button", { type: "submit" }, ["Check"]));
      else buttons.appendChild(el("button", { type: "button", onclick: function () { nextPractice(); } }, [ex.index + 1 >= ex.ids.length ? "See results" : "Next"]));
    } else {
      var flagged = !!ex.flags[item.id];
      buttons.appendChild(el("button", {
        type: "button",
        class: "flag",
        "aria-pressed": flagged ? "true" : "false",
        onclick: function () {
          ex.flags[item.id] = !ex.flags[item.id];
          save(EXAM_STORE, ex);
          quiz();
        }
      }, [
        el("span", { class: "flag-ico", "aria-hidden": "true", html: flagIcon(flagged) }),
        el("span", null, [flagged ? "Flagged" : "Flag"])
      ]));
      buttons.appendChild(el("button", { type: "submit" }, [ex.index + 1 >= ex.ids.length ? "Review" : "Next"]));
    }
    form.appendChild(buttons);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var picked = form.querySelector("input[name=choice]:checked");
      if ((ex.kind === "practice" || ex.kind === "focus") && !ex.revealed) {
        if (!picked) return;
        var first = ex.answers[item.id] == null;
        ex.answers[item.id] = Number(picked.value);
        if (first) noteQuestionAnswered();
        ex.revealed = true;
        recordAnswer(item, ex.answers[item.id]);
        save(EXAM_STORE, ex);
        quiz();
        return;
      }
      if (timed) {
        if (picked) ex.answers[item.id] = Number(picked.value);
        save(EXAM_STORE, ex);
        if (ex.index + 1 >= ex.ids.length) {
          ex.phase = "review";
          save(EXAM_STORE, ex);
          location.hash = "#/review";
        } else jump(ex.index + 1);
      }
    });
    wrap.appendChild(form);
    show(wrap);
    var currentCell = main.querySelector(".qnav-scroll .qcell[aria-current='true']");
    var scroller = main.querySelector(".qnav-scroll .qnav-wrap");
    if (currentCell && scroller) {
      scroller.scrollLeft = currentCell.offsetLeft - (scroller.clientWidth - currentCell.offsetWidth) / 2;
    }
    if (timed) armTimer(ex);
  }

  function flagIcon(on) {
    return '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M3 1.5v13M3.2 2.2h9.2L9.5 5.8l2.9 3.6H3.2z" fill="' + (on ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  }

  function questionNav(ex, mode) {
    var scrolling = mode !== "grid";
    var nav = el("nav", { class: "qnav " + (scrolling ? "qnav-scroll" : "qnav-grid"), "aria-label": "Questions" });
    if (scrolling) nav.appendChild(el("p", { class: "scroll-hint" }, ["← Swipe to any question →"]));
    var list = el("ol", { class: "qnav-list" });
    ex.ids.forEach(function (id, idx) {
      var classes = ["qcell"];
      var answered = ex.answers[id] != null;
      if (answered) classes.push("is-answered");
      if (ex.flags[id]) classes.push("is-flagged");
      var label = "Question " + (idx + 1) + ", " + (answered ? "answered" : "unanswered");
      if (ex.flags[id]) label += ", flagged";
      if (scrolling && idx === ex.index) label += ", current";
      var cell = el("a", { class: classes.join(" "), href: "#/quiz?n=" + (idx + 1), "aria-label": label }, [String(idx + 1)]);
      if (scrolling && idx === ex.index) cell.setAttribute("aria-current", "true");
      list.appendChild(el("li", null, [cell]));
    });
    nav.appendChild(el("div", {
      class: "qnav-wrap",
      tabindex: "0",
      role: "region",
      "aria-label": scrolling ? "Question numbers, scrolls sideways" : "Question numbers"
    }, [list]));
    return nav;
  }
  function jump(index) {
    var ex = exam();
    if (!ex) return;
    ex.index = index;
    ex.phase = "ask";
    ex.revealed = false;
    save(EXAM_STORE, ex);
    if ((location.hash || "").indexOf("#/quiz") === 0) quiz();
    else location.hash = "#/quiz";
  }
  function nextPractice() {
    var ex = exam();
    if (!ex) return;
    if (ex.index + 1 >= ex.ids.length) return finishExam();
    ex.index += 1;
    ex.revealed = false;
    save(EXAM_STORE, ex);
    quiz();
  }
  function review() {
    var ex = exam();
    if (!ex) return testsHome();
    var answered = 0;
    var flagged = 0;
    ex.ids.forEach(function (id) {
      if (ex.answers[id] != null) answered += 1;
      if (ex.flags[id]) flagged += 1;
    });
    var unanswered = ex.ids.length - answered;
    var wrap = el("section", { class: "review" });
    if (ex.deadline) {
      wrap.appendChild(el("div", { class: "bar" }, [
        el("div", { class: "bar-meta" }, [
          el("span", { class: "label" }, [ex.label]),
          el("span", { class: "qcount" }, ["Review"])
        ]),
        el("div", { class: "timer-box", role: "timer", "aria-label": "Time left" }, [
          el("span", { class: "label timer-label" }, [
            el("span", { class: "tl-normal" }, ["Time left"]),
            el("span", { class: "tl-warn" }, ["Under 1 min"])
          ]),
          el("span", { class: "timer", id: "timer" }, ["--:--"])
        ])
      ]));
    }
    wrap.appendChild(el("h1", null, ["Review, Sam."]));
    wrap.appendChild(el("p", { class: "lede" }, [
      answered + " answered, " + unanswered + " left, " + flagged + " flagged. You can still change answers."
    ]));
    wrap.appendChild(el("dl", { class: "stats" }, [
      el("div", null, [el("dt", null, ["Answered"]), el("dd", null, [String(answered), el("small", null, ["/" + ex.ids.length])])]),
      el("div", null, [el("dt", null, ["Unanswered"]), el("dd", null, [String(unanswered)])]),
      el("div", null, [el("dt", null, ["Flagged"]), el("dd", null, [String(flagged)])])
    ]));
    if (unanswered) {
      wrap.appendChild(el("div", { class: "notice" }, [
        el("span", { class: "notice-ico", "aria-hidden": "true" }, ["!"]),
        el("p", null, [
          el("strong", null, [unanswered + " unanswered."]),
          " Those will be scored as wrong if you submit now. Jump to them below, or submit anyway."
        ])
      ]));
    }
    wrap.appendChild(el("ul", { class: "legend-inline qnav-key" }, [
      el("li", null, [el("span", { class: "qcell", "aria-hidden": "true" }, ["1"]), "Unanswered"]),
      el("li", null, [el("span", { class: "qcell is-answered", "aria-hidden": "true" }, ["2"]), "Answered"]),
      el("li", null, [el("span", { class: "qcell is-flagged", "aria-hidden": "true" }, ["3"]), "Flagged"])
    ]));
    wrap.appendChild(questionNav(ex, "grid"));
    var submitWord = ex.kind === "final" ? "Submit final" : "Submit test";
    wrap.appendChild(el("div", { class: "row test-actions" }, [
      el("button", { type: "button", class: "btn", onclick: function () { finishExam(); } }, [submitWord]),
      el("button", { type: "button", class: "btn secondary", onclick: function () { jump(ex.index); } }, ["Back to questions"])
    ]));
    show(wrap);
    if (ex.deadline) armTimer(ex);
  }

  function armTimer(ex) {
    var node = document.getElementById("timer");
    function tick() {
      var left = Math.max(0, (ex.deadline || 0) - Date.now());
      var m = Math.floor(left / 60000);
      var s = Math.floor((left % 60000) / 1000);
      if (node) {
        node.textContent = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
        node.className = "timer" + (left < 60000 ? " warn" : "");
      }
      if (left <= 0 && ex.phase !== "review") {
        ex.phase = "review";
        save(EXAM_STORE, ex);
        location.hash = "#/review";
      }
    }
    tick();
    timerHandle = setInterval(tick, 250);
  }

  function recordAnswer(item, picked) {
    var store = prep();
    store.answers[item.id] = { correct: picked === item.answer, topic: item.topic, type: item.type, at: Date.now() };
    save(PREP_STORE, store);
    noteSeenResult(item, picked === item.answer);
  }
  function finishExam() {
    var ex = exam();
    if (!ex) return home();
    var topics = {};
    var missed = [];
    var correct = 0;
    ex.ids.forEach(function (id) {
      var item = byId(id);
      if (!item) return;
      var picked = ex.answers[id];
      var ok = picked === item.answer;
      if (ex.kind === "unit" || ex.kind === "final") recordAnswer(item, picked);
      if (!topics[item.topic]) topics[item.topic] = { correct: 0, total: 0 };
      topics[item.topic].total += 1;
      if (ok) {
        topics[item.topic].correct += 1;
        correct += 1;
      } else missed.push(id);
    });
    var summary = {
      label: ex.label,
      kind: ex.kind,
      at: Date.now(),
      correct: correct,
      total: ex.ids.length,
      topics: topics,
      missed: missed,
      elapsed: Date.now() - (ex.started || Date.now()),
      symbol: ex.symbol,
      unitNo: ex.unitNo,
      topic: ex.topic
    };
    var store = prep();
    store.tests.push(summary);
    save(PREP_STORE, store);
    save(EXAM_STORE, null);
    try { sessionStorage.setItem("chem-last-result", JSON.stringify(summary)); } catch (err) { /* ignore */ }
    location.hash = "#/results";
  }

  function results() {
    var raw = null;
    try { raw = sessionStorage.getItem("chem-last-result"); } catch (err) { raw = null; }
    var summary = raw ? JSON.parse(raw) : (prep().tests.slice(-1)[0] || null);
    if (!summary) return home();
    var pct = summary.total ? Math.round(100 * summary.correct / summary.total) : 0;
    var mins = Math.max(1, Math.round((summary.elapsed || 0) / 60000));
    var meta = topicMeta(summary.topic);
    var line = pct >= 85 ? (meta.name || summary.label) + ": cleared, Sam." : summary.correct + " of " + summary.total + ".";
    var wrap = el("div", null, [
      el("h1", null, [summary.label]),
      el("div", { class: "score" }, [
        el("div", { class: "score-cell" }, [
          el("span", { class: "unit-z" }, [summary.unitNo || ""]),
          el("span", { class: "score-num" }, [summary.correct + "/" + summary.total]),
          el("span", { class: "unit-sym", html: summary.symbol || "Ch" })
        ]),
        el("p", { class: "score-sub" }, [pct + "% · " + mins + " min. " + line])
      ])
    ]);
    var table = el("table", { class: "data-table" }, [
      el("thead", null, [el("tr", null, [
        el("th", null, ["Unit"]),
        el("th", { class: "num" }, ["Correct"]),
        el("th", null, ["Score"])
      ])]),
      el("tbody")
    ]);
    var body = table.querySelector("tbody");
    Object.keys(summary.topics || {}).forEach(function (id) {
      var row = summary.topics[id];
      var rowPct = row.total ? Math.round(100 * row.correct / row.total) : 0;
      body.appendChild(el("tr", null, [
        el("td", null, [topicMeta(id).name]),
        el("td", { class: "num" }, [row.correct + " / " + row.total]),
        el("td", null, [
          el("span", { class: "meter", "aria-hidden": "true" }, [el("i", { style: "width:" + rowPct + "%" })]),
          rowPct + "%"
        ])
      ]));
    });
    wrap.appendChild(table);
    wrap.appendChild(el("h2", null, ["Missed questions"]));
    if (!summary.missed.length) wrap.appendChild(el("p", null, ["None."]));
    summary.missed.slice(0, 30).forEach(function (id) {
      var item = byId(id);
      if (!item) return;
      wrap.appendChild(el("div", { class: "miss" }, [
        el("p", { class: "src" }, [topicMeta(item.topic).name]),
        rich("p", "qstem", item.stem),
        el("p", { class: "good" }, [el("span", { class: "fb-ico", "aria-hidden": "true", html: ICON_OK }), el("span", { html: "Answer: " + chemHTML(item.choices[item.answer]) })]),
        rich("p", "", item.explanation)
      ]));
    });
    wrap.appendChild(el("div", { class: "row" }, [
      el("a", { class: "btn", href: "#/focus" }, ["Drill the misses"]),
      el("a", { class: "btn secondary", href: "#/tests" }, ["Back to tests"])
    ]));
    show(wrap);
  }

  function progressView() {
    var store = prep();
    var wrap = el("div", null, [
      el("h1", null, ["Progress"]),
      el("p", null, ["Mastery is the share of your answers in that unit that were right. Five or more answers at 85% is cleared."])
    ]);
    wrap.appendChild(el("ul", { class: "legend-inline" }, [
      el("li", null, [el("span", { class: "swatch-level", style: "--level:0%" }), "Not started"]),
      el("li", null, [el("span", { class: "swatch-level", style: "--level:40%" }), "Learning"]),
      el("li", null, [el("span", { class: "swatch-level", style: "--level:75%" }), "Building"]),
      el("li", null, [el("span", { class: "swatch-level", style: "--level:100%" }), "Cleared"])
    ]));
    var units = el("ul", { class: "units" });
    TOPICS.forEach(function (meta) {
      var stat = topicStats(meta.id);
      units.appendChild(el("li", null, [
        el("div", { class: "unit level", style: "--level:" + stat.pct + "%" }, [
          el("span", { class: "unit-z" }, [meta.no]),
          el("span", { class: "unit-sym", html: meta.symbol }),
          el("span", { class: "unit-name" }, [meta.name]),
          el("span", { class: "unit-meta" }, [stat.word + " · " + stat.pct + "%"])
        ])
      ]));
    });
    wrap.appendChild(units);
    var answered = Object.keys(store.answers).length;
    wrap.appendChild(el("dl", { class: "stats" }, [
      el("div", null, [el("dt", null, ["Answered"]), el("dd", null, [String(answered)])]),
      el("div", null, [el("dt", null, ["Tests"]), el("dd", null, [String(store.tests.length)])]),
      el("div", null, [el("dt", null, ["Today"]), el("dd", null, [String(todayMinutes()), el("small", null, [" min"])])])
    ]));
    if (store.tests.length) {
      var table = el("table", { class: "data-table" }, [
        el("thead", null, [el("tr", null, [el("th", null, ["Test"]), el("th", null, ["Score"])])]),
        el("tbody")
      ]);
      store.tests.slice(-8).reverse().forEach(function (test) {
        table.querySelector("tbody").appendChild(el("tr", null, [
          el("td", null, [test.label]),
          el("td", null, [test.correct + "/" + test.total])
        ]));
      });
      wrap.appendChild(el("h2", null, ["Recent tests"]));
      wrap.appendChild(table);
    }
    show(wrap);
  }

  function tableView() {
    var selected = 1;
    var filter = "";
    var page = el("section", { class: "ptable-page" }, [
      el("p", { class: "eyebrow" }, ["Reference"]),
      el("h1", null, ["Sam's table."])
    ]);
    var search = el("div", { class: "search" }, [
      el("label", { for: "el-search" }, ["Search by name, symbol, or atomic number"]),
      el("input", { id: "el-search", type: "search", autocomplete: "off" })
    ]);
    page.appendChild(search);
    var legend = el("ul", { class: "legend" });
    (TABLE.categories || []).forEach(function (cat) {
      var btn = el("button", { type: "button", "aria-pressed": "false" }, [
        el("span", { class: "chip cat-" + cat.cat, style: "--cat:var(--cat-" + cat.cat + ")" }, [cat.code]),
        cat.label
      ]);
      btn.addEventListener("click", function () {
        filter = filter === cat.id ? "" : cat.id;
        apply();
      });
      btn.setAttribute("data-cat", cat.id);
      legend.appendChild(el("li", null, [btn]));
    });
    page.appendChild(legend);
    page.appendChild(el("p", { class: "scroll-hint" }, ["Swipe the table sideways"]));
    var grid = el("div", { class: "ptable" });
    var buttons = {};
    ELEMENTS.forEach(function (item) {
      var pos = cellPos(item);
      var btn = el("button", {
        type: "button",
        class: "el cat-" + item.cat + " " + item.family,
        "aria-label": item.name + ", " + item.symbol + ", atomic number " + item.z + ", " + item.label,
        style: "grid-row:" + pos.row + ";grid-column:" + pos.col
      }, [
        el("span", { class: "el-z" }, [String(item.z)]),
        el("span", { class: "el-sym" }, [item.symbol]),
        el("span", { class: "el-code" }, [item.code])
      ]);
      btn.addEventListener("click", function () {
        selected = item.z;
        apply();
        btn.scrollIntoView({ inline: "center", block: "nearest" });
      });
      buttons[item.z] = btn;
      grid.appendChild(btn);
    });
    grid.appendChild(el("div", { class: "el-gap", style: "grid-row:6;grid-column:3" }, ["57–71"]));
    grid.appendChild(el("div", { class: "el-gap", style: "grid-row:7;grid-column:3" }, ["89–103"]));
    var detail = el("div", { class: "el-detail", "aria-live": "polite" });
    var area = el("div", { class: "ptable-area" }, [
      el("div", { class: "ptable-wrap", role: "region", tabindex: "0", "aria-label": "Periodic table" }, [grid]),
      detail
    ]);
    page.appendChild(area);
    var listHead = el("div", { class: "el-list-head" }, [
      el("h2", null, ["Elements"]),
      el("p", { class: "count", id: "el-count" }, [""])
    ]);
    var list = el("ul", { class: "el-list" });
    var block = el("div", { class: "el-list-block" }, [listHead, list]);
    page.appendChild(block);
    page.appendChild(el("p", { class: "ptable-note muted" }, [TABLE.note || ""]));

    function query() {
      return search.querySelector("input").value.replace(/^\s+|\s+$/g, "");
    }
    function matches(item, q) {
      if (!q) return true;
      if (/^\d+$/.test(q)) return String(item.z) === q;
      if (item.symbol.toLowerCase() === q.toLowerCase()) return true;
      return item.name.toLowerCase().indexOf(q.toLowerCase()) === 0;
    }
    function apply() {
      var q = query();
      page.classList.toggle("searching", q.length > 0);
      grid.classList.toggle("filtering", !!filter);
      legend.querySelectorAll("button").forEach(function (btn) {
        btn.setAttribute("aria-pressed", btn.getAttribute("data-cat") === filter ? "true" : "false");
      });
      var shown = [];
      ELEMENTS.forEach(function (item) {
        var hit = matches(item, q);
        var on = !filter || item.category === filter;
        var btn = buttons[item.z];
        btn.classList.toggle("match", !!(q && hit));
        btn.classList.toggle("on", on);
        btn.setAttribute("aria-pressed", item.z === selected ? "true" : "false");
        if (hit && on) shown.push(item);
      });
      var current = null;
      for (var i = 0; i < ELEMENTS.length; i++) if (ELEMENTS[i].z === selected) current = ELEMENTS[i];
      detail.innerHTML = "";
      if (current) {
        detail.appendChild(el("div", { class: "big cat-" + current.cat + " " + current.family, style: "--cat:var(--cat-" + current.cat + ")" }, [
          el("span", { class: "z" }, [String(current.z)]),
          el("span", { class: "sym" }, [current.symbol]),
          el("span", { class: "m" }, [current.mass])
        ]));
        detail.appendChild(el("div", null, [
          el("h2", null, [current.name]),
          el("p", null, [current.label + " · " + current.code]),
          el("dl", null, [
            el("dt", null, ["Atomic number"]), el("dd", null, [String(current.z)]),
            el("dt", null, ["Symbol"]), el("dd", null, [current.symbol]),
            el("dt", null, ["Average atomic mass"]), el("dd", null, [current.mass]),
            el("dt", null, ["Category"]), el("dd", null, [current.label])
          ])
        ]));
      }
      list.innerHTML = "";
      shown.forEach(function (item) {
        var row = el("button", { type: "button" }, [
          el("span", { class: "mini cat-" + item.cat + " " + item.family, style: "--cat:var(--cat-" + item.cat + ")" }, [
            el("span", { class: "z" }, [String(item.z)]),
            el("span", { class: "sym" }, [item.symbol])
          ]),
          el("span", null, [
            el("span", { class: "nm" }, [item.name]),
            el("span", { class: "cat" }, [item.label])
          ]),
          el("span", { class: "mass" }, [item.mass])
        ]);
        if (item.z === selected) row.className = "is-selected";
        row.addEventListener("click", function () {
          selected = item.z;
          apply();
          if (buttons[item.z]) buttons[item.z].scrollIntoView({ inline: "center", block: "nearest" });
        });
        list.appendChild(el("li", null, [row]));
      });
      var count = document.getElementById("el-count");
      if (count) count.textContent = shown.length + (shown.length === 1 ? " element" : " elements");
    }
    search.querySelector("input").addEventListener("input", apply);
    show(page);
    apply();
  }
  function cellPos(item) {
    if (item.z >= 57 && item.z <= 71) return { row: 9, col: 3 + (item.z - 57) };
    if (item.z >= 89 && item.z <= 103) return { row: 10, col: 3 + (item.z - 89) };
    return { row: item.period, col: item.group };
  }

  var tabId = "";
  var currentSection = "other";
  var open = null;
  var accruingFrom = null;
  var lastInput = 0;
  var idleTimer = null;
  var flushTimer = null;
  var retryTimer = null;
  var bootAt = 0;
  var inflight = {};

  function emptySections() {
    return { study: 0, practice: 0, test: 0, other: 0 };
  }
  function logUrl() {
    return String(CHEM_LOG_URL || "").replace(/^\s+|\s+$/g, "");
  }
  function localDateStr(ms) {
    var d = new Date(ms);
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }
  function nextLocalMidnight(ms) {
    var d = new Date(ms);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
  }
  function makeId() {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (err) { /* ignore */ }
    return "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }
  function shortAgent() {
    var ua = navigator.userAgent || "";
    var browser = "Browser";
    var version = "";
    if (/Edg\//.test(ua)) { browser = "Edge"; version = (ua.match(/Edg\/(\d+)/) || [])[1] || ""; }
    else if (/Chrome\//.test(ua)) { browser = "Chrome"; version = (ua.match(/Chrome\/(\d+)/) || [])[1] || ""; }
    else if (/Firefox\//.test(ua)) { browser = "Firefox"; version = (ua.match(/Firefox\/(\d+)/) || [])[1] || ""; }
    else if (/Safari\//.test(ua)) { browser = "Safari"; version = (ua.match(/Version\/(\d+)/) || [])[1] || ""; }
    var os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Unknown";
    return browser + (version ? " " + version : "") + " / " + os;
  }
  function timeStore() {
    var store = load(TIME_STORE, null);
    if (!store || typeof store !== "object") store = { days: {}, sessionCount: 0, queue: [], opens: {} };
    if (!store.days) store.days = {};
    if (!Array.isArray(store.queue)) store.queue = [];
    if (!store.opens) store.opens = {};
    return store;
  }
  function updateStore(mutator) {
    var store = timeStore();
    mutator(store);
    save(TIME_STORE, store);
    return store;
  }
  function ensureDay(store, date) {
    if (!store.days[date]) store.days[date] = { study: 0, practice: 0, test: 0, other: 0, questions: 0, sessions: 0 };
    return store.days[date];
  }
  function sectionForPath() {
    var path = (location.hash || "#/").replace(/^#/, "").split("?")[0];
    if (path === "/lessons" || path.indexOf("/lesson/") === 0) return "study";
    if (path === "/practice" || path === "/focus") return "practice";
    if (path === "/tests" || path === "/review") return "test";
    if (path === "/quiz") {
      var ex = exam();
      if (ex && (ex.kind === "practice" || ex.kind === "focus")) return "practice";
      return "test";
    }
    return "other";
  }
  function syncTimeSection() {
    try {
      var next = sectionForPath();
      if (next === currentSection) return;
      if (accruingFrom != null) accrueUntil(Date.now());
      currentSection = next;
    } catch (err) { /* ignore */ }
  }
  function rowKey(row) { return (row.sessionId || "") + "|" + (row.start || ""); }
  function rememberOpen(store) {
    if (open) store.opens[tabId] = JSON.parse(JSON.stringify(open));
    else delete store.opens[tabId];
  }
  function rowFromOpen(item, endMs) {
    var pending = item.pending || emptySections();
    var sections = { study: pending.study || 0, practice: pending.practice || 0, test: pending.test || 0, other: pending.other || 0 };
    var active = sections.study + sections.practice + sections.test + sections.other;
    var questions = item.pendingQuestions || 0;
    if (active <= 0 && questions <= 0) return null;
    var startMs = item.sliceStart || item.startedAt || endMs;
    if (endMs < startMs) endMs = startMs;
    return {
      sessionId: item.sessionId,
      date: localDateStr(startMs),
      start: new Date(startMs).toISOString(),
      end: new Date(endMs).toISOString(),
      activeSeconds: active,
      sections: sections,
      questionsAnswered: questions,
      userAgent: shortAgent(),
      user: "sam",
      sheet: "Chem Sessions",
      app: "chem"
    };
  }
  function pushQueue(store, row) {
    if (!row) return;
    store.queue.push(row);
    if (store.queue.length > QUEUE_MAX) store.queue.splice(0, store.queue.length - QUEUE_MAX);
  }
  function credit(date, section, ms) {
    if (!open || ms <= 0) return;
    open.remainderMs[section] = (open.remainderMs[section] || 0) + ms;
    var whole = Math.floor(open.remainderMs[section] / 1000);
    if (whole > 0) {
      open.remainderMs[section] -= whole * 1000;
      open.pending[section] = (open.pending[section] || 0) + whole;
    }
    open.updatedAt = Date.now();
    updateStore(function (store) {
      if (whole > 0) ensureDay(store, date)[section] += whole;
      rememberOpen(store);
    });
  }
  function finalizeSlice(endMs, keep) {
    if (!open) return;
    var ending = open;
    var next = null;
    updateStore(function (store) {
      var row = rowFromOpen(ending, endMs);
      if (row) pushQueue(store, row);
      if (keep) {
        next = {
          sessionId: ending.sessionId,
          startedAt: ending.startedAt,
          sliceStart: endMs,
          sliceDate: localDateStr(endMs),
          pending: emptySections(),
          remainderMs: ending.remainderMs || emptySections(),
          pendingQuestions: 0,
          updatedAt: endMs
        };
        store.opens[tabId] = next;
      } else delete store.opens[tabId];
    });
    open = keep ? next : null;
    if (!keep) { accruingFrom = null; clearIdle(); }
  }
  function addActive(from, to) {
    if (!open || to <= from) return;
    var cursor = from;
    var guard = 0;
    while (open && cursor < to && guard < 8) {
      guard += 1;
      var boundary = nextLocalMidnight(cursor);
      var end = to < boundary ? to : boundary;
      var date = localDateStr(cursor);
      if (open.sliceDate !== date) finalizeSlice(cursor, true);
      if (!open) return;
      credit(date, currentSection, end - cursor);
      if (end < to && end === boundary) { finalizeSlice(boundary, true); cursor = boundary; }
      else cursor = end;
    }
  }
  function accrueUntil(now) {
    if (accruingFrom == null || !open) { accruingFrom = null; return; }
    var end = now;
    var cap = lastInput + IDLE_MS;
    if (end > cap) end = cap;
    if (end > accruingFrom) addActive(accruingFrom, end);
    accruingFrom = (now >= cap || document.visibilityState !== "visible") ? null : end;
  }
  function clearIdle() { if (idleTimer) clearTimeout(idleTimer); idleTimer = null; }
  function onIdle() {
    idleTimer = null;
    if (Date.now() - lastInput < IDLE_MS) { armIdle(); return; }
    endSession(lastInput + IDLE_MS);
    trySend();
  }
  function armIdle() {
    clearIdle();
    var delay = lastInput + IDLE_MS - Date.now();
    idleTimer = setTimeout(onIdle, delay < 0 ? 0 : delay);
  }
  function beginSession(now) {
    open = {
      sessionId: makeId(),
      startedAt: now,
      sliceStart: now,
      sliceDate: localDateStr(now),
      pending: emptySections(),
      remainderMs: emptySections(),
      pendingQuestions: 0,
      updatedAt: now
    };
    accruingFrom = now;
    updateStore(function (store) {
      store.sessionCount = (store.sessionCount || 0) + 1;
      ensureDay(store, open.sliceDate).sessions += 1;
      rememberOpen(store);
    });
  }
  function endSession(now) {
    if (!open && accruingFrom == null) return;
    var end = now;
    if (lastInput && end > lastInput + IDLE_MS) end = lastInput + IDLE_MS;
    if (accruingFrom != null) accrueUntil(end);
    if (open) finalizeSlice(end, false);
    accruingFrom = null;
    clearIdle();
    if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
  }
  function becomeActive(now) {
    if (document.visibilityState !== "visible") return;
    if (!lastInput || now - lastInput >= IDLE_MS) return;
    if (!open) beginSession(now);
    if (accruingFrom == null) accruingFrom = now;
    armIdle();
    if (!flushTimer) flushTimer = setInterval(function () {
      if (!open || accruingFrom == null) return;
      if (document.visibilityState !== "visible" || Date.now() - lastInput >= IDLE_MS) return;
      accrueUntil(Date.now());
      if (open) finalizeSlice(Date.now(), true);
      trySend();
    }, FLUSH_MS);
  }
  function onActivity(evt) {
    try {
      if (evt && evt.isTrusted === false) return;
      if (document.visibilityState !== "visible") return;
      lastInput = Date.now();
      becomeActive(lastInput);
    } catch (err) { /* ignore */ }
  }
  function noteQuestionAnswered() {
    try {
      var now = Date.now();
      if (document.visibilityState === "visible") { lastInput = now; becomeActive(now); }
      if (!open) return;
      open.pendingQuestions = (open.pendingQuestions || 0) + 1;
      var date = open.sliceDate || localDateStr(now);
      updateStore(function (store) {
        ensureDay(store, date).questions += 1;
        rememberOpen(store);
      });
    } catch (err) { /* ignore */ }
  }
  function deliver(row) {
    var url = logUrl();
    if (!url || !row) return;
    var key = rowKey(row);
    if (inflight[key]) return;
    inflight[key] = true;
    var body = JSON.stringify(row);
    var done = function () {
      updateStore(function (store) {
        store.queue = store.queue.filter(function (item) { return rowKey(item) !== key; });
      });
      delete inflight[key];
    };
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: "text/plain" }))) { done(); return; }
    } catch (err) { /* fetch */ }
    fetch(url, { method: "POST", mode: "no-cors", cache: "no-store", keepalive: true, headers: { "Content-Type": "text/plain" }, body: body })
      .then(done, function () { delete inflight[key]; if (!retryTimer) retryTimer = setTimeout(function () { retryTimer = null; trySend(); }, 30000); });
  }
  function trySend() {
    if (!logUrl()) return;
    timeStore().queue.slice().forEach(deliver);
  }
  function startTimeTracker() {
    bootAt = Date.now();
    try {
      tabId = sessionStorage.getItem(TIME_TAB) || makeId();
      sessionStorage.setItem(TIME_TAB, tabId);
    } catch (err) { tabId = makeId(); }
    currentSection = sectionForPath();
    var now = Date.now();
    updateStore(function (store) {
      Object.keys(store.opens || {}).forEach(function (id) {
        var item = store.opens[id];
        if (!item) return;
        if (id !== tabId && now - (item.updatedAt || 0) < 3 * 60 * 1000) return;
        var row = rowFromOpen(item, item.updatedAt || now);
        if (row) pushQueue(store, row);
        delete store.opens[id];
      });
    });
    trySend();
    window.addEventListener("click", onActivity, true);
    window.addEventListener("keydown", onActivity, true);
    window.addEventListener("touchstart", onActivity, true);
    window.addEventListener("scroll", function (evt) { if (Date.now() - bootAt > 800) onActivity(evt); }, true);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") { endSession(Date.now()); trySend(); }
    });
    window.addEventListener("pagehide", function () { endSession(Date.now()); trySend(); });
    setInterval(function () {
      if (accruingFrom == null) return;
      var t = Date.now();
      if (document.visibilityState !== "visible" || !lastInput || t - lastInput >= IDLE_MS) endSession(t);
      else accrueUntil(t);
    }, 1000);
  }

  function route() {
    syncTimeSection();
    var path = (location.hash || "#/").replace(/^#/, "").split("?")[0];
    if (path === "/" || path === "") return home();
    if (path === "/lessons") return lessons();
    if (path.indexOf("/lesson/") === 0) return lessonView(decodeURIComponent(path.slice(8)));
    if (path === "/practice") return practiceSetup();
    if (path === "/focus") return focusHome();
    if (path === "/tests") return testsHome();
    if (path === "/quiz") return quiz();
    if (path === "/review") return review();
    if (path === "/results") return results();
    if (path === "/progress") return progressView();
    if (path === "/table") return tableView();
    home();
  }

  window.addEventListener("hashchange", route);
  try { startTimeTracker(); } catch (err) { /* the course still runs */ }
  if (!location.hash) location.hash = "#/";
  route();
})();
