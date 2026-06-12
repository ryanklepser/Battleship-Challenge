import type { Board, GameState } from '../game/types';
import { BOARD_SIZE } from '../game/types';

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

  // Header row with column labels
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

export function renderStatus(state: GameState, container: HTMLElement): void {
  if (state.phase === 'gameover') {
    container.textContent =
      state.winner === 'player' ? '🎉 You Win!' : '💀 AI Wins!';
    container.classList.add('status--gameover');
  } else if (state.phase === 'placement') {
    container.textContent = 'Place your ships on the board';
  } else {
    container.textContent = state.isPlayerTurn
      ? 'Your turn — click a cell on the enemy board'
      : "AI is thinking…";
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

  const difficulties: Array<{ value: 'easy' | 'medium' | 'expert'; label: string }> = [
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
