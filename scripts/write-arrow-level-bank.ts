import { writeFileSync } from "node:fs";

import { createArrowEscapeLevelBank } from "../src/content/puzzles/arrow-escape-generator";

const levels = createArrowEscapeLevelBank({
  count: 407,
  onLevelGenerated: (progress) => {
    const levelNumber = String(progress.index + 1).padStart(3, "0");
    console.log(
      [
        `[arrow-gen ${levelNumber}]`,
        progress.id,
        progress.tier,
        progress.source,
        `${progress.rows}x${progress.cols}`,
        `${progress.playableCells} cells`,
        `${progress.pieceCount} pieces`,
        `longest ${progress.longestArrow}`,
      ].join(" "),
    );
  },
});
const directionCodes = { up: "U", right: "R", down: "D", left: "L" } as const;
const encodeCoordinate = (value: number) => value.toString(36).padStart(2, "0");
const encodeCell = ([row, col]: readonly [number, number]) => `${encodeCoordinate(row)}${encodeCoordinate(col)}`;
const encodeCells = (cells: Array<readonly [number, number]>) => cells.map(encodeCell).join("");

const rawLevels = levels.map((level) => [
  level.metadata.id,
  level.metadata.title,
  level.metadata.difficulty,
  level.metadata.daily ? 1 : 0,
  level.metadata.date ?? "",
  level.rows,
  level.cols,
  encodeCells(level.blockers),
  level.pieces
    .map((piece) => `${directionCodes[piece.direction]}${encodeCells(piece.cells ?? [piece.start])}`)
    .join("|"),
]);

const output = `import type { ArrowEscapeLevel, Direction } from "@/features/puzzles/types";

type RawArrowLevel = readonly [
  id: string,
  title: string,
  difficulty: "easy" | "medium" | "hard",
  daily: 0 | 1,
  date: string,
  rows: number,
  cols: number,
  blockers: string,
  pieces: string,
];

const directionByCode: Record<string, Direction> = { U: "up", R: "right", D: "down", L: "left" };

const rawArrowLevels: RawArrowLevel[] = ${JSON.stringify(rawLevels, null, 2)};

const decodeCells = (encodedCells: string) =>
  encodedCells
    ? encodedCells
        .match(/.{1,4}/g)!
        .map((cell) => [Number.parseInt(cell.slice(0, 2), 36), Number.parseInt(cell.slice(2, 4), 36)] as const)
    : [];

export const arrowEscapeLevels: ArrowEscapeLevel[] = rawArrowLevels.map(([id, title, difficulty, daily, date, rows, cols, encodedBlockers, encodedPieces]) => ({
  metadata: {
    id,
    kind: "arrow-escape",
    title,
    difficulty,
    daily: Boolean(daily),
    date: date || undefined,
    estimatedMinutes: daily ? 5 : difficulty === "medium" ? 4 : 3,
    tags: daily ? ["logic", "routing", "daily"] : ["logic", "routing"],
  },
  rows,
  cols,
  blockers: decodeCells(encodedBlockers),
  pieces: encodedPieces.split("|").map((encodedPiece, index) => {
    const direction = directionByCode[encodedPiece[0]];
    const cells = decodeCells(encodedPiece.slice(1));

    return {
      id: \`p\${String(index + 1).padStart(2, "0")}\`,
      start: cells[0],
      direction,
      cells,
    };
  }),
  solutionOrder: encodedPieces.split("|").map((_, index) => \`p\${String(index + 1).padStart(2, "0")}\`),
}));
`;

writeFileSync("src/content/puzzles/arrow-levels.ts", output);
console.log(`Wrote ${levels.length} Arrow levels (${output.length} bytes).`);
