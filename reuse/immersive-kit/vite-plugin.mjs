import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { validateCatalog } from "./catalog.mjs";

export const immersiveCatalogId = "virtual:immersive-kit/catalog";
const resolvedCatalogId = `\0${immersiveCatalogId}`;

/**
 * Exposes the validated reuse catalog as `virtual:immersive-kit/catalog`.
 * The catalog remains data-only, so applications can build pickers, preload
 * screens, and attribution panels without bundling Node filesystem code.
 */
export function immersiveKitPlugin(options = {}) {
  let root = process.cwd();
  let catalog = null;

  return {
    name: "immersive-kit-catalog",
    async configResolved(config) {
      root = config.root;
      const configured = options.catalogPath ?? "reuse/immersive-kit/catalog.json";
      const path = isAbsolute(configured) ? configured : resolve(root, configured);
      catalog = JSON.parse(await readFile(path, "utf8"));
      const errors = await validateCatalog(catalog, root);
      if (errors.length > 0) {
        throw new Error(`Invalid immersive catalog:\n${errors.join("\n")}`);
      }
    },
    resolveId(id) {
      return id === immersiveCatalogId ? resolvedCatalogId : undefined;
    },
    load(id) {
      if (id !== resolvedCatalogId) return undefined;
      if (!catalog) throw new Error("immersive catalog loaded before Vite config resolved");
      const serialized = JSON.stringify(catalog);
      return [
        `const catalog = ${serialized};`,
        "export const bundles = catalog.bundles;",
        "export const peerDependencies = catalog.peerDependencies;",
        "export default catalog;",
      ].join("\n");
    },
  };
}
