import { Buffer } from "node:buffer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HttpError,
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

  it.each(["```markdown", "```md", "```", "~~~markdown"])(
    "renders a review enclosed by %s as Markdown",
    (opening) => {
      const closing = opening.startsWith("~") ? "~~~" : "```";
      const comment = formatReviewComment(`${opening}\r\n## Reliability\r\n- Fix the handler.\r\n${closing}`);
      expect(comment).toContain("\n\n## Reliability\r\n- Fix the handler.\n\n---");
      expect(comment).not.toContain(opening);
    },
  );

  it("preserves code examples inside an enclosing Markdown fence", () => {
    const example = '```js\nthrow new Error("Failure");\n```';
    const comment = formatReviewComment(`\`\`\`\`markdown\n## Correctness\n${example}\n\`\`\`\``);
    expect(comment).toContain(example);
    expect(comment).not.toContain("````markdown");
  });

  it("retains a code-only response and an unclosed Markdown fence", () => {
    const code = '```js\nthrow new Error("Failure");\n```';
    expect(formatReviewComment(code)).toContain(code);
    expect(formatReviewComment("```markdown\n## Incomplete")).toContain("```markdown\n## Incomplete");
  });

  it("normalizes a fenced clean review", () => {
    expect(formatReviewComment("```markdown\nNo actionable defects found.\n```")).toContain("\n\nNo issues found\n\n");
  });

  it("keeps multibyte output within GitHub's body limit", () => {
    const comment = formatReviewComment("🧪".repeat(MAX_COMMENT_BYTES));

    expect(Buffer.byteLength(comment, "utf8")).toBeLessThanOrEqual(
      MAX_COMMENT_BYTES,
    );
    expect(comment).toContain("Review output was truncated");
  });
});

describe("AI review model chain", () => {
  const input = buildReviewInput("diff --git a/x b/x");
  const byProvider = (label) =>
    REVIEW_MODELS.filter((model) => model.label === label);
  const [first, second] = REVIEW_MODELS;
  const nvidia = byProvider("NVIDIA");
  const providers = [...new Set(REVIEW_MODELS.map((model) => model.label))];
  const allKeys = Object.fromEntries(
    REVIEW_MODELS.map((model) => [model.keyEnv, `key-for-${model.keyEnv}`]),
  );

  const answer = (content) => ({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content }, finish_reason: "stop" }],
    }),
  });
  const failure = (status) => ({ ok: false, status });

  // Answers each call for a model from its script (the last step repeats; a
  // model with no script answers 503) and records the requests, in order.
  function scripted(script, { keys = allKeys, ...extra } = {}) {
    const requests = [];
    const fetchImpl = async (url, options) => {
      const body = JSON.parse(options.body);
      requests.push({
        id: body.model,
        url: String(url),
        authorization: options.headers.Authorization,
        body,
      });
      const seen = requests.filter((request) => request.id === body.model).length;
      const steps = script[body.model] ?? [failure(503)];
      const step = steps[Math.min(seen, steps.length) - 1];
      if (step instanceof Error) throw step;
      return step;
    };
    const result = () =>
      requestReview(input, keys, {
        fetchImpl,
        sleep: async () => {},
        ...extra,
      });
    return { requests, asked: () => requests.map((request) => request.id), result };
  }

  it("uses the next model when the first stays overloaded", async () => {
    const run = scripted({ [second.id]: [answer("Finding: x")] });

    await expect(run.result()).resolves.toEqual({
      content: "Finding: x",
      model: second.id,
    });
    expect(run.asked()).toEqual([first.id, first.id, second.id]);
  });

  it("instructs every provider to verify findings against the resulting code", async () => {
    const run = scripted({ [first.id]: [answer("No issues found")] });
    await run.result();
    const [system, user] = run.requests[0].body.messages;
    expect(system.content).toContain("lines prefixed '-' are removed old code");
    expect(system.content).toContain("A removed problem that the added code fixes is not a finding");
    expect(system.content).toContain("quote the relevant added or unchanged code");
    expect(user.content).toContain("Review the resulting code, not the removed '-' lines");
    expect(user.content).toContain("a short quotation of the relevant resulting code");
  });

  it("retries a transient failure on the same model before moving on", async () => {
    const run = scripted({ [first.id]: [failure(503), answer("No issues found")] });

    await expect(run.result()).resolves.toMatchObject({ model: first.id });
    expect(run.asked()).toEqual([first.id, first.id]);
  });

  it("treats an empty answer as a failure and moves on", async () => {
    const run = scripted({
      [first.id]: [answer("  ")],
      [second.id]: [answer("Finding: y")],
    });

    await expect(run.result()).resolves.toMatchObject({ model: second.id });
  });

  it("falls back instead of posting a review cut off inside a code fence", async () => {
    const truncated = answer("## Finding\n```yaml\npermissions:");
    truncated.json = async () => ({
      choices: [{ message: { content: "## Finding\n```yaml\npermissions:" }, finish_reason: "length" }],
    });
    const run = scripted({
      [first.id]: [truncated],
      [second.id]: [answer("No issues found")],
    });

    await expect(run.result()).resolves.toEqual({ content: "No issues found", model: second.id });
    expect(run.asked()).toEqual([first.id, first.id, second.id]);
  });

  it("does not retry a model that timed out, it moves on to the next one", async () => {
    const timeout = Object.assign(new Error("The operation timed out"), {
      name: "TimeoutError",
    });
    const run = scripted({
      [first.id]: [timeout],
      [second.id]: [answer("Finding: z")],
    });

    await expect(run.result()).resolves.toMatchObject({ model: second.id });
    expect(run.asked()).toEqual([first.id, second.id]);
  });

  it("skips the rest of a provider that refused its key but tries the others", async () => {
    const refusedLabel = first.label;
    const refused = byProvider(refusedLabel).map((model) => model.id);
    const run = scripted({
      [first.id]: [failure(401)],
      [second.id]: [answer("Finding: v")],
    });

    await expect(run.result()).resolves.toMatchObject({ model: second.id });
    expect(run.asked()).toEqual([first.id, second.id]);

    const all = scripted({ [first.id]: [failure(401)] });
    await expect(all.result()).rejects.toBeInstanceOf(ReviewUnavailableError);
    expect(all.asked().filter((id) => refused.includes(id))).toEqual([first.id]);
  });

  it("fails as a misconfiguration when every provider refuses its key", async () => {
    const refusals = Object.fromEntries(
      REVIEW_MODELS.map((model) => [model.id, [failure(403)]]),
    );
    const run = scripted(refusals);

    const error = await run.result().catch((caught) => caught);

    expect(error).toBeInstanceOf(HttpError);
    expect(error).not.toBeInstanceOf(ReviewUnavailableError);
    expect(error.status).toBe(403);
    expect(run.asked()).toHaveLength(providers.length);
  });

  it("skips models whose provider key is not set", async () => {
    const run = scripted(
      { [nvidia[0].id]: [answer("Finding: u")] },
      { keys: { [nvidia[0].keyEnv]: "only-key" } },
    );

    await expect(run.result()).resolves.toMatchObject({ model: nvidia[0].id });
    expect(run.asked()).toEqual([nvidia[0].id]);
  });

  it("says so when no model has a key at all", async () => {
    await expect(scripted({}, { keys: {} }).result()).rejects.toThrow(
      "No review model has a provider key set",
    );
  });

  it("sends each provider only its own key and endpoint", async () => {
    const run = scripted({});
    await run.result().catch(() => {});

    expect(new Set(run.asked())).toEqual(new Set(REVIEW_MODELS.map((m) => m.id)));
    for (const request of run.requests) {
      const model = REVIEW_MODELS.find((candidate) => candidate.id === request.id);
      expect(request.authorization).toBe(`Bearer key-for-${model.keyEnv}`);
      expect(new URL(request.url).hostname).toBe(new URL(model.baseUrl).hostname);
      expect(new URL(request.url).pathname).toMatch(/\/chat\/completions$/);
    }
  });

  it("asks the reasoning models for a short answer instead of a long hidden one", async () => {
    const run = scripted({});
    await run.result().catch(() => {});
    const bodyOf = (id) => run.requests.find((request) => request.id === id).body;

    for (const model of nvidia.filter((candidate) => candidate.body)) {
      expect(bodyOf(model.id).chat_template_kwargs).toEqual({
        enable_thinking: false,
      });
    }
    const ultra = nvidia.find((model) => !model.body);
    expect(bodyOf(ultra.id).chat_template_kwargs).toBeUndefined();
    const effortModels = REVIEW_MODELS.filter(
      (model) => model.body?.reasoning_effort,
    );
    expect(effortModels.length).toBeGreaterThan(0);
    for (const model of effortModels) {
      expect(bodyOf(model.id).reasoning_effort).toBe("low");
    }
  });

  it("puts the reason from the response body into the error", async () => {
    const rejected = {
      ok: false,
      status: 403,
      text: async () => '{"message":\n  "Resource not accessible by integration"}',
    };
    const run = scripted(
      Object.fromEntries(REVIEW_MODELS.map((model) => [model.id, [rejected]])),
    );

    await expect(run.result()).rejects.toThrow(
      'failed with HTTP 403: {"message": "Resource not accessible by integration"}',
    );
  });

  it("names every model's last failure when all of them fail", async () => {
    const run = scripted({ [first.id]: [failure(503)], [second.id]: [failure(429)] });

    await expect(run.result()).rejects.toThrow(
      `${first.id}: HTTP 503; ${second.id}: HTTP 429`,
    );
  });

  it("starts no new attempt once the time budget is used up", async () => {
    const times = [0, 0, 500_000];
    const run = scripted({}, { now: () => times.shift() ?? 500_000 });

    await expect(run.result()).rejects.toThrow("time budget used up");
    expect(run.asked()).toEqual([first.id]);
  });

  it("names the provider and any fallback in the comment", () => {
    const fallback = formatReviewComment("No issues found", second.id);
    const normal = formatReviewComment("No issues found", first.id);

    expect(fallback).toContain(`\`${second.id}\` via ${second.label}`);
    expect(fallback).toContain(`fallback: ${first.id} was unavailable`);
    expect(normal).toContain(`\`${first.id}\` via ${first.label}`);
    expect(normal).not.toContain("fallback");
  });
});

describe("AI review job outcome", () => {
  const reviewEnv = {
    GITHUB_REPOSITORY: "owner/repo",
    GITHUB_TOKEN: "github-token",
    NVIDIA_API_KEY: "nvidia-key",
    PR_NUMBER: "7",
  };

  // Serves the pull-request diff from GitHub and answers every provider call
  // with `provider`; records the URLs it was asked for.
  function job(provider) {
    const urls = [];
    const fetchImpl = async (url) => {
      urls.push(String(url));
      if (new URL(String(url)).hostname === "api.github.com") {
        return { ok: true, status: 200, text: async () => "diff --git a/x b/x" };
      }
      return provider;
    };
    return { urls, fetchImpl };
  }
  const options = (run) => ({
    fetchImpl: run.fetchImpl,
    review: { sleep: async () => {} },
  });

  beforeEach(() => {
    for (const [name, value] of Object.entries(reviewEnv)) vi.stubEnv(name, value);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("updates the existing bot comment with rendered review prose and retained code examples", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const example = '```js\nthrow new Error("Failure");\n```';
    const provider = `\`\`\`\`markdown\n## Reliability\n\nFix the handler.\n\n${example}\n\`\`\`\``;
    const posted = [];
    const fetchImpl = async (url, options) => {
      const path = new URL(url).pathname;
      if (path === "/repos/owner/repo/pulls/7") {
        return { ok: true, text: async () => "diff --git a/x b/x" };
      }
      if (path === "/repos/owner/repo/issues/7/comments") {
        return { ok: true, json: async () => [
          { id: 41, user: { login: "maintainer" }, body: REVIEW_MARKER },
          { id: 42, user: { login: "github-actions[bot]" }, body: REVIEW_MARKER },
        ] };
      }
      if (path === "/repos/owner/repo/issues/comments/42") {
        posted.push({ method: options.method, ...JSON.parse(options.body) });
        return { ok: true };
      }
      return { ok: true, json: async () => ({ choices: [{ message: { content: provider } }] }) };
    };

    await runReview({ fetchImpl });

    expect(posted).toHaveLength(1);
    expect(posted[0].method).toBe("PATCH");
    expect(posted[0].body).toContain("\n\n## Reliability\n\nFix the handler.");
    expect(posted[0].body).toContain(example);
    expect(posted[0].body).not.toContain("````markdown");
  });

  it("warns and passes when no model answers, without posting a comment", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const run = job({ ok: false, status: 503 });

    await expect(runReview(options(run))).resolves.toBeUndefined();

    expect(log.mock.calls.flat().join("\n")).toContain(
      "::warning title=AI review unavailable::",
    );
    expect(run.urls.some((url) => url.includes("/comments"))).toBe(false);
  });

  it("passes even when the job summary file cannot be written", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubEnv("GITHUB_STEP_SUMMARY", "/nonexistent-directory/summary.md");
    const run = job({ ok: false, status: 503 });

    await expect(runReview(options(run))).resolves.toBeUndefined();
  });

  it("still fails the job when the only configured key is rejected", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const run = job({ ok: false, status: 401 });

    await expect(runReview(options(run))).rejects.toThrow(
      "failed with HTTP 401",
    );
  });

  it("fails with a clear message when no provider key is set", async () => {
    vi.stubEnv("NVIDIA_API_KEY", "");
    const run = job({ ok: false, status: 503 });

    const error = await runReview(options(run)).catch((caught) => caught);

    expect(error.message).toContain("No review provider key is set");
    for (const model of REVIEW_MODELS) {
      expect(error.message).toContain(model.keyEnv);
    }
  });
});
