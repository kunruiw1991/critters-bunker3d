/**
 * Critter Cozy Bunker 3D - Procedural WebAudio ASMR, Spatial Vortex Whoosh,
 * Bubbling Hotpot Simmer, Chinchilla Bamboo Flute, & Cute Vocal Squeaks
 * 100% Zero-Voiceover (zero speech TTS), pure tactile WebAudio synthesis.
 */

const PENTATONIC_HZ = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66];

let ctx = null;
let masterGain = null;
let compressor = null;
let noiseBuffer = null;
let muted = false;
let listenersBound = false;
let gestureUnlocked = false;
let resumePending = false;
const lastTriggerMap = new Map();

function hasUserActivation() {
  if (typeof navigator !== 'undefined' && navigator.userActivation) {
    return Boolean(navigator.userActivation.isActive || navigator.userActivation.hasBeenActive);
  }
  return gestureUnlocked;
}

function canTrigger(key, minGapMs = 20) {
  const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  const prev = lastTriggerMap.get(key) || 0;
  if (now - prev < minGapMs) return false;
  lastTriggerMap.set(key, now);
  return true;
}

function createNoiseBuffer(audioCtx) {
  const sampleRate = audioCtx.sampleRate || 44100;
  const length = Math.floor(sampleRate * 1.5);
  const buffer = audioCtx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
    b6 = white * 0.115926;
  }
  return buffer;
}

function ensureContext() {
  if (typeof window === 'undefined') return null;
  if (!hasUserActivation()) return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      ctx = new AudioCtx();
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-16, ctx.currentTime);
      compressor.knee.setValueAtTime(24, ctx.currentTime);
      compressor.ratio.setValueAtTime(6, ctx.currentTime);
      compressor.attack.setValueAtTime(0.005, ctx.currentTime);
      compressor.release.setValueAtTime(0.18, ctx.currentTime);

      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(muted ? 0.0001 : 0.72, ctx.currentTime);

      masterGain.connect(compressor);
      compressor.connect(ctx.destination);
      noiseBuffer = createNoiseBuffer(ctx);
    } catch (_) {
      return null;
    }
  }
  if (ctx && ctx.state === 'suspended' && !resumePending) {
    resumePending = true;
    try {
      const p = ctx.resume();
      if (p && typeof p.then === 'function') {
        p.then(() => { resumePending = false; }, () => { resumePending = false; });
      } else {
        resumePending = false;
      }
    } catch (_) {
      resumePending = false;
    }
  }
  return ctx;
}

function bindGestureUnlock() {
  if (listenersBound || typeof window === 'undefined') return;
  listenersBound = true;
  const unlock = (e) => {
    if (e && e.isTrusted === false) return;
    gestureUnlocked = true;
    ensureContext();
  };
  const opts = { capture: true, passive: true };
  window.addEventListener('pointerdown', unlock, opts);
  window.addEventListener('mousedown', unlock, opts);
  window.addEventListener('touchstart', unlock, opts);
  window.addEventListener('keydown', unlock, opts);
  window.addEventListener('click', unlock, opts);
}

bindGestureUnlock();

function scheduleKalimbaNote(audioCtx, dest, freq, startTime, duration = 0.24, peakGain = 0.22) {
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, startTime);

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2, startTime);

  const g2 = audioCtx.createGain();
  g2.gain.setValueAtTime(0.18, startTime);
  g2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.45);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

  osc1.connect(gain);
  osc2.connect(g2);
  g2.connect(gain);
  gain.connect(dest);

  osc1.start(startTime);
  osc2.start(startTime);
  osc1.stop(startTime + duration + 0.02);
  osc2.stop(startTime + duration + 0.02);
}

function scheduleFilteredNoise(audioCtx, dest, startTime, duration, filterType, freqStart, freqEnd, Q, peakGain, attack = 0.015) {
  if (!noiseBuffer) noiseBuffer = createNoiseBuffer(audioCtx);
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = filterType;
  filter.Q.setValueAtTime(Q, startTime);
  filter.frequency.setValueAtTime(Math.max(40, freqStart), startTime);
  if (freqEnd && freqEnd !== freqStart) {
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), startTime + duration);
  }

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + Math.min(attack, duration * 0.45));
  gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  const offset = (startTime * 0.37) % 0.8;
  src.start(startTime, offset);
  src.stop(startTime + duration + 0.02);
}

export const BunkerAudio = {
  init() {
    bindGestureUnlock();
    return ensureContext();
  },
  isMuted() {
    return muted;
  },
  setMuted(bool) {
    muted = Boolean(bool);
    if (ctx && masterGain) {
      const now = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setTargetAtTime(muted ? 0.0001 : 0.72, now, 0.02);
    }
    return muted;
  },
  toggleMute() {
    return this.setMuted(!muted);
  },

  /**
   * Swirling purple dimensional vortex suction pop ("空间异能零元购")
   */
  playVortexSuction(slotIdx = 0) {
    if (muted || !canTrigger('vortexSuction', 35)) return;
    const audioCtx = ensureContext();
    if (!audioCtx || !masterGain) return;
    try {
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220 + (slotIdx % 4) * 45, t);
      osc.frequency.exponentialRampToValueAtTime(660 + (slotIdx % 4) * 80, t + 0.14);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.26, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.17);
      scheduleFilteredNoise(audioCtx, masterGain, t, 0.14, 'bandpass', 380, 1250, 3.0, 0.15, 0.015);
    } catch (_) {}
  },

  /**
   * Warm bubbling splash + copper chime when food drops into the 3D Mandarin-Duck Hotpot
   */
  playHotpotSplash() {
    if (muted || !canTrigger('hotpotSplash', 30)) return;
    const audioCtx = ensureContext();
    if (!audioCtx || !masterGain) return;
    try {
      const t = audioCtx.currentTime;
      for (let i = 0; i < 3; i++) {
        const dt = i * 0.045;
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        const f0 = 280 + i * 110;
        osc.frequency.setValueAtTime(f0, t + dt);
        osc.frequency.exponentialRampToValueAtTime(f0 * 1.65, t + dt + 0.075);
        g.gain.setValueAtTime(0.0001, t + dt);
        g.gain.linearRampToValueAtTime(0.22, t + dt + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.085);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(t + dt);
        osc.stop(t + dt + 0.09);
      }
      scheduleFilteredNoise(audioCtx, masterGain, t, 0.18, 'bandpass', 650, 1400, 2.4, 0.16, 0.01);
    } catch (_) {}
  },

  /**
   * Sparkling golden bell chime when hotpot delicacy finishes cooking
   */
  playHotpotReady() {
    if (muted || !canTrigger('hotpotReady', 50)) return;
    const audioCtx = ensureContext();
    if (!audioCtx || !masterGain) return;
    try {
      const t = audioCtx.currentTime;
      scheduleKalimbaNote(audioCtx, masterGain, 783.99, t, 0.22, 0.20);
      scheduleKalimbaNote(audioCtx, masterGain, 1046.50, t + 0.07, 0.28, 0.24);
    } catch (_) {}
  },

  /**
   * Happy munch + coin arpeggio when feeding CatNap-riding-DogDay or guest Critter
   */
  playServeDelicacy(combo = 1) {
    if (muted || !canTrigger('serveDelicacy', 35)) return;
    const audioCtx = ensureContext();
    if (!audioCtx || !masterGain) return;
    try {
      const t = audioCtx.currentTime;
      const baseIdx = Math.min(3, Math.max(0, combo - 1));
      for (let i = 0; i < 3; i++) {
        const freq = PENTATONIC_HZ[(baseIdx + i) % PENTATONIC_HZ.length];
        scheduleKalimbaNote(audioCtx, masterGain, freq, t + i * 0.055, 0.24, 0.22);
      }
    } catch (_) {}
  },

  /**
   * Giant Chinchilla ("吹笛子的大龙猫") magical bamboo flute melody
   */
  playChinchillaFlute() {
    if (muted || !canTrigger('chinchillaFlute', 80)) return;
    const audioCtx = ensureContext();
    if (!audioCtx || !masterGain) return;
    try {
      const t = audioCtx.currentTime;
      const notes = [659.25, 783.99, 880.00, 1046.50];
      notes.forEach((freq, idx) => {
        const st = t + idx * 0.075;
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, st);
        g.gain.setValueAtTime(0.0001, st);
        g.gain.linearRampToValueAtTime(0.20, st + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.22);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(st);
        osc.stop(st + 0.24);
      });
    } catch (_) {}
  },

  /**
   * Crisp snowball bonk when hitting a window bandit outside the frosted -70°C window
   */
  playSnowballBonk() {
    if (muted || !canTrigger('snowballBonk', 40)) return;
    const audioCtx = ensureContext();
    if (!audioCtx || !masterGain) return;
    try {
      const t = audioCtx.currentTime;
      scheduleFilteredNoise(audioCtx, masterGain, t, 0.14, 'bandpass', 900, 420, 1.8, 0.24, 0.008);
      scheduleKalimbaNote(audioCtx, masterGain, 587.33, t + 0.02, 0.18, 0.22);
      scheduleKalimbaNote(audioCtx, masterGain, 880.00, t + 0.08, 0.24, 0.24);
    } catch (_) {}
  },

  playBurnPuff() {
    if (muted || !canTrigger('burnPuff', 60)) return;
    const audioCtx = ensureContext();
    if (!audioCtx || !masterGain) return;
    try {
      const t = audioCtx.currentTime;
      scheduleFilteredNoise(audioCtx, masterGain, t, 0.24, 'lowpass', 480, 140, 1.2, 0.22, 0.015);
      scheduleKalimbaNote(audioCtx, masterGain, 220, t, 0.22, 0.18);
    } catch (_) {}
  },

  playWaveEnd(stars = 0) {
    if (muted || !canTrigger('waveEnd', 100)) return;
    const audioCtx = ensureContext();
    if (!audioCtx || !masterGain) return;
    try {
      const t = audioCtx.currentTime;
      if (stars > 0) {
        const fan = [523.25, 659.25, 783.99, 1046.50];
        fan.forEach((f, i) => scheduleKalimbaNote(audioCtx, masterGain, f, t + i * 0.08, 0.35, 0.24));
      } else {
        scheduleKalimbaNote(audioCtx, masterGain, 329.63, t, 0.26, 0.20);
        scheduleKalimbaNote(audioCtx, masterGain, 261.63, t + 0.12, 0.32, 0.20);
      }
    } catch (_) {}
  }
};

if (typeof window !== 'undefined') {
  window.BunkerAudio = BunkerAudio;
}
