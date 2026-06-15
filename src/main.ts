import './style.css';
import type { GameState, Difficulty } from './game/types';
import { BOARD_SIZE } from './game/types';
import {
  renderBoard,
  renderStatus,
  renderDifficultySelector,
  renderPlacementControls,
  showAttackAnimation,
  showResultPopup,
  shakeBoard,
  updatePreview,
  renderFleetRoster,
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
      <div class="game-layout">
        <div id="fleet-roster" class="fleet-roster" role="complementary" aria-label="Fleet roster"></div>
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
      </div>
      <div id="game-actions" class="game-actions" role="toolbar" aria-label="Game actions"></div>
    </main>
  `;

  const statusEl = document.querySelector<HTMLDivElement>('#status')!;
  const playerBoardEl = document.querySelector<HTMLDivElement>('#player-board')!;
  const aiBoardEl = document.querySelector<HTMLDivElement>('#ai-board')!;
  const actionsEl = document.querySelector<HTMLDivElement>('#game-actions')!;
  const rosterEl = document.querySelector<HTMLDivElement>('#fleet-roster')!;

  mountMascot(document.body);
  updateMascotForPhase(state.phase, state.winner);

  let animating = false;
  let battleJustStarted = false;

  function update(): void {
    renderStatus(state, statusEl);
    renderFleetRoster(state, rosterEl);
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
      const reveal = battleJustStarted;
      battleJustStarted = false;

      renderBoard(state.playerBoard, playerBoardEl, false, undefined, state.playerShips, reveal);

      if (!animating) {
        renderBoard(state.aiBoard, aiBoardEl, true, handlePlayerClick, undefined, reveal);
      } else {
        renderBoard(state.aiBoard, aiBoardEl, true, undefined, undefined, reveal);
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
      if (state.phase === 'battle') {
        battleJustStarted = true;
      }
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
            shakeBoard(playerBoardEl);
          }

          animating = false;
          update();

          void coord;
        },
      );
    });
  }

  function renderGameOver(container: HTMLElement): void {
    container.innerHTML = '';
    const btn = document.createElement('button');
    btn.textContent = 'Play Again';
    btn.classList.add('btn', 'btn--play-again');
    btn.addEventListener('click', showMenu);
    container.appendChild(btn);
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
