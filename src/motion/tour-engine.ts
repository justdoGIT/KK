import { easeTour, readingSeconds, readingWindows } from "./reading-pace.ts";

export type TourStep = {
  id: string;
  chapter: string;
  label: string;
  target: () => number;
  text: () => string;
  end?: () => number;
  enter?: () => void;
  ready?: () => boolean;
  inner?: () => HTMLElement | null;
  continuous?: boolean;
  seconds?: number;
  travelSeconds?: number;
};

type TourHost = {
  y: () => number;
  scroll: (y: number) => void;
  viewport: () => number;
  limit: () => number;
  reduced: boolean;
  changed: (step: TourStep) => void;
  complete: () => void;
};

/** A single clock owns page travel, reading rests, and nested text scrolling.
 * No timers accumulate while paused or hidden; the caller simply stops ticking.
 * Geometry is measured at stops, never repeatedly during an animation. */
export class TourEngine {
  index = 0;
  phase: "travel" | "settle" | "read" | "complete" = "travel";
  private elapsed = 0;
  private from = 0;
  private to = 0;
  private bottom = 0;
  private travel = 0;
  private duration = 0;
  private inner: HTMLElement | null = null;
  private overflow = 0;
  private innerFrom = 0;
  private windows = readingWindows(8, 0, 1);

  constructor(readonly steps: TourStep[], private host: TourHost, index = 0, private resume = false) {
    this.index = Math.max(0, Math.min(index, steps.length - 1));
    this.start();
  }

  get step() { return this.steps[this.index]; }

  private clamp(y: number) { return Math.max(0, Math.min(y, this.host.limit())); }

  private start() {
    const step = this.step;
    if (!step) { this.phase = "complete"; this.host.complete(); return; }
    this.elapsed = 0;
    this.phase = "travel";
    this.from = this.host.y();
    this.to = this.clamp(Math.max(this.resume ? this.from : 0, step.target()));
    this.travel = this.host.reduced ? 0 : Math.max(
      Math.abs(this.to - this.from) < 2 ? 0 : 1.6,
      Math.abs(this.to - this.from) / Math.max(160, this.host.viewport() * 0.4),
      this.resume && Math.abs(this.to - this.from) < 2 ? 0 : step.travelSeconds ?? 0,
    );
    this.host.changed(step);
  }

  tick(delta: number) {
    if (delta <= 0 || this.phase === "complete") return;
    const step = this.step;
    this.elapsed += delta;
    if (this.phase === "travel") {
      const p = this.travel > 0 ? Math.min(1, this.elapsed / this.travel) : 1;
      this.host.scroll(this.from + (this.to - this.from) * easeTour(p));
      if (p < 1) return;
      step.enter?.();
      this.phase = "settle";
      this.elapsed = 0;
      return;
    }
    if (this.phase === "settle") {
      // Let React commit changed slides/disclosures, transforms settle, and
      // lazy scenes paint before counting any reading time.
      if (this.elapsed < 1 || (step.ready && !step.ready())) return;
      this.to = this.clamp(Math.max(this.resume ? this.from : 0, step.target()));
      this.bottom = this.clamp(Math.max(this.to, step.end?.() ?? this.to));
      this.inner = step.inner?.() ?? null;
      this.overflow = this.inner ? Math.max(0, this.inner.scrollHeight - this.inner.clientHeight) : 0;
      this.innerFrom = this.resume && this.inner ? Math.min(this.overflow, this.inner.scrollTop) : 0;
      if (this.inner) this.inner.scrollTop = this.innerFrom;
      const seconds = Math.max(step.seconds ?? 0, readingSeconds(step.text()));
      this.windows = readingWindows(seconds, Math.max(this.overflow - this.innerFrom, this.bottom - this.to),
        this.overflow && this.inner ? this.inner.clientHeight : this.host.viewport() - 88);
      this.duration = step.continuous ? seconds + 8 : this.windows.duration;
      this.phase = "read";
      this.elapsed = 0;
      return;
    }
    const p = step.continuous
      ? Math.max(0, Math.min(1, (this.elapsed - 4) / Math.max(1, this.duration - 8)))
      : this.windows.position(this.elapsed, this.host.reduced);
    this.host.scroll(this.to + (this.bottom - this.to) * p);
    if (this.inner) this.inner.scrollTop = this.innerFrom + (this.overflow - this.innerFrom) * p;
    if (this.elapsed < this.duration) return;
    // Land exactly at the end and retain a complete final reading window.
    this.host.scroll(this.bottom);
    if (this.inner) this.inner.scrollTop = this.overflow;
    this.index += 1;
    this.resume = false;
    this.start();
  }
}
