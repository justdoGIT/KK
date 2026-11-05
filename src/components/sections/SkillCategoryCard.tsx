import { useRef, type JSX } from "react";
import { useCardSpotlight } from "../../motion/card-spotlight.ts";
import { type SkillCategory } from "../../content/skills.ts";
import { CategoryIllustration } from "../ui/CategoryIllustrations.tsx";

export function SkillCategoryCard({ category, interactive = true }: { category: SkillCategory; interactive?: boolean }): JSX.Element {
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useCardSpotlight(cardRef, spotlightRef, interactive);

  return (
    <div
      ref={cardRef}
      className="skill-category-card"
    >
      <div ref={spotlightRef} className="skill-card-spotlight" aria-hidden="true" />

      <div className="skill-cat-header">
        <span className="skill-cat-prompt">❯</span>
        <h3 className="skill-cat-title">{category.label}</h3>
      </div>

      <div className="skill-cat-illustration-wrap">
        <CategoryIllustration categoryId={category.id} />
      </div>

      <div className="skill-chips-wrap">
        {category.skills.map((skill, idx) => (
          <span
            key={skill}
            className="skill-badge-chip"
            style={{ "--ci": idx } as React.CSSProperties}
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
