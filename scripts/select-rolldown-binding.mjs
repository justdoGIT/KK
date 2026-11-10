import { appendFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

// Native Rolldown aborts with SIGILL on the Lenovo runner's pre-AVX2 CPU.
// Probe in a child so that unsupported instructions cannot terminate setup.
const probe = spawnSync(process.execPath, [
  "--input-type=module", "-e", "await import('rolldown')",
], { encoding: "utf8", timeout: 30_000 });

if (probe.status === 0) {
  console.log("Rolldown native binding is supported by this runner.");
} else if (probe.signal === "SIGILL") {
  if (!process.env.GITHUB_ENV) throw new Error("Workflow environment file is required for the portable binding.");
  const portable = spawnSync(process.execPath, [
    "--input-type=module", "-e", "await import('rolldown')",
  ], {
    encoding: "utf8", timeout: 30_000,
    env: { ...process.env, NAPI_RS_WASI_FLAVOR: "wasm32-wasi", NAPI_RS_ENFORCE_VERSION_CHECK: "1" },
  });
  if (portable.status !== 0) {
    process.stderr.write(portable.stderr || "Portable Rolldown probe failed.\n");
    process.exit(1);
  }
  appendFileSync(process.env.GITHUB_ENV, "NAPI_RS_WASI_FLAVOR=wasm32-wasi\n");
  console.log("Using portable Rolldown WASI binding on this runner.");
} else {
  process.stderr.write(probe.stderr || "Rolldown probe failed.\n");
  process.exit(1);
}
