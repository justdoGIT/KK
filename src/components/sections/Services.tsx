import { useState, useEffect, useRef, type JSX } from "react";
import { services, type Service } from "../../content/services.ts";

export function Services(): JSX.Element {
  const [activeCard, setActiveCard] = useState(0);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (intersecting?.target) {
          const index = cardRefs.current.indexOf(intersecting.target as HTMLElement);
          if (index >= 0) {
            setActiveCard(index);
          }
        }
      },
      { threshold: [0.2, 0.5, 0.8], rootMargin: "-10% 0px -20%" },
    );

    cardRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToCard = (index: number) => {
    setActiveCard(index);
    const el = cardRefs.current[index];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <section aria-label="Services" className="services-section" id="services">
      <div className="section-header">
        <p className="section-kicker">Areas of Expertise</p>
        <h2>Systems Consultancy &amp; Architecture</h2>
        <p className="section-subtitle">
          Full-stack embedded, robotics, and edge intelligence engineering —
          delivering high-reliability software from custom silicon to autonomous field deployment.
        </p>
      </div>

      {/* Domain Quick-Select Deck Tabs */}
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

      {/* Lusion-Style Stacking Card Deck */}
      <div className="services-deck-container">
        {services.map((service: Service, idx: number) => (
          <article
            key={service.id}
            ref={(el) => {
              cardRefs.current[idx] = el;
            }}
            className={`service-card-deck-item ${activeCard === idx ? "card-focused" : ""}`}
            style={{
              top: `calc(5.5rem + ${idx * 1.2}rem)`,
              zIndex: idx + 1,
            }}
          >
            {/* Top Bar */}
            <div className="service-card-topbar">
              <div className="service-card-badge-group">
                <span className="service-badge-pill">{service.badge}</span>
                <span className="service-domain-tag">{service.domain}</span>
              </div>
              <span className="service-card-watermark">{String(idx + 1).padStart(2, "0")}</span>
            </div>

            {/* Main Title & Description */}
            <h3 className="service-card-title">{service.title}</h3>
            <p className="service-card-desc">{service.description}</p>

            {/* Core Capabilities Grid */}
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

            {/* Hardware, RF & Protocols Matrix */}
            <div className="service-card-matrix">
              <div className="service-matrix-col">
                <h4>Protocols &amp; Wireless RF</h4>
                <div className="service-chip-list">
                  {service.protocolsAndRf.map((proto) => (
                    <span key={proto} className="service-matrix-chip chip-protocol">
                      {proto}
                    </span>
                  ))}
                </div>
              </div>

              <div className="service-matrix-col">
                <h4>Verified Target Silicon</h4>
                <div className="service-chip-list">
                  {service.hardwareTargets.map((hw) => (
                    <span key={hw} className="service-matrix-chip chip-hw">
                      {hw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Deliverables Footer */}
            <div className="service-card-footer">
              <h4>Key Deliverables</h4>
              <div className="service-deliverables-pills">
                {service.deliverables.map((deliv) => (
                  <span key={deliv} className="service-deliv-pill">
                    ✓ {deliv}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
