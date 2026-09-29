import { type JSX } from "react";

export function CardBackArtwork(): JSX.Element {
  return (
    <svg
      viewBox="0 0 320 480"
      className="card-back-svg"
      role="img"
      aria-label="Dark luxury circuit card back"
    >
      <defs>
        <radialGradient id="darkCardBackGrad" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="55%" stopColor="#090d16" />
          <stop offset="100%" stopColor="#04070e" />
        </radialGradient>
        <linearGradient id="goldTraceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Dark Luxury Obsidian / Sapphire Base */}
      <rect width="320" height="480" rx="20" fill="url(#darkCardBackGrad)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="2" />

      {/* Outer Cyan Border Frame */}
      <rect
        x="14"
        y="14"
        width="292"
        height="452"
        rx="14"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2.5"
      />

      {/* Inner Inset Gold Geometric Frame */}
      <rect
        x="24"
        y="24"
        width="272"
        height="432"
        rx="10"
        fill="none"
        stroke="url(#goldTraceGrad)"
        strokeWidth="1.5"
      />

      {/* Corner Filigree / Circuit Bus Symmetry */}
      {/* Top-Left */}
      <g stroke="#38bdf8" strokeWidth="1.8" fill="none">
        <path d="M 28 65 A 35 35 0 0 1 65 28" />
        <path d="M 28 85 A 55 55 0 0 1 85 28" />
        <line x1="28" y1="28" x2="80" y2="80" stroke="#fbbf24" strokeWidth="1.5" />
        <circle cx="54" cy="54" r="4.5" fill="#38bdf8" />
      </g>

      {/* Top-Right */}
      <g stroke="#38bdf8" strokeWidth="1.8" fill="none">
        <path d="M 292 65 A 35 35 0 0 0 255 28" />
        <path d="M 292 85 A 55 55 0 0 0 235 28" />
        <line x1="292" y1="28" x2="240" y2="80" stroke="#fbbf24" strokeWidth="1.5" />
        <circle cx="266" cy="54" r="4.5" fill="#38bdf8" />
      </g>

      {/* Bottom-Left */}
      <g stroke="#38bdf8" strokeWidth="1.8" fill="none">
        <path d="M 28 415 A 35 35 0 0 0 65 452" />
        <path d="M 28 395 A 55 55 0 0 0 85 452" />
        <line x1="28" y1="452" x2="80" y2="400" stroke="#fbbf24" strokeWidth="1.5" />
        <circle cx="54" cy="426" r="4.5" fill="#38bdf8" />
      </g>

      {/* Bottom-Right */}
      <g stroke="#38bdf8" strokeWidth="1.8" fill="none">
        <path d="M 292 415 A 35 35 0 0 1 255 452" />
        <path d="M 292 395 A 55 55 0 0 1 235 452" />
        <line x1="292" y1="452" x2="240" y2="400" stroke="#fbbf24" strokeWidth="1.5" />
        <circle cx="266" cy="426" r="4.5" fill="#38bdf8" />
      </g>

      {/* Golden Circuit Ray Sunburst Lines radiating from Center */}
      <g stroke="rgba(251, 191, 36, 0.55)" strokeWidth="1.5">
        <line x1="75" y1="155" x2="160" y2="240" />
        <line x1="55" y1="175" x2="160" y2="240" />
        <line x1="35" y1="195" x2="160" y2="240" />
        <line x1="245" y1="155" x2="160" y2="240" />
        <line x1="265" y1="175" x2="160" y2="240" />
        <line x1="285" y1="195" x2="160" y2="240" />
        <line x1="75" y1="325" x2="160" y2="240" />
        <line x1="55" y1="305" x2="160" y2="240" />
        <line x1="35" y1="285" x2="160" y2="240" />
        <line x1="245" y1="325" x2="160" y2="240" />
        <line x1="265" y1="305" x2="160" y2="240" />
        <line x1="285" y1="285" x2="160" y2="240" />
      </g>

      {/* Central Diamond Frame */}
      <polygon
        points="160,125 255,240 160,355 65,240"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2.5"
      />
      <polygon
        points="160,140 240,240 160,340 80,240"
        fill="none"
        stroke="url(#goldTraceGrad)"
        strokeWidth="1.5"
      />

      {/* Central Medallion Emblem */}
      <rect
        x="115"
        y="195"
        width="90"
        height="90"
        rx="20"
        fill="#090d16"
        stroke="#38bdf8"
        strokeWidth="2.5"
      />

      {/* Emblem Inner Glow Circle */}
      <circle cx="160" cy="240" r="32" fill="none" stroke="url(#goldTraceGrad)" strokeWidth="1.8" />

      {/* Monogram 'KP' Emblem */}
      <g fill="#38bdf8">
        <path d="M 144 224 L 144 256 M 154 224 L 144 240 L 155 256" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M 164 224 L 164 256 M 164 224 L 174 224 C 179 224 179 238 174 238 L 164 238" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* Circuit Via Solder Dots */}
      <circle cx="160" cy="110" r="4" fill="#fbbf24" />
      <circle cx="160" cy="370" r="4" fill="#fbbf24" />
      <circle cx="45" cy="240" r="4" fill="#fbbf24" />
      <circle cx="275" cy="240" r="4" fill="#fbbf24" />
    </svg>
  );
}
