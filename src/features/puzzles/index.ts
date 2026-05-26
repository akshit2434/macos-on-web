export * from "./types";
export * from "./validators";
export * from "./wordle-scoring";
export * from "./components/ArrowEscapePuzzle";
export * from "./components/WordlePuzzle";
export * from "./components/ZipPuzzle";

import type {
  ArrowEscapeLevel,
  ArrowEscapeState,
  WordleState,
  ZipState,
} from "./types";

export const createZipState = (startedAtMs = Date.now()): ZipState => ({
  startedAtMs,
  elapsedMs: 0,
  hintsUsed: 0,
  status: "idle",
  path: [],
});

export const createArrowEscapeState = (
  level: ArrowEscapeLevel,
  startedAtMs = Date.now(),
): ArrowEscapeState => ({
  startedAtMs,
  elapsedMs: 0,
  hintsUsed: 0,
  status: "playing",
  livesRemaining: 3,
  piecePositions: Object.fromEntries(level.pieces.map((piece) => [piece.id, piece.start])),
  escapedPieceIds: [],
});

export const createWordleState = (startedAtMs = Date.now()): WordleState => ({
  startedAtMs,
  elapsedMs: 0,
  hintsUsed: 0,
  status: "idle",
  guesses: [],
  currentGuess: "",
});
