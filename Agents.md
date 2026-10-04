# Agent handoff — MONO bicolor fold cat

## Request and constraints
Build a natural, fully orbitable black-and-white folded-ear cat matching the user-supplied four-view reference. Use web technology, prefer headless Chrome, work in the existing Colab instance, create all character assets from scratch, place model/tool names above the cat, show a live chronological review gallery and absolute file paths, use Git, publish a preview, and provide this handoff.

The user requested 20,000 edit/preview iterations and a score above 95/100. These are requests, not completed facts. Never invent iteration counts, claim an automated image similarity score, or mark the target achieved without evidence. The input reference was viewed visually through the native image tool; no code analyzed its pixels.

## Locations
- Project: `/home/dev/project/3d/gpt6-astra-pro_colabdev_web_bwcat`
- Build: `/build/gpt6-astra-pro_colabdev_web_bwcat`
- Model source: `src/cat.js`
- Viewer: `src/main.js`
- Reviews: `public/manifest.json`, latest entries first.
- Evidence: `public/process/iteration-NN-VIEW.png`, `public/process/test-NN.json`.
- Reference: `reference/bwcat4view.png`, copied to `public/reference.png` for comparison only.
- Download output: `public/downloads/` and the compiled site's `downloads/`.
- Branch: `gpt6-astra-pro-colabdev/cat-studio`.
- Live local server: port 4187. Its PID and logs are in `.logs/server.*`.
- Temporary Cloudflare tunnel: `https://theories-placement-tube-taxi.trycloudflare.com`; PID/logs in `.logs/cloudflared.*`. This URL depends on the running Colab session.

## Environment
Colab was healthy but had all 32 terminal slots occupied. Initial attempts to create a new terminal failed. A briefly reused shell was restored to its original directory; all subsequent commands were scoped to this project's absolute paths or isolated child shells, without changing the shared working directory. Prefer a new dedicated shell when capacity becomes available. Do not stop other projects' services, change their working directories, or reuse their assets. No local modeling fallback was used.

Installed development tools include Node 22, Chromium at `/home/dev/.local/bin/chromium`, cloudflared, and authenticated GitHub CLI (account `ecooxai`). No credentials are committed or included in archives. Read current logs and Git status before continuing.

## Geometry and rendering
The torso/head/legs/toes use an original signed-distance sculpt sampled through the Three.js marching-cubes implementation. The ears are closed deformed surfaces, not reference-image planes. Body markings are coordinate-based functions with seeded boundary variation. The eyes have procedural radial iris textures, modeled pupils and highlights. Whiskers are tapered sweeps. Fur is sampled over the actual meshes and constructed as oriented, tapered ribbons; all randomness is seeded.

Recent corrections: reversed iris faces, hollow initial ears, excessive eye protrusion, missing white collar spacing, incorrect rear-skull white patch, tail-tip shape, subtle toe volumes, and standing-paw offsets. Front/back/profile cameras are orthographic; the default is perspective. Rendering is demand-driven when the user is not turning the model.

## Validation state — update before final delivery
Reviews 1–3 produced all five view screenshots, desktop/mobile captures and passing interaction reports. Review 4 produced its perspective screenshot, but Playwright's element-stability wait timed out on an orthographic capture. Review 5 repeated the visual work but was not accepted as a complete validation pass. Review 6 changes capture to explicit viewport clipping, removes costly corneal transmission and duplicate render calls, and disables build auto-reloads in test mode. Check `.logs/test-06.log` and `public/process/test-06.json` rather than assuming success.

The journal currently contains actual visual reviews through 5; review 5 is 80/100 and explicitly records the validation regression. Do not claim 95/100 or 20,000 completed iterations.

## Next steps
1. Complete and visually inspect the corrected five-view test run, including rear coat continuity, toe contact, and eye shape.
2. Verify the exported GLB by its actual download, header, and re-import. Compress a separate web copy with meshopt to reduce cold-start work while keeping a portable download.
3. Record only the reviews actually performed, including regressions. Keep the latest important artifacts first in the app.
4. Finish GitHub Pages deployment, validate its public URL in a browser, and update this handoff with real test counts, URLs, file sizes and remaining limitations.
5. Run `python3 tools/package.py`, inspect the resulting ZIP, commit meaningful steps, and request a Colab backup. Do not stop the instance or existing preview services.

## Remaining quality gap
This is a procedural reconstruction, not yet a demonstrated photorealistic/AAA match. Fine fur shading, nuanced facial anatomy, exact patch boundaries and a more photographic appearance still need visual judgment. The supplied four-view reference itself contains view-to-view differences; choose coherent 3D anatomy rather than sacrificing unseen sides to match one camera.
