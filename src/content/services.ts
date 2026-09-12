export type Service = {
  id: string;
  title: string;
  description: string;
  capabilities: string[];
};

export const services: Service[] = [
  {
    id: "firmware-bringup",
    title: "Firmware & Board Bring-Up",
    description:
      "U-Boot, kernel, device tree, drivers, and UART/JTAG diagnosis for new hardware platforms.",
    capabilities: [
      "U-Boot bootloader customization",
      "Linux kernel configuration and drivers",
      "Device tree authoring",
      "UART and JTAG debugging",
      "Power sequencing and reset analysis",
    ],
  },
  {
    id: "embedded-linux-bsp",
    title: "Embedded Linux & BSP Development",
    description:
      "Yocto images, root filesystems, power management, and secure boot for production devices.",
    capabilities: [
      "Yocto layer and recipe development",
      "Root filesystem customization",
      "Power management and suspend/resume",
      "Secure boot and OTA update pipelines",
      "OSTree atomic updates",
    ],
  },
  {
    id: "hitl-verification",
    title: "Hardware-in-the-Loop & System Verification",
    description:
      "Repeatable fixtures, telemetry/evidence, integration and fault validation for reliable deployment.",
    capabilities: [
      "Automated HIL test fixtures",
      "Telemetry and evidence collection",
      "Integration and fault validation",
      "Regression test pipelines",
      "Field deployment diagnostics",
    ],
  },
  {
    id: "systems-architecture",
    title: "Systems Software & Architecture",
    description:
      "IPC, OTA/SOTA, fleet/runtime boundaries, and performance/reliability design for connected systems.",
    capabilities: [
      "IPC and RPC protocol design",
      "OTA/SOTA update architecture",
      "Fleet and runtime boundary design",
      "Performance profiling and optimization",
      "Reliability and watchdog systems",
    ],
  },
];
