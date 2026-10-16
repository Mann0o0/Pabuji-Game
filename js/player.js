/**
 * player.js — Pabuji + Kesar Kalami player controller
 *
 * States: idle | running | jumping | attacking | charging | hurt | dead
 */

class Player {
  constructor(x, groundY) {
    this.w = 50;
    this.h = 100; // combined rider+horse height

    this.x       = x;
    this.groundY = groundY;
    this.y       = groundY - this.h;

    this.vx = 0;
    this.vy = 0;

    this.hp     = 100;
    this.maxHp  = 100;
    this.facing = 1; // 1=right, -1=left

    this.state    = 'idle';
    this.animTimer = 0;
    this.onGround  = false;

    // Attack
    this.attackCooldown  = 0;
    this.attackTimer     = 0;
    this.attackDuration  = 0.35;
    this.attackDamage    = 20;
    this.attackRange     = 70;

    // Charge (Kesar Kalami)
    this.chargeCooldown = 0;
    this.chargeDuration = 0;
    this.chargeSpeed    = 420;
    this.chargeDamage   = 30;
    this.maxChargeDuration = 0.55;
    this.maxChargeCooldown = 4.0;

    // Hurt / invincibility
    this.hurtTimer      = 0;
    this.invincibleTime = 0.8;
    this.invincibleTimer = 0;

    // Death / respawn
    this.dead         = false;
    this.deathTimer   = 0;
    this.respawnTimer = 0;

    // Movement
    this.speed     = 180;
    this.jumpForce = -540;
    this.gravity   = 900;
  }

  update(dt) {
    if (this.dead) {
      // deathTimer is incremented by game.js
      return;
    }

    this.animTimer       += dt;
    this.attackCooldown   = Math.max(0, this.attackCooldown - dt);
    this.chargeCooldown   = Math.max(0, this.chargeCooldown - dt);
    this.hurtTimer        = Math.max(0, this.hurtTimer - dt);
    this.invincibleTimer  = Math.max(0, this.invincibleTimer - dt);

    const paused = DialogueManager.isActive();

    if (!paused) {
      this._handleInput(dt);
    }

    // Physics
    this.vy += this.gravity * dt;
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;

    // Ground collision
    const gY = this.groundY - this.h;
    if (this.y >= gY) {
      this.y  = gY;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // Clamp left
    if (this.x < 0) this.x = 0;

    // Attack timer
    if (this.state === 'attacking') {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.state = this.onGround ? 'idle' : 'jumping';
      }
    }

    // Charge timer
    if (this.state === 'charging') {
      this.chargeDuration -= dt;
      if (this.chargeDuration <= 0) {
        this.vx    = 0;
        this.state = 'idle';
      }
    }

    // Idle / running state
    if (this.state !== 'attacking' && this.state !== 'charging' && this.state !== 'hurt') {
      if (!this.onGround) {
        this.state = 'jumping';
      } else if (Math.abs(this.vx) > 10) {
        this.state = 'running';
      } else {
        this.state = 'idle';
      }
    }

    // Hurt state timeout
    if (this.state === 'hurt' && this.hurtTimer <= 0) {
      this.state = 'idle';
    }
  }

  _handleInput(dt) {
    // ── Movement ──
    if (this.state !== 'charging') {
      if (Input.isLeft()) {
        this.vx     = -this.speed;
        this.facing = -1;
      } else if (Input.isRight()) {
        this.vx     = this.speed;
        this.facing = 1;
      } else {
        this.vx *= 0.8; // friction
      }
    }

    // ── Jump ──
    if (Input.isJump() && this.onGround && this.state !== 'attacking') {
      this.vy       = this.jumpForce;
      this.onGround = false;
      this.state    = 'jumping';
    }

    // ── Sword attack ──
    if (Input.isAttack() && this.attackCooldown <= 0 && this.state !== 'charging') {
      this.state           = 'attacking';
      this.attackTimer     = this.attackDuration;
      this.attackCooldown  = 0.5;
      this.vx              = 0;
    }

    // ── Kesar Kalami charge ──
    if (Input.isCharge() && this.chargeCooldown <= 0 && this.onGround) {
      this.state           = 'charging';
      this.chargeDuration  = this.maxChargeDuration;
      this.chargeCooldown  = this.maxChargeCooldown;
      this.vx              = this.facing * this.chargeSpeed;
    }
  }

  getAttackHitbox() {
    if (this.state !== 'attacking') return null;
    return {
      x: this.facing > 0 ? this.x + this.w : this.x - this.attackRange,
      y: this.y,
      w: this.attackRange,
      h: this.h,
    };
  }

  getChargeHitbox() {
    if (this.state !== 'charging') return null;
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  getBounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  takeDamage(amount) {
    if (this.invincibleTimer > 0 || this.dead) return;
    this.hp -= amount;
    this.hurtTimer       = 0.3;
    this.invincibleTimer = this.invincibleTime;
    this.state           = 'hurt';

    // Knockback
    this.vy = -180;

    if (this.hp <= 0) {
      this.hp   = 0;
      this.dead = true;
      this.deathTimer = 0;
    }
  }

  respawn(x, groundY) {
    this.x       = x;
    this.groundY = groundY;
    this.y       = groundY - this.h;
    this.hp      = 100;
    this.vx = this.vy = 0;
    this.dead        = false;
    this.deathTimer  = 0;
    this.state       = 'idle';
    this.attackCooldown = 0;
    this.chargeCooldown = 0;
    this.invincibleTimer = 1.0;
  }

  draw(ctx, camX) {
    Renderer.drawPlayer(ctx, this, camX, this.animTimer);
  }
}
