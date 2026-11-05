import { Children, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { toggleReadingTour, useReadingTour } from "../../motion/reading-tour-state.ts";
import "../../styles/mobile-boards.css";

export const MOBILE_BOARD_QUERY = "(max-width: 767px)";

type MobileBoardCarouselProps = {
  label: string;
  children: ReactNode;
  onIndexChange?: (index: number) => void;
};

/** Native touch scrolling keeps horizontal swipes independent of page scrolling. */
export function MobileBoardCarousel({ label, children, onIndexChange }: MobileBoardCarouselProps) {
  const slides = Children.toArray(children);
  const carouselRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const { status } = useReadingTour();
  const paused = status !== "playing";
  const viewportId = useId();
  const enhanced = useMotionMode() === "enhanced";

  const goTo = (index: number) => {
    const viewport = viewportRef.current;
    const slide = viewport?.children[index] as HTMLElement | undefined;
    if (!viewport || !slide) return;
    viewport.scrollTo({ left: slide.offsetLeft, behavior: enhanced ? "smooth" : "instant" });
  };

  // Keep the same board in view when the address bar or phone orientation changes.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => {
      const slide = viewport.children[activeRef.current] as HTMLElement | undefined;
      if (slide) viewport.scrollTo({ left: slide.offsetLeft, behavior: "instant" });
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [slides.length]);


  return (
    <div ref={carouselRef} className="mobile-board-carousel" role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={viewportRef}
        id={viewportId}
        className="mobile-board-viewport"
        tabIndex={0}
        aria-label={`${label} slides`}
        data-lenis-prevent
        onScroll={() => {
          const viewport = viewportRef.current;
          if (!viewport) return;
          let closest = 0;
          let distance = Infinity;
          Array.from(viewport.children).forEach((slide, index) => {
            const next = Math.abs((slide as HTMLElement).offsetLeft - viewport.scrollLeft);
            if (next < distance) {
              closest = index;
              distance = next;
            }
          });
          if (closest === activeRef.current) return;
          activeRef.current = closest;
          setActive(closest);
          onIndexChange?.(closest);
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          const next = event.key === "ArrowRight" ? active + 1
            : event.key === "ArrowLeft" ? active - 1
            : event.key === "Home" ? 0
            : event.key === "End" ? slides.length - 1 : null;
          if (next === null) return;
          event.preventDefault();
          goTo(Math.max(0, Math.min(slides.length - 1, next)));
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="mobile-board-slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}`}
            tabIndex={0}
          >
            {slide}
          </div>
        ))}
      </div>
      <div className="mobile-board-controls">
        <button type="button" aria-label="Previous board" aria-controls={viewportId} disabled={active === 0} onClick={() => goTo(active - 1)}>←</button>
        <div className="mobile-board-pagination">
          <div className="mobile-board-status">
            <div className="mobile-board-position">
              <div className="mobile-board-dots" aria-hidden="true">
                {slides.map((_, index) => <span key={index} className={active === index ? "is-active" : undefined} />)}
              </div>
              <span className="mobile-board-count" aria-live={enhanced && !paused ? "off" : "polite"} aria-atomic="true">{active + 1} / {slides.length}</span>
            </div>
          </div>
          {enhanced && slides.length > 1 && (
            <button
              data-tour-control
              type="button"
              aria-label={paused ? "Resume reading tour" : "Pause reading tour"}
              aria-controls={viewportId}
              onClick={toggleReadingTour}
            >
              {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
            </button>
          )}
        </div>
        <button type="button" aria-label="Next board" aria-controls={viewportId} disabled={active === slides.length - 1} onClick={() => goTo(active + 1)}>→</button>
      </div>
      <p className="mobile-board-hint">Swipe for more · Scroll inside long boards · Touch to pause the tour</p>
    </div>
  );
}
