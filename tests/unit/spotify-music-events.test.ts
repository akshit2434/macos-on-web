import { afterEach, describe, expect, it, vi } from "vitest";

import { syncSpotifyMusicEvent } from "@/features/apps/spotify/spotify-music-events";

describe("spotify music events", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("syncs player actions to the dedicated music history endpoint", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal("fetch", fetchMock);

    await syncSpotifyMusicEvent({
      sessionId: "session-1",
      trackId: "track-1",
      playlistId: "playlist-1",
      eventType: "started",
      progress: 12.2,
      duration: 180,
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/music/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "session-1",
        trackId: "track-1",
        playlistId: "playlist-1",
        eventType: "started",
        progress: 12.2,
        duration: 180,
      }),
      keepalive: true,
    });
  });
});
