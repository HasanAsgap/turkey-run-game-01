// Turkey Run — keyboard and mouse input.
// input.js: one place that turns keys and clicks into game actions.
// The renderer draws the buttons; this module owns their hit boxes,
// so a click on "MULAI LARI" or "MAIN LAGI" does exactly what the
// player expects, on desktop Chrome with keyboard and mouse.

export const ACTION = {
  jump: 'jump',
  slide: 'slide',
  restart: 'restart',
  start: 'start',
  mute: 'mute',
  pause: 'pause',
};

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.queue = [];
    this.buttons = [];
    this.jumpHeld = false;
    this.onFirstGesture = null;
    this.gestureSeen = false;
    this.pointer = { x: 0, y: 0 };
    this.boundKeyDown = (event) => this.handleKey(event, true);
    this.boundKeyUp = (event) => this.handleKey(event, false);
    this.boundPointerDown = (event) => this.handlePointer(event);
    this.boundPointerMove = (event) => this.handleMove(event);
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    canvas.addEventListener('pointerdown', this.boundPointerDown);
    canvas.addEventListener('pointermove', this.boundPointerMove);
  }

  markGesture() {
    if (!this.gestureSeen) {
      this.gestureSeen = true;
      if (this.onFirstGesture) this.onFirstGesture();
    }
  }

  handleKey(event, down) {
    const key = event.key;
    if ([' ', 'ArrowUp', 'ArrowDown'].includes(key)) event.preventDefault();
    if (!down) {
      if (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') this.jumpHeld = false;
      return;
    }
    this.markGesture();
    if (event.repeat) return;
    if (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') {
      this.jumpHeld = true;
      this.queue.push(ACTION.jump);
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      this.queue.push(ACTION.slide);
    } else if (key === 'Enter') {
      this.queue.push(ACTION.start);
    } else if (key === 'r' || key === 'R') {
      this.queue.push(ACTION.restart);
    } else if (key === 'm' || key === 'M') {
      this.queue.push(ACTION.mute);
    } else if (key === 'p' || key === 'P' || key === 'Escape') {
      this.queue.push(ACTION.pause);
    }
  }

  canvasPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * this.canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * this.canvas.height,
    };
  }

  handleMove(event) {
    this.pointer = this.canvasPoint(event);
  }

  handlePointer(event) {
    this.markGesture();
    const point = this.canvasPoint(event);
    this.pointer = point;
    for (const button of this.buttons) {
      if (
        point.x >= button.x && point.x <= button.x + button.w &&
        point.y >= button.y && point.y <= button.y + button.h
      ) {
        this.queue.push(button.action);
        return;
      }
    }
    this.queue.push(ACTION.jump);
  }

  // The renderer replaces the clickable buttons every frame.
  setButtons(buttons) {
    this.buttons = buttons;
  }

  drain() {
    const actions = this.queue;
    this.queue = [];
    return actions;
  }

  isPointerOver(button) {
    const p = this.pointer;
    return p.x >= button.x && p.x <= button.x + button.w && p.y >= button.y && p.y <= button.y + button.h;
  }
}
