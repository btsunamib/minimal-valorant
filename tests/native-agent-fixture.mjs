import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {GoldSrcModel} from '../dist/goldsrc-model.js';
import {preloadAgentModels} from '../dist/agent-art.js';
await preloadAgentModels({loader:async url=>{const b=gunzipSync(readFileSync(new URL('../dist/'+url.replace(/^\.\//,''),import.meta.url)));return new GoldSrcModel(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));}});
