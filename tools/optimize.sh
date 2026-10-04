#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node tools/optimize.mjs "${1:-public/downloads/GPT6-Astra-Pro_ColabDev_ThreeJS_BWCat.glb}"
