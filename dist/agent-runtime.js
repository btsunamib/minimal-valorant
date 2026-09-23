import * as T from './three.module.js';
import {getAgent} from './agents-data.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
export class AgentRuntime{
 constructor(api){this.api=api;this.objects=[];this.t=0;this.duel=null;}
 reset(e,points=e.kit?.points||0){const a=getAgent(e.agent);e.kit={points,charges:a.skills.map(s=>s.charges),cooldowns:[0,0,0,0],anchor:null,souls:0,ultimate:null};e.status={};e.decayDebt=0;e.agent=a.id;}
 clear(){for(const o of [...this.objects])this.remove(o);this.duel=null;for(const e of this.api.actors())e.status={};}
 remove(o){this.api.scene.remove(o.mesh);const i=this.api.wallMeshes.indexOf(o.mesh);if(i>=0)this.api.wallMeshes.splice(i,1);o.mesh.traverse(m=>{m.geometry?.dispose();m.material?.dispose();});const j=this.objects.indexOf(o);if(j>=0)this.objects.splice(j,1);}
 color(e){return getAgent(e.agent).colors[2]}
 mark(e,key,duration,value=true){if(e.status?.immune>this.t&&['slow','stun','flash','blind','decay','suppress','vulnerable','disarm','root'].includes(key))return;e.status||={};e.status[key]=Math.max(e.status[key]||0,this.t+duration);if(value!==true)e.status[key+'Value']=value;}
 has(e,key){return (e.status?.[key]||0)>this.t}
 speed(e){return this.has(e,'root')?0:this.has(e,'stun')?.18:this.has(e,'slow')?.45:this.has(e,'speed')?1.55:1}
 canFire(e){return !this.has(e,'phase')&&!this.has(e,'stun')&&!this.has(e,'disarm')&&!this.has(e,'detain')}
 enemies(e){return this.api.actors().filter(x=>x.alive&&x.team!==e.team)}
 direction(e){return e===this.api.player?V(-Math.sin(e.yaw),0,-Math.cos(e.yaw)):V(-Math.sin(e.mesh.rotation.y),0,-Math.cos(e.mesh.rotation.y))}
 target(e,range=12){return this.api.target(e,range)}
 make(e,kind,pos,{life=8,radius=3,delay=0,hp=0,solid=false,w=0,d=0,height=.12}={}){
  if(this.objects.length>64)this.remove(this.objects[0]);
  const geometry=solid?new T.BoxGeometry(w,height,d):new T.CylinderGeometry(radius,radius,height,24,1);
  const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color:this.color(e),emissive:this.color(e),emissiveIntensity:.35,transparent:true,opacity:solid?.67:.36,roughness:.6,depthWrite:solid}));mesh.position.set(pos.x,height/2+.06,pos.z);this.api.scene.add(mesh);
  const o={owner:e,kind,x:pos.x,z:pos.z,mesh,life,radius,delay,hp,solid,w,d,tick:0,age:0};mesh.userData.utility=o;
  if(hp||solid)this.api.wallMeshes.push(mesh);this.objects.push(o);return o;
 }
 blocks(x,z,r){return this.objects.some(o=>o.solid&&Math.abs(o.x-x)<o.w/2+r&&Math.abs(o.z-z)<o.d/2+r)}
 hit(o,amount){if(o.hp>0){o.hp-=amount;if(o.hp<=0)this.remove(o);return true}return !!o.solid;}
 smoke(e,pos,radius=3,life=12,toxic=false){const mesh=new T.Mesh(new T.IcosahedronGeometry(radius,2),new T.MeshStandardMaterial({color:this.color(e),transparent:true,opacity:.93,roughness:1,flatShading:true}));mesh.position.set(pos.x,radius*.5,pos.z);this.api.scene.add(mesh);this.api.smokes.push({mesh,life,radius});if(toxic)this.make(e,'decay',pos,{radius,life});}
 wall(e,pos,{solid=true,life=12,hp=600,width=6,kind='wall'}={}){
  const dir=this.direction(e),horizontal=Math.abs(dir.z)>Math.abs(dir.x);let w=horizontal?width:.35,d=horizontal?.35:width;
  // Push construction away from occupied capsules, preventing entombing teammates.
  if(solid&&this.api.actors().some(a=>a.alive&&Math.abs(a.x-pos.x)<w/2+.5&&Math.abs(a.z-pos.z)<d/2+.5))pos={x:pos.x+dir.x*1.5,z:pos.z+dir.z*1.5};
  if(solid&&this.api.actors().some(a=>a.alive&&Math.abs(a.x-pos.x)<w/2+.5&&Math.abs(a.z-pos.z)<d/2+.5))return null;
  const o=this.make(e,kind,pos,{solid,w,d,height:2.8,life,hp,radius:width/2});if(!solid){o.mesh.material.opacity=.83;this.api.wallMeshes.push(o.mesh);o.blocksSight=true;}return o;
 }
 area(e,pos,radius,fn,los=false){for(const x of this.enemies(e))if(distance(x,pos)<radius&&(!los||this.api.los(V(pos.x,1.4,pos.z),V(x.x,x.y||1.6,x.z))))fn(x);}
 burst(e,pos,radius,damage,kind='blast',delay=.8){return this.make(e,kind,pos,{radius,life:delay+.65,delay, hp:0});}
 teleport(e,pos){if(this.api.blocked(e,pos.x,pos.z,.4))return false;e.x=pos.x;e.z=pos.z;if(e.mesh)e.mesh.position.set(e.x,0,e.z);this.api.particles(V(e.x,1,e.z),this.color(e),16,2,.6);return true;}
 cast(e,index,alt=false){
  const a=getAgent(e.agent),s=a.skills[index],k=e.kit;
  if(!k||!s||this.api.phase()!=='live'||this.has(e,'suppress')||!e.alive)return false;
  const kind=s.kind,isUlt=index===3;
  if(!e.alive&&kind!=='resurrection')return false;
  if(k.anchor&&['anchor','gate','refract'].includes(kind)){const p=k.anchor;if(this.teleport(e,p)){k.anchor=null;this.mark(e,'phase',kind==='refract'?.3:.1);return true}return false;}
  if(isUlt?k.points<a.ultimateCost:k.charges[index]<=0||k.cooldowns[index]>0)return false;
  if(['devour','dismiss','overheal'].includes(kind)&&k.souls<=0){this.message(e,'需要先击败一名敌人');return false;}
  if(kind==='resurrection'&&(e.alive||!e.deathAt||this.t-e.deathAt>8))return false;
  const pos=this.target(e,kind==='teleportfar'?27:12),dir=this.direction(e),allies=this.api.actors().filter(x=>x.team===e.team),foes=this.enemies(e);
  let target;
  if(kind==='revive'){target=allies.filter(x=>!x.alive&&distance(x,e)<20&&this.api.los(V(e.x,1.5,e.z),V(x.x,1.5,x.z))).sort((x,y)=>distance(x,pos)-distance(y,pos))[0];if(!target){this.message(e,'附近没有可复活的队友');return false;}}
  if(kind==='scan'&&!this.api.actors().some(x=>!x.alive&&x.team!==e.team&&distance(x,e)<15)){this.message(e,'附近没有敌人尸体');return false;}
  if(['heal','teamheal'].includes(kind)){target=allies.filter(x=>x.alive&&x.hp<100&&(kind!=='teamheal'||x!==e)&&distance(x,e)<18&&this.api.los(V(e.x,1.5,e.z),V(x.x,1.5,x.z))).sort((x,y)=>distance(x,pos)-distance(y,pos))[0];if(!target){this.message(e,'没有可治疗的目标');return false;}}
  if(['duel','execute'].includes(kind)){target=foes.filter(x=>{const d=V(x.x-e.x,0,x.z-e.z);return d.length()<30&&d.normalize().dot(dir)>.65}).sort((x,y)=>distance(x,pos)-distance(y,pos))[0];if(!target){this.message(e,'准星前方没有目标');return false;}}
  if(isUlt)k.points=0;else{k.charges[index]--;k.cooldowns[index]=s.cooldown||.7;}
  this.message(e,s.name);this.api.sound(kind);this.api.particles(V(e.x,1.2,e.z),this.color(e),8,1,.4);
  switch(kind){
   case 'smoke':this.smoke(e,pos);break;
   case 'pit':this.smoke(e,e,8,25,true);break;
   case 'molly':case 'acid':case 'thorns':this.make(e,kind,pos,{life:kind==='thorns'?8:6,radius:3});break;
   case 'slow':this.make(e,'slow',pos,{life:7,radius:3.8});break;
   case 'decay':case 'vulnerable':case 'tether':this.area(e,pos,5,x=>{this.mark(x,kind==='tether'?'root':kind,kind==='vulnerable'?6:4);if(kind==='tether')this.mark(x,'decay',4)});this.make(e,'visual',pos,{life:1,radius:5});break;
   case 'stun':case 'flash':case 'blind':case 'suppress':this.make(e,kind,pos,{life:2,radius:kind==='suppress'?10:8,delay:.65});break;
   case 'reveal':this.make(e,'reveal',pos,{life:6,radius:18,hp:40,height:.4});break;
   case 'camera':this.make(e,'reveal',pos,{life:45,radius:22,hp:60,height:1.4});break;
   case 'blast':case 'shock':case 'grenade':case 'missiles':this.make(e,kind,pos,{life:kind==='grenade'||kind==='missiles'?3:1.6,radius:kind==='shock'?3.2:4,delay:kind==='missiles'?1.2:.7});break;
   case 'orbital':this.make(e,'orbital',pos,{life:5,radius:4.5,delay:1.5});break;
   case 'airstrike':for(let i=0;i<7;i++)this.make(e,'blast',{x:e.x+dir.x*(4+i*3),z:e.z+dir.z*(4+i*3)},{life:2+i*.22,radius:4,delay:.8+i*.22});break;
   case 'quake':case 'nightmare':case 'tidal':case 'sonic':case 'lightspeed':for(let i=0;i<6;i++)this.make(e,kind,{x:e.x+dir.x*(4+i*3),z:e.z+dir.z*(4+i*3)},{life:2.5,radius:5,delay:i*.12});if(kind==='lightspeed')this.mark(e,'speed',12);break;
   case 'wall':this.wall(e,this.target(e,5));break;
   case 'shieldwall':this.wall(e,this.target(e,3),{life:5,hp:0,kind:'movingwall'});break;
   case 'cosmic':this.wall(e,pos,{width:40,hp:0,life:20});break;
   case 'shieldwave':this.smoke(e,pos,3,12);this.wall(e,pos,{width:5,hp:500,life:12});break;
   case 'screen':case 'firewall':case 'toxins':case 'lanes':{
    for(let i=0;i<6;i++){const p={x:e.x+dir.x*(3+i*2.5),z:e.z+dir.z*(3+i*2.5)};if(kind==='lanes'){for(const side of[-1,1])this.smoke(e,{x:p.x+dir.z*side*2,z:p.z-dir.x*side*2},1.6,9);}else this.smoke(e,p,1.7,kind==='screen'?12:10,kind==='toxins');if(kind==='firewall')this.make(e,'molly',p,{radius:1.5,life:8});}break;}
   case 'trap':case 'trip':case 'shear':this.make(e,kind,pos,{radius:2.3,life:80,hp:40,height:.25});break;
   case 'turret':{const o=this.make(e,'turret',this.target(e,3),{radius:.4,life:90,hp:125,height:.8});const barrel=new T.Mesh(new T.BoxGeometry(.18,.18,.55),new T.MeshStandardMaterial({color:0x313f46}));barrel.position.set(0,.35,-.3);o.mesh.add(barrel);break;}
   case 'lockdown':this.make(e,'lockdown',e,{radius:17,life:14,hp:200,delay:8,height:1});break;
   case 'interceptor':this.make(e,'interceptor',pos,{radius:.5,life:35,hp:100,height:.6});break;
   case 'bot':case 'alarm':case 'hound':case 'drone':case 'decoy':case 'detain':case 'seekers':for(let i=0;i<(kind==='seekers'?3:1);i++){const o=this.make(e,kind,{x:e.x+dir.x*1.2+i*.3,z:e.z+dir.z*1.2},{life:12,radius:.28,hp:70,height:.55});o.dir=dir.clone();}break;
   case 'heal':this.mark(target,'regen',5,12);break;
   case 'teamheal':for(const ally of allies)if(ally!==e&&ally.alive&&distance(ally,e)<18&&this.api.los(V(e.x,1.5,e.z),V(ally.x,1.5,ally.z)))this.mark(ally,'regen',5,20);break;
   case 'pulse':if(alt){for(const ally of allies)if(ally.alive&&distance(ally,pos)<6)this.mark(ally,'regen',4,12);}else this.make(e,'stun',pos,{radius:6,life:2,delay:.6});break;
   case 'revive':target.alive=true;target.hp=100;target.armor=0;if(target.mesh){target.mesh.visible=true;target.mesh.position.set(target.x,0,target.z)}this.mark(target,'phase',1);this.api.revived(target);break;
   case 'resurrection':e.alive=true;e.hp=100;e.kit.ultimate={kind,left:12};this.mark(e,'phase',2);this.api.revived(e);break;
   case 'rebirth':k.ultimate={kind,left:12,x:e.x,z:e.z,armor:e.armor};break;
   case 'overheal':case 'devour':k.souls--;this.mark(e,'regen',5,20);if(kind==='overheal'){e.armor=Math.min(50,e.armor+25);this.mark(e,'speed',6)}break;
   case 'dismiss':k.souls--;this.mark(e,'phase',3);break;
   case 'phase':this.mark(e,'phase',9);break;
   case 'empress':this.mark(e,'stim',25);k.ultimate={kind,left:25};break;
   case 'evolve':this.mark(e,'immune',18);this.mark(e,'regen',18,8);this.mark(e,'speed',18);this.mark(e,'stim',18);break;
   case 'overdrive':this.mark(e,'stim',12);k.ultimate={kind,left:12};break;
   case 'stim':for(const ally of allies)if(ally.alive&&distance(ally,e)<8){this.mark(ally,'speed',8);this.mark(ally,'stim',8)}break;
   case 'dash':case 'satchel':{const d=e===this.api.player?this.api.moveDirection():dir;this.api.move(e,d.x*(kind==='satchel'?4.5:7),d.z*(kind==='satchel'?4.5:7));if(kind==='satchel'&&e===this.api.player)e.vy=8;break;}
   case 'updraft':if(e===this.api.player)e.vy=10;else this.mark(e,'speed',3);break;
   case 'sprint':this.mark(e,'speed',10);break;
   case 'teleport':case 'teleportfar':{let p=pos;for(let i=0;i<12&&this.api.blocked(e,p.x,p.z,.4);i++)p={x:p.x-dir.x*.5,z:p.z-dir.z*.5};this.teleport(e,p);break;}
   case 'anchor':case 'refract':case 'gate':k.anchor=kind==='gate'?pos:{x:e.x,z:e.z};this.make(e,'anchor',k.anchor,{life:40,radius:.6});break;
   case 'shield':this.mark(e,'shield',12);break;
   case 'scan':for(const x of foes)this.mark(x,'revealed',7);break;
   case 'gravity':this.make(e,'gravity',pos,{life:5,radius:4.5});break;
   case 'disarm':this.make(e,'disarm',e,{life:3,radius:16,delay:1.5});break;
   case 'execute':this.mark(target,'root',5);this.make(e,'execute',target,{life:5,delay:3.5,radius:1,hp:180,height:2});break;
   case 'duel':this.duel={a:e,b:target,left:15};this.mark(e,'duel',15);this.mark(target,'duel',15);this.make(e,'visual',e,{life:15,radius:10});break;
   case 'rocket':case 'sniper':case 'pistol':case 'beam':case 'knives':case 'lightning':k.ultimate={kind,left:kind==='pistol'?60:20,ammo:({rocket:1,sniper:5,pistol:8,beam:3,knives:5,lightning:40})[kind],next:0};break;
   default:throw new Error('Unhandled skill '+kind);
  }
  return true;
 }
 message(e,msg){if(e===this.api.player)this.api.notify(msg)}
 beforeDamage(e,n,attacker){if(this.has(e,'phase'))return 0;if(this.duel&&((e===this.duel.a||e===this.duel.b)!==(attacker===this.duel.a||attacker===this.duel.b)))return 0;if(this.has(e,'shield')){e.status.shield=0;return 0}return n*(this.has(e,'vulnerable')?2:1);}
 preventDeath(e){const u=e.kit?.ultimate;if(u?.kind==='rebirth'){this.teleport(e,u);e.hp=100;e.armor=u.armor;e.kit.ultimate=null;return true}return false;}
 onKill(killer,victim){victim.deathAt=this.t;killer.kit.points=Math.min(getAgent(killer.agent).ultimateCost,killer.kit.points+1);killer.kit.souls=Math.min(3,killer.kit.souls+1);if(['empress','resurrection'].includes(killer.kit.ultimate?.kind)){this.mark(killer,'regen',4,25);if(killer.kit.ultimate.kind==='resurrection')killer.kit.ultimate=null;}if(killer.kit.ultimate?.kind==='knives')killer.kit.ultimate.ammo=5;const s=getAgent(killer.agent).skills[2];if(['dash','grenade','shield'].includes(s.kind)){killer.kit.signatureKills=(killer.kit.signatureKills||0)+1;if(killer.kit.signatureKills>=2){killer.kit.charges[2]=s.charges;killer.kit.signatureKills=0;}}}
 fire(e){const u=e.kit?.ultimate;if(!u||!['rocket','sniper','pistol','beam','knives','lightning'].includes(u.kind))return false;if(this.t<u.next)return true;u.next=this.t+({sniper:1.2,pistol:.27,rocket:1,beam:1.3,knives:.2,lightning:.08})[u.kind];u.ammo--;this.api.skillShot(e,u.kind);if(u.ammo<=0)e.kit.ultimate=null;return true;}
 tick(dt){this.t+=dt;
  if(this.duel){this.duel.left-=dt;if(this.duel.left<=0||!this.duel.a.alive||!this.duel.b.alive)this.duel=null;}
  for(const e of this.api.actors()){
   if(!e.kit)continue;
   const a=getAgent(e.agent);for(let i=0;i<3;i++){if(e.kit.cooldowns[i]>0){e.kit.cooldowns[i]=Math.max(0,e.kit.cooldowns[i]-dt);if(e.kit.cooldowns[i]===0&&a.skills[i].cooldown)e.kit.charges[i]=a.skills[i].charges;}}
   if(this.has(e,'regen')&&e.alive)e.hp=Math.min(100,e.hp+dt*(e.status.regenValue||12));
   if(this.has(e,'decay')&&e.alive){const n=Math.min(e.hp-1,dt*14);if(n>0){e.hp-=n;e.decayDebt=(e.decayDebt||0)+n;}}else if(e.decayDebt&&e.alive){const n=Math.min(e.decayDebt,dt*20,100-e.hp);e.hp+=n;e.decayDebt-=n;if(e.hp>=100)e.decayDebt=0;}
   const u=e.kit.ultimate;if(u){u.left-=dt;if(u.kind==='overdrive')this.area(e,e,13,x=>this.mark(x,'suppress',2));if(u.left<=0){if(u.kind==='rebirth')this.preventDeath(e);else if(u.kind==='resurrection')this.api.damage(e,300,e);e.kit.ultimate=null;}}
   if(e.mesh){e.mesh.visible=e.alive&&(!this.has(e,'phase')||e.team===this.api.player.team);}
  }
  for(const o of [...this.objects]){
   o.life-=dt;o.age+=dt;o.tick-=dt;if(o.life<=0){this.remove(o);continue;}const e=o.owner;if(!e.alive&&!['molly','acid','thorns','blast','grenade'].includes(o.kind)){this.remove(o);continue;}
   o.mesh.material.emissiveIntensity=.3+Math.sin(this.t*4)*.15;
   if(['bot','alarm','hound','drone','decoy','detain','seekers'].includes(o.kind)){
    const enemy=this.enemies(e).filter(x=>this.api.los(V(o.x,1,o.z),V(x.x,1,x.z))).sort((a,b)=>distance(a,o)-distance(b,o))[0];let dir=o.dir;
    if(enemy&&o.kind!=='decoy'){dir=V(enemy.x-o.x,0,enemy.z-o.z).normalize();}
    const nx=o.x+dir.x*dt*5,nz=o.z+dir.z*dt*5;if(!this.api.blocked(e,nx,nz,.25)){o.x=nx;o.z=nz;o.mesh.position.x=nx;o.mesh.position.z=nz;}else o.dir.multiplyScalar(-1);
    if(enemy&&distance(enemy,o)<(o.kind==='drone'?7:1.3)){if(o.kind==='bot')this.api.damage(enemy,80,e);else if(o.kind==='alarm')this.mark(enemy,'vulnerable',5);else if(o.kind==='drone')this.mark(enemy,'revealed',6);else if(o.kind==='detain')this.area(e,o,4,x=>{this.mark(x,'root',5);this.mark(x,'disarm',5)});else{this.mark(enemy,o.kind==='decoy'?'flash':'blind',3);this.mark(enemy,'slow',3);}this.api.particles(V(o.x,1,o.z),this.color(e),12,2,.5);this.remove(o);}continue;
   }
   if(o.kind==='movingwall'){const d=this.direction(e);o.x+=d.x*dt*2;o.z+=d.z*dt*2;o.mesh.position.x=o.x;o.mesh.position.z=o.z;}
   if(['molly','acid','thorns','orbital','slow','decay','gravity'].includes(o.kind)&&o.age>=o.delay){this.area(e,o,o.radius,x=>{if(['molly','acid','thorns','orbital'].includes(o.kind))this.api.damage(x,dt*(o.kind==='orbital'?85:24),e);if(['acid','gravity'].includes(o.kind))this.mark(x,'vulnerable',2);if(['slow','thorns'].includes(o.kind))this.mark(x,'slow',.4);if(o.kind==='decay')this.mark(x,'decay',.4);if(o.kind==='gravity'){const d=V(o.x-x.x,0,o.z-x.z);if(d.length()>.5){d.normalize();this.api.move(x,d.x*dt*3,d.z*dt*3);}}});if(o.kind==='molly'&&e.agent==='phoenix'&&distance(e,o)<o.radius)e.hp=Math.min(100,e.hp+dt*12);}
   if(['trap','trip','shear'].includes(o.kind)){const target=this.enemies(e).find(x=>distance(x,o)<o.radius);if(target){if(o.kind==='shear')this.wall(e,o,{life:6,hp:0});else{this.mark(target,'slow',5);this.mark(target,'revealed',5);}this.remove(o);}continue;}
   if(o.kind==='interceptor'){for(const other of [...this.objects])if(other!==o&&other.owner.team!==e.team&&distance(other,o)<7&&!other.solid)this.remove(other);}
   if(o.kind==='turret'&&o.tick<=0){o.tick=.55;const target=this.enemies(e).filter(x=>distance(x,o)<25&&this.api.los(V(o.x,1.2,o.z),V(x.x,1.4,x.z))).sort((a,b)=>distance(a,o)-distance(b,o))[0];if(target){o.mesh.rotation.y=Math.atan2(o.x-target.x,o.z-target.z);this.api.tracer(V(o.x,1,o.z),V(target.x,1.4,target.z),this.color(e));this.api.damage(target,8,e);}}
   if(o.kind==='reveal'&&o.tick<=0){o.tick=1;this.area(e,o,o.radius,x=>this.mark(x,'revealed',2),true);}
   if(o.age<o.delay||o.fired&&!['grenade','missiles'].includes(o.kind))continue;
   const once=['flash','blind','stun','suppress','blast','shock','grenade','missiles','quake','nightmare','tidal','sonic','lightspeed','disarm','lockdown','execute'];
   if(once.includes(o.kind)&&o.tick<=0){o.fired=true;o.tick=.6;this.api.particles(V(o.x,1,o.z),this.color(e),16,3,.7);this.area(e,o,o.radius,x=>{const kind=o.kind;
    if(['blast','shock','grenade','missiles','execute'].includes(kind))this.api.damage(x,kind==='execute'?300:kind==='shock'?60:kind==='grenade'?40:70,e);
    if(['flash','blind','stun','suppress','disarm'].includes(kind))this.mark(x,kind,kind==='suppress'?7:kind==='disarm'?6:2.6);
    if(['quake','sonic','tidal','lightspeed'].includes(kind)){this.mark(x,kind==='quake'?'stun':'slow',5);this.mark(x,'blind',2);if(kind==='quake'||kind==='sonic'){const d=this.direction(e);this.api.move(x,d.x*2,d.z*2);}}
    if(kind==='nightmare'){this.mark(x,'decay',10);this.mark(x,'revealed',7);this.mark(x,'blind',3);}
    if(kind==='lockdown'){this.mark(x,'root',7);this.mark(x,'disarm',7);}
   },['flash','blind'].includes(o.kind));}
  }
 }
}
