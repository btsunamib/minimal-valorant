import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {collectionDraft,equipCollection,equippedSkin,skinItems,skinThumbnail} from '../dist/collection.js';
import {IMPORTED_WEAPONS,NativeTimeline,sequenceFor} from '../dist/imported-weapons.js';
import {GoldSrcModel} from '../dist/goldsrc-model.js';
import {prepareNativeShowroom,showNativeShowroom,restoreNativeViewmodel} from '../dist/native-showroom.js';
const load=key=>{const b=fs.readFileSync(new URL(`../dist/assets/imported/${key}/base/model.mdl`,import.meta.url));return new GoldSrcModel(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
test('Preview drafts never equip skins; confirmed gun skins persist independently and reject wrong gun families',()=>{
 const p={skin:'standard',knife:'kuronami',weaponSkins:{vandal:'chaos',phantom:'champions26',classic:'standard'},importedVariants:{kuronamivandal:'white'}};
 const d=collectionDraft('classic',p);d.skin='vctclassic';d.importedVariants.vctclassic='edg';assert.equal(equippedSkin('classic',p),'standard');assert.equal(p.importedVariants.vctclassic,undefined);
 equipCollection('classic',d,p);assert.equal(equippedSkin('classic',p),'vctclassic');assert.equal(equippedSkin('vandal',p),'chaos');assert.equal(equippedSkin('phantom',p),'champions26');assert.equal(p.importedVariants.vctclassic,'edg');
 const restored=JSON.parse(JSON.stringify(p));assert.equal(equippedSkin('classic',restored),'vctclassic');assert.equal(equippedSkin('operator',{skin:'xerofangvandal'}),'standard');
 const knife=collectionDraft('knife',p);knife.knife='igniteknife';assert.equal(p.knife,'kuronami');equipCollection('knife',knife,p);assert.equal(p.knife,'igniteknife');assert.equal(equippedSkin('classic',p),'vctclassic');
});
test('Collection filters compatible skins and exposes all 44 VCT capsule variants with real model thumbnails',()=>{
 assert.equal(skinItems('classic').filter(x=>x.key==='vctclassic').length,44);
 assert(skinItems('marshal').some(x=>x.key==='kuronamimarshal'));assert(!skinItems('marshal').some(x=>x.key==='xerofangvandal'));
 for(const [key,s]of Object.entries(IMPORTED_WEAPONS))for(const variant of Object.keys(s.variants))assert(fs.existsSync(new URL('../dist/'+skinThumbnail(s.weapon,key,variant),import.meta.url)),key+'/'+variant);
});
test('Zero-FPS source holds stay static yet allow exact forward/backward frame inspection',()=>{
 const p=load('ionsheriff'),seq=sequenceFor(p.sequences,'idle'),t=new NativeTimeline(p.sequences);assert.equal(t.sequences[seq].fps,0);t.play(seq);t.advance(30);assert.equal(t.frame,0);t.seek(100);assert.equal(t.frame,100);t.seek(2);assert.equal(t.frame,2);assert(p.pose(seq,100).every(Number.isFinite));
});
test('Showroom exclusions are reversible and never change any source action triangle or bone pose',()=>{
 for(const key of ['igniteknife','champions22knife','xerofangvandal','kuronamizipknife']){const p=load(key),r=p.instantiate(),indices=r.meshes.map(m=>Array.from(m.geometry.index.array));r.sample(sequenceFor(p.sequences,'idle'),0);assert(prepareNativeShowroom(r,key.includes('knife')).toArray().every(Number.isFinite));showNativeShowroom(r);assert(r.meshes.some(m=>m.visible&&m.geometry.index.count>0));restoreNativeViewmodel(r);assert.deepEqual(r.meshes.map(m=>Array.from(m.geometry.index.array)),indices);r.dispose();}
});
test('Both supplied kill banks keep five different original wave files',()=>{
 for(const [family,path]of [['kuronami','kuronami'],['xerofang','xero']]){const hashes=[];for(let n=1;n<=5;n++){const b=fs.readFileSync(new URL(`../dist/assets/imported/feedback/${family}/sound/${path}/${n}.wav`,import.meta.url));assert.equal(b.subarray(0,4).toString(),'RIFF');hashes.push(createHash('sha256').update(b).digest('hex'));}assert.equal(new Set(hashes).size,5);}
});
test('Native shell reload chains preserve time, insert order and cancellation across render rates',()=>{
 const p=load('originbucky'),start=p.sequences.find(s=>/^start_reload/.test(s.name)).index,insert=p.sequences.find(s=>/^insert_/.test(s.name)).index,end=p.sequences.find(s=>/^after_reload/.test(s.name)).index;
 for(const fps of [30,60,120,165,240]){const completed=[],t=new NativeTimeline(p.sequences,()=>{},s=>completed.push(s.index));t.play(start,{chain:[insert,insert,end],gameplay:true});for(let i=0;i<fps*4;i++)t.advance(1/fps);assert.deepEqual(completed,[start,insert,insert]);assert.equal(t.index,sequenceFor(p.sequences,'idle'));t.play(start,{chain:[insert,insert,end],gameplay:true});t.advance(.3);t.play(sequenceFor(p.sequences,'inspect'));t.advance(1);assert.equal(t.chain.length,0);assert.equal(completed.length,4);}
});
