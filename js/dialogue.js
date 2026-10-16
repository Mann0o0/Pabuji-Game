/**
 * dialogue.js — DialogueManager
 *
 * Pokémon-RPG-style dialogue box with Phad aesthetic.
 * Controls gameplay pause while active.
 *
 * Usage:
 *   DialogueManager.show([{speaker, text}, ...], callback)
 */

const DialogueManager = (function() {

  // ── State ─────────────────────────────────────────────────
  let queue       = [];
  let current     = null;
  let charIndex   = 0;
  let displayText = '';
  let active      = false;
  let blinkTimer  = 0;
  let onFinish    = null;
  let typeTimer   = 0;
  const TYPE_SPEED = 0.035; // seconds per character

  // ── Public API ────────────────────────────────────────────

  function show(lines, callback) {
    queue    = [...lines];
    onFinish = callback || null;
    active   = true;
    _next();
  }

  function _next() {
    if (queue.length === 0) {
      _close();
      return;
    }
    current     = queue.shift();
    charIndex   = 0;
    displayText = '';
    typeTimer   = 0;
  }

  function _close() {
    active   = false;
    current  = null;
    queue    = [];
    if (onFinish) { onFinish(); onFinish = null; }
  }

  function isActive() { return active; }

  function update(dt) {
    if (!active || !current) return;

    blinkTimer += dt;

    // Typewriter
    if (charIndex < current.text.length) {
      typeTimer += dt;
      while (typeTimer >= TYPE_SPEED && charIndex < current.text.length) {
        typeTimer -= TYPE_SPEED;
        displayText += current.text[charIndex++];
      }
    }
  }

  function advance() {
    if (!active) return;
    if (charIndex < current.text.length) {
      // Skip typewriter
      displayText = current.text;
      charIndex   = current.text.length;
    } else {
      _next();
    }
  }

  // ── Drawing ───────────────────────────────────────────────
  // Called from game render loop with the canvas context

  function draw(ctx, canvasW, canvasH) {
    if (!active || !current) return;

    const bw = Math.min(canvasW - 40, 680);
    const bh = 130;
    const bx = (canvasW - bw) / 2;
    const by = canvasH - bh - 18;

    ctx.save();

    // ── Shadow ──
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur  = 12;

    // ── Aged paper background ──
    ctx.fillStyle = '#EDD9A3';
    Renderer.roundRect(ctx, bx, by, bw, bh, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    // ── Dark border ──
    ctx.strokeStyle = '#1A0A00';
    ctx.lineWidth   = 3;
    Renderer.roundRect(ctx, bx, by, bw, bh, 8);
    ctx.stroke();

    // ── Inner decorative border ──
    ctx.strokeStyle = '#C1440E';
    ctx.lineWidth   = 1.5;
    Renderer.roundRect(ctx, bx + 6, by + 6, bw - 12, bh - 12, 5);
    ctx.stroke();

    // ── Folk-pattern top strip ──
    ctx.fillStyle = '#C1440E';
    Renderer.roundRect(ctx, bx, by, bw, 22, 8);
    ctx.fill();
    ctx.fillStyle = '#1A0A00';
    ctx.beginPath();
    ctx.rect(bx, by + 14, bw, 8);
    ctx.fill();
    // Diamond pattern on strip
    ctx.fillStyle = '#E2B33A';
    for (let x = bx + 20; x < bx + bw - 10; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x,     by + 7);
      ctx.lineTo(x + 5, by + 13);
      ctx.lineTo(x,     by + 19);
      ctx.lineTo(x - 5, by + 13);
      ctx.closePath();
      ctx.fill();
    }

    // ── Speaker name ──
    ctx.fillStyle = '#F5E6C8';
    ctx.font = `bold 12px 'Cinzel', serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '2px';
    const nameLabel = (current.speaker || '').toUpperCase();
    ctx.fillText(nameLabel, bx + 20, by + 11);

    // ── Dialogue text (typewriter) ──
    ctx.fillStyle = '#1A0A00';
    ctx.font = `13px 'Cinzel', serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.letterSpacing = '0px';

    // Word-wrap
    const textX   = bx + 18;
    const textY   = by + 32;
    const maxW    = bw - 36;
    const lineH   = 22;
    const wrapped = _wrapText(ctx, displayText, maxW);
    wrapped.forEach((line, i) => {
      ctx.fillText(line, textX, textY + i * lineH);
    });

    // ── Advance arrow (blinking) ──
    const done = charIndex >= current.text.length;
    if (done) {
      const arrowAlpha = (Math.sin(blinkTimer * 6) + 1) / 2;
      ctx.globalAlpha = arrowAlpha;
      ctx.fillStyle   = '#C1440E';
      ctx.font        = 'bold 16px serif';
      ctx.textAlign   = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('▼', bx + bw - 14, by + bh - 10);
    }

    // ── "Press SPACE" hint ──
    ctx.globalAlpha = 0.45;
    ctx.fillStyle   = '#1A0A00';
    ctx.font        = '9px Cinzel, serif';
    ctx.textAlign   = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(done ? 'SPACE / ENTER to continue' : 'SPACE / ENTER to skip', bx + 14, by + bh - 10);

    ctx.restore();
  }

  function _wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines  = [];
    let current  = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  return { show, update, advance, draw, isActive };
})();
