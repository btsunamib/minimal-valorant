import * as T from './three.module.js';
import {sampleNaru} from './narukami-motion.js';
export const NARU_VARIANTS={base:{name:'原色 · 碧蓝',edge:0x39c9ff,body:0x263c53,grip:0x503d41},purple:{name:'紫色 · 霆紫',edge:0xb398ff,body:0x383443,grip:0x343140},white:{name:'白色 · 清流',edge:0x8ff7ec,body:0xb8c2c6,grip:0x56636b},black:{name:'黑色 · 墨浪',edge:0xee596b,body:0x252730,grip:0x32232a}};
export function createNarukami(showcase=false,variant='base'){
 const c=NARU_VARIANTS[variant]||NARU_VARIANTS.base,model=new T.Group(),rig=new T.Group(),water=new T.Group(),hands=new T.Group();model.name='Kuronami Naru-Kami';model.add(rig,hands);rig.name='naru-knife';water.name='naru-water-blade';rig.add(water);
 const mat=(color,metalness=.6,roughness=.3)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const m={body:mat(c.body),dark:mat(0x101e2a),edge:mat(0xbdcad4,.9,.19),grip:mat(c.grip,.12,.85),glove:mat(0x1d2938,.1,.8),panel:mat(0x425c75,.3,.55),skin:mat(0x9b7266,0,.9),light:new T.MeshStandardMaterial({color:c.edge,emissive:c.edge,emissiveIntensity:1.8,roughness:.22,metalness:.25}),water:new T.MeshStandardMaterial({color:0x33689c,emissive:c.edge,emissiveIntensity:.28,transparent:true,opacity:.7,metalness:.65,roughness:.17,side:T.DoubleSide,depthWrite:false})};
 const cube=new T.BoxGeometry(1,1,1);
 function box(parent,x,y,z,w,h,d,material){const o=new T.Mesh(cube,material);o.position.set(x,y,z);o.scale.set(w,h,d);parent.add(o);return o;}
 function plate(parent,points,depth,material,z=0){const s=new T.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.0017,bevelThickness:.0015,bevelSegments:2,steps:1});g.translate(0,0,z-depth/2);const o=new T.Mesh(g,material);parent.add(o);return o;}
 const outline=[[-.045,0],[-.075,.075],[-.098,.12],[-.067,.28],[-.025,.46],[0,.55],[.035,.45],[.063,.30],[.073,.12],[.062,.06],[.047,.0]];
 plate(rig,outline,.036,m.body);
 for(const z of[-.021,.021]){
  plate(rig,[[-.045,.02],[-.084,.12],[-.055,.26],[0,.55],[-.036,.27],[-.058,.13],[-.026,.04]],.004,m.edge,z);
  plate(rig,[[.033,.02],[.065,.12],[.05,.28],[0,.55],[.062,.31],[.077,.12],[.048,0]],.004,m.edge,z);
  plate(rig,[[-.024,.03],[-.05,.13],[-.03,.30],[0,.51],[.046,.12],[.027,.02]],.006,m.dark,z*1.13);
  plate(rig,[[-.035,.08],[-.041,.13],[.0,.47],[-.021,.13],[-.01,.10],[.015,.11],[.026,.04],[.015,.025]],.004,m.light,z*1.27);
  // A small luminous water character, made from bevelled strokes on the steel face.
  for(const [x,y,h,a] of[[0,.071,.045,0],[-.013,.077,.028,-.7],[.015,.077,.029,.7],[-.012,.063,.027,.7],[.013,.061,.028,-.65]]){const stroke=box(rig,x,y,z*1.43,.004,h,.002,m.light);stroke.rotation.z=a;}
 }
 plate(rig,[[-.038,-.006],[-.035,-.23],[-.026,-.27],[.027,-.27],[.037,-.23],[.038,-.006]],.059,m.grip);
 for(let i=0;i<9;i++){const band=box(rig,0,-.025-i*.025,0,.081,.018,.067,m.grip);band.rotation.z=(i%2?1:-1)*.15;}
 box(rig,0,-.136,.036,.01,.233,.004,m.light);
 plate(rig,[[-.037,-.255],[-.055,-.31],[0,-.46],[.055,-.31],[.037,-.255]],.037,m.body);
 for(const z of[-.022,.022]){plate(rig,[[-.04,-.31],[0,-.44],[.04,-.31],[0,-.28]],.004,m.edge,z);plate(rig,[[-.029,-.312],[0,-.416],[.029,-.312],[0,-.29]],.005,m.dark,z*1.1);plate(rig,[[-.008,-.31],[0,-.395],[.008,-.31],[0,-.3]],.004,m.light,z*1.25);}
 // The physical blade remains fixed; the water extension grows out of its tip.
 water.position.y=.31;
 plate(water,[[-.046,0],[-.062,.12],[-.049,.31],[-.035,.56],[-.018,.74],[0,.87],[.020,.69],[.034,.48],[.043,.22],[.047,.06]],.021,m.water);
 const streams=[];
 for(let j=0;j<7;j++){const g=new T.BufferGeometry(),a=new Float32Array(41*3);g.setAttribute('position',new T.BufferAttribute(a,3));const line=new T.Line(g,new T.LineBasicMaterial({color:j%2?0xc7f7ff:c.edge,transparent:true,opacity:j<2?.95:.7,depthWrite:false}));water.add(line);streams.push(line);}
 function palm(parent,isLeft){const p=new T.Group();parent.add(p);p.name=isLeft?'naru-left-hand':'naru-right-hand';const back=box(p,0,-.02,.025,.125,.13,.07,m.glove),panel=box(p,0,-.03,-.018,.115,.084,.012,m.panel);const fingers=[];for(let i=0;i<4;i++){const a=new T.Group(),b=new T.Group();a.position.set((i-1.5)*.032,.033,.02);p.add(a);box(a,0,.028,0,.028,.058,.033,m.glove);b.position.y=.05;a.add(b);box(b,0,.024,0,.025,.045,.028,m.skin);fingers.push({a,b});}const thumb=box(p,isLeft?.071:-.071,-.01,.048,.036,.078,.035,m.skin);thumb.rotation.z=isLeft?.5:-.5;const cuff=box(p,0,-.115,.02,.138,.048,.095,m.glove);return {p,fingers,back,panel,thumb,cuff};}
 const right=palm(hands,false),left=palm(hands,true),fore=box(hands,0,0,0,.13,1,.12,m.glove),sleeve=box(hands,0,0,0,.18,1,.16,m.panel),lfore=box(hands,0,0,0,.13,1,.12,m.glove);
 function segment(o,a,b){o.position.copy(a).add(b).multiplyScalar(.5);o.scale.y=a.distanceTo(b);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());}
 const chips=new T.Group();chips.name='naru-droplets';model.add(chips);for(let i=0;i<22;i++)chips.add(new T.Mesh(new T.IcosahedronGeometry(.010+(i%3)*.003,0),m.light));
 const trailGeo=new T.BufferGeometry(),trailPositions=new Float32Array(28*6),indices=[];for(let i=0;i<27;i++)indices.push(i*2,i*2+1,i*2+2,i*2+1,i*2+3,i*2+2);trailGeo.setAttribute('position',new T.BufferAttribute(trailPositions,3));trailGeo.setIndex(indices);const trail=new T.Mesh(trailGeo,new T.MeshBasicMaterial({color:c.edge,transparent:true,opacity:.21,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}));trail.name='naru-water-trail';trail.frustumCulled=false;model.add(trail);
 function bladePoint(p,y){return new T.Vector3(-Math.sin(p.angle)*y,p.bolster[1]+Math.cos(p.angle)*y,.02).add(new T.Vector3(p.bolster[0],0,0));}
 function update({time=0,form='long',clip=null,seconds=0,attack=-1,heavy=false,side=0}={}){
  const opts={clip,seconds,form,attack,heavy,side};let p=sampleNaru(opts);
  if(showcase&&!clip){p={...p,bolster:[.04,-.10,0],angle:form==='long'?-.72:.50,twist:.15};}
  rig.position.fromArray(p.bolster);rig.rotation.set(0,0,p.angle);rig.rotateY(p.twist);rig.updateMatrix();water.visible=p.water>.001;water.scale.set(1,Math.max(.001,p.water),1);
  for(let j=0;j<streams.length;j++){const attr=streams[j].geometry.attributes.position;for(let i=0;i<=40;i++){const t=i/40,y=t*.87,w=(1-t)*.049,x=(j<2?(j===0?-1:1):Math.sin(t*15+time*6+j*1.7)*.75)*w;attr.setXYZ(i,x,y,.018+Math.sin(t*18-time*4+j)*.003);}attr.needsUpdate=true;}
  hands.visible=!showcase||!!clip;
  const grip=p.kunaiGrip,blend=(a,b)=>a+(b-a)*grip;
  right.p.position.copy(new T.Vector3(0,-.135,.055).applyMatrix4(rig.matrix)).lerp(rig.position,grip);
  right.p.rotation.set(-.35,-.22,p.angle-.55);
  right.p.quaternion.slerp(rig.quaternion,grip);
  function part(o,from,to){o.position.set(...from.slice(0,3).map((v,i)=>blend(v,to[i])));o.scale.set(...from.slice(3).map((v,i)=>blend(v,to[i+3])));}
  part(right.back,[0,-.02,.025,.125,.13,.07],[.10,-.135,.065,.16,.235,.11]);
  part(right.panel,[0,-.03,-.018,.115,.084,.012],[.10,-.13,.126,.14,.19,.012]);
  part(right.thumb,[-.071,-.01,.048,.036,.078,.035],[-.002,-.015,.060,.052,.105,.048]);right.thumb.rotation.z=blend(-.5,-.70);
  part(right.cuff,[0,-.115,.02,.138,.048,.095],[.10,-.27,.06,.18,.06,.13]);
  right.fingers.forEach(({a,b},i)=>{
   a.position.set(blend((i-1.5)*.032,.043),blend(.033,-.045-i*.048),blend(.02,.068));
   a.rotation.set(blend(-1.35*(1-p.open),0),0,blend((i-1.5)*p.open*.12,Math.PI/2));
   b.rotation.x=blend(-1.18*(1-p.open),-1.5);
  });
  left.p.position.fromArray(p.left);left.p.rotation.set(-.40,.10,-.68);left.p.scale.setScalar(blend(1,1.85));
  left.fingers.forEach(({a,b},i)=>{a.rotation.set(i<2?blend(-.18,.10):-1.05,0,(i-1.5)*.10);b.rotation.x=i<2?-.08:-1.1;});
  const wrist=right.p.position.clone().add(new T.Vector3(blend(.015,.10),blend(-.09,-.30),blend(.035,.06)).applyQuaternion(right.p.quaternion)),elbow=new T.Vector3(blend(.87,1.05),blend(-.83,-1.04),.17);
  fore.scale.x=blend(.13,.18);fore.scale.z=blend(.12,.15);segment(fore,wrist,elbow);segment(sleeve,elbow,new T.Vector3(1.15,blend(-1.09,-1.20),.35));
  lfore.scale.x=blend(.13,.20);lfore.scale.z=blend(.12,.16);segment(lfore,left.p.position.clone().add(new T.Vector3(-.03,-.1,.02).multiplyScalar(left.p.scale.x)),new T.Vector3(blend(-1.14,-1.24),blend(-.92,-1.02),.15));
  chips.visible=p.droplets>0;for(let i=0;i<chips.children.length;i++){const n=i/21,progress=clip==='toKunai'?p.dissolving:p.forming,point=bladePoint(p,.34+n*.70);chips.children[i].position.copy(point).add(new T.Vector3(Math.sin(i*3.1+progress*8)*.06,-progress*.10+Math.cos(i)*.03,.035+Math.sin(i)*.04));chips.children[i].scale.setScalar(p.droplets*(.4+n));}
  trail.visible=p.trail;
  if(p.trail){for(let i=0;i<28;i++){const q=sampleNaru({...opts,seconds:Math.max(0,seconds-i/240),attack:attack>=0?Math.max(0,attack-i*.012):-1}),a=bladePoint(q,.5+q.water*.62),b=bladePoint(q,.25+q.water*.34);trailPositions.set([a.x,a.y,a.z,b.x,b.y,b.z],i*6);}trailGeo.attributes.position.needsUpdate=true;}
  model.userData.form=p.water>.5?'long':'kunai';model.userData.stage=p.stage;
 }
 function dispose(){const gs=new Set(),ms=new Set();model.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material)});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
 update();return {model,blade:rig,handle:rig,flash:null,magazine:null,update,dispose};
}
