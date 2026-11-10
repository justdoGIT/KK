import { useState, useEffect, useLayoutEffect, useRef, type JSX, type CSSProperties } from "react";
import {
  getApprovedCaseStudies,
  type CaseStudyDetail,
} from "../../content/case-studies.ts";
import { CardBackArtwork } from "../ui/CardBackArtwork.tsx";
import {
  ArchitectureModal,
  type ArchitectureDetail,
} from "../ui/ArchitectureModal.tsx";
import { CardFrontContent } from "./CaseStudyCardContent.tsx";
import { useMotionMode } from "../../motion/use-motion-mode.ts";
import { useMediaQuery } from "../../motion/use-media-query.ts";
import { useGuidedScroll } from "../../motion/guided-scroll.ts";
import { scrollToY } from "../../motion/smooth-scroll.ts";
import { useScrollFrame } from "../../motion/scroll-frame.ts";
import { toggleClass, writeStyle } from "../../motion/dom-style.ts";
import { LusionKineticHeading } from "../ui/LusionKineticHeading.tsx";
import { MOBILE_BOARD_QUERY, MobileBoardCarousel } from "../ui/MobileBoardCarousel.tsx";
import "../../styles/product-deck.css";

// Outer/edge cards flip fast; inner cards flip slower.
// startRotZ/X = organic stacking angle in the deck.
// targetRotZ/X = 0 → all cards land perfectly upright.
// targetX is NOT hardcoded — computed from stage width each resize
// so card 0's LEFT EDGE aligns with the "Products with a pulse" heading.
// Gap always fills whatever room is left after 4 cards fit the stage width —
// .lusion-deck-inner caps at max-width:1440px, so this maxes out around 64px
// at full width (vs. the old fixed 12px), spanning card 0→3 edge-to-edge.
const CARD_W   = 320; // must match .lusion-card-isolated-cell width in CSS
// Left-edge offsets of each card relative to card 0's left edge

const CARD_CONFIGS = [
  { startRotZ: -9.0, startRotX:  2.2, startX: -30, targetY: 0, targetRotZ: 0, targetRotX: 0, delay: 0.00, flipSpeed: 0.62, wobbleY: -6.0 },
  { startRotZ: -3.2, startRotX: -1.4, startX: -10, targetY: 0, targetRotZ: 0, targetRotX: 0, delay: 0.07, flipSpeed: 0.82, wobbleY:  3.5 },
  { startRotZ:  3.5, startRotX:  1.6, startX:  10, targetY: 0, targetRotZ: 0, targetRotX: 0, delay: 0.13, flipSpeed: 0.82, wobbleY: -3.5 },
  { startRotZ:  9.5, startRotX: -2.4, startX:  30, targetY: 0, targetRotZ: 0, targetRotX: 0, delay: 0.20, flipSpeed: 0.62, wobbleY:  6.0 },
];

export function CaseStudies(): JSX.Element {
  const studies = getApprovedCaseStudies();
  const enhanced = useMotionMode() === "enhanced";
  // The 3D flying/flipping deck only engages on full-height desktop widths;
  // short screens (< 720px tall, e.g. 1024x500 and 1280x600 laptops) fall
  // back to the static 2-col grid (`.is-static`) so four cards never have to
  // squeeze into a pinned stage they can't fit — same as narrower widths.
  const wide = useMediaQuery("(min-width: 1024px) and (min-height: 720px)");
  const mobile = useMediaQuery(MOBILE_BOARD_QUERY);
  const animated = enhanced && wide;
  const [selectedArch, setSelectedArch] = useState<ArchitectureDetail | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef   = useRef<HTMLDivElement>(null);
  useGuidedScroll(sectionRef, animated, { target: 0.76, seconds: 11 });
  // Computed targetX per card: card 0 left edge = heading left edge. A ref,
  // not state — read every scroll frame by the imperative driver below, so a
  // stage resize never has to wait for a React render to reach the cards.
  const targetXsRef = useRef<number[]>([-468, -156, 156, 468]);
  // Keep the faces mounted across landing/reversal so text, focus and scroll
  // offsets survive. Continuous poses are written outside React.
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const flipperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frontRefs = useRef<(HTMLDivElement | null)[]>([]);
  const backRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headingWobbleRef = useRef<HTMLDivElement>(null);
  const stackBtnRef = useRef<HTMLButtonElement>(null);
  const fanBtnRef = useRef<HTMLButtonElement>(null);
  // Interactivity changes only when the complete deck lands or lifts again.
  const settledRef = useRef<boolean[]>(studies.map(() => !animated));
  const [settledMask, setSettledMask] = useState<boolean[]>(() => studies.map(() => !animated));
  // Toggling motion mode or crossing the 1024px breakpoint flips every card
  // between the static (always-settled) and animated layouts immediately.
  // Adjusted during render (not an effect) per React's guidance for state
  // that must reset when a prop changes: https://react.dev/learn/you-might-not-need-an-effect
  const [prevAnimated, setPrevAnimated] = useState(animated);
  if (animated !== prevAnimated) {
    setPrevAnimated(animated);
    setSettledMask(studies.map(() => !animated));
  }
  // The imperative scroll driver mutates settledRef.current in place every
  // frame; copy React's mask rather than mutating an array owned by state.
  useLayoutEffect(() => {
    settledRef.current = [...settledMask];
  }, [settledMask]);

  // Motion-mode changes must also flatten the retained nodes before paint.
  useLayoutEffect(() => {
    const deckReady = settledMask.every(Boolean);
    if (stageRef.current) toggleClass(stageRef.current, "is-settled", deckReady);
    settledMask.forEach((isSettled, idx) => {
      if (!isSettled) return;
      const card = cardRefs.current[idx];
      if (!card) return;
      const cfg = CARD_CONFIGS[idx] ?? CARD_CONFIGS[0];
      toggleClass(card, "lusion-card-isolated-cell--settled", true);
      if (card.dataset.frontVisible !== "true") card.dataset.frontVisible = "true";
      card.style.transform = animated
        ? `translate(${Math.round(targetXsRef.current[idx] ?? 0)}px, ${Math.round(cfg.targetY)}px)`
        : "none";
      if (flipperRefs.current[idx]) flipperRefs.current[idx]!.style.transform = "none";
      const front = frontRefs.current[idx];
      const back = backRefs.current[idx];
      if (front) {
        toggleClass(front, "lusion-card-front--static", true);
        if (front.inert === deckReady) front.inert = !deckReady;
        if (deckReady) front.removeAttribute("aria-hidden");
        else if (front.getAttribute("aria-hidden") !== "true") front.setAttribute("aria-hidden", "true");
        writeStyle(front, "opacity", "1");
        writeStyle(front, "pointer-events", deckReady ? "auto" : "none");
      }
      if (back) { writeStyle(back, "opacity", "0"); writeStyle(back, "pointer-events", "none"); }
    });
  }, [animated, settledMask]);

  // Align card 0's left edge with the heading's left edge.
  // Cards are positioned via translate3d(X,…) where X is offset from stage center.
  // card_i center from stage left  = CARD_OFFSETS[i] + CARD_W/2
  // targetX[i] = (card_i center from stage left) - stageWidth/2
  useEffect(() => {
    const compute = () => {
      const w = stageRef.current?.offsetWidth ?? 0;
      if (w === 0) return;
      // CSS shrinks .lusion-card-isolated-cell to 295px below 1200px viewport
      // (see components.css @media max-width: 1200px) — match it here so the
      // alignment/gap math uses the real rendered card width, not a stale value.
      const cardW = window.matchMedia("(max-width: 1200px)").matches ? 295 : CARD_W;
      // Fill available room exactly: 4 cards span the full stage width,
      // never overflowing it, with an even gap between each.
      const gap = Math.max(0, (w - 4 * cardW) / 3);
      const offsets = [
        0,
        cardW + gap,
        (cardW + gap) * 2,
        (cardW + gap) * 3,
      ];
      const half = w / 2;
      targetXsRef.current = offsets.map((off) => off + cardW / 2 - half);
      if (animated) {
        targetXsRef.current.forEach((x, idx) => {
          if (!settledRef.current[idx]) return;
          const card = cardRefs.current[idx];
          if (card) card.style.transform = `translate(${Math.round(x)}px, ${Math.round(CARD_CONFIGS[idx]?.targetY ?? 0)}px)`;
        });
      }
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (stageRef.current) ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, [animated]);

  const progressRef = useRef(0);
  useScrollFrame(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const totalScroll = rect.height - window.innerHeight;
      const progress = totalScroll > 0 ? Math.max(0, Math.min(1, -rect.top / (totalScroll * 0.75))) : 0;
      // Native scroll positions can round just below an exact final target.
      progressRef.current = progress >= 0.999 ? 1 : progress;
    },
    () => {
      const scrollProgress = progressRef.current;

      if (headingWobbleRef.current) {
        const exit = Math.max(0, Math.min(1, (scrollProgress - 0.42) / 0.2));
        const wobble = Math.sin(scrollProgress * Math.PI * 4) * 12;
        writeStyle(headingWobbleRef.current, "transform", `translateY(${(wobble - exit * 24).toFixed(2)}px)`);
        writeStyle(headingWobbleRef.current, "opacity", String(1 - exit));
      }
      if (stackBtnRef.current) toggleClass(stackBtnRef.current, "active", scrollProgress < 0.3);
      if (fanBtnRef.current) toggleClass(fanBtnRef.current, "active", scrollProgress >= 0.3);

      const targetXs = targetXsRef.current;
      const mask = settledRef.current;
      let maskChanged = false;
      const deckReady = scrollProgress === 1;
      if (stageRef.current) toggleClass(stageRef.current, "is-settled", deckReady);

      studies.forEach((_study, idx) => {
        const cfg = CARD_CONFIGS[idx] ?? CARD_CONFIGS[0];
        const cardP = Math.max(0, Math.min(1, (scrollProgress - cfg.delay) / (1.0 - cfg.delay)));
        const isSettled = cardP >= 1;
        if (mask[idx] !== isSettled) {
          mask[idx] = isSettled;
          maskChanged = true;
        }

        const card = cardRefs.current[idx];
        const flipper = flipperRefs.current[idx];
        const front = frontRefs.current[idx];
        const back = backRefs.current[idx];
        if (card) toggleClass(card, "lusion-card-isolated-cell--settled", isSettled);
        if (front) {
          toggleClass(front, "lusion-card-front--static", isSettled);
          if (front.inert === deckReady) front.inert = !deckReady;
          writeStyle(front, "pointer-events", deckReady ? "auto" : "none");
          if (deckReady) front.removeAttribute("aria-hidden");
          else if (front.getAttribute("aria-hidden") !== "true") front.setAttribute("aria-hidden", "true");
        }

        if (isSettled) {
          if (card) {
            const currentX = Math.round(THREE_lerp(cfg.startX, targetXs[idx] ?? 0, cardP));
            const currentY = Math.round(THREE_lerp(0, cfg.targetY, cardP));
            writeStyle(card, "transform", `translate(${currentX}px, ${currentY}px)`);
            writeStyle(card, "z-index", String(10 + idx));
            if (card.dataset.frontVisible !== "true") card.dataset.frontVisible = "true";
          }
          if (flipper) writeStyle(flipper, "transform", "none");
          if (front) writeStyle(front, "opacity", "1");
          if (back) { writeStyle(back, "opacity", "0"); writeStyle(back, "pointer-events", "none"); }
          return;
        }

        // During travel: organic tilt from start angles back to 0 at landing.
        // Preserve sub-degree motion during travel; the settled branch snaps
        // to a flat, integer-pixel pose only when the card actually lands.
        const flipP = Math.min(1, cardP / cfg.flipSpeed);
        const rotY = flipP * 180 + Math.sin(flipP * Math.PI) * cfg.wobbleY;
        const isFrontVisible = rotY >= 90;
        const currentX = THREE_lerp(cfg.startX, targetXs[idx] ?? 0, cardP).toFixed(2);
        const currentY = THREE_lerp(0, cfg.targetY, cardP).toFixed(2);
        const currentRotZ = THREE_lerp(cfg.startRotZ, cfg.targetRotZ, cardP).toFixed(3);
        const currentRotX = THREE_lerp(cfg.startRotX, cfg.targetRotX, cardP).toFixed(3);
        const currentScale = Math.round(THREE_lerp(0.93, 1.0, cardP) * 1000) / 1000;
        const liftZ = Math.round(Math.sin(cardP * Math.PI) * 70);
        const rotYDisplay = Math.round(rotY * 100) / 100;

        if (card) {
          writeStyle(card, "transform", `translate3d(${currentX}px, ${currentY}px, ${liftZ}px) rotateX(${currentRotX}deg) rotateZ(${currentRotZ}deg) scale(${currentScale})`);
          writeStyle(card, "z-index", String(Math.round(10 + liftZ * 0.2 + (isFrontVisible ? idx : 4 - idx))));
          if (card.dataset.frontVisible !== String(isFrontVisible)) card.dataset.frontVisible = String(isFrontVisible);
        }
        if (flipper) writeStyle(flipper, "transform", `rotateY(${rotYDisplay}deg)`);
        if (front) {
          writeStyle(front, "opacity", isFrontVisible ? "1" : "0");
        }
        if (back) {
          writeStyle(back, "pointer-events", !isFrontVisible ? "auto" : "none");
          writeStyle(back, "opacity", !isFrontVisible ? "1" : "0");
        }
      });

      if (maskChanged) setSettledMask([...mask]);
    },
    animated,
  );

  const openArchitectureModal = (study: CaseStudyDetail, index: number) => {
    if (!study) return;
    setSelectedArch({
      title: study.record.publicTitle,
      number: `/${String(index + 1).padStart(2, "0")}`,
      context: study.context,
      mermaidCode: study.mermaidDiagram,
      nodes: study.diagram,
      protocols: study.protocols,
      dataFlowDescription: study.dataFlowDescription,
    });
  };

  const jumpToProgress = (targetProgress: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const totalScroll = (section.offsetHeight - window.innerHeight) * 0.75;
    const targetY = section.getBoundingClientRect().top + window.scrollY + targetProgress * totalScroll;
    scrollToY(Math.ceil(targetY));
  };

  const categories = [
    "01 // HARDWARE BRING-UP",
    "02 // DISTRIBUTED FLEET",
    "03 // AGENTIC WORKFLOW",
    "04 // SYSTEM AUTOMATION",
  ];

  if (mobile) {
    return (
      <section className="mobile-board-section" id="work" aria-label="Case studies">
        <div className="section-header">
          <LusionKineticHeading kicker="Selected Missions" text="Products with a pulse." variant="cascade" />
        </div>
        <MobileBoardCarousel label="Case studies">
          {studies.map((study, index) => (
            <article key={study.record.slug} className="lusion-card-face lusion-card-front lusion-card-front--static">
              <CardFrontContent study={study} idx={index} category={categories[index]} onExpand={() => openArchitectureModal(study, index)} />
            </article>
          ))}
        </MobileBoardCarousel>
        <ArchitectureModal isOpen={selectedArch !== null} onClose={() => setSelectedArch(null)} architecture={selectedArch} />
      </section>
    );
  }

  return (
    <section ref={sectionRef} aria-label="Case studies" className={`lusion-deck-scroll-section${animated ? "" : " is-static"}`} id="work">
      <div className="lusion-deck-sticky-stage">
        <svg className="lusion-bg-ribbon" viewBox="0 0 1440 600" aria-hidden="true">
          <path d="M -100,140 Q 720,500 1540,100" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="32" />
        </svg>

        <div className="lusion-deck-inner">
          <div className="lusion-deck-header">
            <div className="lusion-header-left">
              <span className="lusion-section-pill">SELECTED MISSIONS // EVIDENCE-BACKED PLATFORMS</span>
              <div ref={headingWobbleRef} style={animated ? { transition: "none" } as CSSProperties : undefined}>
                <LusionKineticHeading text="Products with a pulse." variant="cascade" subtitle={animated ? "Scroll to deal the mission cards. Explore the evidence and expand each architecture." : "Verified hardware bring-up, distributed fleet runtimes, and autonomous agent architectures."} />
              </div>
            </div>

            {animated && <div className="lusion-deck-scrubber">
              <button ref={stackBtnRef} type="button" className="lusion-scrub-btn" onClick={() => jumpToProgress(0)}>
                <span>Stack Deck</span>
              </button>
              <button ref={fanBtnRef} type="button" className="lusion-scrub-btn" onClick={() => jumpToProgress(1)}>
                <span>Fan Out Cards</span>
              </button>
            </div>}
          </div>

          <div className={`lusion-cards-stage${settledMask.every(Boolean) ? " is-settled" : ""}`} ref={stageRef}>
            {studies.map((study, idx) => {
              const isSettled = settledMask[idx] ?? !animated;

              return (
                <div
                  key={study.record.slug}
                  ref={(el) => { cardRefs.current[idx] = el; }}
                  className={`lusion-card-isolated-cell${isSettled ? " lusion-card-isolated-cell--settled" : ""}`}
                  data-front-visible={isSettled ? "true" : "false"}
                  style={{ transform: animated ? undefined : "none", zIndex: 10 + idx }}
                  onClick={() => { if (cardRefs.current[idx]?.dataset.frontVisible !== "true") jumpToProgress(1); }}
                >
                  <div ref={(el) => { flipperRefs.current[idx] = el; }} className="lusion-card-flipper">
                    <div ref={(el) => { frontRefs.current[idx] = el; }} className={`lusion-card-face lusion-card-front${isSettled ? " lusion-card-front--static" : ""}`} inert={!settledMask.every(Boolean)} aria-hidden={settledMask.every(Boolean) ? undefined : true}>
                      <CardFrontContent
                        study={study}
                        idx={idx}
                        category={categories[idx]}
                        onExpand={() => openArchitectureModal(study, idx)}
                        nestedScroll={animated && settledMask.every(Boolean)}
                      />
                    </div>

                    <div ref={(el) => { backRefs.current[idx] = el; }} className="lusion-card-face lusion-card-back">
                      <CardBackArtwork />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ArchitectureModal isOpen={selectedArch !== null} onClose={() => setSelectedArch(null)} architecture={selectedArch} />
    </section>
  );
}

function THREE_lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}
