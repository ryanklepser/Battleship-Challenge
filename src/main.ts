import './style.css';
import type { GameState, Difficulty, Coordinate } from './game/types';
import {
  renderBoard,
  renderStatus,
  renderDifficultySelector,
  renderPlacementControls,
  showAttackAnimation,
  showResultPopup,
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

const app = document.querySelector<HTMLDivElement>('#app')!;

function showMenu(): void {
  app.innerHTML = `
    <header class="header">
      <h1>⚓ Battlefield</h1>
      <p>Sink Devin's fleet before Devin sinks yours!</p>
    </header>
    <main id="game-root"></main>
  `;

  const gameRoot = document.querySelector<HTMLDivElement>('#game-root')!;
  renderDifficultySelector(gameRoot, startGame);
}

function startGame(difficulty: Difficulty): void {
  const state = createGameState(difficulty);
  renderGame(state);
}

function renderGame(state: GameState): void {
  app.innerHTML = `
    <header class="header">
      <h1>⚓ Battlefield</h1>
    </header>
    <div id="status" class="status"></div>
    <div class="boards">
      <div class="board-wrapper">
        <h2 class="board-title">Your Fleet</h2>
        <div id="player-board"></div>
      </div>
      <div class="board-wrapper">
        <h2 class="board-title">Devin's Waters</h2>
        <div id="ai-board"></div>
      </div>
    </div>
    <div id="game-actions" class="game-actions"></div>
  `;

  const statusEl = document.querySelector<HTMLDivElement>('#status')!;
  const playerBoardEl = document.querySelector<HTMLDivElement>('#player-board')!;
  const aiBoardEl = document.querySelector<HTMLDivElement>('#ai-board')!;
  const actionsEl = document.querySelector<HTMLDivElement>('#game-actions')!;

  let previewOrigin: Coordinate | null = null;
  let animating = false;

  function update(): void {
    renderStatus(state, statusEl);

    if (state.phase === 'placement') {
      const preview = previewOrigin
        ? getPlacementPreview(state, previewOrigin)
        : null;

      renderBoard(
        state.playerBoard,
        playerBoardEl,
        false,
        handlePlacementClick,
        preview?.cells,
        preview?.valid,
      );

      // Add mouseover listeners for preview
      const cells = playerBoardEl.querySelectorAll('.cell');
      cells.forEach((cell) => {
        const el = cell as HTMLElement;
        el.addEventListener('mouseenter', () => {
          const row = parseInt(el.dataset.row ?? '0');
          const col = parseInt(el.dataset.col ?? '0');
          previewOrigin = { row, col };
          update();
        });
        el.addEventListener('mouseleave', () => {
          previewOrigin = null;
          update();
        });
      });

      renderBoard(state.aiBoard, aiBoardEl, true);

      renderPlacementControls(
        actionsEl,
        state.placement?.orientation ?? 'horizontal',
        handleRotate,
      );
    } else if (state.phase === 'battle') {
      renderBoard(state.playerBoard, playerBoardEl, false);

      if (!animating) {
        renderBoard(state.aiBoard, aiBoardEl, true, handlePlayerClick);
      } else {
        renderBoard(state.aiBoard, aiBoardEl, true);
      }

      actionsEl.innerHTML = '';
    } else {
      // gameover
      renderBoard(state.playerBoard, playerBoardEl, false);
      renderBoard(state.aiBoard, aiBoardEl, false);

      renderGameOver(actionsEl);
    }
  }

  function handlePlacementClick(row: number, col: number): void {
    const placed = placeCurrentShip(state, { row, col });
    if (placed) {
      previewOrigin = null;
      update();
    }
  }

  function handleRotate(): void {
    rotateCurrentShip(state);
    update();
  }

  function handlePlayerClick(row: number, col: number): void {
    if (animating) return;

    const result = playerAttack(state, { row, col });
    if (!result) return;

    animating = true;
    update();

    showAttackAnimation(
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

  // Keyboard shortcut for rotation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
      if (state.phase === 'placement') {
        handleRotate();
      }
    }
  });

  update();
}

showMenu();
