import { useEffect, useRef, useState, useMemo, type JSX } from "react";
import { SandToSiliconCanvas } from "../../scene/journey/SandToSiliconCanvas.tsx";

type JourneyStage = {
  id: string;
  step: string;
  chemical: string;
  eyebrow: string;
  headline: string;
  description: string;
  metrics: { label: string; value: string }[];
  tags: string[];
  ambientColor: string;
};

const STAGES: JourneyStage[] = [
  {
    id: "meteor-genesis",
    step: "01",
    chemical: "COSMIC METEOR STORM ➔ SiO₂ SAND",
    eyebrow: "01 // THE GENESIS",
    headline: "The Genesis",
    description:
      "A vast, scorching desert under an open night sky. A plasma meteor shower strikes the silica dunes — crystallizing granular quartz into glowing microchips.",
    metrics: [
      { label: "GENESIS EVENT", value: "Meteor Plasma Strike" },
      { label: "RAW MINERAL", value: "Silica Sand (SiO₂)" },
      { label: "CRYSTAL STATE", value: "Silicon Dies Forming" },
    ],
    tags: ["Meteor Shower", "Silica Sand", "Plasma Impact", "Silicon Crystallization"],
    ambientColor: "#f59e0b",
  },
  {
    id: "cold-bringup",
    step: "02",
    chemical: "PMIC SEQUENCING ➔ 480MHz CLOCK PULSE",
    eyebrow: "02 // THE FIRST HEARTBEAT",
    headline: "First Heartbeat",
    description:
      "PMIC power rails cascade in sequence (3.3V ➔ 1.8V ➔ 0.85V core). The 480MHz crystal oscillator locks and JTAG/UART signals pulse through golden PCB traces, awakening cold silicon.",
    metrics: [
      { label: "POWER RAILS", value: "3.3V ➔ 1.8V ➔ 0.85V Core" },
      { label: "OSCILLATOR", value: "480MHz Precision Crystal" },
      { label: "DIAGNOSTICS", value: "JTAG / UART Probing" },
    ],
    tags: ["Power Sequencing", "PMIC Rails", "Clock Oscillator", "JTAG / UART"],
    ambientColor: "#38bdf8",
  },
  {
    id: "kernel-boot",
    step: "03",
    chemical: "U-BOOT ➔ LINUX 5.15 ➔ ROOT-OF-TRUST",
    eyebrow: "03 // KERNEL GENESIS",
    headline: "Kernel Genesis",
    description:
      "The CPU exits reset. U-Boot initializes DDR memory, parses device tree pinmux topologies, and launches Linux 5.15 LTS. Hardware Root-of-Trust locks down the userspace.",
    metrics: [
      { label: "BOOTLOADER", value: "U-Boot 2026.04" },
      { label: "KERNEL", value: "Linux 5.15 LTS Hardened" },
      { label: "SECURITY", value: "Root-of-Trust / HSM / SELinux" },
    ],
    tags: ["U-Boot", "Device Tree", "Linux Kernel", "Secure Boot / HSM"],
    ambientColor: "#10b981",
  },
  {
    id: "peripherals-robotics",
    step: "04",
    chemical: "3D ToF VISION ➔ CAN-FD ➔ WI-FI 6 / SATELLITE",
    eyebrow: "04 // SENSORS & ACTUATORS",
    headline: "Peripherals Ignite",
    description:
      "V4L2 camera pipelines stream 3D Time-of-Flight point clouds. EtherCAT and CAN-FD motor actuators execute precision kinematics. Global communication channels open.",
    metrics: [
      { label: "VISION PIPELINE", value: "3D ToF V4L2 Video Stream" },
      { label: "MOTION BUS", value: "CAN-FD / EtherCAT 5Mbps" },
      { label: "RF COMM", value: "Wi-Fi 6E & Satellite SBD" },
    ],
    tags: ["3D ToF Vision", "CAN-FD / EtherCAT", "MediaTek MT7668", "Satellite Iridium"],
    ambientColor: "#818cf8",
  },
  {
    id: "edge-ai-neural",
    step: "05",
    chemical: "128 TOPS NPU ➔ INT8 NEURAL QUANTIZATION",
    eyebrow: "05 // NEURAL AWAKENING",
    headline: "Neural Awakening",
    description:
      "Onboard neural accelerators fire up. Quantized INT8 deep learning models execute real-time object classification, sensor fusion, and autonomous obstacle avoidance with sub-millisecond latency.",
    metrics: [
      { label: "NPU CAPACITY", value: "128 TOPS INT8 / FP8" },
      { label: "LATENCY", value: "< 2.8ms Inference Loop" },
      { label: "RUNTIMES", value: "Qualcomm SNPE / TensorRT" },
    ],
    tags: ["Hexagon NPU", "INT8 Quantization", "Sensor Fusion", "Autonomous Loops"],
    ambientColor: "#c084fc",
  },
  {
    id: "fleet-army",
    step: "06",
    chemical: "AUTONOMOUS FLEET MESH ➔ STRATUM-TSDB",
    eyebrow: "06 // SWARM ASCENDANCY",
    headline: "Swarm Intelligence",
    description:
      "The solitary board multiplies into a synchronized army spanning the globe. Zero-copy Stratum-TSDB streaming, distributed Slurm scheduling, and self-healing agentic CI/CD — one autonomous hive mind.",
    metrics: [
      { label: "FLEET SCALE", value: "Heterogeneous Multi-Node" },
      { label: "DATA INGEST", value: "Zero-Copy Stratum-TSDB" },
      { label: "ORCHESTRATION", value: "Self-Healing Agent Harness" },
    ],
    tags: ["Autonomous Fleet", "Stratum-TSDB", "Slurm Cluster", "Agentic CI/CD"],
    ambientColor: "#38bdf8",
  },
];

const SCROLL_PER_STAGE = 1.15; // viewport-heights per stage
const TOTAL_SCROLL = STAGES.length * SCROLL_PER_STAGE;

export function StoryJourney(): JSX.Element {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0); // 0..1 total progress
  const [stageIdx, setStageIdx] = useState(0);
  const [stageProgress, setStageProgress] = useState(0); // 0..1 within current stage

  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const raw = Math.max(0, Math.min(1, -rect.top / scrollable));
      setScrollProgress(raw);
      const stageF = raw * STAGES.length;
      const idx = Math.min(STAGES.length - 1, Math.floor(stageF));
      const within = Math.min(1, stageF - idx);
      setStageIdx(idx);
      setStageProgress(within);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const stage = STAGES[stageIdx];
  const nextStage = STAGES[Math.min(STAGES.length - 1, stageIdx + 1)];

  // Text fade: in for first 60%, fade out for last 20%
  const textOpacity = useMemo(() => {
    if (stageProgress < 0.6) return 1;
    return Math.max(0, 1 - (stageProgress - 0.6) / 0.25);
  }, [stageProgress]);

  // Slide direction: content shifts up slightly as stage exits
  const textY = useMemo(() => {
    if (stageProgress < 0.6) return 0;
    return -((stageProgress - 0.6) / 0.25) * 28;
  }, [stageProgress]);

  return (
    <section
      ref={sectionRef}
      className="journey-scroll-section"
      id="journey"
      aria-label="Systems journey"
      style={{ height: `${TOTAL_SCROLL * 100}vh` }}
    >
      {/* Sticky cinematic viewport — pinned while scrolling through section */}
      <div className="journey-sticky-stage">

        {/* Full-bleed 3D background canvas */}
        <div className="journey-canvas-bg" aria-hidden="true">
          <SandToSiliconCanvas currentStage={stageIdx} />
        </div>

        {/* Ambient gradient overlay keyed to stage color */}
        <div
          className="journey-ambient-overlay"
          style={{ background: `radial-gradient(ellipse 70% 60% at 50% 100%, ${stage.ambientColor}22 0%, transparent 70%)` }}
          aria-hidden="true"
        />

        {/* Top bar: section title + progress */}
        <div className="journey-top-bar">
          <div className="journey-top-left">
            <span className="journey-section-label">The Systems Odyssey</span>
            <span className="journey-section-sub">From desert sand to autonomous fleet intelligence.</span>
          </div>
          <div className="journey-progress-track" role="progressbar" aria-valuenow={Math.round(scrollProgress * 100)} aria-valuemin={0} aria-valuemax={100}>
            {STAGES.map((st, i) => (
              <div
                key={st.id}
                className={`journey-progress-pip ${i === stageIdx ? "pip-active" : ""} ${i < stageIdx ? "pip-done" : ""}`}
              >
                <span className="pip-step">{st.step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Centered story text overlay */}
        <div
          className="journey-story-overlay"
          style={{
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
          }}
        >
          <div className="journey-eyebrow">
            <span className="journey-step-num">{stage.step}</span>
            <span className="journey-eyebrow-label">{stage.eyebrow.split("// ")[1]}</span>
          </div>
          <h2 className="journey-story-headline">{stage.headline}</h2>
          <p className="journey-story-desc">{stage.description}</p>

          <div className="journey-story-metrics">
            {stage.metrics.map((m) => (
              <div key={m.label} className="journey-metric-tile">
                <span className="jm-label">{m.label}</span>
                <span className="jm-value">{m.value}</span>
              </div>
            ))}
          </div>

          <div className="journey-story-tags">
            {stage.tags.map((t) => (
              <span key={t} className="journey-tag">{t}</span>
            ))}
          </div>
        </div>

        {/* Chemical process label */}
        <div className="journey-chem-bar" aria-hidden="true">
          <span className="chem-icon">⬡</span>
          <span className="chem-text">{stage.chemical}</span>
        </div>

        {/* Bottom scroll hint / next stage peek */}
        <div className="journey-bottom-bar" aria-hidden="true">
          {stageIdx < STAGES.length - 1 && (
            <div className="journey-next-hint">
              <span className="next-hint-label">NEXT:</span>
              <span className="next-hint-name">{nextStage.eyebrow.split("// ")[1]}</span>
              <span className="next-hint-arrow">↓</span>
            </div>
          )}
          <div className="journey-scroll-bar-wrap">
            <div className="journey-scroll-fill" style={{ width: `${scrollProgress * 100}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
