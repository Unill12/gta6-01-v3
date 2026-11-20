// Vermilion Bay — game bootstrap, main loop, state machine, shops,
// death/respawn, mission sequencing and screenshot scenes.
'use strict';
var Game = {
  state: 'title', time: 0, camera: { x: 2400, y: 1800, zoom: 1 },
  player: Player, police: Police, enemies: Enemies, missions: Missions,
  damageFlash: 0, shakeAmt: 0, missionDelay: 0, nextMission: -1,
  lastRaceWon: false, jumpActive: null, storyComplete: false,
  shopMode: null, shopLines: [],
  stats: { taxiFares: 0, racesWon: 0, jumps: 0, contracts: 0, missionsDone: 0, propsBought: 0, daysSurvived: 1 },
  autosaveTimer: 0, shotMode: null,

  toast: function (m) { Hud.toast(m); },
  banner: function (t, s) { Hud.banner(t, s); },
  shake: function (n) { this.shakeAmt = Math.max(this.shakeAmt, n); },

  init: function () {
    var canvas = document.getElementById('game');
    Hud.init();
    Input.init(canvas);
    AudioSys.init();
    City.init();
    this.newWorld();
    this.bindButtons();
    // Screenshot scenes (?shot=chase|city|mission|night).
    var params = new URLSearchParams(window.location.search);
    this.shotMode = params.get('shot');
    if (this.shotMode) this.setupShot(this.shotMode);
    else Hud.showTitle();
    window.__game = this;
    window.__shotReady = false;
    var self = this;
    var last = performance.now();
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      self.time += dt;
      self.update(dt);
      self.render();
      Input.endFrame();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  },
  newWorld: function () {
    Vehicles.list = [];
    Entities.peds = [];
    Enemies.clear();
    Police.reset();
    Activities.reset();
    Economy.reset();
    Weather.reset();
    Missions.index = 0; Missions.step = 0; Missions.active = false; Missions.done = false;
    this.storyComplete = false;
    this.stats = { taxiFares: 0, racesWon: 0, jumps: 0, contracts: 0, missionsDone: 0, propsBought: 0, daysSurvived: 1 };
    Player.reset(3600, 2080);
    Vehicles.spawnParked(46);
    Vehicles.spawnTraffic(16);
    Entities.spawnCrowd(46, 2400, 1800, 1600);
    Render.cam.x = Player.x; Render.cam.y = Player.y;
  },
  bindButtons: function () {
    var self = this;
    Hud.els.playBtn.addEventListener('click', function () { self.startGame(false); });
    Hud.els.continueBtn.addEventListener('click', function () { self.startGame(true); });
    Hud.els.resumeBtn.addEventListener('click', function () { self.setState('play'); });
    Hud.els.restartBtn.addEventListener('click', function () {
      SaveSys.clear();
      self.newWorld();
      self.setState('play');
      Missions.start(0);
    });
    Hud.els.quitBtn.addEventListener('click', function () { SaveSys.save(); self.setState('title'); Hud.showTitle(); });
    Hud.els.closeHelpBtn.addEventListener('click', function () { self.setState('play'); });
    Hud.els.respawnBtn.addEventListener('click', function () { self.respawn(); });
  },
  startGame: function (cont) {
    AudioSys.resume();
    AudioSys.startMusic();
    AudioSys.engineStart();
    AudioSys.sirenStart();
    if (cont) {
      var data = SaveSys.load();
      if (data) SaveSys.apply(data);
      this.setState('play');
      Hud.showPlay();
      this.toast('Welcome back, Vex — Day ' + Weather.day);
    } else {
      SaveSys.clear();
      this.newWorld();
      this.setState('play');
      Hud.showPlay();
      Missions.start(0);
    }
  },
  setState: function (s) {
    this.state = s;
    if (s === 'play') Hud.showPlay();
    else if (s === 'pause') Hud.showPause();
    else if (s === 'title') Hud.showTitle();
  },
  die: function (kind) {
    if (this.state !== 'play') return;
    this.state = 'dead';
    this.deadKind = kind;
    AudioSys.missionFail();
    AudioSys.sirenSet(false);
    if (kind === 'busted') AudioSys.busted();
    Player.deaths++;
    Hud.showDead(kind);
  },
  respawn: function () {
    var p = Player;
    var lost = Math.floor(p.cash * 0.15);
    p.cash -= lost;
    p.health = 100; p.armor = Math.min(p.armor, 50);
    if (p.car) { p.car.driver = null; p.car = null; p.onFoot = true; }
    p.x = City.landmarks.hospital.x + 60; p.y = City.landmarks.hospital.y + 60;
    Police.reset();
    Enemies.clear();
    this.damageFlash = 0;
    this.setState('play');
    this.toast('Hospital bill: -$' + fmtCash(lost));
    if (Missions.active) Missions.failMission('Vex went down — mission failed');
  },
  openShop: function (kind) {
    this.shopMode = kind;
    this.shopLines = kind === 'gun' ? Economy.shopMenu() : Economy.showroomMenu();
    this.shopLines.push('Cash: $' + fmtCash(Player.cash));
  },
  closeShop: function () { this.shopMode = null; this.shopLines = []; },

  update: function (dt) {
    if (this.state === 'title') {
      // Slow cinematic pan over the city behind the title.
      Render.cam.x = 2400 + Math.cos(this.time * 0.05) * 900;
      Render.cam.y = 1800 + Math.sin(this.time * 0.04) * 600;
      Render.cam.zoom = 0.8;
      return;
    }
    if (this.state !== 'play') return;
    if (this.damageFlash > 0) this.damageFlash = Math.max(0, this.damageFlash - dt * 1.4);
    if (this.shakeAmt > 0) this.shakeAmt = Math.max(0, this.shakeAmt - dt * 30);
    // Pause / help / mute.
    if (Input.wasPressed('KeyP') || Input.wasPressed('Escape')) { this.setState('pause'); return; }
    if (Input.wasPressed('KeyH')) { this.setState('pause'); Hud.hide('pause'); Hud.show('help'); return; }
    if (Input.wasPressed('KeyM')) { var m = AudioSys.toggleMute(); this.toast(m ? 'Sound muted' : 'Sound on'); }
    // Shop mode: number keys buy, 0/G/Esc closes.
    if (this.shopMode) {
      for (var k = 1; k <= 9; k++) {
        if (Input.wasPressed('Digit' + k)) {
          if (this.shopMode === 'gun') Economy.buyWeapon(k - 1); else Economy.buyCar(k - 1);
          this.shopLines = (this.shopMode === 'gun' ? Economy.shopMenu() : Economy.showroomMenu());
          this.shopLines.push('Cash: $' + fmtCash(Player.cash));
        }
      }
      if (Input.wasPressed('Digit0') || Input.wasPressed('KeyG') || Input.wasPressed('Escape')) this.closeShop();
      return; // world frozen while shopping
    }
    // Interact: shop / property.
    var p = Player;
    if (Input.wasPressed('KeyG') && p.onFoot) {
      if (dist(p.x, p.y, City.landmarks.gunshop.x, City.landmarks.gunshop.y) < 90) this.openShop('gun');
      else if (dist(p.x, p.y, City.landmarks.showroom.x, City.landmarks.showroom.y) < 90) this.openShop('car');
    }
    if (Input.wasPressed('KeyB') && p.onFoot) {
      var prop = Economy.nearestProp(p.x, p.y, 90);
      if (prop) Economy.buyProp(prop.id);
    }
    if (Input.wasPressed('KeyT')) Activities.toggleTaxi();
    if (Input.wasPressed('KeyR')) {
      var race = Activities.nearestRace(p.x, p.y, 120);
      if (race && p.car) Activities.startRace(race.idx);
    }
    // Mission sequencing.
    if (this.missionDelay > 0) {
      this.missionDelay -= dt;
      if (this.missionDelay <= 0 && this.nextMission >= 0) {
        var nm = this.nextMission;
        this.nextMission = -1;
        Missions.start(nm);
      }
    }
    Weather.update(dt);
    Player.update(dt);
    Vehicles.updateTraffic(dt);
    Entities.update(dt);
    Enemies.update(dt);
    Police.update(dt);
    Particles.update(dt);
    Activities.update(dt);
    Missions.update(dt);
    Render.updateCamera(dt);
    Hud.update(dt);
    // Autosave every 20s.
    this.autosaveTimer += dt;
    if (this.autosaveTimer > 20) { this.autosaveTimer = 0; SaveSys.save(); }
  },
  render: function () {
    var canvas = document.getElementById('game');
    var ctx = canvas.getContext('2d');
    Render.draw(ctx);
  },
  // ---- Screenshot scenes ----
  setupShot: function (name) {
    var self = this;
    this.startGame(false);
    // Skip the mission intro for staged shots: hide the mission-0 title
    // banner startGame just showed, so the scene is unobstructed.
    Hud.hide('banner'); Hud.hide('subbanner'); Hud.bannerTimer = 0;
    Missions.active = false;
    if (name === 'chase') {
      Weather.time = 900; // 15:00
      Player.x = 2160; Player.y = 720;
      var car = Vehicles.spawn('sports', 2160, 720, 0, {});
      car.driver = Player; Player.car = car; Player.onFoot = false;
      Police.heat = 220; Police.wanted = 3;
      Police.spawnCruiser(); Police.spawnCruiser(); Police.spawnCruiser();
      Missions.index = 1; Missions.step = 2; Missions.active = true;
    } else if (name === 'city') {
      Weather.time = 600; // 10:00
      Player.x = 1200; Player.y = 3120;
      Player.giveWeapon('pistol', 60);
      Entities.spawnCrowd(30, 1200, 3120, 500);
    } else if (name === 'mission') {
      Weather.time = 1080; // 18:00 dusk
      Player.x = 960; Player.y = 2050;
      Player.giveWeapon('rifle', 120);
      Player.selectWeapon(Player.weapons.indexOf('rifle'));
      Missions.index = 10; Missions.step = 1; Missions.active = true;
      Enemies.spawnSquad(960, 2160, 8, {});
      Police.heat = 0; Police.wanted = 0;
    } else if (name === 'night') {
      Weather.time = 1320; // 22:00
      Weather.rain = 0.7;
      Player.x = 2400; Player.y = 1680;
      var car2 = Vehicles.spawn('muscle', 2400, 1680, 0, {});
      car2.driver = Player; Player.car = car2; Player.onFoot = false;
      Police.heat = 120; Police.wanted = 2;
      Police.spawnCruiser();
      Missions.index = 5; Missions.step = 1; Missions.active = true;
    }
    Render.cam.x = Player.x; Render.cam.y = Player.y;
    setTimeout(function () { window.__shotReady = true; }, 1800);
  },
};

window.addEventListener('load', function () { Game.init(); });
