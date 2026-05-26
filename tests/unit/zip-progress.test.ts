import { describe, expect, it } from "vitest";

import { zipLevels } from "@/content/puzzles";
import { buildZipHubProgress } from "@/features/apps/puzzles/zip-progress";
import type { LocalPuzzleAttempt } from "@/features/apps/puzzles/puzzle-attempt-history";

function attempt(levelId: string, completedAt: string): LocalPuzzleAttempt {
  return {
    id: `${levelId}-${completedAt}`,
    puzzleType: "zip",
    levelId,
    completedAt,
    duration: 1000,
    moves: 10,
    hintsUsed: 0,
    resets: 0,
    result: "completed",
  };
}

describe("zip progress", () => {
  it("exposes only today's daily challenge and sequential level unlocks", () => {
    const progress = buildZipHubProgress({
      levels: zipLevels,
      attempts: [attempt("zip-level-001", "2026-05-22T09:00:00.000Z")],
      today: new Date("2026-05-22T12:00:00.000Z"),
    });

    expect(progress.dailyLevel?.metadata.id).toBe("zip-daily-001");
    expect(progress.levels[0].metadata.id).toBe("zip-level-001");
    expect(progress.levelStates.slice(0, 3).map((level) => level.locked)).toEqual([false, false, true]);
  });

  it("does not unlock ahead from out-of-sequence completions", () => {
    const progress = buildZipHubProgress({
      levels: zipLevels,
      attempts: [attempt("zip-level-004", "2026-05-22T09:00:00.000Z")],
      today: new Date("2026-05-22T12:00:00.000Z"),
    });

    expect(progress.levelStates.slice(0, 4).map((level) => level.locked)).toEqual([false, true, true, true]);
  });

  it("computes current and max daily streaks", () => {
    const progress = buildZipHubProgress({
      levels: zipLevels,
      attempts: [
        attempt("zip-daily-001", "2026-05-22T09:00:00.000Z"),
        attempt("zip-daily-002", "2026-05-23T09:00:00.000Z"),
        attempt("zip-daily-003", "2026-05-24T09:00:00.000Z"),
        attempt("zip-daily-005", "2026-05-26T09:00:00.000Z"),
      ],
      today: new Date("2026-05-24T12:00:00.000Z"),
    });

    expect(progress.currentStreak).toBe(3);
    expect(progress.maxStreak).toBe(3);
  });

  it("counts the first completed level as day one of a live streak", () => {
    const progress = buildZipHubProgress({
      levels: zipLevels,
      attempts: [attempt("zip-level-001", "2026-05-22T09:00:00.000Z")],
      today: new Date("2026-05-22T12:00:00.000Z"),
    });

    expect(progress.currentStreak).toBe(1);
    expect(progress.maxStreak).toBe(1);
  });
});
