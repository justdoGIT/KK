import { useEffect, useState, type RefObject } from "react";
import type { CareerClock } from "../../../scene/career/career-clock.ts";
import { careerStageAt, clamp01 } from "../../../scene/career/career-timeline.ts";
import { createPose, poseAt, runProgress, sharedMaze } from "../../../scene/career/wall-follower/maze.ts";
import { createSensorFrame, senseInto } from "../../../scene/career/wall-follower/depth-sensor.ts";
import { createHud, motorCommand, type Hud } from "../../../scene/career/wall-follower/hud-draw.ts";
import { onFrame } from "../../../motion/frame.ts";
import { useGuidedScroll } from "../../../motion/guided-scroll.ts";
import type { HudRefs } from "./WallFollowerHud.tsx";

export type CareerElements = {
  section: RefObject<HTMLElement | null>;
  flash: RefObject<HTMLDivElement | null>;
  clock: RefObject<CareerClock>;
  hud: HudRefs;
};

export type CareerDriverState = { near: boolean; active: boolean; stage: number };

function setText(el: HTMLElement | null, text: string): void {
  if (el && el.textContent !== text) el.textContent = text;
}

/**
 * Pinned-section driver: maps scroll to the shared clock, writes CSS variables
 * for the screen's drop-in and the progress rail, and paints the wall-follower
 * HUD from the same simulated depth frames the 3D stage visualises. React only
 * re-renders when the active stage changes.
 */
export function useCareerDriver(els: CareerElements, enabled: boolean): CareerDriverState {
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);
  const [stage, setStage] = useState(0);
  useGuidedScroll(els.section, enabled, 0.94, 300);

  useEffect(() => {
    const section = els.section.current;
    if (!section || !enabled) return;
    const nearObserver = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: "100% 0px 100% 0px",
    });
    const activeObserver = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    nearObserver.observe(section);
    activeObserver.observe(section);
    return () => {
      nearObserver.disconnect();
      activeObserver.disconnect();
    };
  }, [els.section, enabled]);

  useEffect(() => {
    if (!near || !enabled) return;
    const maze = sharedMaze();
    const pose = createPose();
    const frame = createSensorFrame();
    let hud: Hud | null = null;
    let lastStage = -1;
    // Populated in the read phase, consumed by the write phase of the same tick.
    const scratch = { t: 0, intro: 0, current: 0, local: 0, showHud: false };

    const stopRead = onFrame("read", () => {
      const section = els.section.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight;
      const scrollable = Math.max(1, section.offsetHeight - viewport);
      scratch.t = clamp01(-rect.top / scrollable);
      scratch.intro = clamp01((viewport * 0.55 - rect.top) / (viewport * 0.95));
      const { stage: current, local } = careerStageAt(scratch.t);
      scratch.current = current;
      scratch.local = local;
      scratch.showHud = current === 0 && rect.bottom >= 0 && rect.top <= viewport;
    });

    const stopWrite = onFrame("write", (now) => {
      const section = els.section.current;
      const clock = els.clock.current;
      if (!section || !clock) return;
      clock.t = scratch.t;
      clock.stage = scratch.current;
      clock.local = scratch.local;
      section.style.setProperty("--career-intro", scratch.intro.toFixed(4));
      section.style.setProperty("--career-t", scratch.t.toFixed(4));
      section.dataset.careerStage = String(scratch.current);
      section.dataset.careerLocal = scratch.local.toFixed(2);
      if (scratch.current !== lastStage) {
        if (lastStage !== -1) {
          const flash = els.flash.current;
          flash?.classList.remove("is-flashing");
          void flash?.offsetWidth;
          flash?.classList.add("is-flashing");
        }
        lastStage = scratch.current;
        setStage(scratch.current);
      }
      if (!scratch.showHud) return;
      const { depth, correction, top } = els.hud;
      if (!hud && depth.current && correction.current && top.current) {
        hud = createHud({ depth: depth.current, correction: correction.current, top: top.current }, maze);
      }
      if (!hud) return;
      const u = runProgress(scratch.local);
      poseAt(maze, u, pose);
      senseInto(frame, pose, maze.walls);
      hud.draw(frame, pose, u, now);
      const motors = motorCommand(pose, frame);
      setText(els.hud.mode.current, motors.mode);
      setText(els.hud.left.current, String(motors.left));
      setText(els.hud.right.current, String(motors.right));
    });

    return () => {
      stopRead();
      stopWrite();
      hud?.dispose();
    };
  }, [near, enabled, els]);

  return { near, active, stage };
}
