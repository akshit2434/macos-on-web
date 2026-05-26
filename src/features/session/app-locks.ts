import type { SessionMode } from "./session-mode";

const lockedAppIds = new Set(["notes", "whatsapp"]);

export function isAppLockedForSession(appId: string, mode: SessionMode) {
  return mode !== "test" && lockedAppIds.has(appId);
}

export function getLockedAppMessage(appId: string) {
  const label = appId === "whatsapp" ? "Chat" : appId === "notes" ? "Notes" : "This app";
  return `${label} is locked in owner mode. Use the test session to inspect it safely.`;
}
