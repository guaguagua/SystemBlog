/* Per-item visual choreography. Shared damage families do not dictate appearance. */
(function(root){
const rows=[
['ice','hail','#a6eaff','冰雹从天而降'],['tnt','bomb','#f06d41','炸药箱连环引爆'],['fire','meteor','#ff8436','带火尾的陨石雨'],['lightning','bolt','#c9b4ff','天空雷柱与电弧'],
['water','wave','#58dffa','层叠潮汐冲刷'],['snow','spiral','#f2fbff','巨大雪花旋转飘落'],['sun','pulse','#ffcd4c','日轮扩张与日珥'],['moon','orbit','#b3bbff','弯月环绕月光斩'],['star','rain','#fff08b','五角星流星雨'],['wind','tornado','#b9f5de','龙卷风逐层卷起'],
['grass','field','#76de68','成片草浪扫过'],['tree','grow','#55af53','巨树拔地而起'],['flower','bloom','#ffa8d3','花苞盛开与花瓣雨'],['leaf','orbit','#9fea67','飞叶旋刃环绕'],['wood','rain','#b88956','圆木翻滚砸落'],['stone','bounce','#b6bbc7','巨石弹跳震裂'],['sand','tornado','#f8d58c','沙柱卷起沙砾'],['dirt','crack','#987555','土地裂开泥块翻涌'],['seed','grow','#b4df72','种子发芽成嫩苗'],['rain','rain','#8ac7ff','云层降下密雨'],
['apple','bounce','#ee756c','苹果弹射炸成果片'],['bread','rise','#ebbe80','面包升起烘焙热浪'],['milk','wave','#f6faf0','奶白浪花溅射'],['egg','crack','#fff0bc','蛋壳裂开飞溅'],['carrot','grow','#ff9c46','胡萝卜地刺钻出'],['fish','swim','#77daeb','鱼群弧线穿梭'],['cake','bloom','#f6a6c2','蛋糕绽开彩色烛火'],['rice','field','#f1eab0','金色稻穗摇曳'],['banana','orbit','#ffe86a','香蕉回旋镖'],['cookie','spin','#c99a69','曲奇旋转碎裂'],
['cat','pounce','#c7a4ed','猫爪跃击与爪痕'],['dog','bounce','#e2b07b','骨头弹跳与冲撞'],['bird','fly','#83d7ff','展翅飞鸟与羽毛'],['pig','charge','#f4a5b8','粉色野猪冲锋'],['cow','charge','#e9ede6','奶牛踏地冲撞'],['sheep','cloud','#f6f4e5','绵羊云团爆开'],['duck','swim','#ffe386','小鸭带起水花'],['rabbit','pounce','#f4d9ef','长耳兔跳跃落地'],['horse','charge','#b78d6d','骏马奔腾与蹄印'],['bee','swarm','#ffdf69','蜂群螺旋围攻'],
['red','slash','#ff6475','红色十字斩'],['blue','wave','#65b7ff','蓝色环形水刃'],['green','grow','#69e68b','绿色水晶地刺'],['yellow','rays','#ffe76d','黄色放射光束'],['white','pulse','#ffffff','白色光环净化'],['black','vortex','#8e83bb','黑洞吸入碎片'],['pink','bloom','#ffa6d8','粉色爱心绽放'],['orange','spiral','#ffb664','橙色火环螺旋'],['purple','orbit','#c793ff','紫色符文公转'],['brown','crack','#bd906a','棕色岩层震裂']];
const specs=Object.fromEntries(rows.map(([id,mode,color,description])=>[id,{id,mode,color,description}]));
function circle(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
function ellipse(c,x,y,rx,ry,a,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,a,0,Math.PI*2);c.fill();}
function line(c,points,color,width=3){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y])=>c.lineTo(x,y));c.stroke();}
function icon(c,id,size,color){c.save();c.scale(size/40,size/40);c.fillStyle=color;
if(id==='tree'){c.fillStyle='#90623f';c.fillRect(-7,-10,14,47);for(const [x,y,r] of [[0,-30,29],[-22,-9,23],[23,-9,23]])circle(c,x,y,r,color);}
else if(id==='flower'||id==='pink'){for(let i=0;i<7;i++){const a=i*Math.PI*2/7;ellipse(c,Math.cos(a)*19,Math.sin(a)*19,17,10,a,color);}circle(c,0,0,10,'#ffec96');}
else if(id==='leaf'){ellipse(c,0,0,16,32,-.5,color);line(c,[[-12,22],[12,-24]],'#e6ffc9',2);}
else if(id==='grass'||id==='rice'){for(let i=0;i<7;i++){const x=(i-3)*9;line(c,[[x,35],[x-8,-6],[x+(i%2?9:-9),-30]],color,4);if(id==='rice')for(let k=0;k<4;k++)ellipse(c,x+5,-25+k*8,8,3,.5,'#ffdf79');}}
else if(id==='seed'){ellipse(c,0,18,12,17,0,'#bc9860');line(c,[[0,20],[0,-12]],'#6fab59',5);ellipse(c,-10,-10,14,7,.4,color);ellipse(c,10,-20,14,7,-.4,color);}
else if(id==='carrot'){c.beginPath();c.moveTo(-18,-16);c.lineTo(18,-16);c.lineTo(0,35);c.closePath();c.fill();for(let i=0;i<3;i++)line(c,[[0,-16],[(i-1)*13,-39]],'#70c765',5);}
else if(id==='wood'){c.fillRect(-17,-26,34,53);ellipse(c,0,-25,17,9,0,'#f1ce90');ellipse(c,0,-25,10,5,0,'#9b743c');for(let i=-1;i<2;i++)line(c,[[i*10,-10],[i*10,24]],'#7c562f',2);}
else if(id==='brown'){for(let i=0;i<4;i++){c.fillStyle=i%2?'#c79970':'#886443';c.fillRect(-28+i*3,-25+i*14,55-i*5,13);}}
else if(['stone','dirt','cookie'].includes(id)){circle(c,0,0,28,color);for(let i=0;i<6;i++)c.fillRect(Math.cos(i*1.1)*18-3,Math.sin(i*1.1)*18-3,7,6);c.strokeStyle='#685950';if(id!=='cookie')line(c,[[-20,-12],[4,-4],[-5,12],[17,25]],'#746451',3);else for(let i=0;i<7;i++)circle(c,Math.cos(i)*19,Math.sin(i)*19,3,'#684638');}
else if(id==='apple'){circle(c,-11,5,20,color);circle(c,11,5,20,color);line(c,[[0,-13],[3,-30]],'#986242',5);ellipse(c,13,-24,11,5,-.3,'#9de276');}
else if(id==='bread'){c.fillRect(-25,-14,50,39);ellipse(c,0,-12,25,18,0,color);for(let i=-1;i<2;i++)line(c,[[i*13-3,-15],[i*13+3,8]],'#fff0ba',4);}
else if(id==='egg'){ellipse(c,0,0,21,29,0,color);line(c,[[-20,0],[-10,-6],[0,6],[10,0],[19,4]],'#c8aa76',3);}
else if(id==='cake'){c.fillRect(-27,-8,54,33);c.fillStyle='#fff0dc';c.fillRect(-27,2,54,8);for(let i=-1;i<2;i++){c.fillStyle='#70cadb';c.fillRect(i*16-2,-24,5,17);ellipse(c,i*16,-29,4,7,0,'#ffdb7a');}}
else if(id==='banana'||id==='moon'){c.fillStyle=color;c.beginPath();c.arc(0,0,29,.4,Math.PI*1.8);c.bezierCurveTo(-2,-2,7,12,27,11);c.fill();}
else if(id==='star'){c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?12:31;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();}
else if(id==='sun'||id==='yellow'){circle(c,0,0,20,color);for(let i=0;i<12;i++){const a=i*Math.PI/6;line(c,[[Math.cos(a)*26,Math.sin(a)*26],[Math.cos(a)*38,Math.sin(a)*38]],color,4);}}
else if(id==='snow'){for(let i=0;i<6;i++){c.save();c.rotate(i*Math.PI/3);line(c,[[0,0],[0,-33]],color,4);line(c,[[-9,-23],[0,-14],[9,-23]],color,3);c.restore();}}
else if(id==='fish'){ellipse(c,0,0,24,15,0,color);c.beginPath();c.moveTo(-18,0);c.lineTo(-38,-17);c.lineTo(-38,17);c.fill();circle(c,14,-3,3,'#254552');}
else if(['cat','dog','bird','pig','cow','sheep','duck','rabbit','horse','bee'].includes(id)){
if(id==='bird'||id==='bee'){ellipse(c,-23,0,26,10,-.6,id==='bee'?'#f5ffff':color);ellipse(c,23,0,26,10,.6,id==='bee'?'#f5ffff':color);}
if(id==='sheep')for(let i=0;i<7;i++)circle(c,Math.cos(i)*20,Math.sin(i)*17,13,'#fff5df');
ellipse(c,0,5,id==='horse'?15:23,id==='horse'?30:20,0,color);
if(id==='rabbit'){ellipse(c,-10,-25,7,24,-.1,color);ellipse(c,10,-25,7,24,.1,color);}else if(id==='cat'){for(const x of [-18,18]){c.beginPath();c.moveTo(x-9,-9);c.lineTo(x,-34);c.lineTo(x+9,-9);c.fill();}}else if(id==='dog'){ellipse(c,-23,-7,10,20,.2,'#98683f');ellipse(c,23,-7,10,20,-.2,'#98683f');}
if(id==='pig')ellipse(c,0,12,14,9,0,'#cf7187');if(id==='cow'){circle(c,-12,-2,9,'#525155');line(c,[[-14,-12],[-26,-29]],'#f4e6af',5);line(c,[[14,-12],[26,-29]],'#f4e6af',5);}if(id==='duck'||id==='bird'){c.fillStyle='#ffbf61';c.fillRect(8,9,22,8);}if(id==='bee'){c.fillStyle='#564338';c.fillRect(-15,-2,30,5);c.fillRect(-15,10,30,5);}circle(c,-8,0,3,'#28424c');circle(c,8,0,3,'#28424c');}
else if(id==='rain'||id==='milk'||id==='water'||id==='blue'){c.beginPath();c.moveTo(0,-32);c.bezierCurveTo(-40,12,-18,33,0,30);c.bezierCurveTo(30,28,28,5,0,-32);c.fill();}
else if(id==='red'){line(c,[[-25,-30],[25,30]],color,9);line(c,[[25,-30],[-25,30]],'#fff1ef',7);}
else if(id==='green'){c.beginPath();c.moveTo(0,-38);c.lineTo(16,5);c.lineTo(0,28);c.lineTo(-16,5);c.fill();}
else if(id==='purple'){c.strokeStyle=color;c.lineWidth=5;c.strokeRect(-20,-20,40,40);c.rotate(Math.PI/4);c.strokeRect(-20,-20,40,40);}
else {circle(c,0,0,27,color);circle(c,0,0,17,id==='black'?'#20233f':'#ffffff88');}
c.restore();}
function draw(c,s,reduced){const cfg=specs[s.p.id];if(!cfg)return false;if(['ice','tnt','fire','lightning'].includes(cfg.id))return false;
c.save();c.shadowColor=cfg.color;c.shadowBlur=reduced?0:12;
for(const e of s.events){const t=Math.min(1,e.age/e.delay),after=Math.max(0,e.age-e.delay),mode=cfg.mode;c.globalAlpha=e.hit?Math.max(0,1-after):1;
function stamp(x,y,size,angle=0){c.save();c.translate(x,y);c.rotate(angle);icon(c,cfg.id,size,cfg.color);c.restore();}
if(['grow','bloom','field'].includes(mode)){
 if(mode==='grow'){stamp(e.x,e.y-25*t,cfg.id==='tree'?65*t:38*t);if(e.hit)for(let i=0;i<5;i++)line(c,[[e.x,e.y+20],[e.x+(i-2)*22,e.y+45+Math.sin(i)*8]],cfg.color,5);}
 else if(mode==='bloom'){stamp(e.x,e.y,50*t,e.age*.5);if(e.hit)for(let i=0;i<9;i++){const a=i*Math.PI*2/9+after;stamp(e.x+Math.cos(a)*after*95,e.y+Math.sin(a)*after*60,10, a);}}
 else for(let i=-2;i<=2;i++)stamp(e.x+i*28,e.y+Math.sin(e.age*4+i)*12,30*t);
}else if(['wave','tornado','vortex','pulse','rays'].includes(mode)){
 if(mode==='wave'){for(let i=0;i<4;i++){c.strokeStyle=cfg.color;c.lineWidth=5-i;const r=20+e.age*90+i*15;c.beginPath();c.ellipse(e.x,e.y,r,r*.35,0,0,Math.PI*2);c.stroke();}stamp(e.x,e.y,28);}
 else if(mode==='tornado'||mode==='vortex'){for(let i=0;i<9;i++){c.strokeStyle=cfg.color;c.lineWidth=3;c.beginPath();c.ellipse(e.x+Math.sin(e.age*5+i)*10,e.y-i*11,10+i*4,7,0,0,Math.PI*1.7);c.stroke();}if(mode==='vortex')stamp(e.x,e.y-25,40);if(cfg.id==='sand'){c.fillStyle='#efc475';for(let k=0;k<35;k++)c.fillRect(e.x+Math.sin(k*9+e.age*4)*45,e.y-(k%9)*10,4,4);}if(cfg.id==='wind'){line(c,[[e.x-75,e.y-40],[e.x+70,e.y-55]],'#e6fffa',2);}}
 else{stamp(e.x,e.y,25+e.age*30,e.age);for(let i=0;i<10;i++){const a=i*.628;c.strokeStyle=cfg.color;line(c,[[e.x+Math.cos(a)*40,e.y+Math.sin(a)*40],[e.x+Math.cos(a)*(60+t*90),e.y+Math.sin(a)*(60+t*90)]],cfg.color,3);}}
}else if(['orbit','spin','spiral','swarm','cloud'].includes(mode)){
 const count=mode==='swarm'?9:mode==='cloud'?5:4;for(let i=0;i<count;i++){const a=e.age*4+i*Math.PI*2/count,r=mode==='spiral'?15+e.age*45:35+t*22;stamp(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r*.55,mode==='cloud'?22:17,a*(mode==='spin'?2:0));}
}else if(['pounce','bounce','swim','fly','charge','rain','rise','crack','slash'].includes(mode)){
 let x=e.x,y=e.y;if(!e.hit){if(mode==='rain'){y-=220*(1-t);x-=40*(1-t);}else if(mode==='charge'){x-=240*(1-t);}else if(mode==='pounce'||mode==='bounce'){x-=100*(1-t);y-=Math.sin(t*Math.PI)*100;}else if(mode==='swim'||mode==='fly'){x-=190*(1-t);y+=Math.sin(t*7)*40;}else if(mode==='rise'){y+=90*(1-t);}}
 stamp(x,y,mode==='rain'?30:40,mode==='bounce'||mode==='crack'?e.age*2:0);
 if(e.hit)for(let i=0;i<8;i++){const a=i*.785;stamp(e.x+Math.cos(a)*after*90,e.y+Math.sin(a)*after*45,8, a);}
}
}c.restore();return true;}
root.BlockItemVFX={specs,draw,icon};
})(typeof window==='undefined'?globalThis:window);
