export type SkillCategory = {
  id: string;
  label: string;
  skills: string[];
};

export const skillCategories: SkillCategory[] = [
  {
    id: "languages",
    label: "Languages",
    skills: ["C", "C++", "Python", "Bash", "Qt/QML"],
  },
  {
    id: "platforms",
    label: "OS / Platforms",
    skills: [
      "Qualcomm QCM2290",
      "TI AM665x",
      "TI AM437x",
      "NXP i.MX8",
      "Xilinx ZynqMP",
    ],
  },
  {
    id: "protocols",
    label: "Protocols / Hardware",
    skills: [
      "CAN/J1939",
      "HaLow Wi-Fi",
      "MQTT",
      "WebRTC",
      "RTSP/RTP",
      "TCP/IP",
    ],
  },
  {
    id: "tooling",
    label: "Tooling",
    skills: [
      "JTAG",
      "UART",
      "ftrace",
      "Valgrind",
      "GDB",
      "Oscilloscopes",
      "Logic analyzers",
      "Yocto",
      "OSTree",
      "Jenkins",
      "GitLab",
      "Docker",
    ],
  },
];
