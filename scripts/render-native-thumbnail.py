"""Orthographic native textured-mesh rasterizer for small collection thumbnails."""
import sys,json,base64
import numpy as np
from PIL import Image
d=json.load(sys.stdin);W,H=512,256
points=np.concatenate([np.asarray(m['vertices']).reshape(-1,3) for m in d['meshes']])
lo,hi=points.min(axis=0),points.max(axis=0)
center=(lo+hi)/2
scale=min((W-32)/max(hi[0]-lo[0],.01),(H-32)/max(hi[1]-lo[1],.01))
out=np.zeros((H,W,4),dtype=np.uint8);depth=np.full((H,W),-np.inf)
textures={k:np.frombuffer(base64.b64decode(v['rgba']),np.uint8).reshape(v['height'],v['width'],4) for k,v in d['textures'].items()}
for m in d['meshes']:
    p=np.asarray(m['vertices']).reshape(-1,3);uv=np.asarray(m['uv']).reshape(-1,2)
    screen=np.column_stack(((p[:,0]-center[0])*scale+W/2,-(p[:,1]-center[1])*scale+H/2,p[:,2]))
    tex=textures[m['texture']];th,tw=tex.shape[:2]
    for tri in np.asarray(m['triangles']).reshape(-1,3):
        a,b,c=screen[tri];x0=max(0,int(np.floor(min(a[0],b[0],c[0]))));x1=min(W-1,int(np.ceil(max(a[0],b[0],c[0]))))
        y0=max(0,int(np.floor(min(a[1],b[1],c[1]))));y1=min(H-1,int(np.ceil(max(a[1],b[1],c[1]))))
        if x0>x1 or y0>y1:continue
        denom=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
        if abs(denom)<1e-8:continue
        yy,xx=np.mgrid[y0:y1+1,x0:x1+1];xx=xx+.5;yy=yy+.5
        wa=((b[1]-c[1])*(xx-c[0])+(c[0]-b[0])*(yy-c[1]))/denom
        wb=((c[1]-a[1])*(xx-c[0])+(a[0]-c[0])*(yy-c[1]))/denom;wc=1-wa-wb
        z=wa*a[2]+wb*b[2]+wc*c[2];zbuf=depth[y0:y1+1,x0:x1+1]
        mask=(wa>=-1e-5)&(wb>=-1e-5)&(wc>=-1e-5)&(z>=zbuf)
        if not mask.any():continue
        uvs=uv[tri];u=wa*uvs[0,0]+wb*uvs[1,0]+wc*uvs[2,0];v=wa*uvs[0,1]+wb*uvs[1,1]+wc*uvs[2,1]
        pixels=tex[np.clip((v*th).astype(int),0,th-1),np.clip((u*tw).astype(int),0,tw-1)]
        mask &= pixels[:,:,3]>127
        target=out[y0:y1+1,x0:x1+1]
        if m.get('additive'):
            mask &= pixels[:,:,:3].max(axis=2)>10
            mixed=np.minimum(255,target.astype(np.uint16)+pixels.astype(np.uint16)).astype(np.uint8)
            mixed[:,:,3]=np.maximum(target[:,:,3],pixels[:,:,3]);target[mask]=mixed[mask]
        else:target[mask]=pixels[mask];zbuf[mask]=z[mask]
Image.fromarray(out).save(sys.argv[1],lossless=True)
