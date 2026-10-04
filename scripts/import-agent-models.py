"""Preserve the uploaded character models, palettes and animation streams.
Usage: python scripts/import-agent-models.py path/to/archive.zip
"""
from pathlib import Path
import sys, zipfile, gzip, hashlib, json, struct

out = Path('dist/assets/agent-models')
agents = {'wushu': ('jett', 'jett'), 'thorne': ('sage', 'sage'),
          'hunter': ('sova', 'sova'), 'phoenix': ('phoenix', 'phoenix'),
          'sarge': ('brimstone', 'brimstone'), 'guide': ('skye', 'Skye')}
ledger = []
with zipfile.ZipFile(sys.argv[1]) as archive:
    for agent, (folder, stem) in agents.items():
        for team in ['ct', 't']:
            source = f'player/{folder}_{team}/{stem}_{team}.mdl'
            raw = archive.read(source)
            assert raw[:8] == b'IDST\x0a\x00\x00\x00'
            assert struct.unpack_from('<i', raw, 72)[0] == len(raw)
            target = out / agent / f'{team}.mdl.gz'
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(gzip.compress(raw, compresslevel=9, mtime=0))
            ledger.append(dict(agent=agent, team=team, source=source,
                               output=str(target), bytes=len(raw),
                               sha256=hashlib.sha256(raw).hexdigest()))
Path('docs/native-agent-sources.json').write_text(json.dumps({
    'input': 'val原版人物模型.zip',
    'method': 'Lossless gzip of original IDST v10 character model bytes; embedded textures and all animation blends preserved.',
    'files': ledger}, ensure_ascii=False, indent=2))
print('Imported', len(ledger), 'native character models')
