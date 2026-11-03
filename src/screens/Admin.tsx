// The admin queue: every owner request is checked before it reaches travellers. Approve only after each check is ticked;
// or ask for more, or decline, with a note the owner sees. In the real product this sits behind an admin sign-in.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CAT, KIND } from '../data/content';
import { useBiz, placeById, coverOf, vecOfTags, type Status, type Sub } from '../lib/biz';
import { useUI } from '../lib/ui';
import { thumb } from '../lib/scenes';
import { Icon } from '../components/icons';
import { PinPicker, STATUS, SubTitle } from './Biz';

const CHECKS_PLACE = ['ตำแหน่งหมุดตรงกับที่ตั้งจริง', 'ภาพเป็นของสถานที่นี้จริง', 'ติดต่อเจ้าของได้และยืนยันตัวตนแล้ว', 'ข้อมูลไม่ผิดกฎหมายหรือหลอกลวง'];
const CHECKS_EVENT = ['ผู้จัดยืนยันวันเวลาแล้ว', 'สถานที่จัดมีอยู่จริง', 'ข้อมูลไม่ผิดกฎหมายหรือหลอกลวง'];

export function Admin() {
  const nav = useNavigate(), subs = useBiz((s) => s.subs), [tab, setTab] = useState<'pending' | 'done'>('pending');
  useEffect(() => { useUI.getState().set({ cover: true }); return () => useUI.getState().set({ cover: false }); }, []);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') nav('/biz'); }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [nav]);
  const queue = subs.filter((s) => (tab === 'pending' ? s.status === 'pending' : s.status !== 'pending'));
  const sample = () => useBiz.getState().submit({ kind: 'place', place: { id: `biz-${Date.now().toString(36)}`, cat: 'eat', name: 'ร้านน้ำเงี้ยวป้าจันทร์ (ตัวอย่าง)', en: 'Auntie Jan Nam Ngiao', lat: 18.7812, lng: 98.9958,
    sc: { type: 'food', seed: 777, v: .3 }, vec: vecOfTags(['อาหารเหนือ', 'ราคาย่อมเยา', 'ชุมชน']), price: '฿40–60', hours: '07:00–13:00', rating: 0, tags: ['อาหารเหนือ', 'ราคาย่อมเยา', 'ชุมชน'],
    owner: 'ป้าจันทร์ (ตัวอย่าง)', story: 'ขนมจีนน้ำเงี้ยวสูตรไทใหญ่ ตั้งร้านหน้าบ้านมายี่สิบปี', contact: { tel: '0800000002' } } });
  return (
    <div className="page" role="region" aria-label="ผู้ดูแลระบบ">
      <header className="pg-top">
        <button type="button" className="iconbtn" aria-label="กลับไปหน้าผู้ประกอบการ" onClick={() => nav('/biz')}><Icon name="close" /></button>
        <b><Icon name="shield" />ตรวจสอบคำร้อง</b><span className="pill">เดโม ไม่ต้องล็อกอิน</span>
      </header>
      <div className="pg-in">
        <nav className="tabs" role="tablist">
          <button role="tab" type="button" aria-selected={tab === 'pending'} onClick={() => setTab('pending')}>รอตรวจ ({subs.filter((s) => s.status === 'pending').length})</button>
          <button role="tab" type="button" aria-selected={tab === 'done'} onClick={() => setTab('done')}>ตรวจแล้ว</button>
        </nav>
        {!queue.length && <div className="empty-box"><p className="empty">{tab === 'pending' ? 'ไม่มีคำร้องรอตรวจ' : 'ยังไม่ได้ตรวจคำร้องไหน'}</p>
          {tab === 'pending' && <><button type="button" className="btn line" onClick={sample}>ใส่คำร้องตัวอย่าง</button><button type="button" className="btn primary" onClick={() => nav('/biz')}>ไปส่งคำร้องจริง</button></>}</div>}
        <div className="queue">{queue.map((s) => <Review key={s.id} s={s} />)}</div>
      </div>
    </div>
  );
}

function Review({ s }: { s: Sub }) {
  const nav = useNavigate(), review = useBiz((st) => st.review), checks = s.kind === 'place' ? CHECKS_PLACE : CHECKS_EVENT;
  const [ok, setOk] = useState<boolean[]>(checks.map(() => s.status === 'approved')), [note, setNote] = useState(s.note ?? '');
  const p = s.place, e = s.event, at = p ?? (e ? placeById(e.place) : undefined), st = STATUS[s.status];
  const decide = (status: Status) => {
    if (status !== 'approved' && !note.trim()) { useUI.getState().say('ใส่หมายเหตุให้เจ้าของก่อน'); return; }
    review(s.id, status, note.trim() || undefined); useUI.getState().say(status === 'approved' ? 'อนุมัติแล้ว ขึ้นแผนที่ทันที' : 'ส่งหมายเหตุให้เจ้าของแล้ว');
  };
  return (
    <article className="rv">
      <div className="rv-media">{p?.photos?.length ? p.photos.map((src, k) => <img key={k} src={src} alt={`ภาพที่ ${k + 1}`} />) : <img src={p ? coverOf(p, 320, 240) : thumb(e!.sc, 320, 240)} alt="ภาพบรรยากาศที่เลือก (ไม่ใช่ภาพจริง)" />}</div>
      <div className="rv-body">
        <div className="sub-h"><b><SubTitle s={s} /></b><span className="status" style={{ ['--sc' as string]: st.c }}>{st.th}</span></div>
        <dl className="kv">
          {p && <><dt>ประเภท</dt><dd>{CAT[p.cat].th}</dd><dt>ผู้ติดต่อ</dt><dd>{p.owner}</dd><dt>ติดต่อ</dt><dd>{[p.contact?.tel && `โทร ${p.contact.tel}`, p.contact?.line && `LINE ${p.contact.line}`].filter(Boolean).join(' · ') || '-'}</dd>
            <dt>ราคา / เวลา</dt><dd>{p.price} · {p.hours}</dd><dt>แท็ก</dt><dd>{p.tags.join(', ')}</dd>{p.story && <><dt>เรื่องเล่า</dt><dd>{p.story}</dd></>}</>}
          {e && <><dt>ประเภท</dt><dd>{KIND[e.kind]}</dd><dt>วันเวลา</dt><dd>{e.date} · {e.time}</dd><dt>ผู้จัด</dt><dd>{e.host}</dd><dt>จัดที่</dt><dd>{at?.name ?? 'สถานที่ที่ยังรอตรวจ'}</dd><dt>ราคา</dt><dd>{e.price}</dd>{e.desc && <><dt>รายละเอียด</dt><dd>{e.desc}</dd></>}</>}
        </dl>
        {at && <PinPicker value={{ lat: at.lat, lng: at.lng }} readOnly />}
        {!p?.photos?.length && s.kind === 'place' && <p className="missing">ไม่มีภาพจริง ควรขอภาพเพิ่มก่อนอนุมัติ</p>}
        {s.status === 'pending' && <>
          <fieldset className="checks"><legend>ตรวจครบก่อนอนุมัติ</legend>{checks.map((c, k) => (
            <label key={c}><input type="checkbox" checked={ok[k]} onChange={(ev) => setOk(ok.map((x, j) => (j === k ? ev.target.checked : x)))} />{c}</label>))}</fieldset>
          <label className="note-in">หมายเหตุถึงเจ้าของ<textarea rows={2} value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="เช่น ขอภาพหน้าร้านจริงเพิ่ม 1 ภาพ" /></label>
          <div className="sub-act">
            <button type="button" className="btn primary" disabled={!ok.every(Boolean)} onClick={() => decide('approved')}><Icon name="check" />อนุมัติ ขึ้นแผนที่</button>
            <button type="button" className="btn line" onClick={() => decide('changes')}>ขอข้อมูลเพิ่ม</button>
            <button type="button" className="btn line danger" onClick={() => decide('rejected')}>ไม่ผ่าน</button>
          </div></>}
        {s.status === 'approved' && at && <button type="button" className="chip" onClick={() => { useUI.getState().send({ kind: 'place', id: at.id }); nav(`/place/${at.id}`); }}><Icon name="pin" />ดูบนแผนที่</button>}
        {s.note && s.status !== 'pending' && <p className="note"><b>หมายเหตุ:</b> {s.note}</p>}
      </div>
    </article>
  );
}
