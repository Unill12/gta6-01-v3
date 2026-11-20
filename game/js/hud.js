// Vermilion Bay — HUD, banners, toasts and screen switching.
'use strict';
var Hud = {
  els: {},
  bannerTimer: 0, toastTimer: 0,

  init: function () {
    var ids = ['hud', 'healthfill', 'armorfill', 'cash', 'district', 'stars', 'clock', 'weathericon',
      'daynum', 'objtext', 'banner', 'subbanner', 'weaponname', 'ammo', 'speedline', 'speed',
      'carname', 'hintline', 'vignette', 'crosshair', 'toast', 'title', 'pause', 'help', 'dead',
      'deadtitle', 'deadtext', 'pausestats', 'playBtn', 'continueBtn', 'resumeBtn', 'restartBtn',
      'quitBtn', 'closeHelpBtn', 'respawnBtn'];
    for (var i = 0; i < ids.length; i++) this.els[ids[i]] = document.getElementById(ids[i]);
  },
  show: function (id) { var e = this.els[id]; if (e) e.classList.remove('hidden'); },
  hide: function (id) { var e = this.els[id]; if (e) e.classList.add('hidden'); },
  showTitle: function () {
    this.hide('hud'); this.hide('pause'); this.hide('help'); this.hide('dead');
    this.show('title');
    if (SaveSys.has()) this.show('continueBtn');
  },
  showPlay: function () {
    this.hide('title'); this.hide('pause'); this.hide('help'); this.hide('dead');
    this.show('hud');
  },
  showPause: function () {
    var s = Game.stats;
    this.els.pausestats.innerHTML =
      'Mission: <b>' + (Missions.done ? 'STORY COMPLETE' : (Missions.current() ? Missions.current().title : '—')) + '</b><br>' +
      'Cash: <b>$' + fmtCash(Game.player.cash) + '</b> · Day ' + Weather.day + ' · ' + fmtTime(Weather.time) + '<br>' +
      'Kills: <b>' + Game.player.kills + '</b> · Cars stolen: <b>' + Game.player.carsStolen + '</b><br>' +
      'Packages: <b>' + Activities.packagesFound + '/60</b> · Taxi fares: <b>' + s.taxiFares + '</b> · Races won: <b>' + s.racesWon + '</b><br>' +
      'Stunt jumps: <b>' + s.jumps + '</b> · Contracts: <b>' + s.contracts + '</b> · Properties: <b>' + Economy.ownedProps.length + '/5</b>';
    this.show('pause');
  },
  showDead: function (kind) {
    this.els.deadtitle.textContent = kind === 'busted' ? 'BUSTED' : 'WASTED';
    this.els.deadtext.textContent = kind === 'busted'
      ? 'The Bay PD hauled you in. You lost some cash — and your weapons stay, but the heat is gone.'
      : 'Vex went down. The hospital patched her up — for a price.';
    this.show('dead');
  },
  banner: function (title, sub) {
    this.els.banner.textContent = title;
    this.els.subbanner.textContent = sub || '';
    this.show('banner'); this.show('subbanner');
    this.bannerTimer = 3.2;
  },
  toast: function (msg) {
    this.els.toast.textContent = msg;
    this.toastTimer = 3.4;
  },
  update: function (dt) {
    var p = Game.player;
    if (!p) return;
    this.els.healthfill.style.width = Math.max(0, p.health) + '%';
    this.els.armorfill.style.width = Math.max(0, p.armor) + '%';
    this.els.cash.textContent = fmtCash(p.cash);
    var d = City.districtAt(p.x, p.y);
    this.els.district.textContent = d ? d.name : '';
    var w = Police.wanted;
    this.els.stars.textContent = w > 0 ? '★'.repeat(w) + '☆'.repeat(5 - w) : '';
    this.els.clock.textContent = fmtTime(Weather.time);
    this.els.weathericon.textContent = Weather.icon();
    this.els.daynum.textContent = Weather.day;
    if (Game.shopMode) this.els.objtext.innerHTML = Game.shopLines.join('<br>');
    else this.els.objtext.textContent = Missions.objectiveText();
    var wp = p.weapon();
    this.els.weaponname.textContent = wp.name;
    this.els.ammo.textContent = wp.id === 'fist' ? '∞' : (p.ammo[wp.id] || 0);
    if (p.car) {
      this.show('speedline');
      this.els.speed.textContent = Math.round(Math.abs(p.car.speed) * 0.12);
      this.els.carname.textContent = p.car.def.name + (p.car.health < 100 ? ' · ' + Math.round(p.car.health) + '%' : '');
    } else this.hide('speedline');
    // Hints near interactables.
    var hint = '';
    if (p.onFoot) {
      var nearCar = Vehicles.nearest(p.x, p.y, 64, function (c) { return !c.exploded && !c.driver; });
      if (nearCar) hint = 'Press E — steal ' + nearCar.def.name;
      else {
        var shop = dist(p.x, p.y, City.landmarks.gunshop.x, City.landmarks.gunshop.y) < 90;
        if (shop) hint = 'Ironworks Arms — press G to shop for weapons';
        else {
          var show = dist(p.x, p.y, City.landmarks.showroom.x, City.landmarks.showroom.y) < 90;
          if (show) hint = 'Vex Motors — press G to buy cars';
          else {
            var prop = Economy.nearestProp(p.x, p.y, 90);
            if (prop && !Economy.ownsProp(prop.id)) hint = prop.name + ' — press B to buy ($' + fmtCash(prop.cost) + ', earns $' + fmtCash(prop.income) + '/day)';
            else if (prop) hint = prop.name + ' — yours ✓ ($' + fmtCash(prop.income) + '/day)';
            else {
              var race = Activities.nearestRace(p.x, p.y, 90);
              if (race && p.car) hint = 'Press R — start ' + race.race.name + ' ($' + fmtCash(race.race.prize) + ' prize)';
              else {
                var ct = Activities.nearestContract(p.x, p.y, 120);
                if (ct) hint = 'Contract: ' + ct.c.name + ' — walk up to start ($' + fmtCash(ct.c.reward) + ')';
                else if (Missions.active) hint = 'Follow the yellow marker';
                else hint = 'T — taxi work · R — race · H — help';
              }
            }
          }
        }
      }
    } else {
      hint = 'W/S drive · Space handbrake · E exit car' + (Activities.taxi.active ? ' · Taxi: follow the green marker' : '');
    }
    this.els.hintline.textContent = hint;
    // Damage vignette + crosshair.
    var dmg = Game.damageFlash || 0;
    this.els.vignette.style.boxShadow = dmg > 0.05 ? 'inset 0 0 120px rgba(255,0,0,' + (dmg * 0.55) + ')' : 'inset 0 0 120px rgba(255,0,0,0)';
    if (p.onFoot && Game.state === 'play') {
      this.show('crosshair');
      this.els.crosshair.style.left = Input.mouseX + 'px';
      this.els.crosshair.style.top = Input.mouseY + 'px';
    } else this.hide('crosshair');
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) { this.hide('banner'); this.hide('subbanner'); }
    }
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.els.toast.textContent = '';
    }
  },
};
