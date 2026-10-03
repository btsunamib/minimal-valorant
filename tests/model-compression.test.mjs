import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {decodeGoldSrcAsset,GoldSrcModel} from '../dist/goldsrc-model.js';
import {createHash} from 'node:crypto';
test('All 46 VCT/recon GZIPs restore original model bytes with browser-native and older-browser decoders',async()=>{
 const ledger=JSON.parse(fs.readFileSync(new URL('../docs/collection-import-sources.json',import.meta.url))).runtimeCompression;assert.equal(ledger.length,46);assert.equal(ledger.filter(r=>r.original.includes('/vctclassic/')).length,44);
 for(const row of ledger){const original=fs.readFileSync(new URL('../'+row.original,import.meta.url)),packed=fs.readFileSync(new URL('../'+row.runtime,import.meta.url)),buffer=packed.buffer.slice(packed.byteOffset,packed.byteOffset+packed.byteLength);assert.equal(createHash('sha256').update(original).digest('hex'),row.rawSHA256);
  for(const useNative of [true,false]){const decoded=await decodeGoldSrcAsset(buffer,{useNative});assert(Buffer.from(decoded).equals(original),row.variant+' / '+useNative);const model=new GoldSrcModel(decoded);assert(model.sequences.length>0);assert(model.pose(0,0).every(Number.isFinite));}
 }
 // Fetch may have already decoded a server's Content-Encoding header.
 const raw=fs.readFileSync(new URL('../source-assets/vctclassic/base/model.mdl',import.meta.url)),buffer=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength);assert.equal(await decodeGoldSrcAsset(buffer),buffer);
});
