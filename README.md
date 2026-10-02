# Embedded Systems Portfolio

Static GitHub Pages portfolio for Kamal Pandey — Embedded Software & Systems Engineer.

Built with React 19, Vite, TypeScript, Tailwind CSS 4, Three.js (R3F/Drei), Lenis, and GSAP.

## Quick start

```bash
npm ci                         # install exact pinned deps
npm run dev                    # development server
npm run build                  # production build
npm test                       # unit tests
npm run validate:publication   # publication provenance check
node scripts/immersive-kit.mjs validate
```

The development server omits the production CSP so Vite can inject styles
and connect hot reload. Production builds and previews retain the strict
policy from `index.html`; do not use the development server for deployment.

Browser regression checks (run after `npm run build`):

```bash
npm exec -- playwright install chromium
npm run test:e2e -- e2e/smoke.spec.ts e2e/runtime.spec.ts
```

The runtime suite checks development styling, hot reload, mobile navigation,
and production restrictions on network connections and injected styles.

Pull requests run deterministic checks from `.github/workflows/pr-review.yml`
after leaving draft state. The gate rejects moderate-or-higher dependency risk,
runs the Chromium runtime and smoke suites serially, and retains browser
artifacts on failure.

`.github/workflows/ai-review.yml` sends at most 180,000 characters from each
non-draft, same-repository pull-request diff to the free
`moonshotai/kimi-k2.7-code-free` model through ZenMux. The reviewer treats the
patch as untrusted data and updates one bot comment on each push. It never
checks out pull-request code under `pull_request_target`, has no paid-model
fallback, and receives only read access to contents and pull requests plus
write access to issue comments. The workflow requires the `ZENMUX_API_KEY`
repository secret.

## Architecture

- **Semantic HTML first**: all content remains usable without WebGL, smooth
  scroll, or JavaScript scene chunks.
- **Publication provenance**: strict evidence/claim/approval schema with
  prohibited-term scanning, claim hashing, and negative validation fixtures.
- **Progressive enhancement**: persistent R3F canvases, Lenis smooth scroll,
  guided pinned-section playback, and the magnetic cursor are gated by motion
  preference, viewport proximity, and WebGL capability.
- **Rendering continuity**: immediate SVG scene covers remain until both
  journey canvases paint; WebGL context loss restores the cover and remounts
  the affected canvas.
- **Shared frame scheduler**: ordered `scroll → read → write → render` phases
  keep DOM and WebGL motion synchronized and stop when no work remains.
- **Adaptive quality**: Drei performance monitoring reduces DPR from 2 to
  1.25, then 1 after sustained frame-time pressure.
- **Reusable immersive kit**: `reuse/immersive-kit/catalog.json` describes
  transitive rendering, motion, astronaut, and tooling bundles. The CLI
  validates or exports deterministic bundles with checksums; the included
  Vite plugin, MCP stdio server, and implementation skill consume the same
  catalog. See `reuse/immersive-kit/README.md`.

Useful kit commands:

```bash
node scripts/immersive-kit.mjs list
node scripts/immersive-kit.mjs export \
  --bundle astronaut-journey,tooling --out ../immersive-export
```

## Publication identity

The personal agent harness case study uses a strict public identity contract:
- Public name: "personal agent harness"
- No source links, repository names, or commit identifiers are rendered
- Prohibited-term scanner catches variants in HTML, JSON, hrefs, and filenames

## Design documents

- `docs/portfolio-design.md`: architecture, PR plan, and provenance matrix.
- `docs/experience-quality-plan.md`: motion, rendering, reliability, and
  browser-verification decisions.
- `docs/review-remediation.md`: full-site defect, performance, and browser
  verification record.

## License

© 2026 Kamal Pandey. All rights reserved.
