export type LocalPuzzleAttempt = {
  id: string;
  puzzleType: string;
  levelId: string;
  completedAt: string;
  duration: number;
  moves: number;
  hintsUsed: number;
  resets: number;
  result: "completed";
};

const storageKey = "macos-web.puzzle-attempt-history.v1";
const localAttemptRetentionLimit = 5_000;

export function loadPuzzleAttemptHistory(levelId: string) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    const attempts = stored ? (JSON.parse(stored) as LocalPuzzleAttempt[]) : [];
    return attempts
      .filter((attempt) => attempt.levelId === levelId)
      .sort((left, right) => Date.parse(right.completedAt) - Date.parse(left.completedAt));
  } catch {
    return [];
  }
}

export function appendPuzzleAttemptHistory(attempt: LocalPuzzleAttempt) {
  if (typeof window === "undefined") {
    return [attempt];
  }

  const attempts = loadAllPuzzleAttemptHistory();
  const nextAttempts = [attempt, ...attempts.filter((item) => item.id !== attempt.id)].slice(0, localAttemptRetentionLimit);
  window.localStorage.setItem(storageKey, JSON.stringify(nextAttempts));
  return nextAttempts.filter((item) => item.levelId === attempt.levelId);
}

function loadAllPuzzleAttemptHistory() {
  try {
    const stored = window.localStorage.getItem(storageKey);
    const attempts = stored ? (JSON.parse(stored) as LocalPuzzleAttempt[]) : [];
    return attempts.filter((attempt) => attempt.id && attempt.levelId);
  } catch {
    return [];
  }
}

export function loadPuzzleAttemptsForType(puzzleType: string | string[]) {
  if (typeof window === "undefined") {
    return [];
  }

  const puzzleTypes = new Set(Array.isArray(puzzleType) ? puzzleType : [puzzleType]);

  return loadAllPuzzleAttemptHistory()
    .filter((attempt) => puzzleTypes.has(attempt.puzzleType))
    .sort((left, right) => Date.parse(right.completedAt) - Date.parse(left.completedAt));
}
