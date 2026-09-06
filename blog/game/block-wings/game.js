(() => {
'use strict';
const $=id=>document.getElementById(id),host=$('game');let canvas=host,ctx,engineScene=null;
const blocks=[
{id:'ice',cn:'冰块',en:'Ice',top:'#c2efff',front:'#389fdf',side:'#1e629e'},
{id:'tnt',cn:'炸药',en:'TNT',top:'#e77553',front:'#d74535',side:'#a32d28'},
{id:'grass',cn:'草方块',en:'Grass Block',top:'#7cb64c',front:'#966843',side:'#735039'},
{id:'log',cn:'橡木',en:'Oak Log',top:'#d7b17a',front:'#93643d',side:'#704626'},
{id:'diamond',cn:'钻石块',en:'Diamond Block',top:'#96f5ec',front:'#42c8ce',side:'#269ba8'},
{id:'stone',cn:'石头',en:'Stone',top:'#b8bcc0',front:'#969ca3',side:'#717982'},
{id:'sand',cn:'沙子',en:'Sand',top:'#fff0b9',front:'#e6d398',side:'#c8b67e'},
{id:'brick',cn:'砖块',en:'Bricks',top:'#ce8870',front:'#b9705d',side:'#945244'}];
const curriculum=window.BLOCK_CURRICULUM,combat=window.BlockCombat;
let enemySerial=0,sfx=null;let weaponOffset=0;let levelIndex=0,bank=0,clip=null,magic=[],shake=0,hitStop=0,blizzard=null,spellFields=[];
const tinted={};const textures={};for(const name of ['fire_01','magic_01','smoke_01']){textures[name]=new Image();textures[name].src=`assets/particles/${name}.png`;}
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,bg=new Image();bg.src='assets/coral-ocean.png';
let w=1000,h=700,state='ready',muted=false,audio=null,order=[],pair=0,phase=0,score=0,time=0,last=0;
let target=null,bullets=[],drones=[],particles=[],rings=[],pickups=[],shotTime=0,spawnTime=0,powerTime=0,power=0,shield=0;
let gap=0,feedbackTime=0,speaking=false,speechToken=0,speechDeadline=0;
const player={x:500,y:560,tx:500,ty:560};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),rand=(a,b)=>a+Math.random()*(b-a);
const current=()=>order[pair]||blocks[0];
const field=()=>['cn','en','sentenceCn','sentenceEn'][phase];
const label=()=>current()[field()];
function shuffle(){const deck=curriculum.levels[levelIndex].words.slice(bank*5,bank*5+5).map(e=>{const skin=blocks.find(b=>b.id===e.id)||blocks.find(b=>b.id===({fire:'tnt',lightning:'diamond',nature:'grass',blast:'stone',ice:'ice'}[e.spell]));return {...skin,...e};});for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
function showMenu(){pause();state='ready';cancelSpeech();target=null;$('targetLabel').hidden=true;$('overlay').hidden=false;$('steps').hidden=true;$('levelSelect').hidden=false;$('bank').hidden=false;$('overlayTitle').textContent='选择你的魔法关卡';$('overlayText').textContent='5 个单词 + 5 个短句 · 每项先中文、再英文';$('start').textContent='开始这一关 →';$('pause').disabled=true;}
function menu(){ $('levelSelect').replaceChildren(...curriculum.levels.map((level,i)=>{const b=document.createElement('button');b.textContent=`${i+1}. ${level.name}`;b.className=i===levelIndex?'selected':'';b.onclick=()=>{levelIndex=i;menu();};return b;}));$('bank').textContent=`词组 ${bank?'B':'A'} · 换一组`;}
$('changeWeapon').onclick=()=>{weaponOffset++;engineScene?.arsenal.animate('shockwave',player.x,player.y,30,155,380,0x8aefff);};
$('bank').onclick=()=>{bank=1-bank;menu();};$('levels').onclick=showMenu;
$('library').onclick=()=>{pause();$('wordLibrary').showModal();};$('closeLibrary').onclick=()=>$('wordLibrary').close();
for(const level of curriculum.levels){const section=document.createElement('section');const h=document.createElement('h3');h.textContent=level.name;section.append(h);for(const e of level.words){const row=document.createElement('p');row.textContent=`${e.cn} / ${e.en} — ${e.sentenceEn} （${e.sentenceCn}） · ${BlockSpells.names[e.id]}：${BlockItemVFX.specs[e.id].description}`;section.append(row);}$('libraryContent').append(section);}
menu();
function resize(){const rect=host.getBoundingClientRect(),ow=w,oh=h;w=rect.width;h=rect.height;if(engineScene)engineScene.scale.resize(w,h);player.x=player.x/ow*w;player.y=player.y/oh*h;player.tx=player.x;player.ty=player.y;if(target){target.x=target.x/ow*w;target.y=target.y/oh*h;}}
new ResizeObserver(resize).observe(host);
function initAudio(){if(muted)return;try{const A=window.AudioContext||window.webkitAudioContext;if(A){audio ||=new A();sfx ||=new BlockSFX(audio);audio.resume().catch(()=>{});}}catch(_){}}
function tone(freq,vol=.025){if(muted||!audio||audio.state!=='running')return;const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.17);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.18);}
function cancelSpeech(){if(clip){clip.pause();clip=null;}speechToken++;speaking=false;if('speechSynthesis'in window)speechSynthesis.cancel();}
function fallbackSpeech(text,lang){
 cancelSpeech();if(muted)return;
 if(!('speechSynthesis'in window)){$('voiceNotice').hidden=false;$('voiceNotice').textContent='当前浏览器不支持朗读，仍可看文字游玩。';return;}
 const token=speechToken,u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=.8;u.pitch=1;
 const voices=speechSynthesis.getVoices(),voice=voices.find(v=>v.lang===lang)||voices.find(v=>v.lang.startsWith(lang.slice(0,2)));if(voice)u.voice=voice;
 speaking=true;speechDeadline=time+7;
 u.onend=()=>{if(token===speechToken)speaking=false;};
 u.onerror=()=>{if(token===speechToken){speaking=false;$('voiceNotice').hidden=false;$('voiceNotice').textContent='朗读暂不可用，请检查设备的中文、英语语音和声音设置。';}};
 try{speechSynthesis.speak(u);}catch(_){speaking=false;}
}
function speakHit(text,lang){cancelSpeech();if(muted)return;const token=speechToken;clip=new Audio(`assets/speech/${current().id}-${field()}.mp3`);speaking=true;speechDeadline=time+12;clip.onended=()=>{if(token===speechToken)speaking=false;};const fallback=()=>{if(token===speechToken)fallbackSpeech(text,lang);};clip.onerror=fallback;clip.play().catch(fallback);}
function monster(x=rand(w*.12,w*.88),y=-30){const profile=BlockEnemyMotion.profiles[enemySerial++%6],kind=profile.kind,hp=(kind===1?24:14)+levelIndex*2;return {...profile,x,y,r:26,side:x<w/2?1:-1,speed:profile.speed*(.9+Math.random()*.2)+levelIndex*3,seed:rand(0,6),color:['#b983ec','#efab62','#72dca4'][kind],hp,maxHp:hp,displayHp:hp,frozen:0,burning:0,rooted:0};}
function soundFX(kind,variant=0,power=1){if(!muted&&sfx){sfx.duck(speaking);sfx.play(kind,variant,power);}}
function enemyHit(d,x,y,kind='hit'){if((d.feedbackAt||-1)>time)return;d.feedbackAt=time+.085;d.stagger=.035;engineScene.arsenal.hit(x,y,d.color,kind==='laser');soundFX(kind);}
function rewardDead(){for(const d of drones)if(d.dead&&!d.rewarded){d.rewarded=true;score+=10;engineScene?.arsenal.death(d);}$('score').textContent=score;}
function spellSound(type){if(muted||!audio)return;const duration=type==='blast'?.5:.25,o=audio.createOscillator(),g=audio.createGain();o.type=type==='lightning'?'sawtooth':'triangle';o.frequency.setValueAtTime({blast:100,ice:1200,fire:220,lightning:700,nature:440}[type],audio.currentTime);o.frequency.exponentialRampToValueAtTime(type==='ice'?600:45,audio.currentTime+duration);g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}
function spellImpact(type,x,y,radius,profile){let count=0;for(const d of drones)if(!d.dead&&Math.hypot(d.x-x,d.y-y)<radius){count++;combat.damage(d,{ice:.9,blast:6,fire:1.6,lightning:2.5,nature:1.5}[type]);if(type==='ice')d.frozen=1.8;if(type==='fire')d.burning=3;if(type==='nature')d.rooted=3;}burst(x,y,combat.spells[type].color,reduced?5:15);if(!reduced)shake=Math.max(shake,type==='blast'?6:2);$('spellStatus').textContent=`${profile.name} · 命中 ${count} 只`;rewardDead();}
function castMagic(x,y){if(phase!==3){$('spellStatus').textContent=`魔法蓄能 ${phase+1}/4 · 英文短句释放`;return;}const entry=current(),type=entry.spell||'blast',profile=BlockSpells.profile(entry);engineScene.magicParticles.impact(x,y,type,entry.id,true);if(entry.id==='ice')blizzard=BlockBlizzard.create(w,h);else{spellFields=spellFields.filter(f=>f.p.type!==type);spellFields.push(BlockSpells.create(entry,x,y,w,h));}burst(x,y,combat.spells[type].color,35);hitStop=reduced?0:.05;spellSound(type);$('spellStatus').textContent=`${profile.name} · 施法中`;}
function burst(x,y,color,n=36){engineScene?.burst(x,y,color,reduced?Math.min(n,10):n);}
function spawnTarget(){bullets=[];target={x:w*rand(.3,.7),y:Math.max(200,h*.32),r:w<600?40:53,age:0};$('targetLabel').style.left=`${target.x}px`;$('targetLabel').style.top=`${target.y-target.r*.92-10}px`;$('targetLabel').textContent=label();$('spellStatus').textContent=phase===3?`★ ${BlockSpells.profile(current()).name} · 大招就绪`:`魔法蓄能 ${phase}/4 · 英文短句释放`;$('targetLabel').classList.toggle('sentence',phase>1);$('lessonStep').textContent=['单词 · 中文','单词 · English','短句 · 中文','短句 · English'][phase];$('targetLabel').hidden=false;}
function progress(){$('progressText').textContent=`${pair} / 5`;$('progressFill').style.width=`${pair/5*100}%`;$('status').textContent=`第 ${levelIndex+1} 关 · ${curriculum.levels[levelIndex].name} · 词组 ${bank?'B':'A'} · 已学 ${pair}/5 个单词和短句`;$('stageName').textContent=curriculum.levels[levelIndex].name;}
function start(){if(!engineScene)return;initAudio();if(state!=='paused'){engineScene.reset();cancelSpeech();order=shuffle();pair=0;phase=0;score=0;time=0;weaponOffset=0;enemySerial=0;bullets=[];drones=Array.from({length:6},(_,i)=>monster(w*(.13+i*.145),h*(i%2?.15:.27)));magic=[];blizzard=null;spellFields=[];shake=0;hitStop=0;particles=[];rings=[];pickups=[];power=0;shotTime=0;spawnTime=0;powerTime=0;shield=0;gap=0;feedbackTime=0;target=null;$('feedback').hidden=true;$('score').textContent='0';$('weapon').textContent='✦ 双发能量';player.x=w/2;player.y=h*.81;player.tx=player.x;player.ty=player.y;spawnTarget();}state='playing';$('levelSelect').hidden=true;$('bank').hidden=true;$('overlay').hidden=true;$('pause').disabled=false;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','暂停');progress();}
function pause(){if(state!=='playing')return;state='paused';engineScene.physics.pause();engineScene.emitters.forEach(e=>e.setActive(false));engineScene.tweens.pauseAll();cancelSpeech();$('overlayTitle').textContent='海岛在这里等你';$('overlayText').textContent='休息一下，准备好了再继续。';$('steps').hidden=true;$('start').textContent='继续飞行 →';$('overlay').hidden=false;$('pause').textContent='▶';$('pause').setAttribute('aria-label','继续');}
function finish(){state='complete';target=null;$('targetLabel').hidden=true;$('overlayTitle').textContent=`${curriculum.levels[levelIndex].name} · 通关！`;$('overlayText').textContent=`完成 5 个单词和 5 个短句，获得 ${score} 颗星星。休息一下，再出发！`;$('steps').hidden=true;$('start').textContent=levelIndex<4?'前往下一关 →':'完成旅程 · 换组再玩 →';$('overlay').hidden=false;$('pause').disabled=true;progress();}
function hit(){if(!target)return;const material=['ice','snow','water'].includes(current().id)?'ice':['tree','wood','leaf','flower','grass'].includes(current().id)?'wood':current().id==='tnt'?'blast':'stone';soundFX(material);engineScene.arsenal.blockHit(target,current());if(!reduced)hitStop=Math.max(hitStop,.045);const text=label(),lang=phase%2===0?'zh-CN':'en-US';castMagic(target.x,target.y);burst(target.x,target.y,current().front,phase===3?45:8);if(phase===3)burst(target.x,target.y,'#f0ffff',15);target=null;bullets=[];$('targetLabel').hidden=true;$('feedback').textContent=`♫ ${text}`;$('feedback').hidden=false;feedbackTime=2.1;score+=25;$('score').textContent=score;speakHit(text,lang);gap=phase===3?4.3:2.4;}
$('start').onclick=()=>{if(state==='complete'){if(levelIndex<4)levelIndex++;else{levelIndex=0;bank=1-bank;}menu();}start();};$('pause').onclick=()=>state==='playing'?pause():state==='paused'&&start();
$('sound').onclick=()=>{muted=!muted;sfx?.setMuted(muted);$('sound').textContent=muted?'♪ 声音关':'♫ 声音开';$('sound').setAttribute('aria-pressed',String(!muted));if(muted)cancelSpeech();else initAudio();};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('app').requestFullscreen();}catch(_){$('status').textContent='当前浏览器不支持全屏，可以直接游玩。';}};
function move(e){if(state!=='playing')return;const r=canvas.getBoundingClientRect(),margin=w<600?43:65;player.tx=clamp(e.clientX-r.left,margin,w-margin);player.ty=clamp(e.clientY-r.top,150,h-80);}
canvas.onpointermove=move;canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);move(e);};
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('keydown',e=>{if(e.code==='Escape')pause();if(e.code==='Space'&&e.target===document.body){e.preventDefault();state==='playing'?pause():start();}});
function update(dt){
 time+=dt;sfx?.duck(speaking);spellFields=spellFields.filter(f=>BlockSpells.update(f,dt,drones,spellImpact));if(blizzard&&!BlockBlizzard.update(blizzard,dt,drones,(x,y,radius)=>{for(const d of drones)if(!d.dead&&Math.hypot(d.x-x,d.y-y)<radius){combat.damage(d,.9);d.frozen=Math.max(d.frozen,1.8);}if(!reduced)shake=Math.max(shake,1.5);}))blizzard=null;for(const m of magic)m.life-=dt;magic=magic.filter(m=>m.life>0);shake=Math.max(0,shake-dt*22);shotTime+=dt;spawnTime+=dt;powerTime+=dt;shield=Math.max(0,shield-dt);if(target)target.age+=dt;
 if(speaking&&time>speechDeadline)cancelSpeech();
 if(feedbackTime>0){feedbackTime-=dt;if(feedbackTime<=0&&!speaking)$('feedback').hidden=true;}else if(!speaking)$('feedback').hidden=true;
 if(!target){gap-=dt;if(gap<=0&&!speaking){if(phase<3)phase++;else{phase=0;pair++;progress();}if(pair===5){finish();return;}spawnTarget();}}
 player.x+=(player.tx-player.x)*(1-Math.exp(-13*dt));player.y+=(player.ty-player.y)*(1-Math.exp(-13*dt));
 power=Math.max(0,power-dt);const bulletMode=(Math.floor(time/9)+weaponOffset)%BlockBullets.names.length;$('weapon').textContent=`${power?'★ 强化 · ':'✦ '}${BlockBullets.names[bulletMode]} + 追踪导弹`;
 if(shotTime>(bulletMode===2?.095:.085)){shotTime=0;engineScene.arsenal.muzzle(player,bulletMode);soundFX('shot',bulletMode);bullets.push(...BlockBullets.emit(bulletMode,player.x,player.y,time,power>0));if(bullets.length>600)bullets.splice(0,bullets.length-600);if(!reduced)particles.push({x:player.x+rand(-9,9),y:player.y+29,vx:rand(-8,8),vy:65,life:.5,r:4,color:'#bcfaff'});}
 if(spawnTime>.95){spawnTime=0;if(drones.length<18){const center=rand(w*.2,w*.8);for(let i=-1;i<=1;i++)drones.push(monster(clamp(center+i*80,45,w-45),-35-Math.abs(i)*35));}}
 if(powerTime>12){powerTime=0;pickups.push({x:rand(w*.2,w*.8),y:0});}
 for(const p of pickups){p.y+=70*dt;if(Math.hypot(p.x-player.x,p.y-player.y)<45){p.dead=true;power=9;burst(p.x,p.y,'#f1baff');tone(900);}}
 for(const d of drones){const speed=combat.tick(d,dt);BlockEnemyMotion.step(d,dt,speed,w);if(Math.hypot(d.x-player.x,d.y-player.y)<35){d.dead=true;shield=.6;burst(player.x,player.y,'#c3f9ff',18);}}
 const splitShots=[];for(const b of bullets){const oldX=b.x,oldY=b.y;BlockBullets.advance(b,dt);splitShots.push(...BlockBullets.split(b));
 // Swept hit testing keeps fast shots from skipping a block between frames.
 if(target&&target.age>.8&&Math.abs(b.x-target.x)<target.r&&b.y<=target.y+target.r&&oldY>=target.y-target.r){hit();b.dead=true;break;}
 for(const d of drones)if(!b.dead&&!d.dead&&!b.hitEnemies.has(d)&&BlockBullets.intersects(b,oldX,oldY,d.x,d.y,27)){b.hitEnemies.add(d);if(!b.pierce)b.dead=true;combat.damage(d,b.damage||1);enemyHit(d,b.x,Math.min(d.y+20,Math.max(d.y-20,b.y)),b.pierce?'laser':'hit');}
 }
 rewardDead();bullets.push(...splitShots);if(bullets.length>650)bullets.splice(0,bullets.length-650);bullets=bullets.filter(b=>!b.dead&&b.y>-30&&b.x>-20&&b.x<w+20);drones=drones.filter(d=>!d.dead&&d.y<h+40);pickups=pickups.filter(p=>!p.dead&&p.y<h+30);
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.vx*=Math.exp(-dt);p.vy*=Math.exp(-dt);}particles=particles.filter(p=>p.life>0);for(const r of rings){r.r+=100*dt;r.life-=dt;}rings=rings.filter(r=>r.life>0);
}
function polygon(points,color){ctx.beginPath();points.forEach(([x,y])=>ctx.lineTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();}
function tile(x,y,s,top,front,side){ctx.fillStyle=front;ctx.fillRect(x,y,s,s);polygon([[x,y],[x+s*.28,y-s*.3],[x+s*1.28,y-s*.3],[x+s,y]],top);polygon([[x+s,y],[x+s*1.28,y-s*.3],[x+s*1.28,y+s*.7],[x+s,y+s]],side);ctx.strokeStyle='#21394e22';ctx.lineWidth=.6;ctx.strokeRect(x,y,s,s);}
function blockSprite(block,x,y,size){ctx.save();ctx.translate(x-size*.64,y-size*.38);tile(0,0,size,block.top,block.front,block.side);
 ctx.save();ctx.beginPath();ctx.rect(0,0,size,size);ctx.clip();const unit=size/8;for(let r=0;r<8;r++)for(let c=0;c<8;c++){const n=(r*37+c*19+r*c*7)%11;ctx.fillStyle=n<5?'#ffffff18':'#12243318';ctx.fillRect(c*unit,r*unit,unit,unit);}
 if(block.id==='grass'){ctx.fillStyle=block.top;for(let c=0;c<8;c++)ctx.fillRect(c*unit,0,unit,unit*(c%3===0?2.5:1.6));}
 if(block.id==='tnt'){ctx.fillStyle='#f4eadb';ctx.fillRect(0,size*.32,size,size*.35);ctx.fillStyle='#372e2b';ctx.font=`900 ${size*.27}px monospace`;ctx.textAlign='center';ctx.fillText('TNT',size/2,size*.59);}
 if(block.id==='ice'||block.id==='diamond'){ctx.strokeStyle='#e8fcff';ctx.lineWidth=2;ctx.strokeRect(4,4,size-8,size-8);ctx.beginPath();ctx.moveTo(size*.15,size*.55);ctx.lineTo(size*.4,size*.3);ctx.moveTo(size*.55,size*.7);ctx.lineTo(size*.8,size*.45);ctx.stroke();}
 if(block.id==='log'){ctx.fillStyle='#34211644';for(let i=1;i<7;i++)ctx.fillRect(i*unit,0,unit*.3,size);}
 if(block.id==='brick'){ctx.strokeStyle='#f0d6b2aa';ctx.lineWidth=2;for(let r=0;r<4;r++){ctx.beginPath();ctx.moveTo(0,r*size/4);ctx.lineTo(size,r*size/4);for(let c=0;c<4;c++){const xx=(c+(r%2)*.5)*size/3;ctx.moveTo(xx,r*size/4);ctx.lineTo(xx,(r+1)*size/4);}ctx.stroke();}}
 drawBlockMark(block,size);ctx.restore();ctx.restore();}
function drawBlockMark(b,s){const colors={red:'#ef5052',blue:'#519bed',green:'#6cbc58',yellow:'#f5d34e',white:'#f7f9ec',black:'#343941',pink:'#f8a7c8',orange:'#f4a24e',purple:'#a079d3',brown:'#9b724f'};if(colors[b.id]){ctx.fillStyle=colors[b.id];ctx.fillRect(0,0,s,s);return;}
 if(['cat','dog','bird','pig','cow','sheep','duck','rabbit','horse','bee'].includes(b.id)){ctx.fillStyle='#e9c495';ctx.fillRect(s*.16,s*.18,s*.68,s*.66);ctx.fillRect(s*.16,s*.06,s*.18,s*.2);ctx.fillRect(s*.66,s*.06,s*.18,s*.2);ctx.fillStyle='#253b46';ctx.fillRect(s*.3,s*.4,s*.09,s*.12);ctx.fillRect(s*.62,s*.4,s*.09,s*.12);ctx.fillStyle='#d5898e';ctx.fillRect(s*.4,s*.63,s*.2,s*.1);return;}
 if(!['ice','tnt','grass','stone','sand'].includes(b.id)){const mark={fire:'火',lightning:'ϟ',water:'≈',snow:'❄',sun:'☀',moon:'☾',star:'★',wind:'≋',tree:'♣',flower:'✿',leaf:'♠',wood:'▥',dirt:'▦',seed:'•',rain:'☂',apple:'●',bread:'▰',milk:'▣',egg:'●',carrot:'▼',fish:'◀',cake:'▤',rice:'∴',banana:'☾',cookie:'●'}[b.id]||'✦';ctx.fillStyle='#fff7d8';ctx.font=`bold ${s*.57}px sans-serif`;ctx.textAlign='center';ctx.fillText(mark,s/2,s*.7);}}
function ship(){ctx.save();ctx.translate(player.x,player.y);const s=w<600?7:11;ctx.scale(s/8,s/8);ctx.fillStyle='#17496130';ctx.fillRect(-40,38,86,15);
 for(let row=3;row>=-5;row--)for(let col=-5;col<=5;col++){const wing=row>=0&&row<=1&&Math.abs(col)<=5,body=Math.abs(col)<=1&&row>=-4,tail=row===3&&Math.abs(col)<=3;if(wing||body||tail){const cyan=wing&&Math.abs(col)>1;tile(col*8,row*8,8,cyan?'#8be8eb':'#faf9e8',cyan?'#3cbbc4':'#d7e4df',cyan?'#288d9d':'#99b7b8');}}
 tile(-4,-43,8,'#ffe48f','#e4b444','#b39036');ctx.fillStyle='#245568';ctx.fillRect(-5,-24,12,20);ctx.fillStyle='#8de7ed';ctx.fillRect(-3,-22,8,5);
 for(const x of [-17,17]){ctx.shadowColor='#69efff';ctx.shadowBlur=14;ctx.fillStyle='#b5faff';ctx.fillRect(x,30,9,16+(reduced?0:Math.sin(time*30)*5));ctx.fillStyle='#44caef';ctx.fillRect(x+2,44,5,12);}ctx.shadowBlur=0;
 if(shield){ctx.strokeStyle='#e4ffff';ctx.lineWidth=3;ctx.strokeRect(-49,-48,100,103);}ctx.restore();}

function makeTextures(scene){
 const paint=(key,width,height,fn)=>scene.texture(key,width,height,c=>{ctx=c;fn(c);});
 paint('ship',180,180,()=>{const saved={...player};player.x=90;player.y=85;ship();Object.assign(player,saved);});
 paint('monster',90,100,c=>{c.fillStyle='#d7e5cf';c.fillRect(20,55,17,25);c.fillRect(52,55,17,25);c.fillRect(7,32,13,29);c.fillRect(69,32,13,29);tile(20,15,45,'#f4ffe2','#b2c49b','#849a76');c.fillStyle='#293c40';c.fillRect(28,29,10,10);c.fillRect(49,29,10,10);c.fillRect(38,45,14,9);});
 for(const entry of curriculum.levels.flatMap(l=>l.words)){const skin=blocks.find(b=>b.id===entry.id)||blocks[0];paint('block_'+entry.id,140,140,()=>{blockSprite({...skin,...entry},70,60,90);});paint('icon_'+entry.id,180,180,c=>{c.translate(90,90);BlockItemVFX.icon(c,entry.id,65,BlockItemVFX.specs[entry.id].color);});}
 paint('spark',12,12,c=>{c.fillStyle='#fff';c.fillRect(2,2,8,8);});
 paint('bolt',12,26,c=>{c.fillStyle='#77eaff';c.fillRect(3,0,6,26);c.fillStyle='#fff';c.fillRect(5,0,2,26);});
 paint('laser',14,48,c=>{c.fillStyle='#99ecff66';c.fillRect(0,0,14,48);c.fillStyle='#fff';c.fillRect(5,0,4,48);});
 paint('starBullet',22,22,c=>{c.translate(11,11);BlockItemVFX.icon(c,'star',10,'#fff');});
 paint('glow',96,96,c=>{const g=c.createRadialGradient(48,48,0,48,48,48);g.addColorStop(0,'#fff');g.addColorStop(.2,'#ffffffb0');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(0,0,96,96);});
 paint('iceShard',64,100,c=>{polygon([[32,95],[9,40],[22,6],[47,30]],'#75c9f4');polygon([[32,95],[22,6],[35,35]],'#eeffff');lineTexture(c,[[32,95],[47,30]],'#cbf5ff',2);});
 paint('iceShell',90,90,c=>{c.fillStyle='#9ddbff55';c.fillRect(8,8,74,74);c.strokeStyle='#deffff';c.lineWidth=3;c.strokeRect(8,8,74,74);});
 paint('meteor',80,80,c=>{const g=c.createRadialGradient(35,32,0,40,40,38);g.addColorStop(0,'#fff8bb');g.addColorStop(.35,'#ffc65d');g.addColorStop(1,'#c24620');c.fillStyle=g;c.beginPath();c.arc(40,40,32,0,Math.PI*2);c.fill();c.strokeStyle='#ffefaa';c.lineWidth=3;c.stroke();});
 paint('pickup',64,64,()=>tile(16,19,29,'#ffe0ff','#c087db','#8455a9'));
}
function lineTexture(c,points,color,width){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y])=>c.lineTo(x,y));c.stroke();}
$('start').disabled=true;$('start').textContent='正在准备飞行…';
const scene=new BlockPhaserScene({sound:soundFX,missileHit(enemy,x,y){for(const d of drones)if(!d.dead&&Math.hypot(d.x-x,d.y-y)<65)combat.damage(d,d===enemy?6:2);if(!reduced&&time>(scene.lastMissileStop||0)){hitStop=.028;scene.lastMissileStop=time+.35;}rewardDead();},boot(s){engineScene=s;canvas=s.game.canvas;canvas.setAttribute('aria-label','移动鼠标驾驶，自动射击');makeTextures(s);resize();},ready(){ $('start').disabled=false;$('start').textContent='开始飞行 →';if(engineScene.game.renderer.type!==Phaser.WEBGL){$('voiceNotice').hidden=false;$('voiceNotice').textContent='设备未启用 WebGL，已使用 Phaser Canvas 兼容模式。';}},step(dt){if(state==='playing'){if(hitStop>0)hitStop-=dt;else update(dt);}if(target){$('targetLabel').style.left=`${target.x}px`;$('targetLabel').style.top=`${target.y-target.r*.92-10}px`;}engineScene.renderModel({state,w,h,time,player,bullets,drones,target,entry:current(),pickups,shield,blizzard,fields:spellFields,reduced,hitStop});}});
window.blockGame=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:host.clientWidth,height:host.clientHeight,backgroundColor:'#29b7d2',render:{antialias:true,pixelArt:false,powerPreference:'high-performance'},scale:{mode:Phaser.Scale.RESIZE},scene:[scene],physics:{default:'arcade',arcade:{gravity:{x:0,y:0},debug:false}},audio:{noAudio:true},banner:false});
})();
