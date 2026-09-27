import { useEffect, useRef, useState, type JSX } from "react";
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
};

const STAGES: JourneyStage[] = [
  {
    id: "meteor-genesis",
    step: "01",
    chemical: "COSMIC METEOR STORM ➔ SiO₂ SAND",
    eyebrow: "01 // THE GENESIS",
    headline: "The Genesis: Cosmic meteor storm forging desert sand into silicon chips.",
    description:
      "A vast, quiet desert under an open night sky. A sudden plasma meteor shower strikes the silica sand dunes. Plasma trails impact the earth, crystallizing granular quartz grains into glowing microchips that assemble into cold, dormant hardware boards.",
    metrics: [
      { label: "GENESIS EVENT", value: "Meteor Plasma Strike" },
      { label: "RAW MINERAL", value: "Silica Sand (SiO₂)" },
      { label: "CRYSTAL STATE", value: "Silicon Dies Forming" },
    ],
    tags: ["Meteor Shower", "Silica Sand", "Plasma Impact", "Silicon Crystallization"],
  },
  {
    id: "cold-bringup",
    step: "02",
    chemical: "PMIC SEQUENCING ➔ 480MHz CLOCK PULSE",
    eyebrow: "02 // THE FIRST HEARTBEAT",
    headline: "The Spark of Life: PMIC power sequencing & first electrical pulse.",
    description:
      "A dark, dormant hardware device rests on the bench. Power is injected: PMIC power rails cascade in sequence (3.3V ➔ 1.8V ➔ 0.85V core), the 480MHz crystal oscillator locks, and JTAG/UART diagnostic signals pulse through golden PCB traces, awakening cold silicon.",
    metrics: [
      { label: "POWER RAILS", value: "3.3V ➔ 1.8V ➔ 0.85V Core" },
      { label: "OSCILLATOR", value: "480MHz Precision Crystal" },
      { label: "DIAGNOSTICS", value: "JTAG / UART Probing" },
    ],
    tags: ["Power Sequencing", "PMIC Rails", "Clock Oscillator", "JTAG / UART"],
  },
  {
    id: "kernel-boot",
    step: "03",
    chemical: "U-BOOT ➔ LINUX 5.15 ➔ ROOT-OF-TRUST",
    eyebrow: "03 // KERNEL GENESIS",
    headline: "Kernel Genesis: U-Boot, Device Trees & Hardware Root-of-Trust.",
    description:
      "The CPU exits reset. U-Boot initializes DDR memory, parses device tree pinmux topologies, and launches Linux 5.15 LTS. Hardware Root-of-Trust (HSM keys, Secure Boot, and SELinux) locks down the userspace as status LEDs transition to solid emerald green.",
    metrics: [
      { label: "BOOTLOADER", value: "U-Boot 2026.04" },
      { label: "KERNEL", value: "Linux 5.15 LTS Hardened" },
      { label: "SECURITY", value: "Root-of-Trust / HSM / SELinux" },
    ],
    tags: ["U-Boot", "Device Tree", "Linux Kernel", "Secure Boot / HSM"],
  },
  {
    id: "peripherals-robotics",
    step: "04",
    chemical: "3D ToF VISION ➔ CAN-FD ➔ WI-FI 6 / SATELLITE",
    eyebrow: "04 // SENSORS & ACTUATORS",
    headline: "Peripherals Ignite: 3D ToF vision, motor actuators & Wi-Fi 6/Satellite.",
    description:
      "The board bridges into physical reality. V4L2 camera pipelines stream 3D Time-of-Flight (IFM O3D) point clouds, EtherCAT and CAN-FD motor actuators execute precision kinematics, while MediaTek MT7668 Wi-Fi 6 and Iridium satellite links open global communication channels.",
    metrics: [
      { label: "VISION PIPELINE", value: "3D ToF V4L2 Video Stream" },
      { label: "MOTION BUS", value: "CAN-FD / EtherCAT 5Mbps" },
      { label: "RF COMM", value: "Wi-Fi 6E & Satellite SBD" },
    ],
    tags: ["3D ToF Vision", "CAN-FD / EtherCAT", "MediaTek MT7668", "Satellite Iridium"],
  },
  {
    id: "edge-ai-neural",
    step: "05",
    chemical: "128 TOPS NPU ➔ INT8 NEURAL QUANTIZATION",
    eyebrow: "05 // NEURAL AWAKENING",
    headline: "Neural Awakening: INT8 model quantization & on-device NPU inference.",
    description:
      "Onboard neural accelerators (Qualcomm Hexagon NPU / NVIDIA TensorRT) fire up. Quantized INT8 deep learning models execute real-time object classification, sensor fusion, and autonomous obstacle avoidance with sub-millisecond deterministic latency.",
    metrics: [
      { label: "NPU CAPACITY", value: "128 TOPS INT8 / FP8" },
      { label: "LATENCY", value: "< 2.8ms Inference Loop" },
      { label: "RUNTIMES", value: "Qualcomm SNPE / TensorRT" },
    ],
    tags: ["Hexagon NPU", "INT8 Quantization", "Sensor Fusion", "Autonomous Loops"],
  },
  {
    id: "fleet-army",
    step: "06",
    chemical: "AUTONOMOUS FLEET MESH ➔ STRATUM-TSDB",
    eyebrow: "06 // SWARM ASCENDANCY",
    headline: "Swarm Intelligence: An army of autonomous fleet devices.",
    description:
      "The solitary board multiplies into a vast, synchronized army of fleet devices across the globe. Powered by zero-copy Stratum-TSDB time-series streaming, distributed Slurm cluster scheduling, and self-healing agentic CI/CD harnesses, the fleet operates as one autonomous hive mind.",
    metrics: [
      { label: "FLEET SCALE", value: "Heterogeneous Multi-Node" },
      { label: "DATA INGEST", value: "Zero-Copy Stratum-TSDB" },
      { label: "ORCHESTRATION", value: "Self-Healing Agent Harness" },
    ],
    tags: ["Autonomous Fleet", "Stratum-TSDB", "Slurm Cluster", "Agentic CI/CD"],
  },
];

export function StoryJourney(): JSX.Element {
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const currentStage = STAGES[activeStageIdx];

  // Auto-play timer that advances through the journey when enabled
  useEffect(() => {
    if (!autoPlay) return;

    const timer = window.setInterval(() => {
      setActiveStageIdx((prev) => (prev + 1) % STAGES.length);
    }, 6500);

    return () => clearInterval(timer);
  }, [autoPlay]);

  return (
    <section
      ref={sectionRef}
      className="journey-section"
      id="journey"
      aria-label="Systems journey"
    >
      {/* Section Header */}
      <div className="journey-intro">
        <div className="journey-kicker-row">
          <span className="section-kicker">The Systems Odyssey</span>
          <span className="journey-auto-indicator" aria-hidden="true">
            <span className={`auto-dot ${autoPlay ? "auto-dot-live" : ""}`} />
            <span>{autoPlay ? "IMMERSIVE AUTO-SCROLL JOURNEY" : "PAUSED"}</span>
          </span>
        </div>
        <h2>From desert sand to an army of intelligent fleet devices.</h2>
        <p>
          An epic journey of hardware transformation: from a cosmic meteor storm
          crystallizing desert quartz into chips, to power rail sequencing,
          hardened Linux bring-up, and a globally synchronized army of
          autonomous edge systems.
        </p>
      </div>

      {/* Interactive Playback Control Bar */}
      <div className="journey-controls-bar">
        <button
          type="button"
          className="journey-play-btn"
          onClick={() => setAutoPlay(!autoPlay)}
          aria-label={autoPlay ? "Pause automated journey" : "Play automated journey"}
        >
          {autoPlay ? "⏸ Pause Journey" : "▶ Auto-Play Story"}
        </button>

        {/* Stage Timeline Steps */}
        <div className="journey-timeline-steps" role="tablist">
          {STAGES.map((st, idx) => (
            <button
              key={st.id}
              type="button"
              role="tab"
              aria-selected={activeStageIdx === idx}
              className={`journey-step-tab ${activeStageIdx === idx ? "step-active" : ""}`}
              onClick={() => {
                setActiveStageIdx(idx);
                setAutoPlay(false);
              }}
            >
              <span className="step-num">{st.step}</span>
              <span className="step-label">{st.eyebrow.split("// ")[1]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Layout: 3D Animated Canvas + Synchronized Story Text */}
      <div className="journey-layout-stage">
        {/* Left Side: Animated Narrative & Chemical Telemetry */}
        <div className="journey-narrative-card">
          <div className="narrative-meta-bar">
            <span className="narrative-step-badge">{currentStage.eyebrow}</span>
            <span className="narrative-chemical-tag">{currentStage.chemical}</span>
          </div>

          <h3 className="narrative-headline">{currentStage.headline}</h3>
          <p className="narrative-desc">{currentStage.description}</p>

          {/* Scientific Metrics Grid */}
          <div className="narrative-metrics-grid">
            {currentStage.metrics.map((m) => (
              <div key={m.label} className="metric-box">
                <span className="metric-label">{m.label}</span>
                <span className="metric-val">{m.value}</span>
              </div>
            ))}
          </div>

          {/* Domain Tags */}
          <div className="narrative-tags-wrap">
            {currentStage.tags.map((t) => (
              <span key={t} className="narrative-tag-chip">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right Side: Interactive 3D Canvas Stage */}
        <div className="journey-3d-viewport">
          <SandToSiliconCanvas currentStage={activeStageIdx} />

          {/* Viewport Overlay Caption */}
          <div className="journey-canvas-caption" aria-hidden="true">
            <span className="caption-live-dot" />
            <span>3D SIMULATION // ACT {currentStage.step}: {currentStage.chemical}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
