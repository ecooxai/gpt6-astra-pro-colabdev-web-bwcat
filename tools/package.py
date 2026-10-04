from pathlib import Path
import zipfile,shutil
root=Path(__file__).resolve().parents[1]
out=Path('/build/gpt6-astra-pro_colabdev_web_bwcat') if root.as_posix().startswith('/home/dev/') else root/'build'
name='GPT6-Astra-Pro_ColabDev_Web_BWCat_Source.zip'
target=root/'public/downloads'/name
target.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for entry in ['README.md','Agents.md','NOTICE.md','package.json','package-lock.json','.gitignore','index.html']:
        p=root/entry
        if p.exists():z.write(p,p.relative_to(root))
    for folder in ['src','tools','tests','reference','public']:
        for p in sorted((root/folder).rglob('*')):
            if p.is_file() and p.suffix!='.zip' and '__pycache__' not in p.parts:z.write(p,p.relative_to(root))
    for p in sorted(out.rglob('*')):
        if p.is_file() and p.suffix!='.zip':z.write(p,Path('dist')/p.relative_to(out))
with zipfile.ZipFile(target) as z:
    assert z.testzip() is None
    assert not any('/.logs/' in n or '/node_modules/' in n or '/.git/' in n for n in z.namelist())
shutil.copy2(target,out/'downloads'/name)
print(f'PACKAGE_OK {target} {target.stat().st_size} bytes')
