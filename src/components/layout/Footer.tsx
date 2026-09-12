import { contactInfo } from "../../content/contact.ts";

export function Footer() {
  return (
    <footer role="contentinfo" className="footer">
      <div className="footer-inner">
        <div className="footer-section">
          <p className="footer-name">Kamal Pandey</p>
          <p className="footer-role">
            Embedded Systems, Linux BSP &amp; Low-Level Architecture
          </p>
        </div>
        <div className="footer-section">
          <ul className="footer-links">
            <li>
              <a href={`mailto:${contactInfo.email}`}>Email</a>
            </li>
            <li>
              <a
                href={contactInfo.github}
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                href={contactInfo.linkedin}
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <p className="footer-copy">
            &copy; 2026 Kamal Pandey. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
