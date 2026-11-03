// The traveller's vibe: a five-axis vector from the quiz that drifts toward what they open and save.
// Kept in localStorage for the prototype; the real product keeps the same object in the back-end profile.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PERSONAS, type Place, type Cat } from '../data/content';
import { allPlaces } from './biz';

export type Profile = { vec: number[]; quizVec: number[]; persona: string; saved: string[]; ts: number };

const DEFAULT_VEC = [.45, .45, .45, .45, .45];
const dist = (a: number[], b: number[]) => Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0) / a.length);
export const nearestPersona = (v: number[]) => PERSONAS.reduce((best, p) => (dist(v, p.vec) < dist(v, best.vec) ? p : best), PERSONAS[0]);

type State = {
  profile: Profile | null;
  drift: string | null; // the persona the vibe just moved to, for one toast
  finishQuiz: (answers: number[][]) => void;
  nudge: (pv: number[], alpha: number) => void;
  toggleSave: (id: string) => boolean;
  reset: () => void;
};

const safeStorage = createJSONStorage(() => {
  try { localStorage.setItem('ttj.test', '1'); localStorage.removeItem('ttj.test'); return localStorage; } catch { const m = new Map<string, string>(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }; }
});

export const useProfile = create<State>()(persist((set, get) => ({
  profile: null,
  drift: null,
  finishQuiz: (answers) => {
    const v = [0, 1, 2, 3, 4].map((k) => +(answers.reduce((s, a) => s + a[k], 0) / answers.length).toFixed(3));
    set({ profile: { vec: v, quizVec: v, persona: nearestPersona(v).id, saved: get().profile?.saved ?? [], ts: Date.now() }, drift: null });
  },
  nudge: (pv, alpha) => {
    const p = get().profile; if (!p) return;
    const vec = p.vec.map((x, i) => +Math.min(1, Math.max(0, x + (pv[i] - x) * alpha)).toFixed(3)), np = nearestPersona(vec); // alpha < 0 moves away (a skip)
    set({ profile: { ...p, vec, persona: np.id, ts: Date.now() }, drift: np.id !== p.persona ? np.id : null });
  },
  toggleSave: (id) => {
    const p = get().profile; if (!p) return false;
    const on = !p.saved.includes(id);
    set({ profile: { ...p, saved: on ? [...p.saved, id] : p.saved.filter((x) => x !== id), ts: Date.now() } });
    return on;
  },
  reset: () => set({ profile: null, drift: null }),
}), { name: 'ttj.profile.v2', storage: safeStorage, partialize: (s) => ({ profile: s.profile }) }));

export const personaOf = (p: Profile | null) => PERSONAS.find((x) => x.id === p?.persona) ?? null;
export const matchOf = (pv: number[], p: Profile | null) => Math.max(35, Math.min(99, Math.round(100 - dist(p?.vec ?? DEFAULT_VEC, pv) * 155)));
// gems and newly approved local places get a lift, so the famous few do not take every slot
export const scoreOf = (pl: Place, p: Profile | null) => matchOf(pl.vec, p) + ((pl.rating || 4.4) - 4.4) * 8 + (pl.event ? 6 : 0) + (pl.gem ? 5 : 0) + (pl.isNew ? 4 : 0);
export const kmBetween = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => Math.hypot((a.lat - b.lat) * 111, (a.lng - b.lng) * 105.3);
export const nearbyOf = (pl: Place, cat: Cat, p: Profile | null, n = 3) =>
  allPlaces().filter((q) => q.cat === cat && q.id !== pl.id).map((q) => ({ q, k: kmBetween(pl, q) })).sort((a, b) => (scoreOf(b.q, p) - b.k * 5) - (scoreOf(a.q, p) - a.k * 5)).slice(0, n);
export const otherCats = (pl: Place): Cat[] => (['see', 'eat', 'stay'] as Cat[]).filter((c) => c !== pl.cat);
export const hotIds = (p: Profile | null) => new Set(allPlaces().sort((a, b) => scoreOf(b, p) - scoreOf(a, p)).slice(0, 5).map((x) => x.id));
