import { useState, useRef, useEffect, type JSX } from "react";
import { contactInfo } from "../../content/contact.ts";
import { LusionKineticHeading } from "../ui/LusionKineticHeading.tsx";
type GallerySystem = {
  id: string;
  tag: string;
  badge: string;
  title: string;
  silicon: string;
  description: string;
  techStack: string[];
  impact: string;
  kind: "tsdb" | "evcharger" | "health" | "zynq" | "video" | "fleet";
  link?: string;
};

const gallerySystems: GallerySystem[] = [
  {
    id: "stratum-tsdb",
    tag: "Embedded Engine / Zero-Copy",
    badge: "OPEN-SOURCE / C99 & RUST",
    title: "Stratum-TSDB: Zero-Copy Embedded Time-Series Engine",
    silicon: "AVR ATMega ➔ ARM Cortex-M ➔ x86_64",
    description:
      "Engineered a high-throughput, zero-allocation embedded time-series storage engine with custom ProtoFS binary schema compiler. Features memory-mapped circular ring buffers executing 2.4M writes/sec on single-threaded microcontrollers and edge daemons.",
    techStack: ["C99", "Rust", "mmap", "ProtoFS AST", "Zero-Copy", "POSIX"],
    impact: "2.4M records/sec throughput with a minuscule 28KB RAM footprint on MCU platforms.",
    kind: "tsdb",
    link: "https://github.com/justdoGIT",
  },
  {
    id: "ev-charger-hmi",
    tag: "Automotive / Secure Boot",
    badge: "PRODUCTION DEPLOYMENT",
    title: "EV Charger HMI & Hardware Security Module (HSM)",
    silicon: "TI Sitara AM335x / AM437x / AM665x",
    description:
      "Designed and developed the HMI and secure backend for industrial EV charging stations at Vestel International. Authored custom Yocto Linux images from scratch, integrated Hardware Root-of-Trust with SELinux, and authored Wi-Fi 6 / Bluetooth 5.3 drivers for MediaTek MT7668 modules.",
    techStack: ["Yocto Linux", "TI Sitara", "Secure Boot", "HSM", "MT7668 Wi-Fi/BT", "Qt/QML"],
    impact: "Deployed across commercial European EV charging stations with zero field security breaches.",
    kind: "evcharger",
    link: `mailto:${contactInfo.email}?subject=EV%20Charger%20HMI%20Inquiry`,
  },
  {
    id: "patient-monitor",
    tag: "Medical IoT / Edge ML",
    badge: "REAL-TIME SENSING",
    title: "Contactless Patient Monitoring & Vitals Inference",
    silicon: "NXP i.MX Series Processor",
    description:
      "Engineered real-time contactless vital sign monitoring (heart rate, respiration, SPO2, blood pressure) from piezoelectric vibration sensors at Dozee. Created custom NXP Yocto Linux images with U-Boot optimizations and Qt/C++ & Flutter/Python telemetry display.",
    techStack: ["NXP i.MX", "Yocto Linux", "U-Boot", "DSP Filters", "ML Models", "Qt/C++"],
    impact: "Continuous ICU-grade vital monitoring without touching the patient.",
    kind: "health",
    link: `mailto:${contactInfo.email}?subject=Patient%20Monitoring%20System%20Inquiry`,
  },
  {
    id: "zynq-openamp",
    tag: "Heterogeneous Multiprocessing",
    badge: "SUB-2µs LATENCY",
    title: "Heterogeneous Dual-Core IPC on Xilinx ZynqMP",
    silicon: "Xilinx ZynqMP UltraScale+ (R5 + A53)",
    description:
      "Architected inter-processor communication (IPC) on Xilinx ZynqMP between real-time Cortex-R5 baremetal cores and application Cortex-A53 Linux using OpenAMP and rpmsg-lite. Built direct sensor acquisition via industrial MODBUS, OPC-UA, and MQTT at IFM Engineering.",
    techStack: ["Xilinx ZynqMP", "OpenAMP", "rpmsg-lite", "MODBUS", "OPC-UA", "ROS"],
    impact: "Hard real-time deterministic control on R5 while running rich Linux services on A53.",
    kind: "zynq",
    link: `mailto:${contactInfo.email}?subject=ZynqMP%20Heterogeneous%20Architecture`,
  },
  {
    id: "retail-scanner",
    tag: "Computer Vision / Video BSP",
    badge: "HIGH-THROUGHPUT STREAMING",
    title: "High-Speed Retail Video Scanner & V4L2 Pipeline",
    silicon: "NXP i.MX8M Plus SoC (Video ISP)",
    description:
      "Built an industrial barcode and video scanning server at Capgemini using ONVIF and SOAP specs. Developed V4L2 raw camera capture drivers, GStreamer/FFMPEG video encoding pipelines (H.264/H.265/MJPEG), and low-latency RTSP/WebRTC streaming for automated retail checkouts.",
    techStack: ["NXP i.MX8MP", "V4L2", "GStreamer", "FFMPEG", "RTSP / WebRTC", "Docker CI/CD"],
    impact: "Ultra-fast automated retail checkout scanning running 24/7 in large-scale retail environments.",
    kind: "video",
    link: `mailto:${contactInfo.email}?subject=Video%20Pipeline%20and%20V4L2%20Inquiry`,
  },
  {
    id: "fleet-runtime-system",
    tag: "Distributed Systems / CI/CD",
    badge: "AUTONOMOUS ORCHESTRATION",
    title: "Heterogeneous Distributed Fleet Management Runtime",
    silicon: "MSI Head + Qualcomm Edge + NXP + Zynq",
    description:
      "Architected a distributed fleet controller managing heterogeneous edge nodes with typed RPC protocols, Slurm scheduler coordination, distributed sccache compiler acceleration, and self-healing agent harnesses with real-time serial telemetry.",
    techStack: ["Rust Actix", "Slurm RPC", "Distributed sccache", "Docker", "Serial Telemetry"],
    impact: "Reduced kernel and firmware compile/test cycle times by 65% across cluster nodes.",
    kind: "fleet",
    link: "https://github.com/justdoGIT",
  },
];

function LusionShowcaseCard({
  item,
  isSelected,
  onSelect,
}: {
  item: GallerySystem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Physics animation state stored in ref for zero-rerender 60fps RAF loop
  const physicsRef = useRef({
    currRotX: 0,
    currRotY: 0,
    currTransX: 0,
    currTransY: 0,
    currScale: 1,
    currTransZ: 0,
    currVibeX: 0,
    currVibeY: 0,
    targetRotX: 0,
    targetRotY: 0,
    targetTransX: 0,
    targetTransY: 0,
    targetScale: 1,
    targetTransZ: 0,
    currSpotX: 0,
    currSpotY: 0,
    targetSpotX: 0,
    targetSpotY: 0,
    currOpacity: 0,
    targetOpacity: 0,
    entryTime: 0,
    rafId: 0,
    isHovered: false,
  });

  const updatePhysics = () => {
    const p = physicsRef.current;
    // Damped lerp factor for smooth organic inertia
    const ease = 0.1;

    // Entry micro-vibration pulse calculation (~220ms damped high-frequency oscillation)
    if (p.isHovered && p.entryTime > 0) {
      const elapsed = performance.now() - p.entryTime;
      if (elapsed < 240) {
        const decay = Math.exp(-elapsed * 0.015);
        const osc = Math.sin(elapsed * 0.12);
        p.currVibeX = osc * decay * 2.2;
        p.currVibeY = -osc * decay * 1.8;
      } else {
        p.currVibeX = 0;
        p.currVibeY = 0;
      }
    } else {
      p.currVibeX = 0;
      p.currVibeY = 0;
    }

    p.currRotX += (p.targetRotX - p.currRotX) * ease;
    p.currRotY += (p.targetRotY - p.currRotY) * ease;
    p.currTransX += (p.targetTransX - p.currTransX) * ease;
    p.currTransY += (p.targetTransY - p.currTransY) * ease;
    p.currScale += (p.targetScale - p.currScale) * ease;
    p.currTransZ += (p.targetTransZ - p.currTransZ) * ease;
    p.currSpotX += (p.targetSpotX - p.currSpotX) * 0.15;
    p.currSpotY += (p.targetSpotY - p.currSpotY) * 0.15;
    p.currOpacity += (p.targetOpacity - p.currOpacity) * 0.15;

    if (cardRef.current) {
      const finalX = (p.currTransX + p.currVibeX).toFixed(2);
      const finalY = (p.currTransY + p.currVibeY).toFixed(2);
      cardRef.current.style.transform = `perspective(1000px) translate3d(${finalX}px, ${finalY}px, ${p.currTransZ.toFixed(2)}px) rotateX(${p.currRotX.toFixed(2)}deg) rotateY(${p.currRotY.toFixed(2)}deg) scale3d(${p.currScale.toFixed(3)}, ${p.currScale.toFixed(3)}, 1)`;
    }

    if (spotlightRef.current) {
      spotlightRef.current.style.background = `radial-gradient(circle 380px at ${p.currSpotX.toFixed(1)}px ${p.currSpotY.toFixed(1)}px, rgba(56, 189, 248, 0.25) 0%, rgba(129, 140, 248, 0.09) 40%, transparent 80%)`;
      spotlightRef.current.style.opacity = p.currOpacity.toFixed(3);
    }

    const deltaRot = Math.abs(p.targetRotX - p.currRotX) + Math.abs(p.targetRotY - p.currRotY);
    const deltaTrans = Math.abs(p.targetTransX - p.currTransX) + Math.abs(p.targetTransY - p.currTransY);
    const deltaOpacity = Math.abs(p.targetOpacity - p.currOpacity);

    if (p.isHovered || deltaRot > 0.01 || deltaTrans > 0.01 || deltaOpacity > 0.005) {
      p.rafId = requestAnimationFrame(updatePhysics);
    } else {
      p.rafId = 0;
    }
  };

  const startLoop = () => {
    if (!physicsRef.current.rafId) {
      physicsRef.current.rafId = requestAnimationFrame(updatePhysics);
    }
  };

  const handleMouseEnter = () => {
    onSelect();
    const p = physicsRef.current;
    p.isHovered = true;
    p.entryTime = performance.now();
    p.targetScale = 1.02;
    p.targetTransZ = 12;
    p.targetOpacity = 1;
    startLoop();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!cardRef.current) return;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = x / rect.width - 0.5; // -0.5 to 0.5
    const normY = y / rect.height - 0.5; // -0.5 to 0.5

    const p = physicsRef.current;
    // Eye-tracking pointer follow: subtle 4.5deg max tilt combined with 10px cursor translation
    p.targetRotX = -normY * 4.5;
    p.targetRotY = normX * 4.5;
    p.targetTransX = normX * 12;
    p.targetTransY = normY * 10;
    p.targetSpotX = x;
    p.targetSpotY = y;
    p.isHovered = true;
    p.targetOpacity = 1;
    startLoop();
  };

  const handleMouseLeave = () => {
    const p = physicsRef.current;
    p.isHovered = false;
    p.entryTime = 0;
    p.targetRotX = 0;
    p.targetRotY = 0;
    p.targetTransX = 0;
    p.targetTransY = 0;
    p.targetScale = 1;
    p.targetTransZ = 0;
    p.targetOpacity = 0;
    startLoop();
  };

  useEffect(() => {
    return () => {
      if (physicsRef.current.rafId) {
        cancelAnimationFrame(physicsRef.current.rafId);
      }
    };
  }, []);

  return (
    <article
      ref={cardRef}
      className={`system-showcase-card ${isSelected ? "card-selected" : ""}`}
      role="listitem"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onSelect}
    >
      <div ref={spotlightRef} className="system-card-spotlight" />
      <div className="system-card-content">
        {/* Top Bar */}
        <div className="showcase-topbar">
          <span className="showcase-tag">{item.tag}</span>
          <span className="showcase-badge">{item.badge}</span>
        </div>

        {/* Title & Target Silicon */}
        <h3 className="showcase-title">{item.title}</h3>
        <div className="showcase-silicon-pill">
          <span className="silicon-dot" />
          <span>{item.silicon}</span>
        </div>

        {/* Narrative Description */}
        <p className="showcase-desc">{item.description}</p>

        {/* Tech Stack Chips */}
        <div className="showcase-chips-wrap">
          {item.techStack.map((tech) => (
            <span key={tech} className="showcase-chip">
              {tech}
            </span>
          ))}
        </div>

        {/* Impact Metric Bar */}
        <div className="showcase-impact-bar">
          <span className="impact-label">OUTCOME:</span>
          <span className="impact-text">{item.impact}</span>
        </div>

        {/* Action Link */}
        {item.link && (
          <a
            className="showcase-action-link"
            href={item.link}
            target={item.link.startsWith("http") ? "_blank" : undefined}
            rel={item.link.startsWith("http") ? "noreferrer" : undefined}
          >
            Discuss This Architecture <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );
}

export function SystemsGallery(): JSX.Element {
  const [activeSystemId, setActiveSystemId] = useState<string>(gallerySystems[0].id);

  return (
    <section className="gallery-section" id="visual-lab" aria-label="Visual project lab">
      <div className="section-header gallery-header">
        <LusionKineticHeading
          kicker="Systems Showcase"
          text="Proven Industrial Architectures"
          subtitle="A deep dive into mission-critical platforms designed, built, and shipped across automotive, industrial IoT, medical monitoring, and high-throughput edge systems."
        />
      </div>

      {/* Interactive Architecture Cards Grid */}
      <div className="systems-gallery-grid" role="list">
        {gallerySystems.map((item) => (
          <LusionShowcaseCard
            key={item.id}
            item={item}
            isSelected={activeSystemId === item.id}
            onSelect={() => setActiveSystemId(item.id)}
          />
        ))}
      </div>
    </section>
  );
}
