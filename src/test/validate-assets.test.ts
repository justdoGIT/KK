import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { validateSvgAsset } from "../lib/validate-assets.ts";

const workspace = resolve(import.meta.dirname, "../..");
const publicDir = resolve(workspace, "public");
const distDir = resolve(workspace, "dist");

function readAsset(directory: string, name: string): string {
  return readFileSync(resolve(directory, name), "utf8");
}

describe("repository-controlled SVG assets", () => {
  it.each(["favicon.svg", "og-preview.svg"])(
    "validates the committed %s asset",
    (filename) => {
      const result = validateSvgAsset(filename, readAsset(publicDir, filename));
      expect(result.clean, result.errors.join("; ")).toBe(true);
      expect(result.prohibitedTerms).toEqual([]);
      expect(result.localPaths).toEqual([]);
      expect(result.credentials).toEqual([]);
    },
  );

  it("validates every generated SVG asset through the shipped validator", () => {
    const filenames = readdirSync(distDir).filter((filename) => filename.endsWith(".svg"));
    expect(filenames.length).toBeGreaterThan(0);
    for (const filename of filenames) {
      const result = validateSvgAsset(filename, readAsset(distDir, filename));
      expect(result.clean, `${filename}: ${result.errors.join("; ")}`).toBe(true);
    }
  });

  it.each([
    ["script element", '<svg><script>alert("x")</script></svg>', "executable script content is not allowed"],
    ["quoted external href", '<svg><image href="https://evil.example/x" /></svg>', "external or data references are not allowed"],
    ["unquoted external href", "<svg><image href=https://evil.example/x /></svg>", "external or data references are not allowed"],
    ["quoted data href", '<svg><image href="data:image/svg+xml;base64,abc" /></svg>', "external or data references are not allowed"],
    ["unquoted data href", "<svg><image href=data:image/svg+xml;base64,abc /></svg>", "external or data references are not allowed"],
    ["xlink external href", '<svg><image xlink:href="//evil.example/x" /></svg>', "external or data references are not allowed"],
    ["quoted event handler", '<svg onclick="fetch(\'https://evil.example\')"><circle /></svg>', "event-handler attributes are not allowed"],
    ["unquoted event handler", "<svg onclick=alert(1)><circle /></svg>", "event-handler attributes are not allowed"],
    ["CSS external url", "<svg><style>.node { fill: url(https://evil.example/pattern.svg); }</style></svg>", "external or data CSS references are not allowed"],
    ["CSS data url", "<svg><style>.node { fill: url(data:image/svg+xml,abc); }</style></svg>", "external or data CSS references are not allowed"],
    ["CSS import", '<svg><style>@import url("https://evil.example/theme.css");</style></svg>', "external or data CSS references are not allowed"],
  ])("rejects %s", (_label, svg, message) => {
    const result = validateSvgAsset("unsafe.svg", svg);
    expect(result.clean).toBe(false);
    expect(result.errors).toContain(`unsafe.svg: ${message}`);
  });

  it("allows local geometry, local fragment references, and presentation attributes", () => {
    const result = validateSvgAsset(
      "safe.svg",
      '<svg viewBox="0 0 10 10"><defs><linearGradient id="g" /></defs><rect fill="url(#g)" data-placeholder="safe" /><use href="#g" /></svg>',
    );
    expect(result.clean, result.errors.join("; ")).toBe(true);
  });
});
