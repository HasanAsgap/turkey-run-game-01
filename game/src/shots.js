// Turkey Run — deterministic screenshot scenes.
// shots.js: each ?shot= scene plays the real rules forward from a
// fresh world for a fixed number of steps, steered by a simple
// autopilot, so the frame is what a short game really looks like and
// the same seed always gives the same frame.
//   ?shot=start   — the title screen over the farm at dusk
//   ?shot=play    — mid-run: oven ahead, knife in the air, HUD full
//   ?shot=chase   — a sloppy run: the farmer is right behind the turkey
//   ?shot=escaped — a full winning run, frozen on the escape screen
//   ?shot=caught  — a run with no input at all, frozen on the caught screen
// A scene's pilot looks ahead each step: jump the ovens, fences and
// hay, slide under the flying knives, jump the falling ones.

import { SHOTS, VIEW } from './config.js';
import { KIND_KNIFE_FALL, KIND_KNIFE_FLY, newRun, step, doJump, doSlide, STATE_PLAY } from './world.js';

const STEP = 1 / 60;

function threatsAhead(state, maxGap) {
  const tx = state.turkey.x;
  const list = [];
  for (const ob of state.obstacles) {
    if (!ob.active) continue;
    const gap = ob.x - tx;
    if (gap < -40 || gap > maxGap) continue;
    list.push({ kind: ob.kind, gap, ob });
  }
  list.sort((a, b) => a.gap - b.gap);
  return list;
}

function nearestThreat(state) {
  return threatsAhead(state, 520)[0] ?? null;
}

// The screenshot pilot, with a little lookahead: it jumps the
// ovens, fences and hay, slides under the flying knives, and runs
// straight through the falling ones — but it never jumps into a
// flying knife's lane, and never jumps while a falling knife is
// landing on the path ahead.
function pilot(state, jumpGapPx, slideGapPx = 100) {
  const threats = threatsAhead(state, 520);
  if (threats.length === 0) return;
  const fly = threats.find((t) => t.kind === KIND_KNIFE_FLY);
  const fall = threats.find((t) => t.kind === KIND_KNIFE_FALL && t.ob.falling);
  const jumpable = threats.find((t) => t.kind !== KIND_KNIFE_FLY && t.kind !== KIND_KNIFE_FALL);
  if (fly && fly.gap <= slideGapPx) {
    doSlide(state);
    return;
  }
  if (!jumpable) return;
  // A knife in the way only delays a jump that can still wait: a
  // jumpable obstacle already close by gets jumped anyway.
  if (fly && fly.gap < 420 && jumpable.gap > 100) return;
  if (fall && fall.gap < 260 && jumpable.gap > 100) return;
  if (jumpable.gap <= jumpGapPx) doJump(state);
}

function simulate(state, seconds, pilotFn) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (state.screen !== STATE_PLAY) break;
    if (pilotFn) pilotFn(state);
    step(state, STEP);
  }
  return state;
}

export function buildShotScene(shot, seed) {
  const state = newRun(seed);
  if (shot === 'start') {
    state.screen = 'title';
    state.ambientTime = 2.4;
    // A few decorative obstacles on the title farm, frozen mid-lane.
    state.obstacles = [
      { kind: 'oven', x: 1060, y: VIEW.groundY - 96, vx: 0, active: true, passed: false },
    ];
    return state;
  }
  if (shot === 'play') {
    simulate(state, SHOTS.playSeconds, (s) => pilot(s, 130));
    return state;
  }
  if (shot === 'chase') {
    // A run frozen the moment the farmer closes in: the turkey
    // stands still and eats hits until one feather of life is left,
    // then the pilot takes over for half a second — frozen with the
    // farmer lunging in, the warning banner showing, and one life.
    const cap = Math.floor(30 / STEP);
    let recoveringSteps = 0;
    for (let i = 0; i < cap; i += 1) {
      if (state.screen !== STATE_PLAY) break;
      if (state.lives > 1) {
        step(state, STEP);
        continue;
      }
      pilot(state, 140);
      step(state, STEP);
      recoveringSteps += 1;
      if (recoveringSteps >= 30) break;
    }
    return state;
  }
  if (shot === 'escaped') {
    simulate(state, SHOTS.escapeSeconds, (s) => pilot(s, 140));
    return state;
  }
  // 'caught' and anything unknown: stand still and let the farm win.
  simulate(state, SHOTS.caughtSeconds, null);
  return state;
}
