"use strict";

var fs = require("fs");
var path = require("path");
var gifts = require("../app");
var config = require("../config");

var failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    if (failed <= 40) console.error("FAIL:", msg);
  }
}

var root = path.join(__dirname, "..");
var app = fs.readFileSync(path.join(root, "app.js"), "utf8");
var html = fs.readFileSync(path.join(root, "index.html"), "utf8");
var css = fs.readFileSync(path.join(root, "style.css"), "utf8");
var gs = fs.readFileSync(path.join(root, "apps-script", "Code.gs"), "utf8");
var home = fs.readFileSync(path.join(root, "..", "index.html"), "utf8");

var lock = gifts.lockInstant();
assert(lock === Date.UTC(2026, 11, 15, 8, 0, 0), "lock instant utc");
assert(gifts.LOCK_AT === "2026-12-15T00:00:00-08:00", "lock string");
assert(gs.indexOf(gifts.LOCK_AT) >= 0, "script lock string");
assert(Date.parse("2026-12-14T23:59:59-08:00") < lock, "still open at 23:59:59 PT");
assert(gifts.isLocked(Date.parse("2026-12-14T23:59:59-08:00")) === false, "not locked before midnight");
assert(gifts.isLocked(lock - 1) === false, "one ms before");
assert(gifts.isLocked(lock) === true, "locked at the instant");
assert(gifts.isLocked(Date.parse("2026-12-15T00:00:00-08:00")) === true, "locked at given stamp");
assert(gifts.isLocked(Date.parse("2026-12-15T00:00:00Z")) === false, "utc midnight is still Dec 14 evening PT");
assert(gifts.countdownParts(lock) === null, "no countdown at lock");
assert(gifts.countdownParts(lock + 1000) === null, "no countdown after");

var day = 86400000;
var oneDay = gifts.countdownParts(lock - day);
assert(oneDay && oneDay.length === 3, "one day parts");
assert(oneDay[0].num === "1" && oneDay[0].unit === "day", "one day");
assert(oneDay[1].num === "0" && oneDay[1].unit === "hours", "zero hours");
assert(oneDay[2].num === "0" && oneDay[2].unit === "minutes", "zero minutes");

var twoDays = gifts.countdownParts(lock - 2 * day);
assert(twoDays[0].num === "2" && twoDays[0].unit === "days", "two days");

var ninety = gifts.countdownParts(lock - 90 * 60000);
assert(ninety[0].num === "1" && ninety[0].unit === "hour", "90 min hour");
assert(ninety[1].num === "30" && ninety[1].unit === "minutes", "90 min minutes");
assert(ninety[2].num === "0" && ninety[2].unit === "seconds", "90 min seconds");

var half = gifts.countdownParts(lock - 30000);
assert(half.length === 2, "under an hour");
assert(half[0].num === "0" && half[0].unit === "minutes", "zero minutes");
assert(half[1].num === "30" && half[1].unit === "seconds", "thirty seconds");

assert(gifts.itemCountText(0) === "0 items", "zero items");
assert(gifts.itemCountText(1) === "1 item", "one item");
assert(gifts.itemCountText(5) === "5 items", "five items");
assert(gifts.priorityLabel("high") === "Really want", "high");
assert(gifts.priorityLabel("med") === "Would like", "med");
assert(gifts.priorityLabel("low") === "Bonus", "low");
assert(gifts.priorityLabel("1") === "", "no numeric priority");

function namesFrom(source, marker) {
  var at = source.indexOf(marker);
  assert(at >= 0, "marker " + marker);
  var start = source.indexOf("[", at);
  var end = source.indexOf("]", start);
  return source.slice(start, end + 1).match(/"([^"]+)"/g).map(function (bit) {
    return bit.slice(1, -1);
  });
}

var expected = ["Cruz", "Kaleo", "Sammy", "Carlos", "Josie", "Alberto", "Isaiah", "Madison", "Eli", "Wyatt", "Emmett"];
assert(config.kids.join("|") === expected.join("|"), "config names");
assert(namesFrom(gs, "var KIDS").join("|") === expected.join("|"), "script names");
assert(config.scriptUrl === "", "url empty until deploy");

var alphabet = (gs.match(/CODE_ALPHABET = "([^"]+)"/) || [])[1];
assert(alphabet && alphabet.length >= 20, "alphabet");
assert(!/[0O1ILl]/.test(alphabet), "ambiguous chars " + alphabet);
assert((gs.match(/CODE_LENGTH = (\d+)/) || [])[1] === "6", "code length");
assert(gs.indexOf("function setupCodes") >= 0, "setupCodes");
assert(gs.indexOf("function resetCode") >= 0, "resetCode");
assert(gs.indexOf("if (!props.getProperty(key))") >= 0, "setup does not overwrite");
assert(gs.indexOf('props.getProperty("FAMILY_CODE")') >= 0, "family property");
assert(gs.indexOf('return "CODE_" + name') >= 0, "kid property key");
assert(gs.indexOf("var NAME_MAX = " + gifts.LIMITS.name) >= 0, "name max");
assert(gs.indexOf("var NOTE_MAX = " + gifts.LIMITS.note) >= 0, "note max");
assert(gs.indexOf("var LINK_MAX = " + gifts.LIMITS.link) >= 0, "link max");
assert(gs.indexOf("var ITEM_MAX = " + gifts.LIMITS.items) >= 0, "item max");

function sliceFn(name, next) {
  var start = gs.indexOf("function " + name);
  var end = gs.indexOf("function " + next);
  assert(start >= 0 && end > start, "slice " + name);
  return gs.slice(start, end);
}
var getFn = sliceFn("doGet", "doPost");
var postFn = sliceFn("doPost", "readLists");
assert(getFn.indexOf("Codes") < 0 && getFn.indexOf("setProperty") < 0, "get does not touch codes");
assert(postFn.indexOf("Codes") < 0, "post does not read the codes tab");
assert(postFn.indexOf("isLocked()") >= 0, "post checks the lock");
assert(postFn.indexOf("kidOk") >= 0, "post checks the kid code");

["config.js", "app.js", "index.html", "style.css"].forEach(function (file) {
  var text = fs.readFileSync(path.join(root, file), "utf8");
  assert(text.indexOf("FAMILY_CODE") < 0, file + " has FAMILY_CODE");
  assert(text.indexOf("CODE_") < 0, file + " has CODE_");
  assert(text.indexOf("setupCodes") < 0, file + " has setupCodes");
  assert(text.indexOf("resetCode") < 0, file + " has resetCode");
});

assert(app.indexOf("innerHTML") < 0 && app.indexOf("insertAdjacentHTML") < 0, "no html injection");
assert(!/\.style\b/.test(app) && !/style\s*=/.test(app), "no styles in js");
assert(!/style\s*=/.test(html), "no inline styles");
assert(html.indexOf('role="status"') >= 0 && html.indexOf('aria-live="polite"') >= 0, "status live");
assert(html.indexOf("Lists locked Dec 14") >= 0, "lock copy");
assert(html.indexOf('class="gifts-status"') >= 0, "status class");
assert(css.indexOf("@font-face") < 0, "fonts come later");

[
  "gifts-kid", "gifts-kid__name", "gifts-kid__count", "gifts-items", "gifts-item",
  "gifts-item__name", "gifts-item__note", "gifts-item__link", "gifts-item__priority",
  "gifts-item__actions", "gifts-add", "gifts-form", "gifts-save", "gifts-cancel",
  "gifts-countdown", "gifts-countdown__num", "gifts-countdown__unit", "gifts-status",
  "gifts-empty", "is-locked", "is-saving", "is-error"
].forEach(function (hook) {
  assert(app.indexOf(hook) >= 0 || html.indexOf(hook) >= 0, "missing hook " + hook);
});

["signin", "all", "mine", "edit"].forEach(function (view) {
  assert(app.indexOf('"' + view + '"') >= 0, "view " + view);
});

assert(home.indexOf('href="gifts/"') >= 0, "home link");

function item(fields) {
  return gifts.validateItem(fields);
}

var ok = item({ name: "  Soccer ball ", link: "", note: " Size 4 ", priority: "high" });
assert(ok.ok && ok.value.name === "Soccer ball" && ok.value.note === "Size 4" && ok.value.link === "", "trim");

assert(item({ name: "   ", priority: "high" }).ok === false, "blank name");
assert(item({ name: "", note: "", link: "", priority: "" }).errors.length >= 2, "name and priority");
assert(item({ name: "x", priority: "high", link: "javascript:alert(1)" }).ok === false, "javascript url");
assert(item({ name: "x", priority: "high", link: "ftp://example.com/a" }).ok === false, "ftp");
assert(item({ name: "x", priority: "high", link: "not a url" }).ok === false, "words");
assert(item({ name: "x", priority: "high", link: "https://example.com/soccer-ball" }).ok === true, "https");
assert(item({ name: "x", priority: "low", link: "http://example.com" }).ok === true, "http");
assert(item({ name: "x", priority: "med", note: "Big pages" }).ok === true, "note only");
assert(item({ name: "x", priority: "nope" }).ok === false, "bad priority");
assert(item({ name: new Array(gifts.LIMITS.name + 2).join("a"), priority: "high" }).ok === false, "long name");
assert(item({ name: "ok", priority: "high", note: new Array(gifts.LIMITS.note + 2).join("b") }).ok === false, "long note");
assert(item({ name: "<b>", priority: "high" }).ok === false, "markup in name");
assert(item({ name: "ok", priority: "high", link: "https://user:pass@example.com/a" }).ok === false, "credentials");
assert(gifts.isHttpUrl("https://example.com") === true, "host");
assert(gifts.isHttpUrl("https://") === false, "empty host");

if (failed) {
  console.error(failed + " assertion(s) failed");
  process.exit(1);
}
console.log("ok");
