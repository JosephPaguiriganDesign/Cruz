/*
  CRUZIO DASH
  ------------
  Cruzio runs to the right on his own.

  Tap (or press Space) for a short hop.
  Hold the button, the mouse, or the key for a higher jump.
  Let go early and the hop stays small.

  There are seven places. Each one looks different.
  Reach the pennant pole to finish a stage. A gate appears,
  then the next place starts. The counter reads 1-1, 1-2,
  up through 1-7, then 2-1, and so on.
  Later stages, and the far end of each stage, pack the
  road tighter: shorter gaps, more obstacles at once.

  Coins add to your score. Bump a "?" block from underneath
  to pop a coin out. Your best score stays on this device.

  Every picture is drawn with rectangles in this file.
  Nothing is loaded from an image. The music is made of
  square and triangle waves in this file too. No samples.

  The sizes of pits, pipes, and gaps were checked so a
  full-height jump can always get through. Early in 1-1
  the road stays open. Density climbs after that.
*/

"use strict";

// ============================================================
// TUNING
// ============================================================

// A held jump uses the small gravity while Cruzio is going up,
// so he goes higher. Letting go switches to the big gravity
// and chops the upward speed, which makes a short hop.
// Full height is about (JUMP_V * JUMP_V) / (2 * GRAVITY_HOLD).
const JUMP_V = 500;
const GRAVITY_HOLD = 1250;
const GRAVITY_FALL = 2400;
const HOP_CUT = 0.4;

// How fast the course moves, in pixels per second.
// Each new stage adds SPEED_STEP. Inside a stage it also creeps up.
const SPEED_START = 74;
const SPEED_STEP = 7;
const SPEED_RAMP = 18;
const SPEED_MAX = 150;

const PLAYER_W = 8;
const PLAYER_H = 12;

// A one-block step can be run up. Taller than this is a wall.
const STEP_UP = 18;
const TILE = 16;

const FOCUS = 0.28;
const START_X = 48;
const LEVEL_LEN = 1450;
const MIN_GAP = 130;

const BEST_KEY = "cruzio-dash-best";
const MUTE_KEY = "cruzio-dash-mute";
const MUSIC_KEY = "cruzio-dash-music";
const COIN_POINTS = 50;
const STOMP_POINTS = 100;

// ============================================================
// STAGES
// Each stage is its own scene: colors, ground, and obstacles.
// "kinds" is the list of pieces the stage is allowed to build.
// grav is 1 on land. The lagoon uses a smaller grav so jumps float.
// ============================================================

const SCENES = [
  {
    id: "meadow",
    name: "MEADOW",
    grav: 1,
    jump: 1,
    sky: "#6ec6ff",
    cloud: "#f7fcff",
    cloudShade: "#d7ecf8",
    hill: "#3aaa4a",
    hillFar: "#8ed487",
    hillShade: "#1f7a32",
    grass: "#5ec63a",
    grassDark: "#2f8f22",
    ground: "#c4844a",
    groundDark: "#8d552c",
    groundDeep: "#6b3e22",
    brick: "#d4654a",
    brickLite: "#f0a090",
    mortar: "#efd3c2",
    pipe: "#3cb54a",
    pipeLite: "#b6ee78",
    pipeDark: "#1b7a30",
    accent: "#e23b3b",
    ink: "#142033",
    // gentle shows up first. mid joins once the stage has started.
    // hard is a combo. later waits for loop 2 and beyond.
    gentle: ["coins", "spike", "pipeS", "qblock"],
    mid: ["bug", "spike2", "bridge", "stair", "pit", "pipeT"],
    hard: ["bugRow", "coinPit", "patrol", "pipeSpike", "mover"],
    later: ["popper", "bugTrio", "pyramidPit"]
  },
  {
    id: "lagoon",
    name: "LAGOON",
    grav: 0.5,
    jump: 0.72,
    sky: "#146888",
    cloud: "#d8fff8",
    cloudShade: "#8ad4c8",
    hill: "#1d8a78",
    hillFar: "#2a6a78",
    hillShade: "#0e4a48",
    grass: "#e6c98a",
    grassDark: "#c4a264",
    ground: "#c98b4a",
    groundDark: "#8d5a30",
    groundDeep: "#5c3a22",
    brick: "#de7a62",
    brickLite: "#f0b0a0",
    mortar: "#f0d8c8",
    pipe: "#3a9a88",
    pipeLite: "#9ee0c8",
    pipeDark: "#1a5a50",
    accent: "#ff7a8a",
    ink: "#062028",
    gentle: ["coins", "coral", "weed"],
    mid: ["fish", "fishHigh", "qblock", "pit"],
    hard: ["school", "coinPit", "mover", "patrol"],
    later: ["schoolWide", "popper"]
  },
  {
    id: "canopy",
    name: "CANOPY",
    grav: 1,
    jump: 1,
    sky: "#8fd0ff",
    cloud: "#f4fff4",
    cloudShade: "#c8e8c0",
    hill: "#2f8a40",
    hillFar: "#67b06a",
    hillShade: "#1a5828",
    grass: "#3aaa4a",
    grassDark: "#1f7a32",
    ground: "#6b4428",
    groundDark: "#4a2e1c",
    groundDeep: "#2e1c10",
    brick: "#a86838",
    brickLite: "#d8a070",
    mortar: "#efd2b4",
    pipe: "#8a5a32",
    pipeLite: "#c48a58",
    pipeDark: "#5a3418",
    accent: "#d2f06a",
    ink: "#142010",
    gentle: ["coins", "trunk"],
    mid: ["pit", "glider", "gliderHigh", "bug", "pitTrunk"],
    hard: ["swarm", "staggerTree", "patrol", "coinPit"],
    later: ["swarmWide", "popper"]
  },
  {
    id: "cloudway",
    name: "CLOUDWAY",
    grav: 1,
    jump: 1,
    sky: "#9fd4ff",
    cloud: "#ffffff",
    cloudShade: "#d5e8f8",
    hill: "#ffffff",
    hillFar: "#e7f4ff",
    hillShade: "#b9d4ea",
    grass: "#f7fbff",
    grassDark: "#d5e6f4",
    ground: "#c5d8ea",
    groundDark: "#9bb6cc",
    groundDeep: "#7e9ab2",
    brick: "#f0d080",
    brickLite: "#fff0c0",
    mortar: "#e8c888",
    pipe: "#f7fbff",
    pipeLite: "#ffffff",
    pipeDark: "#b7cce0",
    accent: "#f2c14e",
    ink: "#243044",
    gentle: ["coins", "coinArc", "highCloud"],
    mid: ["pit", "island"],
    hard: ["mover", "staggerCloud", "coinPit", "swarm"],
    later: ["swarmWide"]
  },
  {
    id: "steps",
    name: "STEPS",
    grav: 1,
    jump: 1,
    sky: "#7eb6e8",
    cloud: "#f4f8ff",
    cloudShade: "#d0dcf0",
    hill: "#c45a3a",
    hillFar: "#d89078",
    hillShade: "#8a3a28",
    grass: "#e07a58",
    grassDark: "#b85a40",
    ground: "#a09080",
    groundDark: "#706058",
    groundDeep: "#483830",
    brick: "#c45a3a",
    brickLite: "#f0a090",
    mortar: "#f0d0c0",
    pipe: "#b85a40",
    pipeLite: "#e09078",
    pipeDark: "#7a3424",
    accent: "#ffd15c",
    ink: "#241810",
    gentle: ["coins", "pyramid", "qblock"],
    mid: ["spike", "bug", "stair", "pyramidGap"],
    hard: ["pyramidTall", "bugRow", "coinPit", "patrol"],
    later: ["pyramidPit", "bugTrio", "popper"]
  },
  {
    id: "grove",
    name: "GROVE",
    grav: 1,
    jump: 1,
    sky: "#87c8f0",
    cloud: "#fff8ee",
    cloudShade: "#f0d8c0",
    hill: "#e07a58",
    hillFar: "#f0b090",
    hillShade: "#a84838",
    grass: "#6aaa48",
    grassDark: "#3e7a30",
    ground: "#6b4a32",
    groundDark: "#4a3020",
    groundDeep: "#2e1c14",
    brick: "#e05a48",
    brickLite: "#ffb090",
    mortar: "#f8d8c0",
    pipe: "#f0d2a0",
    pipeLite: "#fff0d4",
    pipeDark: "#c8a070",
    accent: "#ffe08a",
    ink: "#2a1408",
    gentle: ["coins", "shroom", "qblock"],
    mid: ["bug", "shroomPit"],
    hard: ["staggerShroom", "patrol", "coinPit", "mover"],
    later: ["popper", "bugRow", "bugTrio"]
  },
  {
    id: "night",
    name: "NIGHT GATE",
    grav: 1,
    jump: 1,
    sky: "#1a1840",
    cloud: "#c8c8e8",
    cloudShade: "#8888b0",
    hill: "#3a3058",
    hillFar: "#2a2848",
    hillShade: "#141228",
    grass: "#4a5570",
    grassDark: "#323848",
    ground: "#3a3e50",
    groundDark: "#242833",
    groundDeep: "#141820",
    brick: "#6a3a48",
    brickLite: "#a06070",
    mortar: "#c8a0a8",
    pipe: "#5a5e78",
    pipeLite: "#9aa0b8",
    pipeDark: "#2e3248",
    accent: "#f0e6c0",
    ink: "#f4f0e8",
    gentle: ["coins", "spike", "qblock"],
    mid: ["pillar", "bug", "pit", "stair", "spike2"],
    hard: ["bugRow", "swarm", "pipeSpike", "pyramidPit"],
    later: ["popper", "bugTrio", "swarmWide"]
  }
];

function sceneDef() {
  return SCENES[state.sceneIndex % SCENES.length];
}

function worldNumber() {
  return Math.floor(state.sceneIndex / SCENES.length) + 1;
}

function stageInWorld() {
  return (state.sceneIndex % SCENES.length) + 1;
}

// "1-1", "1-2", ... "2-1". The first number is the loop.
function stageLabel() {
  return worldNumber() + "-" + stageInWorld();
}

function stageNumber() {
  return stageLabel();
}

// 0 at the opening of 1-1. Climbs along a stage, then again
// at each new stage, then again when the seven places loop.
function stageHeat(along) {
  let a = along;
  if (a == null) a = (player.x - state.levelStartX) / LEVEL_LEN;
  if (a < 0) a = 0;
  if (a > 1) a = 1;
  return state.sceneIndex * 0.12 + a * 1.35;
}

// Empty ground between two obstacles. Wide at the start of 1-1,
// shorter by the end of a stage and shorter still on later loops.
// The floor stays longer than a full jump at top speed, so a jump
// that clears one piece still lands before the next piece.
function gapForHeat(h) {
  const g = Math.round(260 - h * 40);
  if (g < 136) return 136;
  return g;
}

function pushKinds(pool, list, times) {
  if (!list || !list.length) return;
  const n = times || 1;
  for (let t = 0; t < n; t++) {
    for (let i = 0; i < list.length; i++) pool.push(list[i]);
  }
}

// Which pieces this stretch of road is allowed to use.
function kindsFor(scene, heat, world) {
  const pool = [];
  pushKinds(pool, scene.gentle, 1);
  if (heat >= 0.34) pushKinds(pool, scene.mid, 1);
  if (heat >= 0.92) pushKinds(pool, scene.hard, 1);
  if (heat >= 1.2) pushKinds(pool, scene.hard, 1);
  if (heat >= 1.8) pushKinds(pool, scene.hard, 1);
  if (world >= 2 && heat >= 1.35) pushKinds(pool, scene.later, 1);
  if (world >= 2 && heat >= 2.1) pushKinds(pool, scene.later, 1);
  if (world >= 3) pushKinds(pool, scene.later, 1);
  return pool;
}

function pickKind(scene, heat, count, world) {
  const gentle = scene.gentle;
  if (!gentle || !gentle.length) return "coins";
  if (count === 0) return gentle[0];
  if (heat < 0.34) return gentle[Math.floor(Math.random() * gentle.length)];
  const pool = kindsFor(scene, heat, world == null ? worldNumber() : world);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ============================================================
// CRUZIO
// Each letter is one pixel. A dot is empty.
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

const SPRITE_H = SPRITE.runA.length;

// A round ground bug. Orange body, big eyes, tiny feet.
const BUG_SPRITE = [
  "..OOOOOO..",
  ".OOOWWOOO.",
  ".OOKWOKOO.",
  ".OOOOOOOO.",
  "..OOOOOO..",
  ".o......o."
];

// A swimming fish. Teal body, tail on the left because it swims left.
const FISH_SPRITE = [
  "TT...BBBBB..",
  "TTT.BBWWBB..",
  "TTTTBBKBBB..",
  "TTT.BBBBBB..",
  "TT...BBBB..."
];

// A little flying critter. Wings out, green body.
const GLIDER_SPRITE = [
  "W........W",
  "WW..GG..WW",
  ".WWGGGGWW.",
  "..GGGGGG..",
  "...G..G..."
];

function cruzioColor(ch) {
  switch (ch) {
    case "R": return "#e23b3b";
    case "D": return "#b42323";
    case "W": return "#f4f7fb";
    case "S": return "#f0b48a";
    case "E": return "#1a1a1a";
    case "K": return "#4a2c22";
    case "O": return "#2c3f86";
    case "B": return "#f0d060";
    case "N": return "#3e2a22";
    default: return null;
  }
}

function bugColor(ch) {
  if (ch === "O") return "#f08a28";
  if (ch === "W") return "#fff6e8";
  if (ch === "K") return "#1a1a1a";
  if (ch === "o") return "#8a4a18";
  return null;
}

function fishColor(ch) {
  if (ch === "B") return "#ffd15c";
  if (ch === "W") return "#fff6d0";
  if (ch === "K") return "#1a1a1a";
  if (ch === "T") return "#e07a28";
  return null;
}

function gliderColor(ch) {
  if (ch === "G") return "#7ed24a";
  if (ch === "W") return "#f4fff4";
  return null;
}

// ============================================================
// PIXEL FONT
// Our own chunky letters. 1 = ink.
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
  "1": ["110", "010", "010", "010", "111"],
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
  ".": ["000", "000", "000", "000", "010"]
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
    if (s[i] === " ") { w += 3 * scale; continue; }
    const rows = glyphRows(s[i]);
    const gw = rows ? rows[0].length : 3;
    w += gw * scale + scale;
  }
  return w;
}

// ============================================================
// STATE
// y goes UP. y = 0 is the ground, unless a pit is under Cruzio.
// ============================================================

const player = {
  x: START_X,
  y: 0,
  prevY: 0,
  vy: 0,
  onGround: true,
  wasHolding: false
};

const obstacles = [];
const particles = [];

const state = {
  mode: "title", // title, play, dead, clear
  sceneIndex: 0,
  levelStartX: START_X,
  goalSpawned: false,
  score: 0,
  bonus: 0,
  coins: 0,
  best: 0,
  bestAtStart: 0,
  jumpBuffer: 0,
  cursor: START_X + 280,
  patternCount: 0,
  deadFor: 0,
  clearFor: 0,
  shake: 0,
  bannerT: 0,
  hasJumped: false,
  clock: 0,
  paused: false
};

let holding = false;
let muted = false;
let viewW = 480;
let viewH = 270;
let cssW = 800;
let cssH = 450;
let cameraX = 0;
let lastTime = 0;
let audioCtx = null;

let canvas, out, buffer, ctx;
let reduceMotion = false;

// ============================================================
// SOUND
// Effects are short beeps. Music is a tiny step sequencer
// on square and triangle waves. No samples, no borrowed tunes.
// The Sfx button skips effects. The Music button skips the tune.
// Music is much quieter than a jump or a coin.
// ============================================================

// One cell is an eighth note.
// A positive number is a MIDI note. 0 is a rest.
// -1 holds the note that came before it (no new attack).
// Loops are original: different keys, rhythms, and moods.
// They are not quotations of any game theme.
const TUNES = {
  meadow: {
    // Bright and bouncy. Short notes, major key, lots of skips.
    bpm: 126,
    gate: 0.42,
    leadWave: "square",
    bassWave: "triangle",
    lead: [
      72, 76, 79, 76, 74, 77, 81, 77,
      71, 74, 79, 74, 72, 67, 72, 76,
      79, 76, 74, 72, 77, 74, 72, 71,
      69, 72, 76, 72, 67, 64, 67, 72
    ],
    bass: [
      48, 0, 48, 0, 43, 0, 43, 0,
      41, 0, 41, 0, 43, 0, 47, 0,
      48, 0, 45, 0, 43, 0, 41, 0,
      36, 0, 43, 0, 48, 0, 48, 0
    ]
  },
  lagoon: {
    // Floaty. Slow, held notes, a dorian sway instead of a march.
    bpm: 92,
    gate: 0.92,
    leadWave: "triangle",
    bassWave: "triangle",
    lead: [
      62, -1, -1, -1, 65, -1, 69, -1,
      72, -1, -1, -1, 70, -1, 67, -1,
      65, -1, -1, 64, 62, -1, -1, -1,
      60, -1, 62, -1, 57, -1, -1, -1
    ],
    bass: [
      38, -1, -1, -1, 45, -1, -1, -1,
      41, -1, -1, -1, 43, -1, -1, -1,
      38, -1, -1, -1, 36, -1, -1, -1,
      33, -1, -1, -1, 38, -1, -1, -1
    ]
  },
  canopy: {
    // Leafy and light. A mixolydian skip, mid tempo.
    bpm: 116,
    gate: 0.5,
    leadWave: "square",
    bassWave: "triangle",
    lead: [
      67, 71, 74, 71, 72, 74, 67, 64,
      66, 69, 73, 69, 67, 64, 62, 64,
      67, 71, 74, 76, 74, 71, 69, 67,
      66, 69, 67, 64, 62, 64, 67, -1
    ],
    bass: [
      43, 0, 47, 0, 43, 0, 38, 0,
      41, 0, 45, 0, 43, 0, 38, 0,
      43, 0, 47, 0, 50, 0, 47, 0,
      45, 0, 43, 0, 38, 0, 43, 0
    ]
  },
  cloudway: {
    // Airy. High, sparse, long gaps of sky.
    bpm: 104,
    gate: 0.7,
    leadWave: "triangle",
    bassWave: "triangle",
    lead: [
      77, 0, 0, 0, 81, 0, 79, 0,
      76, 0, 0, 0, 74, 0, 72, 0,
      0, 0, 79, -1, 77, 0, 0, 0,
      74, 0, 72, 0, 0, 0, 0, 0
    ],
    bass: [
      41, 0, 0, 0, 0, 0, 48, 0,
      41, 0, 0, 0, 45, 0, 0, 0,
      41, 0, 0, 0, 36, 0, 0, 0,
      41, 0, 0, 0, 0, 0, 0, 0
    ]
  },
  steps: {
    // A plain march. Staccato quarters, minor key.
    bpm: 120,
    gate: 0.34,
    leadWave: "square",
    bassWave: "triangle",
    lead: [
      69, 0, 72, 0, 76, 0, 72, 0,
      74, 0, 71, 0, 69, 0, 67, 0,
      65, 0, 69, 0, 72, 0, 76, 0,
      74, 0, 72, 0, 69, 0, 69, 0
    ],
    bass: [
      45, 0, 45, 0, 40, 0, 40, 0,
      38, 0, 38, 0, 43, 0, 43, 0,
      41, 0, 41, 0, 45, 0, 40, 0,
      38, 0, 43, 0, 45, 0, 45, 0
    ]
  },
  grove: {
    // Warm and round. A lilting major tune, not the meadow one.
    bpm: 108,
    gate: 0.62,
    leadWave: "square",
    bassWave: "triangle",
    lead: [
      65, 69, 72, 69, 70, 74, 72, 70,
      67, 70, 74, 70, 69, 67, 65, 64,
      65, 69, 72, 76, 74, 72, 70, 69,
      67, 70, 67, 65, 64, 62, 65, -1
    ],
    bass: [
      41, 0, 41, 0, 48, 0, 46, 0,
      43, 0, 43, 0, 41, 0, 36, 0,
      41, 0, 48, 0, 46, 0, 43, 0,
      41, 0, 36, 0, 41, 0, 41, 0
    ]
  },
  night: {
    // Spooky. Slow phrygian steps, low and a little uneasy.
    bpm: 78,
    gate: 0.85,
    leadWave: "triangle",
    bassWave: "triangle",
    lead: [
      64, -1, 65, 64, 67, -1, 65, 64,
      62, -1, 60, 62, 64, -1, -1, -1,
      71, -1, 69, 67, 65, -1, 64, 65,
      62, -1, 64, -1, 60, -1, -1, -1
    ],
    bass: [
      40, -1, -1, -1, 41, -1, 40, -1,
      35, -1, -1, -1, 36, -1, 40, -1,
      40, -1, -1, -1, 35, -1, -1, -1,
      36, -1, 41, -1, 40, -1, -1, -1
    ]
  }
};

// A short original phrase for the pennant. Not a rising major arpeggio.
const FLAG_JINGLE = [67, 69, 72, 76, -1, 74, 71, 67, -1];

let musicOn = true;
let musicGain = null;
let musicTimer = null;
let musicNodes = [];
let musicScene = "";
let musicMode = "";
let musicLeadStep = 0;
let musicBassStep = 0;
let musicLeadTime = 0;
let musicBassTime = 0;

function loadMute() {
  try { return localStorage.getItem(MUTE_KEY) === "1"; }
  catch (err) { return false; }
}

function loadMusic() {
  try { return localStorage.getItem(MUSIC_KEY) !== "0"; }
  catch (err) { return true; }
}

function paintMute() {
  const btn = document.getElementById("mute");
  if (btn) btn.textContent = muted ? "Off" : "Sfx";
}

function paintMusic() {
  const btn = document.getElementById("music");
  if (!btn) return;
  btn.textContent = musicOn ? "Music" : "Off";
  btn.setAttribute("aria-pressed", musicOn ? "true" : "false");
  btn.setAttribute("aria-label", musicOn ? "Turn music off" : "Turn music on");
}

function toggleMute() {
  muted = !muted;
  paintMute();
  try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); }
  catch (err) { /* private mode */ }
}

function toggleMusic() {
  // The click is a user gesture, so Safari will allow sound after this.
  unlockAudio();
  musicOn = !musicOn;
  paintMusic();
  try { localStorage.setItem(MUSIC_KEY, musicOn ? "1" : "0"); }
  catch (err) { /* private mode */ }
  if (!musicOn) stopMusic();
  else startTune(sceneDef().id, true);
}

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

function tone(freq, dur, type, vol) {
  if (muted || !audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || "square";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.5), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch (err) { /* ignore */ }
}

function fanfare() {
  const notes = [523, 659, 784, 1046];
  for (let i = 0; i < notes.length; i++) {
    setTimeout(function () { tone(notes[i], 0.12, "square", 0.04); }, i * 90);
  }
}

// Effects sit around 0.03 to 0.05. The tune is held under that.
function musicBus() {
  if (!audioCtx) return null;
  if (!musicGain) {
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.18;
    musicGain.connect(audioCtx.destination);
  }
  return musicGain;
}

function midiFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Later loops push the tempo up a little. It caps so it stays musical.
function eighthSeconds(bpm) {
  const eighth = 60 / bpm / 2;
  const loop = Math.max(0, worldNumber() - 1);
  const faster = 1 + Math.min(4, loop) * 0.07;
  return eighth / faster;
}

function scheduleNote(midi, when, dur, wave) {
  if (!audioCtx || midi <= 0 || dur <= 0) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const peak = 0.055;
    osc.type = wave || "square";
    osc.frequency.setValueAtTime(midiFreq(midi), when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(0.04, dur));
    osc.connect(gain);
    gain.connect(musicBus());
    osc.start(when);
    osc.stop(when + dur + 0.03);
    musicNodes.push(osc);
    if (musicNodes.length > 24) musicNodes.splice(0, musicNodes.length - 16);
  } catch (err) { /* ignore */ }
}

function stopVoices() {
  for (let i = 0; i < musicNodes.length; i++) {
    try { musicNodes[i].stop(); }
    catch (err) { /* already stopped */ }
  }
  musicNodes = [];
}

function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  musicMode = "";
  musicScene = "";
  stopVoices();
}

function pumpVoice(row, wave, gate, which) {
  const step = eighthSeconds(TUNES[musicScene].bpm);
  const horizon = audioCtx.currentTime + 0.24;
  let t = which === "lead" ? musicLeadTime : musicBassTime;
  let i = which === "lead" ? musicLeadStep : musicBassStep;
  const len = row.length;
  let guard = 0;
  while (t < horizon && guard < 32) {
    guard += 1;
    const cell = row[i];
    if (cell > 0) {
      let span = 1;
      while (span < len && row[(i + span) % len] === -1) span += 1;
      scheduleNote(cell, t, step * span * gate, wave);
    }
    t += step;
    i = (i + 1) % len;
  }
  if (which === "lead") {
    musicLeadTime = t;
    musicLeadStep = i;
  } else {
    musicBassTime = t;
    musicBassStep = i;
  }
}

function pumpMusic() {
  if (!musicOn || !audioCtx || document.hidden || musicMode !== "tune") return;
  const tune = TUNES[musicScene];
  if (!tune) return;
  pumpVoice(tune.lead, tune.leadWave, tune.gate, "lead");
  pumpVoice(tune.bass, tune.bassWave, tune.gate, "bass");
}

function startTune(id, force) {
  if (!musicOn || !audioCtx || document.hidden) return;
  if (!TUNES[id]) return;
  if (!force && musicScene === id && musicTimer && musicMode === "tune") return;
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  stopVoices();
  musicMode = "tune";
  musicScene = id;
  musicLeadStep = 0;
  musicBassStep = 0;
  const now = audioCtx.currentTime + 0.04;
  musicLeadTime = now;
  musicBassTime = now;
  pumpMusic();
  musicTimer = setInterval(pumpMusic, 90);
}

function playFlagJingle() {
  if (!musicOn || !audioCtx || document.hidden) return;
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  stopVoices();
  musicMode = "jingle";
  musicScene = "";
  // Fixed tempo so the phrase finishes before the next stage starts.
  const step = 60 / 168 / 2;
  let t = audioCtx.currentTime + 0.02;
  for (let i = 0; i < FLAG_JINGLE.length; i++) {
    const cell = FLAG_JINGLE[i];
    if (cell > 0) {
      let span = 1;
      while (i + span < FLAG_JINGLE.length && FLAG_JINGLE[i + span] === -1) span += 1;
      scheduleNote(cell, t, step * span * 0.7, i % 2 === 0 ? "square" : "triangle");
    }
    t += step;
  }
}

function ensureMusic() {
  if (!musicOn || !audioCtx || document.hidden) return;
  if (state.mode === "clear" || musicMode === "jingle") return;
  startTune(sceneDef().id, false);
}

// ============================================================
// INPUT
// holding stays true until the finger, mouse, or key comes up.
// That is what makes a tap short and a hold tall.
// ============================================================

function isUi(target) {
  return target && target.closest && (
    target.closest("#home") || target.closest("#mute") || target.closest("#music") || target.closest("#soundbar")
  );
}

function onPress() {
  // First tap creates the audio context. Safari will not start it sooner.
  unlockAudio();
  if (state.mode === "title") {
    resetRun();
    state.mode = "play";
    holding = false;
    tone(520, 0.06, "square", 0.03);
    ensureMusic();
    return;
  }
  if (state.mode === "dead") {
    if (state.deadFor > 0.35) {
      resetRun();
      state.mode = "play";
      ensureMusic();
    }
    holding = false;
    return;
  }
  if (state.mode !== "play") return;
  ensureMusic();
  state.jumpBuffer = 0.12;
  holding = true;
}

function onRelease() {
  holding = false;
}

function bindInput() {
  window.addEventListener("keydown", function (e) {
    if (e.repeat) return;
    const jumpKey = e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW";
    if (!jumpKey) return;
    if (e.target && (e.target.id === "home" || e.target.id === "mute" || e.target.id === "music")) return;
    e.preventDefault();
    onPress();
  });
  window.addEventListener("keyup", function (e) {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") onRelease();
  });
  window.addEventListener("pointerdown", function (e) {
    if (isUi(e.target)) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    onPress();
  });
  window.addEventListener("pointerup", onRelease);
  window.addEventListener("pointercancel", onRelease);
  const mute = document.getElementById("mute");
  if (mute) {
    mute.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    mute.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMute();
    });
  }
  const musicBtn = document.getElementById("music");
  if (musicBtn) {
    musicBtn.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    musicBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMusic();
    });
  }
  document.addEventListener("touchstart", function (e) {
    if (!isUi(e.target)) e.preventDefault();
  }, { passive: false });
  document.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener("gesturestart", function (e) { e.preventDefault(); });
  document.addEventListener("dblclick", function (e) { e.preventDefault(); });
  document.addEventListener("contextmenu", function (e) { e.preventDefault(); });
}

// ============================================================
// COURSE
// makePattern drops one chunk at world x and returns how wide it is.
// Pieces are kept small enough that a full jump clears them.
// ============================================================

function addObj(obj) {
  if (obj.x != null && obj.home == null) obj.home = obj.x;
  obstacles.push(obj);
}

// A critter that stays in its own lane. span is how far it may wander.
function addCritter(type, x, y, vx, span) {
  const w = type === "bug" ? 14 : 16;
  const h = 12;
  const reach = span == null ? 18 : span;
  addObj({
    type: type, x: x, y: y, w: w, h: h, vx: vx, home: x,
    left: x - reach, right: x + w + reach
  });
}

function addStairs(x, steps) {
  const cols = steps * 2 - 1;
  for (let i = 0; i < cols; i++) {
    const level = i < steps ? i + 1 : cols - i;
    addObj({ type: "block", x: x + i * TILE, y: 0, w: TILE, h: level * TILE });
  }
  return cols * TILE;
}

function addFlyerCluster(type, x, yLift) {
  // Three flyers, staggered in height, close enough to clear in one jump
  // and far enough apart that they never share the same column.
  addCritter(type, x, 2 + yLift, -18, 10);
  addCritter(type, x + 28, 30 + yLift, -16, 10);
  addCritter(type, x + 56, 6 + yLift, -18, 10);
  return 78;
}

function makePattern(kind, x) {
  if (kind === "coins") {
    for (let i = 0; i < 4; i++) addObj({ type: "coin", x: x + i * 16, y: 36, w: 10, h: 10 });
    return 64;
  }
  if (kind === "coinArc") {
    for (let i = 0; i < 5; i++) {
      const lift = Math.sin((i / 4) * Math.PI) * 28;
      addObj({ type: "coin", x: x + i * 16, y: 28 + lift, w: 10, h: 10 });
    }
    return 80;
  }
  if (kind === "coinPit") {
    // A coin arc sitting over a pit, so the jump that clears it also pays.
    addObj({ type: "pit", x: x + 16, w: 32 });
    for (let i = 0; i < 5; i++) {
      const lift = Math.sin((i / 4) * Math.PI) * 42;
      addObj({ type: "coin", x: x + 8 + i * 12, y: 16 + lift, w: 10, h: 10 });
    }
    return 16 + 32 + 24;
  }
  if (kind === "spike" || kind === "spike2") {
    // Two spikes is the busier version. Three in a solid row is wider
    // than a full jump at the speed this piece first shows up.
    const n = kind === "spike2" ? 2 : 1;
    for (let i = 0; i < n; i++) addObj({ type: "spike", x: x + i * 14, y: 0, w: 14, h: 12 });
    return n * 14;
  }
  if (kind === "pipeS") {
    addObj({ type: "pipe", x: x, y: 0, w: 18, h: 16 });
    return 18;
  }
  if (kind === "pipeSpike") {
    // A short pipe, then spikes. Step onto the pipe, hop the spikes,
    // or clear both in one jump once the road is moving faster.
    addObj({ type: "pipe", x: x, y: 0, w: 18, h: 16 });
    addObj({ type: "spike", x: x + 18 + 28, y: 0, w: 14, h: 12 });
    addObj({ type: "spike", x: x + 18 + 42, y: 0, w: 14, h: 12 });
    return 18 + 42 + 14;
  }
  if (kind === "popper") {
    // A short pipe with a pod that rises out of the mouth and sinks back.
    // Jumping over the pipe clears it whether the pod is up or down.
    addObj({ type: "pipe", x: x, y: 0, w: 18, h: 16, mouth: true });
    addObj({
      type: "snap", x: x + 2, y: 16, w: 14, h: 18,
      phase: Math.random() * 2.2, period: 2.6, out: false
    });
    return 28;
  }
  if (kind === "pipeT" || kind === "pillar" || kind === "trunk") {
    const h = kind === "trunk" ? 46 : 42;
    addObj({ type: kind === "pipeT" ? "pipe" : kind, x: x, y: 0, w: 20, h: h });
    return 20;
  }
  if (kind === "qblock") {
    addObj({ type: "q", x: x, y: 36, w: 16, h: 16, float: true, used: false });
    addObj({ type: "coin", x: x + 3, y: 78, w: 10, h: 10 });
    return 16;
  }
  if (kind === "stair" || kind === "pyramid") return addStairs(x, 3);
  if (kind === "pyramidTall") return addStairs(x, 4);
  if (kind === "pyramidGap") {
    const w1 = addStairs(x, 3);
    const runway = 40;
    const pitW = 32;
    addObj({ type: "pit", x: x + w1 + runway, w: pitW });
    const w2 = addStairs(x + w1 + runway + pitW + runway, 3);
    return w1 + runway + pitW + runway + w2;
  }
  if (kind === "pyramidPit") {
    // Two tall stair pyramids with a pit between them.
    const w1 = addStairs(x, 4);
    const runway = 42;
    const pitW = 32;
    addObj({ type: "pit", x: x + w1 + runway, w: pitW });
    for (let i = 0; i < 3; i++) {
      const lift = Math.sin((i / 2) * Math.PI) * 36;
      addObj({ type: "coin", x: x + w1 + runway + 4 + i * 10, y: 18 + lift, w: 10, h: 10 });
    }
    const w2 = addStairs(x + w1 + runway + pitW + runway, 4);
    return w1 + runway + pitW + runway + w2;
  }
  if (kind === "bug") {
    addCritter("bug", x + 16, 0, -24, 20);
    return 56;
  }
  if (kind === "bugRow" || kind === "bugTrio") {
    // Far enough apart that a full jump at top speed lands between them,
    // even if each bug has shuffled a step to the side.
    const n = kind === "bugTrio" ? 3 : 2;
    const spacing = 142;
    for (let i = 0; i < n; i++) addCritter("bug", x + 12 + i * spacing, 0, -22, 6);
    return 12 + (n - 1) * spacing + 36;
  }
  if (kind === "bridge") {
    addObj({ type: "block", x: x, y: 40, w: TILE * 3, h: TILE, float: true });
    addObj({ type: "coin", x: x + 8, y: 70, w: 10, h: 10 });
    addObj({ type: "coin", x: x + 28, y: 70, w: 10, h: 10 });
    return TILE * 3;
  }
  if (kind === "patrol") {
    // A bridge over a short pit. The bug patrols only the right half,
    // so the left lip is always a safe place to land.
    const deckY = 22;
    const deckW = 84;
    addObj({ type: "pit", x: x + 26, w: 30 });
    addObj({ type: "block", x: x + 10, y: deckY, w: deckW, h: 12, float: true });
    const bugX = x + 10 + 48;
    addCritter("bug", bugX, deckY + 12, -18, 8);
    addObj({ type: "coin", x: x + 18, y: deckY + 30, w: 10, h: 10 });
    return 10 + deckW + 12;
  }
  if (kind === "mover") {
    // A deck that slides a few pixels over a pit it always covers.
    // The pit is also short enough to clear if you crest the deck.
    const deckY = 24;
    const deckW = 72;
    const base = x + 18;
    addObj({ type: "pit", x: x + 36, w: 28 });
    addObj({
      type: "block", x: base, y: deckY, w: deckW, h: 12, float: true, slide: true,
      sLeft: base - 6, sRight: base + 6, svx: 14
    });
    addObj({ type: "coin", x: base + 20, y: deckY + 32, w: 10, h: 10 });
    addObj({ type: "coin", x: base + 40, y: deckY + 36, w: 10, h: 10 });
    return 18 + deckW + 16;
  }
  if (kind === "pit" || kind === "island") {
    addObj({ type: "pit", x: x, w: 34 });
    if (kind === "island") {
      addObj({ type: "pit", x: x + 34 + 48, w: 34 });
      return 34 + 48 + 34;
    }
    return 34;
  }
  if (kind === "coral") {
    addObj({ type: "block", x: x, y: 0, w: 14, h: 12 });
    addObj({ type: "deco", x: x, y: 12, w: 14, h: 16, deco: "coral" });
    return 14;
  }
  if (kind === "weed") {
    addObj({ type: "block", x: x, y: 28, w: 36, h: 10, float: true });
    return 36;
  }
  if (kind === "fish") {
    addCritter("fish", x + 10, 0, -22, 18);
    return 48;
  }
  if (kind === "fishHigh") {
    addCritter("fish", x + 8, 40, -18, 14);
    return 44;
  }
  if (kind === "school" || kind === "schoolWide") {
    let w = addFlyerCluster("fish", x, 0);
    if (kind === "schoolWide") w += 150 + addFlyerCluster("fish", x + w + 150, 4);
    return w + 16;
  }
  if (kind === "glider") {
    addCritter("glider", x + 10, 0, -20, 18);
    return 50;
  }
  if (kind === "gliderHigh") {
    addCritter("glider", x + 8, 40, -16, 14);
    return 44;
  }
  if (kind === "swarm" || kind === "swarmWide") {
    let w = addFlyerCluster("glider", x, 0);
    if (kind === "swarmWide") w += 150 + addFlyerCluster("glider", x + w + 150, 2);
    return w + 16;
  }
  if (kind === "pitTrunk") {
    addObj({ type: "pit", x: x, w: 30 });
    addObj({ type: "trunk", x: x + 30 + 16, y: 0, w: 22, h: 36 });
    return 30 + 16 + 22;
  }
  if (kind === "highCloud") {
    addObj({ type: "block", x: x, y: 48, w: 52, h: 12, float: true, cloud: true });
    addObj({ type: "coin", x: x + 8, y: 74, w: 10, h: 10 });
    addObj({ type: "coin", x: x + 28, y: 82, w: 10, h: 10 });
    return 52;
  }
  if (kind === "staggerTree") {
    // Two leafy tops at different heights. The pit sits between them,
    // not under them, so a landing is never trapped against a ceiling.
    addObj({ type: "block", x: x, y: 22, w: 52, h: 12, float: true, leaf: true });
    addObj({ type: "pit", x: x + 52 + 8, w: 30 });
    const b = x + 52 + 8 + 30 + 8;
    addObj({ type: "block", x: b, y: 44, w: 58, h: 12, float: true, leaf: true });
    addObj({ type: "coin", x: x + 16, y: 50, w: 10, h: 10 });
    addObj({ type: "coin", x: x + 52 + 12, y: 26, w: 10, h: 10 });
    return (b - x) + 58;
  }
  if (kind === "staggerCloud") {
    addObj({ type: "block", x: x, y: 26, w: 56, h: 12, float: true, cloud: true });
    addObj({ type: "pit", x: x + 56 + 8, w: 30 });
    const b = x + 56 + 8 + 30 + 8;
    addObj({ type: "block", x: b, y: 48, w: 60, h: 12, float: true, cloud: true });
    addObj({ type: "coin", x: x + 16, y: 54, w: 10, h: 10 });
    addObj({ type: "coin", x: x + 56 + 12, y: 28, w: 10, h: 10 });
    return (b - x) + 60;
  }
  if (kind === "shroom") {
    // Wide cap with a narrow stem. Jump onto the cap, run across, drop off.
    addObj({ type: "block", x: x, y: 30, w: 84, h: 14, float: true, shroom: true });
    addObj({ type: "pipe", x: x + 34, y: 0, w: 16, h: 30, stem: true });
    addObj({ type: "coin", x: x + 20, y: 58, w: 10, h: 10 });
    addObj({ type: "coin", x: x + 52, y: 58, w: 10, h: 10 });
    return 84;
  }
  if (kind === "shroomPit") {
    const w = makePattern("shroom", x);
    // Room to land after stepping off the cap, then a pit a full jump can clear.
    addObj({ type: "pit", x: x + w + 40, w: 30 });
    return w + 40 + 30 + 24;
  }
  if (kind === "staggerShroom") {
    // Two mushroom caps over a pit, the second one higher.
    // Each stem sits under the right side so the left lip is a landing.
    addObj({ type: "block", x: x, y: 24, w: 64, h: 14, float: true, shroom: true });
    addObj({ type: "pipe", x: x + 34, y: 0, w: 14, h: 24, stem: true });
    addObj({ type: "pit", x: x + 64 + 10, w: 28 });
    const b = x + 64 + 10 + 28 + 10;
    addObj({ type: "block", x: b, y: 44, w: 72, h: 14, float: true, shroom: true });
    addObj({ type: "pipe", x: b + 40, y: 0, w: 14, h: 44, stem: true });
    addObj({ type: "coin", x: x + 12, y: 54, w: 10, h: 10 });
    addObj({ type: "coin", x: b + 12, y: 74, w: 10, h: 10 });
    return (b - x) + 72;
  }
  return 0;
}

function spawnAhead() {
  if (state.goalSpawned || state.mode === "clear") return;
  const scene = sceneDef();
  const endX = state.levelStartX + LEVEL_LEN;
  let guard = 0;
  while (state.cursor < cameraX + viewW + 140 && state.cursor < endX - 30 && guard < 24) {
    guard += 1;
    if (state.patternCount > 0) {
      const along = (state.cursor - state.levelStartX) / LEVEL_LEN;
      state.cursor += gapForHeat(stageHeat(along));
    }
    const along = (state.cursor - state.levelStartX) / LEVEL_LEN;
    const kind = pickKind(scene, stageHeat(along), state.patternCount);
    state.patternCount += 1;
    state.cursor += makePattern(kind, state.cursor);
  }
  if (!state.goalSpawned && state.cursor >= endX - 30) {
    addObj({ type: "pole", x: endX + 36, y: 0, w: 8, h: 112 });
    state.goalSpawned = true;
  }
}

function prune() {
  const left = cameraX - 120;
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    const w = o.w || 10;
    if (o.got || o.dead || (o.x + w < left && o.type !== "pole")) obstacles.splice(i, 1);
  }
}

// ============================================================
// RULES
// ============================================================

function runSpeed() {
  const along = Math.max(0, Math.min(1, (player.x - state.levelStartX) / LEVEL_LEN));
  let s = SPEED_START + state.sceneIndex * SPEED_STEP + along * SPEED_RAMP;
  if (s > SPEED_MAX) s = SPEED_MAX;
  // A tall phone shows less of the road, so ease off a little.
  if (viewH > viewW * 1.15) s *= 0.9;
  return s;
}

function sceneGrav() {
  const sc = sceneDef();
  return { hold: GRAVITY_HOLD * sc.grav, fall: GRAVITY_FALL * sc.grav, jump: JUMP_V * sc.jump };
}

function boxAt(px, py) {
  return { x: px - PLAYER_W / 2, y: py, w: PLAYER_W, h: PLAYER_H };
}

function hit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function overlapX(px, s) {
  const left = px - PLAYER_W / 2;
  return left < s.x + s.w && left + PLAYER_W > s.x;
}

function isPlatform(o) {
  return o.type === "block" || o.type === "q" || o.type === "pipe" || o.type === "trunk" || o.type === "pillar";
}

function pitUnder(px) {
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    if (o.type === "pit" && px > o.x + 3 && px < o.x + o.w - 3) return true;
  }
  return false;
}

function hazardBox(o) {
  return {
    x: o.x + 3,
    y: o.y + 2,
    w: Math.max(4, o.w - 6),
    h: Math.max(4, o.h - 5)
  };
}

function puffAt(x, y, color) {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 70,
      vy: 20 + Math.random() * 50,
      life: 0.35, max: 0.35,
      color: color, s: 2
    });
  }
}

function grantCoin(x, y) {
  state.coins += 1;
  state.bonus += COIN_POINTS;
  particles.push({
    x: x, y: y, vx: 0, vy: 70,
    life: 0.45, max: 0.45,
    color: "#f2c14e", s: 4, coin: true
  });
  tone(880, 0.07, "square", 0.04);
  tone(1180, 0.08, "square", 0.03);
}

function noteScore() {
  state.score = Math.floor(Math.max(0, player.x - START_X) / 8) + state.bonus;
  if (state.score > state.best) {
    state.best = state.score;
    try { localStorage.setItem(BEST_KEY, String(state.best)); }
    catch (err) { /* ignore */ }
  }
}

function die() {
  if (state.mode !== "play") return;
  noteScore();
  state.mode = "dead";
  state.deadFor = 0;
  state.shake = 1;
  for (let i = 0; i < 16; i++) {
    particles.push({
      x: player.x,
      y: player.y + 8,
      vx: (Math.random() - 0.3) * 140,
      vy: 40 + Math.random() * 150,
      life: 0.5 + Math.random() * 0.2,
      max: 0.7,
      color: i % 2 ? "#e23b3b" : "#2c3f86",
      s: 2 + (i % 3)
    });
  }
  tone(160, 0.28, "sawtooth", 0.05);
}

function beginClear() {
  if (state.mode !== "play") return;
  noteScore();
  state.mode = "clear";
  state.clearFor = 0;
  // The tune steps aside for a short pennant phrase.
  // If music is off, the old beep fanfare still marks the clear.
  if (musicOn && audioCtx) playFlagJingle();
  else fanfare();
}

function advanceScene() {
  state.sceneIndex += 1;
  state.levelStartX = player.x + 30;
  state.goalSpawned = false;
  state.patternCount = 0;
  state.cursor = player.x + 200;
  state.bannerT = 2.5;
  state.mode = "play";
  player.y = 0;
  player.prevY = 0;
  player.vy = 0;
  player.onGround = true;
  obstacles.length = 0;
  spawnAhead();
  startTune(sceneDef().id, true);
}

function moveActors(dt) {
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    if (o.dead || o.got) continue;
    const prev = o.x;
    if (o.vx) {
      o.x += o.vx * dt;
      if (o.left != null && o.right != null) {
        if (o.x < o.left) {
          o.x = o.left;
          o.vx = Math.abs(o.vx);
        } else if (o.x + o.w > o.right) {
          o.x = o.right - o.w;
          o.vx = -Math.abs(o.vx);
        }
      } else if (o.home != null && (o.x < o.home - 64 || o.x > o.home + 24)) {
        o.vx *= -1;
      }
    }
    if (o.slide && o.svx) {
      o.x += o.svx * dt;
      if (o.x < o.sLeft) {
        o.x = o.sLeft;
        o.svx = Math.abs(o.svx);
      } else if (o.x > o.sRight) {
        o.x = o.sRight;
        o.svx = -Math.abs(o.svx);
      }
    }
    if (o.type === "snap") {
      const period = o.period || 2.6;
      const cycle = ((state.clock || 0) + (o.phase || 0)) % period;
      o.out = cycle < period * 0.42;
    }
    const dx = o.x - prev;
    if (dx && o.float && player.onGround && state.mode === "play") {
      const top = o.y + o.h;
      if (Math.abs(player.y - top) < 1.5 && overlapX(player.x, o)) player.x += dx;
    }
  }
}

function resolveWalls() {
  let stepped = null;
  let blocked = false;
  for (let i = 0; i < obstacles.length; i++) {
    const s = obstacles[i];
    if (!isPlatform(s) || s.float) continue;
    if (!overlapX(player.x, s)) continue;
    const top = s.y + s.h;
    if (player.y >= top - 0.8) continue;
    if (top - player.y <= STEP_UP) {
      if (stepped == null || top > stepped) stepped = top;
    } else {
      blocked = true;
    }
  }
  if (stepped != null) {
    player.y = stepped;
    player.vy = 0;
    player.onGround = true;
    return;
  }
  if (blocked) die();
}

function tryLand() {
  let best = null;
  for (let i = 0; i < obstacles.length; i++) {
    const s = obstacles[i];
    if (!isPlatform(s)) continue;
    const top = s.y + s.h;
    if (player.prevY >= top - 4 && player.y <= top + 1 && overlapX(player.x, s)) {
      if (best == null || top > best) best = top;
    }
  }
  if (best == null) return false;
  player.y = best;
  player.vy = 0;
  player.onGround = true;
  return true;
}

function tryBump() {
  const head = player.y + PLAYER_H;
  const prevHead = player.prevY + PLAYER_H;
  for (let i = 0; i < obstacles.length; i++) {
    const s = obstacles[i];
    if (s.type !== "q" && !(s.type === "block" && s.float)) continue;
    if (prevHead <= s.y + 4 && head >= s.y && overlapX(player.x, s)) {
      player.y = s.y - PLAYER_H - 0.2;
      if (player.vy > 0) player.vy = 0;
      if (s.type === "q" && !s.used) {
        s.used = true;
        grantCoin(s.x + 3, s.y + s.h + 4);
      } else {
        tone(180, 0.05, "square", 0.03);
      }
    }
  }
}

function touchHazards() {
  const box = boxAt(player.x, player.y);
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    if (o.dead || o.got) continue;
    const enemy = o.type === "bug" || o.type === "fish" || o.type === "glider";
    if (enemy && player.vy < 0) {
      const top = o.y + o.h;
      if (player.prevY >= top - 3 && player.y <= top + 7 && overlapX(player.x, o)) {
        o.dead = true;
        player.vy = 250;
        player.y = top;
        state.bonus += STOMP_POINTS;
        puffAt(o.x + 4, top, "#f0d060");
        tone(220, 0.08, "square", 0.04);
        continue;
      }
    }
    if (o.type === "spike" || enemy || (o.type === "snap" && o.out)) {
      if (hit(box, hazardBox(o))) { die(); return; }
    }
    if (o.type === "coin" && hit(box, o)) {
      o.got = true;
      grantCoin(o.x, o.y);
    }
    if (o.type === "pole" && player.x > o.x - 6 && player.x < o.x + 16 && player.y < o.h) {
      beginClear();
      return;
    }
  }
}

function updatePlay(dt) {
  const g = sceneGrav();

  // Letting go mid-rise turns a high jump into a short hop.
  if (player.wasHolding && !holding && player.vy > 40) player.vy *= HOP_CUT;
  player.wasHolding = holding;

  if (state.jumpBuffer > 0) {
    state.jumpBuffer -= dt;
    if (player.onGround) {
      player.vy = g.jump;
      player.onGround = false;
      state.jumpBuffer = 0;
      state.hasJumped = true;
      tone(640, 0.07, "square", 0.04);
    }
  }

  player.prevY = player.y;
  player.x += runSpeed() * dt;
  resolveWalls();
  if (state.mode !== "play") return;

  const rising = player.vy > 0;
  const grav = (holding && rising) ? g.hold : g.fall;
  player.vy -= grav * dt;
  if (player.vy < -480) player.vy = -480;
  player.y += player.vy * dt;

  let grounded = false;
  if (player.vy <= 0 && tryLand()) grounded = true;
  if (!grounded && player.vy > 0) tryBump();

  if (!grounded) {
    if (!pitUnder(player.x) && player.y <= 0 && player.vy <= 0) {
      player.y = 0;
      player.vy = 0;
      player.onGround = true;
      grounded = true;
    } else if (player.y < -36) {
      die();
      return;
    } else {
      player.onGround = false;
    }
  }

  if (state.mode !== "play") return;
  touchHazards();
  if (state.mode !== "play") return;

  if (player.onGround) {
    state.stepAcc = (state.stepAcc || 0) + runSpeed() * dt;
    if (state.stepAcc > 16) {
      state.stepAcc = 0;
      particles.push({
        x: player.x - 6, y: player.y + 1,
        vx: -20, vy: 12, life: 0.25, max: 0.25,
        color: sceneDef().groundDark, s: 2
      });
    }
  }

  // Bubbles in the lagoon.
  if (sceneDef().id === "lagoon" && Math.random() < 0.08) {
    particles.push({
      x: cameraX + Math.random() * viewW,
      y: 4 + Math.random() * 20,
      vx: 4, vy: 28 + Math.random() * 20,
      life: 1.2, max: 1.2,
      color: "rgba(220,255,250,0.9)", s: 2, bubble: true
    });
  }

  noteScore();
}

function update(dt) {
  if (state.paused) return;
  state.clock = (state.clock || 0) + dt;
  moveActors(dt);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (!p.bubble) p.vy -= 40 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  if (state.bannerT > 0) state.bannerT -= dt;

  if (state.mode === "dead") {
    state.deadFor += dt;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 2.2);
    return;
  }
  if (state.mode === "clear") {
    state.clearFor += dt;
    if (player.y > 0) player.y = Math.max(0, player.y - 50 * dt);
    if (state.clearFor > 1.65) advanceScene();
    return;
  }
  if (state.mode === "title") return;

  const slices = Math.max(1, Math.ceil(dt / 0.016));
  const step = dt / slices;
  for (let i = 0; i < slices; i++) {
    if (state.mode !== "play") return;
    updatePlay(step);
  }
  cameraX = player.x - viewW * FOCUS;
  spawnAhead();
  prune();
}

function resetRun() {
  player.x = START_X;
  player.y = 0;
  player.prevY = 0;
  player.vy = 0;
  player.onGround = true;
  player.wasHolding = false;
  holding = false;
  state.sceneIndex = 0;
  state.levelStartX = START_X;
  state.goalSpawned = false;
  state.score = 0;
  state.bonus = 0;
  state.coins = 0;
  state.jumpBuffer = 0;
  state.cursor = START_X + 180;
  state.patternCount = 0;
  state.deadFor = 0;
  state.clearFor = 0;
  state.shake = 0;
  state.bannerT = 2.6;
  state.stepAcc = 0;
  state.clock = 0;
  state.paused = false;
  state.bestAtStart = state.best;
  obstacles.length = 0;
  particles.length = 0;
  cameraX = player.x - viewW * FOCUS;
  spawnAhead();
}

// ============================================================
// DRAWING
// ============================================================

function horizon() {
  const tall = viewH > viewW * 1.15;
  return Math.round(viewH * (tall ? 0.62 : 0.74));
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
  const shifts = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let i = 0; i < shifts.length; i++) {
    drawSprite(rows, x + shifts[i][0], y + shifts[i][1], function (ch) {
      return ch === "." ? null : sceneDef().ink;
    });
  }
  drawSprite(rows, x, y, cruzioColor);
}

function drawText(text, x, y, scale, color) {
  const s = String(text).toUpperCase();
  ctx.fillStyle = color;
  let cx = x;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === " ") { cx += 3 * scale; continue; }
    const rows = glyphRows(s[i]);
    if (!rows) { cx += 4 * scale; continue; }
    const gw = rows[0].length;
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < gw; c++) {
        if (rows[r][c] === "1") ctx.fillRect(cx + c * scale, y + r * scale, scale, scale);
      }
    }
    cx += gw * scale + scale;
  }
}

function drawLabel(text, x, y, scale) {
  const paper = sceneDef().id === "night" ? "#1a1840" : "#f7fbff";
  drawText(text, x - 1, y, scale, paper);
  drawText(text, x + 1, y, scale, paper);
  drawText(text, x, y - 1, scale, paper);
  drawText(text, x, y + 1, scale, paper);
  drawText(text, x, y, scale, sceneDef().ink);
}

function fillDisk(cx, cy, r, color, clipBottom) {
  ctx.fillStyle = color;
  const limit = clipBottom == null ? r : clipBottom;
  for (let dy = -r; dy <= limit; dy++) {
    const hw = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)));
    ctx.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
  }
}

function worldY(feetUp) {
  return horizon() - feetUp;
}

function drawGround(cam) {
  const sc = sceneDef();
  const gy = horizon();
  ctx.fillStyle = sc.ground;
  ctx.fillRect(0, gy, viewW, viewH - gy);
  ctx.fillStyle = sc.groundDark;
  ctx.fillRect(0, gy + 14, viewW, 3);
  ctx.fillStyle = sc.grass;
  ctx.fillRect(0, gy, viewW, 4);
  ctx.fillStyle = sc.grassDark;
  ctx.fillRect(0, gy + 4, viewW, 2);

  // Pits cut a hole through the floor.
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    if (o.type !== "pit") continue;
    const x = Math.round(o.x - cam);
    ctx.fillStyle = sc.sky;
    if (sc.id === "lagoon") ctx.fillStyle = "#0c3c50";
    if (sc.id === "night") ctx.fillStyle = "#07060f";
    if (sc.id === "canopy") ctx.fillStyle = "#102010";
    ctx.fillRect(x, gy, o.w, viewH - gy);
  }

  const period = 20;
  const shift = Math.floor(cam) % period;
  for (let x = -shift; x < viewW; x += period) {
    ctx.fillStyle = sc.grassDark;
    ctx.fillRect(x + 6, gy + 1, 2, 2);
    ctx.fillStyle = sc.groundDark;
    ctx.fillRect(x + 3, gy + 20, 3, 2);
  }
}

function drawBackdrop(cam) {
  const sc = sceneDef();
  const gy = horizon();
  ctx.fillStyle = sc.sky;
  ctx.fillRect(0, 0, viewW, viewH);

  if (sc.id === "night") {
    ctx.fillStyle = sc.accent;
    fillDisk(viewW - 36, 28, 10, sc.accent);
    ctx.fillStyle = sc.sky;
    fillDisk(viewW - 32, 26, 8, sc.sky);
    ctx.fillStyle = "#f4f0e8";
    for (let i = 0; i < 12; i++) {
      const sx = (i * 47 + Math.floor(cam * 0.02)) % viewW;
      ctx.fillRect(sx, 12 + (i * 17) % 40, 1, 1);
    }
  }

  if (sc.id === "lagoon") {
    // Soft bands so the water reads as water.
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let y = 20; y < gy; y += 14) ctx.fillRect(0, y, viewW, 2);
  }

  if (sc.id === "lagoon") {
    // Coral silhouettes along the floor of the lagoon.
    const shift = Math.floor(cam * 0.3) % 70;
    ctx.fillStyle = sc.hill;
    for (let i = -1; i < 12; i++) {
      const x = i * 70 - shift;
      ctx.fillRect(x + 10, gy - 18, 4, 18);
      ctx.fillRect(x, gy - 12, 8, 4);
      ctx.fillRect(x + 16, gy - 16, 6, 4);
    }
  } else if (sc.id !== "cloudway") {
    const shift = (cam * 0.25) % 400;
    for (let i = -1; i < 6; i++) {
      const hx = i * 90 - shift;
      const hr = sc.id === "night" ? 18 : 26;
      ctx.fillStyle = sc.hillFar;
      for (let rise = 0; rise < hr; rise++) {
        const half = Math.round(Math.sqrt(Math.max(0, hr * hr - rise * rise)));
        ctx.fillRect(Math.round(hx - half), gy - 1 - rise, half * 2, 1);
      }
    }
  }

  if (sc.id !== "lagoon") {
    const cloudShift = (cam * 0.15) % 360;
    for (let i = 0; i < 5; i++) {
      const cx = i * 110 - cloudShift;
      const cy = 18 + (i % 3) * 16;
      fillDisk(cx, cy, 10, sc.cloud, 2);
      fillDisk(cx + 10, cy + 2, 7, sc.cloud, 2);
      ctx.fillStyle = sc.cloudShade;
      ctx.fillRect(cx - 8, cy + 2, 16, 1);
    }
  }
}

function drawPipe(o, x, top) {
  const sc = sceneDef();
  const capH = 6;
  const lip = 2;
  ctx.fillStyle = sc.pipe;
  ctx.fillRect(x + lip, top + capH, o.w - lip * 2, o.h - capH);
  ctx.fillStyle = sc.pipeLite;
  ctx.fillRect(x + lip, top + capH, 3, o.h - capH);
  ctx.fillStyle = sc.pipeDark;
  ctx.fillRect(x + o.w - lip - 3, top + capH, 3, o.h - capH);
  ctx.fillStyle = sc.pipe;
  ctx.fillRect(x, top, o.w, capH);
  ctx.fillStyle = sc.pipeDark;
  ctx.fillRect(x, top, o.w, 2);
  ctx.fillRect(x, top + capH - 2, o.w, 2);
}

function drawTrunk(o, x, top) {
  const sc = sceneDef();
  ctx.fillStyle = sc.pipeDark;
  ctx.fillRect(x, top, o.w, o.h);
  ctx.fillStyle = sc.pipeLite;
  ctx.fillRect(x, top, 3, o.h);
  // Grassy cap.
  ctx.fillStyle = sc.grass;
  fillDisk(x + Math.floor(o.w / 2), top + 2, Math.floor(o.w / 2) + 4, sc.grass, 3);
  ctx.fillStyle = sc.grassDark;
  ctx.fillRect(x - 2, top + 2, o.w + 4, 2);
}

function drawBlock(o, x, top) {
  const sc = sceneDef();
  if (o.cloud) {
    fillDisk(x + o.w / 2, top + 6, 14, sc.cloud, 4);
    ctx.fillStyle = sc.cloudShade;
    ctx.fillRect(x, top + o.h - 3, o.w, 3);
    return;
  }
  if (o.shroom) {
    const mid = x + Math.floor(o.w / 2);
    fillDisk(mid, top + 8, Math.floor(o.w / 2) - 2, sc.brick, 6);
    ctx.fillStyle = sc.accent;
    fillDisk(mid - 16, top + 6, 4, sc.accent);
    fillDisk(mid + 14, top + 5, 3, sc.accent);
    fillDisk(mid, top + 3, 3, sc.accent);
    return;
  }
  if (o.leaf) {
    ctx.fillStyle = sc.grassDark;
    ctx.fillRect(x, top + 4, o.w, o.h - 2);
    ctx.fillStyle = sc.grass;
    fillDisk(x + o.w / 2, top + 6, Math.floor(o.w / 2), sc.grass, 4);
    ctx.fillStyle = sc.hillShade;
    ctx.fillRect(x + 6, top + o.h - 3, o.w - 12, 2);
    return;
  }
  ctx.fillStyle = sc.mortar;
  ctx.fillRect(x, top, o.w, o.h);
  ctx.fillStyle = sc.brick;
  ctx.fillRect(x + 1, top + 1, o.w - 2, o.h - 2);
  ctx.fillStyle = sc.brickLite;
  ctx.fillRect(x + 1, top + 1, o.w - 2, 1);
  ctx.fillStyle = sc.ink;
  ctx.fillRect(x, top, o.w, 1);
  ctx.fillRect(x, top, 1, o.h);
  if (o.slide) {
    ctx.fillStyle = sc.ink;
    ctx.fillRect(x + 4, top + o.h - 3, 5, 3);
    ctx.fillRect(x + o.w - 9, top + o.h - 3, 5, 3);
    ctx.fillStyle = sc.accent;
    ctx.fillRect(x + 5, top + o.h - 2, 3, 2);
    ctx.fillRect(x + o.w - 8, top + o.h - 2, 3, 2);
  }
}

function drawQ(o, x, top) {
  const sc = sceneDef();
  ctx.fillStyle = o.used ? sc.groundDark : sc.brick;
  ctx.fillRect(x, top, 16, 16);
  ctx.fillStyle = o.used ? sc.ground : "#f2c14e";
  ctx.fillRect(x + 2, top + 2, 12, 12);
  if (o.used) return;
  ctx.fillStyle = "#5c3410";
  const mark = ["01110", "10001", "00010", "00100", "00000", "00100"];
  for (let r = 0; r < mark.length; r++) {
    for (let c = 0; c < 5; c++) {
      if (mark[r][c] === "1") ctx.fillRect(x + 5 + c, top + 4 + r, 1, 1);
    }
  }
}

// How strongly the bright edge glows. The dark red under it always stays.
function hazardAlpha() {
  if (reduceMotion) return 1;
  return 0.78 + 0.22 * Math.sin(performance.now() / 280);
}

// Red means "touching this hurts."
// kind "all"  = every side is dangerous (spikes).
// kind "stomp" = sides and bottom are dangerous, the top is safe to land on.
function drawDangerBox(x, top, w, h, kind) {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#8d0014";
  ctx.fillRect(x - 2, top, 2, h);
  ctx.fillRect(x + w, top, 2, h);
  ctx.fillRect(x - 2, top + h, w + 4, 2);
  ctx.globalAlpha = hazardAlpha();
  ctx.fillStyle = "#ff2424";
  ctx.fillRect(x - 2, top, 2, h);
  ctx.fillRect(x + w, top, 2, h);
  ctx.fillRect(x - 2, top + h, w + 4, 2);
  if (kind === "stomp") {
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#146b32";
    ctx.fillRect(x - 2, top - 3, w + 4, 3);
    ctx.globalAlpha = hazardAlpha();
    ctx.fillStyle = "#39ff6a";
    ctx.fillRect(x - 2, top - 3, w + 4, 3);
    const mid = x + Math.floor(w / 2) - 1;
    ctx.fillRect(mid, top - 7, 2, 3);
    ctx.fillRect(mid - 2, top - 5, 6, 2);
  } else {
    ctx.fillRect(x - 2, top - 2, w + 4, 2);
  }
  ctx.restore();
}

function drawSnap(o, x) {
  const sc = sceneDef();
  if (!o.out) {
    // A closed bud at the lip. It is not dangerous while it is tucked in.
    const lip = worldY(o.y + 5);
    ctx.fillStyle = "#9a2438";
    ctx.fillRect(x + 2, lip, o.w - 4, 4);
    ctx.fillStyle = "#e23b4a";
    ctx.fillRect(x + 3, lip + 1, o.w - 6, 2);
    return;
  }
  const top = worldY(o.y + o.h);
  ctx.fillStyle = sc.grassDark || "#1f7a32";
  ctx.fillRect(x + 5, top + 10, o.w - 10, o.h - 10);
  ctx.fillStyle = "#3aaa4a";
  ctx.fillRect(x + 6, top + 10, 2, o.h - 10);
  fillDisk(x + o.w / 2, top + 9, 7, "#e23b4a");
  ctx.fillStyle = "#ffd0a8";
  ctx.fillRect(x + 3, top + 8, o.w - 6, 2);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(x + 3, top + 5, 2, 2);
  ctx.fillRect(x + o.w - 5, top + 5, 2, 2);
  ctx.fillStyle = "#fff6e8";
  ctx.fillRect(x + 3, top + 4, 1, 1);
  ctx.fillRect(x + o.w - 4, top + 4, 1, 1);
  drawDangerBox(x, top, o.w, o.h, "all");
}

function drawSpike(o, x) {
  const base = worldY(o.y);
  // A slightly bigger red triangle sits behind the spike, so the point reads as danger.
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#8d0014";
  for (let i = -2; i <= o.h + 1; i++) {
    const y = base - 1 - i;
    const half = Math.max(2, Math.round(((o.w / 2) + 3) * (1 - (i + 2) / (o.h + 4))));
    const cx = x + o.w / 2;
    ctx.fillRect(Math.round(cx - half), y, half * 2, 1);
  }
  ctx.globalAlpha = hazardAlpha();
  ctx.fillStyle = "#ff2424";
  for (let i = -1; i <= o.h; i++) {
    const y = base - 1 - i;
    const half = Math.max(2, Math.round(((o.w / 2) + 2) * (1 - (i + 1) / (o.h + 2))));
    const cx = x + o.w / 2;
    ctx.fillRect(Math.round(cx - half), y, half * 2, 1);
  }
  ctx.restore();
  for (let i = 0; i < o.h; i++) {
    const y = base - 1 - i;
    const half = Math.max(1, Math.round((o.w / 2) * (1 - i / o.h)));
    const cx = x + o.w / 2;
    ctx.fillStyle = "#dfe6ee";
    ctx.fillRect(Math.round(cx - half), y, half * 2, 1);
    ctx.fillStyle = "#2a3038";
    ctx.fillRect(Math.round(cx + half - 1), y, 1, 1);
  }
}

function drawPitDanger(o, x) {
  const gy = horizon();
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#8d0014";
  ctx.fillRect(x, gy, o.w, 3);
  ctx.fillRect(x, gy, 3, 14);
  ctx.fillRect(x + o.w - 3, gy, 3, 14);
  ctx.globalAlpha = hazardAlpha();
  ctx.fillStyle = "#ff2424";
  ctx.fillRect(x, gy, o.w, 2);
  ctx.fillRect(x, gy, 2, 12);
  ctx.fillRect(x + o.w - 2, gy, 2, 12);
  ctx.restore();
}

function drawCoin(o, x) {
  if (o.got) return;
  const y = worldY(o.y + o.h) ;
  fillDisk(x + 5, y + 5, 4, "#f2c14e");
  ctx.fillStyle = "#a56a18";
  ctx.fillRect(x + 4, y + 3, 2, 4);
}

function drawPole(o, x) {
  const top = worldY(o.h);
  const base = worldY(0);
  ctx.fillStyle = "#f4f7fb";
  ctx.fillRect(x + 3, top, 2, base - top);
  ctx.fillStyle = "#e23b3b";
  ctx.beginPath();
  // Triangle pennant, original, not a copied flag.
  ctx.fillRect(x + 5, top + 2, 10, 2);
  ctx.fillRect(x + 5, top + 4, 8, 2);
  ctx.fillRect(x + 5, top + 6, 6, 2);
  ctx.fillRect(x + 5, top + 8, 3, 2);
}

function drawDeco(o, x) {
  const sc = sceneDef();
  const top = worldY(o.y + o.h);
  ctx.fillStyle = sc.accent;
  ctx.fillRect(x + 4, top, 4, o.h);
  ctx.fillRect(x, top + 4, 6, 3);
  ctx.fillRect(x + 8, top + 8, 6, 3);
}

function drawObstacles(cam) {
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    if (o.dead || o.got) continue;
    const x = Math.round(o.x - cam);
    if (x > viewW + 40 || x + (o.w || 10) < -40) continue;
    const top = worldY((o.y || 0) + (o.h || 0));
    if (o.type === "pipe" || (o.type === "pillar" && !o.stem)) {
      if (o.stem) {
        const sc = sceneDef();
        ctx.fillStyle = sc.pipe;
        ctx.fillRect(x, worldY(o.h), o.w, o.h);
        ctx.fillStyle = sc.pipeLite;
        ctx.fillRect(x, worldY(o.h), 3, o.h);
      } else drawPipe(o, x, top);
    } else if (o.type === "trunk") drawTrunk(o, x, top);
    else if (o.type === "pillar") drawPipe(o, x, top);
    else if (o.type === "block") drawBlock(o, x, top);
    else if (o.type === "q") drawQ(o, x, top);
    else if (o.type === "spike") drawSpike(o, x);
    else if (o.type === "pit") drawPitDanger(o, x);
    else if (o.type === "coin") drawCoin(o, x);
    else if (o.type === "pole") drawPole(o, x);
    else if (o.type === "deco") drawDeco(o, x);
    else if (o.type === "snap") drawSnap(o, x);
    else if (o.type === "bug" || o.type === "fish" || o.type === "glider") {
      const art = o.type === "bug" ? BUG_SPRITE : o.type === "fish" ? FISH_SPRITE : GLIDER_SPRITE;
      const paint = o.type === "bug" ? bugColor : o.type === "fish" ? fishColor : gliderColor;
      const bob = o.type === "glider" ? Math.floor(performance.now() / 180) % 2 : 0;
      const top = worldY(o.y + art.length) + bob;
      drawSprite(art, x, top, paint);
      // These three can be stomped. Sides stay red. The green top means "land here."
      drawDangerBox(x, top, art[0].length, art.length, "stomp");
    }
  }
}

function drawHero(cam) {
  const rows = !player.onGround ? SPRITE.jump : (Math.floor(player.x / 10) % 2 === 0 ? SPRITE.runA : SPRITE.runB);
  const destX = Math.round(player.x - cam - rows[0].length / 2);
  const destY = Math.round(worldY(player.y) - rows.length);
  if (state.mode === "dead" && Math.floor(state.deadFor * 12) % 2 === 0) return;
  const gy = worldY(player.y);
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = sceneDef().ink;
  ctx.fillRect(destX + 3, Math.min(gy, horizon()) - 2, 8, 2);
  ctx.globalAlpha = 1;
  drawCruzio(rows, destX, destY);
}

function drawParticles(cam) {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    const x = Math.round(p.x - cam);
    const y = Math.round(worldY(p.y) - p.s);
    if (p.coin) fillDisk(x, y, 3, "#f2c14e");
    else if (p.bubble) {
      ctx.strokeStyle = p.color;
      fillDisk(x, y, p.s, "rgba(255,255,255,0.35)");
    } else ctx.fillRect(x, y, p.s, p.s);
  }
  ctx.globalAlpha = 1;
}

function hudTop() {
  return Math.round(50 * (viewH / Math.max(1, cssH)) + 4);
}

function hudScale() {
  // A tall phone is only about 150 pixels wide inside the game.
  // Scale 2 labels would crash into each other there.
  return viewW < 240 ? 1 : 2;
}

function drawHud() {
  if (state.mode === "title" || state.mode === "clear") return;
  const y = hudTop();
  const scale = hudScale();
  const score = "SCORE " + state.score;
  const best = "BEST " + state.best;
  const coin = "COIN " + state.coins;
  const stage = stageLabel();
  drawLabel(score, viewW - 8 - textWidth(score, scale), y, scale);
  drawLabel(best, viewW - 8 - textWidth(best, scale), y + scale * 5 + 4, scale);
  drawLabel(coin, 8, y, scale);
  const stageW = textWidth(stage, scale);
  drawLabel(stage, Math.round((viewW - stageW) / 2), y, scale);
  if (state.mode === "play" && !state.hasJumped) {
    const hint = "HOLD TO JUMP";
    drawLabel(hint, Math.round((viewW - textWidth(hint, 2)) / 2), horizon() - 64, 2);
  }
}

function drawPanel(x, y, w, h) {
  ctx.fillStyle = "#f7fbff";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#142033";
  ctx.fillRect(x, y, w, 2);
  ctx.fillRect(x, y + h - 2, w, 2);
  ctx.fillRect(x, y, 2, h);
  ctx.fillRect(x + w - 2, y, 2, h);
}

function drawGate(cx, gy) {
  // A small original gate: two towers, a door, a pennant.
  ctx.fillStyle = "#5a5e78";
  ctx.fillRect(cx - 22, gy - 28, 10, 28);
  ctx.fillRect(cx + 12, gy - 28, 10, 28);
  ctx.fillRect(cx - 22, gy - 32, 44, 6);
  ctx.fillStyle = "#2e3248";
  ctx.fillRect(cx - 6, gy - 16, 12, 16);
  ctx.fillStyle = "#e23b3b";
  ctx.fillRect(cx + 16, gy - 40, 2, 10);
  ctx.fillRect(cx + 18, gy - 40, 8, 2);
  ctx.fillRect(cx + 18, gy - 38, 6, 2);
}

function drawMessage(lines) {
  const gap = 6;
  let blockW = 0;
  let blockH = 0;
  const widths = [];
  for (let i = 0; i < lines.length; i++) {
    const w = textWidth(lines[i].text, lines[i].scale);
    widths.push(w);
    if (w > blockW) blockW = w;
    blockH += lines[i].scale * 5;
  }
  blockH += gap * (lines.length - 1);
  const pad = 10;
  let s = 1;
  while (s === 1 && blockW + pad * 2 > viewW - 8) {
    // Shrink by asking callers to use small scales. Clamp the panel.
    break;
  }
  const x = Math.round((viewW - blockW) / 2) - pad;
  const y = Math.round(horizon() * 0.22);
  drawPanel(x, y - pad, blockW + pad * 2, blockH + pad * 2);
  let cy = y;
  for (let i = 0; i < lines.length; i++) {
    drawText(lines[i].text, Math.round((viewW - widths[i]) / 2), cy, lines[i].scale, "#142033");
    cy += lines[i].scale * 5 + gap;
  }
}

function drawBanner() {
  if (state.bannerT <= 0 || state.mode === "title" || state.mode === "dead") return;
  const sc = sceneDef();
  const title = stageNumber() + " " + sc.name;
  const scale = textWidth(title, 2) < viewW - 24 ? 2 : 1;
  // Under both score lines, so it does not sit on top of BEST or the stage number.
  const hud = hudScale();
  const y = hudTop() + (hud * 5 + 4) * 2 + 6;
  drawLabel(title, Math.round((viewW - textWidth(title, scale)) / 2), y, scale);
}

function drawOverlay() {
  if (state.mode === "title") {
    const hint = "RED HURTS. STOMP GREEN TOPS.";
    const hintScale = textWidth(hint, 2) <= viewW - 28 ? 2 : 1;
    drawMessage([
      { text: "CRUZIO DASH", scale: viewW > 280 ? 3 : 2 },
      { text: "HOLD TO JUMP", scale: 2 },
      { text: hint, scale: hintScale },
      { text: "BEST " + state.best, scale: 2 }
    ]);
    return;
  }
  if (state.mode === "dead") {
    ctx.fillStyle = "rgba(20, 32, 51, 0.45)";
    ctx.fillRect(0, 0, viewW, viewH);
    const record = state.score > state.bestAtStart;
    drawMessage([
      { text: "GAME OVER", scale: 2 },
      { text: "SCORE " + state.score, scale: 2 },
      { text: record ? "NEW BEST" : "BEST " + state.best, scale: 2 },
      { text: "TAP TO RETRY", scale: 2 }
    ]);
    return;
  }
  if (state.mode === "clear") {
    ctx.fillStyle = "rgba(20, 32, 51, 0.35)";
    ctx.fillRect(0, 0, viewW, viewH);
    const nextIndex = state.sceneIndex + 1;
    const next = SCENES[nextIndex % SCENES.length];
    const nextLabel = (Math.floor(nextIndex / SCENES.length) + 1) + "-" + ((nextIndex % SCENES.length) + 1);
    drawGate(Math.round(viewW / 2), Math.round(horizon() * 0.55));
    drawMessage([
      { text: "CLEAR", scale: 3 },
      { text: "NEXT " + nextLabel, scale: 2 },
      { text: next.name, scale: 2 }
    ]);
  }
}

function render() {
  const sc = sceneDef();
  if (state.mode === "title") cameraX += 0; // scenery can sit still
  const cam = state.mode === "title" ? (state.preview || 0) : cameraX;
  if (state.mode === "title") {
    player.x = cam + viewW * FOCUS;
    player.y = 0;
    player.onGround = true;
  }

  drawBackdrop(cam);
  drawGround(cam);
  if (state.mode !== "title") drawObstacles(cam);
  drawHero(cam);
  drawParticles(cam);
  drawHud();
  drawBanner();
  drawOverlay();

  if (!out) return;
  out.imageSmoothingEnabled = false;
  out.fillStyle = sc.sky;
  out.fillRect(0, 0, canvas.width, canvas.height);
  let ox = 0;
  let oy = 0;
  if (state.shake > 0 && !reduceMotion) {
    const mag = state.shake * 6 * (canvas.width / viewW);
    ox = (Math.random() - 0.5) * mag;
    oy = (Math.random() - 0.5) * mag;
  }
  out.drawImage(buffer, ox, oy, canvas.width, canvas.height);
}

// ============================================================
// FIT THE SCREEN
// ============================================================

function fitView(w, h) {
  const aspect = w / Math.max(1, h);
  const minW = 150;
  const baseH = 168;
  if (aspect < 1) return { viewW: minW, viewH: Math.max(baseH, Math.round(minW / aspect)) };
  return { viewW: Math.max(minW, Math.round(baseH * aspect)), viewH: baseH };
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
  if (!canvas) return;
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
  const slide = "translate(" + Math.round(box.x) + "px," + Math.round(box.y) + "px)";
  const home = document.getElementById("home");
  const soundbar = document.getElementById("soundbar");
  if (home) home.style.transform = slide;
  if (soundbar) soundbar.style.transform = slide;
  if (state.mode === "play") {
    cameraX = player.x - viewW * FOCUS;
    spawnAhead();
  }
  window.scrollTo(0, 0);
}

function tick(now) {
  if (!lastTime) lastTime = now;
  let dt = (now - lastTime) / 1000;
  lastTime = now;
  if (dt > 0.05) dt = 0.05;
  if (dt < 0) dt = 0;
  if (state.mode === "title") state.preview = (state.preview || 0) + dt * 24;
  update(dt);
  render();
  requestAnimationFrame(tick);
}

function boot() {
  canvas = document.getElementById("game");
  out = canvas.getContext("2d");
  buffer = document.createElement("canvas");
  ctx = buffer.getContext("2d");
  reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  muted = loadMute();
  musicOn = loadMusic();
  paintMute();
  paintMusic();
  try { state.best = parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0; }
  catch (err) { state.best = 0; }
  state.bestAtStart = state.best;
  bindInput();
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", function () {
    setTimeout(resize, 60);
    setTimeout(resize, 280);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resize);
    window.visualViewport.addEventListener("scroll", resize);
  }
  document.addEventListener("visibilitychange", function () {
    lastTime = 0;
    if (document.hidden) {
      noteScore();
      // Drop scheduled notes so they do not burst when the tab returns.
      if (musicTimer) {
        clearInterval(musicTimer);
        musicTimer = null;
      }
      stopVoices();
      musicMode = "";
      return;
    }
    if (musicOn && audioCtx && state.mode === "play") startTune(sceneDef().id, true);
  });
  requestAnimationFrame(tick);
}

// The test runner calls these. The page calls boot.
const api = {
  JUMP_V: JUMP_V,
  GRAVITY_HOLD: GRAVITY_HOLD,
  GRAVITY_FALL: GRAVITY_FALL,
  PLAYER_W: PLAYER_W,
  PLAYER_H: PLAYER_H,
  STEP_UP: STEP_UP,
  LEVEL_LEN: LEVEL_LEN,
  MIN_GAP: MIN_GAP,
  SCENES: SCENES,
  player: player,
  state: state,
  obstacles: obstacles,
  makePattern: makePattern,
  resetRun: resetRun,
  update: update,
  spawnAhead: spawnAhead,
  runSpeed: runSpeed,
  sceneDef: sceneDef,
  stageLabel: stageLabel,
  stageHeat: stageHeat,
  gapForHeat: gapForHeat,
  kindsFor: kindsFor,
  pickKind: pickKind,
  worldNumber: worldNumber,
  setHolding: function (v) { holding = v; },
  getHolding: function () { return holding; },
  setView: function (w, h) { viewW = w; viewH = h; },
  setCamera: function (x) { cameraX = x; },
  getView: function () { return { w: viewW, h: viewH }; },
  previewStage: previewStage,
  pitUnder: pitUnder,
  die: die,
  particles: particles
};

function previewStage(sceneIndex, along) {
  const a = along == null ? 0 : along;
  state.mode = "play";
  state.sceneIndex = sceneIndex;
  state.levelStartX = START_X - a * LEVEL_LEN;
  state.goalSpawned = false;
  state.patternCount = 0;
  state.score = 120;
  state.coins = 3;
  state.cursor = START_X + 24;
  state.bannerT = 3.2;
  state.hasJumped = true;
  state.clock = 0.4;
  state.jumpBuffer = 0;
  player.x = START_X;
  player.y = 0;
  player.prevY = 0;
  player.vy = 0;
  player.onGround = true;
  player.wasHolding = false;
  holding = false;
  obstacles.length = 0;
  particles.length = 0;
  cameraX = player.x - viewW * FOCUS;
  spawnAhead();
}

if (typeof globalThis !== "undefined") globalThis.Cruzio = api;

if (typeof document !== "undefined" && !globalThis.CRUZIO_TEST) boot();
