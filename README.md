# Embedded Systems Portfolio

Static GitHub Pages portfolio for Kamal Pandey — Embedded Software & Systems Engineer.

Built with React 19, Vite, TypeScript, Tailwind CSS 4, Three.js (R3F/Drei), Lenis, and GSAP.

## Quick start

```bash
npm ci          # install exact pinned deps
npm run dev     # dev server
npm run build   # production build
npm test        # unit tests
npm run validate:publication  # publication provenance check
```

The development server omits the production CSP so Vite can inject styles
and connect hot reload. Production builds and previews retain the strict
policy from `index.html`; do not use the development server for deployment.

Browser regression checks (run after `npm run build`):

```bash
npm exec -- playwright install chromium
npm exec -- playwright test e2e/smoke.spec.ts e2e/runtime.spec.ts
```

The runtime suite checks development styling, hot reload, mobile navigation,
and production restrictions on network connections and injected styles.

## Architecture

- **Semantic HTML first**: all content is usable without WebGL, smooth scroll, or JavaScript scene chunks.
- **Publication provenance**: strict evidence/claim/approval schema with prohibited-term scanning, claim hashing, and negative validation fixtures.
- **Progressive enhancement**: persistent R3F canvas, Lenis/GSAP smooth scroll, and magnetic cursor are opt-in enhancements gated by `prefers-reduced-motion` and WebGL capability.
- **Adaptive quality**: 2-second rolling FPS sampler degrades postprocessing quality when frame times exceed thresholds.
- **Code splitting**: initial shell ~68KB gzipped; scene vendors (240KB) and motion (50KB) are lazy-loaded.

## Publication identity

The personal agent harness case study uses a strict public identity contract:
- Public name: "personal agent harness"
- No source links, repository names, or commit identifiers are rendered
- Prohibited-term scanner catches variants in HTML, JSON, hrefs, and filenames

## Design document

See `docs/portfolio-design.md` for the full architecture, PR plan, and provenance matrix.

## License

© 2026 Kamal Pandey. All rights reserved.
