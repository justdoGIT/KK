import { useEffect, useRef, useState, type CSSProperties, type JSX, type ReactNode } from "react";
import { useMotionMode } from "../../motion/use-motion-mode.ts";

type LusionKineticHeadingProps = {
  text?: string;
  children?: ReactNode;
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

  // Helper to process text with kinetic effects
  const processTextNode = (word: string, wIdx: number) => {
    const first = words.slice(0, wIdx).join("").length;
    return (
      <span key={wIdx} className="kinetic-word-mask" aria-hidden="true">
        <span
          className="kinetic-word-inner"
          style={{ transitionDelay: `${wIdx * 0.045}s` }}
        >
          {variant === "rise" ? word : [...word].map((char, index) => (
            <span key={index} className="kinetic-letter" style={letterStyle(variant, first + index)}>{char}</span>
          ))}&nbsp;
        </span>
      </span>
    );
  };

  const titleContent = children ? children : words.map((word, wIdx) => processTextNode(word, wIdx));

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

      <Component className="lusion-kinetic-title" aria-label={text || ""}>
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
