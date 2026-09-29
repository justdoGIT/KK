import { type JSX } from "react";

// Reusable deep-space backdrop (stars + Earth horizon). Rendered twice by
// AstronautSpaceJourney (once inside the small "screen" bezel, once as the
// full-stage backdrop during the journey) -- `idPrefix` keeps each
// instance's gradient/filter ids unique so two copies can coexist in the
// same document without id collisions.
export function SpaceBackdrop({ idPrefix }: { idPrefix: string }): JSX.Element {
  return (
    <svg
      className="space-backdrop-svg"
      viewBox="0 0 1000 520"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${idPrefix}-bg`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#080e1a" />
          <stop offset="60%" stopColor="#03060c" />
          <stop offset="100%" stopColor="#010205" />
        </radialGradient>
        <linearGradient id={`${idPrefix}-atmo`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
          <stop offset="20%" stopColor="#0284c7" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#1e3a8a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#030712" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${idPrefix}-surface`} cx="40%" cy="20%" r="60%">
          <stop offset="0%" stopColor="#1e40af" />
          <stop offset="40%" stopColor="#1d4ed8" />
          <stop offset="70%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
      </defs>

      <rect width="1000" height="520" fill={`url(#${idPrefix}-bg)`} />

      <g className="space-stars" opacity="0.75">
        <circle cx="120" cy="80" r="1.2" fill="#ffffff" />
        <circle cx="280" cy="40" r="1.8" fill="#38bdf8" />
        <circle cx="450" cy="110" r="1" fill="#ffffff" />
        <circle cx="680" cy="60" r="1.5" fill="#e0f2fe" />
        <circle cx="850" cy="90" r="1.2" fill="#ffffff" />
        <circle cx="920" cy="150" r="1.6" fill="#38bdf8" />
        <circle cx="180" cy="220" r="1" fill="#ffffff" />
        <circle cx="790" cy="200" r="1.4" fill="#ffffff" />
      </g>

      <g className="earth-subsystem">
        <path
          d="M -100,530 Q 500,350 1100,530 L 1100,640 L -100,640 Z"
          fill={`url(#${idPrefix}-atmo)`}
        />
        <path
          d="M -100,540 Q 500,370 1100,540 L 1100,640 L -100,640 Z"
          fill={`url(#${idPrefix}-surface)`}
        />
      </g>
    </svg>
  );
}

// Astronaut figure only -- no SVG <filter> anywhere on this tree. The
// glove/visor "flare" sparkle is a plain layered-circle glow (bright core +
// soft translucent halo, no feGaussianBlur) instead of an SVG filter,
// because this whole group's parent gets a continuously scroll-driven
// `transform`: an SVG filter region recomputes every time an ancestor's
// transform changes, and Chromium/Firefox visibly flicker/strobe when that
// happens every animation frame. Removing the filter removes the flicker.
export function AstronautFigure({ isWaving }: { isWaving: boolean }): JSX.Element {
  return (
    <g className={`space-astronaut-figure ${isWaving ? "astronaut-waving" : ""}`}>
      <defs>
        <linearGradient id="visorReflection" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#1e3a8a" stopOpacity="0.9" />
          <stop offset="80%" stopColor="#020617" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      <ellipse cx="500" cy="370" rx="90" ry="14" fill="#000000" opacity="0.4" />

      <g className="astronaut-body">
        <rect x="440" y="210" width="120" height="110" rx="16" fill="#cbd5e1" stroke="#475569" strokeWidth="3" />
        <rect x="450" y="220" width="100" height="90" rx="10" fill="#94a3b8" />

        <path d="M 460,300 L 445,390 L 475,400 L 485,310 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
        <path d="M 515,310 L 525,400 L 555,390 L 540,300 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="2" />
        <rect x="440" y="385" width="40" height="20" rx="6" fill="#334155" />
        <rect x="520" y="385" width="40" height="20" rx="6" fill="#334155" />

        <rect x="445" y="200" width="110" height="115" rx="22" fill="#f8fafc" stroke="#94a3b8" strokeWidth="3" />
        <path d="M 460,225 H 540" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <path d="M 460,250 H 540" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <path d="M 460,275 H 540" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />

        <rect x="475" y="230" width="50" height="45" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
        <circle cx="490" cy="245" r="4" fill="#ef4444" />
        <circle cx="510" cy="245" r="4" fill="#10b981" />
        <rect x="485" y="258" width="30" height="6" rx="2" fill="#38bdf8" />

        <path d="M 445,210 C 410,240 400,270 420,300" fill="none" stroke="#f8fafc" strokeWidth="24" strokeLinecap="round" />
        <path d="M 445,210 C 410,240 400,270 420,300" fill="none" stroke="#cbd5e1" strokeWidth="16" strokeLinecap="round" />
        <circle cx="415" cy="305" r="14" fill="#334155" />

        <g className="astronaut-right-arm">
          <path d="M 555,210 C 590,200 615,160 625,130" fill="none" stroke="#f8fafc" strokeWidth="24" strokeLinecap="round" />
          <path d="M 555,210 C 590,200 615,160 625,130" fill="none" stroke="#cbd5e1" strokeWidth="16" strokeLinecap="round" />
          {/* Waving glove -- soft halo + bright core, no filter */}
          <circle cx="630" cy="120" r="22" fill="#38bdf8" opacity="0.28" />
          <circle cx="630" cy="120" r="15" fill="#38bdf8" />
          <circle cx="630" cy="120" r="13" fill="#334155" />
        </g>

        <circle cx="500" cy="170" r="42" fill="#f8fafc" stroke="#94a3b8" strokeWidth="3" />
        <ellipse cx="500" cy="168" rx="34" ry="26" fill="url(#visorReflection)" stroke="#0284c7" strokeWidth="2" />
        <ellipse cx="490" cy="160" rx="18" ry="10" fill="#ffffff" opacity="0.3" />

        {/* Visor sun flare -- soft halo + bright core, no filter */}
        <circle cx="475" cy="152" r="11" fill="#ffffff" opacity="0.25" />
        <circle cx="475" cy="152" r="6" fill="#ffffff" />
        <line x1="455" y1="152" x2="495" y2="152" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
        <line x1="475" y1="132" x2="475" y2="172" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
      </g>
    </g>
  );
}
