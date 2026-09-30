import { useLayoutEffect, useRef, type JSX } from "react";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { useMediaQuery } from "../../motion/use-media-query.ts";
import { clamp01 } from "../../motion/scroll-frame.ts";
import { diceTimeline, diceTransforms } from "../../motion/metrics-dice.ts";

type MetricItem = {
  value: string;
  label: string;
  subtext: string;
};

const CLIENT_METRICS: MetricItem[] = [
  {
    value: "9+ Years",
    label: "INDUSTRIAL & EMBEDDED MASTERY",
    subtext: "Automotive, industrial IoT, edge AI & robotics",
  },
  {
    value: "4 Major SoCs",
    label: "QUALCOMM • TI • NXP • XILINX",
    subtext: "Full BSP, device trees, and custom bootloader bring-up",
  },
  {
    value: "99.9%",
    label: "FIELD UPTIME & RELIABILITY",
    subtext: "Hardware watchdogs & atomic A/B dual-partition updates",
  },
  {
    value: "128 TOPS",
    label: "EDGE AI NPU ACCELERATION",
    subtext: "Sub-3ms INT8 quantized on-device neural inference",
  },
  {
    value: "< 2.8ms",
    label: "DETERMINISTIC MOTION LOOPS",
    subtext: "Real-time ROS2, EtherCAT & CAN-FD motor actuation",
  },
  {
    value: "Zero Bricking",
    label: "PRODUCTION INVARIANT",
    subtext: "Fail-safe recovery, JTAG diagnostics & signed rootfs",
  },
];

const DICE_QUERY = "(min-width: 1280px)";
const DURATION_MS = 3400;

export function ClientMetricsStrip(): JSX.Element {
  const enhanced = useMotionMode() === "enhanced";
  const wide = useMediaQuery(DICE_QUERY);
  const dice = enhanced && wide;
  const row = useRef<HTMLDivElement>(null);

  // The six cards fold into a cube that rolls in from the left, then open
  // right → left into the straight row. Leaving the viewport rewinds it so
  // the roll replays on return.
  useLayoutEffect(() => {
    const el = row.current;
    if (!dice || !el) return;
    const cards = [...el.children] as HTMLElement[];
    let progress = 0;
    let playing = false;
    let last = 0;
    let raf = 0;

    const apply = () => {
      const open = progress >= 1;
      const width = cards[0]?.offsetWidth ?? 0;
      const transforms = open ? [] : diceTransforms(diceTimeline(progress), width);
      cards.forEach((card, i) => { card.style.transform = open ? "" : transforms[i].toString(); });
      el.dataset.dice = open ? "open" : progress <= 0 ? "closed" : "moving";
    };
    const tick = (now: number) => {
      // Clamp the step so a stalled frame (tab switch, heavy WebGL frame)
      // slows the sequence instead of skipping straight to the end.
      progress = clamp01(progress + Math.min(100, last ? now - last : 16) / DURATION_MS);
      last = now;
      apply();
      raf = playing && progress < 1 ? requestAnimationFrame(tick) : 0;
    };
    const stop = () => { playing = false; cancelAnimationFrame(raf); raf = 0; last = 0; };
    apply();
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        if (!playing && progress < 1) { playing = true; raf = requestAnimationFrame(tick); }
      } else if (!entry.isIntersecting) {
        stop();
        progress = 0;
        apply();
      }
    }, { threshold: [0, 0.5] });
    observer.observe(el);
    const onResize = () => apply();
    window.addEventListener("resize", onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      stop();
      cards.forEach((card) => { card.style.transform = ""; });
    };
  }, [dice]);

  return (
    <div className="client-metrics-strip" aria-label="Key engineering metrics">
      <div ref={row} className={`metrics-strip-inner${dice ? " metrics-dice" : ""}`} data-dice="open">
        {CLIENT_METRICS.map((item) => (
          <div key={item.value} className="metric-strip-card">
            <span className="metric-strip-val">{item.value}</span>
            <span className="metric-strip-label">{item.label}</span>
            <span className="metric-strip-sub">{item.subtext}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
