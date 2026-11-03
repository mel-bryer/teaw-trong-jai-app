// A place, and for local owners their page: its moving story (owner photos or a painted clip) on the left; on the right what you need
// to decide, how the owner tells it, what is on there soon, how to get there, and a one-day route through what matches you nearby.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CAT, type Cat, type Place as P } from '../data/content';
import { useProfile, personaOf, matchOf, kmBetween, nearbyOf, otherCats } from '../lib/profile';
import { usePlaces, useEvents, useBiz, coverOf, legs, dayLabel, daysUntil } from '../lib/biz';
import { useUI } from '../lib/ui';
import { LiveCanvas } from '../components/LiveCanvas';
import { Icon } from '../components/icons';

const D = 5200, OLD_CITY = { lat: 18.7883, lng: 98.9853 };
type Clip = { type: string; seed: number; v: number; photo?: string };
type Tab = 'over' | 'events' | 'go' | 'trip';

export function Place() {
  const { id } = useParams(), nav = useNavigate(), places = usePlaces(), p = places.find((x) => x.id === id);
  const profile = useProfile((s) => s.profile), nudge = useProfile((s) => s.nudge), toggleSave = useProfile((s) => s.toggleSave), ui = useUI.getState();
  const [ci, setCi] = useState(0), [paused, setPaused] = useState(false), segs = useRef<HTMLElement[]>([]), t0 = useRef(performance.now()), held = useRef(0);
  const close = useRef<HTMLButtonElement>(null), [tab, setTab] = useState<Tab>('over');
  const nEvents = useEvents().filter((e) => e.place === id && daysUntil(e) >= 0).length;
  useEffect(() => { if (!p) return; setCi(0); setTab('over'); t0.current = performance.now(); ui.setFocus(p.id); nudge(p.vec, .02); useBiz.getState().view(p.id); close.current?.focus({ preventScroll: true }); }, [id]); // eslint-disable-line
  const clips: Clip[] = !p ? [] : p.photos?.length ? p.photos.map((photo, k) => ({ ...p.sc, seed: p.sc.seed + k, photo }))
    : (p.clips ?? [[p.sc.type, p.sc.seed, p.sc.v], [p.sc.type, p.sc.seed + 1, (p.sc.v + .5) % 1], [p.sc.type, p.sc.seed + 2, p.sc.v]]).map(([type, seed, v]) => ({ type, seed, v }));
  const ciRef = useRef(0); ciRef.current = ci;
  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      if (paused) { held.current = now - t0.current; raf = requestAnimationFrame(tick); return; }
      if (held.current) { t0.current = now - held.current; held.current = 0; }
      const pr = (now - t0.current) / D;
      if (pr >= 1) { t0.current = now; setCi((c) => (c + 1) % clips.length); }
      segs.current.forEach((s, k) => { if (s) s.style.transform = `scaleX(${k < ciRef.current ? 1 : k === ciRef.current ? Math.min(1, pr) : 0})`; });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [paused, clips.length]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') nav('/'); }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [nav]);
  if (!p) return null;
  const go = (d: number) => { t0.current = performance.now(); held.current = 0; setCi((c) => (c + d + clips.length) % clips.length); };
  const open = (q: P) => { ui.send({ kind: 'place', id: q.id }); nav(`/place/${q.id}`); };
  const m = matchOf(p.vec, profile), per = personaOf(profile), km = kmBetween(p, OLD_CITY), saved = !!profile?.saved.includes(p.id), clip = clips[ci];
  const r = 33, C = 2 * Math.PI * r;
  const near = (cat: Cat) => (<div className="near" key={cat}><h3><i style={{ ['--dc' as string]: `var(${CAT[cat].c})` }} />{cat === 'stay' ? 'พักใกล้ๆ' : cat === 'eat' ? 'กินใกล้ๆ' : 'เที่ยวต่อใกล้ๆ'}</h3>
    <div className="near-row">{nearbyOf(p, cat, profile).map(({ q, k }) => (
      <button key={q.id} className="mini" type="button" style={{ backgroundImage: `url(${coverOf(q, 160, 160)})` }} aria-label={q.name} onClick={() => open(q)}>
        {profile && <em>{matchOf(q.vec, profile)}%</em>}{q.gem && <em className="gemdot" title="ที่ลับท้องถิ่น">ลับ</em>}<span>{q.name} {k.toFixed(1)} กม.</span></button>))}</div></div>);
  const tabs: [Tab, string][] = [['over', 'ภาพรวม'], ...(nEvents ? [['events', `กิจกรรม ${nEvents}`] as [Tab, string]] : []), ['go', 'เดินทาง'], ['trip', 'ทริป 1 วัน']];
  return (
    <div className="detail" onClick={(e) => { if ((e.target as HTMLElement).classList.contains('detail')) nav('/'); }}>
      <div className="pl" role="dialog" aria-modal="true" aria-labelledby="dName">
        <section className="story" aria-label={`ภาพบรรยากาศ ${p.name}`}>
          <LiveCanvas scene={() => clips[ciRef.current]} />
          {clip?.photo && <img key={ci} className="kb" src={clip.photo} alt="" />}
          <div className="segs">{clips.map((_, k) => <i key={k}><b ref={(el) => { if (el) segs.current[k] = el; }} /></i>)}</div>
          <button className="tap l" type="button" aria-label="ภาพก่อนหน้า" onClick={() => go(-1)} /><button className="tap r" type="button" aria-label="ภาพถัดไป" onClick={() => go(1)} />
          <button className="d-pause" type="button" aria-label={paused ? 'เล่นต่อ' : 'หยุดชั่วคราว'} onClick={() => setPaused(!paused)}><Icon name={paused ? 'play' : 'pause'} /></button>
          <button ref={close} className="d-close" type="button" aria-label="กลับไปที่แผนที่" onClick={() => nav('/')}><Icon name="close" /></button>
          <div className="story-foot">
            <div className="badges">{p.gem && <span className="badge gem">ที่ลับท้องถิ่น</span>}{p.isNew && <span className="badge new">ใหม่บนแผนที่</span>}<span className="badge" style={{ ['--dc' as string]: `var(${CAT[p.cat].c})` }}><i />{CAT[p.cat].th}</span></div>
            <h2 id="dName">{p.name}</h2><p>{p.en}</p></div>
        </section>
        <section className="panel">
          <header className="pl-head">
            <div className="pl-score">
              <div className="ring sm"><svg viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r={r} fill="none" stroke="var(--line)" strokeWidth="8" /><circle cx="38" cy="38" r={r} fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${C * m / 100} ${C}`} /></svg><b>{m}</b></div>
              <div><strong>{per ? `ตรงใจ${per.name} ${m}%` : `ตรงใจ ${m}%`}</strong><small>{per ? p.tags.slice(0, 2).join(' · ') : 'เลือก 5 ภาพเพื่อให้ % แม่นขึ้น'}</small></div>
            </div>
            <ul className="pl-facts">
              <li><Icon name="clock" />{p.hours}</li><li><Icon name="coin" />{p.price}</li>
              <li><Icon name="star" />{p.rating ? p.rating.toFixed(1) : 'ใหม่'}</li><li><Icon name="route" />{km < 1 ? 'ในเมืองเก่า' : `${km.toFixed(1)} กม.`}</li>
            </ul>
            <nav className="pl-tabs" role="tablist" aria-label="ข้อมูลสถานที่">{tabs.map(([k, th]) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{th}</button>)}</nav>
          </header>
          <div className="pl-body" role="tabpanel">
            {tab === 'over' && <>
              {p.owner && <Owner p={p} />}
              <div className="tags">{p.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
              <div className="near-stack">{otherCats(p).map(near)}</div>
              <p className="fine">{p.photos?.length ? 'ภาพจากผู้ประกอบการ' : 'ภาพเคลื่อนไหวนี้เป็นภาพจำลอง รอคลิปจริงจากเจ้าของ'} · ข้อมูลเป็นชุดตัวอย่าง</p>
            </>}
            {tab === 'events' && <EventsHere id={p.id} />}
            {tab === 'go' && <Getting p={p} />}
            {tab === 'trip' && <Trip p={p} onOpen={open} />}
          </div>
          <footer className="pl-foot">
            <button className="act save" type="button" aria-pressed={saved} onClick={() => { if (!profile) { nav('/quiz'); return; } if (toggleSave(p.id)) nudge(p.vec, .08); }}><Icon name="heart" fill={saved} /><span>{saved ? 'บันทึกแล้ว' : 'บันทึก'}</span></button>
            <a className="act go" href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`} target="_blank" rel="noopener"><Icon name="route" />นำทาง</a>
          </footer>
        </section>
      </div>
    </div>
  );
}

/* the owner's own words and the ways to reach them */
function Owner({ p }: { p: P }) {
  return (
    <div className="owner">
      <div className="owner-h"><Icon name="store" /><b>{p.owner}</b><span className="verified"><Icon name="check" />ยืนยันแล้ว</span></div>
      {p.story && <p>{p.story}</p>}
      {(p.contact?.tel || p.contact?.line) && <div className="owner-c">
        {p.contact.tel && <a className="chip" href={`tel:${p.contact.tel}`}><Icon name="phone" />โทร</a>}
        {p.contact.line && <a className="chip" href={`https://line.me/R/ti/p/~${encodeURIComponent(p.contact.line)}`} target="_blank" rel="noopener"><Icon name="chat" />LINE</a>}
      </div>}
    </div>
  );
}

function EventsHere({ id }: { id: string }) {
  const events = useEvents().filter((e) => e.place === id && daysUntil(e) >= 0).sort((a, b) => daysUntil(a) - daysUntil(b)), remind = useBiz((s) => s.remind), toggle = useBiz((s) => s.toggleRemind);
  if (!events.length) return null;
  return (
    <div className="block">
      {events.map((e) => { const on = remind.includes(e.id); return (
        <div className="ev-row" key={e.id}><span className="when">{dayLabel(e)}</span><div><b>{e.title}</b><small>{e.time} · {e.price}</small><p>{e.desc}</p></div>
          <button type="button" className="chip" aria-pressed={on} onClick={() => useUI.getState().say(toggle(e.id) ? `จะเตือนก่อน “${e.title}”` : 'ยกเลิกการเตือนแล้ว')}><Icon name="bell" />{on ? 'จะเตือน' : 'เตือนฉัน'}</button></div>); })}
    </div>
  );
}

/* how long it takes from the old city, or from where you are */
function Getting({ p }: { p: P }) {
  const [from, setFrom] = useState<{ lat: number; lng: number; th: string }>({ ...OLD_CITY, th: 'เมืองเก่า' });
  const km = kmBetween(from, p), here = () => navigator.geolocation?.getCurrentPosition((g) => setFrom({ lat: g.coords.latitude, lng: g.coords.longitude, th: 'ตำแหน่งของฉัน' }), () => useUI.getState().say('เปิดตำแหน่งไม่ได้ ใช้เมืองเก่าแทน'));
  return (
    <div className="block">
      <div className="from"><span>จาก</span><button type="button" className="chip" aria-pressed={from.th === 'เมืองเก่า'} onClick={() => setFrom({ ...OLD_CITY, th: 'เมืองเก่า' })}>เมืองเก่า</button>
        <button type="button" className="chip" aria-pressed={from.th !== 'เมืองเก่า'} onClick={here}><Icon name="target" />ตำแหน่งของฉัน</button><small>{km.toFixed(1)} กม.</small></div>
      <p className="lede">แตะเพื่อเปิดเส้นทางใน Google Maps</p>
      <div className="modes">{[...legs(km)].filter((l) => l.ok).sort((a, b) => a.min - b.min).map((l, k) => (
        <a key={l.mode} className={`mode${k === 0 ? ' best' : ''}`} href={`https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${p.lat},${p.lng}&travelmode=${l.mode === 'walk' ? 'walking' : l.mode === 'songthaew' ? 'transit' : 'driving'}`} target="_blank" rel="noopener">
          <Icon name={l.mode} /><span>{l.th}{k === 0 && <em>เร็วสุด</em>}</span><b>{l.min < 60 ? `${l.min} นาที` : `${Math.floor(l.min / 60)} ชม. ${l.min % 60} น.`}</b><Icon name="go" /></a>))}</div>
    </div>
  );
}

/* a one-day route: here, then the best match to eat, to see and to sleep nearby, in the order a day goes */
function Trip({ p, onOpen }: { p: P; onOpen: (q: P) => void }) {
  const profile = useProfile((s) => s.profile);
  const pick = (cat: Cat) => (p.cat === cat ? null : nearbyOf(p, cat, profile, 1)[0]?.q ?? null);
  const stops = [p, pick('eat'), pick('see'), pick('stay')].filter((x): x is P => !!x);
  if (stops.length < 2) return null;
  const url = `https://www.google.com/maps/dir/?api=1&origin=${stops[0].lat},${stops[0].lng}&destination=${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}&waypoints=${stops.slice(1, -1).map((s) => `${s.lat},${s.lng}`).join('|')}&travelmode=driving`;
  return (
    <div className="block"><p className="lede">เริ่มที่นี่ แล้วต่อด้วยที่กิน ที่เที่ยว และที่พักใกล้ๆ ที่ตรงกับคุณที่สุด</p>
      <ol className="trip">{stops.map((s, k) => (
        <li key={s.id}>{k > 0 && <span className="leg"><Icon name="bike" />{legs(kmBetween(stops[k - 1], s))[1].min} นาที</span>}
          <button type="button" onClick={() => (k ? onOpen(s) : undefined)} aria-label={s.name}><img src={coverOf(s, 72, 72)} alt="" /><span><b>{s.name}</b><small><i style={{ ['--dc' as string]: `var(${CAT[s.cat].c})` }} />{CAT[s.cat].th}{profile ? ` · ตรงใจ ${matchOf(s.vec, profile)}%` : ''}</small></span></button></li>))}</ol>
      <a className="btn line" href={url} target="_blank" rel="noopener"><Icon name="route" />เปิดเส้นทางทั้งวันใน Google Maps</a>
    </div>
  );
}
