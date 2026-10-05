const {parseHTML}=await import(process.env.LINKEDOM_PATH||'linkedom');import fs from 'node:fs';import assert from 'node:assert/strict';
const root=new URL('../dist',import.meta.url).pathname;const {window}=parseHTML(fs.readFileSync(root+'/index.html','utf8'));const {document}=window;let clock=1000;
const ctx=new Proxy({canvas:{width:256,height:256},measureText:s=>({width:s.length*10}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),getImageData:()=>({data:new Uint8ClampedArray(2048*1792*4)}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createPattern:()=>({})},{get:(o,k)=>o[k]??(()=>{})});
Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return this._value||this.querySelector('option[selected]')?.value||this.querySelector('option')?.value},set(v){this._value=v},configurable:true});window.HTMLCanvasElement.prototype.getContext=type=>type==='2d'?ctx:null;window.HTMLElement.prototype.setPointerCapture=()=>{};window.HTMLElement.prototype.hasPointerCapture=()=>false;
Object.assign(globalThis,{window,document,Element:window.Element,innerWidth:1280,innerHeight:720,devicePixelRatio:1,matchMedia:()=>({matches:false}),localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame:()=>{},Image:window.Image,getComputedStyle:()=>({getPropertyValue:()=>''})});Object.defineProperty(globalThis,'navigator',{value:{maxTouchPoints:0},configurable:true});Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});window.matchMedia=globalThis.matchMedia;window.screen={orientation:{angle:0,addEventListener(){}}};window.innerWidth=1280;window.innerHeight=720;window.devicePixelRatio=1;document.exitPointerLock=()=>{};
const networkFetch=globalThis.fetch;globalThis.fetch=async(url,options)=>{if(typeof url==='string'&&(url.startsWith('./assets/')||url.startsWith('https://raw.githubusercontent.com/btsunamib/minimal-valorant/'))){const relative=url.startsWith('./assets/')?url.slice(2):new URL(url).pathname.split('/dist/')[1];const path=root+'/'+relative;if(!fs.existsSync(path))return new Response('Missing asset',{status:404});return new Response(fs.readFileSync(path));}return networkFetch(url,options);};
const {SoftwareRenderer}=await import(root+'/software-renderer.js?v=20261006-collection1');SoftwareRenderer.prototype.render=function(){};
globalThis.advanceTacticalClock=dt=>clock+=dt*1000;
const source=fs.readFileSync(root+'/main.js','utf8')+`\nexport const qa={prepareAgents:preloadAgentModels,startMatch,toMenu,beginLive,shoot,useAbility,switchWeapon,tickAgents,updateWeapon,updatePlayer,newRound,buy,tradeItem,closeOverlay,beginTouchFire,endTouchFire,player,prefs,entities,inventory,art:()=>weaponArt,controller:()=>abilityInput,runtime:()=>agentRuntime,hands:()=>agentHands,view:()=>abilityView,map:()=>mapInteractions,snapshot:()=>({money,phase,slot:currentSlot,weapon:weaponId()}),step(dt){advanceTacticalClock(dt);gameTime+=dt;updateWeapon(dt,dt);tickAgents(dt);updatePlayer(dt);},ready(){switchTime=0;gameTime+=2;}};`;
const temp=root+'/.qa-tactical.mjs';fs.writeFileSync(temp,source);
try{const {qa:q}=await import(temp);await q.prepareAgents();
for(const agent of ['wushu','thorne','hunter','phoenix','clay','guide','sarge']){
 q.prefs.agent=agent;for(const b of document.querySelectorAll('.mode-card'))b.classList.toggle('selected',b.dataset.mode==='team');q.startMatch();await q.art().readyPromise;q.beginLive();q.ready();q.player.kit.points=9;
 for(let i=0;i<4;i++){
  q.runtime().clear();q.runtime().reset(q.player,9);q.player.hp=50;q.player.alive=true;q.ready();q.closeOverlay();q.controller().cancel();
  if(i===3&&agent==='thorne'){const a=q.entities.find(a=>a.team===q.player.team);a.alive=false;a.x=q.player.x;a.z=q.player.z-4;a.floor=q.player.floor;}
  q.useAbility(['heal','smoke','dash','ult'][i]);assert(q.controller().busy,agent+'/'+i+' selects');for(let t=0;t<.5;t+=.02)q.step(.02);
  if(q.controller().current?.phase==='ready'){
   if(agent==='sarge'&&i===2){q.controller().addMapPoint({x:q.player.x,z:q.player.z-5});q.shoot(true);}
   else q.shoot(agent==='thorne'&&i===2);
   if(agent==='hunter'&&[1,2].includes(i)){for(let t=0;t<.5;t+=.02)q.step(.02);q.controller().release();}
  }
  for(let t=0;t<.6;t+=.02)q.step(.02);if(q.controller().current?.phase==='channel')q.controller().release();q.switchWeapon(2);q.controller().cancel();q.ready();q.player.kit.ultimate=null;
 }
 q.toMenu();assert.equal(q.runtime().objects.length,0);assert.equal(q.controller().busy,false);
}
q.prefs.agent='hunter';q.startMatch();await q.art().readyPromise;q.beginLive();q.ready();q.useAbility('smoke');for(let t=0;t<.4;t+=.02)q.step(.02);const before=q.player.kit.charges[1];q.beginTouchFire('finger1');q.beginTouchFire('finger2');for(let t=0;t<.6;t+=.02)q.step(.02);q.endTouchFire('finger1');assert.equal(q.player.kit.charges[1],before);q.endTouchFire('finger2');assert.equal(q.player.kit.charges[1],before-1);q.controller().cancel();
q.toMenu();for(const b of document.querySelectorAll('.mode-card'))b.classList.toggle('selected',b.dataset.mode==='bomb');q.startMatch();q.buy();const money=q.snapshot().money,charge=q.player.kit.charges[1];assert(q.tradeItem('skill1'));assert.equal(q.player.kit.charges[1],charge+1);assert(q.snapshot().money<money);assert(q.tradeItem('skill1',true));assert.equal(q.player.kit.charges[1],charge);assert.equal(q.snapshot().money,money);
console.log('PASS actual game integration: seven agents and 28 ability selections/casts, cancellation and menu cleanup, two-pointer arrow charging, pistol-round skill purchase/refund. DOM/canvas mock; no visual fidelity claim.');
}finally{fs.unlinkSync(temp);}
