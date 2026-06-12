import type {
  GameState,
  Difficulty,
  Coordinate,
  AttackResult,
} from './types';
import { SHIP_DEFINITIONS } from './types';
import {
  createEmptyBoard,
  createShip,
  attack,
  allShipsSunk,
  isValidPlacement,
  placeShip,
} from './board';
import { placeShipsRandomly } from '../ai/placement';
import { getAIMove } from '../ai/strategy';
import { delay } from '../utils/helpers';

export function createGameState(difficulty: Difficulty): GameState {
  const playerBoard = createEmptyBoard();
  const aiBoard = createEmptyBoard();

  const playerShips = SHIP_DEFINITIONS.map((d) => createShip(d.name, d.size));
  const aiShips = SHIP_DEFINITIONS.map((d) => createShip(d.name, d.size));

  placeShipsRandomly(aiBoard, aiShips);

  return {
    phase: 'placement',
    playerBoard,
    aiBoard,
    playerShips,
    aiShips,
    isPlayerTurn: true,
    difficulty,
    winner: null,
    placement: {
      currentShipIndex: 0,
      orientation: 'horizontal',
    },
  };
}

export function rotateCurrentShip(state: GameState): void {
  if (!state.placement) return;
  state.placement.orientation =
    state.placement.orientation === 'horizontal' ? 'vertical' : 'horizontal';
}

export function placeCurrentShip(
  state: GameState,
  origin: Coordinate,
): boolean {
  if (!state.placement || state.phase !== 'placement') return false;

  const ship = state.playerShips[state.placement.currentShipIndex];
  const orientation = state.placement.orientation;

  if (!isValidPlacement(state.playerBoard, origin, ship.size, orientation)) {
    return false;
  }

  placeShip(state.playerBoard, ship, origin, orientation);

  state.placement.currentShipIndex++;

  if (state.placement.currentShipIndex >= state.playerShips.length) {
    state.phase = 'battle';
    state.placement = null;
  }

  return true;
}

export function getPlacementPreview(
  state: GameState,
  origin: Coordinate,
): { cells: Coordinate[]; valid: boolean } {
  if (!state.placement) return { cells: [], valid: false };

  const ship = state.playerShips[state.placement.currentShipIndex];
  const orientation = state.placement.orientation;
  const cells: Coordinate[] = [];

  for (let i = 0; i < ship.size; i++) {
    const row = orientation === 'vertical' ? origin.row + i : origin.row;
    const col = orientation === 'horizontal' ? origin.col + i : origin.col;
    cells.push({ row, col });
  }

  const valid = isValidPlacement(
    state.playerBoard,
    origin,
    ship.size,
    orientation,
  );

  return { cells, valid };
}

export interface TurnResult {
  target: Coordinate;
  result: AttackResult;
  sunkShipName?: string;
  gameOver: boolean;
  winner: 'player' | 'ai' | null;
}

export function playerAttack(
  state: GameState,
  target: Coordinate,
): TurnResult | null {
  if (!state.isPlayerTurn || state.phase !== 'battle') return null;

  const cell = state.aiBoard[target.row][target.col];
  if (cell.state === 'hit' || cell.state === 'miss') return null;

  const result = attack(state.aiBoard, state.aiShips, target);

  let sunkShipName: string | undefined;
  if (result === 'sunk') {
    const sunk = state.aiShips.find(
      (s) => s.hits.size === s.size && s.name === cell.shipName,
    );
    sunkShipName = sunk?.name;
  }

  const gameOver = allShipsSunk(state.aiShips);
  if (gameOver) {
    state.phase = 'gameover';
    state.winner = 'player';
  } else {
    state.isPlayerTurn = false;
  }

  return {
    target,
    result,
    sunkShipName,
    gameOver,
    winner: state.winner,
  };
}

export async function aiAttack(
  state: GameState,
  onComplete: (result: TurnResult) => void,
): Promise<void> {
  if (state.isPlayerTurn || state.phase !== 'battle') return;

  await delay(600);

  const target = getAIMove(state.playerBoard, state.difficulty);
  const cell = state.playerBoard[target.row][target.col];
  const result = attack(state.playerBoard, state.playerShips, target);

  let sunkShipName: string | undefined;
  if (result === 'sunk') {
    const sunk = state.playerShips.find(
      (s) => s.hits.size === s.size && s.name === cell.shipName,
    );
    sunkShipName = sunk?.name;
  }

  const gameOver = allShipsSunk(state.playerShips);
  if (gameOver) {
    state.phase = 'gameover';
    state.winner = 'ai';
  } else {
    state.isPlayerTurn = true;
  }

  onComplete({
    target,
    result,
    sunkShipName,
    gameOver,
    winner: state.winner,
  });
}
