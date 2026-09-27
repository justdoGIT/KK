export type CareerEntry = {
  id: string;
  period: string;
  title: string;
  organization: string;
  summary: string;
  accomplishments: string[];
  technologies: string[];
  evidenceIds: string[];
};

export const career: CareerEntry[] = [
  {
    id: "symx-ai",
    period: "Jan 2025 – Present",
    title: "Senior Embedded Systems & Edge AI Architect",
    organization: "SYMX.AI",
    summary:
      "Autonomous hardware bring-up, Qualcomm QCM2290 BSP, and distributed edge intelligence runtime with multi-node telemetry and watchdog power orchestration.",
    accomplishments: [
      "Board bring-up and custom Yocto Linux BSP for Qualcomm QCM2290 industrial edge platform",
      "Integrated atomic OSTree rootfs updates with dual-partition fallback for zero field-bricking",
      "Engineered hardware-in-the-loop (HIL) automated test harness with real-time serial telemetry",
      "Architected distributed fleet management runtime with zero-copy shared memory IPC",
    ],
    technologies: [
      "Qualcomm QCM2290",
      "Yocto Project",
      "C++20",
      "Rust",
      "OSTree",
      "JTAG/UART",
      "Qualcomm SNPE",
      "Docker",
    ],
    evidenceIds: ["resume-001"],
  },
  {
    id: "vestel",
    period: "Dec 2022 – Jul 2024",
    title: "Senior Embedded Engineer",
    organization: "Vestel International",
    summary:
      "Design & development of HMI for EV charger using TI AM335x, AM437x & AM665x processors, Yocto Linux from scratch, Secure Boot, and MediaTek MT7668 wireless drivers.",
    accomplishments: [
      "Curated custom Yocto Linux images from scratch for TI AM335x/AM437x/AM665x EV chargers with image signing",
      "Designed Secure-Boot, Root-of-Trust and Hardware Security Module (HSM) key management with SELinux user space",
      "Authored Wi-Fi 6 and Bluetooth 5.3 device drivers for MediaTek MT7668 module",
      "Integrated peripheral device drivers for LCD touchscreen displays, GSM modems, and RFID readers",
    ],
    technologies: [
      "TI Sitara (AM665x/AM437x/AM335x)",
      "Yocto Project",
      "C/C++",
      "Secure Boot / HSM",
      "MediaTek MT7668 (Wi-Fi/BT)",
      "SELinux",
      "GSM / RFID",
      "Qt/QML",
    ],
    evidenceIds: ["resume-001"],
  },
  {
    id: "dozee",
    period: "Jul 2022 – Dec 2022",
    title: "Senior Embedded Developer",
    organization: "Dozee",
    summary:
      "R&D of contactless Patient Monitoring System extracting real-time vital signs (heart rate, breath rate, SPO2, blood pressure) from vibrational sensors using ML models.",
    accomplishments: [
      "Engineered real-time vital sign signal processing display in Qt/C++ and Flutter/Python",
      "Created custom NXP Yocto Linux distributions with U-Boot bootloader optimizations",
      "Developed kernel device drivers and vibration sensor data ingestion pipelines into SQL database",
      "Implemented DSP filter pipelines and machine learning inference on embedded edge nodes",
    ],
    technologies: [
      "NXP i.MX",
      "Yocto Linux",
      "C++ / Qt",
      "Python / Flutter",
      "U-Boot",
      "DSP & Sensor Filters",
      "Machine Learning",
    ],
    evidenceIds: ["resume-001"],
  },
  {
    id: "capgemini",
    period: "Oct 2020 – Jun 2022",
    title: "Senior Consultant",
    organization: "Capgemini",
    summary:
      "Retail video scanner server firmware and Yocto BSP on NXP i.MX8M Plus with V4L2 raw camera capture, GStreamer/FFMPEG video pipelines, and multi-arch CI/CD.",
    accomplishments: [
      "Developed Qt/C++ server using SOAP & ONVIF specs for high-speed barcode and video scanning",
      "Authored V4L2 drivers to capture raw video frames and created GStreamer/FFMPEG pipelines (H.264, H.265, MJPEG)",
      "Orchestrated streaming protocols (RTSP, RTMP, WebRTC, HTTP) for ultra-low latency network video",
      "Established multi-arch Docker container CI/CD pipelines in Jenkins and GitLab for large-scale Debian deployments",
    ],
    technologies: [
      "NXP i.MX8M Plus",
      "V4L2 Video",
      "GStreamer / FFMPEG",
      "RTSP / WebRTC",
      "C++ / Qt",
      "Yocto",
      "Docker Multi-Arch",
      "Jenkins / GitLab CI",
    ],
    evidenceIds: ["resume-001"],
  },
  {
    id: "ifm-engineering",
    period: "Jul 2017 – Dec 2019",
    title: "Software Engineer",
    organization: "IFM Engineering",
    summary:
      "Heterogeneous dual-core inter-processor communication on Xilinx ZynqMP UltraScale+ (R5 baremetal + A53 Linux), industrial IoT-Core protocols, and ROS robotics.",
    accomplishments: [
      "Engineered inter-core IPC on Xilinx ZynqMP between Cortex-R5 baremetal and Cortex-A53 Linux via OpenAMP and rpmsg-lite",
      "Developed IoT-Core embedded protocol stack supporting industrial MODBUS, OPC-UA, and MQTT sensor telemetry",
      "Crafted autonomous wall-following robotic navigation algorithm in C++ using IFM O3D 3D Time-of-Flight camera and ROS",
      "Ported legacy graphics stack from X11 to Wayland for high-throughput embedded HMI displays",
    ],
    technologies: [
      "Xilinx ZynqMP UltraScale+",
      "OpenAMP / rpmsg-lite",
      "ROS (Robot Operating System)",
      "IFM O3D ToF Camera",
      "MODBUS / OPC-UA / MQTT",
      "C++",
      "Wayland",
    ],
    evidenceIds: ["resume-001"],
  },
];
