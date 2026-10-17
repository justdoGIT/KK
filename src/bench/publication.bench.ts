import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { test } from "vitest";
import type {
  EvidenceManifest,
  PublicRegistry,
  PublicationRecord,
} from "../content/schema.ts";
import { normalizeText, scanHtml, scanText } from "../lib/prohibited-terms.ts";
import { validateSvgAsset } from "../lib/validate-assets.ts";
import { validateManifest } from "../lib/validate-manifest.ts";
import {
  validateAllRecords,
  validatePublicationRecord,
} from "../lib/validate-publication.ts";

// Benchmarks run against the repository's real publication data so results
// track the cost of `npm run validate:publication` on actual content.
const root = resolve(import.meta.dirname, "..", "..");

function loadJson<T>(...parts: string[]): T {
  return JSON.parse(readFileSync(join(root, ...parts), "utf-8")) as T;
}

const manifest = loadJson<EvidenceManifest>("evidence", "manifest.v1.json");
const registry = loadJson<PublicRegistry>("src", "content", "registry.json");
const recordsDir = join(root, "publication-records");
const records = readdirSync(recordsDir)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => loadJson<PublicationRecord>("publication-records", f));

const recordsText = records.map((r) => JSON.stringify(r)).join("\n");
const indexHtml = readFileSync(join(root, "index.html"), "utf-8");
const faviconSvg = readFileSync(join(root, "public", "favicon.svg"), "utf-8");
const ogPreviewSvg = readFileSync(
  join(root, "public", "og-preview.svg"),
  "utf-8",
);

test("prohibited-terms", async ({ bench }) => {
  await bench.compare(
    bench("normalizeText on publication records", () => {
      normalizeText(recordsText);
    }),
    bench("scanText on publication records", () => {
      scanText(recordsText);
    }),
    bench("scanHtml on index.html", () => {
      scanHtml(indexHtml);
    }),
  );
});

test("validate-assets", async ({ bench }) => {
  await bench.compare(
    bench("validateSvgAsset favicon.svg", () => {
      validateSvgAsset("favicon.svg", faviconSvg);
    }),
    bench("validateSvgAsset og-preview.svg", () => {
      validateSvgAsset("og-preview.svg", ogPreviewSvg);
    }),
  );
});

test("validate-publication", async ({ bench }) => {
  await bench.compare(
    bench("validateManifest against registry", () => {
      validateManifest(manifest, registry);
    }),
    bench("validatePublicationRecord single record", () => {
      validatePublicationRecord(records[0], manifest);
    }),
    bench("validateAllRecords", () => {
      validateAllRecords(records, manifest);
    }),
  );
});
