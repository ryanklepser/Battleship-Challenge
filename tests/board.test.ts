import { describe, it, expect } from 'vitest';
import {
  createEmptyBoard,
  isValidPlacement,
  placeShip,
  attack,
  allShipsSunk,
  createShip,
  coordToKey,
} from '../src/game/board';
import { BOARD_SIZE } from '../src/game/types';

describe('createEmptyBoard', () => {
  it('creates a 10x10 board of empty cells', () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(BOARD_SIZE);
    for (const row of board) {
      expect(row).toHaveLength(BOARD_SIZE);
      for (const cell of row) {
        expect(cell.state).toBe('empty');
        expect(cell.shipName).toBeNull();
      }
    }
  });
});

describe('isValidPlacement', () => {
  it('allows placing a ship within bounds on an empty board', () => {
    const board = createEmptyBoard();
    expect(isValidPlacement(board, { row: 0, col: 0 }, 5, 'horizontal')).toBe(true);
  });

  it('rejects placement that goes out of bounds horizontally', () => {
    const board = createEmptyBoard();
    expect(isValidPlacement(board, { row: 0, col: 8 }, 5, 'horizontal')).toBe(false);
  });

  it('rejects placement that goes out of bounds vertically', () => {
    const board = createEmptyBoard();
    expect(isValidPlacement(board, { row: 8, col: 0 }, 5, 'vertical')).toBe(false);
  });

  it('rejects placement that overlaps an existing ship', () => {
    const board = createEmptyBoard();
    const ship = createShip('Destroyer', 2);
    placeShip(board, ship, { row: 0, col: 0 }, 'horizontal');
    expect(isValidPlacement(board, { row: 0, col: 1 }, 3, 'horizontal')).toBe(false);
  });
});

describe('placeShip', () => {
  it('places a ship horizontally and updates board cells', () => {
    const board = createEmptyBoard();
    const ship = createShip('Cruiser', 3);
    placeShip(board, ship, { row: 2, col: 3 }, 'horizontal');

    expect(board[2][3].state).toBe('ship');
    expect(board[2][4].state).toBe('ship');
    expect(board[2][5].state).toBe('ship');
    expect(ship.coordinates).toHaveLength(3);
  });

  it('places a ship vertically', () => {
    const board = createEmptyBoard();
    const ship = createShip('Submarine', 3);
    placeShip(board, ship, { row: 0, col: 0 }, 'vertical');

    expect(board[0][0].state).toBe('ship');
    expect(board[1][0].state).toBe('ship');
    expect(board[2][0].state).toBe('ship');
  });
});

describe('attack', () => {
  it('returns miss for an empty cell', () => {
    const board = createEmptyBoard();
    const ships = [createShip('Destroyer', 2)];
    const result = attack(board, ships, { row: 5, col: 5 });
    expect(result).toBe('miss');
    expect(board[5][5].state).toBe('miss');
  });

  it('returns hit for a ship cell', () => {
    const board = createEmptyBoard();
    const ship = createShip('Destroyer', 2);
    placeShip(board, ship, { row: 0, col: 0 }, 'horizontal');

    const result = attack(board, [ship], { row: 0, col: 0 });
    expect(result).toBe('hit');
    expect(board[0][0].state).toBe('hit');
  });

  it('returns sunk when all cells of a ship are hit', () => {
    const board = createEmptyBoard();
    const ship = createShip('Destroyer', 2);
    placeShip(board, ship, { row: 0, col: 0 }, 'horizontal');

    attack(board, [ship], { row: 0, col: 0 });
    const result = attack(board, [ship], { row: 0, col: 1 });
    expect(result).toBe('sunk');
  });
});

describe('allShipsSunk', () => {
  it('returns false when ships have remaining cells', () => {
    const ship = createShip('Destroyer', 2);
    expect(allShipsSunk([ship])).toBe(false);
  });

  it('returns true when all ships are fully hit', () => {
    const ship = createShip('Destroyer', 2);
    ship.hits.add(coordToKey({ row: 0, col: 0 }));
    ship.hits.add(coordToKey({ row: 0, col: 1 }));
    expect(allShipsSunk([ship])).toBe(true);
  });
});
