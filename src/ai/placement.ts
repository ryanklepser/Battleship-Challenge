import type { Board, Ship, Orientation, Coordinate } from '../game/types';
import { BOARD_SIZE } from '../game/types';
import { isValidPlacement, placeShip } from '../game/board';

export function placeShipsRandomly(board: Board, ships: Ship[]): void {
  for (const ship of ships) {
    let placed = false;

    while (!placed) {
      const orientation: Orientation =
        Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const origin: Coordinate = {
        row: Math.floor(Math.random() * BOARD_SIZE),
        col: Math.floor(Math.random() * BOARD_SIZE),
      };

      if (isValidPlacement(board, origin, ship.size, orientation)) {
        placeShip(board, ship, origin, orientation);
        placed = true;
      }
    }
  }
}
