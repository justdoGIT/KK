export type Service = {
  id: string;
  title: string;
  domain: string;
  badge: string;
  description: string;
  capabilities: string[];
  protocolsAndRf: string[];
  hardwareTargets: string[];
  deliverables: string[];
};

export const services: Service[] = [
  {
    id: "firmware-bringup",
    title: "Firmware & Board Bring-Up",
    domain: "Baremetal & RTOS Engineering",
    badge: "01 // LOW-LEVEL",
    description:
      "Low-level C/C++ firmware, FreeRTOS/Zephyr kernels, custom bootloaders, power sequencing, and hardware bring-up from first silicon to production validation.",
    capabilities: [
      "Baremetal C/C++ & FreeRTOS/Zephyr firmware architecture",
      "Power state management, reset sequencing & low-power sleep modes",
      "Watchdog timers, fault handlers & crashdump telemetry",
      "JTAG/SWD, UART, logic analyzer & oscilloscope diagnosis",
      "Sensor fusion, ADC/DAC calibration & precision timing control",
    ],
    protocolsAndRf: [
      "SPI", "I2C", "UART", "CAN 2.0B / CAN-FD", "GPIO / PWM", "I2S", "1-Wire",
    ],
    hardwareTargets: [
      "TI Sitara (AM335x, AM437x, AM665x)",
      "STM32H7 / STM32F4 (ARM Cortex-M7/M4)",
      "Qualcomm QCM2290 / Snapdragon",
      "Nordic nRF52/nRF53",
    ],
    deliverables: [
      "Production-grade firmware with zero-leakage state machines",
      "Board bring-up test suite & verification reports",
      "Hardware diagnostic firmware for manufacturing lines",
    ],
  },
  {
    id: "embedded-linux-bsp",
    title: "Embedded Linux & BSP Development",
    domain: "Board Support Packages & OS",
    badge: "02 // KERNEL & BSP",
    description:
      "Custom Yocto Linux distributions from scratch, device tree authoring, kernel device drivers, Secure Boot, Root-of-Trust (HSM), and atomic OSTree updates.",
    capabilities: [
      "Yocto Project (Kirkstone / Scarthgap) layer & recipe development",
      "U-Boot bootloader customization, secure environment & fastboot",
      "Kernel device driver development (V4L2, IIO, net, crypto, input)",
      "Secure Boot, Root-of-Trust, Hardware Security Modules (HSM) & SELinux",
      "OSTree atomic OTA upgrade pipelines & dual-partition redundancy",
    ],
    protocolsAndRf: [
      "PCIe Gen3/Gen4", "USB 3.2 / USB-C PD", "SDIO 3.0", "MIPI CSI-2 / DSI", "Ethernet PHY (RGMII)",
    ],
    hardwareTargets: [
      "NXP i.MX8M Plus / i.MX6",
      "TI AM665x Sitara Processor",
      "Xilinx Zynq UltraScale+ MPSoC",
      "Qualcomm QCM2290 Industrial",
    ],
    deliverables: [
      "Custom reproducible Yocto BSP layer repository",
      "Hardened Linux kernel & signed root filesystem",
      "Over-the-air (OTA) update server integration",
    ],
  },
  {
    id: "robotics-control",
    title: "Robotics, Actuation & Real-Time Control",
    domain: "Robotics & Motion Systems",
    badge: "03 // ROBOTICS",
    description:
      "Real-time robotic control systems, ROS/ROS2 integration, industrial motor actuators, 3D time-of-flight vision processing, and deterministic bus coordination.",
    capabilities: [
      "ROS / ROS2 node architecture & real-time kinematics control",
      "3D Time-of-Flight (IFM O3D) camera integration & obstacle avoidance",
      "Wall-following, path-planning & SLAM algorithms in C++",
      "Field-oriented motor control (BLDC, Steppers, Servo actuators)",
      "Heterogeneous asymmetric multiprocessing (AMP) with OpenAMP & rpmsg-lite",
    ],
    protocolsAndRf: [
      "EtherCAT", "CANopen / CAN-FD", "Modbus RTU/TCP", "OPC-UA", "RS-485", "PWM Motion",
    ],
    hardwareTargets: [
      "Xilinx ZynqMP (Dual Cortex-R5 Real-Time + Quad Cortex-A53)",
      "NVIDIA Jetson Orin / Xavier",
      "TI Sitara Industrial AM64x",
      "STM32G4 Motor Control Series",
    ],
    deliverables: [
      "Deterministic real-time motion control stack",
      "ROS/ROS2 hardware interface drivers & simulation models",
      "Automated robotic safety interlock & fault containment",
    ],
  },
  {
    id: "iot-wireless-rf",
    title: "IoT, Wireless & RF Peripheral Integration",
    domain: "Connected Edge & Wireless Networks",
    badge: "04 // RF & WIRELESS",
    description:
      "High-throughput and long-range wireless peripheral integration across Wi-Fi 6E/7, Bluetooth 5.3, Satellite telemetry, Cellular 5G, LoRaWAN, and custom RF links.",
    capabilities: [
      "Wi-Fi 6E/7 & Bluetooth 5.3 driver integration (MediaTek MT7668)",
      "Satellite SBD (Iridium) low-latency uplink for remote field telemetry",
      "LoRaWAN & Sub-1GHz industrial long-range sensor mesh networks",
      "Cellular 5G/LTE-M modem AT command interfaces & PPP/QMI daemon",
      "Antenna matching analysis, RF co-existence & EMC certification support",
    ],
    protocolsAndRf: [
      "Wi-Fi 6/7 (802.11ax/be)", "BLE 5.3 / Mesh", "Iridium Satellite SBD", "LoRa / LoRaWAN", "5G / LTE-M", "UWB", "RFID / NFC",
    ],
    hardwareTargets: [
      "MediaTek MT7668 Wi-Fi/BT",
      "Iridium 9603N Satellite Transceiver",
      "Quectel RM500Q 5G / BG95 LTE-M",
      "Semtech SX1262 LoRa",
    ],
    deliverables: [
      "End-to-end wireless driver & network manager integration",
      "Low-power edge-to-cloud telemetry daemon (MQTT/TLS, CoAP)",
      "Multi-bearer failover controller (Cellular ↔ Satellite ↔ Wi-Fi)",
    ],
  },
  {
    id: "hardware-protocols",
    title: "High-Speed Hardware Protocols & Bus Systems",
    domain: "Peripheral Interconnects & High-Speed Interfaces",
    badge: "05 // INTERFACES",
    description:
      "Design, implementation, and electrical validation of complex hardware interconnects, high-throughput streaming busses, camera sensors, and audio/video pipelines.",
    capabilities: [
      "High-speed PCIe Gen3/Gen4 root complex & endpoint DMA drivers",
      "USB 3.2 Gen2x2 host/device stacks, USB-C Power Delivery (PD)",
      "MIPI CSI-2 camera sensor bring-up with V4L2 subdevices & ISP tuning",
      "GStreamer & FFMPEG hardware accelerated video pipelines (H.264/H.265/AV1)",
      "High-speed SPI, I2C Fast-Mode Plus (1MHz) & multi-drop RS-485",
    ],
    protocolsAndRf: [
      "PCIe Gen4 DMA", "USB 3.2 / Type-C", "MIPI CSI-2 / DSI", "RTSP / WebRTC", "V4L2", "GStreamer",
    ],
    hardwareTargets: [
      "NXP i.MX8M Plus Video ISP",
      "Sony IMX / OmniVision Image Sensors",
      "FTDI / Silicon Labs USB Bridges",
      "Analog Devices High-Speed ADCs",
    ],
    deliverables: [
      "Zero-copy DMA streaming drivers & ring-buffer queues",
      "Hardware video capture, encoding & RTSP/WebRTC server",
      "High-speed signal integrity & protocol compliance audit",
    ],
  },
  {
    id: "edge-ai-agentic-cicd",
    title: "Edge AI & Agentic Autonomous CI/CD Harness",
    domain: "Edge Intelligence & Autonomous Infrastructure",
    badge: "06 // EDGE AI & AGENTS",
    description:
      "Hardware-accelerated Edge AI deployment (NPU/GPU), model quantization (INT8/FP8), Hardware-in-the-Loop automated test harness, and distributed fleet CI/CD orchestration.",
    capabilities: [
      "NPU acceleration with Qualcomm SNPE, NVIDIA TensorRT & ONNX Runtime",
      "Model optimization & post-training quantization (INT8 / FP8) for micro-watt edge",
      "Hardware-in-the-Loop (HIL) automated test rigs with power glitching & UART probes",
      "Autonomous dev-machine fleet agents with distributed sccache & Slurm clustering",
      "Multi-arch containerized CI/CD pipelines (Jenkins, GitLab CI, Docker multi-arch)",
    ],
    protocolsAndRf: [
      "Qualcomm SNPE", "TensorRT", "OpenVINO", "MicroTVM", "Slurm RPC", "Docker / QEMU",
    ],
    hardwareTargets: [
      "Qualcomm Hexagon NPU",
      "NVIDIA Jetson Orin Nano (40 TOPS)",
      "Google Coral Edge TPU",
      "MSI / Lenovo Distributed Fleet Cluster",
    ],
    deliverables: [
      "Quantized Edge AI inference pipeline (<10ms latency)",
      "Fully automated HIL regression testing harness with artifact telemetry",
      "Autonomous fleet CI/CD deployment infrastructure with auto-failover",
    ],
  },
];
