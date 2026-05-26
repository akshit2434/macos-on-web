import { describe, expect, it } from "vitest";

import { arrowEscapeLevels } from "@/content/puzzles";
import { createArrowEscapeState } from "@/features/puzzles";
import { restartArrowEscapeState, resumeArrowEscapeState } from "@/features/apps/puzzles/arrow-session-state";

describe("arrow session state", () => {
  const level = arrowEscapeLevels.find((candidate) => !candidate.metadata.daily)!;

  it("restarts the board without restarting the timer", () => {
    const playedState = {
      ...createArrowEscapeState(level, 10_000),
      elapsedMs: 18_500,
      hintsUsed: 2,
      livesRemaining: 1,
      status: "failed" as const,
      piecePositions: Object.fromEntries(level.pieces.slice(2).map((piece) => [piece.id, piece.start])),
      escapedPieceIds: level.pieces.slice(0, 2).map((piece) => piece.id),
    };

    const restarted = restartArrowEscapeState(level, playedState, 40_000);

    expect(restarted.elapsedMs).toBe(18_500);
    expect(restarted.startedAtMs).toBe(21_500);
    expect(restarted.status).toBe("playing");
    expect(restarted.livesRemaining).toBe(3);
    expect(restarted.escapedPieceIds).toEqual([]);
    expect(Object.keys(restarted.piecePositions)).toHaveLength(level.pieces.length);
  });

  it("resumes a saved playing state from the same elapsed time", () => {
    const savedState = {
      ...createArrowEscapeState(level, 10_000),
      elapsedMs: 12_000,
      startedAtMs: 10_000,
      livesRemaining: 2,
    };

    const resumed = resumeArrowEscapeState(savedState, 50_000);

    expect(resumed.elapsedMs).toBe(12_000);
    expect(resumed.startedAtMs).toBe(38_000);
    expect(resumed.status).toBe("playing");
    expect(resumed.livesRemaining).toBe(2);
  });
});
