/**
 * Gift lists for the Cruz family site.
 * Bound to the private Google Sheet (Extensions → Apps Script).
 * Setup and deploy steps: gifts/README.md
 *
 * Codes live in Script Properties (and a private Codes tab for Joseph).
 * Do not paste codes into the website. Responses never include codes.
 *
 * Kid names must stay in the same order as gifts/config.js.
 * Edits lock at the end of 11 Dec 2026 Pacific (PST, UTC-8).
 */
var KIDS = [
  "Cruz",
  "Kaleo",
  "Sammy",
  "Carlos",
  "Josie",
  "Alberto",
  "Isaiah",
  "Madison",
  "Eli",
  "Wyatt",
  "Emmett"
];

var LOCK_AT = "2026-12-12T00:00:00-08:00";
var CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
var CODE_LENGTH = 6;
var NAME_MAX = 80;
var NOTE_MAX = 140;
var LINK_MAX = 400;
var ITEM_MAX = 40;
var PRIORITIES = { high: "Really want", med: "Would like", low: "Bonus" };

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Gift lists")
    .addItem("Set up codes", "setupCodes")
    .addItem("Reset a code", "resetCodePrompt")
    .addToUi();
}

/** Create any missing codes. Never replaces a code that is already stored. */
function setupCodes() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty("FAMILY_CODE")) props.deleteProperty("FAMILY_CODE");
  var used = usedCodes(props);
  var created = [];
  var i;
  for (i = 0; i < KIDS.length; i++) {
    var editKey = codeKey(KIDS[i]);
    var lookKey = viewKey(KIDS[i]);
    if (!props.getProperty(editKey)) {
      props.setProperty(editKey, uniqueCode(used));
      created.push(KIDS[i] + " edit");
    }
    if (!props.getProperty(lookKey)) {
      props.setProperty(lookKey, uniqueCode(used));
      created.push(KIDS[i] + " view");
    }
  }
  if (!props.getProperty("ADMIN")) {
    props.setProperty("ADMIN", uniqueCode(used));
    created.push("ADMIN");
  }
  writeCodesSheet();
  ensureItemsSheet();
  toast(created.length
    ? "New codes are on the Codes tab. Do not share this spreadsheet."
    : "Existing codes were kept. The Codes tab is up to date.");
  return created;
}

/** Replace one code. resetCode("ADMIN") or resetCode("Cruz", "edit"|"view"). Returns a label, not the code. */
function resetCode(name, kind) {
  var who = canonicalKid(name);
  var which = trim(kind).toLowerCase();
  if (!who) throw new Error("Unknown name. Use a kid's name and edit or view, or ADMIN.");
  var props = PropertiesService.getScriptProperties();
  var key = "";
  var label = who;
  if (who === "ADMIN") {
    key = "ADMIN";
    label = "ADMIN";
  } else if (which === "edit") {
    key = codeKey(who);
    label = who + " edit";
  } else if (which === "view") {
    key = viewKey(who);
    label = who + " view";
  } else {
    throw new Error("Say edit or view, or ADMIN.");
  }
  var used = usedCodes(props);
  var old = cleanCode(props.getProperty(key) || "");
  if (old) delete used[old];
  props.setProperty(key, uniqueCode(used));
  writeCodesSheet();
  toast("The new code is on the Codes tab. The old one no longer works.");
  return label;
}

function resetCodePrompt() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt("Reset a code", "Type a kid's name and edit or view, such as Cruz edit. Or type ADMIN.", ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;
  try {
    var parsed = parseReset(response.getResponseText());
    var label = resetCode(parsed.name, parsed.kind);
    ui.alert("A new code for " + label + " is on the Codes tab. The old code no longer works.");
  } catch (err) {
    ui.alert("Type a kid's name and edit or view, such as Cruz view. Or type ADMIN.");
  }
}

function parseReset(text) {
  var cleaned = trim(text).replace(/\s+/g, " ");
  if (cleaned.toUpperCase() === "ADMIN") return { name: "ADMIN", kind: "" };
  var parts = cleaned.split(" ");
  if (parts.length !== 2) throw new Error("bad reset");
  var a = parts[0].toLowerCase();
  var b = parts[1].toLowerCase();
  if (a === "edit" || a === "view") return { name: parts[1], kind: a };
  if (b === "edit" || b === "view") return { name: parts[0], kind: b };
  throw new Error("bad reset");
}

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var code = params.code || "";
    if (!trim(code)) return json({ ok: false, error: "Enter your code." });
    return json(openByCode(code));
  } catch (err) {
    return json({ ok: false, error: "The list could not be loaded." });
  }
}

function doPost(e) {
  try {
    var body = {};
    try {
      body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    } catch (parseErr) {
      return json({ ok: false, error: "That did not work. Try again." });
    }
    var kid = canonicalKid(body && body.kid);
    if (!kid || kid === "ADMIN" || !kidOk(kid, body && body.code)) {
      return json({ ok: false, error: "That name and code do not match." });
    }
    if (isLocked()) return json({ ok: false, locked: true, error: "Lists locked Dec 11." });
    return json(withLock(function () {
      if (isLocked()) return { ok: false, locked: true, error: "Lists locked Dec 11." };
      return writeItem(kid, body);
    }));
  } catch (err) {
    return json({ ok: false, error: "That did not work. Try again." });
  }
}

function openByCode(code) {
  var hit = findCode(code);
  if (!hit) return { ok: false, error: "That code is not right." };
  var items = readItems();
  var locked = isLocked();
  if (hit.role === "admin") {
    var kids = [];
    var i;
    for (i = 0; i < KIDS.length; i++) {
      kids.push({ name: KIDS[i], items: itemsFor(items, KIDS[i]) });
    }
    return { ok: true, role: "admin", locked: locked, lockAt: LOCK_AT, kids: kids };
  }
  return {
    ok: true,
    role: hit.role,
    locked: locked,
    lockAt: LOCK_AT,
    kid: hit.kid,
    items: itemsFor(items, hit.kid)
  };
}

function findCode(given) {
  var code = cleanCode(given);
  if (!code) return null;
  var props = PropertiesService.getScriptProperties();
  var hits = [];
  var admin = cleanCode(props.getProperty("ADMIN") || "");
  if (admin && sameCode(admin, code)) hits.push({ role: "admin" });
  var i;
  for (i = 0; i < KIDS.length; i++) {
    var view = cleanCode(props.getProperty(viewKey(KIDS[i])) || "");
    var edit = cleanCode(props.getProperty(codeKey(KIDS[i])) || "");
    if (view && sameCode(view, code)) hits.push({ role: "view", kid: KIDS[i] });
    if (edit && sameCode(edit, code)) hits.push({ role: "edit", kid: KIDS[i] });
  }
  if (hits.length !== 1) return null;
  return hits[0];
}

function writeItem(kid, body) {
  var action = trim(body.action);
  var sh = ensureItemsSheet();
  var incoming = body.item || {};
  var id = trim(incoming.id || body.id || "");
  if (action === "remove") {
    var removeRow = findItemRow(sh, id, kid);
    if (!removeRow) return { ok: false, error: "That gift is not on your list." };
    sh.deleteRow(removeRow);
    return { ok: true, locked: false, items: itemsFor(readItems(), kid) };
  }
  var parsed = validateItem(incoming);
  if (!parsed.ok) return { ok: false, error: parsed.errors[0] };
  if (action === "add") {
    if (itemsFor(readItems(), kid).length >= ITEM_MAX) return { ok: false, error: "That list is full." };
    writeRow(sh, sh.getLastRow() + 1, [
      Utilities.getUuid(),
      kid,
      parsed.value.name,
      parsed.value.link,
      parsed.value.note,
      parsed.value.priority,
      new Date().toISOString()
    ]);
    return { ok: true, locked: false, items: itemsFor(readItems(), kid) };
  }
  if (action === "update") {
    var updateRow = findItemRow(sh, id, kid);
    if (!updateRow) return { ok: false, error: "That gift is not on your list." };
    writeRow(sh, updateRow, [
      id,
      kid,
      parsed.value.name,
      parsed.value.link,
      parsed.value.note,
      parsed.value.priority,
      new Date().toISOString()
    ]);
    return { ok: true, locked: false, items: itemsFor(readItems(), kid) };
  }
  return { ok: false, error: "That did not work. Try again." };
}

function withLock(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) return { ok: false, error: "Someone else is saving. Try again." };
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function kidOk(kid, given) {
  var expected = cleanCode(PropertiesService.getScriptProperties().getProperty(codeKey(kid)) || "");
  var code = cleanCode(given);
  if (!expected || !code) return false;
  return sameCode(expected, code);
}

function itemsFor(items, kid) {
  var out = [];
  var i;
  for (i = 0; i < items.length; i++) {
    if (items[i].kid !== kid) continue;
    out.push({
      id: items[i].id,
      name: items[i].name,
      link: items[i].link,
      note: items[i].note,
      priority: items[i].priority
    });
  }
  return out;
}

function readItems() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Items");
  if (!sh || sh.getLastRow() < 2) return [];
  var values = sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues();
  var out = [];
  var i;
  for (i = 0; i < values.length; i++) {
    var id = cellString(values[i][0]);
    var kid = cellString(values[i][1]);
    var name = cellString(values[i][2]);
    var link = cellString(values[i][3]);
    var note = cellString(values[i][4]);
    var priority = cellString(values[i][5]);
    if (!id || !kid || !name || !PRIORITIES[priority]) continue;
    if (link && !isHttpUrl(link)) link = "";
    out.push({ id: id, kid: kid, name: name, link: link, note: note, priority: priority });
  }
  return out;
}

function findItemRow(sh, id, kid) {
  if (!id || !/^[A-Za-z0-9_-]{1,80}$/.test(id)) return 0;
  var values = sh.getDataRange().getValues();
  var i;
  for (i = 1; i < values.length; i++) {
    if (cellString(values[i][0]) === id && cellString(values[i][1]) === kid) return i + 1;
  }
  return 0;
}

function writeRow(sh, row, values) {
  var safe = [];
  var i;
  for (i = 0; i < values.length; i++) safe.push(asSheetText(values[i]));
  sh.getRange(row, 1, 1, safe.length).setNumberFormat("@").setValues([safe]);
}

function ensureItemsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Open this script from the gift list spreadsheet.");
  var sh = ss.getSheetByName("Items");
  if (!sh) {
    var first = ss.getSheets()[0];
    if (first && first.getName() === "Sheet1" && first.getLastRow() === 0) sh = first.setName("Items");
    else sh = ss.insertSheet("Items");
  }
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, 7).setValues([["id", "kid", "name", "link", "note", "priority", "updatedAt"]]);
  }
  sh.setFrozenRows(1);
  sh.getRange("A:G").setNumberFormat("@");
  return sh;
}

function writeCodesSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("Open this script from the gift list spreadsheet.");
  var props = PropertiesService.getScriptProperties();
  var sh = ss.getSheetByName("Codes");
  if (!sh) sh = ss.insertSheet("Codes");
  var rows = [["ADMIN", "", props.getProperty("ADMIN") || ""]];
  var i;
  for (i = 0; i < KIDS.length; i++) {
    rows.push([
      KIDS[i],
      props.getProperty(codeKey(KIDS[i])) || "",
      props.getProperty(viewKey(KIDS[i])) || ""
    ]);
  }
  sh.clear();
  sh.getRange(1, 1, 1, 3).setValues([["kid", "edit code", "view code"]]);
  sh.getRange(2, 1, rows.length, 3).setValues(rows);
  sh.getRange(1, 4).setValue("Private copy for Joseph. Do not share this spreadsheet. The website reads Script Properties, not this tab.");
  sh.setFrozenRows(1);
  sh.getRange(1, 1, rows.length + 1, 3).setNumberFormat("@");
  sh.setColumnWidth(1, 160);
  sh.setColumnWidth(2, 140);
  sh.setColumnWidth(3, 140);
}

function codeKey(name) {
  return "CODE_" + name;
}

function viewKey(name) {
  return "VIEW_" + name;
}

function usedCodes(props) {
  var used = {};
  function keep(value) {
    var code = cleanCode(value || "");
    if (code) used[code] = true;
  }
  keep(props.getProperty("ADMIN"));
  var i;
  for (i = 0; i < KIDS.length; i++) {
    keep(props.getProperty(codeKey(KIDS[i])));
    keep(props.getProperty(viewKey(KIDS[i])));
  }
  return used;
}

function uniqueCode(used) {
  var code = "";
  var guard = 0;
  do {
    code = randomCode();
    guard++;
  } while (used[code] && guard < 30);
  if (used[code]) throw new Error("Could not make a unique code.");
  used[code] = true;
  return code;
}

function canonicalKid(name) {
  var want = trim(name);
  if (want.toUpperCase() === "ADMIN") return "ADMIN";
  var i;
  for (i = 0; i < KIDS.length; i++) {
    if (KIDS[i].toLowerCase() === want.toLowerCase()) return KIDS[i];
  }
  return "";
}

function randomCode() {
  var raw = Utilities.computeHmacSha256Signature(Utilities.getUuid(), Utilities.getUuid());
  var out = "";
  var i = 0;
  while (out.length < CODE_LENGTH && i < raw.length) {
    var b = raw[i];
    if (b < 0) b += 256;
    out += CODE_ALPHABET.charAt(b % CODE_ALPHABET.length);
    i++;
  }
  while (out.length < CODE_LENGTH) {
    out += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
  }
  return out;
}

function lockInstant() {
  var parsed = Date.parse(LOCK_AT);
  if (!isNaN(parsed)) return parsed;
  return Date.UTC(2026, 11, 12, 8, 0, 0);
}

function isLocked() {
  return Date.now() >= lockInstant();
}

function validateItem(input) {
  var name = trim(input && input.name);
  var note = trim(input && input.note);
  var link = trim(input && input.link);
  var priority = input && input.priority;
  var errors = [];
  if (!name) errors.push("Add a name.");
  else if (name.length > NAME_MAX) errors.push("That name is too long.");
  else if (hasControl(name) || /[<>]/.test(name)) errors.push("That name has a character we can't use.");
  if (note.length > NOTE_MAX) errors.push("That note is too long.");
  else if (hasControl(note) || /[<>]/.test(note)) errors.push("That note has a character we can't use.");
  if (link) {
    if (link.length > LINK_MAX) errors.push("That link is too long.");
    else if (!isHttpUrl(link)) errors.push("Use a link that starts with http:// or https://.");
  }
  if (!PRIORITIES[priority]) errors.push("Pick how much you want it.");
  if (errors.length) return { ok: false, errors: errors, value: null };
  return { ok: true, errors: [], value: { name: name, link: link, note: note, priority: priority } };
}

function isHttpUrl(value) {
  if (!value || value.length > LINK_MAX) return false;
  if (/[\s<>]/.test(value)) return false;
  var match = /^https?:\/\/([^\/?#\s]+)([\/?#][^\s]*)?$/i.exec(value);
  if (!match) return false;
  if (match[1].indexOf("@") >= 0) return false;
  var host = match[1].toLowerCase().split(":")[0];
  if (host !== "localhost" && host.indexOf(".") < 0) return false;
  return true;
}

function sameCode(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  var diff = 0;
  var i;
  for (i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function asSheetText(value) {
  var text = String(value == null ? "" : value);
  if (/^[=+\-@]/.test(text)) return "'" + text;
  return text;
}

function cellString(value) {
  if (Object.prototype.toString.call(value) === "[object Date]") {
    if (isNaN(value.getTime())) return "";
    return value.toISOString();
  }
  return trim(value);
}

function cleanCode(value) {
  return trim(value).toUpperCase();
}

function trim(value) {
  return String(value == null ? "" : value).replace(/^\s+|\s+$/g, "");
}

function hasControl(value) {
  return /[\u0000-\u001F\u007F]/.test(value);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function toast(message) {
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(message, "Gift lists", 10);
  } catch (err) { /* editor run still wrote the sheet */ }
}
