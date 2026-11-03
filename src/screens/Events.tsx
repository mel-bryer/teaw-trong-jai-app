// Local events across Chiang Mai, soonest first, the ones that match you lifted: workshops with community makers, markets,
// ceremonies and festivals. "Remind me" keeps a list the map checks on every visit.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KIND, type EventKind, type LocalEvent } from '../data/content';
import { useProfile, matchOf } from '../lib/profile';
import { useEvents, allEvents, useBiz, placeById, dayLabel, daysUntil } from '../lib/biz';
import { useUI } from '../lib/ui';
import { thumb } from '../lib/scenes';
import { Icon } from '../components/icons';

/* how many upcoming events are worth a badge: the week's matches until the page is opened today, then only newly approved ones */
export function useEventBadge() {
  const events = useEvents(), seenAt = useBiz((s) => s.eventsSeenAt), subs = useBiz((s) => s.subs), profile = useProfile((s) => s.profile);
  return useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (seenAt < +today) return events.filter((e) => { const d = daysUntil(e); return d >= 0 && d <= 7 && (!profile || matchOf(e.vec, profile) >= 70); }).length;
    return subs.filter((s) => s.kind === 'event' && s.status === 'approved' && (s.reviewedAt ?? 0) > seenAt).length;
  }, [events, seenAt, subs, profile]);
}

/* reminders: on each visit, say what you asked to be reminded of that is today or tomorrow */
export function useReminders() {
  useEffect(() => {
    const t = setTimeout(() => {
      const { remind } = useBiz.getState(), soon = allEvents().filter((e) => remind.includes(e.id) && daysUntil(e) >= 0 && daysUntil(e) <= 1);
      if (soon.length) useUI.getState().say(`${dayLabel(soon[0])}: ${soon[0].title} ${soon[0].time}${soon.length > 1 ? ` และอีก ${soon.length - 1} กิจกรรม` : ''}`);
    }, 2600);
    return () => clearTimeout(t);
  }, []);
}

type Filter = 'all' | 'mine' | 'reminded' | EventKind;
export function Events() {
  const nav = useNavigate(), events = useEvents(), profile = useProfile((s) => s.profile), remind = useBiz((s) => s.remind), toggle = useBiz((s) => s.toggleRemind);
  const [f, setF] = useState<Filter>(profile ? 'mine' : 'all'), [open, setOpen] = useState(false), closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { const t = requestAnimationFrame(() => setOpen(true)); closeRef.current?.focus(); useBiz.getState().seeEvents(); return () => cancelAnimationFrame(t); }, []);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') nav('/'); }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [nav]);
  const list = events.filter((e) => daysUntil(e) >= 0 && daysUntil(e) <= 30)
    .filter((e) => f === 'all' || (f === 'mine' ? matchOf(e.vec, profile) >= 70 : f === 'reminded' ? remind.includes(e.id) : e.kind === f))
    .sort((a, b) => daysUntil(a) - daysUntil(b) || matchOf(b.vec, profile) - matchOf(a.vec, profile));
  const groups: [string, LocalEvent[]][] = [['วันนี้', list.filter((e) => daysUntil(e) === 0)], ['พรุ่งนี้', list.filter((e) => daysUntil(e) === 1)],
    ['สัปดาห์นี้', list.filter((e) => daysUntil(e) > 1 && daysUntil(e) <= 7)], ['ถัดไป', list.filter((e) => daysUntil(e) > 7)]];
  const chips: [Filter, string][] = [['mine', 'ตรงใจฉัน'], ['all', 'ทั้งหมด'], ['reminded', `ที่กดเตือน${remind.length ? ` ${remind.length}` : ''}`], ...(Object.entries(KIND) as [EventKind, string][])];
  const show = (id: string) => { const p = placeById(id); if (!p) return; useUI.getState().setFocus(p.id); useUI.getState().send({ kind: 'place', id: p.id }); nav(`/place/${p.id}`); };
  return (
    <aside className={`drawer wide${open ? ' open' : ''}`} aria-label="กิจกรรมท้องถิ่น">
      <div className="pg-head"><div><div className="eyebrow">เชียงใหม่ 30 วันข้างหน้า</div><h2>กิจกรรมท้องถิ่น</h2></div>
        <button ref={closeRef} className="iconbtn" type="button" aria-label="ปิด" onClick={() => nav('/')}><Icon name="close" /></button></div>
      <nav className="fchips" aria-label="กรองกิจกรรม">{chips.map(([k, th]) => <button key={k} type="button" className="chip" aria-pressed={f === k} onClick={() => setF(k)}>{th}</button>)}</nav>
      <div className="dr-body">
        {groups.filter(([, xs]) => xs.length).map(([th, xs]) => (
          <div key={th}><h3>{th}</h3><div className="ev-list">{xs.map((e) => { const p = placeById(e.place), on = remind.includes(e.id); return (
            <article className="ev" key={e.id}>
              <button type="button" className="ev-img" style={{ backgroundImage: `url(${thumb(e.sc, 180, 220)})` }} aria-label={`ดู ${p?.name ?? ''}`} onClick={() => show(e.place)}>
                <span>{dayLabel(e)}</span>{profile && <em>{matchOf(e.vec, profile)}%</em>}</button>
              <div className="ev-txt"><small className="kind">{KIND[e.kind]}</small><b>{e.title}</b><p>{e.desc}</p>
                <small>{e.time} · {e.price} · {p?.name}</small><small className="host"><Icon name="store" />{e.host}</small>
                <div className="ev-act"><button type="button" className="chip" aria-pressed={on} onClick={() => useUI.getState().say(toggle(e.id) ? `จะเตือนก่อน “${e.title}”` : 'ยกเลิกการเตือนแล้ว')}><Icon name="bell" />{on ? 'จะเตือน' : 'เตือนฉัน'}</button>
                  <button type="button" className="chip" onClick={() => show(e.place)}><Icon name="pin" />ดูที่</button></div></div>
            </article>); })}</div></div>))}
        {!list.length && <p className="empty">ยังไม่มีกิจกรรมในหมวดนี้ ลองดู “ทั้งหมด”</p>}
        <div className="memo">กดเตือนไว้ แล้วเปิดเว็บวันนั้นหรือวันก่อนหน้า จะมีข้อความเตือนบนแผนที่ ผู้ประกอบการและชุมชนเพิ่มกิจกรรมเองได้ที่ “ผู้ประกอบการ”</div>
        <button className="btn line" type="button" onClick={() => nav('/biz')}><Icon name="store" />ชุมชน/ร้านค้า ลงกิจกรรมฟรี</button>
      </div>
    </aside>
  );
}
