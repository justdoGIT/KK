/**
 * High-performance mouse ripple simulation.
 * Manages expanding, dissipating circular wave packets that generate
 * normal/displacement vectors for fluid refraction and chromatic dispersion.
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
  private ripples: RipplePoint[] = [];
  public textureNeedsUpdate = false;
  private lastX = -1;
  private lastY = -1;
  private lastTime = 0;

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

      // Only add ripple if moving sufficiently
      if (dist > 2) {
        this.ripples.push({
          x: px,
          y: py,
          radius: 2,
          maxRadius: Math.min(80, 25 + speed * 15),
          intensity: Math.min(1.0, 0.4 + speed * 0.4) * force,
          speed: 1.8 + speed * 0.6,
        });

        // Cap active ripples for performance
        if (this.ripples.length > 32) {
          this.ripples.shift();
        }
      }
    }

    this.lastX = px;
    this.lastY = py;
  }

  public update(): boolean {
    if (!this.ctx || !this.canvas) return false;

    // Neutral gray background represents zero displacement in normal map
    this.ctx.fillStyle = "rgba(128, 128, 128, 0.08)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.ripples.length === 0) return false;

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += r.speed;
      r.intensity *= 0.94;

      if (r.radius >= r.maxRadius || r.intensity < 0.02) {
        this.ripples.splice(i, 1);
        continue;
      }

      // Draw expanding concentric wave rings with directional normal encoding
      const grad = this.ctx.createRadialGradient(r.x, r.y, Math.max(0, r.radius - 8), r.x, r.y, r.radius + 8);
      const alpha = r.intensity * 0.65;
      grad.addColorStop(0, "rgba(128, 128, 128, 0)");
      grad.addColorStop(0.3, `rgba(220, 180, 255, ${alpha})`);
      grad.addColorStop(0.5, `rgba(128, 128, 128, ${alpha * 0.5})`);
      grad.addColorStop(0.7, `rgba(35, 75, 128, ${alpha})`);
      grad.addColorStop(1, "rgba(128, 128, 128, 0)");

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius + 8, 0, Math.PI * 2);
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
