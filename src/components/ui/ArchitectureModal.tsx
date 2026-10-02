import { useEffect, useState, type JSX } from "react";
import { useArchitectureDialog } from "./useArchitectureDialog.ts";

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
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const containerRef = useArchitectureDialog(isOpen && architecture !== null, onClose);
  useEffect(() => {
    if (copyStatus === "idle") return;
    const timer = window.setTimeout(() => setCopyStatus("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  if (!isOpen || !architecture) return null;

  const copyMermaid = async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(architecture.mermaidCode);
      setCopyStatus("copied");
    } catch {
      // Keep the selection inside the dialog and restore focus after the
      // legacy fallback. A false return is a denied copy, not success.
      const focused = document.activeElement;
      const textarea = document.createElement("textarea");
      textarea.value = architecture.mermaidCode;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      containerRef.current?.appendChild(textarea);
      textarea.select();
      try {
        setCopyStatus(document.execCommand("copy") ? "copied" : "failed");
      } catch {
        setCopyStatus("failed");
      } finally {
        textarea.remove();
        if (focused instanceof HTMLElement) focused.focus({ preventScroll: true });
      }
    }
  };

  const selectedNodeInfo = architecture.nodes.find((n) => n.id === activeNode);

  // Node box width is fixed for visual consistency across every diagram;
  // sized to comfortably fit the longest node label seen across all case
  // studies ("ACP Client Protocol", 19 chars) at the 9.5px monospace font.
  const NODE_BOX_W = 130;
  const NODE_BOX_HALF = NODE_BOX_W / 2;

  // Same sizing formula used both to size the canvas below and to render the
  // actual label chips further down — kept in one place so they can't drift.
  const chipWidth = (protocol: string) => Math.max(48, protocol.length * 5.4 + 16);

  // Canvas coordinate space is wider than the visual box/label sizes would
  // suggest: node.x/y are percentages, and widening this virtual space (while
  // node box width stays fixed in px) opens real gaps between same-row nodes
  // so protocol-label chips fit between boxes instead of overlapping them.
  // Computed PER DIAGRAM from the actual node spacing and protocol-label
  // lengths in the data, with a comfortable extra margin, instead of a fixed
  // constant that only happened to fit the diagrams it was tested against —
  // a 4-node row with long labels (career-automation) needs more room than a
  // 3-node row with short ones (industrial-edge).
  const COMFORTABLE_MARGIN_PX = 16;
  let neededViewW = 720;
  architecture.nodes.forEach((node) => {
    (node.connectsTo ?? []).forEach((targetId) => {
      const target = architecture.nodes.find((n) => n.id === targetId);
      // Only same-row (horizontal) edges are width-constrained; a vertical
      // branch's label only needs vertical room, handled by fixed VIEW_H.
      if (!target || target.y !== node.y || !node.protocol) return;
      const spacingPct = Math.abs(target.x - node.x);
      if (spacingPct <= 0) return;
      const requiredHalfGapPx = NODE_BOX_HALF + chipWidth(node.protocol) / 2 + COMFORTABLE_MARGIN_PX;
      neededViewW = Math.max(neededViewW, (200 * requiredHalfGapPx) / spacingPct);
    });
  });
  const VIEW_W = neededViewW;
  const VIEW_H = VIEW_W * (250 / 720);

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
        ref={containerRef}
        className="arch-modal-container"
        tabIndex={-1}
        data-lenis-prevent
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
              <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="arch-modal-svg" role="group" aria-label="Expanded Architecture Flow">
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
                      onFocus={() => setActiveNode(node.id)}
                      onBlur={() => setActiveNode(null)}
                      role="group"
                      aria-label={node.label}
                      tabIndex={0}
                    >
                      <g className="arch-node-inner">
                        {/* Node Box */}
                        <rect
                          x={-NODE_BOX_HALF}
                          y="-22"
                          width={NODE_BOX_W}
                          height="44"
                          rx="8"
                          fill={isHovered ? "#1e293b" : "#0f172a"}
                          stroke={isHovered ? "#38bdf8" : "rgba(255, 255, 255, 0.15)"}
                          strokeWidth={isHovered ? "2" : "1"}
                          filter={isHovered ? "url(#glow)" : undefined}
                        />
                        {/* Node Top Color Accent Bar */}
                        <rect
                          x={-NODE_BOX_HALF}
                          y="-22"
                          width={NODE_BOX_W}
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
                  // Auto-size the chip to its text so short labels ("I2C")
                  // don't waste width and long ones ("Semantic Vector") still
                  // fit within the gap the dynamic VIEW_W opened up above —
                  // same formula used to size that gap in the first place.
                  const chipW = chipWidth(edge.protocol);
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
                  {copyStatus === "copied" ? "✓ Copied to Clipboard" : copyStatus === "failed" ? "Copy unavailable" : "Copy Mermaid Code"}
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
