import type { ArrowEscapeLevel, ArrowEscapePiece, Cell, Direction, PuzzleDifficulty } from "@/features/puzzles/types";

type ArrowGeneratorOptions = {
  count: number;
  dailyCount?: number;
  onLevelGenerated?: (progress: ArrowGenerationProgress) => void;
};

type ArrowBoardShape = {
  rows: number;
  cols: number;
  blockers: Cell[];
};

type ArrowLevelTier = "daily" | "early" | "mid" | "late" | "boss";

type ArrowLevelProfile = {
  tier: ArrowLevelTier;
  hard: boolean;
  minimumPieces: number;
  maximumPieces: number;
  pieceDivisor: number;
  targetJitter: number;
  candidateAttempts: number;
  placementAttempts: number;
  minLongestArrow: number;
  maxShortestArrow: number;
  minLengthRange: number;
  minDensity: number;
  maxOpenRatio: number;
  maxChoiceRatio: number;
  minShapeRatio: number;
  minDirections: number;
  lengthBands: Array<{ chance: number; min: number; span: number }>;
};

type ArrowGenerationResult = {
  blockers: Cell[];
  pieces: ArrowEscapePiece[];
  solutionOrder: string[];
  source: "accepted" | "best" | "fallback";
};

export type ArrowGenerationProgress = {
  index: number;
  id: string;
  tier: ArrowLevelTier;
  rows: number;
  cols: number;
  playableCells: number;
  pieceCount: number;
  longestArrow: number;
  source: ArrowGenerationResult["source"];
};

export type ArrowEscapeAnalysis = {
  pieceCount: number;
  blockerCount: number;
  initialEscapableCount: number;
  initialEscapableRatio: number;
  maxChoiceCount: number;
  solutionLength: number;
  solvable: boolean;
};

const directions: Direction[] = ["up", "right", "down", "left"];

export function createArrowEscapeLevelBank({ count, dailyCount = 7, onLevelGenerated }: ArrowGeneratorOptions): ArrowEscapeLevel[] {
  const levels: ArrowEscapeLevel[] = Array.from({ length: count }, (_, index) => {
    const hardDaily = index < dailyCount;
    const levelNumber = index - dailyCount + 1;
    const profile = selectArrowProfile(index, dailyCount);
    const shape = selectArrowShape(index, levelNumber, profile);
    const generated = createSolvableArrowLevel(shape, index + 113, profile);
    const difficulty: PuzzleDifficulty =
      hardDaily || profile.tier === "late" || profile.tier === "boss"
        ? "hard"
        : profile.tier === "mid"
          ? "medium"
          : "easy";

    const id = hardDaily ? `arrow-escape-daily-${String(index + 1).padStart(3, "0")}` : `arrow-escape-level-${String(levelNumber).padStart(3, "0")}`;
    const level: ArrowEscapeLevel = {
      metadata: {
        id,
        kind: "arrow-escape",
        title: hardDaily ? "Daily Rush" : `Escape ${levelNumber}`,
        difficulty,
        daily: hardDaily,
        date: hardDaily ? dailyDate(index + 1) : undefined,
        estimatedMinutes: hardDaily ? 5 : difficulty === "medium" ? 4 : 3,
        tags: hardDaily ? ["logic", "routing", "daily"] : ["logic", "routing"],
      },
      rows: shape.rows,
      cols: shape.cols,
      blockers: shape.blockers,
      pieces: generated.pieces,
      solutionOrder: generated.solutionOrder,
    };

    onLevelGenerated?.({
      index,
      id,
      tier: profile.tier,
      rows: shape.rows,
      cols: shape.cols,
      playableCells: shape.rows * shape.cols - shape.blockers.length,
      pieceCount: generated.pieces.length,
      longestArrow: Math.max(...generated.pieces.map((piece) => piece.cells?.length ?? 1)),
      source: generated.source,
    });

    return level;
  });
  const dailyLevels = levels.filter((level) => level.metadata.daily);
  const numberedLevels = seededShuffle(levels.filter((level) => !level.metadata.daily), 20260523)
    .map((level, index): ArrowEscapeLevel => {
      const levelNumber = index + 1;
      return {
        ...level,
        metadata: {
          ...level.metadata,
          id: `arrow-escape-level-${String(levelNumber).padStart(3, "0")}`,
          title: `Escape ${levelNumber}`,
        },
      };
    });

  return [...dailyLevels, ...numberedLevels];
}

export function analyzeArrowEscapeLevel(level: ArrowEscapeLevel): ArrowEscapeAnalysis {
  const solution = solveArrowEscapeLevel(level);
  const initialChoices = getEscapablePieces(level, new Set(), new Map(level.pieces.map((piece) => [piece.id, piece.start])));

  return {
    pieceCount: level.pieces.length,
    blockerCount: level.blockers.length,
    initialEscapableCount: initialChoices.length,
    initialEscapableRatio: initialChoices.length / level.pieces.length,
    maxChoiceCount: solution?.maxChoiceCount ?? 0,
    solutionLength: solution?.order.length ?? 0,
    solvable: Boolean(solution),
  };
}

export function solveArrowEscapeLevel(level: ArrowEscapeLevel) {
  const escaped = new Set<string>();
  const positions = new Map(level.pieces.map((piece) => [piece.id, piece.start] as const));
  const order: string[] = [];
  let maxChoiceCount = 0;

  while (escaped.size < level.pieces.length) {
    const choices = getEscapablePieces(level, escaped, positions);
    if (!choices.length) {
      return null;
    }

    maxChoiceCount = Math.max(maxChoiceCount, choices.length);
    const next = choices.sort((left, right) => scoreArrowPiece(left, level) - scoreArrowPiece(right, level))[0];
    escaped.add(next.id);
    positions.delete(next.id);
    order.push(next.id);
  }

  return { order, maxChoiceCount };
}

export function canArrowPieceEscape(
  level: ArrowEscapeLevel,
  piece: ArrowEscapePiece,
  piecePositions: Record<string, Cell>,
  escapedPieceIds: string[],
) {
  const escaped = new Set(escapedPieceIds);
  const blockers = new Set(level.blockers.map(cellKey));
  const position = piecePositions[piece.id];
  const occupied = new Set(
    level.pieces
      .filter((otherPiece) => !escaped.has(otherPiece.id))
      .flatMap((otherPiece) => getArrowPieceCells(otherPiece, piecePositions[otherPiece.id]))
      .map(cellKey),
  );

  if (!position || escaped.has(piece.id)) {
    return false;
  }

  return headLineToExitIsClear(position, piece.direction, level.rows, level.cols, occupied, blockers);
}

function createSolvableArrowLevel(shape: ArrowBoardShape, seed: number, profile: ArrowLevelProfile): ArrowGenerationResult {
  const { rows, cols, blockers } = shape;
  const blockerKeys = new Set(blockers.map(cellKey));
  const boardCells = allCells(rows, cols).filter((cell) => !blockerKeys.has(cellKey(cell)));
  const playableCellCount = rows * cols - blockers.length;
  const minimumPieces = profile.minimumPieces;
  const targetPieces = Math.max(
    minimumPieces,
    Math.min(profile.maximumPieces, Math.floor(playableCellCount / profile.pieceDivisor) + (seed % profile.targetJitter)),
  );
  let bestCandidate: { blockers: Cell[]; pieces: ArrowEscapePiece[]; solutionOrder: string[]; score: number } | null = null;

  const targetRelaxation = profile.tier === "early" ? 4 : 3;
  const lowestTarget = Math.max(minimumPieces, targetPieces - targetRelaxation);
  for (let currentTarget = targetPieces; currentTarget >= lowestTarget; currentTarget -= 1) {
    for (let attempt = 0; attempt < profile.candidateAttempts; attempt += 1) {
      const random = createRandom(seed + currentTarget * 104729 + attempt * 8191);
      const reversePieces: ArrowEscapePiece[] = [];

      for (let index = currentTarget - 1; index >= 0; index -= 1) {
        const candidate = findReverseArrowCandidate(rows, cols, blockerKeys, boardCells, reversePieces, random, profile, profile.placementAttempts);
        if (!candidate) break;
        reversePieces.push({
          ...candidate,
          id: `r${String(index + 1).padStart(2, "0")}`,
        });
      }

      if (reversePieces.length < currentTarget) continue;

      const pieces = reversePieces.reverse().map((piece, index) => ({
        ...piece,
        id: `p${String(index + 1).padStart(2, "0")}`,
      }));
      const level = createCandidateLevel(rows, cols, blockers, pieces);
      const solutionOrder = pieces.map((piece) => piece.id);
      if (!canReplaySolutionOrder(level, solutionOrder)) continue;

      const solution = solveArrowEscapeLevel(level);
      const initialChoices = getEscapablePieces(level, new Set(), new Map(pieces.map((piece) => [piece.id, piece.start] as const))).length;
      const directionVariety = new Set(pieces.map((piece) => piece.direction)).size;
      const occupiedCellCount = new Set(pieces.flatMap((piece) => getArrowPieceCells(piece, piece.start)).map(cellKey)).size;
      const pieceLengths = pieces.map((piece) => (piece.cells?.length ?? 1));
      const shapeScore = pieces.filter((piece) => (piece.cells?.length ?? 1) >= 2).length / pieces.length;
      const densityScore = occupiedCellCount / playableCellCount;
      const tooOpen = initialChoices >= pieces.length || initialChoices > Math.ceil(pieces.length * profile.maxOpenRatio);
      const hasLengthVariety =
        Math.max(...pieceLengths) >= profile.minLongestArrow &&
        Math.min(...pieceLengths) <= profile.maxShortestArrow &&
        Math.max(...pieceLengths) - Math.min(...pieceLengths) >= profile.minLengthRange;

      if (solution) {
        const score =
          initialChoices / pieces.length +
          solution.maxChoiceCount / pieces.length -
          directionVariety * 0.08 -
          shapeScore * -0.1 +
          Math.max(...pieceLengths) * -0.045 +
          densityScore * -0.16 -
          pieces.length * 0.018;
        if (!bestCandidate || score < bestCandidate.score) {
          bestCandidate = { blockers, pieces, solutionOrder, score };
        }
      }

      if (
        solution &&
        !tooOpen &&
        hasLengthVariety &&
        directionVariety >= profile.minDirections &&
        shapeScore >= profile.minShapeRatio &&
        densityScore >= profile.minDensity &&
        solution.maxChoiceCount <= Math.ceil(pieces.length * profile.maxChoiceRatio)
      ) {
        return { blockers, pieces, solutionOrder, source: "accepted" };
      }
    }
  }

  return bestCandidate ? { ...bestCandidate, source: "best" } : createFallbackArrowLevel(shape, seed, profile, minimumPieces);
}

function createFallbackArrowLevel(shape: ArrowBoardShape, seed: number, profile: ArrowLevelProfile, minimumPieces: number): ArrowGenerationResult {
  const { rows, cols, blockers } = shape;
  const blockerKeys = new Set(blockers.map(cellKey));
  const boardCells = allCells(rows, cols).filter((cell) => !blockerKeys.has(cellKey(cell)));
  const playableCells = rows * cols - blockers.length;
  const pieceTarget = Math.max(minimumPieces, Math.min(profile.maximumPieces, Math.floor(playableCells / (profile.pieceDivisor + 0.6))));
  let bestCandidate: ArrowGenerationResult | null = null;

  for (let attempt = 0; attempt < profile.candidateAttempts * 2; attempt += 1) {
    const pieces: ArrowEscapePiece[] = [];
    const random = createRandom(seed + attempt * 3571);

    for (let index = pieceTarget - 1; index >= 0; index -= 1) {
      const candidate = findReverseArrowCandidate(rows, cols, blockerKeys, boardCells, pieces, random, profile, profile.placementAttempts + 80);
      if (!candidate) break;
      pieces.push({ ...candidate, id: `r${String(index + 1).padStart(2, "0")}` });
    }

    const orderedPieces = pieces.reverse().map((piece, index) => ({ ...piece, id: `p${String(index + 1).padStart(2, "0")}` }));
    const solutionOrder = orderedPieces.map((piece) => piece.id);
    const level = createCandidateLevel(rows, cols, blockers, orderedPieces);
    if (!canReplaySolutionOrder(level, solutionOrder)) continue;

    if (!bestCandidate || orderedPieces.length > bestCandidate.pieces.length) {
      bestCandidate = { blockers, pieces: orderedPieces, solutionOrder, source: "fallback" };
    }
    if (orderedPieces.length >= minimumPieces) {
      break;
    }
  }

  return bestCandidate ?? { blockers, pieces: [], solutionOrder: [], source: "fallback" };
}

function createCandidateLevel(rows: number, cols: number, blockers: Cell[], pieces: ArrowEscapePiece[]): ArrowEscapeLevel {
  return {
    metadata: {
      id: "candidate",
      kind: "arrow-escape",
      title: "Candidate",
      difficulty: "hard",
      daily: false,
      estimatedMinutes: 4,
      tags: ["logic", "routing"],
    },
    rows,
    cols,
    blockers,
    pieces,
  };
}

function canReplaySolutionOrder(level: ArrowEscapeLevel, solutionOrder: string[]) {
  const escapedPieceIds: string[] = [];
  const piecePositions = Object.fromEntries(level.pieces.map((piece) => [piece.id, piece.start]));

  for (const pieceId of solutionOrder) {
    const piece = level.pieces.find((item) => item.id === pieceId);
    if (!piece || !canArrowPieceEscape(level, piece, piecePositions, escapedPieceIds)) {
      return false;
    }

    delete piecePositions[pieceId];
    escapedPieceIds.push(pieceId);
  }

  return true;
}

function findReverseArrowCandidate(
  rows: number,
  cols: number,
  blockerKeys: Set<string>,
  playableCells: Cell[],
  placedPieces: ArrowEscapePiece[],
  random: () => number,
  profile: ArrowLevelProfile,
  attempts = 96,
) {
  const occupied = new Set(placedPieces.flatMap((piece) => getArrowPieceCells(piece, piece.start)).map(cellKey));
  const candidates: Array<Pick<ArrowEscapePiece, "start" | "direction" | "cells"> & { score: number }> = [];

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const direction = directions[Math.floor(random() * directions.length)];
    const start = playableCells[Math.floor(random() * playableCells.length)];
    if (isOnExitEdge(start, direction, rows, cols)) continue;
    if (occupied.has(cellKey(start))) continue;

    const cells = buildDirectedArrowShape(start, direction, rows, cols, blockerKeys, occupied, random, profile);
    if (cells.length < (profile.hard ? 4 : 3) || cells.some((cell) => occupied.has(cellKey(cell)) || blockerKeys.has(cellKey(cell)))) continue;
    if (!headLineToExitIsClear(cells[0], direction, rows, cols, new Set([...occupied, ...cells.map(cellKey)]), blockerKeys)) continue;

    const blocksPlaced = placedPieces.filter((piece) => shapeBlocksPiece(cells, piece, rows, cols)).length;
    const bends = countBends(cells);
    const lengthScore = cells.length / (profile.hard ? 1.4 : 1.7);
    const exitDistance = Math.min(...cells.map((cell) => cellsToExit(cell, direction, rows, cols).length));
    const score = blocksPlaced * 5 + bends * 2 + lengthScore - exitDistance * 0.08 + random() * 0.5;

    candidates.push({ start, direction, cells, score });
  }

  return candidates.sort((left, right) => right.score - left.score)[0] ?? null;
}

function shapeBlocksPiece(cells: Cell[], piece: ArrowEscapePiece, rows: number, cols: number) {
  const blockerKeys = new Set(cells.map(cellKey));

  return cellsToExit(piece.start, piece.direction, rows, cols).some((laneCell) => blockerKeys.has(cellKey(laneCell)));
}

function buildDirectedArrowShape(
  start: Cell,
  direction: Direction,
  rows: number,
  cols: number,
  blockers: Set<string>,
  occupied: Set<string>,
  random: () => number,
  profile: ArrowLevelProfile,
) {
  const targetLength = chooseArrowLength(random, profile);
  const cells: Cell[] = [start];
  let previousDirection = oppositeDirection(direction);

  for (let step = 1; step < targetLength; step += 1) {
    const possibleDirections = shuffled(
      step === 1 ? [oppositeDirection(direction)] : [previousDirection, ...perpendicularDirections(previousDirection), oppositeDirection(direction)],
      random,
    );
    const next = possibleDirections
      .map((candidateDirection) => moveCell(cells[cells.length - 1], candidateDirection))
      .find(
        (cell) =>
          isInsideCell(cell, rows, cols) &&
          !blockers.has(cellKey(cell)) &&
          !occupied.has(cellKey(cell)) &&
          !cells.some((existing) => isSameCell(existing, cell)),
      );

    if (!next) break;
    previousDirection = directionBetween(cells[cells.length - 1], next) ?? previousDirection;
    cells.push(next);
  }

  return cells;
}

function countBends(cells: Cell[]) {
  let bends = 0;
  for (let index = 2; index < cells.length; index += 1) {
    const previous = directionBetween(cells[index - 2], cells[index - 1]);
    const current = directionBetween(cells[index - 1], cells[index]);
    if (previous && current && previous !== current) bends += 1;
  }
  return bends;
}

function chooseArrowLength(random: () => number, profile: ArrowLevelProfile) {
  const roll = random();
  const band = profile.lengthBands.find((candidate) => roll < candidate.chance) ?? profile.lengthBands[profile.lengthBands.length - 1];
  return band.min + Math.floor(random() * band.span);
}

function oppositeDirection(direction: Direction): Direction {
  if (direction === "up") return "down";
  if (direction === "right") return "left";
  if (direction === "down") return "up";
  return "right";
}

function perpendicularDirections(direction: Direction): Direction[] {
  return direction === "up" || direction === "down" ? ["left", "right"] : ["up", "down"];
}

function moveCell([row, col]: Cell, direction: Direction): Cell {
  if (direction === "up") return [row - 1, col];
  if (direction === "right") return [row, col + 1];
  if (direction === "down") return [row + 1, col];
  return [row, col - 1];
}

function directionBetween(from: Cell, to: Cell): Direction | null {
  if (to[0] === from[0] - 1 && to[1] === from[1]) return "up";
  if (to[0] === from[0] + 1 && to[1] === from[1]) return "down";
  if (to[0] === from[0] && to[1] === from[1] + 1) return "right";
  if (to[0] === from[0] && to[1] === from[1] - 1) return "left";
  return null;
}

function isInsideCell([row, col]: Cell, rows: number, cols: number) {
  return row >= 0 && col >= 0 && row < rows && col < cols;
}

function isOnExitEdge([row, col]: Cell, direction: Direction, rows: number, cols: number) {
  if (direction === "up") return row === 0;
  if (direction === "right") return col === cols - 1;
  if (direction === "down") return row === rows - 1;
  return col === 0;
}

function getEscapablePieces(level: ArrowEscapeLevel, escaped: Set<string>, positions: Map<string, Cell>) {
  const piecePositions = Object.fromEntries(positions);
  return level.pieces.filter((piece) => canArrowPieceEscape(level, piece, piecePositions, [...escaped]));
}

function scoreArrowPiece(piece: ArrowEscapePiece, level: ArrowEscapeLevel) {
  return cellsToExit(piece.start, piece.direction, level.rows, level.cols).length;
}

function selectArrowProfile(index: number, dailyCount: number): ArrowLevelProfile {
  if (index < dailyCount) {
    return {
      tier: "daily",
      hard: true,
      minimumPieces: 34,
      maximumPieces: 48,
      pieceDivisor: 26,
      targetJitter: 7,
      candidateAttempts: 6,
      placementAttempts: 90,
      minLongestArrow: 36,
      maxShortestArrow: 7,
      minLengthRange: 28,
      minDensity: 0.42,
      maxOpenRatio: 0.4,
      maxChoiceRatio: 0.52,
      minShapeRatio: 0.74,
      minDirections: 3,
      lengthBands: [
        { chance: 0.24, min: 36, span: 12 },
        { chance: 0.72, min: 18, span: 16 },
        { chance: 1, min: 4, span: 5 },
      ],
    };
  }

  const levelNumber = index - dailyCount + 1;
  const tierRoll = (levelNumber * 37) % 100;
  const mixedTier: Exclude<ArrowLevelTier, "daily"> =
    levelNumber >= 360 || tierRoll >= 85
      ? "boss"
      : tierRoll >= 40
        ? "late"
        : tierRoll >= 20
          ? "mid"
          : "early";

  if (mixedTier === "boss") {
    return {
      tier: "boss",
      hard: true,
      minimumPieces: 38,
      maximumPieces: 52,
      pieceDivisor: 31,
      targetJitter: 8,
      candidateAttempts: 5,
      placementAttempts: 90,
      minLongestArrow: 40,
      maxShortestArrow: 7,
      minLengthRange: 32,
      minDensity: 0.4,
      maxOpenRatio: 0.4,
      maxChoiceRatio: 0.52,
      minShapeRatio: 0.78,
      minDirections: 4,
      lengthBands: [
        { chance: 0.24, min: 40, span: 10 },
        { chance: 0.72, min: 20, span: 18 },
        { chance: 1, min: 4, span: 5 },
      ],
    };
  }

  if (mixedTier === "late") {
    return {
      tier: "late",
      hard: true,
      minimumPieces: 30,
      maximumPieces: 42,
      pieceDivisor: 26,
      targetJitter: 6,
      candidateAttempts: 5,
      placementAttempts: 80,
      minLongestArrow: 30,
      maxShortestArrow: 6,
      minLengthRange: 24,
      minDensity: 0.4,
      maxOpenRatio: 0.44,
      maxChoiceRatio: 0.56,
      minShapeRatio: 0.68,
      minDirections: 3,
      lengthBands: [
        { chance: 0.22, min: 30, span: 10 },
        { chance: 0.72, min: 15, span: 14 },
        { chance: 1, min: 4, span: 4 },
      ],
    };
  }

  if (mixedTier === "mid") {
    return {
      tier: "mid",
      hard: false,
      minimumPieces: 24,
      maximumPieces: 34,
      pieceDivisor: 22,
      targetJitter: 5,
      candidateAttempts: 7,
      placementAttempts: 70,
      minLongestArrow: 24,
      maxShortestArrow: 5,
      minLengthRange: 19,
      minDensity: 0.4,
      maxOpenRatio: 0.56,
      maxChoiceRatio: 0.68,
      minShapeRatio: 0.5,
      minDirections: 3,
      lengthBands: [
        { chance: 0.22, min: 24, span: 8 },
        { chance: 0.72, min: 12, span: 11 },
        { chance: 1, min: 3, span: 3 },
      ],
    };
  }

  return {
    tier: "early",
    hard: false,
    minimumPieces: 18,
    maximumPieces: 26,
    pieceDivisor: 18,
    targetJitter: 4,
    candidateAttempts: 8,
    placementAttempts: 70,
    minLongestArrow: 18,
    maxShortestArrow: 4,
    minLengthRange: 14,
    minDensity: 0.38,
    maxOpenRatio: 0.58,
    maxChoiceRatio: 0.74,
    minShapeRatio: 0.34,
    minDirections: 2,
    lengthBands: [
      { chance: 0.24, min: 18, span: 6 },
      { chance: 0.72, min: 9, span: 8 },
      { chance: 1, min: 3, span: 2 },
    ],
  };
}

function selectArrowShape(index: number, levelNumber: number, profile: ArrowLevelProfile): ArrowBoardShape {
  if (profile.tier === "daily") {
    const dailyShapes = [
      boardShape(38, 38, "square"),
      boardShape(40, 40, "heart"),
      boardShape(40, 42, "tomb"),
      boardShape(42, 44, "letter-l"),
      boardShape(44, 44, "diamond"),
      boardShape(44, 44, "square"),
      boardShape(44, 46, "heart"),
    ];
    return dailyShapes[index % dailyShapes.length];
  }

  if (profile.tier === "boss") {
    const bossShapes = [
      boardShape(42, 42, "square"),
      boardShape(44, 42, "heart"),
      boardShape(42, 46, "tomb"),
      boardShape(44, 46, "letter-l"),
      boardShape(46, 46, "diamond"),
      boardShape(46, 46, "square"),
    ];
    return bossShapes[levelNumber % bossShapes.length];
  }

  if (profile.tier === "late") {
    const lateShapes = [
      boardShape(32, 32, "square"),
      boardShape(34, 34, "diamond"),
      boardShape(34, 36, "tomb"),
      boardShape(36, 34, "letter-l"),
      boardShape(36, 36, "heart"),
      boardShape(34, 38, "square"),
    ];
    return lateShapes[levelNumber % lateShapes.length];
  }

  if (profile.tier === "mid") {
    const midShapes = [
      boardShape(28, 28, "square"),
      boardShape(28, 30, "diamond"),
      boardShape(30, 30, "tomb"),
      boardShape(30, 32, "letter-l"),
      boardShape(30, 30, "heart"),
    ];
    return midShapes[levelNumber % midShapes.length];
  }

  const hardShapes = [
    boardShape(28, 28, "square"),
    boardShape(28, 28, "heart"),
    boardShape(28, 27, "tomb"),
    boardShape(27, 29, "letter-l"),
    boardShape(28, 28, "diamond"),
  ];
  const levelShapes = [
    boardShape(26, 26, "square"),
    boardShape(26, 26, "diamond"),
    boardShape(26, 28, "tomb"),
    boardShape(26, 30, "letter-l"),
    boardShape(26, 26, "heart"),
  ];

  return profile.hard ? hardShapes[index % hardShapes.length] : levelShapes[index % levelShapes.length];
}

function boardShape(rows: number, cols: number, shape: "square" | "heart" | "tomb" | "letter-l" | "diamond"): ArrowBoardShape {
  const blockers = allCells(rows, cols).filter(([row, col]) => {
    if (shape === "square") return false;
    if (shape === "tomb") {
      const center = (cols - 1) / 2;
      const domeWidth = Math.floor(cols * 0.34);
      return row === 0 && Math.abs(col - center) > domeWidth;
    }
    if (shape === "letter-l") {
      return row < Math.floor(rows * 0.48) && col > Math.floor(cols * 0.56);
    }
    if (shape === "diamond") {
      const rowCenter = (rows - 1) / 2;
      const colCenter = (cols - 1) / 2;
      return Math.abs(row - rowCenter) / (rows / 2) + Math.abs(col - colCenter) / (cols / 2) > 1.32;
    }

    const topNotch = row < Math.floor(rows * 0.18) && col > Math.floor(cols * 0.34) && col < Math.ceil(cols * 0.66);
    const lowerTaper = row > Math.floor(rows * 0.66) && (col < row - Math.floor(rows * 0.58) || col > cols - 1 - (row - Math.floor(rows * 0.58)));
    const topCorners = row < Math.floor(rows * 0.18) && (col < 1 || col > cols - 2);
    return topNotch || lowerTaper || topCorners;
  });

  return { rows, cols, blockers };
}

function cellsToExit([row, col]: Cell, direction: Direction, rows: number, cols: number) {
  const cells: Cell[] = [];
  if (direction === "up") {
    for (let nextRow = row - 1; nextRow >= 0; nextRow -= 1) cells.push([nextRow, col]);
  } else if (direction === "down") {
    for (let nextRow = row + 1; nextRow < rows; nextRow += 1) cells.push([nextRow, col]);
  } else if (direction === "left") {
    for (let nextCol = col - 1; nextCol >= 0; nextCol -= 1) cells.push([row, nextCol]);
  } else {
    for (let nextCol = col + 1; nextCol < cols; nextCol += 1) cells.push([row, nextCol]);
  }
  return cells;
}

function headLineToExitIsClear(
  head: Cell,
  direction: Direction,
  rows: number,
  cols: number,
  occupied: Set<string>,
  blockers: Set<string>,
) {
  return cellsToExit(head, direction, rows, cols).every((laneCell) => {
    const key = cellKey(laneCell);
    return !blockers.has(key) && !occupied.has(key);
  });
}

function allCells(rows: number, cols: number) {
  return Array.from({ length: rows * cols }, (_, index) => [Math.floor(index / cols), index % cols] as Cell);
}

function isSameCell(left: Cell, right: Cell) {
  return left[0] === right[0] && left[1] === right[1];
}

function getArrowPieceCells(piece: ArrowEscapePiece, position: Cell | undefined) {
  if (!position) return [];
  const shape = piece.cells?.length ? piece.cells : [piece.start];
  const rowOffset = position[0] - piece.start[0];
  const colOffset = position[1] - piece.start[1];
  return shape.map(([row, col]) => [row + rowOffset, col + colOffset] as Cell);
}

function cellKey([row, col]: Cell) {
  return `${row},${col}`;
}

function dailyDate(index: number) {
  return `2026-05-${String(21 + index).padStart(2, "0")}`;
}

function shuffled<T>(items: T[], random: () => number) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function seededShuffle<T>(items: T[], seed: number) {
  return shuffled(items, createRandom(seed));
}

function createRandom(seed: number) {
  let value = seed;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let next = Math.imul(value ^ (value >>> 15), 1 | value);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}
