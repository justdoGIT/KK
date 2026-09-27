import { useEffect, useRef, useState, type JSX } from "react";

type JourneyChapter = {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  body: string;
  signal: string;
  chips: string[];
};

const chapters: JourneyChapter[] = [
  {
    id: "signal",
    index: "01",
    eyebrow: "The Signal",
    title: "First silicon bring-up & hardware state verification.",
    body: "Bring-up begins at the physical boundary between custom PCB traces, PMIC power sequencing, clock domains, and the first trustworthy heartbeat over UART and JTAG. The hardware is verifiable from the very first power cycle.",
    signal: "JTAG / SWD • PMIC POWER SEQUENCING • UART TELEMETRY",
    chips: ["TI Sitara AM665x", "STM32H7", "Qualcomm QCM2290", "Oscilloscopes"],
  },
  {
    id: "kernel",
    index: "02",
    eyebrow: "The Kernel",
    title: "Custom Yocto BSP, Root-of-Trust & Video Pipelines.",
    body: "Crafting hardened embedded Linux images from scratch. From signed bootloaders (U-Boot) and hardware security modules (HSM) to low-latency V4L2 camera subdevices and GStreamer/FFMPEG video encoding engines.",
    signal: "YOCTO PROJECT • SECURE BOOT / HSM • V4L2 VIDEO",
    chips: ["NXP i.MX8M Plus", "Device Trees", "SELinux", "OSTree Atomic A/B"],
  },
  {
    id: "robot",
    index: "03",
    eyebrow: "The Robot",
    title: "Real-time robotics, 3D ToF vision & wireless mesh.",
    body: "Deterministic motion control meets intelligent vision. Orchestrating ROS2 kinematics, 3D Time-of-Flight (IFM O3D) point clouds, EtherCAT and CAN-FD motor actuators alongside MediaTek MT7668 Wi-Fi 6 and Iridium satellite uplinks.",
    signal: "ROS / ROS2 • 3D ToF VISION • CAN-FD / ETHERCAT • WI-FI 6E",
    chips: ["Xilinx ZynqMP (R5+A53)", "IFM O3D Camera", "MediaTek MT7668", "Satellite SBD"],
  },
  {
    id: "fleet",
    index: "04",
    eyebrow: "The Fleet",
    title: "Edge AI acceleration, zero-copy TSDB & autonomous CI/CD.",
    body: "Deploying quantized INT8 neural networks to Qualcomm Hexagon NPUs and NVIDIA Jetson accelerators. Pairing high-throughput sensor telemetry in Stratum-TSDB with automated Hardware-in-the-Loop fleet testing harnesses.",
    signal: "QUALCOMM SNPE • TENSORRT • STRATUM-TSDB • FLEET AGENT",
    chips: ["Jetson Orin Nano", "Hexagon NPU", "Stratum-TSDB", "Distributed Slurm"],
  },
];

function OrbitVisual({ active }: { active: string }): JSX.Element {
  const currentChapter = chapters.find((c) => c.id === active) ?? chapters[0];

  return (
    <div
      className={`journey-visual journey-visual-${active}`}
      data-testid="journey-visual"
    >
      <div className="visual-grid" aria-hidden="true" />
      <div className="orbit-system" aria-hidden="true">
        <span className="orbit-ring orbit-ring-one" />
        <span className="orbit-ring orbit-ring-two" />
        <span className="orbit-node orbit-node-core" />
        <span className="orbit-node orbit-node-one" />
        <span className="orbit-node orbit-node-two" />
        <span className="orbit-node orbit-node-three" />
      </div>

      <div className="journey-visual-overlay">
        <span className="visual-caption">{currentChapter.signal}</span>
        <div className="visual-chip-tags">
          {currentChapter.chips.map((chip) => (
            <span key={chip} className="visual-tag-item">
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StoryJourney(): JSX.Element {
  const [active, setActive] = useState(chapters[0].id);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target) {
          const index = chapterRefs.current.indexOf(
            visible.target as HTMLElement,
          );
          if (index >= 0) {
            setActive(chapters[index].id);
          }
        }
      },
      { threshold: [0.2, 0.5, 0.8], rootMargin: "-20% 0px -30%" },
    );

    chapterRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="journey-section"
      id="journey"
      aria-label="Systems journey"
    >
      <div className="journey-intro">
        <p className="section-kicker">The Systems Narrative</p>
        <h2>From silicon bring-up to autonomous fleet intelligence.</h2>
        <p>
          Embedded engineering is an interconnected story. Every layer — power
          rail, bootloader, kernel driver, protocol bus, and Edge AI inference —
          acts as one synchronized organism.
        </p>
      </div>

      <div className="journey-layout">
        <div className="journey-chapters">
          {chapters.map((chapter, index) => (
            <article
              key={chapter.id}
              ref={(el) => {
                chapterRefs.current[index] = el;
              }}
              className={`journey-chapter ${
                active === chapter.id ? "journey-chapter-active" : ""
              }`}
            >
              <span className="journey-index">{chapter.index}</span>
              <div>
                <p className="journey-eyebrow">{chapter.eyebrow}</p>
                <h3>{chapter.title}</h3>
                <p>{chapter.body}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="journey-sticky">
          <OrbitVisual active={active} />
        </div>
      </div>
    </section>
  );
}
