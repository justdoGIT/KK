export default function App() {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <header className="nav-bar" role="banner">
        <nav aria-label="Primary navigation">
          <span className="nav-brand">Kamal Pandey</span>
        </nav>
      </header>
      <main id="main" role="main">
        <section aria-label="Hero" className="hero-section">
          <h1>Embedded Systems, Linux BSP &amp; Low-Level Architecture</h1>
          <p className="hero-tagline">
            Board bring-up, firmware, and systems software for hardware that
            ships.
          </p>
        </section>
        <section aria-label="Status" className="status-section">
          <p>App shell initialized.</p>
        </section>
      </main>
      <footer role="contentinfo">
        <p>&copy; 2026 Kamal Pandey. All rights reserved.</p>
      </footer>
    </div>
  );
}
