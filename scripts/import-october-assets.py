"""Import user archives into native weapon banks and portable BSP map data.
Usage: python scripts/import-october-assets.py EXTRACTED_ARCHIVE_ROOT
"""
from pathlib import Path
import json,struct,hashlib,gzip,shutil,sys,io,re,math
from PIL import Image
ROOT=Path(sys.argv[1]);OUT=Path('dist/assets');ledger=[];catalog={}
def copy(p,q):
 q.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,q);ledger.append(dict(source=str(p.relative_to(ROOT)),output=str(q),sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
def writejson(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(gzip.compress(json.dumps(d,ensure_ascii=False,separators=(',',':')).encode(),mtime=0))
def native(key,name,weapon,paths,scope,color='#8cdbe6',family=None):
 spec=dict(name=name,en=name,weapon=weapon,color=color,variants={},soundBase=f'./assets/imported/{key}/sound')
 if family:spec['feedback']=family
 catalog[key]=spec;bank=[p for p in scope.rglob('*') if p.suffix.lower()=='.wav']
 def sound(p):
  dest=OUT/'imported'/key/'sound'/(hashlib.sha256(p.read_bytes()).hexdigest()[:20]+'.wav');copy(p,dest);return dest.name
 shots=[p for p in bank if re.search(r'(shoot|fire|(?:vandal|ghost|bucky|awp|scout|marshal|glock18|bulldog|phantom|guardian)[_-]?1)',p.name,re.I)]
 if shots:spec['shot']=sound(shots[0])
 for var,label,p in paths:
  spec['variants'][var]=label;dest=OUT/'imported'/key/var;copy(p,dest/'model.mdl');b=p.read_bytes();n,o=struct.unpack_from('<ii',b,164);seq=[]
  for i in range(n):
   s=o+i*176;title=b[s:s+32].split(b'\0')[0].decode(errors='replace');fps=struct.unpack_from('<f',b,s+32)[0];ne,ev,nf=struct.unpack_from('<iii',b,s+48);events=[]
   for j in range(ne):
    frame,code,typ,opts=struct.unpack_from('<iii64s',b,ev+j*76);opts=opts.split(b'\0')[0].decode(errors='replace').replace('\\','/');matches=[q for q in bank if q.name.lower()==opts.split('/')[-1].lower()];events.append(dict(frame=frame,event=code,options=opts,sound=sound(matches[0]) if matches else None))
   seq.append(dict(index=i,name=title,fps=fps,frames=nf,events=events))
  (dest/'sequences.json').write_text(json.dumps(seq,ensure_ascii=False));
  aim=p.with_name(p.stem+'_aim.mdl')
  if aim.exists():copy(aim,dest/'aim.mdl');spec['hasAim']=True

def variants(scope):
 paths=[]
 for p in sorted(scope.rglob('*.mdl')):
  if '_aim' in p.stem:continue
  parent=p.parent.name.lower();var='base' if parent in ['models',scope.name.lower()] else re.sub('[^a-z0-9]+','-',parent).strip('-') or 'base'
  if any(v==var for v,_,_ in paths):var+='-'+str(len(paths))
  paths.append((var,{'white':'白色','purple':'紫色','red':'红黑','blue':'蓝色','green':'绿色','gren':'绿色','gold':'金色','light-blue':'冰蓝','orange':'橙色','base':'原色'}.get(var,p.parent.name),p))
 return paths
r=ROOT/'Valstrkie皮肤(1)'/'valstrike'/'models'
for p in r.glob('*.mdl'):
 w=p.stem[2:]
 if '_aim' in w:continue
 if w in ['c4','defuser']:copy(p,OUT/'imported'/'utilities'/f'{w}.mdl');continue
 native('valstrike'+w,'ValStrike · '+{'classic':'标配','shorty':'短炮','frenzy':'狂怒','ghost':'鬼魅','sheriff':'正义','stinger':'蜂刺','spectre':'骇灵','bucky':'雄鹿','judge':'判官','bulldog':'獠犬','guardian':'戍卫','phantom':'幻影','vandal':'狂徒','marshal':'飞将','outlaw':'莽侠','operator':'冥驹','ares':'战神','odin':'奥丁','knife':'近战武器'}[w],w,[('base','原色',p)],r)
for folder,key,name,w,family in [('刀（瓦）-塑水宗','kuronamivfxknife','塑水宗 · 黑波之刃（光效）','knife',None),('钱包大招鸟狙模’带光效','neofrontiermarshal','新边疆 · 飞将（光效）','marshal',None),('22蝴蝶刀','champions22knifev2','2022 冠军 · 蝴蝶刀（新版）','knife',None),('起源喷','originbuckyv2','起源 · 雄鹿（新版）','bucky',None)]:
 scope=ROOT/folder;native(key,name,w,variants(scope),scope)
p=ROOT/'超时空护卫队'/'Phaseguard colection'
for folder,key,name,w in [('三棱军刺','phaseguardknife','超时空护卫队 · 三棱军刺','knife'),('狂徒','phaseguardvandal','超时空护卫队 · 狂徒','vandal'),('獠犬','phaseguardbulldog','超时空护卫队 · 獠犬','bulldog'),('鬼魅','phaseguardghost','超时空护卫队 · 鬼魅','ghost')]:native(key,name,w,variants(p/folder),p/folder,family='phaseguard')
p=next((ROOT/'天界神兵整套（val）').iterdir())
for folder,key,name,w in [('Blade','sovereignblade','天界神兵 · 战刀','knife'),('Eternal Sovereign','eternalsovereign','天界神兵 · 永恒之刃','knife'),('Forsaken Operator','forsakenoperator','遗落之境 · 冥驹','operator'),('Forsaken Vandal','forsakenvandal','遗落之境 · 狂徒','vandal'),('Sovereign Guardian','sovereignguardian','天界神兵 · 戍卫','guardian'),('marshal','sovereignmarshalv2','天界神兵 · 飞将（新版）','marshal'),('phantom','sovereignphantom','天界神兵 · 幻影','phantom')]:native(key,name,w,variants(p/folder),p/folder,'#e4cc86','sovereign')
catalog['champions25source']=dict(name='2025 冠军 · 狂徒',en='CHAMPIONS 2025',weapon='vandal',color='#e5bc71',variants={'base':'冠军泛光'},format='source49',modelFile='model.json.gz',soundBase='./assets/imported/champions25source/sound',shot='ak47-1.wav')
Path('dist/october-catalog.js').write_text('export const OCTOBER_IMPORTS='+json.dumps(catalog,ensure_ascii=False,indent=2)+';\n')
# Decode every supplied layered kill banner, retaining distinct five-stage audio.
feedback={}
for folder,family in [('奇点击杀图标（白）val','singularity'),('天界神兵击杀图标val','sovereign'),('流脓击杀图标val','neo'),('killbanner','additional'),('超时空护卫队','phaseguard')]:
 scope=ROOT/folder;imgs=[];sounds=[]
 for p in scope.rglob('*'):
  if p.suffix.lower()=='.tga':
   try:im=Image.open(io.BytesIO(p.read_bytes()+bytes(26))).convert('RGBA')
   except:continue
   rel=Path(*p.relative_to(scope).parts).with_suffix('.png');q=OUT/'feedback'/family/rel;q.parent.mkdir(parents=True,exist_ok=True);im.save(q);imgs.append(str(q.relative_to(Path('dist'))));
  if p.suffix.lower()=='.wav' and (folder!='超时空护卫队' or re.search(r'killbanner|kill|banner|击杀横幅',p.as_posix(),re.I)):
   q=OUT/'feedback'/family/p.relative_to(scope);copy(p,q);sounds.append(str(q.relative_to(Path('dist'))))
 feedback[family]=dict(images=imgs,sounds=sounds)
Path('dist/feedback-catalog.js').write_text('export const FEEDBACK_PACKS='+json.dumps(feedback,ensure_ascii=False)+';\n')
# UI pack consists of nested bundles. Keep native UI artwork available to browser.
ui=[]
for p in (ROOT/'瓦手ui').rglob('*'):
 if p.suffix.lower() in ['.tga','.png','.bmp','.jpg']:
  try:im=Image.open(io.BytesIO(p.read_bytes()+bytes(26))).convert('RGBA')
  except:continue
  im.thumbnail((512,512) if '/buttons/' in p.as_posix() else (1024,1024),Image.Resampling.LANCZOS)
  q=OUT/'native-ui'/p.relative_to(ROOT/'瓦手ui').with_suffix('.png');q.parent.mkdir(parents=True,exist_ok=True);im.save(q);ui.append(str(q.relative_to(Path('dist'))))
Path('dist/ui-catalog.js').write_text('export const NATIVE_UI='+json.dumps(ui,ensure_ascii=False)+';\n')
Path('docs/october-resource-sources.json').write_text(json.dumps(dict(files=ledger,weaponFamilies=len(catalog),variants=sum(len(s['variants']) for s in catalog.values()),ui=ui),ensure_ascii=False,indent=2))
print('Imported native weapon families',len(catalog),'variants',sum(len(s['variants']) for s in catalog.values()),'UI images',len(ui))
