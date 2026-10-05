import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import * as T from '../dist/three.module.js';import {GoldSrcModel} from '../dist/goldsrc-model.js';import {sequenceFor} from '../dist/imported-weapons.js';
import {prepareNativeShowroom,showNativeShowroom,restoreNativeViewmodel} from '../dist/native-showroom.js';
const pose=r=>r.bones.map(b=>[...b.position.toArray(),...b.quaternion.toArray(),...b.scale.toArray()]);
const boxes=r=>{const boxes=r.collectionParts.map(()=>new T.Box3());for(const mesh of r.meshes)if(mesh.visible)for(const i of new Set(mesh.geometry.index.array)){let bone=r.bones[mesh.geometry.attributes.skinIndex.getX(i)];while(bone?.isBone&&!r.collectionParts.some(p=>p.bone===bone))bone=bone.parent;const n=r.collectionParts.findIndex(p=>p.bone===bone);if(n>=0)boxes[n].expandByPoint(mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld));}return boxes;};
test('Both Blackwave ports show two distinct blade panels without drift and restore every original action bone/index',()=>{
 for(const [key,variant]of [['kuronami','base'],['kuronami','white'],['kuronami','purple'],['kuronami','black'],['kuronamizipknife','base']]){
  const b=fs.readFileSync(new URL(`../dist/assets/imported/${key}/${variant}/model.mdl`,import.meta.url)),p=new GoldSrcModel(b.buffer.slice(b.byteOffset,b.byteOffset+b.length)),r=p.instantiate(),idle=sequenceFor(p.sequences,'idle');
  r.sample(idle,0);const source=pose(r),indices=r.meshes.map(m=>Array.from(m.geometry.index.array));prepareNativeShowroom(r,true);showNativeShowroom(r);assert.equal(r.collectionParts.length,2,key+'/'+variant);
  const first=boxes(r);assert(first[1].min.x-first[0].max.x>.25,'Reserved gap between the complete blade/chain panels');
  for(let i=0;i<16;i++){r.sample(idle,0);showNativeShowroom(r);const now=boxes(r);for(let n=0;n<2;n++){assert(now[n].min.distanceTo(first[n].min)<1e-9);assert(now[n].max.distanceTo(first[n].max)<1e-9);}}
  restoreNativeViewmodel(r);assert.deepEqual(pose(r),source);assert.deepEqual(r.meshes.map(m=>Array.from(m.geometry.index.array)),indices);
  // Restore before an action, or after it has already sampled: both call orders
  // must keep the native draw/inspect/attack pose exactly unchanged.
  for(const action of ['draw','inspect','slash1','slash2','stab']){const seq=sequenceFor(p.sequences,action);for(const frame of [0,Math.floor(p.sequences[seq].frames/2),p.sequences[seq].frames-1]){
   r.sample(seq,frame);const expected=pose(r);r.sample(idle,0);showNativeShowroom(r);restoreNativeViewmodel(r);r.sample(seq,frame);assert.deepEqual(pose(r),expected);
   r.sample(idle,0);showNativeShowroom(r);r.sample(seq,frame);restoreNativeViewmodel(r);assert.deepEqual(pose(r),expected);
  }}r.dispose();
 }
});
