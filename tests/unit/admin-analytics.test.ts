import { describe, expect, it } from "vitest";

import {
  buildGameStats,
  buildSessionActivityGroups,
  buildSessionSummaries,
  summarizePuzzleAttempts,
  type AdminDashboardData,
} from "@/features/admin/admin-analytics";

describe("admin analytics", () => {
  const dashboardData: AdminDashboardData = {
    mode: "cloud",
    sessions: [
      { id: "session-1", started_at: "2026-05-22T09:00:00.000Z", ended_at: null, duration: null, device_info: {}, created_at: "2026-05-22T09:00:00.000Z" },
    ],
    attempts: [
      {
        session_id: "session-1",
        puzzle_type: "zip",
        level_id: "zip-level-001",
        completed_at: "2026-05-22T09:03:00.000Z",
        created_at: "2026-05-22T09:03:00.000Z",
        duration: 41,
        moves: 12,
        hints_used: 0,
        resets: 0,
        result: "completed",
        metadata: {},
      },
      {
        session_id: "session-1",
        puzzle_type: "zip",
        level_id: "zip-daily-2026-05-23",
        completed_at: "2026-05-23T09:03:00.000Z",
        created_at: "2026-05-23T09:03:00.000Z",
        duration: 61,
        moves: 18,
        hints_used: 0,
        resets: 0,
        result: "completed",
        metadata: { daily: true },
      },
    ],
    events: [
      { session_id: "session-1", app_id: "zip", event_type: "APP_OPENED", occurred_at: "2026-05-23T09:00:00.000Z", metadata: {} },
    ],
    captures: [
      { id: "capture-1", session_id: "session-1", storage_path: "camera/1.jpg", album_id: "camera-roll", captured_at: "2026-05-23T09:04:00.000Z", metadata: {} },
    ],
    music: [
      { id: "music-1", session_id: "session-1", track_id: "song-1", playlist_id: null, event_type: "play", progress: 0, duration: null, created_at: "2026-05-23T09:04:00.000Z" },
    ],
    contentState: [],
    unlocks: [
      { id: "unlock-1", session_id: "session-1", event_type: "face_id_unlock", success: true, occurred_at: "2026-05-23T09:00:00.000Z", metadata: { storagePath: "unlock/1.jpg" } },
    ],
  };

  it("summarizes puzzle attempts for admin cards", () => {
    expect(summarizePuzzleAttempts(dashboardData.attempts)).toEqual({
      total: 2,
      completed: 2,
      daily: 1,
      averageDuration: 51,
      latestCompletedAt: "2026-05-23T09:03:00.000Z",
    });
  });

  it("builds per-game streaks and session summaries for the dashboard", () => {
    expect(buildGameStats(dashboardData.attempts, new Date("2026-05-23T12:00:00.000Z"))[0]).toMatchObject({
      puzzleType: "zip",
      attempts: 2,
      completed: 2,
      currentStreak: 2,
      maxStreak: 2,
      daily: 1,
    });

    expect(buildSessionSummaries(dashboardData)[0]).toMatchObject({
      id: "session-1",
      eventCount: 1,
      puzzleCount: 2,
      captureCount: 1,
      musicCount: 1,
      unlockCount: 1,
    });
  });

  it("groups recent admin activity into readable session stories", () => {
    const [group] = buildSessionActivityGroups(dashboardData, 5);

    expect(group).toMatchObject({
      id: "session-1",
      startedAt: "2026-05-22T09:00:00.000Z",
    });
    expect(group.items.map((item) => item.title)).toEqual([
      "Photo captured",
      "Music Play",
      "Completed Zip",
      "Opened Zip",
      "Face ID Unlock",
    ]);
    expect(group.items[0].detail).toContain("camera-roll");
    expect(group.items[2].detail).toContain("daily");
  });
});
