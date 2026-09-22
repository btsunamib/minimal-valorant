import * as T from './three.module.js';
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
 const chainHand=hand();model.add(chainHand);chainHand.visible=false;
 const trails=[left,right].map(()=>{const geo=new T.BufferGeometry(),positions=new Float32Array(26*6),colors=new Float32Array(26*6),indices=[];const color=new T.Color(c.edge);for(let i=0;i<26;i++){const fade=Math.pow(1-i/26,1.5);for(let j=0;j<2;j++){const p=(i*2+j)*3;colors[p]=color.r*fade;colors[p+1]=color.g*fade;colors[p+2]=color.b*fade}if(i<25){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2)}}geo.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geo.setAttribute('color',new T.BufferAttribute(colors,3));geo.setIndex(indices);const material=new T.MeshBasicMaterial({color:c.edge,vertexColors:true,transparent:true,opacity:.5,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});const mesh=new T.Mesh(geo,material);mesh.frustumCulled=false;model.add(mesh);return{mesh,positions,history:[]}});
 const drops=[];const dropGeo=new T.OctahedronGeometry(.008);for(let i=0;i<16;i++){const m=new T.Mesh(dropGeo,mats.light);m.visible=false;model.add(m);drops.push(m)}
 let spin=0,inspectBlend=0,wasActive=false;const point=new T.Vector3(),tip=new T.Vector3(),inner=new T.Vector3(),start=new T.Vector3(),end=new T.Vector3(),tangent=new T.Vector3(),up=new T.Vector3(0,1,0),linkPoint=new T.Vector3();
 function update({dt=0,time=0,inspect=false,speed=1,equip=0,attack=-1,heavy=false,side=0}={}){
  inspectBlend=T.MathUtils.damp(inspectBlend,inspect?1:0,12,dt);spin+=dt*(5.7+Math.max(0,speed-1)*3.5);const s=inspectBlend;
  left.rig.position.set(-.40,-.035,0);left.rig.rotation.set(-.16,.16,-1.08);right.rig.position.set(.44,.08,.015);right.rig.rotation.set(.08,-.15,2.62);
  left.palm.visible=!showcase;right.palm.visible=!showcase&&s<.55;chainHand.visible=!showcase&&s>=.55;
  if(showcase){left.rig.position.set(-.25,0,0);left.rig.rotation.set(0,.12,-.62);right.rig.position.set(.28,.04,.06);right.rig.rotation.set(0,-.12,-.62)}
  if(s>.001){const angle=spin,center=new T.Vector3(.31,.18,-.03);right.rig.position.lerp(center.clone().add(new T.Vector3(Math.sin(angle)*.33,Math.cos(angle)*.36,Math.sin(angle)*.1)),s);right.rig.rotation.set(.1,Math.sin(angle)*.3,2.62*(1-s)-angle*s);chainHand.position.set(.31,.18,.05);chainHand.rotation.set(0,0,-.4);left.rig.position.y-=s*.03;}
  if(equip>0){const e=1-equip,w=Math.sin(e*Math.PI);left.rig.position.y-=equip*.5;right.rig.position.set(.44-w*.4,.08-equip*.25+Math.sin(e*Math.PI*2)*.18,-w*.08);right.rig.rotation.z+=equip*Math.PI*4;left.rig.rotation.z-=equip*1.6;}
  if(attack>=0&&attack<1){const hit=Math.sin(Math.PI*attack),rig=side%2?left.rig:right.rig;if(heavy){rig.position.set(.10+Math.cos(attack*Math.PI)*.12,.03+hit*.25,-hit*.38);rig.rotation.set(-hit*1.2,0,-.7-hit*1.8);left.rig.position.x-=hit*.12;}else{rig.position.x+=(side%2?1:-1)*hit*.60;rig.position.y+=hit*.19;rig.rotation.z+=(side%2?-1:1)*hit*2.4;rig.position.z-=hit*.1;}}
  left.rig.updateMatrix();right.rig.updateMatrix();start.set(0,-.335,0).applyMatrix4(left.rig.matrix);end.set(0,-.335,0).applyMatrix4(right.rig.matrix);
  const sag=(showcase?.38:.32)*(1-s)+s*.12;
  function chain(t,out){out.lerpVectors(start,end,t);out.y-=Math.sin(Math.PI*t)*sag;out.z-=Math.sin(Math.PI*t)*(.055+Math.sin(time*2+t*3)*.025);if(s>.01){const anchor=new T.Vector3(.31,.10,.075),guided=t<.62?start.clone().lerp(anchor,t/.62):anchor.clone().lerp(end,(t-.62)/.38);guided.y-=t<.62?Math.sin(t/.62*Math.PI)*.19:Math.sin((t-.62)/.38*Math.PI)*.025;out.lerp(guided,s)}return out}
  for(let i=0;i<links.length;i++){const t=i/(links.length-1),link=links[i];chain(t,linkPoint);chain(Math.min(1,t+.01),point);if(i===links.length-1){chain(t-.01,point);tangent.subVectors(linkPoint,point)}else tangent.subVectors(point,linkPoint);link.position.copy(linkPoint);link.quaternion.setFromUnitVectors(up,tangent.normalize());link.rotateY(i%2?Math.PI/2:0);link.scale.set(1,1.4,1)}
  const active=(s>.03||equip>0||(attack>=0&&attack<1));[left,right].forEach((knife,index)=>{const trail=trails[index];tip.set(0,.474,.024).applyMatrix4(knife.rig.matrix);inner.set(-.065,.12,.024).applyMatrix4(knife.rig.matrix);if(active){if(!wasActive)trail.history.length=0;for(const sample of trail.history)sample.age=(sample.age||0)+dt;trail.history=trail.history.filter(sample=>sample.age<.18);trail.history.unshift([tip.clone(),inner.clone()]);if(trail.history.length>26)trail.history.pop()}else trail.history.length=0;trail.mesh.visible=active&&trail.history.length>1;for(let j=0;j<26;j++){const pair=trail.history[Math.min(j,trail.history.length-1)]||[tip,inner];pair[0].toArray(trail.positions,j*6);pair[1].toArray(trail.positions,j*6+3)}trail.mesh.geometry.attributes.position.needsUpdate=true;});wasActive=active;
  for(let i=0;i<drops.length;i++){const d=drops[i];d.visible=active;const phase=(time*1.9+i*.173)%1,history=trails[i%2].history;const h=history[Math.min(history.length-1,Math.floor(phase*22))];if(h){d.position.copy(h[0]);d.position.x+=Math.sin(i*6.3+time)*.024;d.position.y-=phase*.07;d.scale.setScalar((1-phase)*.8)}}
 }
 update();function dispose(){const geometries=new Set(),materials=new Set();model.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material)});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}
 return{model,blade:right.blade,handle:right.rig,flash:null,magazine:null,update,dispose,accent:c.edge,variant:c.name};
}
