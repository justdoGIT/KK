import { useState, type JSX } from "react";
import { contactInfo } from "../../content/contact.ts";
import { LusionKineticHeading } from "../ui/LusionKineticHeading.tsx";
import { LusionShowcaseCard, type GallerySystem } from "./LusionShowcaseCard.tsx";

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
        {gallerySystems.map((item, idx) => (
          <LusionShowcaseCard
            key={item.id}
            item={item}
            isSelected={activeSystemId === item.id}
            onSelect={() => setActiveSystemId(item.id)}
            rowIndex={Math.floor(idx / 2)}
          />
        ))}
      </div>
    </section>
  );
}
