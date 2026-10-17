import { Buffer } from "node:buffer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_COMMENT_BYTES,
  REVIEW_MARKER,
  REVIEW_MODELS,
  ReviewUnavailableError,
  buildReviewInput,
  formatReviewComment,
  requestReview,
  runReview,
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
      const steps = script[id] ?? [failure(503)];
      const step = steps[Math.min(seen, steps.length) - 1];
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

  it("uses the third model when the first two keep failing", async () => {
    const third = REVIEW_MODELS[2];
    const run = scripted({
      [primary.id]: [failure(503)],
      [secondary.id]: [failure(503)],
      [third.id]: [answer("Finding: w")],
    });

    await expect(run.result()).resolves.toMatchObject({ model: third.id });
    expect(run.asked).toEqual([
      primary.id,
      primary.id,
      secondary.id,
      secondary.id,
      third.id,
    ]);
  });

  it("asks the reasoning models for an answer without a thinking phase", async () => {
    const bodies = {};
    const fetchImpl = async (_url, options) => {
      const body = JSON.parse(options.body);
      bodies[body.model] = body;
      return failure(503);
    };

    await requestReview(input, "key", { fetchImpl, sleep: async () => {} }).catch(
      () => {},
    );

    const noThinking = { enable_thinking: false };
    expect(bodies[secondary.id].chat_template_kwargs).toEqual(noThinking);
    expect(bodies[REVIEW_MODELS[2].id].chat_template_kwargs).toEqual(noThinking);
    expect(bodies[primary.id].chat_template_kwargs).toBeUndefined();
  });

  it("tells an outage apart from a rejected key", async () => {
    const outage = await scripted({}).result().catch((error) => error);
    const rejected = await scripted({ [primary.id]: [failure(401)] })
      .result()
      .catch((error) => error);

    expect(outage).toBeInstanceOf(ReviewUnavailableError);
    expect(rejected).not.toBeInstanceOf(ReviewUnavailableError);
    expect(rejected.status).toBe(401);
  });
});

describe("AI review job outcome", () => {
  const reviewEnv = {
    GITHUB_REPOSITORY: "owner/repo",
    GITHUB_TOKEN: "github-token",
    NVIDIA_API_KEY: "nvidia-key",
    PR_NUMBER: "7",
  };

  // Serves the pull-request diff from GitHub and answers every NVIDIA call with
  // `nvidia`; records the URLs it was asked for.
  function job(nvidia) {
    const urls = [];
    const fetchImpl = async (url) => {
      urls.push(String(url));
      if (new URL(String(url)).hostname === "api.github.com") {
        return { ok: true, status: 200, text: async () => "diff --git a/x b/x" };
      }
      return nvidia;
    };
    return { urls, fetchImpl };
  }

  beforeEach(() => {
    for (const [name, value] of Object.entries(reviewEnv)) vi.stubEnv(name, value);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("warns and passes when no model answers, without posting a comment", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const run = job({ ok: false, status: 503 });

    await expect(
      runReview({ fetchImpl: run.fetchImpl, review: { sleep: async () => {} } }),
    ).resolves.toBeUndefined();

    expect(log.mock.calls.flat().join("\n")).toContain(
      "::warning title=AI review unavailable::",
    );
    expect(run.urls.some((url) => url.includes("/comments"))).toBe(false);
  });

  it("passes even when the job summary file cannot be written", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubEnv("GITHUB_STEP_SUMMARY", "/nonexistent-directory/summary.md");
    const run = job({ ok: false, status: 503 });

    await expect(
      runReview({ fetchImpl: run.fetchImpl, review: { sleep: async () => {} } }),
    ).resolves.toBeUndefined();
  });

  it("still fails the job when the NVIDIA key is rejected", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const run = job({ ok: false, status: 401 });

    await expect(
      runReview({ fetchImpl: run.fetchImpl, review: { sleep: async () => {} } }),
    ).rejects.toThrow("failed with HTTP 401");
  });
});
