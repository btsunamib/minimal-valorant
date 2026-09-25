import * as T from './three.module.js';
export const C26_CLIPS={equip:{duration:1.2,label:'切枪'},reload:{duration:2.3,label:'换弹'},inspect:{duration:8,label:'检视'},fire:{duration:1,label:'开火'},kill:{duration:2.4,label:'击杀图标'},finisher:{duration:12,label:'终结效果'}};
export const championSide=(team,attackTeam)=>team===attackTeam?'attack':'defense';
const sat=x=>Math.max(0,Math.min(1,x)),ease=(a,b,t)=>{const x=sat((t-a)/(b-a));return x*x*(3-2*x)};
// Reference-led reconstruction, not an all-frame measured match. Absolute sampling.
export function sampleC26(action,seconds){const t=Math.max(0,seconds),p={position:[0,0,0],rotation:[0,0,0],mag:0,bolt:0,left:0,phase:'握持'};
 if(action==='equip'){const lift=1-ease(0,.55,t),pull=Math.sin(ease(.35,.78,t)*Math.PI);p.position=[.11*lift,-.38*lift,.2*lift];p.rotation=[.45*lift,-.18*lift,-.48*lift];p.bolt=.055*pull;p.left=pull;p.phase=t<.55?'抬枪与流光显形':t<.9?'拉柄复位':'握持';}
 if(action==='reload'){const tilt=ease(0,.28,t)*(1-ease(1.96,2.3,t));p.rotation=[1.10*tilt,.22*tilt,.10*tilt];p.position=[-.08*tilt,.05*tilt,.06*tilt];p.mag=ease(.26,.60,t)*(1-ease(1.00,1.39,t));p.bolt=.05*Math.sin(ease(1.56,1.92,t)*Math.PI);p.left=tilt;p.phase=t<.26?'抬枪':t<.60?'抽出弹匣':t<1.39?'装入弹匣':t<1.92?'复位拉柄':'握持';}
 if(action==='inspect'){const lift=ease(0,.55,t)*(1-ease(7.25,8,t));p.rotation=[-.12*lift,.95*lift,-.37*lift];p.position=[-.20*lift,.08*lift,0];p.left=lift*.3;p.phase=t<.55?'展开检视':t<7.25?'龙纹流光与音乐':'收枪';}
 return p;
}
export function createChampions26(showcase=false){
 const model=new T.Group(),root=new T.Group();model.name='Champions 2026 Phantom';model.add(root);const geos=[],mats=[];
 const material=(color,metal=.8,glow=0)=>{const m=new T.MeshStandardMaterial({color,metalness:metal,roughness:.29,emissive:glow?color:0,emissiveIntensity:glow});mats.push(m);return m};
 const dark=material(0x14161c),white=material(0xdce3df),gold=material(0xd7ad50),steel=material(0x7f858c),core=material(0xffbd36,.3,1.8),red=material(0x4c1020,.6),glove=material(0x23363d,.1),skin=material(0xc4a18c,.05);
 const mesh=(geo,m,parent=root)=>{geos.push(geo);const o=new T.Mesh(geo,m);parent.add(o);return o;};
 const cube=new T.BoxGeometry(1,1,1);geos.push(cube);function box(parent,x,y,z,w,h,d,m){const o=new T.Mesh(cube,m);parent.add(o);o.position.set(x,y,z);o.scale.set(w,h,d);return o;}
 function plate(points,width,m,parent=root,x=0,holes=[]){const s=new T.Shape();points.forEach(([z,y],i)=>i?s.lineTo(-z,y):s.moveTo(-z,y));s.closePath();for(const list of holes){const h=new T.Path();list.forEach(([z,y],i)=>i?h.lineTo(-z,y):h.moveTo(-z,y));h.closePath();s.holes.push(h);}const g=new T.ExtrudeGeometry(s,{depth:width,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2,steps:1});g.translate(0,0,-width/2);g.rotateY(Math.PI/2);const o=mesh(g,m,parent);o.position.x=x;return o;}
 function cylinder(parent,x,y,z,r,l,m,axis='z'){const o=mesh(new T.CylinderGeometry(r,r,l,20),m,parent);o.rotation.x=axis==='z'?Math.PI/2:0;o.rotation.z=axis==='x'?Math.PI/2:0;o.position.set(x,y,z);return o;}
 function line(points,r,m,parent=root){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(12,points.length*4),r,6,false),m,parent);}
 const mag=new T.Group(),bolt=new T.Group(),dragon=new T.Group();root.add(mag,bolt,dragon);
 plate([[.12,.08],[-.18,.095],[-.58,.057],[-.59,-.042],[-.29,-.062],[.07,-.086]],.135,dark);
 plate([[.10,.045],[.42,.055],[.48,.0],[.44,-.115],[.29,-.13],[.22,-.063],[.12,-.057]],.10,dark,root,0,[[[.20,.02],[.39,.025],[.40,-.069],[.30,-.079],[.26,-.035],[.20,-.028]]]);
 plate([[.06,-.047],[-.025,-.047],[-.009,-.27],[.083,-.26],[.07,-.2]],.082,dark);plate([[-.024,-.06],[-.15,-.06],[-.16,-.155],[-.017,-.158]],.04,gold,root,0,[[[-.045,-.081],[-.12,-.081],[-.13,-.13],[-.045,-.135]]]);
 box(root,0,-.105,-.066,.015,.054,.014,gold).rotation.x=.18;
 plate([[-.145,-.041],[-.248,-.054],[-.27,-.25],[-.18,-.27]],.086,dark,mag);plate([[-.148,-.065],[-.223,-.064],[-.235,-.226],[-.181,-.24]],.008,gold,mag,.047);box(mag,0,-.263,-.224,.102,.027,.096,gold);
 cylinder(root,0,.012,-.7,.035,.28,dark);plate([[-.55,.059],[-.92,.052],[-.951,.023],[-.928,-.035],[-.56,-.04]],.089,white);cylinder(root,0,.012,-.953,.030,.008,gold);cylinder(root,0,.012,-.958,.020,.009,dark);
 for(const x of[-1,1]){
  plate([[.095,.07],[-.14,.082],[-.48,.046],[-.41,.011],[-.24,.018],[-.12,-.013],[.03,-.048]],.013,white,root,x*.076);
  plate([[.02,.056],[-.14,.067],[-.43,.038],[-.41,.027],[-.18,.041],[-.11,.006],[.039,-.015]],.006,gold,root,x*.085);
  plate([[.035,-.04],[-.115,-.009],[-.263,.011],[-.272,-.044],[-.15,-.073],[-.071,-.077]],.009,gold,root,x*.079,[[[-.035,-.040],[-.13,-.030],[-.223,-.017],[-.20,-.047],[-.12,-.061],[-.061,-.06]]]);
  plate([[.15,.049],[.35,.045],[.407,.012],[.386,-.016],[.24,-.004],[.15,.018]],.012,gold,root,x*.055);
  plate([[-.57,.047],[-.70,.047],[-.745,.021],[-.711,.002],[-.57,.008]],.004,gold,root,x*.050);
  line([[x*.083,.027,-.46],[x*.088,.076,-.27],[x*.055,.108,-.14],[x*.049,.080,.04]],.005,core);
  for(let i=0;i<6;i++)box(root,x*.045,-.12-i*.02,.049,.005,.006,.045,steel);
  cylinder(root,x*.087,-.028,-.12,.009,.006,steel,'x');
 }
 // Twin swept horns and a faceted serpentine crest along the receiver.
 plate([[-.1,.094],[-.17,.12],[-.22,.19],[-.21,.119],[-.31,.083]],.065,gold,dragon);
 plate([[-.14,.103],[-.19,.126],[-.18,.157],[-.11,.128],[-.04,.094]],.039,white,dragon);
 for(const x of[-1,1]){line([[x*.02,.104,-.15],[x*.049,.14,-.24],[x*.058,.17,-.3],[x*.054,.152,-.35]],.009,gold,dragon);for(let i=0;i<7;i++){const z=-.10+i*.031;plate([[z,.087],[z+.014,.118-i*.003],[z+.04,.084]],.018,gold,dragon,x*.044);}}
 const flameLines=[];for(const side of[-1,1])for(let i=0;i<5;i++){const z=-.42+i*.09;flameLines.push(line([[side*.072,.065,z],[side*.085,.086,z+.03],[side*.04,.11,z+.09],[side*.02,.096,z+.14]],.006,core,dragon));}
 // Gold rear diamond sight, independent bolt and receiver recess.
 plate([[.035,.09],[-.014,.135],[-.035,.20],[-.07,.135],[-.095,.09]],.029,gold,root,0,[[[-.016,.132],[-.035,.178],[-.055,.132],[-.035,.108]]]);box(root,0,.138,-.035,.010,.025,.012,core);
 box(bolt,.102,.022,-.16,.047,.023,.09,steel);box(bolt,.13,.025,-.12,.033,.021,.027,dark);
 const flash=new T.Group();root.add(flash);flash.position.set(0,.012,-1.01);for(let i=0;i<3;i++){const o=mesh(new T.OctahedronGeometry(.045,0),core,flash);o.scale.set(1,1,2.4);o.rotation.z=i*Math.PI/3;}flash.visible=false;
 const hands=new T.Group();model.add(hands);function palm(x,y,z){const g=new T.Group();g.position.set(x,y,z);hands.add(g);box(g,0,0,0,.088,.11,.075,glove);for(let i=0;i<4;i++){const f=box(g,.042,-.034+i*.027,-.03,.025,.022,.09,skin);f.rotation.y=-.3;}box(g,-.04,.035,-.015,.032,.072,.034,skin).rotation.z=.45;return g;}
 const right=palm(.023,-.16,.054),left=palm(-.018,-.096,-.4);left.rotation.z=-.5;
 const auraMat=new T.MeshBasicMaterial({color:0xffdf75,side:T.BackSide,transparent:true,opacity:.65,depthWrite:false,toneMapped:false});mats.push(auraMat);const aura=[];root.traverse(o=>{if(o.isMesh&&o.material===white)aura.push(o)});const shells=aura.map(o=>{const n=new T.Mesh(o.geometry,auraMat);n.scale.setScalar(1.023);n.raycast=()=>{};o.add(n);return n});
 // Seven-segment kill counter mounted on the receiver.
 const digits=[];for(let d=0;d<2;d++){const parts=[];for(let i=0;i<7;i++){const coords=[[0,.016],[.011,.009],[.011,-.009],[0,-.017],[-.011,-.009],[-.011,.009],[0,0]][i];parts.push(box(root,.09,.027+coords[1],-.022+d*.035+coords[0],.004,i%3===0?.004:.014,i%3===0?.018:.004,core));}digits.push(parts);}const masks=[63,6,91,79,102,109,125,7,127,111];
 function update({time=0,side='defense',equipSeconds=null,reloadSeconds=null,inspectSeconds=null,shotAge=10,kills=0,topFrag=false,killAge=10}={}){
  const attack=side==='attack';white.color.setHex(attack?0x23252c:0xdce3df);core.color.setHex(attack?0xff2545:0xffc23e);core.emissive.copy(core.color);auraMat.color.setHex(attack?0xff2944:0xffd36a);core.emissiveIntensity=1.1+(killAge<1?2*(1-killAge):0)+.2*Math.sin(time*5);shells.forEach(o=>o.visible=topFrag);dragon.scale.setScalar(1+(killAge<.7?Math.sin(killAge/.7*Math.PI)*.08:0));flameLines.forEach((o,i)=>{o.visible=topFrag||killAge<1.5;o.scale.y=1+.1*Math.sin(time*9+i);});
  const action=reloadSeconds!==null?'reload':equipSeconds!==null?'equip':inspectSeconds!==null?'inspect':'idle',sec=reloadSeconds??equipSeconds??inspectSeconds??0,p=sampleC26(action,sec);root.position.fromArray(p.position);root.rotation.fromArray(p.rotation);mag.position.set(-p.mag*.10,-p.mag*.36,p.mag*.08);mag.rotation.set(0,0,-p.mag*.23);bolt.position.z=p.bolt;hands.position.copy(root.position);hands.rotation.copy(root.rotation);left.position.set(-.018-p.mag*.08,-.096-p.mag*.30,-.40+p.left*.16);hands.visible=!showcase||action!=='idle';flash.visible=shotAge>=0&&shotAge<.075;flash.rotation.z=shotAge*40;flash.scale.setScalar(1+Math.max(0,1-shotAge/.075)*.4);
  const value=Math.min(99,Math.max(0,Math.floor(kills)));digits.forEach((arr,d)=>arr.forEach((o,i)=>o.visible=!!(masks[d===0?Math.floor(value/10):value%10]&(1<<i))));
 }
 update();return{model,flash,magazine:null,update,dispose(){new Set(geos).forEach(g=>g.dispose());mats.forEach(m=>m.dispose());}};
}
