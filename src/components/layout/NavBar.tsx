import { useState } from "react";
import { contactInfo } from "../../content/contact.ts";

const navItems = [
  { href: "#services", label: "Services" },
  { href: "#journey", label: "Journey" },
  { href: "#work", label: "Work" },
  { href: "#offers", label: "Offers" },
  { href: "#career", label: "Career" },
  { href: "#skills", label: "Skills" },
  { href: "#contact", label: "Contact" },
];

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="nav-bar" role="banner">
      <nav aria-label="Primary navigation" className="nav-inner">
        <a
          href="#main"
          className="nav-brand"
          aria-label="Home — Kamal Pandey"
          onClick={closeMenu}
        >
          <span className="nav-brand-mark" aria-hidden="true">KP</span>
          <span>Kamal Pandey</span>
        </a>
        <button
          type="button"
          className="nav-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="primary-menu"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
        </button>
        <ul id="primary-menu" className={`nav-list ${menuOpen ? "nav-list-open" : ""}`}>
          {navItems.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="nav-link" onClick={closeMenu}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a href={`mailto:${contactInfo.email}`} className="nav-cta">
          Start a conversation <span aria-hidden="true">↗</span>
        </a>
      </nav>
    </header>
  );
}
