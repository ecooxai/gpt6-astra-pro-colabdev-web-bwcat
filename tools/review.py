from pathlib import Path
import json,sys,datetime,shutil,os
p=Path(__file__).resolve().parents[1]; n=int(sys.argv[1]); score=float(sys.argv[2]); title=sys.argv[3]; note=sys.argv[4]
m=json.loads((p/'public/manifest.json').read_text()); image=f'process/iteration-{n:02d}-three.png';r=dict(iteration=n,title=f'{n:02d} · {title}',score=score,image=image,note=note,path=str(p/'public'/image));m['reviews']=[r]+[x for x in m['reviews'] if x['iteration']!=n];m.update(revision=datetime.datetime.now(datetime.timezone.utc).isoformat(),updated=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M UTC'),iterations=len(m['reviews']),score=score,note=f'Review {n}: {score:g}/100. {note} Scores are subjective visual assessments, not measured reference similarity.');
for entry in m['reviews']:
    number=entry['iteration']; entry['captures']=[]
    for view in ['three','front','left','right','back','desktop','mobile']:
        rel=f'process/iteration-{number:02d}-{view}.png'; f=p/'public'/rel
        if f.exists():entry['captures'].append(dict(view=view,image=rel,path=str(f)))
    rel=f'process/test-{number:02d}.json'
    if (p/'public'/rel).exists():entry['testReport']=dict(file=rel,path=str(p/'public'/rel))
(p/'public/manifest.json').write_text(json.dumps(m,indent=2));out=Path(os.environ.get('BUILD_DIR',str(p/'build')));shutil.copy2(p/'public/manifest.json',out/'manifest.json');shutil.copytree(p/'public/process',out/'process',dirs_exist_ok=True);print(f'CAT_REVIEW {n}: {score}/100')
