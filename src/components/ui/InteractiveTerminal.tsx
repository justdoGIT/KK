import { useEffect, useState, useRef, type CSSProperties, type JSX } from "react";
import { useGuidedScroll } from "../../motion/guided-scroll.ts";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { clamp01, useScrollFrame } from "../../motion/scroll-frame.ts";
import { LusionKineticHeading } from "./LusionKineticHeading.tsx";
import { TERMINAL_COMMANDS } from "../../content/terminal.ts";
import { REVEAL_FRACTION, terminalState, type TerminalState } from "./terminal-runner.ts";

const TOTAL_SCROLL = 5.5;

// Reveal style at scroll-progress 0, applied until the first scheduler tick
// writes a live value — matches `computeAndApply`'s popProgress===0 case so
// there is no unstyled flash between first paint and first frame.
const INITIAL_REVEAL_STYLE: CSSProperties = {
  opacity: 0.1,
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
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  const sectionRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const manualOverrideRef = useRef(false);
  const manualTimerRef = useRef<number | null>(null);
  useGuidedScroll(sectionRef, enhanced, { target: 0.94, seconds: 12 });

  const activeCommand = TERMINAL_COMMANDS[activeCmdIdx];
  const scriptRef = useRef<TerminalState>({ cmdIndex: 0, typedChars: null, lines: 0 });

  useEffect(() => () => {
    clearTimeout(manualTimerRef.current ?? undefined);
  }, []);

  // Scroll-linked reveal (opacity/transform/clipPath) is a continuous per-frame
  // value written straight to the wrapper's style — it never needs a React
  // commit. Only the terminal script's text content (typed command,
  // visible output lines, active tab) is state, and only changes at the
  // discrete steps the script advances through.
  const progressRef = useRef({ raw: 0, pop: 0 });
  useScrollFrame(
    () => {
      const el = sectionRef.current;
      if (!el) return;
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const raw = clamp01(-el.getBoundingClientRect().top / scrollable);
      progressRef.current.raw = raw;
      progressRef.current.pop = Math.min(1, raw / REVEAL_FRACTION);
    },
    () => {
      const { raw, pop: popProgress } = progressRef.current;

      const wrapper = wrapperRef.current;
      if (wrapper && !isMinimized) {
        const invReveal = 1 - popProgress;
        if (popProgress >= 0.999) {
          wrapper.style.opacity = "1";
          wrapper.style.transform = "none";
          wrapper.style.clipPath = "none";
        } else {
          wrapper.style.opacity = (0.1 + popProgress * 0.9).toFixed(3);
          wrapper.style.transform = `perspective(1200px) translate3d(${(invReveal * -120).toFixed(1)}px, ${(invReveal * 90).toFixed(1)}px, ${(invReveal * -40).toFixed(1)}px) scale(${(0.42 + popProgress * 0.58).toFixed(3)}) rotateX(${(invReveal * 14).toFixed(2)}deg) rotateY(${(invReveal * -9).toFixed(2)}deg)`;
          wrapper.style.clipPath = `inset(0% ${(invReveal * 20).toFixed(1)}% ${(invReveal * 25).toFixed(1)}% 0% round ${(16 * popProgress).toFixed(1)}px)`;
        }
      }
      wrapper?.classList.toggle("terminal-glow", popProgress > 0.85);

      if (manualOverrideRef.current) return;

      const next = terminalState(raw, scriptRef.current, TERMINAL_COMMANDS);
      scriptRef.current = next;
      const cmd = TERMINAL_COMMANDS[next.cmdIndex];
      if (next.cmdIndex !== activeCmdIdx) setActiveCmdIdx(next.cmdIndex);

      const typed = next.typedChars === null ? "" : cmd.command.slice(0, next.typedChars);
      if (typed !== typedText) setTypedText(typed);
      const typing = next.typedChars !== null && next.typedChars < cmd.command.length;
      if (typing !== isTyping) setIsTyping(typing);
      const showing = next.lines > 0;
      if (showing !== showOutput) setShowOutput(showing);
      if (next.lines !== visibleLineCount) setVisibleLineCount(next.lines);
    },
    enhanced && !isMinimized,
  );

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

  const copyOutput = async () => {
    const text = `$ ${activeCommand.command}\n${activeCommand.output.join("\n")}`;
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };

  const visibleOutput = enhanced ? activeCommand.output.slice(0, visibleLineCount) : activeCommand.output;

  return (
    <div ref={sectionRef} className="terminal-scroll-section" style={enhanced ? { height: `${TOTAL_SCROLL * 100}vh` } : undefined}>
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
          style={!enhanced || isMinimized ? undefined : INITIAL_REVEAL_STYLE}
        >
          <div className="terminal-window">
            {/* Terminal Title Bar */}
            <div className="terminal-titlebar">
              <div className="terminal-window-buttons">
                <button type="button" className="window-btn btn-close" onClick={() => setIsMinimized(true)} aria-label="Minimize terminal" />
                <button type="button" className="window-btn btn-min" onClick={() => setIsMinimized((prev) => !prev)} aria-label="Minimize or restore terminal" />
                <button type="button" className="window-btn btn-max" onClick={() => setIsExpanded((prev) => !prev)} aria-label="Expand terminal" />
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
                  {copyStatus === "copied" ? "Copied" : copyStatus === "failed" ? "Copy unavailable" : "Copy"}
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
                    <span className="prompt-typed-text">{enhanced ? typedText : activeCommand.command}</span>
                    <span className={`prompt-cursor ${enhanced && (isTyping || !showOutput) ? "cursor-typing" : "cursor-blink"}`}>█</span>
                  </div>

                  {/* Command Output Container */}
                  <div className={`terminal-output-container ${!enhanced || showOutput ? "output-active" : "output-hidden"}`}>
                    {visibleOutput.map((line, idx) => (
                      <div key={idx} className="terminal-output-line">
                        {line}
                      </div>
                    ))}
                    {visibleOutput.length >= activeCommand.output.length && (
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
