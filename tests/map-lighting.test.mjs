import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import {gunzipSync} from 'node:zlib';import {createHash} from 'node:crypto';
import * as T from '../dist/three.module.js';
import {decodeMapLighting,materialHighlight} from '../dist/map-lighting.js';
import {MAP_LIGHTING} from '../dist/map-lighting-profiles.js';
import {worldMaterial,configureMapLighting,configureSun,followSun} from '../dist/valorant-render.js';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root)),sha=b=>createHash('sha256').update(b).digest('hex');

test('All six lighting bakes match their map geometry, preserve original light colors and stay within the mobile payload budget',()=>{
 const report=JSON.parse(read('docs/map-lighting-bake.json'));assert.equal(report.maps.length,6);assert.equal(sha(read('dist/map-lighting-profiles.js')),report.profileSHA256);
 for(const entry of report.maps){
  const mapBytes=read('dist/assets/maps/'+entry.map+'/map.json.gz'),d=JSON.parse(gunzipSync(mapBytes)),packed=read('dist/assets/maps/'+entry.map+'/lighting.bin.gz');
  assert.equal(sha(mapBytes),entry.sourceMapSHA256);assert.equal(sha(packed),entry.sha256);assert(packed.length<70000,entry.map+' compact baked lighting');
  const before=d.meshes.map(m=>m.colors.slice()),lights=decodeMapLighting(gunzipSync(packed),d.meshes);let ao=false,sky=false,sun=false;
  assert.equal(lights.length,d.meshes.length);
  for(let index=0;index<lights.length;index++){
   const values=lights[index];assert.equal(values.length,d.meshes[index].positions.length);
   for(let i=0;i<values.length;i+=3){assert(values[i]>=199&&values[i]<=255);ao||=values[i]<250;sky||=values[i+1]>127;sun||=values[i+2]>127;}
   assert.deepEqual(d.meshes[index].colors,before[index]);
  }
  assert(ao&&sky&&sun,entry.map+' has contact, open-sky and sunlit samples');
 }
});

test('The lighting decoder rejects stale geometry and truncated data before binding attributes',()=>{
 const bytes=gunzipSync(read('dist/assets/maps/ascent/lighting.bin.gz')),d=JSON.parse(gunzipSync(read('dist/assets/maps/ascent/map.json.gz')));
 assert.throws(()=>decodeMapLighting(bytes.subarray(0,-1),d.meshes));assert.throws(()=>decodeMapLighting(bytes,d.meshes.slice(1)));
 const corrupt=Buffer.from(bytes);corrupt[0]=0;assert.throws(()=>decodeMapLighting(corrupt,d.meshes));
});

test('Map profiles change the shared bounded lighting, fog and actual shadow direction together',()=>{
 const scene=new T.Scene(),sun=new T.DirectionalLight(),renderer={shadowMap:{}};configureSun(renderer,sun,'high');
 for(const key of Object.keys(MAP_LIGHTING)){
  const p=configureMapLighting(scene,sun,key);followSun(sun,new T.Vector3(120,4,-75));
  assert(sun.position.clone().sub(sun.target.position).distanceTo(new T.Vector3(...p.direction))<1e-8);
  assert.equal(scene.fog.near,p.near);assert.equal(scene.fog.far,p.far);
  assert(Math.hypot(...p.direction)>40);assert(p.sun.every(c=>c>.8&&c<1.2));assert(p.shade.every(c=>c>.7&&c<1.2));
 }
 configureMapLighting(scene,sun,'unknown');assert.equal(scene.fog.far,MAP_LIGHTING.training.far);
});

test('Only glossy map surfaces enable highlight math; baked samples are a separate shader variant and no texture pass is added',()=>{
 assert.equal(materialHighlight('brick_01'),0);assert(materialHighlight('glassblue1')>materialHighlight('metal_panel'));
 const matte=worldMaterial({staticLighting:true}),gloss=worldMaterial({highlight:materialHighlight('waterblue')});
 assert.equal(matte.defines.STATIC_MAP_LIGHTING,1);assert.equal(matte.defines.WORLD_HIGHLIGHT,undefined);assert.equal(gloss.defines.WORLD_HIGHLIGHT,1);
 const shader={uniforms:{},vertexShader:T.ShaderLib.lambert.vertexShader,fragmentShader:T.ShaderLib.lambert.fragmentShader};matte.onBeforeCompile(shader);
 assert(shader.vertexShader.includes('attribute vec3 staticLight'));assert(shader.fragmentShader.includes('clamp(vStaticLight.x,0.78,1.0)'));
 assert.equal(shader.fragmentShader.match(/texture(?:2D|Cube)?\s*\(/g),null,'No extra texture sample in the lighting extension');
});
