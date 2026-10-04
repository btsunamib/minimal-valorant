// Export real deformed buffers for independent OpenGL culling/depth validation.
// This tests raster state, not the browser's Three shader compilation.
import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import * as T from '../dist/three.module.js';
import {GoldSrcModel} from '../dist/goldsrc-model.js';
import {preloadAgentModels,createAgentModel,NATIVE_AGENT_IDS} from '../dist/agent-art.js';
import {AGENTS} from '../dist/agents-data.js';import {addEnemyOutline} from '../dist/combat-presentation.js';
const read=path=>{const b=gunzipSync(fs.readFileSync('dist/'+path.replace(/^\.\//,'')));return new GoldSrcModel(b.buffer.slice(b.byteOffset,b.byteOffset+b.length));};
await preloadAgentModels({loader:async path=>read(path)});
const result=[];
for(const id of NATIVE_AGENT_IDS){
 const art=createAgentModel(AGENTS.find(a=>a.id===id),{team:1,armed:false});
 art.update({shooting:true,dt:.1});const outline=addEnemyOutline(art.model);art.model.updateMatrixWorld(true);
 const textures=art.rig.meshes.map(m=>({width:m.material.map.image.width,height:m.material.map.image.height,rgba:Buffer.from(m.material.map.image.data).toString('base64')}));
 for(const angle of [0,Math.PI/2,Math.PI]){
  const camera=new T.PerspectiveCamera(38,384/512,.01,30);camera.position.set(Math.sin(angle)*3.8,1.1,Math.cos(angle)*3.8);camera.lookAt(0,.95,0);camera.updateMatrixWorld(true);
  const objects=[...art.rig.meshes,...outline.shells],point=new T.Vector3();
  const meshes=objects.map((m,i)=>{const matrix=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(m.matrixWorld),vertices=[];
   for(let j=0;j<m.geometry.attributes.position.count;j++){m.getVertexPosition(j,point);const v=new T.Vector4(point.x,point.y,point.z,1).applyMatrix4(matrix);vertices.push(v.x,v.y,v.z,v.w);}
   return {vertices,uv:Array.from(m.geometry.attributes.uv.array),triangles:Array.from(m.geometry.index.array),outline:i>=art.rig.meshes.length,texture:i%art.rig.meshes.length,stencilWrite:m.material.stencilWrite,stencilRef:m.material.stencilRef,stencilFunc:m.material.stencilFunc,stencilWriteMask:m.material.stencilWriteMask,stencilZPass:m.material.stencilZPass};
  });
  result.push({id,angle,meshes,textures});
 }
 outline.dispose();art.dispose();
}
fs.writeFileSync(process.argv[2],JSON.stringify(result));
