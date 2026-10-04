import * as T from './three.module.js';
export const RELOAD_RATE=1.3;
export const reloadRemaining=(sourceDuration,realSeconds)=>Math.max(0,sourceDuration-Math.max(0,realSeconds)*RELOAD_RATE);
export const reloadResumeClock=(now,total,remaining)=>now-(total-remaining)/RELOAD_RATE*1000;
// Expanded back faces follow each animated body part. Normal depth test means
// the silhouette cannot reveal enemies through map geometry; no new hitboxes.
export function addEnemyOutline(model){
 // A stencil mask keeps the expanded shell strictly outside the visible body,
 // including hair/cloth with inconsistent source normals or overlapping parts.
 const material=new T.MeshBasicMaterial({color:0xffe52b,side:T.BackSide,depthTest:true,depthWrite:false,toneMapped:false,stencilWrite:true,stencilRef:1,stencilFunc:T.NotEqualStencilFunc,stencilWriteMask:0});
 const originals=[];model.traverse(o=>{if(o.isSkinnedMesh&&o.userData.nativeAgent&&!o.userData.nativeEffect&&o.material.visible!==false&&o.material.opacity!==0)originals.push(o)});
 const masks=new Map();for(const o of originals){const m=o.material;if(!masks.has(m))masks.set(m,{stencilWrite:m.stencilWrite,stencilRef:m.stencilRef,stencilFunc:m.stencilFunc,stencilZPass:m.stencilZPass});m.stencilWrite=true;m.stencilRef=1;m.stencilFunc=T.AlwaysStencilFunc;m.stencilZPass=T.ReplaceStencilOp;}
 const shells=originals.map(o=>{const geometry=o.geometry.clone(),p=geometry.attributes.position,n=geometry.attributes.normal;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+n.getX(i)*.55,p.getY(i)+n.getY(i)*.55,p.getZ(i)+n.getZ(i)*.55);const shell=new T.SkinnedMesh(geometry,material);shell.name='enemy-yellow-outline';shell.userData.outlineBody=o;shell.bind(o.skeleton,o.bindMatrix);shell.position.copy(o.position);shell.quaternion.copy(o.quaternion);shell.scale.copy(o.scale);shell.frustumCulled=false;shell.raycast=()=>{};shell.castShadow=false;shell.receiveShadow=false;shell.renderOrder=2;o.parent.add(shell);return shell});
 return{shells,material,dispose(){for(const s of shells){s.removeFromParent();s.geometry.dispose();}for(const [m,previous]of masks)Object.assign(m,previous);material.dispose()}};
}
