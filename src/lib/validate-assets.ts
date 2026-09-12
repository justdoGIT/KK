import { scanText, type ScanResult } from "./prohibited-terms.ts";

export type AssetValidationResult = ScanResult & {
  errors: string[];
};

type Attribute = {
  name: string;
  value: string;
};

type ParsedTag = {
  name: string;
  attributes: Attribute[];
};

const EXTERNAL_SCHEME = /^(?:https?:|\/\/|data:)/i;
const SCRIPT_CONTENT = /<script\b|javascript:/i;
const NAME_START = /[A-Za-z_:]/;
const NAME_CHAR = /[A-Za-z0-9_.:-]/;
const CSS_URL = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/gi;
const CSS_IMPORT = /@import\s+(?:url\(\s*)?(?:"([^"]*)"|'([^']*)'|([^\s;)]+))/gi;

function skipWhitespace(value: string, cursor: number): number {
  while (/\s/.test(value[cursor] ?? "")) cursor += 1;
  return cursor;
}

function readName(value: string, cursor: number): { name: string; cursor: number } | null {
  if (!NAME_START.test(value[cursor] ?? "")) return null;
  const start = cursor;
  cursor += 1;
  while (NAME_CHAR.test(value[cursor] ?? "")) cursor += 1;
  return { name: value.slice(start, cursor), cursor };
}

function parseAttributeValue(
  value: string,
  cursor: number,
): { value: string; cursor: number; malformed: boolean } {
  const quote = value[cursor];
  if (quote === "\"" || quote === "'") {
    const start = cursor + 1;
    const end = value.indexOf(quote, start);
    if (end < 0) return { value: value.slice(start), cursor: value.length, malformed: true };
    return { value: value.slice(start, end), cursor: end + 1, malformed: false };
  }

  const start = cursor;
  while (cursor < value.length && !/\s/.test(value[cursor] ?? "")) cursor += 1;
  return { value: value.slice(start, cursor), cursor, malformed: false };
}

function parseAttributes(raw: string): { attributes: Attribute[]; malformed: boolean } {
  const attributes: Attribute[] = [];
  let cursor = 0;
  let malformed = false;

  while (cursor < raw.length) {
    cursor = skipWhitespace(raw, cursor);
    if (cursor >= raw.length || raw[cursor] === "/") break;

    const nameResult = readName(raw, cursor);
    if (!nameResult) {
      malformed = true;
      cursor += 1;
      continue;
    }

    const name = nameResult.name;
    cursor = skipWhitespace(raw, nameResult.cursor);
    if (raw[cursor] !== "=") {
      attributes.push({ name, value: "" });
      continue;
    }

    cursor = skipWhitespace(raw, cursor + 1);
    const valueResult = parseAttributeValue(raw, cursor);
    attributes.push({ name, value: valueResult.value });
    malformed ||= valueResult.malformed;
    cursor = Math.max(valueResult.cursor, cursor + 1);
  }

  return { attributes, malformed };
}

function findTagEnd(content: string, start: number): number {
  let quote = "";
  for (let cursor = start; cursor < content.length; cursor += 1) {
    const character = content[cursor];
    if (quote) {
      if (character === quote) quote = "";
    } else if (character === "\"" || character === "'") {
      quote = character;
    } else if (character === ">") {
      return cursor;
    }
  }
  return -1;
}

function scanTags(content: string): {
  tags: ParsedTag[];
  styleBlocks: string[];
  malformed: boolean;
} {
  const tags: ParsedTag[] = [];
  const styleBlocks: string[] = [];
  let malformed = false;
  let cursor = 0;

  while (cursor < content.length) {
    const open = content.indexOf("<", cursor);
    if (open < 0) break;
    const end = findTagEnd(content, open + 1);
    if (end < 0) {
      malformed = true;
      break;
    }

    const body = content.slice(open + 1, end);
    if (body.startsWith("/") || body.startsWith("!") || body.startsWith("?")) {
      cursor = end + 1;
      continue;
    }

    const nameResult = readName(body, 0);
    if (!nameResult) {
      malformed = true;
      cursor = end + 1;
      continue;
    }

    const parsed = parseAttributes(body.slice(nameResult.cursor));
    malformed ||= parsed.malformed;
    tags.push({ name: nameResult.name, attributes: parsed.attributes });
    cursor = end + 1;

    if (nameResult.name.toLowerCase() === "style") {
      const closingStart = content.toLowerCase().indexOf("</style", cursor);
      if (closingStart < 0) {
        malformed = true;
        break;
      }
      styleBlocks.push(content.slice(cursor, closingStart));
      const closingEnd = findTagEnd(content, closingStart + 2);
      if (closingEnd < 0) {
        malformed = true;
        break;
      }
      cursor = closingEnd + 1;
    }
  }

  return { tags, styleBlocks, malformed };
}

function isExternalReference(name: string, value: string): boolean {
  return /^(?:href|src|xlink:href)$/i.test(name) && EXTERNAL_SCHEME.test(value.trim());
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
  const structure = scanTags(content);

  if (!/<svg\b[^>]*>/i.test(content)) {
    errors.push(`${filename}: missing root svg element`);
  }
  if (SCRIPT_CONTENT.test(content)) {
    errors.push(`${filename}: executable script content is not allowed`);
  }
  if (structure.malformed) {
    errors.push(`${filename}: malformed SVG markup is not allowed`);
  }

  for (const tag of structure.tags) {
    for (const attribute of tag.attributes) {
      if (/^on[a-z][\w:-]*$/i.test(attribute.name)) {
        errors.push(`${filename}: event-handler attributes are not allowed`);
      }
      if (isExternalReference(attribute.name, attribute.value)) {
        errors.push(`${filename}: external or data references are not allowed`);
      }
      if (attribute.name.toLowerCase() === "style" && hasExternalCssReference(attribute.value)) {
        errors.push(`${filename}: external or data CSS references are not allowed`);
      }
    }
  }

  for (const styleBlock of structure.styleBlocks) {
    if (hasExternalCssReference(styleBlock)) {
      errors.push(`${filename}: external or data CSS references are not allowed`);
    }
  }

  return {
    ...scan,
    errors: [...new Set(errors)],
    clean: scan.clean && errors.length === 0,
  };
}
