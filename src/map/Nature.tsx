// Life on the slopes and in the sky: forest on Doi Suthep and Doi Pui, morning cloud and mist, birds, Yi Peng lanterns.
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getGeo, hAt, metresAt, rng, toW } from '../lib/geo';
import { clock } from './clock';
import type { Quality } from '../lib/ui';

export function Forest({ quality }: { quality: Quality }) {
  const N = quality === 'high' ? 14000 : quality === 'medium' ? 8000 : 3500;
  const { pine, broad, cP, cB, mat } = useMemo(() => {
    const { SX, SZ } = getGeo().meta, r = rng(23), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
    const pineG = new THREE.ConeGeometry(.05, .17, 6); pineG.translate(0, .085, 0);
    const broadG = new THREE.IcosahedronGeometry(.055, 0); broadG.translate(0, .06, 0);
    const mat = new THREE.MeshStandardMaterial({ roughness: .9, flatShading: true });
    const pine = new THREE.InstancedMesh(pineG, mat, N), broad = new THREE.InstancedMesh(broadG, mat, N);
    const PG = ['#2f6b47', '#3c7d4f', '#2a5e43', '#356f4a', '#24573f'], BG = ['#4b8a55', '#57944f', '#6aa35a', '#3f7f4a', '#7aa95c'];
    let cP = 0, cB = 0, tries = 0;
    while (cP + cB < N && tries < N * 14) {
      tries++;
      const X = (r() - .5) * SX * .99, Z = (r() - .5) * SZ * .99, mm = metresAt(X, Z);
      if (mm < 400 || mm > 1680) continue;
      const h = hAt(X, Z), sl = Math.abs(hAt(X + .1, Z) - hAt(X - .1, Z)) + Math.abs(hAt(X, Z + .1) - hAt(X, Z - .1));
      if (sl > .6 || r() > .35 + Math.sin(X * 3.1) * Math.cos(Z * 2.7) * .25 + (mm - 400) / 2600) continue;
      const k = .6 + r() * .75, high = mm > 900 ? .75 : .35, isPine = r() < high;
      m.compose(p.set(X, h - .01, Z), q.setFromAxisAngle(s.set(0, 1, 0), r() * 6.3), s.set(k, k * (.8 + r() * .5), k));
      if (isPine) { pine.setMatrixAt(cP, m); pine.setColorAt(cP++, c.set(PG[Math.floor(r() * PG.length)])); }
      else { broad.setMatrixAt(cB, m); broad.setColorAt(cB++, c.set(BG[Math.floor(r() * BG.length)])); }
    }
    pine.count = cP; broad.count = cB;
    for (const im of [pine, broad]) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; }
    return { pine, broad, cP, cB, mat };
  }, [N]);
  useFrame(() => mat.color.setScalar(1 - clock.night * .45));
  return <group><primitive object={pine} key={'p' + cP} /><primitive object={broad} key={'b' + cB} /></group>;
}

const glowTexture = (() => { let t: THREE.CanvasTexture | null = null; return () => {
  if (t) return t; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d')!, g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(.22, 'rgba(255,196,110,.95)'); g.addColorStop(1, 'rgba(255,140,50,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (t = new THREE.CanvasTexture(c)); }; })();

export function Clouds() {
  const tex = useMemo(() => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d')!, r = rng(5);
    for (let i = 0; i < 16; i++) { const cx = 40 + r() * 176, cy = 50 + r() * 40, rr = 22 + r() * 36, g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 128); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }, []);
  const sprites = useMemo(() => { const r = rng(9), out: { pos: THREE.Vector3; w: number; o: number; v: number; low: boolean }[] = [];
    for (let i = 0; i < 12; i++) { const low = i >= 8, w = low ? 5 + r() * 4 : 3.5 + r() * 3.5;
      out.push({ pos: new THREE.Vector3(-15 + r() * (low ? 8 : 14), low ? 2.2 + r() * .8 : 4 + r() * 1.8, -14 + r() * 24), w, o: low ? .28 : .55, v: .07 + r() * .12, low }); }
    return out; }, []);
  const refs = useRef<THREE.Sprite[]>([]), camera = useThree((s) => s.camera);
  useFrame((_, dt) => {
    sprites.forEach((s, i) => { const sp = refs.current[i]; if (!sp) return; s.pos.x += s.v * Math.min(dt, .1) * (clock.t ? 1 : 0); if (s.pos.x > (s.low ? -6 : 17)) s.pos.x = s.low ? -16 : -17; sp.position.copy(s.pos);
      const near = Math.min(1, Math.max(0, (camera.position.distanceTo(s.pos) - 5) / 9));
      const m = sp.material as THREE.SpriteMaterial; m.opacity = s.o * near * (1 - clock.night * .97); m.color.setRGB(1 - clock.night * .35, 1 - clock.night * .25, 1); });
  });
  return <group>{sprites.map((s, i) => (
    <sprite key={i} ref={(r) => { if (r) refs.current[i] = r; }} position={s.pos} scale={[s.w, s.w * .42, 1]}><spriteMaterial map={tex} transparent depthWrite={false} fog={false} /></sprite>))}</group>;
}

/* a flock circling Doi Suthep in the morning */
export function Birds() {
  const N = 14, mesh = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-.05, 0, -.01, 0, 0, .01, 0, .012, -.012, .05, 0, -.01, 0, 0, .01, 0, .012, -.012], 3)); g.computeVertexNormals(); return g; }, []);
  const [cx, cz] = useMemo(() => toW(18.81, 98.93), []), seeds = useMemo(() => { const r = rng(3); return Array.from({ length: N }, () => ({ a: r() * 6.3, rr: 1.2 + r() * 1.6, y: 3.6 + r() * .8, sp: .12 + r() * .08 })); }, []);
  const m = useMemo(() => new THREE.Matrix4(), []), q = useMemo(() => new THREE.Quaternion(), []), e = useMemo(() => new THREE.Euler(), []), v = useMemo(() => new THREE.Vector3(), []), s = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  useFrame(() => { const im = mesh.current; if (!im) return; im.visible = clock.night < .6;
    seeds.forEach((b, i) => { const a = b.a + clock.t * b.sp, flap = .6 + Math.sin(clock.t * 9 + i) * .4;
      m.compose(v.set(cx + Math.cos(a) * b.rr, b.y + Math.sin(clock.t * .7 + i) * .1, cz + Math.sin(a) * b.rr), q.setFromEuler(e.set(0, -a, 0)), s.set(1.4, flap * 1.4, 1.4)); im.setMatrixAt(i, m); });
    im.instanceMatrix.needsUpdate = true; });
  return <instancedMesh ref={mesh} args={[geo, undefined, N]}><meshBasicMaterial color="#2a2f3a" side={THREE.DoubleSide} /></instancedMesh>;
}

/* Yi Peng: lanterns rise from the riverside after dark */
export function Lanterns() {
  const N = 220, geo = useMemo(() => new THREE.BufferGeometry(), []);
  const seeds = useMemo(() => { const r = rng(31), [RX, RZ] = toW(18.789, 99.003); return Array.from({ length: N }, () => ({ x: RX + (r() - .5) * 2.2, z: RZ + (r() - .5) * 3.4, o: r(), sp: .012 + r() * .012, sw: r() * 6 })); }, []);
  const pos = useMemo(() => { const a = new Float32Array(N * 3); geo.setAttribute('position', new THREE.BufferAttribute(a, 3)); return a; }, [geo]);
  const mat = useMemo(() => new THREE.PointsMaterial({ map: glowTexture(), size: .2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffc47a', toneMapped: false }), []);
  useFrame(() => { mat.opacity = Math.max(0, clock.night - .2) / .8; if (mat.opacity <= 0) return;
    seeds.forEach((l, i) => { const p = (clock.t * l.sp + l.o) % 1; pos[i * 3] = l.x + Math.sin(clock.t * .5 + l.sw) * .35 * p; pos[i * 3 + 1] = .12 + p * 6.5; pos[i * 3 + 2] = l.z + Math.cos(clock.t * .4 + l.sw) * .3 * p; });
    geo.attributes.position.needsUpdate = true; });
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}
export { glowTexture };
