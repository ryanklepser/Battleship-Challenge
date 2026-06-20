import type { Board, Coordinate, Difficulty, Ship } from '../game/types';
import { BOARD_SIZE } from '../game/types';

/**
 * AI strategies for Battleship.
 *
 * - Easy:   purely random valid shots
 * - Medium: random with hunt/target on unsunk ships, 30% random spread
 * - Expert: hunt/target with parity optimization, 15% random spread
 */

function getUntriedCells(board: Board): Coordinate[] {
  const cells: Coordinate[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].state === 'empty' || board[row][col].state === 'ship') {
        cells.push({ row, col });
      }
    }
  }
  return cells;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getAdjacentCells(coord: Coordinate, board: Board): Coordinate[] {
  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];

  return directions
    .map((d) => ({ row: coord.row + d.row, col: coord.col + d.col }))
    .filter(
      (c) =>
        c.row >= 0 &&
        c.row < BOARD_SIZE &&
        c.col >= 0 &&
        c.col < BOARD_SIZE &&
        (board[c.row][c.col].state === 'empty' || board[c.row][c.col].state === 'ship'),
    );
}

function getSunkShipNames(ships: Ship[]): Set<string> {
  const sunk = new Set<string>();
  for (const ship of ships) {
    if (ship.hits.size === ship.size) {
      sunk.add(ship.name);
    }
  }
  return sunk;
}

function findUnsunkHits(board: Board, ships: Ship[]): Coordinate[] {
  const sunkNames = getSunkShipNames(ships);
  const hits: Coordinate[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = board[row][col];
      if (cell.state === 'hit' && cell.shipName && !sunkNames.has(cell.shipName)) {
        hits.push({ row, col });
      }
    }
  }
  return hits;
}

function easyMove(board: Board): Coordinate {
  return pickRandom(getUntriedCells(board));
}

function mediumMove(board: Board, ships: Ship[]): Coordinate {
  // 30% chance of random shot to spread attacks across the board
  if (Math.random() < 0.3) {
    return pickRandom(getUntriedCells(board));
  }

  const hits = shuffle(findUnsunkHits(board, ships));

  for (const hit of hits) {
    const adjacent = getAdjacentCells(hit, board);
    if (adjacent.length > 0) {
      return pickRandom(adjacent);
    }
  }

  return pickRandom(getUntriedCells(board));
}

function expertMove(board: Board, ships: Ship[]): Coordinate {
  // 15% chance of random shot to spread attacks across the board
  if (Math.random() < 0.15) {
    const parityCells = getUntriedCells(board).filter(
      (c) => (c.row + c.col) % 2 === 0,
    );
    if (parityCells.length > 0) {
      return pickRandom(parityCells);
    }
    return pickRandom(getUntriedCells(board));
  }

  const hits = shuffle(findUnsunkHits(board, ships));

  for (const hit of hits) {
    const adjacent = getAdjacentCells(hit, board);
    if (adjacent.length > 0) {
      return pickRandom(adjacent);
    }
  }

  // Parity optimization: only target checkerboard cells to find ships faster
  const parityCells = getUntriedCells(board).filter(
    (c) => (c.row + c.col) % 2 === 0,
  );

  if (parityCells.length > 0) {
    return pickRandom(parityCells);
  }

  return pickRandom(getUntriedCells(board));
}

export function getAIMove(board: Board, difficulty: Difficulty, ships: Ship[]): Coordinate {
  switch (difficulty) {
    case 'easy':
      return easyMove(board);
    case 'medium':
      return mediumMove(board, ships);
    case 'expert':
      return expertMove(board, ships);
  }
}
