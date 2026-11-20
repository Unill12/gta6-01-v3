// Vermilion Bay — the player: Maya "Vex" Rook, on foot and behind the wheel.
// Movement, aiming, shooting, weapons, entering/exiting vehicles, health.
'use strict';
var Player = {
  x: 3600, y: 2100, angle: 0, r: 14,
  health: 100, armor: 0, cash: 500,
  car: null, onFoot: true,
  weaponIdx: 0, weapons: [], ammo: {},
  fireCooldown: 0, sprint: 0, speed: 0,
  kills: 0, carsStolen: 0, deaths: 0,

  reset: function (spawnX, spawnY) {
    this.x = spawnX; this.y = spawnY; this.angle = -Math.PI / 2;
    this.health = 100; this.armor = 0; this.cash = 500;
    this.car = null; this.onFoot = true; this.weaponIdx = 0;
    this.weapons = ['fist', 'pistol']; this.ammo = { pistol: 60 };
    this.fireCooldown = 0; this.kills = 0; this.carsStolen = 0;
  },
  weapon: function () { return WEAPONS[this.weaponIdx] || WEAPONS[0]; },
  giveWeapon: function (id, ammo) {
    if (this.weapons.indexOf(id) < 0) this.weapons.push(id);
    this.ammo[id] = (this.ammo[id] || 0) + (ammo || 60);
  },
  hasWeapon: function (id) { return this.weapons.indexOf(id) >= 0; },
  selectWeapon: function (idx) {
    if (idx >= 0 && idx < this.weapons.length) this.weaponIdx = idx;
  },
  hurt: function (dmg) {
    if (Game.state !== 'play') return;
    if (this.armor > 0) {
      var absorbed = Math.min(this.armor, dmg * 0.6);
      this.armor -= absorbed; dmg -= absorbed;
    }
    this.health -= dmg;
    Game.damageFlash = Math.min(1, Game.damageFlash + dmg / 60);
    if (this.health <= 0) { this.health = 0; Game.die('wasted'); }
  },
  heal: function (n) { this.health = clamp(this.health + n, 0, 100); },

  update: function (dt) {
    this.fireCooldown -= dt;
    if (this.car) { this.updateDriving(dt); return; }
    var mx = 0, my = 0;
    if (Input.down('KeyW') || Input.down('ArrowUp')) my -= 1;
    if (Input.down('KeyS') || Input.down('ArrowDown')) my += 1;
    if (Input.down('KeyA') || Input.down('ArrowLeft')) mx -= 1;
    if (Input.down('KeyD') || Input.down('ArrowRight')) mx += 1;
    var sprinting = Input.down('ShiftLeft') || Input.down('ShiftRight');
    var spd = sprinting ? 235 : 150;
    if (mx !== 0 || my !== 0) {
      var len = Math.sqrt(mx * mx + my * my);
      mx /= len; my /= len;
      this.speed = spd;
    } else this.speed = 0;
    var nx = this.x + mx * spd * dt, ny = this.y + my * spd * dt;
    var push = City.collideCircle(nx, ny, this.r);
    if (push) { nx += push.x; ny += push.y; }
    if (!City.inWater(nx, ny) || City.isOnBridge(nx, ny)) {
      var c = City.clampToWorld(nx, ny, this.r);
      this.x = c.x; this.y = c.y;
    }
    // Aim at the mouse (screen -> world).
    var cam = Game.camera;
    var wx = cam.x + (Input.mouseX - CFG.VIEW_W / 2) / cam.zoom;
    var wy = cam.y + (Input.mouseY - CFG.VIEW_H / 2) / cam.zoom;
    this.angle = angTo(this.x, this.y, wx, wy);
    // Weapon switching 1-8.
    for (var k = 0; k < 8; k++) {
      if (Input.wasPressed('Digit' + (k + 1))) this.selectWeapon(k);
    }
    if (Input.mouseDown) this.shoot();
    if (Input.wasPressed('KeyE')) this.tryEnterVehicle();
  },
  updateDriving: function (dt) {
    var car = this.car;
    if (!car) { this.onFoot = true; return; }
    var input = {
      forward: Input.down('KeyW') || Input.down('ArrowUp'),
      back: Input.down('KeyS') || Input.down('ArrowDown'),
      left: Input.down('KeyA') || Input.down('ArrowLeft'),
      right: Input.down('KeyD') || Input.down('ArrowRight'),
      handbrake: Input.down('Space'),
    };
    Vehicles.drive(car, dt, input);
    this.x = car.x; this.y = car.y; this.angle = car.angle;
    this.speed = Math.abs(car.speed);
    AudioSys.engineSet(Math.abs(car.speed), car.def.speed, true);
    if (Input.wasPressed('KeyE')) this.exitVehicle();
    // Drive-by shooting is not allowed; horn on H.
    if (Input.wasPressed('KeyH')) AudioSys.pickup();
  },
  tryEnterVehicle: function () {
    var v = Vehicles.nearest(this.x, this.y, 64, function (c) { return !c.exploded && !c.driver; });
    if (!v) return;
    if (v.traffic) {
      v.traffic = false;
      this.carsStolen++;
      if (Game.police) Game.police.addHeat(12, this.x, this.y, true);
      Game.toast('Stolen: ' + v.def.name);
    }
    v.driver = this; v.parked = false;
    this.car = v; this.onFoot = false;
    AudioSys.engineStart();
  },
  exitVehicle: function () {
    var car = this.car;
    if (!car) return;
    car.driver = null;
    this.car = null; this.onFoot = true;
    var side = this.angle + Math.PI / 2;
    this.x = car.x + Math.cos(side) * 46;
    this.y = car.y + Math.sin(side) * 46;
    var push = City.collideCircle(this.x, this.y, this.r);
    if (push) { this.x += push.x; this.y += push.y; }
    AudioSys.engineSet(0, 1, false);
  },
  shoot: function () {
    if (this.fireCooldown > 0) return;
    var w = this.weapon();
    if (w.id !== 'fist') {
      var a = this.ammo[w.id] || 0;
      if (a <= 0) { this.fireCooldown = 0.3; Game.toast('Out of ammo — buy more at Ironworks Arms'); return; }
      this.ammo[w.id] = a - 1;
    }
    this.fireCooldown = 1 / w.rate;
    AudioSys.shoot(w.id);
    var pellets = w.pellets || 1;
    for (var i = 0; i < pellets; i++) {
      var a = this.angle + (Math.random() - 0.5) * w.spread * 2;
      this.fireBullet(a, w);
    }
    Particles.muzzle(this.x + Math.cos(this.angle) * 22, this.y + Math.sin(this.angle) * 22, this.angle);
    if (Game.police) Game.police.addHeat(6, this.x, this.y, false);
    Entities.panic(this.x, this.y, 320);
  },
  fireBullet: function (angle, w) {
    var range = w.range;
    var x = this.x, y = this.y;
    var self = this;
    function hitAt(hx, hy) {
      if (w.explosive) {
        Particles.explosion(hx, hy);
        AudioSys.explosion();
        if (Game.enemies) Game.enemies.damageArea(hx, hy, 130, w.dmg);
        if (Game.police) Game.police.damageArea(hx, hy, 130, w.dmg);
        var pv = Vehicles.nearest(hx, hy, 130);
        if (pv) Vehicles.damage(pv, w.dmg);
      } else if (w.fire) {
        Particles.firePatch(hx, hy);
        if (Game.enemies) Game.enemies.damageArea(hx, hy, 90, w.dmg);
      }
    }
    var step = 14;
    for (var d = 0; d < range; d += step) {
      x += Math.cos(angle) * step; y += Math.sin(angle) * step;
      if (City.insideBuilding(x, y, 0)) { Particles.impact(x, y, 3); hitAt(x, y); return; }
      if (x < 0 || y < 0 || x > CFG.WORLD_W || y > CFG.WORLD_H) { hitAt(x, y); return; }
      // Hit a pedestrian.
      var ped = Entities.nearestPed(x, y, 16);
      if (ped) {
        ped.hp -= w.dmg;
        if (ped.hp <= 0) { Entities.kill(ped); this.kills++; if (Game.police) Game.police.addHeat(25, x, y, true); }
        else Entities.panic(x, y, 200);
        hitAt(x, y);
        return;
      }
      // Hit an enemy (mission goons / cops).
      var en = Game.enemies ? Game.enemies.nearest(x, y, 18) : null;
      if (en) {
        en.hp -= w.dmg;
        Particles.blood(x, y);
        if (en.hp <= 0) Game.enemies.kill(en);
        hitAt(x, y);
        return;
      }
      // Hit a vehicle.
      var v = Vehicles.nearest(x, y, 24, function (c) { return c !== Game.player.car; });
      if (v) {
        if (w.explosive) Vehicles.damage(v, w.dmg);
        else { v.health -= w.dmg * 0.4; if (v.health <= 0) Vehicles.damage(v, 1); }
        Particles.impact(x, y, 4);
        hitAt(x, y);
        return;
      }
      // Hit a police officer on foot.
      var cop = Game.police ? Game.police.nearestCop(x, y, 16) : null;
      if (cop) {
        cop.hp -= w.dmg;
        if (cop.hp <= 0) Game.police.killCop(cop);
        hitAt(x, y);
        return;
      }
    }
    hitAt(x, y);
    // Tracer end.
    Particles.tracer(this.x, this.y, x, y);
  },
};
