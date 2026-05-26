import { createArrowEscapeState } from "@/features/puzzles";
import type { ArrowEscapeLevel, ArrowEscapeState } from "@/features/puzzles/types";

export function restartArrowEscapeState(level: ArrowEscapeLevel, currentState: ArrowEscapeState, now = Date.now()): ArrowEscapeState {
  const freshState = createArrowEscapeState(level, now - currentState.elapsedMs);

  return {
    ...freshState,
    elapsedMs: currentState.elapsedMs,
    hintsUsed: currentState.hintsUsed,
    status: "playing",
  };
}

export function resumeArrowEscapeState(state: ArrowEscapeState, now = Date.now()): ArrowEscapeState {
  if (state.status === "complete") {
    return state;
  }

  return {
    ...state,
    startedAtMs: now - state.elapsedMs,
    status: state.status === "failed" ? "failed" : "playing",
  };
}
