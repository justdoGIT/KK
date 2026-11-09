import { useState, useEffect, useRef, type CSSProperties, type JSX } from "react";
import { services, type Service } from "../../content/services.ts";
import { LusionKineticHeading } from "../ui/LusionKineticHeading.tsx";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { useMediaQuery } from "../../motion/use-media-query.ts";
import { useGuidedScroll } from "../../motion/guided-scroll.ts";
import { scrollToY } from "../../motion/smooth-scroll.ts";
import { clamp01, useScrollFrame } from "../../motion/scroll-frame.ts";
import { throwFrame, throwPose, throwProgressFor } from "../../motion/throw-deck.ts";
import { MOBILE_BOARD_QUERY, MobileBoardCarousel } from "../ui/MobileBoardCarousel.tsx";
import { useServiceDeckFit } from "../../motion/service-deck-fit.ts";
import "../../styles/services-throw.css";
import { InteractionHint } from "../ui/InteractionHint.tsx";

// Viewport height of scroll spent per thrown card.
const SCROLL_PER_CARD_VH = 95;

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
  const mobile = useMediaQuery(MOBILE_BOARD_QUERY);
  const [activeCard, setActiveCard] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const { fits, stackStep } = useServiceDeckFit(sectionRef, cardRefs, !mobile);
  const order = services.map((_, i) => i);
  const throwMode = enhanced && fits && !mobile;
  useGuidedScroll(trackRef, throwMode, {
    target: throwProgressFor(services.length - 1, services.length),
    seconds: 96,
  });

  // Stacked layout: the most visible card is the active tab.
  useEffect(() => {
    if (throwMode || mobile) return;
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
  }, [throwMode, mobile]);

  // Throw layout: scroll position drives each card's flight and straightening.
  const frameRef = useRef(throwFrame(0, services.length));
  useScrollFrame(
    () => {
      const section = trackRef.current;
      if (!section) return;
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
      frameRef.current = throwFrame(clamp01(-section.getBoundingClientRect().top / scrollable), services.length);
    },
    () => {
      let top = order[0];
      order.forEach((index, rank) => {
        const card = cardRefs.current[index];
        if (!card) return;
        const pose = throwPose(rank, frameRef.current, services.length, stackStep);
        card.dataset.settled = String(pose.settled);
        card.style.transform = pose.transform;
        card.style.opacity = pose.opacity.toFixed(3);
        card.style.setProperty("--covered", pose.covered.toFixed(3));
        card.style.visibility = pose.visible ? "visible" : "hidden";
        if (pose.visible && pose.opacity >= 0.95) top = index;
      });
      cardRefs.current.forEach((card, index) => {
        if (card) card.inert = index !== top;
      });
      setActiveCard(top);
    },
    throwMode,
  );

  useEffect(() => {
    if (throwMode) return;
    cardRefs.current.forEach((card) => {
      if (!card) return;
      card.style.transform = "";
      card.style.opacity = "";
      card.style.visibility = "";
      card.style.removeProperty("--covered");
      delete card.dataset.settled;
      card.inert = false;
    });
  }, [throwMode]);

  const scrollToCard = (index: number) => {
    setActiveCard(index);
    const section = trackRef.current;
    if (throwMode && section) {
      const scrollable = section.offsetHeight - window.innerHeight;
      const top = section.getBoundingClientRect().top + window.scrollY;
      scrollToY(top + scrollable * throwProgressFor(order.indexOf(index), services.length));
      return;
    }
    const card = cardRefs.current[index];
    const container = card?.parentElement;
    if (card && container) {
      const gap = parseFloat(getComputedStyle(container).rowGap) || 0;
      const preceding = order.slice(0, order.indexOf(index));
      const offset = preceding.reduce((sum, i) => sum + (cardRefs.current[i]?.offsetHeight ?? 0) + gap, 0);
      scrollToY(container.getBoundingClientRect().top + window.scrollY + offset - 88);
    }
  };

  if (mobile) {
    return (
      <section className="services-section mobile-board-section" id="services" aria-label="Services">
        <div className="section-header">
          <LusionKineticHeading kicker="Areas of Expertise" text="Systems Consultancy & Architecture" />
        </div>
        <MobileBoardCarousel label="Service domains">
          {services.map((service, index) => (
            <article key={service.id} className="service-card-deck-item card-focused" aria-label={`${service.title} service details`}>
              <ServiceCardBody service={service} index={index} />
            </article>
          ))}
        </MobileBoardCarousel>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Services"
      className={`services-section services-desktop${throwMode ? " services-throw" : enhanced ? " services-stack" : ""}`}
      id="services"
    >
        <div className="section-header">
          <LusionKineticHeading
            kicker="Areas of Expertise"
            text="Systems Consultancy & Architecture"
            subtitle="Full-stack embedded, robotics, and edge intelligence engineering — delivering high-reliability software from custom silicon to autonomous field deployment."
          />
        </div>

        <div className="services-deck-nav" role="tablist" aria-label="Service domains">
          {order.map(idx => (
            <button
              key={services[idx].id}
              type="button"
              role="tab"
              aria-selected={activeCard === idx}
              className={`services-deck-tab ${activeCard === idx ? "active" : ""}`}
              onClick={() => scrollToCard(idx)}
            >
              <span className="services-tab-num">{String(idx + 1).padStart(2, "0")}</span>
              <span className="services-tab-title">{services[idx].domain}</span>
            </button>
          ))}
        </div>
        <InteractionHint pointer="The tour reveals each board in order. Scroll to take control, or choose a domain above."
          touch="Scroll to explore the stack, or tap a domain above. Resume the tour in the header." />

      <div ref={trackRef} className="services-deck-track"
        style={throwMode ? { height: `${services.length * SCROLL_PER_CARD_VH + 100}vh` } : undefined}>
      <div className={`services-desktop-stage${throwMode ? " services-throw-stage" : ""}`}>
        <div className={throwMode ? "services-throw-table" : "services-deck-container"}
          style={{ "--stack-height": `${(services.length - 1) * stackStep}px` } as CSSProperties}>
          {order.map((idx, rank) => (
            <article
              key={services[idx].id}
              data-service-id={services[idx].id}
              data-stack-rank={rank}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className={`service-card-deck-item ${activeCard === idx ? "card-focused" : ""}`}
              tabIndex={0}
              aria-label={`${services[idx].title} service details`}
              style={{ zIndex: rank + 1, "--stack-offset": `${rank * stackStep}px` } as CSSProperties}
            >
              <ServiceCardBody service={services[idx]} index={idx} />
            </article>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}
