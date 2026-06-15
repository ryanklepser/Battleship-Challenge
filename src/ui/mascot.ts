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

let leftMascot: HTMLElement | null = null;
let rightMascot: HTMLElement | null = null;
let currentMood: MascotMood = 'idle';

function createMascotElement(side: 'left' | 'right'): HTMLElement {
  const container = document.createElement('div');
  container.classList.add('mascot-container', `mascot-container--${side}`);
  container.innerHTML = MASCOT_SVG;

  const speechBubble = document.createElement('div');
  speechBubble.classList.add('mascot-speech');
  container.appendChild(speechBubble);

  return container;
}

export function createMascot(): HTMLElement {
  // For backward compatibility, return the left mascot
  if (!leftMascot) {
    leftMascot = createMascotElement('left');
  }
  return leftMascot;
}

export function mountMascot(parent: HTMLElement): void {
  if (!leftMascot) {
    leftMascot = createMascotElement('left');
  }
  if (!rightMascot) {
    rightMascot = createMascotElement('right');
  }

  const gameLayout = parent.querySelector('.game-layout');
  const boards = parent.querySelector('.boards');
  if (gameLayout && boards) {
    if (!leftMascot.parentElement) {
      gameLayout.insertBefore(leftMascot, boards);
    }
    if (!rightMascot.parentElement) {
      boards.insertAdjacentElement('afterend', rightMascot);
    }
  } else {
    if (!leftMascot.parentElement) {
      parent.appendChild(leftMascot);
    }
    if (!rightMascot.parentElement) {
      parent.appendChild(rightMascot);
    }
  }
}

export function removeMascot(): void {
  if (leftMascot && leftMascot.parentElement) {
    leftMascot.parentElement.removeChild(leftMascot);
  }
  if (rightMascot && rightMascot.parentElement) {
    rightMascot.parentElement.removeChild(rightMascot);
  }
  leftMascot = null;
  rightMascot = null;
}

function setMoodOnElement(el: HTMLElement, mood: MascotMood, message?: string): void {
  el.classList.remove(
    'mascot--idle',
    'mascot--watching',
    'mascot--celebrate',
    'mascot--disappointed',
    'mascot--victory',
    'mascot--defeat',
  );
  el.classList.add(`mascot--${mood}`);

  const speech = el.querySelector('.mascot-speech') as HTMLElement | null;
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

export function setMascotMood(mood: MascotMood, message?: string): void {
  currentMood = mood;
  if (leftMascot) setMoodOnElement(leftMascot, mood, message);
  if (rightMascot) setMoodOnElement(rightMascot, mood, message);
}

export function mascotShoutFire(side: 'player' | 'ai' = 'player'): void {
  if (side === 'player') {
    if (leftMascot) setMoodOnElement(leftMascot, 'celebrate', 'Fire!');
  } else {
    if (rightMascot) setMoodOnElement(rightMascot, 'celebrate', 'Fire!');
  }
  setTimeout(() => {
    if (currentMood === 'watching' || currentMood === 'celebrate') {
      if (leftMascot) setMoodOnElement(leftMascot, 'watching');
      if (rightMascot) setMoodOnElement(rightMascot, 'watching');
    }
  }, 1500);
}

export function updateMascotForPhase(phase: GamePhase, winner: 'player' | 'ai' | null): void {
  if (phase === 'battle') {
    setMascotMood('watching');
  } else if (phase === 'gameover') {
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
