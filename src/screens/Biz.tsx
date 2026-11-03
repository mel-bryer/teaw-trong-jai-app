// For local owners and communities: pin your own place or event, pick a few tags (they set the vibe the matching uses),
// add photos, and send it for review. Once an admin confirms it is real it joins the map, the feed and the matches, free.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CAT, KIND, PERSONAS, SCENE_TYPES, TAG_VEC, type Cat, type EventKind, type Place } from '../data/content';
import { matchOf } from '../lib/profile';
import { useBiz, usePlaces, vecOfTags, shrinkPhoto, coverOf, type Status, type Sub } from '../lib/biz';
import { getGeo } from '../lib/geo';
import { useUI } from '../lib/ui';
import { thumb } from '../lib/scenes';
import { LiveCanvas } from '../components/LiveCanvas';
import { Icon } from '../components/icons';

export const STATUS: Record<Status, { th: string; c: string }> = { pending: { th: 'รอตรวจสอบ', c: 'var(--accent)' }, approved: { th: 'ขึ้นแผนที่แล้ว', c: 'var(--c-see)' }, changes: { th: 'ขอข้อมูลเพิ่ม', c: 'var(--c-stay)' }, rejected: { th: 'ไม่ผ่าน', c: 'var(--c-event)' } };
const TAGS = Object.keys(TAG_VEC);
const personasFor = (vec: number[]) => PERSONAS.map((p) => ({ p, m: matchOf(vec, { vec: p.vec } as never) })).sort((a, b) => b.m - a.m).slice(0, 2);

/* ---------- a flat map to drop the pin on: the same painted relief as the 3D model, valley or city view ---------- */
const EXT_FALLBACK = { west: 98.80, east: 99.13, north: 18.96, south: 18.66 }, CITY = { west: 98.945, east: 99.025, north: 18.815, south: 18.765 };
export function PinPicker({ value, onChange, readOnly }: { value: { lat: number; lng: number } | null; onChange?: (v: { lat: number; lng: number }) => void; readOnly?: boolean }) {
  const E = (() => { try { return getGeo().meta.extent; } catch { return EXT_FALLBACK; } })();
  const [view, setView] = useState<'city' | 'valley'>('city'), V = view === 'city' ? CITY : E, places = usePlaces();
  const sx = (E.east - E.west) / (V.east - V.west), sy = (E.north - E.south) / (V.north - V.south);
  const pos = (lat: number, lng: number) => ({ left: `${(lng - V.west) / (V.east - V.west) * 100}%`, top: `${(V.north - lat) / (V.north - V.south) * 100}%` });
  const pick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !onChange) return; const r = e.currentTarget.getBoundingClientRect();
    onChange({ lat: +(V.north - (e.clientY - r.top) / r.height * (V.north - V.south)).toFixed(5), lng: +(V.west + (e.clientX - r.left) / r.width * (V.east - V.west)).toFixed(5) });
  };
  const inV = (q: { lat: number; lng: number }) => q.lat <= V.north && q.lat >= V.south && q.lng >= V.west && q.lng <= V.east;
  return (
    <div className="picker">
      <div className="picker-map" style={{ aspectRatio: `${(V.east - V.west) * 105.3} / ${(V.north - V.south) * 111}` }} onClick={pick} role={readOnly ? 'img' : 'button'} aria-label={readOnly ? 'ตำแหน่งบนแผนที่' : 'แตะแผนที่เพื่อปักหมุด'}>
        <img src="data/terrain-day-2048.jpg" alt="" draggable={false} style={{ width: `${sx * 100}%`, height: `${sy * 100}%`, left: `${-(V.west - E.west) / (V.east - V.west) * 100}%`, top: `${-(E.north - V.north) / (V.north - V.south) * 100}%` }} />
        {places.filter(inV).map((q) => <i key={q.id} className="dot" style={{ ...pos(q.lat, q.lng), ['--dc' as string]: `var(${CAT[q.cat].c})` }} title={q.name} />)}
        {value && inV(value) && <span className="newpin" style={pos(value.lat, value.lng)}><Icon name="pin" /></span>}
      </div>
      <div className="picker-bar">
        <button type="button" className="chip" aria-pressed={view === 'city'} onClick={() => setView('city')}>ในเมือง</button>
        <button type="button" className="chip" aria-pressed={view === 'valley'} onClick={() => setView('valley')}>ทั้งหุบเขา</button>
        {!readOnly && <button type="button" className="chip" onClick={() => navigator.geolocation?.getCurrentPosition((g) => {
          const v = { lat: +g.coords.latitude.toFixed(5), lng: +g.coords.longitude.toFixed(5) };
          if (v.lat > E.north || v.lat < E.south || v.lng < E.west || v.lng > E.east) useUI.getState().say('ตำแหน่งนี้อยู่นอกพื้นที่แผนที่ แตะบนแผนที่แทน'); else { onChange?.(v); if (!inV(v)) setView('valley'); }
        }, () => useUI.getState().say('เปิดตำแหน่งไม่ได้ แตะบนแผนที่แทน'))}><Icon name="target" />ตำแหน่งปัจจุบัน</button>}
        <small>{value ? `${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}` : 'แตะแผนที่เพื่อปักหมุด'}</small>
      </div>
    </div>
  );
}

/* ---------- the page ---------- */
type Tab = 'place' | 'event' | 'mine';
export function Biz() {
  const nav = useNavigate(), subs = useBiz((s) => s.subs), [tab, setTab] = useState<Tab>('place');
  useEffect(() => { useUI.getState().set({ cover: true }); return () => useUI.getState().set({ cover: false }); }, []);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') nav('/'); }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [nav]);
  return (
    <div className="page" role="region" aria-label="สำหรับผู้ประกอบการ">
      <header className="pg-top">
        <button type="button" className="iconbtn" aria-label="กลับไปที่แผนที่" onClick={() => nav('/')}><Icon name="close" /></button>
        <b><Icon name="store" />เที่ยวตรงใจ สำหรับผู้ประกอบการ</b>
        <button type="button" className="chip" onClick={() => nav('/admin')}><Icon name="shield" />ผู้ดูแลระบบ</button>
      </header>
      <div className="pg-in">
        <section className="biz-hero">
          <div><div className="eyebrow">ร้านเล็ก ชุมชน โฮมสเตย์ กิจกรรมท้องถิ่น</div>
            <h1>ปักหมุดฟรี ให้คนที่ใช่<br />เจอคุณเอง</h1>
            <p>ไม่ต้องซื้อโฆษณาที่ไม่รู้ว่าถึงใคร เลือกแท็กไม่กี่อัน ระบบจะจับคู่ร้านคุณกับนักท่องเที่ยวที่ vibe ตรงกัน ทั้งบนแผนที่และในฟีด</p></div>
          <ol className="steps3"><li><b>1</b>กรอกข้อมูลและปักหมุด</li><li><b>2</b>ทีมงานตรวจว่ามีจริง 1–3 วัน</li><li><b>3</b>ขึ้นแผนที่ จับคู่กับคนที่ตรงสไตล์</li></ol>
          <div className="model"><Icon name="coin" /><span><b>ฟรีช่วงเปิดตัว</b> ภายหลังจ่ายเฉพาะเมื่อขายได้ (affiliate หรือ commission เป็น % ของยอดที่มาจากเว็บ) ไม่มีค่าโฆษณาล่วงหน้า</span></div>
        </section>
        <nav className="tabs" role="tablist">
          {([['place', 'ปักหมุดสถานที่'], ['event', 'ลงกิจกรรม'], ['mine', `คำร้องของฉัน${subs.length ? ` (${subs.length})` : ''}`]] as [Tab, string][]).map(([k, th]) =>
            <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)}>{th}</button>)}
        </nav>
        {tab === 'place' && <PlaceForm onDone={() => setTab('mine')} />}
        {tab === 'event' && <EventForm onDone={() => setTab('mine')} />}
        {tab === 'mine' && <Mine onNew={() => setTab('place')} />}
      </div>
    </div>
  );
}

function Tags({ value, onChange }: { value: string[]; onChange: (t: string[]) => void }) {
  return <div className="fchips wrap">{TAGS.map((t) => <button key={t} type="button" className="chip" aria-pressed={value.includes(t)} onClick={() => onChange(value.includes(t) ? value.filter((x) => x !== t) : value.length >= 6 ? value : [...value, t])}>{t}</button>)}</div>;
}
function Scenes({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  return <div className="scenes">{SCENE_TYPES.map(([t, th], k) => <button key={t} type="button" aria-pressed={value === t} aria-label={th} onClick={() => onChange(t)} style={{ backgroundImage: `url(${thumb({ type: t, seed: 700 + k, v: .3 }, 120, 120)})` }}><span>{th}</span></button>)}</div>;
}
function Photos({ value, onChange }: { value: string[]; onChange: (p: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null), [busy, setBusy] = useState(false);
  const add = async (files: FileList | null) => {
    if (!files) return; setBusy(true);
    try { const out = [...value]; for (const f of [...files].slice(0, 3 - value.length)) out.push(await shrinkPhoto(f)); onChange(out); } catch (e) { useUI.getState().say(String((e as Error).message)); }
    setBusy(false);
  };
  return (
    <div className="photos">
      {value.map((src, k) => <div key={k} className="ph" style={{ backgroundImage: `url(${src})` }}><button type="button" aria-label="ลบภาพ" onClick={() => onChange(value.filter((_, j) => j !== k))}><Icon name="close" /></button></div>)}
      {value.length < 3 && <button type="button" className="ph add" onClick={() => input.current?.click()} disabled={busy}><Icon name="camera" /><span>{busy ? 'กำลังย่อภาพ…' : 'เพิ่มภาพจริง'}</span></button>}
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
    </div>
  );
}

function PlaceForm({ onDone }: { onDone: () => void }) {
  const submit = useBiz((s) => s.submit);
  const [f, setF] = useState({ name: '', en: '', owner: '', cat: 'eat' as Cat, tags: [] as string[], photos: [] as string[], scene: 'food', story: '', price: '', hours: '', tel: '', line: '' });
  const [at, setAt] = useState<{ lat: number; lng: number } | null>(null), [tried, setTried] = useState(false);
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p });
  const vec = useMemo(() => vecOfTags(f.tags), [f.tags]), fans = useMemo(() => personasFor(vec), [vec]);
  const missing = [!f.name.trim() && 'ชื่อสถานที่', !f.owner.trim() && 'ชื่อผู้ติดต่อ/กิจการ', !at && 'หมุดบนแผนที่', f.tags.length < 2 && 'แท็กอย่างน้อย 2 อัน', !(f.tel.trim() || f.line.trim()) && 'ช่องทางติดต่อ'].filter(Boolean) as string[];
  const preview: Place = { id: 'preview', cat: f.cat, name: f.name || 'ชื่อสถานที่ของคุณ', en: f.en, lat: at?.lat ?? 0, lng: at?.lng ?? 0, sc: { type: f.scene, seed: 900, v: .3 }, vec, price: f.price || '-', hours: f.hours || '-', rating: 0, tags: f.tags, photos: f.photos.length ? f.photos : undefined, owner: f.owner };
  const send = () => {
    setTried(true); if (missing.length) { useUI.getState().say(`ยังขาด: ${missing.join(', ')}`); return; }
    try {
      submit({ kind: 'place', place: { ...preview, id: `biz-${Date.now().toString(36)}`, name: f.name.trim(), en: f.en.trim(), story: f.story.trim() || undefined, contact: { tel: f.tel.trim() || undefined, line: f.line.trim() || undefined }, sc: { type: f.scene, seed: Date.now() % 997, v: .3 } } });
      useUI.getState().say('ส่งคำร้องแล้ว ทีมงานจะตรวจภายใน 1–3 วัน'); onDone();
    } catch { useUI.getState().say('พื้นที่เก็บข้อมูลเต็ม ลองลดจำนวนภาพ'); }
  };
  return (
    <div className="form-grid">
      <div className="form">
        <fieldset><legend>1 · เป็นที่แบบไหน</legend>
          <div className="seg">{(['see', 'eat', 'stay'] as Cat[]).map((c) => <button key={c} type="button" aria-pressed={f.cat === c} onClick={() => set({ cat: c })}><i style={{ ['--dc' as string]: `var(${CAT[c].c})` }} />{c === 'see' ? 'ที่เที่ยว / กิจกรรม' : c === 'eat' ? 'ร้านอาหาร / คาเฟ่' : 'ที่พัก'}</button>)}</div>
          <label>ชื่อสถานที่<input value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="เช่น ครัวป้าศรี" aria-invalid={tried && !f.name.trim()} /></label>
          <label>ชื่อภาษาอังกฤษ (ไม่บังคับ)<input value={f.en} onChange={(e) => set({ en: e.target.value })} /></label>
          <label>ชื่อกิจการ / ผู้ติดต่อ<input value={f.owner} onChange={(e) => set({ owner: e.target.value })} placeholder="เช่น ป้าศรี หรือ กลุ่มแม่บ้านวัวลาย" aria-invalid={tried && !f.owner.trim()} /></label>
        </fieldset>
        <fieldset><legend>2 · ปักหมุด</legend><PinPicker value={at} onChange={setAt} /></fieldset>
        <fieldset><legend>3 · ภาพ (สำคัญที่สุด)</legend><p className="hint2">ภาพจริงทำให้คนตัดสินใจได้เร็ว สูงสุด 3 ภาพ ถ้ายังไม่มี เลือกภาพบรรยากาศแทนก่อนได้</p>
          <Photos value={f.photos} onChange={(photos) => set({ photos })} />{!f.photos.length && <Scenes value={f.scene} onChange={(scene) => set({ scene })} />}</fieldset>
        <fieldset><legend>4 · บรรยากาศ (เลือก 2–6)</legend><p className="hint2">แท็กเหล่านี้ใช้จับคู่กับ vibe ของนักท่องเที่ยว ไม่ต้องเขียนยาว</p><Tags value={f.tags} onChange={(tags) => set({ tags })} /></fieldset>
        <fieldset><legend>5 · รายละเอียดสั้นๆ</legend>
          <label>เล่าสั้นๆ ให้คนอยากมา ({140 - f.story.length})<textarea maxLength={140} rows={3} value={f.story} onChange={(e) => set({ story: e.target.value })} placeholder="เช่น แกงฮังเลหม้อเดียวของวัน ขายหมดแล้วปิด" /></label>
          <div className="row2"><label>ราคา<input value={f.price} onChange={(e) => set({ price: e.target.value })} placeholder="฿50–120" /></label><label>เวลาเปิด<input value={f.hours} onChange={(e) => set({ hours: e.target.value })} placeholder="09:00–17:00" /></label></div>
          <div className="row2"><label>โทร<input type="tel" value={f.tel} onChange={(e) => set({ tel: e.target.value })} placeholder="08x xxx xxxx" /></label><label>LINE ID<input value={f.line} onChange={(e) => set({ line: e.target.value })} /></label></div>
        </fieldset>
      </div>
      <aside className="preview">
        <div className="eyebrow">ตัวอย่างที่นักท่องเที่ยวจะเห็น</div>
        <div className="pv-card">{f.photos.length ? <img className="kb" src={f.photos[0]} alt="" /> : <LiveCanvas scene={() => preview.sc} />}
          <div className="reel-foot"><div className="badges"><span className="badge new">ใหม่</span><span className="badge" style={{ ['--dc' as string]: `var(${CAT[f.cat].c})` }}><i />{CAT[f.cat].th}</span></div>
            <h2>{preview.name}</h2><p className="meta">{f.tags.slice(0, 3).join(' · ') || 'เลือกแท็กเพื่อดูว่าใครจะเจอคุณ'}</p></div></div>
        {f.tags.length >= 2 && <div className="fans"><b>จะขึ้นในฟีดของสาย</b>{fans.map(({ p, m }) => <span key={p.id} className="fan"><LiveCanvas scene={p.sc} />{p.name}<em>{m}%</em></span>)}</div>}
        {tried && missing.length > 0 && <p className="missing">ยังขาด: {missing.join(' · ')}</p>}
        <button type="button" className="btn primary" onClick={send}><Icon name="check" />ส่งให้ทีมงานตรวจสอบ</button>
        <p className="fine">ทีมงานจะโทรหรือทัก LINE เพื่อยืนยันว่ามีสถานที่จริง ก่อนขึ้นแผนที่</p>
      </aside>
    </div>
  );
}

function EventForm({ onDone }: { onDone: () => void }) {
  const submit = useBiz((s) => s.submit), places = usePlaces(), mine = useBiz((s) => s.subs).filter((s) => s.kind === 'place' && s.place && s.status !== 'approved').map((s) => s.place!);
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  const [f, setF] = useState({ place: '', title: '', kind: 'workshop' as EventKind, date: today, time: '', price: '', desc: '', host: '', tags: [] as string[], scene: 'craft' });
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p }), [tried, setTried] = useState(false);
  const missing = [!f.place && 'สถานที่จัด', !f.title.trim() && 'ชื่อกิจกรรม', !f.time.trim() && 'เวลา', !f.host.trim() && 'ผู้จัด', f.tags.length < 1 && 'แท็ก'].filter(Boolean) as string[];
  const send = () => {
    setTried(true); if (missing.length) { useUI.getState().say(`ยังขาด: ${missing.join(', ')}`); return; }
    submit({ kind: 'event', event: { id: `bev-${Date.now().toString(36)}`, place: f.place, title: f.title.trim(), kind: f.kind, date: f.date, time: f.time.trim(), price: f.price.trim() || 'ฟรี', desc: f.desc.trim(), host: f.host.trim(), vec: vecOfTags(f.tags), sc: { type: f.scene, seed: Date.now() % 997, v: .3 } } });
    useUI.getState().say('ส่งกิจกรรมแล้ว รอทีมงานตรวจ'); onDone();
  };
  return (
    <div className="form-grid">
      <div className="form">
        <fieldset><legend>กิจกรรม</legend>
          <label>จัดที่<select value={f.place} onChange={(e) => set({ place: e.target.value })} aria-invalid={tried && !f.place}><option value="">เลือกสถานที่บนแผนที่</option>
            {mine.length > 0 && <optgroup label="ที่ฉันส่งไว้">{mine.map((p) => <option key={p.id} value={p.id}>{p.name} (รอตรวจ)</option>)}</optgroup>}
            <optgroup label="บนแผนที่">{places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup></select></label>
          <label>ชื่อกิจกรรม<input value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="เช่น ทำแกงฮังเลกับป้า" aria-invalid={tried && !f.title.trim()} /></label>
          <div className="seg wrap">{(Object.entries(KIND) as [EventKind, string][]).map(([k, th]) => <button key={k} type="button" aria-pressed={f.kind === k} onClick={() => set({ kind: k })}>{th}</button>)}</div>
          <div className="row2"><label>วันที่<input type="date" min={today} value={f.date} onChange={(e) => set({ date: e.target.value })} /></label><label>เวลา<input value={f.time} onChange={(e) => set({ time: e.target.value })} placeholder="09:00–12:00" aria-invalid={tried && !f.time.trim()} /></label></div>
          <div className="row2"><label>ราคา<input value={f.price} onChange={(e) => set({ price: e.target.value })} placeholder="ฟรี / ฿300" /></label><label>ผู้จัด<input value={f.host} onChange={(e) => set({ host: e.target.value })} aria-invalid={tried && !f.host.trim()} /></label></div>
          <label>บอกสั้นๆ<textarea rows={2} maxLength={100} value={f.desc} onChange={(e) => set({ desc: e.target.value })} /></label>
        </fieldset>
        <fieldset><legend>บรรยากาศ</legend><Tags value={f.tags} onChange={(tags) => set({ tags })} /><Scenes value={f.scene} onChange={(scene) => set({ scene })} /></fieldset>
      </div>
      <aside className="preview">
        <div className="eyebrow">ตัวอย่าง</div>
        <div className="pv-card"><LiveCanvas scene={() => ({ type: f.scene, seed: 900, v: .3 })} />
          <div className="reel-foot"><div className="badges"><span className="badge ev">{f.date}</span><span className="badge">{KIND[f.kind]}</span></div><h2>{f.title || 'ชื่อกิจกรรม'}</h2><p className="meta">{f.time} · {f.price || 'ฟรี'}</p></div></div>
        {tried && missing.length > 0 && <p className="missing">ยังขาด: {missing.join(' · ')}</p>}
        <button type="button" className="btn primary" onClick={send}><Icon name="check" />ส่งให้ทีมงานตรวจสอบ</button>
        <p className="fine">ผ่านแล้วจะขึ้นในหน้ากิจกรรม ในฟีด และแจ้งเตือนคนที่ vibe ตรงกัน</p>
      </aside>
    </div>
  );
}

export function SubTitle({ s }: { s: Sub }) { return <>{s.kind === 'place' ? s.place?.name : s.event?.title}</>; }

function Mine({ onNew }: { onNew: () => void }) {
  const nav = useNavigate(), subs = useBiz((s) => s.subs), views = useBiz((s) => s.views), review = useBiz((s) => s.review), withdraw = useBiz((s) => s.withdraw);
  if (!subs.length) return <div className="empty-box"><p className="empty">ยังไม่มีคำร้อง ลองปักหมุดสถานที่แรกของคุณ</p><button className="btn primary" type="button" onClick={onNew}>ปักหมุดสถานที่</button></div>;
  return (
    <div className="subs">{subs.map((s) => {
      const st = STATUS[s.status], img = s.place ? coverOf(s.place, 120, 120) : thumb(s.event!.sc, 120, 120), pid = s.place?.id ?? s.event?.place;
      return (
        <article className="sub" key={s.id}>
          <div className="sub-img" style={{ backgroundImage: `url(${img})` }} />
          <div className="sub-main">
            <div className="sub-h"><b><SubTitle s={s} /></b><span className="status" style={{ ['--sc' as string]: st.c }}>{st.th}</span></div>
            <small>{s.kind === 'place' ? CAT[s.place!.cat].th : `กิจกรรม · ${s.event!.date}`} · ส่งเมื่อ {new Date(s.at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</small>
            <ol className="timeline"><li className="done">ส่งคำร้อง</li><li className={s.status === 'pending' ? 'now' : 'done'}>ตรวจว่ามีจริง</li><li className={s.status === 'approved' ? 'done' : ''}>ขึ้นแผนที่</li></ol>
            {s.note && <p className="note"><b>ทีมงาน:</b> {s.note}</p>}
            <div className="sub-act">
              {s.status === 'approved' && pid && <button type="button" className="chip" onClick={() => { useUI.getState().send({ kind: 'place', id: pid }); nav(`/place/${pid}`); }}><Icon name="pin" />ดูหน้าร้าน</button>}
              {s.status === 'approved' && s.kind === 'place' && <span className="stat"><Icon name="spark" />ถูกเห็น {views[s.place!.id] ?? 0} ครั้ง</span>}
              {s.status === 'changes' && <button type="button" className="chip" onClick={() => { review(s.id, 'pending'); useUI.getState().say('ส่งตรวจอีกครั้งแล้ว'); }}>แก้แล้ว ส่งอีกครั้ง</button>}
              <button type="button" className="chip" onClick={() => withdraw(s.id)}>{s.status === 'approved' ? 'นำออกจากแผนที่' : 'ถอนคำร้อง'}</button>
            </div>
          </div>
        </article>);
    })}</div>
  );
}
