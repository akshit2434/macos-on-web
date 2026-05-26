"use client";

import { useEffect } from "react";

import { useWindowStore } from "@/features/shell/windowing/use-window-store";
import { getTodaysUnlockNotifications, toLocalDateId } from "./time-locked-content";

const notifiedUnlockDaysStorageKey = "macos-web.contentUnlocks.notifiedDays.v1";

export function useContentUnlockNotifications(isLocked: boolean) {
  const notify = useWindowStore((state) => state.notify);

  useEffect(() => {
    if (isLocked) {
      return;
    }

    const checkUnlocks = () => {
      const now = new Date();
      const today = toLocalDateId(now);
      const notifications = getTodaysUnlockNotifications(now);
      if (notifications.length === 0 || hasNotifiedForDay(today)) {
        return;
      }

      markNotifiedForDay(today);
      notifications.forEach((notification) => {
        notify(notification);
      });
    };

    checkUnlocks();
    const interval = window.setInterval(checkUnlocks, 60_000);
    return () => window.clearInterval(interval);
  }, [isLocked, notify]);
}

function hasNotifiedForDay(dateId: string) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(notifiedUnlockDaysStorageKey) ?? "[]") as string[];
    return stored.includes(dateId);
  } catch {
    return false;
  }
}

function markNotifiedForDay(dateId: string) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(notifiedUnlockDaysStorageKey) ?? "[]") as string[];
    window.localStorage.setItem(notifiedUnlockDaysStorageKey, JSON.stringify(Array.from(new Set([...stored, dateId])).slice(-30)));
  } catch {
    // Notification de-duping is best effort; failing storage should not block the OS.
  }
}
