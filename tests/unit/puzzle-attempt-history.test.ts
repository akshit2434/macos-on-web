import { afterEach, describe, expect, it } from "vitest";

import {
  appendPuzzleAttemptHistory,
  loadPuzzleAttemptsForType,
  type LocalPuzzleAttempt,
} from "@/features/apps/puzzles/puzzle-attempt-history";

function attempt(index: number): LocalPuzzleAttempt {
  return {
    id: `arrow-${index}`,
    puzzleType: "arrow-escape",
    levelId: `arrow-escape-level-${String(index).padStart(3, "0")}`,
    completedAt: new Date(Date.UTC(2026, 4, 22, 9, index % 60)).toISOString(),
    duration: 1000,
    moves: 10,
    hintsUsed: 0,
    resets: 0,
    result: "completed",
  };
}

describe("puzzle attempt history", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("retains enough local attempts for 400 sequential levels", () => {
    for (let index = 1; index <= 450; index += 1) {
      appendPuzzleAttemptHistory(attempt(index));
    }

    const attempts = loadPuzzleAttemptsForType("arrow-escape");

    expect(attempts).toHaveLength(450);
    expect(attempts.some((item) => item.levelId === "arrow-escape-level-001")).toBe(true);
    expect(attempts.some((item) => item.levelId === "arrow-escape-level-400")).toBe(true);
  });
});
