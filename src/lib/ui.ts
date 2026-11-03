// App-wide state that is not the profile: time of day, quality, map filters, the place in focus, map commands.
import { create } from 'zustand';
import type { Cat } from '../data/content';

export type Quality = 'high' | 'medium' | 'low';
export type Surface = 'paint' | 'sat'; // the painted relief, or MapTiler satellite photos when a key is set
/* the surface choice is remembered; with a MapTiler key the map starts on satellite */
const HAS_KEY = import.meta.env.MODE !== 'artifact' && !!import.meta.env.VITE_MAPTILER_KEY;
const savedSurface = (): Surface => { try { const v = localStorage.getItem('ttj.surface'); if (v === 'sat' || v === 'paint') return HAS_KEY ? v : 'paint'; } catch { /* storage blocked */ } return HAS_KEY ? 'sat' : 'paint'; };
const coarse = typeof matchMedia !== 'undefined' && (matchMedia('(pointer: coarse)').matches || innerWidth < 760);

type MapCmd = { kind: 'overview' } | { kind: 'zone'; id: string } | { kind: 'place'; id: string } | { kind: 'zoom'; f: number } | { kind: 'north' } | { kind: 'tilt'; three: boolean };

type UI = {
  hour: number; // 5..24, 07:00 = morning mist, 21:00 = Yi Peng night
  quality: Quality;
  surface: Surface;
  cats: Record<Cat, boolean>;
  focus: string | null; // the place the map is holding, with arcs to what is near it
  bare: boolean;
  sheetOpen: boolean;
  moving: boolean;
  ready: boolean;
  cover: boolean; // a full-screen page hides the map, so the 3D can stop drawing
  cmd: (MapCmd & { n: number }) | null;
  toast: { text: string; n: number } | null;
  setHour: (h: number) => void;
  setQuality: (q: Quality) => void;
  setSurface: (s: Surface) => void;
  setCats: (c: Record<Cat, boolean>) => void;
  setFocus: (id: string | null) => void;
  set: (p: Partial<Pick<UI, 'bare' | 'sheetOpen' | 'moving' | 'ready' | 'cover'>>) => void;
  send: (c: MapCmd) => void;
  say: (text: string) => void;
};

let n = 0;
export const useUI = create<UI>()((set) => ({
  hour: +(new URLSearchParams(location.search).get('t') ?? NaN) || (new Date().getHours() >= 18 || new Date().getHours() < 6 ? 21 : 7.5),
  quality: coarse ? 'medium' : 'high',
  surface: savedSurface(),
  cats: { see: true, eat: true, stay: true },
  focus: null,
  bare: false,
  sheetOpen: !coarse,
  moving: false,
  ready: false,
  cover: false,
  cmd: null,
  toast: null,
  setHour: (hour) => set({ hour }),
  setQuality: (quality) => set({ quality }),
  setSurface: (surface) => { try { localStorage.setItem('ttj.surface', surface); } catch { /* storage blocked */ } set({ surface }); },
  setCats: (cats) => set({ cats }),
  setFocus: (focus) => set({ focus }),
  set: (p) => set(p),
  send: (c) => set({ cmd: { ...c, n: ++n } }),
  say: (text) => set({ toast: { text, n: ++n } }),
}));

/* light from the hour: 0 in full day, 1 in full night, with dawn and dusk between */
export const nightOf = (h: number) => (h < 6 ? 1 - Math.min(1, Math.max(0, (h - 5) / 1)) : h < 17.5 ? 0 : Math.min(1, (h - 17.5) / 1.5));
export const fmtHour = (h: number) => `${String(Math.floor(h) % 24).padStart(2, '0')}:${String(Math.round((h % 1) * 60) % 60).padStart(2, '0')}`;
