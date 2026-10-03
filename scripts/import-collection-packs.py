"""Incremental import of the ten October 3 user archives; never replaces prior packs.

Run after extracting archives (including the nested Kuronami ZIP) into INPUT.
Native bytes and events are preserved. Shared sound banks avoid 44 duplicate VCT
audio copies. Only runtime filenames are normalized; source paths stay in ledger.
"""
from pathlib import Path
import sys, json, hashlib, shutil, struct, io
from PIL import Image

ROOT = Path(sys.argv[1])
OUT = Path('dist/assets/imported')
catalog, ledger, actions, images = {}, [], [], []

def copy(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    sha = hashlib.sha256(src.read_bytes()).hexdigest()
    if not dst.exists() or hashlib.sha256(dst.read_bytes()).hexdigest() != sha:
        shutil.copyfile(src, dst)
    if not any(x['output'] == str(dst) for x in ledger):
        ledger.append(dict(source=str(src.relative_to(ROOT)), output=str(dst), sha256=sha, bytes=src.stat().st_size))
    return sha

def add(key, name, weapon, color, models, scope, shot_name=None, en=None):
    spec = dict(name=name, weapon=weapon, color=color, en=en or key.upper(), variants={}, soundBase=f'./assets/imported/{key}/sound')
    catalog[key] = spec
    bank = [p for p in scope.rglob('*') if p.is_file() and p.suffix.lower() == '.wav']
    def sound(p):
        filename = hashlib.sha256(p.read_bytes()).hexdigest()[:20]+'.wav'
        copy(p, OUT/key/'sound'/filename)
        return filename
    if shot_name:
        matches = [p for p in bank if shot_name.lower() in p.as_posix().lower()]
        if matches: spec['shot'] = sound(matches[0])
    for var, label, model in models:
        spec['variants'][var] = label
        target = OUT/key/var
        copy(model, target/'model.mdl')
        data = model.read_bytes()
        n, o = struct.unpack_from('<ii', data, 164)
        seq = []
        for i in range(n):
            s = o+i*176
            title = data[s:s+32].split(b'\0')[0].decode(errors='replace')
            fps = struct.unpack_from('<f', data, s+32)[0]
            ne, ev, nf = struct.unpack_from('<iii', data, s+48)
            events = []
            for j in range(ne):
                frame, code, typ, opts = struct.unpack_from('<iii64s', data, ev+j*76)
                option = opts.split(b'\0')[0].decode(errors='replace').replace('\\','/')
                candidates = [p for p in bank if p.as_posix().lower().endswith('/'+option.lower())]
                if not candidates: candidates = [p for p in bank if p.name.lower() == option.split('/')[-1].lower()]
                # Prefer the current model's team/variant, then shared package sounds.
                candidates.sort(key=lambda p: (-len(set(p.parts)&set(model.parts)), p.as_posix()))
                resolved = sound(candidates[0]) if candidates else None
                events.append(dict(frame=frame, event=code, options=option, sound=resolved))
            seq.append(dict(index=i, name=title, fps=fps, frames=nf, events=events))
            actions.append(dict(weapon=key, variant=var, id=title, frames=nf, fps=fps, status='unverified', origin='original IDST v10 frames and native event records', missing_audio=[e['options'] for e in events if e['event'] in [5004,5005] and not e['sound']]))
        (target/'sequences.json').write_text(json.dumps(seq, ensure_ascii=False, indent=2))

x=ROOT/'val威龙套装'/'XERØFANG Collection CSV'
labels={'Black':('base','黑红'),'black':('base','黑红'),'Pink':('pink','粉色'),'White':('white','白色'),'white':('white','白色'),'brown':('brown','棕色'),'red':('red','红色')}
for key, folder, weapon, name, en in [('xerofangghost','XEROFANG GHOST','ghost','威龙 · 鬼魅','XERØFANG'),('xerofangvandal','XERØFANG Vandal','vandal','威龙 · 狂徒','XERØFANG'),('xerofangknife','XERØFANG Knife','knife','威龙之刃','XERØFANG')]:
    models=[]
    for p in sorted((x/folder).rglob('*.mdl')):
        var,label=labels[p.parent.name];models.append((var,label,p))
    add(key,name,weapon,'#ff6278',models,x, f'{weapon}1.wav' if weapon!='knife' else None,en)

v=ROOT/'VCT标配全战队'/'VCT标配全战队'
models=[('base','VCT',v/'v_classic.mdl')]+[(p.parent.name.lower(),p.parent.name,p) for p in sorted(v.glob('*/*.mdl'))]
add('vctclassic','VCT 战队标配','classic','#66dbc9',models,v,'glock18-1.wav','VCT TEAM CAPSULES')
q=ROOT/'valstrike塑水宗套装'/'inner'/'Kuronami Collection by zip'
add('kuronamisheriff','塑水宗 · 正义','sheriff','#7bd5e9',[('base','蓝黑',q/'models/v_sheriff.mdl')],q,'deagle-1.wav','KURONAMI')
add('kuronamizipknife','塑水宗 · 苦无','knife','#7bd5e9',[('base','蓝黑',q/'models/v_knife.mdl')],q,None,'KURONAMI')
add('kuronamizipvandal','塑水宗 · 狂徒（套装）','vandal','#7bd5e9', [('base','蓝黑',q/'models/v_vandal.mdl')]+[(var,label,q/'Variant Vandal'/folder/'v_vandal.mdl') for folder,var,label in [('blue','blue','蓝色'),('purple','purple','紫色'),('white','white','白色'),('red','red','红黑')]],q,'kuronamivandal/shoot.wav','KURONAMI')
for var,src in [('base',q/'models/v_vandal_aim.mdl')]+[(v,q/'Variant Vandal'/v/'v_vandal_aim.mdl') for v in ['blue','purple','white','red']]:copy(src,OUT/'kuronamizipvandal'/var/'aim.mdl')
add('kuronamispectre','塑水宗 · 骇灵','spectre','#7bd5e9',[('base','蓝黑',ROOT/'塑水宗骇灵/v_spectre.mdl')],ROOT/'塑水宗骇灵','shoot.wav','KURONAMI')
add('kuronamimarshal','塑水宗 · 飞将','marshal','#7bd5e9',[('base','蓝黑',ROOT/'塑水宗鸟狙/鸟狙/v_marshall.mdl')],ROOT/'塑水宗鸟狙','marshall1.wav','KURONAMI')
add('xenohunterknife','异星霸主 · 剥皮小刀','knife','#a9b5a9',[('base','原色',ROOT/'剥皮小刀val/models/v_knife.mdl')],ROOT/'剥皮小刀val',None,'XENOHUNTER')
add('igniteknife','离火刃','knife','#f681c7',[('base','粉色',next((ROOT/'va离火刃').rglob('*.mdl')))],ROOT/'va离火刃',None,'IGNITE')
add('reconphantom','侦察 · 幻影','phantom','#b7c3a1',[(var,label,ROOT/'高清修复侦察m4'/folder/'v_phantom.mdl') for var,label,folder in [('base','原色','原色'),('red','红色','红色')]],ROOT/'高清修复侦察m4',None,'RECON')
for weapon in ['vandal','knife']:
    add('kemiao'+weapon,'颗秒 · '+('狂徒' if weapon=='vandal' else '近战武器'),weapon,'#ff9f50',[('base','修复材质',ROOT/'高清修复颗秒套装'/f'v_{weapon}.mdl')],ROOT/'高清修复颗秒套装',None,'KEMIAO')

r=next((ROOT/'枪皮整合包val').iterdir())
entries=[('knife','champions22knife','knife','2022 冠军 · 蝴蝶刀','CHAMPIONS 2022','#e2c772',None),('bucky','originbucky','bucky','起源 · 雄鹿','ORIGIN','#dedbcc','bucky1.wav'),('vandal','chronovoidvandal','vandal','时空 · 狂徒','CHRONOVOID','#e79c63','vandal1.wav'),('odin','primeodin','odin','PRIME 2.0 · 奥丁','PRIME 2.0','#dcc173','odin1.wav'),('phantom','oniphantom','phantom','鬼丸 · 幻影','ONI','#d59679','phantom1.wav'),('sheriff','ionsheriff','sheriff','离子 · 正义','ION','#aee4ed','sherrif1.wav'),('ares','solares','ares','光明哨兵 · 战神','SENTINELS OF LIGHT','#d2b898','ares1.wav'),('marshall','sovereignmarshal','marshal','至高之庭 · 飞将','SOVEREIGN','#dac594','marshall1.wav'),('clasic','senteamclassic','classic','SEN 战队 · 标配（整合包）','VCT SEN','#ff6267','glock18-1.wav'),('bulldog','araxysbulldog','bulldog','781-A 协议 · 獠犬','PROTOCOL','#d9a575','bulldog1.wav'),('spectre','protocolspectre','spectre','781-A 协议 · 骇灵','PROTOCOL','#e2cdc5','shoot1.wav'),('operator','elderflameoperator','operator','炫彩龙焰 · 冥驹','ELDERFLAME','#e6a36d','awp1.wav'),('stinger','sovereignstinger','stinger','至高之庭 · 蜂刺','SOVEREIGN','#d5c19a','stinger1.wav'),('ghost','xerofangghostpack','ghost','威龙 · 鬼魅（整合包）','XERØFANG','#e5858f','ghost1.wav')]
for folder,key,weapon,name,en,color,shot in entries:
    scope=r/folder;add(key,name,weapon,color,[('base','原色',next(scope.rglob('*.mdl')))],scope,shot,en)

# Additional original kill feedback (separate cues, no pitch substitution).
for family,scope in [('kuronami',q/'killbanner'),('xerofang',x/'killbanner')]:
    for p in scope.rglob('*.tga'):
        dest=OUT/'feedback'/family/p.relative_to(scope).with_suffix('.png')
        dest.parent.mkdir(parents=True,exist_ok=True)
        Image.open(io.BytesIO(p.read_bytes()+bytes(26))).convert('RGBA').save(dest)
        images.append(dict(source=str(p.relative_to(ROOT)),output=str(dest),sourceSHA256=hashlib.sha256(p.read_bytes()).hexdigest(),outputSHA256=hashlib.sha256(dest.read_bytes()).hexdigest(),method='palette/RGBA decode to lossless PNG'))
    for p in scope.rglob('*.wav'):copy(p,OUT/'feedback'/family/p.relative_to(scope))

Path('dist/imported-catalog.js').write_text('// Generated by scripts/import-collection-packs.py\nexport const COLLECTION_IMPORTS='+json.dumps(catalog,ensure_ascii=False,indent=2)+';\n')
Path('docs/collection-import-sources.json').write_text(json.dumps(dict(input='Ten user resource archives, October 3 2026',files=ledger,images=images,actions=actions,render_fidelity='unverified; source animation bytes retained, independent source-video comparisons not supplied'),ensure_ascii=False,indent=2))
print('Added',len(catalog),'families,',sum(len(s['variants']) for s in catalog.values()),'variants;',len(actions),'native action sequences;',len(ledger),'original runtime files')
