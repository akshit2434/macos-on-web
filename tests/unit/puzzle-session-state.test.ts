import { describe, expect, it } from "vitest";

import {
  clearPuzzleSessionState,
  loadPuzzleSessionStates,
  restartTimerFriendlyState,
  resumeTimerFriendlyState,
  savePuzzleSessionState,
} from "@/features/apps/puzzles/puzzle-session-state";
import { createWordleState, createZipState } from "@/features/puzzles";

describe("puzzle session state", () => {
  it("restarts a puzzle board without resetting the active timer", () => {
    const restarted = restartTimerFriendlyState(createZipState, {
      ...createZipState(1_000),
      elapsedMs: 4_000,
      status: "playing",
      path: [[0, 0]],
    }, 9_000);

    expect(restarted.path).toEqual([]);
    expect(restarted.elapsedMs).toBe(4_000);
    expect(restarted.startedAtMs).toBe(5_000);
    expect(restarted.status).toBe("playing");
  });

  it("resumes a running puzzle timer from stored elapsed time", () => {
    const resumed = resumeTimerFriendlyState({
      ...createWordleState(1_000),
      elapsedMs: 3_000,
      status: "playing",
      currentGuess: "fl",
    }, 10_000);

    expect(resumed.startedAtMs).toBe(7_000);
    expect(resumed.currentGuess).toBe("fl");
  });

  it("stores and clears in-progress puzzle states per app and level", () => {
    window.localStorage.clear();

    savePuzzleSessionState("wordle", "wordle-level-001", {
      ...createWordleState(1_000),
      elapsedMs: 2_000,
      status: "playing",
      currentGuess: "fl",
    });

    expect(loadPuzzleSessionStates("wordle")["wordle-level-001"]).toMatchObject({
      currentGuess: "fl",
      elapsedMs: 2_000,
    });

    clearPuzzleSessionState("wordle", "wordle-level-001");

    expect(loadPuzzleSessionStates("wordle")["wordle-level-001"]).toBeUndefined();
  });
});
