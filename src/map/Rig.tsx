// Camera and the page's pins. Map controls (drag to pan, right-drag or two fingers to turn, wheel or pinch to zoom),
// flights on command, a floor so the camera never enters Doi Suthep, and the projection that places the HTML pins and labels.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import * as THREE from 'three';
import { ZONES } from '../data/content';
import { usePlaces } from '../lib/biz';
import { getGeo, hAt, toW, PIN_H } from '../lib/geo';
import { useUI } from '../lib/ui';
import { useProfile, scoreOf } from '../lib/profile';
import { reducedMotion } from './clock';
import { pinEls, zoneEls } from './registry';

type Fly = { t0: number; dur: number; fT: THREE.Vector3; fS: THREE.Spherical; tT: THREE.Vector3; tS: THREE.Spherical };
const ease = (t: number) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const narrow = () => innerWidth < 760;
/* the chrome dims only while a hand is on the map, and comes back right after release (not after the damping glide) */
let dimTimer = 0;
const dim = (on: boolean) => { clearTimeout(dimTimer); dimTimer = window.setTimeout(() => document.getElementById('app')?.classList.toggle('moving', on), on ? 180 : 120); };
// a release the controls never hear about (outside the window, app switch, cancelled touch) must not leave it dim
if (typeof window !== 'undefined') for (const t of ['pointerup', 'pointercancel', 'blur']) window.addEventListener(t, () => dim(false), true);
let closeState = false;

export function Rig() {
  const controls = useRef<any>(null), camera = useThree((s) => s.camera), size = useThree((s) => s.size);
  const fly = useRef<Fly | null>(null);
  const all = usePlaces(), places = useMemo(() => all.map((p) => { const [X, Z] = toW(p.lat, p.lng); return { p, X, Z, g: hAt(X, Z) }; }), [all]);
  const zones = useMemo(() => ZONES.map((z) => { const [X, Z] = toW(z.lat, z.lng); return { z, X, Z, g: hAt(X, Z) }; }), []);
  const occ = useRef(new Set<string>()), frame = useRef(0), v = useMemo(() => new THREE.Vector3(), []);

  const sph = () => { const c = controls.current; return new THREE.Spherical().setFromVector3(camera.position.clone().sub(c.target)); };
  const flyTo = (x: number, z: number, o: { dist?: number; polar?: number; az?: number; dur?: number; ty?: number } = {}) => {
    const c = controls.current; if (!c) return; const s = sph();
    fly.current = { t0: performance.now(), dur: reducedMotion ? 1 : o.dur ?? 1300, fT: c.target.clone(), fS: s,
      tT: new THREE.Vector3(x, o.ty ?? Math.max(0, hAt(x, z)) * .75, z),
      tS: new THREE.Spherical(THREE.MathUtils.clamp(o.dist ?? s.radius, c.minDistance, c.maxDistance), THREE.MathUtils.clamp(o.polar ?? s.phi, c.minPolarAngle, c.maxPolarAngle), o.az ?? s.theta) };
  };

  /* commands from the screens */
  useEffect(() => useUI.subscribe((s, prev) => {
    if (!s.cmd || s.cmd === prev.cmd || !controls.current) return;
    const c = controls.current, cmd = s.cmd, k = narrow() ? 1.35 : 1;
    if (cmd.kind === 'overview') flyTo(.4, 3.2, { dist: narrow() ? 52 : 40, polar: .86, az: -.3, ty: 0 });
    if (cmd.kind === 'zone') { const z = zones.find((q) => q.z.id === cmd.id); if (z) flyTo(z.X, z.Z, { dist: (z.z.r > 20 ? 16 : 10.5) * k, polar: .9 }); }
    if (cmd.kind === 'place') { const p = places.find((q) => q.p.id === cmd.id); if (p) { const s0 = sph(); flyTo(p.X, p.Z, { dist: Math.min(s0.radius, 6.5 * k), polar: Math.min(s0.phi, .95), dur: 1100 }); } }
    if (cmd.kind === 'zoom') flyTo(c.target.x, c.target.z, { dist: sph().radius * cmd.f, dur: 380, ty: c.target.y });
    if (cmd.kind === 'north') flyTo(c.target.x, c.target.z, { az: 0, dur: 700, ty: c.target.y });
    if (cmd.kind === 'tilt') flyTo(c.target.x, c.target.z, { polar: cmd.three ? .95 : .06, dur: 800, ty: c.target.y });
  }), [places, zones]);

  useEffect(() => { camera.position.set(-10, 26, 30); controls.current?.target.set(.4, 0, 3.2); useUI.getState().send({ kind: 'overview' }); }, [camera]);

  useFrame(() => {
    const c = controls.current; if (!c) return;
    const f = fly.current;
    if (f) {
      const p = Math.min(1, (performance.now() - f.t0) / f.dur), e = ease(p);
      c.target.lerpVectors(f.fT, f.tT, e);
      let dth = f.tS.theta - f.fS.theta; if (dth > Math.PI) dth -= Math.PI * 2; if (dth < -Math.PI) dth += Math.PI * 2;
      const s = new THREE.Spherical(THREE.MathUtils.lerp(f.fS.radius, f.tS.radius, e) * (1 + Math.sin(Math.PI * e) * (f.dur > 500 ? .12 : 0)), THREE.MathUtils.lerp(f.fS.phi, f.tS.phi, e), f.fS.theta + dth * e);
      camera.position.setFromSpherical(s).add(c.target); camera.lookAt(c.target);
      if (p >= 1) fly.current = null;
    }
    const { SX, SZ } = getGeo().meta;
    c.target.x = THREE.MathUtils.clamp(c.target.x, -SX / 2, SX / 2); c.target.z = THREE.MathUtils.clamp(c.target.z, -SZ / 2, SZ / 2);
    const floor = hAt(camera.position.x, camera.position.z) + .3; if (camera.position.y < floor) camera.position.y = floor;
    const compass = document.getElementById('compass-needle'); if (compass) compass.style.transform = `rotate(${(-sph().theta * 180 / Math.PI).toFixed(1)}deg)`;
    project();
  });

  /* place the HTML pins: project, hide what is behind a ridge, keep the best match when two collide */
  function project() {
    const { cats, focus } = useUI.getState(), profile = useProfile.getState().profile, dist = sph().radius, W = size.width, H = size.height;
    const check = frame.current++ % 8 === 0, cam = camera.position;
    if ((dist < 5.5) !== closeState) { closeState = dist < 5.5; document.getElementById('app')?.classList.toggle('close', closeState); }
    const vis: { id: string; el: HTMLDivElement; x: number; y: number; s: number }[] = [];
    for (const { p, X, Z, g } of places) {
      const el = pinEls.get(p.id); if (!el) continue;
      if (!cats[p.cat]) { el.hidden = true; continue; }
      v.set(X, g + PIN_H, Z).project(camera);
      const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
      if (v.z > 1 || x < -60 || x > W + 60 || y < -60 || y > H + 80) { el.hidden = true; continue; }
      if (check) { let hid = false; for (let s = 1; s < 20 && !hid; s++) { const t = s / 20, px = cam.x + (X - cam.x) * t, py = cam.y + (g + PIN_H - cam.y) * t, pz = cam.z + (Z - cam.z) * t; if (hAt(px, pz) > py + .02) hid = true; } hid ? occ.current.add(p.id) : occ.current.delete(p.id); }
      vis.push({ id: p.id, el, x, y, s: scoreOf(p, profile) + (focus === p.id ? 100 : 0) + (el.classList.contains('hot') ? 20 : 0) });
    }
    vis.sort((a, b) => b.s - a.s);
    const limit = dist > 26 ? 10 : dist > 15 ? 18 : 99, gap = dist > 15 ? 58 : 48, placed: typeof vis = [];
    for (const o of vis) {
      const ok = placed.length < limit && !placed.some((q) => Math.hypot(q.x - o.x, q.y - o.y) < gap);
      o.el.hidden = !ok; if (!ok) continue; placed.push(o);
      o.el.style.transform = `translate(${o.x.toFixed(1)}px,${o.y.toFixed(1)}px)`;
      o.el.classList.toggle('sel', focus === o.id); o.el.classList.toggle('dim', occ.current.has(o.id) && focus !== o.id);
    }
    for (const { z, X, Z, g } of zones) {
      const el = zoneEls.get(z.id); if (!el) continue;
      if (dist < 9) { el.style.opacity = '0'; continue; }
      v.set(X, g + .25, Z).project(camera); const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
      const bad = v.z > 1 || placed.some((q) => Math.abs(q.x - x) < 60 && Math.abs(q.y - 60 - y) < 40);
      el.style.opacity = bad ? '0' : '1'; el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-50%)`;
    }
  }

  return <MapControls ref={controls} makeDefault enableDamping dampingFactor={.085} screenSpacePanning={false} minDistance={2} maxDistance={52} maxPolarAngle={1.32} minPolarAngle={.05}
    rotateSpeed={.55} zoomSpeed={.9} panSpeed={1.1} touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }}
    onStart={() => { fly.current = null; dim(true); }} onEnd={() => dim(false)} />;
}
