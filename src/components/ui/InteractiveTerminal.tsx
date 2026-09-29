import { useState, useEffect, useRef, type CSSProperties, type JSX } from "react";

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

// Total scroll distance (in viewport-heights) the terminal stays pinned for
// while its fade-in reveal and 5-script sequence play out. Kept fairly
// large so scripts don't race by -- each script gets a comfortable, easy
// to read amount of scroll travel.
const TOTAL_SCROLL = 4.5;
// Portion of TOTAL_SCROLL spent on the fade-in reveal before the
// script/typing sequence begins.
const REVEAL_FRACTION = 0.08;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function InteractiveTerminal(): JSX.Element {
  const [activeCmdIdx, setActiveCmdIdx] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [visibleLineCount, setVisibleLineCount] = useState<number>(TERMINAL_COMMANDS[0].output.length);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0);

  const sectionRef = useRef<HTMLDivElement>(null);
  const manualOverrideRef = useRef(false);
  const manualTimerRef = useRef<number | null>(null);

  const activeCommand = TERMINAL_COMMANDS[activeCmdIdx];

  // Single scroll-driven source of truth for BOTH the minimize->maximize
  // reveal and the 5-script typing/output sequence. The terminal is pinned
  // (position: sticky) inside a TOTAL_SCROLL-viewport-height spacer, so
  // `raw` below maps 1:1 onto the actual scrollbar position for the whole
  // pinned duration -- the previous version measured the outer `<section>`
  // (which also included the filter pills and skills grid below), so the
  // terminal had already scrolled off-screen long before `progress` reached
  // values high enough to reveal the later scripts. A separate one-shot
  // IntersectionObserver also drove a CSS-transition "reveal" independently
  // of this progress, so the two were never actually in sync.
  useEffect(() => {
    let rafId = 0;

    const computeAndApply = () => {
      const el = sectionRef.current;
      if (!el) return;
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const raw = clamp01(-el.getBoundingClientRect().top / scrollable);

      setRevealProgress(clamp01(raw / REVEAL_FRACTION));

      if (manualOverrideRef.current) return;

      // Map the remaining scroll onto the 5 script tabs (0..4)
      const scriptRaw = clamp01((raw - REVEAL_FRACTION) / (1 - REVEAL_FRACTION));
      const numScripts = TERMINAL_COMMANDS.length;
      const scriptF = scriptRaw * numScripts;
      const scriptIdx = Math.min(numScripts - 1, Math.floor(scriptF));
      const subProgress = scriptF - scriptIdx; // 0.0 to 1.0 within this script

      if (scriptIdx !== activeCmdIdx) {
        setActiveCmdIdx(scriptIdx);
      }

      const fullCmd = TERMINAL_COMMANDS[scriptIdx].command;
      const totalOutputLines = TERMINAL_COMMANDS[scriptIdx].output.length;

      // Phase 1 (subProgress 0..0.4): Type command string character by character
      if (subProgress < 0.4) {
        const charPct = subProgress / 0.4;
        const charCount = Math.floor(charPct * fullCmd.length);
        setTypedText(fullCmd.slice(0, charCount));
        setIsTyping(charCount < fullCmd.length);
        setShowOutput(false);
        setVisibleLineCount(0);
      } else {
        // Phase 2 (subProgress 0.4..1.0): Command typed, stream output lines progressively
        setTypedText(fullCmd);
        setIsTyping(false);
        setShowOutput(true);
        const linePct = (subProgress - 0.4) / 0.6;
        const count = Math.max(1, Math.floor(linePct * totalOutputLines));
        setVisibleLineCount(count);
      }
    };

    // RAF-throttle: native "scroll" can fire many times per animation frame
    // (especially during momentum/trackpad scroll), and each call recomputes
    // an inline filter+transform string. Without throttling this caused
    // multiple conflicting style writes per frame -- the terminal's
    // minimize/maximize reveal visibly flickered/strobed instead of tracking
    // the scrollbar smoothly. Coalescing to one computation per frame fixes it.
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        computeAndApply();
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    computeAndApply();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [activeCmdIdx]);

  // Tab click manual selection handler
  const handleTabClick = (idx: number) => {
    manualOverrideRef.current = true;
    clearTimeout(manualTimerRef.current ?? undefined);

    setActiveCmdIdx(idx);
    setTypedText(TERMINAL_COMMANDS[idx].command);
    setIsTyping(false);
    setShowOutput(true);
    setVisibleLineCount(TERMINAL_COMMANDS[idx].output.length);

    // Release manual override after 4s idle
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

  // Fade-in-only reveal, applied inline so it tracks the scrollbar 1:1.
  // Deliberately does NOT scale/translate/rotate the box: a continuously
  // changing `transform` on a text-heavy element causes the browser to
  // re-rasterize its text at intermediate scales every frame, which read
  // as flicker; keeping the box's own size and position constant avoids
  // that entirely. Once fully revealed, drop transform/filter to `none`
  // outright (same pattern used for settled hover cards elsewhere in this
  // codebase) so the terminal renders through the normal CPU/subpixel text
  // path instead of sitting on a GPU-composited layer indefinitely.
  const revealStyle: CSSProperties =
    revealProgress >= 0.999
      ? { opacity: 1, filter: "none", transform: "none" }
      : {
          opacity: revealProgress,
          filter: `blur(${((1 - revealProgress) * 4).toFixed(2)}px)`,
        };

  return (
    <div ref={sectionRef} className="terminal-scroll-section" style={{ height: `${TOTAL_SCROLL * 100}vh` }}>
      <div className="terminal-sticky-stage">
        <div className="section-header terminal-pinned-heading">
          <p className="section-kicker">Technical Capabilities</p>
          <h2>Interactive System Console &amp; Toolchains</h2>
          <p className="section-subtitle">
            Live developer terminal simulation and comprehensive skill matrix —
            inspecting verified languages, heterogeneous SoC platforms, wireless protocols, and automated CI/CD pipelines.
          </p>
        </div>
        <div
          className={`interactive-terminal-wrapper ${revealProgress > 0.85 ? "terminal-glow" : ""} ${
            isExpanded ? "terminal-expanded-mode" : ""
          }`}
          style={revealStyle}
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
                onClick={() => handleTabClick(idx)}
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
            <span className={`prompt-cursor ${isTyping || !showOutput ? "cursor-typing" : "cursor-blink"}`}>█</span>
          </div>

          {/* Command Output */}
          {showOutput && (
            <div className="terminal-output-container">
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
          )}
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
      </div>
      </div>
    </div>
  </div>
  );
}
