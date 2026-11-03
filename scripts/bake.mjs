// Bakes data-raw/ into what the app loads from public/data/:
//   heights.txt   Uint16 metres, NX × NY, north row first (base64, so any static host serves it)
//   buildings.txt footprints and heights of the city centre, quantised to the model's world units
//   water.json    river and canal centrelines, lake and moat outlines, in world units
//   terrain-{day,night}-{4096,2048}.jpg  the painted relief: elevation, hillshade, paddies, streets, water, roofs
// Painting runs in headless Chrome (canvas), everything else in Node.
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { EXTENT } from './extent.mjs';

const ROOT = new URL('..', import.meta.url).pathname, RAW = join(ROOT, 'data-raw'), OUT = join(ROOT, 'public', 'data');
mkdirSync(OUT, { recursive: true });
const { west: W0, east: E0, north: N0, south: S0 } = EXTENT;
const SX = 31.25, SZ = 30, NX = 416, NY = 400;
const toW = (lat, lng) => [(lng - W0) / (E0 - W0) * SX - SX / 2, (N0 - lat) / (N0 - S0) * SZ - SZ / 2];
const ll = (g) => g.map((p) => [+p.lat.toFixed(6), +p.lon.toFixed(6)]);

/* ---- OSM into plain lists ---- */
const roadsRaw = JSON.parse(readFileSync(join(RAW, 'roads.json'))).elements;
const ROADS = roadsRaw.filter((e) => e.geometry).map((e) => ({ c: e.tags.highway.replace('_link', ''), p: ll(e.geometry) }));
const waterRaw = JSON.parse(readFileSync(join(RAW, 'water.json'))).elements;
const RIVERS = [], LAKES = [], RUNWAYS = [];
for (const e of waterRaw) {
  const t = e.tags || {};
  if (e.type === 'way' && t.aeroway === 'runway' && e.geometry) RUNWAYS.push(ll(e.geometry));
  else if (e.type === 'way' && t.waterway && e.geometry) RIVERS.push({ k: t.waterway, name: t.name || '', p: ll(e.geometry) });
  else if (e.type === 'way' && e.geometry && (t.natural === 'water' || t.landuse === 'reservoir')) LAKES.push(ll(e.geometry));
  else if (e.type === 'relation' && e.members) for (const m of e.members) if (m.role === 'outer' && m.geometry) LAKES.push(ll(m.geometry));
}
const area = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const [y0, x0] = P[i], [y1, x1] = P[(i + 1) % P.length]; a += (x0 * 105.3) * (y1 * 111) - (x1 * 105.3) * (y0 * 111); } return Math.abs(a / 2); }; // km²
const bRaw = JSON.parse(readFileSync(join(RAW, 'buildings.json'))).elements.filter((e) => e.geometry && e.geometry.length >= 4);
const levels = (t) => { const h = parseFloat(t.height); if (h > 0) return h; const l = parseFloat(t['building:levels']); return l > 0 ? l * 3.2 : 0; };
const BUILD = bRaw.map((e, i) => { const p = ll(e.geometry); p.pop(); const h = levels(e.tags || {}); return { p, h: h || [4, 6, 6, 7, 9, 12][(i * 2654435761 >>> 0) % 6], temple: /temple|religious|monastery/.test((e.tags || {}).building || '') || (e.tags || {}).amenity === 'place_of_worship' }; });

/* ---- buildings.txt (base64): [count u32] then per building [n u16][height dm u16][flags u8][pad u8] [x i16, z i16] × n, x,z in mm of world units ---- */
{
  let size = 4; for (const b of BUILD) size += 6 + b.p.length * 4;
  const buf = Buffer.alloc(size); let o = 0; buf.writeUInt32LE(BUILD.length, o); o += 4;
  for (const b of BUILD) { buf.writeUInt16LE(b.p.length, o); buf.writeUInt16LE(Math.min(65535, Math.round(b.h * 10)), o + 2); buf.writeUInt8(b.temple ? 1 : 0, o + 4); o += 6;
    for (const [la, ln] of b.p) { const [x, z] = toW(la, ln); buf.writeInt16LE(Math.round(x * 1000), o); buf.writeInt16LE(Math.round(z * 1000), o + 2); o += 4; } }
  writeFileSync(join(OUT, 'buildings.txt'), buf.toString('base64'));
  console.log(`buildings: ${BUILD.length}, ${(size / 1024).toFixed(0)} KB`);
}

/* ---- water.json: what moves in 3D ---- */
{
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const rivers = RIVERS.filter((r) => r.k !== 'stream' || /ห้วย|แม่|Huai|Mae/.test(r.name)).map((r) => ({ w: r.k === 'river' ? .16 : r.k === 'canal' ? .05 : .035, p: r.p.map(([a, b]) => toW(a, b).map(r3)) }));
  const lakes = LAKES.filter((P) => area(P) > .004).map((P) => P.map(([a, b]) => toW(a, b).map(r3)));
  writeFileSync(join(OUT, 'water.json'), JSON.stringify({ rivers, lakes }));
  console.log(`water: ${rivers.length} rivers and canals, ${lakes.length} lakes and moats`);
}

/* ---- the painted relief, in Chrome ---- */
const tiles = JSON.parse(readFileSync(join(RAW, 'dem', 'tiles.json')));
const tileURLs = {};
for (let x = tiles.x0; x <= tiles.x1; x++) for (let y = tiles.y0; y <= tiles.y1; y++) tileURLs[`${x}_${y}`] = 'data:image/png;base64,' + readFileSync(join(RAW, 'dem', `${x}_${y}.png`)).toString('base64');
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, protocolTimeout: 600000 });
const page = await browser.newPage();
page.on('console', (m) => console.log('page:', m.text()));
page.on('pageerror', (e) => console.log('pageerror:', e.message));
await page.setContent('<body></body>');
const res = await page.evaluate(async (A) => {
  const { tiles, tileURLs, EXT, NX, NY, ROADS, RIVERS, LAKES, RUNWAYS, BUILD } = A;
  const S = 256, TW = (tiles.x1 - tiles.x0 + 1) * S, TH = (tiles.y1 - tiles.y0 + 1) * S;
  const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH; const cx = cv.getContext('2d');
  for (const [k, url] of Object.entries(tileURLs)) { const [x, y] = k.split('_').map(Number); const bmp = await createImageBitmap(await (await fetch(url)).blob(), { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }); cx.drawImage(bmp, (x - tiles.x0) * S, (y - tiles.y0) * S); }
  const d = cx.getImageData(0, 0, TW, TH).data, E = new Float32Array(TW * TH);
  for (let i = 0; i < TW * TH; i++) E[i] = d[i * 4] * 256 + d[i * 4 + 1] + d[i * 4 + 2] / 256 - 32768;
  const n = 2 ** tiles.z, pxOf = (lng) => ((lng + 180) / 360 * n - tiles.x0) * S - .5;
  const pyOf = (lat) => { const r = lat * Math.PI / 180; return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n - tiles.y0) * S - .5; };
  const bil = (A, px, py) => { const x0 = Math.max(0, Math.min(TW - 2, Math.floor(px))), y0 = Math.max(0, Math.min(TH - 2, Math.floor(py))), fx = Math.min(1, Math.max(0, px - x0)), fy = Math.min(1, Math.max(0, py - y0)), i = y0 * TW + x0; return (A[i] * (1 - fx) + A[i + 1] * fx) * (1 - fy) + (A[i + TW] * (1 - fx) + A[i + TW + 1] * fx) * fy; };
  const { west: W0, east: E0, north: N0, south: S0 } = EXT;
  const mesh = new Uint16Array(NX * NY);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) mesh[j * NX + i] = Math.max(0, Math.round(bil(E, pxOf(W0 + i / (NX - 1) * (E0 - W0)), pyOf(N0 - j / (NY - 1) * (N0 - S0)))));
  let bin = ''; const u8 = new Uint8Array(mesh.buffer); for (let i = 0; i < u8.length; i += 8192) bin += String.fromCharCode(...u8.subarray(i, i + 8192));

  // shading on the DEM grid (a pixel is about 18 m at z13)
  const PM = 18.1;
  const SH = (az, alt) => { const A = new Float32Array(TW * TH), a = az * Math.PI / 180, b = alt * Math.PI / 180, lx = Math.sin(a) * Math.cos(b), ly = Math.cos(a) * Math.cos(b), lz = Math.sin(b);
    for (let y = 1; y < TH - 1; y++) for (let x = 1; x < TW - 1; x++) { const i = y * TW + x, dx = (E[i + 1] - E[i - 1]) / (2 * PM), dy = (E[i - TW] - E[i + TW]) / (2 * PM); A[i] = Math.max(0, (-dx * lx - dy * ly + lz) / Math.hypot(dx, dy, 1)); } return A; };
  const GR = new Float32Array(TW * TH); for (let y = 1; y < TH - 1; y++) for (let x = 1; x < TW - 1; x++) { const i = y * TW + x; GR[i] = Math.hypot((E[i + 1] - E[i - 1]) / (2 * PM), (E[i - TW] - E[i + TW]) / (2 * PM)); }
  const shDay = SH(115, 34), shNight = SH(290, 42);
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); return (hash(xi, yi) * (1 - sx) + hash(xi + 1, yi) * sx) * (1 - sy) + (hash(xi, yi + 1) * (1 - sx) + hash(xi + 1, yi + 1) * sx) * sy; };
  const ramp = (h, st) => { if (h <= st[0][0]) return st[0][1]; for (let k = 1; k < st.length; k++) if (h <= st[k][0]) { const t = (h - st[k - 1][0]) / (st[k][0] - st[k - 1][0]); return st[k - 1][1].map((c, i) => c + (st[k][1][i] - c) * t); } return st[st.length - 1][1]; };
  const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function paint(T, night) {
    const c = document.createElement('canvas'); c.width = c.height = T; const g = c.getContext('2d');
    const du = (E0 - W0) / T, dv = (N0 - S0) / T, colPx = new Float32Array(T), rowPy = new Float32Array(T), tpx = 34700 / T;
    for (let u = 0; u < T; u++) colPx[u] = pxOf(W0 + (u + .5) * du);
    for (let v = 0; v < T; v++) rowPy[v] = pyOf(N0 - (v + .5) * dv);
    const toUV = ([lat, lng]) => [(lng - W0) / (E0 - W0) * T, (N0 - lat) / (N0 - S0) * T];
    // urban density from real building footprints, softened, plus the towns outside the fetched centre
    const UG = 512, UM = new Float32Array(UG * UG);
    for (const b of BUILD) { const [u, v] = toUV(b.p[0]); const i = Math.floor(u / T * UG), j = Math.floor(v / T * UG); if (i >= 0 && j >= 0 && i < UG && j < UG) UM[j * UG + i] += 1; }
    const blur = (A, r) => { const B = new Float32Array(A.length); for (let j = 0; j < UG; j++) for (let i = 0; i < UG; i++) { let s = 0, k = 0; for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const ii = i + x, jj = j + y; if (ii < 0 || jj < 0 || ii >= UG || jj >= UG) continue; s += A[jj * UG + ii]; k++; } B[j * UG + i] = s / k; } return B; };
    const UB = blur(UM, 3);
    const towns = [[18.923, 98.948, 1.6], [18.700, 98.955, 1.4], [18.770, 99.075, 1.4], [18.79, 98.985, 7.5]];
    for (let j = 0; j < UG; j++) for (let i = 0; i < UG; i++) { const lat = N0 - (j + .5) / UG * (N0 - S0), lng = W0 + (i + .5) / UG * (E0 - W0); let m = Math.min(1, UB[j * UG + i] / 5);
      for (const [la, ln, r] of towns) { const dk = Math.hypot((lat - la) * 111, (lng - ln) * 105.3) * (.85 + .35 * vnoise(i / 9, j / 9)); m = Math.max(m, ss(r, r * .2, dk) * (r > 5 ? .35 : .55)); }
      UM[j * UG + i] = m; }
    const urbanAt = (u, v) => { const x = Math.min(UG - 1, Math.floor(u / T * UG)), y = Math.min(UG - 1, Math.floor(v / T * UG)); return UM[y * UG + x]; };

    const DAY = [[250, [210, 220, 160]], [320, [194, 212, 140]], [380, [166, 198, 120]], [520, [128, 176, 102]], [760, [96, 150, 92]], [1000, [76, 130, 88]], [1300, [62, 112, 86]], [1700, [90, 126, 118]]];
    const NIGHT = [[250, [46, 60, 96]], [400, [40, 60, 96]], [800, [34, 58, 94]], [1300, [32, 54, 90]], [1700, [46, 66, 104]]];
    const PADDY = [[212, 222, 146], [194, 214, 126], [226, 226, 156], [182, 206, 118], [204, 222, 164], [230, 214, 146], [170, 200, 112], [220, 210, 130]];
    const img = g.createImageData(T, T), D = img.data, k = T / 4096;
    for (let v = 0; v < T; v++) for (let u = 0; u < T; u++) {
      const px = colPx[u], py = rowPy[v], h = bil(E, px, py), sh = bil(night ? shNight : shDay, px, py), gr = bil(GR, px, py);
      let col = ramp(h, night ? NIGHT : DAY);
      if (h > 400) { const nz = vnoise(u / (60 * k), v / (60 * k)) * .55 + vnoise(u / (14 * k), v / (14 * k)) * .45, q = (night ? .9 : .84) + (night ? .16 : .28) * nz + (hash(u, v) - .5) * (night ? .06 : .14); col = col.map((x) => x * q); }
      const m = night ? .62 + .7 * sh : .72 + .5 * sh; col = col.map((x) => x * m);
      if (h > 330) { const w = Math.min(.45, gr * tpx / 50 * 1.2 + .015), f = (h / 50) % 1, major = Math.round(h / 50) % 4 === 0; if (f < w || f > 1 - w) col = col.map((x) => x * (night ? (major ? 1.3 : 1.12) : (major ? .86 : .94))); }
      const um = urbanAt(u, v);
      if (h < 345 && um < .3) {
        const reg = hash(Math.floor(u / (560 * k)), Math.floor(v / (560 * k))), a = (reg - .5) * .8, ca = Math.cos(a), sa = Math.sin(a), ru = (u * ca - v * sa) / k, rv = (u * sa + v * ca) / k;
        const fw = 30 + reg * 18, fh = 20 + reg * 12, ci = Math.floor(ru / fw), cj = Math.floor(rv / fh), edge = (ru / fw - ci) < .07 || (rv / fh - cj) < .09;
        const pc = PADDY[Math.floor(hash(ci * 7 + 3, cj * 13 + 1) * PADDY.length)], kk = ss(345, 318, h) * (1 - um / .3) * .88;
        const target = night ? col.map((x) => x * (.92 + .16 * hash(ci, cj))) : (edge ? pc.map((x) => Math.min(255, x + 18)) : pc.map((x) => x * (.96 + .08 * hash(u >> 2, v >> 2))));
        col = col.map((x, i) => x + (target[i] - x) * kk);
      }
      if (um > .03) { const base = night ? [40, 46, 70] : [236, 230, 216]; col = col.map((x, i) => x + (base[i] - x) * Math.min(.85, um * 1.1)); }
      const q = (v * T + u) * 4; D[q] = col[0]; D[q + 1] = col[1]; D[q + 2] = col[2]; D[q + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    g.lineCap = g.lineJoin = 'round';
    const path = (P, close) => { g.beginPath(); P.forEach((p, i) => { const [x, y] = toUV(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); if (close) g.closePath(); };
    const W = { motorway: 7, trunk: 6.5, primary: 5.5, secondary: 4.5, tertiary: 3.6, residential: 2, unclassified: 2, living_street: 1.6 };
    const minor = (c) => W[c] <= 2;
    // water
    const WATER = night ? 'rgb(52,92,150)' : 'rgb(126,184,208)', WATER_EDGE = night ? 'rgb(40,74,126)' : 'rgb(98,160,188)';
    for (const P of LAKES) { path(P, true); g.fillStyle = WATER; g.fill(); g.lineWidth = 1.5 * k * 2; g.strokeStyle = WATER_EDGE; g.stroke(); }
    for (const r of RIVERS) { if (r.k === 'stream' && !r.name) continue; const w = (r.k === 'river' ? 20 : r.k === 'canal' ? 3.2 : 1.8) * k; path(r.p); g.lineWidth = w + 3 * k; g.strokeStyle = WATER_EDGE; g.stroke(); g.lineWidth = w; g.strokeStyle = WATER; g.stroke(); }
    // runways
    for (const P of RUNWAYS) { path(P); g.lineWidth = 14 * k; g.strokeStyle = night ? 'rgb(64,66,84)' : 'rgb(172,172,166)'; g.stroke(); g.setLineDash([10 * k, 12 * k]); g.lineWidth = 1.6 * k; g.strokeStyle = night ? 'rgba(200,215,255,.9)' : 'rgb(250,250,246)'; g.stroke(); g.setLineDash([]); }
    // building roofs, drawn before streets so the streets stay clear
    if (!night) { for (const b of BUILD) { path(b.p, true); const r = hash(Math.round(b.p[0][0] * 1e5), Math.round(b.p[0][1] * 1e5)); g.fillStyle = b.temple ? 'rgb(214,140,64)' : ['rgb(196,182,168)', 'rgb(206,196,184)', 'rgb(184,170,160)', 'rgb(190,150,128)', 'rgb(214,208,200)'][Math.floor(r * 5)]; g.fill(); } }
    else { g.globalCompositeOperation = 'lighter';
      const lc = document.createElement('canvas'); lc.width = lc.height = T; const lg = lc.getContext('2d');
      for (const b of BUILD) { const r = hash(Math.round(b.p[0][0] * 1e5), Math.round(b.p[0][1] * 1e5)); if (r > .55) continue; const [x, y] = toUV(b.p[0]); lg.fillStyle = r < .2 ? 'rgb(255,214,150)' : 'rgb(255,190,110)'; lg.fillRect(x - k, y - k, 2.2 * k, 2.2 * k); }
      g.filter = `blur(${6 * k}px)`; g.drawImage(lc, 0, 0); g.filter = `blur(${2 * k}px)`; g.drawImage(lc, 0, 0); g.filter = 'none'; g.drawImage(lc, 0, 0);
      g.globalCompositeOperation = 'source-over'; }
    // streets: casing then fill, minor first
    const order = [...ROADS].sort((a, b) => W[a.c] - W[b.c]);
    if (!night) { for (const r of order) { path(r.p); g.lineWidth = (W[r.c] + (minor(r.c) ? 1 : 2.2)) * k; g.strokeStyle = 'rgba(150,138,118,.5)'; g.stroke(); }
      for (const r of order) { path(r.p); g.lineWidth = W[r.c] * k; g.strokeStyle = minor(r.c) ? 'rgb(250,247,240)' : r.c === 'motorway' || r.c === 'trunk' ? 'rgb(255,236,190)' : 'rgb(255,251,242)'; g.stroke(); } }
    else { g.globalCompositeOperation = 'lighter'; for (const r of order) { path(r.p); g.lineWidth = (minor(r.c) ? 1 : W[r.c] * .55) * k; g.strokeStyle = minor(r.c) ? 'rgba(242,163,58,.18)' : 'rgba(242,163,58,.55)'; g.stroke(); } g.globalCompositeOperation = 'source-over'; }
    return c.toDataURL('image/jpeg', .84);
  }
  const out = { mesh: btoa(bin) };
  for (const T of [4096, 2048]) { out[`day${T}`] = paint(T, false); out[`night${T}`] = paint(T, true); }
  return out;
}, { tiles, tileURLs, EXT: EXTENT, NX, NY, ROADS, RIVERS, LAKES, RUNWAYS, BUILD });
writeFileSync(join(OUT, 'heights.txt'), res.mesh);
for (const T of [4096, 2048]) for (const m of ['day', 'night']) writeFileSync(join(OUT, `terrain-${m}-${T}.jpg`), Buffer.from(res[`${m}${T}`].split(',')[1], 'base64'));
writeFileSync(join(OUT, 'meta.json'), JSON.stringify({ extent: EXTENT, NX, NY, SX, SZ, base: 280, vex: 2.4 / 1110 }));
await browser.close();
console.log('baked');
