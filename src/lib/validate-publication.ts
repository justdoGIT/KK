/**
 * Publication record validation.
 * Ensures every case study has approval, evidence, redaction review,
 * and no prohibited content. Omitted records are removed entirely.
 */
import type {
  EvidenceManifest,
  PublicationRecord,
  ValidationError,
  ValidationResult,
} from "../content/schema.ts";
import { scanText } from "./prohibited-terms.ts";

const VALID_CLIENT_STATUSES = ["not-applicable", "pending", "approved"];
const VALID_PUB_STATUSES = ["approved", "omitted"];
const VALID_REDACTION_STATUSES = ["passed", "failed"];
const VALID_METRIC_LABELS = [
  "resume-reported",
  "measured",
  "not-a-metric",
];

export function validatePublicationRecord(
  record: PublicationRecord,
  manifest: EvidenceManifest,
): ValidationResult {
  const errors: ValidationError[] = [];

  if (record.publicationApproval.status === "omitted") {
    errors.push({
      code: "RECORD_OMITTED",
      message: `publication record ${record.slug} is omitted; study removed`,
    });
    return { valid: false, errors };
  }

  if (record.clientApproval.status === "pending") {
    errors.push({
      code: "CLIENT_APPROVAL_PENDING",
      message: `client approval pending for ${record.slug}`,
    });
  }

  if (!VALID_CLIENT_STATUSES.includes(record.clientApproval.status)) {
    errors.push({
      code: "INVALID_CLIENT_STATUS",
      message: `invalid clientApproval status: ${record.clientApproval.status}`,
    });
  }

  if (!VALID_PUB_STATUSES.includes(record.publicationApproval.status)) {
    errors.push({
      code: "INVALID_PUB_STATUS",
      message: `invalid publicationApproval status: ${record.publicationApproval.status}`,
    });
  }

  if (!VALID_REDACTION_STATUSES.includes(record.redactionReview.status)) {
    errors.push({
      code: "INVALID_REDACTION_STATUS",
      message: `invalid redactionReview status: ${record.redactionReview.status}`,
    });
  }

  if (record.redactionReview.status === "failed") {
    errors.push({
      code: "REDACTION_FAILED",
      message: `redaction review failed for ${record.slug}`,
    });
  }

  const manifestIds = new Set(manifest.entries.map((e) => e.evidenceId));

  for (const claim of record.approvedClaims) {
    if (claim.publicationStatus === "omitted") {
      errors.push({
        code: "CLAIM_OMITTED",
        message: `claim omitted in ${record.slug}`,
      });
      continue;
    }

    if (claim.evidenceIds.length === 0) {
      errors.push({
        code: "NO_EVIDENCE",
        message: `claim has no evidence IDs in ${record.slug}`,
      });
    }

    for (const eid of claim.evidenceIds) {
      if (!manifestIds.has(eid)) {
        errors.push({
          code: "UNKNOWN_EVIDENCE",
          message: `claim references unknown evidence ID ${eid} in ${record.slug}`,
          evidenceId: eid,
        });
      }
    }

    if (claim.metricLabel && !VALID_METRIC_LABELS.includes(claim.metricLabel)) {
      errors.push({
        code: "INVALID_METRIC_LABEL",
        message: `invalid metricLabel: ${claim.metricLabel}`,
      });
    }

    const claimScan = scanText(claim.text);
    if (!claimScan.clean) {
      errors.push({
        code: "PROHIBITED_CONTENT",
        message: `prohibited content in claim: ${JSON.stringify(claimScan)}`,
      });
    }
  }

  for (const link of record.links) {
    if (!link.finalUrl || !link.verifiedOn) {
      errors.push({
        code: "INCOMPLETE_LINK",
        message: `link ${link.url} missing finalUrl or verifiedOn`,
      });
    }
    const linkScan = scanText(link.url + " " + link.finalUrl);
    if (!linkScan.clean) {
      errors.push({
        code: "PROHIBITED_LINK",
        message: `prohibited content in link: ${JSON.stringify(linkScan)}`,
      });
    }
  }

  const recordScan = scanText(JSON.stringify(record));
  if (!recordScan.clean) {
    errors.push({
      code: "PROHIBITED_CONTENT",
      message: `prohibited content in record ${record.slug}: ${JSON.stringify(recordScan)}`,
    });
  }

  return { valid: errors.length === 0, errors };
}

export function validateAllRecords(
  records: PublicationRecord[],
  manifest: EvidenceManifest,
): ValidationResult {
  const allErrors: ValidationError[] = [];
  for (const record of records) {
    const result = validatePublicationRecord(record, manifest);
    allErrors.push(...result.errors);
  }
  return { valid: allErrors.length === 0, errors: allErrors };
}
