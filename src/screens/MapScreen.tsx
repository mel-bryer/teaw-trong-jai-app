// The map screen: the 3D model full-bleed, a slim bar on top, map tools on the right, the time of day, and a sheet of matches that folds away.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ZONES, CAT, type Cat } from '../data/content';
import { usePlaces, coverOf } from '../lib/biz';
import { useProfile, personaOf, matchOf, scoreOf, hotIds } from '../lib/profile';
import { useUI, nightOf, fmtHour, type Quality } from '../lib/ui';
import { MapView } from '../map/MapView';
import { pinEls, zoneEls } from '../map/registry';
import { MAPTILER_KEY } from '../map/satellite';
import { LiveCanvas } from '../components/LiveCanvas';
import { Icon, Brand, Compass, Ring } from '../components/icons';
import { useEventBadge } from './Events';

export function MapScreen() {
  const ui = { ...useUI.getState(), hour: useUI((s) => s.hour), bare: useUI((s) => s.bare), ready: useUI((s) => s.ready) }, surface = useUI((s) => s.surface), profile = useProfile((s) => s.profile), drift = useProfile((s) => s.drift), nav = useNavigate();
  const dark = nightOf(ui.hour) > .5;
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; }, [dark]);
  useEffect(() => { if (drift) ui.say(`vibe ของคุณขยับเป็น “${personaOf({ persona: drift } as never)?.name}”`); }, [drift]); // eslint-disable-line
  const open = (id: string) => { ui.setFocus(id); ui.send({ kind: 'place', id }); setTimeout(() => nav(`/place/${id}`), 650); };
  const cls = `app${ui.bare ? ' bare' : ''}`;
  return (
    <div className={cls} id="app">
      <MapView />
      <div className={`loading${ui.ready ? ' done' : ''}`}><span>กำลังปั้นดอยสุเทพ…</span></div>
      <div className="overlay">
        {ZONES.map((z) => <div key={z.id} className="zone" ref={(el) => { if (el) zoneEls.set(z.id, el); }}><span>{z.name}</span><small>{profile ? matchOf(z.vec, profile) + '%' : ''}</small></div>)}
        <Pins onOpen={open} />
      </div>
      <TopBar onOpen={open} dark={dark} />
      <Tools />
      <TimeBar />
      <Sheet onOpen={open} />
      <button className="showui glass" type="button" hidden={!ui.bare} onClick={() => ui.set({ bare: false })}><Icon name="shrink" />แสดงเมนู</button>
      <p className="credit">ความสูง: SRTM ผ่าน AWS Terrain Tiles · ถนน น้ำ ตึก: © OpenStreetMap contributors ·{surface === 'sat' && ' ภาพดาวเทียม: © MapTiler ·'} ข้อมูลสถานที่เป็นชุดตัวอย่าง</p>
      <Toast />
    </div>
  );
}

function Pins({ onOpen }: { onOpen: (id: string) => void }) {
  const profile = useProfile((s) => s.profile), places = usePlaces(), hot = useMemo(() => hotIds(profile), [profile, places]);
  return <>{places.map((p) => {
    const isHot = hot.has(p.id);
    return (
      <div key={p.id} className={`pin ${p.cat}${p.event ? ' event' : ''}${isHot ? ' hot' : ''}${p.isNew ? ' new' : ''}`} ref={(el) => { if (el) pinEls.set(p.id, el); else pinEls.delete(p.id); }} hidden>
        <button type="button" aria-label={p.name} onClick={() => onOpen(p.id)} style={{ backgroundImage: isHot && !p.photos ? 'none' : `url(${coverOf(p, 96, 96)})` }}>
          {isHot && !p.photos && <LiveCanvas scene={p.sc} />}
          {profile && isHot && <b>{matchOf(p.vec, profile)}%</b>}
          <span>{p.name}</span>
        </button>
      </div>);
  })}</>;
}

function TopBar({ onOpen, dark }: { onOpen: (id: string) => void; dark: boolean }) {
  const ui = useUI.getState(), profile = useProfile((s) => s.profile), per = personaOf(profile), nav = useNavigate();
  const [open, setOpen] = useState(false), [q, setQ] = useState(''), places = usePlaces(), badge = useEventBadge();
  const list = useMemo(() => { const s = q.trim().toLowerCase(); return places.filter((p) => !s || (p.name + ' ' + p.en + ' ' + p.tags.join(' ')).toLowerCase().includes(s)).sort((a, b) => scoreOf(b, profile) - scoreOf(a, profile)).slice(0, 8); }, [q, profile, places]);
  useEffect(() => { if (!open) return; const off = (e: PointerEvent) => { if (!(e.target as HTMLElement).closest('.search')) setOpen(false); }; document.addEventListener('pointerdown', off); return () => document.removeEventListener('pointerdown', off); }, [open]);
  const pick = (id: string) => { setOpen(false); onOpen(id); };
  return (
    <header className="topbar">
      <div className="bar glass">
        <a className="brand" href="#/" aria-label="เที่ยวตรงใจ กลับไปมุมมองทั้งเมือง" onClick={(e) => { e.preventDefault(); ui.setFocus(null); ui.send({ kind: 'overview' }); }}>
          <span className="brand-mark"><Brand /></span><b>เที่ยวตรงใจ</b>
        </a>
        <div className="search">
          <button className="searchpill" type="button" aria-label="ค้นหาสถานที่" aria-expanded={open} onClick={() => setOpen(!open)}><Icon name="search" /><span className="long">ค้นหาวัด ร้าน ที่พัก</span></button>
          {open && <div className="search-panel glass">
            <input autoFocus type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="วัด ข้าวซอย คาเฟ่ ..." aria-label="ค้นหาสถานที่"
              onKeyDown={(e) => { if (e.key === 'Enter' && list[0]) pick(list[0].id); if (e.key === 'Escape') setOpen(false); }} />
            <div className="results">{list.length ? list.map((p) => (
              <button key={p.id} type="button" onClick={() => pick(p.id)}><img src={coverOf(p, 96, 96)} alt="" /><span>{p.name}<small>{CAT[p.cat].th} {p.tags[0]}{profile ? ` ตรงใจ ${matchOf(p.vec, profile)}%` : ''}</small></span></button>))
              : <p className="empty" style={{ padding: 8 }}>ไม่พบ ลองคำอื่น เช่น “ข้าวซอย”</p>}</div>
          </div>}
        </div>
        <button className="navbtn" type="button" aria-label="ฟีดตรงใจ" onClick={() => nav('/foryou')}><Icon name="feed" /><span>ฟีด</span></button>
        <button className="navbtn" type="button" aria-label={`กิจกรรมท้องถิ่น${badge ? ` ${badge} รายการใหม่` : ''}`} onClick={() => nav('/events')}><Icon name="bell" /><span>กิจกรรม</span>{badge > 0 && <i className="badge-n">{badge}</i>}</button>
      </div>
      <div className="bar glass">
        <button className="navbtn" type="button" aria-label="สำหรับผู้ประกอบการ ปักหมุดฟรี" onClick={() => nav('/biz')}><Icon name="store" /><span>ผู้ประกอบการ</span></button>
        <button className="iconbtn" type="button" aria-label={dark ? 'เปลี่ยนเป็นตอนเช้า' : 'เปลี่ยนเป็นคืนยี่เป็ง'} onClick={() => ui.setHour(dark ? 7.5 : 21)}><Icon name={dark ? 'sun' : 'moon'} /></button>
        <button className="vibechip" type="button" aria-label="vibe ของฉัน" onClick={() => nav(profile ? '/me' : '/quiz')}>
          <LiveCanvas scene={() => per?.sc ?? { type: 'mist', seed: 1, v: .6 }} /><b>{per ? per.name : 'หา vibe'}</b>
        </button>
      </div>
    </header>
  );
}

function Tools() {
  const ui = { ...useUI.getState(), quality: useUI((s) => s.quality), surface: useUI((s) => s.surface) }, profile = useProfile((s) => s.profile), per = personaOf(profile), [three, setThree] = useState(true);
  const Q: Quality[] = ['high', 'medium', 'low'], QL: Record<Quality, string> = { high: 'สูง', medium: 'กลาง', low: 'ต่ำ' };
  return (
    <div className="mapctl glass" role="group" aria-label="เครื่องมือแผนที่">
      <button type="button" aria-label="ซูมเข้า" onClick={() => ui.send({ kind: 'zoom', f: .65 })}><Icon name="plus" /></button>
      <button type="button" aria-label="ซูมออก" onClick={() => ui.send({ kind: 'zoom', f: 1.5 })}><Icon name="minus" /></button>
      <hr />
      <button type="button" aria-label="หันทิศเหนือขึ้น" onClick={() => ui.send({ kind: 'north' })}><Compass /></button>
      <button type="button" aria-pressed={three} aria-label={three ? 'มุมมองสามมิติ' : 'มุมมองจากด้านบน'} onClick={() => { setThree(!three); ui.send({ kind: 'tilt', three: !three }); }}><Icon name="layers" /></button>
      <button type="button" aria-label="ไปย่านที่ตรงใจ" onClick={() => (per ? ui.send({ kind: 'zone', id: per.zone }) : ui.send({ kind: 'overview' }))}><Icon name="target" /></button>
      <hr />
      <button type="button" className="qbtn" aria-label={`คุณภาพภาพ ${QL[ui.quality]} กดเพื่อเปลี่ยน`} onClick={() => { const nq = Q[(Q.indexOf(ui.quality) + 1) % 3]; ui.setQuality(nq); ui.say(`คุณภาพภาพ: ${QL[nq]}`); }}>{QL[ui.quality]}</button>
      {MAPTILER_KEY ? <button type="button" className="qbtn" aria-pressed={ui.surface === 'sat'} aria-label={ui.surface === 'sat' ? 'ภาพดาวเทียม กดเพื่อกลับเป็นแผนที่วาด' : 'แผนที่วาด กดเพื่อดูภาพดาวเทียม'}
        onClick={() => { const ns = ui.surface === 'sat' ? 'paint' : 'sat'; ui.setSurface(ns); ui.say(ns === 'sat' ? 'ภาพดาวเทียม' : 'แผนที่วาด'); }}>{ui.surface === 'sat' ? 'ดาวเทียม' : 'วาด'}</button>
        : <button type="button" className="qbtn" aria-disabled="true" aria-label="ภาพดาวเทียมใช้ไม่ได้ในลิงก์นี้" onClick={() => ui.say('ลิงก์นี้ใช้ภาพดาวเทียมไม่ได้ (ไม่มี API key) เปิดจาก localhost หรือเว็บที่โฮสต์เองเพื่อดูภาพดาวเทียม')}>วาด</button>}
      <button type="button" aria-label="ซ่อนเมนู ดูแผนที่เต็มจอ" onClick={() => ui.set({ bare: true })}><Icon name="expand" /></button>
    </div>
  );
}

function TimeBar() {
  const hour = useUI((s) => s.hour), setHour = useUI((s) => s.setHour);
  return (
    <label className="timebar glass">
      <Icon name={nightOf(hour) > .5 ? 'moon' : 'sun'} />
      <span className="visually-hidden">เวลาบนแผนที่</span>
      <input type="range" min={5.5} max={23.5} step={.25} value={hour} onChange={(e) => setHour(+e.target.value)} aria-valuetext={fmtHour(hour)} />
      <output>{fmtHour(hour)}</output>
    </label>
  );
}

function Sheet({ onOpen }: { onOpen: (id: string) => void }) {
  const ui = { ...useUI.getState(), sheetOpen: useUI((s) => s.sheetOpen) }, profile = useProfile((s) => s.profile), per = personaOf(profile);
  const [layer, setLayer] = useState<'all' | Cat>('all'), places = usePlaces();
  const list = useMemo(() => {
    const ranked = places.filter((p) => layer === 'all' || p.cat === layer).sort((a, b) => scoreOf(b, profile) - scoreOf(a, profile)).slice(0, 14), out: typeof ranked = [];
    while (ranked.length) { const k = ranked.findIndex((p) => p.sc.type !== out[out.length - 1]?.sc.type); out.push(ranked.splice(k < 0 ? 0 : k, 1)[0]); }
    return out;
  }, [layer, profile, places]);
  const choose = (k: 'all' | Cat) => { setLayer(k); ui.setCats({ see: k === 'all' || k === 'see', eat: k === 'all' || k === 'eat', stay: k === 'all' || k === 'stay' }); };
  let y0: number | null = null;
  return (
    <section className="sheet glass" data-state={ui.sheetOpen ? 'open' : 'closed'} aria-label="ที่ที่ตรงใจคุณ">
      <div className="sheet__head" onPointerDown={(e) => { y0 = e.clientY; }} onPointerUp={(e) => { if (y0 === null) return; const dy = e.clientY - y0; y0 = null; if (dy > 40) ui.set({ sheetOpen: false }); else if (dy < -40) ui.set({ sheetOpen: true }); }}>
        <button className="sheet__toggle" type="button" aria-expanded={ui.sheetOpen} onClick={() => ui.set({ sheetOpen: !ui.sheetOpen })}>
          <Icon name="up" /><span><b>{per ? `ตรงใจ${per.name}` : 'น่าไปในเชียงใหม่'}</b> <small>{layer === 'all' ? '' : CAT[layer].th}</small></span>
        </button>
        <nav className="layers" aria-label="เลือกประเภท">
          {(['all', 'see', 'eat', 'stay'] as const).map((k) => (
            <button key={k} type="button" aria-pressed={layer === k} onClick={() => choose(k)}>
              {k !== 'all' && <span className="dot" style={{ ['--dc' as string]: `var(${CAT[k].c})` }} />}<span>{k === 'all' ? 'ทั้งหมด' : CAT[k].th}</span>
            </button>))}
        </nav>
      </div>
      <div className="track">{list.map((p) => (
        <button key={p.id} className="card" type="button" style={{ backgroundImage: `url(${coverOf(p, 236, 314)})` }} aria-label={p.name} onClick={() => onOpen(p.id)}>
          {profile && <span className="match"><Ring m={matchOf(p.vec, profile)} />{matchOf(p.vec, profile)}%</span>}
          <span className="nm">{p.name}<small><i style={{ ['--dc' as string]: `var(${CAT[p.cat].c})` }} />{CAT[p.cat].th} {p.price}</small></span>
        </button>))}</div>
    </section>
  );
}

function Toast() {
  const toast = useUI((s) => s.toast), [show, setShow] = useState(false);
  useEffect(() => { if (!toast) return; setShow(true); const t = setTimeout(() => setShow(false), 2800); return () => clearTimeout(t); }, [toast]);
  return <div className={`toast glass${show ? ' show' : ''}`} role="status">{toast?.text}</div>;
}
