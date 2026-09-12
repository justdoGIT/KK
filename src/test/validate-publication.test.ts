import { describe, it, expect } from "vitest";
import { normalizeText, scanText, scanHtml } from "../lib/prohibited-terms.ts";
import { validateManifest } from "../lib/validate-manifest.ts";
import { validatePublicationRecord } from "../lib/validate-publication.ts";
import type {
  EvidenceManifest,
  PublicRegistry,
  PublicationRecord,
} from "../content/schema.ts";
import { createHash } from "node:crypto";

function hash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

const validRegistry: PublicRegistry = {
  registryVersion: 1,
  entries: [
    {
      evidenceId: "test-001",
      publicIdentity: "Test study",
      approvedClaimText: "A valid approved claim.",
      publicationState: "approved",
    },
  ],
};

const validManifest: EvidenceManifest = {
  manifestVersion: 1,
  registryVersion: 1,
  entries: [
    {
      evidenceId: "test-001",
      sourceKind: "local-history",
      claimHash: hash("A valid approved claim."),
      approvalState: "approved",
      publicationState: "approved",
      approvedOn: "2026-09-12",
      reviewedOn: "2026-09-12",
      links: [],
    },
  ],
};

const validRecord: PublicationRecord = {
  slug: "test-study",
  publicTitle: "Test study",
  approvedClaims: [
    {
      text: "A valid approved claim.",
      evidenceIds: ["test-001"],
      publicationStatus: "approved",
      metricLabel: "not-a-metric",
    },
  ],
  excludedClaims: [],
  approvedCommitOrTag: null,
  clientApproval: { status: "approved", recordId: "rec-001" },
  publicationApproval: {
    owner: "owner",
    date: "2026-09-12",
    status: "approved",
  },
  redactionReview: {
    reviewer: "reviewer",
    date: "2026-09-12",
    status: "passed",
  },
  links: [],
};

describe("normalizeText", () => {
  it("lowercases and strips non-alphanumeric", () => {
    expect(normalizeText("Grok-Build")).toBe("grokbuild");
    expect(normalizeText("grok_build")).toBe("grokbuild");
    expect(normalizeText("grok build")).toBe("grokbuild");
    expect(normalizeText("GROK%2DBUILD")).toBe("grokbuild");
  });

  it("preserves alphanumeric content", () => {
    expect(normalizeText("Personal agent harness")).toBe(
      "personalagentharness",
    );
  });
});

describe("scanText", () => {
  it("catches prohibited repository name", () => {
    const result = scanText("Built with grok-build framework");
    expect(result.prohibitedTerms).toContain("grok-build");
    expect(result.clean).toBe(false);
  });

  it("catches prohibited term with different casing", () => {
    const result = scanText("Powered by Grok Build");
    expect(result.prohibitedTerms.length).toBeGreaterThan(0);
    expect(result.clean).toBe(false);
  });

  it("catches local path", () => {
    const result = scanText("Source: /home/miniblues/project/");
    expect(result.localPaths.length).toBeGreaterThan(0);
    expect(result.clean).toBe(false);
  });

  it("catches credential-like string", () => {
    const result = scanText("api_key=sk-1234567890abcdefghij");
    expect(result.credentials.length).toBeGreaterThan(0);
    expect(result.clean).toBe(false);
  });

  it("passes clean text", () => {
    const result = scanText("Personal agent harness with TUI and headless mode");
    expect(result.clean).toBe(true);
  });
});

describe("scanHtml", () => {
  it("catches prohibited term in href only", () => {
    const html = '<a href="https://example.com/grok-build">Link</a>';
    const result = scanHtml(html);
    expect(result.prohibitedTerms.length).toBeGreaterThan(0);
    expect(result.clean).toBe(false);
  });

  it("catches prohibited term in visible text", () => {
    const html = "<p>Uses grok-build for automation</p>";
    const result = scanHtml(html);
    expect(result.prohibitedTerms.length).toBeGreaterThan(0);
    expect(result.clean).toBe(false);
  });

  it("passes clean HTML", () => {
    const html = '<a href="https://example.com">Example</a>';
    const result = scanHtml(html);
    expect(result.clean).toBe(true);
  });
});

describe("validateManifest", () => {
  it("passes valid manifest", () => {
    const result = validateManifest(validManifest, validRegistry);
    expect(result.valid).toBe(true);
  });

  it("fails on registry-version mismatch", () => {
    const mismatched = {
      ...validManifest,
      registryVersion: 2,
    };
    const result = validateManifest(mismatched, validRegistry);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "VERSION_MISMATCH")).toBe(true);
  });

  it("fails on claim-hash mismatch", () => {
    const badHash = {
      ...validManifest,
      entries: [
        {
          ...validManifest.entries[0],
          claimHash: "0".repeat(64),
        },
      ],
    };
    const result = validateManifest(badHash, validRegistry);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "CLAIM_HASH_MISMATCH")).toBe(true);
  });

  it("fails on unknown evidence ID in manifest", () => {
    const unknown = {
      ...validManifest,
      entries: [
        ...validManifest.entries,
        {
          evidenceId: "unknown-id",
          sourceKind: "local-history" as const,
          claimHash: hash("x"),
          approvalState: "approved" as const,
          publicationState: "approved" as const,
          approvedOn: "2026-09-12",
          reviewedOn: "2026-09-12",
          links: [],
        },
      ],
    };
    const result = validateManifest(unknown, validRegistry);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "UNKNOWN_EVIDENCE_ID")).toBe(true);
  });

  it("fails on pending approval", () => {
    const pending = {
      ...validManifest,
      entries: [
        {
          ...validManifest.entries[0],
          approvalState: "pending" as const,
        },
      ],
    };
    const result = validateManifest(pending, validRegistry);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "APPROVAL_PENDING")).toBe(true);
  });

  it("fails on prohibited term in manifest entry", () => {
    const prohibited = {
      ...validManifest,
      entries: [
        {
          ...validManifest.entries[0],
          evidenceId: "grok-build-001",
        },
      ],
    };
    const prohibitedRegistry = {
      ...validRegistry,
      entries: [
        {
          ...validRegistry.entries[0],
          evidenceId: "grok-build-001",
        },
      ],
    };
    const result = validateManifest(prohibited, prohibitedRegistry);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "PROHIBITED_CONTENT")).toBe(true);
  });

  it("fails on claim-only entry with links", () => {
    const withLinks = {
      ...validManifest,
      entries: [
        {
          ...validManifest.entries[0],
          publicationState: "claim-only" as const,
          links: [
            {
              label: "Source",
              url: "https://example.com",
              finalUrl: "https://example.com",
              verifiedOn: "2026-09-12",
            },
          ],
        },
      ],
    };
    const result = validateManifest(withLinks, validRegistry);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.code === "CLAIM_ONLY_HAS_LINKS"),
    ).toBe(true);
  });
});

describe("validatePublicationRecord", () => {
  it("passes valid record", () => {
    const result = validatePublicationRecord(validRecord, validManifest);
    expect(result.valid).toBe(true);
  });

  it("fails on omitted record", () => {
    const omitted = {
      ...validRecord,
      publicationApproval: {
        ...validRecord.publicationApproval,
        status: "omitted" as const,
      },
    };
    const result = validatePublicationRecord(omitted, validManifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "RECORD_OMITTED")).toBe(true);
  });

  it("fails on pending client approval", () => {
    const pending = {
      ...validRecord,
      clientApproval: {
        ...validRecord.clientApproval,
        status: "pending" as const,
      },
    };
    const result = validatePublicationRecord(pending, validManifest);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.code === "CLIENT_APPROVAL_PENDING"),
    ).toBe(true);
  });

  it("fails on unknown evidence ID in claim", () => {
    const unknownEv = {
      ...validRecord,
      approvedClaims: [
        {
          ...validRecord.approvedClaims[0],
          evidenceIds: ["nonexistent-id"],
        },
      ],
    };
    const result = validatePublicationRecord(unknownEv, validManifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "UNKNOWN_EVIDENCE")).toBe(true);
  });

  it("fails on claim with no evidence", () => {
    const noEv = {
      ...validRecord,
      approvedClaims: [
        {
          ...validRecord.approvedClaims[0],
          evidenceIds: [],
        },
      ],
    };
    const result = validatePublicationRecord(noEv, validManifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "NO_EVIDENCE")).toBe(true);
  });

  it("fails on prohibited term in claim text", () => {
    const prohibited = {
      ...validRecord,
      approvedClaims: [
        {
          ...validRecord.approvedClaims[0],
          text: "Built with grok-build framework",
        },
      ],
    };
    const result = validatePublicationRecord(prohibited, validManifest);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.code === "PROHIBITED_CONTENT"),
    ).toBe(true);
  });

  it("fails on incomplete link", () => {
    const badLink = {
      ...validRecord,
      links: [
        {
          label: "Source",
          url: "https://example.com",
          finalUrl: "",
          verifiedOn: "",
        },
      ],
    };
    const result = validatePublicationRecord(badLink, validManifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "INCOMPLETE_LINK")).toBe(true);
  });

  it("fails on prohibited term in link URL", () => {
    const badLink = {
      ...validRecord,
      links: [
        {
          label: "Source",
          url: "https://example.com/grok-build",
          finalUrl: "https://example.com/grok-build",
          verifiedOn: "2026-09-12",
        },
      ],
    };
    const result = validatePublicationRecord(badLink, validManifest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "PROHIBITED_LINK")).toBe(true);
  });

  it("fails on failed redaction review", () => {
    const failedRedaction = {
      ...validRecord,
      redactionReview: {
        ...validRecord.redactionReview,
        status: "failed" as const,
      },
    };
    const result = validatePublicationRecord(
      failedRedaction,
      validManifest,
    );
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.code === "REDACTION_FAILED"),
    ).toBe(true);
  });
});
