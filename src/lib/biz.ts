// Owners pin their own place or event, an admin checks it is real, and only then does it reach the map, the feed and the matching.
// Kept in localStorage for the prototype (submit and approve in the same browser); the real product keeps the same records on the back-end.
import { useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PLACES, EVENTS, TAG_VEC, type Place, type LocalEvent } from '../data/content';
import { thumb } from './scenes';

export type Status = 'pending' | 'approved' | 'changes' | 'rejected';
export type Sub = { id: string; kind: 'place' | 'event'; status: Status; at: number; reviewedAt?: number; note?: string; place?: Place; event?: LocalEvent };

type State = {
  subs: Sub[];
  remind: string[]; // event ids the traveller asked to be reminded of
  eventsSeenAt: number;
  views: Record<string, number>; // per place: page opens and feed impressions, for the owner's numbers
  submit: (s: Omit<Sub, 'id' | 'status' | 'at'>) => string;
  review: (id: string, status: Status, note?: string) => void;
  withdraw: (id: string) => void;
  toggleRemind: (id: string) => boolean;
  seeEvents: () => void;
  view: (id: string) => void;
};

const safeStorage = createJSONStorage(() => {
  try { localStorage.setItem('ttj.test', '1'); localStorage.removeItem('ttj.test'); return localStorage; } catch { const m = new Map<string, string>(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }; }
});

export const useBiz = create<State>()(persist((set, get) => ({
  subs: [], remind: [], eventsSeenAt: 0, views: {},
  submit: (s) => { const id = `${s.kind}-${Date.now().toString(36)}`; set({ subs: [{ ...s, id, status: 'pending', at: Date.now() }, ...get().subs] }); return id; },
  review: (id, status, note) => set({ subs: get().subs.map((s) => (s.id === id ? { ...s, status, note, reviewedAt: Date.now() } : s)) }),
  withdraw: (id) => set({ subs: get().subs.filter((s) => s.id !== id) }),
  toggleRemind: (id) => { const on = !get().remind.includes(id); set({ remind: on ? [...get().remind, id] : get().remind.filter((x) => x !== id) }); return on; },
  seeEvents: () => set({ eventsSeenAt: Date.now() }),
  view: (id) => set({ views: { ...get().views, [id]: (get().views[id] ?? 0) + 1 } }),
}), { name: 'ttj.biz.v1', storage: safeStorage, partialize: (s) => ({ subs: s.subs, remind: s.remind, eventsSeenAt: s.eventsSeenAt, views: s.views }) }));

/* every place on the map: the sample set plus what an admin approved */
const approvedPlaces = (subs: Sub[]) => subs.filter((s) => s.kind === 'place' && s.status === 'approved' && s.place).map((s) => ({ ...s.place!, isNew: true }));
const approvedEvents = (subs: Sub[]) => subs.filter((s) => s.kind === 'event' && s.status === 'approved' && s.event).map((s) => s.event!);
export const allPlaces = (): Place[] => [...PLACES, ...approvedPlaces(useBiz.getState().subs)];
export const allEvents = (): LocalEvent[] => [...EVENTS, ...approvedEvents(useBiz.getState().subs)];
export const placeById = (id?: string | null) => allPlaces().find((p) => p.id === id);
export function usePlaces() { const subs = useBiz((s) => s.subs); return useMemo(() => [...PLACES, ...approvedPlaces(subs)], [subs]); }
export function useEvents() { const subs = useBiz((s) => s.subs); return useMemo(() => [...EVENTS, ...approvedEvents(subs)], [subs]); }

/* the picture for a place: the owner's photo when there is one, otherwise its painted scene */
export const coverOf = (p: Pick<Place, 'sc' | 'photos'>, w: number, h: number) => p.photos?.[0] ?? thumb(p.sc, w, h);

/* tags → vibe vector, averaged; no tags means a neutral middle */
export const vecOfTags = (tags: string[]) => {
  const vs = tags.map((t) => TAG_VEC[t]).filter(Boolean);
  return vs.length ? [0, 1, 2, 3, 4].map((k) => +(vs.reduce((s, v) => s + v[k], 0) / vs.length).toFixed(3)) : [.45, .45, .45, .45, .45];
};

/* when an event next happens: fixed offset from today, a weekly weekday, or an owner's date */
const DAY = 864e5;
export function whenOf(e: LocalEvent, now = new Date()): Date {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (e.date) return new Date(e.date + 'T00:00:00');
  if (e.weekly !== undefined) return new Date(+today + ((e.weekly - today.getDay() + 7) % 7) * DAY);
  return new Date(+today + (e.in ?? 0) * DAY);
}
export const daysUntil = (e: LocalEvent) => { const n = new Date(), t = new Date(n.getFullYear(), n.getMonth(), n.getDate()); return Math.round((+whenOf(e) - +t) / DAY); };
const TH_DAY = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'], TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const dayLabel = (e: LocalEvent) => { const d = daysUntil(e), w = whenOf(e); return d === 0 ? 'วันนี้' : d === 1 ? 'พรุ่งนี้' : `${TH_DAY[w.getDay()]} ${w.getDate()} ${TH_MON[w.getMonth()]}`; };

/* photos from the owner's device, shrunk so a few fit in browser storage */
export function shrinkPhoto(file: File, max = 720): Promise<string> {
  return new Promise((ok, fail) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', .78)); };
    im.onerror = () => { URL.revokeObjectURL(url); fail(new Error('ภาพนี้เปิดไม่ได้')); };
    im.src = url;
  });
}

/* travel time by mode, with a road factor over the straight line */
export const legs = (km: number) => { const road = km * 1.35 + .2; return [
  { mode: 'walk', th: 'เดิน', min: Math.round(road / 4.5 * 60), ok: road < 2.5 },
  { mode: 'bike', th: 'มอเตอร์ไซค์', min: Math.round(road / 26 * 60 + 3), ok: true },
  { mode: 'songthaew', th: 'รถแดง', min: Math.round(road / 18 * 60 + 8), ok: road < 25 },
  { mode: 'car', th: 'รถยนต์ / Grab', min: Math.round(road / 30 * 60 + 5), ok: true },
] as const; };
