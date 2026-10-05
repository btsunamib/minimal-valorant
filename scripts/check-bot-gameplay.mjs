const {parseHTML}=await import(process.env.LINKEDOM_PATH||'linkedom');import fs from 'node:fs';import assert from 'node:assert/strict';
const root=new URL('../dist',import.meta.url).pathname;const {window}=parseHTML(fs.readFileSync(root+'/index.html','utf8'));const {document}=window;let clock=1000;
const ctx=new Proxy({canvas:{width:256,height:256},measureText:s=>({width:s.length*10}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),getImageData:()=>({data:new Uint8ClampedArray(2048*1792*4)}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createPattern:()=>({})},{get:(o,k)=>o[k]??(()=>{})});
Object.defineProperty(window.HTMLSelectElement.prototype,'value',{get(){return this._value||this.querySelector('option[selected]')?.value||this.querySelector('option')?.value},set(v){this._value=v},configurable:true});window.HTMLCanvasElement.prototype.getContext=type=>type==='2d'?ctx:null;window.HTMLElement.prototype.setPointerCapture=()=>{};window.HTMLElement.prototype.hasPointerCapture=()=>false;
Object.assign(globalThis,{window,document,Element:window.Element,innerWidth:1280,innerHeight:720,devicePixelRatio:1,matchMedia:()=>({matches:false}),localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame:()=>{},Image:window.Image,getComputedStyle:()=>({getPropertyValue:()=>''})});Object.defineProperty(globalThis,'navigator',{value:{maxTouchPoints:0},configurable:true});Object.defineProperty(globalThis,'performance',{value:{now:()=>clock},configurable:true});window.matchMedia=globalThis.matchMedia;window.screen={orientation:{angle:0,addEventListener(){}}};window.innerWidth=1280;window.innerHeight=720;window.devicePixelRatio=1;document.exitPointerLock=()=>{};
const networkFetch=globalThis.fetch;globalThis.fetch=async(url,options)=>{if(typeof url==='string'&&(url.startsWith('./assets/')||url.startsWith('https://raw.githubusercontent.com/btsunamib/minimal-valorant/'))){const relative=url.startsWith('./assets/')?url.slice(2):new URL(url).pathname.split('/dist/')[1];const path=root+'/'+relative;if(!fs.existsSync(path))return new Response('Missing asset',{status:404});return new Response(fs.readFileSync(path));}return networkFetch(url,options);};
const {SoftwareRenderer}=await import(root+'/software-renderer.js?v=20261005-lighting2');SoftwareRenderer.prototype.render=function(){};
import {gunzipSync} from 'node:zlib';
import {MapNavigation} from '../dist/map-navigation.js';
const source=fs.readFileSync(root+'/main.js','utf8')+`
export const qa={prepareAgents:preloadAgentModels,startMatch,newRound,beginLive,spawnEntity,player,entities,setSide(side){attackTeam=side;round=0;},map:()=>mapInteractions,setMap(map){round=0;attackTeam=0;activeMap=map;SITES.splice(0,SITES.length,...map.data.sites);mapInteractions.attach(map);},focus(bot){player.alive=false;for(const b of entities)b.alive=b===bot;bomb.carrier=null;},step(dt){gameTime+=dt;mapInteractions.tick(dt,[player,...entities]);updateBots(dt);}};`;
const temp=root+'/.qa-bot-navigation.mjs';fs.writeFileSync(temp,source);
try{
 const {qa:q}=await import(temp);await q.prepareAgents();q.startMatch();
 for(const b of q.entities)b.art.update=()=>{};
 let scenarios=0;
 for(const key of ['ascent','breeze','sunset','pearl','lotus','fracture']){
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
 console.log('PASS',scenarios,'real game bot scenarios, dynamic map collision/doors and round resets; DOM/canvas mocked');
}finally{fs.unlinkSync(temp);}
