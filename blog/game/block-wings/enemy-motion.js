/* Velocity-based routes keep freeze, knockback and viewport edges continuous. */
(function(root){
 const profiles=[
  {name:'重装巡航',kind:1,speed:32,route:'cruise'},
  {name:'高速斜掠',kind:2,speed:142,route:'diagonal'},
  {name:'折线游击',kind:0,speed:78,route:'zigzag'},
  {name:'回旋盘绕',kind:0,speed:46,route:'loop'},
  {name:'蓄力俯冲',kind:2,speed:62,route:'dive'},
  {name:'蛇形穿梭',kind:1,speed:60,route:'wave'}
 ];
 function step(d,dt,status,width){
  const active=status*(d.stagger>0?0:1);d.stagger=Math.max(0,(d.stagger||0)-dt);d.flightAge=(d.flightAge||0)+dt*active;
  const t=d.flightAge,side=d.side||1;let vx=0,vy=d.speed;
  switch(d.route){
   case 'cruise':vx=Math.cos(t*.9+d.seed)*22;break;
   case 'diagonal':vx=side*d.speed*.75;break;
   case 'zigzag':vx=Math.sin(t*3.8+d.seed)>=0?110:-110;break;
   case 'loop':vx=Math.cos(t*2.3+d.seed)*100;vy+=Math.sin(t*2.3+d.seed)*65;break;
   case 'dive':{const cycle=t%4.2,boost=cycle>1.3&&cycle<3.2;vy=boost?205:d.speed*.5;vx=side*(boost?48:Math.cos(t*2)*30);d.boosting=boost;break;}
   case 'wave':vx=Math.cos(t*2.1+d.seed)*125;break;
  }
  d.vx=vx*active;d.vy=vy*active;d.x+=d.vx*dt;d.y+=(d.vy-(d.kick||0))*dt;d.kick=(d.kick||0)*Math.exp(-10*dt);
  const margin=Math.min(40,width*.12);
  if(d.x<margin){d.x=margin;d.side=1;}else if(d.x>width-margin){d.x=width-margin;d.side=-1;}
 }
 root.BlockEnemyMotion={profiles,step};
})(typeof window==='undefined'?globalThis:window);
