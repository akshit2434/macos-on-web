import { isTestSessionActive, testSessionHeaders } from "@/features/session/session-mode";

export type SpotifyMusicEvent = {
  sessionId: string;
  trackId: string;
  playlistId: string;
  eventType: string;
  progress?: number;
  duration?: number;
};

export async function syncSpotifyMusicEvent(event: SpotifyMusicEvent) {
  if (isTestSessionActive()) {
    return;
  }

  await fetch("/api/music/events", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...testSessionHeaders() },
    body: JSON.stringify(event),
    keepalive: true,
  }).catch(() => undefined);
}
