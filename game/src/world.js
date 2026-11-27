// Turkey Run — the simulation.
// world.js: the turkey, the farmer, the obstacles and the pickups.
// Pure fixed-step logic with no drawing and no sound: step(state, dt)
// advances the run, and the renderer only ever reads the state.
// That split is what makes the screenshot scenes reproducible — the
// same seed and the same inputs always give the same frame.

import { OBSTACLES, PICKUPS, RUN, SCORE, SPAWN, TURKEY, VIEW } from './config.js';
import { chance, makeRng, pick, range } from './random.js';

export const STATE_TITLE = 'title';
export const STATE_PLAY = 'play';
export const STATE_CAUGHT = 'caught';
export const STATE_ESCAPED = 'escaped';

export const KIND_OVEN = 'oven';
export const KIND_FENCE = 'fence';
export const KIND_HAY = 'hay';
export const KIND_KNIFE_FLY = 'knifeFly';
export const KIND_KNIFE_FALL = 'knifeFall';
export const KIND_CORN = 'corn';
export const KIND_PIE = 'pie';
export const KIND_FEATHER = 'feather';

export function newRun(seed) {
  const rng = makeRng(seed);
  return {
    screen: STATE_PLAY,
    seed,
    rng,
    time: 0,
    distanceM: 0,
    score: 0,
    lives: 3,
    cornCount: 0,
    pieCount: 0,
    featherCount: 0,
    obstaclesCleared: 0,
    speed: RUN.startSpeed,
    farmerGapPx: RUN.farmerMaxGapPx,
    spawnTimer: 0.9,
    lastWaveJumpable: false,
    shakeSec: 0,
    invulnerableSec: 0,
    paused: false,
    // Title-screen ambience and the end-screen confetti share this clock.
    ambientTime: 0,
    turkey: {
      x: RUN.turkeyX,
      y: VIEW.groundY - TURKEY.height,
      vy: 0,
      onGround: true,
      sliding: false,
      slideTimer: 0,
      slideCooldown: 0,
      jumpBuffer: 0,
      runPhase: 0,
      squash: 0,
    },
    farmer: {
      runPhase: 0,
      lunge: 0,
      caughtPose: false,
    },
    obstacles: [],
    pickups: [],
    particles: [],
    events: [],
    flash: null,
  };
}

export function turkeyBox(state) {
  const t = state.turkey;
  const height = t.sliding ? TURKEY.slideHeight : TURKEY.height;
  // t.y is the sprite's top: standing it is groundY - height, and a
  // jump lifts it, so the hitbox lifts with the turkey.
  const y = t.y + (TURKEY.height - height);
  const s = TURKEY.hitShrinkPx;
  return { x: t.x + s, y: y + s * 0.5, w: TURKEY.width - s * 2, h: height - s };
}

function obstacleBox(ob) {
  const spec = OBSTACLES[ob.kind];
  const s = 10;
  return { x: ob.x + s, y: ob.y + 4, w: spec.width - s * 2, h: spec.height - 4 };
}

function boxesOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function spawnWave(state) {
  const rng = state.rng;
  const d = state.distanceM;
  const x = VIEW.width + range(rng, 40, 160);
  const roll = rng();
  // Which waves force a jump: the next wave must know, so a flying
  // knife is never spawned right behind one.
  let jumpableWave = false;
  // The wave's width in px, from its first obstacle to its last
  // pickup: the next wave waits until this width plus a gap has
  // scrolled past, so waves never overlap each other.
  let width = 0;
  if (roll < 0.34) {
    jumpableWave = true;
    width = 118;
    // A hot oven on the ground: jump it, never run through it.
    state.obstacles.push({ kind: KIND_OVEN, x, y: VIEW.groundY - OBSTACLES.oven.height, vx: 0, active: true, passed: false });
    if (chance(rng, 0.55)) { addCornArc(state, x + 30, 0.5); width = 214; }
  } else if (roll < 0.55) {
    // A carving knife flying at head height: slide under it. Never
    // right after a jumpable wave: a turkey mid-jump over an oven
    // cannot slide, so that pairing would be an unfair hit.
    if (state.lastWaveJumpable) {
      addCornLine(state, x, 5);
      width = 260;
    } else {
      width = 110;
      state.obstacles.push({ kind: KIND_KNIFE_FLY, x, y: VIEW.groundY - 100, vx: 0, active: true, passed: false });
      if (chance(rng, 0.5)) { addCornArc(state, x + 10, 0.15); width = 194; }
    }
  } else if (roll < 0.72) {
    jumpableWave = true;
    width = 616;
    // Fence plus hay bale: two jumps in a row, spaced so the turkey
    // can land between them and jump again (jump buffering covers it).
    // 520 px apart: a jump travels up to ~530 px at top speed, so the
    // turkey lands with room to see the hay and jump it, instead of
    // landing on it.
    state.obstacles.push({ kind: KIND_FENCE, x, y: VIEW.groundY - OBSTACLES.fence.height, vx: 0, active: true, passed: false });
    state.obstacles.push({ kind: KIND_HAY, x: x + 520, y: VIEW.groundY - OBSTACLES.hay.height, vx: 0, active: true, passed: false });
  } else if (roll < 0.86) {
    width = 364;
    // A falling knife with a shadow telegraph: keep moving, don't stop under it.
    const fx = x + range(rng, 0, 120);
    state.obstacles.push({ kind: KIND_KNIFE_FALL, x: fx, y: -120, vy: 0, vx: 0, active: true, passed: false, falling: false });
    addCornArc(state, fx + 180, 0.4);
  } else {
    width = 260;
    // A breather wave: a line of corn and, rarely, a golden feather.
    addCornLine(state, x, 5);
    if (chance(rng, 0.3)) {
      state.pickups.push({ kind: KIND_FEATHER, x: x + 320, y: VIEW.groundY - 210, active: true });
      width = 360;
    }
  }
  // A pie slice rides high over an oven once the run gets going.
  if (d > 250 && chance(rng, 0.22)) {
    state.pickups.push({ kind: KIND_PIE, x: x + 260, y: VIEW.groundY - 250, active: true });
    width = Math.max(width, 312);
  }
  state.lastWaveJumpable = jumpableWave;
  return width;
}

function addCornArc(state, x, heightFrac) {
  const baseY = VIEW.groundY - 70 - heightFrac * 130;
  for (let i = 0; i < 4; i += 1) {
    const lift = Math.sin((i / 3) * Math.PI) * 70;
    state.pickups.push({ kind: KIND_CORN, x: x + i * 46, y: baseY - lift, active: true });
  }
}

function addCornLine(state, x, count) {
  for (let i = 0; i < count; i += 1) {
    state.pickups.push({ kind: KIND_CORN, x: x + i * 52, y: VIEW.groundY - 80, active: true });
  }
}

function burst(state, x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const angle = state.rng() * Math.PI * 2;
    const v = range(state.rng, speed * 0.4, speed);
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * v,
      vy: Math.sin(angle) * v - 120,
      life: range(state.rng, 0.4, 0.9),
      maxLife: 0.9,
      size: range(state.rng, 3, 7),
      color,
    });
  }
}

export function doJump(state) {
  const t = state.turkey;
  if (state.screen !== STATE_PLAY || state.paused) return false;
  // Buffer the jump: pressed a moment before landing, it fires the
  // instant the turkey touches down — that is what makes the
  // fence-then-hay double jump possible.
  t.jumpBuffer = TURKEY.jumpBufferSec;
  return true;
}

export function doSlide(state) {
  const t = state.turkey;
  if (state.screen !== STATE_PLAY || state.paused || !t.onGround) return false;
  if (t.slideCooldown > 0 || t.sliding) return false;
  t.sliding = true;
  t.slideTimer = TURKEY.slideSec;
  state.events.push('slide');
  return true;
}

function applyHit(state, ob) {
  if (state.invulnerableSec > 0) return;
  state.lives -= 1;
  state.invulnerableSec = 1.2;
  state.shakeSec = 0.35;
  state.farmerGapPx = Math.max(0, state.farmerGapPx - RUN.farmerCloseOnHitPx);
  state.farmer.lunge = 0.5;
  ob.active = false;
  const box = turkeyBox(state);
  burst(state, box.x + box.w / 2, box.y + box.h / 2, '#ffb347', 18, 320);
  burst(state, box.x + box.w / 2, box.y + box.h / 2, '#ffffff', 10, 220);
  state.events.push('hit');
  if (state.lives <= 0 || state.farmerGapPx <= RUN.farmerCatchGapPx) {
    state.screen = STATE_CAUGHT;
    state.farmer.caughtPose = true;
    state.events.push('caught');
  }
}

function collectPickup(state, pk) {
  pk.active = false;
  const spec = PICKUPS[pk.kind];
  state.score += spec.score;
  state.farmerGapPx = Math.min(RUN.farmerMaxGapPx, state.farmerGapPx + spec.farmerPushPx);
  if (pk.kind === KIND_CORN) {
    state.cornCount += 1;
    state.events.push('corn');
  } else if (pk.kind === KIND_PIE) {
    state.pieCount += 1;
    state.events.push('pie');
  } else {
    state.featherCount += 1;
    state.events.push('feather');
  }
  burst(state, pk.x + 22, pk.y + 22, pk.kind === KIND_CORN ? '#ffd94a' : '#ff9d5c', 10, 200);
}

export function step(state, dt) {
  state.ambientTime += dt;
  if (state.screen !== STATE_PLAY || state.paused) {
    updateParticles(state, dt);
    return;
  }
  const t = state.turkey;
  state.time += dt;
  state.speed = Math.min(RUN.maxSpeed, RUN.startSpeed + state.distanceM * RUN.speedGainPerMetre);
  const dx = state.speed * dt;
  state.distanceM += dx / RUN.pxPerMetre;
  state.score += (dx / RUN.pxPerMetre) * SCORE.perMetre;
  t.runPhase += dt * (6 + state.speed / 60);

  // Farmer: drifts back while the turkey runs clean, lunges on a hit.
  state.farmerGapPx = Math.min(
    RUN.farmerMaxGapPx,
    state.farmerGapPx + RUN.farmerRecoverPxPerSec * dt,
  );
  state.farmer.runPhase += dt * (6 + state.speed / 60);
  if (state.farmer.lunge > 0) state.farmer.lunge -= dt;

  // Jump buffering and variable jump height.
  if (t.jumpBuffer > 0) {
    t.jumpBuffer -= dt;
    if (t.onGround) {
      t.vy = TURKEY.jumpVelocityPxPerSec;
      t.onGround = false;
      t.jumpBuffer = 0;
      t.squash = -0.18;
      state.events.push('jump');
    }
  }
  if (!t.onGround) {
    t.vy += TURKEY.gravityPxPerSec2 * dt;
    t.y += t.vy * dt;
    if (t.y >= VIEW.groundY - TURKEY.height) {
      t.y = VIEW.groundY - TURKEY.height;
      t.vy = 0;
      t.onGround = true;
      t.squash = 0.22;
      burst(state, t.x + TURKEY.width / 2, VIEW.groundY, '#d8b98a', 6, 120);
    }
  }
  if (t.squash !== 0) t.squash *= Math.pow(0.001, dt);
  if (t.sliding) {
    t.slideTimer -= dt;
    if (t.slideTimer <= 0) {
      t.sliding = false;
      t.slideCooldown = TURKEY.slideCooldownSec;
    }
  }
  if (t.slideCooldown > 0) t.slideCooldown -= dt;
  if (state.invulnerableSec > 0) state.invulnerableSec -= dt;
  if (state.shakeSec > 0) state.shakeSec -= dt;

  // Spawn waves, closer together as the run gets faster. The wait
  // covers the wave just spawned (its width) plus a clear gap, so a
  // wave never overlaps the one before it.
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    const waveWidth = spawnWave(state);
    const gap = Math.max(
      SPAWN.gapMinSec,
      SPAWN.gapStartSec - state.distanceM * SPAWN.gapShrinkPerMetre,
    );
    state.spawnTimer = ((waveWidth + gap * state.speed) / state.speed) * (0.9 + state.rng() * 0.25);
  }

  // Move the world left; falling knives drop once they are overhead.
  const tb = turkeyBox(state);
  for (const ob of state.obstacles) {
    if (!ob.active) continue;
    ob.x -= dx;
    if (ob.kind === KIND_KNIFE_FALL) {
      if (!ob.falling && ob.x < t.x + TURKEY.width + 30) ob.falling = true;
      if (ob.falling) {
        ob.vy = (ob.vy ?? 0) + 2600 * dt;
        ob.y += ob.vy * dt;
        if (ob.y > VIEW.groundY - OBSTACLES.knifeFall.height) {
          ob.y = VIEW.groundY - OBSTACLES.knifeFall.height;
          ob.active = false;
          burst(state, ob.x + 17, VIEW.groundY, '#cfd6e4', 8, 160);
        }
      }
    }
    if (ob.x + 140 < 0) ob.active = false;
    if (!ob.passed && ob.x + 120 < t.x) {
      ob.passed = true;
      state.obstaclesCleared += 1;
    }
    if (ob.active && boxesOverlap(tb, obstacleBox(ob))) applyHit(state, ob);
    if (state.screen !== STATE_PLAY) break;
  }
  for (const pk of state.pickups) {
    if (!pk.active) continue;
    pk.x -= dx;
    if (pk.x + 60 < 0) {
      pk.active = false;
      continue;
    }
    if (boxesOverlap(tb, { x: pk.x, y: pk.y, w: PICKUPS[pk.kind].width, h: PICKUPS[pk.kind].height })) {
      collectPickup(state, pk);
    }
  }
  state.obstacles = state.obstacles.filter((o) => o.active);
  state.pickups = state.pickups.filter((p) => p.active);

  // Escape: reach the barn at the end of the farm lane.
  if (state.distanceM >= RUN.escapeDistanceM) {
    state.screen = STATE_ESCAPED;
    state.score += SCORE.escapeBonus;
    state.events.push('escaped');
    burst(state, t.x + 40, t.y + 30, '#ffd94a', 40, 420);
    burst(state, t.x + 40, t.y + 30, '#ff8a5c', 30, 360);
  }
  updateParticles(state, dt);
}

function updateParticles(state, dt) {
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 900 * dt;
    p.life -= dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
}
