import { useMediaQuery } from "../../motion/use-media-query.ts";

/** Describe the input a visitor actually has, including touch laptops. */
export function InteractionHint({ pointer, touch, className = "" }: { pointer: string; touch: string; className?: string }) {
  const hover = useMediaQuery("(hover: hover) and (pointer: fine)");
  return <p className={`interaction-hint ${className}`}>{hover ? pointer : touch}</p>;
}

export function AstronautInvitation() {
  const hover = useMediaQuery("(hover: hover) and (pointer: fine)");
  return (
    <div className="astronaut-invitation">
      <p id="astronaut-invitation">
        {hover
          ? <>Hover over “Start a Conversation” and watch the astronaut light up with joy. You’ll feel it, too. If a hover can make him this happy, imagine a conversation with you. Go ahead—give it a chance.</>
          : <>A little tap, a lot of joy. Make the astronaut happy below. If a tap can make him this happy, imagine a conversation with you. Go ahead—give it a chance.</>}
      </p>
      {!hover && <button type="button" className="astronaut-preview" data-astronaut-preview data-astronaut-action="dance">Make him happy ✨</button>}
    </div>
  );
}
