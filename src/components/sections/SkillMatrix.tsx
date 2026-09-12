import { skillCategories } from "../../content/skills.ts";

export function SkillMatrix() {
  return (
    <section
      aria-label="Skill matrix"
      className="skills-section"
      id="skills"
    >
      <div className="section-header">
        <h2>Skills</h2>
        <p className="section-subtitle">
          Terminal-style disclosure of tools and platforms.
        </p>
      </div>
      <div className="terminal" role="list">
        <div className="terminal-bar" aria-hidden="true">
          <span className="terminal-dot" />
          <span className="terminal-dot" />
          <span className="terminal-dot" />
          <span className="terminal-title">skills@portfolio</span>
        </div>
        <div className="terminal-body">
          {skillCategories.map((cat) => (
            <div key={cat.id} className="terminal-line" role="listitem">
              <span className="terminal-prompt">$</span>
              <span className="terminal-label">{cat.label}:</span>
              <span className="terminal-value">
                {cat.skills.join(" · ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
