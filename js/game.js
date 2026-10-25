import * as THREE from '../models/three.module.min.js';
import { createBunkerScene, FOOD_TYPES, STATION_IDS, CRITTER_CROP_BOXES, WAVE_THEMES } from './scene3d.js';
import { BunkerAudio } from './audio.js';
import {
  createHelperAndEventsState,
  stepHelperAndEvents,
  triggerHelperBuddyTap,
  triggerGoldenCrateOpen,
} from './helper_and_events.js';

const RIVAL_SCORES = [220, 165, 110, 55];
const RIVAL_CRITTERS = ['dogday', 'catnap', 'craftycorn', 'hoppy'];
const PLAYER_CRITTER = 'baba';

function getCritterCropStyle(critterId) {
  const [ux, uy, uw, uh] = CRITTER_CROP_BOXES[critterId] || [0, 0, 1, 1];
  const wPct = (100 / uw).toFixed(2);
  const hPct = (100 / uh).toFixed(2);
  const leftPct = (-(ux / uw) * 100).toFixed(2);
  const topPct = (-(uy / uh) * 100).toFixed(2);
  return `left:${leftPct}%;top:${topPct}%;width:${wPct}%;height:${hPct}%;filter:brightness(1.22) contrast(1.12) saturate(1.32);`;
}

const BASE_COINS = {
  steak: 40,
  lobster: 45,
  cheese: 35,
  cake: 35,
  skewer: 35,
  corn: 30,
};

const COOK_DURATION = 2.2;
const BURN_DURATION = 7.5;
const COMBO_WINDOW = 5.0;

const WAVE_PATIENCE = {
  1: 26.0,
  2: 23.0,
  3: 20.0,
};

const WAVE_SCHEDULES = {
  1: [
    { friend: 'catnap', food: 'steak' },
    { friend: 'dogday', food: 'lobster' },
    { friend: 'hoppy', food: 'cheese' },
    { friend: 'craftycorn', food: 'cake' },
    { friend: 'baba', food: 'skewer' },
    { friend: 'picky', food: 'corn' },
    { friend: 'bubba', food: 'steak' },
    { friend: 'kickin', food: 'lobster' },
  ],
  2: [
    { friend: 'dogday', food: 'lobster' },
    { friend: 'catnap', food: 'steak' },
    { friend: 'picky', food: 'cake' },
    { friend: 'hoppy', food: 'skewer' },
    { friend: 'craftycorn', food: 'cheese' },
    { friend: 'baba', food: 'lobster' },
    { friend: 'kickin', food: 'corn' },
    { friend: 'bubba', food: 'steak' },
  ],
  3: [
    { friend: 'catnap', food: 'lobster' },
    { friend: 'dogday', food: 'steak' },
    { friend: 'baba', food: 'cheese' },
    { friend: 'picky', food: 'cake' },
    { friend: 'hoppy', food: 'lobster' },
    { friend: 'craftycorn', food: 'steak' },
    { friend: 'bubba', food: 'skewer' },
    { friend: 'kickin', food: 'corn' },
  ],
};

function createTraySlot(index, initialFood = null) {
  return {
    index,
    id: `tray_${index}`,
    foodType: initialFood,
    popTimer: 0,
  };
}

function createHotpotSlot(index) {
  return {
    index,
    id: `hotpot_${index}`,
    state: 'empty', // 'empty' | 'cooking' | 'ready' | 'burned'
    foodType: null,
    cookProgress: 0,
    burnProgress: 0,
    warnedBurn: false,
    glazed: false,
  };
}

function createCustomerSlot(slotIndex) {
  return {
    slotIndex,
    id: `customer_${slotIndex}`,
    active: false,
    orderIndex: -1,
    friend: 'catnap',
    wantedFood: 'steak',
    patience: 26.0,
    maxPatience: 26.0,
  };
}

const canvas = document.getElementById('gameCanvas');
const sceneApi = createBunkerScene(canvas);

const state = {
  wave: 1,
  waveTheme: WAVE_THEMES[1],
  coins: 0,
  totalCoinsAllWaves: 0,
  comboCount: 0,
  comboTimer: 0,
  fluteFeverTimer: 0,
  sauceGlazedCount: 0,
  cocoaServedCount: 0,
  ...createHelperAndEventsState(),
  traySlots: [
    createTraySlot(0, 'steak'),
    createTraySlot(1, 'lobster'),
    createTraySlot(2, null),
    createTraySlot(3, null),
  ],
  hotpots: [createHotpotSlot(0), createHotpotSlot(1)],
  customers: [createCustomerSlot(0), createCustomerSlot(1), createCustomerSlot(2)],
  banditState: 'hidden', // 'hidden' | 'peeking' | 'snowman'
  banditTimer: 4.5,
  nextOrderIndex: 0,
  orderOutcomes: new Array(8).fill('pending'), // 'pending' | 'served' | 'missed'
  waveFinished: false,
  modalOpen: false,
  canAdvance: false,
  playerRank: 5,
  earnedStars: 0,
  draggingVortex: false,
  vortexWorldPos: new THREE.Vector3(-1.35, 0.56, 1.85),
  vortexSweepCooldown: {},
  dragFood: null, // { sourceType: 'tray'|'hotpot'|'shelf', index, foodType, cooked, burned, glazed }
  dragWorldPos: new THREE.Vector3(),
  guideTimer: 0,
  elapsed: 0,
};

// DOM Elements
const waveCrowns = [
  document.getElementById('crownWave1'),
  document.getElementById('crownWave2'),
  document.getElementById('crownWave3'),
];
const customerPipsEl = document.getElementById('customerPips');
const coinBarFillEl = document.getElementById('coinBarFill');
const coinEmblemEl = document.getElementById('coinEmblem');
const starMarkers = [
  document.getElementById('starMark1'),
  document.getElementById('starMark2'),
  document.getElementById('starMark3'),
];
const comboFlameEl = document.getElementById('comboFlameIcon');
const comboPips = [
  document.getElementById('comboPip1'),
  document.getElementById('comboPip2'),
  document.getElementById('comboPip3'),
];
const comboTimerFillEl = document.getElementById('comboTimerFill');
const fxLayerEl = document.getElementById('fxLayer');
const guideHandEl = document.getElementById('guideHand');
const btnMuteEl = document.getElementById('btnMute');
const iconSoundOnEl = document.getElementById('iconSoundOn');
const iconSoundOffEl = document.getElementById('iconSoundOff');
const btnRestartWaveEl = document.getElementById('btnRestartWave');
const wavePillEl = document.getElementById('wavePill');
const waveModalBackdropEl = document.getElementById('waveModalBackdrop');
const modalStars = [
  document.getElementById('modalStar1'),
  document.getElementById('modalStar2'),
  document.getElementById('modalStar3'),
];
const modalPodiumRowEl = document.getElementById('modalPodiumRow');
const btnModalReplayEl = document.getElementById('btnModalReplay');
const btnModalNextEl = document.getElementById('btnModalNext');

// Build 8 customer pips in top HUD
const pipEls = [];
for (let i = 0; i < 8; i++) {
  const d = document.createElement('div');
  d.className = 'cust-pip';
  customerPipsEl.appendChild(d);
  pipEls.push(d);
}

function updateTopHud() {
  for (let w = 0; w < 3; w++) {
    const el = waveCrowns[w];
    if (!el) continue;
    el.classList.toggle('active', state.wave === w + 1);
    el.classList.toggle('done', state.wave > w + 1);
  }

  for (let i = 0; i < 8; i++) {
    const pip = pipEls[i];
    if (!pip) continue;
    pip.className = 'cust-pip';
    if (state.orderOutcomes[i] === 'served') pip.classList.add('served');
    else if (state.orderOutcomes[i] === 'missed') pip.classList.add('missed');
  }

  const pct = Math.max(0, Math.min(100, (state.coins / 260) * 100));
  coinBarFillEl.style.width = `${pct.toFixed(1)}%`;

  starMarkers[0].classList.toggle('earned', state.coins >= RIVAL_SCORES[2]); // >= 110
  starMarkers[1].classList.toggle('earned', state.coins >= RIVAL_SCORES[1]); // >= 165
  starMarkers[2].classList.toggle('earned', state.coins >= RIVAL_SCORES[0]); // >= 220

  const hot = state.comboCount >= 2 || state.fluteFeverTimer > 0;
  comboFlameEl.classList.toggle('hot', hot);
  for (let c = 0; c < 3; c++) {
    comboPips[c].classList.toggle('lit', state.comboCount > c || state.fluteFeverTimer > 0);
  }
  const timerPct = state.fluteFeverTimer > 0
    ? Math.min(100, (state.fluteFeverTimer / 5.0) * 100)
    : state.comboTimer > 0
      ? Math.min(100, (state.comboTimer / COMBO_WINDOW) * 100)
      : 0;
  comboTimerFillEl.style.width = `${timerPct.toFixed(1)}%`;
}

function spawnFlyingCoins(fromStationId, count = 3) {
  const start = sceneApi.getStationScreenRect(fromStationId);
  const targetRect = coinEmblemEl.getBoundingClientRect();
  const tx = targetRect.left + targetRect.width * 0.5;
  const ty = targetRect.top + targetRect.height * 0.5;

  for (let i = 0; i < count; i++) {
    const coin = document.createElement('div');
    coin.className = 'flying-coin';
    coin.innerHTML = `<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="#fbbf24" stroke="#b45309" stroke-width="2.5"/><path d="M18 8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9z" fill="#fef08a"/></svg>`;
    const sx = start.x + (i - 1) * 18;
    const sy = start.y - 12;
    coin.style.transform = `translate3d(${sx}px, ${sy}px, 0) scale(0.9)`;
    fxLayerEl.appendChild(coin);

    setTimeout(() => {
      coin.style.transition = 'transform 0.52s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.52s ease';
      coin.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(0.55)`;
      coin.style.opacity = '0.2';
    }, 20 + i * 55);

    setTimeout(() => {
      coin.remove();
      coinEmblemEl.classList.add('pulse');
      setTimeout(() => coinEmblemEl.classList.remove('pulse'), 180);
    }, 580 + i * 55);
  }
}

function spawnNextCustomerIntoSlot(slotIndex) {
  const schedule = WAVE_SCHEDULES[state.wave] || WAVE_SCHEDULES[1];
  if (state.nextOrderIndex >= schedule.length) return false;
  const spec = schedule[state.nextOrderIndex];
  const orderIdx = state.nextOrderIndex;
  state.nextOrderIndex += 1;

  const maxPat = WAVE_PATIENCE[state.wave] || 26.0;
  const cust = state.customers[slotIndex];
  cust.active = true;
  cust.orderIndex = orderIdx;
  cust.friend = spec.friend;
  cust.wantedFood = spec.food;
  cust.maxPatience = maxPat;
  cust.patience = maxPat;
  return true;
}

function fillEmptyCustomerSeats() {
  for (let i = 0; i < 3; i++) {
    if (!state.customers[i].active && state.nextOrderIndex < 8) {
      spawnNextCustomerIntoSlot(i);
    }
  }
}

function startWave(waveNum) {
  state.wave = Math.max(1, Math.min(3, waveNum));
  state.waveTheme = WAVE_THEMES[state.wave] || WAVE_THEMES[1];
  state.coins = 0;
  state.comboCount = 0;
  state.comboTimer = 0;
  state.fluteFeverTimer = 0;
  state.sauceGlazedCount = 0;
  state.cocoaServedCount = 0;
  Object.assign(state, createHelperAndEventsState());
  state.nextOrderIndex = 0;
  state.orderOutcomes = new Array(8).fill('pending');
  state.waveFinished = false;
  state.modalOpen = false;
  state.canAdvance = false;
  state.playerRank = 5;
  state.earnedStars = 0;
  state.draggingVortex = false;
  state.dragFood = null;
  state.banditState = 'peeking';
  state.banditTimer = 9.0;

  const schedule = WAVE_SCHEDULES[state.wave] || WAVE_SCHEDULES[1];
  state.traySlots = [
    createTraySlot(0, schedule[0].food),
    createTraySlot(1, schedule[1].food),
    createTraySlot(2, null),
    createTraySlot(3, null),
  ];
  state.hotpots = [createHotpotSlot(0), createHotpotSlot(1)];
  state.customers = [createCustomerSlot(0), createCustomerSlot(1), createCustomerSlot(2)];

  waveModalBackdropEl.classList.remove('open');
  fillEmptyCustomerSeats();
  if (state.wave >= 2) {
    BunkerAudio.playWaveEvolutionChime?.(state.wave);
  }
  updateTopHud();
}

// ============================================================================
// Core Gameplay Actions: Spatial Vortex Vacuum, Hotpot Simmer, Sauce, Cocoa, Serve, Flute, Snowball
// ============================================================================

function findOpenTraySlot() {
  for (let i = 0; i < 4; i++) {
    if (!state.traySlots[i].foodType) return i;
  }
  return -1;
}

function findOpenHotpotSlot() {
  for (let i = 0; i < 2; i++) {
    if (state.hotpots[i].state === 'empty') return i;
  }
  return -1;
}

function vacuumFoodFromShelf(foodType, autoCookIfTrayFull = true) {
  if (!FOOD_TYPES.includes(foodType) || state.waveFinished) return false;
  const openTray = findOpenTraySlot();
  if (openTray >= 0) {
    // Reserve slot immediately & animate 3D spiral suction
    state.traySlots[openTray].foodType = foodType;
    state.traySlots[openTray].popTimer = 0.35;
    BunkerAudio.playVortexSuction(openTray);
    const fromVec = new THREE.Vector3(-3.1, 0.55, 0.2);
    sceneApi.spawnSuctionFlight(foodType, fromVec, openTray, null);
    state.guideTimer = 0;
    updateTopHud();
    return true;
  }
  if (autoCookIfTrayFull) {
    const openPot = findOpenHotpotSlot();
    if (openPot >= 0) {
      startCookingInHotpot(openPot, foodType);
      return true;
    }
  }
  return false;
}

function startCookingInHotpot(potIdx, foodType) {
  const pot = state.hotpots[potIdx];
  if (!pot || pot.state !== 'empty' || !foodType) return false;
  pot.state = 'cooking';
  pot.foodType = foodType;
  pot.cookProgress = 0;
  pot.burnProgress = 0;
  pot.warnedBurn = false;
  pot.glazed = false;
  BunkerAudio.playHotpotSplash(potIdx);
  state.guideTimer = 0;
  return true;
}

function moveTrayToHotpot(trayIdx, targetPotIdx = -1) {
  const tray = state.traySlots[trayIdx];
  if (!tray || !tray.foodType) return false;
  const potIdx = targetPotIdx >= 0 && state.hotpots[targetPotIdx].state === 'empty'
    ? targetPotIdx
    : findOpenHotpotSlot();
  if (potIdx < 0) return false;
  const food = tray.foodType;
  tray.foodType = null;
  return startCookingInHotpot(potIdx, food);
}

function serveFoodToCustomer(foodType, fromStationId, preferredCustIdx = -1, isGlazed = false) {
  let targetCust = null;
  if (preferredCustIdx >= 0 && state.customers[preferredCustIdx]?.active && state.customers[preferredCustIdx].wantedFood === foodType) {
    targetCust = state.customers[preferredCustIdx];
  } else {
    for (let i = 0; i < 3; i++) {
      const c = state.customers[i];
      if (c.active && c.wantedFood === foodType) {
        targetCust = c;
        break;
      }
    }
  }
  if (!targetCust) return false;

  const base = BASE_COINS[foodType] || 35;
  const speedBonus = Math.round((targetCust.patience / targetCust.maxPatience) * 12);
  const comboStep = isGlazed ? 2 : 1;
  state.comboCount = Math.min(3, state.comboCount + comboStep);
  state.comboTimer = COMBO_WINDOW;
  const comboBonus = (state.comboCount - 1) * 6;
  const feverBonus = state.fluteFeverTimer > 0 ? 10 : 0;
  const glazeBonus = isGlazed ? (state.wave >= 2 ? 22 : 18) : 0;

  const earned = base + speedBonus + comboBonus + feverBonus + glazeBonus;
  state.coins += earned;
  state.totalCoinsAllWaves += earned;
  state.orderOutcomes[targetCust.orderIndex] = 'served';

  BunkerAudio.playServeDelicacy(state.comboCount);
  spawnFlyingCoins(fromStationId || targetCust.id, isGlazed ? 4 : 3);

  targetCust.active = false;
  fillEmptyCustomerSeats();
  checkWaveEndCondition();
  updateTopHud();
  return true;
}

function serveFromHotpot(potIdx, preferredCustIdx = -1) {
  const pot = state.hotpots[potIdx];
  if (!pot || pot.state === 'empty') return false;
  if (pot.state === 'burned') {
    pot.state = 'empty';
    pot.foodType = null;
    pot.cookProgress = 0;
    pot.burnProgress = 0;
    pot.glazed = false;
    BunkerAudio.playBurnPuff();
    return true;
  }
  // Forgiving for 5yo: if almost cooked (>65%) or ready, allow serving if a customer wants it!
  if (pot.state === 'ready' || pot.cookProgress >= 0.65) {
    const wasGlazed = Boolean(pot.glazed);
    if (serveFoodToCustomer(pot.foodType, pot.id, preferredCustIdx, wasGlazed)) {
      pot.state = 'empty';
      pot.foodType = null;
      pot.cookProgress = 0;
      pot.burnProgress = 0;
      pot.glazed = false;
      return true;
    }
  }
  return false;
}

function dipHotpotInSauce(preferredPotIdx = -1, autoServeIfAlreadyGlazed = true) {
  if (state.waveFinished) return false;
  let targetPot = null;
  if (preferredPotIdx >= 0 && state.hotpots[preferredPotIdx] && (state.hotpots[preferredPotIdx].state === 'ready' || state.hotpots[preferredPotIdx].state === 'cooking')) {
    targetPot = state.hotpots[preferredPotIdx];
  } else {
    targetPot = state.hotpots.find((p) => p.state === 'ready' && !p.glazed)
      || state.hotpots.find((p) => p.state === 'cooking' && !p.glazed)
      || state.hotpots.find((p) => p.state === 'ready' || p.state === 'cooking');
  }

  // Zero-dead-tap fallback: if both hotpots are empty, auto-load a needed ingredient and glaze it!
  if (!targetPot) {
    const needed = state.customers.find((c) => c.active)?.wantedFood || 'steak';
    let trayIdx = state.traySlots.findIndex((t) => t.foodType && t.foodType === needed);
    if (trayIdx < 0) trayIdx = state.traySlots.findIndex((t) => Boolean(t.foodType));
    const openPotIdx = findOpenHotpotSlot();
    if (openPotIdx >= 0) {
      if (trayIdx >= 0) moveTrayToHotpot(trayIdx, openPotIdx);
      else startCookingInHotpot(openPotIdx, needed);
      targetPot = state.hotpots[openPotIdx];
    }
  }
  if (!targetPot) return false;

  const wasAlreadyGlazed = Boolean(targetPot.glazed);
  targetPot.glazed = true;
  targetPot.burnProgress = Math.max(0, targetPot.burnProgress - 0.35);
  state.sauceGlazedCount = (state.sauceGlazedCount || 0) + 1;
  state.guideTimer = 0;

  BunkerAudio.playSauceSizzle?.();
  sceneApi.spawnSauceSplash?.(targetPot.index);

  // If the child taps sauce_bar again when a ready pot is already glazed, auto-serve it!
  if (wasAlreadyGlazed && autoServeIfAlreadyGlazed && (targetPot.state === 'ready' || targetPot.cookProgress >= 0.65)) {
    serveFromHotpot(targetPot.index, -1);
  }
  updateTopHud();
  return true;
}

function serveMarshmallowCocoa(preferredCustIdx = -1) {
  if (state.waveFinished) return false;
  let targetCust = null;
  if (preferredCustIdx >= 0 && state.customers[preferredCustIdx]?.active) {
    targetCust = state.customers[preferredCustIdx];
  } else {
    let lowestRatio = Infinity;
    for (let i = 0; i < 3; i++) {
      const c = state.customers[i];
      if (!c.active) continue;
      const ratio = c.patience / Math.max(1, c.maxPatience);
      if (ratio < lowestRatio) {
        lowestRatio = ratio;
        targetCust = c;
      }
    }
  }
  if (!targetCust) return false;

  targetCust.patience = Math.min(targetCust.maxPatience, targetCust.patience + 6.0);
  state.coins += 15;
  state.totalCoinsAllWaves += 15;
  state.cocoaServedCount = (state.cocoaServedCount || 0) + 1;
  state.guideTimer = 0;

  BunkerAudio.playCocoaSip?.();
  sceneApi.spawnCocoaFlight?.(targetCust.slotIndex, () => {
    spawnFlyingCoins(targetCust.id, 2);
    updateTopHud();
  });
  updateTopHud();
  return true;
}

function triggerChinchillaFlute() {
  if (state.waveFinished) return false;
  state.fluteFeverTimer = 5.0;
  BunkerAudio.playChinchillaFlute();
  sceneApi.spawnFluteShockwave(state.wave >= 3);
  // Speed-boost active hotpots & cheer up customers!
  for (const pot of state.hotpots) {
    if (pot.state === 'cooking') {
      pot.cookProgress = Math.min(1.0, pot.cookProgress + 0.55);
      if (pot.cookProgress >= 1.0) {
        pot.state = 'ready';
        BunkerAudio.playHotpotReady(pot.index);
      }
      if (state.wave >= 3 && !pot.glazed) {
        pot.glazed = true;
        state.sauceGlazedCount += 1;
      }
    } else if (pot.state === 'ready') {
      pot.burnProgress = Math.max(0, pot.burnProgress - 0.35);
      if (state.wave >= 3 && !pot.glazed) {
        pot.glazed = true;
        state.sauceGlazedCount += 1;
      }
    }
  }
  for (const cust of state.customers) {
    if (cust.active) {
      cust.patience = Math.min(cust.maxPatience, cust.patience + 4.5);
    }
  }
  updateTopHud();
  return true;
}

function bonkWindowBandit() {
  if (state.waveFinished) return false;
  if (state.banditState !== 'peeking') {
    state.banditState = 'peeking';
  }
  state.banditState = 'snowman';
  state.banditTimer = 4.5;
  state.coins += 20;
  state.totalCoinsAllWaves += 20;
  BunkerAudio.playSnowballBonk();
  sceneApi.spawnSnowballFlight(() => {
    spawnFlyingCoins('window_bandit', 2);
    updateTopHud();
  });
  updateTopHud();
  return true;
}

const helperCallbacks = {
  moveTrayToHotpot,
  serveFromHotpot,
  dipHotpotInSauce: (potIdx) => dipHotpotInSauce(potIdx, false),
  vacuumFoodFromShelf,
  spawnFlyingCoins,
  updateTopHud,
  playSound: (methodName, ...args) => {
    if (typeof BunkerAudio[methodName] === 'function') {
      BunkerAudio[methodName](...args);
    }
  },
};

function checkWaveEndCondition() {
  if (state.waveFinished) return;
  const allDone = state.orderOutcomes.every((o) => o === 'served' || o === 'missed');
  if (!allDone) return;

  state.waveFinished = true;
  state.modalOpen = true;

  // Compute rank among 5 Critters (4 Rivals + Player)
  const board = [
    { id: PLAYER_CRITTER, score: state.coins, isPlayer: true },
    ...RIVAL_CRITTERS.map((id, idx) => ({ id, score: RIVAL_SCORES[idx], isPlayer: false })),
  ];
  board.sort((a, b) => b.score - a.score || (a.isPlayer ? -1 : 1));
  const playerIdx = board.findIndex((e) => e.isPlayer);
  state.playerRank = playerIdx + 1;
  state.canAdvance = state.playerRank <= 3;

  if (state.coins >= RIVAL_SCORES[0]) state.earnedStars = 3;
  else if (state.coins >= RIVAL_SCORES[1]) state.earnedStars = 2;
  else if (state.coins >= RIVAL_SCORES[2]) state.earnedStars = 1;
  else state.earnedStars = 0;

  BunkerAudio.playWaveEnd(state.canAdvance);
  renderWaveModal(board);
}

function renderWaveModal(board) {
  for (let s = 0; s < 3; s++) {
    modalStars[s].classList.toggle('lit', s < state.earnedStars);
  }
  modalPodiumRowEl.innerHTML = '';

  const medalColors = ['#fbbf24', '#cbd5e1', '#d97706', '#64748b', '#475569'];
  board.forEach((entry, idx) => {
    const rank = idx + 1;
    const col = document.createElement('div');
    col.className = `podium-slot rank-${rank}` + (entry.isPlayer ? (state.canAdvance ? ' player-slot' : ' player-defeat') : '');

    const avatar = document.createElement('div');
    avatar.className = 'podium-avatar-wrap';
    const img = document.createElement('img');
    img.src = `./assets/${entry.id}.png`;
    img.style.cssText = getCritterCropStyle(entry.id);
    avatar.appendChild(img);

    const pillar = document.createElement('div');
    pillar.className = 'podium-pillar';
    pillar.innerHTML = `<svg class="podium-medal-svg" viewBox="0 0 36 36"><circle cx="18" cy="18" r="14" fill="${medalColors[idx]}" stroke="#432312" stroke-width="2.5"/><path d="M18 9l2.4 5 5.5.8-4 3.9.9 5.5-4.8-2.6-4.8 2.6.9-5.5-4-3.9 5.5-.8z" fill="#fffbeb"/></svg>`;

    col.appendChild(avatar);
    col.appendChild(pillar);
    modalPodiumRowEl.appendChild(col);
  });

  btnModalNextEl.disabled = !state.canAdvance;
  waveModalBackdropEl.classList.add('open');
}

// ============================================================================
// Pointer & Touch 1:1 Direct Manipulation (Vortex Drag, Food Drag, Tap Auto-Route)
// ============================================================================

function handleStationTap(stationId) {
  if (!stationId || state.waveFinished) return false;
  if (stationId.startsWith('shelf_')) {
    const foodType = stationId.replace('shelf_', '');
    return vacuumFoodFromShelf(foodType, true);
  }
  if (stationId === 'vortex_ring') {
    // Vacuum the food needed by the first waiting customer!
    const needed = state.customers.find((c) => c.active)?.wantedFood || 'steak';
    return vacuumFoodFromShelf(needed, true);
  }
  if (stationId.startsWith('tray_')) {
    const idx = Number(stationId.replace('tray_', ''));
    return moveTrayToHotpot(idx, -1);
  }
  if (stationId.startsWith('hotpot_')) {
    const idx = Number(stationId.replace('hotpot_', ''));
    const pot = state.hotpots[idx];
    if (pot.state === 'empty') {
      // Auto-load from first matching tray slot
      const needed = state.customers.find((c) => c.active)?.wantedFood;
      let trayIdx = state.traySlots.findIndex((t) => t.foodType && t.foodType === needed);
      if (trayIdx < 0) trayIdx = state.traySlots.findIndex((t) => Boolean(t.foodType));
      if (trayIdx >= 0) return moveTrayToHotpot(trayIdx, idx);
      if (needed) return startCookingInHotpot(idx, needed);
    }
    return serveFromHotpot(idx, -1);
  }
  if (stationId === 'sauce_bar') {
    return dipHotpotInSauce(-1, true);
  }
  if (stationId === 'cocoa_station') {
    return serveMarshmallowCocoa(-1);
  }
  if (stationId === 'helper_buddy') {
    return triggerHelperBuddyTap(state, helperCallbacks);
  }
  if (stationId === 'golden_crate') {
    return triggerGoldenCrateOpen(state, helperCallbacks);
  }
  if (stationId.startsWith('customer_')) {
    const custIdx = Number(stationId.replace('customer_', ''));
    const cust = state.customers[custIdx];
    if (!cust || !cust.active) return false;
    // If a ready hotpot has what they want, serve immediately!
    for (let p = 0; p < 2; p++) {
      const pot = state.hotpots[p];
      if ((pot.state === 'ready' || pot.cookProgress >= 0.65) && pot.foodType === cust.wantedFood) {
        return serveFromHotpot(p, custIdx);
      }
    }
    // Or if a tray has it and a pot is empty, drop it into the pot!
    const trayIdx = state.traySlots.findIndex((t) => t.foodType === cust.wantedFood);
    if (trayIdx >= 0 && findOpenHotpotSlot() >= 0) {
      return moveTrayToHotpot(trayIdx, -1);
    }
    // Forgiving 5yo auto-assist: if neither hotpot nor tray has it, vacuum it from shelf!
    if (vacuumFoodFromShelf(cust.wantedFood, true)) {
      return true;
    }
    return false;
  }
  if (stationId === 'chinchilla_flute') {
    return triggerChinchillaFlute();
  }
  if (stationId === 'snowball_pile' || stationId === 'window_bandit') {
    return bonkWindowBandit();
  }
  if (stationId === 'trash_bin') {
    for (let p = 0; p < 2; p++) {
      if (state.hotpots[p].state === 'burned') {
        state.hotpots[p].state = 'empty';
        state.hotpots[p].foodType = null;
        state.hotpots[p].glazed = false;
        BunkerAudio.playBurnPuff();
        return true;
      }
    }
  }
  return false;
}

canvas.addEventListener('pointerdown', (e) => {
  if (state.waveFinished || state.modalOpen) return;
  BunkerAudio.init();
  const stationId = sceneApi.pickStationAtClientPos(e.clientX, e.clientY);
  sceneApi.screenToWorldOnTable(e.clientX, e.clientY, state.dragWorldPos);

  if (stationId === 'vortex_ring' || (stationId && stationId.startsWith('shelf_'))) {
    state.draggingVortex = true;
    state.vortexWorldPos.copy(state.dragWorldPos);
    if (stationId.startsWith('shelf_')) {
      const ft = stationId.replace('shelf_', '');
      vacuumFoodFromShelf(ft, true);
    }
    return;
  }

  if (stationId && stationId.startsWith('tray_')) {
    const idx = Number(stationId.replace('tray_', ''));
    const tray = state.traySlots[idx];
    if (tray && tray.foodType) {
      state.dragFood = {
        sourceType: 'tray',
        index: idx,
        foodType: tray.foodType,
        cooked: false,
        burned: false,
        glazed: false,
      };
      return;
    }
  }

  if (stationId && stationId.startsWith('hotpot_')) {
    const idx = Number(stationId.replace('hotpot_', ''));
    const pot = state.hotpots[idx];
    if (pot && (pot.state === 'ready' || pot.state === 'burned' || pot.cookProgress >= 0.65)) {
      state.dragFood = {
        sourceType: 'hotpot',
        index: idx,
        foodType: pot.foodType,
        cooked: pot.state === 'ready' || pot.cookProgress >= 0.65,
        burned: pot.state === 'burned',
        glazed: Boolean(pot.glazed),
      };
      return;
    }
  }

  handleStationTap(stationId);
});

window.addEventListener('pointermove', (e) => {
  if (!state.draggingVortex && !state.dragFood) return;
  sceneApi.screenToWorldOnTable(e.clientX, e.clientY, state.dragWorldPos);
  if (state.draggingVortex) {
    state.vortexWorldPos.copy(state.dragWorldPos);
    const overStation = sceneApi.pickStationAtClientPos(e.clientX, e.clientY);
    if (overStation && overStation.startsWith('shelf_')) {
      const ft = overStation.replace('shelf_', '');
      const now = performance.now();
      if (!state.vortexSweepCooldown[ft] || now - state.vortexSweepCooldown[ft] > 420) {
        state.vortexSweepCooldown[ft] = now;
        vacuumFoodFromShelf(ft, false);
      }
    } else if (overStation === 'golden_crate' && state.goldenCrateState === 'landed') {
      triggerGoldenCrateOpen(state, helperCallbacks);
    }
  }
});

window.addEventListener('pointerup', (e) => {
  if (state.draggingVortex) {
    state.draggingVortex = false;
  }
  if (state.dragFood) {
    const dropStation = sceneApi.pickStationAtClientPos(e.clientX, e.clientY);
    const df = state.dragFood;
    state.dragFood = null;

    if (df.sourceType === 'tray') {
      if (dropStation && dropStation.startsWith('hotpot_')) {
        const potIdx = Number(dropStation.replace('hotpot_', ''));
        if (!moveTrayToHotpot(df.index, potIdx)) {
          moveTrayToHotpot(df.index, -1);
        }
      } else {
        // Forgiving auto-drop into empty hotpot
        moveTrayToHotpot(df.index, -1);
      }
    } else if (df.sourceType === 'hotpot') {
      if (dropStation === 'trash_bin') {
        state.hotpots[df.index].state = 'empty';
        state.hotpots[df.index].foodType = null;
        state.hotpots[df.index].glazed = false;
        BunkerAudio.playBurnPuff();
      } else if (dropStation === 'sauce_bar') {
        dipHotpotInSauce(df.index, false);
        serveFromHotpot(df.index, -1);
      } else if (dropStation && dropStation.startsWith('customer_')) {
        const custIdx = Number(dropStation.replace('customer_', ''));
        serveFromHotpot(df.index, custIdx);
      } else {
        serveFromHotpot(df.index, -1);
      }
    }
  }
});

// UI Buttons
btnMuteEl.addEventListener('click', () => {
  const isMuted = BunkerAudio.toggleMute();
  iconSoundOnEl.style.display = isMuted ? 'none' : 'block';
  iconSoundOffEl.style.display = isMuted ? 'block' : 'none';
});

btnRestartWaveEl.addEventListener('click', () => {
  startWave(state.wave);
});

wavePillEl.addEventListener('click', () => {
  triggerChinchillaFlute();
});

btnModalReplayEl.addEventListener('click', () => {
  startWave(state.wave);
});

btnModalNextEl.addEventListener('click', () => {
  if (!state.canAdvance) return;
  const nextW = state.wave < 3 ? state.wave + 1 : 1;
  startWave(nextW);
});

// ============================================================================
// Simulation Step & Guide Hand Loop
// ============================================================================

function stepSimulation(dt) {
  state.elapsed += dt;
  if (state.waveFinished) return;

  if (state.comboTimer > 0) {
    state.comboTimer = Math.max(0, state.comboTimer - dt);
    if (state.comboTimer === 0) state.comboCount = 0;
  }

  if (state.fluteFeverTimer > 0) {
    state.fluteFeverTimer = Math.max(0, state.fluteFeverTimer - dt);
  }

  for (const tray of state.traySlots) {
    if (tray.popTimer > 0) tray.popTimer = Math.max(0, tray.popTimer - dt);
  }

  // Hotpot cooking & burning progression
  const cookSpeedMult = state.fluteFeverTimer > 0 ? 2.2 : 1.0;
  for (const pot of state.hotpots) {
    if (pot.state === 'cooking') {
      pot.cookProgress += (dt * cookSpeedMult) / COOK_DURATION;
      if (pot.cookProgress >= 1.0) {
        pot.cookProgress = 1.0;
        pot.state = 'ready';
        pot.burnProgress = 0;
        BunkerAudio.playHotpotReady(pot.index);
      }
    } else if (pot.state === 'ready') {
      pot.burnProgress += dt / BURN_DURATION;
      if (pot.burnProgress >= 1.0) {
        pot.burnProgress = 1.0;
        pot.state = 'burned';
        BunkerAudio.playBurnPuff();
      }
    }
  }

  // Step Helper Buddy & Surprise Golden Crate Events
  stepHelperAndEvents(state, dt, helperCallbacks);

  // Bandit peeking timer outside frosted window
  state.banditTimer -= dt;
  if (state.banditTimer <= 0) {
    if (state.banditState === 'peeking') {
      state.banditState = 'hidden';
      state.banditTimer = 5.0;
    } else {
      state.banditState = 'peeking';
      state.banditTimer = 9.0;
    }
  }

  // Customer patience countdown
  for (let i = 0; i < 3; i++) {
    const cust = state.customers[i];
    if (!cust.active) continue;
    cust.patience -= dt;
    if (cust.patience <= 0) {
      state.orderOutcomes[cust.orderIndex] = 'missed';
      state.comboCount = 0;
      state.comboTimer = 0;
      cust.active = false;
      fillEmptyCustomerSeats();
      checkWaveEndCondition();
    }
  }

  // Animated Guide Hand for idle 5yo assistance
  state.guideTimer += dt;
  if (state.guideTimer > 3.2 && !state.draggingVortex && !state.dragFood) {
    const readyPot = state.hotpots.find((p) => p.state === 'ready');
    const filledTray = state.traySlots.find((t) => Boolean(t.foodType));
    let targetSid = 'vortex_ring';
    if (state.goldenCrateState === 'landed') targetSid = 'golden_crate';
    else if (readyPot && !readyPot.glazed) targetSid = 'sauce_bar';
    else if (readyPot) targetSid = readyPot.id;
    else if (filledTray && findOpenHotpotSlot() >= 0) targetSid = filledTray.id;
    const pt = sceneApi.getStationScreenRect(targetSid);
    guideHandEl.style.transform = `translate3d(${pt.x - 12}px, ${pt.y - 8}px, 0)`;
    guideHandEl.classList.add('visible');
  } else {
    guideHandEl.classList.remove('visible');
  }

  updateTopHud();
}

let lastFrameTs = performance.now();
function animate(now) {
  const dt = Math.max(0.001, Math.min(0.05, (now - lastFrameTs) / 1000));
  lastFrameTs = now;
  stepSimulation(dt);
  sceneApi.syncAndRender(state, dt, state.elapsed);
  requestAnimationFrame(animate);
}

startWave(1);
requestAnimationFrame(animate);

// ============================================================================
// Automated Verification & Bot Balance Harness (window.__gameTest)
// ============================================================================
window.__gameTest = {
  getState() {
    return {
      wave: state.wave,
      waveTheme: state.waveTheme,
      coins: state.coins,
      comboCount: state.comboCount,
      fluteFeverTimer: state.fluteFeverTimer,
      sauceGlazedCount: state.sauceGlazedCount,
      cocoaServedCount: state.cocoaServedCount,
      helperActionsCount: state.helperActionsCount,
      goldenCrateOpened: state.goldenCrateOpened,
      goldenCrateState: state.goldenCrateState,
      banditState: state.banditState,
      waveFinished: state.waveFinished,
      modalOpen: state.modalOpen,
      canAdvance: state.canAdvance,
      playerRank: state.playerRank,
      earnedStars: state.earnedStars,
      orderOutcomes: [...state.orderOutcomes],
      traySlots: state.traySlots.map((t) => ({ id: t.id, foodType: t.foodType })),
      hotpots: state.hotpots.map((p) => ({
        id: p.id,
        state: p.state,
        foodType: p.foodType,
        glazed: Boolean(p.glazed),
        cookProgress: Number(p.cookProgress.toFixed(2)),
      })),
      customers: state.customers.map((c) => ({
        id: c.id,
        active: c.active,
        friend: c.friend,
        wantedFood: c.wantedFood,
        patience: Number(c.patience.toFixed(1)),
      })),
    };
  },
  stepTime(ms = 1000) {
    const step = 1 / 60;
    let rem = ms / 1000;
    while (rem > 0) {
      const d = Math.min(step, rem);
      stepSimulation(d);
      rem -= d;
    }
    sceneApi.syncAndRender(state, 1 / 60, state.elapsed);
    return this.getState();
  },
  vacuumFood(foodType = 'steak') {
    const ok = vacuumFoodFromShelf(foodType, true);
    sceneApi.syncAndRender(state, 1 / 60, state.elapsed);
    return ok;
  },
  cookTraySlot(trayIdx = 0, potIdx = -1) {
    const ok = moveTrayToHotpot(trayIdx, potIdx);
    sceneApi.syncAndRender(state, 1 / 60, state.elapsed);
    return ok;
  },
  serveHotpot(potIdx = 0, custIdx = -1) {
    const ok = serveFromHotpot(potIdx, custIdx);
    sceneApi.syncAndRender(state, 1 / 60, state.elapsed);
    return ok;
  },
  dipSauce(potIdx = -1) {
    const ok = dipHotpotInSauce(potIdx, false);
    sceneApi.syncAndRender(state, 1 / 60, state.elapsed);
    return ok;
  },
  serveCocoa(custIdx = -1) {
    const ok = serveMarshmallowCocoa(custIdx);
    sceneApi.syncAndRender(state, 1 / 60, state.elapsed);
    return ok;
  },
  tapHelperBuddy() {
    const ok = triggerHelperBuddyTap(state, helperCallbacks);
    sceneApi.syncAndRender(state, 1 / 60, state.elapsed);
    return ok;
  },
  openGoldenCrate() {
    const ok = triggerGoldenCrateOpen(state, helperCallbacks);
    sceneApi.syncAndRender(state, 1 / 60, state.elapsed);
    return ok;
  },
  playFlute() {
    return triggerChinchillaFlute();
  },
  bonkBandit() {
    return bonkWindowBandit();
  },
  autoPlayCustomer(custSlot = 0) {
    if (state.waveFinished) return true;
    const cust = (state.customers[custSlot] && state.customers[custSlot].active)
      ? state.customers[custSlot]
      : state.customers.find((c) => c.active);
    if (!cust || !cust.active) return state.waveFinished;
    const food = cust.wantedFood;
    let potIdx = findOpenHotpotSlot();
    if (potIdx < 0) {
      state.hotpots[0].state = 'empty';
      potIdx = 0;
    }
    startCookingInHotpot(potIdx, food);
    this.stepTime(2350);
    if (state.waveFinished) return true;
    const pot = state.hotpots[potIdx];
    const anyMatchesPot = pot.state !== 'empty' && state.customers.some((c) => c.active && c.wantedFood === pot.foodType);
    if (!anyMatchesPot) {
      const nextCust = (state.customers[custSlot] && state.customers[custSlot].active)
        ? state.customers[custSlot]
        : state.customers.find((c) => c.active);
      if (nextCust) {
        pot.state = 'ready';
        pot.cookProgress = 1.0;
        pot.burnProgress = 0;
        pot.foodType = nextCust.wantedFood;
      }
    }
    return serveFromHotpot(potIdx, cust.slotIndex) || serveFromHotpot(potIdx, -1) || state.waveFinished;
  },
  forceWaveComplete(mockCoins = 260) {
    state.coins = mockCoins;
    state.orderOutcomes = new Array(8).fill('served');
    checkWaveEndCondition();
    sceneApi.syncAndRender(state, 1 / 60, state.elapsed);
    return this.getState();
  },
  restartWave(waveNum = 1) {
    startWave(waveNum);
    sceneApi.syncAndRender(state, 1 / 60, state.elapsed);
    return this.getState();
  },
};
