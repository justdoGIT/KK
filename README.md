# Embedded Systems Portfolio

[![CodSpeed](https://img.shields.io/endpoint?url=https://codspeed.io/badge.json)](https://app.codspeed.io/justdoGIT/KK?utm_source=badge)

Static GitHub Pages portfolio for Kamal Pandey — Embedded Software & Systems Engineer.

**Live site:** https://justdogit.github.io/

The website and its shared deployment workflow live in KK. GitHub requires
the `justdogit.github.io` repository to serve this root URL; its small workflow
calls KK's pinned `.github/workflows/deploy.yml` with `source_ref: main`.
It publishes on configuration changes or manual runs, and checks hourly for
new commits on KK main. Unchanged scheduled releases skip the build and deploy.
No cross-repository deployment token is required.

Production assets use `/`, and canonical and social URLs point to the root
website. KK's own Pages deployment serves a redirect from the former
`https://justdogit.github.io/KK/` URL. Both deployments run KK's typecheck,
lint, tests, publication validation, and bundle budgets. The root publisher
records the exact KK commit in `source-version.json` and verifies it after
deployment. Update the caller's immutable workflow pin when changing the
shared deployment workflow.

Built with React 19, Vite, TypeScript, Tailwind CSS 4, Three.js (R3F/Drei), Lenis, and GSAP.

## Quick start

```bash
npm ci                         # install exact pinned deps
npm run dev                    # development server
npm run build                  # production build
npm test                       # unit tests
npm run validate:publication   # publication provenance check
npm run bench                  # performance benchmarks (CodSpeed)
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

`.github/workflows/ai-review.yml` sends at most 16,000 characters from every
non-draft pull-request diff, including forks, to the free
`nvidia/nemotron-3-ultra-550b-a55b` model (550B-parameter MoE) through
NVIDIA's free inference-credit API. That diff cap is the largest size this
endpoint answered reliably in testing; a 40,000-character diff triggered a
503 and a hung connection, and the request retries once after a 5-second
backoff to absorb that observed overload. Reviews take roughly 100 seconds
at the diff cap. Larger diffs are reviewed only up to that cap. NVIDIA's
free credits are a one-time grant, not a recurring quota, so this reviewer
can stop working once they are exhausted. The reviewer treats the patch as
untrusted data and updates one bot comment on each push. It never checks
out pull-request code under `pull_request_target`, has no paid-model
fallback, and receives only read access to contents and pull requests plus
write access to issue comments. The workflow requires the `NVIDIA_API_KEY`
repository secret.

## Architecture

- **Semantic HTML first**: all content remains usable without WebGL, smooth
  scroll, or JavaScript scene chunks.
- **Publication provenance**: strict evidence/claim/approval schema with
  prohibited-term scanning, claim hashing, and negative validation fixtures.
- **Progressive enhancement**: persistent R3F canvases, Lenis smooth scroll,
  guided pinned-section playback, and the magnetic cursor are gated by motion
  preference, viewport proximity, and WebGL capability.
- **Reading tour**: automatic playback allows 150 words per minute with
  reading pauses. Scroll, touch, keyboard input, and text selection pause it;
  the header control resumes it. Reduced motion keeps the tour opt-in.
- **Small-screen reading**: phones use swipeable boards with scrollable long
  content and a reversible metrics document. Service cards share a measured
  frame on larger screens and return to page flow when they cannot fit.
  Terminal tabs expose complete transcripts with independent scrolling.
- **Rendering continuity**: a mission scene poster remains until both journey
  canvases and Earth textures are ready. Nearby scenes load once and retain
  their WebGL contexts while rendering pauses outside the viewport.
- **Shared frame scheduler**: ordered `scroll → read → write → render` phases
  keep DOM and WebGL motion synchronized and stop when no work remains.
- **Adaptive quality**: drawing buffers respect native display density, capped
  at 2x on desktop and 1.5x on mobile. Performance monitoring lowers DPR in
  0.25 steps under sustained frame-time pressure, down to 0.75x without
  changing HTML text resolution. Scene shaders compile
  asynchronously where supported.
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

## Deployed baseline and preserved work

The application baseline is the successful GitHub Pages deployment of
`08829666c96e93c53289de234f635cfe0620ded3`. Reconciliation retains that
application, dependency lockfile, tests, assets, and deployment configuration;
intermediate implementations must not replace the deployed experience.

Earlier work remains preserved in the merged history, even after its branches
are removed:

- [66eb787](https://github.com/justdoGIT/KK/commit/66eb7876bc2ef0321f1ce5996fc7b17ea90c799f): Forgejo automation and its full history.
- [552a0a9](https://github.com/justdoGIT/KK/commit/552a0a9679e67fb01af0b6bcf42a81bfc85fccf2): the original live-site README change.
- [489e76a](https://github.com/justdoGIT/KK/commit/489e76a4a6847cff5940d4e754acb004ac6ae3cf): validation-only worktree workflows.
- `archive/vite-upgrade-20261104`: the unapplied Vite dependency upgrade.

The Forgejo and validation histories are consolidated without activating their
intermediate workflows. The Vite upgrade remains separate in PR #64 for later
evaluation; it is not claimed as applied to this baseline.

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
- `docs/performance-review.md`: measured graphics and asset savings, remaining
  bottlenecks, and a reproducible browser profiling command.

## License

© 2026 Kamal Pandey. All rights reserved.
