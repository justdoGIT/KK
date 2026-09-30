import {
  Suspense,
  lazy,
  useRef,
  useState,
  type FocusEvent,
  type JSX,
  type PointerEvent,
  type ReactNode,
} from "react";
import { useMotionMode } from "../../../motion/use-motion-mode.ts";
import { checkWebGL } from "../../../scene/useCapability.ts";
import { useBannerLanding } from "./useBannerLanding.ts";

const LoungeCanvas = lazy(() =>
  import("../../../scene/astronaut/LoungeCanvas.tsx").then((m) => ({ default: m.LoungeCanvas })),
);

function actionFrom(target: EventTarget | null): string | undefined {
  return target instanceof Element
    ? target.closest<HTMLElement>("[data-astronaut-action]")?.dataset.astronautAction
    : undefined;
}

/** One contact banner: landing deck, scroll-selected poses, and CTA reactions. */
export function ContactBanner({ children }: { children: ReactNode }): JSX.Element {
  const enhanced = useMotionMode() === "enhanced";
  const [webgl] = useState(checkWebGL);
  const animated = enhanced && webgl;
  const root = useRef<HTMLDivElement>(null);
  const mover = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const { near, active, clock, interact } = useBannerLanding(root, mover, heading, animated);

  const selectAction = (action: string | undefined) => {
    interact(action === "dance" ? "dance" : "none");
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    selectAction(actionFrom(event.target));
  };
  const onPointerLeave = () => selectAction(undefined);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (actionFrom(event.target) === "wait") interact("wait");
  };
  const onFocus = (event: FocusEvent<HTMLDivElement>) => selectAction(actionFrom(event.target));
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) selectAction(undefined);
  };

  return (
    <div
      ref={root}
      className={`contact-banner${animated ? " contact-banner--animated" : ""}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <div className="contact-banner-stage">
        <h2 ref={heading} className="contact-journey-heading">
          Let&rsquo;s innovate together
        </h2>
        <div ref={mover} className="contact-banner-mover">
          {animated && near ? (
            <div className="contact-lounge" aria-hidden="true">
              <Suspense fallback={null}>
                <LoungeCanvas clock={clock} active={active} />
              </Suspense>
            </div>
          ) : null}
          <div className="contact-cuboid">
            <div className="contact-cuboid-top" aria-hidden="true" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
