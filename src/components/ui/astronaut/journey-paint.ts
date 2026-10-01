import { frameRect, heroUnmasked, phaseAt, phaseRatio, smoothstep, type FrameRect } from "./journey-timeline.ts";
import { LAND_AT, ZOOM_OUT_END, ZOOM_OUT_START, bannerState, contactPoseMode } from "../contact/banner-timeline.ts";
import type { JourneyElements } from "./useJourneyDriver.ts";

/** Fraction of the card width where the astronaut stands; the zoom pivots on his feet. */
const STAND_AT = 0.35;
/** Close-up: where the card's front-top edge sits, as a fraction of stage height. */
const CLOSE_UP_DECK = 0.92;
/** Astronaut height : card width, held through the zoom so pad and astronaut shrink as one. */
const BODY_RATIO = 0.3;
/** Astronaut height at touchdown as a stage fraction — his size at the end of the drop. */
const LANDING_BODY = 0.58;
/** The settled heading centres over this share of the card width; the astronaut owns the left. */
const HEADING_ON_CARD = 0.66;
/** Space kept between the sticky nav bar and the top of the astronaut's helmet (px). */
const NAV_GAP = 12;

/**
 * Layout measured on resize, never per frame: painting reads only this, so a
 * frame's style writes can never force a synchronous layout.
 */
export type JourneyLayout = {
  /** Section top in document px and its pinned scroll length. */
  sectionTop: number;
  scrollable: number;
  /** Stage size. */
  width: number;
  height: number;
  /** `--contact-scale` from the stylesheet (breakpoint dependent). */
  cssScale: number;
  /** Untransformed card mover box within the stage. */
  moverWidth: number;
  moverHeight: number;
  moverTop: number;
  /** Untransformed heading width and visual centre x within the stage. */
  headingWidth: number;
  headingCentre: number;
  /** Bottom edge of the sticky nav bar in stage px. */
  navBottom: number;
};

function paintFinale(els: JourneyElements, layout: JourneyLayout, t: number, nowSec: number): void {
  const root = els.contact.current;
  const mover = els.contactMover.current;
  const heading = els.contactHeading.current;
  if (!root || !mover || !heading) return;
  const { width, height } = layout;
  const progress = phaseRatio(t, "wait");
  const finale = els.clock.current.finale;
  finale.progress = progress;

  if (progress >= 0.28) {
    if (!root.dataset.finaleFirstSeen) root.dataset.finaleFirstSeen = nowSec.toFixed(2);
  } else if (root.dataset.finaleFirstSeen) {
    delete root.dataset.finaleFirstSeen;
  }
  const firstSeen = root.dataset.finaleFirstSeen ? parseFloat(root.dataset.finaleFirstSeen) : nowSec;
  const idleElapsed = Math.max(0, nowSec - firstSeen);
  const poseElapsed = finale.interaction === "none" ? idleElapsed : Math.max(0, nowSec - finale.interactionStartedAt);
  finale.mode = contactPoseMode(progress, finale.interaction, poseElapsed);

  const reveal = smoothstep(0, 0.06, progress);
  const isSettled = progress >= ZOOM_OUT_END;
  const frame = bannerState(progress, Math.max(0, (progress - LAND_AT) * 3));
  // `moverHeight` is the card's unscaled layout height, so this shrinks the
  // settled scale just enough to keep the card's bottom edge inside the
  // pinned stage instead of being clipped by `.contact-banner`'s overflow.
  const fitScale = layout.moverHeight > 0
    ? Math.max(0.55, Math.min(1, (height - layout.moverTop - 24) / layout.moverHeight))
    : 1;
  const base = Math.min(layout.cssScale, fitScale);
  const baseDeckWidth = Math.max(1, layout.moverWidth * base);
  const closeUpZoom = Math.max(1, (height * LANDING_BODY) / BODY_RATIO / baseDeckWidth);
  const scale = base * (1 + (closeUpZoom - 1) * frame.closeUp);
  const shiftX = (STAND_AT - 0.5) * layout.moverWidth * (base - scale);
  const translatedY = frame.offset + frame.closeUp * (height * CLOSE_UP_DECK - layout.moverTop);
  const attach = smoothstep(ZOOM_OUT_START - 0.04, ZOOM_OUT_START + 0.08, progress);

  // Card rect for this frame, derived from the same scale/shift values as the
  // mover transform below (transform-origin top-centre, centred by margin).
  const cardWidth = layout.moverWidth * scale;
  const cardLeft = (width - layout.moverWidth) / 2 + (layout.moverWidth * (1 - scale)) / 2 + shiftX;
  finale.cardLeft = cardLeft;
  finale.cardTop = layout.moverTop + translatedY;
  finale.cardWidth = cardWidth;
  finale.footX = cardLeft + cardWidth * STAND_AT;
  // The whole standing body fits between the sticky nav bar and the card.
  const headroom = Math.max(40, finale.cardTop - layout.navBottom - NAV_GAP) / 1.1;
  finale.bodyHeight = Math.min(cardWidth * BODY_RATIO, height * LANDING_BODY, headroom);

  root.dataset.finaleProgress = progress.toFixed(3);
  root.dataset.astronautMode = finale.mode;
  root.style.opacity = reveal.toFixed(3);
  root.style.visibility = reveal > 0.001 ? "visible" : "hidden";
  // Pointer events unlock once the card reads as attached, not only after the
  // slower zoom-out settles, so the button never looks clickable but inert.
  root.style.pointerEvents = attach >= 0.98 ? "auto" : "none";
  if (isSettled) {
    root.dataset.finaleSettled = "true";
    mover.dataset.settled = "true";
  } else {
    delete root.dataset.finaleSettled;
    delete mover.dataset.settled;
  }
  mover.style.transform = `translate3d(${shiftX.toFixed(1)}px, ${translatedY.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
  mover.style.opacity = attach.toFixed(3);
  mover.style.visibility = attach > 0.001 ? "visible" : "hidden";

  // The close-up heading sits beside the astronaut; as the card settles it
  // glides over the card's right two thirds (the astronaut owns the left
  // third), or the card's centre when it is too wide for that, and never past
  // the card's right edge.
  const settledCentre = layout.headingWidth > cardWidth * 0.68
    ? cardLeft + cardWidth / 2
    : Math.min(cardLeft + cardWidth * HEADING_ON_CARD, cardLeft + cardWidth - layout.headingWidth / 2 - 8);
  const shift = (1 - frame.closeUp) * (settledCentre - layout.headingCentre);
  heading.style.opacity = frame.heading.toFixed(3);
  heading.style.visibility = frame.heading > 0.001 ? "visible" : "hidden";
  heading.style.transform = `translate3d(calc(-50% + ${shift.toFixed(1)}px), ${((1 - frame.heading) * 26).toFixed(1)}px, 0) scale(${(0.86 + frame.heading * 0.14).toFixed(3)})`;
}

function clipFor(rect: FrameRect, width: number, height: number): string {
  const right = width - rect.x - rect.width;
  const bottom = height - rect.y - rect.height;
  return `inset(${rect.y.toFixed(1)}px ${right.toFixed(1)}px ${bottom.toFixed(1)}px ${rect.x.toFixed(1)}px round ${rect.radius.toFixed(1)}px)`;
}

function placeRect(el: HTMLElement, rect: FrameRect): void {
  el.style.width = `${rect.width.toFixed(1)}px`;
  el.style.height = `${rect.height.toFixed(1)}px`;
  el.style.borderRadius = `${rect.radius.toFixed(1)}px`;
  el.style.transform = `translate3d(${rect.x.toFixed(1)}px, ${rect.y.toFixed(1)}px, 0) rotate(${rect.rotation.toFixed(3)}deg)`;
}

function applyMask(el: HTMLElement, rect: FrameRect | null, width: number, height: number): void {
  if (!rect) {
    el.style.clipPath = "none";
    el.style.transform = "none";
    return;
  }
  el.style.clipPath = clipFor(rect, width, height);
  el.style.transformOrigin = `${(rect.x + rect.width / 2).toFixed(1)}px ${(rect.y + rect.height / 2).toFixed(1)}px`;
  el.style.transform = rect.rotation ? `rotate(${rect.rotation.toFixed(3)}deg)` : "none";
}

/** Writes every DOM layer of the journey for progress `t`; reads nothing from layout. */
export function paintJourney(els: JourneyElements, layout: JourneyLayout, t: number, nowSec: number): void {
  const stage = els.stage.current;
  if (!stage) return;
  const { width, height } = layout;
  const rect = frameRect(t, width, height);
  const phase = phaseAt(t);
  if (stage.dataset.phase !== phase) stage.dataset.phase = phase;

  const world = els.world.current;
  if (world) {
    world.style.visibility = phaseRatio(t, "drop") >= 1 ? "hidden" : "visible";
    applyMask(world, rect, width, height);
  }
  const hero = els.hero.current;
  if (hero) applyMask(hero, heroUnmasked(t) ? null : rect, width, height);

  const frameIn = phaseRatio(t, "frameIn");
  const white = phaseRatio(t, "whiteTunnel");
  const drop = phaseRatio(t, "drop");

  // After the break the black void gives way to the site's own background:
  // the backdrop fades out so the page colour shows, and the theme glows fade in.
  const themed = smoothstep(0.15, 0.95, drop);
  const backdrop = els.backdrop.current;
  if (backdrop) {
    const navy = smoothstep(0.3, 1, white) * (1 - smoothstep(0.2, 0.9, drop));
    backdrop.style.opacity = (frameIn * (1 - themed)).toFixed(3);
    backdrop.style.backgroundColor = `rgb(${(4 * navy).toFixed(0)}, ${(8 * navy).toFixed(0)}, ${(52 * navy).toFixed(0)})`;
  }
  const theme = els.theme.current;
  if (theme) theme.style.opacity = themed.toFixed(3);

  const cardEdge = els.cardEdge.current;
  if (cardEdge) {
    placeRect(cardEdge, rect);
    cardEdge.style.opacity = (1 - smoothstep(0.05, 0.6, frameIn)).toFixed(3);
  }
  const bezel = els.bezel.current;
  if (bezel) {
    placeRect(bezel, rect);
    const shown = smoothstep(0.35, 1, white) * (1 - smoothstep(0.7, 1, drop));
    bezel.style.opacity = shown.toFixed(3);
    bezel.style.visibility = shown > 0.001 ? "visible" : "hidden";
  }

  const intro = els.intro.current;
  if (intro) {
    const fade = smoothstep(0, 0.4, frameIn);
    intro.style.opacity = (1 - fade).toFixed(3);
    intro.style.transform = `translate3d(0, ${(-60 * fade).toFixed(1)}px, 0)`;
  }

  const title = phaseRatio(t, "title");
  const leave = smoothstep(0, 0.12, phaseRatio(t, "blackTunnel"));
  els.titleLines.current?.forEach((line, i) => {
    if (!line) return;
    const enter = smoothstep(0.1 + i * 0.1, 0.4 + i * 0.1, title);
    line.style.opacity = (enter * (1 - leave)).toFixed(3);
    line.style.transform = `translate3d(0, ${((1 - enter) * 70 - leave * 40).toFixed(1)}px, 0)`;
  });
  paintFinale(els, layout, t, nowSec);
}
