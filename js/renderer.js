/**
 * renderer.js — Phad-style Canvas drawing routines
 * All characters, environments, and UI are drawn procedurally
 * to emulate the look of Rajasthani Phad painting.
 *
 * Phad style rules applied:
 *  - Bold dark outlines (stroke before/after fill)
 *  - Flat colour regions with minimal shading
 *  - Stylised proportions (large eyes, decorative clothing)
 *  - Terracotta / ochre / mustard / vermilion palette
 */

const Renderer = (function() {

  // ── Palette ──────────────────────────────────────────────
  const C = {
    terracotta:  '#C1440E',
    ochre:       '#C8860A',
    mustard:     '#E2B33A',
    vermilion:   '#E03C0A',
    cream:       '#F5E6C8',
    agedPaper:   '#EDD9A3',
    darkGreen:   '#2C5F2E',
    outline:     '#1A0A00',
    deepIndigo:  '#2D2B6E',
    warmRed:     '#8B1A10',
    skyTop:      '#D4734A',
    skyMid:      '#E8A060',
    skyBot:      '#F5C878',
    sand:        '#D4A96A',
    darkSand:    '#B8834A',
    white:       '#F5E6C8',
    black:       '#1A0A00',
    cattleBrown: '#8B4513',
    cattleWhite: '#F0E8D0',
    patanWall:   '#B87333',
    patanAccent: '#8B2500',
  };

  // ── Helpers ──────────────────────────────────────────────

  function outlined(ctx, fn, strokeW = 2.5, strokeColor = C.outline) {
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth   = strokeW;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    fn();
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ── Background ───────────────────────────────────────────

  function drawBackground(ctx, canvasW, canvasH, camX, section) {
    // Sky gradient — shifts warmth by section
    const skyColors = {
      road:  [C.skyTop, C.skyMid, C.skyBot],
      cattle:[C.skyTop, '#D46040', '#E8A060'],
      patan: ['#8B3010', '#C15030', '#E87840'],
      boss:  ['#5A1A00', '#8B2500', '#C14010'],
    };
    const sky = skyColors[section] || skyColors.road;
    const grad = ctx.createLinearGradient(0, 0, 0, canvasH * 0.6);
    grad.addColorStop(0,   sky[0]);
    grad.addColorStop(0.5, sky[1]);
    grad.addColorStop(1,   sky[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasW, canvasH * 0.6);

    // Ground band
    const groundY = canvasH * 0.72;
    ctx.fillStyle = C.sand;
    ctx.fillRect(0, groundY, canvasW, canvasH - groundY);

    // Ground texture line
    ctx.fillStyle = C.darkSand;
    ctx.fillRect(0, groundY, canvasW, 6);

    // Decorative top band (Phad border pattern)
    drawPhadBorderBand(ctx, canvasW, 0, 18);
    // Bottom band
    drawPhadBorderBand(ctx, canvasW, canvasH - 18, 18);

    // Far mountains / dunes (parallax)
    drawDunes(ctx, canvasW, canvasH, camX * 0.15, section);

    // Mid-ground vegetation / architecture
    drawMidground(ctx, canvasW, canvasH, camX * 0.35, section);

    // Subtle paper texture overlay
    drawPaperTexture(ctx, canvasW, canvasH);
  }

  function drawPhadBorderBand(ctx, w, y, h) {
    // Terracotta band with folk pattern
    ctx.fillStyle = C.terracotta;
    ctx.fillRect(0, y, w, h);
    ctx.strokeStyle = C.outline;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, y, w, h);

    // Diamond folk pattern along the band
    ctx.fillStyle = C.mustard;
    const spacing = 28;
    for (let x = spacing / 2; x < w; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x,     y + h * 0.15);
      ctx.lineTo(x + 7, y + h * 0.5);
      ctx.lineTo(x,     y + h * 0.85);
      ctx.lineTo(x - 7, y + h * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // Small dots between
    ctx.fillStyle = C.cream;
    for (let x = spacing; x < w; x += spacing) {
      ctx.beginPath();
      ctx.arc(x, y + h * 0.5, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawDunes(ctx, w, h, offsetX, section) {
    ctx.save();
    const baseY = h * 0.62;

    if (section === 'patan' || section === 'boss') {
      // Distant city silhouette
      ctx.fillStyle = '#7A2800';
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= w + 100; x += 80) {
        const ox = ((x - offsetX % 1200) + 1200) % (w + 400) - 200;
        // Tower
        ctx.lineTo(ox - 20, baseY);
        ctx.lineTo(ox - 20, baseY - 70);
        ctx.lineTo(ox - 30, baseY - 70);
        ctx.lineTo(ox - 30, baseY - 90);
        ctx.lineTo(ox - 20, baseY - 90);
        ctx.lineTo(ox - 15, baseY - 100);
        ctx.lineTo(ox - 10, baseY - 90);
        ctx.lineTo(ox,      baseY - 90);
        ctx.lineTo(ox,      baseY - 70);
        ctx.lineTo(ox + 10, baseY - 70);
        ctx.lineTo(ox + 10, baseY);
      }
      ctx.lineTo(w, baseY);
      ctx.closePath();
      ctx.fill();
    } else {
      // Sand dunes
      ctx.fillStyle = '#C8904A';
      ctx.beginPath();
      ctx.moveTo(-50, h);
      for (let x = -50; x <= w + 100; x += 120) {
        const ox = x + ((offsetX * 0.5) % 120);
        ctx.bezierCurveTo(ox + 30, baseY - 40, ox + 90, baseY - 40, ox + 120, h);
      }
      ctx.lineTo(w + 100, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMidground(ctx, w, h, offsetX, section) {
    ctx.save();
    const groundY = h * 0.72;

    if (section === 'patan' || section === 'boss') {
      // Fort walls
      ctx.fillStyle = C.patanWall;
      ctx.fillRect(0, groundY - 40, w, 40);
      ctx.fillStyle = C.patanAccent;
      ctx.lineWidth = 2;
      // Merlons on top of wall
      for (let x = 0; x < w; x += 50) {
        const ox = ((x - offsetX % 400) + 400) % (w + 200) - 100;
        ctx.fillRect(ox, groundY - 60, 22, 20);
        ctx.strokeRect(ox, groundY - 60, 22, 20);
      }
      // Arches
      ctx.fillStyle = '#6B1A00';
      for (let x = 0; x < w + 200; x += 200) {
        const ox = ((x - offsetX % 1000) + 1000) % (w + 400) - 200;
        ctx.beginPath();
        ctx.arc(ox + 60, groundY - 40, 35, Math.PI, 0, false);
        ctx.lineTo(ox + 95, groundY - 10);
        ctx.lineTo(ox + 25, groundY - 10);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Desert shrubs / stylised trees
      ctx.fillStyle = C.darkGreen;
      for (let x = 0; x < w + 300; x += 160) {
        const ox = ((x - offsetX % 1200) + 1200) % (w + 600) - 300;
        drawStyleizedTree(ctx, ox, groundY - 5);
      }
    }
    ctx.restore();
  }

  function drawStyleizedTree(ctx, x, y) {
    // Trunk
    ctx.fillStyle = '#6B3A10';
    ctx.strokeStyle = C.outline;
    ctx.lineWidth = 1.5;
    ctx.fillRect(x - 5, y - 30, 10, 30);
    ctx.strokeRect(x - 5, y - 30, 10, 30);

    // Leaf clusters (Phad-style round blobs)
    const colors = [C.darkGreen, '#3D7A3F', '#2C5F2E'];
    [[-8, -45, 18], [4, -55, 14], [-2, -40, 12]].forEach(([dx, dy, r], i) => {
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  function drawPaperTexture(ctx, w, h) {
    // Very subtle horizontal grain lines
    ctx.save();
    ctx.globalAlpha = 0.03;
    ctx.strokeStyle = '#6B3A00';
    ctx.lineWidth = 1;
    for (let y = 30; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Platform / ground drawing ─────────────────────────────

  function drawPlatform(ctx, plat, camX) {
    const x = plat.x - camX;
    const y = plat.y;
    ctx.fillStyle = plat.color || C.darkSand;
    ctx.strokeStyle = C.outline;
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, plat.w, plat.h);
    ctx.strokeRect(x, y, plat.w, plat.h);
    // Decorative top edge
    ctx.fillStyle = C.mustard;
    ctx.fillRect(x, y, plat.w, 4);
  }

  // ── Pabuji + Kesar Kalami ────────────────────────────────

  function drawPlayer(ctx, player, camX, frameTime) {
    const sx = player.x - camX;
    const sy = player.y;
    const dir = player.facing; // 1=right, -1=left
    const state = player.state;
    const anim  = player.animTimer;

    ctx.save();
    ctx.translate(sx + player.w / 2, sy + player.h);
    if (dir === -1) ctx.scale(-1, 1);

    // Body sway
    const sway = (state === 'running') ? Math.sin(anim * 12) * 2 : 0;
    ctx.translate(0, sway * 0.5);

    // Draw horse first (behind rider)
    drawKesarKalami(ctx, state, anim, dir);

    // Draw Pabuji (rider)
    drawPabujiRider(ctx, state, anim);

    // Attack flash
    if (state === 'attacking') {
      drawSwordAttackEffect(ctx, anim, player.attackTimer, player.attackDuration);
    }

    // Hurt flash
    if (player.hurtTimer > 0) {
      ctx.globalAlpha = (Math.sin(player.hurtTimer * 20) > 0) ? 0.4 : 1;
    }

    ctx.restore();
  }

  function drawKesarKalami(ctx, state, anim, dir) {
    // Kesar Kalami — the black mare
    // Positions are relative to bottom-center of the combined sprite

    const legSwing = (state === 'running' || state === 'charging') ? Math.sin(anim * 14) * 12 : 0;
    const chargeStretch = (state === 'charging') ? 8 : 0;

    ctx.save();

    // ── Body ──
    outlined(ctx, () => {
      ctx.fillStyle = '#1A0A00'; // pure black for Kesar Kalami
      ctx.beginPath();
      ctx.ellipse(8 + chargeStretch, -42, 38 + chargeStretch, 22, 0, 0, Math.PI * 2);
    }, 2.5);

    // ── Neck ──
    outlined(ctx, () => {
      ctx.fillStyle = '#1A0A00';
      ctx.beginPath();
      ctx.moveTo(30, -52);
      ctx.bezierCurveTo(46, -65, 52, -72, 48, -80);
      ctx.bezierCurveTo(44, -88, 38, -84, 34, -75);
      ctx.bezierCurveTo(30, -66, 24, -58, 22, -52);
      ctx.closePath();
    }, 2.5);

    // ── Head ──
    outlined(ctx, () => {
      ctx.fillStyle = '#1A0A00';
      ctx.beginPath();
      ctx.ellipse(48, -84, 14, 10, -0.3, 0, Math.PI * 2);
    }, 2.5);

    // ── Nostril / eye ──
    ctx.fillStyle = C.vermilion;
    ctx.beginPath(); ctx.arc(57, -82, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.cream;
    ctx.beginPath(); ctx.arc(44, -86, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.outline;
    ctx.beginPath(); ctx.arc(45, -86, 1.5, 0, Math.PI * 2); ctx.fill();

    // ── Ear ──
    outlined(ctx, () => {
      ctx.fillStyle = '#1A0A00';
      ctx.beginPath();
      ctx.moveTo(40, -92); ctx.lineTo(44, -102); ctx.lineTo(48, -94);
      ctx.closePath();
    }, 1.5);

    // ── Mane ──
    ctx.strokeStyle = C.terracotta;
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(40 - i * 4, -90 + i * 2);
      ctx.bezierCurveTo(36 - i * 3, -80 + i * 3, 30 - i * 2, -70 + i * 3, 25 - i * 2, -60 + i * 2);
      ctx.stroke();
    }

    // ── Decorated Tack / Saddle cloth ──
    ctx.fillStyle = C.terracotta;
    ctx.strokeStyle = C.outline;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(-2, -52, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Saddle cloth pattern dots
    ctx.fillStyle = C.mustard;
    [[-8,-50],[-2,-48],[6,-50],[-4,-56],[4,-56]].forEach(([dx,dy]) => {
      ctx.beginPath(); ctx.arc(dx, dy, 2, 0, Math.PI * 2); ctx.fill();
    });

    // Bridle
    ctx.strokeStyle = C.vermilion;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(38, -78);
    ctx.bezierCurveTo(44, -72, 50, -70, 54, -78);
    ctx.stroke();

    // ── Legs (animated) ──
    const legPairs = [
      [-22, 0, legSwing],
      [-8,  0, -legSwing],
      [8,   0, legSwing],
      [26,  0, -legSwing],
    ];
    legPairs.forEach(([lx, ly, swing]) => {
      outlined(ctx, () => {
        ctx.fillStyle = '#1A0A00';
        ctx.beginPath();
        ctx.moveTo(lx, -22);
        ctx.bezierCurveTo(lx + swing * 0.3, -14, lx + swing * 0.5, -8, lx + swing * 0.5, 0);
        ctx.lineTo(lx + swing * 0.5 + 5, 0);
        ctx.bezierCurveTo(lx + swing * 0.5 + 5, -8, lx + swing * 0.3 + 5, -14, lx + 5, -22);
        ctx.closePath();
      }, 1.5);
    });

    // ── Tail ──
    ctx.strokeStyle = C.terracotta;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-30, -45);
    const tailSwing = Math.sin(anim * 8) * 10;
    ctx.bezierCurveTo(-48, -35 + tailSwing, -52, -20 + tailSwing, -44, -5 + tailSwing);
    ctx.stroke();

    ctx.restore();
  }

  function drawPabujiRider(ctx, state, anim) {
    ctx.save();
    ctx.translate(0, -50); // rider sits on horse

    // ── Torso ──
    outlined(ctx, () => {
      ctx.fillStyle = C.deepIndigo; // dark warrior tunic
      ctx.beginPath();
      ctx.moveTo(-9, -42);
      ctx.lineTo(-12, -10);
      ctx.lineTo(12, -10);
      ctx.lineTo(9, -42);
      ctx.closePath();
    }, 2);

    // Tunic pattern (Rajasthani embroidery look)
    ctx.strokeStyle = C.mustard;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-8, -35); ctx.lineTo(8, -35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-7, -28); ctx.lineTo(7, -28); ctx.stroke();

    // ── Dhoti / lower garment ──
    outlined(ctx, () => {
      ctx.fillStyle = C.cream;
      ctx.beginPath();
      ctx.moveTo(-12, -10);
      ctx.lineTo(-16, 10);
      ctx.lineTo(16, 10);
      ctx.lineTo(12, -10);
      ctx.closePath();
    }, 2);

    // ── Arms ──
    const armSwing = (state === 'running') ? Math.sin(anim * 12) * 8 : 0;
    // Sword arm (right arm = forward)
    outlined(ctx, () => {
      ctx.fillStyle = C.terracotta; // skin tone
      ctx.beginPath();
      ctx.moveTo(8, -38);
      ctx.bezierCurveTo(18 + armSwing * 0.5, -32, 22 + armSwing, -24, 20 + armSwing * 0.5, -12);
      ctx.lineTo(15 + armSwing * 0.5, -12);
      ctx.bezierCurveTo(18 + armSwing, -22, 14 + armSwing * 0.5, -30, 5, -36);
      ctx.closePath();
    }, 1.5);

    // Left arm
    outlined(ctx, () => {
      ctx.fillStyle = C.terracotta;
      ctx.beginPath();
      ctx.moveTo(-8, -38);
      ctx.bezierCurveTo(-18 - armSwing * 0.5, -32, -14 - armSwing, -22, -12 - armSwing * 0.3, -12);
      ctx.lineTo(-7 - armSwing * 0.3, -12);
      ctx.bezierCurveTo(-9 - armSwing, -22, -14 - armSwing * 0.5, -32, -5, -36);
      ctx.closePath();
    }, 1.5);

    // ── Sword ──
    drawSword(ctx, state, anim);

    // ── Head ──
    outlined(ctx, () => {
      ctx.fillStyle = C.terracotta; // skin
      ctx.beginPath();
      ctx.ellipse(0, -52, 11, 13, 0, 0, Math.PI * 2);
    }, 2);

    // ── Large Eyes (Phad style) ──
    // White of eye
    ctx.fillStyle = C.cream;
    ctx.beginPath(); ctx.ellipse(-5, -53, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, -53, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    // Iris
    ctx.fillStyle = '#1A0A00';
    ctx.beginPath(); ctx.arc(-4, -53, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -53, 2.5, 0, Math.PI * 2); ctx.fill();
    // Kohl outline (thick Phad eye lines)
    ctx.strokeStyle = '#1A0A00'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(-5, -53, 5, 4, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(5, -53, 5, 4, 0, 0, Math.PI * 2); ctx.stroke();
    // Eye highlights
    ctx.fillStyle = C.cream;
    ctx.beginPath(); ctx.arc(-3.5, -54, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6.5, -54, 1, 0, Math.PI * 2); ctx.fill();

    // ── Moustache ──
    ctx.strokeStyle = '#1A0A00'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-8, -46); ctx.bezierCurveTo(-6, -44, -2, -44, 0, -45); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, -46); ctx.bezierCurveTo(6, -44, 2, -44, 0, -45); ctx.stroke();

    // ── Turban ──
    drawTurban(ctx);

    // ── Jewellery / necklace ──
    ctx.strokeStyle = C.mustard;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -42, 8, 0.4, Math.PI - 0.4, false); ctx.stroke();
    ctx.fillStyle = C.vermilion;
    ctx.beginPath(); ctx.arc(0, -34, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1A0A00'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, -34, 2.5, 0, Math.PI * 2); ctx.stroke();

    ctx.restore();
  }

  function drawTurban(ctx) {
    // Base turban shape
    outlined(ctx, () => {
      ctx.fillStyle = C.vermilion;
      ctx.beginPath();
      ctx.ellipse(0, -60, 13, 8, 0, 0, Math.PI * 2);
    }, 2);

    // Turban wraps (painted style stripes)
    ctx.strokeStyle = C.mustard; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, -58, 11, 6, -0.2, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -62, 10, 5, 0.2, 0, Math.PI * 2); ctx.stroke();

    // Turban jewel (sarpech)
    ctx.fillStyle = C.mustard;
    ctx.beginPath(); ctx.arc(6, -65, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.cream;
    ctx.beginPath(); ctx.arc(6, -65, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1A0A00'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(6, -65, 4, 0, Math.PI * 2); ctx.stroke();

    // Flowing turban end
    ctx.strokeStyle = C.vermilion; ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-10, -58);
    ctx.bezierCurveTo(-18, -54, -22, -48, -18, -40);
    ctx.stroke();
    ctx.strokeStyle = C.mustard; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, -58);
    ctx.bezierCurveTo(-18, -54, -22, -48, -18, -40);
    ctx.stroke();
  }

  function drawSword(ctx, state, anim) {
    ctx.save();
    ctx.translate(18, -30);

    let rotation = 0.3; // default grip angle
    if (state === 'attacking') {
      // Swing animation: rotate sword arc over attackTimer
      const swingProgress = anim; // 0→1
      rotation = 0.3 - swingProgress * Math.PI * 0.8;
    } else if (state === 'charging') {
      rotation = -0.2; // forward lean
    }
    ctx.rotate(rotation);

    // Handle
    ctx.fillStyle = C.ochre;
    ctx.strokeStyle = C.outline;
    ctx.lineWidth = 1.5;
    ctx.fillRect(-3, 0, 6, 14);
    ctx.strokeRect(-3, 0, 6, 14);

    // Guard
    ctx.fillStyle = C.mustard;
    ctx.fillRect(-8, 10, 16, 5);
    ctx.strokeRect(-8, 10, 16, 5);

    // Blade
    outlined(ctx, () => {
      ctx.fillStyle = '#D4D0C0'; // metal
      ctx.beginPath();
      ctx.moveTo(-3, 14);
      ctx.lineTo(-1.5, -30);
      ctx.lineTo(0, -34);
      ctx.lineTo(1.5, -30);
      ctx.lineTo(3, 14);
      ctx.closePath();
    }, 1.5);

    // Blade shine
    ctx.strokeStyle = C.cream;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-0.5, 14); ctx.lineTo(-0.5, -30);
    ctx.stroke();

    ctx.restore();
  }

  function drawSwordAttackEffect(ctx, anim, attackTimer, attackDuration) {
    const progress = 1 - (attackTimer / attackDuration);
    ctx.save();
    ctx.translate(25, -80);
    ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.7;

    // Painted arc effect
    const startAngle = -0.5;
    const endAngle   = startAngle + progress * Math.PI * 1.2;
    ctx.strokeStyle = C.mustard;
    ctx.lineWidth   = 12;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, 40, startAngle, endAngle);
    ctx.stroke();

    ctx.strokeStyle = C.vermilion;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 40, startAngle, endAngle);
    ctx.stroke();

    // Star burst
    if (progress > 0.5) {
      ctx.strokeStyle = C.cream;
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 30, Math.sin(a) * 30);
        ctx.lineTo(Math.cos(a) * 48, Math.sin(a) * 48);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ── Enemies ──────────────────────────────────────────────

  function drawEnemy(ctx, enemy, camX) {
    if (enemy.dead && enemy.deathTimer <= 0) return;
    const sx = enemy.x - camX;
    const sy = enemy.y;
    const dir  = enemy.facing;
    const anim = enemy.animTimer;

    ctx.save();
    ctx.translate(sx + enemy.w / 2, sy + enemy.h);

    if (enemy.hurtTimer > 0) {
      ctx.globalAlpha = (Math.sin(enemy.hurtTimer * 20) > 0) ? 0.4 : 1;
    }
    if (enemy.dead) {
      ctx.globalAlpha *= Math.max(0, enemy.deathTimer / 0.5);
      ctx.rotate(dir * 0.8);
    }

    if (dir === -1) ctx.scale(-1, 1);

    switch (enemy.type) {
      case 'PatanGuard':   drawPatanGuard(ctx, anim, enemy.state); break;
      case 'ArmedSoldier': drawArmedSoldier(ctx, anim, enemy.state); break;
      case 'CavalryGuard': drawCavalryGuard(ctx, anim, enemy.state); break;
    }

    // Health bar above enemy
    if (!enemy.dead && enemy.hp < enemy.maxHp) {
      const bw = 36, bh = 5;
      const bx = -bw / 2;
      const by = -enemy.h - 14;
      ctx.fillStyle = '#3A1A00';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = C.vermilion;
      ctx.fillRect(bx, by, bw * (enemy.hp / enemy.maxHp), bh);
      ctx.strokeStyle = C.outline;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);
    }

    ctx.restore();
  }

  function drawPatanGuard(ctx, anim, state) {
    const legSwing = state === 'chase' ? Math.sin(anim * 10) * 10 : 0;
    // ── Legs ──
    [-8, 8].forEach((lx, i) => {
      outlined(ctx, () => {
        ctx.fillStyle = '#4A3A20';
        ctx.beginPath();
        ctx.moveTo(lx, -10);
        ctx.lineTo(lx + (i===0?legSwing:-legSwing) * 0.5, 0);
        ctx.lineTo(lx + (i===0?legSwing:-legSwing) * 0.5 + 6, 0);
        ctx.lineTo(lx + 6, -10);
        ctx.closePath();
      }, 1.5);
    });
    // ── Body armour ──
    outlined(ctx, () => {
      ctx.fillStyle = C.ochre;
      ctx.beginPath();
      ctx.moveTo(-11, -44); ctx.lineTo(-13, -10); ctx.lineTo(13, -10); ctx.lineTo(11, -44);
      ctx.closePath();
    }, 2);
    // Armour stripes
    ctx.strokeStyle = C.terracotta; ctx.lineWidth = 1.5;
    [-36, -28, -20].forEach(y => {
      ctx.beginPath(); ctx.moveTo(-10, y); ctx.lineTo(10, y); ctx.stroke();
    });
    // Arms
    outlined(ctx, () => {
      ctx.fillStyle = C.terracotta;
      ctx.beginPath();
      ctx.moveTo(-11, -40); ctx.lineTo(-20, -28); ctx.lineTo(-17, -22); ctx.lineTo(-6, -36);
      ctx.closePath();
    }, 1.5);
    outlined(ctx, () => {
      ctx.fillStyle = C.terracotta;
      ctx.beginPath();
      ctx.moveTo(11, -40); ctx.lineTo(22, -25);
      ctx.lineTo(19, -18); ctx.lineTo(8, -36);
      ctx.closePath();
    }, 1.5);
    // Spear
    ctx.strokeStyle = '#6B3A10'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(22, -20); ctx.lineTo(18, -75); ctx.stroke();
    ctx.fillStyle = C.mustard;
    ctx.beginPath(); ctx.moveTo(18, -75); ctx.lineTo(14, -62); ctx.lineTo(22, -62); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.outline; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(18, -75); ctx.lineTo(14, -62); ctx.lineTo(22, -62); ctx.closePath(); ctx.stroke();
    // Head
    outlined(ctx, () => {
      ctx.fillStyle = C.terracotta;
      ctx.beginPath(); ctx.ellipse(0, -52, 10, 12, 0, 0, Math.PI * 2);
    }, 2);
    // Eyes (large Phad style)
    ctx.fillStyle = C.cream;
    ctx.beginPath(); ctx.ellipse(-4, -53, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -53, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.outline;
    ctx.beginPath(); ctx.arc(-3.5, -53, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4.5, -53, 2, 0, Math.PI * 2); ctx.fill();
    // Helmet
    outlined(ctx, () => {
      ctx.fillStyle = C.terracotta;
      ctx.beginPath();
      ctx.arc(0, -58, 11, Math.PI, 0, false);
      ctx.lineTo(11, -52); ctx.lineTo(-11, -52);
      ctx.closePath();
    }, 2);
    ctx.fillStyle = C.mustard;
    ctx.beginPath(); ctx.arc(0, -69, 3, 0, Math.PI * 2); ctx.fill();
  }

  function drawArmedSoldier(ctx, anim, state) {
    // Bigger, heavier soldier
    const legSwing = state === 'chase' ? Math.sin(anim * 8) * 12 : 0;
    // Legs
    [-10, 10].forEach((lx, i) => {
      outlined(ctx, () => {
        ctx.fillStyle = '#3A2A10';
        ctx.beginPath();
        ctx.moveTo(lx, -12); ctx.lineTo(lx + (i===0?legSwing:-legSwing) * 0.5, 0);
        ctx.lineTo(lx + (i===0?legSwing:-legSwing) * 0.5 + 8, 0);
        ctx.lineTo(lx + 8, -12); ctx.closePath();
      }, 2);
    });
    // Heavy armour body
    outlined(ctx, () => {
      ctx.fillStyle = '#4A3A20';
      ctx.beginPath();
      ctx.moveTo(-14, -50); ctx.lineTo(-16, -12); ctx.lineTo(16, -12); ctx.lineTo(14, -50);
      ctx.closePath();
    }, 2.5);
    // Armour plate decoration
    ctx.fillStyle = C.mustard;
    [[-6,-42],[6,-42],[-6,-30],[6,-30],[-6,-18],[6,-18]].forEach(([x,y]) => {
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
    });
    // Shield arm
    outlined(ctx, () => {
      ctx.fillStyle = C.terracotta;
      ctx.beginPath(); ctx.ellipse(-22, -34, 12, 16, -0.2, 0, Math.PI * 2);
    }, 2);
    ctx.fillStyle = C.mustard;
    ctx.beginPath(); ctx.arc(-22, -34, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.outline; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(-22, -34, 12, 0, Math.PI * 2); ctx.stroke();
    // Sword arm
    outlined(ctx, () => {
      ctx.fillStyle = C.terracotta;
      ctx.beginPath();
      ctx.moveTo(14, -46); ctx.lineTo(28, -28); ctx.lineTo(24, -20); ctx.lineTo(10, -40);
      ctx.closePath();
    }, 1.5);
    // Sword
    ctx.strokeStyle = '#C0C0B0'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(28, -28); ctx.lineTo(36, -10); ctx.stroke();
    // Head (larger)
    outlined(ctx, () => {
      ctx.fillStyle = C.terracotta;
      ctx.beginPath(); ctx.ellipse(0, -58, 12, 14, 0, 0, Math.PI * 2);
    }, 2.5);
    ctx.fillStyle = C.cream;
    ctx.beginPath(); ctx.ellipse(-5, -58, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, -58, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.outline;
    ctx.beginPath(); ctx.arc(-4, -58, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -58, 2.5, 0, Math.PI * 2); ctx.fill();
    // Turban-helmet hybrid
    outlined(ctx, () => {
      ctx.fillStyle = C.darkGreen;
      ctx.beginPath(); ctx.ellipse(0, -65, 14, 9, 0, 0, Math.PI * 2);
    }, 2);
    ctx.strokeStyle = C.mustard; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, -63, 12, 7, -0.2, 0, Math.PI * 2); ctx.stroke();
  }

  function drawCavalryGuard(ctx, anim, state) {
    const legSwing = state === 'chase' ? Math.sin(anim * 14) * 14 : 0;
    // Horse (brown, not Kesar Kalami)
    outlined(ctx, () => {
      ctx.fillStyle = '#7A4A20';
      ctx.beginPath(); ctx.ellipse(5, -42, 36, 20, 0, 0, Math.PI * 2);
    }, 2.5);
    // Horse neck
    outlined(ctx, () => {
      ctx.fillStyle = '#7A4A20';
      ctx.beginPath();
      ctx.moveTo(28, -52); ctx.bezierCurveTo(44, -62, 48, -70, 44, -78);
      ctx.bezierCurveTo(40, -86, 34, -82, 30, -72); ctx.bezierCurveTo(26, -62, 20, -54, 18, -52);
      ctx.closePath();
    }, 2);
    // Horse head
    outlined(ctx, () => {
      ctx.fillStyle = '#7A4A20';
      ctx.beginPath(); ctx.ellipse(44, -82, 13, 10, -0.3, 0, Math.PI * 2);
    }, 2);
    ctx.fillStyle = C.cream;
    ctx.beginPath(); ctx.arc(40, -84, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.outline;
    ctx.beginPath(); ctx.arc(40, -84, 1.5, 0, Math.PI * 2); ctx.fill();
    // Legs
    [[-20,0,legSwing],[-6,0,-legSwing],[8,0,legSwing],[24,0,-legSwing]].forEach(([lx,ly,sw]) => {
      outlined(ctx, () => {
        ctx.fillStyle = '#7A4A20';
        ctx.beginPath();
        ctx.moveTo(lx, -22); ctx.lineTo(lx+sw*0.5, 0); ctx.lineTo(lx+sw*0.5+5, 0);
        ctx.bezierCurveTo(lx+5, -8, lx+5, -14, lx+5, -22); ctx.closePath();
      }, 1.5);
    });
    // Rider torso
    outlined(ctx, () => {
      ctx.fillStyle = C.vermilion;
      ctx.beginPath();
      ctx.moveTo(-8, -76); ctx.lineTo(-10, -52); ctx.lineTo(10, -52); ctx.lineTo(8, -76);
      ctx.closePath();
    }, 2);
    // Rider head
    outlined(ctx, () => {
      ctx.fillStyle = C.terracotta;
      ctx.beginPath(); ctx.ellipse(0, -84, 10, 11, 0, 0, Math.PI * 2);
    }, 2);
    ctx.fillStyle = C.cream;
    ctx.beginPath(); ctx.ellipse(-4,-84, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4,-84, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.outline;
    ctx.beginPath(); ctx.arc(-3.5,-84, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4.5,-84, 2, 0, Math.PI * 2); ctx.fill();
    // Rider helmet
    outlined(ctx, () => {
      ctx.fillStyle = C.ochre;
      ctx.beginPath(); ctx.arc(0, -88, 11, Math.PI, 0, false);
      ctx.lineTo(11,-82); ctx.lineTo(-11,-82); ctx.closePath();
    }, 2);
    // Lance
    ctx.strokeStyle = '#6B3A10'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(16, -64); ctx.lineTo(50, -95); ctx.stroke();
    ctx.fillStyle = C.mustard;
    ctx.beginPath(); ctx.moveTo(50,-95); ctx.lineTo(44,-84); ctx.lineTo(52,-84); ctx.closePath();
    ctx.fill();
  }

  // ── Cattle ────────────────────────────────────────────────

  function drawCattle(ctx, cow, camX, frameTime) {
    if (cow.rescued && cow.exitTimer <= 0) return;
    const sx = cow.x - camX;
    const sy = cow.y;
    const tailSwing = Math.sin(frameTime * 3 + cow.id) * 8;

    ctx.save();
    ctx.translate(sx + cow.w / 2, sy + cow.h);

    if (cow.rescued) ctx.globalAlpha = Math.max(0, cow.exitTimer / 1.5);
    if (cow.highlighted) {
      // Glow effect
      ctx.shadowColor = C.mustard;
      ctx.shadowBlur  = 16;
    }

    // Scale to cow size
    const scale = cow.w / 54;
    ctx.scale(scale, scale);

    drawSingleCow(ctx, tailSwing, cow.color);

    ctx.restore();
  }

  function drawSingleCow(ctx, tailSwing = 0, colorVariant = 'white') {
    const bodyColor = colorVariant === 'dark' ? '#8B6040' : C.cattleWhite;
    const spotColor = colorVariant === 'dark' ? '#6B4020' : '#D0B890';

    // ── Body ──
    outlined(ctx, () => {
      ctx.fillStyle = bodyColor;
      ctx.beginPath(); ctx.ellipse(-2, -30, 28, 18, 0, 0, Math.PI * 2);
    }, 2.5);

    // Spots (Phad decorative markings)
    ctx.fillStyle = spotColor;
    [[10,-30,8,5],[[-14,-28,6,4]]].flat();
    [[8, -28, 8, 5], [-12, -32, 7, 4]].forEach(([x, y, rx, ry]) => {
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0.3, 0, Math.PI * 2); ctx.fill();
    });

    // ── Hump (zebu style) ──
    outlined(ctx, () => {
      ctx.fillStyle = bodyColor;
      ctx.beginPath(); ctx.ellipse(-14, -42, 10, 12, -0.3, 0, Math.PI * 2);
    }, 2);

    // ── Neck / head ──
    outlined(ctx, () => {
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.moveTo(16, -36); ctx.bezierCurveTo(28, -40, 34, -38, 34, -32);
      ctx.bezierCurveTo(34, -24, 28, -22, 20, -24);
      ctx.bezierCurveTo(16, -26, 14, -28, 16, -36);
      ctx.closePath();
    }, 2);

    // Muzzle
    outlined(ctx, () => {
      ctx.fillStyle = '#E8C0A0';
      ctx.beginPath(); ctx.ellipse(33, -26, 6, 5, 0.3, 0, Math.PI * 2);
    }, 1.5);
    // Nostril
    ctx.fillStyle = '#8B5A40';
    ctx.beginPath(); ctx.arc(30, -25, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(35, -24, 1.5, 0, Math.PI * 2); ctx.fill();

    // ── Eye (large Phad) ──
    ctx.fillStyle = C.cream;
    ctx.beginPath(); ctx.ellipse(26, -32, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.outline;
    ctx.beginPath(); ctx.arc(26, -32, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.cream;
    ctx.beginPath(); ctx.arc(25, -33, 1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.outline; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(26, -32, 5, 4, 0, 0, Math.PI * 2); ctx.stroke();

    // ── Horns ──
    ctx.strokeStyle = '#8B6040'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(22, -36); ctx.bezierCurveTo(18, -44, 22, -50, 28, -48); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(26, -36); ctx.bezierCurveTo(30, -44, 36, -48, 38, -44); ctx.stroke();

    // ── Legs ──
    [[-20,0],[-10,0],[6,0],[16,0]].forEach(([lx,ly]) => {
      outlined(ctx, () => {
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(lx, -14); ctx.lineTo(lx, 0); ctx.lineTo(lx+6, 0); ctx.lineTo(lx+6, -14);
        ctx.closePath();
      }, 2);
      // Hoof
      ctx.fillStyle = '#6B4A20';
      ctx.fillRect(lx - 1, -4, 8, 5);
    });

    // ── Tail ──
    ctx.strokeStyle = bodyColor; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-28, -32);
    ctx.bezierCurveTo(-38, -28 + tailSwing, -42, -18 + tailSwing, -36, -8 + tailSwing);
    ctx.stroke();
    // Tail tuft
    ctx.fillStyle = '#8B6040';
    ctx.beginPath(); ctx.arc(-36, -8 + tailSwing, 5, 0, Math.PI * 2); ctx.fill();

    // Phad-style decorative bell around neck
    ctx.fillStyle = C.ochre;
    ctx.strokeStyle = C.outline; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(22, -28, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.outline;
    ctx.beginPath(); ctx.arc(22, -30, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  // ── Mirza Khan (Boss) ─────────────────────────────────────

  function drawBoss(ctx, boss, camX) {
    if (!boss.active) return;
    const sx = boss.x - camX;
    const sy = boss.y;
    const dir  = boss.facing;
    const anim = boss.animTimer;
    const state = boss.state;

    ctx.save();
    ctx.translate(sx + boss.w / 2, sy + boss.h);
    if (dir === -1) ctx.scale(-1, 1);

    if (boss.hurtTimer > 0) {
      ctx.globalAlpha = (Math.sin(boss.hurtTimer * 20) > 0) ? 0.4 : 1;
    }

    drawMirzaKhan(ctx, state, anim);
    ctx.restore();
  }

  function drawMirzaKhan(ctx, state, anim) {
    const legSwing = state === 'chase' ? Math.sin(anim * 8) * 14 : 0;
    const attackPulse = state === 'attack' ? Math.sin(anim * 20) * 4 : 0;

    // ── Scale up (boss is bigger) ──
    ctx.scale(1.3, 1.3);

    // ── Legs ──
    [-12, 12].forEach((lx, i) => {
      outlined(ctx, () => {
        ctx.fillStyle = '#3A1A50'; // deep purple trousers
        ctx.beginPath();
        ctx.moveTo(lx, -12);
        ctx.lineTo(lx + (i===0?legSwing:-legSwing) * 0.6, 2);
        ctx.lineTo(lx + (i===0?legSwing:-legSwing) * 0.6 + 10, 2);
        ctx.lineTo(lx + 10, -12);
        ctx.closePath();
      }, 2);
    });

    // Ornate boots
    [-12, 10].forEach(lx => {
      ctx.fillStyle = C.outline;
      ctx.fillRect(lx - 2, -4, 14, 7);
      ctx.fillStyle = C.mustard;
      ctx.fillRect(lx, -3, 10, 2);
    });

    // ── Heavy armour body ──
    outlined(ctx, () => {
      ctx.fillStyle = '#2D2B6E'; // deep indigo armour
      ctx.beginPath();
      ctx.moveTo(-16, -54 + attackPulse);
      ctx.lineTo(-18, -12);
      ctx.lineTo(18, -12);
      ctx.lineTo(16, -54 + attackPulse);
      ctx.closePath();
    }, 3);

    // Armour embellishments (Phad decorative)
    [C.mustard, C.vermilion, C.mustard].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(-12, -46 + i * 12);
      ctx.lineTo(0, -50 + i * 12);
      ctx.lineTo(12, -46 + i * 12);
      ctx.lineTo(10, -40 + i * 12);
      ctx.lineTo(0, -44 + i * 12);
      ctx.lineTo(-10, -40 + i * 12);
      ctx.closePath();
      ctx.fill();
    });

    // ── Shoulder plates ──
    [-20, 14].forEach((sx, i) => {
      outlined(ctx, () => {
        ctx.fillStyle = C.terracotta;
        ctx.beginPath(); ctx.ellipse(sx, -50, 10, 7, i === 0 ? -0.3 : 0.3, 0, Math.PI * 2);
      }, 2);
    });

    // ── Heavy sword arm ──
    outlined(ctx, () => {
      ctx.fillStyle = C.terracotta;
      ctx.beginPath();
      ctx.moveTo(16, -50 + attackPulse);
      ctx.lineTo(32 + attackPulse * 2, -30);
      ctx.lineTo(28 + attackPulse, -18);
      ctx.lineTo(12, -44);
      ctx.closePath();
    }, 2);

    // Boss sword (larger)
    ctx.save();
    ctx.translate(32 + attackPulse, -24);
    ctx.rotate(state === 'attack' ? -0.8 : 0.2);
    ctx.fillStyle = '#D0C0A0'; ctx.strokeStyle = C.outline; ctx.lineWidth = 2;
    ctx.fillRect(-4, -40, 8, 42); ctx.strokeRect(-4, -40, 8, 42);
    ctx.fillStyle = C.mustard;
    ctx.fillRect(-10, -4, 20, 7); ctx.strokeRect(-10, -4, 20, 7);
    ctx.fillStyle = C.vermilion;
    ctx.beginPath(); ctx.arc(0, -42, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();

    // ── Shield arm ──
    outlined(ctx, () => {
      ctx.fillStyle = C.terracotta;
      ctx.beginPath();
      ctx.moveTo(-16, -50);
      ctx.lineTo(-30, -36);
      ctx.lineTo(-26, -20);
      ctx.lineTo(-12, -42);
      ctx.closePath();
    }, 2);
    // Shield
    outlined(ctx, () => {
      ctx.fillStyle = C.terracotta;
      ctx.beginPath(); ctx.ellipse(-34, -32, 14, 18, -0.2, 0, Math.PI * 2);
    }, 2.5);
    // Shield pattern
    ctx.fillStyle = C.mustard;
    ctx.beginPath(); ctx.arc(-34, -32, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.vermilion;
    ctx.beginPath(); ctx.arc(-34, -32, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.outline; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(-34, -32, 14, 0, Math.PI * 2); ctx.stroke();

    // ── Head (distinctive Mirza Khan) ──
    outlined(ctx, () => {
      ctx.fillStyle = '#8B6040'; // different skin tone
      ctx.beginPath(); ctx.ellipse(0, -64, 14, 16, 0, 0, Math.PI * 2);
    }, 2.5);

    // Beard (distinctive)
    ctx.fillStyle = '#3A2A10';
    ctx.beginPath();
    ctx.moveTo(-10, -56);
    ctx.bezierCurveTo(-14, -44, -10, -36, 0, -34);
    ctx.bezierCurveTo(10, -36, 14, -44, 10, -56);
    ctx.closePath();
    ctx.fill();

    // Large Phad-style eyes
    ctx.fillStyle = C.cream;
    ctx.beginPath(); ctx.ellipse(-6, -66, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6, -66, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.outline;
    ctx.beginPath(); ctx.arc(-5, -66, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, -66, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.outline; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(-6, -66, 6, 5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(6, -66, 6, 5, 0, 0, Math.PI * 2); ctx.stroke();

    // Eyebrow fury marks
    ctx.strokeStyle = C.outline; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-12, -72); ctx.lineTo(-2, -70); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, -72); ctx.lineTo(2, -70); ctx.stroke();

    // ── Turban (Mirza's distinctive) ──
    outlined(ctx, () => {
      ctx.fillStyle = C.darkGreen;
      ctx.beginPath(); ctx.ellipse(0, -76, 16, 10, 0, 0, Math.PI * 2);
    }, 2.5);
    ctx.strokeStyle = C.mustard; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(0, -74, 14, 8, -0.2, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -78, 12, 7, 0.2, 0, Math.PI * 2); ctx.stroke();
    // Large jewel
    ctx.fillStyle = C.vermilion;
    ctx.beginPath(); ctx.arc(8, -82, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.mustard;
    ctx.beginPath(); ctx.arc(8, -82, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.outline; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(8, -82, 6, 0, Math.PI * 2); ctx.stroke();

    // Tall feather
    ctx.strokeStyle = C.darkGreen; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -86); ctx.bezierCurveTo(-4, -110, 4, -120, 0, -130); ctx.stroke();
    ctx.strokeStyle = C.mustard; ctx.lineWidth = 1.5;
    [-2, 0, 2].forEach(dx => {
      ctx.beginPath(); ctx.moveTo(dx, -100); ctx.lineTo(dx - 8, -90); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(dx, -108); ctx.lineTo(dx + 8, -96); ctx.stroke();
    });
  }

  // ── Section title card ───────────────────────────────────

  function drawSectionTitle(ctx, canvasW, canvasH, title, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;

    // Dark overlay
    ctx.fillStyle = 'rgba(26, 10, 0, 0.75)';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Parchment box
    const bw = 460, bh = 100;
    const bx = (canvasW - bw) / 2;
    const by = (canvasH - bh) / 2;

    ctx.fillStyle = C.agedPaper;
    roundRect(ctx, bx, by, bw, bh, 6);
    ctx.fill();
    ctx.strokeStyle = C.outline;
    ctx.lineWidth = 3;
    roundRect(ctx, bx, by, bw, bh, 6);
    ctx.stroke();

    // Border decoration
    ctx.strokeStyle = C.terracotta;
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx + 6, by + 6, bw - 12, bh - 12, 4);
    ctx.stroke();

    // Corner diamonds
    [[bx+14, by+14],[bx+bw-14, by+14],[bx+14, by+bh-14],[bx+bw-14, by+bh-14]].forEach(([dx,dy]) => {
      ctx.fillStyle = C.terracotta;
      ctx.beginPath(); ctx.moveTo(dx, dy-6); ctx.lineTo(dx+6, dy); ctx.lineTo(dx, dy+6); ctx.lineTo(dx-6, dy); ctx.closePath();
      ctx.fill();
    });

    // Text
    ctx.fillStyle = C.terracotta;
    ctx.font = `bold 13px 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '4px';
    const lines = title.split('\n');
    lines.forEach((line, i) => {
      const lh = lines.length > 1 ? 28 : 0;
      ctx.fillText(line, canvasW / 2, canvasH / 2 - lh / 2 + i * 28);
    });

    ctx.restore();
  }

  // ── Ending illustration ──────────────────────────────────

  function drawEndingIllustration(ctx, canvasW, canvasH, t) {
    // Sky
    const grad = ctx.createLinearGradient(0, 0, 0, canvasH * 0.6);
    grad.addColorStop(0, '#8B3010');
    grad.addColorStop(1, '#E8A060');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Ground
    ctx.fillStyle = C.sand;
    ctx.fillRect(0, canvasH * 0.68, canvasW, canvasH);

    // Patan city in background
    drawEndingCity(ctx, canvasW, canvasH);

    // Border bands
    drawPhadBorderBand(ctx, canvasW, 0, 22);
    drawPhadBorderBand(ctx, canvasW, canvasH - 22, 22);

    // Cattle group (left side)
    const groundY = canvasH * 0.68;
    [0.15, 0.22, 0.10].forEach((xRatio, i) => {
      ctx.save();
      ctx.translate(canvasW * xRatio, groundY);
      const sc = 0.8 + i * 0.1;
      ctx.scale(sc, sc);
      drawSingleCow(ctx, Math.sin(t + i) * 6, i % 2 === 0 ? 'white' : 'dark');
      ctx.restore();
    });

    // Pabuji + Kesar Kalami (center-right, triumphant pose)
    ctx.save();
    ctx.translate(canvasW * 0.55, groundY);
    ctx.scale(1.2, 1.2);
    drawKesarKalami(ctx, 'idle', t, 1);
    drawPabujiRider(ctx, 'idle', t);
    ctx.restore();

    // Sun / decorative orb
    ctx.fillStyle = C.mustard;
    ctx.shadowColor = C.mustard;
    ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(canvasW * 0.82, canvasH * 0.22, 38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.ochre;
    ctx.beginPath(); ctx.arc(canvasW * 0.82, canvasH * 0.22, 28, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = C.outline; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(canvasW * 0.82, canvasH * 0.22, 38, 0, Math.PI * 2); ctx.stroke();

    // Paper texture
    drawPaperTexture(ctx, canvasW, canvasH);
  }

  function drawEndingCity(ctx, w, h) {
    const groundY = h * 0.68;
    ctx.fillStyle = '#8B3010';

    // Fort wall
    ctx.fillRect(w * 0.55, groundY - 60, w * 0.45, 60);

    // Towers
    [[0.56, 90], [0.68, 110], [0.80, 80], [0.94, 100]].forEach(([xr, ht]) => {
      const tx = w * xr;
      ctx.fillRect(tx, groundY - ht, 30, ht);
      // Dome
      ctx.beginPath(); ctx.arc(tx + 15, groundY - ht, 18, Math.PI, 0, false); ctx.fill();
      // Merlon
      for (let m = 0; m < 3; m++) {
        ctx.fillRect(tx + m * 10, groundY - ht - 14, 8, 14);
      }
      // Window
      ctx.fillStyle = '#3A1A00';
      ctx.beginPath(); ctx.arc(tx + 15, groundY - ht * 0.5, 6, Math.PI, 0, false);
      ctx.fillRect(tx + 9, groundY - ht * 0.5, 12, 10);
      ctx.fill();
      ctx.fillStyle = '#8B3010';
    });

    // Flag
    ctx.strokeStyle = '#6B3A10'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w * 0.68 + 14, h * 0.68 - 110);
    ctx.lineTo(w * 0.68 + 14, h * 0.68 - 145); ctx.stroke();
    ctx.fillStyle = C.vermilion;
    ctx.beginPath(); ctx.moveTo(w * 0.68 + 14, h * 0.68 - 145);
    ctx.lineTo(w * 0.68 + 38, h * 0.68 - 138);
    ctx.lineTo(w * 0.68 + 14, h * 0.68 - 131); ctx.closePath(); ctx.fill();
  }

  // Public API
  return {
    drawBackground,
    drawPhadBorderBand,
    drawPlatform,
    drawPlayer,
    drawEnemy,
    drawCattle,
    drawSingleCow,
    drawBoss,
    drawSectionTitle,
    drawEndingIllustration,
    roundRect,
    C,
  };
})();
