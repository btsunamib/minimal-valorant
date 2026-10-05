import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../dist/three.module.js';
import {worldMaterial,nativeMaterial,configureSun,followSun} from '../dist/valorant-render.js';
test('map shadow materials retain baked colors and alpha while weapon palettes keep their original renderer',()=>{
 const tex=new T.DataTexture(new Uint8Array([40,160,88,255]),1,1),m=worldMaterial({map:tex,vertexColors:true,alphaTest:.5});assert.equal(m.map,tex);assert.equal(m.vertexColors,true);assert.equal(m.alphaTest,.5);assert.equal(m.toneMapped,false);assert(m.isMeshLambertMaterial);
 assert(nativeMaterial(tex,0).isMeshBasicMaterial);assert(nativeMaterial(tex,64,{world:true}).isMeshLambertMaterial);assert(nativeMaterial(tex,32,{world:true}).isMeshBasicMaterial);
});
test('shadow frustum follows faraway maps, stays stable within a texel, and quality transitions release old maps',()=>{
 const renderer={shadowMap:{}},sun=new T.DirectionalLight(),point=new T.Vector3(150,2,-70);const q=configureSun(renderer,sun,'high');assert(renderer.shadowMap.enabled);assert.equal(q.size,2048);followSun(sun,point);assert(sun.target.position.distanceTo(point)<.1);assert(Math.abs(sun.position.clone().sub(sun.target.position).length()-Math.hypot(28,55,12))<1e-8);
 const p=sun.target.position.clone();followSun(sun,p.clone().add(new T.Vector3(.0001,0,.0001)));assert(p.distanceTo(sun.target.position)<.001);
 let disposed=false;sun.shadow.map={dispose(){disposed=true}};configureSun(renderer,sun,'balanced');assert(disposed);assert.equal(sun.shadow.map,null);assert.equal(sun.shadow.mapSize.x,1024);configureSun(renderer,sun,'performance');assert.equal(renderer.shadowMap.enabled,false);assert.equal(sun.castShadow,false);
 configureSun({...renderer,software:true},sun,'high');assert.equal(renderer.shadowMap.enabled,false);
});
import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {isMapSeal} from '../dist/native-maps.js';
test('all six BSP maps identify cyan tool seals without removing water, glass or architecture',()=>{
 for(const key of ['ascent','breeze','sunset','pearl','lotus','fracture']){const d=JSON.parse(gunzipSync(fs.readFileSync(new URL('../dist/assets/maps/'+key+'/map.json.gz',import.meta.url))));assert(d.meshes.some(m=>isMapSeal(d.textures[m.texture])));assert(d.meshes.some(m=>!isMapSeal(d.textures[m.texture])));}
 for(const name of ['!waterblue','glassblue1','aa_aquawall0016'])assert.equal(isMapSeal({name}),false);
});
