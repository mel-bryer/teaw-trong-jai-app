// Light by the hour: the sun crosses from the paddies in the east to Doi Suthep in the west, then the moon, a starry dome and fog that follows the sky.
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { rng } from '../lib/geo';
import { useUI, type Quality } from '../lib/ui';
import { clock, stepClock, reducedMotion } from './clock';

const C = (h: string) => new THREE.Color(h);
const SKY = {
  day: { top: C('#8fb6d4'), mid: C('#dfe9ee'), low: C('#f5ecdc') },
  dusk: { top: C('#3a3f78'), mid: C('#c98f8a'), low: C('#f2b47c') },
  night: { top: C('#070b26'), mid: C('#1b2052'), low: C('#4a2a5e') },
};
const mix3 = (a: THREE.Color, b: THREE.Color, c: THREE.Color, n: number, out: THREE.Color) => (n < .5 ? out.copy(a).lerp(b, n * 2) : out.copy(b).lerp(c, (n - .5) * 2));

export function Light({ quality }: { quality: Quality }) {
  const sun = useRef<THREE.DirectionalLight>(null), hemi = useRef<THREE.HemisphereLight>(null);
  const scene = useThree((s) => s.scene), gl = useThree((s) => s.gl);
  /* shadows are drawn again only when the sun moves, not every frame: 22,000 buildings and 14,000 trees are costly to redraw */
  const shadowAt = useRef(new THREE.Vector3()), warm = useRef(0);
  useMemo(() => { gl.shadowMap.autoUpdate = false; gl.shadowMap.needsUpdate = true; warm.current = 0; }, [gl, quality]);
  const sky = useMemo(() => ({ uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uLow: { value: new THREE.Color() } }), []);
  const fog = useMemo(() => { const f = new THREE.Fog('#e9eeee', 60, 170); scene.fog = f; return f; }, [scene]);
  const target = useMemo(() => new THREE.Object3D(), []);
  const stars = useMemo(() => { const r = rng(77), p: number[] = []; for (let i = 0; i < 900; i++) { const a = r() * Math.PI * 2, e = Math.asin(.12 + r() * .88), R = 180; p.push(Math.cos(a) * Math.cos(e) * R, Math.sin(e) * R, Math.sin(a) * Math.cos(e) * R); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g; }, []);
  const starMat = useMemo(() => new THREE.PointsMaterial({ color: '#fff7e6', size: 1.4, sizeAttenuation: false, transparent: true, depthWrite: false, fog: false, toneMapped: false }), []);
  const tmp = useMemo(() => ({ a: new THREE.Color(), b: new THREE.Color() }), []);
  const mapSize = quality === 'high' ? 4096 : 2048;

  useFrame((_, dt) => {
    stepClock(useUI.getState().hour, Math.min(.5, dt), reducedMotion);
    const h = clock.hour, n = clock.night, dayT = Math.min(1, Math.max(0, (h - 6) / 12));
    const az = (95 + dayT * 170) * Math.PI / 180, el = Math.max(.08, Math.sin(Math.PI * dayT)) * 66 * Math.PI / 180;
    const moonAz = 250 * Math.PI / 180, moonEl = 42 * Math.PI / 180;
    const A = n > .5 ? moonAz : az, E = n > .5 ? moonEl : el;
    if (sun.current) {
      sun.current.position.set(Math.sin(A) * Math.cos(E) * 40, Math.sin(E) * 40, -Math.cos(A) * Math.cos(E) * 40);
      const dusk = Math.max(0, 1 - Math.abs(n - .5) * 2), low = 1 - Math.sin(Math.PI * dayT);
      sun.current.color.set('#fff1dc').lerp(tmp.a.set('#ffb070'), Math.min(1, low * .9 + dusk * .6)).lerp(tmp.b.set('#b8c8ff'), n);
      sun.current.intensity = THREE.MathUtils.lerp(2.6, 1.15, n) * (1 - dusk * .45); // the moon is bright enough to shade the ridges
      warm.current++;
      if (shadowAt.current.distanceToSquared(sun.current.position) > .04 || (warm.current < 240 && warm.current % 20 === 0)) { shadowAt.current.copy(sun.current.position); gl.shadowMap.needsUpdate = true; }
    }
    if (hemi.current) { hemi.current.intensity = THREE.MathUtils.lerp(1.5, .8, n); hemi.current.color.set('#eef2f0').lerp(tmp.a.set('#8496d8'), n); hemi.current.groundColor.set('#6b7a5e').lerp(tmp.b.set('#2a2450'), n); }
    mix3(SKY.day.top, SKY.dusk.top, SKY.night.top, n, sky.uTop.value); mix3(SKY.day.mid, SKY.dusk.mid, SKY.night.mid, n, sky.uMid.value); mix3(SKY.day.low, SKY.dusk.low, SKY.night.low, n, sky.uLow.value);
    fog.color.copy(sky.uMid.value);
    starMat.opacity = Math.max(0, n - .35) / .65;
  });
  return (<group>
    <hemisphereLight ref={hemi} />
    <primitive object={target} />
    <directionalLight ref={sun} castShadow target={target} shadow-mapSize={[mapSize, mapSize]} shadow-bias={-.0004} shadow-normalBias={.025}
      shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-camera-near={1} shadow-camera-far={90} />
    <mesh scale={190} renderOrder={-1}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial side={THREE.BackSide} depthWrite={false} fog={false} uniforms={sky}
        vertexShader="varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }"
        fragmentShader={'uniform vec3 uTop,uMid,uLow; varying vec3 vP; void main(){ float y=normalize(vP).y; vec3 c=y>0.0?mix(uMid,uTop,pow(y,.6)):mix(uMid,uLow,min(1.0,-y*3.0)); gl_FragColor=vec4(c,1.0);\n#include <colorspace_fragment>\n}'} />
    </mesh>
    <points geometry={stars} material={starMat} />
  </group>);
}
