from pathlib import Path
import numpy as np,json,gzip,base64,subprocess
from PIL import Image
root=Path(__file__).resolve().parents[1];folder=root/'dist/assets/imported/champions25source/base';d=json.loads(gzip.decompress((folder/'model.json.gz').read_bytes()))
def matrix(pos,q):
 x,y,z,w=q;m=np.eye(4);m[:3,:3]=[[1-2*y*y-2*z*z,2*x*y-2*z*w,2*x*z+2*y*w],[2*x*y+2*z*w,1-2*x*x-2*z*z,2*y*z-2*x*w],[2*x*z-2*y*w,2*y*z+2*x*w,1-2*x*x-2*y*y]];m[:3,3]=pos;return m
rest=[];pose=[];frame=d['sequences'][0]['poses'][0]
for i,b in enumerate(d['bones']):
 r=matrix(b['position'],b['quaternion']);a=matrix(frame[i*7:i*7+3],frame[i*7+3:i*7+7]);par=b['parent'];rest.append(rest[par]@r if par>=0 else r);pose.append(pose[par]@a if par>=0 else a)
trans=[a@np.linalg.inv(r)for a,r in zip(pose,rest)];meshes=[];textures={}
for m in d['meshes']:
 tex=d['textures'][m['texture']]
 if tex['name'].startswith('fp_') or tex['additive']:continue
 p=np.array(m['positions']).reshape(-1,3);ix=np.array(m['indices']).reshape(-1,4);weights=np.array(m['weights']).reshape(-1,4);p=np.column_stack((p,np.ones(len(p))));posed=np.zeros((len(p),4))
 for k in range(4):posed+=np.einsum('nij,nj->ni',np.array(trans)[ix[:,k]],p)*weights[:,k:k+1]
 projected=np.column_stack((posed[:,0],posed[:,2],-posed[:,1]));meshes.append(dict(vertices=projected.flatten().tolist(),uv=m['uv'],triangles=m['triangles'],texture=tex['name'],additive=tex['additive']));im=Image.open(folder/tex['file']).convert('RGBA');textures[tex['name']]=dict(width=im.width,height=im.height,rgba=base64.b64encode(im.tobytes()).decode())
subprocess.run(['python',str(root/'scripts/render-native-thumbnail.py'),str(folder/'thumb.webp')],input=json.dumps(dict(meshes=meshes,textures=textures)),text=True,check=True)
print('Source model thumbnail rendered')
