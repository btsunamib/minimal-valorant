import * as T from './three.module.js';
// World-space, depth-tested cosmetic feedback. Never changes damage or hitboxes.
export function createHitBurst({head=false,armor=false,melee=false,color=0xffd15e,seed=1}={}){
 const model=new T.Group(),mats=[],geos=[],bits=[],n=head?18:armor?12:8;
 const material=(c)=>{const m=new T.MeshBasicMaterial({color:c,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});mats.push(m);return m};
 const warm=material(head?0xfff0b2:color),white=material(0xffffff),shield=material(armor?0x87e9ff:color);
 const shard=new T.OctahedronGeometry(1,0),streak=new T.CylinderGeometry(.006,.002,1,4);geos.push(shard,streak);
 let rng=seed|0;const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)|0;return(rng>>>0)/4294967296};
 for(let i=0;i<n;i++){const a=random()*Math.PI*2,z=random()*2-1,r=Math.sqrt(1-z*z),dir=new T.Vector3(Math.cos(a)*r,z,Math.sin(a)*r);const o=new T.Mesh(i%3?streak:shard,i%3===0?shield:i%2?white:warm);model.add(o);o.raycast=()=>{};bits.push({o,dir,speed:.7+random()*2.2,size:.018+random()*.025,spin:random()*6});}
 const ringGeo=new T.RingGeometry(.07,.082,24);geos.push(ringGeo);const ring=new T.Mesh(ringGeo,white);ring.material.side=T.DoubleSide;ring.raycast=()=>{};model.add(ring);
 const duration=head?.42:.30;
 function update(seconds,quaternion){const t=Math.max(0,seconds),f=Math.min(1,t/duration),fade=(1-f)**2;model.visible=t<duration;if(quaternion)ring.quaternion.copy(quaternion);ring.scale.setScalar((head?1.5:1)*(.35+f*3));for(const m of mats)m.opacity=fade;bits.forEach(({o,dir,speed,size,spin},i)=>{o.position.copy(dir).multiplyScalar(t*speed);o.position.y-=t*t*2;if(i%3){o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir);o.scale.set(1,(head?.14:.09)*(1-f),1)}else{o.scale.setScalar(size*(1-f));o.rotation.set(t*spin,t*spin*.6,0);}});}
 update(0);return{model,duration,update,dispose(){geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());}};
}
export class HitEffects{
 constructor(scene){this.scene=scene;this.active=[];this.seed=1;this.last=new WeakMap();}
 hit(entity,point,opts,now){if(entity){const last=this.last.get(entity);if(last!==undefined&&now-last<.045)return false;this.last.set(entity,now);}while(this.active.length>=20)this.remove(0);const burst=createHitBurst({...opts,seed:this.seed++});burst.model.position.copy(point);this.scene.add(burst.model);this.active.push({burst,age:0});return true;}
 update(dt,camera){for(let i=this.active.length-1;i>=0;i--){const e=this.active[i];e.age+=dt;e.burst.update(e.age,camera.quaternion);if(e.age>=e.burst.duration)this.remove(i);}}
 remove(i){const e=this.active.splice(i,1)[0];e.burst.model.removeFromParent();e.burst.dispose();}
 clear(){while(this.active.length)this.remove(0);this.last=new WeakMap();}
}
