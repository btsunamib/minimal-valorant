import * as T from './three.module.js';
import {sampleChampion,CHAMPION_DURATION} from './champions24-motion.js';
export function createChampion(showcase=false){
 const model=new T.Group(),rig=new T.Group(),blade=new T.Group(),hand=new T.Group(),left=new T.Group();model.name='Champions 2024 Blade';model.add(rig,hand,left);rig.add(blade);const mats=[],geos=[],boxgeo=new T.BoxGeometry(1,1,1);geos.push(boxgeo);
 const mat=(color,metal=.7,emission=0)=>{const m=new T.MeshStandardMaterial({color,metalness:metal,roughness:metal>.5?.28:.76,emissive:emission?color:0,emissiveIntensity:emission});mats.push(m);return m;};const black=mat(0x171b22),gray=mat(0x393e43),steel=mat(0xbfc6cb,.92),white=mat(0xf3efe1,.9),gold=mat(0xecb533,.88),light=mat(0xffba27,.4,1.2),glove=mat(0x263a40,.06),panel=mat(0x5f777c,.1),skin=mat(0xb18d79,.03);
 function mesh(geo,m,parent=rig){geos.push(geo);const o=new T.Mesh(geo,m);parent.add(o);return o;}
 function box(g,x,y,z,w,h,d,m){const o=new T.Mesh(boxgeo,m);o.position.set(x,y,z);o.scale.set(w,h,d);g.add(o);return o;}
 function plate(g,pts,thickness,m,z=0,holes=[]){const s=new T.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();for(const pts of holes){const p=new T.Path();pts.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();s.holes.push(p);}const geo=new T.ExtrudeGeometry(s,{depth:thickness,bevelEnabled:true,bevelSize:.0018,bevelThickness:.0018,bevelSegments:2,steps:1});geo.translate(0,0,z-thickness/2);return mesh(geo,m,g);}
 // Long straight flat with slight upswept tip, machined spine, stepped gold channels.
 plate(blade,[[-.053,0],[-.048,.90],[-.063,1.09],[-.018,1.30],[.033,1.16],[.048,.34],[.065,.09]],.037,black);
 for(const side of[-1,1]){const z=side*.022;
  plate(blade,[[.017,.17],[.02,1.09],[-.018,1.30],[.033,1.16],[.048,.34],[.065,.09]],.005,steel,z);
  plate(blade,[[.036,.21],[.039,.95],[.015,1.19],[-.018,1.30],[.033,1.16],[.05,.28]],.003,white,z*1.12);
  plate(blade,[[-.055,.065],[-.04,.12],[-.037,.39],[-.019,.43],[-.017,.73],[-.035,.77],[-.039,.94],[-.047,.96],[-.049,.76],[-.029,.71],[-.03,.45],[-.049,.40]],.005,gold,z*1.15);
  plate(blade,[[-.048,.12],[-.042,.13],[-.039,.40],[-.023,.44],[-.022,.70],[-.028,.70],[-.030,.45],[-.045,.405]],.003,light,z*1.3);
  for(let i=0;i<9;i++)box(blade,-.029,.46+i*.023,z*1.3,.020,.002,.002,gray);
  // Champions chevrons, inset gold panel near the ricasso.
  for(let i=0;i<2;i++)for(const sideX of[-1,1])box(blade,sideX*.009,.34+i*.025,z*1.4,.021,.005,.003,gold).rotation.z=sideX*-.6;
 }
 // Diamond guard with genuine negative space; angular hilt unlike the older daggers.
 const guard=[[-.105,.025],[-.068,.093],[0,.052],[.087,.089],[.11,.023],[.064,-.072],[0,-.12],[-.075,-.066]];
 plate(rig,guard,.088,black,0,[[[-.064,.01],[0,.032],[.064,.01],[.033,-.053],[0,-.075],[-.036,-.05]]]);
 for(const side of[-1,1]){plate(rig,[[-.08,.014],[-.057,.047],[-.015,.029],[-.051,-.059],[-.067,-.038]],.008,gold,side*.047);plate(rig,[[.048,.04],[.080,.055],[.086,.014],[.047,-.061],[.017,-.072]],.007,gray,side*.047);const gem=mesh(new T.OctahedronGeometry(.031),gold);gem.position.set(0,-.038,side*.047);gem.scale.set(.6,1,.3);}
 plate(rig,[[-.040,-.065],[-.035,-.34],[-.026,-.39],[.033,-.365],[.043,-.08]],.057,gray);
 for(let i=0;i<8;i++)box(rig,0,-.11-i*.027,.034,.073,.013,.006,black).rotation.z=-.18;
 for(const side of[-1,1]){plate(rig,[[-.04,-.08],[-.042,-.36],[-.089,-.412],[-.064,-.483],[.055,-.424],[.040,-.351],[.028,-.112]],.007,gold,side*.034);}
 plate(rig,[[-.040,-.32],[-.102,-.408],[-.061,-.493],[.065,-.434],[.038,-.35]],.065,black,0,[[[-.034,-.366],[-.076,-.410],[-.052,-.458],[.035,-.415],[.020,-.371]]]);
 for(const side of[-1,1])plate(rig,[[-.092,-.410],[-.059,-.481],[.055,-.429],[.043,-.413],[-.052,-.458],[-.078,-.406]],.004,light,side*.037);
 function palm(g){box(g,0,0,.015,.13,.145,.077,glove);box(g,0,.011,-.028,.10,.105,.015,panel);const fingers=[];for(let i=0;i<4;i++){const f=new T.Group();f.position.set((i-1.5)*.032,.064,.018);g.add(f);box(f,0,.029,0,.025,.061,.027,glove);const tip=new T.Group();tip.position.y=.055;f.add(tip);box(tip,0,.024,0,.023,.049,.027,skin);fingers.push({f,tip});}box(g,-.075,.012,.033,.04,.083,.037,skin).rotation.z=-.6;box(g,0,-.096,.012,.15,.045,.105,glove);box(g,0,-.11,.065,.11,.007,.008,panel);return fingers;}
 const fingers=palm(hand),lf=palm(left),fore=mesh(new T.CylinderGeometry(.072,.050,1,12),skin,model),lfore=mesh(new T.CylinderGeometry(.072,.050,1,12),skin,model);
 function segment(m,a,b){m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=a.distanceTo(b);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());}
 const trailGeo=new T.BufferGeometry(),positions=new Float32Array(64*6),indices=[];for(let i=0;i<63;i++){let n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}trailGeo.setAttribute('position',new T.BufferAttribute(positions,3));trailGeo.setIndex(indices);const trailMat=new T.MeshBasicMaterial({color:0xff553e,transparent:true,opacity:.32,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending});mats.push(trailMat);const trail=mesh(trailGeo,trailMat,model);trail.frustumCulled=false;
 const glowgeo=new T.BufferGeometry().setFromPoints(Array.from({length:64},()=>new T.Vector3())),glowmat=new T.LineBasicMaterial({color:0xffe390,transparent:true,opacity:.95});geos.push(glowgeo);mats.push(glowmat);const rim=new T.Line(glowgeo,glowmat);model.add(rim);rim.frustumCulled=false;
 // Layered ribbons and deterministic embers; reusable buffers keep mobile allocations flat.
 const ribbons=[.035,.11,.22].map((width,i)=>{const g=new T.BufferGeometry(),a=new Float32Array(64*6);g.setAttribute('position',new T.BufferAttribute(a,3));g.setIndex(indices);const m=new T.MeshBasicMaterial({color:[0xfff4b8,0xffb129,0xff442c][i],transparent:true,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});mats.push(m);const o=mesh(g,m,model);o.frustumCulled=false;return{o,g,a,m,width};});
 const sparkGeo=new T.BufferGeometry(),sparkPos=new Float32Array(36*3);sparkGeo.setAttribute('position',new T.BufferAttribute(sparkPos,3));const sparkMat=new T.PointsMaterial({color:0xffd976,size:.014,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});geos.push(sparkGeo);mats.push(sparkMat);const sparks=new T.Points(sparkGeo,sparkMat);model.add(sparks);sparks.frustumCulled=false;
 const auraGeo=new T.BufferGeometry(),auraPos=new Float32Array(28*3);auraGeo.setAttribute('position',new T.BufferAttribute(auraPos,3));const auraMat=new T.PointsMaterial({color:0xffc443,size:.008,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});geos.push(auraGeo);mats.push(auraMat);const aura=new T.Points(auraGeo,auraMat);blade.add(aura);
 function update({time=0,equipSeconds=null,inspect=false,inspectSeconds=0,attack=-1,heavy=false,topFrag=false}={}){
  const draw=equipSeconds!==null,attacking=attack>=0&&attack<=1;let p=sampleChampion(draw?equipSeconds:CHAMPION_DURATION);p={...p,guard:[...p.guard],tip:[...p.tip]};
  if(showcase&&!draw&&!inspect){p.guard=[-.36,-.20,0];p.tip=[.55,.53,0];p.roll=.20;}
  if(inspect){const f=Math.sin(Math.min(1,inspectSeconds/2.6)*Math.PI);p.guard[0]+=.60*f;p.guard[1]+=.43*f;p.tip[0]-=.70*f;p.tip[1]+=.45*f;p.roll+=f*Math.PI*1.3;}
  if(attacking){const f=Math.sin(attack*Math.PI);p.guard[0]+=(heavy?.55:.8)*f;p.guard[1]+=.21*f;p.tip[0]-=(heavy?.8:1.55)*f;p.tip[1]+=.5*f;p.roll+=f*1.4;}
  rig.position.fromArray(p.guard);const dx=p.tip[0]-p.guard[0],dy=p.tip[1]-p.guard[1];rig.rotation.set(0,0,Math.atan2(-dx,dy));rig.rotateY(p.roll);rig.scale.set(1,Math.hypot(dx,dy)/1.30,1);rig.updateMatrixWorld(true);
  hand.position.copy(new T.Vector3(0,-.20,.055).applyMatrix4(rig.matrix));hand.rotation.set(-.14,.13,.65+(p.open*.4));fingers.forEach(({f,tip},i)=>{f.rotation.set(-1.25*(1-p.open),0,(i-1.5)*.12*p.open);tip.rotation.x=-1.1*(1-p.open);});
  const hidden=showcase&&!draw&&!inspect;hand.visible=fore.visible=!hidden;left.visible=lfore.visible=inspect&&!hidden;left.position.set(-.5,-.25,.03);left.rotation.set(-.4,0,-.7);lf.forEach(({f,tip})=>{f.rotation.x=-.3;tip.rotation.x=-.3;});
  const wrist=hand.position.clone().add(new T.Vector3(0,-.12,.03).applyEuler(hand.rotation));segment(fore,wrist,new T.Vector3(.95,-1.15,-.04));segment(lfore,left.position,new T.Vector3(-.8,-.7,.25));
  const trailOn=draw?p.trail:attacking||inspect;trail.visible=rim.visible=false;
  const clock=draw?equipSeconds:attacking?attack*.8:inspectSeconds;
  const fade=draw?Math.max(0,Math.min(1,(clock-(clock<.34?.035:.40))/.045,((clock<.34?.31:.64)-clock)/.07)):attacking?Math.sin(attack*Math.PI):Math.sin(Math.min(1,inspectSeconds/2.6)*Math.PI)*.5;
  ribbons.forEach(({o,g,a,m,width},layer)=>{o.visible=trailOn&&fade>0;m.opacity=fade*[.85,.40,.16][layer];for(let i=0;i<64;i++){const q=i/63;let x,y,nx,ny;if(draw){y=1.2-q*2.3;x=(clock<.34?.81:.10)+.19*y*y-.12;nx=1;ny=0;}else{const theta=-.8+q*2.8+(attacking?attack:inspectSeconds)*1.2;x=.05+Math.cos(theta)*.95;y=-.2+Math.sin(theta)*.65;nx=Math.cos(theta);ny=Math.sin(theta);}const w=width*Math.sin(q*Math.PI);a.set([x,y,.03+layer*.001,x+nx*w,y+ny*w,.03+layer*.001],i*6);}g.attributes.position.needsUpdate=true;});
  sparks.visible=trailOn&&fade>0;sparkMat.opacity=fade*.9;for(let i=0;i<36;i++){const q=((i*.6180339+clock*1.4)%1),a=i*2.399,yy=1.2-q*2.3;const x=draw?(clock<.34?.81:.1)+.19*yy*yy-.12:Math.cos(a+clock*3)*.9;sparkPos.set([x+Math.sin(a)*q*.13,draw?yy:-.2+Math.sin(a+clock*3)*.65,.04],i*3);}sparkGeo.attributes.position.needsUpdate=true;
  aura.visible=topFrag;auraMat.opacity=.4+.15*Math.sin(time*3);for(let i=0;i<28;i++){const q=(i/28+time*.16)%1,a=i*2.4+time;auraPos.set([Math.cos(a)*(.045+.015*Math.sin(q*9)),q*1.26,.028+Math.sin(a)*.023],i*3);}auraGeo.attributes.position.needsUpdate=true;
  light.emissiveIntensity=topFrag?2.2:1.1;
 }
 update();return{model,blade,handle:rig,flash:null,magazine:null,update,dispose(){new Set(geos).forEach(g=>g.dispose());mats.forEach(m=>m.dispose());}};
}
export class ChampionAudio{constructor(){this.buffer=null;this.pending=null;this.node=null;}preload(ctx){if(!ctx)return Promise.resolve();if(this.buffer)return Promise.resolve();if(!this.pending)this.pending=fetch('assets/champions24/equip.mp3').then(r=>{if(!r.ok)throw Error('audio');return r.arrayBuffer()}).then(b=>ctx.decodeAudioData(b)).then(b=>{this.buffer=b}).catch(()=>{}).finally(()=>{this.pending=null});return this.pending;}play(ctx,volume,offset=0){this.stop();if(!ctx||!this.buffer)return false;const n=ctx.createBufferSource(),gain=ctx.createGain();n.buffer=this.buffer;gain.gain.value=volume;n.connect(gain);gain.connect(ctx.destination);n.onended=()=>{n.disconnect();gain.disconnect();if(this.node===n)this.node=null};this.node=n;n.start(0,Math.min(offset,this.buffer.duration));return true;}stop(){if(this.node){try{this.node.stop()}catch{}this.node=null;}}}
