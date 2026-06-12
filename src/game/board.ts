import type {
  Board,
  BoardCell,
  Coordinate,
  Orientation,
  Ship,
  AttackResult,
} from './types';
import { BOARD_SIZE } from './types';

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from<unknown, BoardCell>({ length: BOARD_SIZE }, () => ({
      state: 'empty',
      shipName: null,
    })),
  );
}

export function coordToKey(coord: Coordinate): string {
  return `${coord.row},${coord.col}`;
}

export function isValidPlacement(
  board: Board,
  origin: Coordinate,
  size: number,
  orientation: Orientation,
): boolean {
  for (let i = 0; i < size; i++) {
    const row = orientation === 'vertical' ? origin.row + i : origin.row;
    const col = orientation === 'horizontal' ? origin.col + i : origin.col;

    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return false;
    }
    if (board[row][col].state !== 'empty') {
      return false;
    }
  }
  return true;
}

export function placeShip(
  board: Board,
  ship: Ship,
  origin: Coordinate,
  orientation: Orientation,
): void {
  const coordinates: Coordinate[] = [];

  for (let i = 0; i < ship.size; i++) {
    const row = orientation === 'vertical' ? origin.row + i : origin.row;
    const col = orientation === 'horizontal' ? origin.col + i : origin.col;
    const coord = { row, col };

    board[row][col] = { state: 'ship', shipName: ship.name };
    coordinates.push(coord);
  }

  ship.coordinates = coordinates;
}

export function attack(
  board: Board,
  ships: Ship[],
  target: Coordinate,
): AttackResult {
  const cell = board[target.row][target.col];

  if (cell.state === 'ship') {
    board[target.row][target.col] = { ...cell, state: 'hit' };
    const ship = ships.find((s) => s.name === cell.shipName);
    if (ship) {
      ship.hits.add(coordToKey(target));
      if (ship.hits.size === ship.size) {
        return 'sunk';
      }
    }
    return 'hit';
  }

  board[target.row][target.col] = { ...cell, state: 'miss' };
  return 'miss';
}

export function allShipsSunk(ships: Ship[]): boolean {
  return ships.every((ship) => ship.hits.size === ship.size);
}

export function createShip(name: string, size: number): Ship {
  return {
    name,
    size,
    coordinates: [],
    hits: new Set<string>(),
  };
}
