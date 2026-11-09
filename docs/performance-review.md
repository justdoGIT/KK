# Portfolio performance review — 6 November 2026

The changes stop unnecessary offscreen rendering, reduce the mission's image
download, and give slow graphics devices a lower resolution tier. Initial
shader preparation remains the largest unresolved cost in the local stress
test.

| Change | Before | After | Effect |
| --- | ---: | ---: | --- |
| Earth textures, combined | 1,095,966 bytes | 640,610 bytes | 41.5% less transfer when the mission loads |
| Earth texture dimensions | 2048×1024 each | 2048×1024 each | Resolution retained; WebP quality 82, method 6 |
| Pin and solder-ball submissions per hero frame | 48 + 32 separate meshes | 1 + 1 instanced meshes | 78 fewer draw submissions for these parts; geometry and materials retained |
| Hero draws while reading metrics, desktop | 3 | 0 | Offscreen canvas stops rendering |
| Hero draws while reading metrics, phone | 14 | 0 | Offscreen canvas stops rendering |
| Observed desktop drawing buffer | 1280×744 | 960×558 | 43.8% fewer graphics pixels under sustained load |
| Observed phone drawing buffer | 487×985 | 390×788 | 35.9% fewer graphics pixels under sustained load |

Repeated chip pins and solder balls now share their geometry and material in
static instanced meshes. Their matrices are uploaded only when the parts
change, rather than creating an independent mesh for each identical part.

The renderer now observes the canvas's actual bounds, rather than the taller
hero section with an additional 20% margin. It retains the mounted canvas and
its assets for the return scroll. Adaptive resolution can step down to 0.75x;
it does not change HTML text or control resolution. Five sustained sampling
windows are required before lowering quality.

The texture conversion saves 455,356 bytes. Mean per-channel pixel differences
from the JPEGs are 1.57/255 for the daytime layer and 2.43/255 for clouds. A
side-by-side visual inspection retained the coastlines and cloud detail. This
is lossy recompression, not a lossless conversion. Source attribution and the
reusable asset catalog have been updated.

| Remaining weakness | Evidence | Next improvement |
| --- | --- | --- |
| Shader and scene startup can block interaction on weak graphics devices | Longest desktop task was 5.42 s before and 5.69 s after; phone was 4.41 s before and 4.64 s after | Further reduce material variants and prepare career stages incrementally. Profile procedural reflection-map baking and physical low-end devices before changing scene detail. |
| The opening scene adds substantial JavaScript despite dynamic imports | Initial shell is 119.8 KiB gzip; the hero adds approximately 257 KiB beyond it | Separate optional visual effects from the first scene and evaluate a lightweight graphics mode. Do not treat a dynamic import requested immediately as deferred startup cost. |
| Career effects are expensive | Five stages share initial preparation; shadows, bloom, tone mapping, and vignette add work | Profile stage preparation separately from drawing; reduce effect cost under sustained pressure while retaining the authored motion. |
| Field responsiveness is not measured | Current measurements are local Chromium runs | Collect consent-appropriate field LCP/INP/CLS data and test physical Android/iOS devices and a constrained network. |

Largest contentful paint was 0.91 → 0.90 s on desktop and 1.21 → 0.69 s on the
phone profile, with no observed startup layout shifts. These single-run paint
figures do not establish a general speedup: they coexist with multi-second
blocking tasks. Startup responsiveness is **not** claimed as fixed.

Measurements used production previews, fresh Chromium contexts, a 1280×800
desktop at device pixel ratio 1, and a 390×844 touch viewport at ratio 3. The
browser used SwiftShader software rendering, without network throttling. The
initial observation waited 15 seconds, then counted hero draws during a
nominal two-second reading window. Busy tasks can extend those waits. These
are stress-test observations, not production Core Web Vitals or estimates of
hardware-accelerated frame rate. The before build is commit `40de1b4`.

Raw measurements are in [performance-lab.json](performance-lab.json). Reproduce
them against a production preview:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
node scripts/measure-page-performance.mjs http://127.0.0.1:4173 /tmp/performance.json
```

An optional third argument supplies the Chromium executable path. Bundle
budgets remain enforced by `node scripts/check-bundle-budgets.mjs`.
