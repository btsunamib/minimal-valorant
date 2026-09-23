import {createNarukami} from './narukami.js';
import {createChaos} from './chaos.js';
import {createMercy} from './mercy.js';
import {createKuronami} from './kuronami.js';
import * as T from './three.module.js';
const cube=new T.BoxGeometry(1,1,1),cache=new Map();
function material(color,metal=.6,emission=0){const key=[color,metal,emission].join();if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({color,metalness:metal,roughness:metal>.5?.28:.72,emissive:emission?color:0,emissiveIntensity:emission}));return cache.get(key)}
function part(parent,x,y,z,w,h,d,color,metal=.6,glow=0){const m=new T.Mesh(cube,material(color,metal,glow));m.position.set(x,y,z);m.scale.set(w,h,d);parent.add(m);return m}
function cylinder(parent,x,y,z,r,l,color,axis='z',sides=12){const geo=new T.CylinderGeometry(r,r,l,sides,1),m=new T.Mesh(geo,material(color,.8));if(axis==='z')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.z=Math.PI/2;m.position.set(x,y,z);parent.add(m);return m}
function profile(parent,points,width,color,x=0,holes=[],glow=0){const shape=new T.Shape();points.forEach(([z,y],i)=>i?shape.lineTo(-z,y):shape.moveTo(-z,y));shape.closePath();for(const pts of holes){const p=new T.Path();pts.forEach(([z,y],i)=>i?p.lineTo(-z,y):p.moveTo(-z,y));p.closePath();shape.holes.push(p)}const geo=new T.ExtrudeGeometry(shape,{depth:width,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.0035,bevelThickness:.0035,curveSegments:8});geo.translate(0,0,-width/2);geo.rotateY(Math.PI/2);const m=new T.Mesh(geo,material(color,.75,glow));m.position.x=x;parent.add(m);return m}
function plate(parent,points,depth,color,z=0,glow=0){const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:1,steps:1});geo.translate(0,0,z-depth/2);const mesh=new T.Mesh(geo,material(color,.78,glow));parent.add(mesh);return mesh}
function ring(parent,x,y,z,r,tube,color,axis='z'){const mesh=new T.Mesh(new T.TorusGeometry(r,tube,6,20),material(color,.85));mesh.position.set(x,y,z);if(axis==='x')mesh.rotation.y=Math.PI/2;parent.add(mesh);return mesh}
function screw(parent,x,y,z,color){cylinder(parent,x,y,z,.008,.006,color,'x',6);part(parent,x+.004,y,z,.001,.002,.009,0x16232c)}
export function createWeaponArt(id,s,knifeType,showcase,variant='base',mercyVariant='red',chaosVariant='base',naruVariant='base'){
 if(id==='knife'&&knifeType==='narukami')return createNarukami(showcase,naruVariant);
 if(id==='vandal'&&s.chaos)return createChaos(showcase,chaosVariant);
 if(id==='knife'&&knifeType==='mercy')return createMercy(showcase,mercyVariant);
 if(id==='knife'&&knifeType==='kuronami')return createKuronami(showcase,variant);
 const model=new T.Group(),g=new T.Group();model.add(g);const dark=s.dark,metal=s.metal,edge=s.color,black=0x141d25,steel=0xa3acb3,rubber=0x242c31;let blade=null,handle=null,flash=null,magazine=null;
 if(id==='knife'){
  handle=new T.Group();g.add(handle);
  if(knifeType==='butterfly'){
   for(const x of[-.035,.037]){const h=new T.Group();handle.add(h);h.position.x=x;plate(h,[[-.024,.05],[-.023,-.23],[-.014,-.28],[.018,-.28],[.028,-.24],[.026,.05]],.040,metal);plate(h,[[-.014,.012],[-.014,-.21],[.014,-.22],[.015,.012]],.044,dark);for(let j=0;j<5;j++){part(h,0,-.03-j*.034,.026,.019,.014,.009,black);part(h,.019,-.03-j*.034,.024,.006,.014,.005,edge,.5,1.4)}for(const y of[.035,-.245]){const rivet=cylinder(h,0,y,.032,.012,.014,steel,'z',8);part(h,0,y,.041,.010,.002,.003,black)}}
   const pivot=new T.Group();pivot.position.set(0,.05,0);handle.add(pivot);blade=pivot;
   plate(pivot,[[-.035,0],[-.038,.30],[-.011,.41],[.038,.31],[.039,.08],[.021,.04],[.027,0]],.025,steel);
   plate(pivot,[[-.032,.07],[-.027,.30],[-.010,.40],[.003,.29],[.001,.075]],.027,0xe0e6e9);
   plate(pivot,[[.002,.08],[.006,.30],[-.010,.40],[.025,.31],[.029,.08]],.029,metal);
   part(pivot,.024,.19,.020,.009,.19,.005,edge,.5,2);part(pivot,.01,.057,.025,.022,.009,.007,black);
   const p=cylinder(handle,0,.063,.035,.025,.019,metal,'z',12);part(handle,0,.062,.048,.021,.004,.004,edge,.7,1);
  }else if(knifeType==='karambit'){
   const points=[[-.026,-.22],[-.052,-.13],[-.047,.006],[.008,.05],[.046,.01],[.035,-.10],[.062,-.21],[.026,-.25]];plate(handle,points,.056,metal);plate(handle,[[-.03,-.18],[-.035,-.09],[-.021,.012],[.018,.01],[.014,-.10],[.035,-.20]],.06,dark);
   for(let i=0;i<4;i++)part(handle,0,-.055-i*.035,.038,.055,.009,.009,black).rotation.z=-.15;
   blade=new T.Group();handle.add(blade);
   plate(blade,[[-.04,.02],[-.04,.15],[-.009,.235],[.06,.275],[.145,.26],[.206,.2],[.22,.105],[.19,.155],[.139,.181],[.076,.167],[.045,.127],[.038,.04]],.026,metal);
   plate(blade,[[.021,.12],[.04,.20],[.105,.235],[.17,.205],[.219,.105],[.19,.155],[.139,.181],[.076,.167],[.045,.127]],.029,0xdde5e8);
   plate(blade,[[-.023,.10],[-.002,.20],[.061,.251],[.133,.236],[.168,.208],[.103,.222],[.051,.198],[.024,.15]],.032,edge,0,1.4);
   ring(handle,.025,-.28,0,.059,.013,steel);ring(handle,.025,-.28,.002,.041,.004,edge);
  }else{
   plate(handle,[[-.039,.05],[-.04,-.20],[-.025,-.26],[.034,-.25],[.046,-.20],[.037,.05]],.055,dark);for(let i=0;i<5;i++)part(handle,0,-.018-i*.041,.035,.076,.012,.01,metal);part(handle,0,.03,0,.23,.045,.09,metal);
   blade=new T.Group();handle.add(blade);plate(blade,[[-.055,.055],[-.071,.29],[-.033,.45],[0,.59],[.050,.36],[.069,.12],[.038,.055]],.032,steel);
   plate(blade,[[-.055,.075],[-.061,.29],[-.025,.44],[0,.589],[-.012,.36],[-.03,.09]],.036,edge,0,1.4);plate(blade,[[.006,.10],[.026,.30],[0,.58],[.041,.35],[.055,.13]],.037,dark);part(blade,0,.22,.022,.012,.23,.012,edge,.8,2);
  }
  g.rotation.set(-.25,-.32,-.48);g.position.set(.02,.01,-.07);
 }else{
  const pistol=id==='classic',sniper=id==='operator',smg=id==='spectre',shotgun=id==='judge',silenced=id==='phantom'||smg;
  if(pistol){
   profile(g,[[.13,.06],[-.28,.06],[-.31,.024],[-.31,-.027],[.11,-.06]],.105,dark);profile(g,[[.11,-.036],[-.07,-.045],[-.11,-.10],[-.046,-.12],[.019,-.28],[.129,-.27],[.10,-.20]],.087,rubber);part(g,0,.012,-.12,.111,.04,.15,metal);for(let i=0;i<7;i++)part(g,.057,.003,.02+i*.011,.004,.047,.003,steel);cylinder(g,0,.0,-.312,.027,.025,steel);cylinder(g,0,.0,-.328,.019,.009,black);part(g,0,.083,.08,.073,.037,.018,black);part(g,0,.077,-.23,.014,.027,.016,steel);for(let i=-1;i<=1;i+=2)part(g,i*.024,.087,.091,.009,.009,.003,edge,.6,2);profile(g,[[-.06,-.08],[-.135,-.083],[-.135,-.15],[-.048,-.15],[-.046,-.133],[-.114,-.133],[-.115,-.1],[-.055,-.1]],.025,metal);part(g,.058,.038,-.08,.004,.01,.20,edge,.7,1.2);
  }else{
   const front=sniper?-.83:smg?-.55:shotgun?-.56:-.66;
   profile(g,[[.06,.055],[-.06,.088],[-.32,.082],[-.405,.040],[-.407,-.07],[-.27,-.105],[-.13,-.095],[.07,-.06]],.125,dark);
   // Receiver plates are separate beveled shells instead of one rectangular block.
   for(const side of[-1,1]){profile(g,[[.025,.035],[-.095,.061],[-.287,.054],[-.361,.02],[-.34,-.044],[-.17,-.066],[.025,-.038]],.012,metal,side*.069);profile(g,[[-.04,.025],[-.13,.043],[-.26,.032],[-.25,-.007],[-.085,-.016]],.012,dark,side*.078);for(const z of[-.02,-.28,-.35])screw(g,side*.081,-.025,z,steel);part(g,side*.085,.001,-.20,.008,.012,.11,edge,.6,1.8);}
   // Ejection port, charging handle, bolt, safety selector and trigger guard.
   part(g,.091,.027,-.14,.006,.035,.095,black);part(g,.096,.028,-.14,.01,.023,.063,steel);part(g,.107,.047,-.055,.055,.011,.021,black);part(g,.083,-.041,.015,.017,.011,.035,black).rotation.x=.25;
   profile(g,[[.04,-.061],[-.015,-.085],[-.044,-.26],[.063,-.30],[.101,-.263],[.067,-.132]],.081,rubber);for(let i=0;i<5;i++)part(g,.043,-.135-i*.027,.04-i*.006,.012,.012,.076,metal,.3).rotation.x=-.1;
   profile(g,[[-.04,-.082],[-.148,-.09],[-.153,-.182],[-.029,-.189],[-.025,-.168],[-.133,-.163],[-.13,-.108],[-.04,-.10]],.031,metal);part(g,0,-.128,-.065,.022,.060,.018,black).rotation.x=.3;
   // Skeleton shoulder stock and layered butt pad.
   cylinder(g,0,-.007,.134,.037,.17,steel);profile(g,[[.12,.055],[.23,.092],[.427,.06],[.441,-.15],[.374,-.17],[.222,-.087],[.12,-.065]],.10,dark,0,[[[.232,.038],[.349,.015],[.339,-.055],[.23,-.028]]]);part(g,0,-.06,.443,.129,.253,.028,rubber);part(g,0,.074,.26,.093,.022,.22,metal);for(let i=0;i<5;i++)part(g,0,-.142+i*.04,.461,.128,.015,.005,0x46525b,.1);part(g,.054,-.001,.286,.008,.015,.09,edge,.6,1.2);
   // Ventilated handguard, octagonal barrel, rail teeth and recessed screws.
   profile(g,[[-.36,.071],[front,.047],[front-.025,-.043],[-.37,-.059]],.101,silenced?dark:metal);for(let side of[-1,1])for(let i=0;i<(smg?4:7);i++){const z=-.405-i*.036;part(g,side*.057,.013,z,.006,.025,.020,black);part(g,side*.060,-.026,z,.005,.006,.021,steel);}
   for(let i=0;i<(sniper?23:16);i++)part(g,0,.092,-.035-i*.033,.087,.020,.014,rubber);part(g,0,.077,-.30,.052,.008,.61,steel);
   cylinder(g,0,-.004,(front-.035+front-.19)/2,.025,.19,steel);const muzzleZ=front-(sniper?.33:.20);cylinder(g,0,-.004,muzzleZ,.034,.095,black);cylinder(g,0,-.004,muzzleZ-.052,.023,.009,steel);cylinder(g,0,-.004,muzzleZ-.057,.015,.011,black);
   if(silenced){cylinder(g,0,-.004,muzzleZ-.045,.043,.22,dark);for(let i=0;i<4;i++)cylinder(g,0,-.004,muzzleZ+.036-i*.045,.046,.008,metal);cylinder(g,0,-.004,muzzleZ-.159,.029,.008,black)}
   else for(let side of[-1,1])for(let j=0;j<3;j++)part(g,side*.034,-.004,muzzleZ+.03-j*.024,.009,.022,.012,steel);
   // Distinct magazine silhouettes for each weapon family.
   magazine=new T.Group();g.add(magazine);
   if(shotgun){cylinder(magazine,0,-.185,-.215,.125,.135,black,'x',16);cylinder(magazine,.073,-.185,-.215,.104,.018,metal,'x',16);ring(magazine,.085,-.185,-.215,.062,.011,edge,'x');}
   else{const points=sniper?[[-.14,-.10],[-.32,-.1],[-.30,-.25],[-.15,-.25]]:smg?[[-.17,-.10],[-.25,-.10],[-.23,-.36],[-.143,-.35]]:[[-.16,-.09],[-.285,-.095],[-.30,-.22],[-.266,-.36],[-.17,-.38],[-.132,-.33],[-.173,-.19]];profile(magazine,points,.085,dark);for(const side of[-1,1]){for(let i=0;i<3;i++)part(magazine,side*.047,-.17-i*.055,-.215-i*.003,.006,.035,.045,metal);part(magazine,side*.05,-.14,-.21,.007,.009,.06,edge,.6,1.4)}part(magazine,0,sniper?-.255:smg?-.36:-.377,sniper?-.23:-.20,.103,.025,sniper?.17:.13,rubber)}
   if(sniper){for(const z of[-.17,-.47])part(g,0,.13,z,.062,.10,.05,black);cylinder(g,0,.222,-.33,.053,.46,black);for(const z of[-.12,-.56]){cylinder(g,0,.222,z,.073,.06,metal);ring(g,0,.222,z+(z>-.3?.035:-.035),.06,.008,steel)}cylinder(g,0,.222,-.083,.051,.005,0x25636d);cylinder(g,0,.294,-.29,.035,.038,black,'y');cylinder(g,.065,.222,-.29,.03,.05,black,'x');part(g,0,.225,-.081,.034,.034,.006,edge,.5,.6);cylinder(g,.109,.03,.01,.016,.09,steel,'x');cylinder(g,.15,-.019,.01,.021,.08,black,'y');}
   else{part(g,0,.122,.005,.094,.052,.027,black);part(g,0,.135,.004,.043,.029,.029,steel);part(g,0,.143,.019,.025,.017,.007,black);for(const x of[-.032,.032])part(g,x,.148,.022,.009,.009,.003,edge,.6,2);part(g,0,.127,front+.025,.05,.073,.027,black);part(g,0,.157,front+.036,.015,.033,.013,steel);part(g,0,.164,front+.045,.008,.011,.004,edge,.6,1.2);}
   if(s.name==='离子光谱'){for(const side of[-1,1]){cylinder(g,side*.10,-.005,-.23,.055,.025,0xe7f0f3,'x',16);cylinder(g,side*.119,-.005,-.23,.035,.010,edge,'x',16);ring(g,side*.124,-.005,-.23,.045,.005,steel,'x');}}
   else if(s.name==='暗影收割'){for(const side of[-1,1]){profile(g,[[-.02,.06],[-.14,.10],[-.24,.08],[-.31,.02],[-.26,.042],[-.15,.06]],.017,0xb2a3c7,side*.092);for(let i=0;i<3;i++)profile(g,[[-.4-i*.08,.08],[-.47-i*.08,.13],[-.45-i*.08,.02]],.013,metal,side*.052)}const gem=new T.Mesh(new T.OctahedronGeometry(.038),material(edge,.6,1.6));gem.position.set(.109,.0,-.19);g.add(gem);}
   else if(s.name==='赤焰龙鳞'){for(let i=0;i<7;i++){const z=-.16-i*.067;profile(g,[[z,.05],[z-.025,.125],[z-.081,.042]],.12,i%2?dark:metal);part(g,.068,.035,z-.027,.008,.017,.047,edge,.5,1.5);}}
   else{for(const side of[-1,1]){profile(g,[[-.07,.045],[-.20,.069],[-.35,.014],[-.22,.036]],.009,edge,side*.097,[],1.2);part(g,side*.069,-.02,front+.08,.006,.02,.15,edge,.6,1.6)}}
   flash=new T.Group();flash.position.set(0,-.004,muzzleZ-(silenced?.19:.07));for(let i=0;i<3;i++){const f=part(flash,0,0,-i*.06,.11-i*.025,.11-i*.025,.07,i%2?edge:0xffe2a1,.4,3);f.rotation.z=i*Math.PI/4}flash.visible=false;g.add(flash);
  }
  if(pistol){flash=new T.Group();flash.position.set(0,0,-.35);part(flash,0,0,-.02,.08,.08,.11,edge,.5,3);flash.visible=false;g.add(flash)}
 }
 if(!showcase){const hands=new T.Group();model.add(hands);function hand(x,y,z,left=false){const h=new T.Group();h.position.set(x,y,z);hands.add(h);part(h,0,-.085,.12,.13,.14,.23,0x34524b,.1);part(h,0,-.04,.035,.145,.065,.055,0x1b292a,.1);part(h,0,0,0,.122,.092,.115,0x293a38,.1);part(h,0,.049,0,.112,.015,.095,0x4d645a,.1);for(let i=0;i<4;i++){part(h,-.044+i*.029,-.006,-.068,.024,.065,.035,0xba9778,.1);part(h,-.044+i*.029,.026,-.069,.025,.027,.038,0x273c39,.1);}part(h,left?.07:-.07,-.016,-.025,.04,.058,.072,0xb89778,.1).rotation.z=left?.3:-.3;part(h,0,-.065,.10,.153,.03,.046,0xa5b6a2,.3);return h}
  hand(.015,-.18,.043);if(id==='knife')hand(-.48,-.13,-.19,true).rotation.z=.15;else hand(-.018,-.095,id==='classic'?-.005:-.47,true).rotation.z=-.4;
 }
 return{model,blade,handle,flash,magazine};
}
