// Damped height-field water. Cursor strokes disturb one connected surface;
// surface normals drive both refraction and reflected light.
export class WaterSurface {
  constructor(size) {
    this.size = size;
    this.height = new Float32Array(size * size);
    this.velocity = new Float32Array(size * size);
    this.scratch = new Float32Array(size * size);
  }

  clear() {
    this.height.fill(0);
    this.velocity.fill(0);
  }

  shift(dx, dy) {
    if (!dx && !dy) return;
    const n = this.size;
    for (const field of [this.height, this.velocity]) {
      this.scratch.fill(0);
      for (let y = 1; y < n - 1; y++) {
        for (let x = 1; x < n - 1; x++) {
          const sx = x + dx;
          const sy = y + dy;
          if (sx > 0 && sy > 0 && sx < n - 1 && sy < n - 1) {
            this.scratch[y * n + x] = field[sy * n + sx];
          }
        }
      }
      field.set(this.scratch);
    }
  }

  stroke(ax, ay, bx, by, strength, width = 4) {
    const n = this.size;
    const dx = bx - ax;
    const dy = by - ay;
    const length = dx * dx + dy * dy;
    if (length < .01) return;
    const distance = Math.sqrt(length);
    const radius = Math.ceil(width * 3);
    const minX = Math.max(1, Math.floor(Math.min(ax, bx) - radius));
    const maxX = Math.min(n - 2, Math.ceil(Math.max(ax, bx) + radius));
    const minY = Math.max(1, Math.floor(Math.min(ay, by) - radius));
    const maxY = Math.min(n - 2, Math.ceil(Math.max(ay, by) + radius));
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length));
        const rx = x - ax - t * dx;
        const ry = y - ay - t * dy;
        const r2 = (rx * rx + ry * ry) / (width * width);
        if (r2 > 8) continue;
        // A trough with raised shoulders, slightly twisted by stroke direction.
        const side = (rx * -dy + ry * dx) / distance;
        const wake = (r2 - 1) * Math.exp(-r2 * .65);
        // World-space phase avoids a repeating bump at each pointer sample.
        const twist = Math.sin(x * .13 + y * .09 + side * .35) * .22 * Math.exp(-r2);
        const i = y * n + x;
        this.height[i] = Math.max(-9, Math.min(9, this.height[i] + (wake + twist) * strength));
      }
    }
  }

  step() {
    const n = this.size;
    const h = this.height;
    const v = this.velocity;
    for (let y = 1; y < n - 1; y++) {
      for (let x = 1; x < n - 1; x++) {
        const i = y * n + x;
        const laplacian = h[i - 1] + h[i + 1] + h[i - n] + h[i + n] - 4 * h[i];
        // Absorb outgoing waves at the boundary instead of reflecting a box.
        const edge = Math.min(x, y, n - 1 - x, n - 1 - y);
        const damping = edge < 12 ? .82 + edge / 12 * .155 : .975;
        v[i] = (v[i] + laplacian * .18) * damping;
      }
    }
    for (let i = 0; i < h.length; i++) h[i] = (h[i] + v[i]) * .99;
  }
}
