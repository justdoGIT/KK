# Experience Quality Plan: Motion, Rendering, and Site Fixes

Status: Workstreams 1, 2, 4, and the reliability follow-up are complete;
Workstream 3 is complete except 3.7 and 3.11 (deferred, see below). This plan
comes from two audits run on the live site and its code: a 3D render-pipeline
audit and a scroll/animation audit with live Playwright passes at 1280×800,
1440×900, 1568×782, and 390×844. It also covers the user-reported
contact-finale, career-humanoid, loading, scroll-pacing, and flicker defects.
Each item lists its evidence, the change, and how it is validated.

## Goals

1. **Smooth scrolling:** scrolling tracks wheel, trackpad, and touch velocity
   with no rubber-band re-acceleration. Scroll-linked layers move in the same
   frame as the scroll position, with no one-frame lag between DOM and WebGL.
2. **Low main-thread cost:** idle pages run no animation work, and a scrolling
   frame has one scheduler callback, no forced reflow, and no React commits
   except on discrete state changes.
3. **Crisp, bright 3D:** drawing buffers match the device pixel ratio up to 2×,
   every canvas is anti-aliased, colors are sRGB-correct and tone-mapped
   without washing out, and metals reflect a real environment.
4. **No visible defects:** no interpenetration, no text hidden behind 3D or
   other text, no dead viewports, and no unreadable mid-animation frames.

## Architecture changes

### One frame scheduler (`src/motion/frame.ts`)

There is one `requestAnimationFrame` loop with ordered phases:
`scroll → read → write → render`.

- Lenis advances in `scroll`.
- Drivers read layout in `read` and write styles or clock refs in `write`.
- WebGL canvases that must stay in lockstep with DOM layers render in
  `render`.

Subscribers register only while their section is near the viewport and
unsubscribe when it is not. The loop stops when nothing is subscribed. This
replaces:

- GSAP's ticker
- the scroll-event-triggered `useScrollFrame` rAFs
- each driver's own private loop

### Smooth scroll (`src/motion/smooth-scroll.ts`)

- **Lenis in lerp mode:** `lerp: 0.085`, which damps toward the input instead
  of restarting a 1.2 s ease on every wheel event.
- **Lazy loading:** Lenis loads lazily with a cancellation guard, so StrictMode
  remounts never leak a second instance.
- **Programmatic scrolling:** all of it uses `scrollToY()`, including anchor
  links (`anchors` offset clears the sticky nav) and the contact cruise.
- **GSAP and ScrollTrigger removed:** they were loaded and ticked but unused.
- **`data-scroll-slow` sections:** offsets are cached by a `ResizeObserver`,
  and the factor eases in and out instead of stepping.

## Workstream 1 — Contact finale (astronaut and billboard)

| # | Issue (evidence) | Change | Validation |
| - | ---------------- | ------ | ---------- |
| 1.1 | The seated and reclining astronaut sank through the deck slab (2,419 and 1,842 suit vertices inside the slab, measured live) | A suit support hull (each bone's outermost vertices) is re-posed every frame. Every contact mode rests on, overhangs, or hangs in front of the slab from the real suit surface. During mode blends, shallow incursions move back in front of the lip and deeper points lift the rigid body clear | Real-rig unit test: no vertex inside or under the slab in any mode or time. Live CPU-skinned measurement in the browser |
| 1.2 | Wall hang covered the card copy, back lighting looked flat, and the shoulders tore into flaps | Hang near the deck's right end, in front of the face. Pose solved from world limb directions. Backpack vertices excluded from arm skinning. Soft drop shadow on the card | Unit test bounds the hang to the right end and in front of the face. Screenshot |
| 1.3 | Deck colors (bright tone-mapped blue) did not match the navy card theme | Unlit, untone-mapped faces in the card palette. Underside reads as the ledge's shadow. Contact shadow on the plate | Pixel sample matches the card's CSS colors |
| 1.4 | Seated or standing helmet slid under the sticky nav bar | Body height budget subtracts the measured nav bottom | Screenshot at 1280×800 and 1568×782 |
| 1.5 | "Let's innovate together" hidden behind the card at short viewports (47–76 px overlap) and off-centre by 256–314 px | Heading centred on the card. Card top reserved below the heading's bottom | `heading.bottom + 16 ≤ card.top`, centre delta < 4 px at three viewports |
| 1.6 | Driver forced a synchronous layout every frame (reads after writes). Cruise fought Lenis | Reads cached on resize and taken before writes. Driver runs on the shared scheduler. Cruise uses `scrollToY` with a linear duration | No forced reflow in a trace. Monotonic cruise |
| 1.7 | Journey canvases soft (DPR 1.75 cap) and one frame behind the DOM card | dpr `[1, 2]`, `offsetSize` resize, and the hero canvas advanced in the scheduler's render phase. Neutral tone mapping and higher-contrast suit lighting | Drawing buffer equals CSS size × DPR. Deck edge locked to the card edge during scroll |
| 1.8 | Moonwalk faced the direction of travel. Walk turnarounds snapped 180° | Moonwalk faces against the glide. Turnarounds swing through the camera-facing pose | Visual check |

## Workstream 2 — Scroll and motion loops

| # | Issue | Change |
| - | ----- | ------ |
| 2.1 | More than 10 independent rAF loops, several running forever | Every scroll driver moves onto `onFrame` read/write phases, gated by IntersectionObserver |
| 2.2 | `useScrollFrame` runs one frame late and interleaves reads and writes | Rebuilt on the scheduler with a read/write split |
| 2.3 | `grid-scroll-reveal` reads then writes per card and animates `filter: blur` | Batched reads. Column count cached by ResizeObserver. Opacity and translate only |
| 2.4 | React state set every scroll frame (CaseStudies, StoryJourney, InteractiveTerminal, ScrollNavigator) | Refs and CSS variables, with setState only on discrete index changes. Progress bars use `scaleX` |
| 2.5 | CareerEntryList and the career HUD read layout every frame | Converge-and-stop scrub. HUD sizes cached by ResizeObserver |
| 2.6 | Full-viewport SVG ribbon re-blurred on the CPU every frame. Its viewBox is wrong on mobile | Static geometry animated by compositor transforms, paused off-screen, with a correct viewBox |
| 2.7 | Infinite `box-shadow`/`stroke-dashoffset` animations, and backdrop blurs over animated layers | Glow moved to opacity on a pseudo-element. Off-screen animations paused. Backdrop blur kept only on the nav |
| 2.8 | Magnetic cursor loops forever with `mix-blend-mode: difference` | Loop stops when settled. No blend mode |
| 2.9 | Programmatic jumps bypass Lenis | All jumps go through `scrollToY` |
| 2.10 | Services open on a near-blank viewport and cards are unreadable mid-throw. Mobile stacked cards show double text. Mobile reveals are half-faded mid-screen | First card settled at progress 0. Smaller rotation, with text fading in after the card settles. Covered cards fade. Mobile reveal completes earlier |
| 2.11 | "Next" control points at the current section at the last stop | Hidden at the last stop |

## Workstream 3 — 3D render quality

| # | Issue | Change |
| - | ----- | ------ |
| 3.1 | DPR capped at 1.5–1.75 and no adaptive fallback | dpr `[1, 2]` (mobile `[1, 1.5]`) with a drei `PerformanceMonitor` stepping down to 1.25 and then 1 |
| 3.2 | Career composer disables tone mapping and MSAA | `multisampling={4}`, then Bloom (threshold 0.9), then ToneMapping (Neutral), then a lighter Vignette. Fog pushed back. Environment at 256 |
| 3.3 | Procedural CanvasTextures decoded as linear (milky chips and PCBs) | `SRGBColorSpace` and anisotropy 8 everywhere. Text textures at 1024 |
| 3.4 | Point lights about 0.02–0.05 effective under physical decay. Metals black without an environment | Physically scaled intensities. A shared Lightformer environment for the hero and silicon canvases |
| 3.5 | Hero and silicon canvases render every frame for the whole page. The hero unmounts its context on tab hide | Viewport-gated frameloop. The silicon canvas mounts only when near. No unmount on hide |
| 3.6 | Per-render THREE allocations (fleet lines leak) and per-frame vector allocations | Memoized `LineSegments` with disposal. Hoisted scratch objects |
| 3.7 | **Deferred.** Stage mounts compile shaders and paint 1024² textures mid-scroll | Needs always-mounted stages toggled by `visible`, a texture cache, and a `gl.compile` prewarm — a mount-lifecycle change across every `registry.ts` stage, left for a follow-up with dedicated visual-regression time |
| 3.8 | Transmission material forces an extra scene pass | Additive basic material |
| 3.9 | Ripple sim uploads a texture forever and maps the pointer to the window | Idles when there are no ripples. Pointer mapped through the canvas rect |
| 3.10 | WebGL capability probes leak contexts | Cached result, with `WEBGL_lose_context` |
| 3.11 | **Deferred.** Hero 3D objects cross the headline. Silicon-to-Fleet frame mostly empty | Needs per-breakpoint repositioning of `FloatingField` against the hero copy column and `SiliconFleetScene` camera reframing, tuned from screenshots — left for a follow-up |
| 3.12 | Dead code (`useAdaptiveQuality.ts`, `Artifact.tsx`) | Deleted |

## Workstream 4 — Career humanoid

The Generation 4 humanoid read as flat and boxy (a rounded-box helmet,
flat shield chest, and box boots). It is rebuilt from spheres, capsules, and
lathe profiles to match the reference:

- a glossy cream dome helmet with an orange visor frame wrapping the sphere
- a black glass visor with round, glowing cyan eyes and ear pods
- a tapered rounded torso with an orange collar and cyan vents
- capsule limbs with orange shoulder and knee armor
- black gloved hands with rounded fingers
- rounded boots with dark soles

The existing animation-skeleton binding and the grounded-sole invariants stay.

## Workstream 5 — Reliability, pacing, and reuse follow-up

| # | Issue | Change | Validation |
| - | ----- | ------ | ---------- |
| 5.1 | The reclining astronaut's head had no visible support | Re-posed the left arm into an elbow-and-hand head support while preserving the rig's deck-contact invariants | Skeletal pose regression plus browser screenshot |
| 5.2 | Delayed scene chunks or WebGL startup exposed a small black viewport | The real static astronaut artwork is visible immediately and remains until both journey canvases paint. Canvas error boundaries and `webglcontextlost`/`webglcontextrestored` handling restore the cover and remount only after a successful frame | Delayed-chunk and forced-context-loss browser scenarios |
| 5.3 | The finale panel or astronaut could disappear after context interruption | Both journey canvases report first paint independently; the cover is removed only when both are ready and is restored on either failure | Forced context-loss browser scenario plus screenshot |
| 5.4 | Long pinned stories required manual micro-scrolling to see authored motion | A shared intent-driven guide advances Case Studies, Story Journey, Career, Skills, Services, and Terminal at a constant pace after downward wheel/touch intent. Reverse input, keyboard, pointer input, section exit, or completion cancels it immediately | Unit tests for direction, restart, and cancellation; browser progression check |
| 5.5 | Filter blur on continuously moving terminal and skill-card layers caused repeated rasterization and visible flashes | Removed scroll-time blur writes and filter transitions; retained authored opacity and transform motion | Full-page recorded audit plus settled CSS inspection |
| 5.6 | Settled case-study nodes inherited a flying flipper's inline rotation, producing mirrored text; remounting initially lost their fan positions | Keyed the flat and 3D DOM shapes separately, then restored each landing transform in a layout effect and on resize | Browser CSS/geometry check: four upright cards at distinct fan positions |
| 5.7 | Scene, motion, model, license, and fallback dependencies were implicit and difficult to transplant | Added a validated catalog, deterministic checksum exporter, virtual-catalog Vite plugin, MCP stdio tools, and a reusable implementation skill under `reuse/immersive-kit/` | Catalog validation, transitive export smoke, Vite plugin test, and MCP protocol test |

## Validation

- **Automated:** `npm run typecheck`, `npm run lint`, `npm test`, and
  `npm run build`. The real-rig deck-contact suite asserts the contact
  invariants. The humanoid rig suite asserts grounded soles across idle,
  walking, and running.
- **Browser:** Playwright with WebGL (swiftshader) at 1280×800, 1440×900,
  1568×782, and 390×844, run over the hero, services, journey, career (idle,
  walking, running), and every contact mode. Pass criteria: no console errors,
  no page errors, and screenshots inspected for overlap, clipping, and color.
- **Motion:** in a scripted wheel burst, at most one scheduler callback per
  frame, no forced-reflow entries from drivers, and monotonic scroll during the
  contact cruise.
