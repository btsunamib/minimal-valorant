import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import {gunzipSync} from 'node:zlib';import {createHash} from 'node:crypto';
import * as T from '../dist/three.module.js';import {GoldSrcModel} from '../dist/goldsrc-model.js';
import {nativeMaterial} from '../dist/valorant-render.js';
import {OCTOBER5_IMPORTS,OCTOBER5_FEEDBACK} from '../dist/october5-catalog.js';
import {createImportedWeapon,IMPORTED_WEAPONS,sequenceFor} from '../dist/imported-weapons.js';
import {skinItems,equipCollection,skinThumbnail} from '../dist/collection.js';
import {weaponAssetURL} from '../dist/weapon-assets.js';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
const parse=p=>{const b=gunzipSync(read(p));return new GoldSrcModel(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));};

test('The browser entry and every mutable app import share one cache version',()=>{
 const version='?v=20261005-lighting2',vendors=new Set(['./three.module.js','./fflate.module.js']);
 for(const filename of fs.readdirSync(new URL('../dist/',import.meta.url)).filter(f=>f.endsWith('.js')&&!['three.module.js','fflate.module.js'].includes(f))){
  const source=read('dist/'+filename).toString();for(const match of source.matchAll(/(['"])(\.\/[a-zA-Z0-9_.-]+\.js)(\?[^'"]*)?\1/g))if(!vendors.has(match[2]))assert.equal(match[3],version,filename+' -> '+match[2]);
 }
 const html=read('dist/index.html').toString();assert(html.includes('src="main.js'+version+'"'));assert(html.includes('href="collection.css'+version+'"'));
});

test('Opaque native palettes bypass PBR light saturation; additive and cutout maps retain their flags',()=>{
 const texture=new T.DataTexture(new Uint8Array([32,154,81,255]),1,1);
 for(const flags of [0,2,4,8,64]){const m=nativeMaterial(texture,flags);assert(m.isMeshBasicMaterial);assert.equal(m.map,texture);assert.equal(m.toneMapped,false);assert.equal(m.depthWrite,true);assert.equal(m.alphaTest,flags&64?.5:0);m.dispose();}
 const glow=nativeMaterial(texture,36);assert.equal(glow.blending,T.AdditiveBlending);assert.equal(glow.depthWrite,false);assert.equal(glow.map,texture);assert.equal(glow.side,T.FrontSide);
});
test('Native triangle commands face the same direction as the source normals after CCW conversion',()=>{
 for(const path of ['dist/assets/agent-models/wushu/ct.mdl.gz','dist/assets/agent-models/phoenix/ct.mdl.gz','dist/assets/agent-models/guide/ct.mdl.gz','dist/assets/imported/valstrikevandal/base/model.mdl.gz']){
  const p=parse(path);let correct=0,wrong=0;
  for(const m of p.geometry())for(let i=0;i<m.triangles.length;i+=3){const[x,y,z]=m.triangles.slice(i,i+3),a=new T.Vector3().fromArray(m.vertices,x*3),b=new T.Vector3().fromArray(m.vertices,y*3).sub(a),c=new T.Vector3().fromArray(m.vertices,z*3).sub(a),n=new T.Vector3().fromArray(m.normals,x*3),d=b.cross(c).dot(n);if(d>1e-5)correct++;else if(d< -1e-5)wrong++;}
  assert(correct/(correct+wrong)>.93,path); // Original cloth has a few inconsistent normals.
 }
});
test('Five uploads retain source hashes; nine valid variants equip in compatible slots with original action banks',()=>{
 const ledger=JSON.parse(read('docs/october5-resource-sources.json'));assert.equal(ledger.weaponFamilies,4);assert.equal(ledger.variants,9);
 for(const f of ledger.files){const packed=read(f.output);assert.equal(sha(packed),f.outputSHA256,f.output);if(f.gzip)assert.equal(sha(gunzipSync(packed)),f.sha256);}
 for(const [key,s]of Object.entries(OCTOBER5_IMPORTS)){
  assert.deepEqual(IMPORTED_WEAPONS[key],s);assert(skinItems(s.weapon).some(v=>v.key===key));
  for(const variant of Object.keys(s.variants)){
   const path=`dist/assets/imported/${key}/${variant}`,p=parse(path+'/model.mdl.gz');
   for(const action of s.weapon==='knife'?['draw','inspect','slash1','stab']:['draw','reload','shoot','inspect']){
    const seq=p.sequences[sequenceFor(p.sequences,action)];assert(seq.name.toLowerCase().startsWith(action),key+'/'+action);assert(p.pose(seq.index,seq.frames-1).every(Number.isFinite));
   }
   const prefs={importedVariants:{}};equipCollection(s.weapon,{skin:key,knife:key,importedVariants:{[key]:variant}},prefs);assert.equal(prefs.importedVariants[key],variant);
   assert(fs.existsSync(new URL('../dist/'+skinThumbnail(s.weapon,key,variant),import.meta.url)));
   assert.equal(weaponAssetURL(`./assets/imported/${key}/${variant}/model.mdl.gz`),`./assets/imported/${key}/${variant}/model.mdl.gz`);
  }
 }
 assert.equal(ledger.rejectedModels.length,4);assert.equal(new Set(ledger.rejectedModels.map(m=>m.sha256)).size,1);
 assert(ledger.rejectedModels.every(m=>m.internalName==='gign.mdl'));assert(!IMPORTED_WEAPONS.abyssalphantom);
 assert.equal(OCTOBER5_FEEDBACK.champions24phantom.sounds.length,5);
 for(let n=1;n<=5;n++)assert(OCTOBER5_FEEDBACK.champions24phantom.images.some(p=>p.endsWith(`/kill/${n}.png`)));
});
test('Champion audio cues match original backslash events and normalized metadata paths',async()=>{
 const previous=globalThis.fetch,started=[];
 try{
  globalThis.fetch=async url=>{
   const path=String(url).replace(/^\.\//,'');let b=read('dist/'+path);
   if(path.endsWith('/sequences.json')){const bank=JSON.parse(b);for(const s of bank)for(const e of s.events)e.options=e.options.replaceAll('\\','/');b=Buffer.from(JSON.stringify(bank));}
   return new Response(b);
  };
  const ctx={decodeAudioData:async b=>({duration:30,bytes:b.byteLength}),createBufferSource:()=>({connect(){},disconnect(){},stop(){},playbackRate:{value:1},start(){started.push(this.buffer.bytes);}}),createGain:()=>({gain:{value:1},connect(){},disconnect(){}}),destination:{}};
  const art=createImportedWeapon({key:'champions24phantom',variant:'base'},{audio:()=>ctx,volume:()=>1,forceReload:true});
  await Promise.all([art.readyPromise,art.metadataPromise]);assert(art.ready);art.action('draw',1,false);art.update(.1);
  await new Promise(resolve=>setImmediate(resolve));assert.equal(started.length,1,'Frame 1 draw cue plays despite slash normalization');art.dispose();
 }finally{globalThis.fetch=previous;}
});
