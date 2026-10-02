import { render } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { useScrollFrame } from "../motion/scroll-frame.ts";

// Let the shared scheduler's next tick and any queued scroll event run.
// (Promise.withResolvers is ES2024; this project targets ES2022.)
function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

const calls: string[] = [];
const reads: number[] = [];

function Harness({ enabled = true, note }: { enabled?: boolean; note: number }): null {
  useScrollFrame(
    () => {
      reads.push(note);
      calls.push("read");
    },
    () => calls.push("write"),
    enabled,
  );
  return null;
}

afterEach(() => {
  calls.length = 0;
  reads.length = 0;
});

describe("useScrollFrame", () => {
  it("runs one read then one write per frame, coalescing many scroll events", async () => {
    render(<Harness note={1} />);
    await act(nextFrame);
    expect(calls).toEqual(["read", "write"]);

    await act(async () => {
      window.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(new Event("resize"));
      await nextFrame();
    });
    expect(calls).toEqual(["read", "write", "read", "write"]);
  });

  it("stays silent while disabled and resumes with a fresh pair when enabled", async () => {
    const view = render(<Harness enabled={false} note={2} />);
    await act(nextFrame);
    expect(calls).toEqual([]);

    view.rerender(<Harness note={2} />);
    await act(nextFrame);
    expect(calls).toEqual(["read", "write"]);
  });

  it("stops driving after unmount", async () => {
    const view = render(<Harness note={3} />);
    await act(nextFrame);
    const seen = calls.length;
    view.unmount();
    await act(async () => {
      window.dispatchEvent(new Event("scroll"));
      await nextFrame();
    });
    expect(calls.length).toBe(seen);
  });
});
