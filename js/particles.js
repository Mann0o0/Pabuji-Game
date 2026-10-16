/**
 * particles.js — Particle system for dust, impact splats, scroll effects
 */

const ParticleSystem = (function() {
  const particles = [];

  const COLORS = {
    dust:    ['#C8860A', '#E2B33A', '#EDD9A3', '#C1440E'],
    impact:  ['#E03C0A', '#E2B33A', '#F5E6C8', '#C1440E'],
    cattle:  ['#2C5F2E', '#E2B33A', '#F5E6C8'],
    sparkle: ['#E2B33A', '#F5E6C8', '#C8860A'],
  };

  function emit(type, x, y, count = 6, opts = {}) {
    const cols = COLORS[type] || COLORS.dust;
    for (let i = 0; i < count; i++) {
      const angle  = (opts.dir || 0) + (Math.random() - 0.5) * (opts.spread || Math.PI);
      const speed  = (opts.speed || 80) + Math.random() * (opts.speedVar || 60);
      const life   = (opts.life  || 0.6) + Math.random() * 0.3;
      const size   = (opts.size  || 6)   + Math.random() * 6;
      const color  = cols[Math.floor(Math.random() * cols.length)];

      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (opts.upForce || 30),
        life, maxLife: life,
        size, color, type,
        gravity: opts.gravity !== undefined ? opts.gravity : 60,
        shape: opts.shape || 'circle',
      });
    }
  }

  function emitDust(x, y, dir = -1) {
    emit('dust', x, y, 8, { dir: dir > 0 ? 0 : Math.PI, spread: 1.2, speed: 60, speedVar: 40, upForce: 50, size: 8, gravity: 20 });
  }

  function emitImpact(x, y) {
    emit('impact', x, y, 10, { spread: Math.PI * 2, speed: 100, speedVar: 80, upForce: 0, size: 5, gravity: 80, shape: 'star' });
  }

  function emitCattleSparkle(x, y) {
    emit('sparkle', x, y, 12, { spread: Math.PI * 2, speed: 60, speedVar: 40, upForce: 20, size: 5, gravity: 30, shape: 'diamond' });
  }

  function update(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
    }
  }

  function draw(ctx, camX) {
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      const sx = p.x - camX;
      const sy = p.y;
      ctx.save();
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#1A0A00';
      ctx.lineWidth = 1;
      ctx.beginPath();

      if (p.shape === 'star' || p.shape === 'diamond') {
        // Simple diamond / splat shape
        ctx.moveTo(sx,          sy - p.size);
        ctx.lineTo(sx + p.size * 0.5, sy);
        ctx.lineTo(sx,          sy + p.size);
        ctx.lineTo(sx - p.size * 0.5, sy);
        ctx.closePath();
      } else {
        ctx.arc(sx, sy, p.size * alpha + 2, 0, Math.PI * 2);
      }

      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  return { emit, emitDust, emitImpact, emitCattleSparkle, update, draw };
})();
