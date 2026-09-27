import { useState, type JSX } from "react";
import { skillCategories } from "../../content/skills.ts";
import { InteractiveTerminal } from "../ui/InteractiveTerminal.tsx";

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
      <div className="section-header">
        <p className="section-kicker">Technical Capabilities</p>
        <h2>Interactive System Console &amp; Toolchains</h2>
        <p className="section-subtitle">
          Live developer terminal simulation and comprehensive skill matrix —
          inspecting verified languages, heterogeneous SoC platforms, wireless protocols, and automated CI/CD pipelines.
        </p>
      </div>

      {/* Cinematic Interactive Scroll/Typing Terminal */}
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
          <div key={cat.id} className="skill-category-card">
            <div className="skill-cat-header">
              <span className="skill-cat-prompt">❯</span>
              <h3 className="skill-cat-title">{cat.label}</h3>
            </div>
            <div className="skill-chips-wrap">
              {cat.skills.map((skill) => (
                <span key={skill} className="skill-badge-chip">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
