// The model's geography: real heights (SRTM via AWS Terrain Tiles) and OpenStreetMap water and buildings,
// baked by scripts/bake.mjs into public/data. One world unit is about 1.11 km; heights are exaggerated 2.4×.
export type Meta = { extent: { west: number; east: number; north: number; south: number }; NX: number; NY: number; SX: number; SZ: number; base: number; vex: number };
export type Water = { rivers: { w: number; p: [number, number][] }[]; lakes: [number, number][][] };
export type Building = { pts: Float32Array; h: number; temple: boolean };
export type Geo = { meta: Meta; H: Uint16Array; water: Water; buildings: Building[] };

let geo: Geo | null = null;
/* the binaries ship as base64 text: every static host, an Artifact included, serves .txt */
const b64 = (s: string) => { const bin = atob(s.trim()), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
export async function loadGeo(): Promise<Geo> {
  if (geo) return geo;
  const [meta, hb, water, bb] = await Promise.all([
    fetch('data/meta.json').then((r) => r.json()),
    fetch('data/heights.txt').then((r) => r.text()).then(b64),
    fetch('data/water.json').then((r) => r.json()),
    fetch('data/buildings.txt').then((r) => r.text()).then(b64),
  ]);
  const dv = new DataView(bb), count = dv.getUint32(0, true), buildings: Building[] = [];
  let o = 4;
  for (let i = 0; i < count; i++) {
    const n = dv.getUint16(o, true), h = dv.getUint16(o + 2, true) / 10, temple = dv.getUint8(o + 4) === 1; o += 6;
    const pts = new Float32Array(n * 2);
    for (let k = 0; k < n; k++) { pts[k * 2] = dv.getInt16(o, true) / 1000; pts[k * 2 + 1] = dv.getInt16(o + 2, true) / 1000; o += 4; }
    buildings.push({ pts, h, temple });
  }
  geo = { meta, H: new Uint16Array(hb), water, buildings };
  return geo;
}
export const getGeo = () => geo!;

export const toW = (lat: number, lng: number): [number, number] => {
  const { extent: e, SX, SZ } = geo!.meta;
  return [(lng - e.west) / (e.east - e.west) * SX - SX / 2, (e.north - lat) / (e.north - e.south) * SZ - SZ / 2];
};
/* terrain height in world units at a world point, bilinear on the grid */
export function hAt(X: number, Z: number) {
  const { meta: { NX, NY, SX, SZ, base, vex }, H } = geo!;
  const fx = Math.min(1, Math.max(0, (X + SX / 2) / SX)) * (NX - 1), fz = Math.min(1, Math.max(0, (Z + SZ / 2) / SZ)) * (NY - 1);
  const i = Math.min(NX - 2, Math.floor(fx)), j = Math.min(NY - 2, Math.floor(fz)), tx = fx - i, tz = fz - j, k = j * NX + i;
  return ((H[k] * (1 - tx) + H[k + 1] * tx) * (1 - tz) + (H[k + NX] * (1 - tx) + H[k + NX + 1] * tx) * tz - base) * vex;
}
export const metresAt = (X: number, Z: number) => hAt(X, Z) / geo!.meta.vex + geo!.meta.base;

/* a small seeded random, so trees and boats land in the same places every visit */
export function rng(seed: number) { let s = Math.abs(Math.floor(seed * 7919)) % 233280 || 7; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
export const PIN_H = .55;
