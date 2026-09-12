#!/usr/bin/env node
/**
 * validate-publication.mjs — CLI entry point for publication validation.
 * Loads manifest, registry, and publication records; runs all validators;
 * scans generated dist/ output. Exits non-zero on any failure.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

const root = resolve(import.meta.dirname, "..");

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

const manifest = loadJson(join(root, "evidence", "manifest.v1.json"));
const registry = loadJson(join(root, "src", "content", "registry.json"));

const recordsDir = join(root, "publication-records");
const records = existsSync(recordsDir)
  ? readdirSync(recordsDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => loadJson(join(recordsDir, f)))
  : [];

let exitCode = 0;

// 1. Validate manifest against registry
const { validateManifest } = await import(
  "../src/lib/validate-manifest.ts"
);
const manifestResult = validateManifest(manifest, registry);
if (!manifestResult.valid) {
  console.error("FAIL: manifest validation");
  for (const e of manifestResult.errors) {
    console.error(`  [${e.code}] ${e.message}`);
  }
  exitCode = 1;
} else {
  console.log("PASS: manifest validation");
}

// 2. Validate publication records
const { validateAllRecords } = await import(
  "../src/lib/validate-publication.ts"
);
const recordsResult = validateAllRecords(records, manifest);

const renderableErrors = recordsResult.errors.filter(
  (e) => e.code !== "RECORD_OMITTED",
);
const omittedCount = recordsResult.errors.filter(
  (e) => e.code === "RECORD_OMITTED",
).length;

if (renderableErrors.length > 0) {
  console.error("FAIL: publication record validation");
  for (const e of renderableErrors) {
    console.error(`  [${e.code}] ${e.message}`);
  }
  exitCode = 1;
} else {
  console.log("PASS: publication record validation");
}
if (omittedCount > 0) {
  console.log(`  (${omittedCount} record(s) omitted — study removed)`);
}

// 3. Scan dist/ output if it exists
const distDir = join(root, "dist");
if (existsSync(distDir)) {
  const { scanHtml, scanText } = await import(
    "../src/lib/prohibited-terms.ts"
  );
  const files = readdirSync(distDir, { recursive: true })
    .filter((f) => /\.(html|json|txt|svg)$/i.test(f));
  let distClean = true;
  for (const file of files) {
    const content = readFileSync(join(distDir, file), "utf-8");
    const result = file.endsWith(".html")
      ? scanHtml(content)
      : scanText(content);
    if (!result.clean) {
      console.error(`FAIL: prohibited content in dist/${file}`);
      console.error(`  ${JSON.stringify(result)}`);
      distClean = false;
      exitCode = 1;
    }
  }
  if (distClean) {
    console.log("PASS: dist output scan");
  }
} else {
  console.log("SKIP: dist output scan (no dist/)");
}

if (exitCode === 0) {
  console.log("\nAll publication checks passed.");
} else {
  console.error("\nPublication validation FAILED.");
}
process.exit(exitCode);
