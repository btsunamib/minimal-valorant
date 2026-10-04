import {gunzipSync} from 'node:zlib';
import {prepareNativeShowroom,showNativeShowroom} from '../dist/native-showroom.js';
// Offline renders of the actual imported meshes and embedded palette textures.
// No stock gun images, recolored duplicates, or generated weapon illustrations.
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import * as T from '../dist/three.module.js';
import {loadSourceModel} from '../dist/source-model.js';
import {GoldSrcModel} from '../dist/goldsrc-model.js';
import {IMPORTED_WEAPONS,sequenceFor} from '../dist/imported-weapons.js';
const only=process.argv[2];let count=0;
for(const [key,spec]of Object.entries(IMPORTED_WEAPONS)){
 if(only&&key!==only)continue;
 for(const variant of Object.keys(spec.variants)){
  const folder=`dist/assets/imported/${key}/${variant}`;if(spec.format==='source49')continue;const b=fs.existsSync(folder+'/model.mdl')?fs.readFileSync(folder+'/model.mdl'):gunzipSync(fs.readFileSync(folder+'/model.mdl.gz')),p=new GoldSrcModel(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)),rig=p.instantiate();
  rig.sample(sequenceFor(p.sequences,'idle'),0);
  const wrapper=new T.Group();wrapper.add(rig.model);wrapper.quaternion.copy(prepareNativeShowroom(rig,spec.weapon==='knife'));showNativeShowroom(rig);wrapper.updateMatrixWorld(true);
  const meshes=[],textures={},point=new T.Vector3();
  for(const m of rig.meshes){if(!m.visible)continue;const tex=p.textures.find(t=>t.name===m.name);if(!tex)continue;
   const remap=new Map(),vertices=[],uv=[],triangles=[];for(const i of m.userData.collectionIndices){if(!remap.has(i)){remap.set(i,vertices.length/3);m.getVertexPosition(i,point).applyMatrix4(m.matrixWorld);vertices.push(point.x,point.y,point.z);uv.push(m.geometry.attributes.uv.getX(i),m.geometry.attributes.uv.getY(i));}triangles.push(remap.get(i));}
   meshes.push({vertices,uv,triangles,texture:m.name,additive:!!(tex.flags&32),side:m.material.side});
   textures[m.name]={width:tex.width,height:tex.height,rgba:Buffer.from(tex.rgba).toString('base64')};
  }
  const result=spawnSync('python',['scripts/render-native-thumbnail.py',folder+'/thumb.webp'],{input:JSON.stringify({meshes,textures}),maxBuffer:1024*1024*20,encoding:'utf8'});
  if(result.status!==0)throw Error(result.stderr);rig.dispose();count++;
 }
 console.log('Rendered',key);
}
console.log('Actual model thumbnails:',count);
