const {parseHTML}=await import(process.env.LINKEDOM_PATH||'linkedom');import fs from 'node:fs';import assert from 'node:assert/strict';
const root=new URL('../dist',import.meta.url).pathname;const {window}=parseHTML(fs.readFileSync(root+'/index.html','utf8'));const {document}=window;let clock=1000;
const ctx=new Proxy({canvas:{width:256,height:256},measureText:s=>({width:s.length*10}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),getImageData:()=>({data:new Uint8ClampedArray(2048*1792*4)}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createPattern:()=>({})},{get:(o,k)=>o[k]??(()=>{})});
Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return this._value||this.querySelector('option[selected]')?.value||this.querySelector('option')?.value},set(v){this._value=v},configurable:true});window.HTMLCanvasElement.prototype.getContext=type=>type==='2d'?ctx:null;window.HTMLElement.prototype.setPointerCapture=()=>{};window.HTMLElement.prototype.hasPointerCapture=()=>false;
Object.assign(globalThis,{window,document,Element:window.Element,innerWidth:1280,innerHeight:720,devicePixelRatio:1,matchMedia:()=>({matches:false}),localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame:()=>{},Image:window.Image,getComputedStyle:()=>({getPropertyValue:()=>''})});Object.defineProperty(globalThis,'navigator',{value:{maxTouchPoints:0},configurable:true});Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});window.matchMedia=globalThis.matchMedia;window.screen={orientation:{angle:0,addEventListener(){}}};window.innerWidth=1280;window.innerHeight=720;window.devicePixelRatio=1;document.exitPointerLock=()=>{};
const networkFetch=globalThis.fetch;globalThis.fetch=async(url,options)=>{if(typeof url==='string'&&(url.startsWith('./assets/')||url.startsWith('https://raw.githubusercontent.com/btsunamib/minimal-valorant/'))){const relative=url.startsWith('./assets/')?url.slice(2):new URL(url).pathname.split('/dist/')[1];const path=root+'/'+relative;if(!fs.existsSync(path))return new Response('Missing asset',{status:404});return new Response(fs.readFileSync(path));}return networkFetch(url,options);};
const {SoftwareRenderer}=await import(root+'/software-renderer.js?v=20261005-ai-packs1');SoftwareRenderer.prototype.render=function(){};
import {gunzipSync} from 'node:zlib';
import {MapNavigation} from '../dist/map-navigation.js';
import * as T from '../dist/three.module.js';
const source=fs.readFileSync(root+'/main.js','utf8')+`
export const qa={prepareAgents:preloadAgentModels,startMatch,newRound,beginLive,spawnEntity,player,entities,wallMeshes,botTactics,agentRuntime,phase:()=>phase,time:()=>gameTime,noise(e){botTactics.sound(e,gameTime);},setBomb(value){bomb={...bomb,...value};},setSide(side){attackTeam=side;round=0;},map:()=>mapInteractions,setMap(map){round=0;attackTeam=0;activeMap=map;SITES.splice(0,SITES.length,...map.data.sites);mapInteractions.attach(map);},focus(bot){player.alive=false;for(const b of entities)b.alive=b===bot;bomb.carrier=null;},step(dt){gameTime+=dt;mapInteractions.tick(dt,[player,...entities]);agentRuntime.tick(dt);updateBots(dt);}};`;
const temp=root+'/.qa-bot-gameplay-'+process.pid+'.mjs';fs.writeFileSync(temp,source);
try{
 const {qa:q}=await import(temp);await q.prepareAgents();q.startMatch();
 for(const b of q.entities)b.art.update=()=>{};
 let scenarios=0;
 for(const key of (process.env.MINIVAL_BOT_QA_ROUTES==='0'?[]:['ascent','breeze','sunset','pearl','lotus','fracture'])){
  const data=JSON.parse(gunzipSync(fs.readFileSync(root+'/assets/maps/'+key+'/map.json.gz'))),navigation=new MapNavigation(data);
  q.setMap({key,data,navigation});
  for(const side of [0,1]){q.setSide(side);q.newRound();q.beginLive();
  for(let index=0;index<9;index++){
   const b=q.entities[index];q.spawnEntity(b,b.team===0?(index<2?index:index+1):index-4);q.focus(b);const start={x:b.x,z:b.z};let travel=0;
   for(let elapsed=0;elapsed<180&&!b.pathFinished;elapsed+=1/30){const before={x:b.x,z:b.z};q.step(1/30);travel+=Math.hypot(b.x-before.x,b.z-before.z);}
   assert(b.pathFinished,`${key}/side${side}/bot${index}/team${b.team} actual updateBots completes (${travel.toFixed(1)}m, position ${b.x},${b.z}, next ${JSON.stringify(b.path[0])})`);
   assert(travel>1,key+' physically leaves spawn');
   assert(Math.hypot(b.x-b.pathEnd.x,b.z-b.pathEnd.z)<.01,key+' reaches route destination');
   assert(Math.abs(b.floor-b.pathEnd.floor)<.12,key+' reaches destination floor');
   if(key==='breeze'||key==='lotus')assert(Math.hypot(b.x-start.x,b.z-start.z)>20,key+' spawn circling fixed in actual game');
   scenarios++;
  }}
  console.log('PASS actual updateBots',key);
 }
 q.newRound();assert(q.entities.every(b=>!b.pathGoal&&b.pathStuck===0&&!b.pathFinished),'New round resets every bot route');
 assert(q.entities.every(b=>!b.ai.memory&&!b.ai.reloadUntil&&!b.ai.decision),'Round clears tactical memory/reload/orders');
 assert.equal(new Set(q.entities.map(b=>b.personality.id)).size,5,'All five behavior styles exist in the actual match');
 const data=JSON.parse(gunzipSync(fs.readFileSync(root+'/assets/maps/ascent/map.json.gz'))),navigation=new MapNavigation(data);
 q.setMap({key:'ascent',data,navigation});q.setSide(0);q.newRound();q.beginLive();
 const b=q.entities[0];q.focus(b);const site=data.sites[0];
 const place=(actor,p)=>{Object.assign(actor,{x:p.x,z:p.z,floor:p.floor??site.floor,y:(p.floor??site.floor)+1.73});actor.mesh?.position.set(actor.x,actor.floor,actor.z);};
 place(b,site);b.mesh.rotation.y=0;place(q.player,{x:b.x,z:b.z+12});q.player.alive=true;q.player.team=1;q.player.hp=10000;
 for(let i=0;i<5;i++)q.step(.1);
 assert.equal(b.ai.visible,null,'Distant enemy behind bot is not magically acquired');assert.equal(b.ai.memory,null);
 q.noise(q.player);q.step(.1);assert(b.ai.heard,'Actual shot sound triggers hearing');assert.equal(b.ai.heard.source,'sound');
 place(q.player,{x:b.x,z:b.z-10});b.mesh.rotation.y=0;b.ai.scanAt=0;b.skillAt=Infinity;
 q.step(.1);assert.equal(b.ai.visible,q.player,'Bot acquires visible enemy in front');
 const wall=new T.Mesh(new T.BoxGeometry(12,5,.6),new T.MeshBasicMaterial({side:T.DoubleSide}));wall.position.set(b.x,b.floor+2,(b.z+q.player.z)/2);wall.updateMatrixWorld(true);q.wallMeshes.push(wall);
 const remembered={...b.ai.memory},blockedShots=b.ai.shots;b.reaction=0;b.shootTimer=0;
 q.player.x+=2;q.step(.05);assert.equal(b.ai.shots,blockedShots,'Firing rechecks occlusion between perception scans');
 b.ai.scanAt=0;q.step(.05);assert.equal(b.ai.visible,null,'A wall hides the enemy');assert.equal(b.ai.memory.x,remembered.x,'Memory cannot follow the hidden enemy');
 q.wallMeshes.splice(q.wallMeshes.indexOf(wall),1);wall.geometry.dispose();wall.material.dispose();b.ai.scanAt=0;q.step(.1);
 b.ai.ammo=0;const shots=b.ai.shots;q.step(.1);assert(b.ai.reloadUntil>q.time());assert.equal(b.ai.decision.kind,'reload');
 for(let i=0;i<8;i++)q.step(.1);assert.equal(b.ai.shots,shots,'Cannot shoot during reload');
 q.player.alive=false;for(let i=0;i<35;i++)q.step(.1);assert.equal(b.ai.reloadUntil,0);assert.equal(b.ai.ammo,12);
 q.player.team=0;q.newRound();q.beginLive();q.focus(b);place(b,site);b.hp=45;b.skillAt=0;
 q.step(.1);assert(b.kit.healing,'Sage selects real self-heal with no enemy');
 for(let i=0;i<20;i++)q.step(.1);assert(b.hp>45,'Bot healing actually restores HP through ability runtime');
 q.setSide(1);q.newRound();q.beginLive();q.focus(b);place(b,site);const cover=q.entities[1];cover.alive=true;place(cover,{x:site.x+6,z:site.z,floor:site.floor});
 q.setBomb({planted:true,x:site.x,z:site.z,floor:site.floor,timer:20,defuse:0});
 for(let i=0;i<10;i++)q.step(.1);assert.equal(b.ai.decision.kind,'defuse');assert.equal(cover.ai.decision.kind,'cover');assert(b.defuseProgress>.9);
 for(let i=0;i<65&&q.phase()==='live';i++)q.step(.1);assert.equal(q.phase(),'end','Coordinated retake completes actual defuse and round');
 console.log('PASS',scenarios,'real game route scenarios plus perception/occlusion, hearing, finite ammo/reload, real healing, coordinated defuse and resets; DOM/canvas mocked');
}finally{fs.rmSync(temp,{force:true});}
