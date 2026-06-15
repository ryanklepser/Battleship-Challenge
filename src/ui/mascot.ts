import type { GamePhase } from '../game/types';

export type MascotMood = 'idle' | 'watching' | 'celebrate' | 'disappointed' | 'victory' | 'defeat';

// Pixel art otter soldier — 90's arcade style using sharp rects (no anti-aliasing)
const MASCOT_SVG = `<svg viewBox="0 0 16 20" class="mascot-svg" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <!-- Helmet -->
  <rect x="4" y="0" width="8" height="1" fill="#3a5a2a"/>
  <rect x="3" y="1" width="10" height="1" fill="#4a6e3a"/>
  <rect x="3" y="2" width="10" height="1" fill="#4a6e3a"/>
  <rect x="3" y="3" width="10" height="1" fill="#3a5a2a"/>
  <!-- Helmet star -->
  <rect x="7" y="1" width="2" height="2" fill="#f1c40f"/>
  <!-- Head -->
  <rect x="4" y="4" width="8" height="1" fill="#c49a3c"/>
  <rect x="3" y="5" width="10" height="1" fill="#c49a3c"/>
  <rect x="3" y="6" width="10" height="1" fill="#c49a3c"/>
  <rect x="4" y="7" width="8" height="1" fill="#c49a3c"/>
  <!-- Ears -->
  <rect x="2" y="4" width="2" height="2" fill="#8b6914"/>
  <rect x="12" y="4" width="2" height="2" fill="#8b6914"/>
  <!-- Eyes -->
  <rect x="5" y="5" width="2" height="2" fill="#1a1a1a"/>
  <rect x="9" y="5" width="2" height="2" fill="#1a1a1a"/>
  <!-- Eye shine -->
  <rect x="5" y="5" width="1" height="1" fill="#fff"/>
  <rect x="9" y="5" width="1" height="1" fill="#fff"/>
  <!-- Nose -->
  <rect x="7" y="7" width="2" height="1" fill="#1a1a1a"/>
  <!-- Body -->
  <rect x="4" y="8" width="8" height="1" fill="#6b4e0e"/>
  <rect x="3" y="9" width="10" height="1" fill="#8b6914"/>
  <rect x="3" y="10" width="10" height="1" fill="#8b6914"/>
  <rect x="3" y="11" width="10" height="1" fill="#8b6914"/>
  <rect x="4" y="12" width="8" height="1" fill="#8b6914"/>
  <rect x="4" y="13" width="8" height="1" fill="#6b4e0e"/>
  <!-- Belly -->
  <rect x="5" y="10" width="6" height="3" fill="#e8d5a3"/>
  <!-- Arms -->
  <rect x="1" y="9" width="2" height="4" fill="#8b6914"/>
  <rect x="13" y="9" width="2" height="4" fill="#8b6914"/>
  <!-- Dog tag -->
  <rect x="7" y="8" width="2" height="1" fill="#bdc3c7"/>
  <!-- Feet -->
  <rect x="4" y="14" width="3" height="2" fill="#6b4e0e"/>
  <rect x="9" y="14" width="3" height="2" fill="#6b4e0e"/>
  <!-- Tail -->
  <rect x="12" y="12" width="2" height="1" fill="#6b4e0e"/>
  <rect x="13" y="11" width="2" height="1" fill="#6b4e0e"/>
  <rect x="14" y="10" width="1" height="1" fill="#6b4e0e"/>
</svg>`;

let mascotEl: HTMLElement | null = null;
let currentMood: MascotMood = 'idle';
let roamInterval: ReturnType<typeof setInterval> | null = null;
let facingLeft = false;

function getRandomPosition(): { x: number; y: number } {
  const margin = 100;
  const maxX = window.innerWidth - margin;
  const maxY = window.innerHeight - margin;
  return {
    x: margin + Math.random() * (maxX - margin),
    y: margin + Math.random() * (maxY - margin),
  };
}

function moveToRandomPosition(): void {
  if (!mascotEl) return;
  const { x, y } = getRandomPosition();
  const currentLeft = mascotEl.getBoundingClientRect().left;
  facingLeft = x < currentLeft;
  mascotEl.style.left = `${x}px`;
  mascotEl.style.top = `${y}px`;
  mascotEl.style.transform = facingLeft ? 'scaleX(-1)' : 'scaleX(1)';
}

function startRoaming(): void {
  stopRoaming();
  moveToRandomPosition();
  roamInterval = setInterval(() => {
    moveToRandomPosition();
  }, 2500 + Math.random() * 2000);
}

function stopRoaming(): void {
  if (roamInterval !== null) {
    clearInterval(roamInterval);
    roamInterval = null;
  }
}

export function createMascot(): HTMLElement {
  if (mascotEl) return mascotEl;

  const container = document.createElement('div');
  container.classList.add('mascot-container');
  container.innerHTML = MASCOT_SVG;

  const speechBubble = document.createElement('div');
  speechBubble.classList.add('mascot-speech');
  container.appendChild(speechBubble);

  mascotEl = container;
  return container;
}

export function mountMascot(parent: HTMLElement): void {
  const el = createMascot();
  if (!el.parentElement) {
    parent.appendChild(el);
  }
  startRoaming();
}

export function removeMascot(): void {
  stopRoaming();
  if (mascotEl && mascotEl.parentElement) {
    mascotEl.parentElement.removeChild(mascotEl);
  }
  mascotEl = null;
}

export function setMascotMood(mood: MascotMood, message?: string): void {
  if (!mascotEl) return;
  currentMood = mood;

  mascotEl.classList.remove(
    'mascot--idle',
    'mascot--watching',
    'mascot--celebrate',
    'mascot--disappointed',
    'mascot--victory',
    'mascot--defeat',
  );
  mascotEl.classList.add(`mascot--${mood}`);

  const speech = mascotEl.querySelector('.mascot-speech') as HTMLElement | null;
  if (speech) {
    if (message) {
      speech.textContent = message;
      speech.classList.add('mascot-speech--visible');
      setTimeout(() => {
        speech.classList.remove('mascot-speech--visible');
      }, 2000);
    } else {
      speech.classList.remove('mascot-speech--visible');
    }
  }
}

export function updateMascotForPhase(phase: GamePhase, winner: 'player' | 'ai' | null): void {
  if (phase === 'battle') {
    setMascotMood('watching', 'Engage!');
    startRoaming();
  } else if (phase === 'gameover') {
    stopRoaming();
    if (winner === 'player') {
      setMascotMood('defeat', 'You got me...');
    } else {
      setMascotMood('victory', 'Fleet destroyed!');
    }
  } else {
    setMascotMood('idle');
  }
}

export function mascotReactToHit(isPlayerAttack: boolean): void {
  if (isPlayerAttack) {
    setMascotMood('disappointed', 'My ship!');
  } else {
    setMascotMood('celebrate', 'Direct hit!');
  }
  setTimeout(() => {
    if (currentMood === 'disappointed' || currentMood === 'celebrate') {
      setMascotMood('watching');
    }
  }, 1500);
}

export function mascotReactToMiss(isPlayerAttack: boolean): void {
  if (isPlayerAttack) {
    setMascotMood('celebrate', 'Ha! Missed!');
  } else {
    setMascotMood('disappointed', 'Drats...');
  }
  setTimeout(() => {
    if (currentMood === 'disappointed' || currentMood === 'celebrate') {
      setMascotMood('watching');
    }
  }, 1500);
}
