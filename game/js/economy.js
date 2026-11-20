// Vermilion Bay — money: property income, gun shop, car showroom, safehouse.
'use strict';
var Economy = {
  ownedProps: [], ownedCars: [],

  reset: function () { this.ownedProps = []; this.ownedCars = []; },
  incomePerDay: function () {
    var total = 0;
    for (var i = 0; i < this.ownedProps.length; i++) {
      var p = this.propById(this.ownedProps[i]);
      if (p) total += p.income;
    }
    return total;
  },
  propById: function (id) {
    for (var i = 0; i < PROPERTIES.length; i++) if (PROPERTIES[i].id === id) return PROPERTIES[i];
    return null;
  },
  ownsProp: function (id) { return this.ownedProps.indexOf(id) >= 0; },
  buyProp: function (id) {
    var p = this.propById(id);
    if (!p || this.ownsProp(id)) return false;
    if (Game.player.cash < p.cost) { Game.toast('Not enough cash — ' + p.name + ' costs $' + fmtCash(p.cost)); return false; }
    Game.player.cash -= p.cost;
    this.ownedProps.push(p.id);
    Game.toast('Bought ' + p.name + ' — earns $' + fmtCash(p.income) + '/day');
    AudioSys.coin();
    Game.stats.propsBought++;
    return true;
  },
  onNewDay: function () {
    var inc = this.incomePerDay();
    if (inc > 0) {
      Game.player.cash += inc;
      Game.toast('Day ' + Weather.day + ' — property income +$' + fmtCash(inc));
    }
    Game.stats.daysSurvived = Weather.day;
  },
  nearestProp: function (x, y, maxD) {
    var best = null, bd = maxD || 1e9;
    for (var i = 0; i < PROPERTIES.length; i++) {
      var d = dist(x, y, PROPERTIES[i].x, PROPERTIES[i].y);
      if (d < bd) { bd = d; best = PROPERTIES[i]; }
    }
    return best;
  },
  // Gun shop (Ironworks Arms) — buy weapons and ammo.
  shopMenu: function () {
    var lines = ['IRONWORKS ARMS — press 1-8 to buy, 0 to leave'];
    for (var i = 0; i < WEAPONS.length; i++) {
      var w = WEAPONS[i];
      var owned = Game.player.hasWeapon(w.id);
      var price = owned ? w.ammoPrice + ' ammo' : '$' + fmtCash(w.price);
      lines.push((i + 1) + '. ' + w.name + ' — ' + price + (owned ? ' (owned)' : ''));
    }
    return lines;
  },
  buyWeapon: function (idx) {
    var w = WEAPONS[idx];
    if (!w) return;
    var p = Game.player;
    if (p.hasWeapon(w.id)) {
      if (p.cash < w.ammoPrice) { Game.toast('Not enough cash for ammo'); return; }
      p.cash -= w.ammoPrice;
      p.ammo[w.id] = (p.ammo[w.id] || 0) + (w.id === 'rpg' ? 3 : w.id === 'sniper' ? 10 : 60);
      Game.toast('Bought ammo for ' + w.name);
    } else {
      if (p.cash < w.price) { Game.toast('Not enough cash — ' + w.name + ' costs $' + fmtCash(w.price)); return; }
      p.cash -= w.price;
      p.giveWeapon(w.id, w.id === 'rpg' ? 5 : w.id === 'sniper' ? 15 : 90);
      Game.toast('Bought ' + w.name + '!');
    }
    AudioSys.coin();
  },
  // Car showroom (Vex Motors) — buy a car, delivered to the garage lot.
  showroomMenu: function () {
    var lines = ['VEX MOTORS — press 1-9 to buy, 0 to leave'];
    var list = ['sports', 'muscle', 'convert', 'bike', 'suv', 'limo', 'boat', 'heli', 'pickup'];
    var prices = { sports: 22000, muscle: 16000, convert: 18000, bike: 9000, suv: 14000, limo: 30000, boat: 25000, heli: 60000, pickup: 11000 };
    for (var i = 0; i < list.length; i++) {
      var def = Vehicles.def(list[i]);
      lines.push((i + 1) + '. ' + def.name + ' — $' + fmtCash(prices[list[i]]));
    }
    return lines;
  },
  buyCar: function (idx) {
    var list = ['sports', 'muscle', 'convert', 'bike', 'suv', 'limo', 'boat', 'heli', 'pickup'];
    var prices = { sports: 22000, muscle: 16000, convert: 18000, bike: 9000, suv: 14000, limo: 30000, boat: 25000, heli: 60000, pickup: 11000 };
    var id = list[idx];
    if (!id) return;
    var price = prices[id];
    var p = Game.player;
    if (p.cash < price) { Game.toast('Not enough cash — ' + Vehicles.def(id).name + ' costs $' + fmtCash(price)); return; }
    p.cash -= price;
    var spot = City.landmarks.safehouse;
    var v = Vehicles.spawn(id, spot.x + rand(-140, 140), spot.y + rand(60, 160), rand(0, Math.PI * 2), { parked: true, owned: true });
    this.ownedCars.push(v.id);
    Game.toast(Vehicles.def(id).name + ' delivered to your safehouse!');
    AudioSys.coin();
  },
};
