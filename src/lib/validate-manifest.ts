/**
 * Manifest and registry validation.
 * Fails closed on version mismatch, missing/duplicate/unknown evidence IDs,
 * claim-hash mismatch, and invalid approval/publication states.
 */
import { createHash } from "node:crypto";
import type {
  EvidenceManifest,
  PublicRegistry,
  ValidationError,
  ValidationResult,
} from "../content/schema.ts";
import { scanText } from "./prohibited-terms.ts";

export function validateManifest(
  manifest: EvidenceManifest,
  registry: PublicRegistry,
): ValidationResult {
  const errors: ValidationError[] = [];

  if (manifest.manifestVersion !== 1) {
    errors.push({
      code: "MANIFEST_VERSION",
      message: `manifestVersion must be 1, got ${manifest.manifestVersion}`,
    });
  }

  if (manifest.registryVersion !== registry.registryVersion) {
    errors.push({
      code: "VERSION_MISMATCH",
      message: `manifest registryVersion (${manifest.registryVersion}) does not match registry (${registry.registryVersion})`,
    });
  }

  const manifestIds = manifest.entries.map((e) => e.evidenceId);
  const registryIds = registry.entries.map((e) => e.evidenceId);

  const manifestSet = new Set(manifestIds);
  const registrySet = new Set(registryIds);

  for (const id of manifestIds) {
    if (manifestIds.indexOf(id) !== manifestIds.lastIndexOf(id)) {
      errors.push({
        code: "DUPLICATE_EVIDENCE_ID",
        message: `duplicate evidenceId in manifest: ${id}`,
        evidenceId: id,
      });
    }
  }

  for (const id of registryIds) {
    if (registryIds.indexOf(id) !== registryIds.lastIndexOf(id)) {
      errors.push({
        code: "DUPLICATE_EVIDENCE_ID",
        message: `duplicate evidenceId in registry: ${id}`,
        evidenceId: id,
      });
    }
  }

  for (const id of manifestSet) {
    if (!registrySet.has(id)) {
      errors.push({
        code: "UNKNOWN_EVIDENCE_ID",
        message: `evidenceId in manifest but not in registry: ${id}`,
        evidenceId: id,
      });
    }
  }

  for (const id of registrySet) {
    if (!manifestSet.has(id)) {
      errors.push({
        code: "MISSING_EVIDENCE_ID",
        message: `evidenceId in registry but not in manifest: ${id}`,
        evidenceId: id,
      });
    }
  }

  const validApprovalStates = ["approved", "pending", "rejected"];
  const validPublicationStates = ["approved", "omitted", "claim-only"];

  for (const entry of manifest.entries) {
    if (!validApprovalStates.includes(entry.approvalState)) {
      errors.push({
        code: "INVALID_APPROVAL_STATE",
        message: `invalid approvalState: ${entry.approvalState}`,
        evidenceId: entry.evidenceId,
        field: "approvalState",
      });
    }

    if (!validPublicationStates.includes(entry.publicationState)) {
      errors.push({
        code: "INVALID_PUBLICATION_STATE",
        message: `invalid publicationState: ${entry.publicationState}`,
        evidenceId: entry.evidenceId,
        field: "publicationState",
      });
    }

    const registryEntry = registry.entries.find(
      (e) => e.evidenceId === entry.evidenceId,
    );
    if (!registryEntry) continue;

    const computedHash = createHash("sha256")
      .update(registryEntry.approvedClaimText)
      .digest("hex");

    if (computedHash !== entry.claimHash) {
      errors.push({
        code: "CLAIM_HASH_MISMATCH",
        message: `claim hash mismatch for ${entry.evidenceId}: expected ${computedHash}, got ${entry.claimHash}`,
        evidenceId: entry.evidenceId,
        field: "claimHash",
      });
    }

    if (entry.approvalState !== "approved") {
      errors.push({
        code: "APPROVAL_PENDING",
        message: `approvalState is ${entry.approvalState}, not approved`,
        evidenceId: entry.evidenceId,
        field: "approvalState",
      });
    }

    if (entry.publicationState === "omitted") {
      errors.push({
        code: "PUBLICATION_OMITTED",
        message: `publicationState is omitted for ${entry.evidenceId}`,
        evidenceId: entry.evidenceId,
        field: "publicationState",
      });
    }

    if (entry.publicationState === "claim-only" && entry.links.length > 0) {
      errors.push({
        code: "CLAIM_ONLY_HAS_LINKS",
        message: `claim-only entry ${entry.evidenceId} must not have links`,
        evidenceId: entry.evidenceId,
        field: "links",
      });
    }

    const manifestScan = scanText(JSON.stringify(entry));
    if (!manifestScan.clean) {
      errors.push({
        code: "PROHIBITED_CONTENT",
        message: `prohibited content in manifest entry ${entry.evidenceId}: ${JSON.stringify(manifestScan)}`,
        evidenceId: entry.evidenceId,
      });
    }
  }

  const registryScan = scanText(JSON.stringify(registry));
  if (!registryScan.clean) {
    errors.push({
      code: "PROHIBITED_CONTENT",
      message: `prohibited content in registry: ${JSON.stringify(registryScan)}`,
    });
  }

  return { valid: errors.length === 0, errors };
}
