import { useState, type JSX, type PointerEvent } from "react";
import { contactInfo } from "../../content/contact.ts";
import { InteractionHint } from "../ui/InteractionHint.tsx";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { useMediaQuery } from "../../motion/use-media-query.ts";
import { SceneEntry } from "../../scene/SceneEntry.tsx";

export function Hero(): JSX.Element {
  const enhanced = useMotionMode() === "enhanced";
  const mobile = useMediaQuery("(max-width: 767px)");
  const [headingHoverPos, setHeadingHoverPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

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
        <span className="hero-crosshair hero-crosshair-tl" aria-hidden="true">
          +
        </span>
        <span className="hero-crosshair hero-crosshair-tr" aria-hidden="true">
          +
        </span>
        <span className="hero-crosshair hero-crosshair-bl" aria-hidden="true">
          +
        </span>
        <span className="hero-crosshair hero-crosshair-br" aria-hidden="true">
          +
        </span>

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

          {mobile && (
            <div className="hero-mobile-art" aria-hidden="true">
              <SceneEntry />
            </div>
          )}

          <div
            className="hero-details"
            aria-label={mobile ? "Introduction and links" : undefined}
          >
            <p className="hero-tagline">
              {mobile ? "Board bring-up, firmware and Linux systems that ship. Nine years across Qualcomm, TI, NXP and Xilinx." : <>Board bring-up, real-time firmware, and systems software for
              hardware that ships. Nine years architecting across Qualcomm, TI,
              NXP, and Xilinx platforms.</>}
            </p>

            <div className="hero-actions">
              <a href="#work" className="btn btn-primary hero-btn-main">
                Explore Projects{" "}
                <span className="btn-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
              <a href="#services" className="btn btn-secondary">
                View Services
              </a>
              <a
                href={`mailto:${contactInfo.email}`}
                className="btn btn-tertiary"
              >
                Start a conversation{" "}
                <span className="btn-arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            </div>

            <div className="hero-meta" aria-label="Core Capabilities">
              <span>{mobile ? "BSP & Bring-up" : "Board bring-up & BSP"}</span>
              <span>{mobile ? "RTOS · C/C++" : "RTOS & Low-Level C/C++"}</span>
              <span>{mobile ? "Robotics & Motion" : "Robotics & Actuators"}</span>
              <span>{mobile ? "Edge AI · NPU" : "Edge AI & NPU Acceleration"}</span>
            </div>
            {enhanced ? (
              <InteractionHint
                className="hero-tour-hint"
                pointer="Take your time. The tour pauses to let you read. Scroll or click to take control; resume beneath my name."
                touch="Scroll to explore · Play the tour in the header."
              />
            ) : (
              <p className="interaction-hint hero-tour-hint">
                Explore at your own pace, or start the reading tour in the
                header.
              </p>
            )}
          </div>
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
