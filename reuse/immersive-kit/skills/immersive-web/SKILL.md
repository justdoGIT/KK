# Immersive Web Reuse

Use this skill when moving a WebGL scene, procedural 3D artifact, scroll story,
robot animation, or astronaut journey into another React website.

## Start with the catalog

1. Run `node scripts/immersive-kit.mjs validate`.
2. Run `node scripts/immersive-kit.mjs list` and choose the smallest bundle that
   owns the requested experience.
3. Run `node scripts/immersive-kit.mjs plan --bundle <id> --json` before edits.
4. Preserve the returned directory structure. Relative imports intentionally
   bind each scene to its motion clock, texture builders, and fallbacks.
5. Install the exact peer dependency versions from the plan, then upgrade only
   after the copied scene passes its browser smoke.
6. Copy every returned license file with every model. Never extract a GLB from
   its attribution record.

## Bundle selection

- `rendering-core`: adaptive DPR, shared lighting, first-frame readiness,
  context recovery, procedural textures, and hardware primitives.
- `motion-core`: ordered frame scheduler, Lenis ownership, guided scroll,
  reveal and throw math, and input cancellation.
- `silicon-fleet`: board bring-up through distributed fleet narrative.
- `career-robots`: robot models, rigs, terrain, morphing, sensors, humanoid,
  rocket, and career stage composition.
- `astronaut-journey`: astronaut rig, poses, tunnels, glass, landing deck,
  contact interactions, and immediate SVG standby artwork.
- `hero-artifacts`: floating hardware and fluid ripple hero background.
- `scroll-stories`: cards, terminal, skills, offers, and process choreography.
- `tooling`: catalog, exporter, Vite plugin, MCP server, and this skill.

## Rendering invariants

- Keep one owner for each WebGL context. Pause its frameloop outside the
  viewport; do not repeatedly unmount and recreate the context.
- Keep the fallback visible until the first real frame from every canvas in a
  split scene. Restore it on `webglcontextlost`; hide it only after all contexts
  render again.
- Use `CanvasAvailability` inside the same Suspense boundary as scene assets.
- Keep desktop DPR at 2 maximum and mobile DPR at 1.5 maximum. Retain the
  decline-only adaptive DPR monitor.
- Keep procedural color textures in sRGB and preserve anisotropy. Dispose
  memoized geometries, materials, textures, and line buffers on unmount.
- Use environment lighting for metals. Do not replace it with arbitrary high
  ambient intensity.
- Map pointer coordinates through the target canvas rectangle, not the window.
- Keep a deterministic CSS or SVG fallback for no-WebGL, slow loading, and
  context loss.

## Motion invariants

- Use the shared `scroll -> read -> write -> render` scheduler. Do not add a
  private `requestAnimationFrame` loop for scroll choreography.
- Read layout in the read phase and mutate styles or clocks in the write phase.
- Use React state only for discrete structural changes, selected indices, and
  accessibility state. Continuous progress belongs in refs and styles.
- Never animate CSS `filter` or `backdrop-filter` on a scrolling or WebGL-backed
  layer. Prefer opacity and transforms.
- Guided scroll starts only after downward intent and only inside its section.
  Wheel reversal, touch, keyboard, or pointer input must return control
  immediately.
- Respect `prefers-reduced-motion` and no-WebGL modes; both must show complete,
  readable content without requiring scroll playback.

## Asset and pose changes

- Treat rig joint coordinates as model-space contracts. Verify world-space
  bone and surface positions after applying a pose.
- For contact poses, test the skinned surface against the support plane; bone
  positions alone do not prove that the suit or robot clears geometry.
- Keep model URLs base-aware. Do not hardcode root-absolute `/models/...` URLs
  in sites deployed below a subpath.
- Rebuild derived GLBs through `scripts/assets/build_robot_glbs.py`; do not edit
  compressed binaries by hand.

## Integration and verification

1. Add styles in the catalog's returned order and import the selected
   entrypoint lazily where the original does.
2. Replace portfolio copy and content data, not the scene lifecycle.
3. Run typecheck, lint, unit tests, and a production build.
4. Smoke the actual production build in Chromium with WebGL enabled.
5. Scroll through every scene transition in both directions. Record console and
   page errors and inspect the real surface at desktop and mobile sizes.
6. Delay a model request and dispatch WebGL context loss/restoration. The
   fallback must cover the viewport until the replacement frame is painted.
7. Check drawing-buffer size, settled text orientation, model attribution,
   disposal, and zero idle animation work outside the viewport.

## MCP and Vite tools

Run the MCP server with:

```sh
node reuse/immersive-kit/mcp-server.mjs
```

Its tools list, plan, and export bundles. Export refuses existing files unless
`overwrite` is explicitly true and writes `immersive-kit.lock.json` with a
SHA-256 digest for each copied file.

Add `immersiveKitPlugin()` from `reuse/immersive-kit/vite-plugin.mjs` to a Vite
configuration when the consuming site needs the validated catalog at
`virtual:immersive-kit/catalog`.
