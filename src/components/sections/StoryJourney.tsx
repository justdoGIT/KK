import { useEffect, useRef, useState } from "react";

type JourneyChapter = {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  body: string;
  signal: string;
};

const chapters: JourneyChapter[] = [
  {
    id: "signal",
    index: "01",
    eyebrow: "The signal",
    title: "Find the fault before it becomes a field failure.",
    body: "Bring-up begins at the boundary between a board, a bootloader, and the first trustworthy heartbeat. The work is observable from the first power cycle.",
    signal: "UART / JTAG / FTRACE",
  },
  {
    id: "orbit",
    index: "02",
    eyebrow: "The orbit",
    title: "Make every layer move as one system.",
    body: "Kernel, firmware, telemetry, OTA, and fleet runtime are treated as connected systems—not isolated deliverables. Architecture becomes a visible path from hardware to outcome.",
    signal: "KERNEL → RUNTIME → FLEET",
  },
  {
    id: "launch",
    index: "03",
    eyebrow: "The launch",
    title: "Ship a system your team can trust.",
    body: "The final product is not only a working device. It is a repeatable deployment path, evidence you can explain, and a service that keeps creating value after launch.",
    signal: "BUILD / VERIFY / DEPLOY",
  },
];

function OrbitVisual({ active }: { active: string }) {
  return (
    <div className={`journey-visual journey-visual-${active}`} data-testid="journey-visual">
      <div className="visual-grid" aria-hidden="true" />
      <div className="orbit-system" aria-hidden="true">
        <span className="orbit-ring orbit-ring-one" />
        <span className="orbit-ring orbit-ring-two" />
        <span className="orbit-node orbit-node-core" />
        <span className="orbit-node orbit-node-one" />
        <span className="orbit-node orbit-node-two" />
        <span className="orbit-node orbit-node-three" />
      </div>
      <span className="visual-caption">{chapters.find((chapter) => chapter.id === active)?.signal}</span>
    </div>
  );
}

export function StoryJourney() {
  const [active, setActive] = useState(chapters[0].id);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target instanceof HTMLElement) {
          setActive(visible.target.dataset.chapter ?? chapters[0].id);
        }
      },
      { threshold: [0.25, 0.6], rootMargin: "-20% 0px -35%" },
    );
    chapterRefs.current.forEach((chapter) => chapter && observer.observe(chapter));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="journey-section" id="journey" aria-label="Systems journey">
      <div className="journey-intro">
        <p className="section-kicker">A systems story</p>
        <h2>From first signal to dependable launch.</h2>
        <p>Scroll through the way I turn low-level complexity into a product your customers can feel.</p>
      </div>
      <div className="journey-layout">
        <div className="journey-chapters">
          {chapters.map((chapter) => (
            <article
              className={`journey-chapter ${active === chapter.id ? "journey-chapter-active" : ""}`}
              data-chapter={chapter.id}
              key={chapter.id}
              ref={(element) => { chapterRefs.current[chapters.indexOf(chapter)] = element; }}
            >
              <div className="journey-index">{chapter.index}</div>
              <div>
                <p className="journey-eyebrow">{chapter.eyebrow}</p>
                <h3>{chapter.title}</h3>
                <p>{chapter.body}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="journey-sticky">
          <OrbitVisual active={active} />
        </div>
      </div>
    </section>
  );
}
