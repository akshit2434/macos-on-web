import { describe, expect, it } from "vitest";

import { arrowEscapeLevels } from "@/content/puzzles";
import { buildArrowHubProgress } from "@/features/apps/puzzles/arrow-progress";
import type { LocalPuzzleAttempt } from "@/features/apps/puzzles/puzzle-attempt-history";

function attempt(puzzleType: string, levelId: string, completedAt: string): LocalPuzzleAttempt {
  return {
    id: `${puzzleType}-${levelId}-${completedAt}`,
    puzzleType,
    levelId,
    completedAt,
    duration: 1000,
    moves: 10,
    hintsUsed: 0,
    resets: 0,
    result: "completed",
  };
}

describe("arrow progress", () => {
  it("uses only today's daily and unlocks levels sequentially", () => {
    const progress = buildArrowHubProgress({
      levels: arrowEscapeLevels,
      attempts: [attempt("arrow-escape", "arrow-escape-level-001", "2026-05-22T09:00:00.000Z")],
      today: new Date("2026-05-22T12:00:00.000Z"),
    });

    expect(progress.dailyLevel?.metadata.id).toBe("arrow-escape-daily-001");
    expect(progress.levelStates.slice(0, 3).map((level) => level.locked)).toEqual([false, false, true]);
  });

  it("does not unlock levels from out-of-sequence completions", () => {
    const progress = buildArrowHubProgress({
      levels: arrowEscapeLevels,
      attempts: [attempt("arrow-escape", "arrow-escape-level-004", "2026-05-22T09:00:00.000Z")],
      today: new Date("2026-05-22T12:00:00.000Z"),
    });

    expect(progress.levelStates.slice(0, 4).map((level) => level.locked)).toEqual([false, true, true, true]);
  });

  it("counts arrow and arrow-escape attempts as the same game for streaks and completion", () => {
    const progress = buildArrowHubProgress({
      levels: arrowEscapeLevels,
      attempts: [
        attempt("arrow", "arrow-escape-level-001", "2026-05-20T09:00:00.000Z"),
        attempt("arrow", "arrow-escape-daily-003", "2026-05-20T09:00:00.000Z"),
        attempt("arrow-escape", "arrow-escape-daily-002", "2026-05-21T09:00:00.000Z"),
        attempt("arrow-escape", "arrow-escape-daily-001", "2026-05-22T09:00:00.000Z"),
      ],
      today: new Date("2026-05-22T12:00:00.000Z"),
    });

    expect(progress.levelStates.slice(0, 3).map(({ locked, completed }) => ({ locked, completed }))).toEqual([
      { locked: false, completed: true },
      { locked: false, completed: false },
      { locked: true, completed: false },
    ]);
    expect(progress.currentStreak).toBe(3);
    expect(progress.maxStreak).toBe(3);
  });

  it("counts the first completed level as day one of a live streak", () => {
    const progress = buildArrowHubProgress({
      levels: arrowEscapeLevels,
      attempts: [attempt("arrow-escape", "arrow-escape-level-001", "2026-05-22T09:00:00.000Z")],
      today: new Date("2026-05-22T12:00:00.000Z"),
    });

    expect(progress.currentStreak).toBe(1);
    expect(progress.maxStreak).toBe(1);
  });
});
