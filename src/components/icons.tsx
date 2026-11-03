// One icon set, drawn on a 24 grid with a 1.8 stroke.
const P: Record<string, string> = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  layers: '<path d="M3 17l9 4 9-4M3 12l9 4 9-4M12 3l9 4-9 4-9-4z"/>',
  target: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', shrink: '<path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/>',
  up: '<path d="M6 15l6-6 6 6"/>', clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.2c-.5-.8-1.4-1.2-2.5-1.2-1.4 0-2.5.8-2.5 1.9 0 2.6 5.2 1.4 5.2 4.1 0 1.1-1.2 2-2.7 2-1.2 0-2.2-.5-2.7-1.3M12 6.5v11"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  route: '<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8 18h7.5a3 3 0 0 0 0-6h-7a3 3 0 0 1 0-6H16"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  go: '<path d="M5 12h13M13 6l6 6-6 6"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
  pause: '<path d="M9 6v12M15 6v12"/>', play: '<path d="M8 5l11 7-11 7z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  moon: '<path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z"/>',
  bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 20.5a2 2 0 0 0 4 0"/>',
  store: '<path d="M4 9.5L5.5 4h13L20 9.5M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5.5 12v8h13v-8M10 20v-4.5h4V20"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  phone: '<path d="M6.5 3.5h3l1.5 4-2 1.3a11 11 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z"/>',
  chat: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M10.5 21l2-6-2.5-2.5 1-5 3 3 3 1M10 8l-3 2.5V14M12.5 15l2.5 6"/>',
  bike: '<circle cx="5.5" cy="16.5" r="3"/><circle cx="18.5" cy="16.5" r="3"/><path d="M5.5 16.5l4-6h6l3 6M13 6.5h2.5l1 4M9 10.5H6.5"/>',
  songthaew: '<path d="M3 15V8a2 2 0 0 1 2-2h9l4 3.5h1.5A1.5 1.5 0 0 1 21 11v4zM3 15h18M14 6v9M8 6v9"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  car: '<path d="M4 15.5v-3.5l2-5h12l2 5v3.5zM4 12h16"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  feed: '<rect x="6" y="3" width="12" height="18" rx="3"/><path d="M10.5 9.5l4 2.5-4 2.5z"/>',
  camera: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.5l1.5-2h5L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.5" r="3.5"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z"/><path d="M8.8 12l2.2 2.2 4.2-4.4"/>',
  skip: '<circle cx="12" cy="12" r="8.5"/><path d="M8 8l8 8"/>',
};
export function Icon({ name, fill }: { name: keyof typeof P | string; fill?: boolean }) {
  return <svg className="i" viewBox="0 0 24 24" aria-hidden="true" style={fill ? { fill: 'currentColor' } : undefined} dangerouslySetInnerHTML={{ __html: P[name] }} />;
}
export const Brand = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l1.2 4h-2.4zM10.4 7h3.2l.6 2.2c1.9.7 3.3 2.4 3.3 4.4 0 .6-.1 1.1-.3 1.6H6.8c-.2-.5-.3-1-.3-1.6 0-2 1.4-3.7 3.3-4.4zM5 16.5h14v1.6H5zM4 19.3h16V21H4z" /></svg>;
export const Compass = () => <svg className="i" viewBox="0 0 24 24" aria-hidden="true" id="compass-needle"><path d="M12 3l3.2 9H8.8z" fill="currentColor" /><path d="M8.8 12h6.4L12 21z" /></svg>;
export function Ring({ m, size = 18, sw = 3 }: { m: number; size?: number; sw?: number }) {
  const r = (size - sw) / 2, C = 2 * Math.PI * r;
  return <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true"><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth={sw} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${C * m / 100} ${C}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} /></svg>;
}
