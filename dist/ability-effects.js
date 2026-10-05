import * as T from './three.module.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const material=(color,opacity=1)=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.6,metalness:.25,roughness:.4,transparent:opacity<1,opacity,depthWrite:opacity===1});
function part(group,geometry,color,pos=[0,0,0],scale=[1,1,1]){const m=new T.Mesh(geometry,material(color));m.position.fromArray(pos);m.scale.fromArray(scale);group.add(m);return m;}
export function utilityArt(kind,color=0x75d7ff){const g=new T.Group();
 if(['drone','bot','satchel','stim'].includes(kind)){part(g,new T.BoxGeometry(.42,.24,.35),kind==='bot'||kind==='satchel'?0xe99736:0x455764);if(kind==='drone')for(const x of [-.4,.4]){const ring=part(g,new T.TorusGeometry(.22,.045,6,18),0x9ebccf,[x,0,0]);ring.rotation.x=Math.PI/2;part(g,new T.BoxGeometry(.34,.025,.07),color,[x,0,0]);}if(kind==='bot'){for(const x of[-.25,.25]){const wheel=part(g,new T.CylinderGeometry(.14,.14,.09,12),0x252c30,[x,-.1,0]);wheel.rotation.z=Math.PI/2;}part(g,new T.SphereGeometry(.10,12,8),0xffef95,[0,.08,-.21]);}if(kind==='satchel')for(const x of[-.12,.12])part(g,new T.CylinderGeometry(.05,.05,.26,8),0xf4dc95,[x,.08,0]);}
 else if(['hawk','hound','seeker'].includes(kind)){part(g,new T.IcosahedronGeometry(.22,1),color,[0,0,0],[1,.9,1.7]);if(kind==='hawk'){for(const x of[-1,1]){const wing=part(g,new T.ConeGeometry(.17,.6,3),color,[x*.3,0,0],[1,.25,1]);wing.rotation.z=x*Math.PI/2;}}else if(kind==='hound'){part(g,new T.ConeGeometry(.17,.28,4),color,[0,.05,-.35]);for(const x of[-.13,.13])for(const z of[-.15,.15])part(g,new T.CylinderGeometry(.04,.05,.24,6),0xadfa9a,[x,-.18,z]);}}
 else if(['shock','reveal','beam'].includes(kind)){part(g,new T.CylinderGeometry(.025,.025,.7,8),color,[0,0,0]);g.children[0].rotation.x=Math.PI/2;part(g,new T.ConeGeometry(.09,.18,6),color,[0,0,-.42]).rotation.x=-Math.PI/2;}
 else {part(g,new T.IcosahedronGeometry(.13,2),color);const ring=part(g,new T.TorusGeometry(.19,.015,5,20),color);ring.rotation.x=.5;}
 return g;
}
export function decorateField(o){const root=o.mesh,c=o.owner.agent==='phoenix'||o.owner.agent==='sarge'?0xff7733:o.owner.agent==='thorne'?0x71f5d9:0x71b8ff;
 if(o.kind==='molly'||o.kind==='firewall'){root.material.color.setHex(c);for(let i=0;i<18;i++){const a=i*2.399,r=Math.sqrt((i+.5)/18)*o.radius;const f=part(root,new T.ConeGeometry(.12,.8+(i%3)*.2,5),i%2?0xff7635:0xffcf67,[Math.cos(a)*r,.35,Math.sin(a)*r]);f.userData.flame=true;}}
 if(o.kind==='slow'){root.material.color.setHex(0x66c9d8);for(let i=0;i<20;i++){const a=i*2.399,r=Math.sqrt(i/20)*o.radius;part(root,new T.OctahedronGeometry(.15+(i%3)*.06),0xc7ffff,[Math.cos(a)*r,.1,Math.sin(a)*r],[1,.35,1]);}}
 if(o.kind==='wall'){root.material.roughness=.18;root.material.metalness=.2;const edges=new T.LineSegments(new T.EdgesGeometry(root.geometry),new T.LineBasicMaterial({color:0xb6ffec,transparent:true,opacity:.65}));root.add(edges);for(let i=0;i<7;i++){const shard=part(root,new T.OctahedronGeometry(.18+(i%3)*.07),0x9cf7e3,[(i%3-1)*.42,(Math.floor(i/3)-1)*.65,.41],[1,1.7,.25]);shard.material.transparent=true;shard.material.opacity=.38;}}
 if(o.kind==='reveal'){root.material.opacity=0;const art=utilityArt('reveal',c);art.rotation.x=Math.PI/2;root.add(art);}
 if(o.kind==='orbital'){root.material.color.setHex(0xffb447);const beam=part(root,new T.CylinderGeometry(o.radius*.86,o.radius*.86,65,32,1,true),0xff9950,[0,32,0]);beam.material.transparent=true;beam.material.opacity=.32;beam.userData.orbitalBeam=true;beam.visible=false;}
}
export class AbilityView {
 constructor(scene){this.group=new T.Group();scene.add(this.group);this.key='';this.group.visible=false;}
 clear(){for(const m of [...this.group.children]){m.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});this.group.remove(m);}this.key='';this.group.visible=false;}
 update(agent,c,u,time){const kind=c?.kind||(u?.equipped!==false?u?.kind:null);if(!kind){this.group.visible=false;return;}const key=agent.id+'/'+kind;if(key!==this.key){this.clear();this.key=key;
  if(['shock','reveal','beam'].includes(kind)){const bow=new T.Group();const curve=new T.CatmullRomCurve3([V(0,-.38,0),V(-.11,-.22,0),V(-.16,0,0),V(-.11,.22,0),V(0,.38,0)]);part(bow,new T.TubeGeometry(curve,24,.035,6,false),0x376b83);part(bow,new T.CylinderGeometry(.007,.007,.76,4),0x8be8ff);bow.add(utilityArt(kind));this.group.add(bow);}
  else if(kind==='knives'){for(let i=0;i<5;i++){const m=part(this.group,new T.ConeGeometry(.025,.23,3),0xefffff,[(i-2)*.11,Math.abs(i-2)*-.03,0]);m.rotation.z=Math.PI;}}
  else if(kind==='rocket'){part(this.group,new T.CylinderGeometry(.12,.12,.65,12),0x658244).rotation.x=Math.PI/2;part(this.group,new T.CylinderGeometry(.18,.18,.1,12),0xe4b040,[0,0,-.34]).rotation.x=Math.PI/2;}
  else this.group.add(utilityArt(agent.id==='guide'&&kind==='flash'?'hawk':kind,agent.id==='phoenix'?0xff903c:agent.colors[2]));
 }
 this.group.visible=true;const charge=c?.charge||0,release=c?.phase==='recover',age=release?c.clock:0;this.group.position.set(['shock','reveal','beam'].includes(kind)?-.32:.25,-.28-Math.sin(Math.min(1,age/.45)*Math.PI)*.18,-.72-charge*.06);this.group.rotation.set(0,.12,Math.sin(time*2)*.02);if(kind==='knives')this.group.children.forEach((m,i)=>m.visible=i<(u?.ammo||5));
 }
}
