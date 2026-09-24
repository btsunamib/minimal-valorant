import * as T from './three.module.js';
import {WEAPONS} from './rules.js';
// Individual proportions: barrel end, receiver end, stock end, receiver height, width.
export const GUN_SHAPES={classic:[-.25,-.15,.12,.09,.095],shorty:[-.35,-.14,.08,.10,.11],frenzy:[-.26,-.13,.10,.12,.095],ghost:[-.48,-.21,.13,.078,.083],bandit:[-.27,-.16,.10,.10,.097],sheriff:[-.39,-.24,.12,.11,.115],stinger:[-.47,-.34,.30,.12,.105],spectre:[-.71,-.39,.35,.11,.11],bucky:[-.81,-.38,.42,.09,.12],judge:[-.61,-.32,.36,.14,.145],bulldog:[-.62,-.34,.30,.16,.14],guardian:[-.87,-.44,.39,.11,.11],phantom:[-.86,-.49,.40,.12,.12],vandal:[-.80,-.44,.40,.12,.13],marshal:[-1.02,-.52,.45,.08,.095],outlaw:[-.91,-.38,.44,.105,.14],operator:[-1.12,-.52,.46,.15,.16],ares:[-.92,-.47,.40,.16,.16],odin:[-1.00,-.47,.46,.19,.20]};
const smooth=(a,b,t)=>{t=T.MathUtils.clamp((t-a)/(b-a),0,1);return t*t*(3-2*t)};
export function sampleGunDraw(id,seconds){const w=WEAPONS[id],t=T.MathUtils.clamp(seconds/(w.equip||1),0,1),lift=smooth(0,.42,t),settle=smooth(.62,1,t),check=Math.sin(smooth(.3,.76,t)*Math.PI);return{position:[.10*(1-lift),-.46*(1-lift)+.025*check,.17*(1-lift)],rotation:[-.65*(1-lift)+.08*check,-.20*(1-lift),-.65*(1-lift)-.15*check*(1-settle)],bolt:Math.sin(smooth(.4,.76,t)*Math.PI)*.052,hand:check,phase:t<.35?'抬枪':t<.73?(w.scope?'复位枪栓':w.slot==='sidearm'?'检查套筒':'拉动拉机柄'):'握持就位'};}
export function createArsenalGun(id,skin,showcase=false){
 const w=WEAPONS[id],v=GUN_SHAPES[id];if(!v)throw Error('Unknown gun '+id);const [front,foreEnd,back,h,width]=v,pistol=w.slot==='sidearm',shotgun=['shorty','bucky','judge'].includes(id),heavy=['ares','odin'].includes(id),bull=id==='bulldog';
 const model=new T.Group(),root=new T.Group();model.name='Arsenal '+id;model.add(root);const materials=[],geometries=[],boxgeo=new T.BoxGeometry(1,1,1);geometries.push(boxgeo);
 const mat=(color,metal=.6)=>{const m=new T.MeshStandardMaterial({color,metalness:metal,roughness:metal>.5?.36:.78});materials.push(m);return m;},dark=mat(skin.standard?0x373b3d:skin.dark),edge=mat(0x767c80),black=mat(0x171d22,.18),steel=mat(0x939ba0,.85),accent=mat(skin.standard?0x777867:skin.color),glove=mat(0x293942,.1),skinmat=mat(0xbd9575,.05);
 function mesh(geo,m,parent=root){geometries.push(geo);const o=new T.Mesh(geo,m);parent.add(o);return o;}
 function box(x,y,z,a,b,c,m=dark,parent=root){const o=new T.Mesh(boxgeo,m);o.position.set(x,y,z);o.scale.set(a,b,c);parent.add(o);return o;}
 function cylinder(x,y,z,r,len,m=dark,axis='z',parent=root){const o=mesh(new T.CylinderGeometry(r,r,len,16),m,parent);o.rotation.x=axis==='z'?Math.PI/2:0;o.rotation.z=axis==='x'?Math.PI/2:0;o.position.set(x,y,z);return o;}
 function profile(points,d,m=dark,parent=root,side=0,holes=[]){const s=new T.Shape();points.forEach(([z,y],i)=>i?s.lineTo(-z,y):s.moveTo(-z,y));s.closePath();for(const pts of holes){const p=new T.Path();pts.forEach(([z,y],i)=>i?p.lineTo(-z,y):p.moveTo(-z,y));p.closePath();s.holes.push(p);}const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2,steps:1});g.translate(0,0,-d/2);g.rotateY(Math.PI/2);const o=mesh(g,m,parent);o.position.x=side;return o;}
 const bolt=new T.Group();root.add(bolt);bolt.name='charging mechanism';const magazine=new T.Group();root.add(magazine);magazine.name='magazine';let barrelGroup=root;
 // Trigger and angled pistol grip are separate from the upper receiver.
 profile([[.035,-.035],[-.05,-.04],[-.04,-.14],[.005,-.255],[.10,-.25],[.07,-.06]],.075,black);
 for(let i=0;i<6;i++)box(.04,-.09-i*.023,.035+i*.006,.008,.01,.065,edge);
 profile([[-.05,-.06],[-.145,-.06],[-.16,-.155],[-.04,-.16]],.025,edge,root,0,[[[-.059,-.078],[-.13,-.078],[-.137,-.139],[-.05,-.139]]]);box(0,-.10,-.077,.017,.044,.014,black).rotation.x=.25;
 if(pistol){
  if(id==='sheriff'){
   profile([[.11,.06],[-.25,.06],[-.26,.0],[-.21,-.075],[.04,-.085]],.064,dark);
   cylinder(0,-.004,-.10,.061,.13,edge,'z',magazine);for(let i=0;i<6;i++){const a=i*Math.PI/3;cylinder(Math.cos(a)*.044,Math.sin(a)*.044-.004,-.10,.012,.134,black,'z',magazine);}cylinder(0,.027,-.30,.03,.19,dark);box(0,.05,-.30,.046,.04,.20,dark);box(0,.09,-.32,.012,.025,.05,black);
  }else if(id==='shorty'){
   barrelGroup=new T.Group();root.add(barrelGroup);barrelGroup.position.z=-.12;
   for(const x of[-.033,.033]){cylinder(x,.008,-.095,.03,.23,edge,'z',barrelGroup);cylinder(x,.008,-.217,.021,.006,black,'z',barrelGroup);}profile([[.09,.045],[-.15,.045],[-.14,-.075],[.045,-.09]],.10,dark);box(0,-.06,-.22,.106,.052,.14,black);
  }else{
   profile([[.12,h/2],[foreEnd-.04,h/2],[foreEnd-.08,.005],[foreEnd-.065,-h/2],[.10,-h/2]],width,dark,bolt);profile([[.10,-.035],[foreEnd,-.035],[foreEnd,-.072],[.05,-.09]],width*.94,black);
   for(const side of[-1,1]){for(let i=0;i<6;i++)box(side*(width/2+.003),.013,.034+i*.012,.004,.04,.004,edge,bolt);box(side*(width/2+.004),.03,foreEnd*.5,.003,.014,.105,edge,bolt);}
   cylinder(0,0,front+.035,.022,.065,steel);if(id==='ghost'){cylinder(0,0,front+.085,.028,.17,dark);for(let i=0;i<3;i++)cylinder(0,0,front+.012+i*.016,.03,.005,edge);}
   if(id==='frenzy'){box(0,-.06,front+.02,.083,.07,.045,black);box(0,-.25,.047,.088,.08,.071,dark,magazine);box(.055,.065,-.065,.025,.02,.07,black);}
   if(id==='bandit')profile([[.08,.06],[-.18,.06],[-.21,.045],[.08,.038]],width*.65,edge,bolt);
   if(id!=='frenzy')box(0,-.253,.048,.083,.028,.067,black,magazine);
  }
 }else{
  // Receivers follow each family, including Bulldog's rear magazine / bullpup stock.
  const pts=bull?[[back,.09],[-.22,.09],[-.35,.045],[-.35,-.025],[-.08,-.035],[.06,-.13],[back,-.12]]:[[.11,h*.45],[-.12,h*.62],[foreEnd,h*.44],[foreEnd-.025,-h*.23],[-.28,-h*.55],[.10,-h*.48]];
  profile(pts,width,dark);for(const side of[-1,1]){profile([[.07,h*.29],[-.14,h*.43],[foreEnd+.025,h*.28],[foreEnd+.04,-h*.12],[-.19,-h*.32],[.07,-h*.24]],.009,edge,root,side*(width/2+.004));box(side*(width/2+.012),.005,-.18,.008,.047,.118,black);box(side*(width/2+.016),.019,-.15,.012,.027,.095,steel,bolt);for(const z of[.04,-.27])cylinder(side*(width/2+.014),-.026,z,.008,.009,steel,'x');}
  box(width/2+.043,.04,-.09,.065,.018,.025,black,bolt);
  if(!bull){
   if(['marshal','outlaw','bucky'].includes(id))profile([[.09,.012],[back-.07,.036],[back,-.009],[back,-.17],[back-.09,-.17],[.19,-.055],[.07,-.049]],.09,dark);
   else profile([[.08,.031],[.20,.063],[back,.046],[back,-.16],[back-.06,-.18],[.20,-.065],[.08,-.045]],width*.72,dark,root,0,[[[.21,.018],[back-.055,.009],[back-.06,-.093],[.22,-.028]]]);
  }
  box(0,-.06,back+.012,width*.9,.23,.024,black);
  let muzzle=front;
  cylinder(0,0,(front+foreEnd)/2,.023,foreEnd-front,steel);
  if(id==='outlaw'){barrelGroup=new T.Group();root.add(barrelGroup);barrelGroup.position.z=-.26;for(const x of[-.031,.031]){cylinder(x,.005,(front+.26)/2,.029,-front-.26,dark,'z',barrelGroup);cylinder(x,.005,front+.26,.019,.009,black,'z',barrelGroup);}profile([[-.30,-.025],[-.64,-.025],[-.70,-.062],[-.30,-.09]],.105,black);}
  else{
   const guardFront=['operator','marshal','bucky'].includes(id)?front+.32:w.silenced?front+.23:front+.13;
   profile([[foreEnd+.08,.027],[guardFront,.027],[guardFront-.015,-.049],[foreEnd+.08,-.058]],width*.79,dark);
   for(const side of[-1,1])for(let i=0;i<Math.max(3,Math.floor((foreEnd-guardFront+.1)/.043));i++)box(side*width*.405,-.004,foreEnd+.035-i*.043,.005,.022,.022,black);
   if(w.silenced){cylinder(0,0,front+.10,.038,.21,dark);for(let i=0;i<3;i++)cylinder(0,0,front+.02+i*.065,.04,.005,edge);}else cylinder(0,0,front+.035,heavy?.04:.029,.09,dark);
   cylinder(0,0,front-.013,.017,.009,black);
  }
  if(id==='bucky'){const pump=new T.Group();root.add(pump);pump.name='pump';profile([[-.32,-.043],[-.64,-.043],[-.66,-.105],[-.34,-.108]],.12,black,pump);for(let i=0;i<8;i++)box(0,-.082,-.34-i*.037,.13,.054,.01,edge,pump);bolt.add(pump);cylinder(0,-.05,-.56,.021,.40,dark);}
  else if(id==='judge'){cylinder(0,-.177,-.18,.105,.17,black,'x',magazine);cylinder(.09,-.177,-.18,.092,.014,edge,'x',magazine);for(let i=0;i<8;i++){const a=i*Math.PI/4;cylinder(.097,-.177+Math.cos(a)*.067,-.18+Math.sin(a)*.067,.01,.012,steel,'x',magazine);}}
  else if(heavy){box(0,-.18,-.18,width*.9,.22,.25,black,magazine);for(const side of[-1,1])for(let i=0;i<5;i++)box(side*width*.47,-.17,-.28+i*.043,.013,.17,.014,edge,magazine);if(id==='odin'){for(let i=0;i<6;i++){cylinder(width/2+.045+i*.022,-.023-i*.025,-.12,.01,.08,accent,'z',magazine);}profile([[-.06,h/2],[-.07,h/2+.08],[-.31,h/2+.08],[-.32,h/2]],.025,black);}}
  else if(!['marshal','outlaw','bucky'].includes(id)){const z=bull?.17:-.19,short=['operator','guardian'].includes(id),long=['stinger','spectre'].includes(id),d=long?.075:short?.13:.12;
   profile([[z+d/2,-.045],[z-d/2,-.045],[z-d/2-.012,short?-.20:-.26],[z-.01,short?-.22:-.34],[z+d/2+.024,short?-.21:-.30]],width*.65,dark,magazine);
   for(const side of[-1,1])for(let i=0;i<3;i++)box(side*width*.34,-.12-i*.045,z,.007,.025,d*.7,edge,magazine);
  }
  for(let i=0;i<12;i++)box(0,h*.6+.012,.055-i*.042,width*.63,.016,.017,black);
  if(w.scope){const sy=h*.6+.12;for(const z of[-.11,-.37])box(0,h*.6+.06,z,.044,.105,.03,black);cylinder(0,sy,-.25,id==='operator'?.053:.043,.41,black);for(const z of[-.045,-.455]){cylinder(0,sy,z,id==='operator'?.07:.055,.036,edge);cylinder(0,sy,z+(z>-.2?.02:-.02),id==='operator'?.055:.041,.004,mat(0x263d47,.9));}cylinder(0,sy+.05,-.21,.025,.04,black,'y');}
  if(id==='marshal'){profile([[.04,-.064],[-.12,-.074],[-.11,-.17],[.016,-.16]],.024,edge,bolt,0,[[[.017,-.09],[-.092,-.092],[-.09,-.145],[.008,-.14]]]);}
 }
 if(!pistol)box(0,h/4,front+.06,.022,h/2,.022,black);
 for(const z of[pistol?.10:.01,front+.06]){box(0,h/2+.018,z,.036,.028,.015,black);box(0,h/2+.033,z+.006,.007,.009,.004,accent);}
 // Non-emissive recessed serial panel, pins, selector, sight marks.
 for(const side of[-1,1]){box(side*(width/2+.016),-.036,pistol?-.04:-.07,.004,.013,pistol?.035:.055,accent);}
 const flash=new T.Group();root.add(flash);flash.position.set(0,0,front-.06);for(let i=0;i<3;i++){const m=new T.MeshBasicMaterial({color:i%2?0xffcf75:0xfff3d0,transparent:true,opacity:.85});materials.push(m);const o=mesh(new T.ConeGeometry(.042-i*.009,.12,5),m,flash);o.rotation.x=-Math.PI/2;o.position.z=-i*.045;}flash.visible=false;
 const hands=new T.Group();model.add(hands);hands.visible=!showcase;
 function hand(x,y,z){const hnd=new T.Group();hnd.position.set(x,y,z);hands.add(hnd);box(0,-.025,.013,.11,.10,.10,glove,hnd);box(0,-.10,.15,.115,.12,.26,glove,hnd);for(let i=0;i<4;i++){const f=box(-.041+i*.027,.002,-.05,.021,.057,.027,skinmat,hnd);f.rotation.x=-.25;box(-.041+i*.027,.031,-.044,.023,.025,.03,glove,hnd);}box(-.061,0,0,.032,.072,.033,skinmat,hnd).rotation.z=-.5;return hnd;}
 const right=hand(.012,-.15,.07),left=hand(-.014,-.085,pistol?-.025:foreEnd+.02);left.rotation.z=-.4;
 function update({equipSeconds=null,reloadSeconds=null,reloadDuration=w.reload,time=0,shotAge=10}={}){
  const p=equipSeconds===null?sampleGunDraw(id,w.equip):sampleGunDraw(id,equipSeconds);root.position.fromArray(p.position);root.rotation.fromArray([...p.rotation,'XYZ']);hands.position.copy(root.position);hands.rotation.copy(root.rotation);bolt.position.z=p.bolt+(shotAge<.12?Math.sin(shotAge/.12*Math.PI)*.045:0);left.position.x=-.014+p.hand*.075;left.position.z=(pistol?-.025:foreEnd+.02)+p.hand*.20;
  magazine.position.set(0,0,0);magazine.rotation.set(0,0,0);if(barrelGroup!==root)barrelGroup.rotation.x=0;
  if(reloadSeconds!==null){const t=T.MathUtils.clamp(reloadSeconds/reloadDuration,0,1),pull=smooth(.1,.3,t)*(1-smooth(.57,.75,t));root.rotation.z-=Math.sin(t*Math.PI)*.42;hands.rotation.copy(root.rotation);left.position.y=-.085-pull*.30;
   if(['shorty','outlaw'].includes(id))barrelGroup.rotation.x=smooth(.1,.25,t)*(1-smooth(.7,.85,t))*.55;
   else if(id==='sheriff'){magazine.position.x=-.09*pull;magazine.rotation.z=pull*1.3;}
   else if(!['marshal','bucky'].includes(id)){magazine.position.y=-.4*pull;magazine.rotation.x=pull*.18;left.position.z=pistol?.04:-.19;}
   else{left.position.z=-.12;left.position.x=-.05-.12*Math.sin(t*Math.PI*6)**2;}
  }else left.position.y=-.085;
 }
 update();return{model,flash,magazine:null,blade:null,handle:null,update,dispose(){new Set(geometries).forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
