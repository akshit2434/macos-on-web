import { describe, expect, it } from "vitest";

import { applyZipCellToPath } from "@/features/puzzles/zip-path";
import type { Cell } from "@/features/puzzles";

describe("applyZipCellToPath", () => {
  it("starts only on the first checkpoint", () => {
    const checkpoints: Cell[] = [[0, 0], [4, 4]];

    expect(applyZipCellToPath([], [0, 1], checkpoints)).toEqual([]);
    expect(applyZipCellToPath([], [0, 0], checkpoints)).toEqual([[0, 0]]);
  });

  it("extends through adjacent cells and rejects jumps", () => {
    const checkpoints: Cell[] = [[0, 0], [4, 4]];
    const path: Cell[] = [[0, 0], [0, 1]];

    expect(applyZipCellToPath(path, [0, 2], checkpoints)).toEqual([[0, 0], [0, 1], [0, 2]]);
    expect(applyZipCellToPath(path, [2, 2], checkpoints)).toEqual(path);
  });

  it("rejects moves through walls", () => {
    const checkpoints: Cell[] = [[0, 0], [4, 4]];
    const path: Cell[] = [[0, 0]];
    const walls: Array<readonly [Cell, Cell]> = [[[0, 0], [0, 1]]];

    expect(applyZipCellToPath(path, [0, 1], checkpoints, walls)).toEqual(path);
  });

  it("dragging back to an existing cell erases the tail", () => {
    const checkpoints: Cell[] = [[0, 0], [4, 4]];
    const path: Cell[] = [[0, 0], [0, 1], [0, 2], [1, 2]];

    expect(applyZipCellToPath(path, [0, 1], checkpoints)).toEqual([[0, 0], [0, 1]]);
  });
});
