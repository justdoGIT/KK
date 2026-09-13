import { NavBar } from "./components/layout/NavBar.tsx";
import { Footer } from "./components/layout/Footer.tsx";
import { Hero } from "./components/sections/Hero.tsx";
import { Services } from "./components/sections/Services.tsx";
import { CareerTimeline } from "./components/sections/CareerTimeline.tsx";
import { CaseStudies } from "./components/sections/CaseStudies.tsx";
import { SkillMatrix } from "./components/sections/SkillMatrix.tsx";
import { ContactCTA } from "./components/sections/ContactCTA.tsx";
import { Offers } from "./components/sections/Offers.tsx";
import { StoryJourney } from "./components/sections/StoryJourney.tsx";
import { MotionModeProvider } from "./motion/motion-mode.tsx";
import { Reveal } from "./motion/Reveal.tsx";
import { useLenisGsap } from "./motion/lenis-gsap.ts";
import { MagneticCursor } from "./motion/MagneticCursor.tsx";
import { SceneEntry } from "./scene/SceneEntry.tsx";

function AppContent() {
  useLenisGsap();

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <MagneticCursor />
      <SceneEntry />
      <NavBar />
      <main id="main" role="main">
        <Hero />
        <Reveal>
          <Services />
        </Reveal>
        <Reveal>
          <StoryJourney />
        </Reveal>
        <Reveal>
          <CaseStudies />
        </Reveal>
        <Reveal>
          <Offers />
        </Reveal>
        <Reveal>
          <CareerTimeline />
        </Reveal>
        <Reveal>
          <SkillMatrix />
        </Reveal>
        <Reveal>
          <ContactCTA />
        </Reveal>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <MotionModeProvider>
      <AppContent />
    </MotionModeProvider>
  );
}
