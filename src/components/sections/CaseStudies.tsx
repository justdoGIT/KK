import { useState, useEffect, useRef, type JSX, type CSSProperties } from "react";
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
import { scrollToY } from "../../motion/smooth-scroll.ts";
import { useScrollFrame } from "../../motion/scroll-frame.ts";
import { LusionKineticHeading } from "../ui/LusionKineticHeading.tsx";
import "../../styles/product-deck.css";

// flipSpeed < 1 = flip completes before full scroll travel (faster).
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
  const wide = useMediaQuery("(min-width: 1024px)");
  const animated = enhanced && wide;
  const [selectedArch, setSelectedArch] = useState<ArchitectureDetail | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef   = useRef<HTMLDivElement>(null);
  // Computed targetX per card: card 0 left edge = heading left edge. A ref,
  // not state — read every scroll frame by the imperative driver below, so a
  // stage resize never has to wait for a React render to reach the cards.
  const targetXsRef = useRef<number[]>([-468, -156, 156, 468]);
  // Per-card DOM refs: the scroll driver writes transforms/attributes to
  // these directly every frame, so only a *settled* card's discrete flip (a
  // structural, not continuous, change — see settledMask below) ever causes
  // a React commit.
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const flipperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frontRefs = useRef<(HTMLDivElement | null)[]>([]);
  const backRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headingWobbleRef = useRef<HTMLDivElement>(null);
  const stackBtnRef = useRef<HTMLButtonElement>(null);
  const fanBtnRef = useRef<HTMLButtonElement>(null);
  // Whether each card has finished its flip and landed (cardP >= 1). This is
  // the one piece of per-card state that legitimately needs a React commit:
  // a settled card swaps to a flatter DOM structure (see the comment by
  // `isSettled` below), so it can only be driven by render, not by a style
  // write. It flips rarely (once per direction change per card), satisfying
  // "setState only on discrete changes".
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
  // frame; keep it pointing at the latest array whenever React's own copy
  // changes (the reset above, or the driver's own setSettledMask([...])).
  useEffect(() => {
    settledRef.current = settledMask;
  }, [settledMask]);

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
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (stageRef.current) ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, []);

  useScrollFrame(() => {
    const section = sectionRef.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const totalScroll = rect.height - window.innerHeight;
    const scrollProgress = totalScroll > 0 ? Math.max(0, Math.min(1, -rect.top / (totalScroll * 0.75))) : 0;

    if (headingWobbleRef.current) {
      headingWobbleRef.current.style.transform = `translateY(${Math.sin(scrollProgress * Math.PI * 4) * 12}px)`;
    }
    stackBtnRef.current?.classList.toggle("active", scrollProgress < 0.3);
    fanBtnRef.current?.classList.toggle("active", scrollProgress >= 0.3);

    const targetXs = targetXsRef.current;
    const mask = settledRef.current;
    let maskChanged = false;

    studies.forEach((_study, idx) => {
      const cfg = CARD_CONFIGS[idx] ?? CARD_CONFIGS[0];
      const cardP = Math.max(0, Math.min(1, (scrollProgress - cfg.delay) / (1.0 - cfg.delay)));
      const isSettled = cardP >= 1;
      if (mask[idx] !== isSettled) {
        mask[idx] = isSettled;
        maskChanged = true;
      }

      // Once a card finishes its flip and lands at cardP===1, it never
      // changes again until the user scrolls back up — there's no reason to
      // keep it in the 3D transform stack (perspective + preserve-3d +
      // rotateY + backface-visibility) that forces GPU compositing. The
      // settled branch below renders a completely flat 2D structure instead.
      if (isSettled) {
        const card = cardRefs.current[idx];
        if (card) {
          const currentX = Math.round(THREE_lerp(cfg.startX, targetXs[idx] ?? 0, cardP));
          const currentY = Math.round(THREE_lerp(0, cfg.targetY, cardP));
          card.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
        return;
      }

      // During travel: organic tilt from start angles back to 0 at landing.
      // Rounded to whole px/degrees before hitting the style: any fractional
      // value here (THREE_lerp floats, or the ~1e-16 residue from
      // Math.sin(Math.PI) not being exactly 0) forces the browser to keep
      // this element's text in a sub-pixel-offset GPU compositing layer even
      // once the card has visually landed, which reads as a permanent slight
      // blur on the card body text. Snapping every translate/rotate/scale
      // component to whole px / whole degrees / 3-decimal scale removes that
      // residue without affecting the animation itself.
      const flipP = Math.min(1, cardP / cfg.flipSpeed);
      const rotY = flipP * 180 + Math.sin(flipP * Math.PI) * cfg.wobbleY;
      const isFrontVisible = rotY >= 90;
      const currentX = Math.round(THREE_lerp(cfg.startX, targetXs[idx] ?? 0, cardP));
      const currentY = Math.round(THREE_lerp(0, cfg.targetY, cardP));
      const currentRotZ = Math.round(THREE_lerp(cfg.startRotZ, cfg.targetRotZ, cardP));
      const currentRotX = Math.round(THREE_lerp(cfg.startRotX, cfg.targetRotX, cardP));
      const currentScale = Math.round(THREE_lerp(0.93, 1.0, cardP) * 1000) / 1000;
      const liftZ = Math.round(Math.sin(cardP * Math.PI) * 70);
      const rotYDisplay = Math.round(rotY * 100) / 100;

      const card = cardRefs.current[idx];
      if (card) {
        card.style.transform = `translate3d(${currentX}px, ${currentY}px, ${liftZ}px) rotateX(${currentRotX}deg) rotateZ(${currentRotZ}deg) scale(${currentScale})`;
        card.style.zIndex = String(Math.round(10 + liftZ * 0.2 + (isFrontVisible ? idx : 4 - idx)));
        card.dataset.frontVisible = isFrontVisible ? "true" : "false";
      }
      const flipper = flipperRefs.current[idx];
      if (flipper) flipper.style.transform = `rotateY(${rotYDisplay}deg)`;
      const front = frontRefs.current[idx];
      if (front) {
        front.style.pointerEvents = isFrontVisible ? "auto" : "none";
        front.style.opacity = isFrontVisible ? "1" : "0";
        front.inert = !isFrontVisible;
        if (isFrontVisible) front.removeAttribute("aria-hidden");
        else front.setAttribute("aria-hidden", "true");
      }
      const back = backRefs.current[idx];
      if (back) {
        back.style.pointerEvents = !isFrontVisible ? "auto" : "none";
        back.style.opacity = !isFrontVisible ? "1" : "0";
      }
    });

    if (maskChanged) setSettledMask([...mask]);
  }, animated);

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
    scrollToY(targetY);
  };

  const categories = [
    "01 // HARDWARE BRING-UP",
    "02 // DISTRIBUTED FLEET",
    "03 // AGENTIC WORKFLOW",
    "04 // SYSTEM AUTOMATION",
  ];

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

          <div className="lusion-cards-stage" ref={stageRef}>
            {studies.map((study, idx) => {
              const isSettled = settledMask[idx] ?? !animated;

              if (isSettled) {
                return (
                  <div
                    // Keyed separately from the unsettled branch below: they
                    // render incompatible DOM shapes (this is a flat static
                    // card, the other a 3D flipper with two faces). Sharing
                    // one key let React reuse the flipper's DOM node for
                    // this card, inheriting the imperatively-set
                    // `rotateY(...)` inline transform the driver wrote on
                    // it mid-flight — React only clears style it owns via
                    // the `style` prop, never a ref's direct DOM writes —
                    // which froze the card mirrored once settled.
                    key={`${study.record.slug}-settled`}
                    ref={(el) => { cardRefs.current[idx] = el; }}
                    className="lusion-card-isolated-cell lusion-card-isolated-cell--settled"
                    data-front-visible="true"
                    style={{
                      transform: animated ? undefined : "none",
                      zIndex: 10 + idx,
                    }}
                  >
                    <div className="lusion-card-face lusion-card-front lusion-card-front--static">
                      <CardFrontContent
                        study={study}
                        idx={idx}
                        category={categories[idx]}
                        onExpand={() => openArchitectureModal(study, idx)}
                      />
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`${study.record.slug}-flying`}
                  ref={(el) => { cardRefs.current[idx] = el; }}
                  className="lusion-card-isolated-cell"
                  data-front-visible="false"
                  onClick={() => { if (cardRefs.current[idx]?.dataset.frontVisible !== "true") jumpToProgress(1); }}
                >
                  <div ref={(el) => { flipperRefs.current[idx] = el; }} className="lusion-card-flipper">
                    <div ref={(el) => { frontRefs.current[idx] = el; }} className="lusion-card-face lusion-card-front" inert aria-hidden="true">
                      <CardFrontContent
                        study={study}
                        idx={idx}
                        category={categories[idx]}
                        onExpand={() => openArchitectureModal(study, idx)}
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
