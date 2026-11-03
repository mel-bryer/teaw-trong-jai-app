// The For-You feed: one full-screen moving picture at a time, swipe up for the next. It learns as you go, like a social feed:
// a heart pulls the vibe toward the place, a skip pushes it away, and lingering counts a little. Every fourth slot tries
// a local gem or something outside your usual, and every sixth an event coming up, so new and small places get seen.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AXES, CAT, KIND, type Place, type LocalEvent } from '../data/content';
import { useProfile, personaOf, matchOf, scoreOf, kmBetween } from '../lib/profile';
import { allPlaces, allEvents, placeById, useBiz, dayLabel, daysUntil } from '../lib/biz';
import { useUI } from '../lib/ui';
import { LiveCanvas } from '../components/LiveCanvas';
import { Icon } from '../components/icons';

type Item = { kind: 'place'; p: Place; why: string } | { kind: 'event'; e: LocalEvent; p: Place; why: string };
const OLD_CITY = { lat: 18.7883, lng: 98.9853 };

/* the reason under each card, in a few words: the axis where this place sits closest to you */
function whyOf(p: Place, vec: number[] | undefined) {
  if (!vec) return p.gem ? 'ที่ลับท้องถิ่น คนยังรู้น้อย' : p.tags[0];
  let best = 0, bd = 9; p.vec.forEach((x, k) => { const d = Math.abs(x - vec[k]) - Math.abs(x - .5) * .8; if (d < bd) { bd = d; best = k; } });
  return `เพราะคุณชอบแนว${p.vec[best] < .5 ? AXES[best][0] : AXES[best][1]}`;
}

function nextItems(seen: Set<string>, from: number, n: number, prevType?: string): Item[] {
  const profile = useProfile.getState().profile, vec = profile?.vec, out: Item[] = [];
  const pool = allPlaces().filter((p) => !seen.has(p.id));
  for (let k = from; k < from + n; k++) {
    if (k % 6 === 5) {
      const e = allEvents().filter((x) => !seen.has(x.id) && daysUntil(x) >= 0 && daysUntil(x) <= 14).sort((a, b) => (matchOf(b.vec, profile) - daysUntil(b) * 2) - (matchOf(a.vec, profile) - daysUntil(a) * 2))[0];
      const p = e && placeById(e.place);
      if (e && p) { seen.add(e.id); out.push({ kind: 'event', e, p, why: `${KIND[e.kind]} · ${dayLabel(e)} ${e.time}` }); continue; }
    }
    const left = pool.filter((p) => !seen.has(p.id)); if (!left.length) break;
    const explore = k % 4 === 3;
    const ranked = left.map((p) => ({ p, s: explore ? (p.gem || p.isNew ? 40 : 0) + Math.random() * 30 : scoreOf(p, profile) + Math.random() * 6 - (p.sc.type === prevType ? 12 : 0) })).sort((a, b) => b.s - a.s);
    const p = ranked[0].p; seen.add(p.id); prevType = p.sc.type;
    out.push({ kind: 'place', p, why: explore ? (p.gem ? 'ลองที่ลับ ร้านท้องถิ่นที่คนยังรู้น้อย' : 'ลองแนวใหม่ นอกจากที่คุณชอบประจำ') : whyOf(p, vec) });
  }
  return out;
}

export function Feed() {
  const nav = useNavigate(), profile = useProfile((s) => s.profile), per = personaOf(profile);
  const seen = useRef(new Set<string>()), [items, setItems] = useState<Item[]>(() => nextItems(seen.current, 0, 6));
  const [active, setActive] = useState(0), since = useRef(performance.now()), list = useRef<HTMLDivElement>(null), [burst, setBurst] = useState(-1);
  useEffect(() => { useUI.getState().set({ cover: true }); return () => useUI.getState().set({ cover: false }); }, []);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') nav('/'); if (e.key === 'ArrowDown') scrollTo(active + 1); if (e.key === 'ArrowUp') scrollTo(active - 1); }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); });

  /* which card is on screen; lingering on the one before counts a little */
  useEffect(() => {
    const root = list.current; if (!root) return;
    const io = new IntersectionObserver((es) => { for (const en of es) if (en.isIntersecting) setActive(+(en.target as HTMLElement).dataset.k!); }, { root, threshold: .6 });
    root.querySelectorAll('.reel').forEach((el) => io.observe(el)); return () => io.disconnect();
  }, [items.length]);
  const prev = useRef(0);
  useEffect(() => {
    const was = items[prev.current], dwell = performance.now() - since.current;
    if (was && prev.current !== active && dwell > 4000) useProfile.getState().nudge(was.p.vec, .03);
    prev.current = active; since.current = performance.now();
    const it = items[active]; if (it) useBiz.getState().view(it.p.id);
    if (active >= items.length - 3) setItems((xs) => [...xs, ...nextItems(seen.current, xs.length, 5, xs[xs.length - 1]?.p.sc.type)]);
  }, [active]); // eslint-disable-line
  const scrollTo = (k: number) => { const el = list.current?.querySelector<HTMLElement>(`[data-k="${Math.max(0, k)}"]`); el?.scrollIntoView({ behavior: 'smooth' }); };

  const like = (k: number) => {
    const it = items[k], st = useProfile.getState(); if (!st.profile) { nav('/quiz'); return; }
    if (!st.profile.saved.includes(it.p.id)) { st.toggleSave(it.p.id); st.nudge(it.p.vec, .08); setBurst(k); setTimeout(() => setBurst(-1), 700); }
    else st.toggleSave(it.p.id);
  };
  const skip = (k: number) => { useProfile.getState().nudge(items[k].p.vec, -.04); useUI.getState().say('รับทราบ จะแนะนำแนวนี้น้อยลง'); scrollTo(k + 1); };
  const openPlace = (p: Place) => { useUI.getState().setFocus(p.id); useUI.getState().send({ kind: 'place', id: p.id }); nav(`/place/${p.id}`); };

  return (
    <div className="feed" role="region" aria-label="ฟีดตรงใจ">
      <header className="feed-top">
        <button type="button" className="iconbtn" aria-label="กลับไปที่แผนที่" onClick={() => nav('/')}><Icon name="close" /></button>
        <b>ฟีดตรงใจ</b>
        {per ? <span className="pill">{per.name}</span> : <button type="button" className="pill" onClick={() => nav('/quiz')}>เลือก 5 ภาพให้ฟีดรู้ใจ</button>}
      </header>
      <div className="reels" ref={list}>
        {items.map((it, k) => <Reel key={`${it.kind}-${it.kind === 'event' ? it.e.id : it.p.id}`} k={k} it={it} live={Math.abs(k - active) <= 1} burst={burst === k}
          onLike={() => like(k)} onSkip={() => skip(k)} onOpen={() => openPlace(it.p)} />)}
      </div>
    </div>
  );
}

function Reel({ it, k, live, burst, onLike, onSkip, onOpen }: { it: Item; k: number; live: boolean; burst: boolean; onLike: () => void; onSkip: () => void; onOpen: () => void }) {
  const profile = useProfile((s) => s.profile), remind = useBiz((s) => s.remind), p = it.p, saved = !!profile?.saved.includes(p.id);
  const sc = it.kind === 'event' ? it.e.sc : p.sc, m = matchOf(it.kind === 'event' ? it.e.vec : p.vec, profile), km = kmBetween(p, OLD_CITY);
  const [photo, setPhoto] = useState(0), photos = it.kind === 'place' ? p.photos ?? [] : [];
  useEffect(() => { if (!live || photos.length < 2) return; const t = setInterval(() => setPhoto((x) => (x + 1) % photos.length), 3800); return () => clearInterval(t); }, [live, photos.length]);
  const scene = useMemo(() => sc, [sc]);
  let tap = 0;
  return (
    <section className="reel" data-k={k} aria-label={it.kind === 'event' ? it.e.title : p.name} onClick={(e) => { if ((e.target as HTMLElement).closest('button,a')) return; const n = performance.now(); if (n - tap < 320) onLike(); tap = n; }}>
      {live && !photos.length && <LiveCanvas scene={scene} />}
      {!live && !photos.length && <div className="reel-still" />}
      {photos.length > 0 && <img key={photo} className="kb" src={photos[photo]} alt="" />}
      {burst && <span className="burst" aria-hidden="true"><Icon name="heart" fill /></span>}
      <div className="rail">
        <button type="button" aria-pressed={saved} aria-label={saved ? 'เลิกบันทึก' : 'ชอบ บันทึกไว้'} onClick={onLike}><Icon name="heart" fill={saved} /><small>{saved ? 'บันทึกแล้ว' : 'ชอบ'}</small></button>
        <button type="button" aria-label="ไม่ใช่แนว แนะนำน้อยลง" onClick={onSkip}><Icon name="skip" /><small>ไม่ใช่แนว</small></button>
        {it.kind === 'event' && <button type="button" aria-pressed={remind.includes(it.e.id)} aria-label="เตือนฉัน" onClick={() => useUI.getState().say(useBiz.getState().toggleRemind(it.e.id) ? `จะเตือนก่อน “${it.e.title}”` : 'ยกเลิกการเตือนแล้ว')}><Icon name="bell" /><small>เตือน</small></button>}
        <button type="button" aria-label={`ดู ${p.name}`} onClick={onOpen}><Icon name="pin" /><small>ดูที่นี่</small></button>
      </div>
      <div className="reel-foot">
        <div className="badges">
          {it.kind === 'event' && <span className="badge ev">{dayLabel(it.e)}</span>}
          {p.gem && <span className="badge gem">ที่ลับท้องถิ่น</span>}{p.isNew && <span className="badge new">ใหม่</span>}
          <span className="badge" style={{ ['--dc' as string]: `var(${CAT[p.cat].c})` }}><i />{CAT[p.cat].th}</span>
        </div>
        <h2>{it.kind === 'event' ? it.e.title : p.name}</h2>
        <p className="why"><b>{m}% ตรงใจ</b> · {it.why}</p>
        <p className="meta">{it.kind === 'event' ? `${p.name} · ${it.e.price}` : `${p.price} · ${km < 1 ? 'ในเมืองเก่า' : `${km.toFixed(1)} กม.`}`}{p.owner ? ` · โดย ${p.owner}` : ''}</p>
      </div>
      {k === 0 && <div className="hint" aria-hidden="true">ปัดขึ้นดูต่อ · แตะสองครั้งเพื่อชอบ</div>}
    </section>
  );
}
