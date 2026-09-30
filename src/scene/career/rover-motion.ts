// Measured from public/models/robots/husky.glb: all four wheel meshes'
// local bbox.min.y = -0.1456 (hub at local y=0.0328, tread bottom 0.1785
// below the hub). Ground clearance must cancel that local minimum exactly
// so the tread sits flush on y=0; true radius (hub to tread) drives the
// rolling-without-slipping angle = distance / radius.
export const ROVER_WHEEL_RADIUS = 0.1785;
export const ROVER_GROUND_CLEARANCE = 0.1456;
const SUSPENSION_TRAVEL = 0.008;

export function roverRideHeight(distance: number): number {
  return ROVER_GROUND_CLEARANCE + SUSPENSION_TRAVEL * (1 + Math.sin(distance * 7));
}
