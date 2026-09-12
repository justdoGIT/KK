import { contactInfo } from "../../content/contact.ts";

export function ContactCTA() {
  return (
    <section
      aria-label="Contact"
      className="contact-section"
      id="contact"
    >
      <div className="contact-inner">
        <h2>Let&rsquo;s build something reliable.</h2>
        <p className="contact-tagline">
          Available for embedded systems consultancy, board bring-up, BSP
          development, and systems architecture work.
        </p>
        <div className="contact-actions">
          <a
            href={`mailto:${contactInfo.email}`}
            className="btn btn-primary btn-lg"
          >
            Start a conversation
          </a>
          <a
            href={contactInfo.github}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-lg"
          >
            View GitHub
          </a>
          <a
            href={contactInfo.linkedin}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary btn-lg"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </section>
  );
}
