/**
 * Prohibited term, local path, and credential scanner.
 * Normalizes text to catch punctuation, case, and URL-encoding variants.
 */

/**
 * The prohibited upstream/product repository term.
 * Stored normalized; the scanner normalizes input the same way before matching.
 */
const PROHIBITED_TERMS_RAW = ["grok-build", "grok build", "grokbuild"];

/**
 * Normalize text: URL-decode, lowercase, strip all non-alphanumeric chars.
 * This makes "grok-build", "grok_build", "grok build", "Grok%20Build"
 * all collapse to the same canonical form "grokbuild".
 */
export function normalizeText(input: string): string {
  let text = input;
  try {
    text = decodeURIComponent(text);
  } catch {
    // already decoded or invalid encoding; use as-is
  }
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const PROHIBITED_NORMALIZED = PROHIBITED_TERMS_RAW.map(normalizeText);

/**
 * Patterns that indicate a local absolute path leaked into output.
 */
const LOCAL_PATH_PATTERNS = [
  /\/home\/[a-zA-Z0-9_-]+\//,
  /\/tmp\/[a-zA-Z0-9_-]+\//,
  /\/etc\/[a-zA-Z0-9_-]+\//,
  /\/var\/log\//,
  /\/usr\/local\/[a-zA-Z0-9_-]+\//,
  /\/root\//,
];

/**
 * Patterns that look like credentials or secrets.
 */
const CREDENTIAL_PATTERNS = [
  /(?:password|passwd|pwd)\s*[=:]\s*\S+/i,
  /(?:api[_-]?key|apikey)\s*[=:]\s*\S+/i,
  /(?:secret|token|access[_-]?key)\s*[=:]\s*\S+/i,
  /-----BEGIN\s+\w+\s+PRIVATE\s+KEY-----/,
  /gh[pousr]_[A-Za-z0-9]{36,}/,
  /sk-[A-Za-z0-9]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]+/,
];

export type ScanResult = {
  prohibitedTerms: string[];
  localPaths: string[];
  credentials: string[];
  clean: boolean;
};

/**
 * Scan arbitrary text for prohibited terms, local paths, and credentials.
 * Returns all findings; `clean` is true when nothing was found.
 */
export function scanText(text: string): ScanResult {
  const normalized = normalizeText(text);
  const prohibitedTerms: string[] = [];
  for (const term of PROHIBITED_NORMALIZED) {
    if (normalized.includes(term)) {
      const original = PROHIBITED_TERMS_RAW.find(
        (t) => normalizeText(t) === term,
      );
      prohibitedTerms.push(original ?? term);
    }
  }

  const localPaths = LOCAL_PATH_PATTERNS.filter((p) => p.test(text)).map(
    (p) => p.source,
  );

  const credentials = CREDENTIAL_PATTERNS.filter((p) => p.test(text)).map(
    (p) => p.source,
  );

  return {
    prohibitedTerms,
    localPaths,
    credentials,
    clean:
      prohibitedTerms.length === 0 &&
      localPaths.length === 0 &&
      credentials.length === 0,
  };
}

/**
 * Scan an HTML string, including anchor href values.
 * Extracts href attributes and scans them independently so that
 * a prohibited term hidden only in an href is caught.
 */
export function scanHtml(html: string): ScanResult {
  const fullScan = scanText(html);

  const hrefMatches = html.matchAll(/href\s*=\s*["']([^"']+)["']/gi);
  const hrefs: string[] = [];
  for (const match of hrefMatches) {
    hrefs.push(match[1]);
  }

  const hrefResults = hrefs.map(scanText);
  const prohibitedTerms = new Set(fullScan.prohibitedTerms);
  const localPaths = new Set(fullScan.localPaths);
  const credentials = new Set(fullScan.credentials);

  for (const r of hrefResults) {
    r.prohibitedTerms.forEach((t) => prohibitedTerms.add(t));
    r.localPaths.forEach((p) => localPaths.add(p));
    r.credentials.forEach((c) => credentials.add(c));
  }

  const result = {
    prohibitedTerms: [...prohibitedTerms],
    localPaths: [...localPaths],
    credentials: [...credentials],
    clean: false,
  };
  result.clean =
    result.prohibitedTerms.length === 0 &&
    result.localPaths.length === 0 &&
    result.credentials.length === 0;
  return result;
}
