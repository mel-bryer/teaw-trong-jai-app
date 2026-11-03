// Headless walkthrough for checking the app: node scripts/shoot.mjs <url> <out-prefix> <width>x<height> [flow]
// Opens the map, optionally takes the quiz, opens a place, and sets the clock to night, saving a screenshot at each step.
import puppeteer from 'puppeteer-core';
const [url, out, size, mode = ''] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'], protocolTimeout: 300000 });
const page = await browser.newPage();
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + (e.stack || e.message).slice(0, 600)));
page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/GPU stall|GL Driver|favicon/.test(m.text())) logs.push(m.type() + ': ' + m.text().slice(0, 400)); });
page.on('response', (r) => { if (r.status() >= 400) logs.push(r.status() + ' ' + r.url().slice(0, 120)); });
await page.setViewport({ width: w, height: h, deviceScaleFactor: w < 600 ? 2 : 1, isMobile: w < 600, hasTouch: w < 600 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const click = (text) => page.evaluate((t) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(t))?.click(), text);
await page.goto(url, { waitUntil: 'load', timeout: 90000 });
await wait(4000);
await page.screenshot({ path: `${out}-0.png` });
await click('ดูแผนที่ก่อน');
await wait(9000);
await page.screenshot({ path: `${out}-1map.png` });
if (mode.includes('flow')) {
  await page.evaluate(() => { location.hash = '#/quiz'; }); await wait(800);
  await click('เริ่มเลือกภาพ');
  for (const k of [0, 1, 0, 0, 1]) { await wait(900); await page.evaluate((kk) => document.querySelectorAll('.tile')[kk]?.click(), k); }
  await wait(1500); await page.screenshot({ path: `${out}-2result.png` });
  await click('เปิดแผนที่ตามใจ');
  await wait(5000); await page.screenshot({ path: `${out}-3zone.png` });
  await page.evaluate(() => document.querySelector('.card')?.click());
  await wait(4500); await page.screenshot({ path: `${out}-4place.png` });
  await page.evaluate(() => document.querySelector('.d-close')?.click());
  await wait(3000); await page.screenshot({ path: `${out}-5close.png` });
  await page.evaluate(() => { const r = document.querySelector('.timebar input'); if (r) { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(r, '21'); r.dispatchEvent(new Event('input', { bubbles: true })); } });
  await wait(5000); await page.screenshot({ path: `${out}-6night.png` });
}
console.log(logs.slice(0, 25).join('\n') || 'no errors');
await browser.close();
