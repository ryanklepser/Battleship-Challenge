export type CellState = 'empty' | 'ship' | 'hit' | 'miss';

export type Orientation = 'horizontal' | 'vertical';

export type Difficulty = 'easy' | 'medium' | 'expert';

export interface Coordinate {
  row: number;
  col: number;
}

export interface Ship {
  name: string;
  size: number;
  coordinates: Coordinate[];
  hits: Set<string>;
}

export interface ShipPlacement {
  shipName: string;
  origin: Coordinate;
  orientation: Orientation;
}

export type BoardCell = {
  state: CellState;
  shipName: string | null;
};

export type Board = BoardCell[][];

export type GamePhase = 'placement' | 'battle' | 'gameover';

export type AttackResult = 'hit' | 'miss' | 'sunk';

export interface PlacementState {
  currentShipIndex: number;
  orientation: Orientation;
}

export interface GameStats {
  playerShotsFired: number;
  aiShotsFired: number;
  playerHits: number;
  gameStartTime: number | null;
}

export interface GameState {
  phase: GamePhase;
  playerBoard: Board;
  aiBoard: Board;
  playerShips: Ship[];
  aiShips: Ship[];
  isPlayerTurn: boolean;
  difficulty: Difficulty;
  winner: 'player' | 'ai' | null;
  placement: PlacementState | null;
  stats: GameStats;
  turnNumber: number;
}

export const BOARD_SIZE = 10;

export const SHIP_DEFINITIONS: { name: string; size: number }[] = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
];
