// The traveller's profile: the vibe, its DNA as it drifts, saved places, and a way to start again.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile, personaOf } from '../lib/profile';
import { useUI } from '../lib/ui';
import { placeById, coverOf } from '../lib/biz';
import { LiveCanvas } from '../components/LiveCanvas';
import { Icon } from '../components/icons';
import { Dna } from './Quiz';

export function Profile() {
  const nav = useNavigate(), profile = useProfile((s) => s.profile), reset = useProfile((s) => s.reset), per = personaOf(profile), ui = useUI.getState();
  const [open, setOpen] = useState(false), closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { const t = requestAnimationFrame(() => setOpen(true)); closeRef.current?.focus(); return () => cancelAnimationFrame(t); }, []);
  useEffect(() => { if (!profile) nav('/quiz', { replace: true }); }, [profile, nav]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') nav('/'); }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [nav]);
  if (!profile || !per) return null;
  const saved = profile.saved.map((id) => placeById(id)).filter((p) => !!p);
  return (
    <aside className={`drawer${open ? ' open' : ''}`} aria-label="โปรไฟล์ vibe">
      <div className="dr-hero"><LiveCanvas scene={per.sc} /><button ref={closeRef} className="d-close" type="button" aria-label="ปิด" onClick={() => nav('/')}><Icon name="close" /></button>
        <div className="txt"><div className="eyebrow">vibe ของคุณ</div><h2>{per.name}</h2><div style={{ color: 'var(--on-night-muted)', fontSize: 13 }}>{per.en}</div></div></div>
      <div className="dr-body">
        <div><h3>DNA การเที่ยว</h3><Dna v={profile.vec} /></div>
        <div><h3>ที่บันทึกไว้</h3>{saved.length ? <div className="saved">{saved.map((q) => (
          <button key={q.id} className="mini" type="button" style={{ backgroundImage: `url(${coverOf(q, 160, 160)})` }} onClick={() => { ui.setFocus(q.id); ui.send({ kind: 'place', id: q.id }); nav(`/place/${q.id}`); }}><span>{q.name}</span></button>))}</div>
          : <p className="empty">กดหัวใจที่สถานที่ไหนก็ได้ ระบบจะจำและปรับคำแนะนำให้ตรงขึ้น</p>}</div>
        <div className="memo">ระบบจำ vibe นี้ไว้ ไม่ต้องทำแบบทดสอบซ้ำ ทุกครั้งที่เปิดดูหรือบันทึก จุดบน DNA จะขยับเข้าหาสิ่งที่คุณชอบจริง ต้นแบบนี้เก็บไว้ในเบราว์เซอร์เครื่องนี้</div>
        <button className="btn line" type="button" onClick={() => nav('/quiz')}>ทำแบบทดสอบใหม่</button>
        <button className="btn line" type="button" onClick={() => { reset(); nav('/quiz'); }}>ลบข้อมูล vibe</button>
      </div>
    </aside>
  );
}
