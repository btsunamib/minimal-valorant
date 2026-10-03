import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as T from '../dist/three.module.js';
import {MapNavigation} from '../dist/map-navigation.js';
import {loadSourceModel} from '../dist/source-model.js';
import {skinThumbnail} from '../dist/collection.js';
import {prepareNativeShowroom,showNativeShowroom} from '../dist/native-showroom.js';
import {GoldSrcModel} from '../dist/goldsrc-model.js';
import {OCTOBER_IMPORTS} from '../dist/october-catalog.js';
import {FEEDBACK_PACKS} from '../dist/feedback-catalog.js';
const asset=path=>new URL('../dist/assets/'+path,import.meta.url);
test('Six supplied maps have clear spawns, all bomb sites reachable, and finite baked geometry',()=>{
 for(const key of ['ascent','breeze','sunset','pearl','lotus','fracture']){
  const d=JSON.parse(gunzipSync(readFileSync(asset('maps/'+key+'/map.json.gz')))),n=new MapNavigation(d);
  assert.equal(d.sites.length,key==='lotus'?3:2,key);
  for(const m of d.meshes){assert(m.positions.every(Number.isFinite));assert(m.colors.every(Number.isFinite));assert.equal(m.uv.length,m.positions.length/3*2);}
  for(const t of d.textures)assert(t.file&&existsSync(asset('maps/'+key+'/'+t.file)),key+' '+t.name);
  for(const side of ['attack','defend'])for(let i=0;i<d.spawns[side].length;i++){
   const s=n.spawn(side==='attack',i);assert(!n.blocked(s.x,s.z,.37,s.floor),key+' '+side+' spawn '+i);
   for(const target of d.sites)assert(n.path(s.x,s.z,target.x,target.z,s.floor,target.floor).length>0,key+' '+side+' -> '+target.name);
  }
 }
});
test('Collision respects vertical wall spans and floor steps',()=>{
 const d={areas:[{id:1,bounds:[0,0,4,4],heights:[0,0,0,0],links:[]}],bounds:[0,0,4,4],roots:[],nodes:[],planes:[],leaves:[],wallSegments:[[2,0,2,4,0,3]],sites:[],spawns:{attack:[],defend:[]}},n=new MapNavigation(d);
 assert(n.blocked(1.8,2,.37,0));assert(!n.blocked(1,2,.37,0));assert(n.blocked(8,8,.37,0));assert(!n.wallBlocked(2,2,.37,4));
});
test('Source 49 model retains 327 finite bone frames, valid skinning and material flags',async()=>{
 const b=readFileSync(asset('imported/champions25source/base/model.json.gz')),d=JSON.parse(gunzipSync(b));
 assert.equal(d.bones.length,92);assert.equal(d.sequences.reduce((n,s)=>n+s.frames,0),327);
 for(const s of d.sequences)for(const p of s.poses){assert.equal(p.length,92*7);assert(p.every(Number.isFinite));}
 for(const m of d.meshes){assert(m.indices.every(i=>i>=0&&i<92));for(let i=0;i<m.weights.length;i+=4)assert(Math.abs(m.weights.slice(i,i+4).reduce((a,b)=>a+b,0)-1)<1e-5);assert(m.triangles.every(i=>i<m.positions.length/3));}
 assert(d.textures.some(t=>t.name==='aura'&&t.additive));for(const t of d.textures)assert.equal(Buffer.from(t.rgba,'base64').length,t.width*t.height*4);
 const previous=globalThis.fetch;globalThis.fetch=async()=>new Response(b);
 try{const rig=(await loadSourceModel('./assets/imported/champions25source/base/model.json.gz')).instantiate(),m=rig.meshes.find(m=>m.name==='shezo_25'),point=()=>m.getVertexPosition(0,new T.Vector3()).toArray();rig.sample(5,70);const expected=point();rig.sample(4,10);rig.sample(5,70);assert.deepEqual(point(),expected);assert(expected.every(Number.isFinite));rig.sample(0,0);prepareNativeShowroom(rig);showNativeShowroom(rig);assert(rig.meshes.filter(m=>m.name.startsWith('fp_bountyhunter_')).every(m=>m.userData.nativeHand&&!m.visible));assert(rig.meshes.some(m=>m.userData.showroomIndices.length<m.userData.nativeIndices.length));rig.dispose();}finally{globalThis.fetch=previous;}
});
test('All six supplied aim models and both objective view models decode, and five feedback packs retain five audio stages',()=>{
 for(const [key,s]of Object.entries(OCTOBER_IMPORTS))assert(existsSync(new URL('../dist/'+skinThumbnail(s.weapon,key),import.meta.url)),key+' default thumbnail');
 for(const [key,s]of Object.entries(OCTOBER_IMPORTS).filter(([,s])=>s.hasAim)){
  const b=gunzipSync(readFileSync(asset('imported/'+key+'/base/aim.mdl.gz'))),p=new GoldSrcModel(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));assert(p.sequences.some(s=>s.name==='zoom_shoot'));for(const seq of p.sequences)for(let f=0;f<seq.frames;f++)assert(p.pose(seq.index,f).every(Number.isFinite));
 }
 for(const kind of ['c4','defuser']){const b=gunzipSync(readFileSync(asset('imported/utilities/'+kind+'.mdl.gz'))),p=new GoldSrcModel(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));assert(p.geometry().length>0);}
 for(const pack of Object.values(FEEDBACK_PACKS)){for(const p of [...pack.images,...pack.sounds])assert(existsSync(new URL('../dist/'+p,import.meta.url)),p);for(let n=1;n<=5;n++)assert(pack.sounds.some(p=>new RegExp('/'+n+'\\.wav$','i').test(p)));assert(pack.images.some(p=>p.includes('/frame1/')));}
});
