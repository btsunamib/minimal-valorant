#!/usr/bin/env python3
"""Preserve source frames/PTS for one action; requires ffmpeg and ffprobe."""
import argparse, hashlib, json, pathlib, subprocess

def main():
    p=argparse.ArgumentParser();p.add_argument('video',type=pathlib.Path);p.add_argument('output',type=pathlib.Path);p.add_argument('--start',type=float,required=True);p.add_argument('--duration',type=float,required=True);a=p.parse_args()
    if a.start<0 or a.duration<=0:p.error('start must be nonnegative and duration positive')
    if a.output.exists() and any(a.output.iterdir()):p.error('output must be empty; preserve existing evidence')
    probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_frames','-show_streams','-show_entries','stream=width,height,r_frame_rate,avg_frame_rate:frame=best_effort_timestamp_time','-of','json',str(a.video)]))
    chosen=[(i,float(f['best_effort_timestamp_time'])) for i,f in enumerate(probe['frames']) if 'best_effort_timestamp_time' in f and a.start<=float(f['best_effort_timestamp_time'])<a.start+a.duration]
    if not chosen:p.error('no frames in requested interval')
    a.output.mkdir(parents=True,exist_ok=True)
    # Select decoded frame indices: no resampling, invented frames or assumed constant FPS.
    first,last=chosen[0][0],chosen[-1][0]
    subprocess.run(['ffmpeg','-v','error','-i',str(a.video),'-map','0:v:0','-vf',f'select=between(n\\,{first}\\,{last}),setpts=PTS-STARTPTS','-fps_mode','passthrough','-start_number','0',str(a.output/'frame-%06d.png')],check=True)
    images=sorted(a.output.glob('frame-*.png'))
    if len(images)!=len(chosen):raise RuntimeError(f'Extraction mismatch: {len(images)} images vs {len(chosen)} timestamps')
    digest=hashlib.sha256()
    with a.video.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):digest.update(chunk)
    manifest={'source':a.video.name,'source_sha256':digest.hexdigest(),'start':a.start,'duration':a.duration,'stream':probe['streams'][0],'frames':[{'index':j,'source_frame':i,'source_seconds':t,'action_seconds':t-a.start,'file':images[j].name} for j,(i,t) in enumerate(chosen)]}
    (a.output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({'frames':len(images),'manifest':str(a.output/'manifest.json')}))
if __name__=='__main__':main()
