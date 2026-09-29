import { useState, useEffect, useRef, type JSX } from "react";
import {
  getApprovedCaseStudies,
  type DiagramNode,
  type CaseStudyDetail,
} from "../../content/case-studies.ts";
import { CardBackArtwork } from "../ui/CardBackArtwork.tsx";
import {
  ArchitectureModal,
  type ArchitectureDetail,
} from "../ui/ArchitectureModal.tsx";

// flipSpeed < 1 = flip completes before full scroll travel (faster).
// Outer/edge cards flip fast; inner cards flip slower.
// startRotZ/X = organic stacking angle in the deck.
// targetRotZ/X = 0 → all cards land perfectly upright.
// targetX is NOT hardcoded — computed from stage width each resize
// so card 0's LEFT EDGE aligns with the "Products with a pulse" heading.
// Gap always fills whatever room is left after 4 cards fit the stage width —
// .lusion-deck-inner caps at max-width:1440px, so this maxes out around 64px
// at full width (vs. the old fixed 12px), spanning card 0→3 edge-to-edge.
const CARD_W   = 300; // must match .lusion-card-isolated-cell width in CSS
// Left-edge offsets of each card relative to card 0's left edge

const CARD_CONFIGS = [
  { startRotZ: -9.0, startRotX:  2.2, startX: -30, targetY: 0, targetRotZ: 0, targetRotX: 0, delay: 0.00, flipSpeed: 0.62, wobbleY: -6.0 },
  { startRotZ: -3.2, startRotX: -1.4, startX: -10, targetY: 0, targetRotZ: 0, targetRotX: 0, delay: 0.07, flipSpeed: 0.82, wobbleY:  3.5 },
  { startRotZ:  3.5, startRotX:  1.6, startX:  10, targetY: 0, targetRotZ: 0, targetRotX: 0, delay: 0.13, flipSpeed: 0.82, wobbleY: -3.5 },
  { startRotZ:  9.5, startRotX: -2.4, startX:  30, targetY: 0, targetRotZ: 0, targetRotX: 0, delay: 0.20, flipSpeed: 0.62, wobbleY:  6.0 },
];

function MiniArchDiagram({ nodes, onExpand }: { nodes: DiagramNode[]; onExpand: () => void }) {
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
      <svg viewBox="0 0 280 110" className="deck-mini-svg" role="img" aria-label="Architecture dataflow diagram">
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
            <rect x={`${node.x - 12}%`} y={`${node.y - 9}%`} width="24%" height="18%" rx="4" fill="#060910" stroke="rgba(56, 189, 248, 0.6)" strokeWidth="1" />
            <rect x={`${node.x - 12}%`} y={`${node.y - 9}%`} width="24%" height="2.5" rx="1" fill="#38bdf8" />
            <text x={`${node.x}%`} y={`${node.y + 2}%`} textAnchor="middle" fontSize="4.4" fontFamily="monospace" fontWeight="700" fill="#ffffff">{node.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function CaseStudies(): JSX.Element {
  const studies = getApprovedCaseStudies();
  const [selectedArch, setSelectedArch] = useState<ArchitectureDetail | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef   = useRef<HTMLDivElement>(null);
  // Computed targetX per card: card 0 left edge = heading left edge.
  // Recalculated whenever the stage resizes (viewport change, font zoom, etc.).
  const [targetXs, setTargetXs] = useState<number[]>([-468, -156, 156, 468]);
  // One ref per card cell — used for non-passive wheel interception
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Align card 0's left edge with the heading's left edge.
  // Cards are positioned via translate3d(X,…) where X is offset from stage center.
  // card_i center from stage left  = CARD_OFFSETS[i] + CARD_W/2
  // targetX[i] = (card_i center from stage left) - stageWidth/2
  useEffect(() => {
    const compute = () => {
      const w = stageRef.current?.offsetWidth ?? 0;
      if (w === 0) return;
      // CSS shrinks .lusion-card-isolated-cell to 275px below 1200px viewport
      // (see components.css @media max-width: 1200px) — match it here so the
      // alignment/gap math uses the real rendered card width, not a stale 300px.
      const cardW = window.matchMedia("(max-width: 1200px)").matches ? 275 : CARD_W;
      // Fill available room exactly: 4 cards span the full stage width,
      // never overflowing it, with an even gap between each.
      const gap = Math.max(0, (w - 4 * cardW) / 3);
      const offsets = [
        0,
        cardW + gap,
        (cardW + gap) * 2,
        (cardW + gap) * 3,
      ];
      const half = w / 2;
      setTargetXs(offsets.map((off) => off + cardW / 2 - half));
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (stageRef.current) ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, []);

  // Page-scroll tracker (passive — only reads position)
  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const totalScroll = rect.height - window.innerHeight;
      if (totalScroll <= 0) return;
      const progress = Math.max(0, Math.min(1, -rect.top / (totalScroll * 0.75)));
      setScrollProgress(progress);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Non-passive wheel listeners: when a card is front-visible, redirect
  // wheel delta into the card's scroll body and block page scroll.
  // Only blocks page scroll while the card body has remaining content
  // in the scroll direction; at the limits the page scrolls normally.
  useEffect(() => {
    const cleanups: (() => void)[] = [];

    cellRefs.current.forEach((cell) => {
      if (!cell) return;

      const handler = (e: WheelEvent) => {
        // Check the data attribute set during render
        if (cell.dataset.frontVisible !== "true") return;

        const body = cell.querySelector<HTMLElement>(".card-front-scroll-body");
        if (!body) return;

        const { scrollTop, scrollHeight, clientHeight } = body;
        const scrollable = scrollHeight - clientHeight;
        if (scrollable <= 0) return; // card content fits — let page scroll

        const goingDown = e.deltaY > 0;
        const atTop    = scrollTop <= 0 && !goingDown;
        const atBottom = scrollTop >= scrollable - 1 && goingDown;

        if (!atTop && !atBottom) {
          e.preventDefault(); // block page scroll
          e.stopPropagation();
          body.scrollTop += e.deltaY;
        }
      };

      cell.addEventListener("wheel", handler, { passive: false });
      cleanups.push(() => cell.removeEventListener("wheel", handler));
    });

    return () => cleanups.forEach((fn) => fn());
  }); // re-runs every render so new refs are always wired up

  const openArchitectureModal = (study: CaseStudyDetail, index: number) => {
    if (!study) return;
    setSelectedArch({
      title: study.record.publicTitle,
      number: `/${String(index + 1).padStart(2, "0")}`,
      context: study.context,
      mermaidCode: study.mermaidDiagram,
      nodes: study.diagram,
      protocols: study.protocols,
      dataFlowDescription: study.dataFlowDescription,
    });
  };

  const jumpToProgress = (targetProgress: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const totalScroll = (section.offsetHeight - window.innerHeight) * 0.75;
    const targetY = section.offsetTop + targetProgress * totalScroll;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  const categories = [
    "01 // HARDWARE BRING-UP",
    "02 // DISTRIBUTED FLEET",
    "03 // AGENTIC WORKFLOW",
    "04 // SYSTEM AUTOMATION",
  ];

  return (
    <section ref={sectionRef} aria-label="Case studies" className="lusion-deck-scroll-section" id="work">
      <div className="lusion-deck-sticky-stage">
        <svg className="lusion-bg-ribbon" viewBox="0 0 1440 600" aria-hidden="true">
          <path d="M -100,140 Q 720,500 1540,100" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="32" />
        </svg>

        <div className="lusion-deck-inner">
          <div className="lusion-deck-header">
            <div className="lusion-header-left">
              <span className="lusion-section-pill">SELECTED MISSIONS // EVIDENCE-BACKED PLATFORMS</span>
              <h2 className="lusion-deck-title">Products with a pulse.</h2>
              <p className="lusion-deck-subtitle">
                Scroll to deal and fan out the mission cards — revealing verified hardware bring-up,
                distributed fleet runtimes, and autonomous agent architectures.
              </p>
            </div>

            <div className="lusion-deck-scrubber">
              <button type="button" className={`lusion-scrub-btn ${scrollProgress < 0.3 ? "active" : ""}`} onClick={() => jumpToProgress(0)}>
                <span>Stack Deck</span>
              </button>
              <button type="button" className={`lusion-scrub-btn ${scrollProgress >= 0.3 ? "active" : ""}`} onClick={() => jumpToProgress(1)}>
                <span>Fan Out Cards</span>
              </button>
            </div>
          </div>

          <div className="lusion-cards-stage" ref={stageRef}>
            {studies.map((study, idx) => {
              const cfg = CARD_CONFIGS[idx] ?? CARD_CONFIGS[0];
              const cardP = Math.max(0, Math.min(1, (scrollProgress - cfg.delay) / (1.0 - cfg.delay)));
              // Each card's flip completes at a different scroll point (flipSpeed).
              // Edge cards (0,3) finish the 180° flip early; inner cards (1,2) finish later.
              const flipP = Math.min(1, cardP / cfg.flipSpeed);
              const rotY = flipP * 180 + Math.sin(flipP * Math.PI) * cfg.wobbleY;
              const isFrontVisible = rotY >= 90;

              // During travel: organic tilt from start angles back to 0 at landing.
              const currentX = THREE_lerp(cfg.startX, targetXs[idx] ?? 0, cardP);
              const currentY = THREE_lerp(0, cfg.targetY, cardP);
              const currentRotZ = THREE_lerp(cfg.startRotZ, cfg.targetRotZ, cardP);
              const currentRotX = THREE_lerp(cfg.startRotX, cfg.targetRotX, cardP);
              const currentScale = THREE_lerp(0.93, 1.0, cardP);
              const liftZ = Math.sin(cardP * Math.PI) * 70;

              return (
                <div
                  key={study.record.slug}
                  ref={(el) => { cellRefs.current[idx] = el; }}
                  className="lusion-card-isolated-cell"
                  data-front-visible={isFrontVisible ? "true" : "false"}
                  style={{
                    transform: `translate3d(${currentX}px, ${currentY}px, ${liftZ}px) rotateX(${currentRotX}deg) rotateZ(${currentRotZ}deg) scale(${currentScale})`,
                    zIndex: Math.round(10 + liftZ * 0.2 + (isFrontVisible ? idx : 4 - idx)),
                  }}
                  onClick={() => { if (!isFrontVisible) jumpToProgress(1); }}
                >
                  <div className="lusion-card-flipper" style={{ transform: `rotateY(${rotY}deg)` }}>
                    <div className="lusion-card-face lusion-card-front" style={{ pointerEvents: isFrontVisible ? "auto" : "none", opacity: isFrontVisible ? 1 : 0 }}>
                      <div className="card-front-top">
                        <div className="card-front-title-group">
                          <span className="card-front-category">{categories[idx]}</span>
                          <h3 className="card-front-title">{study.record.publicTitle}</h3>
                        </div>
                        <span className="card-front-badge">VERIFIED</span>
                      </div>

                      <div className="card-front-scroll-body">
                        <p className="card-front-context">{study.context}</p>

                        <div className="card-front-diagram-wrap">
                          <div className="diagram-title-bar"><span>DATAFLOW ARCHITECTURE</span></div>
                          <MiniArchDiagram nodes={study.diagram} onExpand={() => openArchitectureModal(study, idx)} />
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
                    </div>

                    <div className="lusion-card-face lusion-card-back" style={{ pointerEvents: !isFrontVisible ? "auto" : "none", opacity: !isFrontVisible ? 1 : 0 }}>
                      <CardBackArtwork />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ArchitectureModal isOpen={selectedArch !== null} onClose={() => setSelectedArch(null)} architecture={selectedArch} />
    </section>
  );
}

function THREE_lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}
