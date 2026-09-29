import { useState, useEffect, useRef, type JSX } from "react";
import {
  getApprovedCaseStudies,
  type CaseStudyDetail,
} from "../../content/case-studies.ts";
import { CardBackArtwork } from "../ui/CardBackArtwork.tsx";
import {
  ArchitectureModal,
  type ArchitectureDetail,
} from "../ui/ArchitectureModal.tsx";

type LusionCardData = {
  id: string;
  category: string;
  title: string;
  glyph: string;
  bullets: string[];
  metrics: { label: string; value: string }[];
  studyDetail: CaseStudyDetail;
};

export function CaseStudies(): JSX.Element {
  const studies = getApprovedCaseStudies();
  const [selectedArch, setSelectedArch] = useState<ArchitectureDetail | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const cardsData: LusionCardData[] = [
    {
      id: "industrial-edge",
      category: "HARDWARE BRING-UP",
      title: "INDUSTRIAL EDGE",
      glyph: "◆",
      bullets: [
        "Qualcomm QCM2290 SoC Bring-Up",
        "Hardened U-Boot & Linux 5.15 LTS",
        "Atomic OSTree Dual-Slot A/B OTA",
        "PMIC Watchdog Power Recovery",
        "JTAG & Digital Scope Diagnostics",
        "99.9% Production Field Uptime",
      ],
      metrics: [
        { label: "UPTIME", value: "99.9%" },
        { label: "OTA METHOD", value: "Atomic OSTree" },
      ],
      studyDetail: studies[0],
    },
    {
      id: "fleet-runtime",
      category: "DISTRIBUTED FLEET",
      title: "FLEET RUNTIME",
      glyph: "▲",
      bullets: [
        "Heterogeneous Cluster Controller",
        "Actix-Web Typed Worker Protocol",
        "Stratum-TSDB Zero-Copy Telemetry",
        "Slurm Scheduler Orchestration",
        "Real-Time WSS Fleet Dashboard",
        "Self-Healing Autonomous Failover",
      ],
      metrics: [
        { label: "ARCHITECTURE", value: "Agent + API + Dash" },
        { label: "PROTOCOL", value: "Typed Worker RPC" },
      ],
      studyDetail: studies[1],
    },
    {
      id: "personal-harness",
      category: "AGENTIC WORKFLOW",
      title: "AGENT HARNESS",
      glyph: "◼",
      bullets: [
        "Canonical Task AST State Machine",
        "Agent Client Protocol (ACP) JSON-RPC",
        "LSP & AST CodeMod Engine",
        "Sandboxed Subprocess Execution",
        "Crash Recovery & Rollout Gates",
        "Automated Benchmark Test Suite",
      ],
      metrics: [
        { label: "MODES", value: "TUI + Headless + ACP" },
        { label: "RECOVERY", value: "Rollout Controls" },
      ],
      studyDetail: studies[2],
    },
    {
      id: "career-automation",
      category: "SYSTEM AUTOMATION",
      title: "CAREER AGENT",
      glyph: "★",
      bullets: [
        "Multi-Source ATS REST Scrapers",
        "SQLite Pipeline State Engine",
        "Semantic Vector Profile Matcher",
        "LLM Resume & Cover Letter Tailoring",
        "Dry-Run Safety Gate Invariant",
        "Multi-Interface: CLI + MCP Server",
      ],
      metrics: [
        { label: "SOURCES", value: "Greenhouse / Lever / ATS" },
        { label: "SAFETY", value: "Dry-Run by Default" },
      ],
      studyDetail: studies[3],
    },
  ];

  // Scroll tracking to calculate 0..1 progress through pinned track
  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const totalScroll = rect.height - window.innerHeight;
      if (totalScroll <= 0) return;

      const progress = Math.max(0, Math.min(1, -rect.top / totalScroll));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    const totalScroll = section.offsetHeight - window.innerHeight;
    const targetY = section.offsetTop + targetProgress * totalScroll;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      aria-label="Case studies"
      className="lusion-deck-scroll-section"
      id="work"
    >
      <div className="lusion-deck-sticky-stage">
        {/* Curved Background Ribbon Path (Lusion Style) */}
        <svg className="lusion-bg-ribbon" viewBox="0 0 1440 600" aria-hidden="true">
          <path
            d="M -100,120 Q 720,480 1540,80"
            fill="none"
            stroke="rgba(255, 255, 255, 0.22)"
            strokeWidth="28"
          />
        </svg>

        <div className="lusion-deck-inner">
          {/* Top Section Header */}
          <div className="lusion-deck-header">
            <div className="lusion-header-left">
              <span className="lusion-section-pill">SELECTED MISSIONS // 04 PRODUCTION PLATFORMS</span>
              <h2 className="lusion-deck-title">Products with a pulse.</h2>
            </div>

            {/* Step Selector Controls */}
            <div className="lusion-deck-scrubber">
              {cardsData.map((card, idx) => (
                <button
                  key={card.id}
                  type="button"
                  className={`lusion-scrub-btn ${
                    scrollProgress >= idx / 4 ? "active" : ""
                  }`}
                  onClick={() => jumpToProgress((idx + 0.8) / 4)}
                >
                  <span className="scrub-num">0{idx + 1}</span>
                  <span className="scrub-name">{card.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3D Playing Card Stage with Flip & Deal Animation */}
          <div className="lusion-cards-stage">
            {cardsData.map((card, idx) => {
              // Calculate individual card flip progress (0 to 1)
              const startP = idx * 0.22;
              const endP = startP + 0.28;
              const cardP = Math.max(0, Math.min(1, (scrollProgress - startP) / (endP - startP)));

              // Card is dealt from deck to final horizontal slot
              const isFlipped = cardP >= 0.5;
              const rotY = cardP * 180; // 0deg (back) to 180deg (front)

              // Stacked deck offsets when P = 0
              const deckOffsetX = (idx - 1.5) * 28;
              const deckRotZ = (idx - 1.5) * 3.5;

              // Final horizontal row offsets when fully dealt (P = 1)
              // Slot indices: 0 = -480px, 1 = -160px, 2 = +160px, 3 = +480px
              const targetSlotX = (idx - 1.5) * 340;

              const currentX = THREE_lerp(deckOffsetX, targetSlotX, cardP);
              const currentRotZ = THREE_lerp(deckRotZ, 0, cardP);
              const currentScale = THREE_lerp(0.92, 1.0, cardP);

              return (
                <div
                  key={card.id}
                  className={`lusion-card-3d-wrapper ${isFlipped ? "card-revealed" : ""}`}
                  style={{
                    transform: `translate3d(${currentX}px, 0px, 0px) rotateY(${rotY}deg) rotateZ(${currentRotZ}deg) scale(${currentScale})`,
                    zIndex: isFlipped ? 10 + idx : 4 - idx,
                  }}
                  onClick={() => {
                    if (!isFlipped) jumpToProgress((idx + 0.8) / 4);
                  }}
                >
                  {/* FRONT FACE (White Editorial Luxury Playing Card) */}
                  <div className="lusion-card-face lusion-card-front">
                    {/* Top Section */}
                    <div className="card-front-top">
                      <div className="card-front-title-group">
                        <span className="card-front-category">{card.category}</span>
                        <h3 className="card-front-title">{card.title}</h3>
                      </div>
                      <span className="card-front-glyph" aria-hidden="true">{card.glyph}</span>
                    </div>

                    {/* Dotted-Line Bullet List */}
                    <ul className="card-front-bullets">
                      {card.bullets.map((bullet, bIdx) => (
                        <li key={bIdx}>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Verified Metrics Strip */}
                    <div className="card-front-metrics">
                      {card.metrics.map((m) => (
                        <div key={m.label} className="card-metric-col">
                          <span className="card-metric-label">{m.label}</span>
                          <span className="card-metric-val">{m.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Inverted Symbol & Architecture Pop-Out Button */}
                    <div className="card-front-bottom">
                      <div className="card-front-inverted-title">
                        <span className="inverted-glyph" aria-hidden="true">{card.glyph}</span>
                        <span>{card.title}</span>
                      </div>
                      <button
                        type="button"
                        className="card-arch-popout-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openArchitectureModal(card.studyDetail, idx);
                        }}
                      >
                        Flow Diagram [↗]
                      </button>
                    </div>
                  </div>

                  {/* BACK FACE (Ornate Royal Cobalt Blue Geometric Circuit Artwork) */}
                  <div className="lusion-card-face lusion-card-back">
                    <CardBackArtwork />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pop-Out Architecture Lightbox Modal with Mermaid view */}
      <ArchitectureModal
        isOpen={selectedArch !== null}
        onClose={() => setSelectedArch(null)}
        architecture={selectedArch}
      />
    </section>
  );
}

function THREE_lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}
