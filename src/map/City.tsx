// The city as a model: every building footprint from OpenStreetMap raised into a block, the old city's temples and gates,
// and window lights that come on after dusk.
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getGeo, hAt, toW } from '../lib/geo';
import { clock } from './clock';
import { glowTexture } from './Nature';
import type { Quality } from '../lib/ui';

const ROOFS = ['#e9dccd', '#f3ece2', '#dccbb8', '#d99a74', '#f7f3ec', '#cdbfb2', '#e7b38a', '#c9d3d6'];

export function Buildings({ quality }: { quality: Quality }) {
  const { geo, mat, lights, lightMat } = useMemo(() => {
    const { buildings, meta: { vex } } = getGeo(), minArea = quality === 'low' ? 2.2e-4 : quality === 'medium' ? 6e-5 : 0;
    const pos: number[] = [], nor: number[] = [], col: number[] = [], idx: number[] = [], c = new THREE.Color(), wall = new THREE.Color('#fbf6ee');
    const lp: number[] = [];
    buildings.forEach((b, bi) => {
      const n = b.pts.length / 2; if (n < 3) return;
      let cx = 0, cz = 0, a = 0;
      for (let i = 0; i < n; i++) { const x0 = b.pts[i * 2], z0 = b.pts[i * 2 + 1], x1 = b.pts[((i + 1) % n) * 2], z1 = b.pts[((i + 1) % n) * 2 + 1]; cx += x0; cz += z0; a += x0 * z1 - x1 * z0; }
      cx /= n; cz /= n; if (Math.abs(a / 2) < minArea) return;
      const base = hAt(cx, cz) - .01, top = base + .012 + Math.min(30, Math.max(4, b.h)) * vex * 2.6;
      c.set(b.temple ? '#e0a040' : ROOFS[bi % ROOFS.length]);
      // walls
      for (let i = 0; i < n; i++) {
        const x0 = b.pts[i * 2], z0 = b.pts[i * 2 + 1], x1 = b.pts[((i + 1) % n) * 2], z1 = b.pts[((i + 1) % n) * 2 + 1];
        let nx = z1 - z0, nz = -(x1 - x0); const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
        if (nx * ((x0 + x1) / 2 - cx) + nz * ((z0 + z1) / 2 - cz) < 0) { nx = -nx; nz = -nz; }
        const q = pos.length / 3;
        pos.push(x0, base, z0, x1, base, z1, x1, top, z1, x0, top, z0);
        for (let k = 0; k < 4; k++) { nor.push(nx, 0, nz); col.push(wall.r * (k > 1 ? 1 : .9), wall.g * (k > 1 ? 1 : .9), wall.b * (k > 1 ? 1 : .9)); }
        idx.push(q, q + 1, q + 2, q, q + 2, q + 3);
      }
      // roof
      const contour = Array.from({ length: n }, (_, i) => new THREE.Vector2(b.pts[i * 2], b.pts[i * 2 + 1]));
      const tris = THREE.ShapeUtils.triangulateShape(contour, []), q = pos.length / 3;
      for (const p of contour) { pos.push(p.x, top, p.y); nor.push(0, 1, 0); col.push(c.r, c.g, c.b); }
      for (const t of tris) idx.push(q + t[0], q + t[1], q + t[2]);
      if (bi % 3 === 0) lp.push(cx, top + .004, cz);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
    geo.computeBoundingSphere();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85, side: THREE.DoubleSide, emissive: '#ffb04a', emissiveIntensity: 0 });
    const lights = new THREE.BufferGeometry(); lights.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    const lightMat = new THREE.PointsMaterial({ map: glowTexture(), size: .035, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#ffd08a', toneMapped: false });
    return { geo, mat, lights, lightMat };
  }, [quality]);
  useFrame(() => { mat.color.setScalar(1 - clock.night * .7); mat.emissiveIntensity = clock.night * .035; lightMat.opacity = clock.night * (.8 + .2 * Math.sin(clock.t * 2.1)); });
  return <group><mesh geometry={geo} material={mat} castShadow receiveShadow /><points geometry={lights} material={lightMat} /></group>;
}

/* landmarks, scaled up a little so you can find them from the overview */
export function Landmarks() {
  const parts = useMemo(() => {
    const at = (lat: number, lng: number) => { const [X, Z] = toW(lat, lng); return [X, hAt(X, Z), Z] as [number, number, number]; };
    return { doisuthep: at(18.8048, 98.9216), chediluang: at(18.7869, 98.9867), phrasingh: at(18.7884, 98.9819), thaphae: at(18.7877, 98.9937) };
  }, []);
  const gold = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e8b54a', metalness: .65, roughness: .28, emissive: '#7a4a08', emissiveIntensity: 0 }), []);
  const brick = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a8643f', roughness: .9 }), []);
  const white = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f4efe6', roughness: .7 }), []);
  useFrame(() => { gold.emissiveIntensity = .15 + clock.night * 1.4; });
  return (<group>
    <Chedi at={parts.doisuthep} s={1.7} body={gold} base={white} />
    <Chedi at={parts.phrasingh} s={1.1} body={gold} base={white} />
    <group position={parts.chediluang} scale={1.6}>
      {[[.24, .05, .025], [.19, .05, .075], [.14, .05, .125], [.1, .05, .175]].map(([w, h, y], i) => <mesh key={i} position-y={y} material={brick} castShadow receiveShadow><boxGeometry args={[w, h, w]} /></mesh>)}
      <mesh position-y={.24} material={brick} castShadow><coneGeometry args={[.05, .08, 4]} /></mesh>
    </group>
    <group position={parts.thaphae} scale={1.4}>
      <mesh position={[0, .05, -.07]} material={brick} castShadow><boxGeometry args={[.05, .1, .1]} /></mesh>
      <mesh position={[0, .05, .07]} material={brick} castShadow><boxGeometry args={[.05, .1, .1]} /></mesh>
      <mesh position={[0, .1, 0]} material={brick} castShadow><boxGeometry args={[.05, .025, .24]} /></mesh>
    </group>
  </group>);
}
function Chedi({ at, s, body, base }: { at: [number, number, number]; s: number; body: THREE.Material; base: THREE.Material }) {
  return (<group position={at} scale={s}>
    <mesh position-y={.025} material={base} castShadow receiveShadow><boxGeometry args={[.24, .05, .24]} /></mesh>
    <mesh position-y={.07} material={base} castShadow><boxGeometry args={[.18, .04, .18]} /></mesh>
    <mesh position-y={.1} material={body} castShadow><cylinderGeometry args={[.07, .08, .02, 20]} /></mesh>
    <mesh position-y={.16} scale-y={1.2} material={body} castShadow><sphereGeometry args={[.075, 24, 16, 0, Math.PI * 2, 0, Math.PI * .6]} /></mesh>
    {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position-y={.225 + i * .018} material={body}><cylinderGeometry args={[.022 - i * .003, .025 - i * .003, .012, 16]} /></mesh>)}
    <mesh position-y={.38} material={body} castShadow><coneGeometry args={[.012, .2, 12]} /></mesh>
  </group>);
}
