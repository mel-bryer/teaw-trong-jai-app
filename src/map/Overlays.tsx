// What the map says about you: a warm wash over the districts that match your vibe, pin stems,
// and flowing arcs from the place you chose to what is near it.
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ZONES, CAT } from '../data/content';
import { usePlaces, placeById } from '../lib/biz';
import { hAt, toW, PIN_H } from '../lib/geo';
import { useProfile, matchOf, nearbyOf, otherCats } from '../lib/profile';
import { useUI } from '../lib/ui';
import { clock } from './clock';
import { glowTexture } from './Nature';

const cssColor = (name: string) => new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#e2862b');
let accentFor = '', accent = new THREE.Color('#e2862b');
const accentNow = () => { const t = document.documentElement.dataset.theme || ''; if (t !== accentFor) { accentFor = t; accent = cssColor('--accent'); } return accent; };

export function VibeGlow({ geometry }: { geometry: THREE.BufferGeometry }) {
  const profile = useProfile((s) => s.profile);
  const u = useMemo(() => ({ uZ: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) }, uC: { value: new THREE.Color('#e2862b') }, uTime: { value: 0 }, uOn: { value: 0 } }), []);
  useMemo(() => { ZONES.forEach((z, k) => { const [X, Z] = toW(z.lat, z.lng), w = profile ? Math.max(0, (matchOf(z.vec, profile) - 62) / 30) : 0; u.uZ.value[k].set(X, Z, z.r / 10 * 1.15, Math.min(1, w)); }); u.uOn.value = profile ? 1 : 0; }, [profile, u]);
  useFrame(() => { u.uTime.value = clock.t; u.uC.value.copy(accentNow()); });
  return <mesh geometry={geometry} renderOrder={3}>
    <shaderMaterial transparent depthWrite={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-6} uniforms={u}
      vertexShader="varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }"
      fragmentShader={`uniform vec4 uZ[8]; uniform vec3 uC; uniform float uTime,uOn; varying vec3 vW;
        void main(){ float g=0.0; for(int i=0;i<8;i++){ vec2 d=(vW.xz-uZ[i].xy)/max(uZ[i].z,.01); g=max(g,uZ[i].w*exp(-dot(d,d)*1.5)); }
          float ring=smoothstep(.06,.0,abs(fract(g*3.0-uTime*.25)-.5)-.44)*.3;
          gl_FragColor=vec4(uC,(g*.34+ring*g)*uOn*(.85+.15*sin(uTime*1.6)));
          #include <colorspace_fragment>
        }`} />
  </mesh>;
}

export function Stems() {
  const cats = useUI((s) => s.cats), places = usePlaces();
  const geo = useMemo(() => {
    const pos: number[] = [], col: number[] = [];
    const cc = { see: cssColor('--c-see'), eat: cssColor('--c-eat'), stay: cssColor('--c-stay') }, ev = cssColor('--c-event');
    for (const p of places) { if (!cats[p.cat]) continue; const [X, Z] = toW(p.lat, p.lng), g = hAt(X, Z), c = p.event ? ev : cc[p.cat]; pos.push(X, g, Z, X, g + PIN_H, Z); col.push(c.r, c.g, c.b, c.r, c.g, c.b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g;
  }, [cats, places]);
  return <lineSegments geometry={geo}><lineBasicMaterial vertexColors transparent opacity={.9} /></lineSegments>;
}

export function Arcs() {
  const focus = useUI((s) => s.focus), profile = useProfile((s) => s.profile);
  const time = useMemo(() => ({ value: 0 }), []);
  const arcs = useMemo(() => {
    const p = placeById(focus); if (!p) return [];
    const [AX, AZ] = toW(p.lat, p.lng), A = new THREE.Vector3(AX, hAt(AX, AZ) + PIN_H, AZ);
    return otherCats(p).flatMap((c) => nearbyOf(p, c, profile).map(({ q }) => {
      const [BX, BZ] = toW(q.lat, q.lng), B = new THREE.Vector3(BX, hAt(BX, BZ) + PIN_H, BZ), M = A.clone().add(B).multiplyScalar(.5); M.y = Math.max(A.y, B.y) + .5 + A.distanceTo(B) * .32;
      return { key: q.id, geo: new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, M, B), 48, .02, 6, false), color: cssColor(CAT[q.cat].c) };
    }));
  }, [focus, profile]);
  useFrame(() => { time.value = clock.t; });
  return <group>{arcs.map((a) => (
    <mesh key={a.key} geometry={a.geo}>
      <shaderMaterial transparent depthWrite={false} uniforms={{ uTime: time, uC: { value: a.color } }}
        vertexShader="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }"
        fragmentShader={'uniform float uTime; uniform vec3 uC; varying vec2 vUv; void main(){ float d=fract(vUv.x*6.0-uTime*.9); float a=smoothstep(0.0,.2,d)*smoothstep(1.0,.55,d); gl_FragColor=vec4(uC*(1.0+a*.6),(.35+.65*a)*smoothstep(0.0,.06,vUv.x)*smoothstep(1.0,.94,vUv.x));\n#include <colorspace_fragment>\n}'} />
    </mesh>))}</group>;
}

/* night: warm pools of city light on the ground, and a faint haze rising over them, so the eye lands on where the evening is */
const POOLS: [number, number, number, number][] = [[18.7885, 98.9880, 1.1, 1], [18.7990, 98.9670, .75, .85], [18.7860, 99.0010, .8, .9], [18.8000, 99.0150, .9, .5], [18.7700, 98.9900, .9, .45]];
export function CityGlow({ geometry }: { geometry: THREE.BufferGeometry }) {
  const u = useMemo(() => ({ uP: { value: POOLS.map(([lat, lng, r, w]) => { const [X, Z] = toW(lat, lng); return new THREE.Vector4(X, Z, r, w); }) }, uNight: { value: 0 }, uTime: { value: 0 } }), []);
  const haze = useMemo(() => POOLS.slice(0, 3).map(([lat, lng, r]) => { const [X, Z] = toW(lat, lng); return { X, Z, r, g: hAt(X, Z) }; }), []);
  const hazeMat = useMemo(() => new THREE.SpriteMaterial({ map: glowTexture(), color: '#ffb46a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }), []);
  useFrame(() => { const n = clock.night; u.uNight.value = n; u.uTime.value = clock.t; hazeMat.opacity = n * .16; });
  return <group>
    <mesh geometry={geometry} renderOrder={2}>
      <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-4} uniforms={u} toneMapped={false}
        vertexShader="varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }"
        fragmentShader={`uniform vec4 uP[5]; uniform float uNight,uTime; varying vec3 vW;
          void main(){ float g=0.0; for(int i=0;i<5;i++){ vec2 d=(vW.xz-uP[i].xy)/uP[i].z; g+=uP[i].w*exp(-dot(d,d)*1.6); }
            g*=uNight*(.92+.08*sin(uTime*.7)); gl_FragColor=vec4(vec3(1.0,.62,.28)*g*.24,1.0); }`} />
    </mesh>
    {haze.map((h, k) => <sprite key={k} material={hazeMat} position={[h.X, h.g + .9, h.Z]} scale={[h.r * 5.5, h.r * 2.6, 1]} />)}
  </group>;
}
