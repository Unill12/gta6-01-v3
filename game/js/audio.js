// Vermilion Bay — WebAudio synth: procedural music loop + all sound effects.
// No audio files: every sound is synthesized live.
'use strict';
var AudioSys = {
  ctx: null, muted: false, musicOn: false, musicTimer: null,
  master: null, musicGain: null, sfxGain: null, engineOsc: null, engineGain: null,
  sirenOsc: null, sirenGain: null, step: 0, bpm: 116,

  init: function () {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.32;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.9;
      this.sfxGain.connect(this.master);
    } catch (e) { this.ctx = null; }
  },
  resume: function () { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  toggleMute: function () {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  },
  note: function (freq, t, dur, type, vol, dest) {
    if (!this.ctx) return;
    var o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'sawtooth'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest || this.sfxGain);
    o.start(t); o.stop(t + dur + 0.05);
  },
  noise: function (t, dur, vol, freq, dest) {
    if (!this.ctx) return;
    var len = Math.floor(this.ctx.sampleRate * dur);
    var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = this.ctx.createBufferSource(); src.buffer = buf;
    var f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq || 1200;
    var g = this.ctx.createGain(); g.gain.value = vol || 0.4;
    src.connect(f); f.connect(g); g.connect(dest || this.sfxGain);
    src.start(t);
  },
  // ---- SFX ----
  shoot: function (kind) {
    if (!this.ctx || this.muted) return;
    var t = this.ctx.currentTime;
    if (kind === 'rpg') { this.noise(t, 0.5, 0.7, 900); this.note(90, t, 0.4, 'sine', 0.6); }
    else if (kind === 'shotgun') { this.noise(t, 0.25, 0.6, 700); }
    else if (kind === 'sniper') { this.noise(t, 0.35, 0.6, 2500); this.note(140, t, 0.2, 'square', 0.2); }
    else { this.noise(t, 0.12, 0.45, 1800); }
  },
  explosion: function () {
    if (!this.ctx || this.muted) return;
    var t = this.ctx.currentTime;
    this.noise(t, 0.9, 0.9, 500); this.note(55, t, 0.8, 'sine', 0.8);
  },
  pickup: function () { if (this.ctx && !this.muted) { var t = this.ctx.currentTime; this.note(880, t, 0.09, 'sine', 0.25); this.note(1320, t + 0.09, 0.14, 'sine', 0.25); } },
  coin: function () { if (this.ctx && !this.muted) { var t = this.ctx.currentTime; this.note(1046, t, 0.08, 'square', 0.15); this.note(1568, t + 0.08, 0.16, 'square', 0.15); } },
  missionOk: function () {
    if (!this.ctx || this.muted) return;
    var t = this.ctx.currentTime, seq = [523, 659, 784, 1046];
    for (var i = 0; i < 4; i++) this.note(seq[i], t + i * 0.11, 0.22, 'triangle', 0.3);
  },
  missionFail: function () {
    if (!this.ctx || this.muted) return;
    var t = this.ctx.currentTime;
    this.note(330, t, 0.3, 'sawtooth', 0.25); this.note(220, t + 0.3, 0.5, 'sawtooth', 0.25);
  },
  phone: function () { if (this.ctx && !this.muted) { var t = this.ctx.currentTime; this.note(1200, t, 0.1, 'square', 0.12); this.note(1200, t + 0.18, 0.1, 'square', 0.12); } },
  crash: function () { if (this.ctx && !this.muted) this.noise(this.ctx.currentTime, 0.3, 0.5, 600); },
  busted: function () { if (this.ctx && !this.muted) { var t = this.ctx.currentTime; this.note(440, t, 0.15, 'square', 0.2); this.note(440, t + 0.2, 0.15, 'square', 0.2); } },
  // ---- Engine + siren loops ----
  engineStart: function () {
    if (!this.ctx) return;
    this.engineOsc = this.ctx.createOscillator(); this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 50;
    this.engineGain = this.ctx.createGain(); this.engineGain.gain.value = 0;
    var f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
    this.engineOsc.connect(f); f.connect(this.engineGain); this.engineGain.connect(this.master);
    this.engineOsc.start();
  },
  engineSet: function (speed, maxSpeed, on) {
    if (!this.engineOsc) return;
    var t = this.ctx.currentTime;
    this.engineGain.gain.setTargetAtTime(on ? 0.05 + 0.06 * (speed / maxSpeed) : 0, t, 0.1);
    this.engineOsc.frequency.setTargetAtTime(50 + 160 * (speed / maxSpeed), t, 0.1);
  },
  sirenStart: function () {
    if (!this.ctx || this.sirenOsc) return;
    this.sirenOsc = this.ctx.createOscillator(); this.sirenOsc.type = 'triangle';
    this.sirenOsc.frequency.value = 700;
    this.sirenGain = this.ctx.createGain(); this.sirenGain.gain.value = 0.0;
    this.sirenOsc.connect(this.sirenGain); this.sirenGain.connect(this.master);
    this.sirenOsc.start();
    var self = this, up = true;
    this.sirenTimer = setInterval(function () {
      if (!self.sirenOsc) return;
      up = !up;
      self.sirenOsc.frequency.setTargetAtTime(up ? 950 : 650, self.ctx.currentTime, 0.08);
    }, 320);
  },
  sirenSet: function (on) {
    if (this.sirenGain) this.sirenGain.gain.setTargetAtTime(on && !this.muted ? 0.05 : 0, this.ctx.currentTime, 0.2);
  },
  // ---- Music: 8-step bass + kick + hats + lead arp, Am–F–C–G ----
  startMusic: function () {
    if (!this.ctx || this.musicOn) return;
    this.musicOn = true;
    var self = this;
    var bassRoots = [110, 87.31, 130.81, 98]; // A2 F2 C3 G2
    var stepDur = 60 / this.bpm / 2;
    this.musicTimer = setInterval(function () {
      if (self.muted || !self.ctx) return;
      var t = self.ctx.currentTime;
      var bar = Math.floor(self.step / 8) % 4;
      var s = self.step % 8;
      var root = bassRoots[bar];
      if (s % 2 === 0) self.note(root, t, stepDur * 1.8, 'triangle', 0.5, self.musicGain);
      if (s % 2 === 0) self.note(60, t, 0.08, 'sine', 0.7, self.musicGain);
      self.note(6000 + Math.random() * 2000, t, 0.03, 'square', 0.05, self.musicGain);
      var arp = [root * 4, root * 4 * 1.189, root * 4 * 1.498, root * 6];
      if (s % 2 === 1) self.note(arp[s % 4], t, stepDur * 0.9, 'square', 0.06, self.musicGain);
      self.step++;
    }, stepDur * 1000);
  },
};
