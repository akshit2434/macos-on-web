import type { ArrowEscapeLevel } from "@/features/puzzles";
import type { LocalPuzzleAttempt } from "./puzzle-attempt-history";

const arrowPuzzleTypes = new Set(["arrow", "arrow-escape"]);

export type ArrowLevelState = {
  level: ArrowEscapeLevel;
  locked: boolean;
  completed: boolean;
};

export type ArrowHubProgress = {
  dailyLevel: ArrowEscapeLevel | null;
  levels: ArrowEscapeLevel[];
  levelStates: ArrowLevelState[];
  currentStreak: number;
  maxStreak: number;
};

export function buildArrowHubProgress({
  levels,
  attempts,
  today = new Date(),
}: {
  levels: ArrowEscapeLevel[];
  attempts: LocalPuzzleAttempt[];
  today?: Date;
}): ArrowHubProgress {
  const todayKey = toDayKey(today);
  const dailyLevel = levels.find((level) => level.metadata.daily && level.metadata.date === todayKey) ?? null;
  const numberedLevels = levels.filter((level) => !level.metadata.daily);
  const completedLevelIds = new Set(attempts.filter(isArrowAttempt).map((attempt) => attempt.levelId));
  const contiguousCompletedLevelCount = countContiguousCompletions(numberedLevels, completedLevelIds);

  return {
    dailyLevel,
    levels: numberedLevels,
    levelStates: numberedLevels.map((level, index) => ({
      level,
      locked: index > contiguousCompletedLevelCount,
      completed: completedLevelIds.has(level.metadata.id),
    })),
    currentStreak: computeCurrentDailyStreak(attempts, today),
    maxStreak: computeMaxDailyStreak(attempts),
  };
}

function countContiguousCompletions(levels: ArrowEscapeLevel[], completedLevelIds: Set<string>) {
  let count = 0;

  for (const level of levels) {
    if (!completedLevelIds.has(level.metadata.id)) {
      break;
    }
    count += 1;
  }

  return count;
}

function computeCurrentDailyStreak(attempts: LocalPuzzleAttempt[], today: Date) {
  const completedDays = completionDays(attempts);
  let streak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  while (completedDays.has(toDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function computeMaxDailyStreak(attempts: LocalPuzzleAttempt[]) {
  const days = [...completionDays(attempts)].sort();
  let max = 0;
  let current = 0;
  let previous: Date | null = null;

  for (const day of days) {
    const date = parseDayKey(day);
    current = previous && differenceInDays(previous, date) === 1 ? current + 1 : 1;
    max = Math.max(max, current);
    previous = date;
  }

  return max;
}

function completionDays(attempts: LocalPuzzleAttempt[]) {
  return new Set(
    attempts
      .filter(isArrowAttempt)
      .map((attempt) => toDayKey(new Date(attempt.completedAt))),
  );
}

function isArrowAttempt(attempt: LocalPuzzleAttempt) {
  return arrowPuzzleTypes.has(attempt.puzzleType);
}

function parseDayKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function differenceInDays(left: Date, right: Date) {
  return Math.round((right.getTime() - left.getTime()) / 86_400_000);
}

function toDayKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
