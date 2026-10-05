import * as T from './three.module.js';
import {loadGoldSrc} from './goldsrc-model.js?v=20261006-collection1';
import {prepareNativeShowroom,showNativeShowroom} from './native-showroom.js?v=20261006-collection1';
export const HUMAN_PROPORTIONS=Object.freeze({height:1.86,headHeight:.24,headWidth:.18,eye:1.73,shoulder:1.51,hip:.93});
export const NATIVE_AGENT_IDS=Object.freeze(['wushu','thorne','hunter','phoenix','sarge','guide']);
const models=new Map();let preparation=null;
export async function preloadAgentModels({loader=loadGoldSrc,onProgress=()=>{}}={}){
 if(preparation)return preparation;
 preparation=(async()=>{
  let completed=0;const total=NATIVE_AGENT_IDS.length+3;
  // Three concurrent downloads keep memory and mobile decompression bounded.
  // The source ledger confirms CT/T files are byte-identical for this package.
  const tasks=NATIVE_AGENT_IDS.map(id=>({key:id+'/ct',alias:id+'/t',url:'./assets/agent-models/'+id+'/ct.mdl.gz'}));
  tasks.push(...['classic','vandal','phantom'].map(id=>({key:'weapon/'+id,url:'./assets/imported/valstrike'+id+'/base/model.mdl.gz'})));
  let cursor=0;await Promise.all(Array.from({length:3},async()=>{while(cursor<tasks.length){const task=tasks[cursor++];if(!models.has(task.key))models.set(task.key,await loader(task.url));if(task.alias)models.set(task.alias,models.get(task.key));onProgress({completed:++completed,total});}}));
 })().catch(e=>{preparation=null;throw e;});
 return preparation;
}
const find=(rig,name)=>rig.sequences.find(s=>s.name===name)?.index??1;
export function createAgentModel(agent,{team=0,armed=true,weapon='vandal'}={}){
 const key=agent.id+'/'+(team===0?'ct':'t'),parsed=models.get(key);
 if(!parsed)throw Error('人物模型尚未载入：'+agent.name);
 const rig=parsed.instantiate({world:true}),model=new T.Group();model.name='native-agent-'+agent.id;model.add(rig.model);
 // Characters face GoldSrc +X; gameplay faces -Z. Keep the imported bone axes.
 rig.model.quaternion.setFromRotationMatrix(new T.Matrix4().set(0,-1,0,0,0,0,1,0,-1,0,0,0,0,0,0,1));
 rig.sample(find(rig,'idle1'),0);model.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(rig.model),height=bounds.max.y-bounds.min.y,scale=HUMAN_PROPORTIONS.height/height;
 rig.model.scale.multiplyScalar(scale);rig.model.position.y=-bounds.min.y*scale;
 for(const mesh of rig.meshes){mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.nativeAgent=true;}
 // Only invisible gameplay hit areas use primitive geometry.
 const hitMaterial=new T.MeshBasicMaterial({visible:false,transparent:true,opacity:0});
 const head=new T.Mesh(new T.SphereGeometry(.12,8,6),hitMaterial),body=new T.Mesh(new T.BoxGeometry(.43,1.46,.28),hitMaterial);body.position.y=.88;model.add(head,body);
 const headBone=rig.bones.find(b=>/\bhead$/i.test(b.name)),rightHand=rig.bones.find(b=>/\bR Hand$/i.test(b.name));
 const point=new T.Vector3();let held=null,heldWrapper=null,time=0,lastAction='';
 let heldWeapon=null;
 function setWeapon(id){if(!armed||id===heldWeapon||!models.has('weapon/'+id))return;held?.dispose();heldWrapper?.removeFromParent();heldWeapon=id;lastAction='';
  held=models.get('weapon/'+id).instantiate();held.sample(0,0);prepareNativeShowroom(held);showNativeShowroom(held);
  heldWrapper=new T.Group();heldWrapper.add(held.model);model.add(heldWrapper);held.model.updateMatrixWorld(true);
  const box=new T.Box3(),v=new T.Vector3();for(const m of held.meshes)if(m.visible&&!m.userData.nativeEffect)for(const i of new Set(m.geometry.index.array)){m.getVertexPosition(i,v).applyMatrix4(m.matrixWorld);box.expandByPoint(v);}
  const size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
  const ratio=(id==='classic'?.28:.78)/Math.max(size.z,size.x,.1);held.model.scale.multiplyScalar(ratio);held.model.position.sub(center.multiplyScalar(ratio));
 }
 setWeapon(weapon);
 function update({moving=false,shooting=false,casting=false,dt=0}={}){
  const action=casting?'ref_aim_grenade':moving?'run':shooting?(heldWeapon==='classic'?'ref_shoot_onehanded':'ref_shoot_rifle'):(heldWeapon==='classic'?'ref_aim_onehanded':'ref_aim_rifle');if(action!==lastAction){time=0;lastAction=action;}time+=Math.max(0,dt);
  const index=find(rig,action),s=rig.sequences[index],frame=s.frames>1?(time*s.fps)%(s.frames-1):0;rig.sample(index,frame);model.updateMatrixWorld(true);
  if(headBone){headBone.getWorldPosition(point);head.position.copy(model.worldToLocal(point));head.position.y+=.04;}else head.position.set(0,1.74,0);
  if(held){held.model.visible=!casting;if(rightHand){rightHand.getWorldPosition(point);heldWrapper.position.copy(model.worldToLocal(point));heldWrapper.position.add(new T.Vector3(0,.015,-.18));}else heldWrapper.position.set(.16,1.25,-.30);}
 }
 update();model.userData.agent=agent.id;model.userData.native=true;model.userData.proportions=HUMAN_PROPORTIONS;
 return {model,head,body,rig,held,legs:[],arms:[],update,setWeapon,get weapon(){return heldWeapon;},dispose(){rig.dispose();held?.dispose();head.geometry.dispose();body.geometry.dispose();hitMaterial.dispose();model.removeFromParent();}};
}
