/* Native Arcade Physics missiles, pooled particle emitters, texture fragments and tweens. */
window.BlockArsenal=class{
 constructor(scene){
  this.s=scene;this.clock=.6;this.trailClock=0;this.lastTime=0;this.proxies=new Map();this.transients=new Set();this.stats={launched:0,hits:0,reacquired:0};
  const atlas=scene.textures.get('aircraft');
  for(let [key,x,y,w,h]of[['fighter',0,0,630,558],['drone',640,0,640,550],['bomber',0,557,635,665],['interceptor',640,565,640,660]]){
   const factor=atlas.source[0].width/1280;x=Math.round(x*factor);y=Math.round(y*factor);w=Math.round(w*factor);h=Math.round(h*factor);atlas.add(key,0,x,y,w,h);
   for(let row=0;row<3;row++)for(let col=0;col<3;col++)atlas.add(key+'_'+row+'_'+col,0,x+Math.floor(col*w/3),y+Math.floor(row*h/3),Math.floor(w/3),Math.floor(h/3));
  }
  const magic=scene.textures.get('magicAtlas'),cell=Math.floor(magic.source[0].width/2);for(const [i,key]of ['lava','frost','explosion','electric'].entries())magic.add(key,0,(i%2)*cell,Math.floor(i/2)*cell,cell,cell);
  this.makeTextures();
  this.missiles=scene.physics.add.group({defaultKey:'missile',maxSize:28,allowGravity:false});
  this.enemies=scene.physics.add.group({allowGravity:false,immovable:true});
  scene.physics.add.overlap(this.missiles,this.enemies,(missile,proxy)=>{
   if(!missile.active||!proxy.enemy||proxy.enemy.dead||scene.model?.state!=='playing')return;
   const x=missile.x,y=missile.y;missile.disableBody(true,true);this.stats.hits++;this.explode(x,y,.52);scene.controller.missileHit(proxy.enemy,x,y);
  });
  this.smoke=this.emitter('smoke',{lifespan:550,speed:16,scale:{start:.09,end:.27},alpha:{start:.32,end:0},tint:0x7894ac,maxParticles:240},18);
  this.jet=this.emitter('glow',{lifespan:190,speed:10,scale:{start:.21,end:0},alpha:{start:.9,end:0},tint:0xffb156,blendMode:'ADD',maxParticles:180},21);
  this.fire=this.emitter('flame',{lifespan:{min:280,max:580},speed:{min:25,max:160},scale:{start:.17,end:.04},alpha:{start:.9,end:0},tint:[0xffd389,0xffab75,0xff7e58],rotate:{min:0,max:360},blendMode:'NORMAL',maxParticles:220},42);
  this.debris=this.emitter('spark',{lifespan:{min:350,max:900},speed:{min:80,max:260},gravityY:180,scale:{start:.8,end:.1},rotate:{min:0,max:360},tint:[0xffd584,0xc9e8ef,0x506c7c],maxParticles:220},44);
  this.vapor=this.emitter('smoke',{lifespan:1100,speed:{min:10,max:45},speedY:{min:-65,max:-20},scale:{start:.23,end:.8},alpha:{start:.45,end:0},tint:0x64717e,maxParticles:150},40);
  this.wake=this.emitter('glow',{lifespan:420,speedY:{min:90,max:180},speedX:{min:-10,max:10},scale:{start:.32,end:0},alpha:{start:.65,end:0},tint:0x65eaff,blendMode:'ADD',maxParticles:90},19);
  this.sparks=this.emitter('hitStreak',{lifespan:{min:100,max:300},speed:{min:110,max:320},scale:{start:1,end:0},alpha:{start:1,end:0},rotate:{min:0,max:360},tint:[0xffe5a6,0xffffff,0x79e5ff],maxParticles:360},46);
  this.chips=this.emitter('chip',{lifespan:{min:300,max:750},speed:{min:70,max:190},gravityY:220,rotate:{min:0,max:360},scale:{start:1,end:.2},alpha:{start:1,end:0},maxParticles:240},44);
  this.muzzleFlash=this.emitter('glow',{lifespan:85,speedY:-65,scale:{start:.22,end:0},alpha:{start:.8,end:0},tint:0xffdf9f,blendMode:'ADD',maxParticles:60},27);
  this.enemyTrail=this.emitter('spark',{lifespan:400,speedY:-55,speedX:{min:-12,max:12},scale:{start:.45,end:0},alpha:{start:.8,end:0},tint:[0xdda9ff,0xffba66,0x95ffd8],maxParticles:200},12);
 }
 emitter(key,config,depth){const e=this.s.add.particles(0,0,key,{emitting:false,...config}).setDepth(depth);this.s.emitters.push(e);return e;}
 makeTextures(){
  const s=this.s;
  s.texture('hitStreak',6,24,c=>{c.fillStyle='#fff';c.fillRect(2,0,2,24);c.fillRect(0,3,6,5);});
  s.texture('chip',12,12,c=>{c.fillStyle='#dce9ed';c.fillRect(1,1,9,9);c.fillStyle='#879eaa';c.fillRect(7,4,4,7);c.fillStyle='#fff';c.fillRect(1,1,8,3);});
  s.texture('missile',24,54,c=>{c.fillStyle='#334e65';c.fillRect(4,30,16,18);c.fillStyle='#c5e1ec';c.fillRect(8,10,8,36);c.fillStyle='#ffffff';c.fillRect(9,10,3,30);c.fillStyle='#ff9c43';c.beginPath();c.moveTo(8,10);c.lineTo(12,0);c.lineTo(16,10);c.fill();c.fillStyle='#ffcd6d';c.fillRect(9,43,6,7);});
  s.texture('plasma',36,50,c=>{const g=c.createRadialGradient(18,18,0,18,18,18);g.addColorStop(0,'white');g.addColorStop(.3,'#ffffffec');g.addColorStop(.65,'#ffffff80');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(0,0,36,40);c.fillStyle='#ffffff88';c.beginPath();c.moveTo(10,23);c.lineTo(18,50);c.lineTo(26,23);c.fill();});
  s.texture('blade',40,40,c=>{c.strokeStyle='#fff';c.lineWidth=4;c.beginPath();c.arc(20,20,14,.2,4.9);c.stroke();c.fillStyle='#fff';c.beginPath();c.moveTo(34,9);c.lineTo(28,0);c.lineTo(25,14);c.fill();});
  s.texture('pulse',44,28,c=>{c.strokeStyle='#fff';c.lineWidth=4;c.beginPath();c.ellipse(22,14,19,9,0,Math.PI,2*Math.PI);c.stroke();c.lineWidth=2;c.beginPath();c.ellipse(22,18,13,6,0,Math.PI,2*Math.PI);c.stroke();});
  s.texture('crystalShot',28,46,c=>{c.fillStyle='#fff';c.beginPath();c.moveTo(14,0);c.lineTo(25,23);c.lineTo(14,46);c.lineTo(3,23);c.closePath();c.fill();c.fillStyle='#8bbbe0';c.beginPath();c.moveTo(14,4);c.lineTo(14,40);c.lineTo(5,23);c.fill();});
  s.texture('shockwave',128,128,c=>{c.strokeStyle='#fff';c.lineWidth=5;c.beginPath();c.arc(64,64,55,0,Math.PI*2);c.stroke();c.strokeStyle='#ffffff55';c.lineWidth=8;c.beginPath();c.arc(64,64,49,0,Math.PI*2);c.stroke();});
 }
 animate(key,x,y,start,end,duration,tint=0xffffff,blend='ADD',angle=0){
  if(this.transients.size>140)return;
  const s=this.s.add.image(x,y,key).setDepth(43).setDisplaySize(start,start).setTint(tint).setBlendMode(blend).setRotation(angle);this.transients.add(s);
  this.s.tweens.add({targets:s,displayWidth:end,displayHeight:end,alpha:0,duration,ease:'Cubic.Out',onComplete:()=>{this.transients.delete(s);s.destroy();}});return s;
 }
 explode(x,y,power=1){
  this.s.controller.sound('blast',0,power);
  const n=this.s.model?.reduced?.4:1;
  this.animate('glow',x,y,25*power,100*power,170,0xffd590);
  const burst=this.animate('magicAtlas',x,y,42*power,145*power,520,0xffffff,'NORMAL',Math.random()*6.28);if(burst)burst.setFrame('explosion').setDisplaySize(42*power,42*power);
  this.animate('shockwave',x,y,15,180*power,430,0xffdb9b);
  this.fire.explode(Math.ceil(22*power*n),x,y);this.debris.explode(Math.ceil(24*power*n),x,y);this.vapor.explode(Math.ceil(7*power*n),x,y);this.sparks.explode(Math.ceil(18*power*n),x,y);
  if(power>.8&&!this.s.model?.reduced)this.s.cameras.main.shake(100,.002);
 }
 muzzle(player,mode){const count=this.s.model?.reduced?1:2;for(const side of [-1,1])this.muzzleFlash.explode(count,player.x+side*27,player.y-49);}
 hit(x,y,color,laser=false){const reduced=this.s.model?.reduced;this.sparks.explode(reduced?3:laser?9:13,x,y);this.chips.setParticleTint(Phaser.Display.Color.HexStringToColor(color).color);this.chips.explode(reduced?1:4,x,y);this.animate('shockwave',x,y,7,laser?42:32,130,0xe2faff);}
 blockHit(target,entry){
  const scale=this.s.model.w<600?.7:1,key='block_'+entry.id;
  const block=this.s.add.image(target.x,target.y,key).setDepth(38).setScale(scale);this.transients.add(block);
  this.s.tweens.add({targets:block,scaleX:scale*1.2,scaleY:scale*.8,y:target.y-12,angle:7,duration:65,yoyo:true,onComplete:()=>{this.transients.delete(block);block.destroy();}});
  this.chips.setParticleTint(Phaser.Display.Color.HexStringToColor(entry.front).color);this.chips.explode(this.s.model.reduced?8:34,target.x,target.y);this.sparks.explode(this.s.model.reduced?4:20,target.x,target.y);
  this.animate('shockwave',target.x,target.y,25,135,240,0xc9efff);
  if(!this.s.model.reduced)this.s.cameras.main.shake(75,.0015);
 }
 death(d){
  this.explode(d.x,d.y,.75);
  const key=['drone','bomber','interceptor'][d.kind||0],size=d.kind===1?88:70;
  for(let row=0;row<3;row++)for(let col=0;col<3;col++){
   if(this.transients.size>140)break;
   const part=this.s.add.image(d.x+(col-1)*size/3,d.y+(row-1)*size/3,'aircraft',key+'_'+row+'_'+col).setDisplaySize(size/3,size/3).setDepth(39);this.transients.add(part);
   this.s.tweens.add({targets:part,x:part.x+(col-1)*Phaser.Math.Between(35,85),y:part.y+(row-1)*55+65,angle:Phaser.Math.Between(-180,180),alpha:0,duration:this.s.model?.reduced?220:780,ease:'Cubic.Out',onComplete:()=>{this.transients.delete(part);part.destroy();}});
  }
 }
 choose(m,exclude){const targets=this.s.model.drones.filter(d=>!d.dead&&d.y>10&&d.y<this.s.model.h-100);return targets.sort((a,b)=>(a===exclude?500:0)+Math.hypot(a.x-m.x,a.y-m.y)-(b===exclude?500:0)-Math.hypot(b.x-m.x,b.y-m.y))[0]||null;}
 launch(player){
  let previous=null;
  for(const side of [-1,1]){
   const m=this.missiles.get(player.x+side*48,player.y-5);if(!m)continue;
   m.enableBody(true,player.x+side*48,player.y-5,true,true).setDisplaySize(14,32).setDepth(22);m.body.setSize(18,36).setAllowGravity(false);
   m.heading=-Math.PI/2+side*1.08;m.age=0;m.path=[];m.target=this.choose(m,previous);previous=m.target;m.setRotation(m.heading+Math.PI/2);this.s.physics.velocityFromRotation(m.heading,170,m.body.velocity);this.stats.launched++;if(side===-1)this.s.controller.sound('missile');
  }
 }
 render(m){
  const dt=Math.max(0,Math.min(.05,m.time-this.lastTime));this.lastTime=m.time;
  if(m.state!=='playing'||m.hitStop>0){this.s.physics.pause();return;}this.s.physics.resume();
  const live=new Set(m.drones);
  for(const [d,p]of this.proxies)if(!live.has(d)||d.dead){this.enemies.remove(p,true,true);this.proxies.delete(d);}
  for(const d of m.drones){if(d.dead)continue;let p=this.proxies.get(d);if(!p){p=this.s.add.zone(d.x,d.y,46,46);this.enemies.add(p);p.body.setAllowGravity(false);p.body.moves=false;p.enemy=d;this.proxies.set(d,p);}p.body.reset(d.x,d.y);}
  this.clock+=dt;this.trailClock+=dt;if(this.clock>.8){this.clock=0;this.launch(m.player);}
  const trail=this.trailClock>.035;if(trail)this.trailClock=0;
  if(trail)for(const d of m.drones)if(!d.dead&&!d.frozen&&d.y>0&&d.y<m.h)this.enemyTrail.explode(m.reduced?1:d.boosting?4:2,d.x,d.y-25);
  for(const rocket of this.missiles.getChildren())if(rocket.active){
   rocket.age+=dt;if(trail){rocket.path.push({x:rocket.x,y:rocket.y});if(rocket.path.length>15)rocket.path.shift();}if(!m.reduced&&rocket.path.length>2){const g=this.s.lines;g.lineStyle(2,0xffd192,.5);g.beginPath();g.moveTo(rocket.path[0].x,rocket.path[0].y);for(const p of rocket.path)g.lineTo(p.x,p.y);g.strokePath();}if(rocket.age>4.5||rocket.x<-100||rocket.x>m.w+100||rocket.y<-100||rocket.y>m.h+100){rocket.disableBody(true,true);continue;}
   if(!rocket.target||rocket.target.dead||!live.has(rocket.target)){rocket.target=this.choose(rocket);if(rocket.target)this.stats.reacquired++;}
   if(rocket.age>.18&&rocket.target){const desired=Phaser.Math.Angle.Between(rocket.x,rocket.y,rocket.target.x,rocket.target.y);rocket.heading=Phaser.Math.Angle.RotateTo(rocket.heading,desired,dt*4.4);}
   this.s.physics.velocityFromRotation(rocket.heading,Math.min(520,170+rocket.age*380),rocket.body.velocity);rocket.setRotation(rocket.heading+Math.PI/2);
   if(trail){const x=rocket.x-Math.cos(rocket.heading)*14,y=rocket.y-Math.sin(rocket.heading)*14;this.smoke.explode(1,x,y);this.jet.explode(2,x,y);}
  }
  if(trail)for(const side of [-1,1])this.wake.explode(2,m.player.x+side*(m.w<600?17:27),m.player.y+42);
 }
 reset(){for(const m of this.missiles.getChildren())m.disableBody(true,true);for(const p of this.proxies.values())this.enemies.remove(p,true,true);this.proxies.clear();for(const s of this.transients){this.s.tweens.killTweensOf(s);s.destroy();}this.transients.clear();this.clock=.6;this.lastTime=0;}
};
