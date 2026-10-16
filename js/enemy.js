/**
 * enemy.js — Enemy classes for Pabuji: The Protector
 *
 * Enemy types:
 *  - PatanGuard    (basic melee, 30 HP)
 *  - ArmedSoldier  (heavy melee, 50 HP)
 *  - CavalryGuard  (fast mounted, 40 HP)
 *
 * All use simple state machine: idle → chase → attack → recover → idle
 */

class Enemy {
  constructor(x, y, type) {
    this.type    = type;
    this.x       = x;
    this.y       = 0; // set to ground in init
    this.vx      = 0;
    this.vy      = 0;
    this.facing  = -1; // -1=left (toward player by default)
    this.state   = 'idle';
    this.animTimer  = 0;
    this.stateTimer = 0;
    this.hurtTimer  = 0;
    this.dead       = false;
    this.deathTimer = 0.5;
    this.onGround   = false;

    // Type-specific stats
    const stats = {
      PatanGuard:    { hp: 30, maxHp: 30, w: 32, h: 70, speed: 70,  atkRange: 45, atkDmg: 10, atkCooldown: 1.4, detectRange: 300 },
      ArmedSoldier:  { hp: 50, maxHp: 50, w: 36, h: 80, speed: 55,  atkRange: 55, atkDmg: 18, atkCooldown: 1.8, detectRange: 280 },
      CavalryGuard:  { hp: 40, maxHp: 40, w: 44, h: 90, speed: 110, atkRange: 60, atkDmg: 14, atkCooldown: 1.2, detectRange: 360 },
    };

    const s = stats[type] || stats.PatanGuard;
    Object.assign(this, s);

    this.attackTimer  = 0;
    this.knockbackX   = 0;
    this.idleTimer    = 0;
    this.patrolDir    = 1;
    this.patrolTimer  = 0;
    this.groundY      = y; // ground Y
    this.y            = y - this.h;
  }

  update(dt, playerX, playerY, groundY) {
    if (this.dead) {
      this.deathTimer -= dt;
      return;
    }

    this.animTimer  += dt;
    this.stateTimer += dt;
    this.hurtTimer   = Math.max(0, this.hurtTimer - dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);

    // Knockback decay
    this.knockbackX *= Math.pow(0.05, dt);
    this.x += this.knockbackX * dt;

    // Gravity
    if (!this.onGround) {
      this.vy += 500 * dt;
    }
    this.y += this.vy * dt;

    // Ground snap
    const gY = groundY - this.h;
    if (this.y >= gY) {
      this.y  = gY;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    const dx = playerX - (this.x + this.w / 2);
    const dist = Math.abs(dx);

    this.facing = dx < 0 ? -1 : 1;

    // ── State machine ──
    switch (this.state) {
      case 'idle':
        this._patrol(dt);
        if (dist < this.detectRange) this.state = 'chase';
        break;

      case 'chase':
        if (dist < this.atkRange) {
          this.state = 'attack';
          this.stateTimer = 0;
        } else if (dist > this.detectRange * 1.5) {
          this.state = 'idle';
        } else {
          this.x += Math.sign(dx) * this.speed * dt;
        }
        break;

      case 'attack':
        // Windup then strike
        if (this.stateTimer > 0.4 && this.attackTimer <= 0) {
          this.attackTimer = this.atkCooldown;
          this.state       = 'recover';
          this.stateTimer  = 0;
          return { attack: true, damage: this.atkDmg, x: this.x + this.w / 2, y: this.y };
        }
        break;

      case 'recover':
        if (this.stateTimer > 0.6) {
          this.state = dist < this.detectRange ? 'chase' : 'idle';
          this.stateTimer = 0;
        }
        break;
    }

    return null;
  }

  _patrol(dt) {
    this.patrolTimer += dt;
    if (this.patrolTimer > 2.5) {
      this.patrolDir  *= -1;
      this.patrolTimer = 0;
    }
    this.x += this.patrolDir * 28 * dt;
    this.facing = this.patrolDir;
  }

  takeDamage(amount, knockbackDir) {
    if (this.dead) return;
    this.hp        -= amount;
    this.hurtTimer  = 0.3;
    this.knockbackX = knockbackDir * 280;
    this.state      = 'recover';
    this.stateTimer = 0;

    if (this.hp <= 0) {
      this.hp   = 0;
      this.dead = true;
      this.deathTimer = 0.5;
    }
  }

  getAttackHitbox() {
    // The region in front of the enemy that counts as a hit
    const dir = this.facing;
    return {
      x: dir > 0 ? this.x + this.w : this.x - this.atkRange,
      y: this.y,
      w: this.atkRange,
      h: this.h,
    };
  }

  draw(ctx, camX) {
    Renderer.drawEnemy(ctx, this, camX);
  }
}
