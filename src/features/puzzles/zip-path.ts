import type { Cell } from "./types";

const keyFor = ([row, col]: Cell) => `${row},${col}`;
const isSameCell = (left: Cell, right: Cell) => left[0] === right[0] && left[1] === right[1];
const isAdjacent = (left: Cell, right: Cell) =>
  Math.abs(left[0] - right[0]) + Math.abs(left[1] - right[1]) === 1;

export function applyZipCellToPath(
  path: Cell[],
  cell: Cell,
  checkpoints: Cell[],
  walls: Array<readonly [Cell, Cell]> = [],
) {
  const firstCheckpoint = checkpoints[0];
  if (!path.length) {
    return firstCheckpoint && isSameCell(cell, firstCheckpoint) ? [cell] : path;
  }

  const existingIndex = path.findIndex((pathCell) => isSameCell(pathCell, cell));
  if (existingIndex >= 0) {
    return path.slice(0, existingIndex + 1);
  }

  const last = path.at(-1);
  if (!last || !isAdjacent(last, cell)) {
    return path;
  }

  if (hasWallBetween(last, cell, walls)) {
    return path;
  }

  if (isSkippedCheckpoint(path, cell, checkpoints)) {
    return path;
  }

  return [...path, cell];
}

function isSkippedCheckpoint(path: Cell[], cell: Cell, checkpoints: Cell[]) {
  const checkpointIndex = checkpoints.findIndex((checkpoint) => isSameCell(checkpoint, cell));
  if (checkpointIndex < 0) return false;

  const visitedCheckpoints = new Set(
    path
      .map((pathCell) => checkpoints.findIndex((checkpoint) => isSameCell(checkpoint, pathCell)))
      .filter((index) => index >= 0)
      .map(String),
  );

  const nextCheckpointIndex = checkpoints.findIndex((_, index) => !visitedCheckpoints.has(String(index)));
  return checkpointIndex !== nextCheckpointIndex;
}

export function zipCellKey(cell: Cell) {
  return keyFor(cell);
}

export function zipWallKey(left: Cell, right: Cell) {
  return [keyFor(left), keyFor(right)].sort().join("|");
}

function hasWallBetween(left: Cell, right: Cell, walls: Array<readonly [Cell, Cell]>) {
  const candidate = zipWallKey(left, right);
  return walls.some(([wallLeft, wallRight]) => zipWallKey(wallLeft, wallRight) === candidate);
}
