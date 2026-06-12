import type { Board, Coordinate, Difficulty } from '../game/types';
import { BOARD_SIZE } from '../game/types';

/**
 * AI strategies for Battleship.
 *
 * - Easy:   purely random valid shots
 * - Medium: random until a hit, then hunts adjacent cells
 * - Expert: hunt/target with parity optimization (checkerboard pattern)
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

function findHits(board: Board): Coordinate[] {
  const hits: Coordinate[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].state === 'hit') {
        hits.push({ row, col });
      }
    }
  }
  return hits;
}

function easyMove(board: Board): Coordinate {
  return pickRandom(getUntriedCells(board));
}

function mediumMove(board: Board): Coordinate {
  const hits = findHits(board);

  for (const hit of hits) {
    const adjacent = getAdjacentCells(hit, board);
    if (adjacent.length > 0) {
      return pickRandom(adjacent);
    }
  }

  return pickRandom(getUntriedCells(board));
}

function expertMove(board: Board): Coordinate {
  const hits = findHits(board);

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

export function getAIMove(board: Board, difficulty: Difficulty): Coordinate {
  switch (difficulty) {
    case 'easy':
      return easyMove(board);
    case 'medium':
      return mediumMove(board);
    case 'expert':
      return expertMove(board);
  }
}
