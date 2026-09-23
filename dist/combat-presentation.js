import * as T from './three.module.js';
export const RELOAD_RATE=1.3;
export const reloadRemaining=(sourceDuration,realSeconds)=>Math.max(0,sourceDuration-Math.max(0,realSeconds)*RELOAD_RATE);
export const reloadResumeClock=(now,total,remaining)=>now-(total-remaining)/RELOAD_RATE*1000;
// Expanded back faces follow each animated body part. Normal depth test means
// the silhouette cannot reveal enemies through map geometry; no new hitboxes.
export function addEnemyOutline(model){
 const material=new T.MeshBasicMaterial({color:0xffe52b,side:T.BackSide,depthTest:true,depthWrite:false,toneMapped:false});
 const originals=[];model.traverse(o=>{if(o.isMesh&&o.material.visible!==false&&o.material.opacity!==0){const sizes=o.scale.toArray().sort((a,b)=>a-b);if(sizes[2]>=.15&&sizes[1]>=.075)originals.push(o)}});
 const shells=originals.map(o=>{const shell=new T.Mesh(o.geometry,material);shell.name='enemy-yellow-outline';shell.scale.setScalar(1.09);shell.raycast=()=>{};shell.castShadow=false;shell.receiveShadow=false;shell.renderOrder=2;o.add(shell);return shell});
 return{shells,material,dispose(){for(const s of shells)s.removeFromParent();material.dispose()}};
}
