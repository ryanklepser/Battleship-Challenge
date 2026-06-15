import './style.css';
import type { GameState, Difficulty, GameStats } from './game/types';
import { BOARD_SIZE } from './game/types';
import {
  renderBoard,
  renderStatus,
  renderDifficultySelector,
  renderPlacementControls,
  showAttackAnimation,
  showResultPopup,
  updatePreview,
} from './ui/renderer';
import {
  createGameState,
  playerAttack,
  aiAttack,
  rotateCurrentShip,
  placeCurrentShip,
  getPlacementPreview,
} from './game/engine';
import { formatCoordinate } from './utils/helpers';
import {
  mountMascot,
  removeMascot,
  updateMascotForPhase,
  mascotReactToHit,
  mascotReactToMiss,
} from './ui/mascot';

const app = document.querySelector<HTMLDivElement>('#app')!;
let gameAbort: AbortController | null = null;

function removeLandingBg(): void {
  document.querySelector('.landing-bg')?.remove();
}

function showMenu(): void {
  removeMascot();
  removeLandingBg();

  const bg = document.createElement('div');
  bg.classList.add('landing-bg');
  bg.innerHTML = `
    <div class="wave-layer wave-layer--1"></div>
    <div class="wave-layer wave-layer--2"></div>
    <div class="wave-layer wave-layer--3"></div>
  `;
  document.body.appendChild(bg);

  app.innerHTML = `
    <header class="header" role="banner">
      <h1>⚓ Battlefield</h1>
      <p>Sink Devin's fleet before Devin sinks yours!</p>
    </header>
    <main id="game-root" role="main"></main>
  `;

  const gameRoot = document.querySelector<HTMLDivElement>('#game-root')!;
  renderDifficultySelector(gameRoot, startGame);
}

function startGame(difficulty: Difficulty): void {
  removeLandingBg();
  const state = createGameState(difficulty);
  renderGame(state);
}

function renderGame(state: GameState): void {
  if (gameAbort) gameAbort.abort();
  gameAbort = new AbortController();
  const { signal } = gameAbort;

  app.innerHTML = `
    <header class="header" role="banner">
      <h1>⚓ Battlefield</h1>
    </header>
    <main role="main">
      <div id="status" class="status" role="status" aria-live="polite"></div>
      <div class="boards">
        <section class="board-wrapper" aria-label="Your Fleet">
          <h2 class="board-title">Your Fleet</h2>
          <div id="player-board"></div>
        </section>
        <section class="board-wrapper" aria-label="Devin's Waters">
          <h2 class="board-title">Devin's Waters</h2>
          <div id="ai-board"></div>
        </section>
      </div>
      <div id="game-actions" class="game-actions" role="toolbar" aria-label="Game actions"></div>
    </main>
  `;

  const statusEl = document.querySelector<HTMLDivElement>('#status')!;
  const playerBoardEl = document.querySelector<HTMLDivElement>('#player-board')!;
  const aiBoardEl = document.querySelector<HTMLDivElement>('#ai-board')!;
  const actionsEl = document.querySelector<HTMLDivElement>('#game-actions')!;

  mountMascot(document.body);
  updateMascotForPhase(state.phase, state.winner);

  let animating = false;

  function update(): void {
    renderStatus(state, statusEl);
    updateMascotForPhase(state.phase, state.winner);

    if (state.phase === 'placement') {
      renderBoard(state.playerBoard, playerBoardEl, false, handlePlacementClick, state.playerShips);
      renderBoard(state.aiBoard, aiBoardEl, true);

      renderPlacementControls(
        actionsEl,
        state.placement?.orientation ?? 'horizontal',
        handleRotate,
      );
    } else if (state.phase === 'battle') {
      renderBoard(state.playerBoard, playerBoardEl, false, undefined, state.playerShips);

      if (!animating) {
        renderBoard(state.aiBoard, aiBoardEl, true, handlePlayerClick);
      } else {
        renderBoard(state.aiBoard, aiBoardEl, true);
      }

      actionsEl.innerHTML = '';
    } else {
      renderBoard(state.playerBoard, playerBoardEl, false, undefined, state.playerShips);
      renderBoard(state.aiBoard, aiBoardEl, false, undefined, state.aiShips);

      renderGameOver(actionsEl);
    }
  }

  function showPreview(row: number, col: number): void {
    if (state.phase !== 'placement') return;
    const preview = getPlacementPreview(state, { row, col });
    updatePreview(playerBoardEl, preview.cells, preview.valid);
  }

  function clearPreview(): void {
    updatePreview(playerBoardEl, [], false);
  }

  playerBoardEl.addEventListener('mouseover', (e) => {
    const cell = (e.target as HTMLElement).closest('.cell') as HTMLElement | null;
    if (cell) {
      const row = parseInt(cell.dataset.row ?? '0');
      const col = parseInt(cell.dataset.col ?? '0');
      showPreview(row, col);
    }
  }, { signal });

  playerBoardEl.addEventListener('mouseout', (e) => {
    const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
    if (!related || !playerBoardEl.contains(related)) {
      clearPreview();
    }
  }, { signal });

  function handlePlacementClick(row: number, col: number): void {
    const placed = placeCurrentShip(state, { row, col });
    if (placed) {
      update();
    }
  }

  function handleRotate(): void {
    rotateCurrentShip(state);
    clearPreview();
    update();
  }

  function handlePlayerClick(row: number, col: number): void {
    if (animating) return;

    const result = playerAttack(state, { row, col });
    if (!result) return;

    animating = true;
    update();

    showAttackAnimation(
      playerBoardEl,
      aiBoardEl,
      row,
      col,
      result.result !== 'miss',
      () => {
        const coord = formatCoordinate(result.target);
        if (result.result === 'sunk') {
          showResultPopup('sunk', result.sunkShipName);
        } else {
          showResultPopup(result.result);
        }

        if (result.result === 'miss') {
          mascotReactToMiss(true);
        } else {
          mascotReactToHit(true);
        }

        animating = false;
        update();

        if (!result.gameOver) {
          runAITurn();
        }

        void coord;
      },
    );
  }

  function runAITurn(): void {
    animating = true;
    update();

    aiAttack(state, (result) => {
      showAttackAnimation(
        aiBoardEl,
        playerBoardEl,
        result.target.row,
        result.target.col,
        result.result !== 'miss',
        () => {
          const coord = formatCoordinate(result.target);
          if (result.result === 'sunk') {
            showResultPopup('sunk', result.sunkShipName);
          } else {
            showResultPopup(result.result);
          }

          if (result.result === 'miss') {
            mascotReactToMiss(false);
          } else {
            mascotReactToHit(false);
          }

          animating = false;
          update();

          void coord;
        },
      );
    });
  }

  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function getStatsHTML(stats: GameStats): string {
    const accuracy = stats.playerShotsFired > 0
      ? Math.round((stats.playerHits / stats.playerShotsFired) * 100)
      : 0;
    const elapsed = stats.gameStartTime
      ? formatTime(Date.now() - stats.gameStartTime)
      : '0:00';
    return `<div class="gameover-stats">
      <span class="gameover-stat">Shots: ${stats.playerShotsFired}</span>
      <span class="gameover-stat-divider">|</span>
      <span class="gameover-stat">Accuracy: ${accuracy}%</span>
      <span class="gameover-stat-divider">|</span>
      <span class="gameover-stat">Time: ${elapsed}</span>
    </div>`;
  }

  function spawnConfetti(overlay: HTMLElement): void {
    const colors = ['#f39c12', '#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c'];
    for (let i = 0; i < 80; i++) {
      const particle = document.createElement('div');
      particle.classList.add('confetti-particle');
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.animationDelay = `${Math.random() * 2}s`;
      particle.style.animationDuration = `${2 + Math.random() * 2}s`;
      particle.style.width = `${6 + Math.random() * 8}px`;
      particle.style.height = `${6 + Math.random() * 8}px`;
      overlay.appendChild(particle);
    }
  }

  function renderGameOver(container: HTMLElement): void {
    container.innerHTML = '';

    const overlay = document.createElement('div');
    overlay.classList.add('gameover-overlay');

    if (state.winner === 'player') {
      overlay.classList.add('gameover-overlay--victory');
      spawnConfetti(overlay);

      overlay.innerHTML = `
        <div class="gameover-content">
          <h2 class="gameover-title gameover-title--victory">VICTORY</h2>
          ${getStatsHTML(state.stats)}
          <div class="gameover-actions">
            <button class="btn btn--play-again" data-action="play-again">Play Again</button>
            <button class="btn btn--expert" data-action="harder">Increase Difficulty</button>
          </div>
        </div>
      `;
    } else {
      overlay.classList.add('gameover-overlay--defeat');

      overlay.innerHTML = `
        <div class="gameover-content">
          <h2 class="gameover-title gameover-title--defeat">DEFEATED</h2>
          ${getStatsHTML(state.stats)}
          <div class="gameover-actions">
            <button class="btn btn--play-again" data-action="play-again">Try Again</button>
            <button class="btn btn--easy" data-action="easier">Lower Difficulty?</button>
          </div>
        </div>
      `;
    }

    container.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('gameover-overlay--visible');
    });

    overlay.querySelector('[data-action="play-again"]')?.addEventListener('click', showMenu);
    overlay.querySelector('[data-action="harder"]')?.addEventListener('click', () => {
      const next: Difficulty = state.difficulty === 'easy' ? 'medium' : 'expert';
      startGame(next);
    });
    overlay.querySelector('[data-action="easier"]')?.addEventListener('click', () => {
      const next: Difficulty = state.difficulty === 'expert' ? 'medium' : 'easy';
      startGame(next);
    });
  }

  function handleGridKeydown(e: KeyboardEvent, boardEl: HTMLElement, clickHandler?: (row: number, col: number) => void): void {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('cell')) return;

    const row = parseInt(target.dataset.row ?? '0');
    const col = parseInt(target.dataset.col ?? '0');
    let nextRow = row;
    let nextCol = col;

    switch (e.key) {
      case 'ArrowUp':    nextRow = Math.max(0, row - 1); break;
      case 'ArrowDown':  nextRow = Math.min(BOARD_SIZE - 1, row + 1); break;
      case 'ArrowLeft':  nextCol = Math.max(0, col - 1); break;
      case 'ArrowRight': nextCol = Math.min(BOARD_SIZE - 1, col + 1); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (clickHandler) clickHandler(row, col);
        return;
      default:
        return;
    }

    e.preventDefault();
    const nextCell = boardEl.querySelector(`[data-row="${nextRow}"][data-col="${nextCol}"]`) as HTMLElement | null;
    if (nextCell) nextCell.focus();
  }

  playerBoardEl.addEventListener('keydown', (e) => {
    if (state.phase === 'placement') {
      handleGridKeydown(e, playerBoardEl, handlePlacementClick);
    }
  }, { signal });

  aiBoardEl.addEventListener('keydown', (e) => {
    if (state.phase === 'battle' && !animating) {
      handleGridKeydown(e, aiBoardEl, handlePlayerClick);
    }
  }, { signal });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
      if (state.phase === 'placement') {
        handleRotate();
      }
    }
  }, { signal });

  update();
}

showMenu();
