"""Import four user packs, retaining native models/events/audio and source hashes.
Usage: python scripts/import-october5-extra-packs.py UPLOAD_DIRECTORY
Requires Pillow and py7zr. Source video comparisons remain unverified.
"""
from pathlib import Path
import gzip, hashlib, io, json, struct, sys, tempfile, zipfile
import py7zr
from PIL import Image

root=Path(sys.argv[1]);catalog={};feedback={};ui={};voices={};files=[];actions=[]
sha=lambda b:hashlib.sha256(b).hexdigest()
def save(archive,source,raw,dest,compress=False):
 dest=Path(dest);dest.parent.mkdir(parents=True,exist_ok=True)
 out=gzip.compress(raw,compresslevel=9,mtime=0) if compress else raw;dest.write_bytes(out)
 files.append(dict(archive=archive,source=source,output=str(dest),sourceSHA256=sha(raw),outputSHA256=sha(out),bytes=len(raw),gzip=compress))
 return str(dest.relative_to('dist')) if dest.parts[0]=='dist' else str(dest)

def add(archive,key,name,en,weapon,model,bank,shot=None,variant='base',label='原色'):
 b=model[1];assert b[:4]==b'IDST' and struct.unpack_from('<i',b,4)[0]==10
 spec=catalog.setdefault(key,dict(name=name,en=en,weapon=weapon,color='#bbdbc5' if key.startswith('gaia') else '#d7ad6e',modelFile='model.mdl.gz',variants={},soundBase='./assets/imported/'+key+'/sound',hasPackageAudio=bool(bank)))
 spec['variants'][variant]=label;resolved={}
 for path,data in bank.items():
  filename=sha(data)[:20]+'.wav';resolved[path.lower().replace('\\','/')]=filename
  dest='dist/assets/imported/'+key+'/sound/'+filename
  if not any(f['output']==dest for f in files):save(archive,path,data,dest)
  if shot and Path(path).name.lower()==shot.lower():
   spec.setdefault('variantShots',{})[variant]=filename
   if variant=='base':spec['shot']=filename
 seq=[];n,o=struct.unpack_from('<ii',b,164)
 for i in range(n):
  s=o+i*176;title=b[s:s+32].split(b'\0')[0].decode(errors='replace');fps=struct.unpack_from('<f',b,s+32)[0];ne,ev,nf=struct.unpack_from('<iii',b,s+48);events=[]
  for j in range(ne):
   frame,code,typ,opts=struct.unpack_from('<iii64s',b,ev+j*76);option=opts.split(b'\0')[0].decode(errors='replace');clean=option.lower().replace('\\','/')
   candidates=[v for path,v in resolved.items() if path.endswith('/'+clean) or path.endswith('/'+clean.split('/')[-1])]
   events.append(dict(frame=frame,event=code,options=option,sound=candidates[0] if candidates else None))
  seq.append(dict(index=i,name=title,fps=fps,frames=nf,events=events))
  actions.append(dict(weapon=key,variant=variant,id=title,frames=nf,fps=fps,status='unverified',origin='original IDST v10 animation and native event records',missingAudio=[e['options'] for e in events if e['event'] in [5004,5005] and not e['sound']],report=None,verified_commit=None))
 folder='dist/assets/imported/'+key+'/'+variant
 save(archive,model[0],b,folder+'/model.mdl.gz',True)
 Path(folder+'/sequences.json').write_text(json.dumps(seq,ensure_ascii=False,indent=2))

archive='Valorant 盖亚套 By MotH.7z'
with tempfile.TemporaryDirectory() as directory:
 with py7zr.SevenZipFile(root/archive) as z:z.extractall(directory)
 source=Path(directory);allbank={str(p.relative_to(source)):p.read_bytes() for p in source.rglob('*.wav')}
 entries=[('gaiavandal','盖亚的复仇 · 狂徒','vandal','v_ak47.mdl','gaiavandal','ak47-1.wav'),('gaiaguardian','盖亚的复仇 · 戍卫','guardian','v_g3sg1.mdl','gaiaguardian','g3sg1-1.wav'),('gaiamarshal','盖亚的复仇 · 飞将','marshal','v_scout.mdl','gaiamarshal','scout_fire-1.wav'),('gaiaghost','盖亚的复仇 · 鬼魅','ghost','v_usp.mdl','gaiaghost','usp1.wav'),('gaiaaxe','盖亚之怒 · 战斧','knife','v_knife.mdl','gaiaaxe',None)]
 for key,name,weapon,model,family,shot in entries:
  prefix={'gaiavandal':'ak47','gaiaguardian':'g3sg1','gaiamarshal':'scout','gaiaghost':'usp','gaiaaxe':'knife'}[family]
  bank={p:b for p,b in allbank.items() if '/'+family+'/' in p or family=='gaiaaxe' and '/melee_ashen/' in p or Path(p).name.startswith(prefix)}
  add(archive,key,name,'GAIA’S VENGEANCE',weapon,('models/'+model,(source/'models'/model).read_bytes()),bank,shot)
 # Both supplied Guardian ports have their own original header/model bytes.
 bank={p:b for p,b in allbank.items() if '/gaiaguardian/' in p or Path(p).name.startswith(('sg550','g3sg1'))}
 add(archive,'gaiaguardian','盖亚的复仇 · 戍卫','GAIA’S VENGEANCE','guardian',('models/v_sg550.mdl',(source/'models/v_sg550.mdl').read_bytes()),bank,'sg550-1.wav','sg550','套装版本 2')

archive='val逆命中队狂徒.zip'
with zipfile.ZipFile(root/archive) as z:
 model=next(p for p in z.namelist() if p.endswith('.mdl'))
 add(archive,'nimingvandal','逆命中队 · 狂徒','NIMING SQUAD','vandal',(model,z.read(model)),{})

archive='21冠军反馈.val.zip';images=[];sounds=[]
with zipfile.ZipFile(root/archive) as z:
 for source in z.namelist():
  raw=z.read(source)
  if source.endswith('.tga'):
   im=Image.open(io.BytesIO(raw+bytes(26))).convert('RGBA');rel=Path(*Path(source).parts[2:]).with_suffix('.png');dest=Path('dist/assets/feedback/champions21')/rel;dest.parent.mkdir(parents=True,exist_ok=True);im.save(dest)
   images.append(str(dest.relative_to('dist')));files.append(dict(archive=archive,source=source,output=str(dest),sourceSHA256=sha(raw),outputSHA256=sha(dest.read_bytes()),conversion='TGA to lossless RGBA PNG'))
  elif source.endswith('.wav'):sounds.append(save(archive,source,raw,'dist/assets/feedback/champions21/'+Path(source).name))
feedback['champions21']=dict(images=images,sounds=sounds)

archive='瓦手键位界面图标2.0.zip'
with zipfile.ZipFile(root/archive) as z:
 def icon(name,source,crop=None):
  raw=z.read(source);im=Image.open(io.BytesIO(raw+bytes(26))).convert('RGBA');original=list(im.size)
  if crop:im=im.crop(crop)
  im.thumbnail((384,384),Image.Resampling.LANCZOS);dest=Path('dist/assets/native-ui/mobile2')/(name+'.webp');dest.parent.mkdir(parents=True,exist_ok=True);im.save(dest,lossless=True)
  ui[name]=str(dest.relative_to('dist'));files.append(dict(archive=archive,source=source,output=str(dest),sourceSHA256=sha(raw),outputSHA256=sha(dest.read_bytes()),sourceSize=original,runtimeSize=list(im.size),crop=crop,conversion='RGBA glyph, lossless WebP; static source ammo/text excluded'))
 for name in ['duck','inspect','jump','pause','reload','use','joy','bgab']:icon(name,'valstrike/gfx/buttons/'+name+'.tga')
 icon('primary','valstrike/gfx/buttons/1.tga',(180,90,1750,510));icon('pistol','valstrike/gfx/buttons/2.tga',(310,270,1160,765));icon('joy_bg','valstrike/touch_default/joy_bg.tga')
 paths={'wushu':'jett/Play_VO_Wushu_PickMe.wav','thorne':'sage/Play_VO_Thorne_Pickme.wav','hunter':'sova/Play_VO_Hunter_Pickme.wav','phoenix':'phoenix/Play_VO_Phoenix_Pickme.wav','sarge':'brimstone/Play_VO_Sarge_PickMe.wav','guide':'skye/Play_VO_Guide_Pickme.wav','clay':'raze/Play_VO_Clay_PickMe.wav'}
 for agent,path in paths.items():voices[agent]=save(archive,'valstrike/sound/VO/'+path,z.read('valstrike/sound/VO/'+path),'dist/assets/native-ui/mobile2/voice/'+agent+'.wav')
 for side in ['attacking','defending']:voices[side]=save(archive,'valstrike/sound/pickagent/you_are_'+side+'.wav',z.read('valstrike/sound/pickagent/you_are_'+side+'.wav'),'dist/assets/native-ui/mobile2/voice/'+side+'.wav')

Path('dist/october5-extra-catalog.js').write_text('export const OCTOBER5_EXTRA_IMPORTS='+json.dumps(catalog,ensure_ascii=False,indent=2)+';\nexport const OCTOBER5_EXTRA_FEEDBACK='+json.dumps(feedback,ensure_ascii=False,indent=2)+';\nexport const MOBILE2_UI='+json.dumps(ui,indent=2)+';\nexport const MOBILE2_VOICES='+json.dumps(voices,indent=2)+';\n')
Path('docs/october5-extra-resource-sources.json').write_text(json.dumps(dict(files=files,actions=actions,archives={p.name:sha(p.read_bytes()) for p in root.iterdir() if p.name in ['Valorant 盖亚套 By MotH.7z','val逆命中队狂徒.zip','21冠军反馈.val.zip','瓦手键位界面图标2.0.zip']},render_fidelity='native asset bytes/events retained; source gameplay videos and complete image/audio timestamp comparisons were not supplied',notes=['Niming includes no WAV files: generic weapon sound fallback; native animation audio events remain unresolved.','Gaia Guardian has two original CS ports, exposed as separate model variants.','HUD screenshots with baked ammo/player/build text, microphone/radio controls without a networking feature, unsupported-agent voices and menu BGM are not overlaid on live game state.']),ensure_ascii=False,indent=2))
print('Imported',len(catalog),'weapon families;',sum(len(s['variants']) for s in catalog.values()),'variants;',len(actions),'native sequences;',len(images),'badge images;',len(sounds),'independent kill cues;',len(ui),'touch assets')
