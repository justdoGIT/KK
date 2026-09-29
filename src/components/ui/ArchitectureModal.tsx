import { useState, useEffect, type JSX } from "react";

export type ArchitectureDetail = {
  title: string;
  number: string;
  context: string;
  mermaidCode: string;
  nodes: Array<{ id: string; label: string; x: number; y: number; protocol?: string; connectsTo?: string[] }>;
  protocols: string[];
  dataFlowDescription: string;
};

type ArchitectureModalProps = {
  isOpen: boolean;
  onClose: () => void;
  architecture: ArchitectureDetail | null;
};

export function ArchitectureModal({
  isOpen,
  onClose,
  architecture,
}: ArchitectureModalProps): JSX.Element | null {
  const [viewMode, setViewMode] = useState<"visual" | "mermaid">("visual");
  const [copied, setCopied] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !architecture) return null;

  const copyMermaid = () => {
    navigator.clipboard.writeText(architecture.mermaidCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const selectedNodeInfo = architecture.nodes.find((n) => n.id === activeNode);

  // Precomputed once per render, reused by the wires pass and the labels pass
  // (labels render AFTER nodes so protocol chips paint on top, not under, node boxes).
  // Canvas coordinate space is wider than the visual box/label sizes would
  // suggest: node.x/y are percentages, and widening this virtual space (while
  // node box width stays fixed in px) opens real gaps between same-row nodes
  // so protocol-label chips fit between boxes instead of overlapping them.
  const VIEW_W = 720;
  const VIEW_H = 250;

  const edges = architecture.nodes.flatMap((node) =>
    (node.connectsTo ?? []).map((targetId) => {
      const target = architecture.nodes.find((n) => n.id === targetId);
      if (!target) return null;
      const x1 = (node.x / 100) * VIEW_W;
      const y1 = (node.y / 100) * VIEW_H;
      const x2 = (target.x / 100) * VIEW_W;
      const y2 = (target.y / 100) * VIEW_H;
      return {
        key: `${node.id}-${targetId}`,
        x1, y1, x2, y2,
        midX: (x1 + x2) / 2,
        midY: (y1 + y2) / 2,
        protocol: node.protocol,
      };
    }),
  ).filter((e): e is NonNullable<typeof e> => e !== null);

  return (
    <div
      className="arch-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="arch-modal-title"
      onClick={onClose}
    >
      <div
        className="arch-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="arch-modal-header">
          <div className="arch-modal-title-group">
            <span className="arch-modal-badge">{architecture.number} ARCHITECTURE FLOW</span>
            <h3 id="arch-modal-title">{architecture.title}</h3>
          </div>
          <div className="arch-modal-controls">
            <div className="arch-view-toggle">
              <button
                type="button"
                className={`arch-toggle-btn ${viewMode === "visual" ? "active" : ""}`}
                onClick={() => setViewMode("visual")}
              >
                Interactive Flow
              </button>
              <button
                type="button"
                className={`arch-toggle-btn ${viewMode === "mermaid" ? "active" : ""}`}
                onClick={() => setViewMode("mermaid")}
              >
                Mermaid Code
              </button>
            </div>
            <button
              type="button"
              className="arch-modal-close"
              onClick={onClose}
              aria-label="Close architecture modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="arch-modal-body">
          {viewMode === "visual" ? (
            <div className="arch-visual-stage">
              <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="arch-modal-svg" role="img" aria-label="Expanded Architecture Flow">
                <defs>
                  <linearGradient id="busGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#818cf8" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Connection Wires (static guide + animated data stream) */}
                {edges.map((edge) => (
                  <g key={edge.key}>
                    <line
                      x1={edge.x1}
                      y1={edge.y1}
                      x2={edge.x2}
                      y2={edge.y2}
                      stroke="rgba(56, 189, 248, 0.25)"
                      strokeWidth="2"
                    />
                    <line
                      x1={edge.x1}
                      y1={edge.y1}
                      x2={edge.x2}
                      y2={edge.y2}
                      stroke="url(#busGrad)"
                      strokeWidth="2.5"
                      strokeDasharray="6 8"
                      className="arch-animated-wire"
                    />
                  </g>
                ))}

                {/* Interactive Component Nodes — outer <g> only carries the
                    positioning transform + hover handlers (never a CSS
                    transform, which would replace the attribute transform
                    and yank the hitbox out from under the cursor, causing
                    flicker). The hover "grow" scale is applied to the inner
                    <g> instead, via .arch-node-inner in CSS. */}
                {architecture.nodes.map((node) => {
                  const cx = (node.x / 100) * VIEW_W;
                  const cy = (node.y / 100) * VIEW_H;
                  const isHovered = activeNode === node.id;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${cx}, ${cy})`}
                      className="arch-node-group"
                      onMouseEnter={() => setActiveNode(node.id)}
                      onMouseLeave={() => setActiveNode(null)}
                      tabIndex={0}
                    >
                      <g className="arch-node-inner">
                        {/* Node Box */}
                        <rect
                          x="-52"
                          y="-22"
                          width="104"
                          height="44"
                          rx="8"
                          fill={isHovered ? "#1e293b" : "#0f172a"}
                          stroke={isHovered ? "#38bdf8" : "rgba(255, 255, 255, 0.15)"}
                          strokeWidth={isHovered ? "2" : "1"}
                          filter={isHovered ? "url(#glow)" : undefined}
                        />
                        {/* Node Top Color Accent Bar */}
                        <rect
                          x="-52"
                          y="-22"
                          width="104"
                          height="3"
                          rx="1"
                          fill="#38bdf8"
                        />
                        {/* Node Text */}
                        <text
                          x="0"
                          y="2"
                          textAnchor="middle"
                          fontSize="9.5"
                          fontWeight="600"
                          fontFamily="monospace"
                          fill="#f8fafc"
                        >
                          {node.label}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Protocol Label Chips — rendered LAST so they paint on top
                    of the node boxes (SVG has no z-index; paint order is
                    strictly document order). Previously these rendered
                    before the nodes and got overdrawn by adjacent boxes. */}
                {edges.map((edge) => {
                  if (!edge.protocol) return null;
                  // Auto-size the chip to its text (monospace ~4.8px/char at
                  // fontSize 8) so short labels ("I2C") don't waste width and
                  // long ones ("Secure Boot") still fit within the gap opened
                  // up between node boxes by the wider VIEW_W canvas above.
                  const chipW = Math.max(44, edge.protocol.length * 4.8 + 14);
                  return (
                    <g key={`${edge.key}-label`} transform={`translate(${edge.midX}, ${edge.midY - 8})`}>
                      <rect
                        x={-chipW / 2}
                        y="-8"
                        width={chipW}
                        height="16"
                        rx="4"
                        fill="#090d16"
                        stroke="rgba(56, 189, 248, 0.4)"
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fontSize="8"
                        fontFamily="monospace"
                        fill="#38bdf8"
                      >
                        {edge.protocol}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Node Inspector Floating Pill */}
              <div className="arch-inspector-pill">
                {selectedNodeInfo ? (
                  <span>
                    <b>NODE:</b> {selectedNodeInfo.label}{" "}
                    {selectedNodeInfo.protocol && <span>| <b>BUS:</b> {selectedNodeInfo.protocol}</span>}
                  </span>
                ) : (
                  <span>Hover over any hardware node or bus wire to inspect data flow</span>
                )}
              </div>
            </div>
          ) : (
            <div className="arch-mermaid-view">
              <div className="arch-mermaid-toolbar">
                <span className="arch-mermaid-lang">MERMAID GRAPH</span>
                <button
                  type="button"
                  className="arch-copy-btn"
                  onClick={copyMermaid}
                >
                  {copied ? "✓ Copied to Clipboard" : "Copy Mermaid Code"}
                </button>
              </div>
              <pre className="arch-mermaid-code">
                <code>{architecture.mermaidCode}</code>
              </pre>
            </div>
          )}

          {/* Data Flow Description & Protocols */}
          <div className="arch-modal-footer-info">
            <div className="arch-info-block">
              <h4>System Dataflow &amp; Invariants</h4>
              <p>{architecture.dataFlowDescription}</p>
            </div>
            <div className="arch-protocols-block">
              <h4>Busses &amp; Protocols</h4>
              <div className="arch-protocol-chips">
                {architecture.protocols.map((proto) => (
                  <span key={proto} className="arch-chip">
                    {proto}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
