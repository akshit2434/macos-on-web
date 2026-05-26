"use client";

import { createContext, useContext } from "react";

import { isolatedSessionHeader } from "./session-isolation";

export type SessionMode = "owner" | "test";

export const sessionModeStorageKey = "macos-web.sessionMode.v1";

const SessionModeContext = createContext<SessionMode>("owner");

export function SessionModeProvider({ children, mode }: { children: React.ReactNode; mode: SessionMode }) {
  return <SessionModeContext.Provider value={mode}>{children}</SessionModeContext.Provider>;
}

export function useSessionMode() {
  return useContext(SessionModeContext);
}

export function persistSessionMode(mode: SessionMode) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(sessionModeStorageKey, mode);
  } catch {
    // Session isolation is still enforced in temporary runtime state if local storage is unavailable.
  }
}

export function readStoredSessionMode(): SessionMode {
  if (typeof window === "undefined") return "owner";

  try {
    return window.localStorage.getItem(sessionModeStorageKey) === "test" ? "test" : "owner";
  } catch {
    return "owner";
  }
}

export function isTestSessionActive() {
  return readStoredSessionMode() === "test";
}

export function testSessionHeaders(): HeadersInit {
  return isTestSessionActive() ? { [isolatedSessionHeader]: "test" } : {};
}
