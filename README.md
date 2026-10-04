# MONO — an original bicolor fold-cat study

Created by **GPT-6 Astra Pro** using **ColabDev, JavaScript, Three.js, esbuild, and headless Chromium**.

The cat is genuine, orbitable 3D: a continuous anatomical surface, separately constructed folded ears, volumetric paws and toes, golden iris textures painted in code, corneal layers, tapered whiskers, a curved tail, and seeded geometric fur. No existing model, model texture, HDRI, or image-generation service was used. The only supplied image is kept in the reference comparison dialog; it is not projected onto the cat.

## Run

Use Node.js 22 or newer:

```sh
npm ci
npm run build
npm start
```

Open http://localhost:4187. The archive's `dist/` folder is also a ready-built static website and can be served by any ordinary HTTP server. Do not open the HTML through a `file:` URL.

On Colab the compiled site lives in `/build/gpt6-astra-pro_colabdev_web_bwcat`, linked as the project's `build/`. On another computer `npm run build` uses the local `build/` directory. Set `BUILD_DIR` to override it.

## Interaction

Drag or swipe to orbit; wheel or pinch to zoom. The camera buttons provide a perspective view and front, left, right, and back orthographic views. Keyboard shortcuts: 0 perspective, 1 front, 2 left, 3 back, 4 right. Fur and mesh inspection are independently selectable. The export button saves the visible model as GLB. Capture saves a clean WebGL PNG.

The workbench polls its review manifest every eight seconds. Build changes reload a visible viewer; `?test=1` disables automatic build reloads for reproducible browser testing.

## Structure

- `src/cat.js`: original sculpt, coat functions, ears, iris construction, whiskers, groom and anatomical parameters.
- `src/main.js`: studio renderer, camera controls, interaction, export and live journal.
- `src/style.css`, `index.html`: responsive interface.
- `public/process/`: actual screenshots and browser reports, with review numbers in their filenames.
- `public/downloads/`: distributable model and project archive.
- `tools/review.py`: records an actual visual review, never an invented iteration counter.
- `tests/browser.mjs`: headless Chromium captures and interaction checks.

## Validation

```sh
node tests/browser.mjs --iteration=7
node tests/browser.mjs --iteration=7 --export
python3 tools/package.py
```

The test script expects Chromium at `/home/dev/.local/bin/chromium` in this Colab environment. Change `executablePath` for another computer or use a Playwright-installed Chromium. The script tests WebGL initialization, viewpoint buttons, surface switches, the comparison dialog, mobile overflow, browser errors and, when requested, the actual GLB download.

Visual scores are subjective assessments, not a measured image-similarity benchmark or a certification of AAA quality. The journal records completed reviewed builds. The requested 20,000 iterations and above-95 target are **not** automatically treated as achieved. See `Agents.md` for the latest verified status and remaining work.
