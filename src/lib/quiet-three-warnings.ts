/**
 * three.js r183 deprecates `Clock` in favour of `Timer`, and
 * `@react-three/fiber` 9.7 still constructs one `Clock` per canvas
 * (pmndrs/react-three-fiber#3741), so every canvas mount logs the deprecation
 * warning on the console. The call sites are inside the renderer, not this
 * codebase, and no application code touches `THREE.Clock`.
 *
 * Filter exactly that message; every other warning still reaches the console.
 * Delete this shim once fiber stops constructing `Clock`.
 */
const CLOCK_DEPRECATION = "THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.";

export function quietThreeClockDeprecation(): void {
  const warn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    if (args.length === 1 && args[0] === CLOCK_DEPRECATION) return;
    warn(...args);
  };
}
