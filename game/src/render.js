// Turkey Run — the renderer.
// render.js: every pixel of the game, drawn on one canvas with plain
// Canvas 2D paths — no image files, no fonts to download, no network.
// The turkey, the farmer, the oven and the knives are all drawn from
// code, so the screenshots are renders of this file and nothing else.
// draw(ctx, state, ui) paints the current screen; ui carries the
// buttons the input module needs and the best distance for the title.

import { OBSTACLES, RUN, TURKEY, VIEW } from './config.js';
import { KIND_CORN, KIND_FEATHER, KIND_FENCE, KIND_HAY, KIND_KNIFE_FALL, KIND_KNIFE_FLY, KIND_OVEN, KIND_PIE, STATE_CAUGHT, STATE_ESCAPED, STATE_PLAY, STATE_TITLE } from './world.js';

const FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';
const TITLE_FONT = '"Arial Black", "Trebuchet MS", sans-serif';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, str, x, y, size, color, align = 'left', font = FONT, weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function outlinedText(ctx, str, x, y, size, color, outline, align = 'center', font = TITLE_FONT) {
  ctx.font = `900 ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = size / 8;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = outline;
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ---------------------------------------------------------------- sky ---

function drawSky(ctx, state) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  g.addColorStop(0, '#2e1a4d');
  g.addColorStop(0.35, '#8a2f5c');
  g.addColorStop(0.62, '#e2603a');
  g.addColorStop(0.8, '#ffb347');
  g.addColorStop(1, '#7a4a21');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);

  // Low autumn sun with a warm halo, right of centre.
  const sunX = 980;
  const sunY = 300;
  const halo = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 220);
  halo.addColorStop(0, 'rgba(255, 236, 170, 0.95)');
  halo.addColorStop(0.35, 'rgba(255, 190, 90, 0.55)');
  halo.addColorStop(1, 'rgba(255, 150, 60, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(sunX - 230, sunY - 230, 460, 460);
  ellipse(ctx, sunX, sunY, 58, 58, '#ffedbe');

  // Slow clouds, drifting with the ambient clock.
  ctx.fillStyle = 'rgba(255, 214, 170, 0.5)';
  for (let i = 0; i < 5; i += 1) {
    const cx = ((i * 317 + state.ambientTime * (8 + i * 3)) % 1500) - 120;
    const cy = 70 + i * 34;
    ellipse(ctx, cx, cy, 70, 18, 'rgba(255, 214, 170, 0.5)');
    ellipse(ctx, cx + 44, cy + 8, 52, 14, 'rgba(255, 214, 170, 0.4)');
  }

  // Distant purple hills and a barn silhouette on the horizon.
  ctx.fillStyle = '#5d2a52';
  ctx.beginPath();
  ctx.moveTo(0, 520);
  ctx.quadraticCurveTo(320, 430, 640, 505);
  ctx.quadraticCurveTo(960, 570, 1280, 470);
  ctx.lineTo(1280, 600);
  ctx.lineTo(0, 600);
  ctx.closePath();
  ctx.fill();
  drawBarn(ctx, 1120, 470, 0.62, '#3c1c3a');
}

function drawBarn(ctx, x, y, scale, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.fillRect(-60, -70, 120, 70);
  ctx.beginPath();
  ctx.moveTo(-72, -70);
  ctx.lineTo(0, -118);
  ctx.lineTo(72, -70);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 220, 160, 0.35)';
  ctx.fillRect(-14, -34, 28, 34);
  ctx.restore();
}

function drawTrees(ctx, scroll, color) {
  // Parallax tree line: trunks and autumn crowns, spaced deterministically.
  for (let i = 0; i < 9; i += 1) {
    const baseX = i * 190 - (scroll * 0.25) % 190;
    const x = baseX < -80 ? baseX + 1710 : baseX;
    const h = 90 + ((i * 53) % 50);
    ctx.fillStyle = '#4a2438';
    ctx.fillRect(x - 5, VIEW.groundY - h * 0.55, 10, h * 0.55);
    ellipse(ctx, x, VIEW.groundY - h * 0.62, 52, 34, color);
    ellipse(ctx, x - 30, VIEW.groundY - h * 0.5, 30, 20, color);
    ellipse(ctx, x + 32, VIEW.groundY - h * 0.5, 30, 20, color);
  }
}

function drawGround(ctx, scroll) {
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(0, VIEW.groundY, VIEW.width, VIEW.height - VIEW.groundY);
  ctx.fillStyle = '#7fae4e';
  ctx.fillRect(0, VIEW.groundY, VIEW.width, 14);
  ctx.fillStyle = '#5d8a3c';
  for (let i = 0; i < 40; i += 1) {
    const x = ((i * 173 - scroll * 0.6) % 1400 + 1400) % 1400 - 60;
    ctx.beginPath();
    ctx.moveTo(x, VIEW.groundY + 2);
    ctx.lineTo(x + 5, VIEW.groundY - 10 - ((i * 7) % 8));
    ctx.lineTo(x + 10, VIEW.groundY + 2);
    ctx.closePath();
    ctx.fill();
  }
  // Pumpkins resting on the dirt, spaced along the lane.
  for (let i = 0; i < 6; i += 1) {
    const x = ((i * 431 - scroll) % 1500 + 1500) % 1500 - 80;
    ellipse(ctx, x, VIEW.groundY + 82, 26, 19, '#d96a1e');
    ellipse(ctx, x, VIEW.groundY + 82, 12, 19, '#c75a12');
    ctx.fillStyle = '#4a7a2e';
    ctx.fillRect(x - 2, VIEW.groundY + 58, 5, 10);
  }
  // Fence posts scrolling past at the back of the lane.
  ctx.fillStyle = '#8a6a42';
  for (let i = 0; i < 12; i += 1) {
    const x = ((i * 137 - scroll * 0.85) % 1500 + 1500) % 1500 - 60;
    ctx.fillRect(x, VIEW.groundY - 52, 8, 52);
  }
  ctx.fillRect(0, VIEW.groundY - 46, VIEW.width, 6);
  ctx.fillRect(0, VIEW.groundY - 26, VIEW.width, 6);
}

// ------------------------------------------------------------- actors ---

function drawTurkey(ctx, x, y, opts = {}) {
  const {
    scale = 1,
    runPhase = 0,
    sliding = false,
    squash = 0,
    flip = false,
    alpha = 1,
  } = opts;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -scale : scale, scale * (1 + squash));
  ctx.globalAlpha = alpha;
  // Sliding pose: low and stretched, feet still on the ground line.
  if (sliding) {
    ctx.translate(0, 26);
    ctx.scale(1.25, 0.62);
  }
  const legSwing = Math.sin(runPhase) * 14;
  const legSwing2 = Math.sin(runPhase + Math.PI) * 14;

  // Tail feather fan.
  const featherColors = ['#c0392b', '#e67e22', '#f1c40f', '#b9770e', '#922b21'];
  for (let i = 0; i < 5; i += 1) {
    const angle = -0.9 + i * 0.45;
    ctx.save();
    ctx.translate(-34, -52);
    ctx.rotate(angle);
    ellipse(ctx, 0, -26, 13, 30, featherColors[i]);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, -34, 5, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Legs, pumping while running.
  ctx.strokeStyle = '#e67e22';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -8);
  ctx.lineTo(-8 + legSwing * 0.5, 0);
  ctx.moveTo(10, -8);
  ctx.lineTo(10 + legSwing2 * 0.5, 0);
  ctx.stroke();
  // Feet.
  ctx.fillStyle = '#e67e22';
  ellipse(ctx, -8 + legSwing * 0.5, 1, 9, 3, '#e67e22');
  ellipse(ctx, 10 + legSwing2 * 0.5, 1, 9, 3, '#e67e22');

  // Body and belly.
  ellipse(ctx, 0, -46, 46, 40, '#8a5a2b');
  ellipse(ctx, 12, -38, 30, 26, '#a9713a');
  // Wing, flapping gently with the run.
  const flap = Math.sin(runPhase * 1.4) * 0.25;
  ctx.save();
  ctx.translate(-6, -52);
  ctx.rotate(-0.3 + flap);
  ellipse(ctx, 0, 0, 30, 18, '#6e4520');
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.ellipse(-4, -4, 22, 10, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Neck and head.
  ctx.fillStyle = '#a9713a';
  ctx.beginPath();
  ctx.ellipse(34, -78, 12, 22, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ellipse(ctx, 42, -96, 17, 15, '#d8c1a3');
  // Beak, snood and wattle.
  ctx.fillStyle = '#e67e22';
  ctx.beginPath();
  ctx.moveTo(54, -100);
  ctx.lineTo(70, -94);
  ctx.lineTo(54, -88);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  ellipse(ctx, 48, -84, 5, 9, '#c0392b');
  ellipse(ctx, 38, -80, 6, 8, '#c0392b');
  // Eye, wide and worried.
  ellipse(ctx, 46, -100, 5, 5, '#ffffff');
  ellipse(ctx, 47, -100, 2.5, 2.5, '#1a1a1a');
  ctx.restore();
}

function drawFarmer(ctx, x, y, runPhase, lunge) {
  ctx.save();
  ctx.translate(x, y);
  const legSwing = Math.sin(runPhase) * 16;
  // Legs in blue overalls.
  ctx.strokeStyle = '#2c4a7a';
  ctx.lineWidth = 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -52);
  ctx.lineTo(-6 + legSwing * 0.6, 0);
  ctx.moveTo(8, -52);
  ctx.lineTo(8 - legSwing * 0.6, 0);
  ctx.stroke();
  // Red shirt and overalls body.
  ctx.fillStyle = '#b03a2e';
  rr(ctx, -22, -104, 46, 56, 12);
  ctx.fill();
  ctx.fillStyle = '#2c4a7a';
  ctx.fillRect(-20, -78, 42, 30);
  ctx.fillStyle = '#f4d03f';
  ctx.fillRect(-16, -80, 6, 6);
  ctx.fillRect(12, -80, 6, 6);
  // Arms pumping, one gripping a pitchfork.
  const armSwing = Math.sin(runPhase) * 12;
  ctx.strokeStyle = '#b03a2e';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(18, -96);
  ctx.lineTo(34 + armSwing * 0.4, -66);
  ctx.moveTo(-18, -96);
  ctx.lineTo(-32 - armSwing * 0.4, -70);
  ctx.stroke();
  // Pitchfork, raised and glinting.
  ctx.save();
  ctx.translate(38 + armSwing * 0.4, -70);
  ctx.rotate(-0.5 - lunge * 0.4);
  ctx.strokeStyle = '#7a5230';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -72);
  ctx.stroke();
  ctx.strokeStyle = '#d5d8dc';
  ctx.lineWidth = 3;
  for (const dx of [-8, 0, 8]) {
    ctx.beginPath();
    ctx.moveTo(dx, -72);
    ctx.lineTo(dx, -88);
    ctx.stroke();
  }
  ctx.restore();
  // Head, beard and straw hat.
  ellipse(ctx, 2, -118, 16, 16, '#e8b98a');
  ctx.fillStyle = '#e9e9e9';
  ctx.beginPath();
  ctx.ellipse(2, -106, 14, 9, 0, 0, Math.PI);
  ctx.fill();
  ellipse(ctx, 6, -122, 3, 3, '#1a1a1a');
  ctx.fillStyle = '#f1c40f';
  ellipse(ctx, 2, -132, 26, 7, '#f1c40f');
  ctx.beginPath();
  ctx.ellipse(2, -138, 15, 9, 0, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}

function drawOven(ctx, ob, time) {
  const w = OBSTACLES.oven.width;
  const h = OBSTACLES.oven.height;
  const x = ob.x;
  const y = ob.y;
  // Heat shimmer glow behind the oven.
  const glow = ctx.createRadialGradient(x + w / 2, y + h / 2, 10, x + w / 2, y + h / 2, 130);
  glow.addColorStop(0, 'rgba(255, 120, 30, 0.4)');
  glow.addColorStop(1, 'rgba(255, 120, 30, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - 60, y - 60, w + 120, h + 120);
  // Iron body and chimney.
  ctx.fillStyle = '#2c2f36';
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = '#1d1f24';
  ctx.fillRect(x + w - 26, y - 34, 18, 36);
  // Smoke puffs from the chimney.
  for (let i = 0; i < 3; i += 1) {
    const t = ((time * 0.5 + i / 3) % 1);
    const sx = x + w - 17 + Math.sin(time + i * 2) * 8 * t;
    const sy = y - 40 - t * 70;
    ellipse(ctx, sx, sy, 10 + t * 14, 8 + t * 10, `rgba(220, 220, 220, ${0.5 * (1 - t)})`);
  }
  // Glowing door with grate bars and flames.
  const flicker = 0.75 + Math.sin(time * 9) * 0.15 + Math.sin(time * 23) * 0.1;
  const door = ctx.createLinearGradient(0, y + 22, 0, y + h - 12);
  door.addColorStop(0, `rgba(255, ${Math.floor(140 * flicker)}, 20, 0.95)`);
  door.addColorStop(1, 'rgba(180, 40, 0, 0.95)');
  ctx.fillStyle = door;
  rr(ctx, x + 14, y + 22, w - 28, h - 34, 6);
  ctx.fill();
  ctx.strokeStyle = '#2c2f36';
  ctx.lineWidth = 4;
  for (let i = 1; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 22 + i * ((h - 34) / 4));
    ctx.lineTo(x + w - 14, y + 22 + i * ((h - 34) / 4));
    ctx.stroke();
  }
  // Knobs and a warning plate.
  ctx.fillStyle = '#d5d8dc';
  for (const kx of [x + 26, x + w / 2, x + w - 26]) {
    ellipse(ctx, kx, y + 11, 5, 5, '#d5d8dc');
  }
  text(ctx, 'HOT!', x + w / 2, y - 6, 15, '#ffd94a', 'center');
}

function drawKnifeFly(ctx, ob, time) {
  const bob = Math.sin(time * 6 + ob.x * 0.01) * 5;
  const x = ob.x;
  const y = ob.y + bob;
  ctx.save();
  ctx.translate(x + 55, y + 15);
  ctx.rotate(-0.06);
  // Blade with a glint.
  ctx.fillStyle = '#dfe6ee';
  ctx.beginPath();
  ctx.moveTo(-55, -8);
  ctx.lineTo(18, -8);
  ctx.lineTo(55, 0);
  ctx.lineTo(18, 8);
  ctx.lineTo(-55, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-48, -4);
  ctx.lineTo(10, -4);
  ctx.stroke();
  // Wooden handle and rivets.
  ctx.fillStyle = '#7a4a21';
  rr(ctx, -88, -9, 36, 18, 6);
  ctx.fill();
  ellipse(ctx, -78, 0, 2.5, 2.5, '#d5d8dc');
  ellipse(ctx, -62, 0, 2.5, 2.5, '#d5d8dc');
  ctx.restore();
  text(ctx, '!', x + 55, y - 16, 22, '#ff5a3c', 'center');
}

function drawKnifeFall(ctx, ob) {
  const x = ob.x;
  const y = ob.y;
  // Ground shadow telegraphs where it will land.
  const fallFrac = Math.min(1, Math.max(0, (y + 120) / (VIEW.groundY - 96 + 120)));
  ellipse(ctx, x + 17, VIEW.groundY + 6, 26 * (0.4 + fallFrac * 0.6), 6, `rgba(0,0,0,${0.25 + fallFrac * 0.3})`);
  ctx.save();
  ctx.translate(x + 17, y + 48);
  ctx.rotate(Math.sin(y * 0.02) * 0.08);
  ctx.fillStyle = '#dfe6ee';
  ctx.beginPath();
  ctx.moveTo(-13, -48);
  ctx.lineTo(13, -48);
  ctx.lineTo(0, 34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7a4a21';
  rr(ctx, -13, -48, 26, 16, 5);
  ctx.fill();
  ctx.restore();
}

function drawPickup(ctx, pk, time) {
  const bob = Math.sin(time * 4 + pk.x * 0.02) * 4;
  const x = pk.x;
  const y = pk.y + bob;
  if (pk.kind === KIND_CORN) {
    ctx.save();
    ctx.translate(x + 22, y + 22);
    ctx.rotate(-0.4);
    ellipse(ctx, 0, 0, 12, 20, '#ffd94a');
    ctx.fillStyle = '#e8b90a';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(i * 6, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#5d8a3c';
    ctx.beginPath();
    ctx.moveTo(-10, 12);
    ctx.lineTo(-18, 26);
    ctx.lineTo(-2, 18);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, 12);
    ctx.lineTo(18, 26);
    ctx.lineTo(2, 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (pk.kind === KIND_PIE) {
    ctx.save();
    ctx.translate(x + 26, y + 22);
    ellipse(ctx, 0, 12, 26, 8, '#e8b90a');
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(-24, 10);
    ctx.lineTo(24, 10);
    ctx.lineTo(0, -14);
    ctx.closePath();
    ctx.fill();
    ellipse(ctx, 0, -8, 7, 6, '#ffffff');
    ctx.restore();
  } else if (pk.kind === KIND_FEATHER) {
    ctx.save();
    ctx.translate(x + 20, y + 24);
    ctx.rotate(0.5 + Math.sin(time * 3) * 0.15);
    const g = ctx.createLinearGradient(0, -22, 0, 22);
    g.addColorStop(0, '#ffe27a');
    g.addColorStop(1, '#e67e22');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(0, 26);
    ctx.stroke();
    ctx.restore();
  }
}

// ----------------------------------------------------------------- HUD ---

function drawFeatherIcon(ctx, x, y, scale, lit) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(0.5);
  ctx.fillStyle = lit ? '#ffd94a' : 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = lit ? '#8a5a2b' : 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, 22);
  ctx.stroke();
  ctx.restore();
}

function drawHud(ctx, state, ui) {
  ctx.fillStyle = 'rgba(16, 10, 26, 0.62)';
  rr(ctx, 16, 14, 1248, 66, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 217, 74, 0.5)';
  ctx.lineWidth = 2;
  rr(ctx, 16, 14, 1248, 66, 14);
  ctx.stroke();

  text(ctx, 'SCORE', 36, 38, 13, '#ffb347');
  text(ctx, String(Math.floor(state.score)), 36, 66, 28, '#ffffff');

  // Distance + progress to the barn: the turkey icon rides the bar.
  const frac = Math.min(1, state.distanceM / RUN.escapeDistanceM);
  text(ctx, 'DISTANCE', 330, 38, 13, '#ffb347');
  text(ctx, `${Math.floor(state.distanceM)} m / ${RUN.escapeDistanceM} m`, 330, 66, 24, '#ffffff');
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  rr(ctx, 560, 40, 300, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#ffd94a';
  rr(ctx, 560, 40, 300 * frac, 12, 6);
  ctx.fill();
  drawTurkey(ctx, 560 + 300 * frac, 52, { scale: 0.3, runPhase: state.turkey.runPhase });
  drawBarn(ctx, 880, 46, 0.22, '#ff8a5c');

  // Lives as golden feathers.
  text(ctx, 'LIVES', 920, 38, 13, '#ffb347');
  for (let i = 0; i < 3; i += 1) {
    drawFeatherIcon(ctx, 946 + i * 34, 56, 1, i < state.lives);
  }
  text(ctx, `CORN ${state.cornCount}`, 1070, 48, 18, '#ffd94a');
  text(ctx, `${Math.round(state.speed * 0.36)} km/h`, 1070, 70, 14, '#ffffff');

  // Farmer proximity warning when he is close.
  if (state.farmerGapPx < 110 && state.screen === STATE_PLAY) {
    const blink = 0.6 + Math.sin(state.ambientTime * 10) * 0.4;
    ctx.fillStyle = `rgba(255, 60, 40, ${0.55 * blink})`;
    rr(ctx, 440, 92, 400, 34, 10);
    ctx.fill();
    text(ctx, 'THE FARMER IS RIGHT BEHIND YOU!', 640, 115, 18, '#ffffff', 'center');
  }
  if (state.time < 4 && state.screen === STATE_PLAY) {
    text(ctx, 'SPACE / CLICK — jump      DOWN — slide      P — pause      M — sound', 640, 700, 16, 'rgba(255,255,255,0.85)', 'center');
  }
  ui.muteLabel = state.muted ? 'SOUND: OFF (M)' : 'SOUND: ON (M)';
  text(ctx, ui.muteLabel, 1264, 700, 13, 'rgba(255,255,255,0.6)', 'right');
}

function drawButton(ctx, button, hover) {
  ctx.save();
  ctx.fillStyle = hover ? '#ffb347' : '#ff8a3c';
  ctx.shadowColor = 'rgba(255, 140, 40, 0.7)';
  ctx.shadowBlur = hover ? 26 : 12;
  rr(ctx, button.x, button.y, button.w, button.h, 16);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#fff3d6';
  ctx.lineWidth = 3;
  rr(ctx, button.x, button.y, button.w, button.h, 16);
  ctx.stroke();
  outlinedText(ctx, button.label, button.x + button.w / 2, button.y + button.h / 2 + 13, 30, '#ffffff', '#7a2d00', 'center', FONT);
}

// -------------------------------------------------------------- screens ---

function drawTitle(ctx, state, ui, input) {
  drawSky(ctx, state);
  drawTrees(ctx, 0, '#7a3a52');
  drawGround(ctx, 0);
  // Hero turkey mid-stride, farmer peeking from the left fence.
  drawTurkey(ctx, 230, VIEW.groundY, { scale: 1.5, runPhase: state.ambientTime * 7 });
  drawFarmer(ctx, 70, VIEW.groundY, state.ambientTime * 7, 0);
  // Oven waiting at the right edge of the title scene.
  drawOven(ctx, { x: 1060, y: VIEW.groundY - 96 }, state.ambientTime);

  ctx.fillStyle = 'rgba(20, 8, 30, 0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  outlinedText(ctx, 'TURKEY RUN', 640, 150, 96, '#ffd94a', '#5d1a00');
  outlinedText(ctx, 'ESCAPE THE THANKSGIVING TABLE', 640, 200, 30, '#ffffff', '#5d1a00', 'center', FONT);
  text(ctx, 'The farmer is coming. The oven is hot. The carving knife is out.', 640, 240, 20, '#ffe9c4', 'center');
  text(ctx, 'Run 1,200 metres to the barn — and never become dinner.', 640, 268, 20, '#ffe9c4', 'center');

  const startBtn = { x: 490, y: 310, w: 300, h: 72, label: '▶  START RUN', action: 'start' };
  drawButton(ctx, startBtn, input.isPointerOver(startBtn));
  ui.buttons = [startBtn];

  // How to play card.
  ctx.fillStyle = 'rgba(16, 10, 26, 0.66)';
  rr(ctx, 340, 410, 600, 150, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 217, 74, 0.5)';
  ctx.lineWidth = 2;
  rr(ctx, 340, 410, 600, 150, 16);
  ctx.stroke();
  text(ctx, 'HOW TO PLAY', 640, 444, 18, '#ffb347', 'center');
  text(ctx, 'SPACE / CLICK  —  jump over ovens, fences and hay bales', 640, 476, 18, '#ffffff', 'center');
  text(ctx, 'DOWN ARROW  —  slide under the flying carving knives', 640, 504, 18, '#ffffff', 'center');
  text(ctx, 'Grab corn and pie to push the farmer back — 3 hits and he grabs you!', 640, 532, 18, '#ffffff', 'center');
  if (ui.bestDistance > 0) {
    text(ctx, `Best escape so far: ${Math.floor(ui.bestDistance)} m`, 640, 600, 18, '#ffd94a', 'center');
  }
  text(ctx, 'Keyboard + mouse  •  Runs offline in your browser  •  No downloads', 640, 640, 15, 'rgba(255,255,255,0.7)', 'center');
}

function drawEndPanel(ctx, state, ui, input, escaped) {
  ctx.fillStyle = escaped ? 'rgba(10, 40, 16, 0.55)' : 'rgba(40, 6, 10, 0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const panelX = 340;
  const panelY = 100;
  const panelW = 600;
  const panelH = 510;
  ctx.fillStyle = 'rgba(16, 10, 26, 0.88)';
  rr(ctx, panelX, panelY, panelW, panelH, 20);
  ctx.fill();
  ctx.strokeStyle = escaped ? '#ffd94a' : '#ff5a3c';
  ctx.lineWidth = 3;
  rr(ctx, panelX, panelY, panelW, panelH, 20);
  ctx.stroke();

  if (escaped) {
    // Confetti feathers over the panel.
    for (let i = 0; i < 24; i += 1) {
      const fx = 60 + ((i * 53 + state.ambientTime * 40) % 1160);
      const fy = 40 + ((i * 97 + state.ambientTime * 90) % 640);
      drawFeatherIcon(ctx, fx, fy, 0.7, true);
    }
    drawTurkey(ctx, 640, 260, { scale: 1.05, runPhase: state.ambientTime * 6 });
    outlinedText(ctx, 'ESCAPED!', 640, 320, 64, '#ffd94a', '#1a4d00');
    text(ctx, 'You made it to the barn. No Thanksgiving dinner today!', 640, 355, 19, '#ffffff', 'center');
  } else {
    drawFarmer(ctx, 595, 295, 0, 0.6);
    drawTurkey(ctx, 685, 265, { scale: 0.85, flip: true, runPhase: 0 });
    outlinedText(ctx, 'CAUGHT!', 640, 360, 64, '#ff6a4d', '#4d0000');
    text(ctx, 'The farmer got you — straight into the oven you go...', 640, 395, 19, '#ffffff', 'center');
  }

  const mins = Math.floor(state.time / 60);
  const secs = Math.floor(state.time % 60);
  const rows = [
    ['SCORE', String(Math.floor(state.score))],
    ['DISTANCE', `${Math.floor(state.distanceM)} m${escaped ? ' — the full 1,200 m!' : ` of 1,200 m`}`],
    ['CORN EATEN', `${state.cornCount}  •  PIE ${state.pieCount}  •  FEATHERS ${state.featherCount}`],
    ['TIME', `${mins}:${String(secs).padStart(2, '0')}  •  OBSTACLES CLEARED ${state.obstaclesCleared}`],
  ];
  let ry = escaped ? 395 : 430;
  for (const [label, value] of rows) {
    text(ctx, label, 400, ry, 15, '#ffb347');
    text(ctx, value, 880, ry, 17, '#ffffff', 'right');
    ry += 27;
  }

  const againBtn = { x: 490, y: escaped ? 500 : 535, w: 300, h: 60, label: escaped ? 'RUN AGAIN' : 'TRY AGAIN', action: 'restart' };
  drawButton(ctx, againBtn, input.isPointerOver(againBtn));
  ui.buttons = [againBtn];
  text(ctx, 'or press R to restart', 640, againBtn.y + 84, 15, 'rgba(255,255,255,0.7)', 'center');
}

// ----------------------------------------------------------------- main ---

export function draw(ctx, state, ui, input) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  ui.buttons = [];
  if (state.screen === STATE_TITLE) {
    drawTitle(ctx, state, ui, input);
    return;
  }

  // World screens: play, caught, escaped share the same farm.
  const scroll = state.distanceM * RUN.pxPerMetre;
  const shake = state.shakeSec > 0 ? 7 : 0;
  const shX = shake ? Math.sin(state.ambientTime * 91) * shake : 0;
  const shY = shake ? Math.cos(state.ambientTime * 113) * shake : 0;
  ctx.save();
  ctx.translate(shX, shY);
  drawSky(ctx, state);
  drawTrees(ctx, scroll, '#7a3a52');
  drawGround(ctx, scroll);
  if (state.screen === STATE_ESCAPED) drawBarn(ctx, 1080, VIEW.groundY - 10, 1.4, '#8a2f2f');

  // Pickups, then obstacles, then the farmer, then the turkey on top.
  for (const pk of state.pickups) drawPickup(ctx, pk, state.ambientTime);
  for (const ob of state.obstacles) {
    if (ob.kind === KIND_OVEN) drawOven(ctx, ob, state.ambientTime);
    else if (ob.kind === KIND_FENCE) {
      ctx.fillStyle = '#8a6a42';
      ctx.fillRect(ob.x, ob.y, 8, OBSTACLES.fence.height);
      ctx.fillRect(ob.x + 46, ob.y, 8, OBSTACLES.fence.height);
      ctx.fillRect(ob.x, ob.y + 8, 54, 8);
      ctx.fillRect(ob.x, ob.y + 34, 54, 8);
    } else if (ob.kind === KIND_HAY) {
      ellipse(ctx, ob.x + 48, ob.y + 34, 48, 26, '#e8b90a');
      ellipse(ctx, ob.x + 48, ob.y + 40, 48, 18, '#d8a90a');
      ctx.strokeStyle = '#a87e00';
      ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(ob.x + 48 + i * 16, ob.y + 14);
        ctx.lineTo(ob.x + 48 + i * 16, ob.y + 52);
        ctx.stroke();
      }
    } else if (ob.kind === KIND_KNIFE_FLY) drawKnifeFly(ctx, ob, state.ambientTime);
    else if (ob.kind === KIND_KNIFE_FALL) drawKnifeFall(ctx, ob);
  }

  // The farmer, chasing from the left, lunging when he closes in.
  const farmerX = state.turkey.x - state.farmerGapPx - 40;
  if (farmerX > -120) {
    drawFarmer(ctx, farmerX, VIEW.groundY, state.farmer.runPhase, state.farmer.lunge);
  }

  // The turkey, blinking while invulnerable after a hit. Its feet
  // sit at t.y + height while airborne, on the ground line grounded.
  const blink = state.invulnerableSec > 0 && Math.floor(state.ambientTime * 12) % 2 === 0;
  if (!blink) {
    const t = state.turkey;
    drawTurkey(ctx, t.x, t.y + TURKEY.height, {
      scale: 1,
      runPhase: t.onGround ? t.runPhase : 0,
      sliding: t.sliding,
      squash: t.squash,
    });
  }

  // Particles above everything in the world.
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ellipse(ctx, p.x, p.y, p.size, p.size, p.color);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  drawHud(ctx, state, ui);

  if (state.paused && state.screen === STATE_PLAY) {
    ctx.fillStyle = 'rgba(10, 6, 18, 0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    outlinedText(ctx, 'PAUSED', 640, 360, 72, '#ffffff', '#000000');
    text(ctx, 'Press P to keep running', 640, 410, 20, '#ffe9c4', 'center');
  }

  if (state.screen === STATE_CAUGHT) drawEndPanel(ctx, state, ui, input, false);
  if (state.screen === STATE_ESCAPED) drawEndPanel(ctx, state, ui, input, true);
}
