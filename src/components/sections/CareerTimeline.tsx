import { useState, type JSX } from "react";
import { career } from "../../content/career.ts";
import { Disclosure } from "../ui/Disclosure.tsx";
import { RobotEvolutionCanvas } from "../../scene/career/RobotEvolutionCanvas.tsx";
import { ROBOT_STAGES, type RobotStageId } from "../../scene/career/robot-stages.ts";

function mapEntryToStage(index: number): RobotStageId {
  if (index === 0) return 3; // SYMX.AI: Full Transformer Mech
  if (index === 1) return 2; // Vestel: Edge AI Systems Mesh
  if (index === 2) return 1; // Dozee: Obstacle Avoider Rover
  return 0; // Earlier: Wall Follower Bot
}

export function CareerTimeline(): JSX.Element {
  const [activeStage, setActiveStage] = useState<RobotStageId>(3);
  const meta = ROBOT_STAGES[activeStage] ?? ROBOT_STAGES[3];

  return (
    <section
      aria-label="Career timeline"
      className="career-section"
      id="career"
    >
      <div className="section-header">
        <h2>Career &amp; Systems Evolution</h2>
        <p className="section-subtitle">
          Nine years of embedded Linux, RTOS, and edge AI engineering — mapped as a 3D robotics evolution from line followers to humanoid transformers.
        </p>
      </div>

      {/* 3D Robot Journey Stage Viewer */}
      <div className="robot-evolution-container">
        <div className="robot-stage-display">
          <RobotEvolutionCanvas stageId={activeStage} />

          {/* Interactive HUD Overlay */}
          <div className="robot-hud-overlay">
            <div className="robot-hud-top">
              <span className="robot-hud-badge">{meta.codename}</span>
              <span className="robot-hud-era">{meta.era}</span>
            </div>

            <div className="robot-hud-bottom">
              <h3 className="robot-hud-title">{meta.name}</h3>
              <p className="robot-hud-desc">{meta.description}</p>
              <div className="robot-spec-tags">
                {meta.specs.map((spec) => (
                  <span key={spec} className="robot-spec-tag">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stage Selector Pills */}
        <div className="robot-stage-selector" role="tablist" aria-label="Robot evolution stages">
          {ROBOT_STAGES.map((stage) => (
            <button
              key={stage.id}
              type="button"
              role="tab"
              aria-selected={activeStage === stage.id}
              className={`robot-stage-pill ${activeStage === stage.id ? "active" : ""}`}
              onClick={() => setActiveStage(stage.id as RobotStageId)}
            >
              <span className="pill-step">STAGE 0{stage.id + 1}</span>
              <span className="pill-label">{stage.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Career Timeline Disclosures */}
      <div className="timeline">
        {career.map((entry, index) => {
          const entryStage = mapEntryToStage(index);
          return (
            <div
              key={entry.id}
              className={`timeline-entry ${activeStage === entryStage ? "is-active-stage" : ""}`}
            >
              <div className="timeline-marker" aria-hidden="true" />
              <div className="timeline-content">
                <Disclosure
                  id={entry.id}
                  summary={
                    <span className="timeline-summary">
                      <span className="timeline-period">{entry.period}</span>
                      <span className="timeline-role-org">
                        <span className="timeline-title">{entry.title}</span>
                        <span className="timeline-sep" aria-hidden="true">•</span>
                        <span className="timeline-org">{entry.organization}</span>
                      </span>
                    </span>
                  }
                >
                  <div className="timeline-detail">
                    <div className="timeline-stage-banner">
                      <span className="stage-banner-dot" aria-hidden="true" />
                      <span>CONNECTED ROBOTICS STAGE: {ROBOT_STAGES[entryStage].codename}</span>
                    </div>
                    <p className="timeline-desc">{entry.summary}</p>
                    <h4>Accomplishments</h4>
                    <ul className="timeline-list">
                      {entry.accomplishments.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                    <h4>Technologies</h4>
                    <ul className="tag-list">
                      {entry.technologies.map((tech) => (
                        <li key={tech} className="tag">
                          {tech}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Disclosure>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
