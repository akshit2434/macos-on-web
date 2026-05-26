import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAnalyticsQueue,
  type AnalyticsTransport,
} from "@/lib/analytics/analytics-queue";

describe("analytics queue", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("accepts events instantly and flushes them in batches", async () => {
    const sentBatches: unknown[][] = [];
    const transport: AnalyticsTransport = {
      send: async (events) => {
        sentBatches.push(events);
      },
    };
    const queue = createAnalyticsQueue({ transport, sessionId: "session-1" });

    queue.track({ eventType: "APP_OPENED", appId: "notes" });
    queue.track({ eventType: "NOTE_OPENED", appId: "notes", metadata: { noteId: "daily" } });

    expect(queue.size()).toBe(2);

    await queue.flush();

    expect(queue.size()).toBe(0);
    expect(sentBatches).toHaveLength(1);
    expect(sentBatches[0]).toHaveLength(2);
    expect(sentBatches[0][0]).toMatchObject({
      sessionId: "session-1",
      eventType: "APP_OPENED",
      appId: "notes",
    });
  });

  it("keeps events queued when the transport fails", async () => {
    const transport: AnalyticsTransport = {
      send: vi.fn(async () => {
        throw new Error("network cold start");
      }),
    };
    const queue = createAnalyticsQueue({ transport, sessionId: "session-1" });

    queue.track({ eventType: "TRACK_STARTED", appId: "spotify", metadata: { trackId: "song-1" } });
    await expect(queue.flush()).resolves.toEqual({ ok: false, sent: 0 });

    expect(queue.size()).toBe(1);
  });

  it("drops events when analytics is disabled for an isolated session", async () => {
    const transport: AnalyticsTransport = {
      send: vi.fn(),
    };
    const queue = createAnalyticsQueue({ transport, sessionId: "test-session-1", disabled: true });

    queue.track({ eventType: "APP_OPENED", appId: "notes" });

    expect(queue.size()).toBe(0);
    await expect(queue.flush()).resolves.toEqual({ ok: true, sent: 0 });
    expect(transport.send).not.toHaveBeenCalled();
  });
});
