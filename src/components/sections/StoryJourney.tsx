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
    id: "sand-quartz",
    step: "01",
    chemical: "SiO₂ QUARTZ CRYSTAL",
    eyebrow: "01 // THE MINERAL FOUNDATION",
    headline: "The raw desert sands: Silica quartz from the earth.",
    description:
      "Every modern microprocessor begins as raw quartz crystal sand (Silicon Dioxide, SiO₂) found in the desert. Composed of silicon and oxygen atoms locked in a crystalline tetrahedral lattice, it represents the raw material substrate for all global computation.",
    metrics: [
      { label: "RAW MINERAL", value: "Silica Quartz (SiO₂)" },
      { label: "ABUNDANCE", value: "28% of Earth's Crust" },
      { label: "STATE", value: "Ambient 25°C" },
    ],
    tags: ["Silica Sand", "SiO₂ Tetrahedral", "Quartz Crystal", "Mining & Refining"],
  },
  {
    id: "arc-furnace",
    step: "02",
    chemical: "SiO₂ + 2C → Si + 2CO (2000°C)",
    eyebrow: "02 // THERMAL REDUCTION",
    headline: "Extreme arc heat: Stripping oxygen atoms to forge pure silicon.",
    description:
      "Quartz sand is submerged into an electric arc furnace and blasted with graphite electrodes at 2,000°C. Carbon chemically bonds with the oxygen atoms to produce molten Metallurgical Grade Silicon, further purified via the Siemens process to an astonishing 99.9999999% (9N) Electronic Grade purity.",
    metrics: [
      { label: "FURNACE TEMP", value: "2,000°C Arc Discharge" },
      { label: "REACTION", value: "Oxygen Reduction" },
      { label: "PURITY", value: "99.9999999% (9N)" },
    ],
    tags: ["Arc Furnace", "Oxygen Stripping", "Siemens Process", "9N Purity"],
  },
  {
    id: "ingot-wafer",
    step: "03",
    chemical: "CZOCHRALSKI MONOCRYSTAL",
    eyebrow: "03 // INGOT CRYSTAL GROWTH",
    headline: "The Czochralski pull: Growing single-crystal ingots & wafer slicing.",
    description:
      "A flawless seed crystal is lowered into molten silicon at 1,420°C and slowly rotated while being drawn upward. Atoms align with atomic perfection to form a continuous monocrystalline ingot (boule), which is diamond-wire sliced into mirror-polished 300mm wafer discs.",
    metrics: [
      { label: "CRYSTAL TYPE", value: "Monocrystalline Boule" },
      { label: "WAFER DIAMETER", value: "300mm Diameter" },
      { label: "SAW WIRE", value: "100µm Diamond Slicing" },
    ],
    tags: ["Czochralski Growth", "Monocrystal Ingot", "300mm Wafers", "CMP Polishing"],
  },
  {
    id: "euv-lithography",
    step: "04",
    chemical: "EUV 13.5nm PHOTOLITHOGRAPHY",
    eyebrow: "04 // NANOMETER FABRICATION",
    headline: "Extreme Ultraviolet Lithography: Printing billions of transistors.",
    description:
      "Inside an ISO Class 1 cleanroom, Extreme Ultraviolet (EUV 13.5nm) laser beams pass through high-precision circuit photomasks. Billions of microscopic FinFET transistor gates and copper interconnects are etched layer-by-layer with single-nanometer precision.",
    metrics: [
      { label: "LIGHT WAVELENGTH", value: "13.5nm EUV Plasma" },
      { label: "GATE DENSITY", value: "15+ Billion Transistors" },
      { label: "CLEANROOM", value: "ISO Class 1 Standard" },
    ],
    tags: ["EUV Lithography", "Transistor Gates", "Photomasks", "Plasma Etching"],
  },
  {
    id: "packaging-bringup",
    step: "05",
    chemical: "BGA / QFP & FIRST CLOCK PULSE",
    eyebrow: "05 // PACKAGING & FIRST BOOT",
    headline: "Die singulation, packaging & the first electrical clock pulse.",
    description:
      "Stealth lasers slice the wafer into independent dies, wire-bonded and sealed into BGA/QFP epoxy resin packages (Qualcomm, TI Sitara, STM32, NXP). Soldered onto multi-layer PCBs, PMIC power sequencing fires up U-Boot and the Linux kernel emits the board's first alive signal.",
    metrics: [
      { label: "PACKAGE TYPE", value: "Micro-BGA / QFP48" },
      { label: "SYSTEM CLOCK", value: "480MHz Core Freq" },
      { label: "BOOT SEQUENCE", value: "U-Boot & Linux 5.15" },
    ],
    tags: ["Die Singulation", "QFP/BGA Packaging", "Board Bring-Up", "U-Boot Kernel"],
  },
  {
    id: "fleet-intelligence",
    step: "06",
    chemical: "AUTONOMOUS FLEET INTELLIGENCE",
    eyebrow: "06 // DISTRIBUTED EDGE AI",
    headline: "From grains of sand to distributed autonomous intelligence.",
    description:
      "The physical journey reaches its zenith. Cold sand has transformed into intelligent edge nodes operating across robotics, real-time CAN/EtherCAT motion control, INT8 neural acceleration, and zero-copy Stratum-TSDB streaming telemetry in a self-healing fleet.",
    metrics: [
      { label: "NEURAL INFERENCE", value: "128 TOPS NPU Acceleration" },
      { label: "FLEET TOPOLOGY", value: "Heterogeneous Multi-Node" },
      { label: "TELEMETRY", value: "Zero-Copy Stratum-TSDB" },
    ],
    tags: ["Edge AI NPU", "Autonomous Fleet", "ROS2 Robotics", "Zero-Copy TSDB"],
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
    }, 6000);

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
          <span className="section-kicker">The Epic Silicon Odyssey</span>
          <span className="journey-auto-indicator" aria-hidden="true">
            <span className={`auto-dot ${autoPlay ? "auto-dot-live" : ""}`} />
            <span>{autoPlay ? "AUTO-SCROLLING ODYSSEY" : "PAUSED"}</span>
          </span>
        </div>
        <h2>From desert sand to autonomous fleet intelligence.</h2>
        <p>
          Witness the complete transformation: how ordinary quartz sand is
          stripped of oxygen at 2,000°C, grown into single crystals, etched with
          EUV lasers, and brought to life as autonomous edge systems.
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
              <span className="step-label">{st.chemical.split(" ")[0]}</span>
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
            <span>3D SIMULATION // STAGE {currentStage.step}: {currentStage.chemical}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
