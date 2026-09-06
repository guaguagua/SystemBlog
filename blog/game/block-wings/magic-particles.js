/* Spell-only particle choreography: flash, expanding debris, then drifting residue. */
window.BlockMagicParticles=class{
 constructor(scene){
  this.s=scene;this.items=new Map();this.stats={impacts:0,byItem:{}};this.lastTime=0;this.budget=220;
  this.textures();
  const radial={angle:{min:0,max:360},speed:{min:110,max:340},lifespan:{min:450,max:950},rotate:{min:-180,max:180},alpha:{start:1,end:0},gravityY:90,maxParticles:280};
  this.ice=this.emitter('iceShard',{...radial,scale:{start:.42,end:.08},tint:[0xffffff,0x84d9ff,0x58aaff],gravityY:150},47);
  this.frost=this.emitter('smoke',{lifespan:1050,speed:{min:30,max:105},scale:{start:.2,end:.65},alpha:{start:.32,end:0},tint:0xc2edff,maxParticles:100},41);
  this.flames=this.emitter('magicAtlas',{...radial,frame:'explosion',speed:{min:55,max:175},scale:{start:.15,end:.025},lifespan:{min:400,max:850},gravityY:-80,maxParticles:120},43);
  this.embers=this.emitter('magicStreak',{...radial,scale:{start:.9,end:0},tint:[0xffd883,0xff943e,0xfff5d4],lifespan:{min:550,max:1200},gravityY:-20,blendMode:'ADD'},48);
  this.smoke=this.emitter('smoke',{lifespan:1300,speed:{min:30,max:100},scale:{start:.22,end:.65},alpha:{start:.33,end:0},tint:0x615969,gravityY:-40,maxParticles:100},40);
  this.arcs=this.emitter('magicArc',{...radial,lifespan:{min:180,max:420},scale:{start:.85,end:.2},tint:[0xc9a2ff,0x84d4ff,0xf1d9ff],gravityY:0,maxParticles:200},48);
  this.ions=this.emitter('magicStreak',{...radial,lifespan:{min:350,max:850},scale:{start:.8,end:0},tint:[0xc796ff,0x7ebfff,0xf6d8ff],gravityY:-20},47);
  this.leaves=this.emitter('magicLeaf',{...radial,scale:{start:1.1,end:.3},tint:[0xa6ed6d,0x69d887,0xdbffac],lifespan:{min:700,max:1400},gravityY:65},46);
  this.petals=this.emitter('magicPetal',{...radial,scale:{start:1.2,end:.35},tint:[0xff90cf,0xffd2ed,0xffec9c],lifespan:{min:850,max:1500},gravityY:40},46);
  this.rubble=this.emitter('chip',{...radial,scale:{start:1.7,end:.3},tint:[0xad8871,0xd0bba1,0x756577],gravityY:240},45);
  this.dust=this.emitter('smoke',{lifespan:1050,speed:{min:30,max:100},scale:{start:.15,end:.48},alpha:{start:.26,end:0},tint:0xc8b194,maxParticles:100},40);
 }
 emitter(key,config,depth){return this.s.arsenal.emitter(key,config,depth);}
 textures(){
  this.s.texture('magicStreak',14,48,c=>{const g=c.createLinearGradient(0,0,0,48);g.addColorStop(0,'#ffffff00');g.addColorStop(.65,'#ffffffff');g.addColorStop(1,'#ffffff00');c.fillStyle=g;c.fillRect(5,0,4,48);c.fillStyle='#fff';c.fillRect(3,31,8,5);});
  this.s.texture('magicArc',80,60,c=>{for(const [width,color]of [[7,'#9474ed88'],[2,'#fff']]){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(2,28);c.lineTo(19,18);c.lineTo(27,38);c.lineTo(43,9);c.lineTo(49,32);c.lineTo(77,26);c.stroke();}});
  this.s.texture('magicLeaf',30,46,c=>{c.fillStyle='#fff';c.beginPath();c.moveTo(3,42);c.quadraticCurveTo(-3,8,26,3);c.quadraticCurveTo(34,36,3,42);c.fill();c.strokeStyle='#3e7f6999';c.lineWidth=2;c.beginPath();c.moveTo(4,41);c.lineTo(24,7);c.stroke();});
  this.s.texture('magicPetal',30,38,c=>{c.fillStyle='#fff';c.beginPath();c.moveTo(14,35);c.bezierCurveTo(-15,8,7,-4,16,8);c.bezierCurveTo(34,-2,39,25,14,35);c.fill();c.fillStyle='#ffffff70';c.fillRect(13,12,3,16);});
 }
 tick(time){const dt=Math.max(0,Math.min(.1,time-this.lastTime));this.lastTime=time;this.budget=Math.min(220,this.budget+dt*620);}
 emit(emitter,count,x,y,strength){emitter.explode(Math.max(1,Math.round(count*strength)),x,y);}
 identity(id){
  if(this.items.has(id))return this.items.get(id);
  const key='icon_'+id;
  const e=this.emitter(key,{angle:{min:0,max:360},speed:{min:100,max:250},lifespan:{min:500,max:1000},scale:{start:.2,end:.07},rotate:{min:-160,max:160},alpha:{start:1,end:0},gravityY:130,maxParticles:90},46);this.items.set(id,e);return e;
 }
 impact(x,y,type,id=type,opening=false){
  if(this.s.model?.state!=='playing')return;
  const m=this.s.model,quality=m.reduced?.3:m.w<600?.65:1,strength=quality*Math.min(1,this.budget/95)*(opening?1.35:1);
  if(strength<.12)return;this.budget=Math.max(0,this.budget-75*strength);
  this.stats.impacts++;this.stats.byItem[id]=(this.stats.byItem[id]||0)+1;
  const color=Phaser.Display.Color.HexStringToColor(BlockItemVFX.specs[id]?.color||'#addefa').color;
  const a=this.s.arsenal;const flash=a.animate('glow',x,y,45,160,190,color);if(flash)flash.setAlpha(.55);
  const shock=a.animate('shockwave',x,y,30,opening?270:210,420,color,'NORMAL');if(shock)shock.setAlpha(.75).setDepth(39);
  const emit=(e,n)=>this.emit(e,n,x,y,strength);
  if(type==='ice'){
   emit(this.ice,26);emit(this.frost,10);emit(this.ions,12);
  }else if(type==='fire'){
   emit(this.flames,15);emit(this.embers,40);emit(this.smoke,8);emit(this.rubble,8);
  }else if(type==='lightning'){
   emit(this.arcs,22);emit(this.ions,42);
  }else if(type==='nature'){
   emit(['flower','pink','cake'].includes(id)?this.petals:this.leaves,36);emit(this.rubble,9);emit(this.dust,7);
  }else{
   emit(this.flames,12);emit(this.rubble,30);emit(this.embers,30);emit(this.smoke,9);
  }
  // The actual item's fragments preserve flower/tree/food/animal differences.
  if(!['ice','tnt','fire','lightning'].includes(id))emit(this.identity(id),14);
  if(!m.reduced&&(!this.lastShake||m.time-this.lastShake>.25)){this.lastShake=m.time;this.s.cameras.main.shake(95,type==='blast'?.003:.0015);}
 }
 reset(){this.lastTime=0;this.budget=220;this.lastShake=0;}
};
