import type { TimerFriendlyState } from "@/features/puzzles";

const storageKey = "macos-web-puzzle-session-states-v1";

type StoredPuzzleStates = Record<string, Record<string, TimerFriendlyState>>;

export function restartTimerFriendlyState<TState extends TimerFriendlyState>(
  createFreshState: (startedAtMs: number) => TState,
  currentState: TState,
  now = Date.now(),
): TState {
  const elapsedMs = currentState.elapsedMs;
  const shouldRun = currentState.status === "playing" || elapsedMs > 0;
  const freshState = createFreshState(shouldRun ? now - elapsedMs : now);

  return {
    ...freshState,
    elapsedMs,
    hintsUsed: currentState.hintsUsed,
    status: shouldRun ? "playing" : "idle",
  };
}

export function resumeTimerFriendlyState<TState extends TimerFriendlyState>(state: TState, now = Date.now()): TState {
  if (state.status === "complete" || state.status === "failed" || state.status !== "playing") {
    return state;
  }

  return {
    ...state,
    startedAtMs: now - state.elapsedMs,
  };
}

export function loadPuzzleSessionStates<TState extends TimerFriendlyState>(appId: string): Record<string, TState> {
  if (typeof window === "undefined") return {};

  const stored = loadStoredPuzzleStates();
  return (stored[appId] ?? {}) as Record<string, TState>;
}

export function savePuzzleSessionState<TState extends TimerFriendlyState>(appId: string, levelId: string, state: TState) {
  if (typeof window === "undefined") return;

  const stored = loadStoredPuzzleStates();
  stored[appId] = { ...(stored[appId] ?? {}), [levelId]: state };
  window.localStorage.setItem(storageKey, JSON.stringify(stored));
}

export function clearPuzzleSessionState(appId: string, levelId: string) {
  if (typeof window === "undefined") return;

  const stored = loadStoredPuzzleStates();
  const nextAppStates = { ...(stored[appId] ?? {}) };
  delete nextAppStates[levelId];
  stored[appId] = nextAppStates;
  window.localStorage.setItem(storageKey, JSON.stringify(stored));
}

function loadStoredPuzzleStates(): StoredPuzzleStates {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as StoredPuzzleStates) : {};
  } catch {
    return {};
  }
}
