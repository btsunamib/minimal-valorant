import * as T from './three.module.js';
// 1.86 m / 0.24 m skull = 7.75 heads. Shared by menu and combat.
export const HUMAN_PROPORTIONS=Object.freeze({height:1.86,headHeight:.24,headWidth:.18,eye:1.73,shoulder:1.51,hip:.93});
const cube=new T.BoxGeometry(1,1,1),round=new T.SphereGeometry(.5,12,8),mats=new Map();
function material(c,emit=0){const k=c+':'+emit;if(!mats.has(k))mats.set(k,new T.MeshStandardMaterial({color:c,roughness:.72,metalness:emit?.35:.12,emissive:emit?c:0,emissiveIntensity:emit}));return mats.get(k)}
export function createAgentModel(a,{team=0,armed=true}={}){
 const model=new T.Group(),[cloth,pants,accent,skin,hair]=a.colors,has=f=>a.features.includes(f),dark=0x212b33;
 function box(p,x,y,z,w,h,d,c,emit=0){const m=new T.Mesh((c===skin||c===hair||h>.20&&w<.5)?round:cube,material(c,emit));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;p.add(m);return m;}
 function group(p,x,y,z){const g=new T.Group();g.position.set(x,y,z);p.add(g);return g;}
 const breadth=a.male?.40:.345,head=box(model,0,1.74,0,.18,.24,.185,skin),body=box(model,0,1.28,0,breadth,.50,.23,cloth);
 box(model,0,1.59,0,.09,.11,.10,skin);box(model,0,1.005,0,breadth*.76,.18,.21,pants);
 box(model,0,1.1,-.13,breadth*.9,.04,.025,dark);box(model,.045,1.1,-.147,.052,.045,.012,accent);
 // Small facial planes; no enlarged voxel head or enormous eyes.
 box(model,0,1.722,-.097,.037,.059,.025,skin);box(model,0,1.668,-.097,.05,.008,.012,0x916754);
 for(const side of[-1,1]){box(model,side*.093,1.734,0,.025,.060,.048,skin);box(model,side*.040,1.760,-.095,.039,.014,.012,0xe8e8dc);box(model,side*.035,1.761,-.103,.012,.014,.005,0x313b42);box(model,side*.04,1.783,-.100,.043,.010,.008,hair);}
 if(!has('bald')&&!has('robot')&&!has('metalhorns')){box(model,0,1.848,.011,.191,.052,.188,hair);box(model,0,1.77,.082,.194,.15,.034,hair);for(const side of[-1,1])box(model,side*.088,1.80,0,.025,.095,.17,hair);}
 const legs=[],arms=[];
 for(const side of[-1,1]){
  const leg=group(model,side*.105,.94,0);legs.push(leg);box(leg,0,-.215,0,.155,.43,.185,pants);box(leg,0,-.625,.012,.13,.40,.155,pants);box(leg,0,-.437,-.06,.145,.11,.075,cloth);box(leg,0,-.855,-.05,.15,.16,.27,dark);box(leg,0,-.934,-.055,.156,.022,.279,0x72808b);
  const arm=group(model,side*(breadth/2+.065),1.49,0);arms.push(arm);const robotArm=has('robotarms')||has('robot')||(has('robotarm')&&side===-1)||(has('goldarm')&&side===-1);
  const armColor=robotArm?(has('goldarm')?0xd0a453:0x82919a):has('barearms')?skin:cloth;
  box(arm,0,-.13,0,.125,.28,.15,armColor);box(arm,0,-.388,-.032,.105,.25,.125,robotArm?armColor:has('barearms')?skin:cloth);box(arm,0,-.55,-.048,.092,.12,.12,skin);box(arm,0,-.49,-.052,.114,.065,.128,dark);
  box(arm,side*.071,-.07,0,.018,.08,.09,team===0?0xaff393:0xfa7c70,.45);
  if(robotArm){for(let n=0;n<3;n++)box(arm,0,-.24-n*.09,-.115,.11,.027,.035,accent,.6);box(arm,0,-.28,0,.15,.10,.18,dark);}
 }
 // Distinct silhouette accessories, placed at anatomical scale.
 if(has('longhair')||has('bob')){for(const side of[-1,1]){const strand=box(model,side*.093,has('bob')?1.69:1.57,.077,.051,has('bob')?.22:.43,.102,hair);strand.rotation.z=side*.10;}if(has('purple'))box(model,.115,1.44,.089,.026,.20,.08,accent);}
 if(has('streak'))box(model,-.052,1.853,-.005,.045,.055,.19,0xe8e9e4);
 if(has('ponytail')||has('braid')){box(model,0,1.79,.135,.09,.085,.095,hair);for(let i=0;i<5;i++)box(model,Math.sin(i*.8)*.018,1.71-i*.069,.145+i*.012,.074-i*.008,.087,.067,hair);}
 if(has('bun')){box(model,0,1.87,.112,.12,.104,.10,hair);box(model,0,1.84,.1,.14,.018,.12,accent);}
 if(has('twintails'))for(const side of[-1,1]){const p=box(model,side*.12,1.65,.08,.065,.31,.09,hair);p.rotation.z=side*.22;box(model,side*.146,1.51,.08,.042,.09,.07,accent,.5);}
 if(has('spikes'))for(let i=0;i<5;i++){const p=box(model,(i-2)*.036,1.887,-.01,.034,.086,.13,hair);p.rotation.z=(i-2)*-.1;}
 if(has('hood')){box(model,0,1.862,.015,.238,.065,.25,cloth);for(const side of[-1,1])box(model,side*.105,1.735,.012,.05,.245,.24,cloth);box(model,0,1.73,-.093,.16,.22,.025,dark);}
 if(has('facelight'))for(let i=-1;i<=1;i++)box(model,i*.038,1.735,-.114,.012,.107,.011,accent,1.5);
 if(has('hat')){box(model,0,1.881,0,.38,.025,.35,cloth);box(model,0,1.926,.02,.205,.085,.21,cloth);box(model,0,1.9,0,.21,.021,.216,pants);}
 if(has('beanie')||has('beret')||has('cap')){box(model,has('beret')?.025:0,1.873,0,has('beret')?.25:.21,.09,.213,has('beanie')?0x458d75:has('beret')?0x985f39:cloth);if(has('cap'))box(model,0,1.847,-.13,.23,.025,.12,pants);}
 if(has('headband'))box(model,0,1.808,-.012,.198,.026,.199,cloth);
 if(has('glasses')||has('sunglasses')){for(const side of[-1,1])box(model,side*.046,1.76,-.11,.078,.043,.015,has('sunglasses')?dark:0x657d83);box(model,0,1.76,-.11,.035,.009,.016,accent);}
 if(has('mask'))box(model,0,1.69,-.107,.165,.08,.044,pants);
 if(has('beard')){box(model,0,1.645,-.055,.15,.071,.125,hair);box(model,0,1.697,-.109,.093,.018,.013,hair);}
 if(has('headphones')){for(const side of[-1,1])box(model,side*.111,1.73,.023,.05,.089,.085,accent);box(model,0,1.886,.023,.24,.02,.035,dark);}
 if(has('coat')||has('shortcoat')||has('cape')){const length=has('shortcoat')?.33:.62;box(model,0,1.04,.144,breadth+.04,length,.045,cloth);for(const side of[-1,1]){const p=box(model,side*breadth*.45,1.03,.023,.086,length,.27,cloth);p.rotation.z=side*.08;}}
 if(has('vest')){box(model,0,1.30,-.131,breadth*.8,.37,.035,pants);for(const side of[-1,1]){box(model,side*.1,1.39,-.162,.065,.19,.035,cloth);box(model,side*.08,1.17,-.17,.105,.12,.068,cloth);}}
 if(has('jacket'))for(const side of[-1,1]){const lapel=box(model,side*.10,1.45,-.127,.065,.19,.038,pants);lapel.rotation.z=side*.27;box(model,side*.105,1.20,-.128,.10,.025,.03,accent);}
 if(has('tie')){box(model,0,1.45,-.142,.035,.21,.015,accent);box(model,0,1.51,-.15,.05,.04,.02,pants);}
 if(has('scarf')){box(model,0,1.58,-.01,.21,.076,.21,cloth);box(model,.10,1.43,.153,.065,.25,.02,cloth);}
 if(has('orbs'))for(let i=0;i<4;i++){const orb=new T.Mesh(new T.IcosahedronGeometry(.045,1),material(accent,.7));orb.position.set(-.20+i*.11,1.04,-.137);model.add(orb);}
 if(has('quiver')){box(model,.12,1.35,.20,.14,.49,.13,pants);for(let i=0;i<3;i++)box(model,.074+i*.042,1.66,.21,.014,.22,.014,accent);}
 if(has('fur'))for(let i=0;i<5;i++)box(model,(i-2)*.075,1.50,.1,.09,.11,.19,0xd3d5c9);
 if(has('robot')){box(model,0,1.735,-.108,.155,.163,.034,0x292b40);for(let i=-1;i<=1;i++)box(model,i*.035,1.745,-.13,.017,.08,.012,accent,1.4);box(model,0,1.36,-.14,.14,.11,.04,accent,1);}
 if(has('metalhorns'))for(const side of[-1,1]){const horn=box(model,side*.10,1.91,.02,.048,.22,.07,pants);horn.rotation.z=side*-.3;box(model,side*.04,1.77,-.12,.041,.02,.014,accent,1);}
 if(has('pet')){box(model,.22,1.01,.13,.14,.23,.13,0xd4ce45);box(model,.22,1.15,.14,.18,.08,.15,0x7c5eba);}
 if(has('bracelet')||has('gauntlet'))box(arms[0],0,-.42,-.06,.15,.16,.16,accent,.35);
 if(has('butterflies'))for(let i=0;i<3;i++){const p=box(model,.12-i*.11,1.42-i*.1,-.13,.045,.026,.015,accent);p.rotation.z=.5;}
 if(has('maskbelt'))box(model,.17,1.02,-.13,.09,.12,.07,0xd9e8ef);
 if(armed){arms[0].rotation.x=-.78;arms[1].rotation.x=-1.00;const gun=group(model,.17,1.18,-.29);box(gun,0,0,-.16,.075,.09,.52,dark);box(gun,0,.025,-.48,.035,.035,.16,0x73818c);box(gun,0,-.105,-.16,.054,.16,.085,pants);box(gun,0,.059,-.12,.025,.022,.09,accent);}
 // Transparent torso/legs hit area, detailed visible pieces remain purely cosmetic.
 const hitBody=box(model,0,.88,0,.43,1.46,.28,0);hitBody.geometry=cube;hitBody.material=new T.MeshBasicMaterial({visible:false,transparent:true,opacity:0});
 model.userData.agent=a.id;model.userData.proportions=HUMAN_PROPORTIONS;
 return{model,head,body:hitBody,legs,arms,dispose(){hitBody.material.dispose()}};
}
