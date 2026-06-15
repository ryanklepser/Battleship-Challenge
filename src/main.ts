import './style.css';
import type { GameState, Difficulty, GameStats } from './game/types';
import { BOARD_SIZE } from './game/types';
import {
  renderBoard,
  renderStatus,
  renderDifficultySelector,
  renderPlacementControls,
  renderMuteButton,
  showAttackAnimation,
  showResultPopup,
  shakeBoard,
  updatePreview,
  renderFleetRoster,
  renderShareButton,
  savePersonalBest,
  computeAccuracy,
  applyCrosshair,
  clearCrosshair,
  flashCrosshair,
  triggerLockInAnimation,
  isMobileView,
  renderBoardTabs,
  renderFireButton,
  renderPlaceConfirmButton,
  triggerHapticFeedback,
} from './ui/renderer';
import {
  createGameState,
  playerAttack,
  aiAttack,
  rotateCurrentShip,
  placeCurrentShip,
  getPlacementPreview,
  undoLastPlacement,
  randomizePlayerFleet,
} from './game/engine';
import { formatCoordinate } from './utils/helpers';
import {
  mountMascot,
  removeMascot,
  updateMascotForPhase,
  mascotReactToHit,
  mascotReactToMiss,
} from './ui/mascot';
import {
  unlock as unlockAudio,
  isUnlocked as isAudioUnlocked,
  toggleMute,
  isMuted,
  playMissileLaunch,
  playHit,
  playMiss,
  playShipSunk,
  playVictory,
  startAmbient,
  toggleAmbient,
  isAmbientEnabled,
} from './audio/soundManager';

const app = document.querySelector<HTMLDivElement>('#app')!;
let gameAbort: AbortController | null = null;

function removeLandingBg(): void {
  document.querySelector('.landing-bg')?.remove();
}

function transitionPhase(renderFn: () => void): void {
  const content = app.querySelector('.phase-content') as HTMLElement | null;
  if (!content) {
    renderFn();
    const fresh = app.querySelector('.phase-content') as HTMLElement | null;
    if (fresh) {
      fresh.classList.add('phase-content--enter');
      requestAnimationFrame(() => {
        fresh.classList.remove('phase-content--enter');
      });
    }
    return;
  }

  content.classList.add('phase-content--exit');
  content.addEventListener('transitionend', () => {
    renderFn();
    const newContent = app.querySelector('.phase-content') as HTMLElement | null;
    if (newContent) {
      newContent.classList.add('phase-content--enter');
      requestAnimationFrame(() => {
        newContent.classList.remove('phase-content--enter');
      });
    }
  }, { once: true });
}

function showInterstitial(): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.classList.add('interstitial');
    overlay.innerHTML = `
      <div class="interstitial__text">Deploying fleet...</div>
      <div class="radar-sweep"></div>
    `;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('interstitial--visible');
    });

    setTimeout(() => {
      overlay.classList.remove('interstitial--visible');
      overlay.addEventListener('transitionend', () => {
        overlay.remove();
        resolve();
      }, { once: true });
    }, 500);
  });
}

function handleFirstInteraction(): void {
  if (!isAudioUnlocked()) {
    unlockAudio();
    startAmbient();
    renderMuteButton(
      document.querySelector<HTMLElement>('.header')!,
      isMuted(),
      isAmbientEnabled(),
      handleMuteToggle,
      handleAmbientToggle,
    );
  }
}

function handleMuteToggle(): void {
  const nowMuted = toggleMute();
  const header = document.querySelector<HTMLElement>('.header');
  if (header) {
    renderMuteButton(header, nowMuted, isAmbientEnabled(), handleMuteToggle, handleAmbientToggle);
  }
}

function handleAmbientToggle(): void {
  const nowAmbient = toggleAmbient();
  const header = document.querySelector<HTMLElement>('.header');
  if (header) {
    renderMuteButton(header, isMuted(), nowAmbient, handleMuteToggle, handleAmbientToggle);
  }
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

  transitionPhase(() => {
    app.innerHTML = `
      <div class="phase-content">
        <header class="header" role="banner">
          <h1>⚓ Battlefield</h1>
          <p>Sink Devin's fleet before Devin sinks yours!</p>
        </header>
        <main id="game-root" role="main"></main>
      </div>
    `;

    if (isAudioUnlocked()) {
      renderMuteButton(
        document.querySelector<HTMLElement>('.header')!,
        isMuted(),
        isAmbientEnabled(),
        handleMuteToggle,
        handleAmbientToggle,
      );
    }

    const gameRoot = document.querySelector<HTMLDivElement>('#game-root')!;
    renderDifficultySelector(gameRoot, startGame);
  });
}

function startGame(difficulty: Difficulty): void {
  removeLandingBg();
  const state = createGameState(difficulty);
  transitionPhase(() => {
    renderGame(state);
  });
}

function renderGame(state: GameState): void {
  if (gameAbort) gameAbort.abort();
  gameAbort = new AbortController();
  const { signal } = gameAbort;

  app.innerHTML = `
    <div class="phase-content">
      <header class="header" role="banner">
        <h1>⚓ Battlefield</h1>
      </header>
      <main role="main">
        <div id="status" class="status" role="status" aria-live="polite"></div>
        <div id="board-tabs-container"></div>
        <div class="game-layout">
          <div id="fleet-roster" class="fleet-roster" role="complementary" aria-label="Fleet roster"></div>
          <div class="boards">
            <section class="board-wrapper" id="player-board-wrapper" aria-label="Your Fleet">
              <h2 class="board-title">Your Fleet</h2>
              <div id="player-board"></div>
            </section>
            <section class="board-wrapper" id="ai-board-wrapper" aria-label="Devin's Waters">
              <h2 class="board-title board-title--delay">Devin's Waters</h2>
              <div id="ai-board"></div>
            </section>
          </div>
        </div>
        <div id="fire-btn-container"></div>
        <div id="game-actions" class="game-actions" role="toolbar" aria-label="Game actions"></div>
      </main>
    </div>
  `;

  if (isAudioUnlocked()) {
    renderMuteButton(
      document.querySelector<HTMLElement>('.header')!,
      isMuted(),
      isAmbientEnabled(),
      handleMuteToggle,
      handleAmbientToggle,
    );
  }

  const statusEl = document.querySelector<HTMLDivElement>('#status')!;
  const playerBoardEl = document.querySelector<HTMLDivElement>('#player-board')!;
  const aiBoardEl = document.querySelector<HTMLDivElement>('#ai-board')!;
  const actionsEl = document.querySelector<HTMLDivElement>('#game-actions')!;
  const rosterEl = document.querySelector<HTMLDivElement>('#fleet-roster')!;
  const tabsContainer = document.querySelector<HTMLDivElement>('#board-tabs-container')!;
  const fireBtnContainer = document.querySelector<HTMLDivElement>('#fire-btn-container')!;
  const playerWrapper = document.querySelector<HTMLElement>('#player-board-wrapper')!;
  const aiWrapper = document.querySelector<HTMLElement>('#ai-board-wrapper')!;

  mountMascot(document.body);
  updateMascotForPhase(state.phase, state.winner);

  let animating = false;
  let battleJustStarted = false;
  let activeTab: 'player' | 'ai' = state.phase === 'placement' ? 'player' : 'ai';
  let selectedTarget: { row: number; col: number } | null = null;
  let selectedPlacementCell: { row: number; col: number } | null = null;

  function updateTabVisibility(): void {
    if (!isMobileView()) {
      playerWrapper.classList.remove('board-wrapper--hidden');
      aiWrapper.classList.remove('board-wrapper--hidden');
      tabsContainer.innerHTML = '';
      return;
    }

    renderBoardTabs(tabsContainer, activeTab, (tab) => {
      activeTab = tab;
      updateTabVisibility();
      update();
    });

    if (activeTab === 'player') {
      playerWrapper.classList.remove('board-wrapper--hidden');
      aiWrapper.classList.add('board-wrapper--hidden');
    } else {
      playerWrapper.classList.add('board-wrapper--hidden');
      aiWrapper.classList.remove('board-wrapper--hidden');
    }
  }

  function clearSelectedTarget(): void {
    selectedTarget = null;
    aiBoardEl.querySelectorAll('.cell--selected').forEach((el) => {
      el.classList.remove('cell--selected');
    });
  }

  function highlightSelectedTarget(): void {
    aiBoardEl.querySelectorAll('.cell--selected').forEach((el) => {
      el.classList.remove('cell--selected');
    });
    if (selectedTarget) {
      const cell = aiBoardEl.querySelector(
        `[data-row="${selectedTarget.row}"][data-col="${selectedTarget.col}"]`,
      );
      if (cell) cell.classList.add('cell--selected');
    }
  }

  function clearSelectedPlacement(): void {
    selectedPlacementCell = null;
    playerBoardEl.querySelectorAll('.cell--selected').forEach((el) => {
      el.classList.remove('cell--selected');
    });
    updatePreview(playerBoardEl, [], false);
  }

  function update(): void {
    renderStatus(state, statusEl);
    renderFleetRoster(state, rosterEl);
    updateMascotForPhase(state.phase, state.winner);

    if (state.phase === 'placement') {
      if (isMobileView()) activeTab = 'player';
      updateTabVisibility();

      renderBoard(state.playerBoard, playerBoardEl, false, handlePlacementClick, state.playerShips);
      renderBoard(state.aiBoard, aiBoardEl, true);

      renderPlacementControls(
        actionsEl,
        state.placement?.orientation ?? 'horizontal',
        handleRotate,
        {
          currentShipIndex: state.placement?.currentShipIndex ?? 0,
          onRandomize: handleRandomize,
          onUndo: handleUndo,
        },
      );

      if (isMobileView()) {
        const preview = selectedPlacementCell
          ? getPlacementPreview(state, selectedPlacementCell)
          : null;
        const isValid = preview?.valid ?? false;

        renderPlaceConfirmButton(actionsEl, isValid, handleConfirmPlacement);

        if (selectedPlacementCell && preview) {
          updatePreview(playerBoardEl, preview.cells, preview.valid);
          const cell = playerBoardEl.querySelector(
            `[data-row="${selectedPlacementCell.row}"][data-col="${selectedPlacementCell.col}"]`,
          );
          if (cell) cell.classList.add('cell--selected');
        }

        const hint = actionsEl.querySelector('.placement-hint');
        if (hint) {
          hint.textContent = 'Tap a cell to preview · Tap Confirm to place · Press R to rotate';
        }
      }

      fireBtnContainer.innerHTML = '';
    } else if (state.phase === 'battle') {
      const reveal = battleJustStarted;
      battleJustStarted = false;

      if (isMobileView() && activeTab === 'player') {
        activeTab = 'ai';
      }
      updateTabVisibility();

      renderBoard(state.playerBoard, playerBoardEl, false, undefined, state.playerShips, reveal);

      if (!animating) {
        renderBoard(state.aiBoard, aiBoardEl, true, handlePlayerClick, undefined, reveal);
      } else {
        renderBoard(state.aiBoard, aiBoardEl, true, undefined, undefined, reveal);
      }

      actionsEl.innerHTML = '';

      if (isMobileView() && !animating && state.isPlayerTurn) {
        renderFireButton(fireBtnContainer, selectedTarget !== null, handleFireConfirm);
        highlightSelectedTarget();
      } else {
        fireBtnContainer.innerHTML = '';
      }
    } else {
      updateTabVisibility();
      renderBoard(state.playerBoard, playerBoardEl, false, undefined, state.playerShips);
      renderBoard(state.aiBoard, aiBoardEl, false, undefined, state.aiShips);

      renderGameOver(actionsEl);
      fireBtnContainer.innerHTML = '';
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
    if (isMobileView()) return;
    const cell = (e.target as HTMLElement).closest('.cell') as HTMLElement | null;
    if (cell) {
      const row = parseInt(cell.dataset.row ?? '0');
      const col = parseInt(cell.dataset.col ?? '0');
      showPreview(row, col);
    }
  }, { signal });

  playerBoardEl.addEventListener('mouseout', (e) => {
    if (isMobileView()) return;
    const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
    if (!related || !playerBoardEl.contains(related)) {
      clearPreview();
    }
  }, { signal });

  aiBoardEl.addEventListener('mouseover', (e) => {
    if (state.phase !== 'battle' || animating) return;
    const cell = (e.target as HTMLElement).closest('.cell') as HTMLElement | null;
    if (cell) {
      const row = parseInt(cell.dataset.row ?? '0');
      const col = parseInt(cell.dataset.col ?? '0');
      applyCrosshair(aiBoardEl, row, col);
    }
  }, { signal });

  aiBoardEl.addEventListener('mouseout', (e) => {
    const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
    if (!related || !aiBoardEl.contains(related)) {
      clearCrosshair(aiBoardEl);
    }
  }, { signal });

  function handlePlacementClick(row: number, col: number): void {
    handleFirstInteraction();
    if (isMobileView()) {
      selectedPlacementCell = { row, col };
      update();
      return;
    }

    const preview = getPlacementPreview(state, { row, col });
    const wasPlacement = state.phase === 'placement';
    const placed = placeCurrentShip(state, { row, col });
    if (placed) {
      if (wasPlacement && state.phase === 'battle') {
        battleJustStarted = true;
        showInterstitial().then(() => {
          update();
        });
      } else {
        update();
        triggerLockInAnimation(playerBoardEl, preview.cells);
      }
    }
  }

  function handleConfirmPlacement(): void {
    if (!selectedPlacementCell) return;
    const preview = getPlacementPreview(state, selectedPlacementCell);
    const wasPlacement = state.phase === 'placement';
    const placed = placeCurrentShip(state, selectedPlacementCell);
    if (placed) {
      clearSelectedPlacement();
      if (wasPlacement && state.phase === 'battle') {
        battleJustStarted = true;
        showInterstitial().then(() => {
          update();
        });
      } else {
        update();
        triggerLockInAnimation(playerBoardEl, preview.cells);
      }
    }
  }

  function handleRotate(): void {
    rotateCurrentShip(state);
    if (isMobileView() && selectedPlacementCell) {
      update();
    } else {
      clearPreview();
      update();
    }
  }

  function handleRandomize(): void {
    randomizePlayerFleet(state);
    battleJustStarted = true;
    showInterstitial().then(() => {
      update();
    });
  }

  function handleUndo(): void {
    const undone = undoLastPlacement(state);
    if (undone) {
      clearPreview();
      update();
    }
  }

  function handlePlayerClick(row: number, col: number): void {
    if (animating) return;
    handleFirstInteraction();

    if (isMobileView()) {
      const cell = state.aiBoard[row][col];
      if (cell.state === 'hit' || cell.state === 'miss') return;

      selectedTarget = { row, col };
      highlightSelectedTarget();
      renderFireButton(fireBtnContainer, true, handleFireConfirm);
      return;
    }

    executeAttack(row, col);
  }

  function handleFireConfirm(): void {
    if (!selectedTarget) return;
    const { row, col } = selectedTarget;
    selectedTarget = null;
    executeAttack(row, col);
  }

  function executeAttack(row: number, col: number): void {
    const result = playerAttack(state, { row, col });
    if (!result) return;

    animating = true;
    playMissileLaunch();
    flashCrosshair(aiBoardEl, row, col).then(() => {
      clearCrosshair(aiBoardEl);
    });
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
          playShipSunk();
          showResultPopup('sunk', result.sunkShipName, 'ai');
        } else if (result.result === 'hit') {
          playHit();
          showResultPopup(result.result);
        } else {
          playMiss();
          showResultPopup(result.result);
        }

        if (result.result === 'miss') {
          mascotReactToMiss(true);
        } else {
          mascotReactToHit(true);
          triggerHapticFeedback();
        }

        if (result.gameOver && state.winner === 'player') {
          playVictory();
        }

        animating = false;
        clearSelectedTarget();
        update();

        if (!result.gameOver) {
          if (isMobileView()) {
            activeTab = 'player';
            updateTabVisibility();
          }
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
      playMissileLaunch();
      showAttackAnimation(
        aiBoardEl,
        playerBoardEl,
        result.target.row,
        result.target.col,
        result.result !== 'miss',
        () => {
          const coord = formatCoordinate(result.target);
          if (result.result === 'sunk') {
            playShipSunk();
            showResultPopup('sunk', result.sunkShipName, 'player');
          } else if (result.result === 'hit') {
            playHit();
            showResultPopup(result.result);
          } else {
            playMiss();
            showResultPopup(result.result);
          }

          if (result.result === 'miss') {
            mascotReactToMiss(false);
          } else {
            mascotReactToHit(false);
            shakeBoard(playerBoardEl);
            triggerHapticFeedback();
          }

          animating = false;

          if (isMobileView() && state.phase === 'battle') {
            activeTab = 'ai';
            updateTabVisibility();
          }

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

      const accuracy = computeAccuracy(state.stats.playerShotsFired);
      const isNewBest = savePersonalBest(state.difficulty, accuracy);

      overlay.innerHTML = `
        <div class="gameover-content">
          <h2 class="gameover-title gameover-title--victory">VICTORY</h2>
          ${isNewBest ? `<div class="new-best-banner">New Personal Best: ${accuracy}% accuracy!</div>` : ''}
          ${getStatsHTML(state.stats)}
          <div id="share-buttons"></div>
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

    if (state.winner === 'player') {
      const shareContainer = overlay.querySelector<HTMLDivElement>('#share-buttons');
      if (shareContainer) {
        renderShareButton(shareContainer, state.stats.playerShotsFired, state.difficulty);
      }
    }

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
