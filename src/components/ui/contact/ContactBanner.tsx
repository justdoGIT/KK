import { Suspense, lazy, useRef, useState, type JSX, type ReactNode } from "react";
import { useMotionMode } from "../../../motion/use-motion-mode.ts";
import { checkWebGL } from "../../../scene/useCapability.ts";
import { useBannerLanding } from "./useBannerLanding.ts";

const LoungeCanvas = lazy(() =>
  import("../../../scene/astronaut/LoungeCanvas.tsx").then((m) => ({ default: m.LoungeCanvas })),
);

/**
 * The contact card as a solid cuboid banner: `children` is the front face, a
 * lit top face gives it depth. With motion enabled it pops up on reveal and
 * the astronaut drops onto the top face to lounge there.
 */
export function ContactBanner({ children }: { children: ReactNode }): JSX.Element {
  const enhanced = useMotionMode() === "enhanced";
  const [webgl] = useState(checkWebGL);
  const animated = enhanced && webgl;
  const root = useRef<HTMLDivElement>(null);
  const mover = useRef<HTMLDivElement>(null);
  const { near, active, clock } = useBannerLanding(root, mover, animated);

  return (
    <div ref={root} className="contact-banner">
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
  );
}
