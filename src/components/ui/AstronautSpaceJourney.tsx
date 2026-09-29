import { useState, useEffect, useRef, type CSSProperties, type JSX } from "react";
import { contactInfo } from "../../content/contact.ts";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { SpaceBackdrop, AstronautFigure } from "./AstronautArtwork.tsx";

// Four scroll beats: small card, fullscreen expansion, free fall, then
// a screen-breaking exit that resolves into the astronaut's hand wave.
const TOTAL_SCROLL = 4.2;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

type Key = { t: number; v: number };

function segLerp(t: number, keys: Key[]): number {
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t >= a.t && t <= b.t) {
      return a.v + (b.v - a.v) * ((t - a.t) / (b.t - a.t));
    }
  }
  return keys[keys.length - 1].v;
}

const SCALE_KEYS: Key[] = [
  { t: 0, v: 0.18 }, { t: 0.14, v: 0.18 }, { t: 0.38, v: 0.72 },
  { t: 0.44, v: 0.66 }, { t: 0.74, v: 0.62 }, { t: 0.84, v: 0.82 },
  { t: 0.94, v: 1.08 }, { t: 1, v: 1.02 },
];
const X_KEYS: Key[] = [
  { t: 0, v: 0 }, { t: 0.42, v: 0 }, { t: 0.5, v: -10 },
  { t: 0.6, v: 8 }, { t: 0.7, v: -6 }, { t: 0.78, v: 4 },
  { t: 0.92, v: 0 }, { t: 1, v: 0 },
];
const Y_KEYS: Key[] = [
  { t: 0, v: 0 }, { t: 0.4, v: 0 }, { t: 0.44, v: -42 },
  { t: 0.54, v: -14 }, { t: 0.64, v: 16 }, { t: 0.76, v: 40 },
  { t: 0.88, v: 4 }, { t: 1, v: 0 },
];
const ROT_KEYS: Key[] = [
  { t: 0, v: 0 }, { t: 0.42, v: 0 }, { t: 0.5, v: -16 },
  { t: 0.6, v: 11 }, { t: 0.7, v: -9 }, { t: 0.78, v: 5 },
  { t: 0.9, v: 0 }, { t: 1, v: 0 },
];
const FRAME_OPACITY_KEYS: Key[] = [
  { t: 0, v: 1 }, { t: 0.82, v: 1 }, { t: 0.96, v: 0 }, { t: 1, v: 0 },
];
const FRAME_SCALE_KEYS: Key[] = [
  { t: 0, v: 0.74 }, { t: 0.14, v: 0.74 }, { t: 0.38, v: 4.35 },
  { t: 0.78, v: 4.35 }, { t: 0.88, v: 4.5 }, { t: 1, v: 4.8 },
];
const FRAME_ROT_KEYS: Key[] = [
  { t: 0, v: 0 }, { t: 0.78, v: 0 }, { t: 0.82, v: -1.4 },
  { t: 0.86, v: 1.2 }, { t: 0.9, v: -0.8 }, { t: 0.96, v: 0 },
];
const BG_OPACITY_KEYS: Key[] = [
  { t: 0, v: 0 }, { t: 0.18, v: 0 }, { t: 0.4, v: 1 }, { t: 1, v: 1 },
];
const TITLE_OPACITY_KEYS: Key[] = [
  { t: 0, v: 0 }, { t: 0.86, v: 0 }, { t: 0.96, v: 1 }, { t: 1, v: 1 },
];
const DIALOG_OPACITY_KEYS: Key[] = [
  { t: 0, v: 0 }, { t: 0.9, v: 0 }, { t: 0.99, v: 1 }, { t: 1, v: 1 },
];
const DIALOG_Y_KEYS: Key[] = [
  { t: 0, v: 26 }, { t: 0.9, v: 26 }, { t: 1, v: 0 },
];

const SHARDS = [
  { x: -39, y: -28, r: -38, s: 0.8 }, { x: -31, y: 22, r: 24, s: 1.1 },
  { x: -20, y: -36, r: 62, s: 0.65 }, { x: -11, y: 31, r: -52, s: 0.9 },
  { x: 11, y: -34, r: 40, s: 0.75 }, { x: 19, y: 33, r: 72, s: 1.05 },
  { x: 30, y: -23, r: -25, s: 0.9 }, { x: 40, y: 18, r: 46, s: 0.7 },
  { x: -46, y: 4, r: 18, s: 0.6 }, { x: 45, y: -3, r: -64, s: 1 },
] as const;

const CRACKS = [
  { x: 50, y: 49, r: -74, l: 34 }, { x: 50, y: 49, r: -28, l: 42 },
  { x: 50, y: 49, r: 18, l: 38 }, { x: 50, y: 49, r: 63, l: 36 },
  { x: 50, y: 49, r: 116, l: 42 }, { x: 50, y: 49, r: 158, l: 35 },
] as const;

const SIGNALS = [
  { label: "</>", x: 8, y: 16, r: -12 },
  { label: "CAN", x: 78, y: 15, r: 9 },
  { label: "AI", x: 13, y: 65, r: 8 },
  { label: "RF", x: 82, y: 64, r: -10 },
  { label: "OTA", x: 25, y: 81, r: -7 },
  { label: "HIL", x: 69, y: 82, r: 12 },
] as const;

export function AstronautSpaceJourney(): JSX.Element {
  const enhanced = useMotionMode() === "enhanced";
  const sectionRef = useRef<HTMLDivElement>(null);
  const [journeyProgress, setJourneyProgress] = useState(0);

  // Single RAF-throttled scroll listener: native "scroll" can fire many
  // times per animation frame, and each call here rewrites several inline
  // transform/opacity strings. Without coalescing to one write per frame,
  // this visibly flickered/strobed instead of tracking the scrollbar
  // smoothly (same root cause as the terminal's reveal flicker).
  useEffect(() => {
    if (!enhanced) return;
    let rafId = 0;

    const computeAndApply = () => {
      const el = sectionRef.current;
      if (!el) return;
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const raw = clamp01(-el.getBoundingClientRect().top / scrollable);
      setJourneyProgress(raw);
    };

    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        computeAndApply();
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    computeAndApply();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [enhanced]);

  const t = enhanced ? journeyProgress : 1;
  const isWaving = t >= 0.92;
  const isLanded = t >= 0.96;
  const breakProgress = clamp01((t - 0.78) / 0.16);
  const shardTravel = clamp01((t - 0.8) / 0.18);
  const shardOpacity = breakProgress * (1 - clamp01((t - 0.98) / 0.02) * 0.15);
  const signalProgress =
    clamp01((t - 0.42) / 0.1) * (1 - clamp01((t - 0.76) / 0.08));
  const titleOpacity = segLerp(t, TITLE_OPACITY_KEYS);

  const frameOpacity = segLerp(t, FRAME_OPACITY_KEYS);
  const frameScale = segLerp(t, FRAME_SCALE_KEYS);
  const frameRot = segLerp(t, FRAME_ROT_KEYS);
  const bgOpacity = segLerp(t, BG_OPACITY_KEYS);
  const rigX = segLerp(t, X_KEYS);
  const rigY = segLerp(t, Y_KEYS);
  const rigScale = segLerp(t, SCALE_KEYS);
  const rigRot = segLerp(t, ROT_KEYS);
  const dialogOpacity = segLerp(t, DIALOG_OPACITY_KEYS);
  const dialogY = segLerp(t, DIALOG_Y_KEYS);

  const frameStyle: CSSProperties = {
    opacity: frameOpacity,
    transform: `translate(-50%, -50%) scale(${frameScale.toFixed(3)}) rotate(${frameRot.toFixed(2)}deg)`,
  };
  const bgStyle: CSSProperties = { opacity: bgOpacity };
  const rigStyle: CSSProperties = {
    transform: `translate(-50%, -50%) translate3d(${rigX.toFixed(1)}%, ${rigY.toFixed(1)}%, 0) scale(${rigScale.toFixed(3)}) rotate(${rigRot.toFixed(2)}deg)`,
  };
  const titleStyle: CSSProperties = {
    opacity: titleOpacity,
    transform: `translate(-50%, calc(-50% + ${(24 - titleOpacity * 24).toFixed(1)}px))`,
  };
  const dialogStyle: CSSProperties = {
    opacity: dialogOpacity,
    transform: `translateX(-50%) translateY(${dialogY.toFixed(1)}px)`,
  };

  return (
    <div ref={sectionRef} className="space-journey-scroll-section" style={{ height: `${TOTAL_SCROLL * 100}vh` }}>
      <div className="space-journey-sticky-stage">
        <div className="space-fullbg-layer" style={bgStyle} aria-hidden="true">
          <SpaceBackdrop idPrefix="bg" />
          <span className="space-ambient space-ambient-one" />
          <span className="space-ambient space-ambient-two" />
        </div>

        <div className="space-mission-title" style={titleStyle}>
          <span>BUILD THE NEXT</span>
          <strong>MISSION TOGETHER</strong>
        </div>

        <div className="space-signal-field" style={{ opacity: signalProgress }} aria-hidden="true">
          {SIGNALS.map((signal) => (
            <span
              key={signal.label}
              className="space-signal"
              style={{
                left: `${signal.x}%`,
                top: `${signal.y}%`,
                transform: `translate(-50%, -50%) rotate(${signal.r}deg) scale(${(0.55 + signalProgress * 0.45).toFixed(3)})`,
              }}
            >
              {signal.label}
            </span>
          ))}
        </div>

        <div className="space-screen-frame" style={frameStyle} aria-hidden="true">
          <SpaceBackdrop idPrefix="scr" />
          <span className="space-screen-label">ORBITAL LINK // OPEN</span>
          <div className="space-screen-cracks" style={{ opacity: breakProgress }}>
            {CRACKS.map((crack, index) => (
              <span
                key={index}
                style={{
                  left: `${crack.x}%`,
                  top: `${crack.y}%`,
                  width: `${crack.l}%`,
                  transform: `rotate(${crack.r}deg) scaleX(${breakProgress.toFixed(3)})`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="space-shard-field" style={{ opacity: shardOpacity }} aria-hidden="true">
          {SHARDS.map((shard, index) => (
            <span
              key={index}
              className="space-shard"
              style={{
                transform: `translate(-50%, -50%) translate3d(${(shard.x * shardTravel).toFixed(1)}vw, ${(shard.y * shardTravel).toFixed(1)}vh, 0) rotate(${(shard.r * shardTravel).toFixed(1)}deg) scale(${(shard.s * (0.4 + shardTravel * 0.6)).toFixed(3)})`,
              }}
            />
          ))}
        </div>

        {/* The same rig sits inside the opening card, tumbles through the
            fullscreen fall, then crosses the broken frame for the finale. */}
        <div className={`space-astronaut-rig ${isLanded ? "is-landed" : ""}`} style={rigStyle}>
          <svg className="space-astronaut-svg" viewBox="0 0 1000 520">
            <AstronautFigure isWaving={isWaving} />
          </svg>
        </div>

        {/* Holographic greeting, fades in once the astronaut has landed */}
        <div className={`space-dialog-bubble ${isWaving ? "bubble-active" : ""}`} style={dialogStyle}>
          <div className="dialog-badge">
            <span className="badge-dot" />
            <span>DEEP SPACE TELEMETRY // ORBITAL STATION</span>
          </div>

          <div className="dialog-content">
            <h3 className="dialog-greeting">
              &ldquo;HI! 👋 COME JOIN US ON THE NEXT MISSION.&rdquo;
            </h3>
            <p className="dialog-text">
              Engineering high-reliability embedded platforms, Linux BSPs, and autonomous edge runtimes from ground to orbit.
            </p>
          </div>

          <div className="dialog-actions">
            <a
              href={`mailto:${contactInfo.email}?subject=Deep%20Space%20Project%20Inquiry`}
              className="btn btn-primary btn-sm space-action-btn"
            >
              Start a Conversation <span aria-hidden="true">↗</span>
            </a>
            <a
              href={contactInfo.github}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm space-action-btn"
            >
              Explore Repos <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
