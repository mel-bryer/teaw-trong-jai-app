// The vibe quiz: an intro over four moving scenes, five rounds of four pictures, then the result with its DNA.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QUIZ, AXES } from '../data/content';
import { useProfile, personaOf } from '../lib/profile';
import { useUI } from '../lib/ui';
import { LiveCanvas } from '../components/LiveCanvas';
import { Icon } from '../components/icons';
import { reducedMotion } from '../map/clock';

export function Dna({ v }: { v: number[] }) {
  return <div className="dna">{AXES.map((a, i) => (
    <div className="dna-row" key={a[0]}><span>{a[0]}</span><div className="dna-track" role="img" aria-label={`${a[0]} ถึง ${a[1]} ${Math.round(v[i] * 100)} จาก 100`}><i style={{ ['--v' as string]: v[i].toFixed(3) }} /></div><span>{a[1]}</span></div>))}</div>;
}

export function Quiz() {
  const nav = useNavigate(), [step, setStep] = useState(-1), [picked, setPicked] = useState<number | null>(null), answers = useRef<number[][]>([]);
  const finishQuiz = useProfile((s) => s.finishQuiz), profile = useProfile((s) => s.profile), ui = useUI.getState();
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { first.current?.focus(); }, [step]);
  useEffect(() => { ui.set({ cover: true }); return () => ui.set({ cover: false }); }, []); // eslint-disable-line
  const close = () => nav('/');
  const pick = (k: number) => {
    if (picked !== null) return; setPicked(k); answers.current[step] = QUIZ[step].o[k][4];
    setTimeout(() => { setPicked(null); if (step < QUIZ.length - 1) setStep(step + 1); else { finishQuiz(answers.current); setStep(99); } }, reducedMotion ? 50 : 520);
  };
  if (step === 99 && profile) {
    const per = personaOf(profile)!;
    return (<div className="quiz"><div className="q-result"><LiveCanvas scene={per.sc} /><div className="q-copy">
      <div className="eyebrow">vibe ของคุณคือ</div><h1>{per.name}</h1><p style={{ margin: '6px 0 0' }}>{per.en}</p>
      <div className="chips">{per.words.map((w) => <span className="chip" key={w}>{w}</span>)}</div><Dna v={profile.vec} />
      <div className="btns"><button ref={first} className="btn primary" type="button" onClick={() => { nav('/'); setTimeout(() => ui.send({ kind: 'zone', id: per.zone }), 150); }}>เปิดแผนที่ตามใจ <Icon name="go" /></button>
        <button className="btn ghost" type="button" onClick={() => { answers.current = []; setStep(0); }}>เลือกใหม่</button></div>
    </div></div></div>);
  }
  if (step < 0) return (<div className="quiz"><div className="q-intro">
    <div className="q-mosaic">{[['mist', 2, 0], ['lantern', 3, 0], ['food', 4, 0], ['temple', 5, 0]].map(([type, seed, v]) => <div key={type as string}><LiveCanvas scene={{ type: type as string, seed: seed as number, v: v as number }} /></div>)}</div>
    <div className="q-copy"><div className="eyebrow">เชียงใหม่ ห้าภาพ สามสิบวินาที</div><h1>เที่ยว<em>ตรงใจ</em></h1>
      <p>ไม่ต้องอ่าน ไม่ต้องคิด แค่เลือกภาพที่ใจเต้น แล้วแผนที่จะเปิดเฉพาะที่ที่ใช่สำหรับคุณ</p>
      <div className="btns"><button ref={first} className="btn primary" type="button" onClick={() => setStep(0)}>เริ่มเลือกภาพ <Icon name="go" /></button>
        <button className="btn ghost" type="button" onClick={() => { close(); ui.say('ทำแบบทดสอบได้ทุกเมื่อจากปุ่มมุมขวาบน'); }}>ดูแผนที่ก่อน</button></div></div>
  </div></div>);
  const R0 = QUIZ[step];
  return (<div className="quiz"><div className="q-round">
    <div className="q-bar"><div className="q-dots" role="img" aria-label={`ภาพชุดที่ ${step + 1} จาก 5`}>{QUIZ.map((_, k) => <i key={k} className={k <= step ? 'on' : ''} />)}</div>
      <button className="q-back" type="button" onClick={() => (step ? setStep(step - 1) : close())}>{step ? 'ย้อนกลับ' : 'ปิด'}</button></div>
    <h2 className="q-prompt">{R0.q}</h2>
    <div className={`q-grid${picked !== null ? ' picked' : ''}`} key={step}>{R0.o.map((o, k) => (
      <button ref={k === 0 ? first : undefined} key={o[0]} className={`tile${picked === k ? ' sel' : ''}`} type="button" aria-label={o[0]} onClick={() => pick(k)}>
        <LiveCanvas scene={{ type: o[1], seed: o[2], v: o[3] }} /><span>{o[0]}</span></button>))}</div>
  </div></div>);
}
