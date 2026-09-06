/* A timed area spell: rendering and impact events share the same falling shards. */
(function(root){
 function create(width,height,random=Math.random){return {width,height,x:width/2,y:height*.36,rx:width*.46,ry:height*.3,age:0,duration:3.8,clock:0,shards:[],impacts:[],random};}
 function update(s,dt,enemies,onImpact){
  s.age+=dt;s.clock+=dt;
  if(s.age<3.1)while(s.clock>=.085){s.clock-=.085;const live=enemies.filter(e=>!e.dead&&e.y>s.height*.19&&e.y<s.height*.72);let x,y;
   if(live.length&&s.random()<.7){const e=live[Math.floor(s.random()*live.length)];x=e.x+(s.random()-.5)*40;y=e.y+(s.random()-.5)*25;}else{const a=s.random()*Math.PI*2,r=Math.sqrt(s.random());x=s.x+Math.cos(a)*s.rx*r;y=s.y+Math.sin(a)*s.ry*r;}
   s.shards.push({x,y:Math.max(s.height*.2,y),age:0,fall:.42+s.random()*.2,size:13+s.random()*12});
  }
  for(const p of s.shards){p.age+=dt;if(!p.hit&&p.age>=p.fall){p.hit=true;s.impacts.push({x:p.x,y:p.y,age:0});onImpact(p.x,p.y,85);}}
  s.shards=s.shards.filter(p=>p.age<p.fall+.05);
  for(const p of s.impacts)p.age+=dt;s.impacts=s.impacts.filter(p=>p.age<.75);
  return s.age<s.duration;
 }
 function ground(ctx,s,reduced){ctx.save();const fade=Math.min(1,s.age*3,(s.duration-s.age)*2);ctx.globalAlpha=fade;
  const g=ctx.createRadialGradient(s.x,s.y,30,s.x,s.y,s.rx);g.addColorStop(0,'#d9fbff35');g.addColorStop(.7,'#49c6ff38');g.addColorStop(1,'#5dcaff00');ctx.fillStyle=g;ctx.fillRect(0,0,s.width,s.height*.82);
  ctx.translate(s.x,s.y);ctx.scale(1,s.ry/s.rx);ctx.strokeStyle='#c8f8ffb0';ctx.lineWidth=3;ctx.setLineDash([18,13]);ctx.beginPath();ctx.arc(0,0,s.rx*.92,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.strokeStyle='#95deff80';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,s.rx*.81,0,Math.PI*2);ctx.stroke();for(let i=0;i<12;i++){const a=i*Math.PI/6+(reduced?0:s.age*.1);ctx.beginPath();ctx.moveTo(Math.cos(a)*s.rx*.83,Math.sin(a)*s.rx*.83);ctx.lineTo(Math.cos(a)*s.rx*.9,Math.sin(a)*s.rx*.9);ctx.stroke();}ctx.restore();
 }
 function air(ctx,s,reduced){ctx.save();const fade=Math.min(1,s.age*3,(s.duration-s.age)*2);ctx.globalAlpha=fade;
  // Broad translucent snow swirls establish the storm before the first impact.
  ctx.strokeStyle='#e8fbff55';ctx.lineWidth=2;for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(s.x+Math.sin(s.age+i)*25,s.y+(i-2)*45,s.rx*(.5+i*.08),35+i*8,-.12,Math.PI*.1,Math.PI*1.45);ctx.stroke();}
  ctx.fillStyle='#f3fdff';for(let i=0;i<(reduced?20:85);i++){const x=((i*137.5+s.age*55)%s.width),y=((i*73+s.age*(110+i%4*30))%(s.height*.75));ctx.fillRect(x,y,i%3===0?4:2,i%3===0?7:3);}
  for(const p of s.shards){if(p.hit)continue;const t=p.age/p.fall,alt=(1-t)*260,x=p.x-alt*.23,y=p.y-alt;
   ctx.strokeStyle='#b4f3ff88';ctx.lineWidth=p.size*.5;ctx.beginPath();ctx.moveTo(x-24,y-90);ctx.lineTo(x,y);ctx.stroke();
   ctx.shadowColor='#58d5ff';ctx.shadowBlur=reduced?0:20;ctx.fillStyle='#97dbff';ctx.beginPath();ctx.moveTo(x,y+p.size*1.7);ctx.lineTo(x-p.size*.65,y-p.size*.2);ctx.lineTo(x-p.size*.3,y-p.size*1.65);ctx.lineTo(x+p.size*.6,y-p.size*.7);ctx.closePath();ctx.fill();
   ctx.fillStyle='#f2fdff';ctx.beginPath();ctx.moveTo(x,y+p.size*1.7);ctx.lineTo(x-p.size*.3,y-p.size*1.65);ctx.lineTo(x+p.size*.18,y-p.size*.5);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  }
  for(const p of s.impacts){const t=p.age/.75;ctx.globalAlpha=fade*(1-t);ctx.strokeStyle='#e4fcff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y,15+t*85,7+t*34,0,0,Math.PI*2);ctx.stroke();
   for(let i=0;i<9;i++){const a=i*Math.PI*2/9,r=10+t*80,x=p.x+Math.cos(a)*r,y=p.y+Math.sin(a)*r*.55-22*Math.sin(t*Math.PI);ctx.fillStyle=i%2?'#b0eaff':'#fff';ctx.fillRect(x,y,4+(1-t)*5,4+(1-t)*8);}
   ctx.strokeStyle='#8de0ff';ctx.lineWidth=2;for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+Math.cos(a)*35,p.y+Math.sin(a)*18);ctx.stroke();}
  }ctx.restore();
 }
 root.BlockBlizzard={create,update,ground,air};
})(typeof window==='undefined'?globalThis:window);
