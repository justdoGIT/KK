export const ROVER_WHEEL_RADIUS = 0.1651;
const SUSPENSION_TRAVEL = 0.008;

export function roverRideHeight(distance: number): number {
  return ROVER_WHEEL_RADIUS + SUSPENSION_TRAVEL * (1 + Math.sin(distance * 7));
}
