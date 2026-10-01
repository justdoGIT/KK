import { describe, expect, it } from "vitest";
import { GuidedScrollSession } from "../motion/guided-scroll.ts";

describe("guided scroll session", () => {
  it("starts once only after downward intent inside the section", () => {
    const session = new GuidedScrollSession();

    session.intent(1, false);
    expect(session.tryStart(0.1, 0.02, 0.8)).toBe(false);

    session.intent(1, true);
    expect(session.tryStart(0.01, 0.02, 0.8)).toBe(false);
    expect(session.tryStart(0.1, 0.02, 0.8)).toBe(true);
    expect(session.tryStart(0.2, 0.02, 0.8)).toBe(false);

    session.finish();
    session.intent(1, true);
    expect(session.tryStart(0.2, 0.02, 0.8)).toBe(false);

    session.resetBeforeSection(-300, 800);
    session.intent(1, true);
    expect(session.tryStart(0.1, 0.02, 0.8)).toBe(true);
  });

  it("hands control back immediately on reverse input", () => {
    const session = new GuidedScrollSession();
    session.intent(1, true);
    expect(session.tryStart(0.1, 0.02, 0.8)).toBe(true);
    expect(session.intent(-1, true)).toBe(true);
    expect(session.tryStart(0.2, 0.02, 0.8)).toBe(false);
  });
});
