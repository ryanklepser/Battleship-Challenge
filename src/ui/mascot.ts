import type { GamePhase } from '../game/types';

export type MascotMood = 'idle' | 'watching' | 'celebrate' | 'disappointed' | 'victory' | 'defeat';

const MASCOT_SVG = `<svg viewBox="0 0 80 100" class="mascot-svg" xmlns="http://www.w3.org/2000/svg">
  <!-- Body -->
  <ellipse cx="40" cy="72" rx="18" ry="22" fill="#8B6914"/>
  <ellipse cx="40" cy="72" rx="14" ry="18" fill="#C49A3C"/>
  <!-- Belly -->
  <ellipse cx="40" cy="78" rx="10" ry="12" fill="#E8D5A3"/>
  <!-- Tail -->
  <ellipse cx="58" cy="88" rx="10" ry="4" fill="#6B4E0E" transform="rotate(-20 58 88)"/>
  <!-- Arms -->
  <ellipse cx="24" cy="70" rx="5" ry="8" fill="#8B6914" transform="rotate(15 24 70)"/>
  <ellipse cx="56" cy="70" rx="5" ry="8" fill="#8B6914" transform="rotate(-15 56 70)"/>
  <!-- Paws -->
  <ellipse cx="22" cy="78" rx="4" ry="3" fill="#6B4E0E"/>
  <ellipse cx="58" cy="78" rx="4" ry="3" fill="#6B4E0E"/>
  <!-- Head -->
  <circle cx="40" cy="38" r="18" fill="#8B6914"/>
  <!-- Face mask -->
  <ellipse cx="40" cy="42" rx="12" ry="10" fill="#C49A3C"/>
  <!-- Ears -->
  <circle cx="26" cy="24" r="6" fill="#8B6914"/>
  <circle cx="26" cy="24" r="3.5" fill="#E8D5A3"/>
  <circle cx="54" cy="24" r="6" fill="#8B6914"/>
  <circle cx="54" cy="24" r="3.5" fill="#E8D5A3"/>
  <!-- Eyes -->
  <circle cx="34" cy="36" r="3.5" fill="#1a1a1a"/>
  <circle cx="46" cy="36" r="3.5" fill="#1a1a1a"/>
  <circle cx="35" cy="35" r="1.2" fill="#fff"/>
  <circle cx="47" cy="35" r="1.2" fill="#fff"/>
  <!-- Nose -->
  <ellipse cx="40" cy="42" rx="3" ry="2" fill="#1a1a1a"/>
  <!-- Mouth -->
  <path d="M37 46 Q40 49 43 46" stroke="#6B4E0E" stroke-width="1.2" fill="none"/>
  <!-- Whiskers -->
  <line x1="28" y1="42" x2="18" y2="40" stroke="#6B4E0E" stroke-width="0.8"/>
  <line x1="28" y1="44" x2="18" y2="45" stroke="#6B4E0E" stroke-width="0.8"/>
  <line x1="52" y1="42" x2="62" y2="40" stroke="#6B4E0E" stroke-width="0.8"/>
  <line x1="52" y1="44" x2="62" y2="45" stroke="#6B4E0E" stroke-width="0.8"/>
  <!-- Military Helmet -->
  <path d="M22 32 Q22 12 40 10 Q58 12 58 32" fill="#4a5e3a"/>
  <rect x="22" y="30" width="36" height="5" rx="2" fill="#3d4e30"/>
  <!-- Helmet star -->
  <polygon points="40,16 41.5,20 46,20 42.5,23 43.5,27 40,24.5 36.5,27 37.5,23 34,20 38.5,20" fill="#f1c40f"/>
  <!-- Helmet strap -->
  <path d="M26 35 Q26 40 30 42" stroke="#3d4e30" stroke-width="1.5" fill="none"/>
  <path d="M54 35 Q54 40 50 42" stroke="#3d4e30" stroke-width="1.5" fill="none"/>
  <!-- Dog tags -->
  <line x1="40" y1="52" x2="40" y2="58" stroke="#bdc3c7" stroke-width="0.8"/>
  <rect x="36" y="58" width="8" height="5" rx="1" fill="#bdc3c7"/>
  <!-- Feet -->
  <ellipse cx="33" cy="93" rx="6" ry="4" fill="#6B4E0E"/>
  <ellipse cx="47" cy="93" rx="6" ry="4" fill="#6B4E0E"/>
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
