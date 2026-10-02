export type TerminalCommand = {
  id: string;
  tabTitle: string;
  command: string;
  description: string;
  output: string[];
  exitCode: number;
};

export const TERMINAL_COMMANDS: TerminalCommand[] = [
  {
    id: "languages",
    tabTitle: "skills-languages.sh",
    command: "cat ~/resume/profile.json | jq .languages_and_core",
    description: "Core languages and low-level development toolchains",
    output: [
      `[`,
      `  "C (C99 / C11 / C17)   -- Baremetal, Linux kernel & device drivers",`,
      `  "C++ (C++17 / C++20)   -- High-performance robotics & systems software",`,
      `  "Rust                  -- Zero-copy embedded storage & async daemons",`,
      `  "Python 3 / DSP        -- Sensor signal processing & ML inference",`,
      `  "Assembly (ARM/RISCV)  -- Startup code, interrupt vectors & context switch",`,
      `  "Bash / POSIX Shell    -- Yocto recipes, automated test harnesses & CI/CD",`,
      `  "Qt / QML / Wayland    -- Industrial EV charger & patient monitor HMIs",`,
      `  "TypeScript / SQL      -- Fleet management dashboards & SQLite state"`,
      `]`,
    ],
    exitCode: 0,
  },
  {
    id: "silicon",
    tabTitle: "platforms-silicon.sh",
    command: "cat ~/resume/hardware.json | jq .verified_silicon",
    description: "Production hardware and heterogeneous SoC platforms",
    output: [
      `{`,
      `  "qualcomm": "QCM2290 Industrial (Yocto Linux, PMIC, Watchdog, OSTree)",`,
      `  "texas_instruments": "Sitara AM335x, AM437x, AM665x (EV Charger HMI, HSM)",`,
      `  "nxp_semiconductors": "i.MX8M Plus / i.MX6 Quad (V4L2, GStreamer, Secure Boot)",`,
      `  "xilinx_amd": "ZynqMP UltraScale+ (Dual Cortex-R5 baremetal + Quad A53 OpenAMP)",`,
      `  "stmicroelectronics": "STM32H7, STM32F4 (Cortex-M7 @ 480MHz, FreeRTOS, Zephyr)",`,
      `  "nvidia_edge": "Jetson Orin Nano / Xavier (TensorRT, CUDA, Real-time Vision)"`,
      `}`,
    ],
    exitCode: 0,
  },
  {
    id: "protocols-rf",
    tabTitle: "protocols-wireless.sh",
    command: "./scripts/probe-hardware-busses.sh --all",
    description: "Hardware bus protocols, high-speed interfaces and RF wireless",
    output: [
      `[+] Scanning hardware interfaces...`,
      `    ├── High-Speed Busses : PCIe Gen4 DMA, USB 3.2 Gen2, MIPI CSI-2/DSI`,
      `    ├── Industrial Busses : CAN-FD / J1939, EtherCAT, Modbus RTU/TCP, OPC-UA`,
      `    ├── Serial Protocols  : SPI (Quad/Octal), I2C Fast-Mode+, UART / RS-485`,
      `    ├── Wireless RF       : Wi-Fi 6E/7 (MT7668), BLE 5.3 Mesh, Satellite SBD (Iridium)`,
      `    └── Long-Range IoT    : LoRaWAN (SX1262), Cellular 5G / LTE-M, UWB, RFID/NFC`,
      `[OK] All peripheral transceivers operational. Signal integrity verified.`,
    ],
    exitCode: 0,
  },
  {
    id: "stratum-tsdb",
    tabTitle: "stratum-engine.sh",
    command: "stratum-tsdb --benchmark --status",
    description: "Zero-copy embedded time-series engine with ProtoFS binary schema",
    output: [
      `[Stratum-TSDB Engine v1.0.4]`,
      `  • Binary Schema Compiler : ProtoFS AST loaded (sensors-ambient-minute.fs)`,
      `  • Memory Architecture    : Zero-copy mmap circular buffer active`,
      `  • Ingest Throughput      : 2,420,000 records/sec (Single thread)`,
      `  • Memory Footprint       : 28KB RAM (Optimized for MCU / AVR to x86_64)`,
      `  • Storage Roundtrip      : 0 checksum errors across 10M synthetic records`,
      `[SUCCESS] Engine verified on baremetal Cortex-M & Linux edge daemon.`,
    ],
    exitCode: 0,
  },
  {
    id: "fleet-cluster",
    tabTitle: "fleet-runtime.sh",
    command: "fleet-ctl cluster --status --telemetry",
    description: "Heterogeneous distributed fleet management and testing harness",
    output: [
      `[Fleet Cluster Runtime] Controller: MSI Head (192.168.1.2)`,
      `  ├── worker-01 [Controller] :: ONLINE  [sccache scheduler: port 4227]`,
      `  ├── worker-02 [QCM2290]    :: ONLINE  [Linux 5.15 LTS, OSTree dual-slot OK]`,
      `  ├── worker-03 [i.MX8MP]    :: ONLINE  [V4L2 Video Streaming Server active]`,
      `  └── worker-04 [ZynqMP]     :: ONLINE  [OpenAMP R5/A53 IPC link latency < 2µs]`,
      `[STATUS] Autonomous CI/CD and hardware-in-the-loop harness green.`,
    ],
    exitCode: 0,
  },
];