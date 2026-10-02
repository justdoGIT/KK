import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import {
  MAX_COMMENT_BYTES,
  REVIEW_MARKER,
  buildReviewInput,
  formatReviewComment,
} from "./ai-pr-review.mjs";

describe("AI pull-request review boundaries", () => {
  it("caps oversized diffs and tells the reviewer that input was truncated", () => {
    const result = buildReviewInput("x".repeat(12), 10);

    expect(result.diff).toBe("x".repeat(10));
    expect(result.truncated).toBe(true);
    expect(result.notice).toContain("first 10 characters");
  });

  it("preserves complete diffs within the input limit", () => {
    const result = buildReviewInput("complete diff", 20);

    expect(result).toEqual({
      diff: "complete diff",
      truncated: false,
      notice: "The complete pull-request diff is included.",
    });
  });

  it("neutralizes mentions and prevents model output from forging the marker", () => {
    const comment = formatReviewComment(
      `${REVIEW_MARKER}\nNotify @maintainer about the defect.`,
    );

    expect(comment.match(new RegExp(REVIEW_MARKER, "g"))).toHaveLength(1);
    expect(comment).toContain("@\u200bmaintainer");
    expect(comment).not.toContain("Notify @maintainer");
  });

  it("keeps multibyte output within GitHub's body limit", () => {
    const comment = formatReviewComment("🧪".repeat(MAX_COMMENT_BYTES));

    expect(Buffer.byteLength(comment, "utf8")).toBeLessThanOrEqual(
      MAX_COMMENT_BYTES,
    );
    expect(comment).toContain("Review output was truncated");
  });
});
