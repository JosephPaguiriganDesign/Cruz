// Picks practice, focus, unit-test, and final questions.
// Unseen curated items come first, then unseen generated items.
// When that pool is empty, the oldest seen items return, misses first.
// Seen history is not wiped on the new pass.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CHEM_SELECT = api;
})(typeof window !== "undefined" ? window : null, function () {
  function normalize(s) {
    return String(s || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function signature(item) {
    if (!item) return "";
    if (item.sig) return item.sig;
    var answerText = item.choices && item.answer != null ? item.choices[item.answer] : "";
    var choiceKey = (item.choices || []).map(normalize).sort().join("|");
    return (item.topic || "") + "|" + (item.type || "") + "|" + normalize(item.stem) + "|" + normalize(answerText) + "|" + choiceKey;
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
        topic: it.topic,
        type: it.type,
        at: now + idx,
        missed: prev ? !!prev.missed : false
      };
    });
  }

  function poolOf(bank, topic, type) {
    var out = [];
    for (var i = 0; i < bank.length; i++) {
      if (bank[i].topic === topic && (!type || bank[i].type === type)) out.push(bank[i]);
    }
    return out;
  }

  function rankSeen(a, b) {
    var am = a.missed ? 0 : 1;
    var bm = b.missed ? 0 : 1;
    if (am !== bm) return am - bm;
    return (a.at || 0) - (b.at || 0);
  }

  function typesFor(topic, bank, gen) {
    var seen = {};
    var list = [];
    bank.forEach(function (item) {
      if (item.topic !== topic || seen[item.type]) return;
      seen[item.type] = true;
      list.push(item.type);
    });
    if (gen && gen.typesForTopic) {
      gen.typesForTopic(topic).forEach(function (type) {
        if (seen[type]) return;
        seen[type] = true;
        list.push(type);
      });
    }
    if (!list.length) list.push(topic);
    return list;
  }

  function scaleMix(types, n) {
    if (!types.length || n <= 0) return [];
    var base = Math.floor(n / types.length);
    var rem = n - base * types.length;
    return types.map(function (type, idx) {
      return { type: type, n: base + (idx < rem ? 1 : 0) };
    }).filter(function (row) { return row.n > 0; });
  }

  function takeFresh(state, bank, topic, type, n, gen, reserved, picked, now) {
    if (n <= 0) return [];
    var out = [];
    var pool = shuffle(poolOf(bank, topic, type), type + ":" + topic + ":" + now);
    for (var i = 0; i < pool.length && out.length < n; i++) {
      var sig = signature(pool[i]);
      if (state.items[sig] || picked[sig]) continue;
      picked[sig] = true;
      out.push(pool[i]);
    }
    if (out.length >= n || !gen || !gen.can || !gen.can(type)) return out;
    var cursorKey = topic + ":" + type;
    var cursor = state.cursors[cursorKey] || 0;
    var stall = 0;
    var guard = 0;
    while (out.length < n && stall < 800 && guard < 8000) {
      var item = gen.make(type, cursor);
      cursor += 1;
      guard += 1;
      if (!item || item.topic !== topic || item.type !== type) {
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
    state.cursors[cursorKey] = cursor;
    return out;
  }

  function takeRecycle(state, bank, topic, type, n, gen, picked) {
    if (n <= 0) return [];
    var rows = [];
    Object.keys(state.items).forEach(function (sig) {
      var rec = state.items[sig];
      if (!rec || rec.topic !== topic || rec.type !== type) return;
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

  function fillTopic(state, bank, topic, n, gen, reserved, picked, now) {
    var types = typesFor(topic, bank, gen);
    var mix = scaleMix(types, n);
    var items = [];
    var recycled = false;
    mix.forEach(function (row) {
      items = items.concat(takeFresh(state, bank, topic, row.type, row.n, gen, reserved, picked, now));
    });
    if (items.length < n) {
      var guard = 0;
      while (items.length < n && guard < n * types.length + 8) {
        var before = items.length;
        for (var t = 0; t < types.length && items.length < n; t++) {
          var more = takeFresh(state, bank, topic, types[t], 1, gen, reserved, picked, now);
          if (more.length) items.push(more[0]);
        }
        if (items.length === before) break;
        guard += 1;
      }
    }
    if (items.length < n) {
      for (var u = 0; u < types.length && items.length < n; u++) {
        var reused = takeRecycle(state, bank, topic, types[u], n - items.length, gen, picked);
        if (reused.length) recycled = true;
        items = items.concat(reused);
      }
    }
    return { items: items, recycled: recycled };
  }

  function finish(state, topic, items, recycled, now) {
    var ordered = shuffle(items, now + ":" + topic);
    remember(state, ordered, now);
    if (recycled) state.cycles[topic] = (state.cycles[topic] || 0) + 1;
    return ordered;
  }

  function practice(opts) {
    var state = ensure(opts.seen);
    var reserved = reservedMap(opts.bank);
    var picked = {};
    var got = fillTopic(state, opts.bank, opts.topic, opts.n, opts.gen, reserved, picked, opts.now);
    return {
      items: finish(state, opts.topic, got.items, got.recycled, opts.now),
      seen: state
    };
  }

  function focus(opts) {
    var state = ensure(opts.seen);
    var picked = {};
    var missed = [];
    Object.keys(state.items).forEach(function (sig) {
      var rec = state.items[sig];
      if (!rec || !rec.missed || picked[sig]) return;
      missed.push({ sig: sig, missed: true, at: rec.at || 0, rec: rec });
    });
    missed.sort(rankSeen);
    var items = [];
    for (var i = 0; i < missed.length && items.length < opts.n; i++) {
      var item = materialize(missed[i].rec, opts.bank, opts.gen);
      if (!item) continue;
      var sig = signature(item);
      if (picked[sig]) continue;
      picked[sig] = true;
      items.push(item);
    }
    if (items.length < opts.n) {
      var topics = [];
      var seenTopic = {};
      opts.bank.forEach(function (row) {
        if (seenTopic[row.topic]) return;
        seenTopic[row.topic] = true;
        topics.push(row.topic);
      });
      var reserved = reservedMap(opts.bank);
      var guard = 0;
      while (items.length < opts.n && topics.length && guard < opts.n + 4) {
        var before = items.length;
        for (var t = 0; t < topics.length && items.length < opts.n; t++) {
          var more = fillTopic(state, opts.bank, topics[t], 1, opts.gen, reserved, picked, opts.now + guard);
          items = items.concat(more.items);
        }
        if (items.length === before) break;
        guard += 1;
      }
    }
    remember(state, items, opts.now);
    return { items: items.slice(0, opts.n), seen: state };
  }

  function across(opts, topics, per) {
    var state = ensure(opts.seen);
    var reserved = reservedMap(opts.bank);
    var picked = {};
    var items = [];
    var recycled = false;
    topics.forEach(function (topic, idx) {
      var n = per[idx];
      var got = fillTopic(state, opts.bank, topic, n, opts.gen, reserved, picked, opts.now + idx);
      if (got.recycled) recycled = true;
      var ordered = shuffle(got.items, opts.now + ":" + topic);
      items = items.concat(ordered);
    });
    remember(state, items, opts.now);
    if (recycled) state.cycles.exam = (state.cycles.exam || 0) + 1;
    return { items: items, seen: state };
  }

  function unit(opts) {
    var counts = scaleMix(opts.topics, opts.n).map(function (row) { return row.n; });
    return across(opts, opts.topics, counts);
  }

  function finalExam(opts) {
    var counts = opts.topics.map(function () { return opts.per; });
    return across(opts, opts.topics, counts);
  }

  return {
    signature: signature,
    practice: practice,
    focus: focus,
    unit: unit,
    finalExam: finalExam,
    scaleMix: scaleMix
  };
});
