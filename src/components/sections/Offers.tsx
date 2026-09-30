import { useRef, type JSX, type Ref } from "react";
import { contactInfo } from "../../content/contact.ts";
import { useGridScrollReveal } from "../../motion/grid-scroll-reveal.ts";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { LusionKineticHeading } from "../ui/LusionKineticHeading.tsx";

type Offer = {
  index: string;
  badge: string;
  title: string;
  timeline: string;
  promise: string;
  deliverables: string[];
  bestFor: string;
  cta: string;
  featured?: boolean;
};

const offers: Offer[] = [
  {
    index: "01",
    badge: "RAPID EXECUTION",
    title: "Turnkey Bring-Up & BSP Sprint",
    timeline: "2 – 4 Weeks",
    promise: "Transform prototype silicon into a verified, production-stable hardware platform.",
    deliverables: [
      "PMIC power rail sequencing & reset timing validation",
      "Custom U-Boot bootloader & device tree authoring",
      "Kernel device drivers for all onboard peripherals (SPI/I2C/UART/CAN)",
      "Comprehensive JTAG, oscilloscope & ftrace diagnostic evidence pack",
      "Factory test firmware & flashing scripts for manufacturing lines",
    ],
    bestFor: "Hardware teams with newly fabricated prototype boards needing rapid first-boot validation.",
    cta: "Book Bring-Up Sprint",
  },
  {
    index: "02",
    badge: "MOST POPULAR",
    title: "Production Embedded Linux Platform",
    timeline: "4 – 8 Weeks",
    promise: "Build an industrial-grade, secure, and atomic-updatable Linux distribution.",
    deliverables: [
      "Custom Yocto Project (Kirkstone / Scarthgap) layer & recipe repo",
      "Hardware Security Module (HSM) Root-of-Trust & signed Secure Boot",
      "Hardened SELinux userspace policies & encrypted storage",
      "Atomic OSTree A/B OTA update server & fail-safe rollback daemon",
      "Automated Hardware-in-the-Loop (HIL) regression testing pipeline",
    ],
    bestFor: "Commercial products scaling to mass production requiring zero field bricking and long-term LTS support.",
    cta: "Architect Linux Platform",
    featured: true,
  },
  {
    index: "03",
    badge: "ADVANCED SYSTEMS",
    title: "Robotics, Control & Edge AI Systems",
    timeline: "6 – 10 Weeks",
    promise: "Deploy deterministic real-time motion control and on-device neural intelligence.",
    deliverables: [
      "ROS / ROS2 real-time node architecture & trajectory kinematics",
      "EtherCAT & CAN-FD industrial motor driver coordination",
      "3D Time-of-Flight (IFM O3D) point cloud & V4L2 video capture pipelines",
      "On-device NPU quantization (INT8 / FP8) with Qualcomm SNPE / TensorRT",
      "Sub-3ms deterministic control loops with zero-copy shared memory",
    ],
    bestFor: "Autonomous robots, EV chargers, smart medical devices, and intelligent computer vision platforms.",
    cta: "Launch Robotics & AI System",
  },
  {
    index: "04",
    badge: "STRATEGIC LEADERSHIP",
    title: "Fractional Staff Systems Architect",
    timeline: "Quarterly / Ongoing",
    promise: "Senior technical direction, silicon selection, and high-velocity team acceleration.",
    deliverables: [
      "Silicon selection audits (Qualcomm vs TI vs NXP vs Xilinx vs STM32)",
      "Schematic & PCB layout review for signal integrity and bring-up readiness",
      "Zero-copy architecture design (Stratum-TSDB, asynchronous IPC)",
      "Production security compliance & penetration test remediation",
      "Mentoring and unblocking embedded firmware & systems teams",
    ],
    bestFor: "Engineering leadership and hardware startups needing staff-level architectural guidance.",
    cta: "Retain Staff Architect",
  },
];
// Cards rise out of the depth of the page, tilted back, and stand upright.
function offerTransform(inv: number, index: number): string {
  const swing = index % 2 === 0 ? -1 : 1;
  return (
    `perspective(1400px) translate3d(0, ${(inv * 120).toFixed(1)}px, ${(-inv * 220).toFixed(1)}px) ` +
    `rotateX(${(inv * 28).toFixed(2)}deg) rotateZ(${(swing * inv * 3).toFixed(2)}deg)`
  );
}

function OfferCard({ offer, cardRef }: { offer: Offer; cardRef: Ref<HTMLElement> }) {
  return (
    <article
      ref={cardRef}
      className={`offer-card ${offer.featured ? "offer-card-featured" : ""}`}
    >
      {/* Topline Badge & Index */}
      <div className="offer-topline">
        <span className="offer-index">{offer.index}</span>
        <div className="offer-badges-group">
          <span className="offer-timeline-pill">{offer.timeline}</span>
          {offer.featured && (
            <span className="offer-badge">{offer.badge}</span>
          )}
        </div>
      </div>

      {/* Title & Promise */}
      <h3>{offer.title}</h3>
      <p className="offer-promise">{offer.promise}</p>

      {/* Target Client Profile */}
      <div className="offer-bestfor">
        <span className="bestfor-label">IDEAL FOR:</span>
        <p className="bestfor-text">{offer.bestFor}</p>
      </div>

      {/* Key Deliverables */}
      <div className="offer-deliverables-block">
        <span className="deliv-heading">GUARANTEED DELIVERABLES:</span>
        <ul className="offer-deliv-list">
          {offer.deliverables.map((detail) => (
            <li key={detail}>
              <span className="deliv-bullet" aria-hidden="true">✓</span>
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action CTA */}
      <div className="offer-cta-wrap">
        <a
          className="btn btn-primary offer-link-btn"
          href={`mailto:${contactInfo.email}?subject=${encodeURIComponent(
            `Project Inquiry: ${offer.title}`,
          )}`}
        >
          {offer.cta} <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}

export function Offers(): JSX.Element {
  const enhanced = useMotionMode() === "enhanced";
  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  useGridScrollReveal(gridRef, cardRefs, offerTransform, enhanced);

  return (
    <section className="offers-section" id="offers" aria-label="Services and offers">
      <div className="section-header offers-header">
        <LusionKineticHeading
          kicker="Client Engagement Models"
          variant="scatter"
          subtitle="High-impact, deterministic engineering engagements designed to de-risk hardware, accelerate time-to-market, and establish rock-solid production platforms."
          parts={[
            { text: "How We Can " },
            { text: "Collaborate", kinetic: true, theme: true },
          ]}
        />
      </div>

      <div ref={gridRef} className={`offers-grid ${enhanced ? "is-scroll-reveal" : ""}`}>
        {offers.map((offer, idx) => (
          <OfferCard
            offer={offer}
            key={offer.title}
            cardRef={(el) => {
              cardRefs.current[idx] = el;
            }}
          />
        ))}
      </div>
    </section>
  );
}
