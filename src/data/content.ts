// Example content for the prototype: 38 real Chiang Mai places with sample prices and hours.
// vec = [สงบ→คึกคัก, ธรรมชาติ→เมือง, ดั้งเดิม→ร่วมสมัย, ประหยัด→หรูหรา, ชิล→ลุย], each 0–1.
export type Cat = 'see' | 'eat' | 'stay';
export type Scene = { type: string; seed: number; v: number };
export type Place = { id: string; cat: Cat; name: string; en: string; lat: number; lng: number; sc: Scene; vec: number[]; price: string; hours: string; rating: number; tags: string[]; event?: boolean; clips?: [string, number, number][];
  gem?: boolean; // a local place few people know yet: the ranking gives it a fair share of attention
  story?: string; owner?: string; contact?: { tel?: string; line?: string }; photos?: string[]; isNew?: boolean };
export type EventKind = 'workshop' | 'market' | 'festival' | 'ceremony' | 'music' | 'nature';
export type LocalEvent = { id: string; place: string; title: string; kind: EventKind; in?: number; date?: string; time: string; sc: Scene; vec: number[]; host: string; price: string; desc: string; weekly?: number };
export type Zone = { id: string; name: string; lat: number; lng: number; r: number; vec: number[] };
export type Persona = { id: string; name: string; en: string; vec: number[]; sc: Scene; zone: string; words: string[] };

export const AXES: [string, string][] =[['สงบ','คึกคัก'],['ธรรมชาติ','เมือง'],['ดั้งเดิม','ร่วมสมัย'],['ประหยัด','หรูหรา'],['ชิล','ลุย']];
export const CAT: Record<Cat, { th: string; c: string }> ={see:{th:'เที่ยว',c:'--c-see'},eat:{th:'กิน',c:'--c-eat'},stay:{th:'พัก',c:'--c-stay'}};
const P=(id: string,cat: Cat,name: string,en: string,lat: number,lng: number,type: string,seed: number,v: number,vec: number[],price: string,hours: string,rating: number,tags: string[],extra: Partial<Place>={}): Place=>({id,cat,name,en,lat,lng,sc:{type,seed,v},vec,price,hours,rating,tags,...extra});
export const PLACES: Place[] =[
P('doisuthep','see','วัดพระธาตุดอยสุเทพ','Wat Phra That Doi Suthep',18.8048,98.9216,'temple',11,0,[.4,.2,.1,.35,.45],'฿30','06:00–18:00',4.8,['วัด','วิวเมือง','บันได 306 ขั้น'],{clips:[['temple',11,0],['mist',12,0],['lantern',13,0]]}),
P('chediluang','see','วัดเจดีย์หลวง','Wat Chedi Luang',18.7869,98.9867,'temple',21,0,[.35,.6,.05,.3,.2],'฿50','08:00–17:00',4.7,['วัด','เมืองเก่า','พระอาทิตย์ตก']),
P('phrasingh','see','วัดพระสิงห์','Wat Phra Singh',18.7884,98.9819,'temple',31,.8,[.3,.6,.05,.3,.15],'ฟรี','05:00–20:00',4.7,['วัด','ล้านนา']),
P('umong','see','วัดอุโมงค์','Wat Umong',18.7832,98.9520,'temple',41,.9,[.1,.25,.05,.2,.35],'ฟรี','06:00–18:00',4.6,['อุโมงค์','ป่า','เงียบ'],{clips:[['temple',41,.9],['mist',42,.9],['water',43,0]]}),
P('sundaywalk','see','ถนนคนเดินวันอาทิตย์','Sunday Walking Street',18.7877,98.9877,'market',51,0,[.9,.6,.2,.1,.5],'ฟรี','อา. 16:00–22:00',4.6,['ตลาด','งานฝีมือ','street food']),
P('thaphae','see','ประตูท่าแพ','Tha Phae Gate',18.7877,98.9932,'market',61,.8,[.6,.7,.1,.2,.3],'ฟรี','ตลอดวัน',4.4,['แลนด์มาร์ก','ถ่ายรูป']),
P('warorot','see','กาดหลวง (วโรรส)','Warorot Market',18.7900,99.0010,'market',71,.3,[.85,.7,.15,.1,.5],'ฟรี','05:00–18:00',4.4,['ตลาดเช้า','ของฝาก']),
P('yipeng','see','ยี่เป็งริมปิง','Yi Peng by the Ping',18.7880,99.0035,'lantern',81,0,[.7,.6,.2,.3,.3],'ฟรี','พ.ย. คืนเพ็ญ',4.9,['เทศกาล','โคมลอย','ริมน้ำ'],{event:true,clips:[['lantern',81,0],['river',82,.8],['lantern',83,0]]}),
P('monjam','see','ม่อนแจ่ม','Mon Jam',18.9358,98.8222,'mist',91,.8,[.3,.05,.3,.3,.6],'ฟรี','ตลอดวัน',4.5,['ทะเลหมอก','แปลงดอกไม้']),
P('huaykaew','see','น้ำตกห้วยแก้ว','Huay Kaew Waterfall',18.8115,98.9445,'water',101,0,[.3,.1,.3,.1,.75],'ฟรี','08:00–17:00',4.3,['น้ำตก','เดินป่า']),
P('huaytung','see','ห้วยตึงเฒ่า','Huay Tung Tao',18.8680,98.9380,'river',111,0,[.45,.05,.3,.15,.5],'฿50','07:00–18:00',4.4,['อ่างเก็บน้ำ','แพไม้ไผ่']),
P('canyon','see','แกรนด์แคนยอนหางดง','Grand Canyon Hang Dong',18.6960,98.8920,'canyon',121,0,[.8,.2,.6,.3,.95],'฿450','09:00–18:00',4.2,['ว่ายน้ำ','กระโดดน้ำ']),
P('bosang','see','หมู่บ้านทำร่มบ่อสร้าง','Bo Sang Umbrella Village',18.7667,99.0833,'craft',131,0,[.3,.3,.05,.3,.35],'ฟรี','08:30–17:00',4.3,['งานฝีมือ','เพนต์ร่ม']),
P('kangwat','see','บ้านข้างวัด','Baan Kang Wat',18.7766,98.9480,'craft',141,.5,[.35,.4,.6,.35,.3],'ฟรี','อ.–อา. 10:00–18:00',4.5,['ศิลปะ','workshop'],{clips:[['craft',141,.5],['cafe',142,0],['market',143,.8]]}),
P('jingjai','see','ตลาดจริงใจ','Jing Jai Market',18.8070,98.9960,'market',151,.9,[.6,.6,.6,.35,.3],'ฟรี','ส.–อา. 06:30–13:00',4.5,['ตลาดเช้า','ออร์แกนิก']),
P('nightbazaar','see','ไนท์บาซาร์','Night Bazaar',18.7853,99.0000,'market',161,.1,[.85,.8,.3,.2,.4],'ฟรี','18:00–24:00',4.1,['ตลาดกลางคืน','ช้อปปิ้ง']),
P('angkaew','see','อ่างแก้ว มช.','Ang Kaew',18.8060,98.9500,'river',171,.9,[.25,.4,.4,.15,.3],'ฟรี','05:00–20:00',4.5,['วิ่ง','ปิกนิก','ดอยสุเทพ']),
P('doipui','see','หมู่บ้านม้งดอยปุย','Doi Pui Hmong Village',18.8170,98.8830,'mist',181,0,[.35,.05,.1,.2,.55],'฿10','08:00–17:00',4.2,['ชาวม้ง','สวนดอกไม้']),
P('lamduan','eat','ข้าวซอยลำดวนฟ้าฮ่าม','Khao Soi Lam Duan',18.8040,99.0010,'food',201,.1,[.5,.6,.1,.1,.4],'฿60–80','09:00–16:00',4.5,['ข้าวซอย','ร้านดั้งเดิม']),
P('maesai','eat','ข้าวซอยแม่สาย','Khao Soi Mae Sai',18.8010,98.9790,'food',211,.4,[.5,.6,.15,.05,.4],'฿50','08:00–15:00',4.6,['ข้าวซอย','คนท้องถิ่น']),
P('cowboy','eat','ข้าวขาหมูช้างเผือก','Chang Phueak Pork Leg',18.7955,98.9860,'food',221,.8,[.75,.7,.2,.05,.5],'฿50','17:00–24:00',4.4,['ข้าวขาหมู','มื้อดึก'],{clips:[['food',221,.8],['market',222,0],['street',223,0]]}),
P('huenphen','eat','เฮือนเพ็ญ','Huen Phen',18.7830,98.9825,'food',231,.7,[.4,.6,.1,.25,.3],'฿80–200','08:30–22:00',4.5,['อาหารเหนือ','น้ำพริกหนุ่ม']),
P('tongtemtoh','eat','ต๋องเต็มโต๊ะ','Tong Tem Toh',18.7952,98.9682,'food',241,.5,[.7,.85,.4,.3,.3],'฿100–250','11:00–22:00',4.4,['อาหารเหนือ','นิมมาน']),
P('riverside','eat','เดอะริเวอร์ไซด์','The Riverside',18.7915,99.0045,'river',251,.8,[.75,.7,.4,.6,.2],'฿300+','10:00–01:00',4.4,['ริมน้ำ','ดนตรีสด']),
P('ristr8to','eat','Ristr8to','Ristr8to Coffee',18.7985,98.9675,'cafe',261,0,[.4,.85,.9,.45,.2],'฿100–180','07:00–17:00',4.6,['latte art','specialty']),
P('no39','eat','No.39 Café','No.39 Café',18.8090,98.9530,'cafe',271,.9,[.3,.5,.8,.4,.25],'฿120','09:00–18:00',4.3,['คาเฟ่ในสวน','บ่อน้ำ']),
P('akha','eat','อาข่า อ่ามา','Akha Ama Coffee',18.7905,98.9812,'cafe',281,.2,[.3,.6,.6,.25,.2],'฿80','08:00–17:30',4.6,['กาแฟดอย','ชุมชน']),
P('warmup','eat','วอร์มอัพ คาเฟ่','Warm Up Café',18.7950,98.9665,'street',291,0,[.95,.9,.8,.4,.45],'฿150+','18:00–02:00',4.2,['ดนตรีสด','บาร์']),
P('tonpayom','eat','ตลาดต้นพยอม','Ton Payom Market',18.8035,98.9515,'market',301,.6,[.7,.5,.2,.05,.4],'฿30–80','06:00–19:00',4.3,['ตลาดสด','ของกินถูก']),
P('fourseasons','stay','โฟร์ซีซั่นส์ แม่ริม','Four Seasons Resort Chiang Mai',18.9250,98.9330,'stay',401,0,[.15,.1,.55,.98,.2],'฿18,000+','เช็คอิน 15:00',4.8,['วิวนาข้าว','สปา'],{clips:[['stay',401,0],['mist',402,0],['stay',403,.9]]}),
P('pillars','stay','137 Pillars House','137 Pillars House',18.7920,99.0055,'stay',411,.9,[.25,.6,.4,.95,.15],'฿9,000+','เช็คอิน 14:00',4.8,['โคโลเนียล','ริมปิง']),
P('rachamankha','stay','ราชมรรคา','Rachamankha',18.7860,98.9790,'temple',421,.8,[.2,.6,.15,.8,.15],'฿6,000+','เช็คอิน 14:00',4.7,['บูทีคล้านนา','เงียบ'],{clips:[['temple',421,.8],['stay',422,.9],['cafe',423,0]]}),
P('tamarind','stay','ตามารินด์ วิลเลจ','Tamarind Village',18.7880,98.9895,'stay',431,.2,[.3,.65,.25,.65,.2],'฿4,500+','เช็คอิน 14:00',4.6,['เมืองเก่า','ต้นมะขาม']),
P('akyra','stay','อคีรา แมเนอร์','Akyra Manor',18.7975,98.9672,'stay',441,.95,[.65,.9,.9,.8,.25],'฿5,500+','เช็คอิน 15:00',4.5,['rooftop pool','นิมมาน'],{clips:[['stay',441,.95],['street',442,0],['cafe',443,.9]]}),
P('anantara','stay','อนันตรา เชียงใหม่','Anantara Chiang Mai',18.7830,99.0030,'river',451,.8,[.35,.7,.5,.9,.15],'฿10,000+','เช็คอิน 14:00',4.7,['ริมปิง','ไนท์บาซาร์']),
P('monjamtent','stay','ลานกางเต็นท์ม่อนแจ่ม','Mon Jam Camping',18.9340,98.8240,'tent',461,0,[.35,0,.25,.15,.75],'฿300+','เช็คอิน 13:00',4.3,['กางเต็นท์','ดูดาว']),
P('hostel','stay','โฮสเทลซอยนิมมาน','Nimman Hostel',18.7990,98.9690,'street',471,.5,[.8,.85,.75,.1,.5],'฿450+','เช็คอิน 14:00',4.3,['เพื่อนใหม่','ประหยัด']),
P('homestay','stay','โฮมสเตย์บ่อสร้าง','Bo Sang Homestay',18.7700,99.0800,'craft',481,.3,[.2,.2,.1,.2,.35],'฿900+','เช็คอิน 14:00',4.5,['ชุมชน','ทำร่ม']),
P('wualai','see','ชุมชนเครื่องเงินวัวลาย','Wualai Silver Community',18.7790,98.9870,'craft',151.5,.3,[.35,.55,.08,.25,.35],'ฟรี','09:00–17:00',4.5,['เครื่องเงิน','ช่างชุมชน','workshop'],{gem:true,owner:'ชุมชนวัวลาย',story:'ซอยเล็กหลังประตูเชียงใหม่ ช่างตอกลายเงินกันมาสามรุ่น เดินเข้าไปนั่งดูได้ บางบ้านสอนตอกลายเองให้กลับบ้านไปหนึ่งชิ้น'}),
P('watket','see','ชุมชนวัดเกตุ','Wat Ket Community',18.7935,99.0050,'temple',161.5,.6,[.25,.6,.1,.2,.25],'ฟรี','08:00–17:00',4.5,['ชุมชนเก่า','พิพิธภัณฑ์บ้าน','ริมปิง'],{gem:true,owner:'ชุมชนวัดเกตุ',story:'บ้านไม้ริมปิงที่เปิดห้องเก็บของเก่าให้ดูฟรี คุณลุงเล่าเรื่องเรือหางแมงป่องได้ทั้งบ่าย'}),
P('bantawai','see','หมู่บ้านไม้แกะสลักบ้านถวาย','Ban Tawai Woodcarving Village',18.7040,98.9760,'craft',171.5,.1,[.3,.35,.15,.3,.3],'ฟรี','08:00–17:00',4.3,['งานไม้','ของแต่งบ้าน','ช่างฝีมือ'],{gem:true,owner:'ชุมชนบ้านถวาย'}),
P('sankamphaeng','see','บ้านผ้าทอสันกำแพง','San Kamphaeng Weavers',18.7460,99.1150,'craft',181.5,.7,[.25,.3,.05,.3,.3],'ฟรี','09:00–17:00',4.4,['ผ้าไหม','ทอมือ','ชุมชน'],{gem:true,owner:'กลุ่มทอผ้าสันกำแพง (ตัวอย่าง)'}),
P('krua-wualai','eat','ครัวบ้านช่างเงิน','Silver Lane Kitchen',18.7795,98.9862,'food',311.5,.2,[.35,.55,.1,.1,.35],'฿50–90','10:00–15:00',4.6,['อาหารเหนือบ้านๆ','แกงฮังเล','คนท้องถิ่น'],{gem:true,owner:'ร้านตัวอย่าง SME',story:'แกงฮังเลหม้อเดียวของวัน ขายหมดแล้วปิด ป้าทำตามสูตรแม่ ลูกค้าส่วนใหญ่เป็นช่างเงินในซอย',contact:{tel:'0800000000',line:'sample-shop'}}),
P('ricefield-cafe','eat','กาแฟริมนาห้วยตึงเฒ่า','Paddy Edge Coffee',18.8650,98.9420,'cafe',321.5,.6,[.2,.15,.5,.25,.25],'฿60–120','08:00–17:00',4.5,['คาเฟ่ริมนา','กาแฟดอย','เงียบ'],{gem:true,owner:'ร้านตัวอย่าง SME',story:'กระท่อมไม้ไผ่กลางนาข้าว คั่วกาแฟจากไร่ญาติบนดอย นั่งได้ทั้งวันไม่มีใครไล่',contact:{line:'sample-cafe'}}),
P('ping-homestay','stay','บ้านไม้ริมปิง โฮมสเตย์','Ping Teak House Homestay',18.7930,99.0060,'river',491.5,.7,[.2,.6,.15,.3,.2],'฿1,200+','เช็คอิน 14:00',4.7,['บ้านไม้สัก','ริมปิง','อาหารเช้าฝีมือเจ้าของ'],{gem:true,owner:'ที่พักตัวอย่าง SME',story:'บ้านสักอายุ 80 ปีสามห้อง ตื่นมาเจอเรือพายผ่านหน้าบ้าน เจ้าของพาไปตลาดวโรรสตอนเช้า',contact:{tel:'0800000001'}}),
P('orchard-hut','stay','กระท่อมกลางสวนแม่ริม','Mae Rim Orchard Huts',18.9150,98.9050,'tent',501.5,.4,[.15,.1,.3,.35,.4],'฿1,500+','เช็คอิน 14:00',4.5,['กลางสวนลำไย','ดูหิ่งห้อย','ทำอาหารเอง'],{gem:true,owner:'ที่พักตัวอย่าง SME'}),
];
export const ZONES: Zone[] =[
 {id:'doi',name:'ดอยสุเทพ',lat:18.808,lng:98.912,r:26,vec:[.2,.1,.25,.35,.6]},
 {id:'maerim',name:'แม่ริม',lat:18.925,lng:98.88,r:34,vec:[.2,.05,.45,.7,.5]},
 {id:'huaytung',name:'ห้วยตึงเฒ่า',lat:18.868,lng:98.938,r:12,vec:[.4,.05,.3,.15,.5]},
 {id:'nimman',name:'นิมมาน',lat:18.799,lng:98.966,r:11,vec:[.75,.88,.88,.5,.3]},
 {id:'oldcity',name:'เมืองเก่า',lat:18.7885,lng:98.988,r:11,vec:[.45,.6,.1,.35,.25]},
 {id:'riverside',name:'ริมปิง',lat:18.792,lng:99.006,r:10,vec:[.7,.7,.35,.55,.3]},
 {id:'east',name:'บ่อสร้าง',lat:18.768,lng:99.082,r:16,vec:[.25,.25,.1,.25,.35]},
 {id:'hangdong',name:'หางดง',lat:18.70,lng:98.895,r:18,vec:[.7,.2,.6,.3,.9]},
];
export const PERSONAS: Persona[] =[
 {id:'mist',name:'หมอกใจเย็น',en:'Mist Dreamer',vec:[.15,.1,.4,.5,.35],sc:{type:'mist',seed:7,v:0},zone:'doi',words:['ดอย','หมอกเช้า','ช้าๆ']},
 {id:'lanna',name:'วิญญาณล้านนา',en:'Lanna Soul',vec:[.3,.5,.08,.35,.25],sc:{type:'temple',seed:5,v:0},zone:'oldcity',words:['วัด','เมืองเก่า','งานฝีมือ']},
 {id:'owl',name:'นกฮูกนิมมาน',en:'Nimman Night Owl',vec:[.9,.9,.85,.5,.4],sc:{type:'street',seed:9,v:0},zone:'nimman',words:['ดนตรีสด','แสงไฟ','มื้อดึก']},
 {id:'trail',name:'สายลุยป่า',en:'Trail Seeker',vec:[.5,.08,.4,.2,.95],sc:{type:'water',seed:3,v:0},zone:'hangdong',words:['น้ำตก','เดินป่า','เปียกได้']},
 {id:'cafe',name:'นักสะสมคาเฟ่',en:'Slow Café Collector',vec:[.3,.75,.85,.5,.2],sc:{type:'cafe',seed:4,v:0},zone:'nimman',words:['กาแฟดอย','แสงบ่าย','มุมถ่ายรูป']},
 {id:'market',name:'นักล่าตลาด',en:'Market Hunter',vec:[.82,.62,.2,.12,.55],sc:{type:'market',seed:6,v:0},zone:'riverside',words:['ตลาดเช้า','street food','ต่อราคา']},
 {id:'luxe',name:'พักใจหรูๆ',en:'Slow Luxe',vec:[.15,.3,.6,.95,.15],sc:{type:'stay',seed:8,v:0},zone:'maerim',words:['สปา','วิวนา','ไม่รีบ']},
];
export const QUIZ: { q: string; o: [string, string, number, number, number[]][] }[] =[
 {q:'ตื่นมา อยากเจอ…',o:[['หมอกบนดอย','mist',301,0,[.1,.05,.4,.5,.4]],['ระฆังวัดตอนเช้า','temple',302,.8,[.2,.5,.05,.35,.2]],['คาเฟ่แสงเช้า','cafe',303,0,[.3,.75,.85,.5,.2]],['เสียงน้ำตก','water',304,0,[.5,.05,.4,.2,.95]]]},
 {q:'มื้อนี้ ต้อง…',o:[['ข้าวซอยร้านเก่า','food',311,0,[.55,.6,.1,.12,.45]],['ดินเนอร์ริมปิง','river',312,.8,[.4,.6,.5,.85,.15]],['brunch คาเฟ่','cafe',313,.9,[.3,.8,.9,.6,.2]],['เดินกินในตลาด','market',314,0,[.85,.6,.25,.08,.6]]]},
 {q:'บ่ายนี้ ขอ…',o:[['ทำร่มบ่อสร้าง','craft',321,0,[.3,.3,.05,.3,.4]],['กระโดดน้ำ','canyon',322,0,[.8,.2,.6,.3,.95]],['เดินในวัดป่า','temple',323,.9,[.08,.3,.08,.3,.4]],['เดินเล่นนิมมาน','street',324,.5,[.8,.95,.9,.55,.3]]]},
 {q:'พอฟ้ามืด…',o:[['ปล่อยโคม','lantern',331,0,[.45,.4,.2,.45,.3]],['ไนท์มาร์เก็ต','market',332,.8,[.85,.65,.3,.15,.5]],['ดนตรีสด','street',333,0,[.95,.9,.85,.55,.4]],['แช่สระเงียบๆ','stay',334,.9,[.08,.3,.6,.95,.1]]]},
 {q:'คืนนี้ นอน…',o:[['เต็นท์บนดอย','tent',341,0,[.3,0,.3,.2,.85]],['บูทีคล้านนา','temple',342,.8,[.25,.55,.15,.75,.2]],['พูลวิลล่า','stay',343,0,[.12,.3,.7,.98,.1]],['โฮสเทลเพื่อนเยอะ','street',344,.4,[.85,.85,.8,.08,.5]]]},
];


/* Local events: dates are days from today so the prototype always has something coming up. weekly = repeats on that weekday (0 = Sunday). */
export const EVENTS: LocalEvent[] = [
 {id:'ev-wualai-walk',place:'wualai',title:'ถนนคนเดินวัวลาย',kind:'market',weekly:6,time:'17:00–22:00',sc:{type:'market',seed:601,v:.1},vec:[.8,.6,.15,.1,.45],host:'ชุมชนวัวลาย',price:'ฟรี',desc:'ตลาดเย็นวันเสาร์หน้าวัดศรีสุพรรณ ดูช่างตอกเงินสดๆ'},
 {id:'ev-silver',place:'wualai',title:'ตอกลายเงินกับช่างชุมชน',kind:'workshop',in:2,time:'10:00–12:00',sc:{type:'craft',seed:602,v:.3},vec:[.3,.5,.05,.25,.4],host:'ชุมชนวัวลาย',price:'฿350',desc:'สองชั่วโมง ได้จี้เงินลายของตัวเองกลับบ้าน'},
 {id:'ev-hanglay',place:'krua-wualai',title:'ทำแกงฮังเลกับป้า',kind:'workshop',in:3,time:'09:00–11:30',sc:{type:'food',seed:603,v:.2},vec:[.4,.55,.08,.15,.35],host:'ครัวบ้านช่างเงิน',price:'฿450',desc:'ไปตลาดด้วยกัน กลับมาเคี่ยวแกง กินพร้อมข้าวเหนียว'},
 {id:'ev-umbrella',place:'bosang',title:'เพนต์ร่มกระดาษสา',kind:'workshop',in:1,time:'09:00–16:00',sc:{type:'craft',seed:604,v:0},vec:[.3,.3,.05,.25,.35],host:'หมู่บ้านบ่อสร้าง',price:'฿150',desc:'เลือกลายเอง วาดเสร็จในยี่สิบนาที'},
 {id:'ev-almsgiving',place:'chediluang',title:'ตักบาตรเช้าเมืองเก่า',kind:'ceremony',in:0,time:'06:00–07:00',sc:{type:'temple',seed:605,v:0},vec:[.15,.55,.05,.2,.2],host:'วัดเจดีย์หลวง',price:'ฟรี',desc:'แต่งกายสุภาพ ของใส่บาตรมีขายหน้าวัด'},
 {id:'ev-jingjai',place:'jingjai',title:'ตลาดจริงใจเช้าวันเสาร์',kind:'market',weekly:6,time:'06:30–13:00',sc:{type:'market',seed:606,v:.9},vec:[.6,.55,.6,.35,.3],host:'ตลาดจริงใจ',price:'ฟรี',desc:'ผักออร์แกนิก กาแฟดอย งานคราฟต์'},
 {id:'ev-yipeng',place:'yipeng',title:'คืนยี่เป็งริมปิง',kind:'festival',in:20,time:'18:00–23:00',sc:{type:'lantern',seed:607,v:0},vec:[.7,.6,.2,.3,.3],host:'เทศบาลนครเชียงใหม่',price:'ฟรี',desc:'ลอยกระทงริมน้ำ โคมไฟทั้งเมือง (วันที่เป็นตัวอย่าง)'},
 {id:'ev-carve',place:'bantawai',title:'แกะไม้ชิ้นแรก',kind:'workshop',in:5,time:'13:00–16:00',sc:{type:'craft',seed:608,v:.1},vec:[.3,.35,.15,.3,.4],host:'ชุมชนบ้านถวาย',price:'฿300',desc:'ช่างสอนจับสิ่ว ได้ที่รองแก้วลายช้าง'},
 {id:'ev-weave',place:'sankamphaeng',title:'ลองทอผ้ากี่เอว',kind:'workshop',in:6,time:'10:00–15:00',sc:{type:'craft',seed:609,v:.7},vec:[.2,.3,.05,.3,.3],host:'กลุ่มทอผ้าสันกำแพง (ตัวอย่าง)',price:'฿250',desc:'ทอผ้าพันคอผืนเล็กของตัวเอง'},
 {id:'ev-coffee',place:'ricefield-cafe',title:'คั่วกาแฟริมนา',kind:'nature',in:4,time:'08:00–10:00',sc:{type:'cafe',seed:610,v:.6},vec:[.2,.15,.55,.3,.3],host:'กาแฟริมนาห้วยตึงเฒ่า',price:'฿200',desc:'คั่วเอง ดริปเอง ดูนกกระยางตอนเช้า'},
 {id:'ev-live',place:'warmup',title:'ดนตรีสดคืนวันศุกร์',kind:'music',weekly:5,time:'20:00–01:00',sc:{type:'street',seed:611,v:0},vec:[.95,.9,.85,.45,.45],host:'วอร์มอัพ คาเฟ่',price:'ฟรี',desc:'วงอินดี้เชียงใหม่สามวงต่อคืน'},
 {id:'ev-firefly',place:'orchard-hut',title:'เดินดูหิ่งห้อยในสวนลำไย',kind:'nature',in:8,time:'19:00–20:30',sc:{type:'tent',seed:612,v:.4},vec:[.15,.05,.3,.3,.45],host:'กระท่อมกลางสวนแม่ริม',price:'฿100',desc:'เจ้าของสวนพาเดิน ไฟฉายสีแดงไม่รบกวนหิ่งห้อย'},
 {id:'ev-sunday',place:'sundaywalk',title:'ถนนคนเดินวันอาทิตย์',kind:'market',weekly:0,time:'16:00–22:00',sc:{type:'market',seed:613,v:0},vec:[.9,.6,.2,.1,.5],host:'ถนนราชดำเนิน',price:'ฟรี',desc:'ยาวตั้งแต่ประตูท่าแพถึงวัดพระสิงห์'},
];
export const KIND: Record<EventKind, string> = { workshop: 'ลงมือทำ', market: 'ตลาด', festival: 'เทศกาล', ceremony: 'พิธีท้องถิ่น', music: 'ดนตรี', nature: 'ธรรมชาติ' };

/* Tags an owner can pick; each nudges the place's vibe vector, so a new pin matches travellers with no extra work. */
export const TAG_VEC: Record<string, number[]> = {
 'เงียบสงบ':[.1,.4,.4,.4,.3],'คึกคัก':[.9,.7,.5,.4,.5],'ธรรมชาติ':[.3,.05,.4,.4,.6],'กลางเมือง':[.6,.9,.6,.4,.3],
 'ล้านนาดั้งเดิม':[.3,.5,.05,.35,.3],'ร่วมสมัย':[.5,.8,.9,.5,.3],'ราคาย่อมเยา':[.6,.5,.4,.05,.45],'พรีเมียม':[.3,.5,.6,.95,.2],
 'ผจญภัย':[.6,.2,.5,.3,.95],'ชิลๆ':[.2,.5,.5,.5,.1],'งานฝีมือ':[.3,.35,.1,.3,.4],'คาเฟ่':[.3,.75,.85,.5,.2],
 'อาหารเหนือ':[.5,.6,.1,.15,.4],'ดนตรีสด':[.95,.9,.85,.5,.4],'วิวดอย':[.3,.05,.35,.45,.55],'ริมน้ำ':[.5,.55,.4,.5,.3],
 'ครอบครัว':[.5,.5,.4,.4,.4],'ชุมชน':[.35,.35,.1,.2,.4],
};
export const SCENE_TYPES: [string, string][] = [['mist','หมอก'],['temple','วัด'],['market','ตลาด'],['street','ถนนยามค่ำ'],['cafe','คาเฟ่'],['food','อาหาร'],['water','น้ำตก'],['river','ริมน้ำ'],['stay','ที่พัก'],['craft','งานฝีมือ'],['tent','แคมป์'],['canyon','ผจญภัย'],['lantern','โคมไฟ']];
