import { contactInfo } from "../../content/contact.ts";

export function Hero() {
  return (
    <section aria-label="Hero" className="hero-section" id="hero">
      <p className="hero-eyebrow">Embedded Systems Engineer</p>
      <h1 className="hero-headline">
        Embedded Systems, Linux BSP
        <br />
        &amp; Low-Level Architecture
      </h1>
      <p className="hero-tagline">
        Board bring-up, firmware, and systems software for hardware that ships.
        Nine years across Qualcomm, TI, NXP, and Xilinx platforms.
      </p>
      <div className="hero-actions">
        <a href="#work" className="btn btn-primary">
          Explore Projects <span aria-hidden="true">↗</span>
        </a>
        <a href="#services" className="btn btn-secondary">
          View Services
        </a>
        <a
          href={`mailto:${contactInfo.email}`}
          className="btn btn-tertiary"
        >
          Start a conversation <span aria-hidden="true">↗</span>
        </a>
      </div>
      <div className="hero-meta" aria-label="Capabilities">
        <span>Board bring-up</span>
        <span>Firmware</span>
        <span>Systems software</span>
      </div>
    </section>
  );
}
