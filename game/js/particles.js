// Vermilion Bay — particles: explosions, smoke, sparks, skid marks, tracers,
// muzzle flashes, fire patches and floating pickups.
'use strict';
var Particles = {
  list: [], skids: [], fires: [],

  spawn: function (x, y, vx, vy, life, size, color, grav) {
    if (this.list.length > 420) return;
    this.list.push({ x: x, y: y, vx: vx, vy: vy, life: life, maxLife: life, size: size, color: color, grav: grav || 0 });
  },
  explosion: function (x, y) {
    for (var i = 0; i < 34; i++) {
      var a = rand(0, Math.PI * 2), s = rand(60, 420);
      this.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(0.4, 1.1), rand(4, 12), pick(['#ffdd55', '#ff8833', '#ff5522', '#ffcc88']), 60);
    }
    for (var j = 0; j < 14; j++) {
      var a2 = rand(0, Math.PI * 2), s2 = rand(10, 90);
      this.spawn(x, y, Math.cos(a2) * s2, Math.sin(a2) * s2 - 40, rand(1, 2.2), rand(10, 22), 'rgba(60,60,60,0.7)', -20);
    }
    if (typeof Game !== 'undefined' && Game.shake) Game.shake(10);
  },
  smoke: function (x, y) {
    this.spawn(x, y, rand(-12, 12), rand(-50, -20), rand(0.8, 1.6), rand(8, 16), 'rgba(80,80,80,0.55)', -30);
  },
  impact: function (x, y, n) {
    for (var i = 0; i < (n || 4); i++) {
      var a = rand(0, Math.PI * 2), s = rand(40, 180);
      this.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(0.15, 0.4), rand(2, 4), '#ffcc66', 0);
    }
  },
  blood: function (x, y) {
    for (var i = 0; i < 8; i++) {
      var a = rand(0, Math.PI * 2), s = rand(20, 120);
      this.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(0.3, 0.7), rand(2, 5), '#a01818', 0);
    }
  },
  muzzle: function (x, y, angle) {
    for (var i = 0; i < 4; i++) {
      var a = angle + rand(-0.3, 0.3), s = rand(200, 380);
      this.spawn(x, y, Math.cos(a) * s, Math.sin(a) * s, 0.08, rand(2, 4), '#ffe680', 0);
    }
  },
  tracer: function (x1, y1, x2, y2) {
    this.list.push({ x: x1, y: y1, x2: x2, y2: y2, life: 0.09, maxLife: 0.09, tracer: true, size: 2, color: '#fff0a0' });
  },
  skid: function (x, y, angle) {
    if (this.skids.length > 300) this.skids.shift();
    var px = Math.cos(angle + Math.PI / 2) * 16, py = Math.sin(angle + Math.PI / 2) * 16;
    this.skids.push({ x: x + px, y: y + py, x2: x - px, y2: y - py, life: 6 });
  },
  firePatch: function (x, y) {
    this.fires.push({ x: x, y: y, life: 6, r: 70 });
  },
  update: function (dt) {
    for (var i = this.list.length - 1; i >= 0; i--) {
      var p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) { this.list.splice(i, 1); continue; }
      p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt;
      p.vy += (p.grav || 0) * dt;
    }
    for (var j = this.skids.length - 1; j >= 0; j--) {
      this.skids[j].life -= dt;
      if (this.skids[j].life <= 0) this.skids.splice(j, 1);
    }
    for (var k = this.fires.length - 1; k >= 0; k--) {
      var f = this.fires[k];
      f.life -= dt;
      if (f.life <= 0) { this.fires.splice(k, 1); continue; }
      if (Math.random() < dt * 20) {
        var a = rand(0, Math.PI * 2), r = rand(0, f.r * 0.7);
        this.spawn(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, rand(-10, 10), rand(-60, -20), rand(0.3, 0.8), rand(4, 10), pick(['#ff8833', '#ffcc55', '#ff5522']), -40);
      }
      // Fire hurts anyone standing in it.
      var p1 = Game.player;
      if (p1 && p1.onFoot && dist(p1.x, p1.y, f.x, f.y) < f.r) p1.hurt(18 * dt);
    }
  },
  draw: function (ctx) {
    // Skid marks under everything.
    ctx.strokeStyle = 'rgba(20,20,20,0.5)';
    ctx.lineWidth = 4;
    for (var s = 0; s < this.skids.length; s++) {
      var k = this.skids[s];
      ctx.globalAlpha = Math.min(1, k.life / 2);
      ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.lineTo(k.x2, k.y2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Fire patches.
    for (var f = 0; f < this.fires.length; f++) {
      var fp = this.fires[f];
      var g = ctx.createRadialGradient(fp.x, fp.y, 4, fp.x, fp.y, fp.r);
      g.addColorStop(0, 'rgba(255,140,40,0.5)');
      g.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(fp.x, fp.y, fp.r, 0, Math.PI * 2); ctx.fill();
    }
    // Particles.
    for (var i = 0; i < this.list.length; i++) {
      var p = this.list[i];
      if (p.tracer) {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.strokeStyle = p.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x2, p.y2); ctx.stroke();
        ctx.globalAlpha = 1;
        continue;
      }
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.5 + p.life / p.maxLife), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
};
