import { execFile, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const exec = promisify(execFile);
const root = resolve(import.meta.dirname, "../..");
const cli = resolve(root, "scripts/immersive-kit.mjs");
const mcp = resolve(root, "reuse/immersive-kit/mcp-server.mjs");
const plugin = resolve(root, "reuse/immersive-kit/vite-plugin.mjs");

async function runCli(...args: string[]): Promise<string> {
  const result = await exec(process.execPath, [cli, ...args], { cwd: root });
  return result.stdout.trim();
}

describe("immersive reuse kit", () => {
  it("validates every catalog path and plans transitive bundles", async () => {
    await expect(runCli("validate")).resolves.toContain("valid");

    const plan = JSON.parse(
      await runCli("plan", "--bundle", "astronaut-journey", "--json"),
    ) as { bundles: string[]; files: string[]; peerDependencies: Record<string, string> };

    expect(plan.bundles).toEqual([
      "rendering-core",
      "motion-core",
      "astronaut-journey",
    ]);
    expect(plan.files).toContain("src/scene/astronaut/JourneyCanvases.tsx");
    expect(plan.files).toContain("public/models/CREDITS.md");
    expect(plan.peerDependencies.three).toBe("0.186.0");
    expect(plan.files.every((file) => !file.includes(".."))).toBe(true);
  });

  it("exposes the catalog through the reusable Vite plugin", async () => {
    const code = [
      `import { immersiveKitPlugin } from ${JSON.stringify(plugin)};`,
      "const p = immersiveKitPlugin();",
      `await p.configResolved({ root: ${JSON.stringify(root)} });`,
      "const id = p.resolveId('virtual:immersive-kit/catalog');",
      "const source = await p.load(id);",
      "console.log(JSON.stringify({ id, source }));",
    ].join("\n");
    const result = await exec(process.execPath, ["--input-type=module", "-e", code]);
    const loaded = JSON.parse(result.stdout) as { id: string; source: string };

    expect(loaded.id).toBe("\0virtual:immersive-kit/catalog");
    expect(loaded.source).toContain("astronaut-journey");
  });

  it("publishes catalog and export tools over MCP stdio", () => {
    const input = [
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } } },
      { jsonrpc: "2.0", method: "notifications/initialized" },
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "plan_immersive_bundle", arguments: { bundles: ["silicon-fleet"] } } },
    ].map((message) => JSON.stringify(message)).join("\n") + "\n";
    const result = spawnSync(process.execPath, [mcp], {
      cwd: root,
      input,
      encoding: "utf8",
    });
    expect(result.status).toBe(0);
    const responses = result.stdout.trim().split("\n").map((line) => JSON.parse(line)) as Array<{ id: number; result: { tools?: Array<{ name: string }>; content?: Array<{ text: string }> } }>;
    const tools = responses.find((response) => response.id === 2)?.result.tools ?? [];
    const plan = responses.find((response) => response.id === 3)?.result.content?.[0]?.text ?? "";

    expect(tools.map((tool) => tool.name)).toEqual([
      "list_immersive_bundles",
      "plan_immersive_bundle",
      "export_immersive_bundle",
    ]);
    expect(plan).toContain("src/scene/journey/SiliconFleetCanvas.tsx");
  });
});
