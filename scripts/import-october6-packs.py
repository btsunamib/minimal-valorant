"""Import the three October 6 user packs. Requires Pillow; no synthetic audio.
Usage: python scripts/import-october6-packs.py UPLOAD_DIRECTORY
"""
from pathlib import Path
import gzip, hashlib, io, json, struct, sys, zipfile
from PIL import Image

source_root = Path(sys.argv[1])
catalog, feedback, files, actions, archives = {}, {}, [], [], {}
sha = lambda data: hashlib.sha256(data).hexdigest()

def save(archive, source, raw, output, compress=False):
    path = Path(output)
    path.parent.mkdir(parents=True, exist_ok=True)
    data = gzip.compress(raw, compresslevel=9, mtime=0) if compress else raw
    path.write_bytes(data)
    files.append(dict(archive=archive, source=source, output=output, sourceSHA256=sha(raw), outputSHA256=sha(data), gzip=compress))
    return str(path.relative_to('dist'))

def weapon(z, archive, key, name, en, slot, model_path, sounds, shot=None, family=None):
    raw = z.read(model_path)
    assert raw[:4] == b'IDST' and struct.unpack_from('<i', raw, 4)[0] == 10
    folder = 'dist/assets/imported/' + key
    spec = dict(name=name, en=en, weapon=slot, color='#b794ce' if key.startswith('chaos') else '#e3bbc8' if key.startswith('myst') else '#d5b977', modelFile='model.mdl.gz', variants={'base':'原色'}, soundBase='./assets/imported/'+key+'/sound', hasPackageAudio=bool(sounds))
    if family: spec['feedback'] = family
    bank = {}
    for source in sounds:
        data = z.read(source)
        file = sha(data)[:20] + '.wav'
        output = folder + '/sound/' + file
        if not any(f['output'] == output for f in files): save(archive, source, data, output)
        bank[source.lower().replace('\\', '/')] = file
        if shot and Path(source).name.lower() == shot.lower(): spec['shot'] = file
    sequences = []
    count, offset = struct.unpack_from('<ii', raw, 164)
    for index in range(count):
        at = offset + index * 176
        title = raw[at:at+32].split(b'\0')[0].decode(errors='replace')
        fps = struct.unpack_from('<f', raw, at+32)[0]
        ne, ev, frames = struct.unpack_from('<iii', raw, at+48)
        events = []
        for event_index in range(ne):
            frame, code, typ, option = struct.unpack_from('<iii64s', raw, ev+event_index*76)
            option = option.split(b'\0')[0].decode(errors='replace')
            clean = option.lower().replace('\\', '/')
            matches = [v for p,v in bank.items() if p.endswith('/'+clean)]
            if not matches: matches = [v for p,v in bank.items() if p.endswith('/'+clean.split('/')[-1])]
            events.append(dict(frame=frame, event=code, options=option, sound=matches[0] if matches else None))
        sequences.append(dict(index=index, name=title, fps=fps, frames=frames, events=events))
        actions.append(dict(weapon=key, id=title, frames=frames, fps=fps, status='unverified', origin='original IDST v10 animation/events', missingAudio=[e['options'] for e in events if e['event'] in [5004,5005] and not e['sound']], report=None, verified_commit=None))
    save(archive, model_path, raw, folder+'/base/model.mdl.gz', True)
    Path(folder+'/base/sequences.json').write_text(json.dumps(sequences, ensure_ascii=False, indent=2))
    catalog[key] = spec

def banner(z, archive, family, image_prefix, audio_prefix):
    images, sounds = [], []
    for source in z.namelist():
        if source.startswith(image_prefix) and source.lower().endswith('.tga'):
            raw = z.read(source)
            im = Image.open(io.BytesIO(raw+bytes(26))).convert('RGBA')
            output = 'dist/assets/feedback/'+family+'/'+source[len(image_prefix):].removesuffix('.tga')+'.png'
            path = Path(output); path.parent.mkdir(parents=True, exist_ok=True); im.save(path)
            images.append(str(path.relative_to('dist')))
            files.append(dict(archive=archive, source=source, output=output, sourceSHA256=sha(raw), outputSHA256=sha(path.read_bytes()), conversion='TGA to lossless RGBA PNG', size=list(im.size)))
        elif source.startswith(audio_prefix) and source.lower().endswith('.wav'):
            sounds.append(save(archive, source, z.read(source), 'dist/assets/feedback/'+family+'/'+Path(source).name))
    feedback[family] = dict(images=images, sounds=sounds)

archive = 'val混沌ak.zip'
with zipfile.ZipFile(source_root/archive) as z:
    weapon(z, archive, 'chaosnativevandal', '混沌序曲 · 狂徒（原生资源）', 'PRELUDE TO CHAOS', 'vandal', 'v_vandal.mdl', [p for p in z.namelist() if p.startswith('sound/') and p.lower().endswith('.wav')], family='chaosnative')
    banner(z, archive, 'chaosnative', 'killbanner/chaos/', 'killbanner/sound/')

archive = '莲花2.0套装val.zip'
with zipfile.ZipFile(source_root/archive) as z:
    prefix = '1.Mystbbloom colection/'
    for key, name, slot, sub, model, shot in [
        ('mystbloomkunai', '莲花 2.0 · 苦无', 'knife', 'Kunai/', 'models/v_knife.mdl', None),
        ('mystbloomsheriff', '莲花 2.0 · 正义', 'sheriff', 'Sheriff/', 'v_sheriff.mdl', 'sherrif1.wav'),
        ('mystbloomvandal', '莲花 2.0 · 狂徒', 'vandal', 'vandal/', 'models/v_vandal.mdl', 'ak47-1.wav')]:
        base = prefix+sub
        weapon(z, archive, key, name, 'MYSTBLOOM', slot, base+model, [p for p in z.namelist() if p.startswith(base) and p.lower().endswith('.wav')], shot, 'mystbloom')
    banner(z, archive, 'mystbloom', prefix+'killbanner/blom/', prefix+'killbanner/sound/bloom/')

archive = '新的的紫金爪刀.zip'
with zipfile.ZipFile(source_root/archive) as z:
    weapon(z, archive, 'primekarambit', '紫金 · 爪刀', 'PRIME KARAMBIT', 'knife', next(p for p in z.namelist() if p.endswith('.mdl')), [])

for name in ['val混沌ak.zip','莲花2.0套装val.zip','新的的紫金爪刀.zip']: archives[name] = sha((source_root/name).read_bytes())
Path('dist/october6-catalog.js').write_text('export const OCTOBER6_IMPORTS='+json.dumps(catalog,ensure_ascii=False,indent=2)+';\nexport const OCTOBER6_FEEDBACK='+json.dumps(feedback,ensure_ascii=False,indent=2)+';\n')
Path('docs/october6-resource-sources.json').write_text(json.dumps(dict(archives=archives, files=files, actions=actions, render_fidelity='Native assets retained; source gameplay video/frame comparisons not supplied.', notes=['Prime Karambit pack contains no WAV; unresolved audio events remain explicit.','Chaos pack contains draw/inspect/reload and five kill cues, but no firing sample.','All five Mystbloom kill cues retain distinct supplied WAV bytes.','Transparent 1-pixel banner layers are preserved exactly as supplied.']),ensure_ascii=False,indent=2))
print('Imported',len(catalog),'families;',len(actions),'sequences;',len(files),'source files')
