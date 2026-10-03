"""Losslessly compress new native models and refresh the runtime catalog/ledger."""
from pathlib import Path
import subprocess,json,gzip,hashlib
catalog=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {OCTOBER_IMPORTS} from './dist/october-catalog.js';console.log(JSON.stringify(OCTOBER_IMPORTS))"],text=True));before=after=0
for key,spec in catalog.items():
 if spec.get('format')=='source49':continue
 spec['modelFile']='model.mdl.gz'
 for p in (Path('dist/assets/imported')/key).rglob('*.mdl'):
  raw=p.read_bytes();compressed=gzip.compress(raw,mtime=0);p.with_suffix('.mdl.gz').write_bytes(compressed);p.unlink();before+=len(raw);after+=len(compressed)
for p in Path('dist/assets/imported/utilities').glob('*.mdl'):
 raw=p.read_bytes();c=gzip.compress(raw,mtime=0);p.with_suffix('.mdl.gz').write_bytes(c);p.unlink();before+=len(raw);after+=len(c)
Path('dist/october-catalog.js').write_text('export const OCTOBER_IMPORTS='+json.dumps(catalog,ensure_ascii=False,indent=2)+';\n')
p=Path('docs/october-resource-sources.json');ledger=json.loads(p.read_text());ledger['weaponFamilies']=len(catalog);ledger['variants']=sum(len(s['variants'])for s in catalog.values());ledger['aimModels']=sum(bool(s.get('hasAim')) for s in catalog.values())
for row in ledger['files']:
 q=Path(row['output'])
 if not q.exists() and q.with_suffix(q.suffix+'.gz').exists():row['output']=str(q)+'.gz';row['encoding']='gzip';row['sourceSha256']=row.pop('sha256');row['sha256']=hashlib.sha256(Path(row['output']).read_bytes()).hexdigest()
p.write_text(json.dumps(ledger,ensure_ascii=False,indent=2));print('Lossless MDL compression:',before,'->',after,'bytes')
