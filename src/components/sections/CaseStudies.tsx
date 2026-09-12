import { getApprovedCaseStudies, type DiagramNode } from "../../content/case-studies.ts";

function ArchitectureDiagram({ nodes }: { nodes: DiagramNode[] }) {
  const width = 200;
  const height = 100;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="arch-diagram"
      role="img"
      aria-label="Architecture diagram"
    >
      {nodes.flatMap((node) => {
        const targets = node.connectsTo ?? [];
        return targets.map((targetId) => {
          const target = nodes.find((n) => n.id === targetId);
          if (!target) return null;
          return (
            <line
              key={`${node.id}-${targetId}`}
              x1={`${node.x}%`}
              y1={`${node.y}%`}
              x2={`${target.x}%`}
              y2={`${target.y}%`}
              stroke="var(--color-surface-border)"
              strokeWidth="0.5"
            />
          );
        });
      })}
      {nodes.map((node) => (
        <g key={node.id}>
          <rect
            x={`${node.x - 10}%`}
            y={`${node.y - 6}%`}
            width="20%"
            height="10%"
            rx="2"
            fill="var(--color-bg-elevated)"
            stroke="var(--color-surface-border)"
            strokeWidth="0.5"
          />
          <text
            x={`${node.x}%`}
            y={`${node.y + 1}%`}
            textAnchor="middle"
            fontSize="3"
            fill="var(--color-fg-muted)"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function CaseStudies() {
  const studies = getApprovedCaseStudies();

  return (
    <section
      aria-label="Case studies"
      className="work-section"
      id="work"
    >
      <div className="section-header">
        <h2>Work</h2>
        <p className="section-subtitle">
          Evidence-backed case studies with approval and redaction review.
        </p>
      </div>
      <div className="studies-grid">
        {studies.map((study) => (
          <article key={study.record.slug} className="study-card">
            <h3>{study.record.publicTitle}</h3>
            <p className="study-context">{study.context}</p>
            <ArchitectureDiagram nodes={study.diagram} />
            <div className="study-details">
              <h4>Constraints</h4>
              <ul className="study-list">
                {study.constraints.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <h4>Solution</h4>
              <p className="study-solution">{study.solution}</p>
              <h4>Results</h4>
              <dl className="results-grid">
                {study.results.map((r) => (
                  <div key={r.label} className="result-item">
                    <dt>{r.label}</dt>
                    <dd>{r.value}</dd>
                    <span className="result-source">{r.source}</span>
                  </div>
                ))}
              </dl>
              <h4>Limitations</h4>
              <ul className="study-list study-limitations">
                {study.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
            {study.record.links.length > 0 && (
              <div className="study-links">
                {study.record.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="study-link"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
