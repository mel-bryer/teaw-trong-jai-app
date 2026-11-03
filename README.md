# เที่ยวตรงใจ (prototype)

แผนที่เชียงใหม่แบบโมเดล 3D จากภูมิประเทศจริง พร้อม quiz vibe หน้าสถานที่ และโปรไฟล์

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

เปิด http://localhost:5173 (ใส่ `?t=8` หรือ `?t=21` ต่อท้ายเพื่อเริ่มตอนเช้าหรือคืนยี่เป็ง)
ลองบนมือถือในวง Wi-Fi เดียวกันได้ที่ที่อยู่ Network ที่ `npm run dev` แสดง

## โครงสร้าง

| ที่ | หน้าที่ |
| --- | --- |
| `src/App.tsx` | หน้าจอ: แผนที่อยู่ด้านล่างเสมอ, `#/quiz`, `#/place/:id`, `#/me` เปิดทับ |
| `src/screens/` | MapScreen (แถบบน เครื่องมือ แถบเวลา แผงที่ตรงใจ หมุด), Quiz, Place, Profile |
| `src/map/` | ฉาก 3D: Terrain, Water, Nature (ป่า เมฆ นก โคมลอย), City (ตึก แลนด์มาร์ก), Light (ดวงอาทิตย์ตามเวลา), Overlays, Rig (กล้องและหมุด), MapView (เอฟเฟกต์) |
| `src/data/content.ts` | สถานที่ 38 แห่ง ย่าน persona และ quiz (ข้อมูลตัวอย่าง) |
| `src/lib/profile.ts` | vibe ของผู้ใช้และสูตรคะแนนตรงใจ (เก็บใน localStorage แทนระบบหลังบ้าน) |
| `src/lib/scenes.ts` | ภาพวาดเคลื่อนไหวที่ใช้แทนภาพและคลิปจริง |
| `scripts/` | ดึงและอบข้อมูลแผนที่ ทดสอบ และเตรียมไฟล์ขึ้น Artifact |

## ข้อมูลแผนที่

```bash
node scripts/fetch-data.mjs   # ความสูง (AWS Terrain Tiles) และถนน น้ำ ตึก (OpenStreetMap) ลง data-raw/
node scripts/bake.mjs         # อบเป็น public/data: ความสูง ตึก น้ำ และผิวแผนที่กลางวัน/กลางคืน
```

ขอบเขตแผนที่อยู่ใน `scripts/extent.mjs` ต้องมี Google Chrome ในเครื่องสำหรับขั้นอบผิวแผนที่

เครดิต: ความสูงจาก SRTM ผ่าน AWS Terrain Tiles, ถนน น้ำ และตึก © OpenStreetMap contributors (ODbL)

## ขึ้น Artifact

```bash
npm run build
node scripts/artifact.mjs     # สร้าง dist/artifact.html และรายการไฟล์ใน dist/artifact-files.json
```

## ทดสอบ

```bash
node scripts/shoot.mjs "http://localhost:5173/?t=8" /tmp/shot 1440x900 flow
```

## ภาพดาวเทียม MapTiler (ไม่บังคับ)

1. สมัครฟรีที่ cloud.maptiler.com → API keys → สร้าง key แล้วตั้ง Allowed origins เป็น `http://localhost:5173` และโดเมนที่จะโฮสต์
2. `cp .env.example .env.local` แล้ววาง key หลัง `VITE_MAPTILER_KEY=`
3. รีสตาร์ต `npm run dev` จะมีปุ่ม “วาด/ดาวเทียม” ในแถบเครื่องมือขวา (ภาพดาวเทียมใช้ตอนกลางวัน กลางคืนยังเป็นแผนที่วาด)

`.env.local` ไม่ถูก commit และ `npm run build:artifact` จะตัด key ทิ้งเสมอ เพราะ Artifact เรียก API ภายนอกไม่ได้ ถ้าจะใช้ดาวเทียมบนเว็บจริงให้ `npm run build` แล้วโฮสต์ `dist/` บน Vercel หรือ Netlify
