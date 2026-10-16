/**
 * cattle.js — Cattle group logic
 * Each group contains 1–3 stylised Phad cattle.
 * When Pabuji comes close, they highlight and can be rescued.
 */

class CattleGroup {
  constructor(x, y, id, count = 2) {
    this.id   = id;
    this.x    = x;
    this.y    = y;
    this.w    = 64;
    this.h    = 50;
    this.count = Math.max(1, Math.min(3, count));

    this.rescued    = false;
    this.triggered  = false;  // dialogue triggered
    this.highlighted = false;
    this.exitTimer  = 0;      // fade-out after rescue
    this.walkTimer  = 0;      // wander animation
    this.baseX      = x;

    // Individual cows in the group
    this.cows = [];
    for (let i = 0; i < this.count; i++) {
      this.cows.push({
        id: id * 10 + i,
        x:  x + i * 55,
        y:  y,
        w:  54,
        h:  44,
        color: i % 2 === 0 ? 'white' : 'dark',
        highlighted: false,
        rescued: false,
        exitTimer: 0,
      });
    }
  }

  getBounds() {
    // Combined bounding box of all cows
    const minX = this.cows[0].x;
    const maxX = this.cows[this.cows.length - 1].x + 54;
    return { x: minX - 20, y: this.y - 10, w: maxX - minX + 74, h: this.h + 20 };
  }

  checkProximity(playerX, playerY) {
    if (this.rescued) return false;
    const b = this.getBounds();
    const px = playerX, py = playerY;
    return px > b.x - 80 && px < b.x + b.w + 80
        && py > b.y - 60 && py < b.y + b.h + 40;
  }

  rescue() {
    if (this.rescued) return;
    this.rescued = true;
    this.exitTimer = 1.5;
    for (const cow of this.cows) {
      cow.rescued  = true;
      cow.exitTimer = 1.5;
    }
  }

  update(dt) {
    if (this.rescued) {
      this.exitTimer -= dt;
      for (const cow of this.cows) {
        cow.exitTimer -= dt;
        // Walk off-screen to the right
        cow.x += 40 * dt;
      }
      return;
    }

    // Gentle wander
    this.walkTimer += dt;
    for (let i = 0; i < this.cows.length; i++) {
      const cow = this.cows[i];
      cow.x = this.baseX + i * 55 + Math.sin(this.walkTimer * 0.8 + i) * 8;
    }
  }

  draw(ctx, camX, frameTime) {
    if (this.rescued && this.exitTimer <= 0) return;

    for (const cow of this.cows) {
      Renderer.drawCattle(ctx, cow, camX, frameTime);
    }

    // Interaction hint when highlighted
    if (this.highlighted && !this.rescued) {
      const cx = this.cows[0].x - camX + (this.count * 55) / 2;
      const cy = this.y - 20;
      ctx.save();
      ctx.globalAlpha = (Math.sin(frameTime * 5) + 1) / 2 * 0.7 + 0.3;
      ctx.fillStyle   = '#E2B33A';
      ctx.font        = 'bold 11px Cinzel, serif';
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('[E] Protect', cx, cy);
      ctx.restore();
    }
  }
}
