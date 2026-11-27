// Turkey Run — Escape the Thanksgiving Table.
// main.js: the game loop and the screen state machine. It wires the
// simulation (world.js), the renderer (render.js), the input and the
// sound bank together, and nothing else: title -> run -> caught or
// escaped -> restart. A ?shot= URL freezes one deterministic scene
// for screenshots instead of starting the loop.

import { VIEW } from './config.js';
import { SoundBank } from './audio.js';
import { ACTION, Input } from './input.js';
import { draw } from './render.js';
import { buildShotScene } from './shots.js';
import { doJump, doSlide, newRun, STATE_CAUGHT, STATE_ESCAPED, STATE_PLAY, STATE_TITLE, step } from './world.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : (Date.now() % 2147483647);
const shot = params.get('shot');

const input = new Input(canvas);
const sounds = new SoundBank();
input.onFirstGesture = () => sounds.unlock();

const ui = { buttons: [], bestDistance: 0, muteLabel: 'SOUND: ON (M)' };
try {
  ui.bestDistance = Number(window.localStorage.getItem('turkey-run-best') ?? 0) || 0;
} catch {
  ui.bestDistance = 0;
}

let state = newRun(seed);
state.screen = STATE_TITLE;

function saveBest() {
  if (state.distanceM > ui.bestDistance) {
    ui.bestDistance = state.distanceM;
    try {
      window.localStorage.setItem('turkey-run-best', String(Math.floor(ui.bestDistance)));
    } catch {
      // Private mode or a host that blocks storage: best distance
      // simply lives for this session only.
    }
  }
}

function startRun() {
  state = newRun((Date.now() % 2147483647) || 1);
  state.screen = STATE_PLAY;
  sounds.gobble();
  announce('Run! Jump the ovens, slide under the knives, reach the barn.');
}

function restart() {
  startRun();
}

function announce(message) {
  if (statusLine) statusLine.textContent = message;
}

function handleAction(action) {
  if (action === ACTION.mute) {
    const muted = sounds.toggleMute();
    ui.muteLabel = muted ? 'SOUND: OFF (M)' : 'SOUND: ON (M)';
    return;
  }
  if (state.screen === STATE_TITLE) {
    if (action === ACTION.start || action === ACTION.jump || action === ACTION.restart) startRun();
    return;
  }
  if (state.screen === STATE_CAUGHT || state.screen === STATE_ESCAPED) {
    if (action === ACTION.restart || action === ACTION.start || action === ACTION.jump) restart();
    return;
  }
  // Playing.
  if (action === ACTION.jump) {
    if (doJump(state)) sounds.jump();
  } else if (action === ACTION.slide) {
    if (doSlide(state)) sounds.slide();
  } else if (action === ACTION.pause) {
    state.paused = !state.paused;
  } else if (action === ACTION.restart) {
    restart();
  }
}

function playEventSounds() {
  for (const event of state.events) {
    if (event === 'jump') sounds.jump();
    else if (event === 'slide') sounds.slide();
    else if (event === 'corn') sounds.corn();
    else if (event === 'pie') sounds.pie();
    else if (event === 'feather') sounds.feather();
    else if (event === 'hit') sounds.hit();
    else if (event === 'caught') {
      sounds.caught();
      saveBest();
      announce('Caught! The farmer got the turkey. Press R to try again.');
    } else if (event === 'escaped') {
      sounds.escaped();
      saveBest();
      announce('Escaped! The turkey reached the barn. Press R to run again.');
    }
  }
  state.events.length = 0;
}

// Screenshot mode: simulate the scene once, paint one frozen frame,
// and stop. No animation loop, no timers: the same seed gives the
// same pixels every time.
if (shot) {
  state = buildShotScene(shot, Number.isInteger(seedParam) ? seedParam : 1);
  draw(ctx, state, ui, input);
  input.setButtons(ui.buttons);
  document.title = `shot-ready:${shot}`;
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (const action of input.drain()) handleAction(action);
    if (state.screen === STATE_TITLE) {
      state.ambientTime += dt;
    } else if (!state.paused) {
      step(state, dt);
    }
    playEventSounds();
    draw(ctx, state, ui, input);
    input.setButtons(ui.buttons);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
