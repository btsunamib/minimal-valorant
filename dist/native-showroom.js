import * as T from './three.module.js';

// Native view models park alternate parts far outside the FPS camera. Exclude
// those triangles from the collection only; actions restore the original index.
export function prepareNativeShowroom(rig,knife=false){
 const points=[],p=new T.Vector3();rig.model.updateMatrixWorld(true);
 for(const mesh of rig.meshes){
  mesh.userData.collectionVisible??=mesh.visible;
  const hidden=mesh.userData.nativeHand||/^(?:vfx|stab|deniste|mvp|aura|trail)/i.test(mesh.name);
  mesh.userData.showroomHidden=hidden;
  const positions=new Map();for(const i of mesh.userData.showroomIndices){if(!positions.has(i)){mesh.getVertexPosition(i,p).applyMatrix4(mesh.matrixWorld);positions.set(i,p.clone());}}
  const indices=[];for(let i=0;i<mesh.userData.showroomIndices.length;i+=3){const tri=mesh.userData.showroomIndices.slice(i,i+3);if(tri.some(v=>Math.abs(positions.get(v).y)>2.5||Math.abs(positions.get(v).z)>10))continue;indices.push(...tri);}
  mesh.userData.collectionIndices=indices;
  if(!hidden&&!mesh.userData.nativeEffect)for(const i of new Set(indices))points.push(positions.get(i));
 }
 if(!knife||points.length<3)return new T.Quaternion().setFromEuler(new T.Euler(0,Math.PI/2,-.12));
 // Principal plane gives a readable broadside view even when a kunai is held
 // flat to the FPS camera. No changes to the hand grip or source animation.
 const mean=points.reduce((a,b)=>a.add(b),new T.Vector3()).multiplyScalar(1/points.length),c=[[0,0,0],[0,0,0],[0,0,0]],vectors=[[1,0,0],[0,1,0],[0,0,1]];
 for(const point of points){const v=point.clone().sub(mean).toArray();for(let i=0;i<3;i++)for(let j=0;j<3;j++)c[i][j]+=v[i]*v[j];}
 for(let step=0;step<24;step++){let i=0,j=1;for(const [a,b]of [[0,2],[1,2]])if(Math.abs(c[a][b])>Math.abs(c[i][j])){i=a;j=b;}if(Math.abs(c[i][j])<1e-9)break;const angle=.5*Math.atan2(2*c[i][j],c[j][j]-c[i][i]),co=Math.cos(angle),si=Math.sin(angle);for(let k=0;k<3;k++){const a=c[k][i],b=c[k][j];c[k][i]=co*a-si*b;c[k][j]=si*a+co*b;}for(let k=0;k<3;k++){const a=c[i][k],b=c[j][k];c[i][k]=co*a-si*b;c[j][k]=si*a+co*b;}for(let k=0;k<3;k++){const a=vectors[k][i],b=vectors[k][j];vectors[k][i]=co*a-si*b;vectors[k][j]=si*a+co*b;}}
 const order=[0,1,2].sort((i,j)=>c[j][j]-c[i][i]),x=new T.Vector3(...vectors.map(v=>v[order[0]])),y=new T.Vector3(...vectors.map(v=>v[order[1]]));if(x.x+x.z<0)x.negate();if(y.y<0)y.negate();const z=x.clone().cross(y).normalize(),m=new T.Matrix4().set(x.x,x.y,x.z,0,y.x,y.y,y.z,0,z.x,z.y,z.z,0,0,0,0,1);
 return new T.Quaternion().setFromEuler(new T.Euler(0,0,-.3)).multiply(new T.Quaternion().setFromRotationMatrix(m));
}
export function showNativeShowroom(rig){for(const m of rig.meshes){m.visible=!!m.userData.collectionVisible&&!m.userData.showroomHidden&&m.userData.collectionIndices.length>0;if(!m.userData.showroomActive){m.geometry.setIndex(m.userData.collectionIndices);m.userData.showroomActive=true;}}}
export function restoreNativeViewmodel(rig){for(const m of rig.meshes){m.visible=m.userData.collectionVisible??m.visible;if(m.userData.showroomActive){m.geometry.setIndex(m.userData.nativeIndices);m.userData.showroomActive=false;}}}
