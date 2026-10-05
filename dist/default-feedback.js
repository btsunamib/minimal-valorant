import {fetchWeaponAsset} from './weapon-assets.js?v=20261005-lighting2';
// Original standard VALORANT badge footage, with its native alpha channel.
// The source and checksums are recorded in docs/default-kill-banner-sources.json.
export function killFeedbackStyle(key,{weapons={},family=null,override='auto'}={}){
 const native=weapons[key]?.feedback;if(native)return {type:'native',family:native};
 if(family)return {type:'imported',family};
 return {type:'default',family:null};
}
export class DefaultFeedback {
 constructor(container,audio=()=>null,volume=()=>.5){this.audio=audio;this.volume=volume;this.cache=new Map();this.serial=0;this.container=container;this.video=document.createElement('div');this.video.className='default-kill-video';this.video.style.backgroundSize='2000px 1200px';this.video.setAttribute('aria-label','原版击杀徽章');container.append(this.video);this.age=10;}
 async play(count){this.hide();const serial=this.serial;this.age=0;this.container.classList.add('default-kill');this.video.style.backgroundImage='url("./assets/feedback/default/'+Math.max(1,Math.min(5,count))+'.webp")';this.frame(0);const ctx=this.audio();if(!ctx)return;const file='./assets/feedback/default/'+Math.max(1,Math.min(5,count))+'.mp3';try{if(!this.cache.has(file))this.cache.set(file,fetchWeaponAsset(file).then(b=>ctx.decodeAudioData(b)).catch(e=>{this.cache.delete(file);throw e;}));const buffer=await this.cache.get(file);if(serial!==this.serial||this.age>=2.2)return;const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.value=this.volume();source.connect(gain);gain.connect(ctx.destination);source.start();this.source=source;}catch{}}
 frame(age){const f=Math.min(59,Math.floor(age*30));this.video.style.backgroundPosition=(-(f%8)*250)+'px '+(-Math.floor(f/8)*150)+'px';}
 update(dt){if(this.age>=2.2)return;this.age+=dt;this.frame(this.age);if(this.age>=2.2)this.hide();}
 hide(){this.serial++;this.source?.stop();this.source=null;this.age=10;this.container.classList.remove('default-kill');}
}
