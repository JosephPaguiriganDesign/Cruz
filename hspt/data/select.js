// Picks practice, focus, and mock questions.
// Never-seen items come first. When a section's unseen pool is actually empty,
// the oldest seen items come back, with missed ones ahead of correct ones.
// Seen history is not wiped on that new pass.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HSPT_SELECT = api;
})(typeof window !== "undefined" ? window : null, function () {
  var SECTION_ORDER = ["verbal", "quant", "reading", "math", "language"];
  var SECTION_COUNTS = { verbal: 60, quant: 52, reading: 62, math: 64, language: 60 };
  var MOCK_PLAN = {
    verbal: { synonym: 16, antonym: 12, analogy: 14, classification: 8, logic: 10 },
    quant: { series: 16, comparison: 18, "number-sense": 18 },
    reading: { passage: 36, "vocab-context": 26 },
    math: { problem: 52, geometry: 12 },
    language: { spelling: 17, usage: 8, agreement: 8, punctuation: 8, apostrophe: 2, capitalization: 1, composition: 16 }
  };

  function normalize(s) {
    return String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function signature(item) {
    if (!item) return "";
    if (item.word && (item.type === "synonym" || item.type === "antonym" || item.type === "vocab-context")) {
      return item.type + "|" + String(item.word).toLowerCase();
    }
    if (item.type === "spelling") {
      if (item.meta && item.meta.spellMode === "wrong") {
        return "spelling|" + String(item.meta.word).toLowerCase() + "|wrong|" + item.meta.missIndex;
      }
      var correct = (item.meta && item.meta.correct) || (item.choices && item.choices[item.answer]);
      return "spelling|" + String(correct).toLowerCase() + "|correct";
    }
    if (item.type === "series" && item.meta && item.meta.terms) {
      return "series|" + item.meta.terms.join(",") + "|" + item.meta.next;
    }
    var answerText = item.choices && item.answer != null ? item.choices[item.answer] : "";
    var choiceKey = (item.choices || []).map(normalize).sort().join("|");
    return item.type + "|" + normalize(item.stem) + "|" + normalize(answerText) + "|" + choiceKey;
  }

  function hash(s) {
    var h = 2166136261;
    var text = String(s);
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul ? Math.imul(h, 16777619) : ((h * 16777619) >>> 0);
      h >>>= 0;
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

  function scaleMix(plan, n) {
    var keys = Object.keys(plan);
    var total = 0;
    keys.forEach(function (k) { total += plan[k]; });
    var rows = keys.map(function (k) {
      return { key: k, exact: total ? (n * plan[k] / total) : 0, n: 0 };
    });
    var used = 0;
    rows.forEach(function (r) {
      r.n = Math.floor(r.exact);
      used += r.n;
    });
    var rem = n - used;
    var order = rows.slice().sort(function (a, b) {
      var fa = a.exact - Math.floor(a.exact);
      var fb = b.exact - Math.floor(b.exact);
      if (fb !== fa) return fb - fa;
      return b.exact - a.exact;
    });
    for (var i = 0; i < order.length && rem > 0; i++) {
      order[i].n += 1;
      rem -= 1;
    }
    var by = {};
    rows.forEach(function (r) { by[r.key] = r.n; });
    return keys.map(function (k) { return { type: k, n: by[k] }; }).filter(function (r) { return r.n > 0; });
  }

  function ensure(state) {
    if (!state.items) state.items = {};
    if (!state.cursors) state.cursors = {};
    if (!state.cycles) state.cycles = {};
    return state;
  }

  function reservedMap(bank) {
    var map = {};
    for (var i = 0; i < bank.length; i++) map[signature(bank[i])] = true;
    return map;
  }

  function materialize(rec, bank, gen) {
    if (!rec) return null;
    for (var i = 0; i < bank.length; i++) {
      if (bank[i].id === rec.id) return bank[i];
    }
    if (gen && gen.parseGenId && gen.make) {
      var parsed = gen.parseGenId(rec.id);
      if (!parsed) return null;
      return gen.make(parsed.type, parsed.seed);
    }
    return null;
  }

  function remember(state, items, now) {
    items.forEach(function (it, idx) {
      var sig = signature(it);
      var prev = state.items[sig];
      state.items[sig] = {
        id: it.id,
        section: it.section,
        type: it.type,
        at: now + idx,
        missed: prev ? !!prev.missed : false
      };
    });
  }

  function bumpCycle(state, section) {
    state.cycles[section] = (state.cycles[section] || 0) + 1;
  }

  function poolOf(bank, section, type) {
    var out = [];
    for (var i = 0; i < bank.length; i++) {
      if (bank[i].section === section && bank[i].type === type) out.push(bank[i]);
    }
    return out;
  }

  function rankSeen(a, b) {
    var am = a.missed ? 0 : 1;
    var bm = b.missed ? 0 : 1;
    if (am !== bm) return am - bm;
    return (a.at || 0) - (b.at || 0);
  }

  function takePassages(state, bank, n, mode, picked, now) {
    var groups = {};
    var order = [];
    bank.forEach(function (it) {
      if (it.section !== "reading" || it.type !== "passage" || !it.passageId) return;
      if (!groups[it.passageId]) {
        groups[it.passageId] = [];
        order.push(it.passageId);
      }
      groups[it.passageId].push(it);
    });
    function unseenCount(pid) {
      var c = 0;
      groups[pid].forEach(function (it) {
        var sig = signature(it);
        if (!state.items[sig] && !picked[sig]) c += 1;
      });
      return c;
    }
    var ranked = order.slice();
    if (mode !== "fresh") {
      ranked.sort(function (a, b) {
        function score(pid) {
          var missed = false;
          var min = Infinity;
          groups[pid].forEach(function (it) {
            var rec = state.items[signature(it)];
            if (!rec) return;
            if (rec.missed) missed = true;
            if ((rec.at || 0) < min) min = rec.at || 0;
          });
          return { missed: missed, min: min === Infinity ? 0 : min };
        }
        var sa = score(a);
        var sb = score(b);
        if (sa.missed !== sb.missed) return sa.missed ? -1 : 1;
        return sa.min - sb.min;
      });
    }
    if (mode === "fresh") {
      var buckets = {};
      ranked.forEach(function (pid) {
        var u = unseenCount(pid);
        var key = String(u);
        if (!buckets[key]) buckets[key] = [];
        buckets[key].push(pid);
      });
      var keys = Object.keys(buckets).map(Number).sort(function (a, b) { return b - a; });
      ranked = [];
      keys.forEach(function (k) {
        if (k <= 0) return;
        ranked = ranked.concat(shuffle(buckets[k], now + ":" + k));
      });
    }
    var out = [];
    ranked.forEach(function (pid) {
      if (out.length >= n) return;
      var fresh = [];
      var used = [];
      groups[pid].forEach(function (it) {
        var sig = signature(it);
        if (picked[sig]) return;
        var rec = state.items[sig];
        if (!rec) fresh.push(it);
        else used.push({ item: it, missed: !!rec.missed, at: rec.at || 0 });
      });
      used.sort(rankSeen);
      var line = mode === "fresh" ? fresh : used.map(function (u) { return u.item; });
      if (mode !== "fresh") {
        // Fresh questions in a partly seen passage still belong to the fresh pass.
        line = fresh.concat(line);
      }
      for (var i = 0; i < line.length && out.length < n; i++) {
        if (mode === "fresh" && state.items[signature(line[i])]) continue;
        if (mode === "recycle" && !state.items[signature(line[i])]) continue;
        var sig = signature(line[i]);
        if (picked[sig]) continue;
        picked[sig] = true;
        out.push(line[i]);
      }
    });
    return out;
  }

  function takeFresh(state, bank, section, type, n, gen, reserved, picked, now) {
    if (n <= 0) return [];
    if (type === "passage") return takePassages(state, bank, n, "fresh", picked, now);
    var out = [];
    var pool = shuffle(poolOf(bank, section, type), type + ":" + now);
    for (var i = 0; i < pool.length && out.length < n; i++) {
      var sig = signature(pool[i]);
      if (state.items[sig] || picked[sig]) continue;
      picked[sig] = true;
      out.push(pool[i]);
    }
    if (out.length >= n || !gen || !gen.can || !gen.can(type)) return out;
    var cursor = state.cursors[type] || 0;
    var stall = 0;
    var guard = 0;
    while (out.length < n && stall < 1200 && guard < 30000) {
      var item = gen.make(type, cursor);
      cursor += 1;
      guard += 1;
      if (!item || item.section !== section || item.type !== type) {
        stall += 1;
        continue;
      }
      var madeSig = signature(item);
      if (state.items[madeSig] || picked[madeSig] || reserved[madeSig]) {
        stall += 1;
        continue;
      }
      stall = 0;
      picked[madeSig] = true;
      out.push(item);
    }
    state.cursors[type] = cursor;
    return out;
  }

  function takeRecycle(state, bank, section, type, n, gen, picked) {
    if (n <= 0) return [];
    if (type === "passage") return takePassages(state, bank, n, "recycle", picked, 0);
    var rows = [];
    Object.keys(state.items).forEach(function (sig) {
      var rec = state.items[sig];
      if (!rec || rec.section !== section || rec.type !== type) return;
      if (picked[sig]) return;
      rows.push({ sig: sig, missed: !!rec.missed, at: rec.at || 0, rec: rec });
    });
    rows.sort(rankSeen);
    var out = [];
    for (var i = 0; i < rows.length && out.length < n; i++) {
      var item = materialize(rows[i].rec, bank, gen);
      if (!item) continue;
      var sig = signature(item);
      if (picked[sig]) continue;
      picked[sig] = true;
      out.push(item);
    }
    return out;
  }

  function takeExact(state, bank, section, type, n, gen, reserved, picked, now) {
    var fresh = takeFresh(state, bank, section, type, n, gen, reserved, picked, now);
    if (fresh.length >= n) return { items: fresh, recycled: false };
    var more = takeRecycle(state, bank, section, type, n - fresh.length, gen, picked);
    return { items: fresh.concat(more), recycled: more.length > 0 };
  }

  function orderItems(items, seed) {
    var groups = {};
    var pids = [];
    var rest = [];
    items.forEach(function (it) {
      if (it.type === "passage" && it.passageId) {
        if (!groups[it.passageId]) {
          groups[it.passageId] = [];
          pids.push(it.passageId);
        }
        groups[it.passageId].push(it);
      } else rest.push(it);
    });
    pids = shuffle(pids, seed + ":p");
    rest = shuffle(rest, seed + ":r");
    var out = [];
    pids.forEach(function (pid) { out = out.concat(groups[pid]); });
    return out.concat(rest);
  }

  function finish(state, section, items, recycled, now, seed) {
    var ordered = orderItems(items, seed);
    remember(state, ordered, now);
    if (recycled) bumpCycle(state, section);
    return ordered;
  }

  function practice(opts) {
    var state = ensure(opts.seen);
    var section = opts.section;
    var plan = MOCK_PLAN[section];
    if (!plan) return { items: [], seen: state };
    var mix = scaleMix(plan, opts.n);
    var reserved = reservedMap(opts.bank);
    var picked = {};
    var items = [];
    var recycled = false;
    mix.forEach(function (row) {
      var got = takeFresh(state, opts.bank, section, row.type, row.n, opts.gen, reserved, picked, opts.now);
      items = items.concat(got);
    });
    if (items.length < opts.n) {
      var types = Object.keys(plan);
      var guard = 0;
      while (items.length < opts.n && guard < opts.n * types.length + 8) {
        var before = items.length;
        for (var t = 0; t < types.length && items.length < opts.n; t++) {
          var more = takeFresh(state, opts.bank, section, types[t], 1, opts.gen, reserved, picked, opts.now);
          if (more.length) items.push(more[0]);
        }
        if (items.length === before) break;
        guard += 1;
      }
    }
    if (items.length < opts.n) {
      var types2 = Object.keys(plan);
      for (var u = 0; u < types2.length && items.length < opts.n; u++) {
        var reused = takeRecycle(state, opts.bank, section, types2[u], opts.n - items.length, opts.gen, picked);
        if (reused.length) recycled = true;
        items = items.concat(reused);
      }
    }
    return {
      items: finish(state, section, items, recycled, opts.now, opts.now + ":" + section),
      seen: state
    };
  }

  function focus(opts) {
    var n = opts.n;
    var verbalN = Math.round(n * 3 / 5);
    var readingN = Math.round(n * 1 / 5);
    var languageN = n - verbalN - readingN;
    var state = ensure(opts.seen);
    var parts = [
      { section: "verbal", n: verbalN },
      { section: "reading", n: readingN },
      { section: "language", n: languageN }
    ];
    var items = [];
    parts.forEach(function (part) {
      if (part.n <= 0) return;
      var sub = practice({
        bank: opts.bank,
        seen: state,
        section: part.section,
        n: part.n,
        now: opts.now,
        gen: opts.gen
      });
      items = items.concat(sub.items);
    });
    return { items: items, seen: state };
  }

  function mock(opts) {
    var state = ensure(opts.seen);
    var reserved = reservedMap(opts.bank);
    var picked = {};
    var items = [];
    var baseNow = opts.now || 1;
    SECTION_ORDER.forEach(function (section, sIdx) {
      var plan = MOCK_PLAN[section];
      var sectionItems = [];
      var recycled = false;
      Object.keys(plan).forEach(function (type) {
        var got = takeExact(state, opts.bank, section, type, plan[type], opts.gen, reserved, picked, baseNow + sIdx);
        if (got.recycled) recycled = true;
        sectionItems = sectionItems.concat(got.items);
      });
      if (sectionItems.length !== SECTION_COUNTS[section]) {
        throw new Error("mock " + section + " has " + sectionItems.length + " of " + SECTION_COUNTS[section]);
      }
      var ordered = finish(state, section, sectionItems, recycled, baseNow + sIdx * 1000, baseNow + ":" + section);
      items = items.concat(ordered);
    });
    return { items: items, seen: state };
  }

  return {
    signature: signature,
    practice: practice,
    focus: focus,
    mock: mock,
    MOCK_PLAN: MOCK_PLAN,
    SECTION_COUNTS: SECTION_COUNTS,
    SECTION_ORDER: SECTION_ORDER,
    scaleMix: scaleMix
  };
});
