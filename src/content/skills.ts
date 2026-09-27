export type SkillCategory = {
  id: string;
  label: string;
  skills: string[];
};

export const skillCategories: SkillCategory[] = [
  {
    id: "languages",
    label: "Languages & Core",
    skills: [
      "C (C99 / C11 / C17)",
      "C++ (C++17 / C++20)",
      "Rust (Embedded / Async)",
      "Python 3",
      "Bash / POSIX Shell",
      "Assembly (ARM / RISC-V)",
      "Qt / QML",
      "TypeScript",
      "PRO-C / SQL",
    ],
  },
  {
    id: "platforms",
    label: "Processors & SoCs",
    skills: [
      "Qualcomm QCM2290 / Snapdragon",
      "TI Sitara (AM335x, AM437x, AM665x)",
      "NXP i.MX8M Plus / i.MX6",
      "Xilinx ZynqMP UltraScale+ (R5 + A53)",
      "STM32H7 / STM32F4 (Cortex-M7/M4)",
      "NVIDIA Jetson Orin / Xavier",
      "ESP32 / ESP32-S3 (Xtensa/RISC-V)",
      "Nordic nRF52840 / nRF5340",
    ],
  },
  {
    id: "embedded-os",
    label: "OS & Firmware",
    skills: [
      "Embedded Linux (Yocto / Buildroot)",
      "FreeRTOS",
      "Zephyr RTOS",
      "U-Boot & GRUB Bootloaders",
      "Linux Kernel & Custom Drivers",
      "OpenAMP & rpmsg-lite (AMP)",
      "Secure Boot & Root-of-Trust (HSM)",
      "SELinux / AppArmor",
      "OSTree Atomic Updates",
      "V4L2 Video Subsystem",
    ],
  },
  {
    id: "protocols",
    label: "Busses & Protocols",
    skills: [
      "PCIe Gen3 / Gen4 DMA",
      "USB 3.2 / USB-C PD",
      "CAN 2.0B & CAN-FD / J1939",
      "EtherCAT & Industrial Ethernet",
      "SPI (Single/Dual/Quad/Octal)",
      "I2C / Fast-Mode Plus",
      "UART / RS-485 / Modbus RTU",
      "MIPI CSI-2 & DSI",
      "OPC-UA / MQTT / ZeroMQ",
      "RTSP / RTP / WebRTC / GStreamer",
    ],
  },
  {
    id: "wireless-rf",
    label: "Wireless & RF",
    skills: [
      "Wi-Fi 6 / 6E / 7 (802.11ax/be)",
      "Bluetooth 5.3 / BLE Mesh (MT7668)",
      "Satellite SBD (Iridium 9603N)",
      "LoRaWAN & Sub-1GHz Mesh",
      "Cellular 5G / LTE-M / NB-IoT",
      "UWB (Ultra-Wideband)",
      "RFID / NFC (13.56MHz)",
    ],
  },
  {
    id: "robotics-ai",
    label: "Robotics & Edge AI",
    skills: [
      "ROS / ROS2 (Robot Operating System)",
      "3D ToF Vision (IFM O3D)",
      "Qualcomm SNPE / Hexagon NPU",
      "NVIDIA TensorRT / CUDA",
      "ONNX Runtime & INT8 Quantization",
      "TensorFlow / Keras / PyTorch",
      "PID Motion & Motor Actuation",
      "Stratum-TSDB Embedded Storage",
    ],
  },
  {
    id: "tooling-cicd",
    label: "Build, Debug & CI/CD",
    skills: [
      "JTAG / SWD & KDB",
      "UART Console & ftrace / perf",
      "Logic Analyzers & Digital Scopes",
      "GCC / Clang / LLVM Cross-Compilers",
      "CMake / Make / Ninja / Cargo",
      "GDB / Valgrind / AddressSanitizer",
      "GitLab CI & Jenkins Pipelines",
      "Docker Multi-Arch & QEMU",
      "Distributed sccache & Slurm",
    ],
  },
];
