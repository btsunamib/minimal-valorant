"""Import the five October 5 uploads without replacing existing collection packs.

Usage: python scripts/import-october5-packs.py UPLOAD_DIRECTORY
Models retain every original byte in deterministic gzip. Invalid weapon files
are preserved outside the playable collection with a recorded diagnosis.
"""
from pathlib import Path
import gzip, hashlib, io, json, struct, sys, zipfile
from PIL import Image

ROOT = Path(sys.argv[1])
OUT = Path('dist/assets/imported')
catalog, feedback, files, actions, rejected = {}, {}, [], [], []
sha = lambda b: hashlib.sha256(b).hexdigest()

def save(pack, source, raw, dest, compressed=False):
    dest.parent.mkdir(parents=True, exist_ok=True)
    data = gzip.compress(raw, compresslevel=9, mtime=0) if compressed else raw
    dest.write_bytes(data)
    files.append(dict(archive=pack, source=source, output=str(dest), bytes=len(raw),
                      sha256=sha(raw), outputSHA256=sha(data), gzip=compressed))
    return dest

def add(pack, key, name, weapon, color, variants, shot=None, family=None):
    with zipfile.ZipFile(ROOT/(pack+'.zip')) as z:
        bank={p:z.read(p) for p in z.namelist() if p.lower().endswith('.wav')}
        spec=dict(name=name, en={'singularitybutterfly':'SINGULARITY BUTTERFLY','dolmirvandal':'DOLMIR','protocol781phantom':'PROTOCOL 781','champions24phantom':'CHAMPIONS 2024'}[key], weapon=weapon, color=color, hasPackageAudio=bool(bank),
                  variants={}, modelFile='model.mdl.gz', soundBase=f'./assets/imported/{key}/sound')
        catalog[key]=spec
        if family: spec['feedback']=family
        resolved={}
        for source, data in bank.items():
            filename=sha(data)[:20]+'.wav'
            save(pack,source,data,OUT/key/'sound'/filename)
            resolved[source.lower().replace('\\','/')]=filename
            if shot and source.lower().endswith('/'+shot.lower()):spec['shot']=filename
        for var,label,source in variants:
            b=z.read(source)
            if b[:4]!=b'IDST' or struct.unpack_from('<i',b,4)[0]!=10:
                raise ValueError('Expected IDST 10: '+source)
            n,o=struct.unpack_from('<ii',b,164);seq=[]
            for i in range(n):
                s=o+i*176;title=b[s:s+32].split(b'\0')[0].decode(errors='replace')
                fps=struct.unpack_from('<f',b,s+32)[0];ne,ev,nf=struct.unpack_from('<iii',b,s+48);events=[]
                for j in range(ne):
                    frame,code,typ,opts=struct.unpack_from('<iii64s',b,ev+j*76)
                    original=opts.split(b'\0')[0].decode(errors='replace')
                    option=original.lower().replace('\\','/')
                    candidates=[v for p,v in resolved.items() if p.endswith('/'+option) or p.endswith('/'+option.split('/')[-1])]
                    events.append(dict(frame=frame,event=code,options=original,sound=candidates[0] if candidates else None))
                seq.append(dict(index=i,name=title,fps=fps,frames=nf,events=events))
                actions.append(dict(key=key,variant=var,name=title,frames=nf,fps=fps,
                    origin='original IDST frames',missingAudio=[e['options'] for e in events if e['event'] in [5004,5005] and not e['sound']]))
            spec['variants'][var]=label;dest=OUT/key/var
            save(pack,source,b,dest/'model.mdl.gz',True)
            (dest/'sequences.json').write_text(json.dumps(seq,ensure_ascii=False,indent=2))
        # The supplied 2024 sight files belong to a Vandal, so retain them as
        # source accessories instead of attaching unrelated geometry to Phantom.
        if family=='champions24phantom':
            for source in ['v_vandal_sight.mdl','v_vandal_sight_dummy.mdl']:
                save(pack,source,z.read(source),Path('source-assets/october5/champions24-accessories')/(source+'.gz'),True)
            images,sounds=[],[]
            for source in z.namelist():
                if source.startswith('幻影/') and source.endswith('.tga'):
                    raw=z.read(source)
                    im=Image.open(io.BytesIO(raw+bytes(26))).convert('RGBA')
                    rel=Path(*source.split('/')[1:]).with_suffix('.png')
                    dest=Path('dist/assets/feedback')/family/rel;dest.parent.mkdir(parents=True,exist_ok=True);im.save(dest)
                    images.append(str(dest.relative_to('dist')))
                    files.append(dict(archive=pack,source=source,output=str(dest),bytes=len(raw),sha256=sha(raw),outputSHA256=sha(dest.read_bytes()),converted='TGA to RGBA PNG'))
                if source.startswith('幻影/') and source.endswith('.wav'):
                    dest=Path('dist/assets/feedback')/family/Path(source).name
                    save(pack,source,z.read(source),dest);sounds.append(str(dest.relative_to('dist')))
            feedback[family]=dict(images=images,sounds=sounds)

add('高清修复奇点蝴蝶','singularitybutterfly','奇点 · 蝴蝶刀（高清）','knife','#9873e3',[('base','高清材质','v_knife.mdl')])
add('高清修复多弥尔ak','dolmirvandal','多弥尔 · 狂徒（高清）','vandal','#b091dd',[('base','高清材质','v_vandal.mdl')])
add('高清修复781幻影','protocol781phantom','781 · 幻影（高清）','phantom','#e699c1',[(v,l,l+'/v_phantom.mdl') for v,l in [('base','粉色'),('red','红色')]])
add('24冠军组合包','champions24phantom','2024 冠军 · 幻影','phantom','#dfbc66',[
    ('base','冠军标志 + 光环','24冠军/冠军logo加冠军光环/Jett/v_phantom.mdl'),
    ('logo','冠军标志','24冠军/冠军Logo和没有冠军光环/Jett/v_phantom.mdl'),
    ('aura','冠军光环','24冠军/冠军光环/Jett/v_phantom.mdl'),
    ('plain','无光环','24冠军/没有冠军光环/Jett/v_phantom.mdl'),
    ('shatter','金色破碎','24冠军/金色破碎/Jett/v_phantom.mdl')],shot='phantom1.wav',family='champions24phantom')

# All four purported Abyssal Obelisk variants are the same gign.mdl player file.
pack='VAL暗域界碑幻影'
with zipfile.ZipFile(ROOT/(pack+'.zip')) as z:
    sounds=[]
    for source in z.namelist():
        if source.endswith('.mdl'):
            raw=z.read(source);internal=raw[8:72].split(b'\0')[0].decode(errors='replace')
            n,o=struct.unpack_from('<ii',raw,164)
            names=[raw[o+i*176:o+i*176+32].split(b'\0')[0].decode(errors='replace') for i in range(n)]
            assert internal=='gign.mdl' and 'ref_aim_rifle' in names and 'draw' not in names
            dest=Path('source-assets/october5/abyssal-invalid')/('gign-'+sha(raw)[:16]+'.mdl.gz')
            save(pack,source,raw,dest,True)
            rejected.append(dict(source=source,internalName=internal,sha256=sha(raw),reason='GIGN character, not a Phantom view model; no weapon draw/reload/inspect actions'))
        if source.endswith('.wav'):
            raw=z.read(source);dest=Path('dist/assets/feedback/abyssal-audio')/Path(source).name
            save(pack,source,raw,dest);sounds.append(str(dest.relative_to('dist')))
    # These are draw/inspect/reload cues, not a kill banner.
    # The collection exposes a separate audio preview for this incomplete pack.

Path('dist/october5-catalog.js').write_text('export const OCTOBER5_IMPORTS='+json.dumps(catalog,ensure_ascii=False,indent=2)+';\nexport const OCTOBER5_FEEDBACK='+json.dumps(feedback,ensure_ascii=False,indent=2)+';\n')
Path('docs/october5-resource-sources.json').write_text(json.dumps(dict(files=files,actions=actions,rejectedModels=rejected,weaponFamilies=len(catalog),variants=sum(len(s['variants']) for s in catalog.values())),ensure_ascii=False,indent=2))
print('Imported',len(catalog),'weapon families;',sum(len(s['variants']) for s in catalog.values()),'variants;',len(rejected),'invalid weapon files retained for diagnosis.')
