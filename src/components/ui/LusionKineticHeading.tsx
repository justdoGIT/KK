import { useEffect, useRef, useState, type CSSProperties, type JSX, type ReactNode } from "react";
import { useMotionMode } from "../../motion/use-motion-mode.ts";

type HeadingPart = { text: string; kinetic?: boolean; theme?: boolean };

type LusionKineticHeadingProps = {
  text?: string;
  children?: ReactNode;
  /** Mixed static + animated segments, e.g. plain lead-in words plus one kinetic highlighted word. Takes priority over `text`/`children`. */
  parts?: HeadingPart[];
  as?: "h1" | "h2" | "h3" | "span" | "div";
  className?: string;
  kicker?: string;
  subtitle?: string;
  /** rise: words slide up · scatter: letters fly in from all around · cascade: letters flip down, then a glint sweeps. */
  variant?: "rise" | "scatter" | "cascade";
};

const GOLDEN_ANGLE = 2.39996; // radians; spreads letter origins evenly around a circle

function letterStyle(variant: "scatter" | "cascade", order: number): CSSProperties {
  if (variant === "cascade") {
    return { "--letter-delay": `${order * 28}ms` } as CSSProperties;
  }
  const angle = order * GOLDEN_ANGLE;
  const radius = 38 + (order % 4) * 9; // vw / vh: well outside the heading
  return {
    "--letter-x": `${(Math.cos(angle) * radius).toFixed(1)}vw`,
    "--letter-y": `${(Math.sin(angle) * radius * 0.8).toFixed(1)}vh`,
    "--letter-r": `${((order * 47) % 540) - 270}deg`,
    "--letter-delay": `${order * 35}ms`,
  } as CSSProperties;
}

export function LusionKineticHeading({
  text,
  children,
  parts,
  as: Component = "h2",
  className = "",
  kicker,
  subtitle,
  variant = "rise",
}: LusionKineticHeadingProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const enhanced = useMotionMode() === "enhanced";

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enhanced) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [enhanced]);

  const words = (text ?? "").split(" ");

  // Renders one animated word: letters split for scatter/cascade, whole word for rise.
  // `theme` swaps the gradient fill for a solid themed color+glow on each letter —
  // combining background-clip:text with the cascade's 3D rotateX transform corrupts
  // the first glyph in Chromium, so themed letters never use the gradient clip.
  const processTextNode = (word: string, key: number, letterOffset: number, theme?: boolean) => (
    <span key={key} className="kinetic-word-mask" aria-hidden="true">
      <span className="kinetic-word-inner" style={{ transitionDelay: `${key * 0.045}s` }}>
        {variant === "rise" ? word : [...word].map((char, index) => (
          <span
            key={index}
            className={theme ? "kinetic-letter kinetic-letter-theme" : "kinetic-letter"}
            style={letterStyle(variant as "scatter" | "cascade", letterOffset + index)}
          >
            {char}
          </span>
        ))}&nbsp;
      </span>
    </span>
  );

  let titleContent: ReactNode;
  let ariaLabel = text ?? "";

  if (parts && parts.length > 0) {
    ariaLabel = parts.map((part) => part.text).join("");
    let letterOffset = 0;
    let kineticWordIdx = 0;
    titleContent = parts.map((part, pIdx) => {
      if (!part.kinetic) {
        return (
          <span key={`static-${pIdx}`} className="kinetic-word-static">
            {part.text}
          </span>
        );
      }
      return part.text.split(" ").filter((w) => w.length > 0).map((word) => {
        const node = processTextNode(word, kineticWordIdx, letterOffset, part.theme);
        letterOffset += word.length;
        kineticWordIdx += 1;
        return node;
      });
    });
  } else if (children) {
    titleContent = children;
  } else {
    titleContent = words.map((word, wIdx) => processTextNode(word, wIdx, words.slice(0, wIdx).join("").length));
  }

  return (
    <div
      ref={containerRef}
      className={`lusion-kinetic-heading-wrap kinetic-${variant} ${enhanced ? "is-kinetic" : ""} ${isVisible || !enhanced ? "is-revealed" : ""} ${className}`}
    >
      {kicker && (
        <div className="lusion-kinetic-kicker">
          <span className="kicker-pulse-dot" />
          <span>{kicker}</span>
        </div>
      )}

      <Component className="lusion-kinetic-title" aria-label={ariaLabel}>
        {titleContent}
      </Component>

      {subtitle && (
        <p className="lusion-kinetic-subtitle">
          {subtitle}
        </p>
      )}
    </div>
  );
}
