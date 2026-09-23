export class NaruAudio{
 constructor(){this.buffers=new Map();this.loading=null;this.active=null;}
 preload(ctx){if(!ctx)return Promise.resolve();if(this.loading)return this.loading;this.loading=Promise.allSettled(['drawLong','drawKunai','toKunai','toLong','slash','heavy'].filter(k=>!this.buffers.has(k)).map(async k=>{const r=await fetch(new URL(`./assets/narukami/${k}.mp3`,import.meta.url));if(!r.ok)throw Error(k);this.buffers.set(k,await ctx.decodeAudioData(await r.arrayBuffer()));})).finally(()=>this.loading=null);return this.loading;}
 play(ctx,key,volume=1,offset=0){this.stop();const b=this.buffers.get(key);if(!ctx||!b||!volume||offset>=b.duration)return false;const s=ctx.createBufferSource(),g=ctx.createGain();s.buffer=b;g.gain.value=volume;s.connect(g);g.connect(ctx.destination);s.start(0,Math.max(0,offset));this.active=s;s.onended=()=>{s.disconnect();g.disconnect();if(this.active===s)this.active=null};return true;}
 stop(){try{this.active?.stop()}catch{}this.active=null;}
}
