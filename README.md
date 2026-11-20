# Vermilion Bay — Make GTA 6 (gta6-01)

An open-world crime game in the spirit of GTA 6, built from scratch for the
make.fun gta6-01 bounty. Everything is original: the city, characters,
vehicles, names, story, art, sounds and music.

## The game

Maya "Vex" Rook came home to bury her brother. Silas Kane's syndicate runs
Vermilion Bay now — and Vex intends to take it back, one job at a time.

- **The city:** 4800×3600, 7 districts with distinct looks — Old Town,
  Downtown, Airport, Docks & Industry, Neon Row, Hills & Suburbs, Marina &
  Beach — plus 22 named landmarks (City Hall, Lucky Palm Casino, the
  lighthouse, the airport, the stadium, the pier ferris wheel…), a harbour,
  a beach, a causeway bridge and a runway.
- **The story:** 12 missions with a real arc — homecoming, car theft, a
  warehouse shootout, shakedowns, a boat run, a street race, a casino
  heist, a helicopter theft, a contract hit, a convoy ambush, storming the
  docks, and the final showdown with Silas Kane.
- **Vehicles:** 20 drivable types — sedans, sports cars, muscle, taxi,
  limo, SUV, pickup, van, truck, bus, police cruiser, ambulance, fire
  truck, motorcycle, scooter, speedboat, helicopter, tractor, convertible.
- **Weapons:** 8 — fists, pistol, SMG, shotgun, assault rifle, sniper
  rifle, RPG and molotovs.
- **Wanted system:** 0–5 stars. Police cruisers pursue, foot cops chase
  and shoot, roadblocks appear at 3★, a police helicopter hunts you at 4★.
  Heat decays out of sight. Get cornered on foot and you're BUSTED; die
  and you're WASTED.
- **Side activities:** taxi fares, 3 street races, 10 stunt jumps,
  5 contract hits, 60 hidden packages, 5 buyable properties that pay daily
  income, a gun shop and a car showroom.
- **World life:** traffic cars, pedestrians who flee gunfire, day/night
  cycle with streetlights, rain and lightning, particles, skid marks,
  smoke, explosions and fire.
- **Sound:** fully synthesized WebAudio — a bass/kick/hat/arp music loop,
  engine hum, sirens, gunshots, explosions and jingles. No audio files.
- **HUD & saves:** health/armor, cash, wanted stars, clock and weather,
  minimap, mission objective, title/pause/help/wasted screens, and
  automatic localStorage saves.

## Controls

WASD / arrows — move & drive · Mouse — aim · Click — shoot · E — enter /
exit vehicle · 1–8 — weapons · Space — handbrake · Shift — sprint ·
G — shop (near gun shop / showroom) · B — buy property · T — taxi work ·
R — start race · P / Esc — pause · H — help · M — mute

## Play it

Serve `game/` with any static server and open `game/index.html` in desktop
Chrome. No network requests: every file is local.

## Entry

`main.ts` (Node 22) copies `game/` and `screenshots/` to `/output` and
writes `/output/dossier.json` with the vendored make.fun library.
