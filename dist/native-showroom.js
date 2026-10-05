import * as T from './three.module.js';

// Native view models park alternate parts far outside the FPS camera. Exclude
// those triangles from the collection only; actions restore the original index.
export function prepareNativeShowroom(rig,knife=false){
 const points=[],parts=new Map(),p=new T.Vector3();rig.model.updateMatrixWorld(true);
 for(const mesh of rig.meshes){
  mesh.userData.collectionVisible??=mesh.visible;
  const hidden=mesh.userData.nativeHand||/^(?:vfx|stab|deniste|mvp|aura|trail)/i.test(mesh.name);
  mesh.userData.showroomHidden=hidden;
  const positions=new Map();for(const i of mesh.userData.showroomIndices){if(!positions.has(i)){mesh.getVertexPosition(i,p).applyMatrix4(mesh.matrixWorld);positions.set(i,p.clone());}}
  const skin=mesh.geometry.attributes.skinIndex,weights=mesh.geometry.attributes.skinWeight;
  const attachedTo=(v,pattern)=>{let score=0;for(let k=0;k<4;k++){const weight=weights?.array[v*4+k]??(k===0?1:0);if(!weight)continue;let bone=rig.bones[skin?.array[v*4+k]];while(bone?.isBone){if(pattern.test(bone.name)){score+=weight;break;}bone=bone.parent;}}return score>.5;};
  // A material can contain both hands and weapon triangles. Filtering whole
  // meshes leaves fingers, spare magazines and alternate attachments on top
  // of the gun. Filter the bone attachments without changing the FPS index.
  const indices=[];for(let i=0;i<mesh.userData.showroomIndices.length;i+=3){const tri=mesh.userData.showroomIndices.slice(i,i+3);if(tri.some(v=>Math.abs(positions.get(v).y)>2.5||Math.abs(positions.get(v).z)>10)||tri.every(v=>attachedTo(v,/^(?:[LR]_(?:Clavicle|Shoulder|Elbow|Hand|Thumb|Index|Middle|Ring|Pinky|Twist|Forearm|Upperarm|Palm)|ValveBiped.*(?:Hand|Finger))/i))||tri.some(v=>attachedTo(v,/^(?:(?:GN_)?Magazine2|Magazine_Extra|Bullet2|mag2|b_mag)$|^Ashen_(?:VFX|Spline|Trail|Mag_|Blade_|Handle_)/i)))continue;indices.push(...tri);}
  mesh.userData.collectionIndices=indices;
  if(!hidden&&!mesh.userData.nativeEffect)for(const i of new Set(indices)){
   const point=positions.get(i);points.push(point);
   if(knife){const attachment=rig.bones[skin?.array[i*4]];let bone=attachment;while(bone?.isBone&&!/^Root(?:_?[LR]|[2-9])$/i.test(bone.name))bone=bone.parent;if(bone?.isBone){if(!parts.has(bone))parts.set(bone,{vertices:[],blade:[]});const part=parts.get(bone);part.vertices.push(point);if(/^Chain_jnt_0?1(?:_[LR])?$/i.test(attachment.name))part.blade.push(point);}}
  }
 }
 if(!knife||points.length<3)return new T.Quaternion().setFromEuler(new T.Euler(0,Math.PI/2,-.12));
 const pair=[...parts].filter(([,part])=>part.vertices.length>=100);
 if(pair.length===2&&Math.min(...pair.map(([,p])=>p.vertices.length))/Math.max(...pair.map(([,p])=>p.vertices.length))>.25){
  for(const mesh of rig.meshes)if(/^glow/i.test(mesh.name))mesh.userData.showroomHidden=true;
  // Each blade gets its own broadside view and a reserved gap. These temporary
  // root poses are used only for the collection, never for source actions.
  const panels=pair.map(([bone,{vertices,blade}],i)=>{const rotation=broadsideRotation(blade.length>=100?blade:vertices,Math.PI/2+(i?-.2:.2)),bounds=new T.Box3();for(const point of vertices)bounds.expandByPoint(point.clone().applyQuaternion(rotation));return {bone,rotation,bounds,size:bounds.getSize(new T.Vector3()),center:bounds.getCenter(new T.Vector3())};});
  const gap=Math.max(...panels.map(p=>p.size.y))*.18;
  rig.collectionParts=panels.map((panel,i)=>{
   const offset=new T.Vector3((i?1:-1)*(gap+panel.size.x)/2,0,0).sub(panel.center);
   const delta=new T.Matrix4().compose(offset,panel.rotation,new T.Vector3(1,1,1));
   const local=panel.bone.parent.matrixWorld.clone().invert().multiply(delta).multiply(panel.bone.matrixWorld);
   const target={position:new T.Vector3(),quaternion:new T.Quaternion(),scale:panel.bone.scale.clone()};local.decompose(target.position,target.quaternion,new T.Vector3());
   return {bone:panel.bone,target,pose:bonePose(panel.bone),gap};
  });
  return new T.Quaternion();
 }
 return broadsideRotation(points,-.3);
}
function broadsideRotation(points,tilt){
 // Principal plane gives a readable broadside view even when a kunai is held
 // flat to the FPS camera. No changes to the hand grip or source animation.
 const mean=points.reduce((a,b)=>a.add(b),new T.Vector3()).multiplyScalar(1/points.length),c=[[0,0,0],[0,0,0],[0,0,0]],vectors=[[1,0,0],[0,1,0],[0,0,1]];
 for(const point of points){const v=point.clone().sub(mean).toArray();for(let i=0;i<3;i++)for(let j=0;j<3;j++)c[i][j]+=v[i]*v[j];}
 for(let step=0;step<24;step++){let i=0,j=1;for(const [a,b]of [[0,2],[1,2]])if(Math.abs(c[a][b])>Math.abs(c[i][j])){i=a;j=b;}if(Math.abs(c[i][j])<1e-9)break;const angle=.5*Math.atan2(2*c[i][j],c[j][j]-c[i][i]),co=Math.cos(angle),si=Math.sin(angle);for(let k=0;k<3;k++){const a=c[k][i],b=c[k][j];c[k][i]=co*a-si*b;c[k][j]=si*a+co*b;}for(let k=0;k<3;k++){const a=c[i][k],b=c[j][k];c[i][k]=co*a-si*b;c[j][k]=si*a+co*b;}for(let k=0;k<3;k++){const a=vectors[k][i],b=vectors[k][j];vectors[k][i]=co*a-si*b;vectors[k][j]=si*a+co*b;}}
 const order=[0,1,2].sort((i,j)=>c[j][j]-c[i][i]),x=new T.Vector3(...vectors.map(v=>v[order[0]])),y=new T.Vector3(...vectors.map(v=>v[order[1]]));if(x.x+x.z<0)x.negate();if(y.y<0)y.negate();const z=x.clone().cross(y).normalize(),m=new T.Matrix4().set(x.x,x.y,x.z,0,y.x,y.y,y.z,0,z.x,z.y,z.z,0,0,0,0,1);
 return new T.Quaternion().setFromEuler(new T.Euler(0,0,tilt)).multiply(new T.Quaternion().setFromRotationMatrix(m));
}
const bonePose=bone=>({position:bone.position.clone(),quaternion:bone.quaternion.clone(),scale:bone.scale.clone()});
const samePose=(bone,pose)=>bone.position.distanceToSquared(pose.position)<1e-16&&bone.quaternion.toArray().every((v,i)=>Math.abs(v-pose.quaternion.toArray()[i])<1e-10)&&bone.scale.distanceToSquared(pose.scale)<1e-16;
const applyPose=(bone,pose)=>{bone.position.copy(pose.position);bone.quaternion.copy(pose.quaternion);bone.scale.copy(pose.scale);};
export function showNativeShowroom(rig){
 for(const part of rig.collectionParts||[]){if(!samePose(part.bone,part.target))part.pose=bonePose(part.bone);applyPose(part.bone,part.target);}
 rig.model.updateMatrixWorld(true);rig.skeleton.update();
 for(const m of rig.meshes){m.visible=!!m.userData.collectionVisible&&!m.userData.showroomHidden&&m.userData.collectionIndices.length>0;if(!m.userData.showroomActive){m.geometry.setIndex(m.userData.collectionIndices);m.userData.showroomActive=true;}}
}
export function restoreNativeViewmodel(rig){
 for(const part of rig.collectionParts||[])if(samePose(part.bone,part.target))applyPose(part.bone,part.pose);
 rig.model.updateMatrixWorld(true);rig.skeleton.update();
 for(const m of rig.meshes){m.visible=m.userData.collectionVisible??m.visible;if(m.userData.showroomActive){m.geometry.setIndex(m.userData.nativeIndices);m.userData.showroomActive=false;}}
}
