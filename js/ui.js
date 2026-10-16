/**
 * ui.js — HUD rendering (drawn on canvas, Phad-styled)
 *
 * Elements:
 *  - Top-left:   Pabuji name + health bar
 *  - Top-center: CATTLE PROTECTED counter
 *  - Bottom-right: Kesar Kalami charge cooldown
 *  - Boss HP bar (full-width, during boss fight)
 *  - Screen flash on damage / section transition
 */

const UI = (function() {

  const C = Renderer.C;
  let flashTimer    = 0;
  let flashColor    = 'rgba(255,255,255,0)';
  let screenMsg     = null;
  let screenMsgTimer = 0;

  function flash(color, duration = 0.15) {
    flashTimer = duration;
    flashColor = color;
  }

  function showMessage(text, duration = 2.5) {
    screenMsg      = text;
    screenMsgTimer = duration;
  }

  function update(dt) {
    flashTimer     = Math.max(0, flashTimer - dt);
    screenMsgTimer = Math.max(0, screenMsgTimer - dt);
    if (screenMsgTimer <= 0) screenMsg = null;
  }

  function draw(ctx, canvasW, canvasH, player, cattleCount, cattleMax, boss, chargeCD, maxChargeCD) {
    _drawHealthBar(ctx, player);
    _drawCattleCounter(ctx, canvasW, cattleCount, cattleMax);
    _drawChargeBar(ctx, canvasW, canvasH, chargeCD, maxChargeCD);
    if (boss && boss.active && !boss.defeated) {
      _drawBossBar(ctx, canvasW, boss);
    }
    if (flashTimer > 0) {
      const alpha = (flashTimer / 0.15) * 0.35;
      ctx.save();
      ctx.fillStyle = flashColor.replace(/[\d.]+\)$/, `${alpha})`);
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.restore();
    }
    if (screenMsg) {
      _drawScreenMessage(ctx, canvasW, canvasH, screenMsg, screenMsgTimer);
    }
  }

  function _drawHealthBar(ctx, player) {
    const x = 16, y = 24;
    const bw = 180, bh = 18;

    ctx.save();

    // Name plate
    ctx.fillStyle = C.outline;
    Renderer.roundRect(ctx, x - 4, y - 18, 100, 18, 3);
    ctx.fill();
    ctx.fillStyle = C.agedPaper;
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('PABUJI', x + 2, y - 9);

    // Bar background
    ctx.fillStyle = '#3A1A00';
    Renderer.roundRect(ctx, x, y, bw, bh, 4);
    ctx.fill();

    // Bar fill (terracotta → green based on HP)
    const ratio = player.hp / player.maxHp;
    const barColor = ratio > 0.5 ? C.darkGreen : ratio > 0.25 ? C.ochre : C.vermilion;
    ctx.fillStyle = barColor;
    Renderer.roundRect(ctx, x + 2, y + 2, (bw - 4) * ratio, bh - 4, 3);
    ctx.fill();

    // Bar outline + folk pattern border
    ctx.strokeStyle = C.outline;
    ctx.lineWidth = 2;
    Renderer.roundRect(ctx, x, y, bw, bh, 4);
    ctx.stroke();

    // Pattern tick marks
    ctx.strokeStyle = 'rgba(26,10,0,0.25)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const tx = x + (bw / 4) * i;
      ctx.beginPath(); ctx.moveTo(tx, y); ctx.lineTo(tx, y + bh); ctx.stroke();
    }

    // HP text
    ctx.fillStyle = C.cream;
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${player.hp} / ${player.maxHp}`, x + bw / 2, y + bh / 2 + 1);

    // Decorative corner ornaments
    _drawCornerOrnament(ctx, x - 2, y - 2);
    _drawCornerOrnament(ctx, x + bw + 2, y - 2);

    ctx.restore();
  }

  function _drawCornerOrnament(ctx, x, y) {
    ctx.fillStyle = C.mustard;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.outline;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function _drawCattleCounter(ctx, canvasW, count, max) {
    const cx = canvasW / 2;
    const y  = 20;

    ctx.save();
    ctx.fillStyle = C.outline;
    Renderer.roundRect(ctx, cx - 110, y, 220, 36, 5);
    ctx.fill();

    // Inner
    ctx.fillStyle = C.agedPaper;
    Renderer.roundRect(ctx, cx - 108, y + 2, 216, 32, 4);
    ctx.fill();

    // Decorative edge
    ctx.strokeStyle = C.terracotta;
    ctx.lineWidth = 1.5;
    Renderer.roundRect(ctx, cx - 108, y + 2, 216, 32, 4);
    ctx.stroke();

    // Cow icon (mini)
    _drawMiniCow(ctx, cx - 88, y + 18);

    // Text
    ctx.fillStyle = C.outline;
    ctx.font = 'bold 13px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`CATTLE PROTECTED: ${count} / ${max}`, cx + 10, y + 18);

    ctx.restore();
  }

  function _drawMiniCow(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.28, 0.28);
    Renderer.drawSingleCow(ctx, 0, 'white');
    ctx.restore();
  }

  function _drawChargeBar(ctx, canvasW, canvasH, chargeCD, maxCD) {
    const bw = 140, bh = 16;
    const x  = canvasW - bw - 16;
    const y  = canvasH - 50;

    ctx.save();

    // Label
    ctx.fillStyle = C.outline;
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = C.agedPaper;
    ctx.fillText('KESAR CHARGE [K]', x + bw, y - 2);

    // Background
    ctx.fillStyle = '#3A1A00';
    Renderer.roundRect(ctx, x, y, bw, bh, 4);
    ctx.fill();

    // Fill (full = ready)
    const ratio = chargeCD <= 0 ? 1 : 1 - (chargeCD / maxCD);
    ctx.fillStyle = ratio >= 1 ? C.mustard : C.ochre;
    if (ratio > 0) {
      Renderer.roundRect(ctx, x + 2, y + 2, (bw - 4) * ratio, bh - 4, 3);
      ctx.fill();
    }

    // READY label
    if (ratio >= 1) {
      ctx.fillStyle = C.outline;
      ctx.font = 'bold 9px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('READY', x + bw / 2, y + bh / 2 + 1);
    }

    ctx.strokeStyle = C.outline;
    ctx.lineWidth = 2;
    Renderer.roundRect(ctx, x, y, bw, bh, 4);
    ctx.stroke();

    ctx.restore();
  }

  function _drawBossBar(ctx, canvasW, boss) {
    const bw = Math.min(canvasW - 80, 500);
    const bh = 22;
    const x  = (canvasW - bw) / 2;
    const y  = 24;

    ctx.save();

    // Name
    ctx.fillStyle = C.outline;
    Renderer.roundRect(ctx, x - 4, y - 18, bw + 8, 18, 3);
    ctx.fill();
    ctx.fillStyle = C.vermilion;
    ctx.font = 'bold 11px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦  MIRZA KHAN  ✦', x + bw / 2, y - 9);

    // Background
    ctx.fillStyle = '#3A1A00';
    Renderer.roundRect(ctx, x, y, bw, bh, 5);
    ctx.fill();

    // Fill
    const ratio = boss.hp / boss.maxHp;
    const fillW = (bw - 4) * ratio;
    if (fillW > 0) {
      const grad = ctx.createLinearGradient(x + 2, y, x + 2 + fillW, y);
      grad.addColorStop(0,   C.vermilion);
      grad.addColorStop(0.5, '#E05010');
      grad.addColorStop(1,   C.terracotta);
      ctx.fillStyle = grad;
      Renderer.roundRect(ctx, x + 2, y + 2, fillW, bh - 4, 4);
      ctx.fill();
    }

    // Enrage pulse
    if (boss.enraged) {
      const pulse = (Math.sin(Date.now() / 150) + 1) / 2;
      ctx.strokeStyle = `rgba(224, 60, 10, ${pulse * 0.8})`;
      ctx.lineWidth = 3;
      Renderer.roundRect(ctx, x, y, bw, bh, 5);
      ctx.stroke();
    }

    ctx.strokeStyle = C.outline;
    ctx.lineWidth = 2;
    Renderer.roundRect(ctx, x, y, bw, bh, 5);
    ctx.stroke();

    // HP text
    ctx.fillStyle = C.cream;
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${boss.hp} / ${boss.maxHp}`, x + bw / 2, y + bh / 2 + 1);

    ctx.restore();
  }

  function _drawScreenMessage(ctx, canvasW, canvasH, msg, timeLeft) {
    const alpha = Math.min(1, timeLeft / 0.4) * Math.min(1, (screenMsgTimer > 0 ? (screenMsgTimer / 0.5) : 0) + 0.6);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle   = C.outline;
    ctx.font        = 'bold 15px Cinzel, serif';
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';

    // Shadow plate
    const tw = ctx.measureText(msg).width + 40;
    ctx.fillStyle = 'rgba(26,10,0,0.7)';
    Renderer.roundRect(ctx, (canvasW - tw) / 2, canvasH * 0.38 - 16, tw, 32, 5);
    ctx.fill();

    ctx.fillStyle = C.mustard;
    ctx.fillText(msg, canvasW / 2, canvasH * 0.38);
    ctx.restore();
  }

  return { draw, update, flash, showMessage };
})();
