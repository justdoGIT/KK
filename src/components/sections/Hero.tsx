import { useState, type JSX, type PointerEvent } from "react";
import { contactInfo } from "../../content/contact.ts";
import { InteractionHint } from "../ui/InteractionHint.tsx";
import { useMotionMode } from "../../motion/use-motion-mode.ts";

export function Hero(): JSX.Element {
  const enhanced = useMotionMode() === "enhanced";
  const [headingHoverPos, setHeadingHoverPos] = useState<{ x: number; y: number } | null>(null);

  const handleHeadingMove = (e: PointerEvent<HTMLHeadingElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setHeadingHoverPos({ x, y });
  };

  const handleHeadingLeave = () => {
    setHeadingHoverPos(null);
  };

  return (
    <section aria-label="Hero" className="hero-section" id="hero">
      <div className="hero-frame-container">
        {/* Corner Crosshair Accents */}
        <span className="hero-crosshair hero-crosshair-tl" aria-hidden="true">+</span>
        <span className="hero-crosshair hero-crosshair-tr" aria-hidden="true">+</span>
        <span className="hero-crosshair hero-crosshair-bl" aria-hidden="true">+</span>
        <span className="hero-crosshair hero-crosshair-br" aria-hidden="true">+</span>

        {/* Content Wrapper */}
        <div className="hero-content">
          <div className="hero-badge" aria-label="Domain Focus">
            <span className="hero-badge-pulse" aria-hidden="true" />
            <span className="hero-badge-text">
              EMBEDDED • ROBOTICS • EDGE AI ARCHITECTURE
            </span>
          </div>

          <h1
            className={`hero-headline ${headingHoverPos ? "headline-ripple-active" : ""}`}
            onPointerMove={handleHeadingMove}
            onPointerLeave={handleHeadingLeave}
            style={
              headingHoverPos
                ? ({
                    "--mouse-x": `${headingHoverPos.x}%`,
                    "--mouse-y": `${headingHoverPos.y}%`,
                  } as React.CSSProperties)
                : undefined
            }
          >
            Embedded Systems, Linux BSP
            <span className="hero-headline-accent">
              &amp; Low-Level Architecture
            </span>
          </h1>

          <p className="hero-tagline">
            Board bring-up, real-time firmware, and systems software for
            hardware that ships. Nine years architecting across Qualcomm, TI,
            NXP, and Xilinx platforms.
          </p>

          <div className="hero-actions">
            <a href="#work" className="btn btn-primary hero-btn-main">
              Explore Projects <span className="btn-arrow" aria-hidden="true">↗</span>
            </a>
            <a href="#services" className="btn btn-secondary">
              View Services
            </a>
            <a
              href={`mailto:${contactInfo.email}`}
              className="btn btn-tertiary"
            >
              Start a conversation <span className="btn-arrow" aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="hero-meta" aria-label="Core Capabilities">
            <span>Board bring-up &amp; BSP</span>
            <span>RTOS &amp; Low-Level C/C++</span>
            <span>Robotics &amp; Actuators</span>
            <span>Edge AI &amp; NPU Acceleration</span>
          </div>
          {enhanced ? <InteractionHint className="hero-tour-hint"
            pointer="Take your time. The tour pauses to let you read. Scroll or click to take control; resume beneath my name."
            touch="Take your time. The tour reads through every board. Touch to pause; resume in the header." />
            : <p className="interaction-hint hero-tour-hint">Explore at your own pace, or start the reading tour in the header.</p>}
        </div>

        {/* Bottom Technical Coordinate Watermark */}
        <div className="hero-frame-footer" aria-hidden="true">
          <span>[ ARCH: AARCH64 / RISC-V / DSP ]</span>
          <span>[ PERSISTENT FLUID RIPPLE // ACTIVE ON HOVER ]</span>
        </div>
      </div>
    </section>
  );
}
