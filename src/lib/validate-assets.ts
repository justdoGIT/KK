import { scanText, type ScanResult } from "./prohibited-terms.ts";

export type AssetValidationResult = ScanResult & {
  errors: string[];
};

const EXTERNAL_REFERENCE =
  /(?:href|src|xlink:href)\s*=\s*["'](?:https?:|\/\/|data:)/i;
const SCRIPT_CONTENT = /<script\b|javascript:/i;
const EVENT_HANDLER_ATTRIBUTE = /\bon[a-z][\w:-]*\s*=\s*["']/i;
const EXTERNAL_CSS_URL = /url\(\s*["']?(?:https?:|\/\/|data:)/i;
const CSS_IMPORT = /@import\s+(?:url\()?\s*["']?(?:https?:|\/\/|data:)/i;

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
  if (SCRIPT_CONTENT.test(content)) {
    errors.push(`${filename}: executable script content is not allowed`);
  }
  if (EVENT_HANDLER_ATTRIBUTE.test(content)) {
    errors.push(`${filename}: event-handler attributes are not allowed`);
  }
  if (EXTERNAL_REFERENCE.test(content)) {
    errors.push(`${filename}: external or data references are not allowed`);
  }
  if (EXTERNAL_CSS_URL.test(content) || CSS_IMPORT.test(content)) {
    errors.push(`${filename}: external or data CSS references are not allowed`);
  }

  return {
    ...scan,
    errors,
    clean: scan.clean && errors.length === 0,
  };
}
