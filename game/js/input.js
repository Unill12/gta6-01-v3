// Vermilion Bay — keyboard + mouse input.
'use strict';
var Input = {
  keys: {}, mouseX: 640, mouseY: 400, mouseDown: false, mouseClicked: false,
  pressed: {}, // edge-triggered keys, consumed by the game loop

  init: function (canvas) {
    var self = this;
    window.addEventListener('keydown', function (e) {
      if (!self.keys[e.code]) self.pressed[e.code] = true;
      self.keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { self.keys[e.code] = false; });
    window.addEventListener('blur', function () { self.keys = {}; self.mouseDown = false; });
    canvas.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      self.mouseX = (e.clientX - r.left) * (canvas.width / r.width);
      self.mouseY = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', function (e) { if (e.button === 0) { self.mouseDown = true; self.mouseClicked = true; } });
    window.addEventListener('mouseup', function (e) { if (e.button === 0) self.mouseDown = false; });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  },
  down: function (code) { return !!this.keys[code]; },
  wasPressed: function (code) { return !!this.pressed[code]; },
  anyWasd: function () {
    return this.keys['KeyW'] || this.keys['KeyA'] || this.keys['KeyS'] || this.keys['KeyD'] ||
      this.keys['ArrowUp'] || this.keys['ArrowDown'] || this.keys['ArrowLeft'] || this.keys['ArrowRight'];
  },
  endFrame: function () { this.pressed = {}; this.mouseClicked = false; },
};
