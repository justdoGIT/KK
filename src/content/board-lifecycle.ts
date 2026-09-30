/**
 * Silicon-to-fleet story: how a bare board becomes a managed product.
 * Stages 1–5 build the software stack layer by layer on the hardware from
 * stage 0; stage 6 scales the finished device out to a monitored fleet.
 */
export const boardLifecycle = [
  {
    id: "hardware",
    label: "SILICON · PCB · POWER",
    title: "Hardware comes first",
    description: "Silicon alone does nothing. It needs a PCB that routes clocks, memory, and I/O cleanly, and a power tree that brings every rail up in the right order. Schematic review, rail sequencing, and first-power checks prove the board is safe to program.",
    evidence: ["SoC & memory selection", "PCB design review", "Power-rail sequencing"],
    signal: "SoC + DDR + PMIC → POWER GOOD → RESET RELEASED",
    color: "#38bdf8",
  },
  {
    id: "flash",
    label: "FLASH PROGRAMMING",
    title: "Put the first bytes on the board",
    description: "A new board has empty storage. Over JTAG, SWD, USB recovery, or a factory programmer, the boot image is written to SPI-NOR, eMMC, or NAND so the SoC's boot ROM can find it on the next reset.",
    evidence: ["JTAG / SWD / USB recovery", "SPI-NOR · eMMC · NAND", "Signed boot images"],
    signal: "PROGRAMMER → FLASH → BOOT ROM CAN FIND IT",
    color: "#fbbf24",
  },
  {
    id: "bootloader",
    label: "BOOTLOADER",
    title: "Bring memory and the board to life",
    description: "The boot ROM hands off to the bootloader. It trains DDR memory, sets up clocks and pins, verifies the next stage's signature, and loads the kernel and device tree into RAM.",
    evidence: ["SPL / TF-A / U-Boot", "DDR training", "Secure-boot chain"],
    signal: "BOOT ROM → SPL → U-BOOT → LOAD KERNEL",
    color: "#10b981",
  },
  {
    id: "kernel",
    label: "KERNEL & DRIVERS",
    title: "Hand the hardware to an operating system",
    description: "The Linux kernel or RTOS takes control. The device tree describes the board, drivers claim cameras, sensors, buses, and radios, and interrupts, DMA, and power management keep the hardware responsive.",
    evidence: ["Linux / Zephyr / FreeRTOS", "Device tree", "Device drivers"],
    signal: "KERNEL → DEVICE TREE → DRIVERS PROBED",
    color: "#93a4ff",
  },
  {
    id: "userspace",
    label: "USERSPACE",
    title: "Build a reproducible root filesystem",
    description: "Init, services, libraries, and middleware ship in a root filesystem built with Yocto or Buildroot, so every unit runs the same versioned, auditable image with A/B slots for safe updates.",
    evidence: ["Yocto / Buildroot", "systemd services", "A/B rootfs & OTA"],
    signal: "INIT → SERVICES → MIDDLEWARE READY",
    color: "#c084fc",
  },
  {
    id: "applications",
    label: "APPLICATIONS",
    title: "Ship the product on top",
    description: "Robotics control, vision pipelines, edge AI inference, and connectivity run as applications on a stable platform. Each can be tested, versioned, and updated without touching the layers underneath.",
    evidence: ["ROS 2 & control loops", "Vision & edge AI", "Connectivity stacks"],
    signal: "SENSORS → APPLICATION LOGIC → ACTUATORS / CLOUD",
    color: "#38bdf8",
  },
  {
    id: "fleet",
    label: "FLEET CONTROL",
    title: "Monitor and control devices at scale",
    description: "One board becomes thousands in the field. Health telemetry, remote diagnostics, staged OTA rollouts, and rollback give complete control over every platform, and field data feeds back into the next build.",
    evidence: ["Health telemetry", "Staged OTA & rollback", "Remote diagnostics"],
    signal: "BUILD → ROLL OUT → MONITOR → RECOVER",
    color: "#38bdf8",
  },
] as const;

/** Software layers stacked on the hardware in stages 1–5. */
export const softwareLayers = boardLifecycle.slice(1, 6).map((stage) => stage.label);
