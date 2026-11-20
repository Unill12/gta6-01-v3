// Vermilion Bay — rendering: the city, vehicles, people, effects, lighting
// and the minimap. Top-down 2D canvas, camera follows the player.
'use strict';
var Render = {
  cam: { x: 2400, y: 1800, zoom: 1 },

  updateCamera: function (dt) {
    var p = Game.player;
    var tx = clamp(p.x, CFG.VIEW_W / 2, CFG.WORLD_W - CFG.VIEW_W / 2);
    var ty = clamp(p.y, CFG.VIEW_H / 2, CFG.WORLD_H - CFG.VIEW_H / 2);
    this.cam.x = lerp(this.cam.x, tx, Math.min(1, dt * 5));
    this.cam.y = lerp(this.cam.y, ty, Math.min(1, dt * 5));
    this.cam.zoom = p.car ? 0.92 : 1.0;
    Game.camera = this.cam;
  },
  draw: function (ctx) {
    var cam = this.cam;
    ctx.save();
    if (Game.shakeAmt > 0.5) ctx.translate(rand(-1, 1) * Game.shakeAmt, rand(-1, 1) * Game.shakeAmt);
    ctx.clearRect(0, 0, CFG.VIEW_W, CFG.VIEW_H);
    ctx.translate(CFG.VIEW_W / 2, CFG.VIEW_H / 2);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);
    this.drawGround(ctx, cam);
    this.drawMarkers(ctx);
    this.drawVehicles(ctx);
    this.drawPeds(ctx);
    this.drawPlayer(ctx);
    Particles.draw(ctx);
    this.drawHeli(ctx);
    this.drawWeatherFx(ctx, cam);
    ctx.restore();
    this.drawNight(ctx);
    this.drawMinimap();
  },
  viewRect: function (cam) {
    var hw = CFG.VIEW_W / 2 / cam.zoom + 60, hh = CFG.VIEW_H / 2 / cam.zoom + 60;
    return { x0: cam.x - hw, y0: cam.y - hh, x1: cam.x + hw, y1: cam.y + hh };
  },
  drawGround: function (ctx, cam) {
    var vr = this.viewRect(cam);
    // Base + districts.
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(vr.x0, vr.y0, vr.x1 - vr.x0, vr.y1 - vr.y0);
    for (var d = 0; d < DISTRICTS.length; d++) {
      var dist = DISTRICTS[d];
      ctx.fillStyle = dist.ground;
      ctx.fillRect(dist.x, dist.y, dist.w, dist.h);
    }
    // Water (animated) + beach.
    ctx.fillStyle = '#1e5a8a';
    for (var w = 0; w < City.water.length; w++) {
      var wr = City.water[w];
      ctx.fillRect(wr.x, wr.y, wr.w, wr.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      for (var wy = wr.y + 20; wy < wr.y + wr.h; wy += 46) {
        ctx.beginPath();
        for (var wx = wr.x; wx < wr.x + wr.w; wx += 26) {
          var yo = Math.sin(wx * 0.02 + Game.time * 2 + wy) * 4;
          if (wx === wr.x) ctx.moveTo(wx, wy + yo); else ctx.lineTo(wx, wy + yo);
        }
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#d8c090';
    ctx.fillRect(City.beach.x, City.beach.y, City.beach.w, City.beach.h);
    // Runway.
    ctx.fillStyle = '#2a2a2e';
    ctx.fillRect(City.runway.x, City.runway.y, City.runway.w, City.runway.h);
    ctx.fillStyle = '#e8e8e8';
    for (var rx = City.runway.x + 40; rx < City.runway.x + City.runway.w; rx += 90) {
      ctx.fillRect(rx, City.runway.y + 50, 44, 8);
    }
    // Helipad.
    ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(City.helipad.x, City.helipad.y, 34, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#e8e8e8'; ctx.font = 'bold 30px Arial'; ctx.textAlign = 'center';
    ctx.fillText('H', City.helipad.x, City.helipad.y + 10);
    // Roads: asphalt + sidewalks + dashes.
    ctx.fillStyle = '#333336';
    for (var i = 0; i < City.avenues.length; i++) ctx.fillRect(City.avenues[i] - CFG.ROAD_W / 2, 0, CFG.ROAD_W, CFG.WORLD_H);
    for (var j = 0; j < City.streets.length; j++) ctx.fillRect(0, City.streets[j] - CFG.ROAD_W / 2, CFG.WORLD_W, CFG.ROAD_W);
    // Bridge deck over the harbour.
    ctx.fillStyle = '#3d3d42';
    ctx.fillRect(City.bridge.x, City.bridge.y, City.bridge.w, City.bridge.h);
    // Sidewalk edges.
    ctx.strokeStyle = '#9a9a92'; ctx.lineWidth = 4;
    for (var a = 0; a < City.avenues.length; a++) {
      ctx.beginPath(); ctx.moveTo(City.avenues[a] - CFG.ROAD_W / 2, 0); ctx.lineTo(City.avenues[a] - CFG.ROAD_W / 2, CFG.WORLD_H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(City.avenues[a] + CFG.ROAD_W / 2, 0); ctx.lineTo(City.avenues[a] + CFG.ROAD_W / 2, CFG.WORLD_H); ctx.stroke();
    }
    for (var s = 0; s < City.streets.length; s++) {
      ctx.beginPath(); ctx.moveTo(0, City.streets[s] - CFG.ROAD_W / 2); ctx.lineTo(CFG.WORLD_W, City.streets[s] - CFG.ROAD_W / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, City.streets[s] + CFG.ROAD_W / 2); ctx.lineTo(CFG.WORLD_W, City.streets[s] + CFG.ROAD_W / 2); ctx.stroke();
    }
    // Center dashes.
    ctx.strokeStyle = '#e8d878'; ctx.lineWidth = 3; ctx.setLineDash([26, 30]);
    for (var a2 = 0; a2 < City.avenues.length; a2++) {
      ctx.beginPath(); ctx.moveTo(City.avenues[a2], 0); ctx.lineTo(City.avenues[a2], CFG.WORLD_H); ctx.stroke();
    }
    for (var s2 = 0; s2 < City.streets.length; s2++) {
      ctx.beginPath(); ctx.moveTo(0, City.streets[s2]); ctx.lineTo(CFG.WORLD_W, City.streets[s2]); ctx.stroke();
    }
    ctx.setLineDash([]);
    // Buildings (only those in view).
    for (var b = 0; b < City.buildings.length; b++) {
      var bd = City.buildings[b];
      if (bd.x > vr.x1 || bd.x + bd.w < vr.x0 || bd.y > vr.y1 || bd.y + bd.h < vr.y0) continue;
      var sh = Math.min(26, bd.hgt * 0.45);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(bd.x + sh, bd.y + sh, bd.w, bd.h);
      ctx.fillStyle = bd.color;
      ctx.fillRect(bd.x, bd.y, bd.w, bd.h);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(bd.x, bd.y, bd.w, 8);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
      ctx.strokeRect(bd.x, bd.y, bd.w, bd.h);
      if (bd.landmark) {
        ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center';
        ctx.fillText(bd.name, bd.x + bd.w / 2, bd.y + bd.h / 2 + 5);
      }
      if (bd.style === 'neon' && Weather.isNight()) {
        ctx.fillStyle = 'rgba(255,80,216,0.5)';
        ctx.fillRect(bd.x, bd.y + bd.h - 10, bd.w, 6);
      }
    }
    // Trees.
    for (var t = 0; t < City.trees.length; t++) {
      var tr = City.trees[t];
      if (tr.x < vr.x0 || tr.x > vr.x1 || tr.y < vr.y0 || tr.y > vr.y1) continue;
      ctx.fillStyle = '#2a6a2a';
      ctx.beginPath(); ctx.arc(tr.x, tr.y, tr.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a8a3a';
      ctx.beginPath(); ctx.arc(tr.x - 3, tr.y - 3, tr.r * 0.6, 0, Math.PI * 2); ctx.fill();
    }
    // Stunt ramps.
    for (var j = 0; j < JUMPS.length; j++) {
      var jp = JUMPS[j];
      if (jp.x < vr.x0 || jp.x > vr.x1 || jp.y < vr.y0 || jp.y > vr.y1) continue;
      ctx.save(); ctx.translate(jp.x, jp.y); ctx.rotate(jp.a);
      ctx.fillStyle = '#ff8800';
      ctx.beginPath(); ctx.moveTo(-24, -18); ctx.lineTo(24, 0); ctx.lineTo(-24, 18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center';
      ctx.fillText('JUMP', 0, -26);
      ctx.restore();
    }
  },
  drawMarkers: function (ctx) {
    var pulse = 1 + Math.sin(Game.time * 5) * 0.15;
    // Hidden packages.
    for (var i = 0; i < City.packages.length; i++) {
      var pk = City.packages[i];
      if (pk.found) continue;
      if (Math.abs(pk.x - this.cam.x) > 700 || Math.abs(pk.y - this.cam.y) > 500) continue;
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath(); ctx.arc(pk.x, pk.y, 7 * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(pk.x, pk.y, 11 * pulse, 0, Math.PI * 2); ctx.stroke();
    }
    // Property markers.
    for (var p = 0; p < PROPERTIES.length; p++) {
      var pr = PROPERTIES[p];
      if (Math.abs(pr.x - this.cam.x) > 700 || Math.abs(pr.y - this.cam.y) > 500) continue;
      ctx.fillStyle = Economy.ownsProp(pr.id) ? '#7dff8a' : '#40c8ff';
      ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
      ctx.fillText(Economy.ownsProp(pr.id) ? '★' : '$', pr.x, pr.y);
    }
    // Race flags.
    for (var r = 0; r < Activities.races.length; r++) {
      var rc = Activities.races[r];
      if (Math.abs(rc.x - this.cam.x) > 700 || Math.abs(rc.y - this.cam.y) > 500) continue;
      ctx.fillStyle = '#fff';
      ctx.fillRect(rc.x - 2, rc.y - 26, 3, 26);
      ctx.fillStyle = '#000';
      ctx.fillRect(rc.x + 1, rc.y - 26, 18, 12);
      ctx.fillStyle = '#fff';
      ctx.fillRect(rc.x + 5, rc.y - 26, 5, 5); ctx.fillRect(rc.x + 12, rc.y - 19, 5, 5);
    }
    // Contract targets.
    for (var c = 0; c < Activities.contracts.length; c++) {
      var ct = Activities.contracts[c];
      if (ct.state !== 'open') continue;
      if (Math.abs(ct.x - this.cam.x) > 700 || Math.abs(ct.y - this.cam.y) > 500) continue;
      ctx.fillStyle = '#ff4040';
      ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center';
      ctx.fillText('✖', ct.x, ct.y);
    }
    // Mission marker.
    var m = Missions.marker();
    if (m) {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.fillStyle = m.color;
      ctx.beginPath(); ctx.arc(0, 0, 16 * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
      ctx.fillText('!', 0, 6);
      ctx.restore();
      // Direction arrow at screen edge when off-screen.
      var cam = this.cam;
      var dx = m.x - cam.x, dy = m.y - cam.y;
      if (Math.abs(dx) > CFG.VIEW_W / 2 - 40 || Math.abs(dy) > CFG.VIEW_H / 2 - 40) {
        var ax = clamp(cam.x + dx, cam.x - CFG.VIEW_W / 2 + 46, cam.x + CFG.VIEW_W / 2 - 46);
        var ay = clamp(cam.y + dy, cam.y - CFG.VIEW_H / 2 + 46, cam.y + CFG.VIEW_H / 2 - 46);
        var aa = angTo(ax, ay, m.x, m.y);
        ctx.save(); ctx.translate(ax, ay); ctx.rotate(aa);
        ctx.fillStyle = m.color;
        ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -12); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    // Taxi markers.
    var t = Activities.taxi;
    if (t.active) {
      var tx = t.stage === 'pickup' ? t.px : t.dx, ty = t.stage === 'pickup' ? t.py : t.dy;
      ctx.fillStyle = '#7dff8a';
      ctx.beginPath(); ctx.arc(tx, ty, 12 * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center';
      ctx.fillText('T', tx, ty + 5);
    }
    // Race checkpoints.
    if (Activities.race.active) {
      var race = Activities.races[Activities.race.idx];
      var cp = race.cps[Activities.race.cp];
      ctx.strokeStyle = '#7dff8a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cp[0], cp[1], 44, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#7dff8a'; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'center';
      ctx.fillText('CP ' + (Activities.race.cp + 1) + ' · Lap ' + (Activities.race.lap + 1) + '/2', cp[0], cp[1] - 52);
    }
  },
  drawVehicleShape: function (ctx, v) {
    var def = v.def;
    ctx.save();
    ctx.translate(v.x, v.y - (v.airborne || 0));
    ctx.rotate(v.angle);
    if (def.kind === 'boat') {
      ctx.fillStyle = '#8a5a2a';
      ctx.fillRect(-def.l / 2, -def.w / 2, def.l, def.w);
      ctx.fillStyle = v.color;
      ctx.beginPath(); ctx.moveTo(-def.l / 2, -def.w / 2); ctx.lineTo(def.l / 2, 0); ctx.lineTo(-def.l / 2, def.w / 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(-6, -8, 22, 16);
    } else if (def.kind === 'heli') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(10, 16, def.l / 2, def.w / 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = v.color;
      ctx.beginPath(); ctx.ellipse(0, 0, def.l / 2, def.w / 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9fd8ff';
      ctx.beginPath(); ctx.ellipse(def.l / 4, 0, 14, def.w / 2 - 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#333'; ctx.lineWidth = 3;
      var rot = Game.time * 30;
      ctx.beginPath(); ctx.moveTo(Math.cos(rot) * -def.l, Math.sin(rot) * -def.l); ctx.lineTo(Math.cos(rot) * def.l, Math.sin(rot) * def.l); ctx.stroke();
    } else {
      // Shadow, body, cabin, wheels.
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.roundRect(-def.l / 2 + 3, -def.w / 2 + 4, def.l, def.w, 10); ctx.fill();
      ctx.fillStyle = v.color;
      ctx.beginPath(); ctx.roundRect(-def.l / 2, -def.w / 2, def.l, def.w, 10); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.roundRect(-def.l / 2, -def.w / 2, def.l, 14, 8); ctx.fill();
      ctx.fillStyle = '#1a2a3a';
      ctx.fillRect(def.l * 0.05, -def.w / 2 + 6, def.l * 0.32, def.w - 12);
      ctx.fillStyle = '#111';
      var wl = def.l * 0.32, ww = 8;
      ctx.fillRect(-wl, -def.w / 2 - 3, 16, ww); ctx.fillRect(-wl, def.w / 2 - 5, 16, ww);
      ctx.fillRect(wl - 16, -def.w / 2 - 3, 16, ww); ctx.fillRect(wl - 16, def.w / 2 - 5, 16, ww);
      if (v.police) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(-def.l / 2 + 6, -def.w / 2 + 4, def.l - 12, 8);
        ctx.fillStyle = Math.floor(Game.time * 4) % 2 ? '#ff2020' : '#2050ff';
        ctx.fillRect(-6, -def.w / 2 - 2, 12, 8);
      }
      if (def.id === 'taxi') {
        ctx.fillStyle = '#111'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
        ctx.fillText('TAXI', 0, 4);
      }
      if (Weather.isNight()) {
        ctx.fillStyle = 'rgba(255,255,180,0.85)';
        ctx.beginPath(); ctx.arc(def.l / 2, -def.w / 4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(def.l / 2, def.w / 4, 4, 0, Math.PI * 2); ctx.fill();
      }
      if (v.health < 100) {
        ctx.fillStyle = '#222';
        ctx.fillRect(-def.l / 2 + 4, -def.w / 2 - 8, def.l - 8, 4);
        ctx.fillStyle = v.health > 40 ? '#7dff8a' : '#ff4040';
        ctx.fillRect(-def.l / 2 + 4, -def.w / 2 - 8, (def.l - 8) * v.health / 100, 4);
      }
    }
    ctx.restore();
  },
  drawVehicles: function (ctx) {
    for (var i = 0; i < Vehicles.list.length; i++) {
      var v = Vehicles.list[i];
      if (Math.abs(v.x - this.cam.x) > 900 || Math.abs(v.y - this.cam.y) > 700) continue;
      this.drawVehicleShape(ctx, v);
    }
  },
  drawPedShape: function (ctx, x, y, angle, shirt, skin, phase, scale) {
    scale = scale || 1;
    ctx.save();
    ctx.translate(x, y);
    var bob = Math.sin(phase) * 2 * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, 8 * scale, 9 * scale, 4 * scale, 0, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(angle);
    ctx.fillStyle = shirt;
    ctx.beginPath(); ctx.roundRect(-7 * scale, -6 * scale + bob, 14 * scale, 15 * scale, 5 * scale); ctx.fill();
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(9 * scale, 0, 6.5 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  drawPeds: function (ctx) {
    for (var i = 0; i < Entities.peds.length; i++) {
      var p = Entities.peds[i];
      if (Math.abs(p.x - this.cam.x) > 800 || Math.abs(p.y - this.cam.y) > 600) continue;
      this.drawPedShape(ctx, p.x, p.y, p.angle, p.shirt, p.skin, p.walkPhase, 1);
    }
    for (var j = 0; j < Police.cops.length; j++) {
      var c = Police.cops[j];
      this.drawPedShape(ctx, c.x, c.y, c.angle, '#2030a0', '#e8b88a', Game.time * 8, 1.1);
      ctx.fillStyle = '#2030a0';
      ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
      ctx.fillText('POLICE', c.x, c.y - 16);
    }
    for (var k = 0; k < Enemies.list.length; k++) {
      var e = Enemies.list[k];
      this.drawPedShape(ctx, e.x, e.y, e.angle, '#a02020', '#c89878', e.walkPhase, 1.1);
      ctx.fillStyle = '#ff8080';
      ctx.fillRect(e.x - 16, e.y - 24, 32, 4);
      ctx.fillStyle = '#ff2020';
      ctx.fillRect(e.x - 16, e.y - 24, 32 * Math.max(0, e.hp / 100), 4);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
      ctx.fillText(e.name, e.x, e.y - 30);
    }
  },
  drawPlayer: function (ctx) {
    var p = Game.player;
    if (p.car) return; // drawn as the car
    this.drawPedShape(ctx, p.x, p.y, p.angle, '#ffd76a', '#e8b88a', Game.time * 9, 1.15);
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
    ctx.fillText('VEX', p.x, p.y - 20);
    // Aim line.
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(p.angle) * 46, p.y + Math.sin(p.angle) * 46); ctx.stroke();
  },
  drawHeli: function (ctx) {
    var h = Police.heli;
    if (!h) return;
    // Shadow + spotlight on the ground.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(h.x + 40, h.y + 60, 46, 20, 0, 0, Math.PI * 2); ctx.fill();
    var g = ctx.createRadialGradient(h.x + 40, h.y + 60, 10, h.x + 40, h.y + 60, 180);
    g.addColorStop(0, 'rgba(255,255,200,0.22)');
    g.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(h.x + 40, h.y + 60, 180, 0, Math.PI * 2); ctx.fill();
    // The helicopter itself (drawn higher, as if in the sky).
    ctx.save();
    ctx.translate(h.x, h.y - 120);
    ctx.rotate(Math.sin(Game.time) * 0.1);
    ctx.fillStyle = '#2030a0';
    ctx.beginPath(); ctx.ellipse(0, 0, 42, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9fd8ff';
    ctx.beginPath(); ctx.ellipse(16, 0, 10, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
    var rot = Game.time * 26;
    ctx.beginPath(); ctx.moveTo(Math.cos(rot) * -56, Math.sin(rot) * -56); ctx.lineTo(Math.cos(rot) * 56, Math.sin(rot) * 56); ctx.stroke();
    ctx.restore();
  },
  drawWeatherFx: function (ctx, cam) {
    if (Weather.rain > 0) {
      ctx.strokeStyle = 'rgba(180,200,255,0.4)';
      ctx.lineWidth = 1;
      var vr = this.viewRect(cam);
      for (var i = 0; i < 90 * Weather.rain; i++) {
        var rx = vr.x0 + ((i * 137.5 + Game.time * 900) % (vr.x1 - vr.x0));
        var ry = vr.y0 + ((i * 89.3 + Game.time * 1400) % (vr.y1 - vr.y0));
        ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 6, ry + 18); ctx.stroke();
      }
    }
    if (Weather.flash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + (Weather.flash * 1.4) + ')';
      ctx.fillRect(cam.x - 700, cam.y - 500, 1400, 1000);
    }
  },
  drawNight: function (ctx) {
    var dark = Weather.darkness();
    if (dark <= 0.02 && Weather.flash <= 0) return;
    ctx.save();
    ctx.fillStyle = 'rgba(8,10,40,' + (dark * 0.55) + ')';
    ctx.fillRect(0, 0, CFG.VIEW_W, CFG.VIEW_H);
    // Light pool around the player.
    var p = Game.player;
    var sx = (p.x - this.cam.x) * this.cam.zoom + CFG.VIEW_W / 2;
    var sy = (p.y - this.cam.y) * this.cam.zoom + CFG.VIEW_H / 2;
    var g = ctx.createRadialGradient(sx, sy, 60, sx, sy, 340);
    g.addColorStop(0, 'rgba(255,230,160,0.20)');
    g.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CFG.VIEW_W, CFG.VIEW_H);
    ctx.restore();
  },
  drawMinimap: function () {
    var mm = document.getElementById('minimap');
    if (!mm) return;
    var ctx = mm.getContext('2d');
    var sx = mm.width / CFG.WORLD_W, sy = mm.height / CFG.WORLD_H;
    ctx.clearRect(0, 0, mm.width, mm.height);
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(0, 0, mm.width, mm.height);
    for (var d = 0; d < DISTRICTS.length; d++) {
      var dist = DISTRICTS[d];
      ctx.fillStyle = dist.ground;
      ctx.fillRect(dist.x * sx, dist.y * sy, dist.w * sx, dist.h * sy);
    }
    ctx.fillStyle = '#1e5a8a';
    for (var w = 0; w < City.water.length; w++) ctx.fillRect(City.water[w].x * sx, City.water[w].y * sy, City.water[w].w * sx, City.water[w].h * sy);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    for (var i = 0; i < City.avenues.length; i++) { ctx.beginPath(); ctx.moveTo(City.avenues[i] * sx, 0); ctx.lineTo(City.avenues[i] * sx, mm.height); ctx.stroke(); }
    for (var j = 0; j < City.streets.length; j++) { ctx.beginPath(); ctx.moveTo(0, City.streets[j] * sy); ctx.lineTo(mm.width, City.streets[j] * sy); ctx.stroke(); }
    // Mission marker.
    var m = Missions.marker();
    if (m) {
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath(); ctx.arc(m.x * sx, m.y * sy, 5, 0, Math.PI * 2); ctx.fill();
    }
    // Police.
    ctx.fillStyle = '#5080ff';
    for (var c = 0; c < Police.cars.length; c++) ctx.fillRect(Police.cars[c].x * sx - 2, Police.cars[c].y * sy - 2, 4, 4);
    // Player arrow.
    var p = Game.player;
    ctx.save();
    ctx.translate(p.x * sx, p.y * sy);
    ctx.rotate(p.angle);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-5, -5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
    ctx.restore();
    // Viewport box.
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.strokeRect((this.cam.x - CFG.VIEW_W / 2) * sx, (this.cam.y - CFG.VIEW_H / 2) * sy, CFG.VIEW_W * sx, CFG.VIEW_H * sy);
  },
};
