/* Native Phaser rendering. Canvas is used only once to build individual texture assets. */
window.BlockPhaserScene=class extends Phaser.Scene{
 constructor(controller){super('BlockWings');this.controller=controller;this.pools={};this.emitters=[];this.fxIndex=0;}
 preload(){this.load.image('magicAtlas','assets/magic-v2.png');this.load.image('aircraft','assets/aircraft-v2.png');this.load.image('ocean','assets/coral-ocean.png');this.load.image('flare','assets/particles/magic_01.png');this.load.image('flame','assets/particles/fire_01.png');this.load.image('smoke','assets/particles/smoke_01.png');}
 create(){this.bg=this.add.image(0,0,'ocean').setOrigin(.5).setDepth(0);this.floor=this.add.graphics().setDepth(10);this.lines=this.add.graphics().setDepth(36);this.bars=this.add.graphics().setDepth(26);
 this.controller.boot(this);
 for(const [key,color]of Object.entries({ice:0x9eeaff,fire:0xffa25b,lightning:0xcdb0ff,nature:0x9df57d,blast:0xffce80,hit:0xa5faff})){
  const e=this.add.particles(0,0,'spark',{emitting:false,lifespan:{min:250,max:850},speed:{min:45,max:230},scale:{start:.8,end:0},alpha:{start:1,end:0},rotate:{min:0,max:360},gravityY:80,tint:color,blendMode:'ADD',maxParticles:220}).setDepth(45);this.emitters.push(e);this['emitter_'+key]=e;
 }
 this.exhaust=this.add.particles(0,0,'glow',{frequency:30,quantity:1,lifespan:300,speedY:{min:40,max:100},speedX:{min:-9,max:9},scale:{start:.28,end:0},alpha:{start:.75,end:0},tint:0x76eaff,blendMode:'ADD',maxParticles:30}).setDepth(19);this.emitters.push(this.exhaust);
 this.arsenal=new BlockArsenal(this);this.magicParticles=new BlockMagicParticles(this);this.exhaust.stop();this.controller.ready();
 }
 texture(key,width,height,paint){const t=this.textures.createCanvas(key,width,height);paint(t.context);t.refresh();}
 burst(x,y,color,n){if(!this.emitter_hit)return;const key=Object.keys(BlockCombat.spells).find(k=>BlockCombat.spells[k].color===color)||'hit';this['emitter_'+key].explode(Math.min(n,55),x,y);}
 reset(){this.arsenal?.reset();this.magicParticles?.reset();for(const e of this.emitters)e.killAll();this.cameras.main.shakeEffect.reset();}
 sprite(pool,i,key,x,y){const list=this.pools[pool]||(this.pools[pool]=[]);let s=list[i];if(!s){s=this.add.image(x,y,key);list[i]=s;}s.setTexture(key).setPosition(x,y).setVisible(true).setAlpha(1).setRotation(0).setScale(1).clearTint().setBlendMode('NORMAL');return s;}
 fx(key,x,y,size,angle=0,tint=null,alpha=1){const s=this.sprite('fx',this.fxIndex++,key,x,y).setDisplaySize(size,size).setRotation(angle).setAlpha(alpha).setDepth(35);if(tint)s.setTint(tint);return s;}
 magicFx(frame,x,y,size,angle=0,tint=null,alpha=1){return this.fx('magicAtlas',x,y,size,angle,tint,alpha).setFrame(frame).setDisplaySize(size,size);}
 ring(g,x,y,rx,ry,color,alpha=1,width=2){g.lineStyle(width,color,alpha);g.strokeEllipse(x,y,rx*2,ry*2);}
 lightning(a,b,seed,color=0xc7b6ff){const g=this.lines;for(const [width,c]of[[9,color],[2,0xffffff]]){g.lineStyle(width,c,width===9?.38:1);g.beginPath();g.moveTo(a.x,a.y);for(let i=1;i<10;i++)g.lineTo(a.x+(b.x-a.x)*i/10+Math.sin(seed+i*13)*18,a.y+(b.y-a.y)*i/10);g.lineTo(b.x,b.y);g.strokePath();}}
 renderModel(m){this.model=m;const playing=m.state==='playing';this.emitters.forEach(e=>e.setActive(playing));if(playing)this.tweens.resumeAll();else this.tweens.pauseAll();this.fxIndex=0;this.floor.clear();this.lines.clear();this.bars.clear();
 this.magicParticles.tick(m.time);const {w,h,time}=m,scale=Math.max(w/this.bg.width,h/this.bg.height);this.bg.setPosition(w/2,h/2).setScale(scale);
 const ship=this.sprite('player',0,'aircraft',m.player.x,m.player.y).setFrame('fighter').setDepth(25).setDisplaySize(w<600?103:150,w<600?100:138);
 ship.setRotation(Phaser.Math.Clamp((m.player.tx-m.player.x)*.003,-.2,.2));
 const shadow=this.sprite('shadow',0,'aircraft',ship.x+12,ship.y+28).setFrame('fighter').setDisplaySize(ship.displayWidth,ship.displayHeight).setTintFill(0x093c56).setAlpha(.16).setDepth(8);
 if(m.shield)this.ring(this.lines,ship.x,ship.y,60,60,0xa9f6ff,.7,3);
 // Layered beam cores and trajectory ribbons are independent, pooled WebGL sprites.
 m.bullets.forEach((b,i)=>{
  const keys=['plasma','plasma','laser','blade','plasma','bolt','pulse','crystalShot'],color=Phaser.Display.Color.HexStringToColor(b.color).color;
  const s=this.sprite('bullets',i,keys[b.style],b.x,b.y).setTint(color).setDepth(20).setBlendMode('NORMAL');
  s.setRotation(b.style===3?b.age*8:Math.atan2(b.vx,-b.vy));
  const sizes=[[13,27],[12,23],[9,115],[21,21],[13,24],[8,35],[24,14],[14,27]][b.style];s.setDisplaySize(...sizes);if([0,1,4,5].includes(b.style))this.fx('bolt',b.x,b.y-3,7,s.rotation,null,.8).setDisplaySize(2,9);
  if(!m.reduced&&[1,3,4,7].includes(b.style)&&b.trail.length>2){this.lines.lineStyle(b.style===3?2:3,color,.22);this.lines.beginPath();this.lines.moveTo(b.trail[0].x,b.trail[0].y);for(const p of b.trail)this.lines.lineTo(p.x,p.y);this.lines.strokePath();}
 });this.hideAfter('bullets',m.bullets.length);
 m.drones.forEach((d,i)=>{
  const key=['drone','bomber','interceptor'][d.kind||0],size=d.kind===1?91:74;
  const s=this.sprite('monsters',i,'aircraft',d.x,d.y).setFrame(key).setDepth(16).setDisplaySize(size,size*.94).setRotation(Phaser.Math.Clamp(Math.atan2(-(d.vx||0),Math.max(35,d.vy||35)),-.55,.55)+Math.sin(time*90)*(d.flash||0)*.25);
  if(d.flash>.12)s.setTintFill(0xe7faff);else if(d.frozen)s.setTint(0x8bdfff);
  s.setScale(s.scaleX*(1+(d.flash||0)*.5),s.scaleY*(1-(d.flash||0)*.5));
  this.bars.fillStyle(0x193e48,.8).fillRoundedRect(d.x-24,d.y-49,48,4,2);this.bars.fillStyle(0xaef28a,1).fillRoundedRect(d.x-24,d.y-49,48*d.hp/d.maxHp,4,2);
  if(d.frozen)this.fx('iceShell',d.x,d.y,size,0,null,.7);
  if(d.burning)this.fx('flame',d.x,d.y+15,55+Math.sin(time*14)*5,0,0xffba70,.8).setBlendMode('ADD');
  if(d.rooted)this.ring(this.lines,d.x,d.y+10,36,18,0x94e976,1,4);
 });this.hideAfter('monsters',m.drones.length);
 this.arsenal.render(m);
 if(m.target){this.sprite('target',0,'block_'+m.entry.id,m.target.x,m.target.y).setDepth(38).setAlpha(1).setBlendMode('NORMAL').setScale(w<600?.7:1);}else this.hideAfter('target',0);
 m.pickups.forEach((p,i)=>this.sprite('pickups',i,'pickup',p.x,p.y).setDepth(23).setRotation(time));this.hideAfter('pickups',m.pickups.length);
 if(m.blizzard)this.ice(m.blizzard,m.reduced);for(const field of m.fields)this.spell(field,m.reduced);
 this.hideAfter('fx',this.fxIndex);
 }
 hideAfter(pool,count){const list=this.pools[pool]||[];for(let i=count;i<list.length;i++)list[i].setVisible(false);}
 impact(x,y,type,id=type){this.magicParticles.impact(x,y,type,id);if(type==='blast'||type==='fire')this.controller.sound('blast',0,type==='blast'?1.2:.8);}
 ice(storm,reduced){const fade=Math.min(1,storm.age*3,(storm.duration-storm.age)*2);
 for(let i=0;i<(reduced?15:65);i++){const x=(i*137+storm.age*50)%storm.width,y=(i*73+storm.age*150)%(storm.height*.73);this.fx('spark',x,y,i%3===0?6:3,storm.age,null,fade*.85);}
 for(const p of storm.shards){if(p.hit)continue;const alt=(1-p.age/p.fall)*270,x=p.x-alt*.24,y=p.y-alt;this.magicFx('frost',x,y,p.size*4,-.2);this.fx('glow',x,y,p.size*4,0,0x92edff,.25).setBlendMode('ADD');this.lines.lineStyle(3,0xb5f5ff,.45).lineBetween(x-14,y-55,x,y);}
 for(const p of storm.impacts){const t=p.age/.75;this.ring(this.floor,p.x,p.y,15+t*80,8+t*35,0xc8faff,1-t,3);if(!p.rendered){p.rendered=true;this.impact(p.x,p.y,'ice');}for(let i=0;i<7;i++){const a=i*.897;this.fx('iceShard',p.x+Math.cos(a)*t*70,p.y+Math.sin(a)*t*35-20*Math.sin(t*Math.PI),14*(1-t),a,null,1-t);}}
 }
 spell(s,reduced){const id=s.p.id,type=s.p.type,color=Phaser.Display.Color.HexStringToColor(BlockItemVFX.specs[id].color).color;

 for(const e of s.events){const t=Math.min(1,e.age/e.delay),after=e.age-e.delay,alpha=e.hit?Math.max(0,1-after):1;
 if(!e.hit)this.ring(this.floor,e.x,e.y,20+t*22,9+t*10,color,.65,2);else if(!e.rendered){e.rendered=true;this.impact(e.x,e.y,type,id);if(type==='lightning')for(const p of e.points.slice(1))this.magicParticles.impact(p.x,p.y,type,id);}
 if(id==='fire'){
  if(!e.hit){const alt=(1-t)*330,x=e.x-alt*.37,y=e.y-alt;this.magicFx('lava',x,y,82,-.35);this.fx('flame',x-25,y-65,110,-.4,0xff9e4f,.85).setBlendMode('ADD');this.fx('glow',x,y,100,0,0xff9846,.4).setBlendMode('ADD');}
  else{this.magicFx('explosion',e.x,e.y,95+after*65,after*.4,null,alpha*.8);this.fx('smoke',e.x,e.y-after*50,90+after*80,0,0x837483,alpha*.45);this.ring(this.floor,e.x,e.y,20+after*100,10+after*35,0xffb25c,alpha,3);}}
 else if(id==='tnt'){
  if(!e.hit)this.fx('block_tnt',e.x,e.y-(1-t)*170,65,Math.sin(t*4)*.12);
  else{this.fx('glow',e.x,e.y,80+after*220,0,0xffab38,alpha*.8).setBlendMode('ADD');this.fx('smoke',e.x,e.y-after*45,120+after*120,after,0xa38c82,alpha*.5);this.ring(this.lines,e.x,e.y,25+after*170,15+after*80,0xffd886,alpha,4);}}
 else if(id==='lightning'){
  if(e.hit&&after<.32){this.lightning({x:e.x-30,y:-5},e,e.seed);for(let i=1;i<e.points.length;i++)this.lightning(e.points[i-1],e.points[i],e.seed+i);for(const p of e.points)this.magicFx('electric',p.x,p.y,85,after*2,null,alpha*.85);}}
 else this.item(s,e,t,after,alpha,color);
 }
 }
 item(s,e,t,after,alpha,color){const spec=BlockItemVFX.specs[s.p.id],mode=spec.mode,key='icon_'+s.p.id; if(e.hit&&!['grow','bloom','field'].includes(mode))alpha*=.3;const stamp=(x,y,size,angle=0)=>this.fx(key,x,y,size,angle,null,alpha);
 if(['grow','bloom','field'].includes(mode)){
  if(mode==='grow'){stamp(e.x,e.y-30*t,(s.p.id==='tree'?150:90)*t);if(e.hit)for(let i=0;i<5;i++)this.lines.lineStyle(4,color,alpha).lineBetween(e.x,e.y+20,e.x+(i-2)*25,e.y+48);}
  else if(mode==='bloom'){stamp(e.x,e.y,110*t,e.age*.5);if(e.hit)for(let i=0;i<8;i++){const a=i*Math.PI/4+after;stamp(e.x+Math.cos(a)*after*90,e.y+Math.sin(a)*after*55,26,a);}}
  else for(let i=-2;i<=2;i++)stamp(e.x+i*28,e.y+Math.sin(e.age*4+i)*10,65*t);
 }else if(['wave','pulse','rays'].includes(mode)){stamp(e.x,e.y,75,e.age*.1);for(let i=0;i<4;i++)this.ring(this.lines,e.x,e.y,20+e.age*85+i*15,8+e.age*32+i*5,color,alpha*.6,3);}
 else if(['tornado','vortex'].includes(mode)){for(let i=0;i<9;i++)this.ring(this.lines,e.x+Math.sin(e.age*5+i)*10,e.y-i*11,10+i*4,6,color,alpha,2);if(mode==='vortex')stamp(e.x,e.y-25,85);if(s.p.id==='sand')for(let i=0;i<20;i++)this.fx('spark',e.x+Math.sin(i+e.age*4)*50,e.y-(i%9)*10,5,0,color,alpha);}
 else if(['orbit','spin','spiral','swarm','cloud'].includes(mode)){const count=mode==='swarm'?8:4;for(let i=0;i<count;i++){const a=e.age*4+i*Math.PI*2/count,r=mode==='spiral'?15+e.age*45:45;stamp(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r*.55,45,mode==='spin'?a*2:0);}}
 else{let x=e.x,y=e.y;if(!e.hit){if(mode==='rain'){y-=(1-t)*230;x-=(1-t)*40;}else if(mode==='charge')x-=(1-t)*240;else if(mode==='pounce'||mode==='bounce'){x-=(1-t)*100;y-=Math.sin(t*Math.PI)*100;}else if(mode==='swim'||mode==='fly'){x-=(1-t)*190;y+=Math.sin(t*7)*40;}else if(mode==='rise')y+=(1-t)*90;}stamp(x,y,85,['bounce','crack'].includes(mode)?e.age*2:0);if(e.hit)for(let i=0;i<8;i++){const a=i*Math.PI/4;stamp(e.x+Math.cos(a)*after*90,e.y+Math.sin(a)*after*45,20,a);}}
 }
 update(now,delta){this.controller.step(Math.min(delta/1000,.04));}
};
