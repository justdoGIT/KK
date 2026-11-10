import { useSyncExternalStore } from "react";

export type TourStatus = "ready" | "playing" | "paused" | "complete";
type TourState = { status: TourStatus; step: string; label: string };
let state: TourState = { status: "ready", step: "hero", label: "Introduction" };
let owners = 0;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const getReadingTour = () => state;
export const tourOwnsMotion = () => owners > 0;
export function ownReadingTour() { owners += 1; return () => { owners -= 1; }; }
export function updateReadingTour(update: Partial<TourState>) {
  state = { ...state, ...update };
  listeners.forEach((listener) => listener());
}
export const subscribeReadingTour = subscribe;
export function useReadingTour() { return useSyncExternalStore(subscribe, getReadingTour, getReadingTour); }
export function toggleReadingTour() {
  updateReadingTour({ status: state.status === "playing" ? "paused" : "playing" });
}
