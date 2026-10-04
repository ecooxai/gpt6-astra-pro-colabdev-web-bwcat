from pathlib import Path
import zipfile,shutil,os
root=Path(__file__).resolve().parents[1]
out=Path(os.environ.get('BUILD_DIR',str(root/'build')))
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
with zipfile.ZipFile(target) as z:
    assert z.testzip() is None
    assert not any('/.logs/' in n or '/node_modules/' in n or '/.git/' in n for n in z.namelist())
shutil.copy2(target,out/'downloads'/name)
print(f'PACKAGE_OK {target} {target.stat().st_size} bytes')
