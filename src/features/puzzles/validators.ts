import type {
  ArrowEscapeLevel,
  ArrowEscapeState,
  Cell,
  Direction,
  ValidationResult,
  WordleLevel,
  WordleState,
  ZipLevel,
  ZipState,
} from "./types";

const keyFor = ([row, col]: Cell) => `${row},${col}`;
const labelFor = ([row, col]: Cell) => `${row + 1},${col + 1}`;

const isSameCell = (left: Cell, right: Cell) => left[0] === right[0] && left[1] === right[1];

const isAdjacent = (left: Cell, right: Cell) =>
  Math.abs(left[0] - right[0]) + Math.abs(left[1] - right[1]) === 1;

const isInside = (rows: number, cols: number, [row, col]: Cell) =>
  row >= 0 && row < rows && col >= 0 && col < cols;

const uniqueCellCount = (cells: Cell[]) => new Set(cells.map(keyFor)).size;
const wallKeyFor = (left: Cell, right: Cell) => [keyFor(left), keyFor(right)].sort().join("|");

const result = (isComplete: boolean, errors: string[]): ValidationResult => ({
  isComplete: errors.length === 0 && isComplete,
  errors,
});

export function validateZipState(level: ZipLevel, state: ZipState): ValidationResult {
  const errors: string[] = [];
  const blocked = new Set((level.blocked ?? []).map(keyFor));
  const walls = new Set((level.walls ?? []).map(([left, right]) => wallKeyFor(left, right)));
  const usableCellCount = level.rows * level.cols - blocked.size;
  const firstCheckpoint = level.checkpoints[0];
  const lastCheckpoint = level.checkpoints.at(-1);

  if (state.path.length && firstCheckpoint && !isSameCell(state.path[0], firstCheckpoint)) {
    errors.push("Path must start on 1.");
  }

  if (state.path.length && lastCheckpoint && !isSameCell(state.path[state.path.length - 1], lastCheckpoint)) {
    errors.push("Path must end on the final number.");
  }

  for (const cell of state.path) {
    if (!isInside(level.rows, level.cols, cell)) {
      errors.push(`Cell ${labelFor(cell)} is outside the board.`);
    }
    if (blocked.has(keyFor(cell))) {
      errors.push(`Cell ${labelFor(cell)} is blocked.`);
    }
  }

  if (uniqueCellCount(state.path) !== state.path.length) {
    errors.push("Path cannot visit the same cell twice.");
  }

  if (state.path.some((cell, index) => index > 0 && !isAdjacent(state.path[index - 1], cell))) {
    errors.push("Path moves must be orthogonally adjacent.");
  }

  if (state.path.some((cell, index) => index > 0 && walls.has(wallKeyFor(state.path[index - 1], cell)))) {
    errors.push("Path cannot cross a wall.");
  }

  let checkpointIndex = 0;
  for (const cell of state.path) {
    if (level.checkpoints[checkpointIndex] && isSameCell(cell, level.checkpoints[checkpointIndex])) {
      checkpointIndex += 1;
    }
  }

  if (checkpointIndex !== level.checkpoints.length) {
    errors.push("Path must visit checkpoints in order.");
  }

  return result(state.path.length === usableCellCount, errors);
}

export function validateArrowEscapeState(
  level: ArrowEscapeLevel,
  state: ArrowEscapeState,
): ValidationResult {
  const errors: string[] = [];
  const escaped = new Set(state.escapedPieceIds);
  const pieceIds = new Set(level.pieces.map((piece) => piece.id));

  for (const id of escaped) {
    if (!pieceIds.has(id)) {
      errors.push(`Unknown escaped piece ${id}.`);
    }
  }

  for (const piece of level.pieces) {
    const position = state.piecePositions[piece.id];
    if (!escaped.has(piece.id) && !position) {
      errors.push(`Piece ${piece.id} is not on the board or escaped.`);
      continue;
    }

    if (position && !isInside(level.rows, level.cols, position)) {
      errors.push(`Piece ${piece.id} is outside the board.`);
    }

    if (position && !isOnArrowLane(piece.start, position, piece.direction)) {
      errors.push(`Piece ${piece.id} moved off its arrow lane.`);
    }
  }

  return result(escaped.size === level.pieces.length, errors);
}

export function validateWordleState(level: WordleLevel, state: WordleState): ValidationResult {
  const errors: string[] = [];
  const answer = level.answer.toLowerCase();
  const allowed = new Set(level.allowedWords.map((word) => word.toLowerCase()));

  if (state.guesses.length > level.maxGuesses) {
    errors.push("Too many guesses submitted.");
  }

  state.guesses.forEach((guess, index) => {
    const normalized = guess.toLowerCase();
    if (normalized.length !== answer.length) {
      errors.push(`Guess ${index + 1} must be ${answer.length} letters.`);
    }
    if (!allowed.has(normalized)) {
      errors.push(`Guess ${index + 1} is not in the allowed word list.`);
    }
  });

  return result(state.guesses.some((guess) => guess.toLowerCase() === answer), errors);
}

function isOnArrowLane(start: Cell, position: Cell, direction: Direction): boolean {
  if (direction === "up") return position[1] === start[1] && position[0] <= start[0];
  if (direction === "down") return position[1] === start[1] && position[0] >= start[0];
  if (direction === "left") return position[0] === start[0] && position[1] <= start[1];
  return position[0] === start[0] && position[1] >= start[1];
}
