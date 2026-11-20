// Vermilion Bay — side activities: taxi fares, street races, stunt jumps,
// contract hits and hidden packages. All pay cash and feed the HUD.
'use strict';
var Activities = {
  // ---- Taxi ----
  taxi: { active: false, stage: 'idle', px: 0, py: 0, dx: 0, dy: 0, fare: 0 },
  // ---- Races: 3 circuits, each a loop of checkpoints around a district ----
  races: [
    { name: 'Neon Loop', x: 2160, y: 1440, prize: 3000, par: 75, cps: [[2160, 1440], [2880, 1440], [2880, 2160], [2160, 2160]] },
    { name: 'Harbor Dash', x: 720, y: 1680, prize: 4000, par: 80, cps: [[720, 1680], [720, 2400], [1440, 2400], [1440, 1680]] },
    { name: 'Airport Run', x: 3600, y: 480, prize: 5000, par: 85, cps: [[3600, 480], [4320, 480], [4320, 960], [3600, 960]] },
  ],
  race: { active: false, idx: -1, cp: 0, lap: 0, time: 0, best: null },
  // ---- Contracts ----
  contracts: [],
  // ---- Packages ----
  packagesFound: 0,

  reset: function () {
    this.taxi = { active: false, stage: 'idle', px: 0, py: 0, dx: 0, dy: 0, fare: 0 };
    this.race = { active: false, idx: -1, cp: 0, lap: 0, time: 0, best: null };
    this.contracts = CONTRACTS.map(function (c) { return { name: c.name, x: c.x, y: c.y, reward: c.reward, state: 'open', target: null }; });
    this.packagesFound = 0;
  },
  // ---- Taxi ----
  toggleTaxi: function () {
    var p = Game.player;
    if (!p.car) { Game.toast('You need a car to work taxi fares (T)'); return; }
    if (this.taxi.active) { this.taxi.active = false; this.taxi.stage = 'idle'; Game.toast('Taxi shift ended'); return; }
    this.taxi.active = true; this.taxi.stage = 'pickup';
    var spot = this.randomRoadPoint(p.x, p.y, 500);
    this.taxi.px = spot.x; this.taxi.py = spot.y;
    Game.toast('Taxi: pick up the passenger at the marker');
    AudioSys.phone();
  },
  randomRoadPoint: function (cx, cy, radius) {
    for (var i = 0; i < 40; i++) {
      var x = clamp(cx + rand(-radius, radius), 200, CFG.WORLD_W - 200);
      var y = clamp(cy + rand(-radius, radius), 200, CFG.WORLD_H - 200);
      var rp = City.nearestRoadPoint(x, y);
      if (dist(rp.x, rp.y, cx, cy) > 150) return rp;
    }
    return City.nearestRoadPoint(cx + 300, cy);
  },
  updateTaxi: function (dt) {
    var t = this.taxi, p = Game.player;
    if (!t.active) return;
    if (!p.car) { t.active = false; t.stage = 'idle'; Game.toast('Taxi fare lost — you left the car'); return; }
    if (t.stage === 'pickup' && dist(p.x, p.y, t.px, t.py) < 60) {
      t.stage = 'dropoff';
      var dest = this.randomRoadPoint(p.x, p.y, 900);
      t.dx = dest.x; t.dy = dest.y;
      t.fare = Math.round(dist(p.x, p.y, t.dx, t.dy) / 12) + 120;
      if (p.car.def.id === 'taxi') t.fare = Math.round(t.fare * 1.5);
      Game.toast('Passenger aboard — fare $' + fmtCash(t.fare));
    } else if (t.stage === 'dropoff' && dist(p.x, p.y, t.dx, t.dy) < 60) {
      p.cash += t.fare;
      Game.stats.taxiFares++;
      Game.toast('Fare paid: +$' + fmtCash(t.fare));
      AudioSys.coin();
      t.stage = 'pickup';
      var spot = this.randomRoadPoint(p.x, p.y, 500);
      t.px = spot.x; t.py = spot.y;
    }
  },
  // ---- Races ----
  nearestRace: function (x, y, maxD) {
    var best = null, bd = maxD || 1e9;
    for (var i = 0; i < this.races.length; i++) {
      var d = dist(x, y, this.races[i].x, this.races[i].y);
      if (d < bd) { bd = d; best = { race: this.races[i], idx: i }; }
    }
    return best;
  },
  startRace: function (idx) {
    var p = Game.player;
    if (!p.car) { Game.toast('You need a car to race (R)'); return; }
    if (this.race.active) return;
    this.race = { active: true, idx: idx, cp: 0, lap: 0, time: 0, best: this.race.best };
    Game.toast('Race: ' + this.races[idx].name + ' — 2 laps, beat ' + this.races[idx].par + 's for the prize!');
    AudioSys.phone();
  },
  updateRace: function (dt) {
    var r = this.race, p = Game.player;
    if (!r.active) return;
    r.time += dt;
    if (!p.car) { r.active = false; Game.toast('Race abandoned — you left the car'); return; }
    var race = this.races[r.idx];
    var cp = race.cps[r.cp];
    if (dist(p.x, p.y, cp[0], cp[1]) < 70) {
      r.cp++;
      AudioSys.pickup();
      if (r.cp >= race.cps.length) {
        r.cp = 0; r.lap++;
        if (r.lap >= 2) {
          r.active = false;
          var won = r.time <= race.par;
          if (won) {
            p.cash += race.prize;
            Game.stats.racesWon++;
            Game.lastRaceWon = true;
            Game.toast('Race won in ' + r.time.toFixed(1) + 's! +$' + fmtCash(race.prize));
            AudioSys.missionOk();
          } else {
            Game.toast('Finished in ' + r.time.toFixed(1) + 's — par is ' + race.par + 's. No prize.');
          }
          Game.banner(won ? 'RACE WON' : 'RACE OVER', race.name + ' — ' + r.time.toFixed(1) + 's');
        } else Game.toast('Lap ' + (r.lap + 1) + ' of 2 — go!');
      }
    }
    if (r.time > race.par * 2.5) { r.active = false; Game.toast('Race timed out'); }
  },
  // ---- Stunt jumps ----
  checkJump: function () {
    var p = Game.player;
    if (!p.car || Game.jumpActive) return;
    var car = p.car;
    if (Math.abs(car.speed) < 320) return;
    for (var i = 0; i < JUMPS.length; i++) {
      var j = JUMPS[i];
      if (dist(car.x, car.y, j.x, j.y) < 46) {
        var dir = Math.abs(angDiff(car.angle, j.a));
        if (dir < 0.7) this.startJump(j);
        return;
      }
    }
  },
  startJump: function (j) {
    var car = Game.player.car;
    Game.jumpActive = { t: 0, dur: 0.9 + Math.abs(car.speed) / 900, jx: j.x, jy: j.y, angle: car.angle, speed: Math.abs(car.speed), reward: j.reward };
    AudioSys.pickup();
  },
  updateJump: function (dt) {
    var ja = Game.jumpActive;
    if (!ja) return;
    var car = Game.player.car;
    ja.t += dt;
    var k = ja.t / ja.dur;
    if (car) {
      car.x += Math.cos(ja.angle) * ja.speed * dt;
      car.y += Math.sin(ja.angle) * ja.speed * dt;
      car.airborne = Math.sin(Math.min(1, k) * Math.PI) * 46;
      Game.player.x = car.x; Game.player.y = car.y;
    }
    if (k >= 1) {
      Game.jumpActive = null;
      if (car) {
        car.airborne = 0;
        var airDist = ja.speed * ja.dur;
        var bonus = Math.round(ja.reward * (0.5 + airDist / 600));
        Game.player.cash += bonus;
        Game.stats.jumps++;
        Game.toast('STUNT JUMP! ' + Math.round(airDist) + ' ft — +$' + fmtCash(bonus));
        AudioSys.missionOk();
        if (City.insideBuilding(car.x, car.y, 0)) { Vehicles.damage(car, 30); Game.toast('Rough landing!'); }
      }
    }
  },
  // ---- Contracts ----
  nearestContract: function (x, y, maxD) {
    var best = null, bd = maxD || 1e9;
    for (var i = 0; i < this.contracts.length; i++) {
      var c = this.contracts[i];
      if (c.state !== 'open') continue;
      var d = dist(x, y, c.x, c.y);
      if (d < bd) { bd = d; best = { c: c, idx: i }; }
    }
    return best;
  },
  startContract: function (idx) {
    var c = this.contracts[idx];
    if (!c || c.state !== 'open') return;
    c.state = 'active';
    var self = this;
    c.target = Enemies.spawn(c.x, c.y, {
      name: c.name, hp: 90, reward: c.reward, isTarget: true,
      onKill: function () { c.state = 'done'; Game.stats.contracts++; },
    });
    Game.toast('Contract: eliminate ' + c.name + ' — $' + fmtCash(c.reward));
    AudioSys.phone();
  },
  // ---- Packages ----
  checkPackages: function () {
    var p = Game.player;
    for (var i = 0; i < City.packages.length; i++) {
      var pk = City.packages[i];
      if (pk.found) continue;
      if (dist(p.x, p.y, pk.x, pk.y) < 34) {
        pk.found = true;
        this.packagesFound++;
        p.cash += 250;
        AudioSys.coin();
        Game.toast('Hidden package ' + this.packagesFound + '/60 — +$250');
        if (this.packagesFound === 20) { p.cash += 2000; p.giveWeapon('smg', 120); Game.toast('20 packages! +$2,000 and an SMG'); }
        if (this.packagesFound === 40) { p.cash += 5000; p.armor = 100; Game.toast('40 packages! +$5,000 and full armor'); }
        if (this.packagesFound === 60) { p.cash += 15000; p.giveWeapon('rpg', 6); Game.toast('ALL 60 packages! +$15,000 and an RPG'); }
      }
    }
  },
  update: function (dt) {
    this.updateTaxi(dt);
    this.updateRace(dt);
    this.updateJump(dt);
    this.checkJump();
    this.checkPackages();
    // Auto-start a contract when the player walks up to its marker.
    var near = this.nearestContract(Game.player.x, Game.player.y, 120);
    if (near && Game.missions && !Game.missions.active) this.startContract(near.idx);
  },
};
