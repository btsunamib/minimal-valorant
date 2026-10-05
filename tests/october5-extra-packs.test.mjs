import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';import {createHash} from 'node:crypto';import {parseHTML} from 'linkedom';
import {OCTOBER5_EXTRA_IMPORTS,OCTOBER5_EXTRA_FEEDBACK,MOBILE2_UI,MOBILE2_VOICES} from '../dist/october5-extra-catalog.js';
import {GoldSrcModel} from '../dist/goldsrc-model.js';import {IMPORTED_WEAPONS,sequenceFor,importedSelection,createImportedWeapon} from '../dist/imported-weapons.js';
import {skinItems,equipCollection,skinThumbnail} from '../dist/collection.js';import {weaponAssetURL} from '../dist/weapon-assets.js';
import {killFeedbackStyle} from '../dist/default-feedback.js';import {setupNativeUI,setNativeButtonLabel,NativeVoice,NativeFeedback} from '../dist/native-ui.js';
import * as T from '../dist/three.module.js';import {prepareNativeShowroom,showNativeShowroom,restoreNativeViewmodel} from '../dist/native-showroom.js';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
test('Four new resource packs retain exact native bytes and record every transformation',()=>{
 const ledger=JSON.parse(read('docs/october5-extra-resource-sources.json'));assert.equal(Object.keys(ledger.archives).length,4);assert.equal(Object.keys(OCTOBER5_EXTRA_IMPORTS).length,6);assert.equal(ledger.actions.length,65);
 for(const f of ledger.files){const b=read(f.output);assert.equal(sha(b),f.outputSHA256,f.output);if(f.gzip)assert.equal(sha(gunzipSync(b)),f.sourceSHA256);}
 assert(ledger.actions.every(a=>a.status==='unverified'),'No source-video fidelity claim');assert(ledger.actions.some(a=>a.weapon==='nimingvandal'&&a.missingAudio.length));
});
test('All seven new model variants equip in their real slots and preserve every native animation frame',()=>{
 let frames=0;
 for(const [key,s]of Object.entries(OCTOBER5_EXTRA_IMPORTS)){
  assert(skinItems(s.weapon).some(i=>i.key===key));assert.deepEqual(IMPORTED_WEAPONS[key],s);
  for(const variant of Object.keys(s.variants)){
   const folder=`dist/assets/imported/${key}/${variant}`,b=gunzipSync(read(folder+'/model.mdl.gz')),p=new GoldSrcModel(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));
   for(const action of s.weapon==='knife'?['draw','inspect','slash1','slash2','stab']:['draw','reload','shoot','inspect'])assert(p.sequences[sequenceFor(p.sequences,action)].name.toLowerCase().startsWith(action));
   for(const seq of p.sequences)for(let f=0;f<seq.frames;f++){assert(p.pose(seq.index,f).every(Number.isFinite),key+'/'+seq.name+'/'+f);frames++;}
   const prefs={importedVariants:{}};equipCollection(s.weapon,{skin:key,knife:key,importedVariants:{[key]:variant}},prefs);assert.deepEqual(importedSelection(s.weapon,prefs),{key,variant});
   assert(fs.existsSync(new URL('../dist/'+skinThumbnail(s.weapon,key,variant),import.meta.url)));assert.equal(weaponAssetURL('./'+folder.slice(5)+'/model.mdl.gz'),'./'+folder.slice(5)+'/model.mdl.gz');
  }
 }
 assert(frames>3000);assert.equal(OCTOBER5_EXTRA_IMPORTS.nimingvandal.hasPackageAudio,false);
});
test('Gaia collection shows the complete weapon without parked reload parts or off-camera action effects',()=>{
 for(const key of ['gaiavandal','gaiaghost','gaiaaxe']){
  const b=gunzipSync(read(`dist/assets/imported/${key}/base/model.mdl.gz`)),p=new GoldSrcModel(b.buffer.slice(b.byteOffset,b.byteOffset+b.length)),r=p.instantiate();r.sample(sequenceFor(p.sequences,'idle'),0);
  const original=r.meshes.map(m=>Array.from(m.geometry.index.array)),pose=r.bones.map(b=>[...b.position.toArray(),...b.quaternion.toArray()]);
  prepareNativeShowroom(r,key==='gaiaaxe');showNativeShowroom(r);const box=new T.Box3(),point=new T.Vector3();let vertices=0,mainMagazine=0;
  for(const m of r.meshes.filter(m=>m.visible))for(const i of new Set(m.geometry.index.array)){
   const bone=p.bones[m.geometry.attributes.skinIndex.getX(i)].name;assert(!/^Magazine_Extra$|^Ashen_(?:VFX|Spline|Trail|Mag_|Blade_|Handle_)/i.test(bone));
   if(bone==='Magazine_Main')mainMagazine++;m.getVertexPosition(i,point).applyMatrix4(m.matrixWorld);box.expandByPoint(point);vertices++;
  }
  assert(vertices>1000,key+' retains complete model');assert(box.getSize(new T.Vector3()).length()<6,key+' collection frames the weapon itself');if(key!=='gaiaaxe')assert(mainMagazine>0);
  restoreNativeViewmodel(r);assert.deepEqual(r.meshes.map(m=>Array.from(m.geometry.index.array)),original);assert.deepEqual(r.bones.map(b=>[...b.position.toArray(),...b.quaternion.toArray()]),pose);r.dispose();
 }
});
test('Gaia native event banks resolve to supplied files; five Champion cues remain different original WAVs',()=>{
 for(const [key,s]of Object.entries(OCTOBER5_EXTRA_IMPORTS))if(key.startsWith('gaia'))for(const variant of Object.keys(s.variants)){
  const bank=JSON.parse(read(`dist/assets/imported/${key}/${variant}/sequences.json`));
  assert(bank.some(seq=>seq.events.some(e=>e.sound)),key+' real animation audio');
  for(const seq of bank)for(const event of seq.events)if(event.sound)assert(fs.existsSync(new URL('../dist/'+s.soundBase.replace('./','')+'/'+event.sound,import.meta.url)));
 }
 const pack=OCTOBER5_EXTRA_FEEDBACK.champions21;assert.equal(pack.sounds.length,5);assert.equal(new Set(pack.sounds.map(p=>sha(read('dist/'+p)))).size,5);
 for(const file of pack.sounds)assert.equal(read('dist/'+file).subarray(0,4).toString(),'RIFF');
 assert.deepEqual(killFeedbackStyle('champions21vandal',{weapons:IMPORTED_WEAPONS}),{type:'native',family:'champions21'});
 for(let n=1;n<=5;n++)assert(pack.images.some(p=>p.endsWith('/kill/'+n+'.png')));
});
test('Both Gaia Guardian ports fire their own supplied original shot sample',async()=>{
 const previous=globalThis.fetch,played=[];
 globalThis.fetch=async url=>{const file=String(url).split('/dist/').at(-1).replace(/^\.\//,'');return new Response(read('dist/'+file),{headers:{'content-type':file.endsWith('.json')?'application/json':'application/octet-stream'}});};
 const ctx={decodeAudioData:async b=>({duration:10,sha:sha(Buffer.from(b))}),createBufferSource(){return {playbackRate:{value:1},connect(){},disconnect(){},stop(){},start(){played.push(this.buffer.sha);}};},createGain:()=>({gain:{value:0},connect(){},disconnect(){}})};
 const s=OCTOBER5_EXTRA_IMPORTS.gaiaguardian;assert.notEqual(s.variantShots.base,s.variantShots.sg550);
 try{for(const variant of ['base','sg550']){
  const art=createImportedWeapon({key:'gaiaguardian',variant},{audio:()=>ctx,volume:()=>1});
  try{await Promise.all([art.readyPromise,art.metadataPromise]);assert(art.ready&&art.nativeGunShot);played.length=0;art.shoot();await new Promise(setImmediate);assert.deepEqual(played,[sha(read('dist/'+s.soundBase.slice(2)+'/'+s.variantShots[variant]))]);}finally{art.dispose();}
 }}finally{globalThis.fetch=previous;}
});
test('Mobile glyphs and labels survive repeated HUD changes without replacing interactive buttons',()=>{
 const {document}=parseHTML(read('dist/index.html').toString());setupNativeUI(document);
 for(const id of ['touchInspect','touchPlant','touchPrimary','touchPistol','touchReload','touchJump','touchCrouch']){
  const el=document.getElementById(id),icon=el.querySelector('.native-touch-icon');assert(icon);assert(icon.src.includes('/mobile2/'));
  for(let i=0;i<20;i++)setNativeButtonLabel(el,'交互 '+i);
  assert.equal(el.querySelector('.native-touch-icon'),icon);assert.equal(el.querySelector('.native-touch-label').textContent,'交互 19');assert.equal(el.querySelectorAll('.native-touch-icon').length,1);
 }
 for(const file of Object.values(MOBILE2_UI))assert(fs.existsSync(new URL('../dist/'+file,import.meta.url)));
 assert(document.getElementById('joystick').style.backgroundImage.includes('joy_bg.webp'));
});
test('Agent speech respects volume and cancellation while keeping the original recordings',async()=>{
 const previous=globalThis.fetch;let resolve,started=0;
 try{
  globalThis.fetch=async url=>new Response(read('dist/'+String(url).replace('./','')));
  const ctx={decodeAudioData:()=>new Promise(r=>resolve=r),createBufferSource:()=>({connect(){},disconnect(){},stop(){},start(){started++;}}),createGain:()=>({gain:{value:0},connect(){},disconnect(){}}),destination:{}};
  const voice=new NativeVoice(()=>ctx,()=>.5),pending=voice.play('wushu');await new Promise(r=>setImmediate(r));voice.stop();resolve({duration:2});await pending;assert.equal(started,0);
  await voice.play('wushu');assert.equal(started,1);voice.stop();
  const muted=new NativeVoice(()=>ctx,()=>0);await muted.play('wushu');assert.equal(started,1);
  assert.equal(Object.keys(MOBILE2_VOICES).length,9);
 }finally{globalThis.fetch=previous;}
});
test('Champion banner switches every count and headshot layer and cleans up on interruption',async()=>{
 const previous=globalThis.document;const {document}=parseHTML('<div id="crest"></div>');globalThis.document=document;
 try{const badge=new NativeFeedback(document.getElementById('crest'),()=>null,()=>1);
  for(let n=1;n<=5;n++){await badge.play('champions21',n,n%2===0);assert(badge.el.querySelector('[data-native-layer="kill"]').src.endsWith('/kill/'+n+'.png'));assert(badge.el.querySelector('[data-native-layer="icons"]').src.endsWith('/'+(n%2===0?'headshot':'skull')+'.png'));badge.update(.5);}
  badge.hide();assert(badge.el.classList.contains('hidden'));assert(!badge.container.classList.contains('native-pack-kill'));
 }finally{globalThis.document=previous;}
});
