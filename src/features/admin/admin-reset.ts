export const adminResetTableOrder = [
  "activity_events",
  "music_events",
  "puzzle_attempts",
  "captured_photos",
  "unlock_events",
  "content_state",
  "sessions",
] as const;

export const adminRuntimeLocalStorageKeys = [
  "macos-web.puzzle-attempt-history.v1",
  "macos-web-puzzle-session-states-v1",
  "macos-web.notes.v1",
  "macos-web-captured-photos",
  "macos-web.contentUnlocks.notifiedDays.v1",
  "macos-web.wallpaper.id.v1",
  "macos-web.desktop.iconOrder.v1",
  "macos-web.faceId.enabled.v1",
] as const;

export type AdminResetTable = (typeof adminResetTableOrder)[number];

export function resetLocalRuntimeState(storage: Storage | undefined = globalThis.window?.localStorage) {
  if (!storage) return;

  for (const key of adminRuntimeLocalStorageKeys) {
    storage.removeItem(key);
  }
}

export function resolveAdminPassword() {
  return process.env.MACOS_WEB_ADMIN_PASSWORD || "demo-admin";
}
