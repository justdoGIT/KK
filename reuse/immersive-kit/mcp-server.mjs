#!/usr/bin/env node
import { createInterface } from "node:readline";
import {
  exportBundles,
  loadCatalog,
  planBundles,
  repositoryRoot,
  validateCatalog,
} from "./catalog.mjs";

const protocolVersion = "2025-06-18";
const tools = [
  {
    name: "list_immersive_bundles",
    title: "List immersive bundles",
    description: "Lists reusable scenes, motion systems, models, styles, and their dependencies.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "plan_immersive_bundle",
    title: "Plan immersive bundle",
    description: "Resolves bundle dependencies and returns every source, style, model, license, entrypoint, and peer dependency without writing files.",
    inputSchema: {
      type: "object",
      properties: {
        bundles: {
          type: "array",
          items: { type: "string" },
          description: "Bundle IDs. Empty or [\"all\"] selects the complete kit.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "export_immersive_bundle",
    title: "Export immersive bundle",
    description: "Copies a resolved bundle with repository-relative paths and writes a SHA-256 lock file. Existing files are protected unless overwrite is true.",
    inputSchema: {
      type: "object",
      required: ["outputDirectory"],
      properties: {
        outputDirectory: { type: "string", minLength: 1 },
        bundles: { type: "array", items: { type: "string" } },
        overwrite: { type: "boolean", default: false },
      },
      additionalProperties: false,
    },
  },
];

function write(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function result(id, value) {
  write({ jsonrpc: "2.0", id, result: value });
}

function failure(id, code, message) {
  write({ jsonrpc: "2.0", id, error: { code, message } });
}

function textContent(value) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

function stringArray(value, name) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`${name} must be an array of strings`);
  }
  return value;
}

async function callTool(name, args) {
  const catalog = await loadCatalog(repositoryRoot);
  if (name === "list_immersive_bundles") {
    const errors = await validateCatalog(catalog, repositoryRoot);
    if (errors.length > 0) throw new Error(errors.join("\n"));
    return textContent({
      name: catalog.name,
      bundles: catalog.bundles.map(({ id, title, description, requires }) => ({
        id,
        title,
        description,
        requires,
      })),
    });
  }
  if (name === "plan_immersive_bundle") {
    return textContent(await planBundles(
      catalog,
      stringArray(args.bundles, "bundles"),
      repositoryRoot,
    ));
  }
  if (name === "export_immersive_bundle") {
    if (typeof args.outputDirectory !== "string" || args.outputDirectory.length === 0) {
      throw new Error("outputDirectory must be a non-empty string");
    }
    if (args.overwrite !== undefined && typeof args.overwrite !== "boolean") {
      throw new Error("overwrite must be a boolean");
    }
    return textContent(await exportBundles(
      catalog,
      stringArray(args.bundles, "bundles"),
      args.outputDirectory,
      { root: repositoryRoot, overwrite: args.overwrite === true },
    ));
  }
  throw new Error(`unknown tool: ${name}`);
}

async function handle(request) {
  if (!request || request.jsonrpc !== "2.0" || typeof request.method !== "string") {
    failure(request?.id ?? null, -32600, "invalid JSON-RPC request");
    return;
  }
  if (request.method.startsWith("notifications/")) return;
  const id = request.id ?? null;
  if (request.method === "initialize") {
    result(id, {
      protocolVersion,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "immersive-kit", version: "1.0.0" },
      instructions: "List or plan before export. Preserve every returned license file and verify the copied scene in a real browser.",
    });
    return;
  }
  if (request.method === "ping") {
    result(id, {});
    return;
  }
  if (request.method === "tools/list") {
    result(id, { tools });
    return;
  }
  if (request.method === "tools/call") {
    const name = request.params?.name;
    const args = request.params?.arguments ?? {};
    if (typeof name !== "string" || typeof args !== "object" || Array.isArray(args)) {
      failure(id, -32602, "invalid tools/call parameters");
      return;
    }
    try {
      result(id, await callTool(name, args));
    } catch (error) {
      result(id, {
        content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
        isError: true,
      });
    }
    return;
  }
  failure(id, -32601, `method not found: ${request.method}`);
}

const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
let pending = Promise.resolve();
input.on("line", (line) => {
  if (!line.trim()) return;
  pending = pending.then(async () => {
    try {
      await handle(JSON.parse(line));
    } catch (error) {
      failure(null, -32700, error instanceof Error ? error.message : String(error));
    }
  });
});
input.on("close", () => {
  void pending.finally(() => process.stdout.end());
});
