/**
 * main.js — Entry point
 *
 * Manages:
 *  - Intro scroll → game canvas transition
 *  - Game loop (requestAnimationFrame)
 *  - Ending screen + ending canvas animation
 *  - Restart / Explore buttons
 */

let game   = null;
let lastTs = 0;
let rafId  = null;

// ── Intro Screen ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Input.init();

  const unfurlBtn  = document.getElementById('unfurl-btn');
  const introScreen = document.getElementById('intro-screen');
  const gameWrapper = document.getElementById('game-wrapper');
  const canvas      = document.getElementById('game-canvas');

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  unfurlBtn.addEventListener('click', () => {
    // Scroll unfurl animation
    introScreen.classList.add('scroll-unfurl-active');

    setTimeout(() => {
      introScreen.classList.add('hidden');
      gameWrapper.classList.remove('hidden');
      startGame(canvas);
    }, 900);
  });

  // Ending buttons
  document.getElementById('play-again-btn').addEventListener('click', () => {
    document.getElementById('ending-screen').classList.add('hidden');
    gameWrapper.classList.remove('hidden');
    restartGame();
  });

  document.getElementById('explore-btn').addEventListener('click', () => {
    document.getElementById('explore-panel').classList.remove('hidden');
  });

  document.getElementById('explore-close').addEventListener('click', () => {
    document.getElementById('explore-panel').classList.add('hidden');
  });

  document.getElementById('explore-back').addEventListener('click', () => {
    document.getElementById('explore-panel').classList.add('hidden');
  });
});

// ── Game Start / Loop ─────────────────────────────────────────
function startGame(canvas) {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  game   = new Game(canvas);
  lastTs = performance.now();

  if (rafId) cancelAnimationFrame(rafId);
  gameLoop(performance.now());
}

function restartGame() {
  if (game) {
    game.start();
    if (!rafId) gameLoop(performance.now());
  }
}

function gameLoop(ts) {
  rafId = requestAnimationFrame(gameLoop);

  const dt = Math.min((ts - lastTs) / 1000, 0.05); // cap at 50ms
  lastTs   = ts;

  if (!game) return;

  game.update(dt);
  game.render();
}

// ── Ending Canvas Animation ───────────────────────────────────
function startEndingCanvas() {
  const ec = document.getElementById('ending-canvas');
  ec.width  = window.innerWidth;
  ec.height = window.innerHeight;
  const ctx = ec.getContext('2d');

  let t = 0;
  function animateEnding(ts) {
    t += 0.016;
    Renderer.drawEndingIllustration(ctx, ec.width, ec.height, t);
    requestAnimationFrame(animateEnding);
  }
  requestAnimationFrame(animateEnding);
}

// Expose for game.js to call
window.startEndingCanvas = startEndingCanvas;
