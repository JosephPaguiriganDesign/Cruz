/*
  CRUZIO DASH
  ------------
  A small auto-runner, written so you can read it top to bottom.

  Cruzio runs to the right by himself.
  Tap, click, or press Space to jump.
  Spikes, green pipes, and brick blocks are dangerous.
  Gold "?" blocks are safe — jump into them for bonus points.
  The score is how far you get, plus bonuses.
  Your best score is saved in this browser (localStorage).

  Every picture is drawn with rectangles in this file.
  Nothing is loaded from an image.

  Try changing the numbers in the TUNING section, then refresh.
*/

"use strict";

// ============================================================
// TUNING
// ============================================================

// Jump height is about (JUMP_V * JUMP_V) / (2 * GRAVITY).
// 680 and 2000 gives a jump of ~116 pixels that stays up for
// about 0.7 seconds. That window is wide enough to clear every
// pipe, spike row, and brick the course can place.
const GRAVITY = 2000;
const JUMP_V = 680;

// How fast the course scrolls, in pixels per second.
// It stays gentle for a while, then creeps up.
const SPEED_START = 84;
const SPEED_MAX = 130;

// The hitbox is smaller than the drawing, so brushing an edge
// still counts as a miss. That feels fair on a phone.
const PLAYER_W = 8;
const PLAYER_H = 12;

// Where Cruzio sits on screen: 0 is the left edge, 1 is the right.
const FOCUS = 0.28;

// World x where each run begins.
const START_X = 48;

// A low brick hangs this many pixels above the ground.
// Standing Cruzio fits under it. Jumping into it is a crash,
// so those only show up after the opening.
const LOW_BRICK_Y = 26;

const BEST_KEY = "cruzio-dash-best";

// ============================================================
// PALETTE
// All of the colors live here. Change one and the whole game updates.
// ============================================================

const PAL = {
  sky: "#6ec6ff",
  cloud: "#f7fcff",
  cloudShade: "#d7ecf8",
  hillFar: "#8ed487",
  hillFarShade: "#5eaf62",
  hillNear: "#3aaa4a",
  hillNearShade: "#1f7a32",
  grass: "#5ec63a",
  grassDark: "#2f8f22",
  dirt: "#c4844a",
  dirtDark: "#8d552c",
  dirtDeep: "#6b3e22",
  dirtLite: "#d7a15e",
  brick: "#d4654a",
  brickLite: "#f0a090",
  mortar: "#efd3c2",
  q: "#f2c14e",
  qLite: "#ffe39a",
  qDark: "#a56a18",
  qMark: "#5c3410",
  pipe: "#3cb54a",
  pipeLite: "#b6ee78",
  pipeDark: "#1b7a30",
  pipeRim: "#145c24",
  spike: "#6a7380",
  spikeLite: "#e7eef6",
  spikeEdge: "#2a3038",
  cap: "#e23b3b",
  capDark: "#b42323",
  skin: "#f0b48a",
  eye: "#1a1a1a",
  mustache: "#4a2c22",
  overall: "#2c3f86",
  button: "#f0d060",
  shoe: "#3e2a22",
  sole: "#f4f7fb",
  ink: "#142033",
  paper: "#f7fbff",
  white: "#ffffff"
};

// ============================================================
// CRUZIO
// Each letter is one pixel. A dot is empty air.
// He faces right: red cap, mustache, indigo overalls.
// ============================================================

const SPRITE = {
  runA: [
    "......RRRRRR....",
    ".....RRRRRRRR...",
    ".....RRWWWRDD...",
    "....RSSSSSSDD...",
    "....RSSEWSSDD...",
    "....RSSSSSSS....",
    "....RSKKKKSS....",
    ".....SSSSS......",
    "...RRRROOOO.....",
    "..OORRRROOO.....",
    "..OOOBBOOO......",
    "..OOO...OO......",
    ".NNN.....NN.....",
    ".WWW.....WW....."
  ],
  runB: [
    "......RRRRRR....",
    ".....RRRRRRRR...",
    ".....RRWWWRDD...",
    "....RSSSSSSDD...",
    "....RSSEWSSDD...",
    "....RSSSSSSS....",
    "....RSKKKKSS....",
    ".....SSSSS......",
    "...RRRROOOO.....",
    "..OORRRROOO.....",
    "..OOOBBOOO......",
    "..OOO...OO......",
    "..NN....NN......",
    "..WW....WW......"
  ],
  jump: [
    "......RRRRRR....",
    ".....RRRRRRRR...",
    ".....RRWWWRDD...",
    "....RSSSSSSDD...",
    "....RSSEWSSDD...",
    "....RSSSSSSS....",
    "....RSKKKKSS....",
    ".....SSSSS......",
    "...RRRROOOO.....",
    "..OORRRROOO.....",
    "..OOOBBOOO......",
    "..NNWW..WWNN...."
  ]
};

// How tall the drawing is. The low brick stays above this.
const SPRITE_H = SPRITE.runA.length;

function cruzioColor(ch) {
  switch (ch) {
    case "R": return PAL.cap;
    case "D": return PAL.capDark;
    case "W": return PAL.sole;
    case "S": return PAL.skin;
    case "E": return PAL.eye;
    case "K": return PAL.mustache;
    case "O": return PAL.overall;
    case "B": return PAL.button;
    case "N": return PAL.shoe;
    default: return null;
  }
}

// Warn in the console if a row was edited to the wrong length.
(function checkSprites() {
  const frames = [SPRITE.runA, SPRITE.runB, SPRITE.jump];
  for (let f = 0; f < frames.length; f++) {
    const width = frames[f][0].length;
    for (let r = 0; r < frames[f].length; r++) {
      if (frames[f][r].length !== width) {
        console.warn("Cruzio sprite row", r, "in frame", f, "is not", width, "pixels wide.");
      }
    }
  }
})();

// ============================================================
// PIXEL FONT
// 3 pixels wide, 5 tall. M and W are 5 wide so they stay readable.
// 1 = ink. This is our own chunky font, drawn dot by dot.
// ============================================================

const GLYPH = {
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["011", "100", "101", "101", "011"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "010"],
  K: ["101", "110", "100", "110", "101"],
  L: ["100", "100", "100", "100", "111"],
  N: ["110", "101", "101", "101", "101"],
  O: ["010", "101", "101", "101", "010"],
  P: ["110", "101", "110", "100", "100"],
  Q: ["010", "101", "101", "011", "001"],
  R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "011", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
  "?": ["110", "001", "010", "000", "010"],
  "!": ["010", "010", "010", "000", "010"],
  "-": ["000", "000", "111", "000", "000"],
  ".": ["000", "000", "000", "000", "010"],
  "=": ["000", "111", "000", "111", "000"]
};

const WIDE = {
  M: ["10001", "11011", "10101", "10001", "10001"],
  W: ["10001", "10001", "10101", "11011", "10001"]
};

function glyphRows(ch) {
  return WIDE[ch] || GLYPH[ch] || null;
}

function textWidth(text, scale) {
  let w = 0;
  const s = String(text).toUpperCase();
  for (let i = 0; i < s.length; i++) {
    if (s[i] === " ") {
      w += 3 * scale;
      continue;
    }
    const rows = glyphRows(s[i]);
    const gw = rows ? rows[0].length : 3;
    w += gw * scale + scale;
  }
  return w;
}

// ============================================================
// STATE
// mode is "title", "play", or "dead".
// y goes UP from the ground. y = 0 means feet on the grass.
// ============================================================

const canvas = document.getElementById("game");
const out = canvas.getContext("2d");
const buffer = document.createElement("canvas");
const ctx = buffer.getContext("2d");

const player = {
  x: START_X,
  y: 0,
  vy: 0,
  onGround: true
};

const obstacles = [];
const particles = [];

const state = {
  mode: "title",
  score: 0,
  bonus: 0,
  best: 0,
  bestAtStart: 0,
  jumpBuffer: 0,
  cursor: START_X + 140,
  patternCount: 0,
  deadFor: 0,
  shake: 0,
  hasJumped: false,
  preview: 0,
  stepAcc: 0
};

let viewW = 320;
let viewH = 180;
let cssW = 320;
let cssH = 180;
let cameraX = 0;
let lastTime = 0;
let audioCtx = null;

const reduceMotion = window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ============================================================
// SCENERY
// Hills and clouds are generated once, then scrolled.
// LOOP is the width of one repeating strip.
// ============================================================

const LOOP = 1600;
const hillsFar = [];
const hillsNear = [];
const clouds = [];

function buildScenery() {
  for (let x = 0; x < LOOP; x += 110) {
    hillsFar.push({ x: x + 10, r: 28 + ((x / 11) | 0) % 16 });
  }
  for (let x = 30; x < LOOP; x += 160) {
    hillsNear.push({ x: x, r: 16 + ((x / 19) | 0) % 12 });
  }
  for (let i = 0; i < 10; i++) {
    clouds.push({
      x: i * 170 + 20,
      // Fraction of the sky height, so tall phones still have clouds.
      yFrac: 0.12 + (i % 4) * 0.13,
      kind: i % 3
    });
  }
}

// ============================================================
// SAVE / LOAD
// localStorage keeps the best score on this device after you close the tab.
// ============================================================

function loadBest() {
  try {
    const n = parseInt(localStorage.getItem(BEST_KEY), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch (err) {
    return 0;
  }
}

function saveBest(n) {
  try {
    localStorage.setItem(BEST_KEY, String(n));
  } catch (err) {
    // Private mode can block storage. The game still runs.
  }
}

// ============================================================
// SOUND
// Short beeps from the Web Audio oscillator. No audio files.
// Browsers only allow sound after a tap, so we start it on the first press.
// ============================================================

function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (err) {
    audioCtx = null;
  }
}

function beep(freq, dur, type, vol) {
  if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || "square";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.45), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch (err) {
    // Ignore a beep that the browser refused.
  }
}

// ============================================================
// INPUT
// One function handles every "go" press: start, jump, or retry.
// ============================================================

function onPress() {
  unlockAudio();
  if (state.mode === "title") {
    resetRun();
    state.mode = "play";
    beep(520, 0.06, "square", 0.035);
    return;
  }
  if (state.mode === "dead") {
    // Ignore the moment of the crash so a held tap does not instantly restart.
    if (state.deadFor > 0.4) {
      resetRun();
      state.mode = "play";
    }
    return;
  }
  // Remember the tap for a short moment. If Cruzio lands during that
  // window, he still jumps. Phones often tap a frame early.
  state.jumpBuffer = 0.16;
}

function isHomeLink(target) {
  return target && target.closest && target.closest("#home");
}

window.addEventListener("keydown", function (e) {
  if (e.repeat) return;
  const jumpKey = e.code === "Space" || e.code === "ArrowUp" ||
    e.code === "KeyW" || e.code === "Enter";
  if (!jumpKey) return;
  if (e.target && e.target.id === "home") return;
  e.preventDefault();
  onPress();
});

// pointerdown covers a mouse click and a finger tap.
window.addEventListener("pointerdown", function (e) {
  if (isHomeLink(e.target)) return;
  if (e.pointerType === "mouse" && e.button !== 0) return;
  onPress();
});

// Stop the page from scrolling, zooming, or opening a long-press menu.
document.addEventListener("touchstart", function (e) {
  if (!isHomeLink(e.target)) e.preventDefault();
}, { passive: false });

document.addEventListener("touchmove", function (e) {
  e.preventDefault();
}, { passive: false });

document.addEventListener("gesturestart", function (e) {
  e.preventDefault();
});

document.addEventListener("dblclick", function (e) {
  e.preventDefault();
});

document.addEventListener("contextmenu", function (e) {
  e.preventDefault();
});

// ============================================================
// COURSE
// Obstacles are stamped just past the right edge of the screen,
// then thrown away once they scroll off the left.
// ============================================================

function courseDist(x) {
  return Math.max(0, x - START_X);
}

function difficulty() {
  // Full speed is a long way down the course, so the start stays calm.
  return Math.max(0, Math.min(1, courseDist(player.x) / 9000));
}

// 0 = the first ~20 seconds. 3 = the far end of a long run.
function bandAt(x) {
  const dist = courseDist(x);
  if (dist < 2000) return 0;
  if (dist < 4200) return 1;
  if (dist < 7000) return 2;
  return 3;
}

function runSpeed() {
  const speed = SPEED_START + (SPEED_MAX - SPEED_START) * difficulty();
  // A tall phone shows less road ahead, so ease the pace a little.
  if (viewH > viewW * 1.15) return speed * 0.82;
  return speed;
}

function stampSpikes(x, count) {
  const w = 12;
  for (let i = 0; i < count; i++) {
    obstacles.push({ type: "spike", x: x + i * w, y: 0, w: w, h: 12 });
  }
  return count * w;
}

function stampPipe(x, totalH) {
  obstacles.push({ type: "pipe", x: x, y: 0, w: 18, h: totalH });
  return 18;
}

function stampBrick(x, y, cols, rows) {
  obstacles.push({
    type: "brick",
    x: x,
    y: y,
    w: cols * 16,
    h: rows * 16
  });
  return cols * 16;
}

function stampQuestion(x, y) {
  obstacles.push({ type: "question", x: x, y: y, w: 16, h: 16, gone: false });
  return 16;
}

// One named chunk of the course. Heights stay inside the jump arc:
// a full hop clears them, and the gap afterward is long enough to land.
function stampKind(kind, x) {
  if (kind === "spike1") return stampSpikes(x, 1);
  if (kind === "spike2") return stampSpikes(x, 2);
  if (kind === "spike3") return stampSpikes(x, 3);
  if (kind === "pipeS") return stampPipe(x, 18);
  if (kind === "pipeM") return stampPipe(x, 32);
  if (kind === "pipeT") return stampPipe(x, 44);
  if (kind === "brick1") return stampBrick(x, 0, 1, 1);
  if (kind === "brick2") return stampBrick(x, 0, 1, 2);
  if (kind === "low") return stampBrick(x, LOW_BRICK_Y, 2, 1);
  if (kind === "question") return stampQuestion(x, 48);
  if (kind === "spikeQ") {
    const w = stampSpikes(x, 1);
    stampQuestion(x, 48);
    return Math.max(w, 16);
  }
  return stampSpikes(x, 1);
}

function kindsAt(x) {
  const band = bandAt(x);
  // Band 0 is the opening: one short thing at a time.
  const list = ["spike1", "pipeS", "brick1", "spikeQ", "question"];
  if (band >= 1) list.push("spike2", "pipeM", "brick2");
  if (band >= 2) list.push("pipeT", "low");
  // Three spikes in a row need a bit of speed behind them, so they wait.
  if (band >= 3) list.push("spike3");
  return list;
}

// The first obstacles are always the same, so a new player
// can learn spike, then a short pipe, then a brick.
function stampNext(x) {
  const n = state.patternCount;
  state.patternCount += 1;
  if (n === 0) return stampKind("spike1", x);
  if (n === 1) return stampKind("pipeS", x);
  if (n === 2) return stampKind("brick1", x);
  if (n === 3) return stampKind("spike1", x);
  if (n === 4) return stampKind("question", x);
  const kinds = kindsAt(x);
  // Early on, leave a blank patch fairly often so there is time to breathe.
  const breather = bandAt(x) === 0 ? 0.18 : 0.08;
  if (Math.random() < breather) return 0;
  return stampKind(kinds[Math.floor(Math.random() * kinds.length)], x);
}

function minGapAt(x) {
  return [190, 160, 140, 125][bandAt(x)];
}

function spawnAhead() {
  const edge = cameraX + viewW + 80;
  let guard = 0;
  while (state.cursor < edge && guard < 30) {
    guard += 1;
    if (state.patternCount > 0) {
      // Never closer than minGapAt. A late jump still lands before the next one.
      state.cursor += minGapAt(state.cursor) + Math.floor(Math.random() * 36);
    }
    state.cursor += stampNext(state.cursor);
  }
}

function prune() {
  const left = cameraX - 80;
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    if (o.gone || o.x + o.w < left) obstacles.splice(i, 1);
  }
}

// ============================================================
// RULES
// ============================================================

function playerBox() {
  return {
    x: player.x - PLAYER_W / 2,
    y: player.y,
    w: PLAYER_W,
    h: PLAYER_H
  };
}

function overlap(a, b) {
  return a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;
}

// Spikes are pointy, so only the center counts.
// Pipes and bricks lose a few pixels on the sides and the top,
// so a near miss is not a crash.
function solidBox(o) {
  if (o.type === "spike") {
    return {
      x: o.x + 4,
      y: o.y,
      w: Math.max(4, o.w - 8),
      h: Math.max(4, o.h - 5)
    };
  }
  return {
    x: o.x + 3,
    y: o.y,
    w: Math.max(4, o.w - 6),
    h: Math.max(4, o.h - 5)
  };
}

function puff() {
  particles.push({
    x: player.x - 8,
    y: 2,
    vx: -28 - Math.random() * 24,
    vy: 10 + Math.random() * 18,
    life: 0.26,
    max: 0.26,
    color: Math.random() < 0.5 ? PAL.dirtLite : PAL.grassDark,
    s: 2
  });
}

function burst() {
  const colors = [PAL.cap, PAL.overall, PAL.skin, PAL.button, PAL.shoe, PAL.sole];
  for (let i = 0; i < 16; i++) {
    particles.push({
      x: player.x,
      y: player.y + 8,
      vx: (Math.random() - 0.35) * 150,
      vy: 40 + Math.random() * 170,
      life: 0.45 + Math.random() * 0.3,
      max: 0.75,
      color: colors[i % colors.length],
      s: 2 + (i % 3)
    });
  }
}

function spark(o) {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: o.x + 8,
      y: o.y + 8,
      vx: (Math.random() - 0.5) * 70,
      vy: 20 + Math.random() * 50,
      life: 0.32,
      max: 0.32,
      color: i % 2 ? PAL.q : PAL.white,
      s: 2
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.vy -= GRAVITY * 0.4 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.y < 0) p.y = 0;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function die() {
  if (state.mode !== "play") return;
  noteScore();
  state.mode = "dead";
  state.deadFor = 0;
  state.shake = 1;
  burst();
  beep(160, 0.28, "sawtooth", 0.05);
  saveBest(state.best);
}

function noteScore() {
  state.score = Math.floor((player.x - START_X) / 8) + state.bonus;
  if (state.score < 0) state.score = 0;
  if (state.score > state.best) {
    state.best = state.score;
    saveBest(state.best);
  }
}

function stepPlay(dt, speed) {
  if (state.jumpBuffer > 0) {
    state.jumpBuffer -= dt;
    if (player.onGround) {
      player.vy = JUMP_V;
      player.onGround = false;
      state.jumpBuffer = 0;
      state.hasJumped = true;
      beep(660, 0.07, "square", 0.04);
    }
  }

  player.x += speed * dt;
  player.vy -= GRAVITY * dt;
  player.y += player.vy * dt;

  if (player.y <= 0) {
    player.y = 0;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  if (player.onGround) {
    state.stepAcc += speed * dt;
    if (state.stepAcc >= 18) {
      state.stepAcc = 0;
      puff();
    }
  }

  const box = playerBox();

  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    if (o.type !== "question" || o.gone) continue;
    if (!overlap(box, o)) continue;
    o.gone = true;
    state.bonus += 50;
    spark(o);
    beep(900, 0.07, "square", 0.04);
  }

  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    if (o.type === "question" || o.gone) continue;
    if (overlap(box, solidBox(o))) {
      die();
      return;
    }
  }

  noteScore();
}

function update(dt) {
  updateParticles(dt);

  if (state.mode === "dead") {
    state.deadFor += dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 2.4);
    return;
  }

  if (state.mode === "title") {
    // Drift the background so the title screen is not frozen.
    state.preview += dt * 32;
    return;
  }

  // Several small steps per frame, so a fast jump cannot skip a thin block.
  const speed = runSpeed();
  const slices = Math.max(1, Math.ceil(dt / 0.016));
  const step = dt / slices;
  for (let i = 0; i < slices; i++) {
    if (state.mode !== "play") return;
    stepPlay(step, speed);
  }

  cameraX = player.x - viewW * FOCUS;
  spawnAhead();
  prune();
}

function resetRun() {
  player.x = START_X;
  player.y = 0;
  player.vy = 0;
  player.onGround = true;
  state.score = 0;
  state.bonus = 0;
  state.bestAtStart = state.best;
  state.jumpBuffer = 0;
  state.cursor = START_X + 240;
  state.patternCount = 0;
  state.deadFor = 0;
  state.shake = 0;
  state.stepAcc = 0;
  obstacles.length = 0;
  particles.length = 0;
  cameraX = player.x - viewW * FOCUS;
  spawnAhead();
}

// ============================================================
// DRAWING
// We paint a small picture (one game pixel = one pixel), then
// stretch it over the real screen with smoothing turned off.
// That is what keeps the pixels chunky.
// ============================================================

function horizon() {
  // On a tall phone, keep Cruzio up out of the thumb zone
  // and let the dirt fill the bottom of the screen.
  const tall = viewH > viewW * 1.15;
  return Math.round(viewH * (tall ? 0.64 : 0.74));
}

function drawSprite(rows, dx, dy, colorOf) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const color = colorOf(row[c]);
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(dx + c, dy + r, 1, 1);
    }
  }
}

function drawCruzio(rows, x, y) {
  // Draw the shape in ink, shifted 1 pixel, then the colors on top.
  // The leftover ink is an outline. Dots stay empty.
  const shifts = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let i = 0; i < shifts.length; i++) {
    drawSprite(rows, x + shifts[i][0], y + shifts[i][1], function (ch) {
      return ch === "." ? null : PAL.ink;
    });
  }
  drawSprite(rows, x, y, cruzioColor);
}

function drawText(text, x, y, scale, color) {
  const s = String(text).toUpperCase();
  ctx.fillStyle = color;
  let cx = x;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === " ") {
      cx += 3 * scale;
      continue;
    }
    const rows = glyphRows(s[i]);
    if (!rows) {
      cx += 4 * scale;
      continue;
    }
    const gw = rows[0].length;
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < gw; c++) {
        if (rows[r][c] === "1") {
          ctx.fillRect(cx + c * scale, y + r * scale, scale, scale);
        }
      }
    }
    cx += gw * scale + scale;
  }
}

function drawLabel(text, x, y, scale) {
  drawText(text, x - 1, y, scale, PAL.paper);
  drawText(text, x + 1, y, scale, PAL.paper);
  drawText(text, x, y - 1, scale, PAL.paper);
  drawText(text, x, y + 1, scale, PAL.paper);
  drawText(text, x, y, scale, PAL.ink);
}

function drawPanel(x, y, w, h) {
  ctx.fillStyle = PAL.paper;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(x, y, w, 2);
  ctx.fillRect(x, y + h - 2, w, 2);
  ctx.fillRect(x, y, 2, h);
  ctx.fillRect(x + w - 2, y, 2, h);
}

function drawMessage(lines) {
  const gap = 6;
  let blockH = 0;
  let blockW = 0;
  const widths = [];
  for (let i = 0; i < lines.length; i++) {
    const w = textWidth(lines[i].text, lines[i].scale);
    widths.push(w);
    if (w > blockW) blockW = w;
    blockH += lines[i].scale * 5;
  }
  blockH += gap * (lines.length - 1);

  const padX = 12;
  const padY = 10;
  const ground = horizon();
  // Stay under the Home button, and above Cruzio's cap.
  const buttonH = 44 * (viewH / Math.max(1, cssH));
  const topLimit = Math.round(buttonH + 8);
  let y = Math.round(ground * 0.22);
  if (y < topLimit) y = topLimit;
  const bottomLimit = ground - SPRITE_H - 18;
  if (y + blockH + padY * 2 > bottomLimit) {
    y = Math.max(topLimit, bottomLimit - blockH - padY * 2);
  }

  const x = Math.round((viewW - blockW) / 2) - padX;
  drawPanel(x, y - padY, blockW + padX * 2, blockH + padY * 2);

  let cy = y;
  for (let i = 0; i < lines.length; i++) {
    const lx = Math.round((viewW - widths[i]) / 2);
    drawText(lines[i].text, lx, cy, lines[i].scale, PAL.ink);
    cy += lines[i].scale * 5 + gap;
  }
}

function fillPuff(cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let dy = -r; dy <= 2; dy++) {
    const hw = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
    ctx.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
  }
}

function drawCloud(x, y, kind) {
  const sets = [
    [[0, 0, 9], [-8, 2, 6], [8, 1, 6]],
    [[0, 0, 12], [-12, 3, 7], [11, 2, 7], [0, -4, 6]],
    [[0, 1, 7], [6, 0, 5], [-7, 2, 5]]
  ];
  const blobs = sets[kind];
  for (let i = 0; i < blobs.length; i++) {
    fillPuff(x + blobs[i][0], y + blobs[i][1], blobs[i][2], PAL.cloud);
  }
  ctx.fillStyle = PAL.cloudShade;
  ctx.fillRect(x - 8, y + 2, 16, 1);
}

function drawDome(cx, base, radius, fill, shade) {
  for (let rise = 0; rise < radius; rise++) {
    const half = Math.round(Math.sqrt(Math.max(0, radius * radius - rise * rise)));
    if (half <= 0) continue;
    const y = base - 1 - rise;
    ctx.fillStyle = fill;
    ctx.fillRect(Math.round(cx - half), y, half * 2, 1);
    ctx.fillStyle = shade;
    ctx.fillRect(Math.round(cx + half - 2), y, 2, 1);
  }
}

function drawHills(list, cam, factor, fill, shade) {
  const ground = horizon();
  const shift = (cam * factor) % LOOP;
  for (let copy = -1; copy <= 1; copy++) {
    for (let i = 0; i < list.length; i++) {
      const h = list[i];
      const x = h.x - shift + copy * LOOP;
      if (x < -h.r - 4 || x > viewW + h.r + 4) continue;
      drawDome(x, ground, h.r, fill, shade);
    }
  }
}

function drawGround(cam) {
  const gy = horizon();
  const dirtH = viewH - gy;
  ctx.fillStyle = PAL.dirt;
  ctx.fillRect(0, gy, viewW, dirtH);

  // Darker bands so a tall phone's dirt does not look like a flat block.
  ctx.fillStyle = PAL.dirtDark;
  ctx.fillRect(0, gy + 16, viewW, 3);
  if (dirtH > 40) {
    ctx.fillStyle = PAL.dirtDeep;
    ctx.fillRect(0, gy + 34, viewW, 4);
  }

  ctx.fillStyle = PAL.grass;
  ctx.fillRect(0, gy, viewW, 4);
  ctx.fillStyle = PAL.grassDark;
  ctx.fillRect(0, gy + 4, viewW, 2);

  const period = 20;
  const shift = Math.floor(cam) % period;
  for (let x = -shift; x < viewW; x += period) {
    ctx.fillStyle = PAL.grassDark;
    ctx.fillRect(x + 6, gy + 1, 2, 2);
    ctx.fillStyle = PAL.dirtDark;
    ctx.fillRect(x + 3, gy + 20, 4, 3);
    ctx.fillRect(x + 12, gy + 28, 3, 2);
    if (gy + 42 < viewH) {
      ctx.fillStyle = PAL.dirtLite;
      ctx.fillRect(x + 8, gy + 42, 5, 2);
    }
    if (gy + 58 < viewH) {
      ctx.fillStyle = PAL.dirtDeep;
      ctx.fillRect(x + 15, gy + 58, 3, 3);
    }
  }
}

function drawSpike(o, cam) {
  const ground = horizon();
  const x = Math.round(o.x - cam);
  const base = Math.round(ground - o.y);
  for (let i = 0; i < o.h; i++) {
    const y = base - 1 - i;
    const half = Math.max(1, Math.round((o.w / 2) * (1 - i / o.h)));
    const cx = x + o.w / 2;
    ctx.fillStyle = PAL.spike;
    ctx.fillRect(Math.round(cx - half), y, half * 2, 1);
    ctx.fillStyle = PAL.spikeLite;
    ctx.fillRect(Math.round(cx - half), y, 1, 1);
    ctx.fillStyle = PAL.spikeEdge;
    ctx.fillRect(Math.round(cx + half - 1), y, 1, 1);
  }
}

function drawPipe(o, cam) {
  const ground = horizon();
  const x = Math.round(o.x - cam);
  const top = Math.round(ground - (o.y + o.h));
  const capH = 8;
  const lip = 3;
  const bodyX = x + lip;
  const bodyW = o.w - lip * 2;
  const bodyY = top + capH;
  const bodyH = o.h - capH;

  ctx.fillStyle = PAL.pipe;
  ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
  ctx.fillStyle = PAL.pipeLite;
  ctx.fillRect(bodyX, bodyY, 3, bodyH);
  ctx.fillStyle = PAL.pipeDark;
  ctx.fillRect(bodyX + bodyW - 4, bodyY, 4, bodyH);
  ctx.fillRect(bodyX, bodyY + Math.floor(bodyH * 0.45), bodyW, 2);

  ctx.fillStyle = PAL.pipe;
  ctx.fillRect(x, top, o.w, capH);
  ctx.fillStyle = PAL.pipeLite;
  ctx.fillRect(x, top, 3, capH);
  ctx.fillStyle = PAL.pipeDark;
  ctx.fillRect(x + o.w - 4, top, 4, capH);
  ctx.fillStyle = PAL.pipeRim;
  ctx.fillRect(x, top, o.w, 2);
  ctx.fillRect(x, top + capH - 2, o.w, 2);
}

function drawBricks(o, cam) {
  const ground = horizon();
  const x0 = Math.round(o.x - cam);
  const yTop = Math.round(ground - (o.y + o.h));
  const tile = 16;
  for (let row = 0, py = yTop; py < yTop + o.h; row++, py += tile) {
    const offset = (row % 2) * 8;
    for (let px = x0 - tile + offset; px < x0 + o.w; px += tile) {
      const left = Math.max(px, x0);
      const right = Math.min(px + tile, x0 + o.w);
      const top = py;
      const bot = Math.min(py + tile, yTop + o.h);
      if (right <= left || bot <= top) continue;
      ctx.fillStyle = PAL.mortar;
      ctx.fillRect(left, top, right - left, bot - top);
      const insetL = left + (left === px ? 1 : 0);
      const insetT = top + (top === py ? 1 : 0);
      const insetR = right - (right === px + tile ? 1 : 0);
      const insetB = bot - (bot === py + tile ? 1 : 0);
      if (insetR <= insetL || insetB <= insetT) continue;
      ctx.fillStyle = PAL.brick;
      ctx.fillRect(insetL, insetT, insetR - insetL, insetB - insetT);
      ctx.fillStyle = PAL.brickLite;
      ctx.fillRect(insetL, insetT, insetR - insetL, 1);
    }
  }
  ctx.fillStyle = PAL.ink;
  ctx.fillRect(x0, yTop, o.w, 1);
  ctx.fillRect(x0, yTop, 1, o.h);
  ctx.fillRect(x0 + o.w - 1, yTop, 1, o.h);
  ctx.fillRect(x0, yTop + o.h - 1, o.w, 1);
}

function drawQuestion(o, cam) {
  const ground = horizon();
  const x = Math.round(o.x - cam);
  const y = Math.round(ground - (o.y + o.h));
  const blink = Math.floor(performance.now() / 280) % 2 === 0;

  ctx.fillStyle = PAL.qDark;
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = PAL.q;
  ctx.fillRect(x + 2, y + 2, 12, 12);
  ctx.fillStyle = PAL.qLite;
  ctx.fillRect(x + 2, y + 2, 12, 2);
  ctx.fillRect(x + 2, y + 2, 2, 10);

  // Hand-placed question mark. Two frames so the block twinkles.
  const mark = blink
    ? ["01110", "10001", "00010", "00100", "00000", "00100"]
    : ["01110", "10001", "00010", "00100", "00000", "00100"];
  ctx.fillStyle = blink ? PAL.qMark : "#7a4a16";
  for (let r = 0; r < mark.length; r++) {
    for (let c = 0; c < mark[r].length; c++) {
      if (mark[r][c] === "1") ctx.fillRect(x + 5 + c, y + 4 + r, 1, 1);
    }
  }
  if (blink) {
    ctx.fillStyle = PAL.white;
    ctx.fillRect(x + 4, y + 4, 2, 2);
  }
}

function drawObstacles(cam) {
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    if (o.gone) continue;
    if (o.x + o.w < cam - 8 || o.x > cam + viewW + 8) continue;
    if (o.type === "spike") drawSpike(o, cam);
    else if (o.type === "pipe") drawPipe(o, cam);
    else if (o.type === "brick") drawBricks(o, cam);
    else if (o.type === "question") drawQuestion(o, cam);
  }
}

function drawParticles(cam) {
  const ground = horizon();
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x - cam), Math.round(ground - p.y - p.s), p.s, p.s);
  }
  ctx.globalAlpha = 1;
}

function heroFrame(worldX, onGround) {
  if (!onGround) return SPRITE.jump;
  return Math.floor(worldX / 10) % 2 === 0 ? SPRITE.runA : SPRITE.runB;
}

function drawHero(cam, worldX, feetY, onGround) {
  const rows = heroFrame(worldX, onGround);
  const destX = Math.round(worldX - cam - rows[0].length / 2);
  const destY = Math.round(horizon() - feetY - rows.length);
  const ground = horizon();

  const lift = Math.min(1, feetY / 70);
  const sw = Math.max(4, Math.round(12 - lift * 5));
  ctx.globalAlpha = 0.35 - lift * 0.15;
  ctx.fillStyle = "#16341f";
  ctx.fillRect(Math.round(worldX - cam - sw / 2), ground - 2, sw, 2);
  ctx.globalAlpha = 1;

  if (state.mode === "dead" && !reduceMotion) {
    // Blink the hero off and on right after a crash.
    if (Math.floor(state.deadFor * 14) % 2 === 0) return;
  }
  drawCruzio(rows, destX, destY);
}

function safeRight() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--sar");
  const px = parseFloat(raw);
  if (!Number.isFinite(px)) return 0;
  return px * (viewW / Math.max(1, cssW));
}

function safeTop() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--sat");
  const px = parseFloat(raw);
  if (!Number.isFinite(px)) return 0;
  return px * (viewH / Math.max(1, cssH));
}

function drawHud() {
  if (state.mode !== "play") return;
  const scale = viewW < 240 ? 2 : 2;
  const right = viewW - Math.round(8 + safeRight());
  const y = Math.round(8 + safeTop());
  const best = "BEST " + state.best;
  const score = "SCORE " + state.score;
  drawLabel(best, right - textWidth(best, scale), y, scale);
  drawLabel(score, right - textWidth(score, scale), y + scale * 5 + 5, scale);

  if (!state.hasJumped) {
    const hint = "TAP TO JUMP";
    const hw = textWidth(hint, 2);
    const bob = reduceMotion ? 0 : Math.floor(performance.now() / 260) % 2;
    drawLabel(hint, Math.round((viewW - hw) / 2), horizon() - 70 + bob, 2);
  }
}

function titleScale() {
  // Shrink until the widest title fits the screen, portrait included.
  let s = viewH < 190 ? 2 : viewW > 360 ? 4 : 3;
  while (s > 1 && textWidth("CRUZIO DASH", s) > viewW - 36) s -= 1;
  return s;
}

function drawOverlay() {
  if (state.mode === "title") {
    drawMessage([
      { text: "CRUZIO DASH", scale: titleScale() },
      { text: "TAP TO START", scale: 2 },
      { text: "BEST " + state.best, scale: 2 }
    ]);
    return;
  }
  if (state.mode === "dead") {
    ctx.fillStyle = "rgba(20, 32, 51, 0.45)";
    ctx.fillRect(0, 0, viewW, viewH);
    const record = state.score > state.bestAtStart;
    drawMessage([
      { text: "GAME OVER", scale: titleScale() },
      { text: "SCORE " + state.score, scale: 2 },
      { text: record ? "NEW BEST" : "BEST " + state.best, scale: 2 },
      { text: "TAP TO RETRY", scale: 2 }
    ]);
  }
}

function render() {
  const playing = state.mode !== "title";
  const cam = playing ? cameraX : state.preview;
  const heroX = playing ? player.x : cam + viewW * FOCUS;
  const heroY = playing ? player.y : 0;
  const onGround = playing ? player.onGround : true;

  ctx.fillStyle = PAL.sky;
  ctx.fillRect(0, 0, viewW, viewH);

  const cloudShift = (cam * 0.18) % LOOP;
  const ground = horizon();
  for (let copy = -1; copy <= 1; copy++) {
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      const x = c.x - cloudShift + copy * LOOP;
      if (x < -30 || x > viewW + 30) continue;
      drawCloud(Math.round(x), Math.round(ground * c.yFrac), c.kind);
    }
  }

  drawHills(hillsFar, cam, 0.25, PAL.hillFar, PAL.hillFarShade);
  drawHills(hillsNear, cam, 0.45, PAL.hillNear, PAL.hillNearShade);
  drawGround(cam);

  if (playing) drawObstacles(cam);
  drawHero(cam, heroX, heroY, onGround);
  if (playing) drawParticles(cam);
  drawHud();
  drawOverlay();

  out.imageSmoothingEnabled = false;
  out.fillStyle = PAL.sky;
  out.fillRect(0, 0, canvas.width, canvas.height);

  let ox = 0;
  let oy = 0;
  if (state.shake > 0 && !reduceMotion) {
    const mag = state.shake * 7 * (canvas.width / viewW);
    ox = (Math.random() - 0.5) * mag;
    oy = (Math.random() - 0.5) * mag;
  }
  out.drawImage(buffer, ox, oy, canvas.width, canvas.height);
}

// ============================================================
// FIT THE SCREEN
// The small picture's width and height change with the phone
// so the canvas fills portrait and landscape with no scroll bars.
// ============================================================

function fitView(w, h) {
  const aspect = w / Math.max(1, h);
  // Keep the world chunky. minW is how much road a tall phone can see.
  // Lower minW = a bigger Cruzio, but less time to react.
  const minW = 136;
  const baseH = 156;
  if (aspect < 1) {
    return { viewW: minW, viewH: Math.max(baseH, Math.round(minW / aspect)) };
  }
  const vh = baseH;
  return { viewW: Math.max(minW, Math.round(vh * aspect)), viewH: vh };
}

function viewportBox() {
  const vv = window.visualViewport;
  return {
    w: Math.max(1, Math.round(vv ? vv.width : window.innerWidth)),
    h: Math.max(1, Math.round(vv ? vv.height : window.innerHeight)),
    x: vv ? vv.offsetLeft : 0,
    y: vv ? vv.offsetTop : 0
  };
}

function resize() {
  const box = viewportBox();
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  cssW = box.w;
  cssH = box.h;
  canvas.style.width = box.w + "px";
  canvas.style.height = box.h + "px";
  canvas.style.left = box.x + "px";
  canvas.style.top = box.y + "px";
  canvas.width = Math.max(1, Math.round(box.w * dpr));
  canvas.height = Math.max(1, Math.round(box.h * dpr));

  const view = fitView(box.w, box.h);
  viewW = view.viewW;
  viewH = view.viewH;
  buffer.width = viewW;
  buffer.height = viewH;

  const home = document.getElementById("home");
  if (home) {
    // Slide with the visible area. CSS still adds the notch padding.
    home.style.transform = "translate(" + Math.round(box.x) + "px," + Math.round(box.y) + "px)";
  }

  if (state.mode === "play") {
    cameraX = player.x - viewW * FOCUS;
    spawnAhead();
  }
  window.scrollTo(0, 0);
}

// ============================================================
// LOOP
// requestAnimationFrame calls tick once per screen refresh.
// dt is the seconds since the last call, so the speed stays
// the same on a 60Hz laptop and a 120Hz phone.
// ============================================================

function tick(now) {
  if (!lastTime) lastTime = now;
  let dt = (now - lastTime) / 1000;
  lastTime = now;
  // A tab switch can report a huge gap. Cap it so Cruzio
  // does not teleport through a pipe.
  if (dt > 0.05) dt = 0.05;
  if (dt < 0) dt = 0;

  update(dt);
  render();
  requestAnimationFrame(tick);
}

buildScenery();
state.best = loadBest();
state.bestAtStart = state.best;
resize();
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", function () {
  // Phones report the new size a moment after the turn.
  setTimeout(resize, 60);
  setTimeout(resize, 280);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", resize);
  window.visualViewport.addEventListener("scroll", resize);
}
document.addEventListener("visibilitychange", function () {
  lastTime = 0;
  if (document.hidden) saveBest(state.best);
});
window.addEventListener("pagehide", function () {
  saveBest(state.best);
});

requestAnimationFrame(tick);
