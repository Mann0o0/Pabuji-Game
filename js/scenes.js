/**
 * scenes.js — Section definitions, triggers, and level data
 *
 * World layout (X positions, world units):
 *   0       → 1600   : ROAD_TO_PATAN  (tutorial)
 *   1600    → 3400   : CATTLE_RESCUE
 *   3400    → 5400   : PATAN_GATES
 *   5400    → 7200   : BOSS_FIGHT
 */

const Scenes = (function() {

  // ── Ground Y (canvas space) — set by Game after resize ──
  let GROUND_Y = 0;
  let CANVAS_W = 0;
  let CANVAS_H = 0;

  function init(gY, cW, cH) {
    GROUND_Y = gY;
    CANVAS_W = cW;
    CANVAS_H = cH;
  }

  // ── Section name by X ─────────────────────────────────────
  function getSectionAt(x) {
    if (x < 1600) return 'road';
    if (x < 3400) return 'cattle';
    if (x < 5400) return 'patan';
    return 'boss';
  }

  // ── Section display names for title cards ─────────────────
  const SECTION_TITLES = {
    road:   '— THE ROAD TO PATAN —',
    cattle: '— THE CATTLE —',
    patan:  '— THE GATES OF PATAN —',
    boss:   '— MIRZA KHAN —',
  };

  // ── Dialogue scripts ──────────────────────────────────────
  const DIALOGUES = {
    intro: [
      { speaker: 'Narrator', text: 'Across the lands of Rajasthan, stories live through song, painting and performance.' },
      { speaker: 'Narrator', text: 'This is a creative interactive interpretation of the Act of Patan from the Pabuji epic.' },
      { speaker: 'Pabuji',   text: 'I ride toward Patan. Kesar Kalami carries me forward across the desert.' },
      { speaker: 'Pabuji',   text: 'Those who cannot protect themselves must not be abandoned.' },
    ],
    firstCattle: [
      { speaker: 'Pabuji', text: 'These cattle are in danger. I will not leave them behind.' },
      { speaker: 'Pabuji', text: 'Press E near a cattle group to protect them. Fight off the guards who threaten them.' },
    ],
    moreCattle: [
      { speaker: 'Narrator', text: 'Pabuji presses forward, gathering the scattered cattle.' },
      { speaker: 'Pabuji',   text: 'Every life protected is a duty fulfilled.' },
    ],
    beforePatan: [
      { speaker: 'Narrator', text: 'Beyond the desert lies Patan.' },
      { speaker: 'Narrator', text: 'The city stands fortified, its guards awaiting.' },
      { speaker: 'Pabuji',   text: 'And there waits Mirza Khan.' },
    ],
    bossMeet: [
      { speaker: 'Mirza Khan', text: 'You have come all this way... for cattle?' },
      { speaker: 'Pabuji',     text: 'I have come because they must be protected.' },
      { speaker: 'Mirza Khan', text: 'Then prove your courage, rider.' },
      { speaker: 'Pabuji',     text: 'Kesar Kalami — with me.' },
    ],
    bossDefeated: [
      { speaker: 'Narrator', text: 'Pabuji defeats Mirza Khan.' },
      { speaker: 'Narrator', text: 'Through courage and duty, his identity as a protector is confirmed.' },
      { speaker: 'Pabuji',   text: 'The cattle are safe. The road home begins.' },
    ],
    cattleAll: [
      { speaker: 'Narrator', text: 'All the cattle have been protected. Pabuji\'s duty is half fulfilled.' },
      { speaker: 'Pabuji',   text: 'Now I must face what lies ahead.' },
    ],
    respawn: [
      { speaker: 'Narrator', text: 'Pabuji rises again. The story is not yet finished.' },
    ],
  };

  // ── Enemy spawn data ──────────────────────────────────────
  // Each entry: { type, x, active }
  function buildEnemySpawns() {
    return [
      // Tutorial — sparse
      { type: 'PatanGuard',   x: 700,  active: true },
      { type: 'PatanGuard',   x: 1100, active: true },
      { type: 'PatanGuard',   x: 1400, active: true },

      // Cattle section — more
      { type: 'PatanGuard',   x: 1900, active: true },
      { type: 'ArmedSoldier', x: 2200, active: true },
      { type: 'PatanGuard',   x: 2500, active: true },
      { type: 'CavalryGuard', x: 2900, active: true },
      { type: 'ArmedSoldier', x: 3200, active: true },

      // Patan — harder
      { type: 'ArmedSoldier', x: 3600, active: true },
      { type: 'CavalryGuard', x: 3900, active: true },
      { type: 'ArmedSoldier', x: 4200, active: true },
      { type: 'PatanGuard',   x: 4400, active: true },
      { type: 'CavalryGuard', x: 4700, active: true },
      { type: 'ArmedSoldier', x: 5000, active: true },
      { type: 'ArmedSoldier', x: 5200, active: true },
    ];
  }

  // ── Cattle group spawn data ───────────────────────────────
  function buildCattleSpawns() {
    return [
      { x: 1650, count: 2 },
      { x: 2350, count: 2 },
      { x: 3050, count: 3 },
      { x: 3800, count: 2 },
      { x: 4600, count: 2 },
    ];
  }

  // ── Trigger zone definitions ──────────────────────────────
  // Triggers fire dialogue / events when player passes X
  function buildTriggers() {
    return [
      { x: 20,   id: 'intro',       fired: false },
      { x: 1620, id: 'firstCattle', fired: false },
      { x: 2380, id: 'moreCattle',  fired: false },
      { x: 3420, id: 'beforePatan', fired: false },
      { x: 5420, id: 'bossMeet',    fired: false },
    ];
  }

  // ── Section transition X thresholds ──────────────────────
  const SECTION_THRESHOLDS = [
    { x: 1600, section: 'cattle' },
    { x: 3400, section: 'patan'  },
    { x: 5400, section: 'boss'   },
  ];

  return {
    init,
    getSectionAt,
    SECTION_TITLES,
    DIALOGUES,
    buildEnemySpawns,
    buildCattleSpawns,
    buildTriggers,
    SECTION_THRESHOLDS,
    get GROUND_Y() { return GROUND_Y; },
  };
})();
