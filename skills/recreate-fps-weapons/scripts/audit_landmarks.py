#!/usr/bin/env python3
"""Audit complete frame-indexed landmark annotations; no image similarity claims."""
import argparse,json,math,pathlib,statistics

def main():
    p=argparse.ArgumentParser();p.add_argument('manifest',type=pathlib.Path);p.add_argument('reference',type=pathlib.Path);p.add_argument('rendered',type=pathlib.Path);p.add_argument('report',type=pathlib.Path);p.add_argument('--max-error',type=float,default=2,help='pixels at reference height 1080');a=p.parse_args()
    manifest=json.loads(a.manifest.read_text());ref=json.loads(a.reference.read_text());actual=json.loads(a.rendered.read_text());required=ref.get('required_landmarks',[])
    if not required or a.max_error<0:p.error('required_landmarks must be nonempty; error threshold cannot be negative')
    issues=[];errors=[];rows=[];ids=[x['index'] for x in manifest['frames']]
    def index(data,name):
        frames=data.get('frames',[]);d={x['index']:x for x in frames}
        if len(frames)!=len(d):issues.append(name+': duplicate frame indices')
        if set(d)!=set(ids):issues.append(name+': missing or extra frames')
        return d
    r=index(ref,'reference');v=index(actual,'rendered');height=manifest.get('stream',{}).get('height',1080);threshold=a.max_error*height/1080
    for i in ids:
        rp=r.get(i,{}).get('points',{});vp=v.get(i,{}).get('points',{});visible=0
        for name in required:
            if name not in rp or name not in vp:issues.append(f'{i}:{name}: missing annotation');continue
            x,y=rp[name],vp[name]
            if x is None and y is None:continue
            if x is None or y is None:issues.append(f'{i}:{name}: visibility mismatch');continue
            valid=lambda z:isinstance(z,list) and len(z)==2 and all(isinstance(n,(float,int)) and math.isfinite(n) for n in z)
            if not valid(x) or not valid(y):issues.append(f'{i}:{name}: invalid coordinates');continue
            visible+=1;e=math.dist(x,y);errors.append(e);rows.append({'frame':i,'landmark':name,'error_px':e})
        if not visible:issues.append(f'{i}: no comparable visible landmarks; manual visibility review required')
    worst=sorted(rows,key=lambda x:x['error_px'],reverse=True)[:20];passed=bool(errors) and not issues and max(errors)<=threshold
    result={'passed':passed,'scope':'landmarks only; not full visual/audio equivalence','frame_count':len(ids),'comparisons':len(errors),'threshold_px':threshold,'mean_error_px':statistics.mean(errors) if errors else None,'max_error_px':max(errors) if errors else None,'issues':issues,'worst':worst}
    a.report.parent.mkdir(parents=True,exist_ok=True);a.report.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k not in ['issues','worst']}));raise SystemExit(0 if passed else 1)
if __name__=='__main__':main()
