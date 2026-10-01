import { createHash } from "node:crypto";
import {
  access,
  chmod,
  copyFile,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const catalogRelativePath = "reuse/immersive-kit/catalog.json";

function toPosix(path) {
  return path.split(sep).join("/");
}

function safePath(root, path) {
  if (isAbsolute(path)) throw new Error(`catalog path must be relative: ${path}`);
  const absolute = resolve(root, path);
  const fromRoot = relative(root, absolute);
  if (fromRoot === "" || fromRoot.startsWith(`..${sep}`) || fromRoot === "..") {
    throw new Error(`catalog path escapes repository: ${path}`);
  }
  return absolute;
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function walk(root, path) {
  const absolute = safePath(root, path);
  const info = await stat(absolute);
  if (info.isFile()) return [toPosix(relative(root, absolute))];
  if (!info.isDirectory()) throw new Error(`unsupported catalog entry: ${path}`);

  const files = [];
  const entries = await readdir(absolute, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const child = resolve(absolute, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(root, toPosix(relative(root, child))));
    } else if (entry.isFile()) {
      files.push(toPosix(relative(root, child)));
    } else {
      throw new Error(`symlinks are not exportable: ${relative(root, child)}`);
    }
  }
  return files;
}

function bundleMap(catalog) {
  return new Map(catalog.bundles.map((bundle) => [bundle.id, bundle]));
}

export async function loadCatalog(root = repositoryRoot) {
  return JSON.parse(await readFile(resolve(root, catalogRelativePath), "utf8"));
}

export function resolveBundleIds(catalog, requested) {
  const byId = bundleMap(catalog);
  const roots = requested.length === 0 || requested.includes("all")
    ? catalog.bundles.map((bundle) => bundle.id)
    : requested;
  const visiting = new Set();
  const included = new Set();
  const ordered = [];

  const visit = (id) => {
    if (included.has(id)) return;
    if (visiting.has(id)) throw new Error(`bundle dependency cycle at ${id}`);
    const bundle = byId.get(id);
    if (!bundle) throw new Error(`unknown bundle: ${id}`);
    visiting.add(id);
    bundle.requires.forEach(visit);
    visiting.delete(id);
    included.add(id);
    ordered.push(id);
  };

  roots.forEach(visit);
  return ordered;
}

export async function validateCatalog(catalog, root = repositoryRoot) {
  const errors = [];
  if (catalog.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!Array.isArray(catalog.bundles) || catalog.bundles.length === 0) {
    errors.push("bundles must be a non-empty array");
    return errors;
  }

  const ids = new Set();
  for (const bundle of catalog.bundles) {
    if (!bundle.id || ids.has(bundle.id)) errors.push(`duplicate or empty bundle id: ${bundle.id}`);
    ids.add(bundle.id);
  }

  for (const bundle of catalog.bundles) {
    for (const dependency of bundle.requires) {
      if (!ids.has(dependency)) errors.push(`${bundle.id} requires unknown bundle ${dependency}`);
    }
    const paths = [
      ...bundle.entrypoints,
      ...bundle.sourcePaths,
      ...bundle.stylePaths,
      ...bundle.assetPaths,
      ...bundle.licensePaths,
    ];
    for (const path of paths) {
      try {
        const absolute = safePath(root, path);
        if (!await pathExists(absolute)) errors.push(`${bundle.id} path does not exist: ${path}`);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
    if (bundle.assetPaths.some((path) => path.endsWith(".glb") || path.includes("models/")) && bundle.licensePaths.length === 0) {
      errors.push(`${bundle.id} exports models without licensePaths`);
    }
  }

  try {
    resolveBundleIds(catalog, ["all"]);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  return errors;
}

export async function planBundles(catalog, requested, root = repositoryRoot) {
  const errors = await validateCatalog(catalog, root);
  if (errors.length > 0) throw new Error(errors.join("\n"));

  const byId = bundleMap(catalog);
  const bundles = resolveBundleIds(catalog, requested);
  const paths = new Set();
  const entrypoints = [];
  for (const id of bundles) {
    const bundle = byId.get(id);
    for (const entrypoint of bundle.entrypoints) {
      if (!entrypoints.includes(entrypoint)) entrypoints.push(entrypoint);
    }
    for (const path of [
      ...bundle.sourcePaths,
      ...bundle.stylePaths,
      ...bundle.assetPaths,
      ...bundle.licensePaths,
    ]) {
      for (const file of await walk(root, path)) paths.add(file);
    }
  }

  return {
    catalog: catalog.name,
    schemaVersion: catalog.schemaVersion,
    bundles,
    entrypoints,
    files: [...paths].sort(),
    peerDependencies: catalog.peerDependencies,
  };
}

async function digest(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

export async function exportBundles(catalog, requested, outputDirectory, options = {}) {
  const root = options.root ?? repositoryRoot;
  const output = resolve(root, outputDirectory);
  const outputFromRoot = relative(root, output);
  if (output === root || root.startsWith(`${output}${sep}`)) {
    throw new Error("output directory cannot be the repository or its ancestor");
  }

  const plan = await planBundles(catalog, requested, root);
  const records = [];
  await mkdir(output, { recursive: true });
  for (const file of plan.files) {
    const source = safePath(root, file);
    const target = resolve(output, file);
    if (!options.overwrite && await pathExists(target)) {
      throw new Error(`refusing to overwrite ${target}; pass --force to replace files`);
    }
    await mkdir(dirname(target), { recursive: true });
    await copyFile(source, target);
    const sourceMode = (await stat(source)).mode & 0o777;
    await chmod(target, sourceMode);
    records.push({ path: file, sha256: await digest(source) });
  }

  const lock = {
    catalog: plan.catalog,
    schemaVersion: plan.schemaVersion,
    bundles: plan.bundles,
    entrypoints: plan.entrypoints,
    peerDependencies: plan.peerDependencies,
    files: records,
  };
  await writeFile(resolve(output, "immersive-kit.lock.json"), `${JSON.stringify(lock, null, 2)}\n`);
  return { output: toPosix(outputFromRoot || "."), ...lock };
}
