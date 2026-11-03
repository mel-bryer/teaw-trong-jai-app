// Water that moves: the Ping and the canals flow, the moat and the reservoirs ripple, long-tail boats travel the river.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getGeo, hAt, rng } from '../lib/geo';
import { clock } from './clock';

export const waterUniforms = { uTime: { value: 0 }, uNight: { value: 0 }, uHalf: { value: new THREE.Vector2(15.6, 15) } };

const waterMaterial = () => new THREE.ShaderMaterial({
  uniforms: waterUniforms, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
  fragmentShader: `uniform float uTime,uNight; varying vec2 vUv; varying vec3 vW;
    uniform vec2 uHalf;
    void main(){
      if(abs(vW.x)>uHalf.x||abs(vW.z)>uHalf.y) discard;
      vec3 deep=mix(vec3(.30,.56,.68),vec3(.07,.16,.32),uNight), light=mix(vec3(.80,.94,.96),vec3(.42,.56,.86),uNight);
      float a=sin(vUv.x*3.1-uTime*1.9+sin(vUv.y*6.3+uTime*.7)*1.3)*.5+.5, b=sin(vUv.x*1.3+vW.z*2.0-uTime*1.1)*.5+.5;
      float sp=pow(max(0.0,sin(vW.x*41.0+uTime*2.3)*sin(vW.z*37.0-uTime*1.7)),12.0);
      float edge=smoothstep(0.0,.22,vUv.y)*smoothstep(1.0,.78,vUv.y);
      vec3 c=mix(deep,light,pow(a*b,1.6)*.8)+sp*mix(.5,.9,uNight)*vec3(1.0,.9,.7);
      gl_FragColor=vec4(c,.93*edge);
      #include <colorspace_fragment>
    }`,
});

export function Water() {
  const { geometry, lakes, ping } = useMemo(() => {
    const { water } = getGeo();
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    let ping: THREE.CatmullRomCurve3 | null = null, best = 0;
    for (const r of water.rivers) {
      if (r.p.length < 2 || r.w < .05) continue;
      const v = r.p.map(([x, z]) => new THREE.Vector3(x, 0, z)), curve = new THREE.CatmullRomCurve3(v, false, 'centripetal');
      const len = curve.getLength(), n = Math.max(2, Math.ceil(len / .06)), sp = curve.getSpacedPoints(n), base = pos.length / 3;
      if (r.w > .1 && len > best) { best = len; ping = curve; }
      for (let i = 0; i < sp.length; i++) {
        const a = sp[Math.max(0, i - 1)], b = sp[Math.min(sp.length - 1, i + 1)], dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * r.w / 2, nz = dx / l * r.w / 2, p = sp[i];
        for (const s of [-1, 1]) { const x = p.x + nx * s, z = p.z + nz * s; pos.push(x, hAt(x, z) + .03, z); uv.push(i / n * len * 2.2, s < 0 ? 0 : 1); }
        if (i < sp.length - 1) { const q = base + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
      }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(idx);
    // lakes and the moat, each flat at the lowest ground on its shore
    const lp: number[] = [], lu: number[] = [], li: number[] = [];
    for (const ring of water.lakes) {
      const c = ring.map(([x, z]) => new THREE.Vector2(x, z)); if (c.length > 2 && c[0].equals(c[c.length - 1])) c.pop(); if (c.length < 3) continue;
      const y = Math.min(...c.map((p) => hAt(p.x, p.y))) + .028, tris = THREE.ShapeUtils.triangulateShape(c, []), base = lp.length / 3;
      for (const p of c) { lp.push(p.x, y, p.y); lu.push(p.x * 1.2 + p.y * .8, .5); }
      for (const t of tris) li.push(base + t[0], base + t[1], base + t[2]);
    }
    const lakes = new THREE.BufferGeometry(); lakes.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lakes.setAttribute('uv', new THREE.Float32BufferAttribute(lu, 2)); lakes.setIndex(li);
    return { geometry, lakes, ping };
  }, []);
  const mat = useMemo(waterMaterial, []), lakeMat = useMemo(() => { const m = waterMaterial(); m.side = THREE.DoubleSide; return m; }, []);
  useFrame(() => { waterUniforms.uTime.value = clock.t; waterUniforms.uNight.value = clock.night; });
  return (<group>
    <mesh geometry={geometry} material={mat} renderOrder={2} />
    <mesh geometry={lakes} material={lakeMat} renderOrder={2} />
    {ping && <Boats curve={ping} />}
  </group>);
}

/* long-tail boats: a hull and a canopy, drifting up and down the Ping */
function Boats({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const N = 6, refs = useRef<THREE.Group[]>([]);
  const seeds = useMemo(() => { const r = rng(17); return Array.from({ length: N }, () => ({ o: r(), sp: (.004 + r() * .004) * (r() < .5 ? 1 : -1), side: (r() - .5) * .06 })); }, []);
  const lamp = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    seeds.forEach((s, i) => { const g = refs.current[i]; if (!g) return; const u = ((s.o + clock.t * s.sp) % 1 + 1) % 1, p = curve.getPointAt(u), t = curve.getTangentAt(u);
      g.position.set(p.x + t.z * s.side, hAt(p.x, p.z) + .045, p.z - t.x * s.side); g.rotation.y = Math.atan2(t.x, t.z) + (s.sp < 0 ? Math.PI : 0); });
    if (lamp.current) lamp.current.emissiveIntensity = clock.night * 3;
  });
  return (<group>{seeds.map((_, i) => (
    <group key={i} ref={(g) => { if (g) refs.current[i] = g; }} scale={1.6}>
      <mesh castShadow position-y={.008}><boxGeometry args={[.028, .014, .11]} /><meshStandardMaterial color="#6b4a2f" roughness={.8} /></mesh>
      <mesh position={[0, .024, -.01]}><boxGeometry args={[.03, .004, .05]} /><meshStandardMaterial color="#d9433b" roughness={.7} /></mesh>
      <mesh position={[0, .03, .05]}><sphereGeometry args={[.006, 8, 6]} /><meshStandardMaterial ref={i === 0 ? lamp : undefined} color="#ffd38a" emissive="#ffb24a" emissiveIntensity={0} /></mesh>
    </group>))}</group>);
}
