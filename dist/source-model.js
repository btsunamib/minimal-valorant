import * as T from './three.module.js';
import {fetchWeaponAsset,weaponAssetURL} from './weapon-assets.js?v=20261005-lighting1';
import {decodeGoldSrcAsset} from './goldsrc-model.js?v=20261005-lighting1';
import {nativeMaterial} from './valorant-render.js?v=20261005-lighting1';
export async function loadSourceModel(url,{onProgress=()=>{}}={}){
 const raw=await fetchWeaponAsset(url,{onProgress}),plain=await decodeGoldSrcAsset(raw),d=JSON.parse(new TextDecoder().decode(plain));
 const textures=d.textures.map(tex=>{const bytes=Uint8Array.from(atob(tex.rgba),c=>c.charCodeAt(0));const t=new T.DataTexture(bytes,tex.width,tex.height,T.RGBAFormat);t.colorSpace=T.SRGBColorSpace;t.flipY=false;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;});
 return {buffer:plain,instantiate(){
  const model=new T.Group(),bones=d.bones.map(b=>{const o=new T.Bone();o.name=b.name;o.position.fromArray(b.position);o.quaternion.fromArray(b.quaternion);return o;});bones.forEach((b,i)=>(d.bones[i].parent<0?model:bones[d.bones[i].parent]).add(b));model.updateMatrixWorld(true);const skeleton=new T.Skeleton(bones);skeleton.calculateInverses();
  const materials=d.textures.map((t,i)=>nativeMaterial(textures[i],t.additive?32:t.alpha?16:0));
  const meshes=d.meshes.map(m=>{const g=new T.BufferGeometry();for(const [name,data,n]of [['position',m.positions,3],['normal',m.normals,3],['uv',m.uv,2],['skinWeight',m.weights,4]])g.setAttribute(name,new T.Float32BufferAttribute(data,n));g.setAttribute('skinIndex',new T.Uint16BufferAttribute(m.indices,4));g.setIndex(m.triangles);const mesh=new T.SkinnedMesh(g,materials[m.texture]);mesh.name=d.textures[m.texture].name;mesh.frustumCulled=false;mesh.userData.nativeIndices=m.triangles;mesh.userData.showroomIndices=[];for(let i=0;i<m.triangles.length;i+=3){const tri=m.triangles.slice(i,i+3);if(!tri.some(v=>m.indices.slice(v*4,v*4+4).some((b,k)=>bones[b].name==='b_mag'&&m.weights[v*4+k]>.2)))mesh.userData.showroomIndices.push(...tri);}mesh.userData.nativeHand=/^fp_bountyhunter_/i.test(mesh.name)||m.indices.filter((bi,i)=>i%4===0&&/hand|finger|thumb|arm/i.test(bones[bi]?.name||'')).length>m.positions.length/3*.75;mesh.userData.nativeEffect=d.textures[m.texture].additive||d.textures[m.texture].alpha;model.add(mesh);mesh.bind(skeleton,new T.Matrix4());return mesh;});
  model.quaternion.setFromRotationMatrix(new T.Matrix4().set(0,-1,0,0,0,0,1,0,-1,0,0,0,0,0,0,1));model.scale.setScalar(1/32);
  const sequences=d.sequences.map(s=>({...s,duration:(s.frames-1)/s.fps,events:s.events.map(e=>({...e,code:e.event}))}));const qa=new T.Quaternion(),qb=new T.Quaternion();
  function sample(index,frame){const s=d.sequences[index],f=Math.max(0,Math.min(s.frames-1,frame)),a=Math.floor(f),b=Math.min(s.frames-1,a+1),t=f-a;const pa=s.poses[a],pb=s.poses[b];bones.forEach((bone,i)=>{const o=i*7;bone.position.set(pa[o]+(pb[o]-pa[o])*t,pa[o+1]+(pb[o+1]-pa[o+1])*t,pa[o+2]+(pb[o+2]-pa[o+2])*t);qa.fromArray(pa,o+3);qb.fromArray(pb,o+3);bone.quaternion.copy(qa).slerp(qb,t);});model.updateMatrixWorld(true);skeleton.update();}
  sample(0,0);return{model,bones,meshes,skeleton,sequences,sample,attachments:[],dispose(){meshes.forEach(m=>m.geometry.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());skeleton.dispose();model.removeFromParent();}};
 }};
}
