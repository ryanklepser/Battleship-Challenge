import type { Board, GameState, Coordinate } from '../game/types';
import { BOARD_SIZE, SHIP_DEFINITIONS } from '../game/types';

const COL_LABELS = 'ABCDEFGHIJ';

export function renderBoard(
  board: Board,
  container: HTMLElement,
  hideShips: boolean,
  onCellClick?: (row: number, col: number) => void,
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
      : 'Devin is thinking…';
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
  boardEl: HTMLElement,
  row: number,
  col: number,
  isHit: boolean,
  onComplete: () => void,
): void {
  const cell = boardEl.querySelector(
    `[data-row="${row}"][data-col="${col}"]`,
  ) as HTMLElement | null;
  if (!cell) {
    onComplete();
    return;
  }

  const rect = cell.getBoundingClientRect();
  const boardRect = boardEl.getBoundingClientRect();

  const missile = document.createElement('div');
  missile.classList.add('missile');
  missile.style.left = `${rect.left - boardRect.left + rect.width / 2 - 8}px`;
  missile.style.top = '-40px';
  boardEl.style.position = 'relative';
  boardEl.appendChild(missile);

  requestAnimationFrame(() => {
    missile.style.top = `${rect.top - boardRect.top + rect.height / 2 - 8}px`;
  });

  setTimeout(() => {
    missile.remove();

    if (isHit) {
      const explosion = document.createElement('div');
      explosion.classList.add('explosion');
      explosion.style.left = `${rect.left - boardRect.left + rect.width / 2 - 24}px`;
      explosion.style.top = `${rect.top - boardRect.top + rect.height / 2 - 24}px`;
      boardEl.appendChild(explosion);

      setTimeout(() => {
        explosion.remove();
        onComplete();
      }, 600);
    } else {
      onComplete();
    }
  }, 400);
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
