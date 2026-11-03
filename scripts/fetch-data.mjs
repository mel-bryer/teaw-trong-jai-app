// Downloads the open data the map is baked from into data-raw/ (not shipped).
// Elevation: AWS Terrain Tiles (terrarium PNG, SRTM and others). Streets, water, buildings: OpenStreetMap via Overpass.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { EXTENT, CITY } from './extent.mjs';

const RAW = new URL('../data-raw/', import.meta.url).pathname;
mkdirSync(join(RAW, 'dem'), { recursive: true });

const Z = 13;
const tx = (lng) => Math.floor((lng + 180) / 360 * 2 ** Z);
const ty = (lat) => { const r = lat * Math.PI / 180; return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2 ** Z); };
const X0 = tx(EXTENT.west), X1 = tx(EXTENT.east), Y0 = ty(EXTENT.north), Y1 = ty(EXTENT.south);
let n = 0;
for (let x = X0; x <= X1; x++) for (let y = Y0; y <= Y1; y++) {
  const f = join(RAW, 'dem', `${x}_${y}.png`);
  if (existsSync(f)) continue;
  const r = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${x}/${y}.png`);
  if (!r.ok) throw new Error(`tile ${x}/${y}: ${r.status}`);
  writeFileSync(f, Buffer.from(await r.arrayBuffer())); n++;
}
writeFileSync(join(RAW, 'dem', 'tiles.json'), JSON.stringify({ z: Z, x0: X0, x1: X1, y0: Y0, y1: Y1 }));
console.log(`elevation: ${n} new tiles, ${(X1 - X0 + 1) * (Y1 - Y0 + 1)} in all`);

const bb = (e) => `${e.south},${e.west},${e.north},${e.east}`;
const QUERIES = {
  roads: `[out:json][timeout:180];(way["highway"~"^(motorway|trunk|primary|secondary|tertiary)(_link)?$"](${bb(EXTENT)});way["highway"~"^(residential|unclassified|living_street)$"](${bb(CITY)}););out geom;`,
  water: `[out:json][timeout:180];(way["waterway"~"^(river|canal|stream)$"](${bb(EXTENT)});way["natural"="water"](${bb(EXTENT)});way["landuse"="reservoir"](${bb(EXTENT)});relation["natural"="water"](${bb(EXTENT)});way["aeroway"="runway"](${bb(EXTENT)}););out geom;`,
  buildings: `[out:json][timeout:240];way["building"](${bb(CITY)});out geom;`,
};
for (const [name, q] of Object.entries(QUERIES)) {
  const f = join(RAW, `${name}.json`);
  if (existsSync(f)) { console.log(`${name}: cached`); continue; }
  const MIRRORS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
  let j = null;
  for (let attempt = 0; attempt < 9 && !j; attempt++) {
    const url = MIRRORS[attempt % MIRRORS.length];
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'teaw-trong-jai-prototype' }, body: 'data=' + encodeURIComponent(q) });
      if (r.ok) j = await r.json(); else console.log(`${name}: ${r.status} from ${url}, retrying`);
    } catch (e) { console.log(`${name}: ${e.message} from ${url}, retrying`); }
    if (!j) await new Promise((res) => setTimeout(res, 4000 * 2 ** Math.floor(attempt / 3)));
  }
  if (!j) throw new Error(`${name}: every mirror failed`);
  writeFileSync(f, JSON.stringify(j));
  console.log(`${name}: ${j.elements.length} elements`);
}
