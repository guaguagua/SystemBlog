/* Shared timeline for spell telegraphs, projectiles, impact damage and lingering VFX. */
(function(root){
 const palette={ice:['#86e6ff','#eeffff'],fire:['#ff782e','#ffd47b'],blast:['#ffb34c','#ffe8b0'],lightning:['#ad95ff','#e9f8ff'],nature:['#5fc875','#d2ffa3']};
 const names={ice:'极寒冰雹',tnt:'TNT 连环爆破',fire:'天火陨石',lightning:'雷霆审判',water:'潮汐冰雨',snow:'漫天飞雪',sun:'日曜天火',moon:'月光雷幕',star:'星陨雷暴',wind:'旋风藤蔓',grass:'草浪缠绕',tree:'古树之怒',flower:'花雨绽放',leaf:'飞叶风暴',wood:'木刺突袭',stone:'落石轰击',sand:'流沙爆涌',dirt:'大地荆棘',seed:'种子爆芽',rain:'寒雨侵袭',apple:'果实飞弹',bread:'烘焙火雨',milk:'奶霜冰瀑',egg:'蛋壳爆弹',carrot:'萝卜地刺',fish:'冰鳞飞雨',cake:'烛火流星',rice:'稻穗风暴',banana:'金弧雷链',cookie:'曲奇爆弹',cat:'灵猫突袭',dog:'守卫爆破',bird:'飞羽雷击',pig:'赤焰冲撞',cow:'寒霜守卫',sheep:'绒雪风暴',duck:'水羽冰雨',rabbit:'灵兔藤跃',horse:'奔雷震地',bee:'蜂群电舞',red:'赤红流星',blue:'湛蓝冰域',green:'翠绿荆棘',yellow:'金色雷罚',white:'纯白雪幕',black:'黑曜爆裂',pink:'粉樱花雨',orange:'橙焰陨落',purple:'紫电连锁',brown:'棕岩崩落'};
 function profile(entry){let seed=0;for(const c of entry.id)seed=(seed*31+c.charCodeAt(0))>>>0;return {id:entry.id,type:entry.spell,name:names[entry.id]||entry.cn+'魔法',seed,variant:seed%3};}
 function create(entry,x,y,width,height,random=Math.random){return {p:profile(entry),x,y,width,height,random,age:0,duration:4,clock:.25,events:[],serial:0};}
 function update(s,dt,enemies,impact){s.age+=dt;s.clock+=dt;const interval={ice:.23,fire:.27,blast:.38,lightning:.48,nature:.24}[s.p.type];
  if(s.age<2.8)while(s.clock>=interval){s.clock-=interval;const live=enemies.filter(e=>!e.dead&&e.y>s.height*.19&&e.y<s.height*.78);const e=live.length?live[s.serial%live.length]:null;
   const x=e?e.x:s.width*(.12+s.random()*.76),y=e?e.y:s.height*(.25+s.random()*.36);
   const points=[{x,y}];if(s.p.type==='lightning')for(const other of live.filter(v=>v!==e).slice(0,3))points.push({x:other.x,y:other.y});
   s.events.push({x,y,points,age:0,delay:s.p.type==='lightning'?.4:.6,hit:false,seed:s.serial++});
  }
  for(const e of s.events){e.age+=dt;if(!e.hit&&e.age>=e.delay){e.hit=true;for(const p of e.points)impact(s.p.type,p.x,p.y,s.p.type==='blast'?135:70,s.p);}}
  s.events=s.events.filter(e=>e.age<e.delay+1.15);return s.age<s.duration;
 }
 function ring(ctx,x,y,r,color){ctx.strokeStyle=color;ctx.beginPath();ctx.ellipse(x,y,r,r*.43,0,0,Math.PI*2);ctx.stroke();}
 function ground(ctx,s,reduced){const colors=palette[s.p.type],fade=Math.min(1,s.age*3,(s.duration-s.age)*2);ctx.save();ctx.globalAlpha=fade*.55;ctx.lineWidth=2;
  ring(ctx,s.x,s.y,90+Math.min(s.age,1)*90,colors[0]);ring(ctx,s.x,s.y,70+Math.min(s.age,1)*90,colors[1]);
  for(const e of s.events){if(!e.hit){ctx.globalAlpha=fade*.7;ctx.setLineDash([8,7]);ring(ctx,e.x,e.y,23+(e.age/e.delay)*20,colors[0]);ctx.setLineDash([]);}else{const t=e.age-e.delay;ctx.globalAlpha=fade*Math.max(0,1-t);if(s.p.type==='fire'){const g=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,75);g.addColorStop(0,'#fff0aabb');g.addColorStop(.45,'#ff721a88');g.addColorStop(1,'#b9320000');ctx.fillStyle=g;ctx.fillRect(e.x-75,e.y-75,150,150);}ring(ctx,e.x,e.y,25+t*(s.p.type==='blast'?180:75),colors[0]);}}
  ctx.restore();
 }
 function bolt(ctx,from,to,seed){ctx.beginPath();ctx.moveTo(from.x,from.y);for(let i=1;i<9;i++)ctx.lineTo(from.x+(to.x-from.x)*i/9+Math.sin(seed+i*17)*19,from.y+(to.y-from.y)*i/9);ctx.lineTo(to.x,to.y);ctx.stroke();}
 function draw(ctx,s,reduced){if(BlockItemVFX.draw(ctx,s,reduced))return;const colors=palette[s.p.type];ctx.save();ctx.lineWidth=3;ctx.shadowColor=colors[0];ctx.shadowBlur=reduced?0:15;
  for(const e of s.events){const t=e.age/e.delay,after=e.age-e.delay;ctx.globalAlpha=e.hit?Math.max(0,1-after):1;
   if(s.p.type==='fire'){
    if(!e.hit){const alt=(1-t)*330,x=e.x-alt*.37,y=e.y-alt;const g=ctx.createLinearGradient(x-75,y-150,x,y+20);g.addColorStop(0,'#ff660000');g.addColorStop(.65,'#ff722ca0');g.addColorStop(1,'#fff2ac');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-80,y-160);ctx.lineTo(x+20,y);ctx.lineTo(x-16,y+15);ctx.closePath();ctx.fill();ctx.fillStyle=colors[0];ctx.beginPath();ctx.arc(x,y,20+s.p.variant*3,0,Math.PI*2);ctx.fill();ctx.fillStyle=colors[1];ctx.fillRect(x-8,y-10,14,20);
    }else{for(let i=0;i<7;i++){const a=i*Math.PI*2/7,r=after*90;ctx.fillStyle=i%2?colors[1]:colors[0];ctx.fillRect(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r*.5-35*Math.sin(after*3),9,22);}}}
   if(s.p.type==='blast'){
    if(!e.hit){const alt=(1-t)*160;ctx.save();ctx.translate(e.x,e.y-alt);ctx.rotate(Math.sin(t*5)*.15);ctx.fillStyle=s.p.id==='tnt'?'#db4d38':colors[0];ctx.fillRect(-20,-23,40,40);ctx.fillStyle='#fff0d2';ctx.fillRect(-20,-12,40,15);ctx.fillStyle='#462b2b';ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillText(s.p.id==='tnt'?'TNT':'BOOM',0,0);ctx.restore();
    }else{const r=25+after*150,g=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,r);g.addColorStop(0,'#fff5c3');g.addColorStop(.3,'#ffb849bb');g.addColorStop(.7,'#ff6b2350');g.addColorStop(1,'#69230800');ctx.fillStyle=g;ctx.fillRect(e.x-r,e.y-r,r*2,r*2);for(let i=0;i<14;i++){const a=i*.449;ctx.fillStyle=i%2?'#5d5048':'#ffcc76';ctx.fillRect(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r*.55-after*45,7,7);}}}
   if(s.p.type==='lightning'){
    if(!e.hit){ctx.strokeStyle='#b3a7fa88';ring(ctx,e.x,e.y,35,colors[0]);}else{ctx.lineWidth=7;ctx.strokeStyle=colors[0];bolt(ctx,{x:e.x-35,y:-10},e,e.seed);ctx.lineWidth=2;ctx.strokeStyle='#fff';bolt(ctx,{x:e.x-35,y:-10},e,e.seed);for(let i=1;i<e.points.length;i++){ctx.lineWidth=4;ctx.strokeStyle=colors[0];bolt(ctx,e.points[i-1],e.points[i],e.seed+i);ctx.lineWidth=1;ctx.strokeStyle='#fff';bolt(ctx,e.points[i-1],e.points[i],e.seed+i);}for(const p of e.points){ring(ctx,p.x,p.y,25+after*45,colors[1]);}}}
   if(s.p.type==='nature'){
    const growth=Math.min(1,t);for(let i=0;i<4;i++){const x=e.x+(i-1.5)*20;ctx.strokeStyle=i%2?colors[1]:colors[0];ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x,e.y+35);ctx.bezierCurveTo(x-35,e.y+15,x+35,e.y-35*growth,x,e.y-65*growth);ctx.stroke();ctx.fillStyle=colors[0];ctx.beginPath();ctx.ellipse(x+8,e.y-20*growth,14,6,-.7,0,Math.PI*2);ctx.fill();}if(e.hit)for(let i=0;i<10;i++){const a=i*.628+after*2;ctx.fillStyle=s.p.variant===1?'#f8b3d8':colors[1];ctx.fillRect(e.x+Math.cos(a)*after*90,e.y+Math.sin(a)*after*45-30,7,4);}}
  }ctx.restore();
 }
 root.BlockSpells={profile,create,update,ground,draw,names};
})(typeof window==='undefined'?globalThis:window);
