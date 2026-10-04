#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .logs public/assets public/downloads
NAME=GPT6-Astra-Pro_ColabDev_ThreeJS_BWCat.glb
INPUT=${1:-public/downloads/$NAME}
test -s "$INPUT"
if [[ "$(realpath "$INPUT")" != "$(realpath .logs/original-export.glb)" ]]; then cp "$INPUT" .logs/original-export.glb; fi
# Preserve semantic groups, individual fur strands, silhouette and source metadata.
# No simplification, image resampling, palette substitution, or scene flattening.
npx gltf-transform optimize .logs/original-export.glb .logs/pruned.glb --compress false --flatten false --instance false --join false --palette false --simplify false --texture-compress false
npx gltf-transform quantize .logs/pruned.glb "public/downloads/$NAME" --quantize-position 16 --quantize-normal 12 --quantize-color 12 --quantize-texcoord 12
npx gltf-transform meshopt "public/downloads/$NAME" public/assets/mono.meshopt.glb --level high --quantize-position 16 --quantize-normal 12 --quantize-color 12 --quantize-texcoord 12
python3 - <<'PY'
from pathlib import Path
import json,hashlib,struct
r=Path.cwd();raw=r/'.logs/original-export.glb';portable=r/'public/downloads/GPT6-Astra-Pro_ColabDev_ThreeJS_BWCat.glb';web=r/'public/assets/mono.meshopt.glb'
for f in [portable,web]:
 with f.open('rb') as stream:header=stream.read(12)
 assert struct.unpack('<4sII',header)==(b'glTF',2,f.stat().st_size)
report={'ready':True,'file':'./assets/mono.meshopt.glb','source':'Original model authored by GPT-6 Astra Pro in ColabDev; this is a precomputed copy of src/cat.js, not an imported third-party asset.','generatorSHA256':hashlib.sha256((r/'src/cat.js').read_bytes()).hexdigest(),'bytes':{'original':raw.stat().st_size,'portable':portable.stat().st_size,'web':web.stat().st_size},'geometrySimplified':False,'quantization':{'positionBits':16,'normalBits':12,'colorBits':12,'textureCoordinateBits':12}}
(r/'public/model-status.json').write_text(json.dumps(report,indent=2))
(r/'public/process/asset-optimization.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
PY
