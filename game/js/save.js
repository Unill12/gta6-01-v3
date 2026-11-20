// Vermilion Bay — localStorage save / load.
'use strict';
var SaveSys = {
  save: function () {
    if (!Game || !Game.player) return;
    var p = Game.player;
    var data = {
      cash: p.cash, health: p.health, armor: p.armor,
      x: p.x, y: p.y,
      weapons: p.weapons, ammo: p.ammo, weaponIdx: p.weaponIdx,
      missionIndex: Missions.index, missionDone: Missions.done, storyComplete: !!Game.storyComplete,
      props: Economy.ownedProps, cars: Economy.ownedCars,
      packages: City.packages.filter(function (pk) { return pk.found; }).length,
      packageFound: City.packages.map(function (pk) { return pk.found ? 1 : 0; }),
      stats: Game.stats,
      time: Weather.time, day: Weather.day,
      savedAt: Date.now(),
    };
    try { localStorage.setItem(CFG.SAVE_KEY, JSON.stringify(data)); } catch (e) {}
  },
  has: function () {
    try { return !!localStorage.getItem(CFG.SAVE_KEY); } catch (e) { return false; }
  },
  load: function () {
    var raw = null;
    try { raw = localStorage.getItem(CFG.SAVE_KEY); } catch (e) {}
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  },
  apply: function (data) {
    var p = Game.player;
    p.cash = data.cash; p.health = data.health || 100; p.armor = data.armor || 0;
    p.x = data.x; p.y = data.y;
    p.weapons = data.weapons || ['fist', 'pistol'];
    p.ammo = data.ammo || { pistol: 60 };
    p.weaponIdx = data.weaponIdx || 0;
    Economy.ownedProps = data.props || [];
    Economy.ownedCars = data.cars || [];
    if (data.packageFound) {
      for (var i = 0; i < data.packageFound.length && i < City.packages.length; i++) {
        City.packages[i].found = !!data.packageFound[i];
      }
      Activities.packagesFound = data.packages || 0;
    }
    Game.stats = data.stats || Game.stats;
    Weather.time = data.time || 480;
    Weather.day = data.day || 1;
    if (data.storyComplete) { Missions.done = true; Missions.active = false; Game.storyComplete = true; }
    else if (typeof data.missionIndex === 'number') {
      Game.nextMission = data.missionIndex;
      Game.missionDelay = 1.5;
    }
  },
  clear: function () {
    try { localStorage.removeItem(CFG.SAVE_KEY); } catch (e) {}
  },
};
