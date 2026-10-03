import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {weaponAssetURL,fetchWeaponAsset,WEAPON_ASSET_COMMIT} from '../dist/weapon-assets.js';
import {decodeGoldSrcAsset,loadGoldSrc} from '../dist/goldsrc-model.js';
import {createImportedWeapon} from '../dist/imported-weapons.js';
const asset=path=>fs.readFileSync(new URL('../dist/assets/imported/'+path,import.meta.url));
const model=asset('xerofangknife/base/model.mdl');
const response=b=>new Response(b,{headers:{'content-length':String(b.length)}});

test('Models and sound event banks resolve to the pinned public GitHub tree without credentials',async()=>{
 const url=weaponAssetURL('./assets/imported/xerofangknife/base/model.mdl');
 assert.equal(url,`https://raw.githubusercontent.com/btsunamib/minimal-valorant/${WEAPON_ASSET_COMMIT}/dist/assets/imported/xerofangknife/base/model.mdl`);
 assert.equal(weaponAssetURL('./assets/ui/vandal.png'),'./assets/ui/vandal.png');
 const fetch=globalThis.fetch,requests=[],progress=[];
 try{globalThis.fetch=async(url,options)=>{requests.push({url,options});if(requests.length===1)throw Error('Temporary network failure');return response(model);};
  const b=await fetchWeaponAsset('./assets/imported/xerofangknife/base/model.mdl',{kind:'model',onProgress:p=>progress.push(p)});
  assert(Buffer.from(b).equals(model));assert.equal(requests.length,2);assert.equal(requests[1].options.cache,'reload');assert.equal(requests[0].options.credentials,'omit');assert(progress.some(p=>p.loaded===model.length&&p.total===model.length));
 }finally{globalThis.fetch=fetch;}
});
test('HTML, partial downloads and timeouts fail explicitly; a cancelled request never retries',async()=>{
 const fetch=globalThis.fetch;
 try{
  for(const body of [Buffer.from('<html>Sign in</html>'),model.subarray(0,200)]){let calls=0;globalThis.fetch=async()=>{calls++;return response(body);};await assert.rejects(fetchWeaponAsset('./assets/imported/bad/model.mdl',{kind:'model'}),/不是模型|不完整/);assert.equal(calls,2);}
  let calls=0;globalThis.fetch=async(url,{signal})=>{calls++;return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Timed out','AbortError')),{once:true}));};
  await assert.rejects(fetchWeaponAsset('./assets/imported/bad/model.mdl',{timeout:5}),/下载超时/);assert.equal(calls,2);
  const abort=new AbortController();abort.abort();calls=0;await assert.rejects(fetchWeaponAsset('./assets/imported/bad/model.mdl',{signal:abort.signal}),{name:'AbortError'});assert.equal(calls,0);
 }finally{globalThis.fetch=fetch;}
});
test('A WebView exposing a broken DecompressionStream still decodes the unchanged original model',async()=>{
 const original=globalThis.DecompressionStream;
 try{globalThis.DecompressionStream=class{constructor(){throw Error('Unsupported gzip');}};
  const packed=asset('vctclassic/edg/model.mdl.gz'),raw=fs.readFileSync(new URL('../source-assets/vctclassic/edg/model.mdl',import.meta.url));
  const buffer=packed.buffer.slice(packed.byteOffset,packed.byteOffset+packed.byteLength);assert(Buffer.from(await decodeGoldSrcAsset(buffer)).equals(raw));
 }finally{globalThis.DecompressionStream=original;}
});
test('Optional audio configuration failure cannot discard a valid animated model; failed model downloads can retry',async()=>{
 const fetch=globalThis.fetch;const requests=[],failures=[],progress=[];
 try{globalThis.fetch=async(url)=>{requests.push(url);return url.endsWith('/model.mdl')?response(model):new Response('missing',{status:503});};
  const art=createImportedWeapon({key:'xerofangknife',variant:'base'},{forceReload:true,onError:e=>failures.push(e),onProgress:p=>progress.push(p)});
  await Promise.all([art.readyPromise,art.metadataPromise]);assert.equal(art.ready,true);assert.equal(art.loadState,'ready');assert.equal(failures.length,0);assert.match(art.audioWarning,/503/);art.action('draw');art.update(.5);assert(art.timeline.frame>0);assert(progress.some(p=>p.phase==='instantiate'));assert(requests.every(url=>url.startsWith('https://raw.githubusercontent.com/')));art.dispose();
  globalThis.fetch=async()=>new Response('missing',{status:404});const broken=createImportedWeapon({key:'xerofangknife',variant:'base'},{forceReload:true});await Promise.all([broken.readyPromise,broken.metadataPromise]);assert.equal(broken.loadState,'failed');assert.equal(broken.ready,false);broken.dispose();
  globalThis.fetch=async(url)=>url.endsWith('/model.mdl')?response(model):response(Buffer.from('[]'));
  const retry=createImportedWeapon({key:'xerofangknife',variant:'base'},{forceReload:true});await retry.readyPromise;assert.equal(retry.ready,true);retry.dispose();
 }finally{globalThis.fetch=fetch;}
});
