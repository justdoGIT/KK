# Review remediation

- **Date:** 2026-10-02
- **Scope:** full-site review pass — scene artwork, missing objects, autoscroll,
  scroll/render performance, defects, console noise.

This document records the reproduced defects, implementation review findings,
repairs, and final verification. Source-only findings are identified by their
regression scenario rather than presented as browser observations.

## Autoscroll and guided playback

The pinned stories (`#hero` finale, `#journey`, `#skills`, terminal, career)
play themselves forward once the visitor stops scrolling. Three defects made
that playback unreliable:

1. **Keyboard, click, and cleanup could not stop a running cruise.** The old
   `haltScroll` path asked Lenis to scroll to where it already was; Lenis 1.3
   treats that as a completed animation and never cancels the in-flight one, so
   Escape/Enter/click left the page moving. The rewrite (`src/motion/
   guided-scroll.ts`, `src/motion/smooth-scroll.ts`) drives the cruise from the
   shared frame scheduler instead of a Lenis animation, so `stopCruise()` is a
   real cancel: any wheel, touch, key, pointer, or resize input takes over on
   the same event.
2. **Pinch-zoom armed playback.** Ctrl+wheel (trackpad pinch) arrived as a
   downward wheel and started the story. It is now ignored, together with
   horizontal swipes and wheels over dialogs or `data-lenis-prevent` regions.
3. **Touch devices played while the finger was still down.** Armed playback is
   now suspended during a touch gesture and re-evaluated on `touchend`.
   Release re-arms from the gesture's net direction and waits for observed
   scroll-position stability instead of Lenis' sticky native-scroll status.

Pace is authored in seconds per section rather than raw px/s
(`useGuidedScroll(..., { target, seconds })`), so a story no longer takes
longer solely because the viewport is taller. Cruise takeover converts Lenis'
per-frame velocity with the scheduler's actual frame delta rather than assuming
60 Hz, and `advanceCruise` clamps movement to the authored rate.

## Scroll performance

* **One read/write frame contract.** `useScrollFrame` now takes a `read`
  callback (layout and style reads only) and a `write` callback (DOM writes and
  discrete state), running them in the scheduler's matching phases of the same
  frame. Every driver was split: `CaseStudies`, `Services`,
  `SkillDomainsReveal`, `StoryJourney`, `ScrollNavigator`, the terminal, and
  the shared grid reveal. Previously each driver read layout in the write
  phase, so one driver's writes forced synchronous style/layout flushes on the
  next driver's reads.
* **Reveal measurements no longer feed back.** `viewportEntry` measured the
  reveal transform the previous frame had written to the same element, so the
  browser recalculated layout per card per frame. It now measures the layout
  edge (`offsetTop` + positioned ancestor) and ignores the animation transform.
* **Per-frame state churn removed.** The terminal reveals only change React
  state when a discrete value actually changes (typed-prefix, line count,
  active tab) instead of setting a fresh string every frame.
* **Scene resource lifetime.** Canvas textures created by the PCB, QFP, NPU,
  capacitor, wafer, and hologram components are now disposed on unmount; the
  fleet canvas renders from `SchedulerFrames` with `frameloop="never"` and only
  while visible; its stage grow-in lerp is clamped against long frame gaps;
  the career canvas dropped the context MSAA that the composer already
  provides; hologram border geometry, deck-shadow scratch rectangles, hero rim
  colours, and the wall-follower chase heading no longer allocate per frame.

## Scene artwork

The hero backdrop's procedural Earth read as a placeholder. It now layers the
NASA Blue Marble land/ocean/ice map with the NASA cloud composite (see
`public/textures/CREDITS.md`), sampled by the existing equirect shader. The
procedural surface still renders until each texture decodes, so a slow or
failed load never blanks the scene, and both layers are disposed with the
scene. The drifting cloud layer uses horizontal repeat wrapping, so a
long-lived session cannot clamp the globe to the texture's final longitude.
The atmosphere shell was rewritten as a banded glow around the planet limb:
the previous formula grew outward from the limb, clipped to pure white against
the sky and ended in a hard ring at the shell's silhouette.

## Defects

* Hero astronaut: a non-finite contact placement could pin the suit off-stage
  and the deck panels could vanish with it; the root placement now falls back
  to the last finite solution and contact is measured under an identity root.
* Glass finale: the shatter impact point is mapped from hero-canvas space into
  the pane's own 0–1 space, so shards burst from the boot rather than from a
  point offset toward the stage centre.
* Silicon wafer: the bevel ring lay in the XY plane through the disc instead of
  around its rim.
* Architecture modal: focus is moved into the dialog and trapped in both
  directions from its initial container, Escape closes, focus returns to the
  invoking control, callback identity changes do not restart the dialog
  lifecycle, and the previous body overflow/Lenis state is restored. Wheel
  input over the modal cannot move the page. The copy control reports a denied
  async and fallback copy instead of claiming success; successful fallback
  copy restores focus.
* Terminal: restoring from minimized repaints the live reveal instead of
  leaving the wrapper at its initial 10 %-opacity state; clipboard failures
  surface as button feedback instead of an unhandled rejection.
* Reduced motion: the terminal renders its script statically (full command and
  output, no pinned height, no scroll-linked zoom), matching the library
  window controls' semantics as real buttons.

## Console noise

Browser logs from a full-scroll session contained repeated
`THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`
warnings. They come from `@react-three/fiber` 9.7 constructing one `Clock` per
canvas (pmndrs/react-three-fiber#3741); no application code uses `THREE.Clock`.
`src/lib/quiet-three-warnings.ts` filters only the exact emitted message behind
a documented removal condition. Chromium's earlier "GPU stall due to
ReadPixels" driver messages occurred during software-rendered screenshot
capture, not during the final product interaction smoke.

## Verification

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`,
`npm run validate:publication`, and `node scripts/immersive-kit.mjs validate`
pass. Semgrep ran 315 TypeScript/JavaScript rules against 150 tracked targets
with zero findings.

Production browser checks cover 1280×800, 1440×900, 1568×782, and 390×844:
settled card fronts, terminal restore, architecture-dialog focus/scroll/copy
behavior, guided wheel and touch playback with immediate takeover, reduced
motion's complete static terminal, decoded Earth texture layers, cloud
longitude wrapping, finite and visible astronaut/deck placement after finale
return, and console/page errors. Screenshots and machine-readable reports live
in `~/.local/state/github-portfolio/review-final/`.

An observed 16-frame Offers sample recorded 24 layouts (62.275 ms), 36 style
recalculations (166.236 ms), and 4.583 s script time under headless SwiftShader.
Those absolute timings are environment-bound and are not presented as a
before/after benchmark; the verified improvement is structural batching into
ordered scheduler read/write phases.
