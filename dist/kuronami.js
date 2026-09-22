import * as T from './three.module.js';
import {sampleEquip,EQUIP_DURATION} from './kuronami-equip.js';
export const KURONAMI_VARIANTS={base:{name:'原色 · 蓝水',edge:0x68d8ff,core:0x27394c,metal:0x9eacba,grip:0x573941},purple:{name:'紫金',edge:0xc898ff,core:0x49335e,metal:0xb89b63,grip:0x282336},white:{name:'白银',edge:0x75dded,core:0xc5cdd1,metal:0xf1eee2,grip:0x637279},black:{name:'黑红',edge:0xfa5756,core:0x242932,metal:0x777b81,grip:0x32282b}};
export function createKuronami(showcase=false,variant='base'){
 const c=KURONAMI_VARIANTS[variant]||KURONAMI_VARIANTS.base,model=new T.Group();model.name='Kuronami no Yaiba';
 const mats={};for(const[k,color]of Object.entries(c))if(k!=='name')mats[k]=new T.MeshStandardMaterial({color,metalness:k==='grip'?.1:.82,roughness:k==='grip'?.78:.27});
 mats.light=new T.MeshStandardMaterial({color:c.edge,emissive:c.edge,emissiveIntensity:1.3,metalness:.45,roughness:.22});mats.skin=new T.MeshStandardMaterial({color:0xb89477,roughness:.8});mats.glove=new T.MeshStandardMaterial({color:0x293b40,roughness:.8});
 const boxGeo=new T.BoxGeometry(1,1,1),ringGeo=new T.TorusGeometry(.019,.0038,4,10);
 function box(g,x,y,z,w,h,d,mat){const m=new T.Mesh(boxGeo,mat);m.position.set(x,y,z);m.scale.set(w,h,d);g.add(m);return m}
 function plate(g,pts,depth,mat,z=0,hole){const s=new T.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();if(hole){const p=new T.Path();hole.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();s.holes.push(p)}const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:1,bevelSize:.002,bevelThickness:.002,steps:1});geo.translate(0,0,z-depth/2);const mesh=new T.Mesh(geo,mat);g.add(mesh);return mesh}
 function hand(){const h=new T.Group();box(h,0,-.13,.027,.126,.15,.10,mats.glove);box(h,0,-.27,.075,.105,.19,.115,mats.glove);box(h,0,-.21,.065,.14,.037,.14,mats.metal);for(let i=0;i<4;i++){box(h,-.046+i*.03,-.115,.089,.027,.088,.036,mats.skin);box(h,-.046+i*.03,-.15,.081,.029,.034,.042,mats.glove)}box(h,-.075,-.1,.055,.043,.08,.046,mats.skin).rotation.z=-.45;box(h,0,-.14,-.029,.09,.1,.024,mats.core);return h}
 function kunai(name){const rig=new T.Group();rig.name=name;model.add(rig);const blade=new T.Group();rig.add(blade);
  // Open triangular blade, raised spine, pale sharpened bevels, wave edge.
  const outline=[[-.13,.045],[-.092,.105],[0,.475],[.071,.177],[.133,.066],[.065,.017],[.037,-.008],[-.045,-.008]];
  const cutout=[[-.051,.127],[.037,.137],[.003,.368]];
  plate(blade,outline,.032,mats.metal,0,cutout);
  for(const side of[-1,1]){
   const z=side*.020;
   plate(blade,[[-.117,.047],[-.081,.115],[0,.474],[-.019,.32],[-.038,.249],[-.049,.217],[-.054,.163],[-.074,.102]],.005,mats.light,z);
   plate(blade,[[0,.474],[.071,.177],[.133,.066],[.091,.087],[.045,.165],[.008,.384]],.005,mats.core,z);
   plate(blade,[[-.13,.045],[-.044,-.008],[.037,-.008],[.133,.066],[.05,.067],[0,.094],[-.047,.072]],.009,mats.core,z);
   plate(blade,[[-.036,.114],[.003,.369],[.015,.321],[-.019,.115]],.004,mats.core,z);
   // Small luminous etched crest near the bolster, assembled from fine strokes.
   for(let j=0;j<3;j++){box(blade,-.016+j*.016,.041+(j%2)*.007,z*1.5,.004,.035,.003,mats.light).rotation.z=-.35;box(blade,-.021+j*.019,.047,z*1.5,.022,.003,.003,mats.light).rotation.z=.45}
  }
  box(blade,0,-.028,0,.09,.048,.072,mats.metal);
  plate(blade,[[-.035,-.045],[-.033,-.235],[-.021,-.274],[.025,-.274],[.036,-.235],[.034,-.045]],.059,mats.grip);
  for(let i=0;i<7;i++)for(const side of[-1,1]){const wrap=box(blade,0,-.055-i*.027,side*.033,.068,.014,.006,mats.grip);wrap.rotation.z=(i%2?.36:-.36);box(blade,0,-.063-i*.027,side*.037,.013,.017,.003,mats.core).rotation.z=.7}
  plate(blade,[[-.039,-.24],[-.045,-.278],[-.022,-.308],[.019,-.31],[.043,-.275],[.033,-.242]],.071,mats.metal);
  const ring=new T.Mesh(new T.TorusGeometry(.026,.007,5,12),mats.metal);ring.position.y=-.316;rig.add(ring);
  const palm=hand();palm.visible=!showcase;rig.add(palm);return{rig,blade,palm};
 }
 const left=kunai('Left kunai'),right=kunai('Right kunai'),links=[];right.palm.rotation.z=-1.9;right.palm.position.set(-.13*Math.sin(-1.9),-.13+.13*Math.cos(-1.9),0);for(let i=0;i<42;i++){const link=new T.Mesh(ringGeo,mats.metal);link.name='Chain link '+i;model.add(link);links.push(link)}
 // Separate articulated hands allow the blades to orbit the fingers without spinning the wrists.
 const equipHands=[0,1].map(side=>{
  const root=new T.Group(),palm=new T.Group(),fingers=[];root.name=side?'Right equip hand':'Left equip hand';root.add(palm);model.add(root);
  box(palm,0,0,.01,.14,.14,.09,mats.glove);box(palm,0,-.035,-.045,.10,.09,.02,mats.core);
  for(let i=0;i<4;i++){const finger=new T.Group();finger.position.set((i-1.5)*.036,.055,.015);palm.add(finger);box(finger,0,.037,0,.029,.075,.031,mats.skin);const joint=new T.Group();joint.position.y=.069;finger.add(joint);box(joint,0,.027,0,.027,.056,.028,mats.skin);fingers.push({finger,joint})}
  const thumb=box(palm,side?-.095:.095,0,.025,.045,.10,.045,mats.skin);thumb.rotation.z=side?-.6:.6;
  const fore=box(model,0,0,0,.115,1,.12,mats.glove),sleeve=box(model,0,0,0,.16,1,.16,mats.core),cuff=box(palm,0,-.09,.01,.15,.035,.13,mats.metal);
  return{root,palm,fingers,fore,sleeve,cuff};
 });
 const pivot=new T.Vector3(),grip=new T.Vector3(0,-.13,0),orbit=new T.Quaternion(),tilt=new T.Quaternion(),idleQ=new T.Quaternion(),targetQ=new T.Quaternion(),axisY=new T.Vector3(0,1,0),axisX=new T.Vector3(1,0,0),axisZ=new T.Vector3(0,0,1);
 function segment(mesh,a,b){mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=a.distanceTo(b);mesh.quaternion.setFromUnitVectors(axisY,b.clone().sub(a).normalize())}
 function equipPose(seconds,animate=true){
  const pose=sampleEquip(seconds);
  [left,right].forEach((knife,i)=>{
   const pos=i?pose.right:pose.left,angle=i?pose.rightAngle:pose.leftAngle;
   if(animate){const idlePos=knife.rig.position.clone();idleQ.copy(knife.rig.quaternion);
   // Horizontal orbit, tipped toward the camera; both blades sweep over open fingers.
   tilt.setFromAxisAngle(axisX,i?.34:-.38);orbit.setFromAxisAngle(axisY,angle);
   knife.rig.quaternion.copy(tilt).multiply(orbit).multiply(targetQ.setFromAxisAngle(axisZ,-Math.PI/2));
   targetQ.setFromEuler(new T.Euler(i?.08:-.16,i?-.15:.16,i?2.62:-1.08));
   knife.rig.quaternion.slerp(targetQ,pose.catch);
   pivot.fromArray(pos);pivot.y+=(1-pose.catch)*.18;knife.rig.position.copy(pivot).sub(grip.clone().applyQuaternion(knife.rig.quaternion));
   knife.rig.position.lerp(idlePos,pose.settle);knife.rig.quaternion.slerp(idleQ,pose.settle);}
   knife.palm.visible=false;
   const h=equipHands[i];h.root.visible=true;h.fore.visible=true;h.sleeve.visible=true;
   h.root.position.copy(grip).applyQuaternion(knife.rig.quaternion).add(knife.rig.position);if(animate)h.root.position.y-=(1-pose.catch)*.18;
   h.root.quaternion.setFromEuler(new T.Euler(-.25,i?-.25:.25,i?-.65:.65));
   knife.rig.updateMatrix();knife.palm.updateMatrix();const palmMatrix=knife.rig.matrix.clone().multiply(knife.palm.matrix);
   targetQ.setFromRotationMatrix(palmMatrix);h.root.quaternion.slerp(targetQ,pose.catch);
   h.fingers.forEach(({finger,joint},j)=>{finger.rotation.set((1-pose.open)*-1.25,0,(j-1.5)*.17*pose.open);joint.rotation.x=-(1-pose.open)*1.2});
   const wrist=new T.Vector3(0,-.1,.01).applyQuaternion(h.root.quaternion).add(h.root.position),elbow=new T.Vector3(i?.63:-.63,-.58,.22),shoulder=new T.Vector3(i?.90:-.90,-.83,.30);
   segment(h.fore,wrist,elbow);segment(h.sleeve,elbow,shoulder);
  });return pose;
 }
 const chainHand=hand();model.add(chainHand);chainHand.visible=false;
 const trails=[left,right].map(()=>{const geo=new T.BufferGeometry(),positions=new Float32Array(26*6),colors=new Float32Array(26*6),indices=[];const color=new T.Color(c.edge);for(let i=0;i<26;i++){const fade=Math.pow(1-i/26,1.5);for(let j=0;j<2;j++){const p=(i*2+j)*3;colors[p]=color.r*fade;colors[p+1]=color.g*fade;colors[p+2]=color.b*fade}if(i<25){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2)}}geo.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geo.setAttribute('color',new T.BufferAttribute(colors,3));geo.setIndex(indices);const material=new T.MeshBasicMaterial({color:c.edge,vertexColors:true,transparent:true,opacity:.5,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});const mesh=new T.Mesh(geo,material);mesh.frustumCulled=false;model.add(mesh);return{mesh,positions,history:[]}});
 const drops=[];const dropGeo=new T.OctahedronGeometry(.008);for(let i=0;i<16;i++){const m=new T.Mesh(dropGeo,mats.light);m.visible=false;model.add(m);drops.push(m)}
 let spin=0,inspectBlend=0,wasActive=false;const point=new T.Vector3(),tip=new T.Vector3(),inner=new T.Vector3(),start=new T.Vector3(),end=new T.Vector3(),tangent=new T.Vector3(),up=new T.Vector3(0,1,0),linkPoint=new T.Vector3();
 function update({dt=0,time=0,inspect=false,speed=1,equip=0,attack=-1,heavy=false,side=0,equipSeconds=null}={}){
  inspectBlend=T.MathUtils.damp(inspectBlend,inspect?1:0,12,dt);spin+=dt*(5.7+Math.max(0,speed-1)*3.5);const s=inspectBlend;
  left.rig.position.set(-.597,-.153,0);left.rig.rotation.set(-.16,.16,-1.08);right.rig.position.set(.677,-.343,.015);right.rig.rotation.set(.08,-.15,2.62);
  left.palm.visible=!showcase;right.palm.visible=!showcase&&s<.55;chainHand.visible=!showcase&&s>=.55;
  if(showcase){left.rig.position.set(-.25,0,0);left.rig.rotation.set(0,.12,-.62);right.rig.position.set(.28,.04,.06);right.rig.rotation.set(0,-.12,-.62)}
  if(s>.001){const angle=spin,center=new T.Vector3(.31,.18,-.03);right.rig.position.lerp(center.clone().add(new T.Vector3(Math.sin(angle)*.33,Math.cos(angle)*.36,Math.sin(angle)*.1)),s);right.rig.rotation.set(.1,Math.sin(angle)*.3,2.62*(1-s)-angle*s);chainHand.position.set(.31,.18,.05);chainHand.rotation.set(0,0,-.4);left.rig.position.y-=s*.03;}
  equipHands.forEach(h=>{h.root.visible=false;h.fore.visible=false;h.sleeve.visible=false});
  const equipping=equipSeconds!==null||equip>0;
  const equipTime=equipSeconds??(1-equip)*EQUIP_DURATION;
  const pose=equipping?equipPose(equipTime):null;
  if(equipping)chainHand.visible=false;
  if(attack>=0&&attack<1){const hit=Math.sin(Math.PI*attack),rig=side%2?left.rig:right.rig;if(heavy){rig.position.set(.10+Math.cos(attack*Math.PI)*.12,.03+hit*.25,-hit*.38);rig.rotation.set(-hit*1.2,0,-.7-hit*1.8);left.rig.position.x-=hit*.12;}else{rig.position.x+=(side%2?1:-1)*hit*.60;rig.position.y+=hit*.19;rig.rotation.z+=(side%2?-1:1)*hit*2.4;rig.position.z-=hit*.1;}}
  if(!showcase&&!equipping&&s<.01)equipPose(EQUIP_DURATION,false);
  left.rig.updateMatrix();right.rig.updateMatrix();start.set(0,-.335,0).applyMatrix4(left.rig.matrix);end.set(0,-.335,0).applyMatrix4(right.rig.matrix);
  const sag=equipping?.12+.20*pose.catch:(showcase?.38:.32)*(1-s)+s*.12;
  function chain(t,out){out.lerpVectors(start,end,t);out.y-=Math.sin(Math.PI*t)*sag;out.z-=Math.sin(Math.PI*t)*(.055+Math.sin(time*2+t*3)*.025);if(s>.01){const anchor=new T.Vector3(.31,.10,.075),guided=t<.62?start.clone().lerp(anchor,t/.62):anchor.clone().lerp(end,(t-.62)/.38);guided.y-=t<.62?Math.sin(t/.62*Math.PI)*.19:Math.sin((t-.62)/.38*Math.PI)*.025;out.lerp(guided,s)}return out}
  for(let i=0;i<links.length;i++){const t=i/(links.length-1),link=links[i];link.visible=!equipping||pose.frame>=30;chain(t,linkPoint);chain(Math.min(1,t+.01),point);if(i===links.length-1){chain(t-.01,point);tangent.subVectors(linkPoint,point)}else tangent.subVectors(point,linkPoint);link.position.copy(linkPoint);link.quaternion.setFromUnitVectors(up,tangent.normalize());link.rotateY(i%2?Math.PI/2:0);link.scale.set(1,1.4,1)}
  const active=(s>.03||pose?.water||(attack>=0&&attack<1));[left,right].forEach((knife,index)=>{const trail=trails[index];tip.set(0,.474,.024).applyMatrix4(knife.rig.matrix);inner.set(-.065,.12,.024).applyMatrix4(knife.rig.matrix);if(active){if(!wasActive)trail.history.length=0;for(const sample of trail.history)sample.age=(sample.age||0)+dt;trail.history=trail.history.filter(sample=>sample.age<.18);trail.history.unshift([tip.clone(),inner.clone()]);if(trail.history.length>26)trail.history.pop()}else trail.history.length=0;trail.mesh.visible=active&&trail.history.length>1;for(let j=0;j<26;j++){const pair=trail.history[Math.min(j,trail.history.length-1)]||[tip,inner];pair[0].toArray(trail.positions,j*6);pair[1].toArray(trail.positions,j*6+3)}trail.mesh.geometry.attributes.position.needsUpdate=true;});
  if(equipping){
   const savedPos=[left.rig.position.clone(),right.rig.position.clone()],savedQ=[left.rig.quaternion.clone(),right.rig.quaternion.clone()];
   for(const trail of trails)trail.history=[];
   for(let j=0;j<14;j++){
    const sampleTime=Math.max(0,equipTime-j/120);
    // Restore idle bases before evaluating each absolute sample.
    left.rig.position.set(-.597,-.153,0);left.rig.rotation.set(-.16,.16,-1.08);right.rig.position.set(.677,-.343,.015);right.rig.rotation.set(.08,-.15,2.62);
    equipPose(sampleTime);
    [left,right].forEach((knife,i)=>{knife.rig.updateMatrix();trails[i].history.push([new T.Vector3(0,.474,.024).applyMatrix4(knife.rig.matrix),new T.Vector3(-.008,.44,.024).applyMatrix4(knife.rig.matrix)])});
   }
   left.rig.position.set(-.597,-.153,0);left.rig.rotation.set(-.16,.16,-1.08);right.rig.position.set(.677,-.343,.015);right.rig.rotation.set(.08,-.15,2.62);equipPose(equipTime);
   [left,right].forEach((knife,i)=>{knife.rig.position.copy(savedPos[i]);knife.rig.quaternion.copy(savedQ[i]);const trail=trails[i];trail.mesh.visible=pose.water;for(let j=0;j<26;j++){const pair=trail.history[Math.min(j,13)];pair[0].toArray(trail.positions,j*6);pair[1].toArray(trail.positions,j*6+3)}trail.mesh.geometry.attributes.position.needsUpdate=true});
  }
  wasActive=active;
  for(let i=0;i<drops.length;i++){const d=drops[i];d.visible=active;const phase=(time*1.9+i*.173)%1,history=trails[i%2].history;const h=history[Math.min(history.length-1,Math.floor(phase*22))];if(h){d.position.copy(h[0]);d.position.x+=Math.sin(i*6.3+time)*.024;d.position.y-=phase*.07;d.scale.setScalar((1-phase)*.8)}}
 }
 update();function dispose(){const geometries=new Set(),materials=new Set();model.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material)});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}
 return{model,blade:right.blade,handle:right.rig,flash:null,magazine:null,update,dispose,accent:c.edge,variant:c.name};
}
