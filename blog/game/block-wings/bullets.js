/* Eight weapons with different trajectories and collision behavior. */
(function(root){
const names=['赤焰宽幅散弹','双龙螺旋弹','苍蓝穿透激光','星刃回旋阵','翡翠波浪炮','金羽交叉弹','离子脉冲环','水晶分裂弹'];
const colors=['#ff9955','#ef9dff','#71dcff','#dfbcff','#85ffc2','#ffe499','#7eeeff','#cbb5ff'];
function emit(mode,x,y,time,power=false){
 const count=[13,8,5,9,9,12,11,7][mode]+(power?2:0);
 return Array.from({length:count},(_,i)=>{
  const n=i-(count-1)/2;let a=0,offset=n*7,speed=620;
  if(mode===0)a=n*.065;
  if(mode===1){offset=Math.sin(time*8+i*Math.PI/4)*38;a=n*.014;}
  if(mode===2){offset=n*23;speed=950;}
  if(mode===3){a=n*.12+Math.sin(time*2)*.18;speed=450;}
  if(mode===4){offset=n*12;a=n*.02;}
  if(mode===5){offset=n*12;a=-n*.065;}
  if(mode===6){a=n*.11;speed=500;}
  if(mode===7){offset=n*16;a=n*.055;speed=490;}
  return {x:x+offset,y:y-52,vx:Math.sin(a)*speed,vy:-Math.cos(a)*speed,age:0,phase:i*.75,side:n<0?-1:1,color:colors[mode],style:mode,damage:mode===2?2:1,pierce:mode===2,hitEnemies:new WeakSet(),trail:[]};
 });
}
function advance(b,dt){
 b.age+=dt;b.trail.push({x:b.x,y:b.y});if(b.trail.length>7)b.trail.shift();
 b.x+=b.vx*dt;b.y+=b.vy*dt;
 if(b.style===1)b.x+=Math.cos(b.age*13+b.phase)*140*dt;
 if(b.style===3)b.vx+=b.side*90*dt;
 if(b.style===4)b.x+=Math.cos(b.age*9+b.phase)*170*dt;
 if(b.style===6)b.vx*=Math.exp(-1.8*dt);
}
function split(b){if(b.style!==7||b.split||b.age<.42)return [];b.split=true;return [-1,1].map(side=>({...b,x:b.x,y:b.y,vx:b.vx+side*165,vy:b.vy,style:3,age:0,side,damage:.65,trail:[],hitEnemies:new WeakSet()}));}
function intersects(b,ox,oy,x,y,r){const dx=b.x-ox,dy=b.y-oy,t=Math.max(0,Math.min(1,((x-ox)*dx+(y-oy)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(ox+dx*t-x,oy+dy*t-y)<r;}
root.BlockBullets={names,emit,advance,split,intersects};
})(typeof window==='undefined'?globalThis:window);
