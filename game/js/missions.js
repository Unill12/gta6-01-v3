// Vermilion Bay — the story: 12 missions. Maya "Vex" Rook returns to the Bay
// to avenge her brother Danny and take the city back from Silas Kane.
'use strict';
var Missions = {
  index: 0, step: 0, active: false, done: false,
  stepState: null, timer: 0, killed: 0, collected: 0, destroyed: 0,
  convoy: [], boss: null,

  DEFS: [
    { id: 'homecoming', title: '1. Homecoming', brief: 'Jules: "Vex, you\'re back. Get to the safehouse — we need to talk about Danny."',
      steps: [{ type: 'goto', x: 3600, y: 2160, text: 'Drive to your safehouse in the Hills' }] },
    { id: 'hotwheels', title: '2. Hot Wheels', brief: 'Jules: "We need wheels with bite. Steal the Comet GT from Vex Motors and bring it home."',
      steps: [
        { type: 'goto', x: 1920, y: 2160, text: 'Go to Vex Motors showroom' },
        { type: 'enterCar', carType: 'sports', text: 'Steal the Comet GT' },
        { type: 'gotoCar', x: 3600, y: 2160, text: 'Deliver the Comet GT to the safehouse' },
      ] },
    { id: 'oldfriends', title: '3. Old Friends', brief: 'Jules: "Kane\'s goons are watching the university. Clear them out so we can meet."',
      steps: [
        { type: 'goto', x: 480, y: 960, text: 'Meet Jules at Bay University' },
        { type: 'kill', n: 5, x: 480, y: 960, text: 'Take out Kane\'s goons (0/5)' },
      ] },
    { id: 'shakedown', title: '4. The Shakedown', brief: 'Big Ray: "The shops on Old Town owe us protection money. Collect it. Politely."',
      steps: [
        { type: 'goto', x: 720, y: 480, text: 'Collect from the Old Town deli' },
        { type: 'goto', x: 1200, y: 720, text: 'Collect from the corner store' },
        { type: 'goto', x: 480, y: 1200, text: 'Collect from the pawn shop' },
      ] },
    { id: 'pier', title: '5. Pier Pressure', brief: 'Nico: "A package is waiting at the lighthouse. Take the boat — the roads are watched."',
      steps: [
        { type: 'goto', x: 240, y: 3120, text: 'Reach the Old Lighthouse' },
        { type: 'enterCar', carType: 'boat', text: 'Board the speedboat' },
        { type: 'gotoCar', x: 100, y: 2100, text: 'Deliver the package to the docks by boat' },
      ] },
    { id: 'neon', title: '6. Neon Nights', brief: 'Jules: "The Neon Loop street race pays big. Win it and Kane will notice you."',
      steps: [
        { type: 'gotoCar', x: 2160, y: 1440, text: 'Get to the Neon Loop start line' },
        { type: 'race', raceIdx: 0, text: 'Win the Neon Loop (2 laps, beat 75s)' },
      ] },
    { id: 'casino', title: '7. Inside Job', brief: 'Big Ray: "The Lucky Palm vault is full of Kane\'s cash. Grab the bags and run."',
      steps: [
        { type: 'goto', x: 2160, y: 1680, text: 'Enter the Lucky Palm Casino' },
        { type: 'collect', n: 4, spots: [[2100, 1620], [2220, 1620], [2100, 1740], [2220, 1740]], text: 'Grab the money bags (0/4)' },
        { type: 'goto', x: 3600, y: 2160, text: 'Escape to the safehouse — the heat is on!' },
      ] },
    { id: 'skyhigh', title: '8. Sky High', brief: 'Nico: "Kane keeps a helicopter at the airport. Take it — we need eyes over the Bay."',
      steps: [
        { type: 'goto', x: 3840, y: 700, text: 'Reach the airport helipad' },
        { type: 'enterCar', carType: 'heli', text: 'Steal the helicopter' },
        { type: 'gotoCar', x: 2640, y: 960, text: 'Land on the Grand Hotel rooftop' },
      ] },
    { id: 'informant', title: '9. The Informant', brief: 'Jules: "A rat is feeding Kane our moves. He\'s at the docks. End it."',
      steps: [
        { type: 'goto', x: 1200, y: 2400, text: 'Find the informant at the docks' },
        { type: 'kill', n: 1, x: 1200, y: 2400, boss: 'The Informant', text: 'Eliminate the informant' },
      ] },
    { id: 'bridge', title: '10. Bridge Burners', brief: 'Big Ray: "Kane\'s convoy crosses the causeway at dusk. Burn it down."',
      steps: [
        { type: 'goto', x: 1200, y: 1920, text: 'Get to the causeway' },
        { type: 'destroy', n: 3, text: 'Destroy Kane\'s convoy trucks (0/3)' },
      ] },
    { id: 'docks', title: '11. Storm the Docks', brief: 'Jules: "Warehouse 9 is Kane\'s stronghold. Hit it hard — no survivors."',
      steps: [
        { type: 'goto', x: 960, y: 2160, text: 'Storm Warehouse 9' },
        { type: 'kill', n: 12, x: 960, y: 2160, text: 'Clear the warehouse (0/12)' },
      ] },
    { id: 'king', title: '12. King of the Bay', brief: 'Jules: "Kane is running in his limo. Run him down — then finish this."',
      steps: [
        { type: 'destroy', n: 1, limo: true, text: 'Stop Kane\'s limo' },
        { type: 'kill', n: 1, x: 2400, y: 720, boss: 'Silas Kane', hp: 220, text: 'Face Silas Kane at Police HQ' },
      ] },
  ],

  current: function () { return this.DEFS[this.index]; },
  curStep: function () { var m = this.current(); return m ? m.steps[this.step] : null; },
  start: function (idx) {
    this.index = idx; this.step = 0; this.active = true; this.done = false;
    var m = this.current();
    Game.banner(m.title, m.brief);
    AudioSys.phone();
    this.beginStep();
  },
  beginStep: function () {
    var s = this.curStep();
    this.stepState = null; this.timer = 0; this.killed = 0; this.collected = 0; this.destroyed = 0;
    if (!s) return;
    var p = Game.player;
    if (s.type === 'kill') {
      var self = this;
      var n = s.n;
      for (var i = 0; i < n; i++) {
        var e = Enemies.spawn(s.x + rand(-120, 120), s.y + rand(-120, 120), {
          name: s.boss || 'Kane Goon', hp: s.hp || 60,
          onKill: function () { self.killed++; },
        });
        if (s.boss) e.name = s.boss;
      }
    } else if (s.type === 'destroy' && s.limo) {
      var rp = City.nearestRoadPoint(p.x + 500, p.y);
      var limo = Vehicles.spawn('limo', rp.x, rp.y, City.roadAngleAt(rp.x, rp.y), {});
      limo.missionTarget = true;
      this.convoy = [limo];
      Game.toast('Kane\'s limo is fleeing — stop it!');
    } else if (s.type === 'destroy') {
      this.convoy = [];
      for (var j = 0; j < s.n; j++) {
        var t = Vehicles.spawn('truck', 600 + j * 260, 1920, 0, {});
        t.missionTarget = true;
        this.convoy.push(t);
      }
      Game.toast('The convoy is crossing the causeway — destroy the trucks!');
    } else if (s.type === 'race') {
      Activities.startRace(s.raceIdx);
    } else if (s.type === 'goto' && this.index === 6 && this.step === 2) {
      Game.police.addHeat(220, p.x, p.y, true); // casino escape heat
    }
  },
  objectiveText: function () {
    if (!this.active) return 'Free roam — press T for taxi work, R near a race flag, C for contracts';
    var s = this.curStep();
    if (!s) return '';
    var t = s.text;
    if (s.type === 'kill') t = t.replace(/\(\d+\/\d+\)/, '(' + this.killed + '/' + s.n + ')');
    if (s.type === 'collect') t = t.replace(/\(\d+\/\d+\)/, '(' + this.collected + '/' + s.n + ')');
    if (s.type === 'destroy') t = t.replace(/\(\d+\/\d+\)/, '(' + this.destroyed + '/' + s.n + ')');
    return this.current().title + ' — ' + t;
  },
  marker: function () {
    if (!this.active) return null;
    var s = this.curStep();
    if (!s) return null;
    if (s.type === 'kill' || s.type === 'collect' || s.type === 'destroy') {
      if (s.type === 'destroy' && this.convoy.length) {
        var c = this.convoy[0];
        return { x: c.x, y: c.y, color: '#ff4040' };
      }
      if (s.spots && s.spots[this.collected]) return { x: s.spots[this.collected][0], y: s.spots[this.collected][1], color: '#ffd76a' };
      return { x: s.x, y: s.y, color: '#ffd76a' };
    }
    if (s.type === 'race') return { x: 2160, y: 1440, color: '#ffd76a' };
    return { x: s.x, y: s.y, color: '#ffd76a' };
  },
  completeStep: function () {
    AudioSys.pickup();
    this.step++;
    var m = this.current();
    if (this.step >= m.steps.length) this.completeMission();
    else this.beginStep();
  },
  completeMission: function () {
    var m = this.current();
    var reward = MISSION_REWARDS[this.index];
    Game.player.cash += reward;
    Game.stats.missionsDone++;
    Game.banner('MISSION PASSED', m.title + ' — +$' + fmtCash(reward));
    AudioSys.missionOk();
    this.active = false;
    if (this.index >= this.DEFS.length - 1) {
      this.done = true;
      Game.banner('KING OF THE BAY', 'Silas Kane is finished. Vermilion Bay is yours, Vex.');
      Game.storyComplete = true;
      return;
    }
    var self = this;
    Game.missionDelay = 2.5; // next mission starts after a breather
    Game.nextMission = this.index + 1;
  },
  failMission: function (reason) {
    Game.banner('MISSION FAILED', reason || 'Try again');
    AudioSys.missionFail();
    this.active = false;
    Game.missionDelay = 3;
    Game.nextMission = this.index; // retry same mission
  },
  update: function (dt) {
    if (!this.active) return;
    var s = this.curStep();
    if (!s) return;
    var p = Game.player;
    if (s.type === 'goto') {
      if (dist(p.x, p.y, s.x, s.y) < 80) {
        if (s.type === 'goto' && this.index === 3) { p.cash += 800; Game.toast('Collected $800'); }
        this.completeStep();
      }
    } else if (s.type === 'gotoCar') {
      if (p.car && dist(p.x, p.y, s.x, s.y) < 90) this.completeStep();
    } else if (s.type === 'enterCar') {
      if (p.car && p.car.def.id === s.carType) this.completeStep();
    } else if (s.type === 'kill') {
      if (this.killed >= s.n) this.completeStep();
    } else if (s.type === 'collect') {
      var spot = s.spots[this.collected];
      if (spot && dist(p.x, p.y, spot[0], spot[1]) < 50) {
        this.collected++;
        p.cash += 1500;
        AudioSys.coin();
        Game.toast('Money bag ' + this.collected + '/' + s.n + ' — +$1,500');
        if (this.collected >= s.n) this.completeStep();
      }
    } else if (s.type === 'destroy') {
      var alive = 0;
      for (var i = this.convoy.length - 1; i >= 0; i--) {
        if (this.convoy[i].exploded) { this.convoy.splice(i, 1); this.destroyed++; }
        else alive++;
      }
      // Convoy trucks crawl along the causeway.
      for (var j = 0; j < this.convoy.length; j++) {
        var t = this.convoy[j];
        if (s.limo) {
          // Limo flees from the player along roads.
          var away = angTo(p.x, p.y, t.x, t.y);
          t.angle = angLerp(t.angle, away, Math.min(1, dt * 1.2));
          if (t.speed < 380) t.speed += 200 * dt;
          var nx = t.x + Math.cos(t.angle) * t.speed * dt;
          var ny = t.y + Math.sin(t.angle) * t.speed * dt;
          if (!City.insideBuilding(nx, ny, 20) && !City.inWater(nx, ny)) { t.x = nx; t.y = ny; }
          else { t.angle += Math.PI / 2; t.speed *= 0.6; }
        } else {
          t.speed = 130;
          t.x += Math.cos(t.angle) * t.speed * dt;
          t.y += Math.sin(t.angle) * t.speed * dt;
          if (t.x > CFG.WORLD_W - 100) { t.x = 300; }
        }
      }
      if (this.destroyed >= s.n) this.completeStep();
    } else if (s.type === 'race') {
      if (!Activities.race.active && Activities.race.time > 0) {
        // Race ended: check if it was won by looking at the last result.
        if (Game.lastRaceWon) { Game.lastRaceWon = false; this.completeStep(); }
        else this.failMission('You lost the race — try again');
      }
    }
  },
};
