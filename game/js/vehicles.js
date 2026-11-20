// Vermilion Bay — vehicles: definitions, spawning, arcade driving physics,
// damage, smoke, explosions and boats/helicopters.
'use strict';
var Vehicles = {
  list: [], idc: 0,

  def: function (id) {
    for (var i = 0; i < VEHICLES.length; i++) if (VEHICLES[i].id === id) return VEHICLES[i];
    return VEHICLES[0];
  },
  spawn: function (typeId, x, y, angle, opts) {
    opts = opts || {};
    var def = this.def(typeId);
    var v = {
      id: ++this.idc, type: typeId, def: def, x: x, y: y, angle: angle || 0,
      speed: 0, health: 100, color: opts.color || def.color,
      parked: !!opts.parked, traffic: !!opts.traffic, police: typeId === 'police',
      driver: null, smoke: 0, exploded: false, airborne: 0, airTime: 0,
      vx: 0, vy: 0, steerVis: 0, horn: 0, siren: false, owned: !!opts.owned,
    };
    this.list.push(v);
    return v;
  },
  spawnParked: function (n) {
    var count = 0, guard = 0;
    while (count < n && guard++ < n * 60) {
      var type = pick(['sedan', 'coupe', 'sports', 'muscle', 'suv', 'pickup', 'van', 'convert', 'taxi', 'scooter']);
      var ax = pick(City.avenues), sy = rand(300, CFG.WORLD_H - 300);
      var useAve = Math.random() < 0.5;
      var x = useAve ? ax + (Math.random() < 0.5 ? -38 : 38) : rand(300, CFG.WORLD_W - 300);
      var y = useAve ? sy : pick(City.streets) + (Math.random() < 0.5 ? -38 : 38);
      if (City.inWater(x, y) || City.insideBuilding(x, y, 24)) continue;
      var angle = useAve ? (Math.random() < 0.5 ? -Math.PI / 2 : Math.PI / 2) : (Math.random() < 0.5 ? 0 : Math.PI);
      this.spawn(type, x, y, angle, { parked: true });
      count++;
    }
    // Boats in the harbour + sea, heli on the helipad.
    this.spawn('boat', 100, 1500, Math.PI / 2, { parked: true });
    this.spawn('boat', 100, 2100, -Math.PI / 2, { parked: true });
    this.spawn('boat', 2400, 3560, 0, { parked: true });
    this.spawn('heli', City.helipad.x, City.helipad.y, 0, { parked: true });
    this.spawn('heli', 4320, 700, Math.PI / 2, { parked: true });
  },
  nearest: function (x, y, maxD, filter) {
    var best = null, bd = maxD || 1e9;
    for (var i = 0; i < this.list.length; i++) {
      var v = this.list[i];
      if (filter && !filter(v)) continue;
      var d = dist(x, y, v.x, v.y);
      if (d < bd) { bd = d; best = v; }
    }
    return best;
  },
  // Arcade driving: accel, steering, drift, off-road grip, collisions.
  drive: function (v, dt, input, inReverse) {
    var def = v.def;
    var onRoad = City.isOnRoad(v.x, v.y) || City.onBeach(v.x, v.y);
    var grip = onRoad ? 1 : 0.55;
    if (City.inWater(v.x, v.y) && def.kind !== 'boat') grip = 0.3;
    if (def.kind === 'boat' && !City.inWater(v.x, v.y) && !City.onBeach(v.x, v.y)) grip = 0.4;
    var maxSpd = def.speed * grip;
    var fwd = input.forward, back = input.back, left = input.left, right = input.right;
    if (fwd) v.speed += def.accel * grip * dt;
    if (back) {
      if (v.speed > 20) v.speed -= def.accel * 1.4 * dt;
      else v.speed -= def.accel * 0.6 * dt; // reverse
    }
    if (!fwd && !back) v.speed -= Math.sign(v.speed) * 140 * dt;
    if (Math.abs(v.speed) < 8 && !fwd && !back) v.speed = 0;
    v.speed = clamp(v.speed, -maxSpd * 0.45, maxSpd);
    var steer = (left ? -1 : 0) + (right ? 1 : 0);
    var dir = v.speed >= 0 ? 1 : -1;
    var turnRate = def.grip * 2.1 * clamp(Math.abs(v.speed) / 120, 0, 1) * (input.handbrake ? 1.6 : 1);
    v.angle += steer * turnRate * dir * dt;
    if (input.handbrake) v.speed *= (1 - 1.6 * dt);
    var nx = v.x + Math.cos(v.angle) * v.speed * dt;
    var ny = v.y + Math.sin(v.angle) * v.speed * dt;
    // Building collision: slide along walls, spark + slow on hard hits.
    var push = City.collideCircle(nx, ny, def.l / 2 * 0.82);
    if (push) {
      var impact = Math.abs(v.speed);
      if (impact > 220) { v.health -= impact * 0.045; Particles.impact(nx, ny, 6); AudioSys.crash(); }
      v.speed *= 0.55;
      nx += push.x; ny += push.y;
    }
    var c = City.clampToWorld(nx, ny, 30);
    v.x = c.x; v.y = c.y;
    v.vx = Math.cos(v.angle) * v.speed; v.vy = Math.sin(v.angle) * v.speed;
    // Skid marks + smoke when drifting or damaged.
    if (Math.abs(steer) > 0 && Math.abs(v.speed) > 260) Particles.skid(v.x, v.y, v.angle);
    if (v.health < 40) { v.smoke += dt; if (v.smoke > 0.12) { v.smoke = 0; Particles.smoke(v.x, v.y); } }
    if (v.health <= 0 && !v.exploded) this.explode(v);
  },
  damage: function (v, dmg) {
    if (v.exploded) return;
    v.health -= dmg;
    if (v.health <= 0) this.explode(v);
  },
  explode: function (v) {
    v.exploded = true;
    Particles.explosion(v.x, v.y);
    AudioSys.explosion();
    if (typeof Game !== 'undefined' && Game.shake) Game.shake(14);
    if (typeof Game !== 'undefined' && Game.player && Game.player.car === v) Game.player.car = null;
    var idx = this.list.indexOf(v);
    if (idx >= 0) this.list.splice(idx, 1);
    // Chain: nearby vehicles take damage.
    var self = this;
    this.list.slice().forEach(function (o) {
      if (dist(o.x, o.y, v.x, v.y) < 160) self.damage(o, 60);
    });
  },
  updateTraffic: function (dt) {
    // Traffic cars cruise their road; parked cars stay put.
    for (var i = 0; i < this.list.length; i++) {
      var v = this.list[i];
      if (!v.traffic || v.driver) continue;
      var target = 200;
      if (v.speed < target) v.speed += 120 * dt;
      var nx = v.x + Math.cos(v.angle) * v.speed * dt;
      var ny = v.y + Math.sin(v.angle) * v.speed * dt;
      if (City.insideBuilding(nx, ny, 20) || City.inWater(nx, ny)) {
        // Turn at intersections or reverse out.
        v.angle += (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2 * dt * 4;
        v.speed *= 0.8;
      } else { v.x = nx; v.y = ny; }
      // Despawn far from the player, respawn near.
      if (typeof Game !== 'undefined' && Game.player && dist(v.x, v.y, Game.player.x, Game.player.y) > 1600) {
        var p = City.nearestRoadPoint(Game.player.x + rand(-900, 900), Game.player.y + rand(-900, 900));
        v.x = p.x; v.y = p.y; v.angle = City.roadAngleAt(p.x, p.y);
      }
    }
  },
  spawnTraffic: function (n) {
    for (var i = 0; i < n; i++) {
      var type = pick(['sedan', 'coupe', 'taxi', 'van', 'suv', 'pickup', 'bus', 'truck']);
      var p = City.nearestRoadPoint(rand(300, CFG.WORLD_W - 300), rand(300, CFG.WORLD_H - 300));
      var a = City.roadAngleAt(p.x, p.y);
      if (Math.random() < 0.5) a += Math.PI;
      this.spawn(type, p.x, p.y, a, { traffic: true });
    }
  },
  count: function () { return this.list.length; },
};
