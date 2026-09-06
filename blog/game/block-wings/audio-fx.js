/* Weapon-specific synthesis, layered explosions and a compressed, duckable effects bus. */
window.BlockSFX=class{
 constructor(context){
  this.ctx=context;this.next={};this.stats={};this.weaponStats=Array(8).fill(0);this.muted=false;
  this.bus=context.createGain();this.bus.gain.value=.78;
  this.compressor=context.createDynamicsCompressor();this.compressor.threshold.value=-14;this.compressor.knee.value=16;this.compressor.ratio.value=8;this.compressor.attack.value=.003;this.compressor.release.value=.14;
  this.bus.connect(this.compressor);this.compressor.connect(context.destination);
  this.noise=context.createBuffer(1,Math.floor(context.sampleRate*.85),context.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
 }
 duck(speaking){this.bus.gain.setTargetAtTime(this.muted?0:speaking?.3:.78,this.ctx.currentTime,.025);}
 setMuted(value){this.muted=value;this.bus.gain.cancelScheduledValues(this.ctx.currentTime);this.bus.gain.setValueAtTime(value?0:.78,this.ctx.currentTime);}
 tone(freq,end,duration,volume,type='triangle',delay=0){
  const c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(end,t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.bus);o.start(t);o.stop(t+duration);o.onended=()=>{o.disconnect();g.disconnect();};
 }
 hiss(duration,cutoff,volume,type='lowpass',delay=0){
  const c=this.ctx,t=c.currentTime+delay,source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=this.noise;filter.type=type;filter.frequency.setValueAtTime(cutoff,t);filter.frequency.exponentialRampToValueAtTime(Math.max(100,cutoff*.3),t+duration);
  gain.gain.setValueAtTime(volume,t);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);source.connect(filter);filter.connect(gain);gain.connect(this.bus);source.start(t);source.stop(t+duration);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
 }
 play(kind='hit',variant=0,power=1){
  const c=this.ctx;if(this.muted||c.state!=='running'||c.currentTime<(this.next[kind]||0))return;
  this.next[kind]=c.currentTime+({hit:.055,laser:.08,shot:.075,blast:.11,missile:.25}[kind]||.07);this.stats[kind]=(this.stats[kind]||0)+1;
  if(kind==='shot'){
   const mode=((variant%8)+8)%8;this.weaponStats[mode]++;
   // Crackling cannon, intertwined notes, laser sweep, blade, wave, double tap, pulse, glass.
   const voices=[[520,100,.075,.12,'triangle'],[1250,500,.11,.075,'sine'],[2500,650,.105,.045,'sawtooth'],[1800,850,.09,.07,'sine'],[680,180,.12,.1,'sine'],[850,240,.06,.085,'triangle'],[210,55,.15,.15,'sine'],[2300,1500,.12,.065,'sine']];
   this.tone(...voices[mode]);this.hiss(.035,mode===2?4200:2200,mode===0?.105:.04,'bandpass');
   if(mode===1)this.tone(1700,720,.1,.04,'sine',.018);
   if(mode===5)this.tone(1000,320,.05,.065,'triangle',.032);
   if(mode===7)this.tone(3300,2700,.085,.028,'sine',.014);
   return;
  }
  if(kind==='missile'){this.hiss(.28,2200,.13,'bandpass');this.tone(190,460,.18,.075,'sawtooth');return;}
  if(kind==='blast'){
   const p=Math.max(.4,Math.min(1.3,power));
   this.tone(125,33,.5,.3*p,'sine');this.tone(78,27,.65,.15*p,'triangle',.012);
   this.hiss(.13,4200,.22*p,'highpass');this.hiss(.66,850,.32*p);this.hiss(.22,2400,.075*p,'bandpass',.095);
   for(let i=0;i<3;i++)this.tone(650+i*310,180+i*90,.07,.025*p,'triangle',.065+i*.04);
   return;
  }
  const spec={hit:[.085,2300,.1,950,180],laser:[.09,3600,.065,1650,420],block:[.16,1700,.14,650,180],ice:[.24,5500,.12,2300,850],wood:[.14,700,.15,240,75],stone:[.18,1200,.16,340,90]}[kind]||[.12,1700,.1,600,150];
  const [duration,cutoff,volume,freq,end]=spec;this.hiss(duration,cutoff,volume,kind==='ice'?'highpass':'lowpass');this.tone(freq,end,duration,volume*.65);
 }
};
