// Vermilion Bay — hostile NPCs: Kane's goons, contract targets, the final
// boss. They chase the player, take cover poorly, and shoot back.
'use strict';
var Enemies = {
  list: [],

  spawn: function (x, y, opts) {
    opts = opts || {};
    var e = {
      x: x, y: y, angle: rand(0, Math.PI * 2), hp: opts.hp || 60,
      speed: opts.speed || 120, name: opts.name || 'Kane Goon',
      weapon: opts.weapon || 'pistol', shootCd: rand(0.5, 1.5),
      reward: opts.reward || 0, isTarget: !!opts.isTarget, onKill: opts.onKill || null,
      walkPhase: rand(0, 6),
    };
    this.list.push(e);
    return e;
  },
  spawnSquad: function (x, y, n, opts) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(this.spawn(x + rand(-90, 90), y + rand(-90, 90), opts));
    return out;
  },
  nearest: function (x, y, maxD) {
    var best = null, bd = maxD || 1e9;
    for (var i = 0; i < this.list.length; i++) {
      var d = dist(x, y, this.list[i].x, this.list[i].y);
      if (d < bd) { bd = d; best = this.list[i]; }
    }
    return best;
  },
  kill: function (e) {
    var idx = this.list.indexOf(e);
    if (idx >= 0) this.list.splice(idx, 1);
    Particles.blood(e.x, e.y);
    Game.player.kills++;
    if (e.reward > 0) {
      Game.player.cash += e.reward;
      Game.toast('+$' + fmtCash(e.reward) + ' — ' + e.name + ' eliminated');
      AudioSys.coin();
    }
    if (e.onKill) e.onKill(e);
  },
  damageArea: function (x, y, radius, dmg) {
    for (var i = this.list.length - 1; i >= 0; i--) {
      var e = this.list[i];
      if (dist(e.x, e.y, x, y) < radius) {
        e.hp -= dmg;
        if (e.hp <= 0) this.kill(e);
      }
    }
  },
  clear: function () { this.list = []; },
  update: function (dt) {
    var p = Game.player;
    for (var i = this.list.length - 1; i >= 0; i--) {
      var e = this.list[i];
      var d = dist(e.x, e.y, p.x, p.y);
      e.walkPhase += dt * 8;
      e.shootCd -= dt;
      var ta = angTo(e.x, e.y, p.x, p.y);
      e.angle = angLerp(e.angle, ta, Math.min(1, dt * 4));
      if (d > 260) {
        // Advance toward the player.
        var nx = e.x + Math.cos(e.angle) * e.speed * dt;
        var ny = e.y + Math.sin(e.angle) * e.speed * dt;
        var push = City.collideCircle(nx, ny, 12);
        if (push) { nx += push.x; ny += push.y; }
        if (!City.inWater(nx, ny)) { e.x = nx; e.y = ny; }
      } else if (d > 60) {
        // Strafe at mid range.
        var strafe = Math.sin(Game.time * 0.7 + i) * 0.6;
        e.x += Math.cos(e.angle + Math.PI / 2) * strafe * e.speed * 0.5 * dt;
        e.y += Math.sin(e.angle + Math.PI / 2) * strafe * e.speed * 0.5 * dt;
      }
      if (d < 520 && e.shootCd <= 0) {
        e.shootCd = e.weapon === 'smg' ? 0.5 : 1.1;
        var hit = Math.random() < (d < 200 ? 0.4 : 0.18);
        Particles.tracer(e.x, e.y, p.x + rand(-14, 14), p.y + rand(-14, 14));
        AudioSys.shoot(e.weapon === 'smg' ? 'smg' : 'pistol');
        if (hit) p.hurt(e.weapon === 'smg' ? 4 : 7);
      }
    }
  },
};
