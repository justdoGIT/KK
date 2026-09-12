import { contactInfo } from "../../content/contact.ts";

const navItems = [
  { href: "#services", label: "Services" },
  { href: "#work", label: "Work" },
  { href: "#career", label: "Career" },
  { href: "#skills", label: "Skills" },
  { href: "#contact", label: "Contact" },
];

export function NavBar() {
  return (
    <header className="nav-bar" role="banner">
      <nav aria-label="Primary navigation" className="nav-inner">
        <a href="#main" className="nav-brand" aria-label="Home — Kamal Pandey">
          Kamal Pandey
        </a>
        <ul className="nav-list">
          {navItems.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="nav-link">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={`mailto:${contactInfo.email}`}
          className="nav-cta"
        >
          Start a conversation
        </a>
      </nav>
    </header>
  );
}
