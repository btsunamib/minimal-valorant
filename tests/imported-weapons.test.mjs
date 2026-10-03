import {gunzipSync} from 'node:zlib';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import * as T from '../dist/three.module.js';
import {GoldSrcModel} from '../dist/goldsrc-model.js';
import {NativeTimeline,IMPORTED_WEAPONS,importedSelection,sequenceFor} from '../dist/imported-weapons.js';
const base=new URL('../dist/assets/imported/',import.meta.url);
const load=url=>{const b=existsSync(url)?readFileSync(url):gunzipSync(readFileSync(new URL(url.href+'.gz')));return new GoldSrcModel(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
test('All supplied GoldSrc model variants decode every original bone frame, event, texture and triangle',()=>{
 let frames=0,variants=0;
 for(const [key,spec]of Object.entries(IMPORTED_WEAPONS).filter(([,s])=>s.format!=='source49'))for(const variant of Object.keys(spec.variants)){
  const path=new URL(`${key}/${variant}/`,base),parsed=load(new URL('model.mdl',path)),meta=JSON.parse(readFileSync(new URL('sequences.json',path)));
  assert.equal(meta.length,parsed.sequences.length);
  for(const seq of parsed.sequences){assert.equal(meta[seq.index].name,seq.name);assert.equal(meta[seq.index].frames,seq.frames);assert.equal(meta[seq.index].fps,seq.fps);assert.equal(meta[seq.index].events.length,seq.events.length);
   for(let f=0;f<seq.frames;f++){const pose=parsed.pose(seq.index,f);assert.equal(pose.length,parsed.bones.length*7);assert(pose.every(Number.isFinite),`${key}/${variant}/${seq.name}/${f}`);frames++;}
   for(const event of meta[seq.index].events)if(event.sound)assert(existsSync(spec.soundBase?new URL('../dist/'+spec.soundBase.slice(2)+'/'+event.sound,import.meta.url):new URL('sound/'+event.sound,path)));
  }
  const geometry=parsed.geometry();assert(geometry.length>0);for(const mesh of geometry){assert(mesh.vertices.every(Number.isFinite));assert(mesh.normals.every(Number.isFinite));assert.equal(mesh.uv.length,mesh.vertices.length/3*2);assert(mesh.triangles.every(i=>i>=0&&i<mesh.vertices.length/3));}
  if(key==='kuronamivandal'){const finisher=load(new URL('finisher.mdl',path));for(let f=0;f<finisher.sequences[0].frames;f++)assert(finisher.pose(0,f).every(Number.isFinite));assert(existsSync(new URL('muzzle.json',path)));}
  variants++;
 }
 assert.equal(variants,Object.values(IMPORTED_WEAPONS).filter(s=>s.format!=='source49').reduce((n,s)=>n+Object.keys(s.variants).length,0));assert(frames>10000);
});
test('Native seeking restores identical deformed mesh positions in either direction',()=>{
 const p=load(new URL('champions24/aura/model.mdl',base)),rig=p.instantiate(),seq=sequenceFor(p.sequences,'draw'),mesh=rig.meshes[0];
 const positions=()=>[0,10,25].map(i=>mesh.getVertexPosition(i,new T.Vector3()).toArray());rig.sample(seq,37);const expected=positions();rig.sample(seq,2);rig.sample(seq,76);rig.sample(seq,37);assert.deepEqual(positions(),expected);rig.dispose();
});
test('Native event cursor survives low FPS, seeking and repeated actions without replaying stale cues',()=>{
 const p=load(new URL('champions24/base/model.mdl',base)),events=[],timeline=new NativeTimeline(p.sequences,e=>events.push(e.frame)),seq=sequenceFor(p.sequences,'draw');timeline.play(seq);timeline.advance(1);assert.deepEqual(events,[1,12,34]);timeline.seek(0);timeline.advance(1);assert.deepEqual(events,[1,12,34]);timeline.play(seq);timeline.advance(.7);assert.deepEqual(events,[1,12,34,1,12,34]);
});
test('Native pose clock and action recovery remain identical at 30 / 60 / 120 / 165 / 240 Hz',()=>{
 const p=load(new URL('kuronami/base/model.mdl',base)),seq=sequenceFor(p.sequences,'draw'),clocks=[];
 for(const fps of [30,60,120,165,240]){const t=new NativeTimeline(p.sequences);t.play(seq,{gameplay:true});for(let i=0;i<fps*2;i++)t.advance(1/fps);clocks.push(t);}
 for(const t of clocks){assert.equal(t.index,0);assert(Math.abs(t.seconds-clocks[0].seconds)<1e-10);}
});
test('Selection respects weapon slots and validates native variants',()=>{
 assert.equal(importedSelection('classic',{skin:'kuronamivandal'}),null);assert.deepEqual(importedSelection('vandal',{skin:'kuronamivandal',importedVariants:{kuronamivandal:'white'}}),{key:'kuronamivandal',variant:'white'});assert.equal(importedSelection('knife',{knife:'narukami'}),null);assert.equal(importedSelection('knife',{knife:'kuronami',kuronamiVariant:'invalid'}).variant,'base');
});
test('Malformed / truncated native resources fail clearly',()=>{assert.throws(()=>new GoldSrcModel(new ArrayBuffer(3)),/Truncated/);const b=readFileSync(new URL('kuronami/base/model.mdl',base));b[0]=0;assert.throws(()=>new GoldSrcModel(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)),/IDST/);});

test('Champion upgrade levels retain their separate same-named sound files',()=>{const read=variant=>JSON.parse(readFileSync(new URL('champions24/'+variant+'/sequences.json',base)));assert.equal(read('base')[1].events[0].sound,'weapons/valorant/champions4blade/s1.wav');assert.equal(read('level1')[1].events[0].sound,'weapons/valorant/champnolvlblade/s1.wav');const a=readFileSync(new URL('champions24/base/sound/weapons/valorant/champions4blade/s1.wav',base)),b=readFileSync(new URL('champions24/base/sound/weapons/valorant/champnolvlblade/s1.wav',base));assert.notDeepEqual(a,b);});
