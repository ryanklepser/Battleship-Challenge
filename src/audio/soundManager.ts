let audioCtx: AudioContext | null = null;
let muted = true;
let unlocked = false;
let ambientNode: { gain: GainNode; stop: () => void } | null = null;
let ambientEnabled = false;

function ctx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function unlock(): void {
  if (unlocked) return;
  const ac = ctx();
  if (ac.state === 'suspended') {
    void ac.resume();
  }
  unlocked = true;
  muted = false;
}

export function isMuted(): boolean {
  return muted;
}

export function isUnlocked(): boolean {
  return unlocked;
}

export function toggleMute(): boolean {
  if (!unlocked) {
    unlock();
    return false;
  }
  muted = !muted;
  if (muted) {
    stopAmbient();
  } else if (ambientEnabled) {
    startAmbient();
  }
  return muted;
}

function playNote(
  frequency: number,
  duration: number,
  type: OscillatorType,
  gainValue: number,
  startTime?: number,
  endGain?: number,
): void {
  if (muted) return;
  const ac = ctx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(gainValue, startTime ?? ac.currentTime);
  gain.gain.linearRampToValueAtTime(
    endGain ?? 0,
    (startTime ?? ac.currentTime) + duration,
  );
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(startTime ?? ac.currentTime);
  osc.stop((startTime ?? ac.currentTime) + duration);
}

function noise(duration: number, gainValue: number, startTime?: number): void {
  if (muted) return;
  const ac = ctx();
  const bufferSize = Math.ceil(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;

  const bandpass = ac.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 800;
  bandpass.Q.value = 0.5;

  const gain = ac.createGain();
  const t = startTime ?? ac.currentTime;
  gain.gain.setValueAtTime(gainValue, t);
  gain.gain.linearRampToValueAtTime(0, t + duration);

  src.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(ac.destination);
  src.start(t);
  src.stop(t + duration);
}

export function playMissileLaunch(): void {
  if (muted) return;
  const ac = ctx();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
  osc.frequency.exponentialRampToValueAtTime(800, t + 0.3);
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.linearRampToValueAtTime(0.08, t + 0.15);
  gain.gain.linearRampToValueAtTime(0, t + 0.3);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.3);

  noise(0.2, 0.06, t);
}

export function playHit(): void {
  if (muted) return;
  const ac = ctx();
  const t = ac.currentTime;

  // Low crunch
  const osc1 = ac.createOscillator();
  const gain1 = ac.createGain();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(120, t);
  osc1.frequency.exponentialRampToValueAtTime(40, t + 0.3);
  gain1.gain.setValueAtTime(0.2, t);
  gain1.gain.linearRampToValueAtTime(0, t + 0.35);
  osc1.connect(gain1);
  gain1.connect(ac.destination);
  osc1.start(t);
  osc1.stop(t + 0.35);

  // Metallic ring
  playNote(800, 0.15, 'square', 0.1, t, 0);
  playNote(600, 0.2, 'square', 0.08, t + 0.02, 0);

  noise(0.25, 0.15, t);
}

export function playMiss(): void {
  if (muted) return;
  const ac = ctx();
  const t = ac.currentTime;

  // Water splash — filtered noise burst
  const bufferSize = Math.ceil(ac.sampleRate * 0.4);
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;

  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(2000, t);
  lp.frequency.exponentialRampToValueAtTime(400, t + 0.3);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.18, t);
  gain.gain.linearRampToValueAtTime(0, t + 0.4);

  src.connect(lp);
  lp.connect(gain);
  gain.connect(ac.destination);
  src.start(t);
  src.stop(t + 0.4);

  // Subtle plop tone
  playNote(200, 0.1, 'sine', 0.08, t, 0);
}

export function playShipSunk(): void {
  if (muted) return;
  const ac = ctx();
  const t = ac.currentTime;

  // Low horn
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.linearRampToValueAtTime(80, t + 0.8);
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.setValueAtTime(0.15, t + 0.4);
  gain.gain.linearRampToValueAtTime(0, t + 0.8);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.8);

  // Creaking overtone
  playNote(220, 0.6, 'triangle', 0.06, t + 0.1, 0);
  playNote(165, 0.5, 'triangle', 0.04, t + 0.15, 0);

  noise(0.3, 0.05, t + 0.05);
}

export function playVictory(): void {
  if (muted) return;
  const ac = ctx();
  const t = ac.currentTime;

  // Triumphant horn fanfare — ascending notes
  const notes = [
    { freq: 261.6, start: 0, dur: 0.2 },    // C4
    { freq: 329.6, start: 0.15, dur: 0.2 },  // E4
    { freq: 392.0, start: 0.3, dur: 0.2 },   // G4
    { freq: 523.3, start: 0.45, dur: 0.5 },   // C5
  ];

  for (const n of notes) {
    playNote(n.freq, n.dur, 'square', 0.1, t + n.start, 0.02);
    playNote(n.freq * 1.005, n.dur, 'sawtooth', 0.05, t + n.start, 0);
  }

  // Final sustained chord
  playNote(523.3, 0.6, 'triangle', 0.08, t + 0.6, 0);
  playNote(659.3, 0.6, 'triangle', 0.06, t + 0.6, 0);
  playNote(784.0, 0.6, 'triangle', 0.05, t + 0.6, 0);
}

export function startAmbient(): void {
  if (muted || ambientNode) return;
  ambientEnabled = true;
  const ac = ctx();

  // Low ocean rumble via filtered noise
  const bufferSize = ac.sampleRate * 4;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.loop = true;

  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 200;

  const gain = ac.createGain();
  gain.gain.value = 0.04;

  src.connect(lp);
  lp.connect(gain);
  gain.connect(ac.destination);
  src.start();

  // Sonar pings
  const pingInterval = setInterval(() => {
    if (muted) return;
    const pt = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1200;
    g.gain.setValueAtTime(0.03, pt);
    g.gain.linearRampToValueAtTime(0, pt + 0.8);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(pt);
    osc.stop(pt + 0.8);
  }, 5000);

  ambientNode = {
    gain,
    stop: () => {
      clearInterval(pingInterval);
      try { src.stop(); } catch { /* already stopped */ }
    },
  };
}

export function stopAmbient(): void {
  if (ambientNode) {
    ambientNode.stop();
    ambientNode = null;
  }
}

export function isAmbientEnabled(): boolean {
  return ambientEnabled;
}

export function toggleAmbient(): boolean {
  ambientEnabled = !ambientEnabled;
  if (ambientEnabled && !muted) {
    startAmbient();
  } else {
    stopAmbient();
  }
  return ambientEnabled;
}
