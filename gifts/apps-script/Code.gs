/**
 * Gift lists for the Cruz family site.
 * Bound to the private Google Sheet (Extensions → Apps Script).
 * Setup and deploy steps: gifts/README.md
 *
 * Codes live in Script Properties (and a private Codes tab for Joseph).
 * Do not paste codes into the website. Responses never include codes.
 *
 * Kid names must stay in the same order as gifts/config.js.
 * Edits lock at the end of 14 Dec 2026 Pacific (PST, UTC-8).
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

var LOCK_AT = "2026-12-15T00:00:00-08:00";
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
  var created = [];
  var i;
  for (i = 0; i < KIDS.length; i++) {
    var key = codeKey(KIDS[i]);
    if (!props.getProperty(key)) {
      props.setProperty(key, randomCode());
      created.push(KIDS[i]);
    }
  }
  if (!props.getProperty("FAMILY_CODE")) {
    props.setProperty("FAMILY_CODE", randomCode());
    created.push("FAMILY");
  }
  writeCodesSheet();
  ensureItemsSheet();
  toast(created.length
    ? "New codes are on the Codes tab. Do not share this spreadsheet."
    : "Existing codes were kept. The Codes tab is up to date.");
  return created;
}

/** Replace one code. Pass a kid's name, or FAMILY. Returns the name, not the code. */
function resetCode(name) {
  var who = canonicalKid(name);
  if (!who) throw new Error("Unknown name. Use a kid's name, or FAMILY.");
  var props = PropertiesService.getScriptProperties();
  if (who === "FAMILY") props.setProperty("FAMILY_CODE", randomCode());
  else props.setProperty(codeKey(who), randomCode());
  writeCodesSheet();
  toast("The new code is on the Codes tab. The old one no longer works.");
  return who;
}

function resetCodePrompt() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt("Reset a code", "Type a kid's name, or FAMILY, then press OK.", ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;
  try {
    var who = resetCode(response.getResponseText());
    ui.alert("A new code for " + who + " is on the Codes tab. The old code no longer works.");
  } catch (err) {
    ui.alert("That name is not in the list. Use a kid's name or FAMILY.");
  }
}

function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = trim(params.action || "");
    if (action === "lists") return json(readLists(params.code));
    if (action === "mine") return json(readMine(params.kid, params.code));
    return json({ ok: false, error: "This is the gift list service." });
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
    if (!kid || kid === "FAMILY" || !kidOk(kid, body && body.code)) {
      return json({ ok: false, error: "That name and code do not match." });
    }
    if (isLocked()) return json({ ok: false, locked: true, error: "Lists locked Dec 14." });
    return json(withLock(function () {
      if (isLocked()) return { ok: false, locked: true, error: "Lists locked Dec 14." };
      return writeItem(kid, body);
    }));
  } catch (err) {
    return json({ ok: false, error: "That did not work. Try again." });
  }
}

function readLists(code) {
  if (!familyOk(code)) return { ok: false, error: "That family code is not right." };
  var items = readItems();
  var kids = [];
  var i;
  for (i = 0; i < KIDS.length; i++) {
    kids.push({ name: KIDS[i], items: itemsFor(items, KIDS[i]) });
  }
  return { ok: true, locked: isLocked(), lockAt: LOCK_AT, kids: kids };
}

function readMine(name, code) {
  var kid = canonicalKid(name);
  if (!kid || kid === "FAMILY" || !kidOk(kid, code)) {
    return { ok: false, error: "That name and code do not match." };
  }
  return { ok: true, locked: isLocked(), lockAt: LOCK_AT, kid: kid, items: itemsFor(readItems(), kid) };
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

function familyOk(given) {
  var expected = cleanCode(PropertiesService.getScriptProperties().getProperty("FAMILY_CODE") || "");
  var code = cleanCode(given);
  if (!expected || !code) return false;
  return sameCode(expected, code);
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
  var rows = [["FAMILY", props.getProperty("FAMILY_CODE") || ""]];
  var i;
  for (i = 0; i < KIDS.length; i++) rows.push([KIDS[i], props.getProperty(codeKey(KIDS[i])) || ""]);
  sh.clear();
  sh.getRange(1, 1, 1, 2).setValues([["name", "code"]]);
  sh.getRange(2, 1, rows.length, 2).setValues(rows);
  sh.getRange(1, 4).setValue("Private copy for Joseph. Do not share this spreadsheet. The website reads Script Properties, not this tab.");
  sh.setFrozenRows(1);
  sh.getRange(1, 1, rows.length + 1, 2).setNumberFormat("@");
  sh.setColumnWidth(1, 160);
  sh.setColumnWidth(2, 140);
}

function codeKey(name) {
  return "CODE_" + name;
}

function canonicalKid(name) {
  var want = trim(name);
  if (want.toUpperCase() === "FAMILY") return "FAMILY";
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
  return Date.UTC(2026, 11, 15, 8, 0, 0);
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
