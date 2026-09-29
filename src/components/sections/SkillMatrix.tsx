import { useState, type JSX } from "react";
import { skillCategories } from "../../content/skills.ts";
import { InteractiveTerminal } from "../ui/InteractiveTerminal.tsx";
import { SkillCategoryCard } from "./SkillCategoryCard.tsx";

export function SkillMatrix(): JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredCategories =
    selectedCategory === "all"
      ? skillCategories
      : skillCategories.filter((c) => c.id === selectedCategory);

  return (
    <section
      aria-label="Skill matrix"
      className="skills-section"
      id="skills"
    >
      {/* Cinematic Interactive Scroll/Typing Terminal -- owns its own
          pinned section heading so the heading stays visible alongside
          the terminal while it's maximized/scrolling. */}
      <div className="skills-terminal-container">
        <InteractiveTerminal />
      </div>

      {/* Category Filter Pills */}
      <div className="skills-filter-row" role="tablist" aria-label="Skill categories">
        <button
          type="button"
          role="tab"
          aria-selected={selectedCategory === "all"}
          className={`skills-filter-pill ${selectedCategory === "all" ? "active" : ""}`}
          onClick={() => setSelectedCategory("all")}
        >
          All Domains ({skillCategories.reduce((acc, c) => acc + c.skills.length, 0)})
        </button>
        {skillCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={selectedCategory === cat.id}
            className={`skills-filter-pill ${selectedCategory === cat.id ? "active" : ""}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label} ({cat.skills.length})
          </button>
        ))}
      </div>

      {/* Skills Interactive Badges Grid */}
      <div className="skills-categories-grid">
        {filteredCategories.map((cat) => (
          <SkillCategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </section>
  );
}
