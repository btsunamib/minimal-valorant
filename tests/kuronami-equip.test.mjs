import test from 'node:test';
import assert from 'node:assert/strict';
import {createKuronami} from '../dist/kuronami.js';
import {sampleEquip,EQUIP_DURATION} from '../dist/kuronami-equip.js';
function snapshot(art){art.model.updateMatrixWorld(true);const result=[];art.model.traverse(o=>{if(o.visible&&o.isMesh)result.push(...o.matrixWorld.elements,...(o.geometry.attributes.position?.array||[]))});return result}
test('equip crosses hands before catch and finishes in the same held pose as idle',()=>{
 const crossed=sampleEquip(12/60),caught=sampleEquip(32/60);assert.ok(crossed.left[0]>crossed.right[0]);assert.equal(crossed.open,1);assert.equal(caught.catch,1);
 const art=createKuronami();art.update({equipSeconds:EQUIP_DURATION});const end=snapshot(art);art.update({});assert.deepEqual(snapshot(art),end);art.dispose();
});
test('seeking any 60 fps equip frame gives identical blade and ribbon geometry regardless of previous frame rate',()=>{
 const direct=createKuronami(),played=createKuronami();
 for(const fps of [30,60,120]){for(let i=0;i<fps;i++)played.update({dt:1/fps,time:i/fps,equipSeconds:Math.min(EQUIP_DURATION,i/fps)});for(const frame of [0,12,20,28,40,50]){
  played.update({equipSeconds:frame/60});direct.update({equipSeconds:frame/60});assert.deepEqual(snapshot(played),snapshot(direct));
 }}direct.dispose();played.dispose();
});
