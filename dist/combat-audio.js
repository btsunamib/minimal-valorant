export const KILL_STEPS=[0,2,4,7,12];
export const killLevel=count=>Math.max(1,Math.min(5,Math.floor(Number(count)||1)));
export const combatKillCount=(mode,roundKills,streak)=>mode==='team'?streak:roundKills;
// Reconstruction: distinct kill ladder + short head impact, never represented as Riot masters.
export class CombatAudio{
 constructor(){this.headBuffer=null;this.lastHead=-10;this.voices=new Set();}
 headshot(ctx,volume=1){if(!ctx||!volume||ctx.currentTime-this.lastHead<.035)return false;this.lastHead=ctx.currentTime;
  if(!this.headBuffer){const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.16),ctx.sampleRate),a=b.getChannelData(0);let seed=217,low=0;for(let i=0;i<a.length;i++){const t=i/ctx.sampleRate;seed=(Math.imul(seed,1664525)+1013904223)|0;const n=seed/2147483648;low+=.12*(n-low);a[i]=((n-low)*.60*Math.exp(-t*74)+Math.sin(2*Math.PI*(2350*t-3600*t*t))*.28*Math.exp(-t*43)+Math.sin(2*Math.PI*710*t)*.18*Math.exp(-t*32))*Math.min(1,t/.001);}this.headBuffer=b;}
  const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=this.headBuffer;g.gain.value=volume*.7;s.connect(g);g.connect(ctx.destination);this.voices.add(s);s.onended=()=>{s.disconnect();g.disconnect();this.voices.delete(s)};s.start();return true;
 }
 kill(ctx,count,volume=1,aceOnly=false){if(!ctx||!volume)return;const level=killLevel(count),root=220*2**(KILL_STEPS[level-1]/12),notes=level===5?[1,1.5,2,2.5]:[1,1.5,2];notes.forEach((ratio,i)=>{if(aceOnly&&level!==5)return;const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+i*(level===5?.09:.055),dur=level===5?.55:.24;o.type='triangle';o.frequency.setValueAtTime(root*ratio,t);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(volume*(aceOnly?.038:.10),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(ctx.destination);this.voices.add(o);o.onended=()=>{o.disconnect();g.disconnect();this.voices.delete(o)};o.start(t);o.stop(t+dur+.02);});}
 stop(){for(const s of this.voices)try{s.stop()}catch{}this.voices.clear();}
}
