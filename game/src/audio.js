// Turkey Run — sound effects, synthesised with WebAudio.
// audio.js: no audio files are shipped; every gobble, chime and thud
// is built from oscillators and filtered noise at run time, so the
// game stays a handful of static files with no network request.
// Audio starts only after the player's first gesture (browser policy).

export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
    this.master = null;
  }

  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') void this.context.resume();
      return;
    }
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (!Ctor) return;
    this.context = new Ctor();
    this.master = this.context.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.context.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  tone({ freq = 440, freqEnd = null, type = 'sine', dur = 0.12, vol = 0.3, delay = 0 }) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + delay;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise({ dur = 0.15, vol = 0.3, delay = 0, low = 400 }) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + delay;
    const len = Math.max(1, Math.floor(this.context.sampleRate * dur));
    const buffer = this.context.createBuffer(1, len, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.context.createBufferSource();
    src.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = low;
    const gain = this.context.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  gobble() {
    // Three quick "gob-gob-gob" blips, falling in pitch.
    [520, 430, 340].forEach((freq, i) => {
      this.tone({ freq, freqEnd: freq * 0.7, type: 'square', dur: 0.09, vol: 0.14, delay: i * 0.11 });
    });
  }

  jump() {
    this.tone({ freq: 300, freqEnd: 640, type: 'sine', dur: 0.16, vol: 0.22 });
  }

  slide() {
    this.noise({ dur: 0.18, vol: 0.12, low: 900 });
  }

  corn() {
    this.tone({ freq: 880, type: 'sine', dur: 0.09, vol: 0.22 });
    this.tone({ freq: 1318, type: 'sine', dur: 0.14, vol: 0.2, delay: 0.07 });
  }

  pie() {
    [523, 659, 784, 1046].forEach((freq, i) => {
      this.tone({ freq, type: 'triangle', dur: 0.12, vol: 0.2, delay: i * 0.06 });
    });
  }

  feather() {
    [1046, 1318, 1568].forEach((freq, i) => {
      this.tone({ freq, type: 'sine', dur: 0.16, vol: 0.18, delay: i * 0.08 });
    });
  }

  hit() {
    this.noise({ dur: 0.22, vol: 0.4, low: 300 });
    this.tone({ freq: 160, freqEnd: 55, type: 'sawtooth', dur: 0.25, vol: 0.28 });
  }

  caught() {
    [392, 330, 262, 196].forEach((freq, i) => {
      this.tone({ freq, type: 'sawtooth', dur: 0.22, vol: 0.2, delay: i * 0.16 });
    });
  }

  escaped() {
    [523, 659, 784, 1046, 1318].forEach((freq, i) => {
      this.tone({ freq, type: 'triangle', dur: 0.22, vol: 0.22, delay: i * 0.09 });
    });
    this.tone({ freq: 1568, type: 'sine', dur: 0.5, vol: 0.18, delay: 0.5 });
  }
}
