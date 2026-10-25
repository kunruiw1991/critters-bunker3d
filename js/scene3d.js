import * as THREE from '../models/three.module.min.js';
import { buildCatNapPlushModel } from '../models/catnap_model.js';
import { buildDogDayPlushModel } from '../models/dogday_model.js';
import { buildBabaChopsPlushModel } from '../models/baba_chops_model.js';
import { buildHoppyHopscotchPlushModel } from '../models/hoppy_hopscotch_model.js';
import { buildCraftyCornPlushModel } from '../models/craftycorn_model.js';
import { buildBubbaBubbaphantPlushModel } from '../models/bubba_bubbaphant_model.js';
import { buildKickinChickenPlushModel } from '../models/kickin_chicken_model.js';
import { buildBobbyBearHugPlushModel } from '../models/bobby_bearhug_model.js';
import {
  enforceNonIblMaterialHygiene,
  createBunkerHelperAndEvents,
} from './helper_and_events.js';

export const WAVE_THEMES = {
  1: 'cozy_amber_cabin',
  2: 'aurora_ice_lantern_party',
  3: 'grand_golden_royal_banquet',
};

export const FOOD_TYPES = [
  'steak',
  'lobster',
  'cheese',
  'cake',
  'skewer',
  'corn',
];

export const STATION_IDS = [
  'shelf_steak',
  'shelf_lobster',
  'shelf_cheese',
  'shelf_cake',
  'shelf_skewer',
  'shelf_corn',
  'vortex_ring',
  'tray_0',
  'tray_1',
  'tray_2',
  'tray_3',
  'hotpot_0',
  'hotpot_1',
  'sauce_bar',
  'cocoa_station',
  'helper_buddy',
  'golden_crate',
  'chinchilla_flute',
  'snowball_pile',
  'window_bandit',
  'trash_bin',
  'customer_0',
  'customer_1',
  'customer_2',
];

export const STATION_COORDS = {
  shelf_steak: new THREE.Vector3(-3.65, 0.72, -0.55),
  shelf_lobster: new THREE.Vector3(-2.55, 0.72, -0.55),
  shelf_cheese: new THREE.Vector3(-3.65, 0.42, 0.48),
  shelf_cake: new THREE.Vector3(-2.55, 0.42, 0.48),
  shelf_skewer: new THREE.Vector3(-3.65, 0.18, 1.52),
  shelf_corn: new THREE.Vector3(-2.55, 0.18, 1.52),
  vortex_ring: new THREE.Vector3(-1.35, 0.56, 1.85),
  tray_0: new THREE.Vector3(-1.35, 0.18, 0.85),
  tray_1: new THREE.Vector3(-0.55, 0.18, 0.85),
  tray_2: new THREE.Vector3(-1.35, 0.18, -0.05),
  tray_3: new THREE.Vector3(-0.55, 0.18, -0.05),
  hotpot_0: new THREE.Vector3(0.55, 0.48, 0.55),
  hotpot_1: new THREE.Vector3(1.65, 0.48, 0.55),
  sauce_bar: new THREE.Vector3(-0.05, 0.22, 1.72),
  cocoa_station: new THREE.Vector3(2.35, 0.26, -0.35),
  helper_buddy: new THREE.Vector3(-2.35, 0.36, 1.85),
  golden_crate: new THREE.Vector3(0.0, 0.42, 1.82),
  chinchilla_flute: new THREE.Vector3(3.32, 0.42, 0.15),
  snowball_pile: new THREE.Vector3(3.25, 0.22, 1.55),
  trash_bin: new THREE.Vector3(2.25, 0.22, 1.95),
  window_bandit: new THREE.Vector3(0.45, 1.48, -2.85),
  customer_0: new THREE.Vector3(-2.35, 0.78, -1.75),
  customer_1: new THREE.Vector3(0.15, 0.78, -1.85),
  customer_2: new THREE.Vector3(2.55, 0.78, -1.75),
};

const CRITTER_PAW_COLORS = {
  baba: 0x9ca0aa,
  catnap: 0x8a5cf5,
  dogday: 0xf78c2a,
  hoppy: 0x4cc970,
  craftycorn: 0x72efdd,
  picky: 0xff8fab,
  bubba: 0x4ea8de,
  kickin: 0xffd166,
};

export const CRITTER_CROP_BOXES = {
  baba: [0.04, 0.02, 0.92, 0.96],
  craftycorn: [0.12, 0.03, 0.76, 0.92],
  dogday: [0.49, 0.11, 0.25, 0.43],
  catnap: [0.51, 0.17, 0.20, 0.51],
  hoppy: [0.25, 0.06, 0.26, 0.58],
  picky: [0.24, 0.20, 0.24, 0.43],
  bubba: [0.22, 0.10, 0.25, 0.56],
  kickin: [0.31, 0.22, 0.18, 0.58],
};

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function disposeMeshTree(obj, disposeMaterials = true) {
  if (!obj) return;
  obj.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) child.geometry.dispose();
      if (disposeMaterials && child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }
  });
}

function createCritterStandeeTexture(critterId) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  function drawFrame(img) {
    ctx.clearRect(0, 0, 256, 256);
    ctx.save();
    drawRoundedRectPath(ctx, 12, 10, 232, 236, 56);
    ctx.fillStyle = '#5c3d2e';
    ctx.fill();

    drawRoundedRectPath(ctx, 18, 16, 220, 224, 50);
    ctx.fillStyle = '#f2cc8f';
    ctx.fill();

    drawRoundedRectPath(ctx, 25, 23, 206, 210, 44);
    ctx.fillStyle = '#faf3eb';
    ctx.fill();
    ctx.clip();

    const grad = ctx.createRadialGradient(128, 122, 16, 128, 128, 110);
    grad.addColorStop(0, '#fffdf9');
    grad.addColorStop(1, '#f4e1c6');
    ctx.fillStyle = grad;
    ctx.fillRect(25, 23, 206, 210);

    if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
      const [ux, uy, uw, uh] = CRITTER_CROP_BOXES[critterId] || [0.1, 0.05, 0.8, 0.85];
      const sx = Math.max(0, Math.floor(ux * img.naturalWidth));
      const sy = Math.max(0, Math.floor(uy * img.naturalHeight));
      const sw = Math.max(1, Math.floor(uw * img.naturalWidth));
      const sh = Math.max(1, Math.floor(uh * img.naturalHeight));

      ctx.save();
      ctx.filter = 'brightness(1.22) contrast(1.12) saturate(1.32)';
      ctx.drawImage(img, sx, sy, sw, sh, 25, 23, 206, 210);
      ctx.restore();
    } else {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(128, 128, 64, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    tex.needsUpdate = true;
  }

  drawFrame(null);
  if (typeof Image !== 'undefined') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => drawFrame(img);
    img.src = `./assets/${critterId}.png`;
  }
  return tex;
}

/**
 * Builds a high-contrast, unmistakable 3D food toy mesh for each of the 6 supplies.
 */
export function buildFoodItemMesh(foodType, cooked = false, burned = false, glazed = false) {
  const group = new THREE.Group();
  group.userData.foodType = foodType;
  group.userData.glazed = glazed;

  const tintBurn = (hex) => {
    if (burned) return 0x29201b;
    if (cooked) {
      const c = new THREE.Color(hex);
      c.offsetHSL(0.01, 0.08, 0.04);
      return c.getHex();
    }
    return hex;
  };

  if (foodType === 'steak') {
    // Tomahawk Ribeye Steak: thick marbled red meat slab + white bone handle + grill marks when cooked
    const meatMat = new THREE.MeshStandardMaterial({
      color: tintBurn(cooked ? 0xb45309 : 0xe11d48),
      roughness: cooked ? 0.38 : 0.48,
      metalness: 0.05,
    });
    const fatMat = new THREE.MeshStandardMaterial({
      color: tintBurn(0xfffbeb),
      roughness: 0.42,
    });
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.27, 0.11, 20), meatMat);
    slab.scale.set(1.18, 1, 0.88);
    slab.position.y = 0.06;
    slab.castShadow = true;
    group.add(slab);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.038, 10, 20), fatMat);
    rim.rotation.x = Math.PI * 0.5;
    rim.scale.set(1.16, 0.86, 1);
    rim.position.y = 0.08;
    group.add(rim);

    const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.34, 10), fatMat);
    bone.rotation.z = Math.PI * 0.46;
    bone.position.set(0.26, 0.07, 0.04);
    group.add(bone);

    const boneKnob = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 10), fatMat);
    boneKnob.position.set(0.41, 0.08, 0.05);
    group.add(boneKnob);

    if (cooked && !burned) {
      const searMat = new THREE.MeshBasicMaterial({ color: 0x451a03 });
      for (let i = -1; i <= 1; i++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.015, 0.025), searMat);
        bar.position.set(0, 0.12, i * 0.07);
        bar.rotation.y = 0.35;
        group.add(bar);
      }
    }
  } else if (foodType === 'lobster') {
    // Giant Red Lobster: glossy crimson segmented shell + 2 big pincer claws + tail fan
    const shellMat = new THREE.MeshStandardMaterial({
      color: tintBurn(cooked ? 0xff3b1f : 0xdc2626),
      roughness: 0.24,
      metalness: 0.12,
    });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 14), shellMat);
    body.scale.set(1.35, 0.62, 0.82);
    body.position.y = 0.08;
    body.castShadow = true;
    group.add(body);

    for (let s = -1; s <= 1; s += 2) {
      const claw = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), shellMat);
      claw.scale.set(1.45, 0.65, 0.9);
      claw.position.set(0.25, 0.09, s * 0.16);
      claw.rotation.y = -s * 0.35;
      group.add(claw);
    }
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.22, 10), shellMat);
    tail.rotation.z = Math.PI * 0.5;
    tail.position.set(-0.26, 0.07, 0);
    group.add(tail);
  } else if (foodType === 'cheese') {
    // Golden Swiss Cheese Wheel: bright sunny gold cylinder/wedge with dimples
    const cheeseMat = new THREE.MeshStandardMaterial({
      color: tintBurn(cooked ? 0xfbbf24 : 0xfacc15),
      roughness: 0.36,
      metalness: 0.04,
    });
    const holeMat = new THREE.MeshStandardMaterial({
      color: tintBurn(0xd97706),
      roughness: 0.5,
    });
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.26, 0.14, 22), cheeseMat);
    wheel.position.y = 0.07;
    wheel.castShadow = true;
    group.add(wheel);

    const holeOffsets = [
      [-0.08, 0.14, -0.05],
      [0.09, 0.14, 0.04],
      [0.01, 0.14, -0.11],
      [-0.05, 0.14, 0.09],
    ];
    for (const [hx, hy, hz] of holeOffsets) {
      const dimple = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), holeMat);
      dimple.scale.set(1, 0.35, 1);
      dimple.position.set(hx, hy, hz);
      group.add(dimple);
    }
  } else if (foodType === 'cake') {
    // Strawberry Shortcake: cream & pink layered sponge + red strawberry crown
    const spongeMat = new THREE.MeshStandardMaterial({
      color: tintBurn(0xfef3c7),
      roughness: 0.52,
    });
    const pinkMat = new THREE.MeshStandardMaterial({
      color: tintBurn(0xf472b6),
      roughness: 0.42,
    });
    const berryMat = new THREE.MeshStandardMaterial({
      color: tintBurn(0xef4444),
      roughness: 0.28,
    });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.24, 0.11, 20), spongeMat);
    base.position.y = 0.055;
    base.castShadow = true;
    group.add(base);

    const frosting = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 20), pinkMat);
    frosting.position.y = 0.125;
    group.add(frosting);

    const berry = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.13, 12), berryMat);
    berry.position.set(0, 0.21, 0);
    group.add(berry);
  } else if (foodType === 'skewer') {
    // Bouncy Fishball Skewer: 3 golden-cream spheres on a bamboo stick
    const stickMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.65 });
    const ballColors = [0xfef08a, 0xfdba74, 0xfde047];
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.56, 8), stickMat);
    stick.rotation.z = Math.PI * 0.5;
    stick.position.y = 0.09;
    group.add(stick);

    for (let i = -1; i <= 1; i++) {
      const bMat = new THREE.MeshStandardMaterial({
        color: tintBurn(ballColors[i + 1]),
        roughness: 0.34,
      });
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 12), bMat);
      ball.position.set(i * 0.16, 0.095, 0);
      ball.castShadow = true;
      group.add(ball);
    }
  } else {
    // Sweet Golden Corn Cob: sunny yellow ribbed cylinder + green leaf husks
    const cornMat = new THREE.MeshStandardMaterial({
      color: tintBurn(cooked ? 0xf59e0b : 0xfacc15),
      roughness: 0.36,
    });
    const leafMat = new THREE.MeshStandardMaterial({
      color: tintBurn(0x22c55e),
      roughness: 0.52,
    });
    const cob = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.44, 16), cornMat);
    cob.rotation.z = Math.PI * 0.5;
    cob.position.y = 0.09;
    cob.castShadow = true;
    group.add(cob);

    for (let s = -1; s <= 1; s += 2) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.26, 10), leafMat);
      leaf.rotation.z = -Math.PI * 0.5;
      leaf.rotation.y = s * 0.38;
      leaf.position.set(-0.18, 0.08, s * 0.06);
      group.add(leaf);
    }
  }

  if (cooked && !burned) {
    // Golden cooked aura ring underneath
    const aura = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.31, 24),
      new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    aura.rotation.x = -Math.PI * 0.5;
    aura.position.y = 0.015;
    group.add(aura);
  }

  if (glazed && !burned) {
    // Glazed Supreme Delicacy: rotating 3D golden star halo + sesame-chili glaze droplets
    const glazeHaloGroup = new THREE.Group();
    glazeHaloGroup.name = 'GlazeStarHalo';
    glazeHaloGroup.position.y = 0.22;

    const haloRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.27, 0.022, 10, 24),
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        emissiveIntensity: 0.55,
        roughness: 0.22,
        metalness: 0.20,
      })
    );
    haloRing.rotation.x = Math.PI * 0.5;
    glazeHaloGroup.add(haloRing);

    const starGemMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.65,
      roughness: 0.20,
      metalness: 0.20,
    });
    for (let k = 0; k < 4; k++) {
      const ang = (k / 4) * Math.PI * 2;
      const starGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), starGemMat);
      starGem.position.set(Math.cos(ang) * 0.27, 0.02, Math.sin(ang) * 0.27);
      glazeHaloGroup.add(starGem);
    }
    group.add(glazeHaloGroup);
    group.userData.glazeHaloGroup = glazeHaloGroup;
  }

  return group;
}

/**
 * Pillar 1 Station A: 3D Sesame & Chili Dipping Sauce Bar (sauce_bar)
 */
function buildSauceBarStationMesh() {
  const group = new THREE.Group();

  const caddyWoodMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.52,
    metalness: 0.06,
  });
  const trimGoldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xb45309,
    emissiveIntensity: 0.22,
    roughness: 0.26,
    metalness: 0.22,
  });
  const ceramicMat = new THREE.MeshStandardMaterial({
    color: 0xfffbeb,
    roughness: 0.22,
    metalness: 0.08,
  });

  // Wooden condiment caddy tray
  const baseTray = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.08, 0.50), caddyWoodMat);
  baseTray.position.y = 0.04;
  baseTray.castShadow = true;
  baseTray.receiveShadow = true;
  group.add(baseTray);

  const handleBridge = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 10, 20, Math.PI), trimGoldMat);
  handleBridge.position.set(0, 0.22, -0.16);
  group.add(handleBridge);

  // Twin glossy ceramic dipping bowls: Left = Golden Sesame-Peanut, Right = Ruby Chili-Garlic Oil
  const sesameMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xb45309,
    emissiveIntensity: 0.35,
    roughness: 0.20,
    metalness: 0.10,
  });
  const chiliMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0x991b1b,
    emissiveIntensity: 0.42,
    roughness: 0.18,
    metalness: 0.10,
  });

  const bowlPositions = [-0.21, 0.21];
  for (let b = 0; b < 2; b++) {
    const bx = bowlPositions[b];
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.14, 22), ceramicMat);
    bowl.position.set(bx, 0.13, 0.02);
    bowl.castShadow = true;
    group.add(bowl);

    const bowlRim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 10, 22), trimGoldMat);
    bowlRim.rotation.x = Math.PI * 0.5;
    bowlRim.position.set(bx, 0.20, 0.02);
    group.add(bowlRim);

    const sauceFill = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.15, 0.04, 20),
      b === 0 ? sesameMat : chiliMat
    );
    sauceFill.position.set(bx, 0.18, 0.02);
    group.add(sauceFill);
  }

  // Floating sesame seeds & green scallion rings above the twin bowls
  const particlesGroup = new THREE.Group();
  particlesGroup.position.y = 0.24;
  const seedMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const scallionMat = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
  for (let i = 0; i < 6; i++) {
    const isLeft = i < 3;
    const ang = (i % 3) * ((Math.PI * 2) / 3);
    const pMesh = isLeft
      ? new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), seedMat)
      : new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.009, 6, 12), scallionMat);
    if (!isLeft) pMesh.rotation.x = Math.PI * 0.5;
    pMesh.position.set(
      (isLeft ? -0.21 : 0.21) + Math.cos(ang) * 0.07,
      0.01 + (i % 2) * 0.02,
      0.02 + Math.sin(ang) * 0.07
    );
    particlesGroup.add(pMesh);
  }
  group.add(particlesGroup);

  // Wooden dipping ladle
  const ladlePivot = new THREE.Group();
  ladlePivot.position.set(-0.18, 0.24, 0.02);
  const ladleStick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.018, 0.28, 10),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55 })
  );
  ladleStick.rotation.z = -0.52;
  ladleStick.position.set(0.08, 0.08, 0);
  ladlePivot.add(ladleStick);
  const ladleCup = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), trimGoldMat);
  ladleCup.scale.set(1, 0.55, 1);
  ladlePivot.add(ladleCup);
  group.add(ladlePivot);

  // Wave 2/3 Double-Dip Golden Star Multiplier Crown
  const doubleDipCrown = new THREE.Group();
  doubleDipCrown.position.set(0, 0.42, -0.06);
  const starCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), trimGoldMat);
  doubleDipCrown.add(starCore);
  const starOrbit = new THREE.Mesh(
    new THREE.RingGeometry(0.12, 0.16, 20),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide })
  );
  doubleDipCrown.add(starOrbit);
  doubleDipCrown.visible = false;
  group.add(doubleDipCrown);

  // Golden Ready Aura Ring when any hotpot has cookProgress >= 0.65 or state === 'ready'
  const readyAuraRing = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.53, 32),
    new THREE.MeshBasicMaterial({
      color: 0xfde047,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
    })
  );
  readyAuraRing.rotation.x = -Math.PI * 0.5;
  readyAuraRing.position.y = 0.015;
  group.add(readyAuraRing);

  group.userData = { particlesGroup, ladlePivot, doubleDipCrown, readyAuraRing };
  return group;
}

/**
 * Builds a single 3D Marshmallow Cocoa Mug (used both on the warmer and during parabolic flight)
 */
function buildCocoaMugMesh() {
  const mugGroup = new THREE.Group();
  const mugRedMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    roughness: 0.28,
    metalness: 0.10,
  });
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xfffbeb,
    roughness: 0.42,
    metalness: 0.02,
  });
  const starMallowMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xd97706,
    emissiveIntensity: 0.25,
    roughness: 0.32,
    metalness: 0.12,
  });

  const cupBody = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.145, 0.24, 20), mugRedMat);
  cupBody.position.y = 0.12;
  cupBody.castShadow = true;
  mugGroup.add(cupBody);

  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 10, 16, Math.PI), mugRedMat);
  handle.rotation.z = -Math.PI * 0.5;
  handle.position.set(0.16, 0.13, 0);
  mugGroup.add(handle);

  const cocoaSurface = new THREE.Mesh(
    new THREE.CylinderGeometry(0.155, 0.155, 0.02, 18),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.35 })
  );
  cocoaSurface.position.y = 0.23;
  mugGroup.add(cocoaSurface);

  // Whipped cream swirl + 3D star marshmallows
  const creamBase = new THREE.Mesh(new THREE.SphereGeometry(0.135, 14, 12), creamMat);
  creamBase.scale.set(1, 0.65, 1);
  creamBase.position.y = 0.26;
  mugGroup.add(creamBase);

  const creamPeak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.11, 12), creamMat);
  creamPeak.position.y = 0.33;
  mugGroup.add(creamPeak);

  for (let m = 0; m < 3; m++) {
    const ang = (m / 3) * Math.PI * 2;
    const mallow = new THREE.Mesh(new THREE.OctahedronGeometry(0.042, 0), starMallowMat);
    mallow.position.set(Math.cos(ang) * 0.085, 0.30, Math.sin(ang) * 0.085);
    mugGroup.add(mallow);
  }

  return mugGroup;
}

/**
 * Pillar 1 Station B: 3D Cozy Marshmallow Cocoa Mug Warmer (cocoa_station)
 */
function buildCocoaWarmerStationMesh() {
  const group = new THREE.Group();

  const copperPlateMat = new THREE.MeshStandardMaterial({
    color: 0xea580c,
    emissive: 0x9a3412,
    emissiveIntensity: 0.32,
    roughness: 0.28,
    metalness: 0.22,
  });

  const warmerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.07, 24), copperPlateMat);
  warmerBase.position.y = 0.035;
  warmerBase.castShadow = true;
  warmerBase.receiveShadow = true;
  group.add(warmerBase);

  const warmGlowRing = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.43, 28),
    new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    })
  );
  warmGlowRing.rotation.x = -Math.PI * 0.5;
  warmGlowRing.position.y = 0.015;
  group.add(warmGlowRing);

  const mugMesh = buildCocoaMugMesh();
  mugMesh.position.y = 0.07;
  group.add(mugMesh);

  const steamGroup = new THREE.Group();
  const steamMat = new THREE.MeshBasicMaterial({
    color: 0xfffbeb,
    transparent: true,
    opacity: 0.55,
  });
  for (let s = 0; s < 3; s++) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.038 + s * 0.01, 10, 8), steamMat);
    puff.position.set((s - 1) * 0.05, 0.46 + s * 0.09, 0);
    steamGroup.add(puff);
  }
  group.add(steamGroup);

  group.userData = { mugMesh, steamGroup, warmGlowRing };
  return group;
}

/**
 * Builds the Fluffy Giant Chinchilla playing a Golden Bamboo Flute ("吹笛子的大龙猫")
 */
function buildFluteChinchillaMesh() {
  const group = new THREE.Group();

  const furGrey = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.78 });
  const bellyCream = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.82 });
  const earPink = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.65 });
  const eyeDark = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.12 });
  const fluteGold = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.26,
    metalness: 0.20,
    emissive: 0xb45309,
    emissiveIntensity: 0.28,
  });

  // Plump pear-shaped chinchilla body
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.46, 22, 18), furGrey);
  torso.scale.set(1.05, 1.18, 0.98);
  torso.position.y = 0.48;
  torso.castShadow = true;
  group.add(torso);

  // Cream belly patch with grey chevron markings
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.37, 18, 16), bellyCream);
  belly.scale.set(0.92, 1.02, 0.55);
  belly.position.set(0, 0.44, 0.26);
  group.add(belly);

  // Round ears
  for (let s = -1; s <= 1; s += 2) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), furGrey);
    ear.scale.set(0.75, 1.35, 0.42);
    ear.position.set(s * 0.28, 1.02, 0.04);
    ear.rotation.z = -s * 0.28;
    group.add(ear);

    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.10, 10, 10), earPink);
    inner.scale.set(0.65, 1.15, 0.35);
    inner.position.set(s * 0.28, 1.01, 0.08);
    inner.rotation.z = -s * 0.28;
    group.add(inner);
  }

  // Glossy eyes + cute nose
  for (let s = -1; s <= 1; s += 2) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), eyeDark);
    eye.position.set(s * 0.16, 0.74, 0.40);
    group.add(eye);

    const spec = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    spec.position.set(s * 0.145, 0.76, 0.445);
    group.add(spec);
  }

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), earPink);
  nose.scale.set(1.2, 0.8, 0.9);
  nose.position.set(0, 0.68, 0.45);
  group.add(nose);

  // Chubby arms holding the golden bamboo flute across the mouth
  for (let s = -1; s <= 1; s += 2) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.22, 8, 12), furGrey);
    arm.position.set(s * 0.26, 0.56, 0.36);
    arm.rotation.z = s * 0.65;
    arm.rotation.x = -0.55;
    group.add(arm);
  }

  const fluteGroup = new THREE.Group();
  fluteGroup.position.set(0.04, 0.61, 0.48);
  const fluteRod = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.72, 14), fluteGold);
  fluteRod.rotation.z = Math.PI * 0.5;
  fluteGroup.add(fluteRod);

  // Jade tassel hanging from flute end
  const tassel = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 })
  );
  tassel.position.set(0.36, -0.08, 0);
  fluteGroup.add(tassel);
  group.add(fluteGroup);

  // Fluffy tail
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), furGrey);
  tail.scale.set(0.85, 1.35, 0.95);
  tail.position.set(0, 0.35, -0.44);
  tail.rotation.x = -0.45;
  group.add(tail);

  // Musical shockwave ring around base
  const noteRing = new THREE.Mesh(
    new THREE.RingGeometry(0.52, 0.64, 32),
    new THREE.MeshBasicMaterial({ color: 0xc084fc, side: THREE.DoubleSide, transparent: true, opacity: 0.45 })
  );
  noteRing.rotation.x = -Math.PI * 0.5;
  noteRing.position.y = 0.03;
  group.add(noteRing);

  group.userData = { fluteGroup, noteRing, bouncePhase: 0 };
  return group;
}

export function createBunkerScene(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.24;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x23140d);
  scene.fog = new THREE.FogExp2(0x23140d, 0.022);

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 60);
  const cameraBasePos = new THREE.Vector3(0, 6.25, 6.55);
  const cameraLookTarget = new THREE.Vector3(0, 0.25, -0.15);

  function updateCameraAspect() {
    const w = window.innerWidth || 1280;
    const h = window.innerHeight || 800;
    const aspect = w / h;
    camera.aspect = aspect;
    if (aspect < 0.75) {
      camera.fov = 52;
      cameraBasePos.set(0, 8.2, 8.6);
    } else if (aspect < 1.15) {
      camera.fov = 45;
      cameraBasePos.set(0, 7.1, 7.4);
    } else {
      camera.fov = 39;
      cameraBasePos.set(0, 6.15, 6.45);
    }
    camera.position.copy(cameraBasePos);
    camera.lookAt(cameraLookTarget);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  updateCameraAspect();
  window.addEventListener('resize', updateCameraAspect);

  // Physically-correct Three.js r161 lighting
  const hemiLight = new THREE.HemisphereLight(0xfff4e0, 0x7c5a43, 1.38);
  hemiLight.position.set(0, 10, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xfff7ed, 2.55);
  dirLight.position.set(4.2, 9.5, 5.8);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  dirLight.shadow.camera.near = 1.0;
  dirLight.shadow.camera.far = 24.0;
  const d = 6.2;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0008;
  scene.add(dirLight);

  // Warm fireplace/hotpot glow + purple spatial vortex glow
  const hotpotLight = new THREE.PointLight(0xff7b29, 2.2, 7.5, 1.4);
  hotpotLight.position.set(1.1, 1.6, 0.55);
  scene.add(hotpotLight);

  const vortexLight = new THREE.PointLight(0xc084fc, 1.85, 6.0, 1.4);
  vortexLight.position.set(-1.35, 1.25, 1.85);
  scene.add(vortexLight);

  // ============================================================================
  // 1. Cozy 26°C Bunker Cabin Table & Frosted -70°C Window (>= 65% Viewport)
  // ============================================================================
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  const woodTableMat = new THREE.MeshStandardMaterial({
    color: 0xb47342,
    roughness: 0.58,
    metalness: 0.04,
  });
  const woodTrimMat = new THREE.MeshStandardMaterial({
    color: 0x6b3e23,
    roughness: 0.65,
    metalness: 0.05,
  });

  // Main cozy cabin table slab
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.36, 4.9), woodTableMat);
  tableTop.position.set(0, -0.18, 0.35);
  tableTop.receiveShadow = true;
  worldGroup.add(tableTop);

  const tableApron = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.16, 5.1), woodTrimMat);
  tableApron.position.set(0, -0.28, 0.35);
  worldGroup.add(tableApron);

  // Cozy woven table runner under the hotpot
  const runnerMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.78 });
  const runner = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.03, 3.6), runnerMat);
  runner.position.set(1.05, 0.015, 0.45);
  runner.receiveShadow = true;
  worldGroup.add(runner);

  // Cabin back timber wall & Frosted -70°C Snow Window
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(11.4, 4.2, 0.35),
    new THREE.MeshStandardMaterial({ color: 0x4a2c18, roughness: 0.82 })
  );
  backWall.position.set(0, 1.5, -3.25);
  worldGroup.add(backWall);

  // Frosted Window Frame looking out at the -70°C blizzard
  const windowGroup = new THREE.Group();
  windowGroup.position.copy(STATION_COORDS.window_bandit);
  worldGroup.add(windowGroup);

  const skyGlass = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.55, 0.08),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  windowGroup.add(skyGlass);

  // Frost rim around window
  const frameBorder = new THREE.Mesh(
    new THREE.BoxGeometry(3.45, 1.78, 0.14),
    new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.35 })
  );
  frameBorder.position.z = -0.03;
  windowGroup.add(frameBorder);

  // Cheeky Baba Chops Snow Bandit peeking outside the window
  const banditHolder = new THREE.Group();
  banditHolder.position.set(0, -0.32, 0.16);
  windowGroup.add(banditHolder);

  const banditModel = buildBabaChopsPlushModel(THREE);
  banditModel.root.scale.setScalar(0.55);
  banditHolder.add(banditModel.root);

  // Snowman shell that appears when bonked by a snowball
  const snowmanShell = new THREE.Group();
  const snowWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
  const snowBase = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 14), snowWhiteMat);
  snowBase.position.y = 0.22;
  snowmanShell.add(snowBase);
  const snowHead = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 14), snowWhiteMat);
  snowHead.position.y = 0.66;
  snowmanShell.add(snowHead);
  const carrotNose = new THREE.Mesh(
    new THREE.ConeGeometry(0.055, 0.22, 10),
    new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 })
  );
  carrotNose.rotation.x = Math.PI * 0.5;
  carrotNose.position.set(0, 0.66, 0.28);
  snowmanShell.add(carrotNose);
  snowmanShell.visible = false;
  banditHolder.add(snowmanShell);

  // Alert exclamation ring above window when bandit is active
  const banditAlertRing = new THREE.Mesh(
    new THREE.RingGeometry(0.24, 0.34, 24),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.0 })
  );
  banditAlertRing.position.set(0, 0.92, 0.22);
  windowGroup.add(banditAlertRing);

  // ============================================================================
  // 2. Left Zone: 3D Supermarket Supply Shelf (6 Distinct 3D Food Toys)
  // ============================================================================
  const shelfBase = new THREE.Group();
  shelfBase.position.set(-3.10, 0.02, 0.48);
  worldGroup.add(shelfBase);

  const rackMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.42, metalness: 0.15 });
  const tierHeights = [0.70, 0.40, 0.14];
  const tierZ = [-1.03, 0.0, 1.04];
  for (let t = 0; t < 3; t++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.10, 0.88), rackMat);
    plank.position.set(0, tierHeights[t] - 0.06, tierZ[t]);
    plank.castShadow = true;
    plank.receiveShadow = true;
    shelfBase.add(plank);
  }

  const shelfItems = {};
  for (const foodType of FOOD_TYPES) {
    const sid = `shelf_${foodType}`;
    const pos = STATION_COORDS[sid];
    const holder = new THREE.Group();
    holder.position.copy(pos);
    worldGroup.add(holder);

    // Pedestal plate
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.38, 0.05, 22),
      new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.32 })
    );
    plate.position.y = -0.02;
    holder.add(plate);

    const mesh = buildFoodItemMesh(foodType, false, false);
    holder.add(mesh);

    shelfItems[foodType] = {
      id: sid,
      foodType,
      holder,
      mesh,
      basePos: pos.clone(),
      respawnScale: 1.0,
    };
  }

  // ============================================================================
  // 3. Draggable 3D Purple Dimensional Vortex Ring ("空间异能零元购")
  // ============================================================================
  const vortexGroup = new THREE.Group();
  vortexGroup.position.copy(STATION_COORDS.vortex_ring);
  worldGroup.add(vortexGroup);

  const outerVortexTorus = new THREE.Mesh(
    new THREE.TorusGeometry(0.56, 0.095, 16, 36),
    new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.85,
      roughness: 0.18,
      metalness: 0.22,
    })
  );
  outerVortexTorus.rotation.x = -Math.PI * 0.5;
  vortexGroup.add(outerVortexTorus);

  const innerVortexTorus = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.055, 12, 28),
    new THREE.MeshBasicMaterial({ color: 0xe9d5ff })
  );
  innerVortexTorus.rotation.x = -Math.PI * 0.5;
  innerVortexTorus.position.y = 0.03;
  vortexGroup.add(innerVortexTorus);

  // RingGeometry(0, r, 32, 8) so interior rings animate with 3D spiral suction waves
  const vortexDiscGeo = new THREE.RingGeometry(0, 0.52, 32, 8);
  const vortexPosAttr = vortexDiscGeo.attributes.position;
  const vortexBaseXY = new Float32Array(vortexPosAttr.count * 2);
  for (let i = 0; i < vortexPosAttr.count; i++) {
    vortexBaseXY[i * 2] = vortexPosAttr.getX(i);
    vortexBaseXY[i * 2 + 1] = vortexPosAttr.getY(i);
  }
  const vortexDisc = new THREE.Mesh(
    vortexDiscGeo,
    new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.62,
    })
  );
  vortexDisc.rotation.x = -Math.PI * 0.5;
  vortexGroup.add(vortexDisc);

  // ============================================================================
  // 4. 4 Cozy Bunker Tray Slots (tray_0 .. tray_3)
  // ============================================================================
  const traySlotHolders = [];
  for (let i = 0; i < 4; i++) {
    const sid = `tray_${i}`;
    const pos = STATION_COORDS[sid];
    const holder = new THREE.Group();
    holder.position.copy(pos);
    worldGroup.add(holder);

    const mat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.38, 0.06, 24),
      new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.42 })
    );
    mat.receiveShadow = true;
    holder.add(mat);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.03, 10, 24),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.38 })
    );
    rim.rotation.x = Math.PI * 0.5;
    rim.position.y = 0.03;
    holder.add(rim);

    const itemMount = new THREE.Group();
    itemMount.position.y = 0.04;
    holder.add(itemMount);

    traySlotHolders.push({
      id: sid,
      holder,
      itemMount,
      renderedFood: null,
    });
  }

  // ============================================================================
  // 5. Center Zone: 3D Copper Mandarin-Duck Hotpot (鸳鸯铜火锅, hotpot_0 & hotpot_1)
  // ============================================================================
  const hotpotCenter = new THREE.Vector3(1.10, 0.24, 0.55);
  const hotpotRoot = new THREE.Group();
  hotpotRoot.position.copy(hotpotCenter);
  worldGroup.add(hotpotRoot);

  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xea580c,
    roughness: 0.28,
    metalness: 0.22,
    emissive: 0x9a3412,
    emissiveIntensity: 0.28,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.26,
    metalness: 0.22,
    emissive: 0xb45309,
    emissiveIntensity: 0.22,
  });

  // Outer copper basin
  const potBowl = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 0.92, 0.46, 36), copperMat);
  potBowl.castShadow = true;
  potBowl.receiveShadow = true;
  hotpotRoot.add(potBowl);

  const potRim = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.065, 14, 36), brassMat);
  potRim.rotation.x = Math.PI * 0.5;
  potRim.position.y = 0.23;
  hotpotRoot.add(potRim);

  // Center Mandarin-Duck divider wall + Central copper chimney
  const divider = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 2.28), brassMat);
  divider.position.y = 0.04;
  hotpotRoot.add(divider);

  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.82, 20), copperMat);
  chimney.position.y = 0.36;
  chimney.castShadow = true;
  hotpotRoot.add(chimney);

  const chimneyRim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.032, 10, 20), brassMat);
  chimneyRim.rotation.x = Math.PI * 0.5;
  chimneyRim.position.y = 0.76;
  hotpotRoot.add(chimneyRim);

  // Boiling Broth Discs using RingGeometry(0, r, 32, 8) for interior wave displacement
  const spicyBrothGeo = new THREE.RingGeometry(0.22, 1.10, 32, 8, Math.PI * 0.5, Math.PI);
  const savoryBrothGeo = new THREE.RingGeometry(0.22, 1.10, 32, 8, -Math.PI * 0.5, Math.PI);

  const spicyBroth = new THREE.Mesh(
    spicyBrothGeo,
    new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0x991b1b,
      emissiveIntensity: 0.45,
      roughness: 0.22,
      side: THREE.DoubleSide,
    })
  );
  spicyBroth.rotation.x = -Math.PI * 0.5;
  spicyBroth.position.y = 0.19;
  hotpotRoot.add(spicyBroth);

  const savoryBroth = new THREE.Mesh(
    savoryBrothGeo,
    new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xca8a04,
      emissiveIntensity: 0.32,
      roughness: 0.25,
      side: THREE.DoubleSide,
    })
  );
  savoryBroth.rotation.x = -Math.PI * 0.5;
  savoryBroth.position.y = 0.19;
  hotpotRoot.add(savoryBroth);

  // Two Hotpot Cooking Basket Slots (hotpot_0 = Spicy Left, hotpot_1 = Savory Right)
  const hotpotSlots = [];
  for (let i = 0; i < 2; i++) {
    const sid = `hotpot_${i}`;
    const pos = STATION_COORDS[sid];
    const slotGroup = new THREE.Group();
    slotGroup.position.copy(pos);
    worldGroup.add(slotGroup);

    const basketRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.36, 0.032, 10, 24),
      brassMat
    );
    basketRing.rotation.x = Math.PI * 0.5;
    slotGroup.add(basketRing);

    const itemMount = new THREE.Group();
    itemMount.position.y = 0.02;
    slotGroup.add(itemMount);

    // Overhead 3D radial progress ring
    const gaugeBg = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.33, 28),
      new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide, transparent: true, opacity: 0.72 })
    );
    gaugeBg.position.set(0, 0.55, 0);
    gaugeBg.rotation.x = -0.55;
    gaugeBg.visible = false;
    slotGroup.add(gaugeBg);

    const gaugeFillMat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
    const gaugeFill = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.32, 28), gaugeFillMat);
    gaugeFill.position.set(0, 0.56, 0.01);
    gaugeFill.rotation.x = -0.55;
    gaugeFill.visible = false;
    slotGroup.add(gaugeFill);

    hotpotSlots.push({
      id: sid,
      slotGroup,
      itemMount,
      gaugeBg,
      gaugeFill,
      gaugeFillMat,
      renderedKey: '',
      currentTheta: -1,
    });
  }

  // ============================================================================
  // 6. Right & Center Toy Stations: Flute Chinchilla, Sauce Bar, Cocoa Warmer, Helper & Events
  // ============================================================================
  const chinchillaMesh = buildFluteChinchillaMesh();
  chinchillaMesh.position.copy(STATION_COORDS.chinchilla_flute);
  chinchillaMesh.rotation.y = -0.42;
  worldGroup.add(chinchillaMesh);

  // Pillar 1 Station A: 3D Sesame & Chili Dipping Sauce Bar (sauce_bar)
  const sauceBarGroup = buildSauceBarStationMesh();
  sauceBarGroup.position.copy(STATION_COORDS.sauce_bar);
  worldGroup.add(sauceBarGroup);

  // Pillar 1 Station B: 3D Cozy Marshmallow Cocoa Mug Warmer (cocoa_station)
  const cocoaStationGroup = buildCocoaWarmerStationMesh();
  cocoaStationGroup.position.copy(STATION_COORDS.cocoa_station);
  worldGroup.add(cocoaStationGroup);

  // Pillar 2 Integration: Picky Piggy Sous-Chef Helper Buddy & Golden Mystery Crate
  const helperEventsScene = createBunkerHelperAndEvents(THREE, scene, worldGroup);

  // ============================================================================
  // 6B. Pillar 3: Stage-by-Stage Wave 2 & Wave 3 Visual & Toy Evolution Props
  // ============================================================================
  // Wave 2: Shimmering 3D Northern Lights (Aurora Borealis) Ribbon Curtain + Crystal Ice Lanterns
  const wave2PropsGroup = new THREE.Group();
  wave2PropsGroup.visible = false;
  worldGroup.add(wave2PropsGroup);

  const auroraRibbons = [];
  const auroraColors = [0x34d399, 0x38bdf8, 0xc084fc];
  for (let a = 0; a < 3; a++) {
    const ribbonGeo = new THREE.PlaneGeometry(3.0, 0.34, 24, 3);
    const ribbonMat = new THREE.MeshBasicMaterial({
      color: auroraColors[a],
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.68 - a * 0.08,
      toneMapped: false,
      fog: false,
    });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.position.set(
      STATION_COORDS.window_bandit.x,
      STATION_COORDS.window_bandit.y + 0.32 - a * 0.22,
      STATION_COORDS.window_bandit.z + 0.07 + a * 0.015
    );
    wave2PropsGroup.add(ribbon);
    auroraRibbons.push({ mesh: ribbon, geo: ribbonGeo, phaseOffset: a * 1.4 });
  }

  const iceLanternCrystalMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.72,
    roughness: 0.18,
    metalness: 0.18,
    transparent: true,
    opacity: 0.88,
  });
  const iceLanternCoreMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    toneMapped: false,
  });
  const iceLanternMeshes = [];
  for (const lx of [-3.95, 3.95]) {
    const lantern = new THREE.Group();
    lantern.position.set(lx, 0.45, -2.05);
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.32, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.32, metalness: 0.12 })
    );
    pedestal.position.y = 0.06;
    lantern.add(pedestal);

    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), iceLanternCrystalMat);
    crystal.scale.set(0.85, 1.45, 0.85);
    crystal.position.y = 0.42;
    lantern.add(crystal);

    const innerStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), iceLanternCoreMat);
    innerStar.position.y = 0.42;
    lantern.add(innerStar);

    wave2PropsGroup.add(lantern);
    iceLanternMeshes.push({ crystal, innerStar });
  }

  // Wave 3: Festive Fairy String Lights + Golden Dragon-Crown Hotpot Rim + Party Disco Star Ball
  const wave3PropsGroup = new THREE.Group();
  wave3PropsGroup.visible = false;
  worldGroup.add(wave3PropsGroup);

  const fairyBulbs = [];
  const fairyPalette = [0xfde047, 0xf472b6, 0x38bdf8, 0xc084fc, 0x4ade80, 0xfb923c];
  for (let b = 0; b < 12; b++) {
    const u = b / 11;
    const bx = -4.6 + u * 9.2;
    const sag = Math.sin(u * Math.PI) * 0.32;
    const by = 2.75 - sag;
    const bulbMat = new THREE.MeshBasicMaterial({
      color: fairyPalette[b % fairyPalette.length],
      toneMapped: false,
      fog: false,
    });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), bulbMat);
    bulb.position.set(bx, by, -2.98);
    wave3PropsGroup.add(bulb);
    fairyBulbs.push(bulb);
  }

  // Golden Dragon-Crown Rim mounted onto Copper Hotpot for Wave 3
  const dragonCrownGroup = new THREE.Group();
  dragonCrownGroup.position.y = 0.27;
  dragonCrownGroup.visible = false;
  hotpotRoot.add(dragonCrownGroup);

  const crownRimTorus = new THREE.Mesh(
    new THREE.TorusGeometry(1.22, 0.045, 12, 36),
    brassMat
  );
  crownRimTorus.rotation.x = Math.PI * 0.5;
  dragonCrownGroup.add(crownRimTorus);

  const dragonPearlMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.65,
    roughness: 0.18,
    metalness: 0.20,
  });
  for (let p = 0; p < 8; p++) {
    const ang = (p / 8) * Math.PI * 2;
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.18, 8), brassMat);
    spire.position.set(Math.cos(ang) * 1.22, 0.09, Math.sin(ang) * 1.22);
    dragonCrownGroup.add(spire);

    const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 10), dragonPearlMat);
    pearl.position.set(Math.cos(ang) * 1.22, 0.20, Math.sin(ang) * 1.22);
    dragonCrownGroup.add(pearl);
  }

  // Party Disco Star Ball above the table in Wave 3
  const discoBallGroup = new THREE.Group();
  discoBallGroup.position.set(0.0, 2.58, 0.15);
  const discoCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.32, 1),
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xd97706,
      emissiveIntensity: 0.52,
      roughness: 0.18,
      metalness: 0.22,
    })
  );
  discoBallGroup.add(discoCore);
  const discoRing1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.022, 10, 28),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, toneMapped: false })
  );
  discoRing1.rotation.x = Math.PI * 0.35;
  discoBallGroup.add(discoRing1);
  const discoRing2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.02, 10, 28),
    new THREE.MeshBasicMaterial({ color: 0xf472b6, toneMapped: false })
  );
  discoRing2.rotation.y = Math.PI * 0.35;
  discoBallGroup.add(discoRing2);
  wave3PropsGroup.add(discoBallGroup);

  // Snowball Pile for bonking Window Bandits
  const snowballPileGroup = new THREE.Group();
  snowballPileGroup.position.copy(STATION_COORDS.snowball_pile);
  worldGroup.add(snowballPileGroup);

  const iceTray = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.46, 0.08, 22),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.25 })
  );
  snowballPileGroup.add(iceTray);

  const snowOffsets = [
    [0, 0.16, 0, 0.16],
    [-0.17, 0.12, 0.10, 0.13],
    [0.17, 0.12, 0.09, 0.13],
    [0, 0.12, -0.16, 0.13],
  ];
  for (const [sx, sy, sz, sr] of snowOffsets) {
    const sb = new THREE.Mesh(new THREE.SphereGeometry(sr, 14, 12), snowWhiteMat);
    sb.position.set(sx, sy, sz);
    sb.castShadow = true;
    snowballPileGroup.add(sb);
  }

  // Trash Bin for burned food
  const trashGroup = new THREE.Group();
  trashGroup.position.copy(STATION_COORDS.trash_bin);
  worldGroup.add(trashGroup);
  const binMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.22, 0.42, 18),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.45, metalness: 0.20 })
  );
  binMesh.position.y = 0.05;
  trashGroup.add(binMesh);

  // ============================================================================
  // 7. 3 Hungry Critter Customer Seats (Seat 0 = CatNap riding DogDay, Seats 1 & 2 evolve by Wave!)
  // ============================================================================
  const standeeTextures = {};
  const customerActors = [];
  const seat1WaveModels = {};
  const seat2WaveModels = {};

  for (let i = 0; i < 3; i++) {
    const sid = `customer_${i}`;
    const pos = STATION_COORDS[sid];
    const root = new THREE.Group();
    root.position.copy(pos);
    worldGroup.add(root);

    const charHolder = new THREE.Group();
    root.add(charHolder);

    if (i === 0) {
      // Seat 0: Canonical Novel Duo "花花骑乐乐" — v11 CatNap riding on v11 DogDay's back!
      const dogday = buildDogDayPlushModel(THREE);
      dogday.root.scale.setScalar(0.68);
      dogday.root.position.set(0, -0.45, 0);
      charHolder.add(dogday.root);

      const catnap = buildCatNapPlushModel(THREE);
      catnap.root.scale.setScalar(0.52);
      catnap.root.position.set(0, 0.18, -0.14);
      catnap.root.rotation.x = 0.18;
      charHolder.add(catnap.root);
    } else if (i === 1) {
      // Seat 1 evolves across waves: W1 = Hoppy Hopscotch, W2 = Bubba Bubbaphant, W3 = Kickin Chicken
      const hoppy = buildHoppyHopscotchPlushModel(THREE);
      hoppy.root.scale.setScalar(0.68);
      hoppy.root.position.set(0, -0.45, 0);
      charHolder.add(hoppy.root);

      const bubba = buildBubbaBubbaphantPlushModel(THREE);
      bubba.root.scale.setScalar(0.68);
      bubba.root.position.set(0, -0.45, 0);
      bubba.root.visible = false;
      charHolder.add(bubba.root);

      const kickin = buildKickinChickenPlushModel(THREE);
      kickin.root.scale.setScalar(0.68);
      kickin.root.position.set(0, -0.45, 0);
      kickin.root.visible = false;
      charHolder.add(kickin.root);

      seat1WaveModels.w1 = hoppy.root;
      seat1WaveModels.w2 = bubba.root;
      seat1WaveModels.w3 = kickin.root;
    } else {
      // Seat 2 evolves across waves: W1 & W2 = CraftyCorn, W3 = Bobby BearHug
      const crafty = buildCraftyCornPlushModel(THREE);
      crafty.root.scale.setScalar(0.68);
      crafty.root.position.set(0, -0.45, 0);
      charHolder.add(crafty.root);

      const bobby = buildBobbyBearHugPlushModel(THREE);
      bobby.root.scale.setScalar(0.68);
      bobby.root.position.set(0, -0.45, 0);
      bobby.root.visible = false;
      charHolder.add(bobby.root);

      seat2WaveModels.w12 = crafty.root;
      seat2WaveModels.w3 = bobby.root;
    }

    // Portrait medallion badge
    const badgeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      toneMapped: false,
      fog: false,
      transparent: true,
    });
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), badgeMat);
    badge.position.set(-0.78, 0.35, 0.35);
    root.add(badge);

    // 3D Floating Order Bubble above each Critter
    const bubbleGroup = new THREE.Group();
    bubbleGroup.position.set(0.76, 0.96, 0.25);
    root.add(bubbleGroup);

    const cloudBg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.46, 0.10, 26),
      new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false })
    );
    cloudBg.rotation.x = Math.PI * 0.5;
    bubbleGroup.add(cloudBg);

    const patienceRingMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      side: THREE.DoubleSide,
      toneMapped: false,
      fog: false,
    });
    const patienceRing = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.54, 32), patienceRingMat);
    patienceRing.position.z = 0.06;
    bubbleGroup.add(patienceRing);

    const orderIconMount = new THREE.Group();
    orderIconMount.position.set(0, 0, 0.12);
    orderIconMount.rotation.x = 0.55;
    bubbleGroup.add(orderIconMount);

    customerActors.push({
      slotIndex: i,
      id: sid,
      root,
      charHolder,
      badge,
      badgeMat,
      bubbleGroup,
      patienceRing,
      patienceRingMat,
      orderIconMount,
      renderedCritter: '',
      renderedFood: '',
      currentTheta: -1,
    });
  }

  // ============================================================================
  // 8. Active Suction Spiral Particles, Flying Snowballs, Cocoa Mugs & Floating Drag Proxy
  // ============================================================================
  const dragProxy = new THREE.Group();
  dragProxy.visible = false;
  worldGroup.add(dragProxy);

  const suctionFlights = [];
  const snowballFlights = [];
  const cocoaFlights = [];
  const shockwaveRings = [];

  // Invisible raycast plane across the table & shelf
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.35);
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hitPoint = new THREE.Vector3();

  // Interactive station hit spheres for forgiving child taps/drops
  const hitSpheres = [];
  for (const sid of STATION_IDS) {
    const p = STATION_COORDS[sid];
    let radius = 0.58;
    if (sid.startsWith('customer_')) radius = 0.92;
    else if (sid.startsWith('hotpot_')) radius = 0.65;
    else if (sid === 'sauce_bar' || sid === 'cocoa_station') radius = 0.60;
    else if (sid === 'helper_buddy' || sid === 'golden_crate') radius = 0.62;
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 10, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    m.position.copy(p);
    m.userData.stationId = sid;
    m.userData.radius = radius;
    worldGroup.add(m);
    hitSpheres.push(m);
  }

  function screenToWorldOnTable(clientX, clientY, targetVec = hitPoint) {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    ndc.y = -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    raycaster.ray.intersectPlane(dragPlane, targetVec);
    targetVec.x = Math.max(-4.3, Math.min(4.3, targetVec.x));
    targetVec.z = Math.max(-2.6, Math.min(2.3, targetVec.z));
    return targetVec;
  }

  function pickStationAtClientPos(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    ndc.y = -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(hitSpheres, false);
    if (hits.length > 0) {
      return hits[0].object.userData.stationId;
    }
    // Forgiving nearest-station fallback on table plane
    const pt = screenToWorldOnTable(clientX, clientY);
    let bestId = null;
    let bestDist = 1.15;
    for (const sid of STATION_IDS) {
      const d2 = pt.distanceTo(STATION_COORDS[sid]);
      if (d2 < bestDist) {
        bestDist = d2;
        bestId = sid;
      }
    }
    return bestId;
  }

  function getStationScreenRect(stationId) {
    const pos = STATION_COORDS[stationId];
    if (!pos) return { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
    const projected = pos.clone().project(camera);
    return {
      x: (projected.x * 0.5 + 0.5) * window.innerWidth,
      y: (-projected.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  function spawnSuctionFlight(foodType, fromPos, toSlotIdx, onComplete) {
    const mesh = buildFoodItemMesh(foodType, false, false, false);
    mesh.position.copy(fromPos);
    worldGroup.add(mesh);
    const toPos = STATION_COORDS[`tray_${toSlotIdx}`].clone().add(new THREE.Vector3(0, 0.12, 0));
    suctionFlights.push({
      mesh,
      fromPos: fromPos.clone(),
      toPos,
      elapsed: 0,
      duration: 0.38,
      angle: 0,
      onComplete,
    });
  }

  function spawnSnowballFlight(onImpact) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), snowWhiteMat);
    ball.position.copy(STATION_COORDS.snowball_pile).add(new THREE.Vector3(0, 0.25, 0));
    worldGroup.add(ball);
    snowballFlights.push({
      mesh: ball,
      fromPos: ball.position.clone(),
      toPos: STATION_COORDS.window_bandit.clone().add(new THREE.Vector3(0, 0.1, 0.25)),
      elapsed: 0,
      duration: 0.36,
      onImpact,
    });
  }

  function spawnCocoaFlight(toCustIdx = 0, onImpact = null) {
    const mug = buildCocoaMugMesh();
    mug.scale.setScalar(0.85);
    mug.position.copy(STATION_COORDS.cocoa_station).add(new THREE.Vector3(0, 0.18, 0));
    worldGroup.add(mug);
    const targetCoord = STATION_COORDS[`customer_${toCustIdx}`] || STATION_COORDS.customer_0;
    cocoaFlights.push({
      mesh: mug,
      fromPos: mug.position.clone(),
      toPos: targetCoord.clone().add(new THREE.Vector3(0, 0.22, 0.35)),
      elapsed: 0,
      duration: 0.42,
      onImpact,
    });
  }

  function spawnSauceSplash(potIdx = 0) {
    const targetPos = STATION_COORDS[`hotpot_${potIdx}`] || STATION_COORDS.sauce_bar;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.38, 28),
      new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
      })
    );
    ring.rotation.x = -Math.PI * 0.5;
    ring.position.copy(targetPos);
    ring.position.y += 0.16;
    worldGroup.add(ring);
    shockwaveRings.push({ mesh: ring, elapsed: 0, duration: 0.48 });
  }

  function spawnFluteShockwave(isRoyalWave3 = false) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.52, 36),
      new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    ring.rotation.x = -Math.PI * 0.5;
    ring.position.copy(STATION_COORDS.chinchilla_flute);
    ring.position.y = 0.12;
    worldGroup.add(ring);
    shockwaveRings.push({ mesh: ring, elapsed: 0, duration: 0.65 });

    if (isRoyalWave3) {
      const royalRing = new THREE.Mesh(
        new THREE.RingGeometry(0.24, 0.40, 36),
        new THREE.MeshBasicMaterial({ color: 0xc084fc, side: THREE.DoubleSide, transparent: true, opacity: 0.92 })
      );
      royalRing.rotation.x = -Math.PI * 0.5;
      royalRing.position.copy(STATION_COORDS.chinchilla_flute);
      royalRing.position.y = 0.18;
      worldGroup.add(royalRing);
      shockwaveRings.push({ mesh: royalRing, elapsed: 0, duration: 0.78 });
    }
  }

  // Clamp initial scene materials
  enforceNonIblMaterialHygiene(scene);

  let dragProxyKey = '';

  function syncAndRender(state, dt, elapsed) {
    // 1. Substepped 1/120s physics for suction flights, snowball arcs & marshmallow cocoa mugs
    const substeps = Math.max(1, Math.min(8, Math.ceil(dt / (1 / 120))));
    const subDt = dt / substeps;

    for (let step = 0; step < substeps; step++) {
      for (let i = suctionFlights.length - 1; i >= 0; i--) {
        const f = suctionFlights[i];
        f.elapsed += subDt;
        const u = Math.min(1, f.elapsed / f.duration);
        f.angle += subDt * 22.0;
        const spiralR = (1 - u) * 0.42;
        f.mesh.position.lerpVectors(f.fromPos, f.toPos, u);
        f.mesh.position.x += Math.cos(f.angle) * spiralR;
        f.mesh.position.z += Math.sin(f.angle) * spiralR;
        f.mesh.position.y += Math.sin(u * Math.PI) * 0.65;
        f.mesh.rotation.y = f.angle;
        const sc = 1.0 - 0.25 * Math.sin(u * Math.PI);
        f.mesh.scale.setScalar(sc);
        if (u >= 1) {
          worldGroup.remove(f.mesh);
          disposeMeshTree(f.mesh);
          suctionFlights.splice(i, 1);
          if (f.onComplete) f.onComplete();
        }
      }

      for (let i = snowballFlights.length - 1; i >= 0; i--) {
        const s = snowballFlights[i];
        s.elapsed += subDt;
        const u = Math.min(1, s.elapsed / s.duration);
        s.mesh.position.lerpVectors(s.fromPos, s.toPos, u);
        s.mesh.position.y += Math.sin(u * Math.PI) * 1.15;
        s.mesh.rotation.x += subDt * 14.0;
        s.mesh.rotation.z += subDt * 8.0;
        if (u >= 1) {
          worldGroup.remove(s.mesh);
          if (s.mesh.geometry) s.mesh.geometry.dispose();
          snowballFlights.splice(i, 1);
          if (s.onImpact) s.onImpact();
        }
      }

      for (let i = cocoaFlights.length - 1; i >= 0; i--) {
        const c = cocoaFlights[i];
        c.elapsed += subDt;
        const u = Math.min(1, c.elapsed / c.duration);
        c.mesh.position.lerpVectors(c.fromPos, c.toPos, u);
        c.mesh.position.y += Math.sin(u * Math.PI) * 0.95;
        c.mesh.rotation.y += subDt * 8.0;
        if (u >= 1) {
          worldGroup.remove(c.mesh);
          disposeMeshTree(c.mesh);
          cocoaFlights.splice(i, 1);
          if (c.onImpact) c.onImpact();
        }
      }
    }

    for (let i = shockwaveRings.length - 1; i >= 0; i--) {
      const sw = shockwaveRings[i];
      sw.elapsed += dt;
      const u = Math.min(1, sw.elapsed / sw.duration);
      const scale = 1 + u * 6.5;
      sw.mesh.scale.setScalar(scale);
      sw.mesh.material.opacity = (1 - u) * 0.85;
      if (u >= 1) {
        worldGroup.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        sw.mesh.material.dispose();
        shockwaveRings.splice(i, 1);
      }
    }

    // 2. Animate Vortex Disc interior vertices & position
    for (let i = 0; i < vortexPosAttr.count; i++) {
      const bx = vortexBaseXY[i * 2];
      const by = vortexBaseXY[i * 2 + 1];
      const r = Math.hypot(bx, by);
      const wave = Math.sin(r * 14.0 - elapsed * 9.5) * 0.055 * (1 - r);
      vortexPosAttr.setZ(i, wave);
    }
    vortexPosAttr.needsUpdate = true;
    outerVortexTorus.rotation.z = elapsed * 3.2;
    innerVortexTorus.rotation.z = -elapsed * 5.4;

    if (state.draggingVortex && state.vortexWorldPos) {
      vortexGroup.position.lerp(state.vortexWorldPos, 0.45);
      vortexGroup.position.y = 0.58;
      vortexGroup.scale.setScalar(1.18);
    } else {
      vortexGroup.position.lerp(STATION_COORDS.vortex_ring, 0.18);
      vortexGroup.position.y = STATION_COORDS.vortex_ring.y + Math.sin(elapsed * 3.5) * 0.06;
      vortexGroup.scale.setScalar(1.0 + Math.sin(elapsed * 4.0) * 0.04);
    }
    vortexLight.position.x = vortexGroup.position.x;
    vortexLight.position.z = vortexGroup.position.z;

    // 3. Animate Boiling Hotpot Broth vertices
    for (const broth of [spicyBroth, savoryBroth]) {
      const posAttr = broth.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vy = posAttr.getY(i);
        const r = Math.hypot(vx, vy);
        const zWave = Math.sin(r * 12.0 - elapsed * 7.5 + vx * 3.0) * 0.028;
        posAttr.setZ(i, zWave);
      }
      posAttr.needsUpdate = true;
      broth.geometry.computeVertexNormals();
    }

    // 4. Sync 4 Bunker Tray Slots
    for (let i = 0; i < 4; i++) {
      const slotState = state.traySlots[i];
      const view = traySlotHolders[i];
      const nextKey = slotState.foodType ? `${slotState.foodType}:raw` : '';
      if (view.renderedFood !== nextKey) {
        view.renderedFood = nextKey;
        disposeMeshTree(view.itemMount);
        view.itemMount.clear();
        if (slotState.foodType) {
          view.itemMount.add(buildFoodItemMesh(slotState.foodType, false, false, false));
        }
      }
      if (slotState.popTimer > 0) {
        const s = 1 + Math.sin(slotState.popTimer * Math.PI * 5) * 0.25;
        view.itemMount.scale.setScalar(s);
      } else {
        view.itemMount.scale.setScalar(1.0);
      }
    }

    // 5. Sync 2 Hotpot Cooking Baskets (including Glazed Supreme Star Halo)
    let anyPotReadyOrAlmost = false;
    for (let i = 0; i < 2; i++) {
      const pot = state.hotpots[i];
      const view = hotpotSlots[i];
      if (pot.state === 'ready' || pot.cookProgress >= 0.65) {
        anyPotReadyOrAlmost = true;
      }
      const nextKey = pot.state === 'empty'
        ? ''
        : `${pot.foodType}:${pot.state}:${pot.glazed ? 'glazed' : 'plain'}`;
      if (view.renderedKey !== nextKey) {
        view.renderedKey = nextKey;
        disposeMeshTree(view.itemMount);
        view.itemMount.clear();
        if (pot.foodType && pot.state !== 'empty') {
          const cooked = pot.state === 'ready' || pot.state === 'burned' || Boolean(pot.glazed);
          const burned = pot.state === 'burned';
          view.itemMount.add(buildFoodItemMesh(pot.foodType, cooked, burned, Boolean(pot.glazed)));
        }
      }

      if (pot.state === 'empty') {
        view.gaugeBg.visible = false;
        view.gaugeFill.visible = false;
      } else {
        view.gaugeBg.visible = true;
        view.gaugeFill.visible = true;
        let progress = 1.0;
        if (pot.state === 'cooking') {
          progress = Math.max(0.05, Math.min(1, pot.cookProgress));
          view.gaugeFillMat.color.setHex(pot.glazed ? 0xfbbf24 : 0x22c55e);
        } else if (pot.state === 'ready') {
          progress = Math.max(0.05, Math.min(1, 1 - pot.burnProgress));
          view.gaugeFillMat.color.setHex(pot.burnProgress > 0.6 ? 0xef4444 : 0xfacc15);
        } else {
          progress = 1.0;
          view.gaugeFillMat.color.setHex(0x475569);
        }
        const quantTheta = Math.max(1, Math.round(progress * 32)) * (Math.PI * 2 / 32);
        if (Math.abs(quantTheta - view.currentTheta) > 0.01) {
          view.currentTheta = quantTheta;
          view.gaugeFill.geometry.dispose();
          view.gaugeFill.geometry = new THREE.RingGeometry(0.25, 0.32, 28, 1, Math.PI * 0.5, quantTheta);
        }
        view.itemMount.position.y = 0.02 + Math.sin(elapsed * 8.0 + i) * 0.03;
        const foodMesh = view.itemMount.children[0];
        if (foodMesh?.userData?.glazeHaloGroup) {
          foodMesh.userData.glazeHaloGroup.rotation.y = elapsed * 3.4;
        }
      }
    }

    // 5B. Sync Pillar 1 Stations (Sauce Bar & Cocoa Warmer)
    const sbData = sauceBarGroup.userData;
    if (sbData) {
      sbData.particlesGroup.rotation.y = elapsed * 2.2;
      sbData.ladlePivot.rotation.z = Math.sin(elapsed * 4.5) * 0.14;
      sbData.readyAuraRing.material.opacity = anyPotReadyOrAlmost
        ? 0.55 + Math.sin(elapsed * 8.0) * 0.30
        : 0.18 + Math.sin(elapsed * 3.0) * 0.08;
      sbData.doubleDipCrown.visible = state.wave >= 2;
      if (sbData.doubleDipCrown.visible) {
        sbData.doubleDipCrown.rotation.y = elapsed * 3.0;
        sbData.doubleDipCrown.position.y = 0.42 + Math.sin(elapsed * 5.0) * 0.03;
      }
    }

    const ccData = cocoaStationGroup.userData;
    if (ccData) {
      ccData.mugMesh.position.y = 0.07 + Math.abs(Math.sin(elapsed * 3.6)) * 0.025;
      ccData.mugMesh.rotation.y = Math.sin(elapsed * 1.8) * 0.15;
      ccData.warmGlowRing.material.opacity = 0.52 + Math.sin(elapsed * 5.0) * 0.22;
      ccData.steamGroup.children.forEach((puff, idx) => {
        const cycle = (elapsed * 0.9 + idx * 0.33) % 1;
        puff.position.y = 0.42 + cycle * 0.28;
        puff.scale.setScalar(0.75 + Math.sin(cycle * Math.PI) * 0.45);
      });
    }

    // 5C. Sync Pillar 2 Helper Buddy & Golden Mystery Crate
    const syncHelperFn = helperEventsScene?.syncHelperAndEvents || helperEventsScene?.sync;
    if (typeof syncHelperFn === 'function') {
      syncHelperFn(state, dt, elapsed);
    }

    // 5D. Sync Pillar 3 Wave 1 / 2 / 3 Environment & Character Evolutions
    const waveNum = state.wave || 1;
    wave2PropsGroup.visible = waveNum >= 2;
    wave3PropsGroup.visible = waveNum >= 3;
    dragonCrownGroup.visible = waveNum >= 3;

    if (wave2PropsGroup.visible) {
      for (const ar of auroraRibbons) {
        const posAttr = ar.geo.attributes.position;
        for (let vi = 0; vi < posAttr.count; vi++) {
          const vx = posAttr.getX(vi);
          const vy = posAttr.getY(vi);
          const zOff = Math.sin(vx * 2.4 + elapsed * 3.2 + ar.phaseOffset) * 0.045;
          posAttr.setZ(vi, zOff + vy * 0.02);
        }
        posAttr.needsUpdate = true;
      }
      for (const il of iceLanternMeshes) {
        il.crystal.rotation.y = elapsed * 1.6;
        il.innerStar.rotation.y = -elapsed * 3.2;
      }
    }

    if (wave3PropsGroup.visible) {
      discoBallGroup.rotation.y = elapsed * 2.4;
      dragonCrownGroup.rotation.y = elapsed * 0.8;
      fairyBulbs.forEach((bulb, bIdx) => {
        const s = 0.88 + Math.sin(elapsed * 6.5 + bIdx * 0.9) * 0.22;
        bulb.scale.setScalar(s);
      });
    }

    if (seat1WaveModels.w1) {
      seat1WaveModels.w1.visible = waveNum === 1;
      seat1WaveModels.w2.visible = waveNum === 2;
      seat1WaveModels.w3.visible = waveNum >= 3;
    }
    if (seat2WaveModels.w12) {
      seat2WaveModels.w12.visible = waveNum <= 2;
      seat2WaveModels.w3.visible = waveNum >= 3;
    }

    // 6. Sync Flute Chinchilla & Window Bandit
    const chinBounce = state.fluteFeverTimer > 0 ? Math.sin(elapsed * 14.0) * 0.09 : Math.sin(elapsed * 3.2) * 0.03;
    chinchillaMesh.position.y = STATION_COORDS.chinchilla_flute.y + Math.abs(chinBounce);
    chinchillaMesh.rotation.z = state.fluteFeverTimer > 0 ? Math.sin(elapsed * 10.0) * 0.12 : 0;

    if (state.banditState === 'peeking') {
      banditHolder.visible = true;
      snowmanShell.visible = false;
      banditModel.root.visible = true;
      banditHolder.position.y = -0.22 + Math.sin(elapsed * 9.0) * 0.04;
      banditAlertRing.material.opacity = 0.65 + Math.sin(elapsed * 10.0) * 0.3;
    } else if (state.banditState === 'snowman') {
      banditHolder.visible = true;
      snowmanShell.visible = true;
      banditModel.root.visible = false;
      banditHolder.position.y = -0.26;
      banditAlertRing.material.opacity = 0;
    } else {
      banditHolder.visible = false;
      banditAlertRing.material.opacity = 0;
    }

    // 7. Sync 3 Hungry Critter Customers
    for (let i = 0; i < 3; i++) {
      const cust = state.customers[i];
      const actor = customerActors[i];
      if (!cust || !cust.active) {
        actor.root.visible = false;
        continue;
      }
      actor.root.visible = true;
      actor.charHolder.position.y = Math.abs(Math.sin(elapsed * 4.2 + i * 1.3)) * 0.06;

      if (actor.renderedCritter !== cust.friend) {
        actor.renderedCritter = cust.friend;
        if (!standeeTextures[cust.friend]) {
          standeeTextures[cust.friend] = createCritterStandeeTexture(cust.friend);
        }
        actor.badgeMat.map = standeeTextures[cust.friend];
        actor.badgeMat.needsUpdate = true;
      }

      if (actor.renderedFood !== cust.wantedFood) {
        actor.renderedFood = cust.wantedFood;
        disposeMeshTree(actor.orderIconMount);
        actor.orderIconMount.clear();
        if (cust.wantedFood) {
          const iconMesh = buildFoodItemMesh(cust.wantedFood, true, false, false);
          iconMesh.scale.setScalar(0.88);
          actor.orderIconMount.add(iconMesh);
        }
      }
      actor.orderIconMount.rotation.y = elapsed * 1.8;

      const patRatio = Math.max(0.04, Math.min(1, cust.patience / Math.max(1, cust.maxPatience)));
      actor.patienceRingMat.color.setHex(
        patRatio > 0.5 ? 0x22c55e : patRatio > 0.25 ? 0xf59e0b : 0xef4444
      );
      const quantTheta = Math.max(1, Math.round(patRatio * 32)) * (Math.PI * 2 / 32);
      if (Math.abs(quantTheta - actor.currentTheta) > 0.01) {
        actor.currentTheta = quantTheta;
        actor.patienceRing.geometry.dispose();
        actor.patienceRing.geometry = new THREE.RingGeometry(0.45, 0.54, 32, 1, Math.PI * 0.5, quantTheta);
      }
    }

    // 8. Sync Floating Drag Proxy (Food item being dragged 1:1 by finger)
    if (state.dragFood && state.dragWorldPos) {
      dragProxy.visible = true;
      const nextKey = `${state.dragFood.foodType}:${state.dragFood.cooked ? 'cooked' : 'raw'}:${state.dragFood.glazed ? 'glazed' : 'plain'}`;
      if (dragProxyKey !== nextKey) {
        dragProxyKey = nextKey;
        disposeMeshTree(dragProxy);
        dragProxy.clear();
        dragProxy.add(
          buildFoodItemMesh(
            state.dragFood.foodType,
            state.dragFood.cooked,
            state.dragFood.burned,
            Boolean(state.dragFood.glazed)
          )
        );
      }
      dragProxy.position.copy(state.dragWorldPos);
      dragProxy.position.y = 0.62;
      dragProxy.rotation.y = elapsed * 3.0;
    } else {
      if (dragProxy.visible) {
        disposeMeshTree(dragProxy);
        dragProxy.clear();
        dragProxyKey = '';
      }
      dragProxy.visible = false;
    }

    // Enforce Non-IBL Three.js r161 material hygiene (metalness <= 0.22 when scene.environment === null)
    enforceNonIblMaterialHygiene(scene);

    renderer.render(scene, camera);
  }

  // Pre-warm WebGL shaders so first spawn/burst never hitches
  renderer.compile(scene, camera);

  window.__bunkerDebug = {
    scene,
    camera,
    renderer,
    hitSpheres,
  };

  return {
    scene,
    camera,
    renderer,
    hitSpheres,
    syncAndRender,
    screenToWorldOnTable,
    pickStationAtClientPos,
    getStationScreenRect,
    spawnSuctionFlight,
    spawnSnowballFlight,
    spawnCocoaFlight,
    spawnSauceSplash,
    spawnFluteShockwave,
  };
}
