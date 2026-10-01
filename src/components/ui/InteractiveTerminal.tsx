import { useState, useRef, type CSSProperties, type JSX } from "react";
import { useGuidedScroll } from "../../motion/guided-scroll.ts";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { useScrollFrame } from "../../motion/scroll-frame.ts";
import { LusionKineticHeading } from "./LusionKineticHeading.tsx";

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

const TOTAL_SCROLL = 5.5;
const REVEAL_FRACTION = 0.20;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

// Reveal style at scroll-progress 0, applied until the first scheduler tick
// writes a live value — matches `computeAndApply`'s popProgress===0 case so
// there is no unstyled flash between first paint and first frame.
const INITIAL_REVEAL_STYLE: CSSProperties = {
  opacity: 0.1,
  filter: "blur(4.00px)",
  transform: "perspective(1200px) translate3d(-120.0px, 90.0px, -40.0px) scale(0.420) rotateX(14.00deg) rotateY(-9.00deg)",
  clipPath: "inset(0% 20.0% 25.0% 0% round 0.0px)",
};

export function InteractiveTerminal(): JSX.Element {
  const enhanced = useMotionMode() === "enhanced";
  const [activeCmdIdx, setActiveCmdIdx] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [visibleLineCount, setVisibleLineCount] = useState<number>(TERMINAL_COMMANDS[0].output.length);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const manualOverrideRef = useRef(false);
  const manualTimerRef = useRef<number | null>(null);
  useGuidedScroll(sectionRef, enhanced, 0.94, 300);

  const activeCommand = TERMINAL_COMMANDS[activeCmdIdx];

  // Scroll-linked reveal (opacity/filter/transform/clipPath) is a continuous
  // per-frame value written straight to the wrapper's style — it never needs
  // a React commit. Only the terminal script's text content (typed command,
  // visible output lines, active tab) is state, and only changes at the
  // discrete steps the script advances through.
  useScrollFrame(() => {
    const el = sectionRef.current;
    if (!el) return;

    const scrollable = el.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;

    const raw = clamp01(-el.getBoundingClientRect().top / scrollable);
    const popProgress = Math.min(1, raw / REVEAL_FRACTION);

    const wrapper = wrapperRef.current;
    if (wrapper && !isMinimized) {
      const invReveal = 1 - popProgress;
      if (popProgress >= 0.999) {
        wrapper.style.opacity = "1";
        wrapper.style.filter = "none";
        wrapper.style.transform = "none";
        wrapper.style.clipPath = "none";
      } else {
        wrapper.style.opacity = (0.1 + popProgress * 0.9).toFixed(3);
        wrapper.style.filter = invReveal > 0.05 ? `blur(${(invReveal * 4).toFixed(2)}px)` : "none";
        wrapper.style.transform = `perspective(1200px) translate3d(${(invReveal * -120).toFixed(1)}px, ${(invReveal * 90).toFixed(1)}px, ${(invReveal * -40).toFixed(1)}px) scale(${(0.42 + popProgress * 0.58).toFixed(3)}) rotateX(${(invReveal * 14).toFixed(2)}deg) rotateY(${(invReveal * -9).toFixed(2)}deg)`;
        wrapper.style.clipPath = `inset(0% ${(invReveal * 20).toFixed(1)}% ${(invReveal * 25).toFixed(1)}% 0% round ${(16 * popProgress).toFixed(1)}px)`;
      }
    }
    wrapper?.classList.toggle("terminal-glow", popProgress > 0.85);

    if (manualOverrideRef.current) return;

    if (raw < REVEAL_FRACTION * 0.9) {
      if (typedText !== "") setTypedText("");
      if (showOutput) setShowOutput(false);
      return;
    }

    const scriptSpan = 1 - REVEAL_FRACTION;
    const scriptProgress = clamp01((raw - REVEAL_FRACTION) / scriptSpan);

    const stepSize = 1 / TERMINAL_COMMANDS.length;
    const cmdIndex = Math.min(
      TERMINAL_COMMANDS.length - 1,
      Math.floor(scriptProgress / stepSize),
    );

    const stepLocal = (scriptProgress - cmdIndex * stepSize) / stepSize;
    const cmd = TERMINAL_COMMANDS[cmdIndex];

    if (cmdIndex !== activeCmdIdx) {
      setActiveCmdIdx(cmdIndex);
    }

    const typeFraction = 0.35;
    if (stepLocal < typeFraction) {
      const charProgress = stepLocal / typeFraction;
      const charCount = Math.max(
        1,
        Math.floor(charProgress * cmd.command.length),
      );
      setTypedText(cmd.command.slice(0, charCount));
      setIsTyping(true);
      setShowOutput(false);
      setVisibleLineCount(0);
    } else {
      setTypedText(cmd.command);
      setIsTyping(false);
      setShowOutput(true);

      const outFraction = (stepLocal - typeFraction) / (1 - typeFraction);
      const lineCount = Math.min(
        cmd.output.length,
        Math.max(1, Math.ceil(outFraction * cmd.output.length)),
      );
      setVisibleLineCount(lineCount);
    }
  });

  const handleTabClick = (idx: number) => {
    manualOverrideRef.current = true;
    clearTimeout(manualTimerRef.current ?? undefined);

    setActiveCmdIdx(idx);
    setTypedText(TERMINAL_COMMANDS[idx].command);
    setIsTyping(false);
    setShowOutput(true);
    setVisibleLineCount(TERMINAL_COMMANDS[idx].output.length);

    manualTimerRef.current = window.setTimeout(() => {
      manualOverrideRef.current = false;
    }, 4000);
  };

  const copyOutput = () => {
    const text = `$ ${activeCommand.command}\n${activeCommand.output.join("\n")}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const visibleOutput = activeCommand.output.slice(0, visibleLineCount);

  return (
    <div ref={sectionRef} className="terminal-scroll-section" style={{ height: `${TOTAL_SCROLL * 100}vh` }}>
      <div className="terminal-sticky-stage">
        <div className="section-header terminal-pinned-heading">
          <LusionKineticHeading
            kicker="Technical Capabilities"
            text="Interactive System Console & Toolchains"
            subtitle="Live developer terminal simulation and comprehensive skill matrix — inspecting verified languages, heterogeneous SoC platforms, wireless protocols, and automated CI/CD pipelines."
          />
        </div>
        <div
          ref={wrapperRef}
          className={`interactive-terminal-wrapper ${isExpanded ? "terminal-expanded-mode" : ""} ${isMinimized ? "terminal-minimized-mode" : ""}`}
          style={isMinimized ? undefined : INITIAL_REVEAL_STYLE}
        >
          <div className="terminal-window">
            {/* Terminal Title Bar */}
            <div className="terminal-titlebar">
              <div className="terminal-window-buttons" aria-hidden="true">
                <span className="window-btn btn-close" onClick={() => setIsMinimized(true)} title="Minimize terminal" />
                <span className="window-btn btn-min" onClick={() => setIsMinimized((prev) => !prev)} title="Minimize/Restore" />
                <span className="window-btn btn-max" onClick={() => setIsExpanded((prev) => !prev)} title="Expand" />
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
                    onClick={() => handleTabClick(idx)}
                  >
                    <span className="tab-icon">❯_</span>
                    <span className="tab-index" aria-hidden="true">{String(idx + 1).padStart(2, "0")}</span>
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
                  onClick={() => setIsMinimized((prev) => !prev)}
                  title={isMinimized ? "Restore terminal console" : "Minimize terminal console"}
                >
                  {isMinimized ? "🗖 Restore" : "🗕 Minimize"}
                </button>
              </div>
            </div>

            {isMinimized ? (
              <div className="terminal-minimized-bar">
                <div className="minimized-info">
                  <span className="minimized-dot" aria-hidden="true" />
                  <span>CONSOLE MINIMIZED // kamal@void-x64 ~/portfolio</span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsMinimized(false)}
                >
                  Restore Console 🗖
                </button>
              </div>
            ) : (
              <>
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
                    <span className={`prompt-cursor ${isTyping || !showOutput ? "cursor-typing" : "cursor-blink"}`}>█</span>
                  </div>

                  {/* Command Output Container */}
                  <div className={`terminal-output-container ${showOutput ? "output-active" : "output-hidden"}`}>
                    {visibleOutput.map((line, idx) => (
                      <div key={idx} className="terminal-output-line">
                        {line}
                      </div>
                    ))}
                    {visibleLineCount >= activeCommand.output.length && (
                      <div className="terminal-exit-code">
                        <span className="exit-badge">exit 0</span>
                        <span className="exit-time">executed in 2.4ms</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Terminal Footer Navigation Bar */}
                <div className="terminal-footer-bar">
                  <span className="footer-tip">
                    TIP: Scroll or click tabs to inspect verified languages, silicon targets, wireless RF, and custom DB engines
                  </span>
                  <div className="terminal-step-pills">
                    {TERMINAL_COMMANDS.map((cmd, idx) => (
                      <button
                        key={cmd.id}
                        type="button"
                        className={`step-dot ${activeCmdIdx === idx ? "active" : ""}`}
                        onClick={() => handleTabClick(idx)}
                        aria-label={`Switch to ${cmd.tabTitle}`}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
