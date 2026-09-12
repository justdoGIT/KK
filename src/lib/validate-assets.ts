import { scanText, type ScanResult } from "./prohibited-terms.ts";

export type AssetValidationResult = ScanResult & {
  errors: string[];
};

type Attribute = {
  name: string;
  value: string;
};

const EXTERNAL_SCHEME = /^(?:https?:|\/\/|data:)/i;
const SCRIPT_CONTENT = /<script\b|javascript:/i;
const EVENT_HANDLER_NAME = /^on[a-z][\w:-]*$/i;
const ATTRIBUTE_NAME = /[A-Za-z_:][\w:.-]*/y;
const ATTRIBUTE_VALUE = /(?:"([^"]*)"|'([^']*)'|([^\s>]+))/y;
const TAG = /<([A-Za-z][\w:.-]*)([^>]*)>/g;
const STYLE_BLOCK = /<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi;
const CSS_URL = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/gi;
const CSS_IMPORT = /@import\s+(?:url\(\s*)?(?:"([^"]*)"|'([^']*)'|([^\s;)]+))/gi;

function parseAttributes(raw: string): Attribute[] {
  const attributes: Attribute[] = [];
  let cursor = 0;

  while (cursor < raw.length) {
    while (/\s/.test(raw[cursor] ?? "")) cursor += 1;
    ATTRIBUTE_NAME.lastIndex = cursor;
    const nameMatch = ATTRIBUTE_NAME.exec(raw);
    if (!nameMatch) {
      cursor += 1;
      continue;
    }

    const name = nameMatch[0];
    cursor = ATTRIBUTE_NAME.lastIndex;
    while (/\s/.test(raw[cursor] ?? "")) cursor += 1;

    if (raw[cursor] !== "=") {
      attributes.push({ name, value: "" });
      // `cursor` already points at the first non-space character after the name.
      // Leave it there so the next loop parses that attribute in full.
      continue;
    }

    cursor += 1;
    while (/\s/.test(raw[cursor] ?? "")) cursor += 1;
    ATTRIBUTE_VALUE.lastIndex = cursor;
    const valueMatch = ATTRIBUTE_VALUE.exec(raw);
    if (!valueMatch) {
      attributes.push({ name, value: "" });
      continue;
    }

    attributes.push({
      name,
      value: valueMatch[1] ?? valueMatch[2] ?? valueMatch[3] ?? "",
    });
    cursor = ATTRIBUTE_VALUE.lastIndex;
  }

  return attributes;
}

function isExternalReference(name: string, value: string): boolean {
  return (
    /^(?:href|src|xlink:href)$/i.test(name) && EXTERNAL_SCHEME.test(value.trim())
  );
}

function hasExternalCssReference(style: string): boolean {
  CSS_URL.lastIndex = 0;
  for (const match of style.matchAll(CSS_URL)) {
    const value = match[1] ?? match[2] ?? match[3] ?? "";
    if (EXTERNAL_SCHEME.test(value.trim())) return true;
  }

  CSS_IMPORT.lastIndex = 0;
  for (const match of style.matchAll(CSS_IMPORT)) {
    const value = match[1] ?? match[2] ?? match[3] ?? "";
    if (EXTERNAL_SCHEME.test(value.trim())) return true;
  }

  return false;
}

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

  TAG.lastIndex = 0;
  for (const match of content.matchAll(TAG)) {
    const attributes = parseAttributes(match[2] ?? "");
    for (const attribute of attributes) {
      if (EVENT_HANDLER_NAME.test(attribute.name)) {
        errors.push(`${filename}: event-handler attributes are not allowed`);
        break;
      }
      if (isExternalReference(attribute.name, attribute.value)) {
        errors.push(`${filename}: external or data references are not allowed`);
        break;
      }
    }
  }

  STYLE_BLOCK.lastIndex = 0;
  for (const match of content.matchAll(STYLE_BLOCK)) {
    if (hasExternalCssReference(match[1] ?? "")) {
      errors.push(`${filename}: external or data CSS references are not allowed`);
      break;
    }
  }

  return {
    ...scan,
    errors: [...new Set(errors)],
    clean: scan.clean && errors.length === 0,
  };
}
