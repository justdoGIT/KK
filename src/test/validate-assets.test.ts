import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateSvgAsset } from "../lib/validate-assets.ts";

const root = resolve(import.meta.dirname, "../..", "public");

function readAsset(name: string): string {
  return readFileSync(resolve(root, name), "utf8");
}

describe("repository-controlled SVG assets", () => {
  it.each(["favicon.svg", "og-preview.svg"])(
    "validates the shipped %s asset",
    (filename) => {
      const result = validateSvgAsset(filename, readAsset(filename));
      expect(result.clean, result.errors.join("; ")).toBe(true);
      expect(result.prohibitedTerms).toEqual([]);
      expect(result.localPaths).toEqual([]);
      expect(result.credentials).toEqual([]);
    },
  );

  it("rejects scripts in SVG assets", () => {
    const result = validateSvgAsset(
      "unsafe.svg",
      '<svg><script>alert("x")</script></svg>',
    );
    expect(result.clean).toBe(false);
    expect(result.errors).toContain("unsafe.svg: executable script content is not allowed");
  });

  it("rejects external and data references", () => {
    const result = validateSvgAsset(
      "unsafe.svg",
      '<svg><image href="https://example.com/image.png" /></svg>',
    );
    expect(result.clean).toBe(false);
    expect(result.errors).toContain(
      "unsafe.svg: external or data references are not allowed",
    );
  });

  it("rejects executable event-handler attributes", () => {
    const result = validateSvgAsset(
      "unsafe.svg",
      '<svg onclick="fetch(\'https://example.com\')"><circle /></svg>',
    );
    expect(result.clean).toBe(false);
    expect(result.errors).toContain(
      "unsafe.svg: event-handler attributes are not allowed",
    );
  });

  it("rejects external CSS url references and imports", () => {
    const urlResult = validateSvgAsset(
      "unsafe.svg",
      '<svg><style>.node { fill: url(https://example.com/pattern.svg); }</style></svg>',
    );
    expect(urlResult.clean).toBe(false);
    expect(urlResult.errors).toContain(
      "unsafe.svg: external or data CSS references are not allowed",
    );

    const importResult = validateSvgAsset(
      "unsafe.svg",
      '<svg><style>@import url("https://example.com/theme.css");</style></svg>',
    );
    expect(importResult.clean).toBe(false);
    expect(importResult.errors).toContain(
      "unsafe.svg: external or data CSS references are not allowed",
    );
  });
});
