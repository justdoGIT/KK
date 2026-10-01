import { useState, useEffect, useRef, type CSSProperties, type JSX } from "react";
import { services, type Service } from "../../content/services.ts";
import { LusionKineticHeading } from "../ui/LusionKineticHeading.tsx";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { useMediaQuery } from "../../motion/use-media-query.ts";
import { useGuidedScroll } from "../../motion/guided-scroll.ts";
import { scrollToY } from "../../motion/smooth-scroll.ts";
import { clamp01, useScrollFrame } from "../../motion/scroll-frame.ts";
import { throwFrame, throwPose, throwProgressFor } from "../../motion/throw-deck.ts";
import "../../styles/services-throw.css";

// Viewport height of scroll spent per thrown card.
const SCROLL_PER_CARD_VH = 95;
const THROW_QUERY = "(min-width: 1024px) and (min-height: 700px)";

function ServiceCardBody({ service, index }: { service: Service; index: number }): JSX.Element {
  return (
    <>
      <div className="service-card-topbar">
        <div className="service-card-badge-group">
          <span className="service-badge-pill">{service.badge}</span>
          <span className="service-domain-tag">{service.domain}</span>
        </div>
        <span className="service-card-watermark">{String(index + 1).padStart(2, "0")}</span>
      </div>

      <div className="service-card-main">
        <h3 className="service-card-title">{service.title}</h3>
        <p className="service-card-desc">{service.description}</p>

        <div className="service-card-capabilities">
          <h4>Core Engineering Capabilities</h4>
          <ul className="service-capabilities-list">
            {service.capabilities.map((cap) => (
              <li key={cap}>
                <span className="cap-bullet" aria-hidden="true">▹</span>
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="service-card-side">
        <div className="service-card-matrix">
          <div className="service-matrix-col">
            <h4>Protocols &amp; Wireless RF</h4>
            <div className="service-chip-list">
              {service.protocolsAndRf.map((proto) => (
                <span key={proto} className="service-matrix-chip chip-protocol">{proto}</span>
              ))}
            </div>
          </div>
          <div className="service-matrix-col">
            <h4>Verified Target Silicon</h4>
            <div className="service-chip-list">
              {service.hardwareTargets.map((hw) => (
                <span key={hw} className="service-matrix-chip chip-hw">{hw}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="service-card-footer">
          <h4>Key Deliverables</h4>
          <div className="service-deliverables-pills">
            {service.deliverables.map((deliv) => (
              <span key={deliv} className="service-deliv-pill">✓ {deliv}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function Services(): JSX.Element {
  const enhanced = useMotionMode() === "enhanced";
  const wide = useMediaQuery(THROW_QUERY);
  const throwMode = enhanced && wide;
  const [activeCard, setActiveCard] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  useGuidedScroll(sectionRef, throwMode, 0.94, 300);

  // Stacked layout: the most visible card is the active tab.
  useEffect(() => {
    if (throwMode) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const index = intersecting ? cardRefs.current.indexOf(intersecting.target as HTMLElement) : -1;
        if (index >= 0) setActiveCard(index);
      },
      { threshold: [0.5, 0.8], rootMargin: "-25% 0px -25%" },
    );
    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [throwMode]);

  // Throw layout: scroll position drives each card's flight and straightening.
  useScrollFrame(() => {
    const section = sectionRef.current;
    if (!section) return;
    const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
    const frame = throwFrame(clamp01(-section.getBoundingClientRect().top / scrollable), services.length);
    let top = 0;
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const pose = throwPose(index, frame, services.length);
      card.style.transform = pose.transform;
      card.style.opacity = pose.opacity.toFixed(3);
      card.style.setProperty("--covered", pose.covered.toFixed(3));
      card.style.visibility = pose.visible ? "visible" : "hidden";
      if (pose.visible) top = index;
    });
    cardRefs.current.forEach((card, index) => {
      if (card) card.inert = index !== top;
    });
    setActiveCard(top);
  }, throwMode);

  useEffect(() => {
    if (throwMode) return;
    cardRefs.current.forEach((card) => {
      if (!card) return;
      card.style.transform = "";
      card.style.opacity = "";
      card.style.visibility = "";
      card.style.removeProperty("--covered");
      card.inert = false;
    });
  }, [throwMode]);

  const scrollToCard = (index: number) => {
    setActiveCard(index);
    const section = sectionRef.current;
    if (throwMode && section) {
      const scrollable = section.offsetHeight - window.innerHeight;
      const top = section.getBoundingClientRect().top + window.scrollY;
      scrollToY(top + scrollable * throwProgressFor(index, services.length));
      return;
    }
    const card = cardRefs.current[index];
    if (card) {
      const rect = card.getBoundingClientRect();
      scrollToY(rect.top + window.scrollY - window.innerHeight / 2 + rect.height / 2);
    }
  };

  return (
    <section
      ref={sectionRef}
      aria-label="Services"
      className={`services-section${throwMode ? " services-throw" : ""}`}
      id="services"
      style={throwMode ? { height: `${services.length * SCROLL_PER_CARD_VH + 100}vh` } : undefined}
    >
      <div className={throwMode ? "services-throw-stage" : undefined}>
        <div className="section-header">
          <LusionKineticHeading
            kicker="Areas of Expertise"
            text="Systems Consultancy & Architecture"
            subtitle="Full-stack embedded, robotics, and edge intelligence engineering — delivering high-reliability software from custom silicon to autonomous field deployment."
          />
        </div>

        <div className="services-deck-nav" role="tablist" aria-label="Service domains">
          {services.map((service: Service, idx: number) => (
            <button
              key={service.id}
              type="button"
              role="tab"
              aria-selected={activeCard === idx}
              className={`services-deck-tab ${activeCard === idx ? "active" : ""}`}
              onClick={() => scrollToCard(idx)}
            >
              <span className="services-tab-num">{String(idx + 1).padStart(2, "0")}</span>
              <span className="services-tab-title">{service.domain}</span>
            </button>
          ))}
        </div>

        <div className={throwMode ? "services-throw-table" : "services-deck-container"}>
          {services.map((service: Service, idx: number) => (
            <article
              key={service.id}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className={`service-card-deck-item ${activeCard === idx ? "card-focused" : ""}`}
              tabIndex={0}
              aria-label={`${service.title} service details`}
              style={throwMode
                ? { zIndex: idx + 1 }
                : ({ top: `calc(5.5rem + ${idx * 1.2}rem)`, zIndex: idx + 1 } as CSSProperties)}
            >
              <ServiceCardBody service={service} index={idx} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
