import gzip,json,hashlib
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]/'dist/assets/maps';banks={};data={};report=[]
for p in root.glob('*/map.json.gz'):
 d=json.loads(gzip.decompress(p.read_bytes()));data[p]=d
 for t in d['textures']:
  if t['file']:banks.setdefault(t['name'].lower(),p.parent/t['file'])
for p,d in data.items():
 reused=0;fallback=[]
 for i,t in enumerate(d['textures']):
  if t['file']:continue
  file=f'texture-{i}.png';dest=p.parent/file;t['file']=file
  if t['name'].lower() in banks:dest.write_bytes(banks[t['name'].lower()].read_bytes());reused+=1;continue
  name=t['name'].lower();color=(175,169,156)
  if 'wood' in name or 'crate' in name:color=(146,119,91)
  elif 'metal' in name or 'duct' in name:color=(107,122,121)
  elif 'brick' in name:color=(175,129,112)
  elif 'grass' in name or 'green' in name:color=(112,141,108)
  elif 'water' in name:color=(79,135,156)
  elif 'floor' in name or 'crete' in name:color=(172,171,162)
  im=Image.new('RGBA',(128,128),color+(255,));q=ImageDraw.Draw(im)
  for y in range(128):
   shade=1-.10*y/128;q.line((0,y,128,y),fill=tuple(int(c*shade) for c in color)+(255,))
  if any(w in name for w in ['brick','tile','floor','crete']):
   for y in range(0,128,32):
    q.line((0,y,128,y),fill=tuple(max(0,c-20) for c in color)+(255,),width=2)
    for x in range((y//32%2)*16,128,32):q.line((x,y,x,y+32),fill=tuple(max(0,c-20) for c in color)+(255,))
  im.save(dest);fallback.append(t['name'])
 p.write_bytes(gzip.compress(json.dumps(d,separators=(',',':')).encode(),mtime=0));report.append(dict(map=d['key'],reused=reused,reconstructedMissingWADTextures=fallback))
(root.parent.parent.parent/'docs/map-texture-resolution.json').write_text(json.dumps(report,indent=2));print([(r['map'],r['reused'],len(r['reconstructedMissingWADTextures'])) for r in report])
