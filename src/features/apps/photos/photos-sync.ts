import type { PhotoRecord } from "@/content/apps/photos";
import { isTestSessionActive, testSessionHeaders } from "@/features/session/session-mode";

export type PhotoEngagementState = Record<string, { viewedAt?: string; viewCount?: number }>;

export async function syncPhotosStateToCloud(photos: PhotoRecord[], engagement: PhotoEngagementState) {
  if (isTestSessionActive()) {
    return;
  }

  await fetch("/api/photos/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...testSessionHeaders() },
    body: JSON.stringify({ photos, engagement }),
    keepalive: true,
  }).catch(() => undefined);
}
