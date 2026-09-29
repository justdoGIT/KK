import { useEffect, useRef, useState, type JSX } from "react";

type LusionKineticHeadingProps = {
  text: string;
  as?: "h1" | "h2" | "h3" | "span" | "div";
  className?: string;
  kicker?: string;
  subtitle?: string;
};

export function LusionKineticHeading({
  text,
  as: Component = "h2",
  className = "",
  kicker,
  subtitle,
}: LusionKineticHeadingProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

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
  }, []);

  const words = text.split(" ");

  return (
    <div
      ref={containerRef}
      className={`lusion-kinetic-heading-wrap ${isVisible ? "is-revealed" : ""} ${className}`}
    >
      {kicker && (
        <div className="lusion-kinetic-kicker">
          <span className="kicker-pulse-dot" />
          <span>{kicker}</span>
        </div>
      )}

      <Component className="lusion-kinetic-title">
        {words.map((word, wIdx) => (
          <span key={wIdx} className="kinetic-word-mask">
            <span
              className="kinetic-word-inner"
              style={{ transitionDelay: `${wIdx * 0.045}s` }}
            >
              {word}&nbsp;
            </span>
          </span>
        ))}
      </Component>

      {subtitle && (
        <p className="lusion-kinetic-subtitle">
          {subtitle}
        </p>
      )}
    </div>
  );
}
