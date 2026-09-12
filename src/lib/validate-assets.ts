import { scanText, type ScanResult } from "./prohibited-terms.ts";

export type AssetValidationResult = ScanResult & {
  errors: string[];
};

const EXTERNAL_REFERENCE = /(?:href|src)\s*=\s*["'](?:https?:|\/\/|data:)/i;
const SCRIPT_ELEMENT = /<script\b|javascript:/i;

/**
 * Validate a repository-controlled SVG before it enters the public build.
 * SVGs may contain only local geometry, text, and presentation attributes.
 */
export function validateSvgAsset(
  filename: string,
  content: string,
): AssetValidationResult {
  const scan = scanText(content);
  const errors: string[] = [];

  if (!/<svg\b[^>]*>/i.test(content)) {
    errors.push(`${filename}: missing root svg element`);
  }
  if (SCRIPT_ELEMENT.test(content)) {
    errors.push(`${filename}: script content is not allowed`);
  }
  if (EXTERNAL_REFERENCE.test(content)) {
    errors.push(`${filename}: external or data references are not allowed`);
  }

  return {
    ...scan,
    errors,
    clean: scan.clean && errors.length === 0,
  };
}
