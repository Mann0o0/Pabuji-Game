/**
 * input.js — Keyboard input manager
 * Tracks key states for the game loop
 */

const Input = (function() {
  const keys = {};
  const justPressed  = {};
  const justReleased = {};
  const _prevKeys    = {};

  function init() {
    window.addEventListener('keydown', (e) => {
      if (!keys[e.code]) {
        justPressed[e.code] = true;
      }
      keys[e.code] = true;
      // Prevent space / arrow scroll
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      keys[e.code] = false;
      justReleased[e.code] = true;
    });
  }

  function update() {
    // Clear just-pressed / just-released each frame
    for (const k in justPressed)  delete justPressed[k];
    for (const k in justReleased) delete justReleased[k];
  }

  function isDown(code)         { return !!keys[code]; }
  function wasPressed(code)     { return !!justPressed[code]; }
  function wasReleased(code)    { return !!justReleased[code]; }

  function isLeft()   { return isDown('KeyA') || isDown('ArrowLeft'); }
  function isRight()  { return isDown('KeyD') || isDown('ArrowRight'); }
  function isJump()   { return wasPressed('Space'); }
  function isAttack() { return wasPressed('KeyJ'); }
  function isCharge() { return wasPressed('KeyK'); }
  function isInteract()  { return wasPressed('KeyE'); }
  function isAdvance()   { return wasPressed('Space') || wasPressed('Enter'); }

  return { init, update, isDown, wasPressed, wasReleased, isLeft, isRight, isJump, isAttack, isCharge, isInteract, isAdvance };
})();
