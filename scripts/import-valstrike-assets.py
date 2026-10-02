"""Import user-supplied GoldSrc resources without re-modeling/resampling them."""
import pathlib,shutil,hashlib,json,struct,sys,io
from PIL import Image
ROOT=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else pathlib.Path('/workspace/scratch/b2910f644acd/native-weapons')
OUT=pathlib.Path('dist/assets/imported');OUT.mkdir(parents=True,exist_ok=True)
shutil.rmtree(OUT);OUT.mkdir(parents=True)
ledger=[]
def copy(src,dst):
 dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dst)
 ledger.append({'source':str(src.relative_to(ROOT)),'output':str(dst),'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'bytes':src.stat().st_size})
def pack(key,variant,model,soundroot,finisher=None):
 dst=OUT/key/variant;copy(model,dst/'model.mdl')
 bank={}
 for sound in soundroot.rglob('*'):
  if sound.is_file() and sound.suffix.lower()=='.wav':
   relative=sound.relative_to(soundroot).as_posix().lower();copy(sound,dst/'sound'/relative);bank[relative]=sound
 if finisher:copy(finisher,dst/'finisher.mdl')
 b=model.read_bytes();n,o=struct.unpack_from('<ii',b,164);seq=[]
 for i in range(n):
  s=o+i*176;name=b[s:s+32].split(b'\0')[0].decode(errors='replace');fps=struct.unpack_from('<f',b,s+32)[0];ne,ev,nf=struct.unpack_from('<iii',b,s+48)
  events=[]
  for j in range(ne):
   frame,code,typ,opts=struct.unpack_from('<iii64s',b,ev+j*76);name0=opts.split(b'\0')[0].decode(errors='replace').replace('\\','/');sound=name0.lower();matches=[key for key in bank if key.split('/')[-1]==sound.split('/')[-1]];resolved=sound if sound in bank else matches[0] if len(matches)==1 else None;events.append({'frame':frame,'event':code,'options':name0,'sound':resolved})
  seq.append({'index':i,'name':name,'fps':fps,'frames':nf,'events':events})
 (dst/'sequences.json').write_text(json.dumps(seq,ensure_ascii=False,indent=2))
 # Preserve package sprite frames, including original alpha / blend semantics.
 for spr in model.parent.parent.rglob('*.spr'):
  sb=spr.read_bytes()
  if sb[:4]!=b'IDSP':continue
  version=struct.unpack_from('<i',sb,4)[0]
  if version!=2:continue
  fmt=struct.unpack_from('<i',sb,12)[0];frames=struct.unpack_from('<i',sb,28)[0];colors=struct.unpack_from('<H',sb,40)[0];palette=sb[42:42+colors*3];p=42+colors*3;paths=[]
  for f in range(frames):
   typ=struct.unpack_from('<i',sb,p)[0];p+=4
   if typ!=0:break
   x,y,w,h=struct.unpack_from('<4i',sb,p);p+=16;pixels=sb[p:p+w*h];p+=w*h;rgba=bytearray()
   for k in pixels:
    rgb=palette[k*3:k*3+3];a=0 if fmt==3 and k==255 else k if fmt==2 else 255
    if fmt==2:rgb=palette[255*3:256*3]
    rgba.extend(rgb+bytes([a]))
   path=dst/('muzzle-%03d.png'%f);Image.frombytes('RGBA',(w,h),bytes(rgba)).save(path);paths.append(path.name)
  (dst/'muzzle.json').write_text(json.dumps({'frames':paths,'format':fmt}))

p=ROOT/'21冠军ak材质重置版/VANDAL';pack('champions21vandal','base',p/'models/v_vandal.mdl',p/'sound')
p=ROOT/'val新21爪刀/val新21爪刀';pack('champions21knife','base',p/'v_knife.mdl',p/'2021karamaura')
p=ROOT/'24直刀(1)/1'
for name,var in [('2级','base'),('1级','level1'),('冠军气息','aura'),('没有气息','plain'),('金色破碎','shatter')]:pack('champions24',''+var,p/name/'fade/v_knife.mdl',p/'sound')
p=ROOT/'特效更好的黑波/@DR⁴_KURONAMI KUNAI'
for name,var in [('default','base'),('puprle','purple'),('white','white'),('red','black')]:
 q=p/name/'com.valstrike/files/valstrike';pack('kuronami',var,q/'models/v_knife.mdl',q/'sound')
p=ROOT/'有特效的塑水狂徒/vandal kuronami'
for name,var in [('blue','base'),('purple','purple'),('white','white'),('red','black')]:
 q=p/name;finisher=next((q/'models/finisher').glob('*.mdl'),p/'blue/models/finisher/kuro.mdl');pack('kuronamivandal',var,q/'models/v_vandal.mdl',q/'sound' if (q/'sound').exists() else p/'blue/sound',finisher)
 for mdl in (q/'models/attachment').glob('*.mdl'):copy(mdl,OUT/'kuronamivandal'/var/mdl.name)
for tga in (p/'killbanner by jeck').rglob('*.tga'):
 dest=OUT/'kuronamivandal/badge'/tga.relative_to(p/'killbanner by jeck').with_suffix('.png');dest.parent.mkdir(parents=True,exist_ok=True);Image.open(io.BytesIO(tga.read_bytes()+bytes(26))).convert('RGBA').save(dest)
pathlib.Path('docs/imported-weapons-sources.json').write_text(json.dumps({'input':'Five user supplied resource archives, October 2 2026','method':'Original IDST v10 model bytes, textures, frame streams and event records preserved. TGA/SPR images decoded losslessly to PNG.','missing':'White Kuronami Vandal package has no finisher: its finisher uses the supplied blue model. No original kill music is included.','files':ledger},ensure_ascii=False,indent=2))
print('imported',len(ledger),'files',sum(x['bytes'] for x in ledger),'bytes')
