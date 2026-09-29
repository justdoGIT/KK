import { useEffect, useRef, useState, type CSSProperties, type JSX } from "react";
import { skillCategories } from "../../content/skills.ts";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import {
  clamp01,
  easeOutCubic,
  gridColumnCount,
  useScrollFrame,
  viewportEntry,
} from "../../motion/scroll-frame.ts";
import { SkillCategoryCard } from "./SkillCategoryCard.tsx";

const ALL = "all";
// Scroll travel per card (viewport-heights) while the domain grid is pinned.
const TRAVEL_PER_CARD_VH = 45;
// Every card is fully open at this fraction of the pinned travel; the rest of
// the travel holds the complete 4 + 3 grid on screen before the page moves on.
const REVEAL_END = 0.86;
const TOTAL_SKILLS = skillCategories.reduce((acc, c) => acc + c.skills.length, 0);

function applyCardReveal(el: HTMLDivElement, t: number, index: number): void {
  el.style.setProperty("--r", t.toFixed(3));
  if (t >= 0.999) {
    el.style.opacity = "";
    el.style.transform = "";
    el.style.filter = "";
    el.classList.add("is-open");
    return;
  }
  el.classList.remove("is-open");
  const inv = 1 - t;
  const swing = index % 2 === 0 ? -1 : 1;
  el.style.opacity = t.toFixed(3);
  el.style.transform =
    `perspective(1100px) translate3d(0, ${(inv * 90).toFixed(1)}px, ${(-inv * 160).toFixed(1)}px) ` +
    `rotateX(${(-inv * 38).toFixed(2)}deg) rotateY(${(swing * inv * 10).toFixed(2)}deg) ` +
    `scale(${(0.82 + 0.18 * t).toFixed(3)})`;
  el.style.filter = inv > 0.02 ? `blur(${(inv * 10).toFixed(2)}px)` : "none";
}

function clearCardReveal(el: HTMLDivElement): void {
  el.style.removeProperty("--r");
  el.style.opacity = "";
  el.style.transform = "";
  el.style.filter = "";
  el.classList.add("is-open");
}

export function SkillDomainsReveal(): JSX.Element {
  const enhanced = useMotionMode() === "enhanced";
  const [selected, setSelected] = useState<string>(ALL);
  const pinned = enhanced && selected === ALL;

  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const visible = selected === ALL
    ? skillCategories
    : skillCategories.filter((c) => c.id === selected);
  const total = visible.length;

  useScrollFrame(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const grid = gridRef.current;
    if (!section || !stage || !grid) return;

    // Small/short viewports drop the sticky stage via CSS; fall back to
    // revealing each card as it enters the viewport, staggered by column.
    const sticky = getComputedStyle(stage).position === "sticky";
    let progress = 1;
    if (sticky) {
      const scrollable = section.offsetHeight - window.innerHeight;
      progress = scrollable > 0 ? clamp01(-section.getBoundingClientRect().top / scrollable) : 1;
    }
    const steps = (progress / REVEAL_END) * total;
    // Each card spans 2 of the 8 desktop tracks: 4 visual columns.
    const tracks = gridColumnCount(grid);
    const cols = tracks >= 8 ? tracks / 2 : tracks;
    let opened = 0;
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const local = sticky
        ? clamp01(steps - i)
        : clamp01(viewportEntry(el, 0.98, 0.62) * 1.5 - (i % cols) * 0.15);
      if (local >= 0.999) opened += 1;
      applyCardReveal(el, easeOutCubic(local), i);
    });

    if (counterRef.current) {
      counterRef.current.textContent = `${String(opened).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    }
    if (barRef.current) {
      const fill = sticky ? steps / total : opened / total;
      barRef.current.style.transform = `scaleX(${clamp01(fill).toFixed(4)})`;
    }
  }, pinned);

  // Filtered views and reduced motion show every card fully open.
  useEffect(() => {
    if (pinned) return;
    cardRefs.current.forEach((el) => el && clearCardReveal(el));
    if (counterRef.current) {
      counterRef.current.textContent = `${String(total).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    }
    if (barRef.current) barRef.current.style.transform = "scaleX(1)";
  }, [pinned, total]);

  const select = (id: string) => {
    if (id === selected) return;
    setSelected(id);
    // Pinned (tall) <-> static layout swap changes the section height;
    // re-anchor the viewport to the section top so the user stays in place.
    requestAnimationFrame(() => {
      const el = sectionRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
    });
  };

  const sectionStyle = { "--domain-travel": `${total * TRAVEL_PER_CARD_VH}vh` } as CSSProperties;

  return (
    <div
      ref={sectionRef}
      className={`skill-domains-section ${pinned ? "skill-domains-pinned" : ""}`}
      style={sectionStyle}
    >
      <div ref={stageRef} className="skill-domains-stage">
        <div className="skills-filter-row" role="tablist" aria-label="Skill categories">
          {skillCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={selected === cat.id}
              className={`skills-filter-pill ${selected === cat.id ? "active" : ""}`}
              onClick={() => select(cat.id)}
            >
              {cat.label} ({cat.skills.length})
            </button>
          ))}
          <button
            type="button"
            role="tab"
            aria-selected={selected === ALL}
            className={`skills-filter-pill ${selected === ALL ? "active" : ""}`}
            onClick={() => select(ALL)}
          >
            All Domains ({TOTAL_SKILLS})
          </button>
        </div>

        <div className="skill-domains-progress" aria-hidden="true">
          <span ref={counterRef} className="skill-domains-counter">
            {`00 / ${String(total).padStart(2, "0")}`}
          </span>
          <span className="skill-domains-track">
            <span ref={barRef} className="skill-domains-bar" />
          </span>
        </div>

        <div
          ref={gridRef}
          className={`skills-categories-grid ${total === 1 ? "is-single" : ""}`}
        >
          {visible.map((cat, idx) => (
            <div
              key={cat.id}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className="skill-card-reveal"
            >
              <SkillCategoryCard category={cat} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
