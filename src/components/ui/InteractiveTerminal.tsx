import { useState, useEffect, useRef, type JSX } from "react";

type TerminalCommand = {
  id: string;
  tabTitle: string;
  command: string;
  description: string;
  output: string[];
  exitCode: number;
};

const TERMINAL_COMMANDS: TerminalCommand[] = [
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

export function InteractiveTerminal(): JSX.Element {
  const [activeCmdIdx, setActiveCmdIdx] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const activeCommand = TERMINAL_COMMANDS[activeCmdIdx];

  // Typing animation effect on active command change
  useEffect(() => {
    let timer: number | undefined;
    let currentIdx = 0;
    const fullCommand = activeCommand.command;

    const typeNextChar = () => {
      if (currentIdx < fullCommand.length) {
        currentIdx++;
        setTypedText(fullCommand.slice(0, currentIdx));
        const delay = Math.floor(Math.random() * 20) + 15;
        timer = window.setTimeout(typeNextChar, delay);
      } else {
        setIsTyping(false);
        timer = window.setTimeout(() => {
          setShowOutput(true);
        }, 120);
      }
    };

    timer = window.setTimeout(() => {
      setTypedText("");
      setIsTyping(true);
      setShowOutput(false);
      typeNextChar();
    }, 60);

    return () => {
      clearTimeout(timer);
    };
  }, [activeCmdIdx, activeCommand.command]);

  const copyOutput = () => {
    const text = `$ ${activeCommand.command}\n${activeCommand.output.join("\n")}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      ref={terminalRef}
      className={`interactive-terminal-wrapper ${isExpanded ? "terminal-expanded-mode" : ""}`}
    >
      <div className="terminal-window">
        {/* Terminal Title Bar */}
        <div className="terminal-titlebar">
          <div className="terminal-window-buttons" aria-hidden="true">
            <span className="window-btn btn-close" onClick={() => setIsExpanded(false)} />
            <span className="window-btn btn-min" onClick={() => setIsExpanded(!isExpanded)} />
            <span className="window-btn btn-max" onClick={() => setIsExpanded(!isExpanded)} />
          </div>

          {/* Terminal Tabs */}
          <div className="terminal-tabs-list" role="tablist">
            {TERMINAL_COMMANDS.map((cmd, idx) => (
              <button
                key={cmd.id}
                type="button"
                role="tab"
                aria-selected={activeCmdIdx === idx}
                className={`terminal-tab ${activeCmdIdx === idx ? "tab-active" : ""}`}
                onClick={() => setActiveCmdIdx(idx)}
              >
                <span className="tab-icon">❯_</span>
                <span className="tab-label">{cmd.tabTitle}</span>
              </button>
            ))}
          </div>

          {/* Window Action Controls */}
          <div className="terminal-actions-right">
            <button
              type="button"
              className="terminal-tool-btn"
              onClick={copyOutput}
              title="Copy terminal output"
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
            <button
              type="button"
              className="terminal-tool-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Collapse terminal" : "Pop up & expand terminal"}
            >
              {isExpanded ? "◱ Restore" : "⛶ Pop Out"}
            </button>
          </div>
        </div>

        {/* Terminal Screen Body */}
        <div className="terminal-body" tabIndex={0} aria-label="Interactive developer console">
          <div className="terminal-system-banner">
            <span>Kamal Pandey -- Staff Embedded Architect Environment [Void Linux x86_64 / AArch64]</span>
            <span className="banner-uptime">UPTIME: 99.9% // KERNEL: 6.18.54_1</span>
          </div>

          {/* Command Prompt Line */}
          <div className="terminal-prompt-line">
            <span className="prompt-user">kamal@void-x64</span>
            <span className="prompt-sep">:</span>
            <span className="prompt-dir">~/portfolio</span>
            <span className="prompt-symbol">$</span>
            <span className="prompt-typed-text">{typedText}</span>
            <span className={`prompt-cursor ${isTyping ? "cursor-typing" : "cursor-blink"}`}>█</span>
          </div>

          {/* Command Output */}
          {showOutput && (
            <div className="terminal-output-container">
              {activeCommand.output.map((line, idx) => (
                <div key={idx} className="terminal-output-line">
                  {line}
                </div>
              ))}
              <div className="terminal-exit-code">
                <span className="exit-badge">exit 0</span>
                <span className="exit-time">executed in 2.4ms</span>
              </div>
            </div>
          )}
        </div>

        {/* Terminal Footer Navigation Bar */}
        <div className="terminal-footer-bar">
          <span className="footer-tip">
            TIP: Click tabs to inspect verified languages, silicon targets, wireless RF, and custom DB engines
          </span>
          <div className="terminal-step-pills">
            {TERMINAL_COMMANDS.map((cmd, idx) => (
              <button
                key={cmd.id}
                type="button"
                className={`step-dot ${activeCmdIdx === idx ? "active" : ""}`}
                onClick={() => setActiveCmdIdx(idx)}
                aria-label={`Switch to ${cmd.tabTitle}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
