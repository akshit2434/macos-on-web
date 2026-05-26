import { describe, expect, it } from "vitest";

import { wordleLevels } from "@/content/puzzles";
import type { LocalPuzzleAttempt } from "@/features/apps/puzzles/puzzle-attempt-history";
import { buildWordleHubProgress } from "@/features/apps/puzzles/wordle-progress";

function attempt(levelId: string, completedAt: string): LocalPuzzleAttempt {
  return {
    id: `${levelId}-${completedAt}`,
    puzzleType: "wordle",
    levelId,
    completedAt,
    duration: 1000,
    moves: 4,
    hintsUsed: 0,
    resets: 0,
    result: "completed",
  };
}

describe("Wordle hub progress", () => {
  it("exposes only today's daily challenge and unlocks levels in sequence", () => {
    const progress = buildWordleHubProgress({
      levels: wordleLevels,
      attempts: [attempt("wordle-level-002", "2026-05-22T10:00:00.000Z")],
      today: new Date("2026-05-22T12:00:00.000Z"),
    });

    expect(progress.dailyLevel?.metadata.date).toBe("2026-05-22");
    expect(progress.levelStates[0]).toMatchObject({ locked: false, completed: false });
    expect(progress.levelStates[1]).toMatchObject({ locked: true, completed: true });
  });

  it("tracks current and max daily streaks", () => {
    const progress = buildWordleHubProgress({
      levels: wordleLevels,
      attempts: [
        attempt("wordle-daily-001", "2026-05-22T10:00:00.000Z"),
        attempt("wordle-daily-002", "2026-05-23T10:00:00.000Z"),
        attempt("wordle-daily-003", "2026-05-24T10:00:00.000Z"),
      ],
      today: new Date("2026-05-24T12:00:00.000Z"),
    });

    expect(progress.currentStreak).toBe(3);
    expect(progress.maxStreak).toBe(3);
  });

  it("counts the first completed level as day one of a live streak", () => {
    const progress = buildWordleHubProgress({
      levels: wordleLevels,
      attempts: [attempt("wordle-level-001", "2026-05-22T10:00:00.000Z")],
      today: new Date("2026-05-22T12:00:00.000Z"),
    });

    expect(progress.currentStreak).toBe(1);
    expect(progress.maxStreak).toBe(1);
  });
});
