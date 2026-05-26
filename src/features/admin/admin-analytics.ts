export type AdminPuzzleAttemptRow = {
  session_id?: string | null;
  puzzle_type: string;
  level_id: string;
  completed_at: string | null;
  created_at: string;
  duration: number | null;
  moves: number | null;
  hints_used: number | null;
  resets: number | null;
  result: string;
  metadata: Record<string, unknown> | null;
};

export type AdminActivityEventRow = {
  session_id?: string | null;
  app_id: string | null;
  event_type: string;
  occurred_at: string;
  duration?: number | null;
  metadata?: Record<string, unknown> | null;
};

export type AdminSessionRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration: number | null;
  device_info: Record<string, unknown> | null;
  created_at: string;
};

export type AdminCapturedPhotoRow = {
  id: string;
  session_id: string | null;
  storage_path: string;
  album_id: string;
  captured_at: string;
  metadata: Record<string, unknown> | null;
  imageUrl?: string;
};

export type AdminMusicEventRow = {
  id: string;
  session_id: string | null;
  track_id: string;
  playlist_id: string | null;
  event_type: string;
  progress: number | null;
  duration: number | null;
  created_at: string;
};

export type AdminContentStateRow = {
  id: string;
  content_type: string;
  content_id: string;
  state: string;
  unlocked_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type AdminUnlockEventRow = {
  id: string;
  session_id: string | null;
  event_type: string;
  success: boolean;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
  imageUrl?: string;
};

export type AdminDashboardData = {
  mode: "cloud" | "local-only" | "error";
  sessions: AdminSessionRow[];
  attempts: AdminPuzzleAttemptRow[];
  events: AdminActivityEventRow[];
  captures: AdminCapturedPhotoRow[];
  music: AdminMusicEventRow[];
  contentState: AdminContentStateRow[];
  unlocks: AdminUnlockEventRow[];
  error?: string;
};

export type PuzzleAttemptSummary = {
  total: number;
  completed: number;
  daily: number;
  averageDuration: number;
  latestCompletedAt: string | null;
};

export type ActivitySummary = {
  total: number;
  appCounts: Array<{ appId: string; count: number }>;
  latestEventAt: string | null;
};

export type GameStat = {
  puzzleType: string;
  attempts: number;
  completed: number;
  daily: number;
  currentStreak: number;
  maxStreak: number;
  latestCompletedAt: string | null;
};

export type AdminSessionSummary = {
  id: string;
  startedAt: string;
  eventCount: number;
  puzzleCount: number;
  captureCount: number;
  musicCount: number;
  unlockCount: number;
};

export type AdminSessionActivityItem = {
  kind: "activity" | "capture" | "music" | "puzzle" | "unlock";
  occurredAt: string;
  title: string;
  detail: string;
};

export type AdminSessionActivityGroup = {
  id: string;
  startedAt: string;
  items: AdminSessionActivityItem[];
};

export function summarizePuzzleAttempts(attempts: AdminPuzzleAttemptRow[]): PuzzleAttemptSummary {
  const completedAttempts = attempts.filter((attempt) => attempt.result === "completed" || Boolean(attempt.completed_at));
  const durations = completedAttempts
    .map((attempt) => attempt.duration)
    .filter((duration): duration is number => typeof duration === "number" && Number.isFinite(duration) && duration > 0);

  return {
    total: attempts.length,
    completed: completedAttempts.length,
    daily: attempts.filter((attempt) => Boolean(attempt.metadata?.daily) || attempt.level_id.includes("daily")).length,
    averageDuration: durations.length ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length) : 0,
    latestCompletedAt: latestDate(completedAttempts.map((attempt) => attempt.completed_at ?? attempt.created_at)),
  };
}

export function summarizeActivityEvents(events: AdminActivityEventRow[]): ActivitySummary {
  const counts = new Map<string, number>();

  for (const event of events) {
    const appId = event.app_id ?? "system";
    counts.set(appId, (counts.get(appId) ?? 0) + 1);
  }

  return {
    total: events.length,
    appCounts: Array.from(counts, ([appId, count]) => ({ appId, count }))
      .sort((a, b) => b.count - a.count || a.appId.localeCompare(b.appId))
      .slice(0, 6),
    latestEventAt: events[0]?.occurred_at ?? null,
  };
}

export function buildGameStats(attempts: AdminPuzzleAttemptRow[], now = new Date()): GameStat[] {
  const byType = new Map<string, AdminPuzzleAttemptRow[]>();

  for (const attempt of attempts) {
    byType.set(attempt.puzzle_type, [...(byType.get(attempt.puzzle_type) ?? []), attempt]);
  }

  return Array.from(byType, ([puzzleType, gameAttempts]) => {
    const completedAttempts = gameAttempts.filter((attempt) => attempt.result === "completed" || Boolean(attempt.completed_at));
    const completionDays = Array.from(
      new Set(
        completedAttempts
          .map((attempt) => attempt.completed_at ?? attempt.created_at)
          .filter(Boolean)
          .map((date) => toDayKey(new Date(date))),
      ),
    ).sort();

    return {
      puzzleType,
      attempts: gameAttempts.length,
      completed: completedAttempts.length,
      daily: gameAttempts.filter((attempt) => Boolean(attempt.metadata?.daily) || attempt.level_id.includes("daily")).length,
      currentStreak: computeCurrentStreak(completionDays, now),
      maxStreak: computeMaxStreak(completionDays),
      latestCompletedAt: latestDate(completedAttempts.map((attempt) => attempt.completed_at ?? attempt.created_at)),
    };
  }).sort((a, b) => b.completed - a.completed || a.puzzleType.localeCompare(b.puzzleType));
}

export function buildSessionSummaries(data: AdminDashboardData): AdminSessionSummary[] {
  return data.sessions.map((session) => ({
    id: session.id,
    startedAt: session.started_at,
    eventCount: data.events.filter((event) => event.session_id === session.id).length,
    puzzleCount: data.attempts.filter((attempt) => attempt.session_id === session.id || attempt.metadata?.sessionId === session.id).length,
    captureCount: data.captures.filter((capture) => capture.session_id === session.id).length,
    musicCount: data.music.filter((event) => event.session_id === session.id).length,
    unlockCount: data.unlocks.filter((event) => event.session_id === session.id).length,
  }));
}

export function buildSessionActivityGroups(data: AdminDashboardData, limitPerSession = 5): AdminSessionActivityGroup[] {
  return data.sessions
    .map((session) => {
      const items: AdminSessionActivityItem[] = [
        ...data.events
          .filter((event) => event.session_id === session.id)
          .map((event) => ({
            kind: "activity" as const,
            occurredAt: event.occurred_at,
            title: formatActivityTitle(event),
            detail: [event.app_id ?? "system", formatMetadataContext(event.metadata)].filter(Boolean).join(" · "),
          })),
        ...data.attempts
          .filter((attempt) => attempt.session_id === session.id || attempt.metadata?.sessionId === session.id)
          .map((attempt) => ({
            kind: "puzzle" as const,
            occurredAt: attempt.completed_at ?? attempt.created_at,
            title: `${attempt.result === "completed" || attempt.completed_at ? "Completed" : "Played"} ${formatAdminLabel(attempt.puzzle_type)}`,
            detail: [
              formatLevelLabel(attempt.level_id),
              attempt.duration ? formatAdminDuration(Math.round(attempt.duration)) : "",
              attempt.metadata?.daily || attempt.level_id.includes("daily") ? "daily" : "",
            ].filter(Boolean).join(" · "),
          })),
        ...data.captures
          .filter((capture) => capture.session_id === session.id)
          .map((capture) => ({
            kind: "capture" as const,
            occurredAt: capture.captured_at,
            title: "Photo captured",
            detail: [capture.album_id, formatMetadataContext(capture.metadata)].filter(Boolean).join(" · "),
          })),
        ...data.music
          .filter((event) => event.session_id === session.id)
          .map((event) => ({
            kind: "music" as const,
            occurredAt: event.created_at,
            title: `Music ${formatAdminLabel(event.event_type)}`,
            detail: [event.track_id, event.progress ? `${Math.round(event.progress)}s` : ""].filter(Boolean).join(" · "),
          })),
        ...data.unlocks
          .filter((event) => event.session_id === session.id)
          .map((event) => ({
            kind: "unlock" as const,
            occurredAt: event.occurred_at,
            title: formatAdminLabel(event.event_type),
            detail: event.success ? "successful unlock" : "failed unlock",
          })),
      ];

      return {
        id: session.id,
        startedAt: session.started_at,
        items: items
          .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
          .slice(0, limitPerSession),
      };
    })
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export function formatAdminDuration(seconds: number) {
  if (!seconds) {
    return "0s";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return minutes ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
}

function computeCurrentStreak(days: string[], now: Date) {
  const daySet = new Set(days);
  let cursor = startOfDay(now);
  let streak = 0;

  while (daySet.has(toDayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function computeMaxStreak(days: string[]) {
  let max = 0;
  let current = 0;
  let previous: Date | null = null;

  for (const day of days) {
    const date = new Date(`${day}T00:00:00.000Z`);
    current = previous && differenceInDays(date, previous) === 1 ? current + 1 : 1;
    max = Math.max(max, current);
    previous = date;
  }

  return max;
}

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function differenceInDays(date: Date, previous: Date) {
  return Math.round((date.getTime() - previous.getTime()) / 86_400_000);
}

function formatActivityTitle(event: AdminActivityEventRow) {
  const label = formatAdminLabel(event.event_type);
  const app = event.app_id ? formatAdminLabel(event.app_id) : "System";

  if (event.event_type.toLowerCase().includes("open")) {
    return `Opened ${app}`;
  }

  return `${app} ${label}`;
}

function formatAdminLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bId\b/g, "ID");
}

function formatLevelLabel(levelId: string) {
  return levelId.replace(/^(zip|wordle|arrow-escape)-/, "").replaceAll("-", " ");
}

function formatMetadataContext(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) {
    return "";
  }

  const label = metadata.title ?? metadata.name ?? metadata.caption ?? metadata.noteTitle;
  return typeof label === "string" && label.trim() ? label.trim() : "";
}

function latestDate(values: Array<string | null | undefined>) {
  const latest = values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  return latest ?? null;
}
