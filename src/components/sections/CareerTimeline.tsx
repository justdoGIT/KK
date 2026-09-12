import { career } from "../../content/career.ts";
import { Disclosure } from "../ui/Disclosure.tsx";

export function CareerTimeline() {
  return (
    <section
      aria-label="Career timeline"
      className="career-section"
      id="career"
    >
      <div className="section-header">
        <h2>Career</h2>
        <p className="section-subtitle">
          Nine years of embedded Linux and systems work across five companies.
        </p>
      </div>
      <div className="timeline">
        {career.map((entry) => (
          <div key={entry.id} className="timeline-entry">
            <div className="timeline-marker" aria-hidden="true" />
            <div className="timeline-content">
              <Disclosure
                id={entry.id}
                summary={
                  <span className="timeline-summary">
                    <span className="timeline-period">{entry.period}</span>
                    <span className="timeline-title">{entry.title}</span>
                    <span className="timeline-org">{entry.organization}</span>
                  </span>
                }
              >
                <div className="timeline-detail">
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
        ))}
      </div>
    </section>
  );
}
