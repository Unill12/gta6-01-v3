// Vermilion Bay — small helpers: math, seeded RNG, geometry, collision.
'use strict';
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(ax, ay, bx, by) { var dx = bx - ax, dy = by - ay; return Math.sqrt(dx * dx + dy * dy); }
function dist2(ax, ay, bx, by) { var dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; }
function angTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }
function angDiff(a, b) { var d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
function angLerp(a, b, t) { return a + angDiff(a, b) * t; }
function rand(a, b) { return a + Math.random() * (b - a); }
function randi(a, b) { return Math.floor(rand(a, b + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function choice(arr, r) { return arr[Math.floor(r() * arr.length)]; }

// Deterministic RNG (mulberry32) so the city is the same every load.
function makeRng(seed) {
  var s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    var t = Math.imul(s ^ (s >>> 15), s | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function fmtCash(n) { return Math.floor(n).toLocaleString('en-US'); }
function fmtTime(mins) {
  var h = Math.floor(mins / 60) % 24, m = Math.floor(mins) % 60;
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}
// Circle vs axis-aligned box: push the circle out, return true if colliding.
function circleBox(cx, cy, r, bx, by, bw, bh) {
  var nx = clamp(cx, bx, bx + bw), ny = clamp(cy, by, by + bh);
  var dx = cx - nx, dy = cy - ny, d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return null;
  if (d2 === 0) return { x: 0, y: -r };
  var d = Math.sqrt(d2), push = (r - d) / d;
  return { x: dx * push, y: dy * push };
}
function pointInBox(x, y, bx, by, bw, bh) { return x >= bx && x <= bx + bw && y >= by && y <= by + bh; }
