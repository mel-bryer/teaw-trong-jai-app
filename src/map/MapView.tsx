// The 3D model of the Chiang Mai valley, with its post-processing:
// bloom for lanterns and city lights, a tilt-shift blur so it reads as a miniature, and a soft vignette.
import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, Bloom, TiltShift2, Vignette, SMAA } from '@react-three/postprocessing';
import * as THREE from 'three';
import { loadGeo } from '../lib/geo';
import { useUI } from '../lib/ui';
import { Terrain, useTerrainGeometry } from './Terrain';
import { Water } from './Water';
import { Forest, Clouds, Birds, Lanterns } from './Nature';
import { Buildings, Landmarks } from './City';
import { Light } from './Light';
import { VibeGlow, CityGlow, Stems, Arcs } from './Overlays';
import { Rig } from './Rig';

export function MapView() {
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false), quality = useUI((s) => s.quality), cover = useUI((s) => s.cover);
  useEffect(() => { loadGeo().then(() => setReady(true), () => setFailed(true)); }, []);
  if (failed) return <p className="map-error">โหลดข้อมูลแผนที่ไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</p>;
  if (!ready) return null;
  const stride = quality === 'low' ? 2 : 1;
  return (
    <Canvas className="map3d" frameloop={cover ? 'never' : 'always'} shadows={quality !== 'low' ? 'soft' : false} dpr={quality === 'high' ? [1, 1.5] : quality === 'medium' ? [1, 1.25] : 1}
      camera={{ fov: 38, near: .1, far: 420, position: [-10, 26, 30] }} gl={{ antialias: quality !== 'high', powerPreference: 'high-performance', toneMapping: THREE.NeutralToneMapping }}
      aria-label="แผนที่สามมิติของเชียงใหม่จากภูมิประเทศจริง ลากเพื่อเลื่อน คลิกขวาหรือสองนิ้วเพื่อหมุน เลื่อนล้อหรือถ่างนิ้วเพื่อซูม" tabIndex={0}>
      <PerformanceMonitor flipflops={3} onDecline={stepDown} />
      <Light quality={quality} />
      <Suspense fallback={null}>
        <World stride={stride} quality={quality} />
      </Suspense>
      <Rig />
      {quality !== 'low' && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom mipmapBlur luminanceThreshold={.82} luminanceSmoothing={.2} intensity={.9} />
          <TiltShift2 blur={quality === 'high' ? .12 : .08} taper={.6} start={[.5, .18]} end={[.5, .82]} />
          <Vignette offset={.32} darkness={.42} />
          {quality === 'high' ? <SMAA /> : <></>}
        </EffectComposer>
      )}
    </Canvas>
  );
}

/* when the frame rate stays low, drop one quality step (at most once every 8 s) instead of freezing */
let lastStep = 0;
function stepDown() {
  const ui = useUI.getState(), now = performance.now();
  if (ui.quality === 'low' || now - lastStep < 8000) return;
  lastStep = now; const q = ui.quality === 'high' ? 'medium' : 'low';
  ui.setQuality(q); ui.say(q === 'medium' ? 'ลดคุณภาพภาพเป็นกลางเพื่อให้ลื่นขึ้น' : 'ลดคุณภาพภาพเป็นต่ำเพื่อให้ลื่นขึ้น');
}

function World({ stride, quality }: { stride: number; quality: 'high' | 'medium' | 'low' }) {
  const { g } = useTerrainGeometry(stride);
  return (<group>
    <Terrain stride={stride} />
    <Water />
    <Forest quality={quality} />
    <Buildings quality={quality} />
    <Landmarks />
    <VibeGlow geometry={g} />
    <CityGlow geometry={g} />
    <Stems />
    <Arcs />
    <Clouds />
    <Birds />
    <Lanterns />
  </group>);
}
