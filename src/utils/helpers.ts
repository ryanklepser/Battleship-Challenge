import type { Coordinate } from '../game/types';

const COL_LABELS = 'ABCDEFGHIJ';

export function formatCoordinate(coord: Coordinate): string {
  return `${COL_LABELS[coord.col]}${coord.row + 1}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
