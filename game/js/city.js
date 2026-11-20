// Vermilion Bay — procedural city: roads, districts, buildings, landmarks,
// harbour, beach, airport runway, trees, and collision helpers.
'use strict';
var City = {
  buildings: [], trees: [], landmarks: {}, packages: [],
  avenues: [], streets: [],
  water: [], beach: null, runway: null, helipad: null, bridge: null,

  init: function () {
    var rng = makeRng(20261120);
    var W = CFG.WORLD_W, H = CFG.WORLD_H, B = CFG.BLOCK, O = CFG.ROAD_OFF;
    for (var i = 0; i * B + O <= W; i++) this.avenues.push(i * B + O);
    for (var j = 0; j * B + O <= H; j++) this.streets.push(j * B + O);
    // Harbour basin on the west edge + beach strip along the south edge.
    this.water = [
      { x: 0, y: 1200, w: 200, h: 1200 },   // harbour basin
      { x: 0, y: 3520, w: 4800, h: 80 },    // open sea at the bottom
    ];
    this.beach = { x: 0, y: 3360, w: 4800, h: 160 };
    this.runway = { x: 3360, y: 400, w: 1240, h: 110 };
    this.helipad = { x: 3840, y: 700 };
    this.bridge = { x: 0, y: 1872, w: 240, h: 96 }; // street over the harbour
    var self = this;
    LANDMARKS.forEach(function (lm) {
      self.landmarks[lm.id] = lm;
      var s = lm.r * 1.5;
      self.buildings.push({ x: lm.x - s / 2, y: lm.y - s / 2, w: s, h: s, hgt: lm.id === 'tower' ? 60 : 22, color: lm.color, landmark: lm.id, name: lm.name });
    });
    // Blocks: fill each road block with buildings matching its district.
    for (var ai = 0; ai < this.avenues.length - 1; ai++) {
      for (var si = 0; si < this.streets.length - 1; si++) {
        var bx = this.avenues[ai] + CFG.ROAD_W / 2 + 8;
        var by = this.streets[si] + CFG.ROAD_W / 2 + 8;
        var bw = this.avenues[ai + 1] - this.avenues[ai] - CFG.ROAD_W - 16;
        var bh = this.streets[si + 1] - this.streets[si] - CFG.ROAD_W - 16;
        var cx = bx + bw / 2, cy = by + bh / 2;
        var d = this.districtAt(cx, cy);
        if (!d) continue;
        if (this.inWater(cx, cy) || this.inRect(cx, cy, this.runway)) continue;
        if (this.nearLandmark(cx, cy, 110)) continue;
        var roll = rng();
        if (d.style === 'flat') continue; // airport apron stays open
        if (cy > 3300) { if (roll < 0.25) this.addTree(cx, cy, rng); continue; } // beach strip
        if (d.style === 'house' && roll < 0.3) { this.addPark(bx, by, bw, bh, rng); continue; }
        this.fillBlock(bx, by, bw, bh, d, rng);
      }
    }
    // Trees along sidewalks and parks.
    for (var t = 0; t < 260; t++) {
      var tx = rand(120, W - 120), ty = rand(120, H - 120);
      if (this.isOnRoad(tx, ty) || this.inWater(tx, ty) || this.insideBuilding(tx, ty, 20)) continue;
      this.trees.push({ x: tx, y: ty, r: rand(10, 16) });
    }
    // 60 hidden packages on sidewalks, alleys and rooftops edges across the city.
    var placed = 0, guard = 0;
    while (placed < 60 && guard++ < 4000) {
      var px = rand(200, W - 200), py = rand(200, H - 200);
      if (this.inWater(px, py) || this.insideBuilding(px, py, 30)) continue;
      if (!this.nearRoad(px, py, 90) && rng() < 0.7) continue;
      this.packages.push({ x: px, y: py, found: false });
      placed++;
    }
  },
  addTree: function (x, y, rng) { this.trees.push({ x: x + rand(-30, 30), y: y + rand(-30, 30), r: rand(12, 18) }); },
  addPark: function (bx, by, bw, bh, rng) {
    for (var i = 0; i < 6; i++) this.addTree(bx + rand(20, bw - 20), by + rand(20, bh - 20), rng);
  },
  fillBlock: function (bx, by, bw, bh, d, rng) {
    var self = this;
    function put(x, y, w, h, hgt, color) {
      if (self.nearLandmark(x + w / 2, y + h / 2, 90)) return;
      self.buildings.push({ x: x, y: y, w: w, h: h, hgt: hgt, color: color, style: d.style });
    }
    var palette = {
      tower: ['#7a8aa8', '#8a94a8', '#6a7a98', '#9aa0b0', '#5a6a88'],
      low: ['#a8886a', '#b89878', '#987858', '#c8a888', '#88705a'],
      ware: ['#7a7468', '#6a6258', '#8a8078', '#5a544c'],
      neon: ['#5a4a7a', '#7a4a8a', '#4a5a8a', '#8a4a6a', '#6a3a7a'],
      house: ['#c8a888', '#a8b898', '#d8c8a8', '#b8a8c8', '#98b8c8'],
    }[d.style] || ['#888888'];
    var col = function () { return palette[Math.floor(rng() * palette.length)]; };
    if (d.style === 'tower') {
      put(bx + 20, by + 20, bw * 0.55, bh * 0.55, 40 + rng() * 60, col());
      put(bx + bw * 0.62, by + 20, bw * 0.3, bh * 0.4, 25 + rng() * 30, col());
      put(bx + bw * 0.62, by + bh * 0.55, bw * 0.3, bh * 0.35, 20 + rng() * 25, col());
    } else if (d.style === 'ware') {
      put(bx + 10, by + 10, bw - 20, bh * 0.45, 14, col());
      put(bx + 10, by + bh * 0.55, bw - 20, bh * 0.35, 12, col());
    } else if (d.style === 'neon') {
      put(bx + 15, by + 15, bw * 0.42, bh - 30, 24 + rng() * 20, col());
      put(bx + bw * 0.55, by + 15, bw * 0.35, bh * 0.45, 18 + rng() * 16, col());
      put(bx + bw * 0.55, by + bh * 0.6, bw * 0.35, bh * 0.3, 12, col());
    } else if (d.style === 'house') {
      var n = 3 + Math.floor(rng() * 2);
      for (var i = 0; i < n; i++) {
        var hw = 70 + rng() * 60, hh = 60 + rng() * 50;
        put(bx + 15 + rng() * (bw - hw - 30), by + 15 + rng() * (bh - hh - 30), hw, hh, 9 + rng() * 5, col());
      }
    } else {
      put(bx + 20, by + 20, bw * 0.4, bh * 0.4, 12 + rng() * 10, col());
      put(bx + bw * 0.55, by + 20, bw * 0.35, bh * 0.35, 10 + rng() * 8, col());
      put(bx + 20, by + bh * 0.55, bw * 0.35, bh * 0.35, 10 + rng() * 8, col());
      put(bx + bw * 0.55, by + bh * 0.55, bw * 0.35, bh * 0.35, 10 + rng() * 8, col());
    }
  },
  districtAt: function (x, y) {
    for (var i = 0; i < DISTRICTS.length; i++) {
      var d = DISTRICTS[i];
      if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d;
    }
    return DISTRICTS[0];
  },
  inRect: function (x, y, r) { return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; },
  inWater: function (x, y) {
    for (var i = 0; i < this.water.length; i++) if (this.inRect(x, y, this.water[i])) return true;
    return false;
  },
  isOnBridge: function (x, y) { return this.inRect(x, y, this.bridge); },
  onBeach: function (x, y) { return this.inRect(x, y, this.beach) && !this.inWater(x, y); },
  nearRoad: function (x, y, pad) {
    pad = pad || 0;
    var hw = CFG.ROAD_W / 2 + pad;
    for (var i = 0; i < this.avenues.length; i++) if (Math.abs(x - this.avenues[i]) <= hw) return true;
    for (var j = 0; j < this.streets.length; j++) if (Math.abs(y - this.streets[j]) <= hw) return true;
    return false;
  },
  isOnRoad: function (x, y) {
    if (this.isOnBridge(x, y)) return true;
    if (this.inRect(x, y, this.runway)) return true;
    var hw = CFG.ROAD_W / 2;
    for (var i = 0; i < this.avenues.length; i++) if (Math.abs(x - this.avenues[i]) <= hw) return true;
    for (var j = 0; j < this.streets.length; j++) if (Math.abs(y - this.streets[j]) <= hw) return true;
    return false;
  },
  nearLandmark: function (x, y, pad) {
    for (var k in this.landmarks) {
      var lm = this.landmarks[k];
      if (dist(x, y, lm.x, lm.y) < lm.r + pad) return true;
    }
    return false;
  },
  insideBuilding: function (x, y, pad) {
    pad = pad || 0;
    for (var i = 0; i < this.buildings.length; i++) {
      var b = this.buildings[i];
      if (x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad) return true;
    }
    return false;
  },
  collideCircle: function (x, y, r) {
    // Returns push-out vector or null. Checks buildings near the point.
    for (var i = 0; i < this.buildings.length; i++) {
      var b = this.buildings[i];
      if (x < b.x - r - 4 || x > b.x + b.w + r + 4 || y < b.y - r - 4 || y > b.y + b.h + r + 4) continue;
      var push = circleBox(x, y, r, b.x, b.y, b.w, b.h);
      if (push) return push;
    }
    return null;
  },
  clampToWorld: function (x, y, r) {
    return { x: clamp(x, r, CFG.WORLD_W - r), y: clamp(y, r, CFG.WORLD_H - r) };
  },
  nearestRoadPoint: function (x, y) {
    var best = null, bd = 1e12;
    for (var i = 0; i < this.avenues.length; i++) {
      var d = Math.abs(x - this.avenues[i]);
      if (d < bd) { bd = d; best = { x: this.avenues[i], y: y }; }
    }
    for (var j = 0; j < this.streets.length; j++) {
      var d2 = Math.abs(y - this.streets[j]);
      if (d2 < bd) { bd = d2; best = { x: x, y: this.streets[j] }; }
    }
    return best || { x: x, y: y };
  },
  roadAngleAt: function (x, y) {
    // 0 = east-west street, PI/2 = north-south avenue; picks the closer road.
    var da = 1e9, ds = 1e9;
    for (var i = 0; i < this.avenues.length; i++) da = Math.min(da, Math.abs(x - this.avenues[i]));
    for (var j = 0; j < this.streets.length; j++) ds = Math.min(ds, Math.abs(y - this.streets[j]));
    return da < ds ? Math.PI / 2 : 0;
  },
};
