// MapTiler satellite imagery for the daytime surface, used only when VITE_MAPTILER_KEY is set (in .env.local).
// The tiles are Web Mercator; the model is laid out in plain lat/lng, so each output row is resampled from its mercator row.
// The Artifact build (`npm run build:artifact`) drops the key: an Artifact cannot call outside APIs, and the key must not ship in public JS.
import * as THREE from 'three';
import type { Meta } from '../lib/geo';

export const MAPTILER_KEY: string = import.meta.env.MODE === 'artifact' ? '' : (import.meta.env.VITE_MAPTILER_KEY ?? '');

const Z = 12;
const tileX = (lng: number) => (lng + 180) / 360 * 2 ** Z;
const tileY = (lat: number) => { const r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * 2 ** Z; };
const load = (url: string) => new Promise<HTMLImageElement>((ok, fail) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => ok(im); im.onerror = () => fail(new Error(url)); im.src = url; });

let cached: Promise<THREE.Texture> | null = null;
export function satelliteTexture(meta: Meta, size: number): Promise<THREE.Texture> {
  if (cached) return cached;
  cached = (async () => {
    const e = meta.extent, x0 = Math.floor(tileX(e.west)), x1 = Math.floor(tileX(e.east)), y0 = Math.floor(tileY(e.north)), y1 = Math.floor(tileY(e.south));
    const jobs: Promise<[number, number, HTMLImageElement]>[] = [];
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++)
      jobs.push(load(`https://api.maptiler.com/tiles/satellite-v2/${Z}/${x}/${y}.jpg?key=${MAPTILER_KEY}`).then((im) => [x, y, im]));
    const tiles = await Promise.all(jobs), T = tiles[0][2].naturalWidth;
    const merc = document.createElement('canvas'); merc.width = (x1 - x0 + 1) * T; merc.height = (y1 - y0 + 1) * T;
    const mc = merc.getContext('2d')!; for (const [x, y, im] of tiles) mc.drawImage(im, (x - x0) * T, (y - y0) * T);
    const out = document.createElement('canvas'); out.width = out.height = size; const oc = out.getContext('2d')!;
    const sx = (tileX(e.west) - x0) * T, sw = (tileX(e.east) - tileX(e.west)) * T;
    for (let v = 0; v < size; v++) { const lat = e.north - (v + .5) / size * (e.north - e.south), sy = (tileY(lat) - y0) * T; oc.drawImage(merc, sx, sy, sw, 1, 0, v, size, 1); }
    // a touch of warmth and lift, so the photo sits with the painted night map and the pins
    oc.globalCompositeOperation = 'soft-light'; oc.fillStyle = 'rgba(255,236,200,.35)'; oc.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(out); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  })();
  cached.catch(() => { cached = null; });
  return cached;
}
