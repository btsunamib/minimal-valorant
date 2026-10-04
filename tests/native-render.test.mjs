import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {gunzipSync} from 'node:zlib';import {createHash} from 'node:crypto';
import * as T from '../dist/three.module.js';import {GoldSrcModel} from '../dist/goldsrc-model.js';
import {createAgentModel,NATIVE_AGENT_IDS} from '../dist/agent-art.js';import {AGENTS} from '../dist/agents-data.js';
import {clipTexturedPolygon,SoftwareRenderer} from '../dist/software-renderer.js';
import {nativeMaterial} from '../dist/valorant-render.js';import {importedSelection,IMPORTED_WEAPONS} from '../dist/imported-weapons.js';
import {skinItems,equippedSkin} from '../dist/collection.js';import './native-agent-fixture.mjs';
test('All 12 native character files retain source checksums, colored palettes and multi-blend bone poses',()=>{
 const ledger=JSON.parse(readFileSync(new URL('../docs/native-agent-sources.json',import.meta.url)));assert.equal(ledger.files.length,12);
 for(const f of ledger.files){const b=gunzipSync(readFileSync(new URL('../'+f.output,import.meta.url)));assert.equal(createHash('sha256').update(b).digest('hex'),f.sha256);const p=new GoldSrcModel(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));assert(p.textures.some(t=>new Set(t.rgba).size>64));const s=p.sequences.find(s=>s.name==='ref_aim_rifle');assert.equal(s.blends,9);for(let blend=0;blend<9;blend++)assert(p.pose(s.index,0,blend).every(Number.isFinite));assert.notDeepEqual(p.pose(s.index,0,0),p.pose(s.index,0,8));assert.deepEqual(p.pose(s.index,0),p.pose(s.index,0,4));}
});
test('Native combat bodies animate, keep feet grounded, and retain real held rifles and invisible hit regions',()=>{
 for(const id of NATIVE_AGENT_IDS)for(const team of [0,1]){const a=createAgentModel(AGENTS.find(a=>a.id===id),{team});assert(a.rig.meshes.every(m=>m.isSkinnedMesh&&m.material.map));assert(a.held.meshes.some(m=>m.visible));a.setWeapon('classic');assert.equal(a.weapon,'classic');assert.equal(a.body.material.visible,false);assert.equal(a.head.material.visible,false);for(const state of [{},{moving:true},{shooting:true},{casting:true}]){a.update({...state,dt:.2});a.model.updateMatrixWorld(true);assert(a.head.position.toArray().every(Number.isFinite));assert(a.head.position.y>1.45&&a.head.position.y<1.9,'Head stays above the torso');const box=new T.Box3(),point=new T.Vector3();for(const mesh of a.rig.meshes)for(let i=0;i<mesh.geometry.attributes.position.count;i++)box.expandByPoint(mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld));assert(box.max.y>1.7&&box.max.y<2.1,'Native body stands upright');assert(box.min.y>-.1&&box.min.y<.2,'Native feet remain near ground');assert(box.getSize(point).x<1.2,'Character axes keep their proper rotation');}a.dispose();}
});
test('Near-plane clipping interpolates UVs and does not discard the visible part of a textured triangle',()=>{
 const vertex=(x,y,z,u,v)=>({p:new T.Vector3(x,y,z),uv:new T.Vector2(u,v)}),out=clipTexturedPolygon([vertex(-1,0,-1,0,0),vertex(1,0,-1,1,0),vertex(0,1,0,.5,1)],.1);
 assert.equal(out.length,4);assert(out.every(v=>v.p.z<=-.099999));assert(out.every(v=>Number.isFinite(v.uv.x)&&Number.isFinite(v.uv.y)));assert(out.some(v=>Math.abs(v.uv.y-.9)<1e-8));
});
test('Software rendering never fills mapped additive faces white, and skips invisible hit regions',()=>{
 const calls=[],ctx=new Proxy({createPattern:()=>({}),fill:()=>calls.push('fill'),fillRect:()=>calls.push('texture'),save(){},restore(){}},{get:(t,k)=>t[k]??(()=>{})});
 const renderer=Object.assign(Object.create(SoftwareRenderer.prototype),{ctx,width:200,height:200,autoClear:false,dataImages:new WeakMap()});
 const texture=new T.Texture({width:2,height:2});const material=nativeMaterial(texture,32),g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-1,-1,-1,1,-1,-1,0,1,0],3));g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,1],2));const scene=new T.Scene(),mesh=new T.Mesh(g,material);scene.add(mesh);renderer.render(scene,new T.PerspectiveCamera(75,1,.1,10));assert(calls.includes('texture'));assert(!calls.includes('fill'));
 calls.length=0;mesh.material.visible=false;renderer.render(scene,new T.PerspectiveCamera(75,1,.1,10));assert.equal(calls.length,0);
 assert(nativeMaterial(texture,4).isMeshBasicMaterial);
});
test('Every gameplay weapon resolves an actual model; unavailable procedural skin choices are removed',()=>{
 for(const id of ['classic','shorty','frenzy','ghost','sheriff','stinger','spectre','bucky','judge','bulldog','guardian','phantom','vandal','marshal','outlaw','operator','ares','odin','knife']){
  const s=importedSelection(id,{skin:'chaos',knife:'blade',nativeDefaults:false});assert(s&&IMPORTED_WEAPONS[s.key].weapon===id,id);assert(skinItems(id).every(s=>s.key==='standard'||IMPORTED_WEAPONS[s.key]));
 }
 assert.equal(equippedSkin('vandal',{skin:'chaos'}),'standard');
});
