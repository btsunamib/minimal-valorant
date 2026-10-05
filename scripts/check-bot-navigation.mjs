import fs from 'node:fs';
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import * as T from '../dist/three.module.js';
import {MapNavigation} from '../dist/map-navigation.js';
import {MapInteractions} from '../dist/map-interactions.js';
import {resetBotNavigation,stepBotNavigation} from '../dist/bot-navigation.js';

let routes=0,regressions=0;
for(const key of ['ascent','breeze','sunset','pearl','lotus','fracture']){
 const data=JSON.parse(gunzipSync(fs.readFileSync(new URL('../dist/assets/maps/'+key+'/map.json.gz',import.meta.url))));
 const n=new MapNavigation(data),interactions=new MapInteractions({scene:new T.Scene(),walls:[],phase:()=> 'live'});
 interactions.attach({key,data,navigation:n});
 for(const attacking of [true,false])for(let index=0;index<5;index++)for(const goal of data.sites){
  const b=interactions.spawn(attacking,index),start={...b};resetBotNavigation(b);
  const dt=[1/30,1/60,1/144][routes%3];let travel=0,plans=0,spawnProgress=null;
  const api={speed:3.4,trace:(a,p)=>n.trace(a,p),plan:(actor,target)=>{plans++;const p=n.safePoint(target);return n.path(actor.x,actor.z,p.x,p.z,actor.floor,p.floor);},move:(actor,dx,dz)=>{
   const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.3)),before={...actor};
   for(let i=0;i<steps;i++){
    if(!n.blocked(actor.x+dx/steps,actor.z,.37,actor.floor,1.12))actor.x+=dx/steps;
    if(!n.blocked(actor.x,actor.z+dz/steps,.37,actor.floor,1.12))actor.z+=dz/steps;
   }
   actor.floor=n.floorAt(actor.x,actor.z,actor.floor)??actor.floor;
   travel+=Math.hypot(actor.x-before.x,actor.z-before.z);
  }};
  for(let elapsed=0;elapsed<180&&!b.pathFinished;elapsed+=dt){
   stepBotNavigation(b,goal,dt,api);
   assert(Number.isFinite(b.x)&&Number.isFinite(b.z),key+' finite movement');
   if((key==='breeze'||key==='lotus')&&index===0&&goal===data.sites[0]&&elapsed>=44.9&&elapsed<44.9+dt){
    spawnProgress=Math.hypot(b.x-start.x,b.z-start.z);
   }
  }
  if((key==='breeze'||key==='lotus')&&index===0&&goal===data.sites[0]){
   spawnProgress??=Math.hypot(b.x-start.x,b.z-start.z);
   assert(spawnProgress>20,key+' leaves spawn by 45 seconds or arrives earlier');regressions++;
  }
  assert(b.pathFinished,`${key}/${attacking?'attack':'defend'}/${index}/${goal.name} completes (${plans} plans, ${travel.toFixed(1)}m)`);
  assert(Math.hypot(b.x-goal.x,b.z-goal.z)<.01,key+' reaches site');
  assert(Math.abs(b.floor-goal.floor)<.12,key+' reaches physical floor');
  assert.equal(plans,1,key+' retains its route');routes++;
 }
 interactions.dispose();console.log('PASS bot route following',key);
}
assert.equal(regressions,4);
console.log('PASS',routes,'actual formation routes at 30/60/144 FPS, including four spawn-circling regressions');
