# Immersive Kit

A catalog and export surface for the site's reusable React Three Fiber scenes,
procedural hardware, licensed models, scroll choreography, fallbacks, and agent
tooling. Source files remain single-source in `src/`; exports copy a validated,
transitive bundle instead of maintaining a second implementation.

## Inspect and export

```sh
node scripts/immersive-kit.mjs validate
node scripts/immersive-kit.mjs list
node scripts/immersive-kit.mjs plan --bundle astronaut-journey --json
node scripts/immersive-kit.mjs export \
  --bundle astronaut-journey \
  --bundle tooling \
  --out ../new-site/immersive-import
```

`export` preserves repository-relative paths and writes
`immersive-kit.lock.json`. The lock records selected bundles, entrypoints, exact
peer versions, and SHA-256 checksums. Existing files are never overwritten
unless `--force` is passed.

The consuming site can either keep the exported tree intact or migrate files
into its own source tree after imports resolve. Keep all exported license files
beside redistributed models.

## Vite plugin

```js
import { immersiveKitPlugin } from "./reuse/immersive-kit/vite-plugin.mjs";

export default {
  plugins: [immersiveKitPlugin()],
};
```

Application code can then load the data-only virtual module:

```js
import catalog, { bundles, peerDependencies } from "virtual:immersive-kit/catalog";
```

The plugin validates every dependency and file path during Vite configuration.
Invalid catalogs stop the build instead of creating a partial export.

## MCP server

Start the dependency-free stdio server:

```sh
node reuse/immersive-kit/mcp-server.mjs
```

It implements three tools:

- `list_immersive_bundles`
- `plan_immersive_bundle`
- `export_immersive_bundle`

Example client registration:

```json
{
  "command": "node",
  "args": ["/absolute/path/reuse/immersive-kit/mcp-server.mjs"]
}
```

Plan before export. An export is a filesystem mutation; clients should obtain
operator approval for the exact output directory and overwrite value.

## Agent skill

`skills/immersive-web/SKILL.md` captures rendering, motion, fallback, rig,
licensing, and browser-verification invariants. Copy the `tooling` bundle into a
new project so agents can reuse the same contract rather than reconstructing it
from scene code.
