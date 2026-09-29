import { useState, useEffect, useRef, type CSSProperties, type JSX } from "react";
import { contactInfo } from "../../content/contact.ts";
import { SpaceBackdrop, AstronautFigure } from "./AstronautArtwork.tsx";

// Total scroll distance (viewport-heights) the journey stays pinned for.
const TOTAL_SCROLL = 2.4;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

type Key = { t: number; v: number };

// Piecewise-linear interpolation across hand-placed keyframes -- lets the
// whole storyboard (jump out of the small screen, arc across, land) be
// driven directly by scroll position instead of a CSS animation timeline,
// so it can never run ahead of or behind the user's actual scroll input.
function segLerp(t: number, keys: Key[]): number {
  for (let i = 0; i < keys.length - 1; i++) {
    if (t >= keys[i].t && t <= keys[i + 1].t) {
      const span = keys[i + 1].t - keys[i].t || 1;
      const local = (t - keys[i].t) / span;
      return keys[i].v + (keys[i + 1].v - keys[i].v) * local;
    }
  }
  return keys[keys.length - 1].v;
}

// Keyframes expressed as % of the astronaut rig's own box (translate) or
// plain scale/degrees. Story: idle tiny inside the screen -> jump up-right
// and out -> long arcing travel across open space -> settle centered,
// waving, as the "HI" dialog fades in.
const SCALE_KEYS: Key[] = [
  { t: 0, v: 0.22 }, { t: 0.12, v: 0.22 }, { t: 0.3, v: 0.55 },
  { t: 0.45, v: 0.72 }, { t: 0.65, v: 1.0 }, { t: 0.78, v: 1.1 }, { t: 1, v: 1 },
];
const X_KEYS: Key[] = [
  { t: 0, v: 0 }, { t: 0.12, v: 0 }, { t: 0.3, v: 60 },
  { t: 0.45, v: 100 }, { t: 0.6, v: 40 }, { t: 0.78, v: -20 }, { t: 1, v: 0 },
];
const Y_KEYS: Key[] = [
  { t: 0, v: 0 }, { t: 0.12, v: 0 }, { t: 0.28, v: -120 },
  { t: 0.45, v: -70 }, { t: 0.65, v: -45 }, { t: 0.85, v: -40 }, { t: 1, v: -40 },
];
const ROT_KEYS: Key[] = [
  { t: 0, v: 0 }, { t: 0.12, v: 0 }, { t: 0.28, v: -16 },
  { t: 0.45, v: -6 }, { t: 0.7, v: 2 }, { t: 1, v: 0 },
];
const FRAME_OPACITY_KEYS: Key[] = [{ t: 0, v: 1 }, { t: 0.12, v: 1 }, { t: 0.38, v: 0 }, { t: 1, v: 0 }];
const FRAME_SCALE_KEYS: Key[] = [{ t: 0, v: 1 }, { t: 0.12, v: 1 }, { t: 0.4, v: 0.8 }, { t: 1, v: 0.8 }];
const BG_OPACITY_KEYS: Key[] = [{ t: 0, v: 0 }, { t: 0.25, v: 0 }, { t: 0.5, v: 1 }, { t: 1, v: 1 }];
const DIALOG_OPACITY_KEYS: Key[] = [{ t: 0, v: 0 }, { t: 0.82, v: 0 }, { t: 1, v: 1 }];
const DIALOG_Y_KEYS: Key[] = [{ t: 0, v: 20 }, { t: 0.82, v: 20 }, { t: 1, v: 0 }];

export function AstronautSpaceJourney(): JSX.Element {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [journeyProgress, setJourneyProgress] = useState(0);

  // Single RAF-throttled scroll listener: native "scroll" can fire many
  // times per animation frame, and each call here rewrites several inline
  // transform/opacity strings. Without coalescing to one write per frame,
  // this visibly flickered/strobed instead of tracking the scrollbar
  // smoothly (same root cause as the terminal's reveal flicker).
  useEffect(() => {
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
  }, []);

  const t = journeyProgress;
  const isWaving = t > 0.8;
  const isLanded = t >= 0.995;

  const frameOpacity = segLerp(t, FRAME_OPACITY_KEYS);
  const frameScale = segLerp(t, FRAME_SCALE_KEYS);
  const bgOpacity = segLerp(t, BG_OPACITY_KEYS);
  const rigX = segLerp(t, X_KEYS);
  const rigY = segLerp(t, Y_KEYS);
  const rigScale = segLerp(t, SCALE_KEYS);
  const rigRot = segLerp(t, ROT_KEYS);
  const dialogOpacity = segLerp(t, DIALOG_OPACITY_KEYS);
  const dialogY = segLerp(t, DIALOG_Y_KEYS);

  const frameStyle: CSSProperties = {
    opacity: frameOpacity,
    transform: `translate(-50%, -50%) scale(${frameScale.toFixed(3)})`,
    pointerEvents: frameOpacity > 0.05 ? "auto" : "none",
  };
  const bgStyle: CSSProperties = { opacity: bgOpacity };
  const rigStyle: CSSProperties = {
    transform: `translate(-50%, -50%) translate3d(${rigX.toFixed(1)}%, ${rigY.toFixed(1)}%, 0) scale(${rigScale.toFixed(3)}) rotate(${rigRot.toFixed(2)}deg)`,
  };
  const dialogStyle: CSSProperties = {
    opacity: dialogOpacity,
    transform: `translateX(-50%) translateY(${dialogY.toFixed(1)}px)`,
  };

  return (
    <div ref={sectionRef} className="space-journey-scroll-section" style={{ height: `${TOTAL_SCROLL * 100}vh` }}>
      <div className="space-journey-sticky-stage">
        {/* Full-stage deep space backdrop -- crossfades in as the astronaut
            breaks out of the small screen and the journey opens up. */}
        <div className="space-fullbg-layer" style={bgStyle} aria-hidden="true">
          <SpaceBackdrop idPrefix="bg" />
        </div>

        {/* Small "screen" bezel -- the astronaut starts tiny inside this,
            then the frame shrinks and fades as it jumps out. */}
        <div className="space-screen-frame" style={frameStyle} aria-hidden="true">
          <SpaceBackdrop idPrefix="scr" />
        </div>

        {/* Astronaut rig -- always on top, unclipped, travels beyond the
            frame's bounds as journeyProgress advances. */}
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
