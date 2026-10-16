/**
 * game.js — Game orchestrator
 *
 * Manages:
 *  - Camera (smooth lerp)
 *  - Player, enemies, cattle, boss
 *  - Collision detection
 *  - Trigger zones & dialogue
 *  - Section transitions
 *  - Win / death / restart
 */

class Game {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.camX   = 0;
    this.targetCamX = 0;
    this.section = 'road';
    this.prevSection = 'road';

    // Section transition
    this.transitionAlpha = 0;
    this.transitionState = 'none'; // none | fade_in | title | fade_out
    this.transitionTimer = 0;
    this.transitionTitle = '';

    this.frameTime = 0;

    this._buildWorld();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvasW = this.canvas.width;
    this.canvasH = this.canvas.height;
    this.groundY = Math.floor(this.canvasH * 0.72);

    if (this.player) {
      // re-anchor player to new ground
      this.player.groundY = this.groundY;
      if (this.player.y > this.groundY - this.player.h) {
        this.player.y = this.groundY - this.player.h;
      }
    }
  }

  _buildWorld() {
    this.groundY = Math.floor(this.canvasH * 0.72);
    Scenes.init(this.groundY, this.canvasW, this.canvasH);

    // Player
    this.player = new Player(120, this.groundY);

    // Enemies
    const spawns = Scenes.buildEnemySpawns();
    this.enemies = spawns.map(s => new Enemy(s.x, this.groundY, s.type));

    // Cattle
    const cattleSpawns = Scenes.buildCattleSpawns();
    this.cattleGroups  = cattleSpawns.map((s, i) =>
      new CattleGroup(s.x, this.groundY - 44, i, s.count)
    );

    // Boss
    this.boss = new MirzaKhan(5600, this.groundY);

    // Triggers
    this.triggers = Scenes.buildTriggers();

    // State
    this.cattleRescued = 0;
    this.cattleMax     = this.cattleGroups.length;
    this.gameOver      = false;
    this.victory       = false;
    this.paused        = false;

    // Camera lock during dialogue
    this.camLocked = false;
    this.camX      = 0;
    this.targetCamX = 0;
  }

  start() {
    this._buildWorld();
  }

  // ── Main update ───────────────────────────────────────────
  update(dt) {
    this.frameTime += dt;

    if (this.gameOver || this.victory) {
      this._handleEndState(dt);
      return;
    }

    // Dialogue advance
    if (DialogueManager.isActive()) {
      if (Input.isAdvance()) DialogueManager.advance();
      DialogueManager.update(dt);
      UI.update(dt);
      return; // pause gameplay
    }

    DialogueManager.update(dt);
    UI.update(dt);
    ParticleSystem.update(dt);

    // Section transition animation
    if (this.transitionState !== 'none') {
      this._updateTransition(dt);
      return; // pause during title card
    }

    // Player
    this.player.update(dt);

    // Camera
    if (!this.camLocked) {
      const targetX = this.player.x - this.canvasW * 0.35;
      this.targetCamX = Math.max(0, targetX);
      this.camX += (this.targetCamX - this.camX) * Math.min(1, dt * 6);
    }

    // Section check
    this._checkSection();

    // Triggers
    this._checkTriggers();

    // Enemies
    this._updateEnemies(dt);

    // Cattle
    this._updateCattle(dt);

    // Boss
    this._updateBoss(dt);

    // Collision: player vs enemies
    this._checkPlayerEnemyCollision();

    // Collision: player attack vs enemies
    this._checkAttackCollisions();

    // Death check
    if (this.player.dead) {
      this.player.deathTimer += dt;
      // After enough time, allow SPACE to respawn
      if (this.player.deathTimer > 1.2 && Input.wasPressed('Space')) {
        this._triggerRespawn();
      }
      Input.update();
      return;
    }

    // Cattle interaction
    if (Input.isInteract()) {
      this._interactWithCattle();
    }

    Input.update();
  }

  _handleEndState(dt) {
    if (Input.isAdvance()) {
      if (this.gameOver) this._triggerRespawn();
    }
    DialogueManager.update(dt);
    UI.update(dt);
    Input.update();
  }

  _checkSection() {
    const playerX = this.player.x;
    for (const threshold of Scenes.SECTION_THRESHOLDS) {
      if (playerX >= threshold.x && this.section !== threshold.section && this._isBeyond(threshold.section)) {
        this._enterSection(threshold.section);
        break;
      }
    }
  }

  _isBeyond(targetSection) {
    const order = ['road', 'cattle', 'patan', 'boss'];
    return order.indexOf(targetSection) > order.indexOf(this.section);
  }

  _enterSection(newSection) {
    this.prevSection = this.section;
    this.section     = newSection;
    const title      = Scenes.SECTION_TITLES[newSection] || '';
    this._startTransition(title);
  }

  _startTransition(title) {
    this.transitionState = 'fade_in';
    this.transitionTimer = 0;
    this.transitionTitle = title;
    this.transitionAlpha = 0;
  }

  _updateTransition(dt) {
    this.transitionTimer += dt;

    switch (this.transitionState) {
      case 'fade_in':
        this.transitionAlpha = Math.min(1, this.transitionTimer / 0.4);
        if (this.transitionTimer > 0.4) {
          this.transitionState = 'title';
          this.transitionTimer = 0;
        }
        break;
      case 'title':
        this.transitionAlpha = 1;
        if (this.transitionTimer > 1.8) {
          this.transitionState = 'fade_out';
          this.transitionTimer = 0;
        }
        break;
      case 'fade_out':
        this.transitionAlpha = Math.max(0, 1 - this.transitionTimer / 0.4);
        if (this.transitionTimer > 0.4) {
          this.transitionState = 'none';
          this.transitionTimer = 0;
        }
        break;
    }
  }

  _checkTriggers() {
    for (const trigger of this.triggers) {
      if (!trigger.fired && this.player.x >= trigger.x) {
        trigger.fired = true;
        const lines = Scenes.DIALOGUES[trigger.id];
        if (lines) {
          const self = this;
          DialogueManager.show(lines, () => {
            if (trigger.id === 'bossMeet') {
              self.boss.activate();
              self.camLocked = false; // unlock camera after boss intro
            }
          });
        }
        if (trigger.id === 'bossMeet') {
          this.camLocked = true; // lock camera during boss intro dialogue
        }
      }
    }
  }

  _updateEnemies(dt) {
    const gY = this.groundY;
    for (const enemy of this.enemies) {
      if (enemy.dead && enemy.deathTimer <= 0) continue;
      // Only update if near camera view
      const screenX = enemy.x - this.camX;
      if (screenX < -400 || screenX > this.canvasW + 400) continue;

      const result = enemy.update(dt, this.player.x + this.player.w / 2, this.player.y, gY);
      if (result && result.attack) {
        // Check if attack hits player
        const hb = enemy.getAttackHitbox();
        const pb = this.player.getBounds();
        if (hb && _rectsOverlap(hb, pb)) {
          this.player.takeDamage(result.attack ? result.damage : 0);
          UI.flash('rgba(255,50,0,', 0.2);
        }
      }
    }
  }

  _updateCattle(dt) {
    for (let i = 0; i < this.cattleGroups.length; i++) {
      const group = this.cattleGroups[i];
      group.update(dt);

      // Proximity highlight
      const near = group.checkProximity(this.player.x, this.player.y);
      group.highlighted = near && !group.rescued;
      group.cows.forEach(c => c.highlighted = group.highlighted);
    }
  }

  _interactWithCattle() {
    for (const group of this.cattleGroups) {
      if (!group.rescued && group.highlighted) {
        group.rescue();
        this.cattleRescued++;
        ParticleSystem.emitCattleSparkle(group.cows[0].x - this.camX + 40, group.y);

        const lines = this.cattleRescued === 1
          ? Scenes.DIALOGUES.firstCattle
          : this.cattleRescued === this.cattleMax
            ? Scenes.DIALOGUES.cattleAll
            : [{ speaker: 'Pabuji', text: `Cattle protected. (${this.cattleRescued}/${this.cattleMax})` }];
        DialogueManager.show(lines);

        UI.showMessage(`✦ Cattle Protected! ${this.cattleRescued}/${this.cattleMax}`);
        break;
      }
    }
  }

  _updateBoss(dt) {
    if (!this.boss.active) return;

    const result = this.boss.update(dt, this.player.x + this.player.w / 2, this.player.y);

    if (result) {
      // Boss executed an attack — check hit on player
      const hb = this.boss.getAttackHitbox();
      const pb = this.player.getBounds();
      if (hb && _rectsOverlap(hb, pb)) {
        this.player.takeDamage(result.damage);
        UI.flash('rgba(255,50,0,', 0.25);
        if (result.type === 'heavy') {
          ParticleSystem.emitImpact(this.player.x - this.camX + this.player.w / 2, this.player.y + this.player.h / 2);
        }
      }
      if (result.type === 'charge') {
        ParticleSystem.emitDust(this.boss.x - this.camX, this.boss.y + this.boss.h, this.boss.facing);
      }
    }

    if (this.boss.defeated && !this.victory) {
      this._triggerVictory();
    }

    // Boss charge dust
    if (this.boss.state === 'charge_move') {
      ParticleSystem.emitDust(this.boss.x - this.camX + this.boss.w / 2, this.boss.y + this.boss.h * 0.9, this.boss.facing * -1);
    }
  }

  _checkPlayerEnemyCollision() {
    const pb = this.player.getBounds();
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const eb = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };

      if (_rectsOverlap(pb, eb)) {
        if (this.player.state === 'charging') {
          // Charge = instant knockback + damage
          enemy.takeDamage(this.player.chargeDamage, this.player.facing);
          ParticleSystem.emitImpact(enemy.x - this.camX + enemy.w / 2, enemy.y + enemy.h / 3);
        } else {
          // Normal body collision — slight push
          const overlap = (pb.x + pb.w) - eb.x;
          if (overlap > 0 && overlap < 20) {
            // player on left of enemy
          }
        }
      }
    }
  }

  _checkAttackCollisions() {
    const atk = this.player.getAttackHitbox();
    if (!atk) return;

    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const eb = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
      if (_rectsOverlap(atk, eb)) {
        enemy.takeDamage(this.player.attackDamage, this.player.facing);
        ParticleSystem.emitImpact(enemy.x - this.camX + enemy.w / 2, enemy.y + enemy.h / 3);
        UI.flash('rgba(226,179,58,', 0.12);
      }
    }

    // Boss hit
    if (this.boss.active && !this.boss.defeated) {
      const bb = this.boss.getHitbox();
      if (_rectsOverlap(atk, bb)) {
        this.boss.takeDamage(this.player.attackDamage, this.player.facing);
        ParticleSystem.emitImpact(this.boss.x - this.camX + this.boss.w / 2, this.boss.y + this.boss.h / 3);
        UI.flash('rgba(226,179,58,', 0.15);
      }
    }

    // Charge hit on boss
    const chg = this.player.getChargeHitbox();
    if (chg && this.boss.active && !this.boss.defeated) {
      const bb = this.boss.getHitbox();
      if (_rectsOverlap(chg, bb)) {
        this.boss.takeDamage(this.player.chargeDamage, this.player.facing);
        ParticleSystem.emitDust(this.boss.x - this.camX + this.boss.w / 2, this.boss.y + this.boss.h, -this.player.facing);
        UI.flash('rgba(226,179,58,', 0.2);
      }
    }
  }

  _triggerRespawn() {
    // Respawn at start of current section
    const sectionStartX = {
      road:   120,
      cattle: 1650,
      patan:  3420,
      boss:   5430,
    };
    const spawnX = sectionStartX[this.section] || 120;
    this.player.respawn(spawnX, this.groundY);
    DialogueManager.show(Scenes.DIALOGUES.respawn);
    UI.flash('rgba(255,255,255,', 0.5);
  }

  _triggerVictory() {
    this.victory = true;
    DialogueManager.show(Scenes.DIALOGUES.bossDefeated, () => {
      // Show ending screen after delay
      setTimeout(() => {
        document.getElementById('game-wrapper').classList.add('hidden');
        document.getElementById('ending-screen').classList.remove('hidden');
        startEndingCanvas();
      }, 800);
    });
  }

  // ── Rendering ─────────────────────────────────────────────
  render() {
    const ctx     = this.ctx;
    const cW      = this.canvasW;
    const cH      = this.canvasH;
    const section = this.section;

    ctx.clearRect(0, 0, cW, cH);

    // Background (parallax)
    Renderer.drawBackground(ctx, cW, cH, this.camX, section);

    // Ground line
    ctx.fillStyle = '#8B5E1A';
    ctx.fillRect(0, this.groundY, cW, 6);

    // Cattle
    for (const group of this.cattleGroups) {
      group.draw(ctx, this.camX, this.frameTime);
    }

    // Enemies
    for (const enemy of this.enemies) {
      if (!enemy.dead || enemy.deathTimer > 0) {
        const sx = enemy.x - this.camX;
        if (sx > -200 && sx < cW + 200) {
          enemy.draw(ctx, this.camX);
        }
      }
    }

    // Boss
    if (this.boss.active) {
      const bsx = this.boss.x - this.camX;
      if (bsx > -300 && bsx < cW + 300) {
        this.boss.draw(ctx, this.camX);
      }
    }

    // Player
    if (!this.player.dead || this.player.deathTimer < 1.0) {
      this.player.draw(ctx, this.camX);

      // Charge dust
      if (this.player.state === 'charging') {
        ParticleSystem.emitDust(
          this.player.x - this.camX + this.player.w / 2,
          this.player.y + this.player.h * 0.9,
          -this.player.facing
        );
      }
    }

    // Particles
    ParticleSystem.draw(ctx, 0); // already in screen space

    // HUD
    UI.draw(ctx, cW, cH, this.player, this.cattleRescued, this.cattleMax, this.boss, this.player.chargeCooldown, this.player.maxChargeCooldown);

    // Dialogue
    DialogueManager.draw(ctx, cW, cH);

    // Section transition
    if (this.transitionState !== 'none' && this.transitionAlpha > 0.01) {
      Renderer.drawSectionTitle(ctx, cW, cH, this.transitionTitle, this.transitionAlpha);
    }

    // Death overlay
    if (this.player.dead && this.player.deathTimer > 0.5) {
      const alpha = Math.min(1, (this.player.deathTimer - 0.5) / 0.8);
      ctx.save();
      ctx.fillStyle = `rgba(26,10,0,${alpha * 0.75})`;
      ctx.fillRect(0, 0, cW, cH);
      ctx.fillStyle = `rgba(193,68,14,${alpha})`;
      ctx.font = 'bold 22px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PABUJI HAS FALLEN', cW / 2, cH / 2 - 20);
      ctx.fillStyle = `rgba(237,217,163,${alpha * 0.8})`;
      ctx.font = '13px Cinzel, serif';
      ctx.fillText('The story continues... SPACE to rise again', cW / 2, cH / 2 + 20);
      ctx.restore();
    }

    // Victory message (before ending screen loads)
    if (this.victory && this.boss.defeated) {
      ctx.save();
      ctx.fillStyle = 'rgba(26,10,0,0.5)';
      ctx.fillRect(0, 0, cW, cH);
      ctx.fillStyle = C_CREAM;
      ctx.font = 'bold 20px Cinzel Decorative, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PABUJI HAS FULFILLED HIS DUTY', cW / 2, cH / 2);
      ctx.restore();
    }
  }
}

// Rect overlap helper (module-level)
function _rectsOverlap(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

const C_CREAM = '#F5E6C8';
