import test from 'node:test';
import assert from 'node:assert/strict';
import {NARU_CLIPS,NaruMotion,sampleNaru} from '../dist/narukami-motion.js';
import {createNarukami,NARU_VARIANTS} from '../dist/narukami.js';
import {createWeaponArt} from '../dist/weapon-art.js';
import {SKINS} from '../dist/rules.js';
const snapshot=art=>{art.model.updateMatrixWorld(true);const values=[];art.model.traverse(o=>{for(const v of o.matrixWorld.elements)assert.ok(Number.isFinite(v));values.push(o.visible,...o.matrixWorld.elements);});return values;};
test('Naru four clips can seek every 60 Hz frame; water and hands remain finite',()=>{const a=createWeaponArt('knife',SKINS.chaos,'narukami',false);assert.equal(a.model.name,'Kuronami Naru-Kami');for(const[clip,spec]of Object.entries(NARU_CLIPS)){for(let f=0;f<=spec.frames;f++){a.update({clip,seconds:f/60,time:f/60});snapshot(a);const p=sampleNaru({clip,seconds:f/60});assert.ok(p.water>=0&&p.water<=1);}const options={clip,seconds:.43,time:.43};a.update(options);const expected=snapshot(a);a.update({clip:'toLong',seconds:1.2,time:9});a.update(options);assert.deepEqual(snapshot(a),expected);}a.dispose();});
test('Transform commits only at the water event; interruption preserves visible form',()=>{const m=new NaruMotion();assert.equal(m.transform(),'toKunai');assert.equal(m.transform(),null);m.advance(.6);m.cancel();assert.equal(m.form,'long');m.transform();m.advance(1.2);m.cancel();assert.equal(m.form,'kunai');assert.equal(m.draw(),'drawKunai');m.advance(.71);assert.equal(m.clip,null);m.transform();m.advance(.4);m.cancel();assert.equal(m.form,'kunai');m.transform();m.advance(1.2);m.cancel();assert.equal(m.form,'long');assert.equal(m.draw(),'drawLong');m.advance(1.3);assert.equal(m.clip,null);});
test('All variants support independent long and short idle plus both attacks',()=>{for(const variant of Object.keys(NARU_VARIANTS)){const a=createNarukami(false,variant);for(const form of ['long','kunai']){a.update({form});assert.equal(a.model.userData.form,form);const idle=snapshot(a);a.update({form,attack:.4,heavy:true,side:1});snapshot(a);a.update({form});assert.deepEqual(snapshot(a),idle);}a.dispose();}});
test('Kunai catch, conversion and idle share the same closed grip without stale long-hand transforms',()=>{
 const art=createNarukami(false);
 const gripSnapshot=()=>{art.model.updateMatrixWorld(true);const values=[...art.blade.matrixWorld.elements];art.model.getObjectByName('naru-right-hand').parent.traverse(o=>values.push(...o.matrixWorld.elements));return values;};
 art.update({form:'kunai',time:0});const idle=gripSnapshot();
 for(const clip of ['drawKunai','toKunai']){
  art.update({clip:'toLong',seconds:1,time:0});
  art.update({clip,seconds:NARU_CLIPS[clip].frames/60,time:0});
  const end=gripSnapshot();assert.equal(end.length,idle.length);
  end.forEach((v,i)=>typeof v==='number'?assert.ok(Math.abs(v-idle[i])<1e-10):assert.equal(v,idle[i]));
 }
 art.update({form:'long'});const long=gripSnapshot();
 art.update({form:'kunai',attack:.5});art.update({form:'long'});assert.deepEqual(gripSnapshot(),long);
 assert.equal(sampleNaru({clip:'toLong',seconds:0}).kunaiGrip,1);
 assert.equal(sampleNaru({clip:'toLong',seconds:.3}).kunaiGrip,0);
 art.dispose();
});
