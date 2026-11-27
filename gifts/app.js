/* Gift lists. Settings live in config.js. Codes are never in this file.
   Edits lock at the end of 14 Dec 2026 Pacific: 2026-12-15T00:00:00-08:00. */
(function (root) {
  "use strict";

  var LOCK_AT = "2026-12-15T00:00:00-08:00";
  var PRIORITIES = { high: "Really want", med: "Would like", low: "Bonus" };
  var LIMITS = { name: 80, note: 140, link: 400, items: 40 };
  var SESSION_KEY = "gifts-session-v1";
  var DEMO_KEY = "gifts-demo-v1";

  function trim(value) {
    return String(value == null ? "" : value).replace(/^\s+|\s+$/g, "");
  }

  function lockInstant() {
    var parsed = Date.parse(LOCK_AT);
    if (!isNaN(parsed)) return parsed;
    return Date.UTC(2026, 11, 15, 8, 0, 0);
  }

  function isLocked(nowMs) {
    return nowMs >= lockInstant();
  }

  function unitName(n, one, many) {
    return n === 1 ? one : many;
  }

  function countdownParts(nowMs) {
    var diff = lockInstant() - nowMs;
    if (diff <= 0) return null;
    var total = Math.floor(diff / 1000);
    var days = Math.floor(total / 86400);
    var hours = Math.floor((total % 86400) / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var seconds = total % 60;
    if (days > 0) {
      return [
        { num: String(days), unit: unitName(days, "day", "days") },
        { num: String(hours), unit: unitName(hours, "hour", "hours") },
        { num: String(minutes), unit: unitName(minutes, "minute", "minutes") }
      ];
    }
    if (hours > 0) {
      return [
        { num: String(hours), unit: unitName(hours, "hour", "hours") },
        { num: String(minutes), unit: unitName(minutes, "minute", "minutes") },
        { num: String(seconds), unit: unitName(seconds, "second", "seconds") }
      ];
    }
    return [
      { num: String(minutes), unit: unitName(minutes, "minute", "minutes") },
      { num: String(seconds), unit: unitName(seconds, "second", "seconds") }
    ];
  }

  function priorityLabel(value) {
    return Object.prototype.hasOwnProperty.call(PRIORITIES, value) ? PRIORITIES[value] : "";
  }

  function itemCountText(n) {
    n = n | 0;
    return n === 1 ? "1 item" : n + " items";
  }

  function hasControl(value) {
    return /[\u0000-\u001F\u007F]/.test(value);
  }

  function isHttpUrl(value) {
    if (!value || value.length > LIMITS.link) return false;
    if (/[\s<>]/.test(value)) return false;
    var match = /^https?:\/\/([^\/?#\s]+)([\/?#][^\s]*)?$/i.exec(value);
    if (!match) return false;
    if (match[1].indexOf("@") >= 0) return false;
    var host = match[1].toLowerCase().split(":")[0];
    if (host !== "localhost" && host.indexOf(".") < 0) return false;
    return true;
  }

  function validateItem(input) {
    var name = trim(input && input.name);
    var note = trim(input && input.note);
    var link = trim(input && input.link);
    var priority = input && input.priority;
    var errors = [];
    if (!name) errors.push("Add a name.");
    else if (name.length > LIMITS.name) errors.push("That name is too long.");
    else if (hasControl(name) || /[<>]/.test(name)) errors.push("That name has a character we can't use.");
    if (note.length > LIMITS.note) errors.push("That note is too long.");
    else if (hasControl(note) || /[<>]/.test(note)) errors.push("That note has a character we can't use.");
    if (link) {
      if (link.length > LIMITS.link) errors.push("That link is too long.");
      else if (!isHttpUrl(link)) errors.push("Use a link that starts with http:// or https://.");
    }
    if (!priorityLabel(priority)) errors.push("Pick how much you want it.");
    if (errors.length) return { ok: false, errors: errors, value: null };
    return { ok: true, errors: [], value: { name: name, link: link, note: note, priority: priority } };
  }

  var api = {
    LOCK_AT: LOCK_AT,
    LIMITS: LIMITS,
    PRIORITIES: PRIORITIES,
    SESSION_KEY: SESSION_KEY,
    DEMO_KEY: DEMO_KEY,
    lockInstant: lockInstant,
    isLocked: isLocked,
    countdownParts: countdownParts,
    priorityLabel: priorityLabel,
    itemCountText: itemCountText,
    isHttpUrl: isHttpUrl,
    validateItem: validateItem
  };

  root.GiftsList = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  if (typeof document === "undefined") return;

  var SAMPLE_ITEMS = [
    { id: "sample-cruz-1", kid: "Cruz", name: "Soccer ball", link: "https://example.com/soccer-ball", note: "Size 4", priority: "high" },
    { id: "sample-cruz-2", kid: "Cruz", name: "Sketchbook", link: "", note: "Big pages", priority: "med" },
    { id: "sample-kaleo-1", kid: "Kaleo", name: "Headphones", link: "https://example.com/headphones", note: "Over-ear", priority: "high" },
    { id: "sample-sammy-1", kid: "Sammy", name: "Chapter book", link: "", note: "", priority: "low" },
    { id: "sample-josie-1", kid: "Josie", name: "Watercolor set", link: "", note: "With a brush", priority: "med" }
  ];

  var session = blankSession();
  var serverLocked = false;
  var renderDepth = 0;
  var renderToken = 0;
  var lastCountdown = "";
  var demoStamp = "";
  var busy = false;

  function config() {
    if (typeof GIFTS_CONFIG !== "undefined" && GIFTS_CONFIG) return GIFTS_CONFIG;
    return { scriptUrl: "", kids: [] };
  }

  function scriptUrl() {
    return trim(config().scriptUrl);
  }

  function kidNames() {
    var kids = config().kids || [];
    var out = [];
    for (var i = 0; i < kids.length; i++) {
      var name = trim(kids[i]);
      if (name) out.push(name);
    }
    return out;
  }

  function blankSession() {
    return { demo: false, role: "", familyCode: "", kid: "", editCode: "", previewLocked: false };
  }

  function loadSession() {
    var next = blankSession();
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return next;
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object") return next;
      next.demo = data.demo === true;
      next.role = data.role === "adult" || data.role === "kid" ? data.role : "";
      next.familyCode = typeof data.familyCode === "string" ? data.familyCode : "";
      next.kid = typeof data.kid === "string" ? data.kid : "";
      next.editCode = typeof data.editCode === "string" ? data.editCode : "";
      next.previewLocked = data.previewLocked === true;
    } catch (err) { /* private mode */ }
    return next;
  }

  function saveSession() {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (err) { /* private mode */ }
  }

  function isDemo() {
    return !scriptUrl() && session.demo === true;
  }

  function viewLocked() {
    return isLocked(Date.now()) || serverLocked || (isDemo() && session.previewLocked === true);
  }

  function currentRole() {
    if (!scriptUrl() && !session.demo) return "";
    return session.role;
  }

  function cloneSample() {
    return SAMPLE_ITEMS.map(function (item) {
      return { id: item.id, kid: item.kid, name: item.name, link: item.link, note: item.note, priority: item.priority };
    });
  }

  function demoItems() {
    try {
      var raw = sessionStorage.getItem(DEMO_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && Array.isArray(data.items)) return data.items;
      }
    } catch (err) { /* start fresh */ }
    var items = cloneSample();
    saveDemo(items);
    return items;
  }

  function saveDemo(items) {
    try { sessionStorage.setItem(DEMO_KEY, JSON.stringify({ items: items })); } catch (err) { /* private mode */ }
  }

  function presentItem(raw) {
    if (!raw) return null;
    var name = trim(raw.name);
    var priority = raw.priority;
    if (!name || !priorityLabel(priority)) return null;
    var link = trim(raw.link);
    if (link && !isHttpUrl(link)) link = "";
    return {
      id: trim(raw.id),
      name: name,
      link: link,
      note: trim(raw.note),
      priority: priority
    };
  }

  function itemsFor(list, kid) {
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].kid !== kid) continue;
      var item = presentItem(list[i]);
      if (item) out.push(item);
    }
    return out;
  }

  function groupLists(serverKids) {
    var names = kidNames();
    var byName = {};
    var extra = [];
    (serverKids || []).forEach(function (kid) {
      var name = trim(kid && kid.name);
      if (!name) return;
      var items = [];
      (kid.items || []).forEach(function (raw) {
        var item = presentItem(raw);
        if (item) items.push(item);
      });
      if (names.indexOf(name) < 0) extra.push({ name: name, items: items });
      else byName[name] = items;
    });
    var sections = names.map(function (name) {
      return { name: name, items: byName[name] || [] };
    });
    return sections.concat(extra);
  }

  function routeName() {
    var raw = (location.hash || "").replace(/^#/, "");
    var path = raw.split("?")[0];
    if (path.charAt(0) === "/") path = path.slice(1);
    var parts = path.split("/").filter(Boolean);
    var name = parts[0] || "";
    if (name === "all") return { name: "all" };
    if (name === "mine") return { name: "mine" };
    if (name === "edit") return { name: "edit", id: parts[1] ? decodeURIComponent(parts[1]) : "" };
    return { name: "signin" };
  }

  function go(hash) {
    if (location.hash !== hash) location.hash = hash;
    else render();
  }

  function el(tag, props, kids) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        var value = props[key];
        if (value == null || value === false) return;
        if (key === "class") node.className = String(value);
        else if (key === "text") node.textContent = String(value);
        else if (key === "hidden") node.hidden = true;
        else node.setAttribute(key, String(value));
      });
    }
    (kids || []).forEach(function (kid) {
      if (kid == null || kid === false) return;
      if (typeof kid === "string") node.appendChild(document.createTextNode(kid));
      else node.appendChild(kid);
    });
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function setStatus(message, kind) {
    var node = document.getElementById("gifts-status");
    if (!node) return;
    node.textContent = message || "";
    node.classList.toggle("is-saving", kind === "saving");
    node.classList.toggle("is-error", kind === "error");
    if (message && kind === "error") {
      try { node.scrollIntoView({ block: "nearest" }); }
      catch (err) { node.scrollIntoView(); }
    }
  }

  function errorText(data) {
    if (data && typeof data.error === "string" && data.error && data.error.length < 180) return data.error;
    return "That did not work. Try again.";
  }

  function rememberLock(data) {
    if (!scriptUrl()) return;
    if (data && data.locked) serverLocked = true;
  }

  function fillCountdown(node, parts) {
    clear(node);
    node.appendChild(el("span", { class: "gifts-countdown__label" }, ["Closes December 14"]));
    var bits = [];
    parts.forEach(function (part) {
      var chunk = el("span", { class: "gifts-countdown__chunk" });
      chunk.appendChild(el("span", { class: "gifts-countdown__num" }, [part.num]));
      chunk.appendChild(el("span", { class: "gifts-countdown__unit" }, [part.unit]));
      node.appendChild(chunk);
      bits.push(part.num + " " + part.unit);
    });
    node.setAttribute("aria-label", "Lists close in " + bits.join(", "));
  }

  function syncDemoBanner() {
    var banner = document.getElementById("gifts-demo");
    if (!banner) return;
    if (!isDemo()) {
      banner.hidden = true;
      demoStamp = "";
      clear(banner);
      return;
    }
    banner.hidden = false;
    var stamp = session.previewLocked ? "locked" : "open";
    if (demoStamp === stamp) return;
    demoStamp = stamp;
    clear(banner);
    banner.appendChild(el("p", { class: "gifts-demo__text" }, [
      "This is a sample on this device. Type any code to look around. Nothing is saved for the family."
    ]));
    banner.appendChild(el("button", {
      type: "button",
      class: "gifts-preview-lock"
    }, [session.previewLocked ? "Preview open lists" : "Preview locked lists"]));
    banner.appendChild(el("button", { type: "button", class: "gifts-leave-demo" }, ["Leave sample"]));
  }

  function syncLockControls() {
    var locked = viewLocked();
    var add = document.querySelector(".gifts-add");
    if (add) add.hidden = locked;
    var bars = document.querySelectorAll(".gifts-item__actions");
    for (var i = 0; i < bars.length; i++) bars[i].hidden = locked;
  }

  function applyChrome() {
    var locked = viewLocked();
    document.body.classList.toggle("is-locked", locked);
    document.body.setAttribute("data-configured", scriptUrl() ? "true" : "false");
    document.body.setAttribute("data-demo", isDemo() ? "true" : "false");
    var countdown = document.getElementById("gifts-countdown");
    var note = document.getElementById("gifts-locknote");
    var signout = document.getElementById("gifts-signout");
    if (signout) signout.hidden = !currentRole();
    if (locked) {
      if (countdown) countdown.hidden = true;
      if (note) note.hidden = false;
      lastCountdown = "";
    } else if (countdown && note) {
      note.hidden = true;
      var parts = countdownParts(Date.now());
      countdown.hidden = !parts;
      if (parts) {
        var label = parts.map(function (part) { return part.num + part.unit; }).join("|");
        if (label !== lastCountdown) {
          fillCountdown(countdown, parts);
          lastCountdown = label;
        }
      }
    }
    syncDemoBanner();
    syncLockControls();
  }

  function setView(name) {
    var prev = document.body.getAttribute("data-view");
    document.body.setAttribute("data-view", name);
    var titles = { signin: "Gift lists", all: "All the lists", mine: "My list", edit: "Edit a gift" };
    document.title = (titles[name] || "Gift lists") + " — Cruz";
    return prev !== name;
  }

  function showMain(node, focus) {
    var main = document.getElementById("gifts-main");
    clear(main);
    main.appendChild(node);
    main.removeAttribute("aria-busy");
    if (focus) {
      var heading = main.querySelector("h1");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus();
      }
    }
  }

  function field(id, labelText, opts) {
    var wrap = el("div", { class: "gifts-field" });
    wrap.appendChild(el("label", { for: id }, [labelText]));
    var input = el("input", {
      id: id,
      name: opts.name || id,
      type: opts.type || "text",
      value: opts.value || "",
      maxlength: opts.maxlength ? String(opts.maxlength) : null,
      autocomplete: opts.autocomplete || null,
      inputmode: opts.inputmode || null,
      autocapitalize: opts.autocapitalize || null,
      spellcheck: opts.spellcheck === false ? "false" : null,
      "aria-required": opts.required ? "true" : null
    });
    wrap.appendChild(input);
    return wrap;
  }

  function renderItem(item, withActions) {
    var li = el("li", { class: "gifts-item", "data-priority": item.priority, "data-id": item.id });
    li.appendChild(el("p", { class: "gifts-item__name", text: item.name }));
    var note = el("p", { class: "gifts-item__note", text: item.note || "" });
    if (!item.note) note.hidden = true;
    li.appendChild(note);
    var link = el("a", { class: "gifts-item__link" });
    link.appendChild(document.createTextNode("Open link"));
    link.appendChild(el("span", { class: "gifts-sr" }, [" (opens in a new tab)"]));
    if (item.link) {
      link.setAttribute("href", item.link);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    } else {
      link.hidden = true;
    }
    li.appendChild(link);
    li.appendChild(el("p", { class: "gifts-item__priority", text: priorityLabel(item.priority) }));
    if (withActions) {
      var bar = el("div", { class: "gifts-item__actions" });
      if (viewLocked()) bar.hidden = true;
      bar.appendChild(el("button", { type: "button", class: "gifts-item__edit", "aria-label": "Edit " + item.name }, ["Edit"]));
      bar.appendChild(el("button", { type: "button", class: "gifts-item__remove", "aria-label": "Remove " + item.name }, ["Remove"]));
      li.appendChild(bar);
    }
    return li;
  }

  function kidSection(kid, mine) {
    var section = el("section", { class: "gifts-kid", "data-kid": kid.name });
    section.appendChild(el("h2", { class: "gifts-kid__name", text: kid.name }));
    section.appendChild(el("p", { class: "gifts-kid__count", text: itemCountText(kid.items.length) }));
    if (mine) {
      var add = el("button", { type: "button", class: "gifts-add" }, ["Add something"]);
      if (viewLocked()) add.hidden = true;
      section.appendChild(add);
    }
    var list = el("ul", { class: "gifts-items" });
    kid.items.forEach(function (item) { list.appendChild(renderItem(item, mine)); });
    section.appendChild(list);
    if (!kid.items.length) {
      section.appendChild(el("p", { class: "gifts-empty" }, [mine ? "Nothing here yet. Add the first gift." : "Nothing here yet."]));
    }
    return section;
  }

  function drawSignin() {
    var focus = setView("signin");
    var page = el("div", { class: "gifts-page" });
    page.appendChild(el("h1", { class: "gifts-title" }, ["Gift lists"]));
    page.appendChild(el("p", { class: "gifts-lead" }, [
      "Adults can see every list. Kids can change their own list until December 14."
    ]));
    if (!scriptUrl() && !isDemo()) {
      page.appendChild(el("p", { class: "gifts-setup" }, [
        "The family sheet is not connected yet. You can look at a sample on this device. It is not the real list."
      ]));
      page.appendChild(el("button", { type: "button", class: "gifts-demo-start" }, ["Look at a sample"]));
      showMain(page, focus);
      return;
    }
    page.appendChild(kidGate());
    page.appendChild(adultGate());
    showMain(page, focus);
  }

  function kidGate() {
    var gate = el("section", { class: "gifts-gate", "data-gate": "kid" });
    gate.appendChild(el("h2", null, ["Kids"]));
    gate.appendChild(el("p", { class: "gifts-lead" }, ["Pick your name and type your code."]));
    var form = el("form", { id: "gifts-kid-form" });
    var names = kidNames();
    if (!names.length) {
      form.appendChild(el("p", { class: "gifts-empty" }, ["No names are set yet."]));
    } else {
      var set = el("fieldset", { class: "gifts-kids" });
      set.appendChild(el("legend", null, ["Who are you?"]));
      names.forEach(function (name) {
        var id = "gifts-kid-" + name.toLowerCase();
        var label = el("label", { class: "gifts-choice", for: id });
        label.appendChild(el("input", { id: id, type: "radio", name: "kid", value: name }));
        label.appendChild(document.createTextNode(name));
        set.appendChild(label);
      });
      form.appendChild(set);
    }
    form.appendChild(field("gifts-edit-code", "Your code", {
      name: "code",
      required: true,
      maxlength: 32,
      autocomplete: "off",
      autocapitalize: "characters",
      spellcheck: false
    }));
    form.appendChild(el("button", { type: "submit", class: "gifts-enter" }, ["Open my list"]));
    gate.appendChild(form);
    return gate;
  }

  function adultGate() {
    var gate = el("section", { class: "gifts-gate", "data-gate": "adult" });
    gate.appendChild(el("h2", null, ["Adults"]));
    gate.appendChild(el("p", { class: "gifts-lead" }, ["Enter the family code. You can look, not change."]));
    var form = el("form", { id: "gifts-adult-form" });
    form.appendChild(field("gifts-family-code", "Family code", {
      name: "code",
      required: true,
      maxlength: 32,
      autocomplete: "off",
      autocapitalize: "characters",
      spellcheck: false
    }));
    form.appendChild(el("button", { type: "submit", class: "gifts-enter" }, ["See the lists"]));
    gate.appendChild(form);
    return gate;
  }

  function allPage(serverKids) {
    var page = el("div", { class: "gifts-page gifts-lists" });
    page.appendChild(el("h1", { class: "gifts-title" }, ["Everyone's lists"]));
    page.appendChild(el("p", { class: "gifts-lead" }, [
      viewLocked()
        ? "You can still look. Nothing can be changed."
        : "You can look. Only each kid can change their own list."
    ]));
    var sections = groupLists(serverKids);
    if (!sections.length) page.appendChild(el("p", { class: "gifts-empty" }, ["No lists yet."]));
    sections.forEach(function (kid) { page.appendChild(kidSection(kid, false)); });
    return page;
  }

  function minePage(name, items) {
    var page = el("div", { class: "gifts-page" });
    page.appendChild(el("h1", { class: "gifts-title" }, ["My list"]));
    page.appendChild(el("p", { class: "gifts-lead" }, [
      viewLocked() ? "You can still look. Nothing can be changed." : "Add a gift, or change one, until December 14."
    ]));
    page.appendChild(kidSection({ name: name, items: items }, true));
    return page;
  }

  function editPage(existing) {
    var page = el("form", {
      class: "gifts-form",
      id: "gifts-item-form",
      novalidate: "novalidate",
      "data-id": existing ? existing.id : null
    });
    page.appendChild(el("h1", { class: "gifts-title" }, [existing ? "Change this" : "Add something"]));
    page.appendChild(field("gifts-name", "What do you want?", {
      name: "name",
      required: true,
      maxlength: LIMITS.name,
      value: existing ? existing.name : "",
      autocomplete: "off"
    }));
    page.appendChild(field("gifts-link", "Link (optional)", {
      name: "link",
      type: "url",
      maxlength: LIMITS.link,
      value: existing ? existing.link : "",
      inputmode: "url",
      autocomplete: "off",
      autocapitalize: "off",
      spellcheck: false
    }));
    page.appendChild(field("gifts-note", "Size or note (optional)", {
      name: "note",
      maxlength: LIMITS.note,
      value: existing ? existing.note : "",
      autocomplete: "off"
    }));
    var set = el("fieldset", { id: "gifts-priority" });
    set.appendChild(el("legend", null, ["How much do you want it?"]));
    Object.keys(PRIORITIES).forEach(function (key) {
      var id = "gifts-priority-" + key;
      var label = el("label", { class: "gifts-choice", for: id });
      var input = el("input", { id: id, type: "radio", name: "priority", value: key });
      if (existing && existing.priority === key) input.checked = true;
      label.appendChild(input);
      label.appendChild(document.createTextNode(PRIORITIES[key]));
      set.appendChild(label);
    });
    page.appendChild(set);
    var actions = el("div", { class: "gifts-form__actions" });
    actions.appendChild(el("button", { type: "submit", class: "gifts-save" }, ["Save"]));
    actions.appendChild(el("button", { type: "button", class: "gifts-cancel" }, ["Cancel"]));
    page.appendChild(actions);
    return page;
  }

  function loadingPage(text) {
    var page = el("div", { class: "gifts-page" });
    page.appendChild(el("p", { class: "gifts-loading" }, [text]));
    return page;
  }

  function apiGet(params) {
    var parts = [];
    Object.keys(params).forEach(function (key) {
      parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key] == null ? "" : String(params[key])));
    });
    return fetch(scriptUrl() + "?" + parts.join("&"), {
      method: "GET",
      cache: "no-store",
      credentials: "omit",
      redirect: "follow"
    }).then(readJson);
  }

  function apiPost(body) {
    return fetch(scriptUrl(), {
      method: "POST",
      cache: "no-store",
      credentials: "omit",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body)
    }).then(readJson);
  }

  function readJson(res) {
    return res.text().then(function (text) {
      try { return JSON.parse(text); }
      catch (err) { throw new Error("bad json"); }
    });
  }

  function demoAll() {
    var items = demoItems();
    return {
      ok: true,
      locked: viewLocked(),
      kids: kidNames().map(function (name) {
        return { name: name, items: itemsFor(items, name) };
      })
    };
  }

  function demoMine() {
    return { ok: true, locked: viewLocked(), kid: session.kid, items: itemsFor(demoItems(), session.kid) };
  }

  function drawAll() {
    var token = ++renderToken;
    var focus = setView("all");
    var main = document.getElementById("gifts-main");
    if (main) main.setAttribute("aria-busy", "true");
    showMain(loadingPage("Loading lists…"), false);
    var pending = isDemo() ? Promise.resolve(demoAll()) : apiGet({ action: "lists", code: session.familyCode });
    pending.then(function (data) {
      if (token !== renderToken) return;
      if (!data || !data.ok) {
        session.role = "";
        session.familyCode = "";
        saveSession();
        setStatus(errorText(data), "error");
        go("#/");
        return;
      }
      rememberLock(data);
      applyChrome();
      showMain(allPage(data.kids), focus);
    }, function () {
      if (token !== renderToken) return;
      setStatus("The list could not be reached. Check the connection and try again.", "error");
      showMain(loadingPage("The lists could not be loaded."), focus);
    });
  }

  function drawMine() {
    var token = ++renderToken;
    var focus = setView("mine");
    var main = document.getElementById("gifts-main");
    if (main) main.setAttribute("aria-busy", "true");
    showMain(loadingPage("Loading your list…"), false);
    var pending = isDemo()
      ? Promise.resolve(demoMine())
      : apiGet({ action: "mine", kid: session.kid, code: session.editCode });
    pending.then(function (data) {
      if (token !== renderToken) return;
      if (!data || !data.ok) {
        session.role = "";
        session.kid = "";
        session.editCode = "";
        saveSession();
        setStatus(errorText(data), "error");
        go("#/");
        return;
      }
      rememberLock(data);
      applyChrome();
      var items = [];
      (data.items || []).forEach(function (raw) {
        var item = presentItem(raw);
        if (item) items.push(item);
      });
      showMain(minePage(session.kid, items), focus);
      applyChrome();
    }, function () {
      if (token !== renderToken) return;
      setStatus("The list could not be reached. Check the connection and try again.", "error");
      showMain(loadingPage("Your list could not be loaded."), focus);
    });
  }

  function drawEdit(id) {
    var focus = setView("edit");
    if (!id) {
      showMain(editPage(null), focus);
      return;
    }
    var token = ++renderToken;
    var pending = isDemo()
      ? Promise.resolve(demoMine())
      : apiGet({ action: "mine", kid: session.kid, code: session.editCode });
    pending.then(function (data) {
      if (token !== renderToken) return;
      if (!data || !data.ok) {
        setStatus(errorText(data), "error");
        go("#/mine");
        return;
      }
      rememberLock(data);
      if (viewLocked()) {
        setStatus("Lists locked Dec 14.", "error");
        go("#/mine");
        return;
      }
      var found = null;
      (data.items || []).forEach(function (raw) {
        var item = presentItem(raw);
        if (item && item.id === id) found = item;
      });
      if (!found) {
        setStatus("That gift is not on your list.", "error");
        go("#/mine");
        return;
      }
      showMain(editPage(found), focus);
    }, function () {
      if (token !== renderToken) return;
      setStatus("The list could not be reached. Check the connection and try again.", "error");
      go("#/mine");
    });
  }

  function render() {
    if (renderDepth > 2) return;
    renderDepth += 1;
    try {
      applyChrome();
      var route = routeName();
      var role = currentRole();
      if (!role) {
        if (route.name !== "signin") {
          go("#/");
          return;
        }
        drawSignin();
        return;
      }
      if (role === "adult") {
        if (route.name !== "all") {
          go("#/all");
          return;
        }
        drawAll();
        return;
      }
      if (route.name === "edit") {
        if (viewLocked()) {
          setStatus("Lists locked Dec 14.", "error");
          go("#/mine");
          return;
        }
        drawEdit(route.id || "");
        return;
      }
      if (route.name !== "mine") {
        go("#/mine");
        return;
      }
      drawMine();
    } finally {
      renderDepth -= 1;
    }
  }

  function setBusy(form, on) {
    busy = on;
    var buttons = form.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) buttons[i].disabled = on;
  }

  function markInvalid(form, result) {
    var inputs = form.querySelectorAll("input, fieldset");
    for (var i = 0; i < inputs.length; i++) inputs[i].removeAttribute("aria-invalid");
    var message = result.errors[0] || "";
    if (message.indexOf("name") >= 0) {
      var name = form.querySelector("#gifts-name");
      if (name) name.setAttribute("aria-invalid", "true");
    } else if (message.indexOf("note") >= 0) {
      var note = form.querySelector("#gifts-note");
      if (note) note.setAttribute("aria-invalid", "true");
    } else if (message.indexOf("link") >= 0) {
      var link = form.querySelector("#gifts-link");
      if (link) link.setAttribute("aria-invalid", "true");
    } else if (message.indexOf("much") >= 0) {
      var set = form.querySelector("#gifts-priority");
      if (set) set.setAttribute("aria-invalid", "true");
    }
  }

  function submitAdult(form) {
    var code = trim(form.querySelector("#gifts-family-code").value);
    if (!code) {
      setStatus("Enter the family code.", "error");
      return;
    }
    session.role = "adult";
    session.familyCode = isDemo() ? "" : code;
    session.kid = "";
    session.editCode = "";
    saveSession();
    setStatus("");
    go("#/all");
  }

  function submitKid(form) {
    var selected = form.querySelector("input[name=kid]:checked");
    var code = trim(form.querySelector("#gifts-edit-code").value);
    if (!selected) {
      setStatus("Pick your name.", "error");
      return;
    }
    if (!code) {
      setStatus("Enter your code.", "error");
      return;
    }
    session.role = "kid";
    session.kid = selected.value;
    session.editCode = isDemo() ? "" : code;
    session.familyCode = "";
    saveSession();
    setStatus("");
    go("#/mine");
  }

  function newDemoId() {
    return "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function writeDemo(action, item) {
    var items = demoItems();
    if (viewLocked()) return { ok: false, locked: true, error: "Lists locked Dec 14." };
    if (action === "add") {
      if (itemsFor(items, session.kid).length >= LIMITS.items) return { ok: false, error: "That list is full." };
      items.push({
        id: newDemoId(),
        kid: session.kid,
        name: item.name,
        link: item.link,
        note: item.note,
        priority: item.priority
      });
    } else if (action === "update" || action === "remove") {
      var index = -1;
      for (var i = 0; i < items.length; i++) {
        if (items[i].id === item.id && items[i].kid === session.kid) index = i;
      }
      if (index < 0) return { ok: false, error: "That gift is not on your list." };
      if (action === "remove") items.splice(index, 1);
      else {
        items[index].name = item.name;
        items[index].link = item.link;
        items[index].note = item.note;
        items[index].priority = item.priority;
      }
    } else {
      return { ok: false, error: "That did not work. Try again." };
    }
    saveDemo(items);
    return { ok: true, locked: false, items: itemsFor(items, session.kid) };
  }

  function submitItem(form) {
    if (busy) return;
    if (viewLocked()) {
      setStatus("Lists locked Dec 14.", "error");
      return;
    }
    var picked = form.querySelector("input[name=priority]:checked");
    var result = validateItem({
      name: form.querySelector("#gifts-name").value,
      link: form.querySelector("#gifts-link").value,
      note: form.querySelector("#gifts-note").value,
      priority: picked ? picked.value : ""
    });
    if (!result.ok) {
      markInvalid(form, result);
      setStatus(result.errors[0], "error");
      return;
    }
    var id = form.getAttribute("data-id") || "";
    var action = id ? "update" : "add";
    var payload = {
      id: id,
      name: result.value.name,
      link: result.value.link,
      note: result.value.note,
      priority: result.value.priority
    };
    setBusy(form, true);
    setStatus("Saving…", "saving");
    var pending = isDemo() ? Promise.resolve(writeDemo(action, payload)) : apiPost({
      action: action,
      kid: session.kid,
      code: session.editCode,
      item: payload
    });
    pending.then(function (data) {
      setBusy(form, false);
      if (data && data.locked) {
        serverLocked = true;
        applyChrome();
      }
      if (!data || !data.ok) {
        setStatus(errorText(data), "error");
        return;
      }
      setStatus("Saved.");
      go("#/mine");
    }, function () {
      setBusy(form, false);
      setStatus("The list could not be reached. Check the connection and try again.", "error");
    });
  }

  function removeById(id, name) {
    if (!id || viewLocked()) {
      if (viewLocked()) setStatus("Lists locked Dec 14.", "error");
      return;
    }
    if (!window.confirm("Remove " + name + " from your list?")) return;
    setStatus("Saving…", "saving");
    var pending = isDemo()
      ? Promise.resolve(writeDemo("remove", { id: id }))
      : apiPost({ action: "remove", kid: session.kid, code: session.editCode, item: { id: id } });
    pending.then(function (data) {
      if (data && data.locked) {
        serverLocked = true;
        applyChrome();
      }
      if (!data || !data.ok) {
        setStatus(errorText(data), "error");
        return;
      }
      setStatus("Removed.");
      drawMine();
    }, function () {
      setStatus("The list could not be reached. Check the connection and try again.", "error");
    });
  }

  function signOut() {
    var demo = isDemo();
    var preview = session.previewLocked;
    session = blankSession();
    session.demo = demo;
    session.previewLocked = demo ? preview : false;
    saveSession();
    setStatus("");
    go("#/");
  }

  function leaveDemo() {
    session = blankSession();
    saveSession();
    try { sessionStorage.removeItem(DEMO_KEY); } catch (err) { /* private mode */ }
    demoStamp = "";
    setStatus("");
    go("#/");
  }

  function onClick(event) {
    var btn = event.target.closest ? event.target.closest("button") : null;
    if (!btn) return;
    if (btn.classList.contains("gifts-demo-start")) {
      session.demo = true;
      saveSession();
      setStatus("");
      render();
      return;
    }
    if (btn.classList.contains("gifts-leave-demo")) {
      leaveDemo();
      return;
    }
    if (btn.classList.contains("gifts-preview-lock")) {
      session.previewLocked = !session.previewLocked;
      saveSession();
      demoStamp = "";
      if (session.previewLocked && routeName().name === "edit") {
        go("#/mine");
        return;
      }
      render();
      return;
    }
    if (btn.classList.contains("gifts-signout")) {
      signOut();
      return;
    }
    if (btn.classList.contains("gifts-add")) {
      setStatus("");
      go("#/edit");
      return;
    }
    if (btn.classList.contains("gifts-cancel")) {
      setStatus("");
      go("#/mine");
      return;
    }
    if (btn.classList.contains("gifts-item__edit")) {
      var editItem = btn.closest(".gifts-item");
      if (!editItem) return;
      go("#/edit/" + encodeURIComponent(editItem.getAttribute("data-id") || ""));
      return;
    }
    if (btn.classList.contains("gifts-item__remove")) {
      var row = btn.closest(".gifts-item");
      if (!row) return;
      var label = row.querySelector(".gifts-item__name");
      removeById(row.getAttribute("data-id") || "", label ? label.textContent : "this gift");
    }
  }

  function onSubmit(event) {
    var form = event.target;
    if (!form || !form.tagName || form.tagName !== "FORM") return;
    event.preventDefault();
    if (form.id === "gifts-adult-form") submitAdult(form);
    else if (form.id === "gifts-kid-form") submitKid(form);
    else if (form.classList.contains("gifts-form")) submitItem(form);
  }

  function start() {
    session = loadSession();
    if (scriptUrl() && session.demo) {
      session = blankSession();
      saveSession();
    }
    if (!scriptUrl() && !session.demo && session.role) {
      session = blankSession();
      saveSession();
    }
    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    window.addEventListener("hashchange", render);
    applyChrome();
    render();
    setInterval(applyChrome, 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(typeof globalThis !== "undefined" ? globalThis : this);
