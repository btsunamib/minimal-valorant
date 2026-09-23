import * as T from './three.module.js';
import {sampleChaosReload,CHAOS_RELOAD_DURATION} from './chaos-reload.js';
import {sampleChaosEquip} from './chaos-equip.js';
export const CHAOS_VARIANTS={base:{name:'原色 · 蓝紫',shell:0x292832,trim:0xa98047,edge:0x793c91,energy:0x39cfff},green:{name:'绿色',shell:0x264735,trim:0xc3a873,edge:0x63915c,energy:0x77ffe0},white:{name:'白色',shell:0xc3c4c8,trim:0x9c7647,edge:0x938784,energy:0xffaa53},blue:{name:'蓝色',shell:0x283d58,trim:0xa7aebb,edge:0x397aca,energy:0x76b7ff}};
export function createChaos(showcase=false,variant='base'){
 const c=CHAOS_VARIANTS[variant]||CHAOS_VARIANTS.base,model=new T.Group(),rig=new T.Group();model.name='Prelude to Chaos Vandal';model.add(rig);const resources=new Set(),materials=new Set();
 const mat=(color,metal=.7,glow=0)=>{const m=new T.MeshStandardMaterial({color,metalness:metal,roughness:.32,emissive:glow?color:0,emissiveIntensity:glow});materials.add(m);return m;};
 const dark=mat(c.shell),black=mat(0x12161c,.35),steel=mat(0x9d9ba2,.9),gold=mat(c.trim,.82),purple=mat(c.edge,.8),light=mat(c.energy,.45,2),pink=mat(0xbd42fc,.5,1.2),glove=mat(0x273139,.1),skin=mat(0xb49179,.1);
 const cube=new T.BoxGeometry(1,1,1);resources.add(cube);
 function mesh(g,geo,m,x=0,y=0,z=0){resources.add(geo);const a=new T.Mesh(geo,m);a.position.set(x,y,z);g.add(a);return a;}
 function box(g,x,y,z,w,h,d,m){const a=mesh(g,cube,m,x,y,z);a.scale.set(w,h,d);return a;}
 function cyl(g,x,y,z,r,h,m,axis='y',r2=r){const a=mesh(g,new T.CylinderGeometry(r,r2,h,16),m,x,y,z);if(axis==='z')a.rotation.x=Math.PI/2;if(axis==='x')a.rotation.z=Math.PI/2;return a;}
 function torus(g,x,y,z,r,t,m,axis='y'){const a=mesh(g,new T.TorusGeometry(r,t,6,24),m,x,y,z);if(axis==='y')a.rotation.x=Math.PI/2;if(axis==='x')a.rotation.y=Math.PI/2;return a;}
 function plate(g,pts,w,m,x=0,holes=[]){const s=new T.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(-z,y):s.moveTo(-z,y));s.closePath();for(const pts of holes){const h=new T.Path();pts.forEach(([z,y],i)=>i?h.lineTo(-z,y):h.moveTo(-z,y));h.closePath();s.holes.push(h)}const geo=new T.ExtrudeGeometry(s,{depth:w,bevelEnabled:true,bevelSegments:1,bevelSize:.0025,bevelThickness:.0025,steps:1});geo.translate(0,0,-w/2);geo.rotateY(Math.PI/2);return mesh(g,geo,m,x);}
 // Broad armored receiver, low rail and open triangular shoulder stock.
 plate(rig,[[.10,.075],[-.17,.075],[-.34,.025],[-.33,-.102],[-.16,-.135],[.09,-.055]],.142,dark);
 plate(rig,[[.08,.08],[.30,.105],[.48,.058],[.49,-.18],[.41,-.18],[.24,-.09],[.09,-.057]],.106,dark,0,[[[.24,.023],[.40,.023],[.395,-.09],[.26,-.045]]]);
 box(rig,0,-.052,.49,.123,.25,.028,black);box(rig,0,.09,.29,.112,.018,.31,purple);
 plate(rig,[[.067,-.055],[-.025,-.084],[-.036,-.16],[.026,-.30],[.111,-.278],[.063,-.12]],.079,black);
 plate(rig,[[-.035,-.08],[-.139,-.09],[-.14,-.19],[-.014,-.19],[-.012,-.171],[-.12,-.166],[-.12,-.112],[-.025,-.103]],.026,steel);
 box(rig,0,-.132,-.063,.018,.065,.021,black).rotation.x=.4;
 // Long layered shroud, blade-like lower fins and gold barrel clamps.
 plate(rig,[[-.27,.09],[-.76,.066],[-.88,.025],[-.80,-.067],[-.29,-.07]],.103,dark);
 cyl(rig,0,.025,-.89,.029,.13,steel,'z');cyl(rig,0,.025,-.96,.037,.072,dark,'z');cyl(rig,0,.025,-1,.023,.008,black,'z');
 for(const side of[-1,1]){
  plate(rig,[[-.28,-.008],[-.87,-.055],[-.76,-.117],[-.36,-.078]],.016,steel,side*.067);
  plate(rig,[[-.33,-.046],[-.77,-.09],[-.82,-.146],[-.70,-.103],[-.34,-.074]],.014,dark,side*.083);
  plate(rig,[[.45,.07],[.10,.092],[-.12,.08],[-.16,.058],[.30,.055]],.009,purple,side*.057);
  box(rig,side*.078,.029,-.02,.01,.008,.25,gold);
  // Receiver cheek shell with brass glyphs, recessed ports, trim and bolts.
  plate(rig,[[.067,.03],[-.14,.033],[-.26,-.025],[-.18,-.083],[.055,-.042]],.009,black,side*.082);
  for(let i=0;i<3;i++){box(rig,side*.090,-.01,.007-i*.038,.005,.031,.006,gold);box(rig,side*.090,.007,-.003-i*.038,.005,.005,.024,gold);box(rig,side*.090,-.012,-.010-i*.038,.005,.027,.006,gold);}
  for(const z of[.055,-.19,-.34,-.75])cyl(rig,side*.084,-.035,z,.007,.006,gold,'x');
  for(let i=0;i<4;i++)box(rig,side*.042,-.17-i*.025,.04+i*.009,.004,.008,.067,dark);
  for(const z of[-.48,-.69]){box(rig,side*.057,.046,z,.013,.09,.025,gold);box(rig,side*.037,.093,z,.047,.013,.025,gold)}
  cyl(rig,side*.048,.062,-.49,.011,.49,steel,'z');
  for(let j=0;j<3;j++)cyl(rig,side*.083,.006-j*.016,.082,.008,.095,gold,'z');
 }
 box(rig,0,.105,-.005,.07,.018,.08,black);box(rig,0,.12,-.008,.019,.009,.014,pink);box(rig,0,.084,-.79,.014,.028,.022,gold);box(rig,0,.102,-.79,.008,.008,.014,pink);
 const magazine=new T.Group();rig.add(magazine);plate(magazine,[[-.14,-.10],[-.275,-.10],[-.28,-.23],[-.244,-.38],[-.158,-.398],[-.112,-.34],[-.155,-.19]],.09,dark);
 for(const side of[-1,1]){plate(magazine,[[-.164,-.13],[-.245,-.13],[-.244,-.25],[-.20,-.355],[-.167,-.35],[-.187,-.22]],.009,purple,side*.049);for(let i=0;i<4;i++)box(magazine,side*.056,-.165-i*.047,-.203+i*.004,.004,.007,.054,pink)}
 // The defining vertical reactor and smaller rear power socket.
 const reactor=new T.Group();reactor.position.set(0,.055,-.23);rig.add(reactor);
 mesh(reactor,new T.CylinderGeometry(.099,.099,.113,24,1,true),black,0,-.035,0);cyl(reactor,0,-.082,0,.091,.009,black);cyl(reactor,0,-.067,0,.105,.018,steel);
 const collar=new T.Group();reactor.add(collar);torus(collar,0,.023,0,.094,.012,dark);for(let i=0;i<4;i++){const a=i*Math.PI/2;box(collar,Math.cos(a)*.094,.022,Math.sin(a)*.094,.02,.019,.013,gold)}torus(reactor,0,.022,0,.079,.004,gold);
 for(let i=0;i<16;i++){const a=i*Math.PI/8;const rib=box(reactor,Math.cos(a)*.077,.01,Math.sin(a)*.077,.008,.037,.008,gold);rib.rotation.y=-a;}
 cyl(reactor,0,-.016,0,.058,.009,light);for(const side of[-1,1]){box(reactor,side*.102,-.037,0,.011,.028,.022,pink);box(reactor,side*.089,-.112,.016,.012,.065,.016,gold)}
 const orb=mesh(reactor,new T.IcosahedronGeometry(.051,1),mat(0x283967,.5,.35),0,.039,0);
 const orbRings=[];for(let i=0;i<3;i++){const r=torus(orb,0,0,0,.052,.0015,light,'z');r.rotation.set(i*.9,.4+i,0);orbRings.push(r);}
 const flames=new T.Group();reactor.add(flames);for(let i=0;i<8;i++){const a=i*Math.PI/4,r=.044;const ray=mesh(flames,new T.ConeGeometry(.009,.085,3),light,Math.cos(a)*r,.021,Math.sin(a)*r);ray.rotation.z=Math.cos(a)*.4;ray.rotation.x=Math.sin(a)*.4;}
 const rear=new T.Group();rear.position.set(0,.081,.17);rig.add(rear);cyl(rear,0,0,0,.052,.016,black);torus(rear,0,.009,0,.043,.006,gold);cyl(rear,0,.012,0,.033,.009,light);const spark=mesh(rear,new T.IcosahedronGeometry(.022,0),light,0,.024,0);
 const energyLines=[];for(const side of[-1,1]){const pts=Array.from({length:18},(_,i)=>new T.Vector3(side*.064,.02,-.34-i*.027));const geo=new T.BufferGeometry().setFromPoints(pts),m=new T.LineBasicMaterial({color:c.energy});resources.add(geo);materials.add(m);const line=new T.Line(geo,m);line.frustumCulled=false;rig.add(line);energyLines.push({line,side})}
 const flash=new T.Group();flash.position.set(0,.025,-1.01);rig.add(flash);for(let i=0;i<3;i++){const b=mesh(flash,new T.ConeGeometry(.037-i*.008,.17,4),i===1?pink:light,0,0,-.055);b.rotation.x=-Math.PI/2;b.rotation.z=i*Math.PI/3}flash.visible=false;
 function hand(name){const h=new T.Group();h.name=name;const palm=box(h,0,0,0,.092,.049,.078,glove);box(h,0,.026,0,.078,.009,.062,black);const fingers=[];for(let i=0;i<4;i++){const root=new T.Group();root.position.set(-.034+i*.023,0,-.037);h.add(root);box(root,0,0,-.019,.019,.022,.037,skin);const joint=new T.Group();joint.position.z=-.036;root.add(joint);box(joint,0,0,-.014,.017,.02,.028,skin);box(joint,0,.011,-.02,.011,.001,.01,black);fingers.push({root,joint});}const thumb=new T.Group();thumb.position.set(.052,-.005,.016);h.add(thumb);box(thumb,0,0,-.026,.024,.027,.055,skin);const forearm=box(h,0,-.028,.155,.085,.085,.24,glove);h.userData.fingers=fingers;h.userData.thumb=thumb;h.userData.forearm=forearm;return h}
 function curl(h,n){h.userData.fingers.forEach(({root,joint},i)=>{root.rotation.x=-n*(.5+i*.04);joint.rotation.x=-n*1.35;});h.userData.thumb.rotation.set(-n*.7,-.5,0);}
 const right=hand('chaos-right-hand'),left=hand('chaos-left-hand');rig.add(right,left);right.position.set(.035,-.19,.026);left.position.set(-.015,-.09,-.52);left.rotation.z=-.35;right.visible=left.visible=!showcase;curl(right,.85);curl(left,.85);
 // A separate unlit replacement stone is held by the right palm until insertion.
 const heldCore=mesh(right,new T.IcosahedronGeometry(.048,1),mat(0x391736,.75,.12),0,0,-.048);heldCore.name='chaos-held-core';heldCore.visible=false;
 const chips=new T.Group();chips.name='chaos-reload-shards';reactor.add(chips);const chipMat=mat(0x682173,.65,.55),chipGeo=new T.IcosahedronGeometry(.017,0),chipData=[];
 for(let i=0;i<24;i++){const a=i*2.39996323,r=.02+(i%5)*.011,m=mesh(chips,chipGeo,chipMat);chipData.push({m,a,r,s:.5+(i%4)*.23});}
 const jets=new T.Group();jets.name='chaos-reload-energy';reactor.add(jets);const jetMat=mat(0xe131ff,.1,3);for(let i=0;i<7;i++){const a=i*2.39996323,j=mesh(jets,new T.ConeGeometry(.004+i%2*.003,.26,3),jetMat,Math.cos(a)*.035,.13,Math.sin(a)*.035);j.rotation.z=Math.cos(a)*.15;j.rotation.x=Math.sin(a)*.15;}
 chips.visible=jets.visible=false;
 const pointer=new T.Group();model.add(pointer);box(pointer,0,0,0,.083,.10,.036,skin);box(pointer,.030,.094,0,.020,.10,.021,skin);for(let i=0;i<3;i++)box(pointer,-.034+i*.022,.033,.022,.02,.034,.028,skin);box(pointer,0,-.115,.033,.095,.17,.065,glove);pointer.visible=false;
 return{model,flash,magazine,blade:null,handle:null,update({time=0,equipSeconds=null,inspect=0,reload=0,reloadSeconds=null,heat=0}={}){
  const p=equipSeconds===null?null:sampleChaosEquip(equipSeconds);rig.position.set(...(p?.position||[0,0,0]));rig.rotation.set(...(p?.rotation||[0,0,0]));
  if(inspect){rig.rotation.y=.62*Math.sin(inspect*Math.PI);rig.rotation.z=-.23*Math.sin(inspect*Math.PI);rig.position.x=-.1*Math.sin(inspect*Math.PI)}
  const sampledReload=reloadSeconds!==null?sampleChaosReload(reloadSeconds):reload>0?sampleChaosReload(reload*CHAOS_RELOAD_DURATION):null;const rp=sampledReload&&sampledReload.frame<156?sampledReload:null;
  magazine.position.set(0,0,0);magazine.rotation.set(0,0,0);
  right.position.set(.035,-.19,.026);right.rotation.set(0,0,0);left.position.set(-.015,-.09,-.52);left.rotation.set(0,0,-.35);curl(right,.85);curl(left,.85);
  chips.visible=!!rp&&rp.burstVisible;jets.visible=!!rp&&rp.beam>0;heldCore.visible=!!rp&&rp.heldCore;collar.rotation.y=rp?.collar||0;
  if(!rp||!rp.burstVisible){jets.scale.y=1;for(const {m} of chipData){m.position.set(0,0,0);m.rotation.set(0,0,0);m.scale.setScalar(1)}}
  if(rp){rig.position.set(...rp.position);rig.rotation.set(...rp.rotation);right.position.set(...rp.right.position);right.rotation.set(...rp.right.rotation);left.position.set(...rp.left.position);left.rotation.set(...rp.left.rotation);curl(right,rp.right.curl);curl(left,rp.left.curl);
   jets.scale.y=rp.beam;jetMat.emissiveIntensity=2+rp.beam*2;const u=rp.burst;
   if(rp.burstVisible)for(let i=0;i<chipData.length;i++){const {m,a,r,s}=chipData[i];m.position.set(Math.cos(a+u*.8)*r*(1+u*3),.04+u*(.30+(i%6)*.025),Math.sin(a+u*.8)*r*(1+u*3));m.rotation.set(u*5+i,u*4+i*.3,u*3);m.scale.setScalar(s*(1-Math.max(0,(rp.frame-36)/22)));}
  }

  pointer.visible=!showcase&&!!p&&p.point>.01;pointer.position.set(-.19+(p?.point||0)*.035,-.02+(p?.point||0)*.065,-.28);pointer.rotation.z=-.3;pointer.scale.setScalar(.95);left.visible=!showcase&&(!!rp||!p||p.point<.12);if(rp)pointer.visible=false;
  const power=rp?(rp.frame<12?1-rp.frame/12:rp.ignite):p?p.energy:1;flames.scale.y=.15+power*(.75+Math.sin(time*9)*.18);flames.visible=power>.01;orb.scale.setScalar(.4+power*.6);orb.position.y=.035+(inspect?Math.sin(inspect*Math.PI)*.11:0)+Math.sin(time*4)*.003;orb.rotation.set(time*.4,time*.7,0);spark.rotation.y=time*2;
  if(rp){orb.visible=rp.oldCore||rp.newCore;orb.position.y=rp.newCore?.035+(1-rp.seat)*.06:.035;}else orb.visible=true;
  const reloadWarm=rp&&rp.frame<104;light.emissiveIntensity=.3+power*1.8+heat*2;light.color.setHex(reloadWarm||heat>.1?0xdc35ff:c.energy);light.emissive.copy(light.color);pink.emissiveIntensity=.6+heat;
  for(const {line,side} of energyLines){const a=line.geometry.attributes.position;for(let i=0;i<18;i++)a.setXYZ(i,side*(.064+Math.sin(i*.6+time*9)*.004),.025+Math.sin(i*.8-time*7)*.013*power,-.34-i*.027);a.needsUpdate=true;line.visible=power>.05;line.material.color.copy(light.color)}
 },dispose(){for(const g of resources)g.dispose();for(const m of materials)m.dispose();}};
}
