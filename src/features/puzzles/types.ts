export type PuzzleKind =
  | "zip"
  | "arrow-escape"
  | "wordle";

export type PuzzleDifficulty = "easy" | "medium" | "hard";

export type Cell = readonly [row: number, col: number];

export type Direction = "up" | "right" | "down" | "left";

export type PuzzleMetadata = {
  id: string;
  kind: PuzzleKind;
  title: string;
  difficulty: PuzzleDifficulty;
  daily: boolean;
  date?: string;
  estimatedMinutes: number;
  tags: string[];
};

export type TimerFriendlyState = {
  startedAtMs: number;
  elapsedMs: number;
  hintsUsed: number;
  status?: "idle" | "playing" | "complete" | "failed";
};

export type ValidationResult = {
  isComplete: boolean;
  errors: string[];
};

export type PuzzleShellProps<TLevel, TState> = {
  level: TLevel;
  state: TState;
  onStateChange?: (state: TState) => void;
  onReset?: () => void;
  onHint?: () => void;
};

export type ZipLevel = {
  metadata: PuzzleMetadata & { kind: "zip" };
  rows: number;
  cols: number;
  checkpoints: Array<Cell & { order?: never }>;
  blocked?: Cell[];
  walls?: Array<readonly [Cell, Cell]>;
  solutionPath?: Cell[];
};

export type ZipState = TimerFriendlyState & {
  path: Cell[];
};

export type ArrowEscapePiece = {
  id: string;
  start: Cell;
  direction: Direction;
  cells?: Cell[];
};

export type ArrowEscapeLevel = {
  metadata: PuzzleMetadata & { kind: "arrow-escape" };
  rows: number;
  cols: number;
  pieces: ArrowEscapePiece[];
  blockers: Cell[];
  solutionOrder?: string[];
};

export type ArrowEscapeState = TimerFriendlyState & {
  piecePositions: Record<string, Cell>;
  escapedPieceIds: string[];
  livesRemaining?: number;
};

export type WordleLevel = {
  metadata: PuzzleMetadata & { kind: "wordle" };
  answer: string;
  maxGuesses: number;
  allowedWords: string[];
};

export type WordleState = TimerFriendlyState & {
  guesses: string[];
  currentGuess?: string;
};
