import { describe, expect, it } from "vitest";

import {
  validateArrowEscapeState,
  validateWordleState,
  validateZipState,
} from "@/features/puzzles/validators";
import {
  arrowEscapeLevels,
  wordleLevels,
  zipLevels,
} from "@/content/puzzles";
import { analyzeZipLevel } from "@/content/puzzles/zip-level-generator";
import { analyzeArrowEscapeLevel, canArrowPieceEscape } from "@/content/puzzles/arrow-escape-generator";
import type { ArrowEscapeState } from "@/features/puzzles";

describe("puzzle validators", () => {
  it("validates Zip paths that visit every cell and checkpoint in order", () => {
    const level = zipLevels[0];

    expect(
      validateZipState(level, {
        startedAtMs: 0,
        elapsedMs: 42,
        hintsUsed: 1,
        path: level.solutionPath ?? [],
      }),
    ).toMatchObject({ isComplete: true, errors: [] });

    expect(
      validateZipState(level, {
        startedAtMs: 0,
        elapsedMs: 42,
        hintsUsed: 0,
        path: [
          [0, 0],
          [1, 1],
        ],
      }).errors,
    ).toContain("Path moves must be orthogonally adjacent.");
  });

  it("requires Zip paths to start on 1 and end on the final number", () => {
    const level = zipLevels[0];
    const startsAwayFromOne = [
      [0, 1],
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [4, 1],
      [4, 2],
      [4, 3],
      [4, 4],
    ] as const;
    const continuesAfterLastNumber = [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [1, 4],
      [2, 4],
      [3, 4],
      [4, 4],
      [4, 3],
    ] as const;

    expect(
      validateZipState(level, {
        startedAtMs: 0,
        elapsedMs: 1,
        hintsUsed: 0,
        path: [...startsAwayFromOne],
      }).errors,
    ).toContain("Path must start on 1.");

    expect(
      validateZipState(level, {
        startedAtMs: 0,
        elapsedMs: 1,
        hintsUsed: 0,
        path: [...continuesAfterLastNumber],
      }).errors,
    ).toContain("Path must end on the final number.");
  });

  it("ships a generated Zip bank with valid solution paths and harder daily levels", () => {
    expect(zipLevels.length).toBeGreaterThanOrEqual(400);
    expect(zipLevels.filter((level) => level.metadata.daily).length).toBeGreaterThanOrEqual(7);
    expect(zipLevels.slice(1, 8).every((level) => level.metadata.difficulty === "hard")).toBe(true);
    expect(analyzeZipLevel(zipLevels[0]).usableCells).toBeGreaterThanOrEqual(54);

    for (const level of zipLevels) {
      expect(level.solutionPath, level.metadata.id).toBeDefined();
      expect(
        validateZipState(level, {
          startedAtMs: 0,
          elapsedMs: 1,
          hintsUsed: 0,
          path: level.solutionPath ?? [],
        }),
        level.metadata.id,
      ).toMatchObject({ isComplete: true, errors: [] });
    }
  });

  it("ships Zip levels with varied boards, blockers, and enough path texture to feel puzzly", () => {
    const analyses = zipLevels.map(analyzeZipLevel);
    const boardSizes = new Set(zipLevels.map((level) => `${level.rows}x${level.cols}`));
    const levelIds = zipLevels.map((level) => level.metadata.id);
    const blockedLevels = zipLevels.filter((level) => (level.blocked?.length ?? 0) > 0);
    const walledLevels = zipLevels.filter((level) => (level.walls?.length ?? 0) >= 2);
    const hardDailyLevels = zipLevels.filter((level) => level.metadata.daily && level.metadata.difficulty === "hard");
    const numberedLevels = zipLevels.filter((level) => !level.metadata.daily);

    expect(new Set(levelIds).size).toBe(levelIds.length);
    expect(numberedLevels.length).toBeGreaterThanOrEqual(400);
    expect(boardSizes.size).toBeGreaterThanOrEqual(4);
    expect(blockedLevels.length).toBeGreaterThanOrEqual(80);
    expect(walledLevels.length).toBeGreaterThanOrEqual(80);
    expect(hardDailyLevels.length).toBeGreaterThanOrEqual(7);

    for (const [index, level] of zipLevels.entries()) {
      const analysis = analyses[index];

      expect(level.rows, level.metadata.id).toBeGreaterThanOrEqual(5);
      expect(level.cols, level.metadata.id).toBeGreaterThanOrEqual(5);
      expect(analysis.usableCells, level.metadata.id).toBeGreaterThanOrEqual(level.metadata.difficulty === "hard" ? 54 : 34);
      expect(level.checkpoints.length, level.metadata.id).toBeGreaterThanOrEqual(level.metadata.difficulty === "hard" ? 10 : 6);
      expect(level.checkpoints.length / analysis.usableCells, level.metadata.id).toBeGreaterThanOrEqual(level.metadata.difficulty === "hard" ? 0.14 : 0.12);
      expect(analysis.turns, level.metadata.id).toBeGreaterThanOrEqual(level.metadata.difficulty === "hard" ? 12 : 6);
      expect(analysis.longestStraightRun, level.metadata.id).toBeLessThanOrEqual(level.metadata.difficulty === "hard" ? 6 : 7);
      expect(analysis.wallClusterCount, level.metadata.id).toBeGreaterThanOrEqual((level.walls?.length ?? 0) ? 1 : 0);
      expect(analysis.checkpointSpacingIsPlayable, level.metadata.id).toBe(true);
    }
  });

  it("validates Arrow Escape only when every piece exits through its arrow lane", () => {
    const level = arrowEscapeLevels[0];
    const solvedState = solveArrowLevelForTest(level);

    expect(
      validateArrowEscapeState(level, solvedState),
    ).toMatchObject({ isComplete: true, errors: [] });

    expect(
      validateArrowEscapeState(level, {
        startedAtMs: 0,
        elapsedMs: 12,
        hintsUsed: 0,
        escapedPieceIds: [level.pieces[0].id],
        piecePositions: Object.fromEntries(level.pieces.slice(1).map((piece) => [piece.id, piece.start])),
      }),
    ).toMatchObject({ isComplete: false });
  });

  it("allows Arrow Escape when only the body is blocked but the head has line of sight", () => {
    const level = {
      metadata: {
        id: "arrow-escape-head-line",
        kind: "arrow-escape",
        title: "Head Line",
        difficulty: "easy",
        daily: false,
        estimatedMinutes: 1,
        tags: ["logic"],
      },
      rows: 4,
      cols: 7,
      blockers: [],
      pieces: [
        {
          id: "p01",
          start: [0, 5],
          direction: "right",
          cells: [
            [0, 5],
            [1, 5],
            [1, 4],
          ],
        },
        {
          id: "p02",
          start: [1, 6],
          direction: "down",
          cells: [[1, 6]],
        },
      ],
    } satisfies (typeof arrowEscapeLevels)[number];

    expect(
      canArrowPieceEscape(
        level,
        level.pieces[0],
        {
          p01: level.pieces[0].start,
          p02: level.pieces[1].start,
        },
        [],
      ),
    ).toBe(true);
  });

  it("blocks Arrow Escape when another piece sits in the head exit lane", () => {
    const level = {
      metadata: {
        id: "arrow-escape-head-blocked",
        kind: "arrow-escape",
        title: "Head Blocked",
        difficulty: "easy",
        daily: false,
        estimatedMinutes: 1,
        tags: ["logic"],
      },
      rows: 4,
      cols: 7,
      blockers: [],
      pieces: [
        {
          id: "p01",
          start: [0, 3],
          direction: "right",
          cells: [
            [0, 3],
            [1, 3],
            [1, 2],
          ],
        },
        {
          id: "p02",
          start: [0, 5],
          direction: "down",
          cells: [
            [0, 5],
            [1, 5],
          ],
        },
      ],
    } satisfies (typeof arrowEscapeLevels)[number];

    expect(
      canArrowPieceEscape(
        level,
        level.pieces[0],
        {
          p01: level.pieces[0].start,
          p02: level.pieces[1].start,
        },
        [],
      ),
    ).toBe(false);
  });

  it("blocks Arrow Escape when the arrow body crosses its own head exit lane", () => {
    const level = {
      metadata: {
        id: "arrow-escape-self-blocked",
        kind: "arrow-escape",
        title: "Self Blocked",
        difficulty: "easy",
        daily: false,
        estimatedMinutes: 1,
        tags: ["logic"],
      },
      rows: 4,
      cols: 7,
      blockers: [],
      pieces: [
        {
          id: "p01",
          start: [1, 2],
          direction: "right",
          cells: [
            [1, 2],
            [1, 1],
            [2, 1],
            [2, 2],
            [2, 3],
            [2, 4],
            [1, 4],
          ],
        },
      ],
    } satisfies (typeof arrowEscapeLevels)[number];

    expect(
      canArrowPieceEscape(
        level,
        level.pieces[0],
        {
          p01: level.pieces[0].start,
        },
        [],
      ),
    ).toBe(false);
  });

  it("ships an Arrow Escape bank with legal generated solution orders", () => {
    const analyses = arrowEscapeLevels.map(analyzeArrowEscapeLevel);
    const levelIds = arrowEscapeLevels.map((level) => level.metadata.id);
    const shapedLevels = arrowEscapeLevels.filter((level) => level.pieces.some((piece) => (piece.cells?.length ?? 1) >= 2));
    const hardDailyLevels = arrowEscapeLevels.filter((level) => level.metadata.daily && level.metadata.difficulty === "hard");
    const nonRectangularLevels = arrowEscapeLevels.filter((level) => level.blockers.length > 0);
    const longArrowLevels = arrowEscapeLevels.filter((level) => level.pieces.some((piece) => (piece.cells?.length ?? 1) >= 5));
    const veryLongArrowLevels = arrowEscapeLevels.filter((level) => level.pieces.some((piece) => (piece.cells?.length ?? 1) >= 8));
    const hugeArrowLevels = arrowEscapeLevels.filter((level) => level.pieces.some((piece) => (piece.cells?.length ?? 1) >= 10));
    const giantArrowLevels = arrowEscapeLevels.filter((level) => level.pieces.some((piece) => (piece.cells?.length ?? 1) >= 20));
    const turnedArrowLevels = arrowEscapeLevels.filter((level) => level.pieces.some((piece) => countArrowBends(piece.cells ?? [piece.start]) >= 2));
    const numberedLevels = arrowEscapeLevels.filter((level) => !level.metadata.daily);
    const substantialLevels = numberedLevels.filter((level) => level.rows * level.cols - level.blockers.length >= 500);
    const hugeLevels = numberedLevels.filter((level) => level.rows >= 28 || level.cols >= 28);
    const bossLevels = numberedLevels.filter((level) => level.rows * level.cols - level.blockers.length >= 900);
    const enormousLevels = numberedLevels.filter((level) => level.rows * level.cols - level.blockers.length >= 1300);
    const averagePieceCount = arrowEscapeLevels.reduce((sum, level) => sum + level.pieces.length, 0) / arrowEscapeLevels.length;
    const hardInitialEscapableRatios = arrowEscapeLevels
      .map((level, index) => ({ level, analysis: analyses[index] }))
      .filter(({ level }) => level.metadata.difficulty === "hard")
      .map(({ analysis }) => analysis.initialEscapableRatio);

    expect(arrowEscapeLevels.length).toBeGreaterThanOrEqual(400);
    expect(numberedLevels.length).toBeGreaterThanOrEqual(400);
    expect(new Set(levelIds).size).toBe(levelIds.length);
    expect(arrowEscapeLevels[0].metadata.date).toBe("2026-05-22");
    expect(hardDailyLevels.length).toBeGreaterThanOrEqual(7);
    expect(shapedLevels.length).toBeGreaterThanOrEqual(90);
    expect(nonRectangularLevels.length).toBeGreaterThanOrEqual(50);
    expect(longArrowLevels.length).toBeGreaterThanOrEqual(90);
    expect(veryLongArrowLevels.length).toBeGreaterThanOrEqual(90);
    expect(hugeArrowLevels.length).toBeGreaterThanOrEqual(7);
    expect(giantArrowLevels.length).toBeGreaterThanOrEqual(50);
    expect(arrowEscapeLevels.filter((level) => level.pieces.some((piece) => (piece.cells?.length ?? 1) >= 30)).length).toBeGreaterThanOrEqual(180);
    expect(turnedArrowLevels.length).toBeGreaterThanOrEqual(90);
    expect(substantialLevels.length).toBeGreaterThanOrEqual(360);
    expect(hugeLevels.length).toBeGreaterThanOrEqual(300);
    expect(bossLevels.length).toBeGreaterThanOrEqual(220);
    expect(enormousLevels.length).toBeGreaterThanOrEqual(70);
    expect(Math.max(...analyses.map((analysis) => analysis.pieceCount))).toBeGreaterThanOrEqual(43);
    expect(averagePieceCount).toBeGreaterThanOrEqual(27);
    expect(Math.max(...arrowEscapeLevels.map((level) => level.rows * level.cols - level.blockers.length))).toBeGreaterThanOrEqual(1700);
    expect(hardInitialEscapableRatios.reduce((sum, ratio) => sum + ratio, 0) / hardInitialEscapableRatios.length).toBeLessThanOrEqual(0.47);
    expect(hardDailyLevels.filter((level) => new Set(level.pieces.map((piece) => piece.direction)).size >= 3).length).toBeGreaterThanOrEqual(5);

    for (const [index, level] of arrowEscapeLevels.entries()) {
      const analysis = analyses[index];
      const blockerKeys = new Set(level.blockers.map(cellKeyForTest));
      const occupiedCellKeys = new Set<string>();
      const pieceLengths = level.pieces.map((piece) => (piece.cells?.length ?? 1));
      expect(analysis.solvable, level.metadata.id).toBe(true);
      expect(analysis.solutionLength, level.metadata.id).toBe(level.pieces.length);
      expect(analysis.pieceCount, level.metadata.id).toBeGreaterThanOrEqual(level.metadata.difficulty === "hard" ? 9 : 8);
      expect(analysis.initialEscapableCount, level.metadata.id).toBeLessThan(level.pieces.length);
      expect(Math.max(...pieceLengths), level.metadata.id).toBeGreaterThanOrEqual(level.metadata.difficulty === "hard" ? 10 : 8);
      expect(Math.min(...pieceLengths), level.metadata.id).toBeLessThanOrEqual(level.metadata.difficulty === "hard" ? 16 : level.metadata.difficulty === "medium" ? 7 : 4);
      expect(Math.max(...pieceLengths) - Math.min(...pieceLengths), level.metadata.id).toBeGreaterThanOrEqual(level.metadata.difficulty === "hard" ? 5 : 4);
      expect(level.pieces.filter((piece) => (piece.cells?.length ?? 1) >= 2).length / level.pieces.length, level.metadata.id).toBeGreaterThanOrEqual(
        level.metadata.difficulty === "hard" ? 0.5 : 0.2,
      );
      for (const piece of level.pieces) {
        const cells = piece.cells ?? [piece.start];
        expect(cells.length, `${level.metadata.id}:${piece.id}`).toBeGreaterThanOrEqual(level.metadata.difficulty === "hard" ? 4 : 3);
        expect(isArrowHeadAwayFromExitEdge(level.rows, level.cols, piece), `${level.metadata.id}:${piece.id}`).toBe(true);
        expect(isArrowHeadSegmentAligned(piece), `${level.metadata.id}:${piece.id}`).toBe(true);
        expect(isArrowHeadLineClearOfSelf(level, piece), `${level.metadata.id}:${piece.id} self-blocks head lane`).toBe(true);
        expect(new Set(cells.map(cellKeyForTest)).size, `${level.metadata.id}:${piece.id}`).toBe(cells.length);
        for (const [cellIndex, cell] of cells.entries()) {
          expect(isInsideArrowBoard(level.rows, level.cols, cell), `${level.metadata.id}:${piece.id}:${cell.join(",")}`).toBe(true);
          expect(blockerKeys.has(cellKeyForTest(cell)), `${level.metadata.id}:${piece.id}:${cell.join(",")} blocked`).toBe(false);
          if (cellIndex > 0) {
            expect(areAdjacentCells(cells[cellIndex - 1], cell), `${level.metadata.id}:${piece.id}:${cellIndex}`).toBe(true);
          }
          const key = cellKeyForTest(cell);
          expect(occupiedCellKeys.has(key), `${level.metadata.id}:${piece.id}:${key} overlaps`).toBe(false);
          occupiedCellKeys.add(key);
        }
      }
      if (level.metadata.difficulty === "hard") {
        const playableCellCount = level.rows * level.cols - level.blockers.length;
        expect(analysis.initialEscapableRatio, level.metadata.id).toBeLessThanOrEqual(playableCellCount >= 400 ? 0.9 : 0.85);
        expect(occupiedCellKeys.size, level.metadata.id).toBeGreaterThanOrEqual(level.metadata.daily ? 200 : Math.max(140, Math.floor(playableCellCount * 0.38)));
        expect(occupiedCellKeys.size / playableCellCount, level.metadata.id).toBeGreaterThanOrEqual(playableCellCount >= 400 ? 0.38 : 0.62);
        expect(level.pieces.filter((piece) => countArrowBends(piece.cells ?? [piece.start]) >= 2).length / level.pieces.length, level.metadata.id).toBeGreaterThanOrEqual(0.65);
      }
      expect(solveArrowLevelForTest(level), level.metadata.id).toMatchObject({
        escapedPieceIds: expect.arrayContaining(level.pieces.map((piece) => piece.id)),
      });
    }
  }, 60_000);

  it("validates Wordle guesses by length, dictionary, and answer match", () => {
    const level = wordleLevels[0];

    expect(
      validateWordleState(level, {
        startedAtMs: 0,
        elapsedMs: 8,
        hintsUsed: 0,
        guesses: ["laser", "cider", "cocoa"],
      }),
    ).toMatchObject({ isComplete: true, errors: [] });

    expect(
      validateWordleState(level, {
        startedAtMs: 0,
        elapsedMs: 8,
        hintsUsed: 0,
        guesses: ["laser", "zzzzz"],
      }).errors,
    ).toContain("Guess 2 is not in the allowed word list.");

    for (const word of ["about", "pasta", "sushi", "fjord", "emoji"]) {
      expect(level.allowedWords, word).toContain(word);
      expect(
        validateWordleState(level, {
          startedAtMs: 0,
          elapsedMs: 8,
          hintsUsed: 0,
          guesses: [word],
        }).errors,
        word,
      ).not.toContain("Guess 1 is not in the allowed word list.");
    }
  });

  it("ships a stored Wordle bank with daily and sequential levels", () => {
    const levelIds = wordleLevels.map((level) => level.metadata.id);
    const dailyLevels = wordleLevels.filter((level) => level.metadata.daily);
    const numberedLevels = wordleLevels.filter((level) => !level.metadata.daily);

    expect(wordleLevels.length).toBeGreaterThanOrEqual(100);
    expect(new Set(levelIds).size).toBe(levelIds.length);
    expect(wordleLevels[0].metadata.date).toBe("2026-05-22");
    expect(dailyLevels.length).toBeGreaterThanOrEqual(7);
    expect(numberedLevels[0].metadata.id).toBe("wordle-level-001");
    expect(wordleLevels[0].allowedWords.length).toBeGreaterThanOrEqual(16_000);

    for (const level of wordleLevels) {
      expect(level.answer, level.metadata.id).toMatch(/^[a-z]{5}$/);
      expect(level.allowedWords, level.metadata.id).toContain(level.answer);
      expect(level.maxGuesses, level.metadata.id).toBe(6);
      expect(
        validateWordleState(level, {
          startedAtMs: 0,
          elapsedMs: 1,
          hintsUsed: 0,
          guesses: [level.answer],
        }),
        level.metadata.id,
      ).toMatchObject({ isComplete: true, errors: [] });
    }
  });

});

function solveArrowLevelForTest(level: (typeof arrowEscapeLevels)[number]): ArrowEscapeState {
  const state: ArrowEscapeState = {
    startedAtMs: 0,
    elapsedMs: 1,
    hintsUsed: 0,
    status: "playing",
    piecePositions: Object.fromEntries(level.pieces.map((piece) => [piece.id, piece.start])),
    escapedPieceIds: [],
  };

  for (const pieceId of level.solutionOrder ?? []) {
    const piece = level.pieces.find((item) => item.id === pieceId);
    expect(piece, level.metadata.id).toBeDefined();
    expect(canArrowPieceEscape(level, piece!, state.piecePositions, state.escapedPieceIds), `${level.metadata.id}:${pieceId}`).toBe(true);
    delete state.piecePositions[pieceId];
    state.escapedPieceIds.push(pieceId);
  }

  return state;
}

function isArrowHeadAwayFromExitEdge(rows: number, cols: number, piece: (typeof arrowEscapeLevels)[number]["pieces"][number]) {
  const [row, col] = piece.start;
  if (piece.direction === "up") return row > 0;
  if (piece.direction === "right") return col < cols - 1;
  if (piece.direction === "down") return row < rows - 1;
  return col > 0;
}

function isArrowHeadSegmentAligned(piece: (typeof arrowEscapeLevels)[number]["pieces"][number]) {
  const cells = piece.cells ?? [piece.start];
  const head = cells[0];
  const behind = cells[1];

  if (piece.direction === "up") return behind[0] === head[0] + 1 && behind[1] === head[1];
  if (piece.direction === "right") return behind[0] === head[0] && behind[1] === head[1] - 1;
  if (piece.direction === "down") return behind[0] === head[0] - 1 && behind[1] === head[1];
  return behind[0] === head[0] && behind[1] === head[1] + 1;
}

function isArrowHeadLineClearOfSelf(level: (typeof arrowEscapeLevels)[number], piece: (typeof arrowEscapeLevels)[number]["pieces"][number]) {
  const bodyCells = new Set((piece.cells ?? [piece.start]).slice(1).map(cellKeyForTest));
  return cellsToArrowExit(piece.start, piece.direction, level.rows, level.cols).every((cell) => !bodyCells.has(cellKeyForTest(cell)));
}

function cellsToArrowExit([row, col]: readonly [number, number], direction: string, rows: number, cols: number) {
  const cells: Array<readonly [number, number]> = [];
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

function countArrowBends(cells: readonly (readonly [number, number])[]) {
  let bends = 0;
  for (let index = 2; index < cells.length; index += 1) {
    const previous = directionBetweenCells(cells[index - 2], cells[index - 1]);
    const current = directionBetweenCells(cells[index - 1], cells[index]);
    if (previous && current && previous !== current) bends += 1;
  }
  return bends;
}

function directionBetweenCells(from: readonly [number, number], to: readonly [number, number]) {
  if (to[0] === from[0] - 1 && to[1] === from[1]) return "up";
  if (to[0] === from[0] + 1 && to[1] === from[1]) return "down";
  if (to[0] === from[0] && to[1] === from[1] + 1) return "right";
  if (to[0] === from[0] && to[1] === from[1] - 1) return "left";
  return null;
}

function cellKeyForTest(cell: readonly [number, number]) {
  return cell.join(",");
}

function isInsideArrowBoard(rows: number, cols: number, [row, col]: readonly [number, number]) {
  return row >= 0 && col >= 0 && row < rows && col < cols;
}

function areAdjacentCells(left: readonly [number, number], right: readonly [number, number]) {
  return Math.abs(left[0] - right[0]) + Math.abs(left[1] - right[1]) === 1;
}
