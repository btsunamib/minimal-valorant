import * as T from './three.module.js';
import {sampleMercyEquip,MERCY_DURATION} from './mercy-equip.js';
export const MERCY_VARIANTS={red:{name:'原色 · VCT 红',color:0xf23558},purple:{name:'太平洋 · 紫',color:0xa764fa},green:{name:'美洲 · 绿',color:0x6aee66},blue:{name:'EMEA · 蓝',color:0x5ca6ff}};
export function createMercy(showcase=false,variant='red'){
 const c=MERCY_VARIANTS[variant]||MERCY_VARIANTS.red,model=new T.Group(),rig=new T.Group(),hand=new T.Group(),left=new T.Group(),blade=new T.Group();model.name='VCT LOCK IN Misericordia';model.add(rig,hand,left);rig.add(blade);
 const geo=new T.BoxGeometry(1,1,1),mats={steel:new T.MeshStandardMaterial({color:0xa5afb8,metalness:.92,roughness:.24}),bevel:new T.MeshStandardMaterial({color:0xecf5f5,metalness:.88,roughness:.18}),dark:new T.MeshStandardMaterial({color:0x26252b,metalness:.6,roughness:.4}),grip:new T.MeshStandardMaterial({color:0x191c22,roughness:.68}),red:new T.MeshStandardMaterial({color:c.color,metalness:.7,roughness:.26}),light:new T.MeshStandardMaterial({color:c.color,emissive:c.color,emissiveIntensity:1.5,metalness:.4,roughness:.2}),glove:new T.MeshStandardMaterial({color:0x242c39,roughness:.84}),panel:new T.MeshStandardMaterial({color:0x535b6b,roughness:.8})};
 function box(g,x,y,z,w,h,d,mat){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(w,h,d);g.add(m);return m;}
 function plate(g,pts,depth,mat,z=0){const shape=new T.Shape();pts.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.0015,bevelThickness:.0015,bevelSegments:1,steps:1});geo.translate(0,0,z-depth/2);const m=new T.Mesh(geo,mat);g.add(m);return m;}
 // Compact asymmetric drop-point blade, dark upper flat and pale cutting bevel.
 plate(blade,[[-.050,0],[-.054,.07],[-.061,.21],[-.037,.36],[.012,.49],[.071,.22],[.07,.10],[.057,.052],[.045,.012]],.024,mats.steel);
 for(const z of[-.016,.016]){
  plate(blade,[[-.05,.02],[-.053,.21],[-.032,.36],[.012,.49],[.021,.34],[.029,.23],[.024,.11],[.038,.025]],.004,mats.dark,z);
  plate(blade,[[-.02,.015],[-.004,.08],[.033,.21],[.030,.35],[.012,.49],[.071,.22],[.064,.10],[.045,.035]],.004,mats.red,z*1.12);
  plate(blade,[[.008,.012],[.022,.06],[.054,.18],[.061,.22],[.012,.49],[.071,.22],[.071,.10],[.056,.044]],.003,mats.bevel,z*1.25);
  // Thin white wavy ridge and irregular Damascus contour etching.
  const wave=[];for(let i=0;i<45;i++){const y=.02+i*.009,x=.015+Math.sin(i*.64)*.004+Math.sin(i*1.4)*.002;wave.push(new T.Vector3(x,y,z*1.3));}
  blade.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(wave),44,.0018,3,false),mats.bevel));
  for(let j=0;j<6;j++){const p=[];for(let i=0;i<32;i++){const y=.07+i*.009,x=-.036+j*.008+Math.sin(i*.4+j*.8)*(.006+j*.0004);p.push(new T.Vector3(x,y,z*1.2));}const line=new T.Line(new T.BufferGeometry().setFromPoints(p),new T.LineBasicMaterial({color:0x8d9aa5,transparent:true,opacity:.6}));blade.add(line);}
 }
 box(rig,0,-.025,0,.098,.055,.062,mats.dark);for(const side of[-1,1]){const guard=box(rig,side*.047,-.015,0,.065,.026,.052,mats.dark);guard.rotation.z=side*.32;}
 plate(rig,[[-.043,-.03],[-.039,-.27],[-.024,-.32],[.026,-.32],[.043,-.285],[.039,-.03]],.058,mats.grip);
 for(const side of[-1,1]){
  const z=side*.033;plate(rig,[[-.028,-.04],[-.025,-.26],[.020,-.205],[.023,-.08]],.008,mats.dark,z);
  plate(rig,[[-.019,-.06],[-.022,-.21],[.020,-.155],[.025,-.085]],.005,mats.red,z*1.16);
  plate(rig,[[-.012,-.065],[-.016,-.18],[.006,-.135],[.018,-.087]],.006,mats.light,z*1.23);
  for(const y of[-.041,-.255]){const screw=new T.Mesh(new T.CylinderGeometry(.011,.011,.011,12),mats.steel);screw.rotation.x=Math.PI/2;screw.position.set(0,y,side*.038);rig.add(screw);box(rig,0,y,side*.045,.011,.002,.002,mats.dark);}
  const medallion=new T.Mesh(new T.CylinderGeometry(.036,.036,.009,24),mats.red);medallion.rotation.x=Math.PI/2;medallion.position.set(0,.005,side*.032);rig.add(medallion);
  for(let n=0;n<4;n++){const mark=box(rig,(n%2?1:-1)*.012,.005+(n<2?.009:-.009),side*.039,.025,.004,.003,mats.bevel);mark.rotation.z=n%2?.65:-.65;}
 }
 const pommel=new T.Mesh(new T.TorusGeometry(.030,.008,8,24),mats.steel);pommel.position.y=-.326;rig.add(pommel);const ring=new T.Mesh(new T.TorusGeometry(.023,.003,6,24),mats.red);ring.position.set(0,-.326,.005);rig.add(ring);
 function palm(root,leftHand=false){box(root,0,-.025,.018,.124,.137,.073,mats.glove);box(root,0,-.025,-.024,.105,.099,.014,mats.panel);const fingers=[];for(let i=0;i<4;i++){const f=new T.Group();f.position.set((i-1.5)*.032,.042,.027);root.add(f);box(f,0,.031,0,.026,.067,.032,mats.glove);box(f,0,.009,-.022,.028,.030,.009,mats.panel);const joint=new T.Group();joint.position.y=.059;f.add(joint);box(joint,0,.019,0,.024,.043,.027,mats.glove);fingers.push({f,joint});}const thumb=box(root,leftHand?.075:-.075,0,.03,.04,.084,.04,mats.glove);thumb.rotation.z=leftHand?.55:-.55;box(root,0,-.11,.025,.145,.047,.103,mats.glove);return fingers;}
 const fingers=palm(hand),lfingers=palm(left,true),fore=box(model,0,0,0,.125,1,.12,mats.glove),sleeve=box(model,0,0,0,.155,1,.15,mats.panel),lfore=box(model,0,0,0,.14,1,.13,mats.glove);
 function segment(m,a,b){m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=a.distanceTo(b);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());}
 const trailGeo=new T.BufferGeometry(),positions=new Float32Array(22*6),indices=[];for(let i=0;i<21;i++){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2)}trailGeo.setAttribute('position',new T.BufferAttribute(positions,3));trailGeo.setIndex(indices);const ribbon=new T.Mesh(trailGeo,new T.MeshBasicMaterial({color:c.color,transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}));ribbon.frustumCulled=false;model.add(ribbon);
 const edgeGeo=new T.BufferGeometry().setFromPoints(Array.from({length:22},()=>new T.Vector3())),rim=new T.Line(edgeGeo,new T.LineBasicMaterial({color:c.color,transparent:true,opacity:.85}));rim.frustumCulled=false;model.add(rim);
 const aura=new T.Mesh(new T.IcosahedronGeometry(.021,1),mats.light);rig.add(aura);aura.position.set(0,.015,.055);
 function poseRig(p){rig.position.fromArray(p.bolster);const dx=p.tip[0]-p.bolster[0],dy=p.tip[1]-p.bolster[1];rig.rotation.set(0,0,Math.atan2(-dx,dy));rig.rotateY(p.twist);rig.scale.set(1,Math.hypot(dx,dy)/.49,1);}
 const attackPose=(t,heavy)=>{const p=sampleMercyEquip(.8);const a=Math.max(0,Math.min(1,t)),s=Math.sin(a*Math.PI);p.bolster[0]+=(heavy?-.48:-.8)*s;p.bolster[1]+=(heavy?.32:.22)*s;p.tip[0]+=(heavy?-.20:-.5)*s;p.tip[1]-=(heavy?.5:.24)*s;p.twist+=s*1.4;return p;};
 function inspectPose(t){const p=sampleMercyEquip(.8),s=Math.sin(Math.min(1,t/2.6)*Math.PI);p.bolster[0]=T.MathUtils.lerp(p.bolster[0],.34,s);p.bolster[1]=T.MathUtils.lerp(p.bolster[1],-.20,s);const a=Math.PI/2-s*1.4; p.tip=[p.bolster[0]-.35*Math.cos(a),p.bolster[1]+.49*Math.sin(a),0];p.twist=1.05-s*1.4;p.open=s*.8;return p;};
 function update({dt=0,time=0,equip=0,equipSeconds=null,inspect=false,inspectSeconds=0,attack=-1,heavy=false,topFrag=false}={}){
  const equipping=equipSeconds!==null||equip>0,seconds=equipSeconds??MERCY_DURATION*(1-equip),attacking=attack>=0&&attack<=1;
  let p=equipping?sampleMercyEquip(seconds):attacking?attackPose(attack,heavy):inspect?inspectPose(inspectSeconds):sampleMercyEquip(.8);
  if(showcase&&!equipping&&!inspect){p={...p,bolster:[0,-.08,0],tip:[.30,.4,0],twist:.15,open:0};}
  poseRig(p);rig.updateMatrixWorld(true);
  const hideHands=showcase&&!equipping;for(const h of[hand,left,fore,sleeve,lfore])h.visible=!hideHands;
  hand.position.copy(new T.Vector3(0,-.13,.047).applyMatrix4(rig.matrix));hand.rotation.set(-.18,-.25,-.55);if(p.frame<20)hand.rotation.z=-.45;
  fingers.forEach(({f,joint},i)=>{f.rotation.set(-1.30*(1-p.open),0,(i-1.5)*.15*p.open);joint.rotation.x=-1.15*(1-p.open);});
  left.position.set(-.37,-.65+(p.left??1)*.24,.02);left.rotation.set(-.5,.3,-.85);lfingers.forEach(({f,joint},i)=>{f.rotation.set(-.35,0,(i-1.5)*.12);joint.rotation.x=-.5;});
  const wrist=new T.Vector3(0,-.13,.025).applyEuler(hand.rotation).add(hand.position),elbow=new T.Vector3(.86,-.62,.25);segment(fore,wrist,elbow);segment(sleeve,elbow,new T.Vector3(1.1,-.94,.5));segment(lfore,new T.Vector3(-.6,-.76,.2),left.position.clone().add(new T.Vector3(-.06,-.08,0)));
  const trailing=equipping?p.trail:attacking||inspect;ribbon.visible=trailing;rim.visible=trailing;
  if(trailing){for(let i=0;i<22;i++){let q;if(equipping)q=sampleMercyEquip(Math.max(0,seconds-i/180));else if(attacking)q=attackPose(Math.max(0,attack-i*.011),heavy);else q=inspectPose(Math.max(0,inspectSeconds-i/120));const k=i*6;positions[k]=q.tip[0];positions[k+1]=q.tip[1];positions[k+2]=.014;positions[k+3]=q.bolster[0]+(q.tip[0]-q.bolster[0])*.64;positions[k+4]=q.bolster[1]+(q.tip[1]-q.bolster[1])*.64;positions[k+5]=.013;edgeGeo.attributes.position.setXYZ(i,q.tip[0],q.tip[1],.016);}trailGeo.attributes.position.needsUpdate=true;edgeGeo.attributes.position.needsUpdate=true;}
  aura.visible=topFrag;aura.scale.setScalar(1+Math.sin(time*7)*.2);mats.light.emissiveIntensity=topFrag?2.4:1;
 }
 function dispose(){const gs=new Set(),ms=new Set();model.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material)});gs.forEach(x=>x.dispose());ms.forEach(x=>x.dispose());}
 update();return{model,blade,handle:rig,flash:null,magazine:null,update,dispose,accent:c.color,variant:c.name};
}
