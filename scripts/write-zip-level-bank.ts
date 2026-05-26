import { writeFileSync } from "node:fs";

import { createZipLevelBank } from "../src/content/puzzles/zip-level-generator";

const todaySource = createZipLevelBank({ count: 8, dailyCount: 8 })[7];
const today = {
  ...todaySource,
  metadata: {
    ...todaySource.metadata,
    id: "zip-daily-001",
    title: "Today",
    daily: true,
    date: "2026-05-22",
    estimatedMinutes: 7,
    tags: ["path", "daily", "hard", "walls"],
  },
};
const levels = [today, ...createZipLevelBank({ count: 407 })];
const encodeCell = ([row, col]: readonly [number, number]) => `${row}${col}`;
const encodeCells = (cells: readonly (readonly [number, number])[] = []) => cells.map(encodeCell).join("");
const encodeWalls = (walls: readonly (readonly [readonly [number, number], readonly [number, number]])[] = []) =>
  walls.map(([from, to]) => `${encodeCell(from)}${encodeCell(to)}`).join("");

const rawLevels = levels.map((level) => [
  level.metadata.id,
  level.metadata.title,
  level.metadata.difficulty,
  level.metadata.daily ? 1 : 0,
  level.metadata.date ?? "",
  level.rows,
  level.cols,
  encodeCells(level.checkpoints),
  encodeCells(level.blocked),
  encodeWalls(level.walls),
  encodeCells(level.solutionPath),
]);

const output = `import type { Cell, ZipLevel } from "@/features/puzzles/types";

type RawZipLevel = readonly [
  id: string,
  title: string,
  difficulty: "easy" | "medium" | "hard",
  daily: 0 | 1,
  date: string,
  rows: number,
  cols: number,
  checkpoints: string,
  blocked: string,
  walls: string,
  solutionPath: string,
];

const rawZipLevels: RawZipLevel[] = ${JSON.stringify(rawLevels, null, 2)};

export const zipLevels: ZipLevel[] = rawZipLevels.map(([id, title, difficulty, daily, date, rows, cols, checkpoints, blocked, walls, solutionPath]) => ({
  metadata: {
    id,
    kind: "zip",
    title,
    difficulty,
    daily: Boolean(daily),
    date: date || undefined,
    estimatedMinutes: id === "zip-daily-001" ? 7 : daily ? 5 : difficulty === "medium" ? 4 : 3,
    tags: id === "zip-daily-001" ? ["path", "daily", "hard", "walls"] : daily ? ["path", "daily", "hard"] : ["path", "logic"],
  },
  rows,
  cols,
  checkpoints: decodeCells(checkpoints),
  blocked: decodeCells(blocked),
  walls: decodeWalls(walls),
  solutionPath: decodeCells(solutionPath),
}));

function decodeCells(encoded: string): Cell[] {
  return encoded.match(/.{1,2}/g)?.map((cell) => [Number(cell[0]), Number(cell[1])] as const) ?? [];
}

function decodeWalls(encoded: string): Array<readonly [Cell, Cell]> {
  return encoded.match(/.{1,4}/g)?.map((wall) => [[Number(wall[0]), Number(wall[1])], [Number(wall[2]), Number(wall[3])]] as const) ?? [];
}
`;

writeFileSync("src/content/puzzles/zip-levels.ts", output);
console.log(`Wrote ${levels.length} Zip levels (${output.length} bytes).`);
