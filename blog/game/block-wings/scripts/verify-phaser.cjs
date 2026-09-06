const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/wsy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');require(path.join(root,'combat.js'));
const C=globalThis.BlockCombat;
const enemy=(x=100)=>({x,y:100,hp:8,maxHp:8,frozen:0,burning:0,rooted:0});
let e=enemy();C.cast('ice',100,100,[e]);assert.equal(e.hp,6);assert.equal(C.tick(e,.2),0);assert.equal(C.tick(e,4),1);
e=enemy();C.cast('fire',100,100,[e]);C.tick(e,1);assert.ok(e.hp<5);C.tick(e,5);assert.ok(e.hp<1);
let es=Array.from({length:8},(_,i)=>enemy(100+i*10));assert.equal(C.cast('lightning',100,100,es).length,5);assert.equal(es.filter(e=>e.hp===4).length,5);
es=[enemy(100),enemy(900)];C.cast('blast',100,100,es);assert.equal(es[0].dead,true);assert.equal(es[1].hp,8);
e=enemy();C.cast('nature',100,100,[e]);assert.equal(C.tick(e,.1),.2);
const data=JSON.parse(fs.readFileSync(path.join(root,'curriculum.json'),'utf8'));const entries=data.levels.flatMap(l=>l.words);assert.equal(entries.length,50);assert.equal(new Set(entries.map(e=>e.en)).size,50);assert.equal(new Set(entries.map(e=>e.sentenceEn)).size,50);
for(const e of entries)for(const field of ['cn','en','sentenceCn','sentenceEn'])assert.ok(fs.statSync(path.join(root,`assets/speech/${e.id}-${field}.mp3`)).size>1000);
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-unsafe-swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
 await page.addInitScript(()=>{window.clips=[];window.Audio=class{constructor(src){this.src=src;}play(){clips.push(this.src);this.t=setTimeout(()=>this.onended?.(),500);return Promise.resolve();}pause(){clearTimeout(this.t);}};});
 await page.goto('http://127.0.0.1:8765/blog/game/block-wings/');assert.equal(await page.locator('#levelSelect button').count(),5);await page.waitForFunction(()=>window.blockGame?.isBooted&&!document.getElementById('start').disabled);assert.equal(await page.evaluate(()=>blockGame.renderer.type),2);await page.locator('#start').click();assert.deepEqual(await page.evaluate(()=>clips),[]);
 for(let level=0;level<5;level++){
  for(let i=0;i<20;i++){
   for(let k=0;k<20&&!await page.locator('#targetLabel').isVisible();k++)await page.clock.runFor(250);
   const box=await page.locator('#targetLabel').boundingBox(),arena=await page.locator('canvas').boundingBox();assert.ok(box);
   await page.mouse.move(box.x+box.width/2,arena.y+arena.height*.81);
   for(let k=0;k<75&&await page.locator('#targetLabel').isVisible();k++)await page.clock.runFor(200);
   assert.equal(await page.locator('#targetLabel').isVisible(),false,`level ${level} target ${i}`);
   if(level===0&&i===0)await page.screenshot({path:path.join(root,'../../../tmp/block-magic-desktop.png'),fullPage:true});
   const clips=await page.evaluate(()=>window.clips);assert.equal(clips.length,level*20+i+1);assert.ok(clips.at(-1).endsWith('-'+['cn','en','sentenceCn','sentenceEn'][i%4]+'.mp3'));
   await page.clock.runFor(i%4===3?4500:2500);
  }
  // Impact hit-stop briefly extends the lesson timer beyond the visual spell duration.
  for(let k=0;k<25&&(await page.locator('#progressText').textContent())!=='5 / 5';k++)await page.clock.runFor(100);
  assert.equal(await page.locator('#progressText').textContent(),'5 / 5');assert.ok((await page.locator('#overlayTitle').textContent()).includes('通关'));
  if(level<4)await page.locator('#start').click();
 }
 const clips=await page.evaluate(()=>window.clips);for(let i=0;i<100;i+=4){const ids=clips.slice(i,i+4).map(p=>p.split('/').at(-1).split('-')[0]);assert.equal(new Set(ids).size,1);}
 assert.equal(new Set(clips.map(p=>p.split('/').at(-1).split('-')[0])).size,25);
 await page.locator('#start').click();assert.ok((await page.locator('#status').textContent()).includes('词组 B'));
 await page.locator('#pause').click();const score=await page.locator('#score').textContent();await page.clock.runFor(1000);assert.equal(await page.locator('#score').textContent(),score);await page.locator('#start').click();await page.locator('#library').click();assert.equal(await page.locator('#libraryContent p').count(),50);await page.locator('#closeLibrary').click();
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto('http://127.0.0.1:8765/blog/game/block-wings/');await mobile.locator('#sound').tap();await mobile.locator('#start').tap();await mobile.touchscreen.tap(90,600);await mobile.screenshot({path:path.join(root,'../../../tmp/block-magic-mobile.png'),fullPage:true});assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 // Decode every generated MP3 through the real browser audio pipeline.
 const audioPage=await browser.newPage();await audioPage.goto('http://127.0.0.1:8765/blog/game/block-wings/');const durations=await audioPage.evaluate(async()=>{const files=BLOCK_CURRICULUM.levels.flatMap(l=>l.words.flatMap(e=>['cn','en','sentenceCn','sentenceEn'].map(f=>`assets/speech/${e.id}-${f}.mp3`)));return await Promise.all(files.map(src=>new Promise(resolve=>{const a=new Audio(src);a.onloadedmetadata=()=>resolve(a.duration);a.onerror=()=>resolve(-1);setTimeout(()=>resolve(-1),10000);})));});assert.equal(durations.length,200);assert.ok(durations.every(d=>Number.isFinite(d)&&d>0));
 assert.deepEqual(errors,[]);console.log('PASS: 50 words/50 phrases, 200 audio files decoded, 5 stages/100 target hits, paired languages, A/B rollover, pause, library, mobile, and actual spell damage/status rules.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
