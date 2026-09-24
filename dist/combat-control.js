const approach=(value,target,amount)=>value<target?Math.min(target,value+amount):Math.max(target,value-amount);
export class MovementAccuracy{
 constructor(){this.reset();}reset(){this.x=0;this.z=0;this.error=0;this.speed=0;}
 step(x,z,dt){const braking=x*this.x+z*this.z<0,accel=braking?68:Math.hypot(x,z)<.001?44:36;this.x=approach(this.x,x,accel*dt);this.z=approach(this.z,z,accel*dt);return{x:this.x*dt,z:this.z*dt};}
 observe(dx,dz,dt){this.speed=Math.hypot(dx,dz)/Math.max(dt,.001);const target=Math.min(1,this.speed/4.6);this.error=approach(this.error,target,dt*(target>this.error?12:7));if(Math.abs(dx)<.00001)this.x=0;if(Math.abs(dz)<.00001)this.z=0;}
}
export function shotSpread(w,{aim=false,motion=0,airborne=false,crouched=false,recoil=0}={}){if(w.en==='MELEE')return 0;const moving=Math.max(0,(motion-.12)/.88);const base=w.scope?(aim?.0003:w.spread):w.spread*(aim?.55:1)*(crouched?.8:1);return base+moving*moving*(w.scope?.10:.052)+(airborne?.07:0)+recoil*.04;}
export class ScopedRelease{
 constructor(){this.owner=null;}begin(id,now){if(this.owner!==null)return false;this.owner=id;this.started=now;return true;}
 release(id,now,cancel=false){if(this.owner!==id)return false;const fire=!cancel&&now-this.started>=120;this.owner=null;return fire;}cancel(){this.owner=null;}
}
export function spectatorTarget(actors,team,current,step=0){const alive=actors.filter(e=>e.alive&&e.team===team);if(!alive.length)return null;const index=alive.findIndex(e=>e.seed===current);return alive[index<0?0:(index+step+alive.length)%alive.length];}
