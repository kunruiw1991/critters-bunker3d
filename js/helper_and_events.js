/**
 * Critter Cozy Bunker 3D - Pillar 2: Friendly Sous-Chef Helper Buddy,
 * Golden Mystery Supply Crate Drop & Non-IBL Material Hygiene
 */

import { buildPickyPiggyPlushModel } from '../models/picky_piggy_model.js';
import { BunkerAudio } from './audio.js';

/**
 * Traverses a Three.js object hierarchy and clamps any material metalness > 0.22
 * down to 0.22 when scene.environment === null so non-IBL meshes never render dark.
 */
export function enforceNonIblMaterialHygiene(root) {
  if (!root || typeof root.traverse !== 'function') return;
  root.traverse((obj) => {
    if (obj.isMesh && obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if (m && typeof m.metalness === 'number' && m.metalness > 0.22) {
          m.metalness = 0.22;
        }
      }
    }
  });
}

/**
 * Builds the 3D Picky Piggy Sous-Chef Helper Buddy (-2.35, 0.36, 1.85) and
 * the 3D Golden Mystery Supply Crate (0.0, 0.42, 1.82).
 * Supports both (THREE, scene, worldGroup) and (THREE, worldGroup, stationCoords) signatures.
 */
export function createBunkerHelperAndEvents(THREE, sceneOrWorldGroup, worldGroupOrCoords) {
  const parentGroup = (worldGroupOrCoords && typeof worldGroupOrCoords.add === 'function')
    ? worldGroupOrCoords
    : (sceneOrWorldGroup && typeof sceneOrWorldGroup.add === 'function' ? sceneOrWorldGroup : null);

  // ==========================================================================
  // 1. 3D Picky Piggy Sous-Chef Helper Buddy at (-2.35, 0.36, 1.85)
  // ==========================================================================
  const helperGroup = new THREE.Group();
  helperGroup.name = 'PickyPiggy_SousChef_HelperBuddy';
  helperGroup.position.set(-2.35, 0.36, 1.85);
  if (parentGroup) parentGroup.add(helperGroup);

  // Wooden sous-chef pedestal mat
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x7c4a2d,
    roughness: 0.65,
    metalness: 0.08,
  });
  const pedestalRimMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xb45309,
    emissiveIntensity: 0.25,
    roughness: 0.32,
    metalness: 0.20,
  });

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.40, 0.08, 24), pedestalMat);
  pedestal.position.y = -0.18;
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  helperGroup.add(pedestal);

  const pedestalRim = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.025, 12, 32), pedestalRimMat);
  pedestalRim.rotation.x = Math.PI * 0.5;
  pedestalRim.position.y = -0.14;
  helperGroup.add(pedestalRim);

  // Pulsing Golden Helper Aura Ring
  const helperAuraMat = new THREE.MeshBasicMaterial({
    color: 0xfde047,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.55,
  });
  const helperAuraRing = new THREE.Mesh(new THREE.RingGeometry(0.38, 0.48, 32), helperAuraMat);
  helperAuraRing.rotation.x = -Math.PI * 0.5;
  helperAuraRing.position.y = -0.13;
  helperGroup.add(helperAuraRing);

  // Build Picky Piggy 3D Plush Model
  const pickyModel = buildPickyPiggyPlushModel(THREE);
  pickyModel.root.scale.setScalar(0.38);
  pickyModel.root.position.set(0, -0.14, 0);
  pickyModel.root.rotation.y = 0.42;
  helperGroup.add(pickyModel.root);

  // 3D White Chef Toque Hat on Picky's head
  const toqueGroup = new THREE.Group();
  toqueGroup.name = 'SousChef_Toque_Hat';
  const hatWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.55,
    metalness: 0.02,
  });
  const hatBandMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xb45309,
    emissiveIntensity: 0.20,
    roughness: 0.35,
    metalness: 0.18,
  });

  const hatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.18, 20), hatWhiteMat);
  hatBase.castShadow = true;
  toqueGroup.add(hatBase);

  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.225, 0.05, 20), hatBandMat);
  hatBand.position.y = -0.06;
  toqueGroup.add(hatBand);

  const puffPositions = [
    [0, 0.14, 0, 0.19],
    [-0.12, 0.12, 0.06, 0.14],
    [0.12, 0.12, 0.06, 0.14],
    [-0.10, 0.12, -0.08, 0.14],
    [0.10, 0.12, -0.08, 0.14],
  ];
  for (const [px, py, pz, pr] of puffPositions) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(pr, 14, 12), hatWhiteMat);
    puff.position.set(px, py, pz);
    puff.castShadow = true;
    toqueGroup.add(puff);
  }

  if (pickyModel.headGroup) {
    toqueGroup.position.set(0, 0.46, 0.02);
    pickyModel.headGroup.add(toqueGroup);
  } else {
    toqueGroup.position.set(0, 0.72, 0);
    toqueGroup.scale.setScalar(0.38);
    helperGroup.add(toqueGroup);
  }

  // Cute wooden tasting spoon in Picky's right arm
  const spoonWoodMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.48,
    metalness: 0.08,
  });
  const spoonGroup = new THREE.Group();
  const spoonShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 10), spoonWoodMat);
  spoonShaft.position.y = 0.18;
  spoonGroup.add(spoonShaft);
  const spoonBowl = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), spoonWoodMat);
  spoonBowl.scale.set(1.0, 1.25, 0.55);
  spoonBowl.position.y = 0.40;
  spoonGroup.add(spoonBowl);

  if (pickyModel.rightArmGroup) {
    spoonGroup.position.set(0.06, -0.18, 0.14);
    spoonGroup.rotation.x = 0.85;
    pickyModel.rightArmGroup.add(spoonGroup);
  }

  // Orbiting Turbo Star Gems around Helper Buddy
  const turboStarsGroup = new THREE.Group();
  turboStarsGroup.position.y = 0.35;
  helperGroup.add(turboStarsGroup);

  const starGemMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.55,
    roughness: 0.22,
    metalness: 0.20,
  });
  for (let i = 0; i < 4; i++) {
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), starGemMat);
    const ang = (i / 4) * Math.PI * 2;
    gem.position.set(Math.cos(ang) * 0.46, 0, Math.sin(ang) * 0.46);
    turboStarsGroup.add(gem);
  }

  // ==========================================================================
  // 2. 3D Golden Mystery Supply Crate at (0.0, 0.42, 1.82)
  // ==========================================================================
  const crateGroup = new THREE.Group();
  crateGroup.name = 'Golden_Mystery_Supply_Crate';
  crateGroup.position.set(0.0, 0.42, 1.82);
  if (parentGroup) parentGroup.add(crateGroup);

  const crateInner = new THREE.Group();
  crateGroup.add(crateInner);

  const goldCrateMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xb45309,
    emissiveIntensity: 0.28,
    roughness: 0.26,
    metalness: 0.22,
  });
  const purpleRibbonMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0x6b21a8,
    emissiveIntensity: 0.35,
    roughness: 0.30,
    metalness: 0.16,
  });

  const crateBox = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.30, 0.38), goldCrateMat);
  crateBox.castShadow = true;
  crateBox.receiveShadow = true;
  crateInner.add(crateBox);

  const crateLid = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.42), goldCrateMat);
  crateLid.position.y = 0.16;
  crateLid.castShadow = true;
  crateInner.add(crateLid);

  const ribbonX = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.32, 0.09), purpleRibbonMat);
  ribbonX.position.y = 0.02;
  crateInner.add(ribbonX);

  const ribbonZ = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.32, 0.43), purpleRibbonMat);
  ribbonZ.position.y = 0.02;
  crateInner.add(ribbonZ);

  // Top Star Crest on Golden Crate
  const topStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), starGemMat);
  topStar.position.y = 0.28;
  crateInner.add(topStar);

  // Rotating Star Halo around Golden Crate
  const crateHaloGroup = new THREE.Group();
  crateGroup.add(crateHaloGroup);

  const crateHaloMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.72,
  });
  const crateHaloRing = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.41, 32), crateHaloMat);
  crateHaloRing.rotation.x = -Math.PI * 0.5;
  crateHaloRing.position.y = -0.14;
  crateHaloGroup.add(crateHaloRing);

  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.048, 0), starGemMat);
    const a = (i / 6) * Math.PI * 2;
    s.position.set(Math.cos(a) * 0.36, 0.04, Math.sin(a) * 0.36);
    crateHaloGroup.add(s);
  }

  enforceNonIblMaterialHygiene(helperGroup);
  enforceNonIblMaterialHygiene(crateGroup);

  function syncHelperAndEvents(state, dt, elapsed = 0) {
    if (!state) return;

    // 1. Animate Picky Piggy Sous-Chef Helper Buddy
    const turbo = (state.helperTurboTimer || 0) > 0;
    const jumpT = state.helperJumpTimer || 0;
    const bounceSpeed = turbo ? 12.0 : 4.2;
    const bounceAmp = turbo ? 0.08 : 0.035;
    const jumpArc = jumpT > 0 ? Math.sin((jumpT / 0.75) * Math.PI) * 0.26 : 0;

    pickyModel.root.position.y = -0.14 + Math.abs(Math.sin(elapsed * bounceSpeed)) * bounceAmp + jumpArc;
    pickyModel.root.rotation.y = 0.42 + Math.sin(elapsed * (turbo ? 6.5 : 2.2)) * 0.18 + (jumpT > 0 ? (1 - jumpT / 0.75) * Math.PI * 2 : 0);

    if (pickyModel.rightArmGroup) {
      pickyModel.rightArmGroup.rotation.x = -0.45 + Math.sin(elapsed * (turbo ? 14.0 : 5.0)) * 0.35;
    }
    if (pickyModel.leftArmGroup) {
      pickyModel.leftArmGroup.rotation.x = -0.25 - Math.sin(elapsed * (turbo ? 14.0 : 5.0)) * 0.25;
    }

    helperAuraRing.scale.setScalar(1.0 + Math.sin(elapsed * 5.0) * 0.08);
    helperAuraMat.opacity = turbo ? 0.85 : 0.45 + Math.sin(elapsed * 4.0) * 0.15;
    helperAuraMat.color.setHex(turbo ? 0xc084fc : 0xfde047);

    turboStarsGroup.visible = turbo || jumpT > 0;
    turboStarsGroup.rotation.y = elapsed * 4.8;

    // 2. Animate Golden Mystery Supply Crate
    const isCrateVisible = Boolean(state.crateActive || state.goldenCrateActive);
    const popT = state.cratePopTimer || 0;

    if (isCrateVisible) {
      crateGroup.visible = true;
      crateInner.position.y = Math.sin(elapsed * 4.5) * 0.06;
      crateInner.rotation.y = Math.sin(elapsed * 2.4) * 0.35;
      crateInner.scale.setScalar(1.0 + Math.sin(elapsed * 5.2) * 0.05);
      topStar.rotation.y = elapsed * 3.8;
      crateHaloGroup.rotation.y = -elapsed * 2.6;
      crateHaloMat.opacity = 0.65 + Math.sin(elapsed * 6.0) * 0.22;
    } else if (popT > 0) {
      crateGroup.visible = true;
      const u = 1.0 - popT / 0.65;
      crateInner.scale.setScalar(Math.max(0.01, 1.0 + Math.sin(u * Math.PI) * 0.45 - u * 0.95));
      crateInner.position.y = u * 0.42;
      crateInner.rotation.y += dt * 14.0;
      crateHaloGroup.scale.setScalar(1.0 + u * 1.6);
      crateHaloMat.opacity = Math.max(0, (1 - u) * 0.85);
    } else {
      crateGroup.visible = false;
      crateHaloGroup.scale.setScalar(1.0);
    }
  }

  return {
    helperGroup,
    crateGroup,
    syncHelperAndEvents,
    sync: syncHelperAndEvents,
  };
}

/**
 * Returns initial state properties for Pillar 2 Helper Buddy & Golden Mystery Crate.
 */
export function createHelperAndEventsState() {
  return {
    helperTimer: 0,
    helperTurboTimer: 0,
    helperCooldown: 5.5,
    helperActionsCount: 0,
    crateActive: true,
    goldenCrateActive: true,
    crateSpawnTimer: 3.5,
    goldenCrateCooldown: 0,
    goldenCrateOpened: 0,
    helperJumpTimer: 0,
    cratePopTimer: 0,
  };
}

/**
 * Executes one Sous-Chef Helper Buddy action:
 * 1) Cleans any burned hotpot into +5 bonus coins
 * 2) Auto-glazes & serves any ready hotpot at burnProgress > 0.45 (or any ready hotpot on manual tap)
 * 3) Loads a needed tray item into an empty hotpot (or vacuums a needed item)
 */
function performHelperAssist(state, callbacks = {}, isManualTap = false) {
  if (!state || state.waveFinished) return false;

  const hotpots = state.hotpots || [];
  const traySlots = state.traySlots || [];
  const customers = state.customers || [];

  // Priority 1: Clean any burned hotpot into +5 sparkle coins
  for (let i = 0; i < hotpots.length; i++) {
    const pot = hotpots[i];
    if (pot && pot.state === 'burned') {
      pot.state = 'empty';
      pot.foodType = null;
      pot.cookProgress = 0;
      pot.burnProgress = 0;
      pot.glazed = false;
      state.coins = (state.coins || 0) + 5;
      state.totalCoinsAllWaves = (state.totalCoinsAllWaves || 0) + 5;
      state.helperActionsCount = (state.helperActionsCount || 0) + 1;
      state.helperJumpTimer = 0.65;
      BunkerAudio.playHelperCheer();
      callbacks.spawnFlyingCoins?.('helper_buddy', 2);
      callbacks.updateTopHud?.();
      return true;
    }
  }

  // Priority 2: Auto-glaze & serve any ready hotpot approaching burn (> 0.45) or on manual tap
  for (let i = 0; i < hotpots.length; i++) {
    const pot = hotpots[i];
    if (pot && pot.state === 'ready' && (isManualTap || pot.burnProgress > 0.45)) {
      if (!pot.glazed) {
        pot.glazed = true;
        state.sauceGlazedCount = (state.sauceGlazedCount || 0) + 1;
      }
      pot.burnProgress = 0;
      if (typeof callbacks.serveFromHotpot === 'function') {
        callbacks.serveFromHotpot(i, -1);
      }
      state.helperActionsCount = (state.helperActionsCount || 0) + 1;
      state.helperJumpTimer = 0.65;
      BunkerAudio.playHelperCheer();
      callbacks.updateTopHud?.();
      return true;
    }
  }

  // Priority 3: Load a needed tray item into an empty hotpot
  const emptyPotIdx = hotpots.findIndex((p) => p && p.state === 'empty');
  if (emptyPotIdx >= 0) {
    const neededFoods = customers.filter((c) => c && c.active).map((c) => c.wantedFood);
    let trayIdx = traySlots.findIndex((t) => t && t.foodType && neededFoods.includes(t.foodType));
    if (trayIdx < 0) {
      trayIdx = traySlots.findIndex((t) => t && Boolean(t.foodType));
    }
    if (trayIdx >= 0) {
      if (typeof callbacks.moveTrayToHotpot === 'function') {
        callbacks.moveTrayToHotpot(trayIdx, emptyPotIdx);
      } else {
        const food = traySlots[trayIdx].foodType;
        traySlots[trayIdx].foodType = null;
        hotpots[emptyPotIdx].state = 'cooking';
        hotpots[emptyPotIdx].foodType = food;
        hotpots[emptyPotIdx].cookProgress = 0;
        hotpots[emptyPotIdx].burnProgress = 0;
      }
      state.helperActionsCount = (state.helperActionsCount || 0) + 1;
      state.helperJumpTimer = 0.65;
      BunkerAudio.playHelperCheer();
      callbacks.updateTopHud?.();
      return true;
    }
  }

  // Priority 4: Speed-boost any cooking hotpot & top up customer patience
  for (let i = 0; i < hotpots.length; i++) {
    const pot = hotpots[i];
    if (pot && pot.state === 'cooking') {
      pot.cookProgress = Math.min(1.0, pot.cookProgress + 0.35);
      if (pot.cookProgress >= 1.0) {
        pot.state = 'ready';
        pot.burnProgress = 0;
      }
      state.helperActionsCount = (state.helperActionsCount || 0) + 1;
      state.helperJumpTimer = 0.65;
      BunkerAudio.playHelperCheer();
      callbacks.updateTopHud?.();
      return true;
    }
  }

  return false;
}

/**
 * Advances Pillar 2 Sous-Chef Helper Buddy & Golden Mystery Supply Crate timers.
 */
export function stepHelperAndEvents(state, dt, callbacks = {}) {
  if (!state || state.waveFinished) return;

  if (state.helperTurboTimer > 0) {
    state.helperTurboTimer = Math.max(0, state.helperTurboTimer - dt);
  }
  if (state.helperJumpTimer > 0) {
    state.helperJumpTimer = Math.max(0, state.helperJumpTimer - dt);
  }
  if (state.cratePopTimer > 0) {
    state.cratePopTimer = Math.max(0, state.cratePopTimer - dt);
  }

  // Emergency burn-prevention check every frame for ready hotpots > 0.45 burnProgress
  if (Array.isArray(state.hotpots)) {
    for (let i = 0; i < state.hotpots.length; i++) {
      const pot = state.hotpots[i];
      if (pot && pot.state === 'ready' && pot.burnProgress > 0.45) {
        performHelperAssist(state, callbacks, false);
        break;
      }
    }
  }

  const assistInterval = state.helperTurboTimer > 0 ? 2.0 : 5.5;
  state.helperTimer = (state.helperTimer || 0) + dt;
  if (state.helperTimer >= assistInterval) {
    state.helperTimer = 0;
    performHelperAssist(state, callbacks, false);
  }

  if (!state.crateActive && !state.goldenCrateActive) {
    state.crateSpawnTimer = (typeof state.crateSpawnTimer === 'number' ? state.crateSpawnTimer : 3.5) - dt;
    if (state.crateSpawnTimer <= 0) {
      state.crateActive = true;
      state.goldenCrateActive = true;
      state.crateSpawnTimer = 3.5;
      state.goldenCrateCooldown = 0;
    }
  }
}

/**
 * Tapping Picky Piggy Sous-Chef Helper Buddy grants +12 coins, activates 6.0s Turbo Mode,
 * performs an immediate assist, increments helperActionsCount, and plays cheerful kalimba audio.
 */
export function triggerHelperBuddyTap(state, callbacks = {}) {
  if (!state || state.waveFinished) return false;

  state.coins = (state.coins || 0) + 12;
  state.totalCoinsAllWaves = (state.totalCoinsAllWaves || 0) + 12;
  state.helperTurboTimer = 6.0;
  state.helperJumpTimer = 0.75;

  const prevCount = state.helperActionsCount || 0;
  performHelperAssist(state, callbacks, true);
  if ((state.helperActionsCount || 0) === prevCount) {
    state.helperActionsCount = prevCount + 1;
  }

  BunkerAudio.playHelperCheer();
  callbacks.spawnFlyingCoins?.('helper_buddy', 2);
  callbacks.updateTopHud?.();
  return true;
}

/**
 * Opening the Golden Mystery Supply Crate grants +30 bonus coins, fills empty tray slots
 * with active customers' wanted foods, triggers 5.0s Flute Fever, and plays glockenspiel fanfare.
 */
export function triggerGoldenCrateOpen(state, callbacks = {}) {
  if (!state || state.waveFinished) return false;

  state.coins = (state.coins || 0) + 30;
  state.totalCoinsAllWaves = (state.totalCoinsAllWaves || 0) + 30;
  state.fluteFeverTimer = 5.0;
  state.goldenCrateOpened = (state.goldenCrateOpened || 0) + 1;
  state.crateActive = false;
  state.goldenCrateActive = false;
  state.crateSpawnTimer = 10.0;
  state.goldenCrateCooldown = 10.0;
  state.cratePopTimer = 0.65;

  // Fill any empty tray slots with active customers' wanted foods
  const wantedQueue = (state.customers || [])
    .filter((c) => c && c.active && c.wantedFood)
    .map((c) => c.wantedFood);
  const fallbackFoods = ['steak', 'lobster', 'cheese', 'cake'];
  let qIdx = 0;

  if (Array.isArray(state.traySlots)) {
    for (let i = 0; i < state.traySlots.length; i++) {
      const slot = state.traySlots[i];
      if (slot && !slot.foodType) {
        slot.foodType = wantedQueue[qIdx] || fallbackFoods[i % fallbackFoods.length];
        slot.popTimer = 0.38;
        qIdx += 1;
      }
    }
  }

  // Cheer up waiting customers with +3.5s patience bonus
  if (Array.isArray(state.customers)) {
    for (const cust of state.customers) {
      if (cust && cust.active) {
        cust.patience = Math.min(cust.maxPatience, cust.patience + 3.5);
      }
    }
  }

  BunkerAudio.playGoldenCrateFanfare();
  callbacks.spawnFlyingCoins?.('golden_crate', 4);
  callbacks.updateTopHud?.();
  return true;
}
