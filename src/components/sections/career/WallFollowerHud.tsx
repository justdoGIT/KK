import type { JSX, RefObject } from "react";

export type HudRefs = {
  depth: RefObject<HTMLCanvasElement | null>;
  correction: RefObject<HTMLCanvasElement | null>;
  top: RefObject<HTMLCanvasElement | null>;
  mode: RefObject<HTMLSpanElement | null>;
  left: RefObject<HTMLSpanElement | null>;
  right: RefObject<HTMLSpanElement | null>;
};

type WallFollowerHudProps = {
  visible: boolean;
  depthRef: RefObject<HTMLCanvasElement | null>;
  correctionRef: RefObject<HTMLCanvasElement | null>;
  topRef: RefObject<HTMLCanvasElement | null>;
  modeRef: RefObject<HTMLSpanElement | null>;
  leftRef: RefObject<HTMLSpanElement | null>;
  rightRef: RefObject<HTMLSpanElement | null>;
};

/** Sensor HUD for the wall-follower stage; canvases are painted by the scroll driver. */
export function WallFollowerHud(props: WallFollowerHudProps): JSX.Element {
  const { visible, depthRef, correctionRef, topRef, modeRef, leftRef, rightRef } = props;
  return (
    <div className={`career-hud${visible ? " is-visible" : ""}`} aria-hidden="true">
      <figure className="career-hud-panel career-hud-depth">
        <figcaption>TOF CAMERA · 48×24 DEPTH</figcaption>
        <canvas ref={depthRef} />
      </figure>
      <figure className="career-hud-panel career-hud-correction">
        <figcaption>PIXEL CORRECTION · CORNER FIT</figcaption>
        <canvas ref={correctionRef} />
      </figure>
      <figure className="career-hud-panel career-hud-top">
        <figcaption>TOP VIEW · RIGHT-HAND RULE</figcaption>
        <canvas ref={topRef} />
      </figure>
      <div className="career-hud-motors">
        <span ref={modeRef} className="career-hud-mode">
          PID WALL HOLD
        </span>
        <span className="career-hud-pwm">
          L <span ref={leftRef}>62</span>% · R <span ref={rightRef}>62</span>%
        </span>
      </div>
    </div>
  );
}
