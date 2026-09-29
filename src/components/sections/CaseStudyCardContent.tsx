import type { JSX } from "react";
import type { DiagramNode, CaseStudyDetail } from "../../content/case-studies.ts";

export function MiniArchDiagram({ nodes, onExpand }: { nodes: DiagramNode[]; onExpand: () => void }) {
  // Auto-size node boxes from the actual data instead of a fixed 24% width.
  // Diagrams with 4 top-row nodes (e.g. career-automation) pack tighter than
  // ones with 3 (e.g. personal-agent-harness), so a fixed box width overlaps
  // on the tighter layouts. Finding the tightest gap within any shared row
  // and deriving box width from it keeps every diagram's boxes clear of each
  // other regardless of node count, while leaving the widest-spaced diagram
  // (30% steps) at exactly its previous 24% width — unchanged reference look.
  const rows = new Map<number, number[]>();
  nodes.forEach((n) => {
    const xs = rows.get(n.y) ?? [];
    xs.push(n.x);
    rows.set(n.y, xs);
  });
  let minGap = 100;
  rows.forEach((xs) => {
    const sorted = [...xs].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      minGap = Math.min(minGap, sorted[i] - sorted[i - 1]);
    }
  });
  const boxW = Math.max(12, Math.min(24, minGap * 0.8));
  const boxH = 22;

  return (
    <div
      className="deck-mini-diagram-box"
      onClick={(e) => { e.stopPropagation(); onExpand(); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onExpand(); } }}
      role="button"
      tabIndex={0}
      aria-label="Click to pop out full architecture flow and Mermaid diagram"
    >
      <div className="diagram-popout-badge"><span>CLICK TO POP OUT [↗]</span></div>
      <svg viewBox="0 0 280 160" className="deck-mini-svg" role="img" aria-label="Architecture dataflow diagram">
        <defs>
          <linearGradient id="dealWireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {nodes.flatMap((node) => {
          const targets = node.connectsTo ?? [];
          return targets.map((targetId) => {
            const target = nodes.find((n) => n.id === targetId);
            if (!target) return null;
            return (
              <g key={`${node.id}-${targetId}`}>
                <line x1={`${node.x}%`} y1={`${node.y}%`} x2={`${target.x}%`} y2={`${target.y}%`} stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1.2" />
                <line x1={`${node.x}%`} y1={`${node.y}%`} x2={`${target.x}%`} y2={`${target.y}%`} stroke="url(#dealWireGrad)" strokeWidth="1.6" strokeDasharray="4 4" className="arch-animated-wire" />
              </g>
            );
          });
        })}
        {nodes.map((node) => (
          <g key={node.id}>
            <rect x={`${node.x - boxW / 2}%`} y={`${node.y - boxH / 2}%`} width={`${boxW}%`} height={`${boxH}%`} rx="4" fill="#060910" stroke="rgba(56, 189, 248, 0.6)" strokeWidth="1" />
            <rect x={`${node.x - boxW / 2}%`} y={`${node.y - boxH / 2}%`} width={`${boxW}%`} height="2.5" rx="1" fill="#38bdf8" />
            <text x={`${node.x}%`} y={`${node.y + 2}%`} textAnchor="middle" fontSize="5.6" fontFamily="monospace" fontWeight="700" fill="#ffffff">{node.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function CardFrontContent({
  study,
  idx,
  category,
  onExpand,
}: {
  study: CaseStudyDetail;
  idx: number;
  category: string;
  onExpand: () => void;
}): JSX.Element {
  return (
    <>
      <div className="card-front-top">
        <div className="card-front-title-group">
          <span className="card-front-category">{category}</span>
          <h3 className="card-front-title">{study.record.publicTitle}</h3>
        </div>
        <span className="card-front-badge">VERIFIED</span>
      </div>

      <div className="card-front-scroll-body">
        <p className="card-front-context">{study.context}</p>

        <div className="card-front-diagram-wrap">
          <div className="diagram-title-bar"><span>DATAFLOW ARCHITECTURE</span></div>
          <MiniArchDiagram nodes={study.diagram} onExpand={onExpand} />
        </div>

        <div className="card-front-details">
          <span className="details-heading">CONSTRAINTS &amp; INVARIANTS:</span>
          <ul className="card-front-bullets">
            {study.constraints.map((c, cIdx) => (
              <li key={cIdx}>
                <span className="bullet-dot" aria-hidden="true">▹</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-front-details">
          <span className="details-heading">SOLUTION ARCHITECTURE:</span>
          <p className="card-solution-text">{study.solution}</p>
        </div>

        <div className="card-front-metrics">
          {study.results.map((m) => (
            <div key={m.label} className="card-metric-col">
              <span className="card-metric-label">{m.label}</span>
              <span className="card-metric-val">{m.value}</span>
            </div>
          ))}
        </div>

        {study.record.links.length > 0 && (
          <div className="card-front-links">
            {study.record.links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="card-study-link">
                {link.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="card-front-bottom">
        <span className="card-footer-number">MISSION /{String(idx + 1).padStart(2, "0")}</span>
        <span className="card-footer-hint">CLICK DIAGRAM TO EXPAND</span>
      </div>
    </>
  );
}
