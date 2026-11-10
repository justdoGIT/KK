import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SchedulerFrames } from "../scene/SchedulerFrames.tsx";

const fixture = vi.hoisted(() => ({
  callbacks: new Set<(time: number, delta: number) => void>(),
  state: {} as Record<string, unknown>,
}));
vi.mock("@react-three/fiber", () => ({ useThree: () => fixture.state }));
vi.mock("../motion/frame.ts", () => ({
  onFrame: (_phase: string, callback: (time: number, delta: number) => void) => {
    fixture.callbacks.add(callback);
    return () => fixture.callbacks.delete(callback);
  },
}));
const advance = vi.fn();
const compileAsync = vi.fn();
const has = vi.fn();
let canvas: HTMLCanvasElement;
beforeEach(() => {
  vi.clearAllMocks();
  canvas = document.createElement("canvas");
  has.mockReturnValue(false);
  fixture.state = { advance, scene: {}, camera: {}, size: { width: 1280, height: 800 }, viewport: { dpr: 1 }, gl: {
    domElement: canvas, compileAsync, extensions: { has },
    getContext: () => ({ isContextLost: () => false }),
  } };
});
afterEach(cleanup);
const frame = (time: number, delta = 0.016) => act(() => fixture.callbacks.forEach(callback => callback(time, delta)));

describe("scene rendering lifecycle", () => {
  it("redraws a cleared resize or DPR buffer before the next browser paint", () => {
    const view = render(<SchedulerFrames active />);
    frame(1000);
    frame(1016);
    advance.mockClear();
    fixture.state.viewport = { dpr: 0.75 };
    view.rerender(<SchedulerFrames active />);
    expect(advance).toHaveBeenCalledExactlyOnceWith(0.016);
    advance.mockClear();
    fixture.state.size = { width: 1024, height: 600 };
    view.rerender(<SchedulerFrames active />);
    expect(advance).toHaveBeenCalledExactlyOnceWith(0.016);
  });
  it("stops drawing immediately while visibility props cross the canvas root", () => {
    const visible = { current: true };
    render(<SchedulerFrames active visible={visible} />);
    frame(1000);
    visible.current = false;
    frame(1016);
    frame(90000, 0.1);
    expect(advance).toHaveBeenCalledTimes(1);
    visible.current = true;
    frame(90016);
    expect(advance).toHaveBeenLastCalledWith(0);
    frame(90032);
    expect(advance).toHaveBeenLastCalledWith(0.016);
  });

  it("uses the normal draw path when parallel compilation is unavailable", () => {
    render(<SchedulerFrames active />);
    frame(1000);
    expect(compileAsync).not.toHaveBeenCalled();
    expect(advance).toHaveBeenCalledWith(0);
  });

  it("keeps rendering paused until supported shader preparation finishes", async () => {
    let ready!: () => void;
    has.mockReturnValue(true);
    compileAsync.mockReturnValue(new Promise<void>(resolve => { ready = resolve; }));
    render(<SchedulerFrames active />);
    frame(1000);
    expect(advance).not.toHaveBeenCalled();
    await act(async () => ready());
    frame(1016);
    expect(advance).toHaveBeenCalledWith(0);
  });

  it("resumes the existing scene without a time jump or another compilation", () => {
    const view = render(<SchedulerFrames active />);
    frame(1000);
    frame(1016);
    expect(advance).toHaveBeenLastCalledWith(0.016);
    view.rerender(<SchedulerFrames active={false} />);
    frame(90000, 0.1);
    expect(advance).toHaveBeenCalledTimes(2);
    view.rerender(<SchedulerFrames active />);
    frame(90016);
    expect(advance).toHaveBeenLastCalledWith(0.016);
    frame(90032);
    expect(advance).toHaveBeenLastCalledWith(0.032);
    expect(compileAsync).not.toHaveBeenCalled();
  });
});
