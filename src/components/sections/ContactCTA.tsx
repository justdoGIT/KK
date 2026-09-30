import { type JSX } from "react";
import { contactInfo } from "../../content/contact.ts";
import { AstronautSpaceJourney } from "../ui/AstronautSpaceJourney.tsx";
import { ContactBanner } from "../ui/contact/ContactBanner.tsx";

export function ContactCTA(): JSX.Element {
  return (
    <section aria-label="Contact" className="contact-section" id="contact">
      <AstronautSpaceJourney />

      <ContactBanner>
        <div className="contact-frame-wrapper">
          {/* Corner Crosshairs */}
          <span className="contact-crosshair contact-ch-tl" aria-hidden="true">+</span>
          <span className="contact-crosshair contact-ch-tr" aria-hidden="true">+</span>
          <span className="contact-crosshair contact-ch-bl" aria-hidden="true">+</span>
          <span className="contact-crosshair contact-ch-br" aria-hidden="true">+</span>

          <div className="contact-inner">
            <div className="contact-status-pill">
              <span className="contact-live-dot" aria-hidden="true" />
              <span>AVAILABLE FOR GLOBAL CONTRACTS &amp; ADVISORY</span>
            </div>

            <h2 className="contact-heading">
              Ready to Build High-Reliability
              <span className="contact-heading-gradient"> Embedded &amp; Edge Systems?</span>
            </h2>

            <p className="contact-tagline">
              Whether you need a rapid board bring-up sprint, a hardened Yocto Linux BSP,
              real-time robotics control, or staff-level systems architecture leadership —
              let&rsquo;s discuss your technical goals.
            </p>

            <div className="contact-actions">
              <a
                href={`mailto:${contactInfo.email}?subject=Project%20Inquiry%20-%20Embedded%20Consultancy`}
                className="btn btn-primary btn-lg contact-main-btn"
              >
                Start a Conversation <span className="btn-arrow" aria-hidden="true">↗</span>
              </a>
              <a
                href={contactInfo.github}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-lg"
              >
                View GitHub Repositories <span className="btn-arrow" aria-hidden="true">↗</span>
              </a>
              <a
                href={contactInfo.linkedin}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-lg"
              >
                Connect on LinkedIn <span className="btn-arrow" aria-hidden="true">↗</span>
              </a>
            </div>

            {/* Client Assurance Invariants */}
            <div className="contact-assurances-grid" aria-label="Client service guarantees">
              <div className="assurance-item">
                <span className="assurance-icon">⚡</span>
                <div className="assurance-text">
                  <strong>Rapid Response</strong>
                  <p>Direct reply within 24 hours</p>
                </div>
              </div>
              <div className="assurance-item">
                <span className="assurance-icon">🔒</span>
                <div className="assurance-text">
                  <strong>NDA Protected</strong>
                  <p>Strict confidentiality guaranteed</p>
                </div>
              </div>
              <div className="assurance-item">
                <span className="assurance-icon">🌐</span>
                <div className="assurance-text">
                  <strong>Global Availability</strong>
                  <p>Remote worldwide or on-site sprints</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ContactBanner>
    </section>
  );
}
