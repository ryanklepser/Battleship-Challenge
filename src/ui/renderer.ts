import type { Board, GameState, Coordinate, Ship, Difficulty } from '../game/types';
import { BOARD_SIZE, SHIP_DEFINITIONS } from '../game/types';
import { formatCoordinate } from '../utils/helpers';

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

function cellStateLabel(state: string, shipName: string | null, hideShips: boolean): string {
  switch (state) {
    case 'hit': return 'hit';
    case 'miss': return 'miss';
    case 'ship': return hideShips ? 'empty' : `ship${shipName ? `, ${shipName}` : ''}`;
    default: return 'empty';
  }
}

function getCellSize(): number {
  if (window.innerWidth <= 420) return 26;
  if (window.innerWidth <= 768) return 28;
  return 30;
}

export function renderBoard(
  board: Board,
  container: HTMLElement,
  hideShips: boolean,
  onCellClick?: (row: number, col: number) => void,
  ships?: Ship[],
  staggerReveal?: boolean,
): void {
  container.innerHTML = '';

  const cellSize = getCellSize();
  const table = document.createElement('table');
  table.classList.add('board');
  table.setAttribute('role', 'grid');

  const headerRow = document.createElement('tr');
  headerRow.setAttribute('role', 'row');
  const emptyTh = document.createElement('th');
  emptyTh.setAttribute('role', 'columnheader');
  headerRow.appendChild(emptyTh);
  for (let col = 0; col < BOARD_SIZE; col++) {
    const th = document.createElement('th');
    th.setAttribute('role', 'columnheader');
    th.textContent = COL_LABELS[col];
    headerRow.appendChild(th);
  }
  table.appendChild(headerRow);

  for (let row = 0; row < BOARD_SIZE; row++) {
    const tr = document.createElement('tr');
    tr.setAttribute('role', 'row');

    const rowLabel = document.createElement('th');
    rowLabel.setAttribute('role', 'rowheader');
    rowLabel.setAttribute('scope', 'row');
    rowLabel.textContent = String(row + 1);
    tr.appendChild(rowLabel);

    for (let col = 0; col < BOARD_SIZE; col++) {
      const td = document.createElement('td');
      const cell = board[row][col];

      td.classList.add('cell');
      td.setAttribute('role', 'gridcell');
      td.dataset.row = String(row);
      td.dataset.col = String(col);

      const coordLabel = `${COL_LABELS[col]}${row + 1}`;
      const stateLabel = cellStateLabel(cell.state, cell.shipName, hideShips);
      td.setAttribute('aria-label', `Cell ${coordLabel}, ${stateLabel}`);

      if (staggerReveal) {
        td.classList.add('cell--reveal');
        td.style.animationDelay = `${(row + col) * 10}ms`;
      }
      switch (cell.state) {
        case 'hit': {
          td.classList.add('cell--hit');
          const emoji = document.createElement('span');
          emoji.setAttribute('aria-hidden', 'true');
          emoji.textContent = '💥';
          td.appendChild(emoji);
          const icon = document.createElement('span');
          icon.classList.add('cell-icon', 'cell-icon--hit');
          icon.setAttribute('aria-hidden', 'true');
          icon.textContent = '✕';
          td.appendChild(icon);
          const sr = document.createElement('span');
          sr.classList.add('sr-only');
          sr.textContent = 'Hit';
          td.appendChild(sr);
          break;
        }
        case 'miss': {
          td.classList.add('cell--miss');
          const bullet = document.createElement('span');
          bullet.setAttribute('aria-hidden', 'true');
          bullet.textContent = '•';
          td.appendChild(bullet);
          const icon = document.createElement('span');
          icon.classList.add('cell-icon', 'cell-icon--miss');
          icon.setAttribute('aria-hidden', 'true');
          icon.textContent = '○';
          td.appendChild(icon);
          const sr = document.createElement('span');
          sr.classList.add('sr-only');
          sr.textContent = 'Miss';
          td.appendChild(sr);
          break;
        }
        case 'ship':
          if (!hideShips) {
            td.classList.add('cell--ship');
            const shipIcon = document.createElement('span');
            shipIcon.classList.add('cell-icon', 'cell-icon--ship');
            shipIcon.setAttribute('aria-hidden', 'true');
            shipIcon.textContent = '▪';
            td.appendChild(shipIcon);
            if (ships && cell.shipName) {
              const info = getShipCellIndex(ships, cell.shipName, row, col);
              if (info && info.index === 0 && SHIP_SVGS[cell.shipName]) {
                const wrapper = document.createElement('div');
                wrapper.classList.add('ship-shape');
                wrapper.setAttribute('aria-hidden', 'true');
                wrapper.classList.add(
                  info.orientation === 'vertical' ? 'ship-shape--vertical' : 'ship-shape--horizontal',
                );
                wrapper.style.width = `${info.total * cellSize}px`;
                wrapper.style.height = `${cellSize}px`;
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
        td.setAttribute('tabindex', '0');
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

export function applyCrosshair(
  container: HTMLElement,
  row: number,
  col: number,
): void {
  clearCrosshair(container);

  const cells = container.querySelectorAll<HTMLElement>('.cell');
  cells.forEach((cell) => {
    const r = parseInt(cell.dataset.row ?? '-1');
    const c = parseInt(cell.dataset.col ?? '-1');
    if (r === row && c === col) {
      cell.classList.add('crosshair-center');
    } else if (r === row) {
      cell.classList.add('crosshair-row');
    } else if (c === col) {
      cell.classList.add('crosshair-col');
    }
  });

  let tooltip = container.querySelector<HTMLElement>('.crosshair-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.classList.add('crosshair-tooltip');
    container.style.position = 'relative';
    container.appendChild(tooltip);
  }

  const target = container.querySelector<HTMLElement>(
    `[data-row="${row}"][data-col="${col}"]`,
  );
  if (target) {
    const label = formatCoordinate({ row, col });
    tooltip.textContent = `${label[0]}-${label.slice(1)}`;
    const containerRect = container.getBoundingClientRect();
    const cellRect = target.getBoundingClientRect();
    tooltip.style.left = `${cellRect.left - containerRect.left + cellRect.width / 2}px`;
    tooltip.style.top = `${cellRect.top - containerRect.top - 4}px`;
    tooltip.classList.add('crosshair-tooltip--visible');
  }
}

export function clearCrosshair(container: HTMLElement): void {
  container
    .querySelectorAll('.crosshair-row, .crosshair-col, .crosshair-center')
    .forEach((el) =>
      el.classList.remove('crosshair-row', 'crosshair-col', 'crosshair-center'),
    );

  const tooltip = container.querySelector<HTMLElement>('.crosshair-tooltip');
  if (tooltip) {
    tooltip.classList.remove('crosshair-tooltip--visible');
  }
}

export function flashCrosshair(
  container: HTMLElement,
  row: number,
  col: number,
): Promise<void> {
  const cells = container.querySelectorAll<HTMLElement>('.cell');
  const targets: HTMLElement[] = [];
  cells.forEach((cell) => {
    const r = parseInt(cell.dataset.row ?? '-1');
    const c = parseInt(cell.dataset.col ?? '-1');
    if (r === row || c === col) {
      cell.classList.add('crosshair-flash');
      targets.push(cell);
    }
  });

  return new Promise((resolve) => {
    setTimeout(() => {
      targets.forEach((cell) => cell.classList.remove('crosshair-flash'));
      resolve();
    }, 300);
  });
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
  container.classList.remove('status--gameover', 'status--hidden');
  container.setAttribute('role', 'status');
  container.setAttribute('aria-live', 'polite');

  if (state.phase === 'gameover') {
    const emoji = document.createElement('span');
    emoji.setAttribute('aria-hidden', 'true');
    emoji.textContent = state.winner === 'player' ? '🎉 ' : '💀 ';
    const text = state.winner === 'player' ? 'You Win!' : 'Devin Wins!';
    container.textContent = '';
    container.appendChild(emoji);
    container.appendChild(document.createTextNode(text));
    container.classList.add('status--gameover');
  } else if (state.phase === 'placement') {
    if (state.placement) {
      const ship = SHIP_DEFINITIONS[state.placement.currentShipIndex];
      container.textContent = `Place your ${ship.name} (${ship.size} cells) — ${state.placement.orientation}`;
    }
  } else {
    container.textContent = '';
    container.classList.add('status--hidden');
  }
}

export function renderDifficultySelector(
  container: HTMLElement,
  onSelect: (difficulty: 'easy' | 'medium' | 'expert') => void,
): void {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.classList.add('difficulty-selector');

  // Radar hero illustration
  const radar = document.createElement('div');
  radar.classList.add('radar-hero');
  radar.innerHTML = `
    <div class="radar-crosshair"></div>
    <div class="radar-blip"></div>
    <div class="radar-blip"></div>
    <div class="radar-blip"></div>
  `;
  wrapper.appendChild(radar);

  const label = document.createElement('h2');
  label.textContent = 'Select Difficulty';
  wrapper.appendChild(label);

  const difficulties: Array<{
    value: 'easy' | 'medium' | 'expert';
    label: string;
    tooltip: string;
    srLabel: string;
    flavor: string;
  }> = [
    { value: 'easy', label: '🟢 Easy', tooltip: 'Random shots — good for learning', srLabel: 'Easy difficulty', flavor: 'Smooth sailing' },
    { value: 'medium', label: '🟡 Medium', tooltip: 'Hunts adjacent cells — a real fight', srLabel: 'Medium difficulty', flavor: 'Worthy opponent' },
    { value: 'expert', label: '🔴 Expert', tooltip: 'Parity strategy — plays to win', srLabel: 'Expert difficulty', flavor: 'No mercy' },
  ];

  const bests = getPersonalBests();

  for (const diff of difficulties) {
    const btnWrapper = document.createElement('div');
    btnWrapper.classList.add('btn-wrapper', 'difficulty-btn-wrap');

    const btn = document.createElement('button');
    btn.setAttribute('aria-label', diff.srLabel);
    btn.classList.add('btn', `btn--${diff.value}`);

    const labelSpan = document.createElement('span');
    labelSpan.classList.add('btn__label');
    labelSpan.textContent = diff.label;
    btn.appendChild(labelSpan);

    const flavorSpan = document.createElement('span');
    flavorSpan.classList.add('btn__flavor');
    flavorSpan.textContent = diff.flavor;
    btn.appendChild(flavorSpan);

    btn.addEventListener('click', () => onSelect(diff.value));

    const tooltip = document.createElement('span');
    tooltip.classList.add('btn-tooltip');
    tooltip.textContent = diff.tooltip;

    btnWrapper.appendChild(tooltip);
    btnWrapper.appendChild(btn);

    const best = bests[diff.value];
    if (best !== null) {
      const badge = document.createElement('span');
      badge.classList.add('best-badge');
      badge.textContent = `Best: ${best}%`;
      btnWrapper.appendChild(badge);
    }

    wrapper.appendChild(btnWrapper);
  }

  container.appendChild(wrapper);
}

const MINI_SHIP_SVGS: Record<string, string> = {
  Carrier: `<svg viewBox="0 0 5 1"><rect x="0.1" y="0.15" width="4.8" height="0.7" rx="0.25" fill="currentColor"/></svg>`,
  Battleship: `<svg viewBox="0 0 4 1"><rect x="0.1" y="0.2" width="3.8" height="0.6" rx="0.2" fill="currentColor"/></svg>`,
  Cruiser: `<svg viewBox="0 0 3 1"><rect x="0.1" y="0.2" width="2.8" height="0.6" rx="0.2" fill="currentColor"/></svg>`,
  Submarine: `<svg viewBox="0 0 3 1"><ellipse cx="1.5" cy="0.5" rx="1.4" ry="0.4" fill="currentColor"/></svg>`,
  Destroyer: `<svg viewBox="0 0 2 1"><rect x="0.1" y="0.25" width="1.8" height="0.5" rx="0.2" fill="currentColor"/></svg>`,
};

export interface PlacementControlsOptions {
  orientation: string;
  currentShipIndex: number;
  onRotate: () => void;
  onRandomize: () => void;
  onUndo: () => void;
}

export function renderPlacementControls(
  container: HTMLElement,
  orientation: string,
  onRotate: () => void,
  options?: Omit<PlacementControlsOptions, 'orientation' | 'onRotate'>,
): void {
  container.innerHTML = '';

  const currentIdx = options?.currentShipIndex ?? 0;
  const totalShips = SHIP_DEFINITIONS.length;

  const progress = document.createElement('div');
  progress.classList.add('placement-progress');

  const label = document.createElement('span');
  label.classList.add('placement-progress__label');
  label.textContent = `Ship ${currentIdx}/${totalShips} placed`;
  progress.appendChild(label);

  const icons = document.createElement('div');
  icons.classList.add('placement-progress__ships');

  for (let i = 0; i < totalShips; i++) {
    const icon = document.createElement('div');
    icon.classList.add('placement-progress__icon');
    icon.title = SHIP_DEFINITIONS[i].name;

    if (i < currentIdx) {
      icon.classList.add('placement-progress__icon--placed');
    } else if (i === currentIdx) {
      icon.classList.add('placement-progress__icon--current');
    }

    const svgHtml = MINI_SHIP_SVGS[SHIP_DEFINITIONS[i].name];
    if (svgHtml) {
      icon.innerHTML = svgHtml;
    }

    icons.appendChild(icon);
  }

  progress.appendChild(icons);
  container.appendChild(progress);

  const actions = document.createElement('div');
  actions.classList.add('placement-actions');

  const rotateBtn = document.createElement('button');
  const rotateEmoji = document.createElement('span');
  rotateEmoji.setAttribute('aria-hidden', 'true');
  rotateEmoji.textContent = '🔄 ';
  rotateBtn.appendChild(rotateEmoji);
  rotateBtn.appendChild(document.createTextNode(`Rotate (${orientation === 'horizontal' ? 'H' : 'V'})`));
  rotateBtn.setAttribute('aria-label', `Rotate ship orientation, currently ${orientation}`);
  rotateBtn.classList.add('btn', 'btn--rotate');
  rotateBtn.addEventListener('click', onRotate);
  actions.appendChild(rotateBtn);

  if (options) {
    const randomBtn = document.createElement('button');
    randomBtn.textContent = '🎲 Randomize Fleet';
    randomBtn.classList.add('btn', 'btn--randomize');
    randomBtn.addEventListener('click', options.onRandomize);
    actions.appendChild(randomBtn);

    const undoBtn = document.createElement('button');
    undoBtn.textContent = '↩ Undo';
    undoBtn.classList.add('btn', 'btn--undo');
    undoBtn.disabled = currentIdx === 0;
    undoBtn.addEventListener('click', options.onUndo);
    actions.appendChild(undoBtn);
  }

  container.appendChild(actions);

  const hint = document.createElement('p');
  hint.classList.add('placement-hint');
  hint.textContent = 'Click on the board to place · Press R to rotate';
  container.appendChild(hint);
}

export function triggerLockInAnimation(
  boardEl: HTMLElement,
  cells: Coordinate[],
): void {
  for (const coord of cells) {
    const cell = boardEl.querySelector(
      `[data-row="${coord.row}"][data-col="${coord.col}"]`,
    ) as HTMLElement | null;
    if (cell) {
      cell.classList.add('cell--lock-in');
      cell.addEventListener('animationend', () => {
        cell.classList.remove('cell--lock-in');
      }, { once: true });
    }
  }
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

  const trails: HTMLElement[] = [];
  for (let i = 1; i <= 3; i++) {
    const trail = document.createElement('div');
    trail.classList.add('missile-trail', `missile-trail--${i}`);
    document.body.appendChild(trail);
    trails.push(trail);
  }

  const trailHistory: Array<{ x: number; y: number }> = [];

  const duration = 720;
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

    trailHistory.push({ x, y });

    for (let i = 0; i < trails.length; i++) {
      const trailIdx = trailHistory.length - 1 - (i + 1) * 4;
      if (trailIdx >= 0) {
        const pos = trailHistory[trailIdx];
        trails[i].style.left = `${pos.x - 6}px`;
        trails[i].style.top = `${pos.y - 6}px`;
      }
    }

    const angle = Math.atan2(
      (endY - startY) - peakHeight * (2 - 4 * t),
      (endX - startX),
    );
    missile.style.transform = `rotate(${angle}rad)`;

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      missile.remove();
      for (const trail of trails) trail.remove();

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
        const boardRect = targetBoardEl.getBoundingClientRect();
        targetBoardEl.style.position = 'relative';

        const splash = document.createElement('div');
        splash.classList.add('splash-ring');
        splash.style.left = `${targetRect.left - boardRect.left + targetRect.width / 2 - 18}px`;
        splash.style.top = `${targetRect.top - boardRect.top + targetRect.height / 2 - 18}px`;
        targetBoardEl.appendChild(splash);

        setTimeout(() => {
          splash.remove();
          onComplete();
        }, 500);
      }
    }
  }

  requestAnimationFrame(animate);
}

export function renderFleetRoster(state: GameState, container: HTMLElement): void {
  container.innerHTML = '';

  const playerSection = buildRosterSection('Your Fleet', state.playerShips);
  const aiSection = buildRosterSection("Devin's Fleet", state.aiShips);

  container.appendChild(playerSection);
  container.appendChild(aiSection);
}

function buildRosterSection(title: string, ships: Ship[]): HTMLElement {
  const section = document.createElement('div');
  section.classList.add('roster-section');

  const heading = document.createElement('h3');
  heading.classList.add('roster-title');
  heading.textContent = title;
  section.appendChild(heading);

  const list = document.createElement('ul');
  list.classList.add('roster-list');

  for (const def of SHIP_DEFINITIONS) {
    const ship = ships.find((s) => s.name === def.name);
    const isSunk = ship ? ship.hits.size >= ship.size : false;

    const li = document.createElement('li');
    li.classList.add('roster-item');
    if (isSunk) li.classList.add('roster-item--sunk');

    const iconSpan = document.createElement('span');
    iconSpan.classList.add('roster-icon');
    if (SHIP_SVGS[def.name]) {
      iconSpan.innerHTML = `<svg viewBox="0 0 ${def.size} 1" class="roster-ship-svg">${SHIP_SVGS[def.name].replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}</svg>`;
    }
    li.appendChild(iconSpan);

    const nameSpan = document.createElement('span');
    nameSpan.classList.add('roster-name');
    nameSpan.textContent = def.name;
    li.appendChild(nameSpan);

    if (isSunk) {
      const badge = document.createElement('span');
      badge.classList.add('roster-sunk-badge');
      badge.textContent = '✕';
      li.appendChild(badge);
    }

    list.appendChild(li);
  }

  section.appendChild(list);
  return section;
}

export function shakeBoard(boardEl: HTMLElement): void {
  boardEl.classList.remove('board-shake');
  void boardEl.offsetWidth;
  boardEl.classList.add('board-shake');
  boardEl.addEventListener('animationend', () => {
    boardEl.classList.remove('board-shake');
  }, { once: true });
}

export function renderMuteButton(
  header: HTMLElement,
  muted: boolean,
  ambientOn: boolean,
  onToggleMute: () => void,
  onToggleAmbient: () => void,
): void {
  let container = header.querySelector<HTMLDivElement>('.audio-controls');
  if (!container) {
    container = document.createElement('div');
    container.classList.add('audio-controls');
    header.appendChild(container);
  }
  container.innerHTML = '';

  const muteBtn = document.createElement('button');
  muteBtn.classList.add('btn', 'btn--audio');
  muteBtn.title = muted ? 'Unmute sound effects' : 'Mute sound effects';
  muteBtn.textContent = muted ? '🔇' : '🔊';
  muteBtn.addEventListener('click', onToggleMute);
  container.appendChild(muteBtn);

  const ambientBtn = document.createElement('button');
  ambientBtn.classList.add('btn', 'btn--audio', 'btn--ambient');
  ambientBtn.title = ambientOn ? 'Disable ambient sounds' : 'Enable ambient sounds';
  ambientBtn.textContent = ambientOn ? '🌊' : '🔕';
  ambientBtn.addEventListener('click', onToggleAmbient);
  container.appendChild(ambientBtn);
}

export function isMobileView(): boolean {
  return window.innerWidth <= 768;
}

export function renderBoardTabs(
  container: HTMLElement,
  activeTab: 'player' | 'ai',
  onSwitch: (tab: 'player' | 'ai') => void,
): void {
  container.innerHTML = '';

  const tabBar = document.createElement('div');
  tabBar.classList.add('board-tabs');

  const playerBtn = document.createElement('button');
  playerBtn.textContent = 'Your Fleet';
  playerBtn.classList.add('board-tabs__btn');
  if (activeTab === 'player') playerBtn.classList.add('board-tabs__btn--active');
  playerBtn.addEventListener('click', () => onSwitch('player'));

  const aiBtn = document.createElement('button');
  aiBtn.textContent = "Devin's Waters";
  aiBtn.classList.add('board-tabs__btn');
  if (activeTab === 'ai') aiBtn.classList.add('board-tabs__btn--active');
  aiBtn.addEventListener('click', () => onSwitch('ai'));

  tabBar.appendChild(playerBtn);
  tabBar.appendChild(aiBtn);
  container.appendChild(tabBar);
}

export function renderFireButton(
  container: HTMLElement,
  enabled: boolean,
  onFire: () => void,
): void {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.classList.add('fire-btn-container');

  const btn = document.createElement('button');
  btn.textContent = '\ud83c\udfaf FIRE';
  btn.classList.add('btn', 'btn--fire');
  btn.disabled = !enabled;
  btn.addEventListener('click', onFire);

  wrapper.appendChild(btn);
  container.appendChild(wrapper);
}

export function renderPlaceConfirmButton(
  container: HTMLElement,
  enabled: boolean,
  onConfirm: () => void,
): void {
  const existing = container.querySelector('.btn--confirm-place');
  if (existing) existing.remove();

  const btn = document.createElement('button');
  btn.textContent = '\u2705 Confirm Placement';
  btn.classList.add('btn', 'btn--confirm-place');
  btn.disabled = !enabled;
  btn.addEventListener('click', onConfirm);
  container.appendChild(btn);
}

export function triggerHapticFeedback(): void {
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}

export function showResultPopup(
  result: 'hit' | 'miss' | 'sunk',
  shipName?: string,
  owner?: 'player' | 'ai',
): void {
  const existing = document.querySelector('.result-popup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.classList.add('result-popup');

  popup.setAttribute('role', 'alert');
  popup.setAttribute('aria-live', 'assertive');

  if (result === 'sunk') {
    popup.classList.add('result-popup--sunk');
    const ownerLabel = owner === 'ai' ? "Devin's" : 'Your';
    popup.textContent = `${ownerLabel} ${shipName} has been eliminated!`;
  } else if (result === 'hit') {
    popup.classList.add('result-popup--hit');
    popup.textContent = 'HIT!';
  } else {
    popup.classList.add('result-popup--miss');
    popup.textContent = 'MISS!';
  }

  const statusEl = document.querySelector('#status');
  if (statusEl && statusEl.parentElement) {
    statusEl.parentElement.insertBefore(popup, statusEl);
  } else {
    document.body.appendChild(popup);
  }

  requestAnimationFrame(() => {
    popup.classList.add('result-popup--visible');
  });

  setTimeout(() => {
    popup.classList.add('result-popup--fade');
    setTimeout(() => popup.remove(), 400);
  }, 1000);
}

const BEST_STORAGE_KEY = 'battlefield-personal-bests';
const GAME_URL = 'https://ryanklepser.github.io/Battleship-Challenge/';

type PersonalBests = Record<Difficulty, number | null>;

export function getPersonalBests(): PersonalBests {
  try {
    const raw = localStorage.getItem(BEST_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Record<Difficulty, number>>;
      return {
        easy: parsed.easy ?? null,
        medium: parsed.medium ?? null,
        expert: parsed.expert ?? null,
      };
    }
  } catch {
    // ignore
  }
  return { easy: null, medium: null, expert: null };
}

export function savePersonalBest(difficulty: Difficulty, accuracy: number): boolean {
  const bests = getPersonalBests();
  const current = bests[difficulty];
  if (current === null || accuracy > current) {
    bests[difficulty] = accuracy;
    localStorage.setItem(BEST_STORAGE_KEY, JSON.stringify(bests));
    return true;
  }
  return false;
}

export function computeAccuracy(turnCount: number): number {
  const totalShipCells = SHIP_DEFINITIONS.reduce((sum, s) => sum + s.size, 0);
  return Math.round((totalShipCells / turnCount) * 100);
}

function buildShareText(turnCount: number, difficulty: Difficulty): string {
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  return `I sank Devin's fleet in ${turnCount} shots on ${label}! ${GAME_URL}`;
}

export function renderShareButton(
  container: HTMLElement,
  turnCount: number,
  difficulty: Difficulty,
): void {
  const shareWrap = document.createElement('div');
  shareWrap.classList.add('share-wrap');

  const copyBtn = document.createElement('button');
  copyBtn.classList.add('btn', 'btn--share');
  copyBtn.textContent = 'Copy Result';
  copyBtn.addEventListener('click', () => {
    const text = buildShareText(turnCount, difficulty);
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy Result'; }, 2000);
    }).catch(() => {
      copyBtn.textContent = 'Copy failed';
    });
  });
  shareWrap.appendChild(copyBtn);

  const tweetBtn = document.createElement('a');
  tweetBtn.classList.add('btn', 'btn--share', 'btn--tweet');
  tweetBtn.textContent = 'Share on X';
  tweetBtn.target = '_blank';
  tweetBtn.rel = 'noopener noreferrer';
  tweetBtn.href =
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildShareText(turnCount, difficulty))}`;
  shareWrap.appendChild(tweetBtn);

  container.appendChild(shareWrap);
}

export function renderNewBestBanner(container: HTMLElement, accuracy: number): void {
  const banner = document.createElement('div');
  banner.classList.add('new-best-banner');
  banner.textContent = `New Personal Best: ${accuracy}% accuracy!`;
  container.appendChild(banner);
}
