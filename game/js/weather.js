// Vermilion Bay — day/night cycle and weather: sun, rain, lightning.
'use strict';
var Weather = {
  time: 480, // minutes since midnight (08:00 start)
  day: 1,
  rain: 0, // 0..1 intensity
  rainTimer: 200, lightning: 0, flash: 0,

  reset: function () { this.time = 480; this.day = 1; this.rain = 0; this.rainTimer = 200; this.flash = 0; },
  update: function (dt) {
    this.time += dt * 0.9; // ~1 game hour per 67 real seconds
    if (this.time >= 1440) { this.time -= 1440; this.day++; Economy.onNewDay(); }
    // Rain comes and goes.
    this.rainTimer -= dt;
    if (this.rainTimer <= 0) {
      if (this.rain > 0) { this.rain = 0; this.rainTimer = rand(150, 320); }
      else { this.rain = rand(0.4, 1); this.rainTimer = rand(45, 110); }
    }
    if (this.rain > 0.5 && Math.random() < dt * 0.06) { this.flash = 0.25; AudioSys.noise(AudioSys.ctx ? AudioSys.ctx.currentTime : 0, 0.4, 0.12, 300); }
    if (this.flash > 0) this.flash -= dt;
  },
  isNight: function () { return this.time < 360 || this.time > 1140; },
  isDusk: function () { return (this.time >= 1020 && this.time <= 1140) || (this.time >= 300 && this.time <= 420); },
  // 0 = noon bright, 1 = midnight dark.
  darkness: function () {
    var t = this.time;
    if (t >= 600 && t <= 1020) return 0;
    if (t >= 1140 || t <= 300) return 0.85;
    if (t > 1020) return (t - 1020) / 120 * 0.85;
    if (t < 360) return 0.85 - (t - 300) / 60 * 0.85;
    return (600 - t) / 240 * 0.85;
  },
  icon: function () {
    if (this.rain > 0.4) return '🌧';
    if (this.isNight()) return '🌙';
    if (this.isDusk()) return '🌇';
    return '☀';
  },
};
