import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

const dist = resolve(process.argv[2] ?? "dist");
const manifest = JSON.parse(readFileSync(resolve(dist, ".vite/manifest.json"), "utf8"));

function graph(keys, files = new Set()) {
  for (const key of keys) {
    const chunk = manifest[key];
    if (!chunk) throw new Error(`Missing manifest entry: ${key}`);
    if (files.has(chunk.file)) continue;
    files.add(chunk.file);
    graph(chunk.imports ?? [], files);
  }
  return files;
}

let failed = false;
function check(label, files, budget) {
  const bytes = [...files].reduce((sum, file) =>
    sum + gzipSync(readFileSync(resolve(dist, file))).length, 0);
  console.log(`${label}: ${(bytes / 1024).toFixed(1)} KiB gzip / ${budget} KiB`);
  if (bytes > budget * 1024) failed = true;
}

const entries = Object.entries(manifest);
const shells = entries.filter(([, chunk]) => chunk.isEntry).map(([key]) => key);
const scenes = entries.filter(([key, chunk]) => chunk.isDynamicEntry && key.startsWith("src/scene/"));
const motion = entries.filter(([key]) => key.includes("lenis")).map(([key]) => key);
if (!shells.length || !scenes.length || !motion.length) {
  throw new Error("Missing shell, scene, or motion chunks; cannot verify bundle budgets");
}

const initial = graph(shells);
check("Initial JavaScript", initial, 150);
for (const [key] of scenes) {
  // Measure each lazy scene and its shared dependencies beyond the initial shell.
  const files = new Set([...graph([key])].filter(file => !initial.has(file)));
  check(key, files, 350);
}
check("Motion JavaScript", new Set([...graph(motion)].filter(file => !initial.has(file))), 80);
if (failed) process.exitCode = 1;
