import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import {
  MAX_COMMENT_BYTES,
  REVIEW_MARKER,
  REVIEW_MODELS,
  buildReviewInput,
  formatReviewComment,
  requestReview,
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

  it("uses the exact clean-review comment text", () => {
    const comment = formatReviewComment("No actionable defects found.");

    expect(comment).toContain("\n\nNo issues found\n\n");
    expect(comment).not.toContain("No actionable defects found");
  });

  it("keeps multibyte output within GitHub's body limit", () => {
    const comment = formatReviewComment("🧪".repeat(MAX_COMMENT_BYTES));

    expect(Buffer.byteLength(comment, "utf8")).toBeLessThanOrEqual(
      MAX_COMMENT_BYTES,
    );
    expect(comment).toContain("Review output was truncated");
  });
});

describe("AI review model fallback", () => {
  const [primary, secondary] = REVIEW_MODELS;
  const input = buildReviewInput("diff --git a/x b/x");
  const answer = (content) => ({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content }, finish_reason: "stop" }],
    }),
  });
  const failure = (status) => ({ ok: false, status });

  // Answers each call for a model from its script (the last step repeats) and
  // records which models were asked, in order.
  function scripted(script, extra = {}) {
    const asked = [];
    const fetchImpl = async (_url, options) => {
      const id = JSON.parse(options.body).model;
      asked.push(id);
      const seen = asked.filter((asked_id) => asked_id === id).length;
      const step = script[id][Math.min(seen, script[id].length) - 1];
      if (step instanceof Error) throw step;
      return step;
    };
    const result = () =>
      requestReview(input, "key", {
        fetchImpl,
        sleep: async () => {},
        ...extra,
      });
    return { asked, result };
  }

  it("uses the next model when the first stays overloaded", async () => {
    const run = scripted({
      [primary.id]: [failure(503)],
      [secondary.id]: [answer("Finding: x")],
    });

    await expect(run.result()).resolves.toEqual({
      content: "Finding: x",
      model: secondary.id,
    });
    expect(run.asked).toEqual([primary.id, primary.id, secondary.id]);
  });

  it("retries a transient failure on the same model before falling back", async () => {
    const run = scripted({
      [primary.id]: [failure(503), answer("No issues found")],
      [secondary.id]: [answer("unused")],
    });

    await expect(run.result()).resolves.toMatchObject({ model: primary.id });
    expect(run.asked).toEqual([primary.id, primary.id]);
  });

  it("treats an empty answer as a failure and moves on", async () => {
    const run = scripted({
      [primary.id]: [answer("  ")],
      [secondary.id]: [answer("Finding: y")],
    });

    await expect(run.result()).resolves.toMatchObject({ model: secondary.id });
  });

  it("does not retry a model that timed out, it moves on to the next one", async () => {
    const timeout = Object.assign(new Error("The operation timed out"), {
      name: "TimeoutError",
    });
    const run = scripted({
      [primary.id]: [timeout],
      [secondary.id]: [answer("Finding: z")],
    });

    await expect(run.result()).resolves.toMatchObject({ model: secondary.id });
    expect(run.asked).toEqual([primary.id, secondary.id]);
  });

  it("stops at once when the key is rejected", async () => {
    const run = scripted({
      [primary.id]: [failure(401)],
      [secondary.id]: [answer("never reached")],
    });

    await expect(run.result()).rejects.toThrow("failed with HTTP 401");
    expect(run.asked).toEqual([primary.id]);
  });

  it("puts the reason from the response body into the error", async () => {
    const rejected = {
      ok: false,
      status: 403,
      text: async () => '{"message":\n  "Resource not accessible by integration"}',
    };
    const run = scripted({
      [primary.id]: [rejected],
      [secondary.id]: [answer("never reached")],
    });

    await expect(run.result()).rejects.toThrow(
      'failed with HTTP 403: {"message": "Resource not accessible by integration"}',
    );
  });

  it("names every model's last failure when all of them fail", async () => {
    const run = scripted({
      [primary.id]: [failure(503)],
      [secondary.id]: [failure(429)],
    });

    await expect(run.result()).rejects.toThrow(
      `${primary.id}: HTTP 503; ${secondary.id}: HTTP 429`,
    );
  });

  it("starts no new attempt once the time budget is used up", async () => {
    const times = [0, 0, 500_000];
    const run = scripted(
      { [primary.id]: [failure(503)], [secondary.id]: [failure(503)] },
      { now: () => times.shift() ?? 500_000 },
    );

    await expect(run.result()).rejects.toThrow("time budget used up");
    expect(run.asked).toEqual([primary.id]);
  });

  it("says in the comment when a fallback model wrote the review", () => {
    const fallback = formatReviewComment("No issues found", secondary.id);
    const normal = formatReviewComment("No issues found", primary.id);

    expect(fallback).toContain(`\`${secondary.id}\``);
    expect(fallback).toContain(`fallback: ${primary.id} was unavailable`);
    expect(normal).not.toContain("fallback");
  });
});
