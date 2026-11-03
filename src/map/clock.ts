// One shared, smoothed clock for the scene: components read it inside useFrame instead of re-rendering.
import { nightOf } from '../lib/ui';

export const clock = { hour: 7.5, night: 0, t: 0 };
export function stepClock(target: number, dt: number, reduced: boolean) {
  const k = reduced ? 1 : 1 - Math.exp(-dt * 2.5);
  clock.hour += (target - clock.hour) * k;
  clock.night = nightOf(clock.hour);
  clock.t += reduced ? 0 : dt;
}
export const reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
