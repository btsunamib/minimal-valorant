import * as T from './three.module.js';
import {loadGoldSrc} from './goldsrc-model.js?v=20261005-palette5';
import {sequenceFor} from './imported-weapons.js?v=20261005-palette5';
import {prepareNativeShowroom,showNativeShowroom} from './native-showroom.js';
export class NativeUtilities {
 constructor(scene){this.scene=scene;this.kind=null;this.rig=null;this.serial=0;this.seconds=0;}
 set(kind){if(kind===this.kind)return;this.serial++;this.rig?.dispose();this.rig=null;this.kind=kind;this.seconds=0;if(!kind)return;const serial=this.serial;loadGoldSrc('./assets/imported/utilities/'+kind+'.mdl.gz').then(p=>{if(serial!==this.serial)return;this.rig=p.instantiate();this.scene.add(this.rig.model);}).catch(()=>{});}
 update(dt,progress){if(!this.rig)return false;this.seconds+=dt;const seq=this.kind==='c4'?this.rig.sequences.find(s=>/pressbutton/i.test(s.name)):this.rig.sequences.find(s=>s.name==='start');const index=seq?.index??sequenceFor(this.rig.sequences,'idle'),s=this.rig.sequences[index];this.rig.sample(index,Math.min(s.frames-1,(progress||this.seconds)*s.fps));return true;}
 reset(){this.set(null);}
}
export async function createNativeSpike(){const p=await loadGoldSrc('./assets/imported/utilities/c4.mdl.gz'),rig=p.instantiate({world:true});rig.sample(0,0);prepareNativeShowroom(rig);showNativeShowroom(rig);rig.model.updateMatrixWorld(true);const bounds=new T.Box3(),v=new T.Vector3();for(const m of rig.meshes)if(m.visible)for(const i of m.userData.collectionIndices){m.getVertexPosition(i,v).applyMatrix4(m.matrixWorld);bounds.expandByPoint(v);}const center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3()),wrapper=new T.Group();wrapper.add(rig.model);rig.model.position.sub(center);wrapper.scale.setScalar(.55/Math.max(size.x,size.y,size.z,.1));return{model:wrapper,dispose(){rig.dispose();wrapper.removeFromParent();}};}
