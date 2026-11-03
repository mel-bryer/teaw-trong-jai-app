// Turns dist/index.html into the page body a claude.ai Artifact expects (it adds its own doctype, head and body),
// and lists every file to publish beside it. Run after `npm run build`: node scripts/artifact.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const js = html.match(/src="\.\/(assets\/[^"]+\.js)"/)[1], css = html.match(/href="\.\/(assets\/[^"]+\.css)"/)[1];
const page = `<title>เที่ยวตรงใจ เชียงใหม่</title>
<meta name="description" content="แผนที่เชียงใหม่สามมิติจากภูมิประเทศจริง เลือกภาพห้าภาพแล้วแผนที่จะพาไปที่เที่ยว ร้านอาหาร และที่พักที่ตรงกับ vibe ของคุณ">
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600&family=Fahkwang:wght@500;600;700&display=swap">
<link rel="stylesheet" href="${css}">
<div id="root"></div>
<script type="module" src="${js}"></script>
`;
writeFileSync(join(DIST, 'artifact.html'), page);
const files = { [js]: join(DIST, js), [css]: join(DIST, css) };
for (const f of readdirSync(join(DIST, 'data'))) files[`data/${f}`] = join(DIST, 'data', f);
writeFileSync(join(DIST, 'artifact-files.json'), JSON.stringify(files, null, 1));
console.log(Object.keys(files).join('\n'));
