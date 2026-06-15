import type { GamePhase } from '../game/types';

export type MascotMood = 'idle' | 'watching' | 'celebrate' | 'disappointed' | 'victory' | 'defeat';

const MASCOT_SVG = `<svg viewBox="0 0 80 100" class="mascot-svg" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 3D lighting gradients -->
    <radialGradient id="bodyGrad" cx="40%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#D4A84B"/>
      <stop offset="60%" stop-color="#8B6914"/>
      <stop offset="100%" stop-color="#5C4510"/>
    </radialGradient>
    <radialGradient id="bodyInnerGrad" cx="40%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#E0B860"/>
      <stop offset="60%" stop-color="#C49A3C"/>
      <stop offset="100%" stop-color="#9A7520"/>
    </radialGradient>
    <radialGradient id="bellyGrad" cx="45%" cy="30%" r="55%">
      <stop offset="0%" stop-color="#FFF5E0"/>
      <stop offset="70%" stop-color="#E8D5A3"/>
      <stop offset="100%" stop-color="#C9B580"/>
    </radialGradient>
    <radialGradient id="headGrad" cx="38%" cy="32%" r="55%">
      <stop offset="0%" stop-color="#D4A84B"/>
      <stop offset="55%" stop-color="#8B6914"/>
      <stop offset="100%" stop-color="#5C4510"/>
    </radialGradient>
    <radialGradient id="helmetGrad" cx="40%" cy="25%" r="60%">
      <stop offset="0%" stop-color="#6B8050"/>
      <stop offset="50%" stop-color="#4a5e3a"/>
      <stop offset="100%" stop-color="#2d3b22"/>
    </radialGradient>
    <radialGradient id="eyeGrad" cx="35%" cy="30%" r="50%">
      <stop offset="0%" stop-color="#333"/>
      <stop offset="100%" stop-color="#000"/>
    </radialGradient>
    <linearGradient id="tagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e8e8e8"/>
      <stop offset="50%" stop-color="#bdc3c7"/>
      <stop offset="100%" stop-color="#8e9499"/>
    </linearGradient>
    <filter id="mascotShadow" x="-20%" y="-10%" width="140%" height="130%">
      <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.4"/>
    </filter>
  </defs>
  <g filter="url(#mascotShadow)">
    <!-- Body -->
    <ellipse cx="40" cy="72" rx="18" ry="22" fill="url(#bodyGrad)"/>
    <ellipse cx="40" cy="72" rx="14" ry="18" fill="url(#bodyInnerGrad)"/>
    <!-- Belly -->
    <ellipse cx="40" cy="78" rx="10" ry="12" fill="url(#bellyGrad)"/>
    <!-- Tail -->
    <ellipse cx="58" cy="88" rx="10" ry="4" fill="#6B4E0E" transform="rotate(-20 58 88)"/>
    <ellipse cx="57" cy="87" rx="7" ry="2.5" fill="#8B6914" transform="rotate(-20 57 87)"/>
    <!-- Arms -->
    <ellipse cx="24" cy="70" rx="5" ry="8" fill="url(#bodyGrad)" transform="rotate(15 24 70)"/>
    <ellipse cx="56" cy="70" rx="5" ry="8" fill="url(#bodyGrad)" transform="rotate(-15 56 70)"/>
    <!-- Paws -->
    <ellipse cx="22" cy="78" rx="4" ry="3" fill="#6B4E0E"/>
    <ellipse cx="22" cy="77.5" rx="2.5" ry="1.8" fill="#8B6914"/>
    <ellipse cx="58" cy="78" rx="4" ry="3" fill="#6B4E0E"/>
    <ellipse cx="58" cy="77.5" rx="2.5" ry="1.8" fill="#8B6914"/>
    <!-- Head -->
    <circle cx="40" cy="38" r="18" fill="url(#headGrad)"/>
    <!-- Face mask -->
    <ellipse cx="40" cy="42" rx="12" ry="10" fill="url(#bodyInnerGrad)"/>
    <!-- Ears -->
    <circle cx="26" cy="24" r="6" fill="url(#bodyGrad)"/>
    <circle cx="26" cy="24" r="3.5" fill="url(#bellyGrad)"/>
    <circle cx="54" cy="24" r="6" fill="url(#bodyGrad)"/>
    <circle cx="54" cy="24" r="3.5" fill="url(#bellyGrad)"/>
    <!-- Eyes -->
    <circle cx="34" cy="36" r="3.5" fill="url(#eyeGrad)"/>
    <circle cx="46" cy="36" r="3.5" fill="url(#eyeGrad)"/>
    <circle cx="35" cy="34.5" r="1.5" fill="#fff" opacity="0.9"/>
    <circle cx="47" cy="34.5" r="1.5" fill="#fff" opacity="0.9"/>
    <circle cx="33.5" cy="37.5" r="0.6" fill="#fff" opacity="0.5"/>
    <circle cx="45.5" cy="37.5" r="0.6" fill="#fff" opacity="0.5"/>
    <!-- Nose -->
    <ellipse cx="40" cy="42" rx="3" ry="2" fill="#1a1a1a"/>
    <ellipse cx="39.5" cy="41.5" rx="1" ry="0.6" fill="#444" opacity="0.6"/>
    <!-- Mouth -->
    <path d="M37 46 Q40 49 43 46" stroke="#6B4E0E" stroke-width="1.2" fill="none"/>
    <!-- Whiskers -->
    <line x1="28" y1="42" x2="18" y2="40" stroke="#6B4E0E" stroke-width="0.8" opacity="0.7"/>
    <line x1="28" y1="44" x2="18" y2="45" stroke="#6B4E0E" stroke-width="0.8" opacity="0.7"/>
    <line x1="52" y1="42" x2="62" y2="40" stroke="#6B4E0E" stroke-width="0.8" opacity="0.7"/>
    <line x1="52" y1="44" x2="62" y2="45" stroke="#6B4E0E" stroke-width="0.8" opacity="0.7"/>
    <!-- Military Helmet -->
    <path d="M22 32 Q22 12 40 10 Q58 12 58 32" fill="url(#helmetGrad)"/>
    <rect x="22" y="30" width="36" height="5" rx="2" fill="#3d4e30"/>
    <!-- Helmet highlight -->
    <path d="M28 18 Q34 13 42 14" stroke="rgba(255,255,255,0.15)" stroke-width="2" fill="none"/>
    <!-- Helmet star -->
    <polygon points="40,16 41.5,20 46,20 42.5,23 43.5,27 40,24.5 36.5,27 37.5,23 34,20 38.5,20" fill="#f1c40f"/>
    <polygon points="40,17.5 41,19.5 44,19.5 41.8,21.5 42.5,24 40,22.5 37.5,24 38.2,21.5 36,19.5 39,19.5" fill="#f9d64a" opacity="0.6"/>
    <!-- Helmet strap -->
    <path d="M26 35 Q26 40 30 42" stroke="#3d4e30" stroke-width="1.5" fill="none"/>
    <path d="M54 35 Q54 40 50 42" stroke="#3d4e30" stroke-width="1.5" fill="none"/>
    <!-- Dog tags -->
    <line x1="40" y1="52" x2="40" y2="58" stroke="url(#tagGrad)" stroke-width="1"/>
    <rect x="36" y="58" width="8" height="5" rx="1" fill="url(#tagGrad)"/>
    <rect x="37" y="59" width="6" height="3" rx="0.5" fill="none" stroke="#8e9499" stroke-width="0.3"/>
    <!-- Feet -->
    <ellipse cx="33" cy="93" rx="6" ry="4" fill="#6B4E0E"/>
    <ellipse cx="33" cy="92" rx="4" ry="2.5" fill="#8B6914" opacity="0.6"/>
    <ellipse cx="47" cy="93" rx="6" ry="4" fill="#6B4E0E"/>
    <ellipse cx="47" cy="92" rx="4" ry="2.5" fill="#8B6914" opacity="0.6"/>
  </g>
</svg>`;

let mascotEl: HTMLElement | null = null;
let currentMood: MascotMood = 'idle';

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
}

export function removeMascot(): void {
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
