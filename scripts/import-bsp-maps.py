"""Convert supplied GoldSrc BSP v30 (textures + baked lighting + brush entities),
NAV v5, skyboxes and MDL props into small self-contained browser maps."""
from pathlib import Path
import struct,re,json,gzip,sys,math,hashlib,collections
import numpy as np
from PIL import Image
ROOT=Path(sys.argv[1]);OUT=Path('dist/assets/maps');reports=[]
def dump(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(gzip.compress(json.dumps(d,separators=(',',':')).encode(),mtime=0))
def navparse(path):
 b=path.read_bytes();p=12
 def r(fmt):
  nonlocal p
  v=struct.unpack_from('<'+fmt,b,p);p+=struct.calcsize('<'+fmt);return v[0] if len(v)==1 else v
 for _ in range(r('H')):
  n=r('H');p+=n
 areas=[]
 for _ in range(r('I')):
  aid=r('I');attr=r('B');nw=r('3f');se=r('3f');ne,sw=r('2f');con=[]
  for k in range(4):con += [r('I') for _ in range(r('I'))]
  n=r('B');p+=n*17;n=r('B');p+=n*14
  for _ in range(r('I')):
   r('I');r('B');r('I');r('B');n=r('B');p+=n*5
  r('H');areas.append(dict(id=aid,bounds=[nw[0]/32,-se[1]/32,se[0]/32,-nw[1]/32],heights=[sw/32,se[2]/32,nw[2]/32,ne/32],links=con))
 assert p==len(b),(path,p,len(b));return areas
for path in sorted(ROOT.rglob('*.bsp')):
 key={'de_ascent_v1':'ascent'}.get(path.stem,path.stem.replace('valorant_',''));
 if len(sys.argv)>2 and key!=sys.argv[2]:continue
 dest=OUT/key;dest.mkdir(parents=True,exist_ok=True);b=path.read_bytes();lumps=[struct.unpack_from('<ii',b,4+i*8) for i in range(15)];L=lambda i:b[lumps[i][0]:sum(lumps[i])]
 ents=[dict(re.findall(r'"([^"]*)"\s*"([^"]*)"',e)) for e in re.findall(r'\{([^}]*)\}',L(0).decode('latin1'))]
 verts=np.asarray(list(struct.iter_unpack('<3f',L(3))));edges=list(struct.iter_unpack('<2H',L(12)));surf=[x[0] for x in struct.iter_unpack('<i',L(13))];infos=list(struct.iter_unpack('<8f2i',L(6)));faces=list(struct.iter_unpack('<Hhihh4Bi',L(7)));models=list(struct.iter_unpack('<9f7i',L(14)));planes=[list(x[:4]) for x in struct.iter_unpack('<4fi',L(1))];nodes=[list((x[0],x[1],x[2])) for x in struct.iter_unpack('<i2h6h2H',L(5))];leaves=[x[0] for x in struct.iter_unpack('<ii6h2H4B',L(10))]
 tex=L(2);textures=[];missing=[]
 for ti in range(struct.unpack_from('<i',tex)[0]):
  offset=struct.unpack_from('<i',tex,4+ti*4)[0]
  if offset<0:textures.append(dict(name='missing',file=None,size=[64,64]));missing.append(ti);continue
  name=tex[offset:offset+16].split(b'\0')[0].decode('latin1');w,h,*mips=struct.unpack_from('<6I',tex,offset+16);fn=f'texture-{ti}.png';rec=dict(name=name,file=fn,size=[w,h],alpha=name.startswith('{'))
  if mips[0] and w*h<16777216:
   pix=np.frombuffer(tex,dtype=np.uint8,count=w*h,offset=offset+mips[0]);palpos=offset+mips[3]+(w//8)*(h//8)+2;palette=np.frombuffer(tex,dtype=np.uint8,count=768,offset=palpos).reshape(256,3);rgba=np.full((h*w,4),255,np.uint8);rgba[:,:3]=palette[pix]
   if rec['alpha']:rgba[pix==255,3]=0
   Image.fromarray(rgba.reshape(h,w,4)).save(dest/fn)
  else:
   rec['file']=None;missing.append(ti)
  textures.append(rec)
 # Keep only visible brush surfaces. Invisible gameplay triggers are never rendered.
 allowed={0};solidRoots=[models[0][9]]
 for e in ents:
  if e.get('model','').startswith('*'):
   mi=int(e['model'][1:]);cl=e.get('classname','');hidden=e.get('zhlt_invisible')=='1' or cl.startswith(('trigger','func_buy','func_bomb','func_ladder'))
   if not hidden and cl not in ['func_door','func_door_rotating']:allowed.add(mi)
   if not hidden and cl in ['func_wall','func_breakable']:solidRoots.append(dict(node=models[mi][9],bounds=list(models[mi][:6])))
 groups={};floorTriangles=[];wallSegments=[];drawn=0
 for mi in allowed:
  model=models[mi]
  for fi in range(model[-2],model[-2]+model[-1]):
   pl,side,first,count,info,*tail=faces[fi];styles=tail[:4];light=tail[4];t=infos[info];ti=t[8];texture=textures[ti];name=texture['name'].lower()
   if name.startswith(('sky','clip','origin','aaatrigger','null','hint','skip')):continue
   poly=np.asarray([verts[edges[abs(surf[first+j])][0 if surf[first+j]>=0 else 1]] for j in range(count)])
   if count<3:continue
   s=poly@np.asarray(t[:3])+t[3];v=poly@np.asarray(t[4:7])+t[7];w,h=texture['size'];uv=np.column_stack((s/w,v/h));normal=np.asarray(planes[pl][:3])*(-1 if side else 1);pts=np.column_stack((poly[:,0]/32,poly[:,2]/32,-poly[:,1]/32));norm=[normal[0],normal[2],-normal[1]]
   col=np.ones((count,3))
   if light>=0 and styles[0]!=255:
    mn=np.floor([s.min()/16,v.min()/16]).astype(int);mx=np.ceil([s.max()/16,v.max()/16]).astype(int);lw,lh=mx-mn+1
    if light+lw*lh*3<=len(L(8)):
     lit=np.frombuffer(L(8),np.uint8,count=lw*lh*3,offset=light).reshape(lh,lw,3);xs=np.clip(np.rint(s/16-mn[0]).astype(int),0,lw-1);ys=np.clip(np.rint(v/16-mn[1]).astype(int),0,lh-1);col=np.clip(lit[ys,xs]/128,.36,1.22)
   group=groups.setdefault(ti,dict(texture=ti,positions=[],normals=[],uv=[],colors=[]))
   for j in range(1,count-1):
    ix=[0,j,j+1]
    if normal[2]>.65:floorTriangles.append(pts[ix].tolist())
    elif abs(normal[2])<.4:
     tri=pts[ix];pairs=[(a,c)for a in range(3)for c in range(a+1,3)];a,c=max(pairs,key=lambda q:np.linalg.norm(tri[q[0],[0,2]]-tri[q[1],[0,2]]));wallSegments.append([float(tri[a,0]),float(tri[a,2]),float(tri[c,0]),float(tri[c,2]),float(tri[:,1].min()),float(tri[:,1].max())])
    for k in ix:
     group['positions']+=np.round(pts[k],5).tolist();group['normals']+=np.round(norm,5).tolist();group['uv']+=np.round(uv[k],6).tolist();group['colors']+=np.round(col[k],4).tolist()
   drawn+=1
 def contents(x,y,z):
  for root in solidRoots[:1]:
   if isinstance(root,dict):
    bb=root['bounds']
    if not all(bb[i]-.01<=v<=bb[i+3]+.01 for i,v in enumerate([x,y,z])):continue
    n=root['node']
   else:n=root
   for _ in range(1000):
    if n<0:
     if leaves[-n-1]==-2:return -2
     break
    pl,a,c=nodes[n];nx,ny,nz,d=planes[pl];n=a if nx*x+ny*y+nz*z-d>=0 else c
  return -1
 navpath=next(path.parent.glob('*.nav'),None)
 if navpath:areas=navparse(navpath)
 else:
  # Flood playable floor tiles from actual spawns, preserving steps and excluding roofs.
  floors=collections.defaultdict(list);cell=1.25
  for tri in floorTriangles:
   a,c,d=np.asarray(tri);den=(c[2]-d[2])*(a[0]-d[0])+(d[0]-c[0])*(a[2]-d[2])
   if abs(den)<1e-8:continue
   for ix in range(math.floor(min(a[0],c[0],d[0])/cell),math.ceil(max(a[0],c[0],d[0])/cell)):
    for iz in range(math.floor(min(a[2],c[2],d[2])/cell),math.ceil(max(a[2],c[2],d[2])/cell)):
     x,z=(ix+.5)*cell,(iz+.5)*cell;wa=((c[2]-d[2])*(x-d[0])+(d[0]-c[0])*(z-d[2]))/den;wb=((d[2]-a[2])*(x-d[0])+(a[0]-d[0])*(z-d[2]))/den;wc=1-wa-wb
     if min(wa,wb,wc)>=-.001:
      y=wa*a[1]+wb*c[1]+wc*d[1]
      if contents(x*32,-z*32,(y+1)*32)!=-2 and contents(x*32,-z*32,(y+.1)*32)!=-2:floors[ix,iz].append(float(y))
  queue=collections.deque();chosen={}
  for e in ents:
   if e.get('classname','').startswith('info_player'):
    x,oldz,y=map(float,e['origin'].split());ix,iz=math.floor(x/32/cell),math.floor(-oldz/32/cell)
    if floors[ix,iz]:chosen[ix,iz]=min(floors[ix,iz],key=lambda h:abs(h-y/32+1));queue.append((ix,iz))
  while queue:
   k=queue.popleft();y=chosen[k]
   for dx,dz in [(1,0),(-1,0),(0,1),(0,-1)]:
    nk=k[0]+dx,k[1]+dz
    if nk in chosen or not floors[nk]:continue
    h=min(floors[nk],key=lambda h:abs(h-y))
    if abs(h-y)<=.72:chosen[nk]=h;queue.append(nk)
  ids={k:i+1 for i,k in enumerate(chosen)};areas=[dict(id=ids[k],bounds=[k[0]*cell,k[1]*cell,(k[0]+1)*cell,(k[1]+1)*cell],heights=[round(y,5)]*4,links=[ids[nk] for dx,dz in [(1,0),(-1,0),(0,1),(0,-1)] if (nk:=(k[0]+dx,k[1]+dz)) in ids]) for k,y in chosen.items()]
 sourceAreas=list(areas)
 # Fill gaps in unfinished author NAV files from walkable BSP floor polygons.
 # Original NAV areas and connections remain in the same graph.
 if navpath:
  print(key,'floor triangles',len(floorTriangles),flush=True)
  cell=1.0;tiles=collections.defaultdict(list)
  for tri in floorTriangles:
   a,c,d=np.asarray(tri);den=(c[2]-d[2])*(a[0]-d[0])+(d[0]-c[0])*(a[2]-d[2])
   if abs(den)<1e-8:continue
   for ix in range(math.floor(min(a[0],c[0],d[0])/cell),math.ceil(max(a[0],c[0],d[0])/cell)):
    for iz in range(math.floor(min(a[2],c[2],d[2])/cell),math.ceil(max(a[2],c[2],d[2])/cell)):
     x,z=(ix+.5)*cell,(iz+.5)*cell;wa=((c[2]-d[2])*(x-d[0])+(d[0]-c[0])*(z-d[2]))/den;wb=((d[2]-a[2])*(x-d[0])+(a[0]-d[0])*(z-d[2]))/den;wc=1-wa-wb
     if min(wa,wb,wc)<-.001:continue
     y=float(wa*a[1]+wb*c[1]+wc*d[1])
     if not any(abs(y-h)<.1 for h in tiles[ix,iz]) and contents(x*32,-z*32,(y+.1)*32)!=-2 and contents(x*32,-z*32,(y+1)*32)!=-2 and contents(x*32,-z*32,(y+1.55)*32)!=-2:tiles[ix,iz].append(y)
  grid={};nextid=100000
  for k,heights in tiles.items():
   for y in heights:
    nextid+=1;a=dict(id=nextid,bounds=[k[0]*cell,k[1]*cell,(k[0]+1)*cell,(k[1]+1)*cell],heights=[round(y,5)]*4,links=[]);grid.setdefault(k,[]).append(a)
  for k,list0 in grid.items():
   for a in list0:
    for dx,dz in [(1,0),(-1,0),(0,1),(0,-1)]:
     for c in grid.get((k[0]+dx,k[1]+dz),[]):
      if abs(a['heights'][0]-c['heights'][0])<=.76:
       x,z=(k[0]+.5+dx*.5)*cell,(k[1]+.5+dz*.5)*cell;y=max(a['heights'][0],c['heights'][0]);
       if contents(x*32,-z*32,(y+.35)*32)!=-2 and contents(x*32,-z*32,(y+1.35)*32)!=-2:a['links'].append(c['id'])
  areas += [a for tiles0 in grid.values() for a in tiles0];print('Added floor tiles',len(grid),flush=True)
 def nearest(x,y,z,preferNative=False):
  candidates=areas
  if preferNative and navpath:
   native=[a for a in sourceAreas if max(a['bounds'][0]-x,0,x-a['bounds'][2])<4 and max(a['bounds'][1]-z,0,z-a['bounds'][3])<4]
   if native:candidates=native
  a=min(candidates,key=lambda a:max(a['bounds'][0]-x,0,x-a['bounds'][2])**2+max(a['bounds'][1]-z,0,z-a['bounds'][3])**2+(sum(a['heights'])/4-y)**2*.15);bb=a['bounds'];return dict(x=round(max(bb[0]+.3,min(bb[2]-.3,x)),4),z=round(max(bb[1]+.3,min(bb[3]-.3,z)),4),floor=round(sum(a['heights'])/4,4),area=a['id'])
 spawns={'attack':[],'defend':[]}
 for e in ents:
  cl=e.get('classname')
  if cl in ['info_player_start','info_player_deathmatch']:
   x,y,z=map(float,e['origin'].split());sp=nearest(x/32,z/32-1,-y/32);sp['yaw']=round(-math.radians(float(e.get('angles','0 0 0').split()[1]))-math.pi/2,4);spawns['attack' if cl=='info_player_deathmatch' else 'defend'].append(sp)
  elif cl=='func_buyzone':
   m=models[int(e['model'][1:])];x,y,z=[(m[i]+m[i+3])/64 for i in range(3)];spawns['attack' if e.get('team','1')=='1' else 'defend'].append(nearest(x,z,-y,True))
 sites=[]
 for e in ents:
  if e.get('classname')=='func_bomb_target':
   m=models[int(e['model'][1:])];x,y,z=[(m[i]+m[i+3])/64 for i in range(3)];sp=nearest(x,z,-y,True)
   if not any(math.hypot(sp['x']-s['x'],sp['z']-s['z'])<8 for s in sites):sp['name']=chr(65+len(sites));sites.append(sp)
 # Several brush volumes describe one site; cluster them into the map's sites.
 sitecount=3 if key=='lotus' else 2
 if len(sites)>sitecount:
  seeds=[sites[0]]
  while len(seeds)<sitecount:seeds.append(max(sites,key=lambda p:min((p['x']-c['x'])**2+(p['z']-c['z'])**2 for c in seeds)))
  centers=[(p['x'],p['z']) for p in seeds]
  for _ in range(10):
   siteGroups=[[]for _ in centers]
   for p in sites:siteGroups[min(range(len(centers)),key=lambda i:(p['x']-centers[i][0])**2+(p['z']-centers[i][1])**2)].append(p)
   centers=[(sum(p['x']for p in g)/len(g),sum(p['z']for p in g)/len(g)) if g else centers[i]for i,g in enumerate(siteGroups)]
  sites=[dict(nearest(x,sum(p['floor']for p in siteGroups[i])/len(siteGroups[i]),z,True),name=chr(65+i)) for i,(x,z) in enumerate(centers)]
 # Preserve author scene model placement and original prop palette data.
 props=[];scope=path
 while scope.parent!=ROOT and scope.parent!=scope:scope=scope.parent
 for e in ents:
  if e.get('model','').lower().endswith('.mdl'):
   p=next((q for q in scope.rglob('*.mdl') if q.name.lower()==Path(e['model']).name.lower()),None)
   if not p:continue
   file='props/'+p.name+'.gz';q=dest/file;q.parent.mkdir(parents=True,exist_ok=True);q.write_bytes(gzip.compress(p.read_bytes(),mtime=0));origin=[float(x)/32 for x in e.get('origin','0 0 0').split()];angles=list(map(float,e.get('angles','0 0 0').split()));props.append(dict(file=file,position=[origin[0],origin[2],-origin[1]],angles=angles))
 sky=[]
 for p in sorted(scope.rglob('*.tga')):
  if '/env/' in p.as_posix():im=Image.open(p).convert('RGB');im.save(dest/(p.stem+'.webp'),quality=92);sky.append(p.stem+'.webp')
 bounds=[min(a['bounds'][0] for a in areas),min(a['bounds'][1] for a in areas),max(a['bounds'][2] for a in areas),max(a['bounds'][3] for a in areas)]
 data=dict(key=key,textures=textures,meshes=list(groups.values()),planes=planes,nodes=nodes,leaves=leaves,roots=solidRoots[:1],areas=areas,wallSegments=wallSegments,spawns=spawns,sites=sites,props=props,sky=sky,bounds=bounds)
 dump(dest/'map.json.gz',data);report=dict(key=key,source=str(path.relative_to(ROOT)),sha256=hashlib.sha256(b).hexdigest(),faces=drawn,textures=len(textures),missingTextures=[textures[i]['name'] for i in missing],navigationAreas=len(areas),spawns={k:len(v) for k,v in spawns.items()},sites=sites,props=len(props));reports.append(report);print(key,'faces',drawn,'nav',len(areas),'props',len(props),'missing textures',len(missing),flush=True)
Path('docs/map-import-report.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2))
