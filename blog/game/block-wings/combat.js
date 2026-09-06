/* Combat rules have no rendering or audio dependency. */
(function(root){
 const spells={blast:{name:'TNT 爆炸',color:'#ffb456',damage:10},ice:{name:'暴风雪 · 冰雹轰击',color:'#9aedff',damage:2},fire:{name:'烈焰灼烧',color:'#ff8750',damage:2},lightning:{name:'连锁雷电',color:'#ece0ff',damage:4},nature:{name:'藤蔓缠绕',color:'#9eed91',damage:2}};
 function damage(enemy,value){if(enemy.dead)return false;enemy.hp=Math.max(0,enemy.hp-value);enemy.flash=.15;enemy.kick=Math.max(enemy.kick||0,Math.min(150,value*28));if(enemy.hp<=0){enemy.dead=true;return true;}return false;}
 function cast(type,x,y,enemies){const spec=spells[type]||spells.blast;let targets=enemies.filter(e=>!e.dead&&e.y>0).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y));if(type==='blast')targets=targets.filter(e=>Math.hypot(e.x-x,e.y-y)<=340);else targets=targets.slice(0,type==='lightning'?5:7);
 targets.forEach(e=>{damage(e,spec.damage);if(type==='ice')e.frozen=3.5;if(type==='fire')e.burning=3;if(type==='nature')e.rooted=3;});return targets;
 }
 function tick(enemy,dt){enemy.flash=Math.max(0,(enemy.flash||0)-dt);enemy.frozen=Math.max(0,(enemy.frozen||0)-dt);enemy.rooted=Math.max(0,(enemy.rooted||0)-dt);if(enemy.burning>0){const step=Math.min(dt,enemy.burning);enemy.burning-=step;damage(enemy,step*1.8);}return enemy.frozen>0?0:enemy.rooted>0?.2:1;}
 root.BlockCombat={spells,damage,cast,tick};
})(typeof window==='undefined'?globalThis:window);
