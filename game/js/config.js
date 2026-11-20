// Vermilion Bay — static game data: world, districts, landmarks, vehicles, weapons.
'use strict';
var CFG = {
  WORLD_W: 4800, WORLD_H: 3600,
  ROAD_W: 96, BLOCK: 480, ROAD_OFF: 240,
  VIEW_W: 1280, VIEW_H: 800,
  SAVE_KEY: 'vermilion-bay-v3',
};

// 7 districts, each with its own ground colour, building style and purpose.
var DISTRICTS = [
  { id: 'oldtown',  name: 'Old Town',      x: 0,    y: 0,    w: 1600, h: 1200, ground: '#8a7a5c', style: 'low',    desc: 'Brick lanes, the museum and the cathedral' },
  { id: 'downtown', name: 'Downtown',      x: 1600, y: 0,    w: 1600, h: 1200, ground: '#6f6f78', style: 'tower',  desc: 'Glass towers, City Hall and the bank' },
  { id: 'airport',  name: 'Airport',       x: 3200, y: 0,    w: 1600, h: 1200, ground: '#5d6b5a', style: 'flat',   desc: 'Runways, hangars and the control tower' },
  { id: 'docks',    name: 'Docks & Industry', x: 0, y: 1200, w: 1600, h: 1200, ground: '#5c5648', style: 'ware',   desc: 'Cranes, containers and warehouses' },
  { id: 'neon',     name: 'Neon Row',      x: 1600, y: 1200, w: 1600, h: 1200, ground: '#4a3a55', style: 'neon',   desc: 'Casinos, clubs and the Lucky Palm' },
  { id: 'suburbs',  name: 'Hills & Suburbs', x: 3200, y: 1200, w: 1600, h: 1200, ground: '#5f7a4e', style: 'house',  desc: 'Houses, parks and the stadium' },
  { id: 'marina',   name: 'Marina & Beach', x: 0,   y: 2400, w: 4800, h: 1200, ground: '#c2a878', style: 'beach',  desc: 'Pier, boardwalk, lighthouse and sand' },
];

// 18 named landmarks with fixed positions (x, y, radius, colour, label).
var LANDMARKS = [
  { id: 'museum',     name: 'Vermilion Museum',  x: 720,  y: 480,  r: 90,  color: '#d8c49a', district: 'oldtown' },
  { id: 'cathedral',  name: 'St. Aurelia Cathedral', x: 1200, y: 960, r: 80, color: '#e8ddc0', district: 'oldtown' },
  { id: 'university', name: 'Bay University',    x: 480,  y: 960,  r: 100, color: '#b8a888', district: 'oldtown' },
  { id: 'cityhall',   name: 'City Hall',         x: 2160, y: 480,  r: 110, color: '#c8ccd8', district: 'downtown' },
  { id: 'hotel',      name: 'Grand Vermilion Hotel', x: 2640, y: 960, r: 90, color: '#e8c890', district: 'downtown' },
  { id: 'bank',       name: 'Bay National Bank', x: 1920, y: 960,  r: 80,  color: '#b8c0cc', district: 'downtown' },
  { id: 'hospital',   name: 'St. Mercy Hospital', x: 2880, y: 480, r: 90,  color: '#f0f0f0', district: 'downtown' },
  { id: 'policehq',   name: 'Police HQ',         x: 2400, y: 720,  r: 70,  color: '#3355aa', district: 'downtown' },
  { id: 'tower',      name: 'Airport Control Tower', x: 3840, y: 480, r: 70, color: '#d8d8d8', district: 'airport' },
  { id: 'hangar',     name: 'Hangar 7',          x: 4320, y: 960,  r: 110, color: '#9aa0a8', district: 'airport' },
  { id: 'crane',      name: 'Harbor Crane',      x: 480,  y: 1680, r: 70,  color: '#e8a020', district: 'docks' },
  { id: 'warehouse',  name: 'Kane Warehouse 9', x: 960,  y: 2160, r: 120, color: '#8a7a68', district: 'docks' },
  { id: 'casino',     name: 'Lucky Palm Casino', x: 2160, y: 1680, r: 120, color: '#ff4fd8', district: 'neon' },
  { id: 'mall',       name: 'Neon Mall',         x: 2880, y: 2160, r: 110, color: '#c060ff', district: 'neon' },
  { id: 'showroom',   name: 'Vex Motors Showroom', x: 1920, y: 2160, r: 80, color: '#40c8ff', district: 'neon' },
  { id: 'stadium',    name: 'Bay Stadium',       x: 3840, y: 1680, r: 140, color: '#70b870', district: 'suburbs' },
  { id: 'studio',     name: 'Sunset Movie Studio', x: 4320, y: 2160, r: 100, color: '#e8b060', district: 'suburbs' },
  { id: 'safehouse',  name: "Vex's Safehouse",   x: 3600, y: 2160, r: 70,  color: '#ffd76a', district: 'suburbs' },
  { id: 'ferris',     name: 'Pier Ferris Wheel', x: 1200, y: 3120, r: 90,  color: '#ff70a0', district: 'marina' },
  { id: 'lighthouse', name: 'Old Lighthouse',    x: 240,  y: 3120, r: 60,  color: '#f0e8d0', district: 'marina' },
  { id: 'gunshop',    name: 'Ironworks Arms',    x: 720,  y: 2160, r: 70,  color: '#888888', district: 'docks' },
  { id: 'bar',        name: 'The Rusty Anchor',  x: 3360, y: 3120, r: 70,  color: '#a07040', district: 'marina' },
];

// 20 drivable vehicle types. speed in px/s, accel, grip, seats, kind.
var VEHICLES = [
  { id: 'sedan',    name: 'Sedan',        w: 46, l: 84,  speed: 420, accel: 260, grip: 3.2, color: '#4a7ac8', kind: 'car' },
  { id: 'coupe',    name: 'Coupe',        w: 44, l: 80,  speed: 470, accel: 300, grip: 3.4, color: '#c84a4a', kind: 'car' },
  { id: 'sports',   name: 'Comet GT',     w: 44, l: 82,  speed: 620, accel: 420, grip: 4.0, color: '#f5c542', kind: 'car' },
  { id: 'muscle',   name: 'Muscle',       w: 48, l: 88,  speed: 540, accel: 380, grip: 3.0, color: '#7a2a8a', kind: 'car' },
  { id: 'taxi',     name: 'Taxi',         w: 46, l: 84,  speed: 430, accel: 270, grip: 3.2, color: '#f5d020', kind: 'car' },
  { id: 'limo',     name: 'Limo',         w: 48, l: 120, speed: 400, accel: 220, grip: 2.8, color: '#222222', kind: 'car' },
  { id: 'suv',      name: 'SUV',          w: 50, l: 92,  speed: 460, accel: 280, grip: 3.1, color: '#2a8a5a', kind: 'car' },
  { id: 'pickup',   name: 'Pickup',       w: 48, l: 92,  speed: 450, accel: 270, grip: 3.0, color: '#8a5a2a', kind: 'car' },
  { id: 'van',      name: 'Van',          w: 50, l: 96,  speed: 380, accel: 220, grip: 2.9, color: '#c8c8c8', kind: 'car' },
  { id: 'truck',    name: 'Truck',        w: 52, l: 110, speed: 360, accel: 200, grip: 2.7, color: '#5a6a7a', kind: 'car' },
  { id: 'bus',      name: 'Bus',          w: 54, l: 130, speed: 340, accel: 180, grip: 2.6, color: '#e87020', kind: 'car' },
  { id: 'police',   name: 'Police Cruiser', w: 46, l: 86, speed: 560, accel: 360, grip: 3.8, color: '#1a2a6a', kind: 'car' },
  { id: 'ambulance',name: 'Ambulance',    w: 50, l: 100, speed: 470, accel: 280, grip: 3.1, color: '#f0f0f0', kind: 'car' },
  { id: 'firetruck',name: 'Fire Truck',   w: 54, l: 120, speed: 400, accel: 210, grip: 2.8, color: '#d02020', kind: 'car' },
  { id: 'bike',     name: 'Motorcycle',   w: 26, l: 62,  speed: 580, accel: 460, grip: 4.4, color: '#20c8a0', kind: 'bike' },
  { id: 'scooter',  name: 'Scooter',      w: 24, l: 54,  speed: 340, accel: 320, grip: 4.2, color: '#ff90c0', kind: 'bike' },
  { id: 'boat',     name: 'Speedboat',    w: 40, l: 96,  speed: 520, accel: 300, grip: 2.2, color: '#40a0ff', kind: 'boat' },
  { id: 'heli',     name: 'Helicopter',   w: 60, l: 110, speed: 560, accel: 340, grip: 3.0, color: '#c0c0c0', kind: 'heli' },
  { id: 'tractor',  name: 'Tractor',      w: 46, l: 80,  speed: 260, accel: 200, grip: 3.0, color: '#e0a020', kind: 'car' },
  { id: 'convert',  name: 'Convertible',  w: 44, l: 82,  speed: 520, accel: 360, grip: 3.6, color: '#ff6090', kind: 'car' },
];

// 8 weapons. dmg per hit, rate (shots/sec), range, auto?, spread, ammo price.
var WEAPONS = [
  { id: 'fist',    name: 'Fists',        dmg: 12, rate: 2.5, range: 42,  auto: true,  spread: 0,    price: 0,    ammoPrice: 0,   color: '#e8c090' },
  { id: 'pistol',  name: 'Pistol',       dmg: 18, rate: 3.5, range: 420, auto: false, spread: 0.03, price: 500,  ammoPrice: 20,  color: '#c8c8c8' },
  { id: 'smg',     name: 'SMG',          dmg: 12, rate: 9,   range: 380, auto: true,  spread: 0.09, price: 1800, ammoPrice: 40,  color: '#606060' },
  { id: 'shotgun', name: 'Shotgun',      dmg: 11, rate: 1.4, range: 300, auto: false, spread: 0.22, price: 2500, ammoPrice: 60,  color: '#8a5a2a', pellets: 6 },
  { id: 'rifle',   name: 'Assault Rifle',dmg: 24, rate: 6,   range: 560, auto: true,  spread: 0.05, price: 4500, ammoPrice: 80,  color: '#2a4a2a' },
  { id: 'sniper',  name: 'Sniper Rifle', dmg: 90, rate: 0.9, range: 900, auto: false, spread: 0.005, price: 8000, ammoPrice: 150, color: '#1a1a2a' },
  { id: 'rpg',     name: 'RPG',          dmg: 120, rate: 0.8, range: 700, auto: false, spread: 0.01, price: 12000, ammoPrice: 400, color: '#4a2a1a', explosive: true },
  { id: 'molotov', name: 'Molotov',      dmg: 40, rate: 1.2, range: 260, auto: false, spread: 0.06, price: 900,  ammoPrice: 120, color: '#c86400', fire: true },
];

// 5 buyable properties: cost, daily income, perk.
var PROPERTIES = [
  { id: 'garage',  name: 'Bayview Garage',   x: 3360, y: 1920, cost: 8000,  income: 400,  perk: 'Stores your cars' },
  { id: 'bar',     name: 'The Rusty Anchor', x: 3360, y: 3120, cost: 15000, income: 900,  perk: 'Free health top-up' },
  { id: 'arcade',  name: 'Neon Arcade',     x: 2640, y: 1920, cost: 25000, income: 1600, perk: 'Daily bonus cash' },
  { id: 'carwash', name: 'Splash Car Wash', x: 1200, y: 1920, cost: 12000, income: 700,  perk: 'Free car repairs' },
  { id: 'motel',   name: 'Palm Court Motel', x: 4080, y: 2880, cost: 30000, income: 2000, perk: 'Safehouse + income' },
];

// Stunt jump ramps (x, y, angle, reward).
var JUMPS = [
  { x: 720,  y: 1200, a: 0,            reward: 500 },
  { x: 2160, y: 720,  a: Math.PI / 2,  reward: 500 },
  { x: 3600, y: 1200, a: Math.PI,      reward: 600 },
  { x: 1200, y: 2400, a: -Math.PI / 2, reward: 600 },
  { x: 2880, y: 2880, a: 0,            reward: 700 },
  { x: 4080, y: 1680, a: Math.PI / 2,  reward: 700 },
  { x: 480,  y: 2880, a: Math.PI,      reward: 800 },
  { x: 4320, y: 720,  a: -Math.PI / 2, reward: 800 },
  { x: 1680, y: 3360, a: 0,            reward: 900 },
  { x: 3120, y: 3360, a: Math.PI,      reward: 900 },
];

// Contract hit targets (name, x, y, reward).
var CONTRACTS = [
  { name: 'Mickey "Fingers" Doyle', x: 960,  y: 720,  reward: 2500 },
  { name: 'Salvatore Vane',         x: 2400, y: 1920, reward: 3200 },
  { name: 'Big Tommy Rourke',       x: 1200, y: 2400, reward: 4000 },
  { name: 'The Broker',             x: 4080, y: 1200, reward: 5500 },
  { name: 'Silas Kane\'s Lieutenant', x: 2640, y: 1440, reward: 8000 },
];

var MISSION_REWARDS = [1000, 2000, 3000, 2500, 4000, 5000, 8000, 6000, 5000, 7000, 9000, 20000];
