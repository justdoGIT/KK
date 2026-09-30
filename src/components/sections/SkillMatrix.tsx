import { type JSX } from "react";
import { InteractiveTerminal } from "../ui/InteractiveTerminal.tsx";
import { SkillDomainsReveal } from "./SkillDomainsReveal.tsx";
import { DiceUnfold } from "../ui/DiceUnfold.tsx";

export function SkillMatrix(): JSX.Element {
  return (
    <section
      aria-label="Skill matrix"
      className="skills-section"
      id="skills"
    >
      {/* Dice-to-Cross unfold animation: experience stats summary. */}
      <DiceUnfold />

      {/* Cinematic Interactive Scroll/Typing Terminal -- owns its own
          pinned section heading so the heading stays visible alongside
          the terminal while it's maximized/scrolling. */}
      <div className="skills-terminal-container">
        <InteractiveTerminal />
      </div>

      {/* Pinned domain grid: the 7 category cards open one by one on
          scroll, then the full 4 + 3 grid holds before the page moves on. */}
      <SkillDomainsReveal />
    </section>
  );
}
