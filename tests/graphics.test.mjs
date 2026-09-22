import test from 'node:test';import assert from 'node:assert/strict';import * as T from '../dist/three.module.js';import{createWeaponArt}from'../dist/weapon-art.js';import{WEAPONS,SKINS,KNIVES}from'../dist/rules.js';import{batchStaticWorld}from'../dist/static-batch.js';
test('all weapon and knife skin combinations have finite renderable geometry and recoil',()=>{for(const[id,w]of Object.entries(WEAPONS)){assert.ok(Number.isFinite(w.recoil));for(const skin of Object.values(SKINS))for(const knife of(id==='knife'?Object.keys(KNIVES):['butterfly'])){const art=createWeaponArt(id,skin,knife,false);let count=0;art.model.updateMatrixWorld(true);art.model.traverse(o=>{if(!o.isMesh)return;count++;assert.ok(o.matrixWorld.elements.every(Number.isFinite));const a=o.geometry.attributes.position.array;assert.ok(a.every(Number.isFinite))});assert.ok(count>15,id);if(id==='knife')assert.ok(art.blade);else assert.ok(art.flash)}}});
test('static render batching preserves standalone collision raycasts',()=>{const scene=new T.Scene(),material=new T.MeshStandardMaterial(),walls=[];for(let i=0;i<3;i++){const m=new T.Mesh(new T.BoxGeometry(2,3,2),material);m.position.set(i*4,1.5,-5);scene.add(m);walls.push(m)}const ray=new T.Raycaster(new T.Vector3(0,1,0),new T.Vector3(0,0,-1));scene.updateMatrixWorld(true);const before=ray.intersectObjects(walls)[0].distance;const stats=batchStaticWorld(scene);assert.equal(stats.after,1);assert.equal(ray.intersectObjects(walls)[0].distance,before)});

test('Kuronami animation remains finite through equip, accelerated inspect, attacks and interruption',async()=>{
 const{createKuronami,KURONAMI_VARIANTS}=await import('../dist/kuronami.js');
 for(const variant of Object.keys(KURONAMI_VARIANTS)){
  const art=createKuronami(false,variant);const before=new T.Box3().setFromObject(art.model);
  assert.ok(before.getSize(new T.Vector3()).length()>1);
  const links=[];art.model.traverse(o=>{if(o.name.startsWith('Chain link'))links.push(o)});assert.equal(links.length,42);
  for(let i=0;i<360;i++){
   const time=i/60;art.update({dt:1/60,time,equip:Math.max(0,1-time),inspect:i>60&&i<240,speed:i<180?1:3,attack:i>=240?(i-240)%50/50:-1,heavy:i>=300,side:i%2});art.model.updateMatrixWorld(true);
   for(const link of links)assert.ok(link.matrixWorld.elements.every(Number.isFinite));
   art.model.traverse(o=>{if(o.isMesh){assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));assert.ok(o.matrixWorld.elements.every(Number.isFinite))}});
  }
  const ends=links.map(l=>l.position.clone());assert.ok(ends[0].distanceTo(ends.at(-1))<2);art.dispose();
 }
});
