"""Decode supplied Source v49 MDL/VVD/VTX including original bone animations.
Based on Valve source-sdk-2013 public/studio.h and public/optimize.h structures.
"""
from pathlib import Path
import struct,json,gzip,math,re,sys
import base64
import numpy as np
from PIL import Image
root=Path(sys.argv[1]);p=next(root.rglob('v_rif_ak47.mdl'));mdl=p.read_bytes();vvd=p.with_suffix('.vvd').read_bytes();vtx=p.with_name(p.stem+'.dx90.vtx').read_bytes();out=Path('dist/assets/imported/champions25source/base');out.mkdir(parents=True,exist_ok=True)
def I(b,o):return struct.unpack_from('<i',b,o)[0]
def H(b,o):return struct.unpack_from('<H',b,o)[0]
def F(b,o):return struct.unpack_from('<f',b,o)[0]
def S(b,o):return b[o:].split(b'\0')[0].decode(errors='replace')
def quat(e):
 x,y,z=(a/2 for a in e);sx,cx,sy,cy,sz,cz=math.sin(x),math.cos(x),math.sin(y),math.cos(y),math.sin(z),math.cos(z);return [sx*cy*cz-cx*sy*sz,cx*sy*cz+sx*cy*sz,cx*cy*sz-sx*sy*cz,cx*cy*cz+sx*sy*sz]
def q48(b,o):
 x,y,z=struct.unpack_from('<3H',b,o);x=(x-32768)/32768;y=(y-32768)/32768;zz=((z&32767)-16384)/16384;return[x,y,zz,math.sqrt(max(0,1-x*x-y*y-zz*zz))*(-1 if z&32768 else 1)]
def q64(b,o):
 n=struct.unpack_from('<Q',b,o)[0];v=[((n>>s)&2097151)/1048576-1 for s in [0,21,42]];return v+[math.sqrt(max(0,1-sum(x*x for x in v)))*(-1 if n>>63 else 1)]
bones=[]
for j in range(I(mdl,156)):
 o=I(mdl,160)+j*216;bones.append(dict(name=S(mdl,o+I(mdl,o)),parent=I(mdl,o+4),position=list(struct.unpack_from('<3f',mdl,o+32)),quaternion=list(struct.unpack_from('<4f',mdl,o+44)),rotation=list(struct.unpack_from('<3f',mdl,o+60)),posscale=list(struct.unpack_from('<3f',mdl,o+72)),rotscale=list(struct.unpack_from('<3f',mdl,o+84))))
# Source RLE channels are decoded at every original frame, including sections.
def channel(base,k,f):
 offset=H(mdl,base+k*2)
 if not offset:return 0
 o=base+offset
 for _ in range(10000):
  valid,total=mdl[o],mdl[o+1]
  if total==0 or valid==0 or valid>total:raise ValueError('bad animation run')
  if f<total:return struct.unpack_from('<h',mdl,o+2*min(f+1,valid))[0]
  f-=total;o+=2*(valid+1)
 raise ValueError('animation run overflow')
anims=[]
for j in range(I(mdl,180)):
 a=I(mdl,184)+j*100;nf=I(mdl,a+16);section=I(mdl,a+80);sectionFrames=I(mdl,a+84);frames=[]
 for f in range(nf):
  localf=f;offset=I(mdl,a+56)
  if sectionFrames:
   sec=f//sectionFrames;localf=f%sectionFrames
   if f==nf-1 and nf>sectionFrames:sec=nf//sectionFrames+1;localf=0
   block,offset=struct.unpack_from('<2i',mdl,a+section+sec*8);assert block==0
  o=a+offset;pose=[[*b['position'],*b['quaternion']] for b in bones]
  if offset:
   for _ in range(len(bones)+1):
    bone,flags,nxt=struct.unpack_from('<BBh',mdl,o)
    if bone==255:break
    assert bone<len(bones),(j,f,bone)
    b=bones[bone];pos=b['position'][:];q=b['quaternion'][:];data=o+4
    if flags&2:q=q48(mdl,data)
    if flags&32:q=q64(mdl,data)
    if flags&1:pos=list(struct.unpack_from('<3e',mdl,data+(6 if flags&2 else 0)+(8 if flags&32 else 0)))
    if flags&8:q=quat([channel(data,k,localf)*b['rotscale'][k]+(0 if flags&16 else b['rotation'][k]) for k in range(3)])
    if flags&4:pos=[channel(data+(6 if flags&8 else 0),k,localf)*b['posscale'][k]+(0 if flags&16 else b['position'][k]) for k in range(3)]
    pose[bone]=[*pos,*q]
    if not nxt:break
    o+=nxt
  frames.append([round(x,7) for row in pose for x in row])
 anims.append(dict(fps=F(mdl,a+8),frames=frames))
seqs=[];sounds=[x for x in root.rglob('*') if x.suffix.lower()=='.wav']
soundout=out.parent/'sound';soundout.mkdir(exist_ok=True)
for s in sounds:(soundout/s.name.lower()).write_bytes(s.read_bytes())
for j in range(I(mdl,188)):
 o=I(mdl,192)+j*212;ai=H(mdl,o+I(mdl,o+60));a=anims[ai];events=[]
 for k in range(I(mdl,o+24)):
  ev=o+I(mdl,o+28)+k*80;cycle=F(mdl,ev);code=I(mdl,ev+4);opt=S(mdl,ev+12);matches=[x for x in sounds if opt.lower().removeprefix('a').replace('_','')==x.stem.lower().replace('_','')]
  events.append(dict(frame=round(cycle*(len(a['frames'])-1)),event=code,options=opt,sound=matches[0].name.lower() if matches else None))
 seqs.append(dict(index=j,name=S(mdl,o+I(mdl,o+4)),fps=a['fps'],frames=len(a['frames']),loop=bool(I(mdl,o+12)&1),events=events,poses=a['frames']))
# VTF textures: DXT1 and DXT5 are expanded to exact palette pixels.
def decodevtf(p):
 b=p.read_bytes();w,h=struct.unpack_from('<2H',b,16);fmt=I(b,52);bs=8 if fmt==13 else 16;size=((w+3)//4)*((h+3)//4)*bs;data=b[-size:];image=np.zeros((h,w,4),np.uint8);o=0
 def rgb(c):return np.array([((c>>11)&31)*255//31,((c>>5)&63)*255//63,(c&31)*255//31],int)
 for y in range(0,h,4):
  for x in range(0,w,4):
   block=data[o:o+bs];o+=bs;alpha=np.full(16,255,int)
   if fmt==15:
    a0,a1=block[0],block[1];ap=[a0,a1]+([( (7-k)*a0+k*a1)//7 for k in range(1,7)] if a0>a1 else [((5-k)*a0+k*a1)//5 for k in range(1,5)]+[0,255]);bits=int.from_bytes(block[2:8],'little');alpha=np.array([ap[(bits>>(3*k))&7] for k in range(16)]);block=block[8:]
   c0,c1,bits=struct.unpack_from('<HHI',block);colors=[rgb(c0),rgb(c1)]
   colors += [(2*colors[0]+colors[1])//3,(colors[0]+2*colors[1])//3] if c0>c1 or fmt==15 else [(colors[0]+colors[1])//2,np.zeros(3,int)]
   for k in range(16):
    ix=(bits>>(2*k))&3;yy,xx=y+k//4,x+k%4
    if yy<h and xx<w:image[yy,xx]=[*colors[ix],0 if fmt==13 and c0<=c1 and ix==3 else alpha[k]]
 return Image.fromarray(image)
textures=[]
for j in range(I(mdl,204)):
 o=I(mdl,208)+j*64;name=S(mdl,o+I(mdl,o));tex=next(root.rglob(name+'.vtf'));im=decodevtf(tex);im.save(out/(name+'.png'));vmt=tex.with_suffix('.vmt').read_text(errors='replace');textures.append(dict(name=name,file=name+'.png',width=im.width,height=im.height,rgba=base64.b64encode(im.convert('RGBA').tobytes()).decode(),additive=bool(re.search(r'\$additive"?\s+"?1',vmt,re.I)),alpha=bool(re.search(r'\$(?:translucent|alphatest)"?\s+"?1',vmt,re.I)),emissive=bool(re.search(r'\$(?:selfillum|additive)"?\s+"?1',vmt,re.I))))
meshes=[];vertexStart=I(vvd,56)
for body in range(I(mdl,232)):
 bp=I(mdl,236)+body*16;model=bp+I(mdl,bp+12);vbp=I(vtx,32)+body*8;vm=vbp+I(vtx,vbp+4);lod=vm+I(vtx,vm+4)
 for j in range(I(mdl,model+72)):
  mp=model+I(mdl,model+76)+j*116;material=I(mdl,mp);base=I(mdl,model+84)//48+I(mdl,mp+12);n=I(mdl,mp+8);positions=[];normals=[];uv=[];indices=[];weights=[]
  for k in range(n):
   v=vertexStart+(base+k)*48;weights += list(struct.unpack_from('<3f',vvd,v))+[0];indices+=list(vvd[v+12:v+15])+[0];positions+=list(struct.unpack_from('<3f',vvd,v+16));normals+=list(struct.unpack_from('<3f',vvd,v+28));uv+=list(struct.unpack_from('<2f',vvd,v+40))
  vh=lod+I(vtx,lod+4)+j*9;triangles=[]
  for g in range(I(vtx,vh)):
   sg=vh+I(vtx,vh+4)+g*25;nv,vo,ni,io,ns,so=struct.unpack_from('<6i',vtx,sg);mapping=[H(vtx,sg+vo+k*9+4) for k in range(nv)];ix=[H(vtx,sg+io+k*2) for k in range(ni)]
   for st in range(ns):
    sh=sg+so+st*27;cnt,offset=struct.unpack_from('<2i',vtx,sh);flags=vtx[sh+18];sl=ix[offset:offset+cnt]
    if flags&1:triangles += [mapping[k] for k in sl]
    else:
     for k in range(2,len(sl)):
      tris=[sl[k-2],sl[k-1],sl[k]] if k%2==0 else [sl[k-1],sl[k-2],sl[k]]
      if len(set(tris))==3:triangles += [mapping[k] for k in tris]
  assert max(triangles,default=0)<n
  meshes.append(dict(texture=material,positions=positions,normals=normals,uv=uv,indices=indices,weights=weights,triangles=triangles))
asset=dict(format='source49',bones=bones,textures=textures,meshes=meshes,sequences=seqs)
(out/'model.json.gz').write_bytes(gzip.compress(json.dumps(asset,separators=(',',':')).encode(),mtime=0));(out/'sequences.json').write_text(json.dumps([{k:v for k,v in s.items() if k!='poses'} for s in seqs]))
print('Source model converted:',len(bones),'bones',len(meshes),'meshes',sum(s['frames'] for s in seqs),'frames',sum(len(m['triangles'])//3 for m in meshes),'triangles')
