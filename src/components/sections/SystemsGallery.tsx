import { useState, type CSSProperties } from "react";
import { contactInfo } from "../../content/contact.ts";

type GalleryItem = {
  id: string;
  tag: string;
  title: string;
  description: string;
  kind: "pcb" | "agent" | "linux" | "logic";
  link?: string;
};

const galleryItems: GalleryItem[] = [
  {
    id: "pcb-lab",
    tag: "Hardware / bring-up",
    title: "The board tells the truth.",
    description: "A diagnostic visual language for boot chains, sensors, rails, and the tiny signals that make a product real.",
    kind: "pcb",
  },
  {
    id: "career-ai",
    tag: "Personal project / agent",
    title: "A career companion that never loses the thread.",
    description: "Career AI turns a year of roles, applications, tailoring, and follow-up into one calm, observable workflow.",
    kind: "agent",
    link: "https://github.com/aikepeer/career-ai",
  },
  {
    id: "linux-flight",
    tag: "Open source / Linux",
    title: "Linux, with a flight plan.",
    description: "BSPs, atomic updates, runtime evidence, and recovery paths become a living deployment map instead of a pile of scripts.",
    kind: "linux",
  },
  {
    id: "kepr-guard",
    tag: "Identity / embedded storage",
    title: "Kepr stands guard at the boundary.",
    description: "A visual metaphor for privacy-first storage: the identity stays yours while every layer around it remains inspectable.",
    kind: "logic",
    link: "mailto:" + contactInfo.email + "?subject=Kepr%20project%20conversation",
  },
];

function GalleryArtwork({ kind }: { kind: GalleryItem["kind"] }) {
  return (
    <div className={`gallery-art gallery-art-${kind}`} aria-hidden="true">
      <span className="gallery-art-glow" />
      <span className="gallery-art-frame" />
      <span className="gallery-art-core" />
      <span className="gallery-art-path gallery-art-path-one" />
      <span className="gallery-art-path gallery-art-path-two" />
      <span className="gallery-art-path gallery-art-path-three" />
      {Array.from({ length: 7 }, (_, index) => <span className="gallery-art-node" key={index} style={{ "--node-index": index } as CSSProperties} />)}
      {kind === "agent" && <span className="gallery-art-agent-face"><i /><i /><i /></span>}
      {kind === "pcb" && <span className="gallery-art-chip">QCM</span>}
      {kind === "linux" && <span className="gallery-art-terminal">$ deploy --atomic</span>}
      {kind === "logic" && <span className="gallery-art-shield">K</span>}
    </div>
  );
}

export function SystemsGallery() {
  const [active, setActive] = useState(galleryItems[0].id);

  return (
    <section className="gallery-section" id="visual-lab" aria-label="Visual project lab">
      <div className="section-header gallery-header">
        <div>
          <p className="section-kicker">Visual project lab</p>
          <h2>Every system has a character.</h2>
        </div>
        <p className="section-subtitle">Original visual metaphors for the work: electronics, agents, Linux infrastructure, and the open-source ideas behind them.</p>
      </div>
      <div className="gallery-rail" role="list">
        {galleryItems.map((item) => (
          <article className={`gallery-card ${active === item.id ? "gallery-card-active" : ""}`} key={item.id} role="listitem" onMouseEnter={() => setActive(item.id)}>
            <GalleryArtwork kind={item.kind} />
            <div className="gallery-card-copy">
              <p className="gallery-tag">{item.tag}</p>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {item.link ? <a className="gallery-link" href={item.link} target={item.link.startsWith("http") ? "_blank" : undefined} rel={item.link.startsWith("http") ? "noreferrer" : undefined}>Explore the thread <span aria-hidden="true">↗</span></a> : <a className="gallery-link" href="#contact">Start a conversation <span aria-hidden="true">↗</span></a>}
            </div>
          </article>
        ))}
      </div>
      <div className="gallery-progress" aria-hidden="true"><span style={{ width: `${((galleryItems.findIndex((item) => item.id === active) + 1) / galleryItems.length) * 100}%` }} /></div>
    </section>
  );
}
