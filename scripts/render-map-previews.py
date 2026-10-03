from pathlib import Path
import json,gzip,math
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]/'dist/assets/maps'
for p in root.glob('*/map.json.gz'):
 d=json.loads(gzip.decompress(p.read_bytes()));im=Image.new('RGB',(640,320),(25,40,48));q=ImageDraw.Draw(im);bb=d['bounds'];scale=min(580/(bb[2]-bb[0]),260/(bb[3]-bb[1]));ox=(640-(bb[2]-bb[0])*scale)/2;oz=(320-(bb[3]-bb[1])*scale)/2
 for a in d['areas']:
  b=a['bounds'];q.rectangle([ox+(b[0]-bb[0])*scale,oz+(b[1]-bb[1])*scale,ox+(b[2]-bb[0])*scale,oz+(b[3]-bb[1])*scale],fill=(105,131,139))
 for s in d['sites']:
  x,z=ox+(s['x']-bb[0])*scale,oz+(s['z']-bb[1])*scale;q.ellipse([x-9,z-9,x+9,z+9],fill=(228,206,146));q.text((x-3,z-6),s['name'],fill=(24,40,48))
 im.save(p.parent/'preview.webp',quality=92)
