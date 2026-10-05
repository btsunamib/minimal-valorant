import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';import {createHash} from 'node:crypto';
import {OCTOBER6_IMPORTS,OCTOBER6_FEEDBACK} from '../dist/october6-catalog.js';
import {GoldSrcModel} from '../dist/goldsrc-model.js';import {IMPORTED_WEAPONS,sequenceFor,importedSelection,createImportedWeapon} from '../dist/imported-weapons.js';
import {skinItems,equipCollection,skinThumbnail} from '../dist/collection.js';import {weaponAssetURL} from '../dist/weapon-assets.js';import {killFeedbackStyle} from '../dist/default-feedback.js';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
test('Three October 6 archives keep all original models/audio and explicitly unverified source-video actions',()=>{
 const ledger=JSON.parse(read('docs/october6-resource-sources.json'));assert.equal(Object.keys(ledger.archives).length,3);assert.equal(ledger.actions.length,54);
 for(const f of ledger.files){const b=read(f.output);assert.equal(sha(b),f.outputSHA256,f.output);if(f.gzip)assert.equal(sha(gunzipSync(b)),f.sourceSHA256);}
 assert(ledger.actions.every(a=>a.status==='unverified'));assert(ledger.actions.some(a=>a.weapon==='primekarambit'&&a.missingAudio.length));
});
test('Five new weapons equip in compatible slots and every supplied animation frame has a finite source pose',()=>{
 let frames=0;
 for(const [key,s]of Object.entries(OCTOBER6_IMPORTS)){
  assert.deepEqual(IMPORTED_WEAPONS[key],s);assert(skinItems(s.weapon).some(i=>i.key===key));
  const folder=`assets/imported/${key}/base`,b=gunzipSync(read('dist/'+folder+'/model.mdl.gz')),p=new GoldSrcModel(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));
  for(const action of s.weapon==='knife'?['draw','inspect','slash1','slash2','stab']:['draw','reload','shoot','inspect'])assert(p.sequences[sequenceFor(p.sequences,action)].name.toLowerCase().startsWith(action));
  for(const seq of p.sequences)for(let f=0;f<seq.frames;f++){assert(p.pose(seq.index,f).every(Number.isFinite),key+'/'+seq.name+'/'+f);frames++;}
  const prefs={importedVariants:{}};equipCollection(s.weapon,{skin:key,knife:key,importedVariants:{[key]:'base'}},prefs);assert.deepEqual(importedSelection(s.weapon,prefs),{key,variant:'base'});
  assert(fs.existsSync(new URL('../dist/'+skinThumbnail(s.weapon,key),import.meta.url)));assert.equal(weaponAssetURL(folder+'/model.mdl.gz'),'./'+folder+'/model.mdl.gz');
  const bank=JSON.parse(read('dist/'+folder+'/sequences.json'));for(const seq of bank)for(const event of seq.events)if(event.sound)assert(fs.existsSync(new URL('../dist/'+s.soundBase.slice(2)+'/'+event.sound,import.meta.url)));
 }
 assert(frames>4000);assert.equal(OCTOBER6_IMPORTS.primekarambit.hasPackageAudio,false);assert(!OCTOBER6_IMPORTS.chaosnativevandal.shot);
});
test('Chaos and Mystbloom banners retain all count layers and the exact supplied kill recordings, without synthesized variations',()=>{
 for(const [family,pack]of Object.entries(OCTOBER6_FEEDBACK)){
  assert.equal(pack.sounds.length,5);for(const file of pack.sounds)assert.equal(read('dist/'+file).subarray(0,4).toString(),'RIFF');
  for(let n=1;n<=5;n++)assert(pack.images.some(p=>p.endsWith('/kill/'+n+'.png')));for(const file of pack.images)assert(fs.existsSync(new URL('../dist/'+file,import.meta.url)));
  assert.equal(new Set(pack.sounds.map(p=>sha(read('dist/'+p)))).size,5);
 }
 assert.deepEqual(killFeedbackStyle('chaosnativevandal',{weapons:IMPORTED_WEAPONS}),{type:'native',family:'chaosnative'});
 assert.deepEqual(killFeedbackStyle('mystbloomkunai',{weapons:IMPORTED_WEAPONS}),{type:'native',family:'mystbloom'});
 assert.deepEqual(killFeedbackStyle('mystbloomsheriff',{weapons:IMPORTED_WEAPONS}),{type:'native',family:'mystbloom'});
});
test('Both Mystbloom guns fire their own source sample; missing Chaos/Prime sounds never become broken downloads',async()=>{
 const previous=globalThis.fetch,played=[],requests=[];
 globalThis.fetch=async url=>{const file=String(url).split('/dist/').at(-1).replace(/^\.\//,'');requests.push(file);return new Response(read('dist/'+file));};
 const ctx={decodeAudioData:async b=>({duration:10,sha:sha(Buffer.from(b))}),createBufferSource(){return {playbackRate:{value:1},connect(){},disconnect(){},stop(){},start(){played.push(this.buffer.sha);}};},createGain:()=>({gain:{value:0},connect(){},disconnect(){}})};
 try{for(const key of ['mystbloomsheriff','mystbloomvandal','chaosnativevandal','primekarambit']){
  const s=OCTOBER6_IMPORTS[key],art=createImportedWeapon({key,variant:'base'},{audio:()=>ctx,volume:()=>1});
  try{await Promise.all([art.readyPromise,art.metadataPromise]);assert(art.ready);assert.equal(!!art.nativeGunShot,!!s.shot);played.length=0;art.shoot();await new Promise(setImmediate);if(s.shot)assert.deepEqual(played,[sha(read('dist/'+s.soundBase.slice(2)+'/'+s.shot))]);}finally{art.dispose();}
 }assert(!requests.some(p=>p.startsWith('assets/imported/primekarambit/sound/')));}finally{globalThis.fetch=previous;}
});
