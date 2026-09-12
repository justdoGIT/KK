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
    title: "Embedded Systems Engineer",
    organization: "SYMX.AI",
    summary:
      "Board bring-up and BSP development for Qualcomm QCM2290 platforms with watchdog and power-aware state management.",
    accomplishments: [
      "Qualcomm QCM2290 board bring-up and optimization (resume-reported)",
      "Watchdog and power-aware state management implementation",
      "OSTree-based atomic OTA updates for field deployment",
    ],
    technologies: [
      "Qualcomm QCM2290",
      "OSTree",
      "Linux",
      "C",
      "Python",
    ],
    evidenceIds: ["resume-001"],
  },
  {
    id: "vestel",
    period: "Dec 2022 – Jul 2024",
    title: "Embedded Software Engineer",
    organization: "Vestel International",
    summary:
      "TI AM665x/AM437x EV charger HMI development with V4L2/GStreamer video pipelines.",
    accomplishments: [
      "TI AM665x/AM437x EV charger HMI development (resume-reported)",
      "V4L2 and GStreamer video pipeline integration",
      "NXP i.MX8 BSP work and driver development",
    ],
    technologies: [
      "TI AM665x",
      "TI AM437x",
      "NXP i.MX8",
      "V4L2",
      "GStreamer",
    ],
    evidenceIds: ["resume-001"],
  },
  {
    id: "dozee",
    period: "Jul 2022 – Dec 2022",
    title: "Embedded Software Engineer",
    organization: "Dozee",
    summary:
      "Embedded systems development for health monitoring devices with sensor integration and data pipelines.",
    accomplishments: [
      "Sensor integration and data collection pipelines",
      "Embedded firmware for health monitoring hardware",
    ],
    technologies: ["C", "Python", "Linux", "Sensors"],
    evidenceIds: ["resume-001"],
  },
  {
    id: "capgemini",
    period: "Oct 2020 – Jun 2022",
    title: "Software Engineer",
    organization: "Capgemini",
    summary:
      "Systems software development with Open-AMP/RPMSG for inter-processor communication on embedded platforms.",
    accomplishments: [
      "Open-AMP and RPMSG inter-processor communication (resume-reported)",
      "Embedded systems integration and testing",
    ],
    technologies: ["C", "C++", "Open-AMP", "RPMSG", "Linux"],
    evidenceIds: ["resume-001"],
  },
  {
    id: "ifm-engineering",
    period: "Jul 2017 – Mar 2020",
    title: "Embedded Systems Engineer",
    organization: "IFM Engineering",
    summary:
      "Embedded Linux and firmware development across Xilinx ZynqMP and other platforms for industrial applications.",
    accomplishments: [
      "Xilinx ZynqMP board bring-up and BSP development",
      "CAN/J1939 protocol stack integration",
      "HaLow Wi-Fi and MQTT connectivity for industrial IoT",
    ],
    technologies: [
      "Xilinx ZynqMP",
      "CAN/J1939",
      "HaLow Wi-Fi",
      "MQTT",
      "C",
      "C++",
    ],
    evidenceIds: ["resume-001"],
  },
];
