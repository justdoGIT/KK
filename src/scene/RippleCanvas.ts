/**
 * High-performance mouse ripple simulation.
 * Manages expanding circular wave packets and continuous hovering pulses
 * that generate normal/displacement vectors for fluid refraction and chromatic dispersion.
 */

export type RipplePoint = {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  intensity: number;
  speed: number;
};

export class RippleCanvas {
  public canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  public textureNeedsUpdate = false;
  private ripples: RipplePoint[] = [];
  private lastX = -1;
  private lastY = -1;
  private lastTime = 0;
  private lastPulseTime = 0;
  // True once the canvas has settled to its neutral, undisplaced state with
  // no live ripples; skips redrawing and re-uploading an already-neutral
  // texture every frame while the cursor is away.
  private idle = true;

  constructor(public width = 256, public height = 256) {
    if (typeof document !== "undefined") {
      this.canvas = document.createElement("canvas");
      this.canvas.width = width;
      this.canvas.height = height;
      this.ctx = this.canvas.getContext("2d", { willReadFrequently: false });
      if (this.ctx) {
        this.ctx.fillStyle = "#808080";
        this.ctx.fillRect(0, 0, width, height);
      }
    }
  }

  public addPointerMove(normalizedX: number, normalizedY: number, force = 1.0): void {
    const px = (normalizedX * 0.5 + 0.5) * this.width;
    const py = (-normalizedY * 0.5 + 0.5) * this.height;

    const now = performance.now();
    const dt = Math.max(1, now - this.lastTime);
    this.lastTime = now;

    if (this.lastX >= 0 && this.lastY >= 0) {
      const dx = px - this.lastX;
      const dy = py - this.lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const speed = dist / dt;

      // Add dynamic ripple on movement
      if (dist > 1.5) {
        this.ripples.push({
          x: px,
          y: py,
          radius: 3,
          maxRadius: Math.min(95, 30 + speed * 18),
          intensity: Math.min(1.0, 0.45 + speed * 0.4) * force,
          speed: 1.6 + speed * 0.6,
        });

        if (this.ripples.length > 36) {
          this.ripples.shift();
        }
      }
    }

    this.lastX = px;
    this.lastY = py;
  }

  /**
   * Generates continuous breathing fluid micro-ripples while the cursor
   * is present, ensuring the ripple effect never finishes as long as the mouse is active.
   */
  public addContinuousPulse(normalizedX: number, normalizedY: number, force = 0.55): void {
    const now = performance.now();
    // Emit periodic breathing pulse every 140ms
    if (now - this.lastPulseTime < 140) return;
    this.lastPulseTime = now;

    const px = (normalizedX * 0.5 + 0.5) * this.width;
    const py = (-normalizedY * 0.5 + 0.5) * this.height;

    this.ripples.push({
      x: px,
      y: py,
      radius: 4,
      maxRadius: 65,
      intensity: 0.65 * force,
      speed: 1.4,
    });

    if (this.ripples.length > 36) {
      this.ripples.shift();
    }
  }

  public update(): boolean {
    if (!this.ctx || !this.canvas) return false;
    if (this.ripples.length === 0) {
      // Already neutral from a prior idle call: nothing to redraw or upload.
      if (this.idle) return false;
      // One last fade-to-neutral pass, then go idle until the next ripple.
      this.ctx.fillStyle = "rgba(128, 128, 128, 0.08)";
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.idle = true;
      this.textureNeedsUpdate = true;
      return true;
    }
    this.idle = false;

    // Neutral gray background represents zero displacement in normal map
    this.ctx.fillStyle = "rgba(128, 128, 128, 0.08)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += r.speed;
      r.intensity *= 0.95;

      if (r.radius >= r.maxRadius || r.intensity < 0.015) {
        this.ripples.splice(i, 1);
        continue;
      }

      // Draw expanding concentric wave rings with directional normal encoding
      const grad = this.ctx.createRadialGradient(
        r.x,
        r.y,
        Math.max(0, r.radius - 10),
        r.x,
        r.y,
        r.radius + 10,
      );
      const alpha = r.intensity * 0.7;
      grad.addColorStop(0, "rgba(128, 128, 128, 0)");
      grad.addColorStop(0.3, `rgba(225, 185, 255, ${alpha})`);
      grad.addColorStop(0.5, `rgba(128, 128, 128, ${alpha * 0.45})`);
      grad.addColorStop(0.7, `rgba(30, 80, 140, ${alpha})`);
      grad.addColorStop(1, "rgba(128, 128, 128, 0)");

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius + 10, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.textureNeedsUpdate = true;
    return true;
  }

  public dispose(): void {
    this.ripples = [];
    this.canvas = null;
    this.ctx = null;
  }
}
