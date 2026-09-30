import { type JSX } from "react";
import { contactInfo } from "../../../content/contact.ts";

/**
 * Finale card the astronaut lands on: the site-themed panel whose top edge is
 * the seat. The heading pops once he has settled and started waving.
 */
export function JourneyEndContent(): JSX.Element {
  return (
    <div className="aj-end-card">
      <div className="aj-end-card-inner">
        <div className="aj-end-status">
          <span className="aj-end-dot" aria-hidden="true" />
          <span>Available for global contracts &amp; advisory</span>
        </div>

        <p className="aj-end-kicker">Is your next embedded product ready for launch?</p>

        <h2 className="aj-end-title">Let&rsquo;s innovate together</h2>

        <p className="aj-end-tagline">
          Rapid board bring-up, a hardened Yocto Linux BSP, real-time robotics control, or
          staff-level systems architecture leadership &mdash; bring the hard part.
        </p>

        <div className="aj-end-actions">
          <a className="aj-pill" href={`mailto:${contactInfo.email}?subject=Mission%20Launch%20Inquiry`}>
            Start a conversation <span aria-hidden="true">↗</span>
          </a>
          <a className="aj-pill aj-pill-ghost" href={contactInfo.github} target="_blank" rel="noreferrer">
            Explore repositories <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}
