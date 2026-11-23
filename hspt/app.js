(function () {
  "use strict";

  var BANK = window.HSPT_BANK || [];
  var PASSAGES = window.HSPT_PASSAGES || [];
  var LESSONS = window.HSPT_LESSONS || [];
  var VOCAB = window.HSPT_VOCAB || [];
  var TEST_DAY = new Date(2027, 0, 9);
  var STORE = "hspt-prep-v1";
  var VOCAB_STORE = "hspt-vocab-v1";
  var EXAM_STORE = "hspt-exam-v1";
  // Apps Script web app URL. Empty keeps the log on this device and sends nothing.
  var HSPT_LOG_URL = "https://script.google.com/macros/s/AKfycby0h5T84Fb-TnLz88nV1XvrIN8XU7-bygukpv_zj1jzRynOrAumJck-RSWAaqE-ivdstw/exec";
  var TIME_STORE = "hspt-time-v1";
  var TIME_TAB = "hspt-time-tab";
  var IDLE_MS = 60 * 1000;
  var FLUSH_MS = 5 * 60 * 1000;
  var QUEUE_MAX = 100;
  var TIME_SECTIONS = ["study", "practice", "mock", "other"];

  var SECTIONS = [
    { id: "verbal", name: "Verbal Skills", count: 60, seconds: 16 * 60 },
    { id: "quant", name: "Quantitative Skills", count: 52, seconds: 30 * 60 },
    { id: "reading", name: "Reading", count: 62, seconds: 25 * 60 },
    { id: "math", name: "Mathematics", count: 64, seconds: 45 * 60 },
    { id: "language", name: "Language", count: 60, seconds: 25 * 60 }
  ];

  var FOCUS = { verbal: true, reading: true, language: true };

  var main = document.getElementById("main");
  var ICON_OK = '<svg viewBox="0 0 16 16" width="16" height="16" focusable="false"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/></svg>';
  var ICON_NO = '<svg viewBox="0 0 16 16" width="16" height="16" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square"/></svg>';
  var timerHandle = null;

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

  function progress() {
    return load(STORE, { answers: {}, mocks: [] });
  }
  function vocabState() {
    var state = load(VOCAB_STORE, { cards: {} });
    VOCAB.forEach(function (card) {
      if (!state.cards[card.word]) {
        state.cards[card.word] = { due: 0, interval: 0, ease: 2.3, lapses: 0 };
      }
    });
    return state;
  }

  function byId(id) {
    for (var i = 0; i < BANK.length; i++) if (BANK[i].id === id) return BANK[i];
    return null;
  }
  function passage(id) {
    for (var i = 0; i < PASSAGES.length; i++) if (PASSAGES[i].id === id) return PASSAGES[i];
    return null;
  }
  function sectionMeta(id) {
    for (var i = 0; i < SECTIONS.length; i++) if (SECTIONS[i].id === id) return SECTIONS[i];
    return { id: id, name: id, seconds: 0, count: 0 };
  }

  function daysUntil() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var target = new Date(TEST_DAY.getFullYear(), TEST_DAY.getMonth(), TEST_DAY.getDate());
    return Math.round((target - today) / 86400000);
  }

  function plan() {
    return [
      { start: "2026-11-20", end: "2026-11-29", title: "Verbal launch", focus: true,
        text: "Roots, prefixes, suffixes, synonyms, and antonyms. Do vocab flashcards every day, about 15 minutes. This is the priority." },
      { start: "2026-11-30", end: "2026-12-06", title: "Analogies, logic, and a reading habit", focus: true,
        text: "Analogy relationship types and logic lessons. Add one reading passage a day. Keep the flashcards, especially missed words." },
      { start: "2026-12-07", end: "2026-12-13", title: "Reading strategies", focus: true,
        text: "Main idea, inference, author’s purpose, and vocabulary in context. Use Focus areas for a mixed drill." },
      { start: "2026-12-14", end: "2026-12-20", title: "Language rules", focus: true,
        text: "Spelling list, commas, apostrophes, capitalization, subject-verb agreement, and pronouns. Short verbal review still happens daily." },
      { start: "2026-12-21", end: "2026-12-27", title: "Mixed focus, light math", focus: true,
        text: "Holiday week: shorter sessions. Verbal, Reading, and Language drills, plus one quantitative and one math lesson so those sections are not a surprise." },
      { start: "2026-12-28", end: "2027-01-03", title: "Mock test 1", focus: true,
        text: "Take full mock test 1 under the real timers. The next day, review every miss, starting with Verbal, Reading, and Language." },
      { start: "2027-01-04", end: "2027-01-08", title: "Mock test 2, then rest", focus: true,
        text: "Take full mock test 2 early in the week. After that, only missed vocab cards and a light look at wrong answers. Sleep on January 8." },
      { start: "2027-01-09", end: "2027-01-09", title: "Test day", focus: false,
        text: "January 9. Breakfast, pencils, no calculator. Answer every question. There is no penalty for a guess." }
    ];
  }

  function inRange(item, day) {
    var s = new Date(item.start + "T00:00:00");
    var e = new Date(item.end + "T23:59:59");
    return day >= s && day <= e;
  }

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") node.className = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else if (k.indexOf("on") === 0) node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (kid) {
      if (kid == null) return;
      node.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    });
    return node;
  }

  function clearTimer() {
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
  }

  function navTarget() {
    var path = (location.hash || "#/").replace(/^#/, "").split("?")[0] || "/";
    if (path === "/") return "#/";
    if (path === "/lessons" || path.indexOf("/lesson/") === 0) return "#/lessons";
    if (path === "/practice" || path === "/focus") return "#/practice";
    if (path === "/vocab") return "#/vocab";
    if (path === "/mock") return "#/mock";
    if (path === "/progress") return "#/progress";
    if (path === "/quiz") {
      var ex = load(EXAM_STORE, null);
      return ex && ex.kind === "mock" ? "#/mock" : "#/practice";
    }
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
  }

  function home() {
    var days = daysUntil();
    var label = days > 1 ? days + " days" : days === 1 ? "1 day" : days === 0 ? "Today" : "Test day has passed";
    var wrap = el("div", { class: "home" }, [
      el("div", { class: "hero", "data-ghost": days > 0 ? String(days) : "" }, [
        el("p", { class: "tag focus" }, ["Focus: Verbal, Reading, Language"]),
        el("h1", { "data-ghost": days > 0 ? String(days) : "" }, ["HSPT practice"]),
        el("p", { class: "lede" }, ["Five sections, 298 questions, about two and a half hours of testing. These questions are original. The score at the end is only an estimate."])
      ]),
      el("div", { class: "card countdown" }, [
        el("p", { class: "muted" }, ["Countdown to January 9, 2027"]),
        el("div", { class: "count" }, [label, el("span", null, ["until test day"])])
      ]),
      el("div", { class: "row" }, [
        el("a", { class: "btn", href: "#/focus" }, ["Focus drill"]),
        el("a", { class: "btn secondary", href: "#/vocab" }, ["Vocab cards"]),
        el("a", { class: "btn secondary", href: "#/mock" }, ["Full mock"]),
        el("a", { class: "btn secondary", href: "#/plan" }, ["Study plan"])
      ])
    ]);
    var grid = el("div", { class: "grid two" });
    grid.appendChild(cardLink("Lessons", "Short lessons on roots, analogies, commas, inferences, and the rest.", "#/lessons"));
    grid.appendChild(cardLink("Practice", "One section or one question type, with an explanation right away.", "#/practice"));
    wrap.appendChild(grid);
    show(wrap);
  }

  function cardLink(title, text, href) {
    return el("a", { class: "card card-link", href: href }, [el("h2", null, [title]), el("p", null, [text])]);
  }

  function lessons() {
    var wrap = el("div", null, [el("h1", null, ["Lessons"])]);
    var order = ["verbal", "reading", "language", "quant", "math"];
    order.forEach(function (sec) {
      var group = LESSONS.filter(function (l) { return l.section === sec; });
      if (!group.length) return;
      wrap.appendChild(el("h2", null, [sectionMeta(sec).name]));
      group.forEach(function (lesson) {
        var bits = [el("h2", null, [lesson.title]), el("p", { class: "muted" }, [lesson.minutes + " min"])];
        if (lesson.focus) bits.unshift(el("span", { class: "tag focus" }, ["Focus"]));
        wrap.appendChild(el("a", { class: "card card-link", href: "#/lesson/" + lesson.id }, bits));
      });
    });
    show(wrap);
  }

  function lessonView(id) {
    var lesson = null;
    for (var i = 0; i < LESSONS.length; i++) if (LESSONS[i].id === id) lesson = LESSONS[i];
    if (!lesson) return home();
    var wrap = el("article", { class: "lesson" }, [
      el("p", null, [el("a", { href: "#/lessons" }, ["All lessons"])]),
      el("h1", null, [lesson.title])
    ]);
    lesson.paragraphs.forEach(function (p) { wrap.appendChild(el("p", null, [p])); });
    wrap.appendChild(el("h2", null, ["Worked example"]));
    wrap.appendChild(el("p", { class: "qstem" }, [lesson.example.stem]));
    var list = el("ol", { class: "choices" });
    lesson.example.choices.forEach(function (choice, idx) {
      var mark = idx === lesson.example.answer ? " (answer)" : "";
      list.appendChild(el("li", null, [String.fromCharCode(65 + idx) + ". " + choice + mark]));
    });
    wrap.appendChild(list);
    wrap.appendChild(el("p", null, [lesson.example.explanation]));
    wrap.appendChild(el("h2", null, ["Tips"]));
    var tips = el("ul");
    lesson.tips.forEach(function (tip) { tips.appendChild(el("li", null, [tip])); });
    wrap.appendChild(tips);
    wrap.appendChild(el("p", null, [
      el("a", { class: "btn", href: "#/practice?section=" + lesson.section }, ["Practice this section"])
    ]));
    show(wrap);
  }

  function practiceSetup(force) {
    var params = new URLSearchParams((location.hash.split("?")[1] || ""));
    var preset = force || params.get("section") || "verbal";
    var wrap = el("div", null, [
      el("h1", null, ["Practice"]),
      el("p", null, ["You get the explanation as soon as you answer. Focus drill mixes Verbal, Reading, and Language, with extra Verbal."])
    ]);
    var form = el("form", null, []);
    form.appendChild(el("label", { for: "sec" }, ["Section"]));
    var select = el("select", { id: "sec", name: "sec" });
    [{ id: "focus", name: "Focus areas (Verbal, Reading, Language)" }].concat(SECTIONS.map(function (s) {
      return { id: s.id, name: s.name };
    })).forEach(function (opt) {
      var o = el("option", { value: opt.id }, [opt.name]);
      if (opt.id === preset || (preset && opt.id === preset)) o.selected = true;
      select.appendChild(o);
    });
    if (preset === "focus") select.value = "focus";
    form.appendChild(select);
    form.appendChild(el("label", { for: "n" }, ["How many"]));
    var count = el("select", { id: "n" });
    [5, 10, 20].forEach(function (n) {
      count.appendChild(el("option", { value: String(n) }, [n + " questions"]));
    });
    count.value = "10";
    form.appendChild(count);
    form.appendChild(el("div", { class: "row" }, [
      el("button", { type: "submit" }, ["Start"])
    ]));
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      startPractice(select.value, Number(count.value));
    });
    wrap.appendChild(form);
    show(wrap);
  }

  function poolFor(section) {
    if (section === "focus") {
      return BANK.filter(function (q) { return FOCUS[q.section]; });
    }
    return BANK.filter(function (q) { return q.section === section; });
  }

  function startPractice(section, n) {
    var pool = poolFor(section).slice();
    shuffle(pool, Date.now() % 100000);
    if (section === "focus") {
      var verbal = pool.filter(function (q) { return q.section === "verbal"; });
      var reading = pool.filter(function (q) { return q.section === "reading"; });
      var language = pool.filter(function (q) { return q.section === "language"; });
        var mixed = [];
        var i = 0;
        while (mixed.length < n && (verbal.length || reading.length || language.length)) {
          var bucket = (i % 5 < 3) ? verbal : (i % 5 === 3) ? reading : language;
        if (!bucket.length) bucket = verbal.length ? verbal : (reading.length ? reading : language);
        mixed.push(bucket.shift());
        i += 1;
      }
      pool = mixed;
    } else {
      pool = pool.slice(0, n);
    }
    var exam = {
      kind: "practice",
      label: section === "focus" ? "Focus drill" : sectionMeta(section).name + " practice",
      ids: pool.map(function (q) { return q.id; }),
      index: 0,
      answers: {},
      revealed: false,
      sectionIndex: 0,
      sections: [section === "focus" ? "focus" : section],
      started: Date.now()
    };
    save(EXAM_STORE, exam);
    location.hash = "#/quiz";
  }

  function mockHome() {
    var wrap = el("div", null, [
      el("h1", null, ["Full mock test"]),
      el("p", null, ["Two original tests. Each has 298 questions and the real section times: 16, 30, 25, 45, and 25 minutes. You cannot go back to a finished section. There is no score penalty for a wrong answer, so guess if time is short."]),
      el("p", { class: "muted" }, ["No calculator, same as the real HSPT."])
    ]);
    var row = el("div", { class: "row" });
    [1, 2].forEach(function (n) {
      var b = el("button", { type: "button", onclick: function () { startMock(n); } }, ["Start mock " + n]);
      row.appendChild(b);
    });
    wrap.appendChild(row);
    var saved = load(EXAM_STORE, null);
    if (saved && saved.kind === "mock") {
      wrap.appendChild(el("p", null, [
        el("a", { href: "#/quiz" }, ["Resume the mock you already started"])
      ]));
    }
    show(wrap);
  }

  function startMock(n) {
    var ids = [];
    SECTIONS.forEach(function (sec) {
      var part = BANK.filter(function (q) { return q.mock === n && q.section === sec.id; });
      shuffle(part, n * 1000 + sec.id.length);
      part.forEach(function (q) { ids.push(q.id); });
    });
    save(EXAM_STORE, {
      kind: "mock",
      mock: n,
      label: "Mock test " + n,
      ids: ids,
      index: 0,
      answers: {},
      revealed: false,
      sectionIndex: 0,
      sections: SECTIONS.map(function (s) { return s.id; }),
      sectionEnds: {},
      started: Date.now(),
      deadline: Date.now() + SECTIONS[0].seconds * 1000
    });
    location.hash = "#/quiz";
  }

  function exam() {
    return load(EXAM_STORE, null);
  }

  function currentQuestion(ex) {
    return byId(ex.ids[ex.index]);
  }

  function sectionBounds(ex) {
    if (ex.kind !== "mock") return { start: 0, end: ex.ids.length, meta: { name: ex.label, seconds: 0 } };
    var id = ex.sections[ex.sectionIndex];
    var meta = sectionMeta(id);
    var start = 0;
    for (var i = 0; i < ex.sectionIndex; i++) start += sectionMeta(ex.sections[i]).count;
    return { start: start, end: start + meta.count, meta: meta };
  }

  function quiz() {
    var ex = exam();
    if (!ex) return mockHome();
    var item = currentQuestion(ex);
    if (!item) return finishExam();
    var bounds = sectionBounds(ex);
    var wrap = el("div");
    var bar = el("div", { class: "bar" });
    var qNum = ex.index - bounds.start + 1;
    var qTotal = bounds.end - bounds.start;
    bar.appendChild(el("div", { class: "bar-meta" }, [
      el("span", { class: "label" }, [ex.label + " — " + (ex.kind === "mock" ? bounds.meta.name : "Practice")]),
      el("span", { class: "qcount" }, ["Question " + qNum + " of " + qTotal])
    ]));
    var timer = el("span", { class: "timer", id: "timer" }, [""]);
    if (ex.kind === "mock") {
      bar.appendChild(el("div", { class: "timer-box", role: "timer", "aria-label": "Time left in this section" }, [
        el("span", { class: "label timer-label" }, [el("span", { class: "tl-normal" }, ["Time left"]), el("span", { class: "tl-warn" }, ["Under 1 min"])]),
        timer
      ]));
    }
    wrap.appendChild(bar);
    wrap.appendChild(el("div", { class: "qprog", "aria-hidden": "true" }, [
      el("span", { style: "width:" + Math.round(100 * (qNum - (ex.revealed ? 0 : 1)) / qTotal) + "%" })
    ]));
    if (item.passageId) {
      var p = passage(item.passageId);
      if (p) {
        wrap.appendChild(el("h2", null, [p.title]));
        wrap.appendChild(el("div", { class: "passage" }, [p.text]));
      }
    }
    wrap.appendChild(el("p", { class: "qstem" }, [item.stem]));
    var form = el("form");
    var list = el("div", { class: "choices", role: "radiogroup", "aria-label": "Answer choices" });
    item.choices.forEach(function (choice, idx) {
      var id = "c" + idx;
      var input = el("input", { type: "radio", name: "choice", id: id, value: String(idx) });
      if (ex.answers[item.id] === idx) input.checked = true;
      if (ex.revealed) input.disabled = true;
      var state = "";
      var icon = String.fromCharCode(65 + idx);
      if (ex.revealed && idx === item.answer) { state = "is-right"; icon = { html: ICON_OK }; }
      else if (ex.revealed && idx === ex.answers[item.id]) { state = "is-wrong"; icon = { html: ICON_NO }; }
      var letter = typeof icon === "string" ? el("span", { class: "letter", "aria-hidden": "true" }, [icon]) : el("span", { class: "letter", "aria-hidden": "true", html: icon.html });
      var srState = state === "is-right" ? " (correct answer)" : state === "is-wrong" ? " (your answer, incorrect)" : "";
      list.appendChild(el("label", { for: id, class: state }, [
        input, letter,
        el("span", { class: "choice-text" }, [el("span", { class: "sr" }, [String.fromCharCode(65 + idx) + ". "]), choice, srState ? el("span", { class: "sr" }, [srState]) : null])
      ]));
    });
    form.appendChild(list);
    var feedback = el("div", { id: "feedback", "aria-live": "polite" });
    form.appendChild(feedback);
    if (ex.revealed) feedback.appendChild(renderFeedback(item, ex.answers[item.id]));
    var buttons = el("div", { class: "row" });
    if (ex.kind === "practice" && !ex.revealed) {
      buttons.appendChild(el("button", { type: "submit" }, ["Check"]));
    } else if (ex.kind === "practice") {
      buttons.appendChild(el("button", { type: "button", onclick: function () { nextPractice(); } }, ["Next"]));
    } else {
      buttons.appendChild(el("button", { type: "submit" }, [ex.index + 1 === bounds.end ? "Finish section" : "Next"]));
    }
    form.appendChild(buttons);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var picked = form.querySelector("input[name=choice]:checked");
      if (!picked) return;
      var firstAnswer = ex.answers[item.id] == null;
      ex.answers[item.id] = Number(picked.value);
      if (firstAnswer) noteQuestionAnswered();
      if (ex.kind === "practice") {
        ex.revealed = true;
        recordAnswer(item, ex.answers[item.id]);
        save(EXAM_STORE, ex);
        quiz();
        return;
      }
      save(EXAM_STORE, ex);
      if (ex.index + 1 === bounds.end) finishSection();
      else {
        ex.index += 1;
        save(EXAM_STORE, ex);
        quiz();
      }
    });
    wrap.appendChild(form);
    show(wrap);
    if (ex.kind === "mock") armTimer(ex);
  }

  function renderFeedback(item, picked) {
    var ok = picked === item.answer;
    var box = el("div", { class: "fb " + (ok ? "fb-good" : "fb-bad") }, [
      el("p", { class: "fb-head" }, [
        el("span", { class: "fb-ico", "aria-hidden": "true", html: ok ? ICON_OK : ICON_NO }),
        el("strong", null, [ok ? "Correct" : "Incorrect"])
      ]),
      ok ? null : el("p", { class: "fb-answer" }, ["The answer is " + String.fromCharCode(65 + item.answer) + ". " + item.choices[item.answer]]),
      el("p", { class: "fb-why" }, [item.explanation])
    ]);
    return box;
  }

  function recordAnswer(item, picked) {
    var store = progress();
    store.answers[item.id] = { correct: picked === item.answer, section: item.section, type: item.type, at: Date.now() };
    save(STORE, store);
    if (picked !== item.answer && item.word) scheduleWord(item.word, true);
  }

  function nextPractice() {
    var ex = exam();
    if (ex.index + 1 >= ex.ids.length) return finishExam();
    ex.index += 1;
    ex.revealed = false;
    save(EXAM_STORE, ex);
    quiz();
  }

  function armTimer(ex) {
    var node = document.getElementById("timer");
    function tick() {
      var left = Math.max(0, ex.deadline - Date.now());
      var m = Math.floor(left / 60000);
      var s = Math.floor((left % 60000) / 1000);
      if (node) {
        node.textContent = (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
        node.className = "timer" + (left < 60000 ? " warn" : "");
      }
      if (left <= 0) finishSection();
    }
    tick();
    timerHandle = setInterval(tick, 250);
  }

  function finishSection() {
    clearTimer();
    var ex = exam();
    if (!ex || ex.kind !== "mock" || ex.locking) return;
    ex.locking = true;
    save(EXAM_STORE, ex);
    var bounds = sectionBounds(ex);
    for (var i = bounds.start; i < bounds.end; i++) {
      var item = byId(ex.ids[i]);
      if (ex.answers[item.id] == null) ex.answers[item.id] = -1;
      recordAnswer(item, ex.answers[item.id]);
    }
    if (ex.sectionIndex + 1 >= ex.sections.length) {
      save(EXAM_STORE, ex);
      return finishExam();
    }
    ex.locking = false;
    ex.sectionIndex += 1;
    ex.index = sectionBounds(ex).start;
    ex.deadline = Date.now() + sectionMeta(ex.sections[ex.sectionIndex]).seconds * 1000;
    save(EXAM_STORE, ex);
    quiz();
  }

  function erf(x) {
    var sign = x < 0 ? -1 : 1;
    var a = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * a);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
    return sign * y;
  }

  function approx(correct, total) {
    var pct = total ? (correct / total) * 100 : 0;
    var standard = Math.round(200 + (pct / 100) * 600);
    var z = (pct - 65) / 12;
    var percentile = Math.round(50 * (1 + erf(z / Math.SQRT2)));
    if (percentile < 1) percentile = 1;
    if (percentile > 99) percentile = 99;
    return { pct: Math.round(pct), standard: standard, percentile: percentile };
  }

  function finishExam() {
    var ex = exam();
    if (!ex) return home();
    var sections = {};
    var missed = [];
    var correct = 0;
    var total = 0;
    ex.ids.forEach(function (id) {
      var item = byId(id);
      var picked = ex.answers[id];
      var ok = picked === item.answer;
      if (!sections[item.section]) sections[item.section] = { correct: 0, total: 0 };
      sections[item.section].total += 1;
      total += 1;
      if (ok) {
        sections[item.section].correct += 1;
        correct += 1;
      } else {
        missed.push(id);
        if (item.word) scheduleWord(item.word, true);
      }
    });
    var summary = {
      label: ex.label,
      kind: ex.kind,
      at: Date.now(),
      correct: correct,
      total: total,
      sections: sections,
      missed: missed,
      approx: approx(correct, total)
    };
    var store = progress();
    store.mocks.push(summary);
    save(STORE, store);
    save(EXAM_STORE, null);
    sessionStorage.setItem("hspt-last-result", JSON.stringify(summary));
    location.hash = "#/results";
  }

  function results() {
    var raw = sessionStorage.getItem("hspt-last-result");
    var summary = raw ? JSON.parse(raw) : (progress().mocks.slice(-1)[0] || null);
    if (!summary) return home();
    var wrap = el("div", null, [
      el("h1", null, [summary.label + " results"]),
      el("div", { class: "score" }, [
        el("span", { class: "score-num" }, [summary.correct + "/" + summary.total]),
        el("span", { class: "score-sub" }, [summary.correct + " of " + summary.total + " correct (" + summary.approx.pct + "%)."])
      ])
    ]);
    var table = el("table", null, [
      el("thead", null, [el("tr", null, [el("th", null, ["Section"]), el("th", null, ["Correct"]), el("th", null, ["Approx. score"])])]),
      el("tbody")
    ]);
    var body = table.querySelector("tbody");
    Object.keys(summary.sections).forEach(function (id) {
      var sec = summary.sections[id];
      var est = approx(sec.correct, sec.total);
      body.appendChild(el("tr", null, [
        el("td", null, [sectionMeta(id).name || id]),
        el("td", null, [sec.correct + " / " + sec.total]),
        el("td", null, [String(est.standard)])
      ]));
    });
    wrap.appendChild(table);
    wrap.appendChild(el("div", { class: "card" }, [
      el("h2", null, ["Approximate score"]),
      el("p", null, ["About " + summary.approx.standard + " on a 200–800 line, near a made-up " + summary.approx.percentile + "th percentile if 65% correct were average."]),
      el("p", { class: "muted" }, ["This is not an official HSPT standard score or national percentile. STS equates each form. Use it only to compare your own practice tests."])
    ]));
    wrap.appendChild(el("h2", null, ["Missed questions"]));
    if (!summary.missed.length) wrap.appendChild(el("p", null, ["None. Nice."]));
    summary.missed.slice(0, 30).forEach(function (id) {
      var item = byId(id);
      if (!item) return;
      wrap.appendChild(el("div", { class: "miss" }, [
        el("p", { class: "qstem" }, [item.stem]),
        el("p", { class: "good" }, [el("span", { class: "fb-ico", "aria-hidden": "true", html: ICON_OK }), "Answer: " + item.choices[item.answer]]),
        el("p", null, [item.explanation])
      ]));
    });
    if (summary.missed.length > 30) {
      wrap.appendChild(el("p", { class: "muted" }, ["Showing 30 of " + summary.missed.length + " misses."]));
    }
    show(wrap);
  }

  function dueCards() {
    var state = vocabState();
    var now = Date.now();
    return VOCAB.filter(function (card) {
      return state.cards[card.word].due <= now;
    }).sort(function (a, b) {
      return state.cards[b.word].lapses - state.cards[a.word].lapses;
    });
  }

  function scheduleWord(word, missed) {
    var state = vocabState();
    var card = state.cards[word];
    if (!card) return;
    card.lapses += missed ? 1 : 0;
    card.interval = missed ? 0 : card.interval;
    card.due = Date.now();
    save(VOCAB_STORE, state);
  }

  function grade(word, rating) {
    var state = vocabState();
    var card = state.cards[word];
    var day = 86400000;
    if (rating === "again") {
      card.lapses += 1;
      card.interval = 0;
      card.due = Date.now() + 10 * 60 * 1000;
    } else if (rating === "good") {
      card.interval = card.interval < 1 ? 1 : Math.round(card.interval * card.ease);
      card.due = Date.now() + card.interval * day;
    } else {
      card.interval = Math.max(3, Math.round((card.interval || 1) * card.ease * 1.3));
      card.due = Date.now() + card.interval * day;
    }
    save(VOCAB_STORE, state);
    vocab();
  }

  function vocab() {
    var due = dueCards();
    var wrap = el("div", null, [
      el("h1", null, ["Vocab builder"]),
      el("p", null, [due.length + " cards are due. Missed words from Verbal and Reading come back sooner."])
    ]);
    if (!due.length) {
      wrap.appendChild(el("p", null, ["Nothing due right now. Come back tomorrow, or practice Verbal to add misses."]));
      show(wrap);
      return;
    }
    var card = due[0];
    var face = el("div", { class: "card" }, [
      el("p", { class: "muted" }, ["Card 1 of " + due.length]),
      el("div", { class: "card-face" }, [card.word])
    ]);
    var shown = false;
    var body = el("div");
    var showBtn = el("button", { type: "button", onclick: function () {
      if (shown) return;
      shown = true;
      body.appendChild(el("p", null, [card.def]));
      body.appendChild(el("p", null, [card.example]));
      body.appendChild(el("p", { class: "muted" }, ["Opposite: " + card.ant + ". Close word: " + card.syn + "."]));
      var row = el("div", { class: "row" });
      row.appendChild(el("button", { type: "button", class: "secondary", onclick: function () { grade(card.word, "again"); } }, ["Again"]));
      row.appendChild(el("button", { type: "button", onclick: function () { grade(card.word, "good"); } }, ["Good"]));
      row.appendChild(el("button", { type: "button", class: "secondary", onclick: function () { grade(card.word, "easy"); } }, ["Easy"]));
      body.appendChild(row);
    } }, ["Show meaning"]);
    face.appendChild(showBtn);
    face.appendChild(body);
    wrap.appendChild(face);
    show(wrap);
  }

  function planView() {
    var today = new Date();
    var wrap = el("div", null, [
      el("h1", null, ["Study plan"]),
      el("p", null, ["About seven weeks, weighted toward Verbal, Reading, and Language. Two full mocks sit at the end."])
    ]);
    var list = el("ol", { class: "plan" });
    plan().forEach(function (week) {
      var current = inRange(week, today);
      var li = el("li", { class: current ? "now" : "" }, [
        el("strong", null, [week.title + (current ? " (this week)" : "")]),
        el("div", { class: "muted" }, [week.start + " to " + week.end]),
        document.createTextNode(" " + week.text)
      ]);
      if (week.focus) li.insertBefore(el("span", { class: "tag focus" }, ["Focus"]), li.firstChild);
      list.appendChild(li);
    });
    wrap.appendChild(list);
    show(wrap);
  }

  function progressView() {
    var store = progress();
    var by = {};
    Object.keys(store.answers).forEach(function (id) {
      var row = store.answers[id];
      if (!by[row.section]) by[row.section] = { correct: 0, total: 0 };
      by[row.section].total += 1;
      if (row.correct) by[row.section].correct += 1;
    });
    var wrap = el("div", null, [el("h1", null, ["Progress"])]);
    var table = el("table");
    var body = el("tbody");
    table.appendChild(el("thead", null, [el("tr", null, [el("th", null, ["Section"]), el("th", null, ["Answered"]), el("th", null, ["Correct"])])]));
    SECTIONS.forEach(function (sec) {
      var row = by[sec.id] || { correct: 0, total: 0 };
      body.appendChild(el("tr", null, [
        el("td", null, [sec.name]),
        el("td", null, [String(row.total)]),
        el("td", null, [row.total ? Math.round(100 * row.correct / row.total) + "%" : "—"])
      ]));
    });
    table.appendChild(body);
    wrap.appendChild(table);
    wrap.appendChild(el("p", { class: "muted" }, [store.mocks.length + " finished practice sets or mocks are saved on this device."]));
    show(wrap);
  }

  function shuffle(arr, seed) {
    var a = seed || 1;
    function rnd() {
      a = (a * 1664525 + 1013904223) >>> 0;
      return a / 4294967296;
    }
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  // Active time only: the tab is visible and the user clicked, typed, scrolled,
  // or touched in the last 60 seconds. Totals live in localStorage by local
  // date and section. A session starts when they become active (fresh visit,
  // return from idle, or return from a hidden tab) and ends on idle, hide,
  // or pagehide. Each POST is one non-overlapping slice of that session.
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
    return { study: 0, practice: 0, mock: 0, other: 0 };
  }

  function logUrl() {
    if (typeof HSPT_LOG_URL !== "string") return "";
    return HSPT_LOG_URL.replace(/^\s+|\s+$/g, "");
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
    try {
      if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    } catch (err) { /* private context */ }
    return "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function shortAgent() {
    var ua = (typeof navigator !== "undefined" && navigator.userAgent) ? navigator.userAgent : "";
    var browser = "Browser";
    var version = "";
    if (/Edg\//.test(ua)) {
      browser = "Edge";
      version = (ua.match(/Edg\/(\d+)/) || [])[1] || "";
    } else if (/OPR\//.test(ua)) {
      browser = "Opera";
      version = (ua.match(/OPR\/(\d+)/) || [])[1] || "";
    } else if (/Chrome\//.test(ua)) {
      browser = "Chrome";
      version = (ua.match(/Chrome\/(\d+)/) || [])[1] || "";
    } else if (/Firefox\//.test(ua)) {
      browser = "Firefox";
      version = (ua.match(/Firefox\/(\d+)/) || [])[1] || "";
    } else if (/Safari\//.test(ua)) {
      browser = "Safari";
      version = (ua.match(/Version\/(\d+)/) || [])[1] || "";
    }
    var os = "Unknown";
    if (/Windows/.test(ua)) os = "Windows";
    else if (/Android/.test(ua)) os = "Android";
    else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
    else if (/Mac OS X/.test(ua)) os = "Mac";
    else if (/Linux/.test(ua)) os = "Linux";
    return browser + (version ? " " + version : "") + " / " + os;
  }

  function timeStore() {
    var store = load(TIME_STORE, null);
    if (!store || typeof store !== "object" || Array.isArray(store)) {
      store = { days: {}, sessionCount: 0, queue: [], opens: {} };
    }
    if (!store.days || typeof store.days !== "object" || Array.isArray(store.days)) store.days = {};
    if (!Array.isArray(store.queue)) store.queue = [];
    if (!store.opens || typeof store.opens !== "object" || Array.isArray(store.opens)) store.opens = {};
    if (typeof store.sessionCount !== "number" || !isFinite(store.sessionCount)) store.sessionCount = 0;
    return store;
  }

  function updateStore(mutator) {
    var store = timeStore();
    mutator(store);
    save(TIME_STORE, store);
    return store;
  }

  function ensureDay(store, date) {
    var day = store.days[date];
    if (!day || typeof day !== "object" || Array.isArray(day)) {
      day = { study: 0, practice: 0, mock: 0, other: 0, questions: 0, sessions: 0 };
      store.days[date] = day;
    }
    var keys = ["study", "practice", "mock", "other", "questions", "sessions"];
    for (var i = 0; i < keys.length; i++) {
      if (typeof day[keys[i]] !== "number" || !isFinite(day[keys[i]])) day[keys[i]] = 0;
    }
    return day;
  }

  function sectionForPath() {
    var hash = location.hash || "#/";
    var path = hash.replace(/^#/, "").split("?")[0];
    if (path === "/lessons" || path.indexOf("/lesson/") === 0 || path === "/vocab") return "study";
    if (path === "/practice" || path === "/focus") return "practice";
    if (path === "/mock") return "mock";
    if (path === "/quiz") {
      var ex = exam();
      if (ex && ex.kind === "mock") return "mock";
      if (ex && ex.kind === "practice") return "practice";
      return "mock";
    }
    return "other";
  }

  function syncTimeSection() {
    try {
      var next = sectionForPath();
      if (next === currentSection) return;
      if (accruingFrom != null) accrueUntil(Date.now());
      currentSection = next;
    } catch (err) { /* a tracking failure must not block navigation */ }
  }

  function copyOpen(src) {
    var pending = src.pending || emptySections();
    var remainderMs = src.remainderMs || emptySections();
    return {
      sessionId: src.sessionId,
      startedAt: src.startedAt,
      sliceStart: src.sliceStart,
      sliceDate: src.sliceDate,
      pending: {
        study: pending.study || 0,
        practice: pending.practice || 0,
        mock: pending.mock || 0,
        other: pending.other || 0
      },
      remainderMs: {
        study: remainderMs.study || 0,
        practice: remainderMs.practice || 0,
        mock: remainderMs.mock || 0,
        other: remainderMs.other || 0
      },
      pendingQuestions: src.pendingQuestions || 0,
      updatedAt: src.updatedAt || src.sliceStart || 0
    };
  }

  function rememberOpen(store) {
    if (!store.opens) store.opens = {};
    if (open) store.opens[tabId] = copyOpen(open);
    else delete store.opens[tabId];
  }

  function rowKey(row) {
    return (row.sessionId || "") + "|" + (row.start || "");
  }

  function rowFromOpen(item, endMs) {
    var pending = item.pending || emptySections();
    var sections = {
      study: pending.study || 0,
      practice: pending.practice || 0,
      mock: pending.mock || 0,
      other: pending.other || 0
    };
    var active = sections.study + sections.practice + sections.mock + sections.other;
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
      userAgent: shortAgent()
    };
  }

  function pushQueue(store, row) {
    if (!row || !row.sessionId) return;
    store.queue.push(row);
    if (store.queue.length > QUEUE_MAX) store.queue.splice(0, store.queue.length - QUEUE_MAX);
  }

  function absorbRemainder(store, item) {
    item.pending = item.pending || emptySections();
    item.remainderMs = item.remainderMs || emptySections();
    var date = item.sliceDate || localDateStr(item.sliceStart || Date.now());
    for (var i = 0; i < TIME_SECTIONS.length; i++) {
      var name = TIME_SECTIONS[i];
      var rem = item.remainderMs[name] || 0;
      if (rem >= 500) {
        item.pending[name] = (item.pending[name] || 0) + 1;
        ensureDay(store, date)[name] += 1;
        item.remainderMs[name] = 0;
      }
    }
  }

  function credit(date, section, ms) {
    if (!open || ms <= 0) return;
    if (!open.pending) open.pending = emptySections();
    if (!open.remainderMs) open.remainderMs = emptySections();
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
      if (!keep) absorbRemainder(store, ending);
      var row = rowFromOpen(ending, endMs);
      if (row) pushQueue(store, row);
      if (!store.opens) store.opens = {};
      if (keep) {
        next = {
          sessionId: ending.sessionId,
          startedAt: ending.startedAt,
          sliceStart: endMs,
          sliceDate: localDateStr(endMs),
          pending: emptySections(),
          remainderMs: {
            study: (ending.remainderMs && ending.remainderMs.study) || 0,
            practice: (ending.remainderMs && ending.remainderMs.practice) || 0,
            mock: (ending.remainderMs && ending.remainderMs.mock) || 0,
            other: (ending.remainderMs && ending.remainderMs.other) || 0
          },
          pendingQuestions: 0,
          updatedAt: endMs
        };
        store.opens[tabId] = copyOpen(next);
      } else {
        delete store.opens[tabId];
      }
    });
    open = keep ? next : null;
    if (!keep) {
      accruingFrom = null;
      disarmFlush();
      clearIdle();
    }
  }

  function addActive(from, to) {
    if (!open || to <= from) return;
    var cursor = from;
    var guard = 0;
    while (open && cursor < to && guard < 10) {
      guard += 1;
      var boundary = nextLocalMidnight(cursor);
      var end = to < boundary ? to : boundary;
      var date = localDateStr(cursor);
      if (open.sliceDate !== date) {
        finalizeSlice(cursor, true);
        if (!open) return;
      }
      credit(date, currentSection, end - cursor);
      if (!open) return;
      if (end < to && end === boundary) {
        finalizeSlice(boundary, true);
        cursor = boundary;
      } else {
        cursor = end;
      }
    }
  }

  function accrueUntil(now) {
    if (accruingFrom == null || !open) {
      accruingFrom = null;
      return;
    }
    var end = now;
    var cap = lastInput + IDLE_MS;
    if (end > cap) end = cap;
    if (end > accruingFrom) addActive(accruingFrom, end);
    accruingFrom = (now >= cap || document.visibilityState !== "visible") ? null : end;
  }

  function clearIdle() {
    if (idleTimer != null) clearTimeout(idleTimer);
    idleTimer = null;
  }

  function disarmFlush() {
    if (flushTimer != null) clearInterval(flushTimer);
    flushTimer = null;
  }

  function armIdle() {
    clearIdle();
    var delay = lastInput + IDLE_MS - Date.now();
    if (delay < 0) delay = 0;
    idleTimer = setTimeout(onIdle, delay);
  }

  function onIdle() {
    idleTimer = null;
    if (Date.now() - lastInput < IDLE_MS) {
      armIdle();
      return;
    }
    endSession(lastInput + IDLE_MS);
    trySend();
  }

  function onFlushInterval() {
    if (!open || accruingFrom == null) return;
    var now = Date.now();
    if (document.visibilityState !== "visible" || !lastInput || now - lastInput >= IDLE_MS) return;
    accrueUntil(now);
    if (!open) return;
    finalizeSlice(now, true);
    trySend();
  }

  function armFlush() {
    if (flushTimer != null) return;
    flushTimer = setInterval(onFlushInterval, FLUSH_MS);
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
    var date = open.sliceDate;
    updateStore(function (store) {
      store.sessionCount += 1;
      ensureDay(store, date).sessions += 1;
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
    disarmFlush();
    clearIdle();
  }

  function becomeActive(now) {
    if (document.visibilityState !== "visible") return;
    if (!lastInput || now - lastInput >= IDLE_MS) return;
    if (!open) beginSession(now);
    if (!open) return;
    if (accruingFrom == null) accruingFrom = now;
    armIdle();
    armFlush();
  }

  function onActivity(evt) {
    try {
      if (evt && evt.isTrusted === false) return;
      if (document.visibilityState !== "visible") return;
      var now = Date.now();
      lastInput = now;
      becomeActive(now);
    } catch (err) { /* do not swallow the click */ }
  }

  function onScroll(evt) {
    try {
      if (Date.now() - bootAt < 800) return;
      onActivity(evt);
    } catch (err) { /* ignore */ }
  }

  function onVisibility() {
    try {
      if (document.visibilityState === "hidden") {
        endSession(Date.now());
        trySend();
        return;
      }
      var now = Date.now();
      if (lastInput && now - lastInput < IDLE_MS) becomeActive(now);
    } catch (err) { /* ignore */ }
  }

  function onPageHide() {
    try {
      endSession(Date.now());
      trySend();
    } catch (err) { /* ignore */ }
  }

  function onPageShow() {
    try {
      if (document.visibilityState !== "visible") return;
      var now = Date.now();
      if (lastInput && now - lastInput < IDLE_MS && !open) becomeActive(now);
    } catch (err) { /* ignore */ }
  }

  function tick() {
    try {
      if (accruingFrom == null && !open) return;
      var now = Date.now();
      var active = document.visibilityState === "visible" && lastInput && (now - lastInput < IDLE_MS);
      if (!active) {
        if (open || accruingFrom != null) {
          endSession(now);
          trySend();
        }
        return;
      }
      accrueUntil(now);
    } catch (err) { /* ignore */ }
  }

  function noteQuestionAnswered() {
    try {
      var now = Date.now();
      if (document.visibilityState === "visible") {
        lastInput = now;
        becomeActive(now);
      }
      if (!open) return;
      open.pendingQuestions = (open.pendingQuestions || 0) + 1;
      open.updatedAt = now;
      var date = open.sliceDate || localDateStr(now);
      updateStore(function (store) {
        ensureDay(store, date).questions += 1;
        rememberOpen(store);
      });
    } catch (err) { /* an answer still counts if tracking fails */ }
  }

  function recoverOpens() {
    var now = Date.now();
    updateStore(function (store) {
      var opens = store.opens || {};
      Object.keys(opens).forEach(function (id) {
        var item = opens[id];
        if (!item || typeof item !== "object") {
          delete opens[id];
          return;
        }
        var age = now - (item.updatedAt || item.sliceStart || 0);
        var mine = id === tabId;
        if (!mine && age < 3 * 60 * 1000) return;
        var normalized = copyOpen(item);
        absorbRemainder(store, normalized);
        var row = rowFromOpen(normalized, normalized.updatedAt || normalized.sliceStart || now);
        if (row) pushQueue(store, row);
        delete opens[id];
      });
      store.opens = opens;
    });
  }

  function removeQueued(key) {
    updateStore(function (store) {
      store.queue = store.queue.filter(function (row) {
        return rowKey(row) !== key;
      });
    });
  }

  function requeue(row) {
    var key = rowKey(row);
    updateStore(function (store) {
      for (var i = 0; i < store.queue.length; i++) {
        if (rowKey(store.queue[i]) === key) return;
      }
      pushQueue(store, row);
    });
  }

  function scheduleRetry() {
    if (retryTimer || !logUrl()) return;
    retryTimer = setTimeout(function () {
      retryTimer = null;
      if (!timeStore().queue.length) return;
      trySend();
    }, 30000);
  }

  function beacon(url, body) {
    if (!navigator || typeof navigator.sendBeacon !== "function") return false;
    try {
      if (typeof Blob === "function") {
        var blob = new Blob([body], { type: "text/plain" });
        if (navigator.sendBeacon(url, blob)) return true;
      }
    } catch (err) { /* try the string body */ }
    try {
      return navigator.sendBeacon(url, body) === true;
    } catch (err2) {
      return false;
    }
  }

  function deliver(row) {
    var url = logUrl();
    if (!url || !row) return;
    var key = rowKey(row);
    if (inflight[key]) return;
    inflight[key] = true;
    var body = JSON.stringify(row);
    if (beacon(url, body)) {
      removeQueued(key);
      delete inflight[key];
      return;
    }
    var unloading = document.visibilityState !== "visible";
    if (unloading) removeQueued(key);
    try {
      fetch(url, {
        method: "POST",
        mode: "no-cors",
        cache: "no-store",
        keepalive: true,
        credentials: "omit",
        headers: { "Content-Type": "text/plain" },
        body: body
      }).then(function () {
        if (!unloading) removeQueued(key);
        delete inflight[key];
      }, function () {
        delete inflight[key];
        if (unloading) requeue(row);
        scheduleRetry();
      });
    } catch (err) {
      delete inflight[key];
      if (unloading) requeue(row);
      else scheduleRetry();
    }
  }

  function trySend() {
    if (!logUrl()) return;
    var copy = timeStore().queue.slice();
    for (var i = 0; i < copy.length; i++) deliver(copy[i]);
  }

  function readTabId() {
    try {
      var existing = sessionStorage.getItem(TIME_TAB);
      if (existing) return existing;
      var id = makeId();
      sessionStorage.setItem(TIME_TAB, id);
      return id;
    } catch (err) {
      return makeId();
    }
  }

  function startTimeTracker() {
    bootAt = Date.now();
    tabId = readTabId();
    currentSection = sectionForPath();
    recoverOpens();
    trySend();
    window.addEventListener("click", onActivity, true);
    window.addEventListener("keydown", onActivity, true);
    window.addEventListener("touchstart", onActivity, true);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    setInterval(tick, 1000);
  }

  function route() {
    syncTimeSection();
    var hash = location.hash || "#/";
    var path = hash.replace(/^#/, "").split("?")[0];
    if (path === "/" || path === "") return home();
    if (path === "/lessons") return lessons();
    if (path.indexOf("/lesson/") === 0) return lessonView(path.slice(8));
    if (path === "/focus") return practiceSetup("focus");
    if (path === "/practice") return practiceSetup();
    if (path === "/mock") return mockHome();
    if (path === "/quiz") return quiz();
    if (path === "/results") return results();
    if (path === "/vocab") return vocab();
    if (path === "/plan") return planView();
    if (path === "/progress") return progressView();
    home();
  }

  window.addEventListener("hashchange", route);
  try { startTimeTracker(); } catch (err) { /* study app still runs */ }
  if (!location.hash) location.hash = "#/";
  route();
})();
