// Turkey Run — Escape the Thanksgiving Table.
// config.js: every tuned number of the game in one place, so the
// runner's feel (speed, gravity, spawn rhythm, scoring) can be
// balanced without touching the world or the renderer.

export const VIEW = {
  width: 1280,
  height: 720,
  groundY: 600,
};

export const RUN = {
  // How far the turkey must run to reach the barn and escape, in metres.
  escapeDistanceM: 1200,
  // Pixels the world scrolls for one metre of distance.
  pxPerMetre: 50,
  // Turkey's fixed screen position; the world scrolls past it.
  turkeyX: 280,
  // Running speed in px/s at the start, and how it grows.
  startSpeed: 340,
  maxSpeed: 640,
  speedGainPerMetre: 0.24,
  // How many seconds of clean running buy the turkey one extra metre
  // of gap from the farmer, and how far back the farmer can fall.
  farmerRecoverPxPerSec: 8,
  farmerMaxGapPx: 190,
  // Farmer closes this far on every hit; gap 26 or less means caught.
  // Three hits close 180 of the 190 gap, so the third hit catches.
  farmerCloseOnHitPx: 60,
  farmerCatchGapPx: 26,
};

export const TURKEY = {
  width: 92,
  height: 96,
  // Standing hitbox is taller than the sliding one.
  slideHeight: 52,
  gravityPxPerSec2: 2600,
  jumpVelocityPxPerSec: -1080,
  // A jump may be buffered slightly before landing, and held a touch
  // longer for a higher jump (variable jump height).
  jumpBufferSec: 0.12,
  jumpCutVelocity: -320,
  slideSec: 0.85,
  slideCooldownSec: 0.15,
  // Forgiving hitbox: shrink the sprite box by this many px per side.
  hitShrinkPx: 14,
};

export const OBSTACLES = {
  oven: { width: 118, height: 96, score: 0 },
  fence: { width: 54, height: 74, score: 0 },
  hay: { width: 96, height: 58, score: 0 },
  knifeFly: { width: 110, height: 30, score: 0 },
  knifeFall: { width: 34, height: 96, score: 0 },
};

export const PICKUPS = {
  corn: { width: 44, height: 44, score: 100, farmerPushPx: 18 },
  pie: { width: 52, height: 44, score: 250, farmerPushPx: 30 },
  feather: { width: 40, height: 48, score: 500, farmerPushPx: 44 },
};

export const SCORE = {
  perMetre: 10,
  // Bonus for clearing an obstacle without a hit is folded into distance.
  escapeBonus: 5000,
};

export const SPAWN = {
  // Seconds between spawn waves at the start, shrinking with distance.
  // A wave gap must stay above the jump's air time (0.83 s) with room
  // to react, or the turkey lands on the next wave's obstacle.
  gapStartSec: 1.5,
  gapMinSec: 1.05,
  gapShrinkPerMetre: 0.00035,
  // First obstacle appears this far ahead of the turkey, in px.
  firstObstaclePx: 900,
};

export const SHOTS = {
  // Fixed-step seconds each screenshot scene simulates before freezing.
  playSeconds: 14,
  // The escaped shot plays a full winning run with a perfect pilot.
  escapeSeconds: 240,
  caughtSeconds: 30,
};
