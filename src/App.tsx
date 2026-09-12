import { NavBar } from "./components/layout/NavBar.tsx";
import { Footer } from "./components/layout/Footer.tsx";
import { Hero } from "./components/sections/Hero.tsx";
import { Services } from "./components/sections/Services.tsx";
import { CareerTimeline } from "./components/sections/CareerTimeline.tsx";
import { CaseStudies } from "./components/sections/CaseStudies.tsx";
import { SkillMatrix } from "./components/sections/SkillMatrix.tsx";
import { ContactCTA } from "./components/sections/ContactCTA.tsx";

export default function App() {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <NavBar />
      <main id="main" role="main">
        <Hero />
        <Services />
        <CaseStudies />
        <CareerTimeline />
        <SkillMatrix />
        <ContactCTA />
      </main>
      <Footer />
    </div>
  );
}
