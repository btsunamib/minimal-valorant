import * as T from './three.module.js';
import {AgentRuntime} from './agent-runtime.js?v=20261005-lighting2';
import {getAgent} from './agents-data.js?v=20261005-lighting2';
import {utilityArt,decorateField} from './ability-effects.js?v=20261005-lighting2';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export class TacticalAbilities extends AgentRuntime {
 reset(e,points=e.kit?.points||0){super.reset(e,points);e.kit.healPool=100;e.kit.healSpent=false;e.kit.signatureKills=0;}
 available(e,i){const k=e.kit,a=getAgent(e.agent);return !!(k&&a.skills[i]&&e.alive&&this.api.phase()==='live'&&!this.has(e,'suppress')&&(i===3?k.points>=a.ultimateCost:(k.charges[i]>0||e.agent==='guide'&&i===0&&k.healSpent&&k.healPool>0)&&k.cooldowns[i]<=0));}
 ground(pos,e){return this.api.floor?.(pos.x,pos.z,pos.floor??pos.y??e.floor??0,pos.floor===undefined&&pos.y!==undefined?pos.y+.1:Infinity)??pos.floor??e.floor??0;}
 origin(e){const c=e.kit?.control;return c?c.mesh.position.clone():V(e.x,e.y??(e.floor||0)+1.65,e.z);}
 aim(e){return this.api.aim?.(e)?.clone().normalize()||this.direction(e);}
 make(e,kind,pos,options={}){const o=super.make(e,kind,pos,options);o.floor=this.ground(pos,e);o.mesh.position.y+=o.floor;return o;}
 field(e,kind,pos,life,radius,extra={}){const o=this.make(e,kind,pos,{life,radius,...extra});decorateField(o);return o;}
 smoke(e,pos,radius=2.5,life=2.5){const mesh=new T.Mesh(new T.SphereGeometry(radius,32,20),new T.MeshBasicMaterial({color:e.agent==='sarge'?0xb49980:0xbddae6,transparent:true,opacity:.97,side:T.DoubleSide}));mesh.position.set(pos.x,pos.y??this.ground(pos,e)+radius*.6,pos.z);this.api.scene.add(mesh);this.api.smokes.push({mesh,life,radius});this.api.particles(mesh.position,this.color(e),24,1,.4);}
 projectile(e,kind,{speed=15,gravity=13,bounces=0,life=8,alt=false,onLand,steer=false}={}){const p=this.origin(e),dir=this.aim(e),mesh=utilityArt(kind,this.color(e));p.addScaledVector(dir,.45);mesh.position.copy(p);this.api.scene.add(mesh);const o={owner:e,kind:'projectile',payload:kind,mesh,x:p.x,z:p.z,life,age:0,velocity:dir.multiplyScalar(alt?speed*.5:speed),gravity,bounces,onLand,steer};this.objects.push(o);return o;}
 effect(e,kind,pos,life=1){return this.field(e,'visual',pos,life,kind==='shock'?3.5:1);}
 expend(e,i,count=1){if(i===3)e.kit.points=0;else{e.kit.charges[i]=Math.max(0,e.kit.charges[i]-count);e.kit.cooldowns[i]=getAgent(e.agent).skills[i].cooldown||0;}this.api.sound?.(getAgent(e.agent).skills[i].kind);}
 aimedActor(e,{dead=false,range=20,self=false}={}){if(self)return e.hp<100?e:null;const origin=this.origin(e),aim=this.aim(e);return this.api.actors().filter(a=>a!==e&&a.team===e.team&&a.alive!==dead&&(dead||a.hp<100)).map(a=>({a,v:V(a.x,(a.floor||0)+.9,a.z).sub(origin)})).filter(({a,v})=>v.length()<range&&v.dot(aim)>0&&Math.hypot(origin.x+aim.x*v.dot(aim)-a.x,origin.z+aim.z*v.dot(aim)-a.z)<.55&&origin.y+aim.y*v.dot(aim)>(a.floor||0)-.1&&origin.y+aim.y*v.dot(aim)<(a.floor||0)+1.85&&this.api.los(origin,V(a.x,(a.floor||0)+.9,a.z))).sort((a,b)=>b.v.clone().normalize().dot(aim)-a.v.clone().normalize().dot(aim))[0]?.a;}
 reuse(e,i){const kind=getAgent(e.agent).skills[i]?.kind,k=e.kit;if(!k||!e.alive||this.api.phase()!=='live')return false;
  if(k.control&&kind===(k.control.kind==='drone'?'drone':'hound')){this.stopControl(e);return true;}
  if(kind==='dash'&&k.dashReady&&this.t>=k.dashArmAt){const dir=e===this.api.player?this.api.moveDirection():this.direction(e);k.motion={dir,speed:30,left:.25};k.dashReady=0;this.mark(e,'disarm',.75);this.api.particles(this.origin(e),0xe5ffff,24,2,.3);return true;}
  if(kind==='satchel'){const satchels=this.objects.filter(o=>o.owner===e&&o.kind==='satchel');if(satchels.length){this.detonateSatchel(satchels[0]);return true;}}
  if(e.agent==='guide'&&kind==='flash'){const bird=this.objects.find(o=>o.owner===e&&o.payload==='hawk');if(bird){this.flash(e,bird.mesh.position,Math.min(2.25,.8+bird.age*.7),true);this.remove(bird);return true;}}
  return false;
 }
 cast(e,i,options={}){if(typeof options==='boolean')options={alt:options};if(this.reuse(e,i))return true;if(!this.available(e,i))return false;
  const s=getAgent(e.agent).skills[i],kind=s.kind,k=e.kit,pos=options.pos||this.target(e,kind==='wall'?5:kind==='orbital'||e.agent==='sarge'&&kind==='smoke'?55:18),dir=this.aim(e);
  if(kind==='heal'){const target=this.aimedActor(e,{self:options.alt});if(!target){this.message(e,options.alt?'生命值已满':'请瞄准受伤队友，右键治疗自己');return false;}this.expend(e,i);target.kit.healing={remaining:options.alt?30:100,rate:options.alt?3:20,until:this.t+(options.alt?10:5)};return true;}
  if(kind==='revive'){const target=this.aimedActor(e,{dead:true,range:12});if(!target){this.message(e,'请瞄准附近阵亡队友');return false;}this.expend(e,i);const o=this.field(e,'revive',target,3,1);o.target=target;this.api.particles(V(target.x,this.ground(target,e)+1,target.z),0x9affdb,32,1,2);return true;}
  if(kind==='teamheal'){this.startHeal(e);return true;}
  if(e.agent==='sarge'&&kind==='smoke'){const points=options.points?.length?options.points:[pos];const valid=points.filter(p=>distance(p,e)<=55).slice(0,k.charges[i]);if(!valid.length)return false;this.expend(e,i,valid.length);for(const p of valid){const o=this.field(e,'smokeDrop',p,20.5,2.8,{delay:1});o.duration=19.25;}return true;}
  this.expend(e,i);this.message(e,s.name);
  switch(kind){
   case 'smoke':this.projectile(e,'cloud',{speed:25,gravity:0,life:.8,steer:true,onLand:p=>this.smoke(e,p,2.5,2.5)});break;
   case 'updraft':e.vy=11;this.mark(e,'disarm',.55);this.api.particles(this.origin(e),0xe6ffff,24,2,.6);break;
   case 'dash':k.dashReady=this.t+7.5;k.dashArmAt=this.t+.75;break;
   case 'knives':k.ultimate={kind,ammo:5,left:Infinity,next:0,equipped:true};break;
   case 'wall':{const rotation=(e.yaw??e.mesh?.rotation.y??0)+(options.rotation||0),axis=V(Math.cos(rotation),0,-Math.sin(rotation));for(let n=0;n<4;n++){const p={x:pos.x+axis.x*(n-1.5)*1.5,z:pos.z+axis.z*(n-1.5)*1.5};const o=this.make(e,'wall',p,{life:40,hp:400,solid:true,w:1.5,d:.8,height:2.5});decorateField(o);o.rotation=rotation;o.mesh.rotation.y=rotation;o.fortifyAt=this.t+3;o.mesh.material.color.setHex(0x73ead2);for(const actor of this.api.actors()){if(actor.alive&&distance(actor,p)<.9){actor.floor=o.floor+2.5;actor.y=actor.floor+1.65;actor.vy=.01;if(actor.mesh)actor.mesh.position.y=actor.floor;}}}break;}
   case 'slow':this.projectile(e,'slow',{speed:13,onLand:p=>this.field(e,'slow',p,7,4.5)});break;
   case 'shock':case 'reveal':this.projectile(e,kind,{speed:14+(options.charge||0)*38,gravity:7,bounces:options.bounces||0,onLand:p=>{if(kind==='shock')this.explosion(e,p,3.5,75,true);else{const o=this.field(e,'reveal',p,5.6,29,{hp:20,delay:1.4});o.mesh.position.y=p.y??o.floor+.3;o.pulses=0;o.tick=1.4;}}});break;
   case 'drone':case 'hound':{const mesh=utilityArt(kind,this.color(e)),p=this.origin(e).addScaledVector(dir,1);if(kind==='hound')p.y=this.ground(e,e)+.4;mesh.position.copy(p);this.api.scene.add(mesh);const o={owner:e,kind,mesh,x:p.x,z:p.z,life:kind==='drone'?7:6,age:0,hp:kind==='drone'?100:80,next:0,yaw:e.yaw||0,pitch:e.pitch||0};mesh.traverse(m=>{if(m.isMesh){m.userData.utility=o;this.api.wallMeshes.push(m);}});this.objects.push(o);k.control=o;break;}
   case 'beam':k.ultimate={kind,ammo:3,left:6.5,next:0,equipped:true};break;
   case 'firewall':{const o={owner:e,kind:'firePath',mesh:new T.Group(),x:e.x,z:e.z,life:.6,age:0,next:0,dir:dir.clone(),segments:[]};this.api.scene.add(o.mesh);this.objects.push(o);break;}
   case 'molly':this.projectile(e,'fireball',{speed:e.agent==='sarge'?20:14,gravity:14,bounces:e.agent==='sarge'?2:0,life:e.agent==='phoenix'?1.2:6,onLand:p=>this.field(e,'molly',p,e.agent==='sarge'?7:4,3.5)});break;
   case 'flash':if(e.agent==='guide')this.projectile(e,'hawk',{speed:7,gravity:0,life:2,steer:true,onLand:p=>this.flash(e,p,2.25,true)});else this.projectile(e,'curve',{speed:7,gravity:0,life:.55,onLand:p=>this.flash(e,p,1.5),alt:false}).curve=options.alt?1:-1;break;
   case 'rebirth':k.ultimate={kind,left:10,x:e.x,z:e.z,floor:e.floor||0,yaw:e.yaw||0,pitch:e.pitch||0,armor:e.armor};this.field(e,'anchor',e,10,.6);break;
   case 'bot':{const mesh=utilityArt('bot',0xf3bb53),p={x:e.x+dir.x*.8,z:e.z+dir.z*.8};mesh.position.set(p.x,this.ground(p,e)+.25,p.z);this.api.scene.add(mesh);const o={owner:e,kind,mesh,...p,life:5,age:0,hp:100,dir:this.direction(e),tick:0};mesh.traverse(m=>{if(m.isMesh){m.userData.utility=o;this.api.wallMeshes.push(m);}});this.objects.push(o);break;}
   case 'satchel':this.projectile(e,'satchel',{speed:8,gravity:14,onLand:p=>{const o=this.field(e,'satchel',p,8,.35,{hp:20});const art=utilityArt('satchel');o.mesh.material.opacity=0;o.mesh.add(art);}});break;
   case 'grenade':this.projectile(e,'grenade',{speed:16,gravity:13,alt:options.alt,bounces:1,life:1.6,onLand:p=>{this.explosion(e,p,5,55);for(let j=0;j<4;j++){const a=j*Math.PI/2+Math.PI/4,q={x:p.x+Math.cos(a)*2,z:p.z+Math.sin(a)*2,y:p.y,floor:p.y};const o=this.field(e,'cluster',q,.8,3);o.explodeAt=.55;}}});break;
   case 'rocket':k.ultimate={kind,ammo:1,left:10,next:0,equipped:true};break;
   case 'seekers':{const targets=this.enemies(e).sort((a,b)=>distance(a,e)-distance(b,e)).slice(0,3);for(let j=0;j<targets.length;j++){const mesh=utilityArt('seeker',0xa7efa2),p={x:e.x+dir.x+j*.3,z:e.z+dir.z};mesh.position.set(p.x,this.ground(p,e)+.4,p.z);this.api.scene.add(mesh);const o={owner:e,kind:'seeker',mesh,...p,life:15,age:0,hp:150,target:targets[j],dir:this.direction(e)};mesh.traverse(m=>{if(m.isMesh){m.userData.utility=o;this.api.wallMeshes.push(m);}});this.objects.push(o);}break;}
   case 'stim':this.projectile(e,'stim',{speed:6,gravity:15,onLand:p=>this.field(e,'stim',p,12,4)});break;
   case 'orbital':this.field(e,'orbital',pos,5,4.5,{delay:2});break;
   default:throw Error('Missing agent ability '+e.agent+'/'+kind);
  }return true;
 }
 blocks(x,z,r,floor=0){return this.objects.some(o=>{if(!o.solid||floor>=o.floor+2.45||floor+1.6<o.floor)return false;const dx=x-o.x,dz=z-o.z,a=o.rotation||0;return Math.abs(dx*Math.cos(a)-dz*Math.sin(a))<o.w/2+r&&Math.abs(dx*Math.sin(a)+dz*Math.cos(a))<o.d/2+r;});}
 platformFloor(x,z,currentFloor,nativeFloor){let floor=nativeFloor;for(const o of this.objects){if(o.kind!=='wall')continue;const dx=x-o.x,dz=z-o.z,a=o.rotation||0;if(Math.abs(dx*Math.cos(a)-dz*Math.sin(a))<=o.w/2+.05&&Math.abs(dx*Math.sin(a)+dz*Math.cos(a))<=o.d/2+.05&&currentFloor>=o.floor+2.3)floor=Math.max(floor,o.floor+2.5);}return floor;}

 remove(o){if(o.owner?.kit?.control===o)o.owner.kit.control=null;const descendants=new Set();o.mesh.traverse(m=>descendants.add(m));for(let i=this.api.wallMeshes.length-1;i>=0;i--)if(descendants.has(this.api.wallMeshes[i]))this.api.wallMeshes.splice(i,1);super.remove(o);}
 stopControl(e){const o=e.kit?.control;if(o)this.remove(o);}
 stopHeal(e){if(e.kit)e.kit.channelHeal=false;}
 startHeal(e){if((e.kit?.healPool||0)>0)e.kit.channelHeal=true;}
 controlMove(e,input,dt){const o=e.kit?.control;if(!o)return false;o.yaw=e.yaw||0;o.pitch=e.pitch||0;const f=input.forward||0,s=input.side||0;const dx=(-Math.sin(o.yaw)*f+Math.cos(o.yaw)*s)*4*dt,dz=(-Math.cos(o.yaw)*f-Math.sin(o.yaw)*s)*4*dt;const from=o.mesh.position.clone(),to=from.clone().add(V(dx,o.kind==='drone'?(input.vertical||0)*3*dt:0,dz));if(!this.api.trace?.(from,to,o)){o.x=to.x;o.z=to.z;o.mesh.position.copy(to);if(o.kind==='hound')o.mesh.position.y=this.ground({...o,floor:from.y-.4},e)+.4;}o.mesh.rotation.y=o.yaw;return true;}
 controlFire(e){const o=e.kit?.control;if(!o||this.t<o.next)return;o.next=this.t+5;if(o.kind==='drone'){const origin=o.mesh.position.clone(),dir=this.aim(e);const target=this.enemies(e).find(a=>{const v=V(a.x,(a.floor||0)+1.1,a.z).sub(origin);return v.length()<35&&v.dot(dir)>0&&v.clone().addScaledVector(dir,-v.dot(dir)).length()<.5&&this.api.los(origin,V(a.x,(a.floor||0)+1,a.z));});this.api.tracer(origin,origin.clone().addScaledVector(dir,35),0x88d8ff);if(target)this.mark(target,'revealed',3);}else{const dir=this.aim(e);const p=o.mesh.position.clone().addScaledVector(dir,3);const target=this.enemies(e).find(a=>distance(a,p)<1.2);if(target)this.api.damage(target,30,e);this.area(e,p,3.5,a=>this.mark(a,'stun',4),true);this.api.particles(p,0xafffa2,30,2,.7);this.remove(o);}}
 area(e,pos,radius,fn,los=false){const floor=pos.floor??this.ground(pos,e),origin=V(pos.x,pos.y??floor+1,pos.z);for(const a of this.enemies(e))if(distance(a,pos)<radius&&(!los||this.api.los(origin,V(a.x,(a.floor||0)+1,a.z))))fn(a);}
 explosion(e,pos,radius,maxDamage,los=true){this.api.particles(V(pos.x,pos.y??this.ground(pos,e)+.3,pos.z),e.agent==='hunter'?0x5dbdff:0xffb642,32,3,.7);for(const a of this.api.actors()){if(!a.alive||a===e&&e.agent==='clay'&&pos.satchel)continue;const d=Math.hypot(a.x-pos.x,a.z-pos.z,(a.floor||0)+.6-(pos.y??this.ground(pos,e)+.6));if(d>radius||los&&!this.api.los(V(pos.x,(pos.y??this.ground(pos,e))+.4,pos.z),V(a.x,(a.floor||0)+.9,a.z)))continue;this.api.damage(a,maxDamage*clamp(1-d/radius,.1,1)*(a.team===e.team&&a!==e?.33:1),e);}}
 detonateSatchel(o){const e=o.owner;for(const a of this.api.actors())if(a.alive&&distance(a,o)<4){const dir=V(a.x-o.x,0,a.z-o.z);if(dir.length()<.1)dir.copy(this.direction(a));dir.normalize();a.kit.motion={dir,speed:Math.max(6,18-distance(a,o)*3),left:.25};a.vy=Math.max(a.vy||0,9-distance(a,o));}this.explosion(e,{...o,y:o.floor+.2,satchel:true},3,50);this.remove(o);}
 flash(e,pos,duration,confirm=false){let found=false;for(const a of this.api.actors()){if(!a.alive)continue;const eye=V(a.x,a.y??(a.floor||0)+1.65,a.z),v=V(pos.x,pos.y??this.ground(pos,e)+1,pos.z).sub(eye),d=v.length();if(d>20||!this.api.los(eye,eye.clone().add(v)))continue;const facing=this.aim(a).dot(v.normalize());const time=(facing>.2?duration:.35)*clamp(1-d/40,.3,1);this.mark(a,'flash',time);if(a.team!==e.team)found=true;}if(confirm&&found)this.message(e,'闪光命中');this.api.particles(V(pos.x,pos.y??1.5,pos.z),0xfff4cf,30,3,.3);}
 preventDeath(e){const u=e.kit?.ultimate;if(u?.kind!=='rebirth')return false;e.x=u.x;e.z=u.z;e.floor=u.floor;e.y=u.floor+1.65;e.yaw=u.yaw;e.pitch=u.pitch;e.vy=0;e.hp=100;e.armor=Math.min(e.armor,u.armor);e.kit.ultimate=null;this.mark(e,'disarm',1);if(e.mesh)e.mesh.position.set(e.x,e.floor,e.z);this.api.particles(this.origin(e),0xffa83b,30,2,1);return true;}
 onKill(killer,victim){victim.deathAt=this.t;if(killer===victim||killer.team===victim.team)return;const k=killer.kit;if(!k)return;k.points=Math.min(getAgent(killer.agent).ultimateCost,k.points+1);const u=k.ultimate;if(u?.kind==='knives'&&!u.volley)u.ammo=5;const s=getAgent(killer.agent).skills[2];if(['dash','grenade','flash'].includes(s.kind)&&killer.agent!=='guide'){k.signatureKills++;if(k.signatureKills>=2){k.charges[2]=Math.min(s.charges,k.charges[2]+1);k.signatureKills=0;}}}
 fire(e,alt=false){const u=e.kit?.ultimate;if(!u||u.equipped===false||!['knives','beam','rocket'].includes(u.kind))return false;if(this.t<u.next)return true;const kind=u.kind;u.next=this.t+(kind==='knives'?.18:1);const count=kind==='knives'&&alt?u.ammo:1;u.ammo-=count;u.volley=kind==='knives'&&alt;
  if(kind==='rocket'){e.kit.motion={dir:this.aim(e).multiplyScalar(-1),speed:3,left:.2};this.projectile(e,'rocket',{speed:35,gravity:0,life:4,onLand:p=>this.explosion(e,p,6,150)});e.kit.ultimate=null;}
  else if(kind==='beam'){u.pending={left:.75,dir:this.aim(e),origin:this.origin(e)};}
  else this.api.skillShot(e,kind,{count,alt});if(!u.ammo&&kind!=='beam')e.kit.ultimate=null;return true;}
 tick(dt){this.t+=dt;
  for(const e of this.api.actors()){const k=e.kit;if(!k)continue;const a=getAgent(e.agent);for(let i=0;i<3;i++)if(k.cooldowns[i]>0){k.cooldowns[i]=Math.max(0,k.cooldowns[i]-dt);if(k.cooldowns[i]===0&&a.skills[i].cooldown)k.charges[i]=a.skills[i].charges;}
   if(k.dashReady&&this.t>=k.dashReady)k.dashReady=0;
   if(k.motion){const m=k.motion,t=Math.min(dt,m.left);this.api.move(e,m.dir.x*m.speed*t,m.dir.z*m.speed*t);m.left-=dt;if(m.left<=0)k.motion=null;}
   if(k.healing&&e.alive){const h=k.healing;if(this.t<=h.until&&(this.t-(e.lastDamageAt??-100))>1){const n=Math.min(h.remaining,h.rate*dt,100-e.hp);e.hp+=n;h.remaining-=n;}if(this.t>h.until||h.remaining<=0)k.healing=null;}
   if(k.channelHeal&&e.alive){const allies=this.api.actors().filter(x=>x!==e&&x.alive&&x.team===e.team&&x.hp<100&&distance(x,e)<18&&this.api.los(this.origin(e),V(x.x,(x.floor||0)+1,x.z)));if(allies.length){if(!k.healSpent){this.expend(e,0);k.healSpent=true;}const n=Math.min(k.healPool,20*dt);k.healPool-=n;allies.forEach(x=>x.hp=Math.min(100,x.hp+n));}if(k.healPool<=0)k.channelHeal=false;}
   const u=k.ultimate;if(u){u.left-=dt;if(u.pending){u.pending.left-=dt;if(u.pending.left<=0){this.api.skillShot(e,'beam',u.pending);u.pending=null;if(u.ammo<=0)k.ultimate=null;}}if(u.left<=0){if(u.kind==='rebirth')this.preventDeath(e);else k.ultimate=null;}}
  }
  for(const o of [...this.objects]){if(!this.objects.includes(o))continue;o.life-=dt;o.age+=dt;
   if(o.kind==='projectile'){this.tickProjectile(o,dt);continue;}
   if(o.life<=0){if(o.kind==='satchel')this.detonateSatchel(o);else this.remove(o);continue;}
   if(['drone','hound'].includes(o.kind)){if(!o.owner.alive)this.remove(o);continue;}
   if(o.kind==='wall'){if(o.fortifyAt&&this.t>=o.fortifyAt){o.hp+=400;o.fortifyAt=null;}continue;}
   if(o.kind==='revive'){if(o.age>=2&&!o.fired){o.fired=true;const a=o.target;if(!a.alive){a.alive=true;a.hp=100;a.armor=0;this.mark(a,'disarm',1);this.api.revived(a);if(a.mesh)a.mesh.visible=true;}}continue;}
   if(o.kind==='smokeDrop'){if(o.age>=o.delay&&!o.fired){o.fired=true;this.smoke(o.owner,{x:o.x,z:o.z,floor:o.floor},2.8,o.duration);this.remove(o);}continue;}
   if(o.kind==='firePath'){if(o.age>=(o.next||0)){o.next=o.age+.04;o.dir.lerp(this.aim(o.owner),.25).normalize();const p={x:o.x+o.dir.x*1.2,z:o.z+o.dir.z*1.2,floor:o.owner.floor};if(!this.api.blocked(o.owner,p.x,p.z,.1)){o.x=p.x;o.z=p.z;const w=this.field(o.owner,'firewall',p,8,.7,{solid:false,w:1.2,d:.25,height:2.8});w.blocksSight=true;this.api.wallMeshes.push(w.mesh);}else o.life=0;}continue;}
   if(o.kind==='bot'||o.kind==='seeker'){this.tickChaser(o,dt);continue;}
   if(o.kind==='cluster'){if(o.age>=o.explodeAt&&!o.fired){o.fired=true;this.explosion(o.owner,{...o,y:o.floor+.3},3,55);}continue;}
   if(o.kind==='reveal'){o.tick-=dt;if(o.tick<=0&&o.pulses<3){o.tick=1.6;o.pulses++;this.area(o.owner,o,o.radius,a=>this.mark(a,'revealed',.9),true);this.api.particles(o.mesh.position,0x79cfff,14,2,.4);}continue;}
   if(o.kind==='orbital')o.mesh.traverse(m=>{if(m.userData.orbitalBeam)m.visible=o.age>=o.delay;});if(o.age<o.delay)continue;
   for(const a of this.api.actors()){if(!a.alive||distance(a,o)>o.radius||Math.abs((a.floor||0)-o.floor)>2)continue;
    if(o.kind==='slow')this.mark(a,'slow',.3);
    if(o.kind==='stim'&&a.team===o.owner.team){this.mark(a,'stim',1);this.mark(a,'speed',1);}
    if(['molly','firewall','orbital'].includes(o.kind)){if(a===o.owner&&a.agent==='phoenix')a.hp=Math.min(100,a.hp+dt*12.5);else if(this.api.los(V(o.x,o.floor+.3,o.z),V(a.x,(a.floor||0)+.7,a.z))||o.kind==='orbital')this.api.damage(a,dt*(o.kind==='orbital'?120:o.kind==='firewall'?30:o.owner.agent==='sarge'?60:60)*(a.team===o.owner.team?.33:1),o.owner);}
   }
   o.mesh.traverse(m=>{if(m.userData.flame)m.scale.y=.7+Math.sin(o.age*8+m.position.x*3)*.3;});
  }
 }
 tickProjectile(o,dt){const e=o.owner;if(o.steer&&this.api.guiding?.(e,o.payload)){const desired=this.aim(e).multiplyScalar(o.velocity.length());o.velocity.lerp(desired,Math.min(1,dt*8));}if(o.curve){const q=new T.Quaternion().setFromAxisAngle(V(0,1,0),o.curve*dt*4);o.velocity.applyQuaternion(q);}const steps=Math.max(1,Math.ceil(o.velocity.length()*dt/.25));let landed=false;
  for(let i=0;i<steps&&!landed;i++){const from=o.mesh.position.clone();o.velocity.y-=o.gravity*dt/steps;const to=from.clone().addScaledVector(o.velocity,dt/steps),hit=this.api.trace?.(from,to,o);const actorHit=o.payload==='rocket'&&this.api.actors().some(a=>a.alive&&a!==e&&V(a.x,(a.floor||0)+.85,a.z).distanceTo(to)<.8);const ground=this.ground({x:to.x,z:to.z,y:to.y},e);if(hit||actorHit||to.y<=ground+.08){const p=hit?.point?.clone()||(actorHit?to:V(to.x,ground+.09,to.z));if(o.bounces>0){o.bounces--;const n=hit?.normal||V(0,1,0);o.velocity.reflect(n).multiplyScalar(o.payload==='fireball'?.6:.8);o.mesh.position.copy(p).addScaledVector(n,.08);}else{o.mesh.position.copy(p);landed=true;}}else o.mesh.position.copy(to);}
  o.x=o.mesh.position.x;o.z=o.mesh.position.z;if(o.velocity.length()>.01)o.mesh.quaternion.setFromUnitVectors(V(0,0,-1),o.velocity.clone().normalize());if(landed||o.life<=0){o.onLand?.(o.mesh.position.clone());this.remove(o);}
 }
 tickChaser(o,dt){const e=o.owner;let target=o.target;if(!target?.alive){const d=o.dir;target=this.enemies(e).filter(a=>{const v=V(a.x-o.x,0,a.z-o.z);return v.length()<12&&v.normalize().dot(d)>.6&&this.api.los(o.mesh.position,V(a.x,(a.floor||0)+.8,a.z));}).sort((a,b)=>distance(a,o)-distance(b,o))[0];}if(target){o.target=target;o.dir=V(target.x-o.x,0,target.z-o.z).normalize();if(distance(target,o)<1){if(o.kind==='bot'){o.fuse=(o.fuse??.25)-dt;if(o.fuse<=0){this.explosion(e,{...o,y:o.mesh.position.y},3,80);this.remove(o);}}else{this.mark(target,'blind',3);this.remove(o);}return;}}
  const speed=target?5:3,from=o.mesh.position.clone(),to=from.clone().addScaledVector(o.dir,dt*speed),hit=this.api.trace?.(from,to,o);if(hit){o.dir.reflect(hit.normal||V(1,0,0));o.target=null;}else{o.x=to.x;o.z=to.z;o.mesh.position.copy(to);o.mesh.position.y=this.ground({x:o.x,z:o.z,floor:from.y-.25},e)+.25;}o.mesh.rotation.y=Math.atan2(-o.dir.x,-o.dir.z);
 }
}
