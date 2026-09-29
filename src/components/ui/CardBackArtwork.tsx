import { type JSX } from "react";

export function CardBackArtwork(): JSX.Element {
  return (
    <svg
      viewBox="0 0 320 480"
      className="card-back-svg"
      role="img"
      aria-label="Ornate geometric circuit card back"
    >
      <defs>
        <radialGradient id="cardBackGrad" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="60%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </radialGradient>
      </defs>

      {/* Deep Royal Cobalt Blue Substrate */}
      <rect width="320" height="480" rx="20" fill="url(#cardBackGrad)" />

      {/* Outer White Border Frame */}
      <rect
        x="16"
        y="16"
        width="288"
        height="448"
        rx="14"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.5"
      />

      {/* Inner Inset Geometric Frame */}
      <rect
        x="26"
        y="26"
        width="268"
        height="428"
        rx="10"
        fill="none"
        stroke="rgba(255, 255, 255, 0.85)"
        strokeWidth="2"
      />

      {/* Corner Filigree / Art Deco Symmetry */}
      {/* Top-Left Corner */}
      <g stroke="#ffffff" strokeWidth="2" fill="none">
        <path d="M 30 70 A 40 40 0 0 1 70 30" />
        <path d="M 30 90 A 60 60 0 0 1 90 30" />
        <line x1="30" y1="30" x2="85" y2="85" strokeWidth="1.5" />
        <circle cx="58" cy="58" r="5" fill="#ffffff" />
      </g>

      {/* Top-Right Corner */}
      <g stroke="#ffffff" strokeWidth="2" fill="none">
        <path d="M 290 70 A 40 40 0 0 0 250 30" />
        <path d="M 290 90 A 60 60 0 0 0 230 30" />
        <line x1="290" y1="30" x2="235" y2="85" strokeWidth="1.5" />
        <circle cx="262" cy="58" r="5" fill="#ffffff" />
      </g>

      {/* Bottom-Left Corner */}
      <g stroke="#ffffff" strokeWidth="2" fill="none">
        <path d="M 30 410 A 40 40 0 0 0 70 450" />
        <path d="M 30 390 A 60 60 0 0 0 90 450" />
        <line x1="30" y1="450" x2="85" y2="395" strokeWidth="1.5" />
        <circle cx="58" cy="422" r="5" fill="#ffffff" />
      </g>

      {/* Bottom-Right Corner */}
      <g stroke="#ffffff" strokeWidth="2" fill="none">
        <path d="M 290 410 A 40 40 0 0 1 250 450" />
        <path d="M 290 390 A 60 60 0 0 1 230 450" />
        <line x1="290" y1="450" x2="235" y2="395" strokeWidth="1.5" />
        <circle cx="262" cy="422" r="5" fill="#ffffff" />
      </g>

      {/* Diagonal Ray Sunburst Lines radiating from Center */}
      <g stroke="rgba(255, 255, 255, 0.7)" strokeWidth="2">
        <line x1="80" y1="160" x2="160" y2="240" />
        <line x1="60" y1="180" x2="160" y2="240" />
        <line x1="40" y1="200" x2="160" y2="240" />
        <line x1="240" y1="160" x2="160" y2="240" />
        <line x1="260" y1="180" x2="160" y2="240" />
        <line x1="280" y1="200" x2="160" y2="240" />
        <line x1="80" y1="320" x2="160" y2="240" />
        <line x1="60" y1="300" x2="160" y2="240" />
        <line x1="40" y1="280" x2="160" y2="240" />
        <line x1="240" y1="320" x2="160" y2="240" />
        <line x1="260" y1="300" x2="160" y2="240" />
        <line x1="280" y1="280" x2="160" y2="240" />
      </g>

      {/* Central Diamond Frame */}
      <polygon
        points="160,130 250,240 160,350 70,240"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3.5"
      />
      <polygon
        points="160,145 235,240 160,335 85,240"
        fill="none"
        stroke="rgba(255, 255, 255, 0.6)"
        strokeWidth="1.5"
      />

      {/* Central Medallion Emblem */}
      <rect
        x="115"
        y="195"
        width="90"
        height="90"
        rx="22"
        fill="#1e3a8a"
        stroke="#ffffff"
        strokeWidth="3.5"
      />

      {/* Emblem Inner Glow Circle */}
      <circle cx="160" cy="240" r="32" fill="none" stroke="#ffffff" strokeWidth="2" />

      {/* Custom Monogram 'KP' Logo on Center of Card */}
      <g fill="#ffffff">
        {/* K */}
        <path d="M 144 224 L 144 256 M 154 224 L 144 240 L 155 256" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* P */}
        <path d="M 164 224 L 164 256 M 164 224 L 174 224 C 179 224 179 238 174 238 L 164 238" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* Geometric Pin Dots */}
      <circle cx="160" cy="115" r="4" fill="#ffffff" />
      <circle cx="160" cy="365" r="4" fill="#ffffff" />
      <circle cx="45" cy="240" r="4" fill="#ffffff" />
      <circle cx="275" cy="240" r="4" fill="#ffffff" />
    </svg>
  );
}
