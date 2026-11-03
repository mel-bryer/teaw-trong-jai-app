import { useEffect, useRef } from 'react';
import { liveCanvas, unlive } from '../lib/scenes';
import type { Scene } from '../data/content';

/* a painted scene that keeps moving while it is on screen */
export function LiveCanvas({ scene, className }: { scene: Scene | (() => Scene); className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null), sc = useRef(scene);
  sc.current = scene;
  useEffect(() => { const cv = ref.current!; liveCanvas(cv, () => (typeof sc.current === 'function' ? sc.current() : sc.current)); return () => unlive(cv); }, []);
  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
