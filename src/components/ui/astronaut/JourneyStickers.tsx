import { type JSX, type ReactNode, type Ref } from "react";

// Pop-art stickers that burst around the landed astronaut (Lusion floats its
// own sticker set in 3D; these are original embedded-systems themed badges).

const OUTLINE = { stroke: "#ffffff", strokeWidth: 6, strokeLinejoin: "round" as const, paintOrder: "stroke" as const };
const INK = { stroke: "#0b0d12", strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

type Sticker = { id: string; x: number; y: number; size: number; rotate: number; delay: number; art: ReactNode };

const STICKERS: readonly Sticker[] = [
  {
    id: "chip", x: 9, y: 24, size: 104, rotate: -12, delay: 0,
    art: (
      <>
        {[22, 38, 54, 70].map((p) => (
          <g key={p} {...INK}>
            <line x1={p + 4} y1="6" x2={p + 4} y2="18" />
            <line x1={p + 4} y1="82" x2={p + 4} y2="94" />
            <line x1="6" y1={p + 4} x2="18" y2={p + 4} />
            <line x1="82" y1={p + 4} x2="94" y2={p + 4} />
          </g>
        ))}
        <rect x="16" y="16" width="68" height="68" rx="14" fill="#ffd23f" {...OUTLINE} />
        <rect x="16" y="16" width="68" height="68" rx="14" fill="none" {...INK} />
        <circle cx="38" cy="44" r="5" fill="#0b0d12" />
        <circle cx="62" cy="44" r="5" fill="#0b0d12" />
        <path d="M34 58 Q50 72 66 58" fill="none" {...INK} />
      </>
    ),
  },
  {
    id: "bolt", x: 20, y: 9, size: 70, rotate: 14, delay: 0.1,
    art: <path d="M58 4 L22 54 H46 L38 96 L80 40 H54 Z" fill="#fff04d" {...OUTLINE} />,
  },
  {
    id: "rocket", x: 86, y: 20, size: 96, rotate: 22, delay: 0.05,
    art: (
      <>
        <path d="M50 6 C70 22 74 48 66 72 H34 C26 48 30 22 50 6 Z" fill="#ff4d5e" {...OUTLINE} />
        <circle cx="50" cy="38" r="9" fill="#9be7ff" {...INK} />
        <path d="M34 60 L20 80 L36 76 Z M66 60 L80 80 L64 76 Z" fill="#ffd23f" {...INK} />
        <path d="M42 74 Q50 98 58 74 Z" fill="#ff9f1c" {...INK} />
      </>
    ),
  },
  {
    id: "heart", x: 79, y: 60, size: 92, rotate: -10, delay: 0.2,
    art: (
      <>
        <path d="M50 88 C18 64 6 44 18 26 C30 10 46 16 50 30 C54 16 70 10 82 26 C94 44 82 64 50 88 Z" fill="#ff2e63" {...OUTLINE} />
        <path d="M30 40 H42 L48 30 L56 52 L62 40 H72" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    id: "antenna", x: 10, y: 66, size: 90, rotate: 8, delay: 0.15,
    art: (
      <>
        <path d="M50 44 L34 94 H66 Z" fill="#7df9ff" {...OUTLINE} />
        <circle cx="50" cy="40" r="8" fill="#0b0d12" />
        <path d="M30 22 Q20 40 30 58 M70 22 Q80 40 70 58 M18 12 Q2 40 18 68 M82 12 Q98 40 82 68" fill="none" stroke="#7df9ff" strokeWidth="6" strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "gear", x: 90, y: 80, size: 84, rotate: 0, delay: 0.3,
    art: (
      <>
        <path
          d="M44 4 H56 L58 16 L68 20 L78 12 L88 22 L80 32 L84 42 L96 44 V56 L84 58 L80 68 L88 78 L78 88 L68 80 L58 84 L56 96 H44 L42 84 L32 80 L22 88 L12 78 L20 68 L16 58 L4 56 V44 L16 42 L20 32 L12 22 L22 12 L32 20 L42 16 Z"
          fill="#b388ff"
          {...OUTLINE}
        />
        <circle cx="50" cy="50" r="14" fill="#ffffff" {...INK} />
      </>
    ),
  },
  {
    id: "code", x: 25, y: 82, size: 100, rotate: -8, delay: 0.25,
    art: (
      <>
        <path d="M10 18 H90 V70 H46 L26 90 V70 H10 Z" fill="#ffffff" {...OUTLINE} />
        <path d="M10 18 H90 V70 H46 L26 90 V70 H10 Z" fill="none" {...INK} />
        <path d="M36 32 L24 44 L36 56 M64 32 L76 44 L64 56 M54 28 L46 60" fill="none" {...INK} />
      </>
    ),
  },
  {
    id: "robot", x: 67, y: 10, size: 86, rotate: -16, delay: 0.12,
    art: (
      <>
        <line x1="50" y1="6" x2="50" y2="22" {...INK} />
        <circle cx="50" cy="8" r="5" fill="#ff4d5e" {...INK} />
        <rect x="16" y="22" width="68" height="58" rx="16" fill="#3ddc97" {...OUTLINE} />
        <rect x="28" y="36" width="44" height="24" rx="8" fill="#0b0d12" />
        <circle cx="40" cy="48" r="5" fill="#7df9ff" />
        <circle cx="60" cy="48" r="5" fill="#7df9ff" />
        <path d="M38 70 H62" {...INK} />
      </>
    ),
  },
  {
    id: "battery", x: 93, y: 44, size: 66, rotate: 76, delay: 0.35,
    art: (
      <>
        <rect x="20" y="10" width="60" height="84" rx="10" fill="#0b0d12" {...OUTLINE} />
        <rect x="38" y="2" width="24" height="10" rx="3" fill="#0b0d12" />
        {[20, 40, 60].map((y) => (
          <rect key={y} x="30" y={y + 4} width="40" height="14" rx="3" fill="#3ddc97" />
        ))}
      </>
    ),
  },
  {
    id: "planet", x: 4, y: 45, size: 88, rotate: -20, delay: 0.4,
    art: (
      <>
        <circle cx="50" cy="50" r="28" fill="#ff9f1c" {...OUTLINE} />
        <ellipse cx="50" cy="52" rx="46" ry="12" fill="none" stroke="#b388ff" strokeWidth="7" />
        <circle cx="42" cy="40" r="5" fill="#ffd23f" />
      </>
    ),
  },
  {
    id: "star", x: 58, y: 88, size: 60, rotate: 12, delay: 0.45,
    art: <path d="M50 4 L61 38 L96 38 L68 60 L78 94 L50 73 L22 94 L32 60 L4 38 L39 38 Z" fill="#ffd23f" {...OUTLINE} />,
  },
  {
    id: "can", x: 74, y: 36, size: 92, rotate: 10, delay: 0.5,
    art: (
      <>
        <ellipse cx="50" cy="44" rx="44" ry="32" fill="#2f6bff" {...OUTLINE} />
        <path d="M30 70 L22 92 L46 74 Z" fill="#2f6bff" />
        <path d="M14 46 H26 V34 H38 V56 H50 V34 H62 V56 H74 V46 H86" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinejoin="round" />
      </>
    ),
  },
];

type JourneyStickersProps = { stickerRef: (index: number) => Ref<HTMLSpanElement> };

/** Sticker layer; each badge carries its pop delay/rotation for the scroll driver. */
export function JourneyStickers({ stickerRef }: JourneyStickersProps): JSX.Element {
  return (
    <div className="aj-stickers" aria-hidden="true">
      {STICKERS.map((sticker, index) => (
        <span
          key={sticker.id}
          ref={stickerRef(index)}
          className="aj-sticker"
          data-delay={sticker.delay}
          data-rotate={sticker.rotate}
          style={{ left: `${sticker.x}%`, top: `${sticker.y}%`, width: sticker.size, height: sticker.size }}
        >
          <svg viewBox="0 0 100 100" className="aj-sticker-art">
            {sticker.art}
          </svg>
        </span>
      ))}
    </div>
  );
}
