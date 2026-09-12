/**
 * Publication schema — strict types for evidence, claims, and publication records.
 * These types enforce the allowlist boundary described in the design document.
 * No arbitrary README text or repository traversal may enter the public build.
 */

export type EvidenceKind =
  | "resume"
  | "local-repo"
  | "github"
  | "inspiration";

export type EvidenceStatus =
  | "verified"
  | "local-only"
  | "unverified"
  | "inspiration-only";

export type ReviewerApproval = "approved" | "pending" | "rejected";

export type PublicationStatus = "approved" | "omitted";

/**
 * Manifest-level publication state. "claim-only" allows claims but
 * forbids source URLs (used for the personal agent harness).
 */
export type ManifestPublicationState = PublicationStatus | "claim-only";

export type MetricLabel = "resume-reported" | "measured" | "not-a-metric";

export type SourceKind =
  | "resume"
  | "local-history"
  | "github"
  | "inspiration";

export type PublicationApprovalStatus = "approved" | "omitted";
export type RedactionReviewStatus = "passed" | "failed";
export type ClientApprovalStatus = "not-applicable" | "pending" | "approved";

/**
 * Private evidence record — never enters the public build (dist/).
 * Used only by the publication owner to create the sanitized manifest.
 */
export type Evidence = {
  id: string;
  kind: EvidenceKind;
  locator: string;
  accessedOn: string;
  sourceHash?: string;
  evidenceStatus: EvidenceStatus;
  reviewerApproval: ReviewerApproval;
};

/**
 * A single public claim with its supporting evidence IDs.
 */
export type Claim = {
  text: string;
  evidenceIds: string[];
  publicationStatus: PublicationStatus;
  metricLabel?: MetricLabel;
};

/**
 * A link allowlist entry — every published link must match a record.
 */
export type ApprovedLink = {
  label: string;
  url: string;
  finalUrl: string;
  verifiedOn: string;
};

/**
 * Publication record — one per case study.
 * A missing, pending, failed, or omitted record removes the study entirely.
 */
export type PublicationRecord = {
  slug: string;
  publicTitle: string;
  approvedClaims: Claim[];
  excludedClaims: string[];
  approvedCommitOrTag: string | null;
  clientApproval: {
    status: ClientApprovalStatus;
    recordId: string;
  };
  publicationApproval: {
    owner: string;
    date: string;
    status: PublicationApprovalStatus;
  };
  redactionReview: {
    reviewer: string;
    date: string;
    status: RedactionReviewStatus;
  };
  links: ApprovedLink[];
};

/**
 * Sanitized manifest entry — committed, no sensitive details.
 */
export type ManifestEntry = {
  evidenceId: string;
  sourceKind: SourceKind;
  claimHash: string;
  approvalState: ReviewerApproval;
  publicationState: ManifestPublicationState;
  approvedOn: string;
  reviewedOn: string;
  links: ApprovedLink[];
};

/**
 * Top-level manifest structure.
 */
export type EvidenceManifest = {
  manifestVersion: number;
  registryVersion: number;
  entries: ManifestEntry[];
};

/**
 * Public content registry — version-matched to the manifest.
 */
export type RegistryEntry = {
  evidenceId: string;
  publicIdentity: string;
  approvedClaimText: string;
  publicationState: PublicationStatus;
};

export type PublicRegistry = {
  registryVersion: number;
  entries: RegistryEntry[];
};

/**
 * Validation result.
 */
export type ValidationError = {
  code: string;
  message: string;
  evidenceId?: string;
  field?: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};
