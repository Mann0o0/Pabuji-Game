/**
 * boss.js — Mirza Khan boss fight
 *
 * 100 HP, three attack types, simple readable AI.
 * Phases: Phase 1 (100–50 HP) normal, Phase 2 (50–0 HP) enraged.
 */

class MirzaKhan {
  constructor(x, groundY) {
    this.x       = x;
    this.groundY = groundY;
    this.w       = 60;
    this.h       = 110;
    this.y       = groundY - this.h;
    this.hp      = 100;
    this.maxHp   = 100;
    this.facing  = -1;

    this.state      = 'idle';
    this.stateTimer = 0;
    this.animTimer  = 0;
    this.hurtTimer  = 0;
    this.active     = false;
    this.defeated   = false;

    this.vx = 0;
    this.vy = 0;

    // Attack data
    this.attacks = {
      normal: { damage: 12, range: 80,  cooldown: 1.6, windUp: 0.5 },
      heavy:  { damage: 22, range: 100, cooldown: 2.4, windUp: 0.9 },
      charge: { damage: 16, range: 200, cooldown: 3.0, windUp: 0.6, speed: 280 },
    };
    this.currentAttack = null;
    this.attackTimer   = 0;
    this.attackCooldown = 0;

    // Phase 2 enrage
    this.enraged = false;

    // Knockback
    this.knockbackX = 0;
  }

  activate() {
    this.active = true;
    this.state  = 'idle';
    this.stateTimer = 1.0; // brief pause before engaging
  }

  update(dt, playerX, playerY) {
    if (!this.active || this.defeated) return null;

    this.animTimer  += dt;
    this.stateTimer += dt;
    this.hurtTimer   = Math.max(0, this.hurtTimer - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    // Knockback
    this.knockbackX *= Math.pow(0.02, dt);
    this.x += this.knockbackX * dt;

    // Gravity
    this.vy += 500 * dt;
    this.y  += this.vy * dt;
    const gY = this.groundY - this.h;
    if (this.y >= gY) { this.y = gY; this.vy = 0; }

    // Enrage check
    if (!this.enraged && this.hp <= 50) {
      this.enraged = true;
    }

    const speedMult = this.enraged ? 1.5 : 1.0;
    const dx   = playerX - (this.x + this.w / 2);
    const dist = Math.abs(dx);
    this.facing = dx < 0 ? -1 : 1;

    let attackResult = null;

    switch (this.state) {
      // ── Idle / brief pause ──
      case 'idle':
        if (this.stateTimer > 1.2) {
          this.state = 'chase';
          this.stateTimer = 0;
        }
        break;

      // ── Chase player ──
      case 'chase': {
        const speed = 65 * speedMult;
        if (dist > 100) {
          this.x += Math.sign(dx) * speed * dt;
        } else if (this.attackCooldown <= 0) {
          this._chooseAttack(dist);
        }
        break;
      }

      // ── Normal attack windup ──
      case 'attack_windup':
        if (this.stateTimer >= this.currentAttack.windUp) {
          this.state = 'attacking';
          this.stateTimer = 0;
        }
        break;

      // ── Execute attack ──
      case 'attacking':
        attackResult = {
          type:   this.currentAttack.key,
          damage: this.currentAttack.damage,
          range:  this.currentAttack.range,
          originX: this.x + this.w / 2,
          originY: this.y,
          dir: this.facing,
        };
        this.attackCooldown = this.currentAttack.cooldown * (this.enraged ? 0.7 : 1.0);
        this.state = 'recover';
        this.stateTimer = 0;
        break;

      // ── Charge movement ──
      case 'charge_move': {
        const chargeSpeed = this.currentAttack.speed * speedMult;
        this.x += this.facing * chargeSpeed * dt;
        this.attackTimer += dt;
        if (this.attackTimer > 0.5) {
          this.state = 'recover';
          this.stateTimer = 0;
        }
        // Hit check happens in game.js collision
        break;
      }

      // ── Recover ──
      case 'recover':
        if (this.stateTimer > 0.8) {
          this.state = 'chase';
          this.stateTimer = 0;
        }
        break;
    }

    return attackResult;
  }

  _chooseAttack(dist) {
    const r = Math.random();
    const enragedBias = this.enraged ? 0.2 : 0;

    if (dist < 90 && r < 0.45 + enragedBias) {
      this.currentAttack = { ...this.attacks.normal, key: 'normal' };
    } else if (dist < 110 && r < 0.70 + enragedBias) {
      this.currentAttack = { ...this.attacks.heavy, key: 'heavy' };
    } else {
      this.currentAttack = { ...this.attacks.charge, key: 'charge' };
      this.attackTimer = 0;
      this.state = 'attack_windup';
      this.stateTimer = 0;
      return;
    }
    this.state = 'attack_windup';
    this.stateTimer = 0;
  }

  takeDamage(amount, knockbackDir) {
    if (this.defeated) return;
    this.hp       -= amount;
    this.hurtTimer = 0.25;
    this.knockbackX = knockbackDir * 180;

    if (this.state !== 'recover') {
      this.state = 'recover';
      this.stateTimer = 0;
    }

    if (this.hp <= 0) {
      this.hp       = 0;
      this.defeated = true;
    }
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
    };
  }

  getAttackHitbox() {
    if (!this.currentAttack) return null;
    const range  = this.currentAttack.range;
    const dir    = this.facing;
    return {
      x: dir > 0 ? this.x + this.w : this.x - range,
      y: this.y,
      w: range,
      h: this.h,
    };
  }

  draw(ctx, camX) {
    Renderer.drawBoss(ctx, this, camX);
  }
}
