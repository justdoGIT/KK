import { contactInfo } from "../../content/contact.ts";

type Offer = {
  index: string;
  title: string;
  promise: string;
  details: string[];
  cta: string;
  featured?: boolean;
};

const offers: Offer[] = [
  {
    index: "01",
    title: "Bring-up Sprint",
    promise: "Turn an unknown board into a measurable system.",
    details: ["Boot chain audit", "Kernel and device-tree path", "UART/JTAG evidence pack"],
    cta: "Start a bring-up sprint",
  },
  {
    index: "02",
    title: "Embedded Linux Platform",
    promise: "Build the reliable layer your product can grow on.",
    details: ["Yocto/BSP architecture", "OTA and power strategy", "Hardware-in-the-loop verification"],
    cta: "Plan the platform",
    featured: true,
  },
  {
    index: "03",
    title: "Fleet & Runtime Advisory",
    promise: "Make deployed systems observable, recoverable, and ready to scale.",
    details: ["Runtime boundaries", "Telemetry and evidence", "Deployment and recovery design"],
    cta: "Map the runtime",
  },
];

export function Offers() {
  return (
    <section className="offers-section" id="offers" aria-label="Services and offers">
      <div className="section-header offers-header">
        <div>
          <p className="section-kicker">Ways to work together</p>
          <h2>Choose the next mission.</h2>
        </div>
        <p className="section-subtitle">Focused engagements for teams building hardware, platforms, and dependable connected products.</p>
      </div>
      <div className="offers-grid">
        {offers.map((offer) => (
          <article className={`offer-card ${offer.featured ? "offer-card-featured" : ""}`} key={offer.title}>
            <div className="offer-topline">
              <span>{offer.index}</span>
              {offer.featured && <span className="offer-badge">Most useful starting point</span>}
            </div>
            <h3>{offer.title}</h3>
            <p className="offer-promise">{offer.promise}</p>
            <ul>
              {offer.details.map((detail) => <li key={detail}>{detail}</li>)}
            </ul>
            <a className="offer-link" href={`mailto:${contactInfo.email}?subject=${encodeURIComponent(offer.title)}`}>
              {offer.cta} <span aria-hidden="true">↗</span>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
