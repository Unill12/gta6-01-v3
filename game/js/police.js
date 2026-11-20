// Vermilion Bay — wanted system: heat, pursuit cruisers, foot cops,
// roadblocks at 3★, police helicopter at 4★, busted / heat decay.
'use strict';
var Police = {
  wanted: 0, heat: 0, cars: [], cops: [], heli: null,
  spawnTimer: 0, decayTimer: 0, roadblockTimer: 0, bustedTimer: 0,
  roadblocks: [],

  reset: function () {
    this.wanted = 0; this.heat = 0;
    this.cars = []; this.cops = []; this.heli = null; this.roadblocks = [];
    this.spawnTimer = 0; this.decayTimer = 0; this.roadblockTimer = 0; this.bustedTimer = 0;
  },
  addHeat: function (n, x, y, witnessed) {
    if (Game.state !== 'play') return;
    this.heat = clamp(this.heat + n, 0, 520);
    var w = this.wantedLevel();
    if (w > this.wanted) {
      this.wanted = w;
      if (w >= 2) Game.toast('Wanted level ' + w + ' — police are coming!');
      if (w >= 4 && !this.heli) this.spawnHeli();
    }
    this.decayTimer = 0;
  },
  wantedLevel: function () {
    if (this.heat <= 0) return 0;
    if (this.heat < 100) return 1;
    if (this.heat < 200) return 2;
    if (this.heat < 320) return 3;
    if (this.heat < 440) return 4;
    return 5;
  },
  spawnHeli: function () {
    this.heli = { x: Game.player.x + 400, y: Game.player.y - 400, angle: 0, hp: 200, searchlight: 0 };
    AudioSys.sirenStart();
  },
  spawnCruiser: function () {
    var p = Game.player;
    var rp = City.nearestRoadPoint(p.x + rand(-700, 700), p.y + rand(-700, 700));
    var car = Vehicles.spawn('police', rp.x, rp.y, City.roadAngleAt(rp.x, rp.y), {});
    car.police = true; car.siren = true;
    this.cars.push(car);
    return car;
  },
  spawnCop: function (x, y) {
    var c = { x: x, y: y, angle: 0, hp: 50, speed: 130, state: 'chase', shootCd: 0 };
    this.cops.push(c);
    return c;
  },
  nearestCop: function (x, y, maxD) {
    var best = null, bd = maxD || 1e9;
    for (var i = 0; i < this.cops.length; i++) {
      var d = dist(x, y, this.cops[i].x, this.cops[i].y);
      if (d < bd) { bd = d; best = this.cops[i]; }
    }
    return best;
  },
  killCop: function (cop) {
    var idx = this.cops.indexOf(cop);
    if (idx >= 0) this.cops.splice(idx, 1);
    Particles.blood(cop.x, cop.y);
    this.addHeat(40, cop.x, cop.y, true);
    Game.player.kills++;
  },
  damageArea: function (x, y, radius, dmg) {
    for (var i = this.cops.length - 1; i >= 0; i--) {
      var c = this.cops[i];
      if (dist(c.x, c.y, x, y) < radius) {
        c.hp -= dmg;
        if (c.hp <= 0) this.killCop(c);
      }
    }
    if (this.heli && dist(this.heli.x, this.heli.y, x, y) < radius) {
      this.heli.hp -= dmg;
      if (this.heli.hp <= 0) {
        Particles.explosion(this.heli.x, this.heli.y);
        this.heli = null;
        this.addHeat(30, x, y, true);
      }
    }
  },
  makeRoadblock: function () {
    var p = Game.player;
    var dir = p.car ? p.car.angle : p.angle;
    var bx = p.x + Math.cos(dir) * 420, by = p.y + Math.sin(dir) * 420;
    var rp = City.nearestRoadPoint(bx, by);
    var angle = City.roadAngleAt(rp.x, rp.y);
    for (var i = -1; i <= 1; i++) {
      var ox = rp.x + Math.cos(angle + Math.PI / 2) * i * 52;
      var oy = rp.y + Math.sin(angle + Math.PI / 2) * i * 52;
      var car = Vehicles.spawn('police', ox, oy, angle + Math.PI / 2, { parked: true });
      car.police = true; car.roadblock = true;
      this.cars.push(car);
      this.roadblocks.push(car);
    }
    var cop = this.spawnCop(rp.x + 60, rp.y);
    cop.state = 'block';
    Game.toast('Roadblock ahead!');
  },
  update: function (dt) {
    var p = Game.player;
    this.wanted = this.wantedLevel();
    if (this.wanted === 0) {
      // Stand down: cruisers wander off, heli leaves.
      if (this.cars.length) {
        for (var i = this.cars.length - 1; i >= 0; i--) {
          var c = this.cars[i];
          if (!c.driver) { c.police = false; c.siren = false; }
        }
        this.cars = this.cars.filter(function (c) { return c.driver; });
      }
      this.roadblocks = [];
      if (this.heli) this.heli = null;
      AudioSys.sirenSet(false);
      return;
    }
    // Heat decays when no crime recently and no cop sees the player.
    this.decayTimer += dt;
    var copNear = this.nearestCop(p.x, p.y, 420) || this.cars.some(function (c) { return dist(c.x, c.y, p.x, p.y) < 420; });
    if (this.decayTimer > 14 && !copNear) {
      this.heat = Math.max(0, this.heat - 22 * dt);
      this.decayTimer = 0;
    }
    // Spawn pursuit cruisers up to the wanted cap.
    var cap = this.wanted + 1;
    this.spawnTimer -= dt;
    if (this.cars.length < cap && this.spawnTimer <= 0) {
      this.spawnCruiser();
      this.spawnTimer = 4;
    }
    // Roadblocks at 3★+.
    this.roadblockTimer -= dt;
    if (this.wanted >= 3 && this.roadblockTimer <= 0 && this.roadblocks.length < 2) {
      this.makeRoadblock();
      this.roadblockTimer = 18;
    }
    // Pursuit steering for cruisers.
    for (var ci = 0; ci < this.cars.length; ci++) {
      var car = this.cars[ci];
      if (!car || car.exploded || car.roadblock) continue;
      var want = angTo(car.x, car.y, p.x, p.y);
      var diff = angDiff(car.angle, want);
      car.angle += clamp(diff, -2.4 * dt, 2.4 * dt);
      var target = this.wanted >= 2 ? 520 : 380;
      if (car.speed < target) car.speed += 300 * dt;
      var nx = car.x + Math.cos(car.angle) * car.speed * dt;
      var ny = car.y + Math.sin(car.angle) * car.speed * dt;
      var push = City.collideCircle(nx, ny, 34);
      if (push) {
        nx += push.x; ny += push.y; car.speed *= 0.6;
        // Wall slide: head-on into a wall makes zero progress.
        var tx = -push.y, ty = push.x, tl = Math.hypot(tx, ty) || 1;
        tx /= tl; ty /= tl;
        if ((p.x - car.x) * tx + (p.y - car.y) * ty < 0) { tx = -tx; ty = -ty; }
        nx += tx * car.speed * dt * 0.9; ny += ty * car.speed * dt * 0.9;
        var push2 = City.collideCircle(nx, ny, 34);
        if (push2) { nx += push2.x; ny += push2.y; }
      }
      var cc = City.clampToWorld(nx, ny, 30);
      car.x = cc.x; car.y = cc.y;
      // Ram the player.
      if (p.car && dist(car.x, car.y, p.x, p.y) < 52) {
        Vehicles.damage(p.car, 25 * dt);
        car.speed *= 0.7;
        if (Math.random() < dt * 2) AudioSys.crash();
      }
      // Cops bail out and chase on foot when close and player is on foot.
      if (p.onFoot && dist(car.x, car.y, p.x, p.y) < 120 && this.cops.length < 3 && Math.random() < dt * 0.5) {
        var cop = this.spawnCop(car.x + rand(-30, 30), car.y + rand(-30, 30));
        cop.state = 'chase';
      }
    }
    // Foot cops chase and shoot.
    for (var k = this.cops.length - 1; k >= 0; k--) {
      var cop = this.cops[k];
      var d = dist(cop.x, cop.y, p.x, p.y);
      cop.shootCd -= dt;
      if (cop.state === 'chase') {
        var ca = angTo(cop.x, cop.y, p.x, p.y);
        cop.angle = angLerp(cop.angle, ca, Math.min(1, dt * 5));
        if (d > 34) {
          cop.x += Math.cos(cop.angle) * cop.speed * dt;
          cop.y += Math.sin(cop.angle) * cop.speed * dt;
        }
        if (d < 300 && cop.shootCd <= 0 && p.onFoot) {
          cop.shootCd = 0.9;
          if (Math.random() < 0.4) { p.hurt(6); Particles.tracer(cop.x, cop.y, p.x, p.y); AudioSys.shoot('pistol'); }
        }
        // Busted: cop corners the player on foot.
        if (d < 30 && p.onFoot) {
          this.bustedTimer += dt;
          if (this.bustedTimer > 1.6) { this.bustedTimer = 0; Game.die('busted'); return; }
        } else this.bustedTimer = 0;
      }
    }
    // Helicopter circles, spotlights, shoots at 4★+.
    if (this.heli) {
      var h = this.heli;
      h.angle += dt * 0.7;
      var hx = p.x + Math.cos(h.angle) * 260, hy = p.y + Math.sin(h.angle) * 260;
      h.x = lerp(h.x, hx, dt * 2); h.y = lerp(h.y, hy, dt * 2);
      h.searchlight += dt;
      if (this.wanted >= 4 && Math.random() < dt * 0.8) {
        if (Math.random() < 0.35) { p.hurt(5); Particles.tracer(h.x, h.y, p.x, p.y); AudioSys.shoot('rifle'); }
      }
      AudioSys.sirenSet(true);
    } else if (this.wanted >= 1) {
      AudioSys.sirenSet(this.cars.length > 0);
    }
  },
};
