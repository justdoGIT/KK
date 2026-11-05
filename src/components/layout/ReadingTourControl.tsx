import { Pause, Play, RotateCcw } from "lucide-react";
import { toggleReadingTour, useReadingTour } from "../../motion/reading-tour-state.ts";
import "../../styles/reading-tour.css";

export function ReadingTourControl() {
  const { status, label, step } = useReadingTour();
  const playing = status === "playing";
  const action = playing ? "Pause" : status === "complete" ? "Replay" : status === "ready" ? "Start" : "Resume";
  const Icon = playing ? Pause : status === "complete" ? RotateCcw : Play;
  return (
    <button type="button" className="reading-tour-control" data-tour-control data-tour-status={status} data-tour-step={step}
      onClick={toggleReadingTour} aria-label={`${action} reading tour`}
      title={`${action} reading tour · ${label}. A calm 150 words/minute, with reading pauses. Scroll or touch to pause.`}>
      <Icon size={11} aria-hidden="true" />
      <span>{action} tour</span>
      <span className="sr-only">. {status === "complete" ? "Tour complete." : "Scroll or touch to pause. Reading pace: 150 words per minute."}</span>
    </button>
  );
}
