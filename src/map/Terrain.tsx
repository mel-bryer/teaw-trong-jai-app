// The valley block: real heights, the painted relief blending from morning to Yi Peng night, and cut sides like a table model.
import { useEffect, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { getGeo } from '../lib/geo';
import { useUI } from '../lib/ui';
import { clock } from './clock';
import { MAPTILER_KEY, satelliteTexture } from './satellite';

export const nightU = { value: 0 };
const satU = { value: 0 }; // 1 while the day map is the satellite photo

export function useTerrainGeometry(stride: number) {
  return useMemo(() => {
    const { meta: { NX, NY, SX, SZ, base, vex }, H } = getGeo();
    const nx = Math.floor((NX - 1) / stride) + 1, ny = Math.floor((NY - 1) / stride) + 1;
    const g = new THREE.PlaneGeometry(SX, SZ, nx - 1, ny - 1); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) p.setY(j * nx + i, (H[Math.min(NY - 1, j * stride) * NX + Math.min(NX - 1, i * stride)] - base) * vex);
    g.computeVertexNormals(); g.computeBoundingSphere();
    return { g, nx, ny };
  }, [stride]);
}

export function Terrain({ stride }: { stride: number }) {
  const quality = useUI((s) => s.quality), res = quality === 'high' ? 4096 : 2048;
  const [day, night] = useLoader(THREE.TextureLoader, [`data/terrain-day-${res}.jpg`, `data/terrain-night-${res}.jpg`]);
  const { g, nx, ny } = useTerrainGeometry(stride);
  const set = useUI((s) => s.set);
  useEffect(() => { set({ ready: true }); }, [set]);

  const mat = useMemo(() => {
    for (const t of [day, night]) { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; }
    const m = new THREE.MeshStandardMaterial({ map: day, roughness: .95, metalness: 0 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uNightMap = { value: night }; sh.uniforms.uNight = nightU; sh.uniforms.uSat = satU;
      sh.vertexShader = 'varying float vHgt;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vHgt = position.y;');
      /* at night the relief reads like a moonlit map: it lights itself a little, ridges get a silver rim, city pixels glow */
      sh.fragmentShader = 'uniform sampler2D uNightMap; uniform float uNight, uSat; varying float vHgt;\n' + sh.fragmentShader
        .replace('#include <map_fragment>', 'vec4 dayC = texture2D(map, vMapUv); vec4 nightC = texture2D(uNightMap, vMapUv); vec3 sat = mix(vec3(dot(dayC.rgb, vec3(.3, .59, .11))), dayC.rgb, .7); vec4 moonSat = vec4(sat * vec3(.62, .72, 1.0) * 1.15 + max(nightC.rgb - .3, 0.0) * 1.3, 1.0); nightC = mix(nightC, moonSat, uSat); diffuseColor *= mix(dayC, nightC, uNight);')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          float glowM = clamp((nightC.r - nightC.b) * 3.0, 0.0, 1.0);
          float ridge = smoothstep(.4, 3.2, vHgt);
          totalEmissiveRadiance += uNight * (nightC.rgb * (.34 + glowM * 1.1) + vec3(.16, .22, .42) * ridge * .55);`);
    };
    return m;
  }, [day, night]);

  /* satellite surface: swap the day map once the photos are stitched (night shows it moonlit), back to paint on toggle or failure */
  const surface = useUI((s) => s.surface);
  useEffect(() => {
    if (surface !== 'sat' || !MAPTILER_KEY) { mat.map = day; satU.value = 0; mat.needsUpdate = true; return; }
    let live = true;
    satelliteTexture(getGeo().meta, res).then((t) => { if (live) { mat.map = t; satU.value = 1; mat.needsUpdate = true; } })
      .catch(() => { if (live) { useUI.getState().setSurface('paint'); useUI.getState().say('โหลดภาพดาวเทียมไม่ได้ ตรวจ key ของ MapTiler'); } });
    return () => { live = false; };
  }, [surface, mat, day, res]);

  /* the cut sides: soil strata under the edge of the terrain */
  const sides = useMemo(() => {
    const p = g.attributes.position, pos: number[] = [], col: number[] = [], B = -.7, M = -.22;
    const top = new THREE.Color('#7a6646'), mid = new THREE.Color('#b08e62'), bot = new THREE.Color('#8b6a48');
    const P = (i: number, j: number) => { const k = j * nx + i; return [p.getX(k), p.getY(k), p.getZ(k)]; };
    const edge = (pts: number[][]) => { for (let k = 0; k < pts.length - 1; k++) { const a = pts[k], b = pts[k + 1];
      for (const [y0, y1, c0, c1] of [[null, M, top, mid], [M, B, mid, bot]] as [number | null, number, THREE.Color, THREE.Color][]) {
        const ay = y0 === null ? a[1] : y0, by = y0 === null ? b[1] : y0;
        pos.push(a[0], ay, a[2], b[0], by, b[2], b[0], y1, b[2], a[0], ay, a[2], b[0], y1, b[2], a[0], y1, a[2]);
        for (const c of [c0, c0, c1, c0, c1, c1]) col.push(c.r, c.g, c.b); } } };
    edge([...Array(nx).keys()].map((i) => P(i, 0))); edge([...Array(nx).keys()].map((i) => P(i, ny - 1)));
    edge([...Array(ny).keys()].map((j) => P(0, j))); edge([...Array(ny).keys()].map((j) => P(nx - 1, j)));
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); sg.computeVertexNormals();
    return sg;
  }, [g, nx, ny]);
  const sideMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 }), []);
  const { SX, SZ } = getGeo().meta;

  useFrame(() => { nightU.value = clock.night; sideMat.color.setScalar(1 - clock.night * .55); });
  return (
    <group>
      <mesh geometry={g} material={mat} receiveShadow castShadow />
      <mesh geometry={sides} material={sideMat} receiveShadow />
      <mesh rotation-x={Math.PI / 2} position-y={-.7}><planeGeometry args={[SX, SZ]} /><meshBasicMaterial color="#5e4a34" /></mesh>
      <ContactShadow />
    </group>
  );
}

function ContactShadow() {
  const tex = useMemo(() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d')!, gr = x.createRadialGradient(128, 128, 50, 128, 128, 128);
    gr.addColorStop(0, 'rgba(20,24,40,.35)'); gr.addColorStop(1, 'rgba(20,24,40,0)'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); }, []);
  return <mesh rotation-x={-Math.PI / 2} position-y={-.74}><planeGeometry args={[70, 68]} /><meshBasicMaterial map={tex} transparent depthWrite={false} /></mesh>;
}
