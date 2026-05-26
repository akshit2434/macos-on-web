import type { Cell, PuzzleDifficulty, ZipLevel } from "@/features/puzzles/types";

type ZipGeneratorOptions = {
  count: number;
  dailyCount?: number;
};

export type ZipLevelAnalysis = {
  blockedCells: number;
  usableCells: number;
  turns: number;
  longestStraightRun: number;
  wallCount: number;
  wallClusterCount: number;
  checkpointSpacingIsPlayable: boolean;
};

export function createZipLevelBank({ count, dailyCount = 7 }: ZipGeneratorOptions): ZipLevel[] {
  return Array.from({ length: count }, (_, index) => {
    const hardDaily = index < dailyCount;
    const levelNumber = index - dailyCount + 1;
    const shape = selectShape(index, hardDaily);
    const generated = createRandomizedZipPath(shape.rows, shape.cols, index + 17, hardDaily);
    const solutionPath = shape.reverse ? [...generated.path].reverse() : generated.path;
    const blocked = generated.blocked;
    const walls = createWallClusters(shape.rows, shape.cols, solutionPath, blocked, index + 37, hardDaily ? 3 : 2);
    const checkpointCount = hardDaily ? 10 + (index % 3) : 6 + (index % 3) + (index % 10 === 0 ? 1 : 0);
    const checkpoints = pickCheckpoints(solutionPath, checkpointCount);
    const difficulty: PuzzleDifficulty = hardDaily ? "hard" : solutionPath.length >= 34 || checkpointCount >= 5 ? "medium" : "easy";

    return {
      metadata: {
        id: hardDaily ? `zip-daily-${String(index + 2).padStart(3, "0")}` : `zip-level-${String(levelNumber).padStart(3, "0")}`,
        kind: "zip",
        title: hardDaily ? `Daily Circuit ${index + 1}` : `Loop ${levelNumber}`,
        difficulty,
        daily: hardDaily,
        date: hardDaily ? dailyDate(index + 2) : undefined,
        estimatedMinutes: hardDaily ? 6 : difficulty === "medium" ? 4 : 3,
        tags: hardDaily ? ["path", "daily", "hard"] : ["path", "logic"],
      },
      rows: shape.rows,
      cols: shape.cols,
      blocked,
      walls,
      checkpoints,
      solutionPath,
    };
  });
}

export function analyzeZipLevel(level: ZipLevel): ZipLevelAnalysis {
  const blockedCells = new Set((level.blocked ?? []).map(cellKey)).size;
  const usableCells = level.rows * level.cols - blockedCells;
  const path = level.solutionPath ?? [];
  const checkpointIndexes = level.checkpoints.map((checkpoint) => path.findIndex((cell) => sameCell(cell, checkpoint)));
  const checkpointSpacingIsPlayable =
    checkpointIndexes.every((index) => index >= 0) &&
    checkpointIndexes.every((index, position) => position === 0 || index - checkpointIndexes[position - 1] >= 3);

  return {
    blockedCells,
    usableCells,
    turns: countTurns(path),
    longestStraightRun: countLongestStraightRun(path),
    wallCount: level.walls?.length ?? 0,
    wallClusterCount: countWallClusters(level.walls ?? []),
    checkpointSpacingIsPlayable,
  };
}

function selectShape(index: number, hardDaily: boolean) {
  const hardShapes = [
    { rows: 9, cols: 9 },
    { rows: 8, cols: 9 },
    { rows: 9, cols: 8 },
    { rows: 8, cols: 8 },
  ];
  const levelShapes = [
    { rows: 6, cols: 6 },
    { rows: 6, cols: 7 },
    { rows: 7, cols: 6 },
    { rows: 7, cols: 7 },
    { rows: 7, cols: 8 },
    { rows: 8, cols: 7 },
  ];
  const base = hardDaily ? hardShapes[index % hardShapes.length] : levelShapes[index % levelShapes.length];

  return {
    ...base,
    reverse: index % 5 === 0,
  };
}

function createRandomizedZipPath(rows: number, cols: number, seed: number, hard: boolean) {
  const targetCells = Math.max(hard ? 54 : 34, Math.floor(rows * cols * (hard ? 0.84 : 0.78)));
  const maxRun = hard ? 5 : 6;

  for (let attempt = 0; attempt < 90; attempt += 1) {
    const random = createRandom(seed + attempt * 997);
    const start: Cell = [Math.floor(random() * rows), Math.floor(random() * cols)];
    const path = [start];
    const visited = new Set([cellKey(start)]);

    if (extendPath({ rows, cols, path, visited, random, targetCells, maxRun })) {
      const blocked = allCells(rows, cols).filter((cell) => !visited.has(cellKey(cell)));
      if (countTurns(path) >= (hard ? 12 : 6) && countLongestStraightRun(path) <= maxRun + 1) {
        return { path, blocked };
      }
    }
  }

  return createFallbackMeanderPath(rows, cols, seed, targetCells, maxRun);
}

function extendPath({
  rows,
  cols,
  path,
  visited,
  random,
  targetCells,
  maxRun,
}: {
  rows: number;
  cols: number;
  path: Cell[];
  visited: Set<string>;
  random: () => number;
  targetCells: number;
  maxRun: number;
}): boolean {
  if (path.length >= targetCells) {
    return true;
  }

  const last = path[path.length - 1];
  const candidates = shuffled(neighbors(last, rows, cols), random)
    .filter((cell) => !visited.has(cellKey(cell)))
    .filter((cell) => countCurrentStraightRun([...path, cell]) <= maxRun)
    .sort((left, right) => onwardCount(left, rows, cols, visited) - onwardCount(right, rows, cols, visited));

  for (const candidate of candidates) {
    visited.add(cellKey(candidate));
    path.push(candidate);

    if (extendPath({ rows, cols, path, visited, random, targetCells, maxRun })) {
      return true;
    }

    path.pop();
    visited.delete(cellKey(candidate));
  }

  return false;
}

function createFallbackMeanderPath(rows: number, cols: number, seed: number, targetCells: number, maxRun: number) {
  const random = createRandom(seed);
  const cells = shuffled(allCells(rows, cols), random);
  let best: Cell[] = [];

  for (const start of cells.slice(0, 12)) {
    const path = [start];
    const visited = new Set([cellKey(start)]);

    for (let guard = 0; guard < rows * cols * 4 && path.length < targetCells; guard += 1) {
      const last = path[path.length - 1];
      const candidates = shuffled(neighbors(last, rows, cols), random)
        .filter((cell) => !visited.has(cellKey(cell)))
        .filter((cell) => countCurrentStraightRun([...path, cell]) <= maxRun);
      const next = candidates[0];
      if (!next) break;
      path.push(next);
      visited.add(cellKey(next));
    }

    if (path.length > best.length) {
      best = [...path];
    }
  }

  const visited = new Set(best.map(cellKey));
  return {
    path: best,
    blocked: allCells(rows, cols).filter((cell) => !visited.has(cellKey(cell))),
  };
}

function createWallClusters(rows: number, cols: number, path: Cell[], blocked: Cell[], seed: number, clusterTarget: number) {
  const random = createRandom(seed);
  const pathIndex = new Map(path.map((cell, index) => [cellKey(cell), index]));
  const blockedKeys = new Set(blocked.map(cellKey));
  const walls: Array<readonly [Cell, Cell]> = [];
  const wallKeys = new Set<string>();

  const candidates = shuffled(allCells(rows, cols), random).filter((cell) => !blockedKeys.has(cellKey(cell)));
  for (const anchor of candidates) {
    if (walls.length >= clusterTarget * 3) break;

    const cluster = neighbors(anchor, rows, cols)
      .filter((cell) => !blockedKeys.has(cellKey(cell)))
      .filter((cell) => !isConsecutivePathEdge(anchor, cell, pathIndex))
      .slice(0, 3);

    for (const cell of cluster) {
      const key = wallKey(anchor, cell);
      if (wallKeys.has(key)) continue;
      wallKeys.add(key);
      walls.push([anchor, cell]);
    }
  }

  return walls.slice(0, Math.max(2, clusterTarget * 2));
}

function pickCheckpoints(path: Cell[], count: number) {
  return Array.from({ length: count }, (_, index) => {
    const pathIndex = Math.round((index * (path.length - 1)) / (count - 1));
    return path[pathIndex];
  });
}

function dailyDate(index: number) {
  return `2026-05-${String(21 + index).padStart(2, "0")}`;
}

function countTurns(path: Cell[]) {
  let turns = 0;

  for (let index = 2; index < path.length; index += 1) {
    const previous = direction(path[index - 2], path[index - 1]);
    const current = direction(path[index - 1], path[index]);
    if (previous !== current) {
      turns += 1;
    }
  }

  return turns;
}

function countLongestStraightRun(path: Cell[]) {
  let longest = Math.min(path.length, 1);
  let current = 1;

  for (let index = 2; index < path.length; index += 1) {
    if (direction(path[index - 2], path[index - 1]) === direction(path[index - 1], path[index])) {
      current += 1;
    } else {
      longest = Math.max(longest, current + 1);
      current = 1;
    }
  }

  return Math.max(longest, current + 1);
}

function countCurrentStraightRun(path: Cell[]) {
  if (path.length < 3) return path.length;

  const latestDirection = direction(path[path.length - 2], path[path.length - 1]);
  let run = 2;

  for (let index = path.length - 3; index >= 0; index -= 1) {
    if (direction(path[index], path[index + 1]) !== latestDirection) break;
    run += 1;
  }

  return run;
}

function direction(left: Cell, right: Cell) {
  if (left[0] === right[0]) {
    return left[1] < right[1] ? "right" : "left";
  }
  return left[0] < right[0] ? "down" : "up";
}

function cellKey([row, col]: Cell) {
  return `${row},${col}`;
}

function sameCell(left: Cell, right: Cell) {
  return left[0] === right[0] && left[1] === right[1];
}

function allCells(rows: number, cols: number) {
  return Array.from({ length: rows * cols }, (_, index) => [Math.floor(index / cols), index % cols] as Cell);
}

function neighbors([row, col]: Cell, rows: number, cols: number) {
  const cells: Cell[] = [
    [row - 1, col],
    [row, col + 1],
    [row + 1, col],
    [row, col - 1],
  ];

  return cells.filter(([nextRow, nextCol]) => nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols);
}

function onwardCount(cell: Cell, rows: number, cols: number, visited: Set<string>) {
  return neighbors(cell, rows, cols).filter((neighbor) => !visited.has(cellKey(neighbor))).length;
}

function shuffled<T>(items: T[], random: () => number) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
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

function wallKey(left: Cell, right: Cell) {
  return [cellKey(left), cellKey(right)].sort().join("|");
}

function isConsecutivePathEdge(left: Cell, right: Cell, pathIndex: Map<string, number>) {
  const leftIndex = pathIndex.get(cellKey(left));
  const rightIndex = pathIndex.get(cellKey(right));
  return leftIndex !== undefined && rightIndex !== undefined && Math.abs(leftIndex - rightIndex) === 1;
}

function countWallClusters(walls: Array<readonly [Cell, Cell]>) {
  const remaining = new Set(walls.map(([left, right]) => wallKey(left, right)));
  let clusters = 0;

  for (const wall of walls) {
    const startKey = wallKey(wall[0], wall[1]);
    if (!remaining.has(startKey)) continue;

    clusters += 1;
    const queue = [wall];
    remaining.delete(startKey);

    while (queue.length) {
      const [left, right] = queue.shift()!;
      for (const candidate of walls) {
        const key = wallKey(candidate[0], candidate[1]);
        if (!remaining.has(key)) continue;
        if ([left, right].some((cell) => sameCell(cell, candidate[0]) || sameCell(cell, candidate[1]))) {
          remaining.delete(key);
          queue.push(candidate);
        }
      }
    }
  }

  return clusters;
}
