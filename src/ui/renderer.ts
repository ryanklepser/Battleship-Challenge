import type { Board, GameState, Coordinate, Ship } from '../game/types';
import { BOARD_SIZE, SHIP_DEFINITIONS } from '../game/types';

const COL_LABELS = 'ABCDEFGHIJ';

const SHIP_SVGS: Record<string, string> = {
  Carrier: `<svg viewBox="0 0 5 1" class="ship-svg"><rect x="0.1" y="0.15" width="4.8" height="0.7" rx="0.25" fill="#7f8c8d"/><rect x="0.5" y="0.05" width="0.6" height="0.9" rx="0.15" fill="#95a5a6"/><rect x="1.4" y="0.1" width="0.4" height="0.8" rx="0.1" fill="#95a5a6"/><rect x="2.1" y="0.1" width="0.4" height="0.8" rx="0.1" fill="#95a5a6"/><rect x="2.8" y="0.1" width="0.4" height="0.8" rx="0.1" fill="#95a5a6"/><rect x="3.6" y="0.05" width="0.8" height="0.9" rx="0.15" fill="#95a5a6"/></svg>`,
  Battleship: `<svg viewBox="0 0 4 1" class="ship-svg"><rect x="0.15" y="0.2" width="3.7" height="0.6" rx="0.2" fill="#7f8c8d"/><rect x="0.4" y="0.1" width="0.5" height="0.8" rx="0.15" fill="#95a5a6"/><circle cx="1.5" cy="0.5" r="0.25" fill="#bdc3c7"/><circle cx="2.3" cy="0.5" r="0.25" fill="#bdc3c7"/><rect x="2.9" y="0.05" width="0.7" height="0.9" rx="0.15" fill="#95a5a6"/></svg>`,
  Cruiser: `<svg viewBox="0 0 3 1" class="ship-svg"><rect x="0.1" y="0.2" width="2.8" height="0.6" rx="0.2" fill="#7f8c8d"/><rect x="0.3" y="0.1" width="0.5" height="0.8" rx="0.15" fill="#95a5a6"/><circle cx="1.5" cy="0.5" r="0.25" fill="#bdc3c7"/><rect x="2.0" y="0.1" width="0.6" height="0.8" rx="0.15" fill="#95a5a6"/></svg>`,
  Submarine: `<svg viewBox="0 0 3 1" class="ship-svg"><ellipse cx="1.5" cy="0.5" rx="1.4" ry="0.4" fill="#7f8c8d"/><rect x="1.2" y="0.05" width="0.3" height="0.5" rx="0.1" fill="#95a5a6"/><circle cx="0.6" cy="0.5" r="0.15" fill="#bdc3c7"/><circle cx="2.4" cy="0.5" r="0.15" fill="#bdc3c7"/></svg>`,
  Destroyer: `<svg viewBox="0 0 2 1" class="ship-svg"><rect x="0.1" y="0.25" width="1.8" height="0.5" rx="0.2" fill="#7f8c8d"/><rect x="0.3" y="0.15" width="0.4" height="0.7" rx="0.1" fill="#95a5a6"/><rect x="1.1" y="0.1" width="0.5" height="0.8" rx="0.15" fill="#95a5a6"/></svg>`,
};

function getShipCellIndex(
  ships: Ship[],
  shipName: string,
  row: number,
  col: number,
): { index: number; total: number; orientation: 'horizontal' | 'vertical' } | null {
  const ship = ships.find((s) => s.name === shipName);
  if (!ship || ship.coordinates.length === 0) return null;

  const idx = ship.coordinates.findIndex((c) => c.row === row && c.col === col);
  if (idx === -1) return null;

  const isHorizontal =
    ship.coordinates.length === 1 ||
    ship.coordinates[0].row === ship.coordinates[1].row;

  return { index: idx, total: ship.size, orientation: isHorizontal ? 'horizontal' : 'vertical' };
}

function addCrosshairListeners(table: HTMLTableElement): void {
  let activeCells: HTMLElement[] = [];

  table.addEventListener('mouseover', (e: Event) => {
    const target = e.target as HTMLElement;
    const cell = target.closest('.cell') as HTMLElement | null;
    if (!cell) return;

    const row = cell.dataset.row;
    const col = cell.dataset.col;
    if (row === undefined || col === undefined) return;

    for (const el of activeCells) {
      el.classList.remove('cell--crosshair');
    }
    activeCells = [];

    const cells = table.querySelectorAll<HTMLElement>('.cell');
    for (const c of cells) {
      if (c === cell) continue;
      if (c.dataset.row === row || c.dataset.col === col) {
        c.classList.add('cell--crosshair');
        activeCells.push(c);
      }
    }
  });

  table.addEventListener('mouseleave', () => {
    for (const el of activeCells) {
      el.classList.remove('cell--crosshair');
    }
    activeCells = [];
  });
}

export function renderBoard(
  board: Board,
  container: HTMLElement,
  hideShips: boolean,
  onCellClick?: (row: number, col: number) => void,
  ships?: Ship[],
): void {
  container.innerHTML = '';

  const table = document.createElement('table');
  table.classList.add('board');

  const headerRow = document.createElement('tr');
  headerRow.appendChild(document.createElement('th'));
  for (let col = 0; col < BOARD_SIZE; col++) {
    const th = document.createElement('th');
    th.textContent = COL_LABELS[col];
    headerRow.appendChild(th);
  }
  table.appendChild(headerRow);

  for (let row = 0; row < BOARD_SIZE; row++) {
    const tr = document.createElement('tr');

    const rowLabel = document.createElement('th');
    rowLabel.textContent = String(row + 1);
    tr.appendChild(rowLabel);

    for (let col = 0; col < BOARD_SIZE; col++) {
      const td = document.createElement('td');
      const cell = board[row][col];

      td.classList.add('cell');
      td.dataset.row = String(row);
      td.dataset.col = String(col);

      switch (cell.state) {
        case 'hit':
          td.classList.add('cell--hit');
          td.textContent = '💥';
          break;
        case 'miss':
          td.classList.add('cell--miss');
          td.textContent = '•';
          break;
        case 'ship':
          if (!hideShips) {
            td.classList.add('cell--ship');
            if (ships && cell.shipName) {
              const info = getShipCellIndex(ships, cell.shipName, row, col);
              if (info && info.index === 0 && SHIP_SVGS[cell.shipName]) {
                const wrapper = document.createElement('div');
                wrapper.classList.add('ship-shape');
                wrapper.classList.add(
                  info.orientation === 'vertical' ? 'ship-shape--vertical' : 'ship-shape--horizontal',
                );
                wrapper.style.width = `${info.total * 36}px`;
                wrapper.style.height = '36px';
                wrapper.innerHTML = SHIP_SVGS[cell.shipName];
                td.appendChild(wrapper);
                td.classList.add('cell--ship-origin');
              }
            }
          }
          break;
        case 'empty':
          break;
      }

      if (onCellClick) {
        td.addEventListener('click', () => onCellClick(row, col));
        td.classList.add('cell--clickable');
      }

      tr.appendChild(td);
    }

    table.appendChild(tr);
  }

  if (onCellClick) {
    addCrosshairListeners(table);
  }

  container.appendChild(table);
}

export function updatePreview(
  container: HTMLElement,
  cells: Coordinate[],
  valid: boolean,
): void {
  container.querySelectorAll('.cell--preview-valid, .cell--preview-invalid').forEach((el) => {
    el.classList.remove('cell--preview-valid', 'cell--preview-invalid');
  });

  const previewSet = new Set(cells.map((c) => `${c.row},${c.col}`));

  container.querySelectorAll('.cell').forEach((el) => {
    const htmlEl = el as HTMLElement;
    const key = `${htmlEl.dataset.row},${htmlEl.dataset.col}`;
    if (previewSet.has(key)) {
      htmlEl.classList.add(valid ? 'cell--preview-valid' : 'cell--preview-invalid');
    }
  });
}

export function renderStatus(state: GameState, container: HTMLElement): void {
  container.classList.remove('status--gameover');

  if (state.phase === 'gameover') {
    container.textContent =
      state.winner === 'player' ? '🎉 You Win!' : '💀 Devin Wins!';
    container.classList.add('status--gameover');
  } else if (state.phase === 'placement') {
    if (state.placement) {
      const ship = SHIP_DEFINITIONS[state.placement.currentShipIndex];
      container.textContent = `Place your ${ship.name} (${ship.size} cells) — ${state.placement.orientation}`;
    }
  } else {
    container.textContent = state.isPlayerTurn
      ? "Your turn — click a cell on Devin's board"
      : '\u00A0';
  }
}

export function renderDifficultySelector(
  container: HTMLElement,
  onSelect: (difficulty: 'easy' | 'medium' | 'expert') => void,
): void {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.classList.add('difficulty-selector');

  const label = document.createElement('h2');
  label.textContent = 'Select Difficulty';
  wrapper.appendChild(label);

  const difficulties: Array<{
    value: 'easy' | 'medium' | 'expert';
    label: string;
  }> = [
    { value: 'easy', label: '🟢 Easy' },
    { value: 'medium', label: '🟡 Medium' },
    { value: 'expert', label: '🔴 Expert' },
  ];

  for (const diff of difficulties) {
    const btn = document.createElement('button');
    btn.textContent = diff.label;
    btn.classList.add('btn', `btn--${diff.value}`);
    btn.addEventListener('click', () => onSelect(diff.value));
    wrapper.appendChild(btn);
  }

  container.appendChild(wrapper);
}

export function renderPlacementControls(
  container: HTMLElement,
  orientation: string,
  onRotate: () => void,
): void {
  container.innerHTML = '';

  const btn = document.createElement('button');
  btn.textContent = `🔄 Rotate (${orientation === 'horizontal' ? 'H' : 'V'})`;
  btn.classList.add('btn', 'btn--rotate');
  btn.addEventListener('click', onRotate);
  container.appendChild(btn);

  const hint = document.createElement('p');
  hint.classList.add('placement-hint');
  hint.textContent = 'Click on the board to place · Press R to rotate';
  container.appendChild(hint);
}

export function showAttackAnimation(
  sourceBoardEl: HTMLElement,
  targetBoardEl: HTMLElement,
  row: number,
  col: number,
  isHit: boolean,
  onComplete: () => void,
): void {
  const targetCell = targetBoardEl.querySelector(
    `[data-row="${row}"][data-col="${col}"]`,
  ) as HTMLElement | null;
  if (!targetCell) {
    onComplete();
    return;
  }

  const targetRect = targetCell.getBoundingClientRect();
  const sourceRect = sourceBoardEl.getBoundingClientRect();

  const startX = sourceRect.left + sourceRect.width / 2;
  const startY = sourceRect.top + sourceRect.height / 2;
  const endX = targetRect.left + targetRect.width / 2;
  const endY = targetRect.top + targetRect.height / 2;

  const missile = document.createElement('div');
  missile.classList.add('missile-arc');
  document.body.appendChild(missile);

  const duration = 600;
  const startTime = performance.now();
  const peakHeight = 120;

  function animate(now: number): void {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);

    const x = startX + (endX - startX) * t;
    const parabola = -4 * peakHeight * t * (t - 1);
    const y = startY + (endY - startY) * t - parabola;

    missile.style.left = `${x - 8}px`;
    missile.style.top = `${y - 8}px`;

    const angle = Math.atan2(
      (endY - startY) - peakHeight * (2 - 4 * t),
      (endX - startX),
    );
    missile.style.transform = `rotate(${angle}rad)`;

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      missile.remove();

      if (isHit) {
        const boardRect = targetBoardEl.getBoundingClientRect();
        targetBoardEl.style.position = 'relative';

        const explosion = document.createElement('div');
        explosion.classList.add('explosion');
        explosion.style.left = `${targetRect.left - boardRect.left + targetRect.width / 2 - 24}px`;
        explosion.style.top = `${targetRect.top - boardRect.top + targetRect.height / 2 - 24}px`;
        targetBoardEl.appendChild(explosion);

        setTimeout(() => {
          explosion.remove();
          onComplete();
        }, 600);
      } else {
        onComplete();
      }
    }
  }

  requestAnimationFrame(animate);
}

export function showResultPopup(
  result: 'hit' | 'miss' | 'sunk',
  shipName?: string,
): void {
  const existing = document.querySelector('.result-popup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.classList.add('result-popup');

  if (result === 'sunk') {
    popup.classList.add('result-popup--sunk');
    popup.textContent = `${shipName} SUNK!`;
  } else if (result === 'hit') {
    popup.classList.add('result-popup--hit');
    popup.textContent = 'HIT!';
  } else {
    popup.classList.add('result-popup--miss');
    popup.textContent = 'MISS!';
  }

  document.body.appendChild(popup);

  requestAnimationFrame(() => {
    popup.classList.add('result-popup--visible');
  });

  setTimeout(() => {
    popup.classList.add('result-popup--fade');
    setTimeout(() => popup.remove(), 400);
  }, 1000);
}
