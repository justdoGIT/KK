#!/usr/bin/env node
import {
  exportBundles,
  loadCatalog,
  planBundles,
  repositoryRoot,
  validateCatalog,
} from "../reuse/immersive-kit/catalog.mjs";

function usage() {
  return `Usage:
  node scripts/immersive-kit.mjs list [--json]
  node scripts/immersive-kit.mjs validate
  node scripts/immersive-kit.mjs plan [--bundle ID[,ID...]] [--json]
  node scripts/immersive-kit.mjs export --out DIRECTORY [--bundle ID[,ID...]] [--force]

Bundle ID defaults to all. Export preserves repository-relative paths and writes
immersive-kit.lock.json with SHA-256 checksums and peer dependencies.`;
}

function parseArgs(argv) {
  const options = { command: argv[0] ?? "help", bundles: [], json: false, force: false, out: null };
  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") options.json = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--bundle") {
      const value = argv[index + 1];
      if (!value) throw new Error("--bundle requires a value");
      options.bundles.push(...value.split(",").filter(Boolean));
      index += 1;
    } else if (arg === "--out") {
      options.out = argv[index + 1] ?? null;
      if (!options.out) throw new Error("--out requires a directory");
      index += 1;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return options;
}

function printList(catalog, json) {
  const bundles = catalog.bundles.map(({ id, title, description, requires }) => ({
    id,
    title,
    description,
    requires,
  }));
  if (json) {
    console.log(JSON.stringify({ name: catalog.name, bundles }, null, 2));
    return;
  }
  for (const bundle of bundles) {
    const dependencies = bundle.requires.length > 0 ? ` (requires: ${bundle.requires.join(", ")})` : "";
    console.log(`${bundle.id}${dependencies}\n  ${bundle.title}: ${bundle.description}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.command === "help" || options.command === "--help" || options.command === "-h") {
    console.log(usage());
    return;
  }

  const catalog = await loadCatalog(repositoryRoot);
  if (options.command === "list") {
    printList(catalog, options.json);
    return;
  }
  if (options.command === "validate") {
    const errors = await validateCatalog(catalog, repositoryRoot);
    if (errors.length > 0) throw new Error(errors.join("\n"));
    console.log(`Immersive catalog valid: ${catalog.bundles.length} bundles.`);
    return;
  }
  if (options.command === "plan") {
    const plan = await planBundles(catalog, options.bundles, repositoryRoot);
    if (options.json) console.log(JSON.stringify(plan, null, 2));
    else {
      console.log(`Bundles: ${plan.bundles.join(", ")}`);
      console.log(`Files: ${plan.files.length}`);
      console.log(`Entrypoints:\n${plan.entrypoints.map((path) => `  ${path}`).join("\n")}`);
    }
    return;
  }
  if (options.command === "export") {
    if (!options.out) throw new Error("export requires --out DIRECTORY");
    const result = await exportBundles(catalog, options.bundles, options.out, {
      root: repositoryRoot,
      overwrite: options.force,
    });
    console.log(`Exported ${result.files.length} files to ${result.output}.`);
    return;
  }
  throw new Error(`unknown command: ${options.command}\n\n${usage()}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
