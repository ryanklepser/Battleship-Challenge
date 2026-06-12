import './style.css';
import type { GameState, Difficulty } from './game/types';
import { renderBoard, renderStatus, renderDifficultySelector } from './ui/renderer';
import { createGameState, playerAttack, aiAttack } from './game/engine';
import { formatCoordinate } from './utils/helpers';

const app = document.querySelector<HTMLDivElement>('#app')!;

function showMenu(): void {
  app.innerHTML = `
    <header class="header">
      <h1>⚓ Battleship Challenge</h1>
      <p>Sink the enemy fleet before they sink yours!</p>
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
      <h1>⚓ Battleship Challenge</h1>
    </header>
    <div id="status" class="status"></div>
    <div id="log" class="log"></div>
    <div class="boards">
      <div class="board-wrapper">
        <h2 class="board-title">Your Fleet</h2>
        <div id="player-board"></div>
      </div>
      <div class="board-wrapper">
        <h2 class="board-title">Enemy Waters</h2>
        <div id="ai-board"></div>
      </div>
    </div>
    <div id="game-actions" class="game-actions"></div>
  `;

  const statusEl = document.querySelector<HTMLDivElement>('#status')!;
  const logEl = document.querySelector<HTMLDivElement>('#log')!;
  const playerBoardEl = document.querySelector<HTMLDivElement>('#player-board')!;
  const aiBoardEl = document.querySelector<HTMLDivElement>('#ai-board')!;
  const actionsEl = document.querySelector<HTMLDivElement>('#game-actions')!;

  function addLogEntry(message: string): void {
    const entry = document.createElement('div');
    entry.classList.add('log-entry');
    entry.textContent = message;
    logEl.prepend(entry);

    while (logEl.children.length > 8) {
      logEl.removeChild(logEl.lastChild!);
    }
  }

  function update(): void {
    renderStatus(state, statusEl);

    renderBoard(state.playerBoard, playerBoardEl, false);

    if (state.phase === 'battle') {
      renderBoard(state.aiBoard, aiBoardEl, true, handlePlayerClick);
    } else {
      renderBoard(state.aiBoard, aiBoardEl, state.phase !== 'gameover');
    }

    if (state.phase === 'gameover') {
      renderGameOver(actionsEl);
    }
  }

  function handlePlayerClick(row: number, col: number): void {
    const result = playerAttack(state, { row, col });
    if (!result) return;

    const coord = formatCoordinate(result.target);
    if (result.result === 'sunk') {
      addLogEntry(`You fired at ${coord} — ${result.sunkShipName} SUNK!`);
    } else {
      addLogEntry(`You fired at ${coord} — ${result.result.toUpperCase()}`);
    }

    update();

    if (!result.gameOver) {
      runAITurn();
    }
  }

  function runAITurn(): void {
    aiAttack(state, (result) => {
      const coord = formatCoordinate(result.target);
      if (result.result === 'sunk') {
        addLogEntry(`AI fired at ${coord} — ${result.sunkShipName} SUNK!`);
      } else {
        addLogEntry(`AI fired at ${coord} — ${result.result.toUpperCase()}`);
      }

      update();
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

  update();
}

showMenu();
