// @ts-nocheck
// Painted scenes: every picture in the prototype is a living postcard drawn on a canvas.
// Each place names a scene type, a seed and a variant; real photos and clips replace them later.
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export function R(seed){let s=Math.abs(Math.floor(seed*7919))%233280||7;return()=>(s=(s*9301+49297)%233280)/233280}
function lg(c,x0,y0,x1,y1,st){const g=c.createLinearGradient(x0,y0,x1,y1);st.forEach(([o,k])=>g.addColorStop(o,k));return g}
function glow(c,x,y,r,rgb,a){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
function ridge(c,w,h,base,amp,sd,col,shift=0){c.beginPath();c.moveTo(0,h);for(let i=0;i<=64;i++){const x=i/64*w,u=i/64*6+shift;
  c.lineTo(x,base+amp*(Math.sin(u*1.3+sd)*.5+Math.sin(u*2.7+sd*2.1)*.3+Math.sin(u*5.3+sd*3.3)*.2))}c.lineTo(w,h);c.closePath();c.fillStyle=col;c.fill()}
function fog(c,w,h,y,t,a,rgb,k){c.save();c.translate(0,y);c.scale(1,.2);for(let i=0;i<4;i++){const x=(((i*.33+k*.19+t*.012*(1+i*.35))%1.5)-.25)*w;
  const g=c.createRadialGradient(x,0,0,x,0,w*.45);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(x-w*.45,-w*.45,w*.9,w*.9)}c.restore()}
function stars(c,w,h,t,r,n,maxY){for(let i=0;i<n;i++){const x=r()*w,y=r()*h*maxY,a=.25+.75*Math.abs(Math.sin(t*1.2+i*1.7));c.fillStyle=`rgba(255,250,235,${a})`;c.fillRect(x,y,1.4,1.4)}}
function steam(c,cx,cy,w,h,t){c.lineCap='round';for(let k=0;k<3;k++){c.beginPath();for(let j=0;j<=20;j++){const p=j/20,y=cy-p*h*.24;const x=cx+(k-1)*w*.03+Math.sin(p*6+t*1.6+k*2)*w*.022*p;j?c.lineTo(x,y):c.moveTo(x,y)}
  c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=w*.012;c.stroke()}}
export const SCENES={
mist(c,w,h,t,r,v){
  c.fillStyle=lg(c,0,0,0,h,v>.5?[[0,'#6f7fa8'],[.5,'#e3b9b0'],[1,'#f4dccb']]:[[0,'#88a6c2'],[.55,'#f0d1b4'],[1,'#f6e5d4']]);c.fillRect(0,0,w,h);
  glow(c,w*.68,h*.4,w*.55,'255,220,180',.75);c.fillStyle='#fff4e2';c.beginPath();c.arc(w*.68,h*.4,w*.045,0,7);c.fill();
  const cols=v>.5?['#b5b6cd','#8f93b2','#6b7196','#4b5277','#2c3354']:['#b3c4cf','#8ea6b6','#6b889c','#4a6a80','#2a4a60'];
  for(let i=0;i<5;i++){ridge(c,w,h,h*(.46+i*.11),h*(.06+i*.02),i*1.9+r()*3,cols[i],t*.01*(i+1));fog(c,w,h,h*(.5+i*.11),t,.42-i*.04,'245,240,236',i)}
},
temple(c,w,h,t,r,v){
  c.fillStyle=lg(c,0,0,0,h,v>.5?[[0,'#2d4c5c'],[.5,'#8fb3a8'],[.8,'#f0d3a0'],[1,'#f3c98a']]:[[0,'#2a2150'],[.45,'#b04f6a'],[.75,'#ef9f5c'],[1,'#f6c77c']]);c.fillRect(0,0,w,h);
  glow(c,w*.5,h*.62,w*.7,'255,200,130',.55);
  ridge(c,w,h,h*.68,h*.035,2+r(),v>.5?'#4d6f68':'#743f5d',t*.004);
  const cx=w*.5,b=h*.86,H=h*.6,gold=lg(c,cx-H*.3,0,cx+H*.3,0,[[0,'#7d4f17'],[.45,'#ffd98c'],[.6,'#f3b64e'],[1,'#8b5a1c']]);c.fillStyle=gold;
  const tiers=[[.62,.05],[.5,.05],[.4,.045],[.3,.04]];let y=b;tiers.forEach(([tw,th])=>{c.fillRect(cx-H*tw/2,y-H*th,H*tw,H*th);y-=H*th});
  const bw=H*.3,bh=H*.26;c.beginPath();c.moveTo(cx-bw/2,y);c.bezierCurveTo(cx-bw/2,y-bh*.75,cx-bw*.2,y-bh,cx,y-bh);c.bezierCurveTo(cx+bw*.2,y-bh,cx+bw/2,y-bh*.75,cx+bw/2,y);c.fill();
  y-=bh;for(let i=0;i<6;i++){const rw=H*(.07-i*.008);c.fillRect(cx-rw/2,y-H*.022,rw,H*.018);y-=H*.022}
  c.beginPath();c.moveTo(cx-H*.02,y);c.lineTo(cx,b-H);c.lineTo(cx+H*.02,y);c.fill();
  glow(c,cx,b-H*.98,w*.08,'255,240,200',.5+.4*Math.sin(t*2));
  c.fillStyle=v>.5?'#18302c':'#22142c';
  for(let s of[-1,1])for(let i=0;i<9;i++){const tx=cx+s*(w*.32+r()*w*.2),ty=b-r()*h*.12,tr=w*(.06+r()*.07);c.beginPath();c.arc(tx,ty,tr,0,7);c.fill()}
  c.fillRect(0,b,w,h-b);
  c.strokeStyle=v>.5?'#18302c':'#2a1830';c.lineWidth=Math.max(1.2,w*.004);
  for(let i=0;i<5;i++){const bx=((t*.025*(1+i*.15)+i*.23)%1.3-.15)*w,by=h*(.18+i*.05)+Math.sin(t*2+i)*4,s=w*.012,f=Math.sin(t*8+i)*s*.5;
    c.beginPath();c.moveTo(bx-s,by-f);c.quadraticCurveTo(bx-s*.4,by-s*.2,bx,by);c.quadraticCurveTo(bx+s*.4,by-s*.2,bx+s,by-f);c.stroke()}
},
lantern(c,w,h,t,r,v){
  c.fillStyle=lg(c,0,0,0,h,[[0,'#060a20'],[.6,'#1b1a46'],[1,'#47294f']]);c.fillRect(0,0,w,h);stars(c,w,h,t,r,70,.6);
  ridge(c,w,h,h*.74,h*.035,1.3,'#120e28',0);
  c.fillStyle=lg(c,0,h*.78,0,h,[[0,'#1e1838'],[1,'#0b0a1c']]);c.fillRect(0,h*.78,w,h*.22);
  for(let i=0;i<38;i++){const lx=r()*w,sp=.025+r()*.04,off=r(),sz=(.014+r()*.022)*w,p=(t*sp+off)%1;
    const y=h*.82-p*h*1.0,x=lx+Math.sin(t*.5+i)*w*.015,a=Math.min(1,p*8)*(p>.8?1-(p-.8)/.2:1),fl=.85+.15*Math.sin(t*9+i*3);
    glow(c,x,y,sz*3.2,'255,160,70',.35*a*fl);c.fillStyle=`rgba(255,${190+i%3*15},110,${a})`;c.beginPath();c.roundRect?c.roundRect(x-sz/2,y-sz*.65,sz,sz*1.3,sz*.35):c.rect(x-sz/2,y-sz*.65,sz,sz*1.3);c.fill();
    if(y<h*.78&&y>h*.4){c.fillStyle=`rgba(255,170,80,${.18*a})`;c.fillRect(x-sz*.4,h*.78+(h*.78-y)*.25,sz*.8,sz*.25)}}
  for(let i=0;i<24;i++){const y=h*(.8+r()*.18),x=(r()*w+t*6)%w;c.fillStyle=`rgba(255,180,90,${.12+.12*Math.sin(t*3+i)})`;c.fillRect(x,y,w*(.02+r()*.05),1.5)}
},
market(c,w,h,t,r,v){
  c.fillStyle=lg(c,0,0,0,h,v>.5?[[0,'#2a2a4a'],[.7,'#4f5e8a'],[1,'#c48a6a']]:[[0,'#1d1a3a'],[.7,'#76395a'],[1,'#d06b58']]);c.fillRect(0,0,w,h);
  const pal=['255,180,90','255,120,110','255,220,150','150,200,255'];
  for(let i=0;i<26;i++){const x=r()*w,y=r()*h*.7,rad=(r()*.06+.02)*w;glow(c,x,y,rad,pal[i%4],.22+.1*Math.sin(t*1.4+i))}
  for(let k=0;k<3;k++){const y0=h*(.14+k*.1);c.strokeStyle='rgba(20,15,30,.6)';c.lineWidth=1;c.beginPath();
    for(let i=0;i<=16;i++){const x=i/16*w,y=y0+Math.sin(Math.PI*i/16)*h*.07;i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();
    for(let i=0;i<=16;i++){const x=i/16*w,y=y0+Math.sin(Math.PI*i/16)*h*.07+3,a=.7+.3*Math.sin(t*5+i*2+k);glow(c,x,y,w*.025,'255,200,120',.5*a);c.fillStyle=`rgba(255,226,170,${a})`;c.beginPath();c.arc(x,y,Math.max(1.6,w*.006),0,7);c.fill()}}
  for(let i=0;i<6;i++){const sx=i/6*w-w*.03,sw=w/6+w*.02,top=h*.6+((i%2)*h*.03);c.fillStyle='#140f22';
    c.beginPath();c.moveTo(sx,top+h*.06);c.lineTo(sx+sw/2,top);c.lineTo(sx+sw,top+h*.06);c.fill();c.fillRect(sx+sw*.06,top+h*.06,sw*.88,h*.3);
    c.fillStyle=`rgba(255,${170+i*10},100,.85)`;c.fillRect(sx+sw*.14,top+h*.12,sw*.72,h*.07);}
  c.fillStyle='#0d0918';c.fillRect(0,h*.88,w,h*.12);
  for(let i=0;i<9;i++){const px=((i*.13+t*.008*(i%2?1:-1)+5)%1)*w,ph=h*(.09+r()*.04);c.fillStyle='#07050f';c.beginPath();c.arc(px,h*.9-ph,w*.014,0,7);c.fill();c.fillRect(px-w*.012,h*.9-ph+w*.012,w*.024,ph)}
},
street(c,w,h,t,r,v){
  c.fillStyle=lg(c,0,0,0,h,[[0,'#080d22'],[.7,'#1d1442'],[1,'#120c28']]);c.fillRect(0,0,w,h);
  let x=-w*.05;while(x<w){const bw=w*(.12+r()*.14),bh=h*(.35+r()*.35);c.fillStyle='#10163a';c.fillRect(x,h*.75-bh,bw,bh);
    for(let yy=h*.75-bh+8;yy<h*.72;yy+=h*.045)for(let xx=x+5;xx<x+bw-6;xx+=w*.035)if(r()<.38){c.fillStyle=`rgba(255,210,140,${.45+.3*r()})`;c.fillRect(xx,yy,w*.016,h*.022)}x+=bw+2}
  const neon=['255,79,163','56,225,255','255,210,63','170,120,255'];
  for(let i=0;i<4;i++){const nx=w*(.08+i*.24+r()*.05),ny=h*(.3+r()*.25),nw=w*(.1+r()*.08),nh=h*.05,on=Math.sin(t*7+i*4)>-.92?1:.25;
    c.save();c.shadowColor=`rgba(${neon[i]},1)`;c.shadowBlur=w*.04*on;c.strokeStyle=`rgba(${neon[i]},${.95*on})`;c.lineWidth=Math.max(2,w*.008);c.strokeRect(nx,ny,nw,nh);c.restore();
    c.fillStyle=`rgba(${neon[i]},${.25*on})`;for(let k=0;k<6;k++)c.fillRect(nx+nw*.15+Math.sin(t*2+k)*2,h*.78+k*h*.03,nw*.7,h*.012)}
  c.fillStyle=lg(c,0,h*.75,0,h,[[0,'rgba(20,16,50,.6)'],[1,'#05040c']]);c.fillRect(0,h*.75,w,h*.25);
  for(let i=0;i<4;i++){const cy=h*.83+i*h*.004,cx=((t*.05*(i%2?1:-1)+i*.3)%1.2+1.2)%1.2*w-w*.1;glow(c,cx,cy,w*.05,i%2?'255,220,170':'255,80,80',.6)}
},
cafe(c,w,h,t,r,v){
  c.fillStyle=v>.5?'#3c5a52':'#c8ad8c';c.fillRect(0,0,w,h);
  const wx=w*.12,wy=h*.08,ww=w*.76,wh=h*.56;
  c.fillStyle=lg(c,0,wy,0,wy+wh,[[0,'#cfe6ea'],[1,'#f2efe0']]);c.fillRect(wx,wy,ww,wh);
  c.save();c.beginPath();c.rect(wx,wy,ww,wh);c.clip();glow(c,wx+ww*.75,wy+wh*.3,ww*.5,'255,240,200',.7);
  ridge(c,w,wy+wh,wy+wh*.55,wh*.08,1.1,'#8db59a',t*.006);ridge(c,w,wy+wh,wy+wh*.72,wh*.07,2.6,'#5d8c6c',t*.01);
  for(let i=0;i<14;i++){c.fillStyle=['#3f7350','#2f5a3f','#4f8a5e'][i%3];c.beginPath();c.arc(wx+r()*ww,wy+wh*(.85+r()*.2),ww*(.05+r()*.06),0,7);c.fill()}
  for(let i=0;i<12;i++){const dx=wx+((r()*ww+t*8)%ww),dy=wy+((r()*wh+t*60*(.5+r()))%wh);c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1;if(v>.5){c.beginPath();c.moveTo(dx,dy);c.lineTo(dx-2,dy+8);c.stroke()}}
  c.restore();
  c.strokeStyle=v>.5?'#22332e':'#5a3d2a';c.lineWidth=w*.022;c.strokeRect(wx,wy,ww,wh);c.lineWidth=w*.012;c.beginPath();c.moveTo(wx+ww/2,wy);c.lineTo(wx+ww/2,wy+wh);c.moveTo(wx,wy+wh*.45);c.lineTo(wx+ww,wy+wh*.45);c.stroke();
  c.fillStyle=v>.5?'#1f3a2c':'#2f5a3f';for(let i=0;i<9;i++){c.save();c.translate(w*(.06+r()*.08),h*(.25+r()*.4));c.rotate(r()*3+Math.sin(t*.8+i)*.05);c.beginPath();c.ellipse(0,0,w*.08,w*.025,0,0,7);c.fill();c.restore()}
  c.fillStyle=lg(c,0,h*.7,0,h,[[0,'#7a5236'],[1,'#4f3422']]);c.fillRect(0,h*.7,w,h*.3);
  c.strokeStyle='rgba(0,0,0,.12)';c.lineWidth=1;for(let i=0;i<7;i++){c.beginPath();c.moveTo(0,h*(.73+i*.04));c.bezierCurveTo(w*.3,h*(.72+i*.04),w*.6,h*(.75+i*.04),w,h*(.73+i*.04));c.stroke()}
  const cx=w*.5,cy=h*.8;c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(cx,cy+h*.06,w*.2,h*.025,0,0,7);c.fill();
  c.fillStyle='#f2ede6';c.beginPath();c.ellipse(cx,cy+h*.05,w*.18,h*.03,0,0,7);c.fill();
  c.fillStyle='#faf7f2';c.beginPath();c.moveTo(cx-w*.1,cy-h*.06);c.lineTo(cx+w*.1,cy-h*.06);c.lineTo(cx+w*.075,cy+h*.04);c.lineTo(cx-w*.075,cy+h*.04);c.fill();
  c.strokeStyle='#faf7f2';c.lineWidth=w*.014;c.beginPath();c.arc(cx+w*.105,cy-h*.02,w*.03,-1.4,1.4);c.stroke();
  c.fillStyle='#6b3f24';c.beginPath();c.ellipse(cx,cy-h*.06,w*.1,h*.016,0,0,7);c.fill();c.fillStyle='#e9d6bc';c.beginPath();c.ellipse(cx,cy-h*.06,w*.04,h*.008,0,0,7);c.fill();
  steam(c,cx,cy-h*.08,w,h,t);
},
water(c,w,h,t,r,v){
  c.fillStyle='#1d3a2b';c.fillRect(0,0,w,h);
  for(let i=0;i<60;i++){c.fillStyle=['#2f5a3f','#3f7350','#284a36','#4f8a5e','#5f9a6a'][i%5];c.beginPath();c.arc(r()*w,r()*h*.75,w*(.05+r()*.09),0,7);c.fill()}
  c.fillStyle='#46524c';c.beginPath();c.moveTo(w*.28,h*.05);c.lineTo(w*.4,h*.1);c.lineTo(w*.38,h*.75);c.lineTo(w*.22,h*.78);c.fill();
  c.beginPath();c.moveTo(w*.72,h*.04);c.lineTo(w*.6,h*.1);c.lineTo(w*.62,h*.75);c.lineTo(w*.8,h*.78);c.fill();
  c.fillStyle=lg(c,w*.4,0,w*.6,0,[[0,'rgba(220,240,240,.55)'],[.5,'rgba(255,255,255,.85)'],[1,'rgba(220,240,240,.55)']]);c.fillRect(w*.39,h*.09,w*.22,h*.66);
  c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=Math.max(1.2,w*.004);c.lineCap='round';
  for(let i=0;i<46;i++){const x=w*.39+r()*w*.22,len=h*(.04+r()*.1),y=h*.09+((t*.5*(.7+r()*.6)+r())%1)*h*.66;c.beginPath();c.moveTo(x,y);c.lineTo(x,Math.min(y+len,h*.75));c.stroke()}
  c.fillStyle=lg(c,0,h*.74,0,h,[[0,'#4f9c96'],[1,'#1a4f55']]);c.beginPath();c.ellipse(w*.5,h*.88,w*.6,h*.16,0,0,7);c.fill();
  for(let k=0;k<4;k++){const p=(t*.35+k/4)%1;c.strokeStyle=`rgba(255,255,255,${.5*(1-p)})`;c.lineWidth=1.5;c.beginPath();c.ellipse(w*.5,h*.8,w*.12+p*w*.35,h*.02+p*h*.06,0,0,7);c.stroke()}
  fog(c,w,h,h*.76,t,.5,'235,245,245',1);
  ridge(c,w,h,h*.97,h*.02,3,'#173126',0);
},
river(c,w,h,t,r,v){
  c.fillStyle=lg(c,0,0,0,h*.55,v>.5?[[0,'#2b3466'],[1,'#d98a7a']]:[[0,'#f0a96a'],[1,'#f7dba5']]);c.fillRect(0,0,w,h*.56);
  const sx=w*.3,sy=h*.4;glow(c,sx,sy,w*.4,'255,220,160',.7);c.fillStyle='#fff1d0';c.beginPath();c.arc(sx,sy,w*.05,0,7);c.fill();
  c.fillStyle=v>.5?'#1e2140':'#4a4a32';c.beginPath();c.moveTo(0,h*.56);for(let i=0;i<=50;i++){const x=i/50*w;c.lineTo(x,h*.5-Math.abs(Math.sin(i*1.7))*h*.04-Math.abs(Math.sin(i*.6))*h*.03)}c.lineTo(w,h*.56);c.fill();
  c.fillStyle=lg(c,0,h*.56,0,h,v>.5?[[0,'#5a4a6a'],[1,'#141632']]:[[0,'#d39f6a'],[1,'#3f4a52']]);c.fillRect(0,h*.56,w,h*.44);
  for(let i=0;i<60;i++){const y=h*.57+r()*h*.43,x=(r()*w+t*12*(1+r()))%w,len=w*(.02+r()*.07);c.strokeStyle=`rgba(255,226,176,${.15+.25*r()})`;c.lineWidth=1.2;c.beginPath();c.moveTo(x,y);c.lineTo(x+len,y);c.stroke()}
  for(let y=h*.57;y<h;y+=h*.012){const ww=w*.04*(1+Math.sin(y*.3+t*3)*.5);c.fillStyle='rgba(255,236,190,.5)';c.fillRect(sx-ww/2+Math.sin(y+t*2)*3,y,ww,2)}
  const bx=((t*.02)%1.3-.15)*w,by=h*.72;c.fillStyle='#1b1712';c.beginPath();c.moveTo(bx-w*.12,by);c.quadraticCurveTo(bx,by+h*.03,bx+w*.12,by-h*.01);c.lineTo(bx-w*.12,by);c.fill();c.fillRect(bx-w*.02,by-h*.035,w*.03,h*.03);
},
stay(c,w,h,t,r,v){
  const night=v>.5;
  c.fillStyle=lg(c,0,0,0,h*.5,night?[[0,'#0c1530'],[1,'#3a3a6a']]:[[0,'#8fcfe6'],[1,'#e6f3ef']]);c.fillRect(0,0,w,h*.5);
  if(night)stars(c,w,h,t,r,40,.4);
  ridge(c,w,h*.5,h*.38,h*.04,1.7,night?'#1c2244':'#9cb9ad',0);
  c.fillStyle=night?'#2a2a3a':'#e7dccb';c.fillRect(0,h*.46,w,h*.54);
  c.save();c.beginPath();c.moveTo(w*.15,h*.55);c.lineTo(w*.85,h*.55);c.lineTo(w*1.02,h);c.lineTo(-w*.02,h);c.closePath();
  c.fillStyle=lg(c,0,h*.55,0,h,night?[[0,'#2fb6c9'],[1,'#0e5e78']]:[[0,'#6fd6dc'],[1,'#1f8fa8']]);c.fill();c.clip();
  c.strokeStyle=`rgba(255,255,255,${night?.22:.3})`;c.lineWidth=1.4;
  for(let k=0;k<14;k++){const y0=h*(.57+k*.032);c.beginPath();for(let i=0;i<=30;i++){const x=i/30*w,y=y0+Math.sin(i*.9+t*1.4+k)*h*.006;i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()}
  if(night)glow(c,w*.5,h*.8,w*.4,'120,240,255',.35);c.restore();
  c.fillStyle=night?'#bfb7a8':'#ffffff';for(let i=0;i<3;i++){c.fillRect(w*(.12+i*.12),h*.49,w*.08,h*.025)}
  const sw=Math.sin(t*.9)*.04;c.strokeStyle=night?'#0d0f18':'#4a3a2a';c.lineWidth=w*.022;c.beginPath();c.moveTo(w*.9,h*.62);c.quadraticCurveTo(w*.92,h*.35,w*.8,h*.16);c.stroke();
  c.strokeStyle=night?'#0f1a16':'#2f5a3a';c.lineWidth=w*.014;for(let i=0;i<8;i++){const a=i/8*Math.PI*2+sw;c.beginPath();c.moveTo(w*.8,h*.16);c.quadraticCurveTo(w*.8+Math.cos(a)*w*.12,h*.16+Math.sin(a)*h*.02-h*.05,w*.8+Math.cos(a)*w*.2,h*.16+Math.sin(a)*h*.08+h*.04);c.stroke()}
  if(night){for(let i=0;i<6;i++){glow(c,w*(.1+i*.16),h*.46,w*.04,'255,200,120',.8)}}
},
food(c,w,h,t,r,v){
  c.fillStyle='#5f4130';c.fillRect(0,0,w,h);c.strokeStyle='rgba(0,0,0,.15)';c.lineWidth=2;for(let i=0;i<12;i++){c.beginPath();c.moveTo(0,i*h/11);c.bezierCurveTo(w*.3,i*h/11+6,w*.7,i*h/11-6,w,i*h/11);c.stroke()}
  const cx=w*.5,cy=h*.52,R0=Math.min(w,h)*.42;
  c.fillStyle='rgba(0,0,0,.25)';c.beginPath();c.arc(cx+6,cy+8,R0,0,7);c.fill();
  c.fillStyle='#ece5d8';c.beginPath();c.arc(cx,cy,R0,0,7);c.fill();
  c.fillStyle='#d5cbb9';c.beginPath();c.arc(cx,cy,R0*.86,0,7);c.fill();
  const g=c.createRadialGradient(cx,cy,0,cx,cy,R0*.78);const curry=v>.66?['#c7853f','#7d4320']:v>.33?['#e7b04a','#b0702a']:['#f2a54a','#c35f1e'];g.addColorStop(0,curry[0]);g.addColorStop(1,curry[1]);c.fillStyle=g;c.beginPath();c.arc(cx,cy,R0*.78,0,7);c.fill();
  c.strokeStyle='rgba(255,220,140,.5)';c.lineWidth=R0*.025;for(let i=0;i<14;i++){const a=r()*7,d=r()*R0*.5;c.beginPath();c.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d,R0*(.08+r()*.12),r()*6,r()*6+2);c.stroke()}
  c.strokeStyle='#f0c060';c.lineWidth=R0*.03;for(let i=0;i<16;i++){const a=r()*7,d=r()*R0*.2;c.beginPath();c.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d-R0*.05,R0*(.05+r()*.06),r()*6,r()*6+3);c.stroke()}
  c.fillStyle='rgba(200,40,30,.55)';for(let i=0;i<20;i++){const a=r()*7,d=R0*(.5+r()*.25);c.beginPath();c.arc(cx+Math.cos(a)*d,cy+Math.sin(a)*d,R0*.018,0,7);c.fill()}
  c.fillStyle='#7cb342';c.beginPath();c.arc(cx+R0*.95,cy-R0*.75,R0*.16,Math.PI*.1,Math.PI*1.1);c.fill();
  c.fillStyle='#a5577a';for(let i=0;i<3;i++){c.beginPath();c.arc(cx-R0*.95+i*R0*.18,cy+R0*.95,R0*.08,0,7);c.fill()}
  steam(c,cx,cy-R0*.1,w,h,t);
},
canyon(c,w,h,t,r,v){
  c.fillStyle=lg(c,0,0,0,h*.5,[[0,'#8ccbe4'],[1,'#e2f1f3']]);c.fillRect(0,0,w,h);
  c.fillStyle='#c27a4c';c.beginPath();c.moveTo(0,h*.12);c.lineTo(w*.38,h*.2);c.lineTo(w*.32,h*.62);c.lineTo(0,h*.66);c.fill();
  c.fillStyle='#a05a35';c.beginPath();c.moveTo(w,h*.1);c.lineTo(w*.62,h*.22);c.lineTo(w*.7,h*.62);c.lineTo(w,h*.66);c.fill();
  c.strokeStyle='rgba(80,30,10,.25)';c.lineWidth=2;for(let i=0;i<8;i++){const y=h*(.2+i*.055);c.beginPath();c.moveTo(0,y);c.lineTo(w*.34,y+h*.01);c.moveTo(w*.66,y+h*.01);c.lineTo(w,y);c.stroke()}
  c.fillStyle=lg(c,0,h*.6,0,h,[[0,'#59c6c1'],[1,'#17707e']]);c.fillRect(0,h*.6,w,h*.4);
  for(let i=0;i<40;i++){const y=h*.62+r()*h*.38,x=(r()*w+t*8)%w;c.fillStyle='rgba(255,255,255,.3)';c.fillRect(x,y,w*.04*r()+4,1.5)}
  const cols=['#ff6b6b','#ffd166','#06d6a0','#f78c6b'];for(let i=0;i<4;i++){const x=w*(.2+i*.18),y=h*(.72+(i%2)*.08)+Math.sin(t*1.5+i)*3;c.fillStyle=cols[i];c.fillRect(x,y,w*.08,h*.025)}
},
craft(c,w,h,t,r,v){
  c.fillStyle='#e9d8bd';c.fillRect(0,0,w,h);
  const pal=['#d9433b','#f0a830','#2f7d6d','#3b5ba5','#e46a8c','#8a4fb0','#1f9fb0'];
  for(let i=0;i<9;i++){const cx=w*(.12+(i%3)*.38+r()*.1),cy=h*(.12+Math.floor(i/3)*.36+r()*.08),R0=Math.min(w,h)*(.2+r()*.08),rot=t*.12*(i%2?1:-1)+i;
    c.save();c.translate(cx,cy);c.rotate(rot);c.fillStyle=pal[i%7];c.beginPath();c.arc(0,0,R0,0,7);c.fill();
    c.strokeStyle='rgba(0,0,0,.15)';c.lineWidth=1;for(let k=0;k<20;k++){const a=k/20*Math.PI*2;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*R0,Math.sin(a)*R0);c.stroke()}
    c.fillStyle='rgba(255,255,255,.6)';for(let k=0;k<6;k++){const a=k/6*Math.PI*2;c.beginPath();c.ellipse(Math.cos(a)*R0*.55,Math.sin(a)*R0*.55,R0*.14,R0*.06,a,0,7);c.fill()}
    c.fillStyle='rgba(255,240,200,.9)';c.beginPath();c.arc(0,0,R0*.12,0,7);c.fill();c.restore()}
},
tent(c,w,h,t,r,v){
  c.fillStyle=lg(c,0,0,0,h,[[0,'#0a1230'],[.6,'#27315c'],[1,'#3a3f68']]);c.fillRect(0,0,w,h);stars(c,w,h,t,r,80,.5);
  ['#2a3560','#222c52','#1a2244'].forEach((col,i)=>{ridge(c,w,h,h*(.55+i*.08),h*.05,i*2+1,col,t*.005*(i+1));fog(c,w,h,h*(.6+i*.08),t,.22,'200,210,240',i)});
  c.fillStyle='#141a36';c.fillRect(0,h*.8,w,h*.2);
  for(let i=0;i<4;i++){const tx=w*(.15+i*.22),ty=h*.84,s=w*(.09+(i%2)*.03),fl=.85+.15*Math.sin(t*6+i*2);
    glow(c,tx,ty-s*.4,s*2.2,'255,170,80',.35*fl);c.fillStyle=`rgba(255,${180+i*8},100,${.9*fl})`;c.beginPath();c.moveTo(tx-s,ty);c.lineTo(tx,ty-s*1.1);c.lineTo(tx+s,ty);c.fill();
    c.strokeStyle='#0a0d1c';c.lineWidth=2;c.stroke();c.fillStyle='#3a2410';c.beginPath();c.moveTo(tx-s*.18,ty);c.lineTo(tx,ty-s*.5);c.lineTo(tx+s*.18,ty);c.fill()}
  glow(c,w*.88,h*.9,w*.08,'255,120,40',.6+.3*Math.sin(t*9));
}};
export function paint(c,w,h,t,sc){c.save();SCENES[sc.type](c,w,h,t,R(sc.seed||1),sc.v||0);c.restore();
  const g=c.createRadialGradient(w/2,h/2,Math.min(w,h)*.3,w/2,h/2,Math.max(w,h)*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.28)');c.fillStyle=g;c.fillRect(0,0,w,h)}
const thumbCache=new Map();
export function thumb(sc,W,H){const k=sc.type+sc.seed+sc.v+W+'x'+H;if(thumbCache.has(k))return thumbCache.get(k);
  const cv=document.createElement('canvas'),d=1.5;cv.width=W*d;cv.height=H*d;const c=cv.getContext('2d');c.scale(d,d);paint(c,W,H,(sc.seed%7)+3,sc);
  const url=cv.toDataURL('image/jpeg',.82);thumbCache.set(k,url);return url}
const live=new Set();
export function liveCanvas(cv,scGetter){const item={cv,sc:scGetter};live.add(item);return item}
let lastFrame=0;
function loop(now){requestAnimationFrame(loop);if(now-lastFrame<30)return;lastFrame=now;const t=now/1000;
  for(const it of live){const cv=it.cv;if(!cv.isConnected){live.delete(it);continue}if(cv.closest('[hidden]'))continue;
    const d=Math.min(devicePixelRatio||1,1.75),W=cv.clientWidth,H=cv.clientHeight;if(!W||!H)continue;
    if(cv.width!==Math.round(W*d)||cv.height!==Math.round(H*d)){cv.width=Math.round(W*d);cv.height=Math.round(H*d);it.drawn=false}
    if(RM&&it.drawn)continue;const c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);paint(c,W,H,RM?4:t,typeof it.sc==='function'?it.sc():it.sc);it.drawn=true}}
requestAnimationFrame(loop);
export function unlive(cv){for(const it of live)if(it.cv===cv)live.delete(it)}
