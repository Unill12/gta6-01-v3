// Vermilion Bay — pedestrians: sidewalk walkers, shoppers, runners, and
// the crowd that flees gunfire. Plus the game's ambient population manager.
'use strict';
var Entities = {
  peds: [], idc: 0,
  SKINS: ['#e8b88a', '#c89878', '#8a5a3a', '#f0c8a0', '#6a4a2a', '#d8a878'],
  SHIRTS: ['#c84a4a', '#4a7ac8', '#4aa84a', '#e8c84a', '#8a4ac8', '#e8e8e8', '#2a2a2a', '#e870a0'],

  spawnPed: function (x, y) {
    var p = {
      id: ++this.idc, x: x, y: y, angle: rand(0, Math.PI * 2),
      speed: rand(28, 52), skin: pick(this.SKINS), shirt: pick(this.SHIRTS),
      tx: x, ty: y, wait: rand(0, 3), fleeing: 0, dead: false, hp: 30,
      walkPhase: rand(0, 6), kind: Math.random() < 0.12 ? 'runner' : 'walker',
    };
    if (p.kind === 'runner') p.speed = rand(80, 110);
    this.peds.push(p);
    return p;
  },
  spawnCrowd: function (n, cx, cy, radius) {
    for (var i = 0; i < n; i++) {
      var a = rand(0, Math.PI * 2), r = rand(0, radius || 800);
      var x = clamp(cx + Math.cos(a) * r, 60, CFG.WORLD_W - 60);
      var y = clamp(cy + Math.sin(a) * r, 60, CFG.WORLD_H - 60);
      if (City.inWater(x, y) || City.insideBuilding(x, y, 10)) continue;
      this.spawnPed(x, y);
    }
  },
  nearestPed: function (x, y, maxD) {
    var best = null, bd = maxD || 1e9;
    for (var i = 0; i < this.peds.length; i++) {
      var p = this.peds[i];
      if (p.dead) continue;
      var d = dist(x, y, p.x, p.y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  },
  panic: function (x, y, radius) {
    for (var i = 0; i < this.peds.length; i++) {
      var p = this.peds[i];
      if (p.dead) continue;
      if (dist(p.x, p.y, x, y) < radius) {
        p.fleeing = rand(3, 6);
        p.angle = angTo(x, y, p.x, p.y);
      }
    }
  },
  kill: function (p) {
    p.dead = true;
    Particles.blood(p.x, p.y);
    var idx = this.peds.indexOf(p);
    if (idx >= 0) this.peds.splice(idx, 1);
  },
  update: function (dt) {
    var px = Game.player ? Game.player.x : 0, py = Game.player ? Game.player.y : 0;
    for (var i = this.peds.length - 1; i >= 0; i--) {
      var p = this.peds[i];
      if (p.dead) { this.peds.splice(i, 1); continue; }
      p.walkPhase += dt * (p.fleeing > 0 ? 14 : 7);
      var spd = p.speed;
      if (p.fleeing > 0) { p.fleeing -= dt; spd = p.speed * 2.6; }
      else if (p.wait > 0) { p.wait -= dt; continue; }
      else if (dist(p.x, p.y, p.tx, p.ty) < 14) {
        if (Math.random() < 0.3) { p.wait = rand(1, 4); continue; }
        this.newTarget(p);
      }
      var ta = angTo(p.x, p.y, p.tx, p.ty);
      if (p.fleeing > 0) ta = p.angle;
      p.angle = angLerp(p.angle, ta, Math.min(1, dt * 6));
      var nx = p.x + Math.cos(p.angle) * spd * dt;
      var ny = p.y + Math.sin(p.angle) * spd * dt;
      var push = City.collideCircle(nx, ny, 12);
      if (push) { nx += push.x; ny += push.y; this.newTarget(p); }
      if (City.inWater(nx, ny)) { this.newTarget(p); continue; }
      var c = City.clampToWorld(nx, ny, 14);
      p.x = c.x; p.y = c.y;
    }
    // Keep the crowd topped up near the player.
    if (this.peds.length < 42) this.spawnCrowd(6, px, py, 900);
    if (this.peds.length > 90) this.peds.splice(0, this.peds.length - 90);
  },
  newTarget: function (p) {
    // Walk along a sidewalk: snap to a nearby road edge and stroll down it.
    var rp = City.nearestRoadPoint(p.x + rand(-260, 260), p.y + rand(-260, 260));
    var horiz = Math.abs(rp.y - p.y) < Math.abs(rp.x - p.x);
    if (horiz) { p.tx = rp.x + rand(-160, 160); p.ty = rp.y + (Math.random() < 0.5 ? -62 : 62); }
    else { p.tx = rp.x + (Math.random() < 0.5 ? -62 : 62); p.ty = rp.y + rand(-160, 160); }
    p.tx = clamp(p.tx, 40, CFG.WORLD_W - 40);
    p.ty = clamp(p.ty, 40, CFG.WORLD_H - 40);
  },
};
