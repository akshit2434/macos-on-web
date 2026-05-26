"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";

import { useContentUnlockNotifications } from "@/features/content-unlocks/use-content-unlock-notifications";
import { persistSessionMode, readStoredSessionMode, SessionModeProvider, type SessionMode } from "@/features/session/session-mode";
import { AnalyticsProvider, useAnalytics } from "@/lib/analytics/use-analytics";
import { createSessionId } from "@/lib/utils";

import { analyticsEvents } from "@/lib/analytics/events";
import { Desktop } from "./components/Desktop";
import { Dock } from "./components/Dock";
import { LockScreen } from "./components/LockScreen";
import { MenuBar } from "./components/MenuBar";
import { NotificationStack } from "./components/NotificationStack";
import { WindowLayer } from "./components/WindowLayer";
import { useWindowStore } from "./windowing/use-window-store";
import { hasMaximizedWindow } from "./windowing/window-reducer";

const focusedAutoLockMs = 10 * 60 * 1000;
const blurredAutoLockMs = 60 * 1000;

function SimulatorSurface({ onSessionModeChange }: { onSessionModeChange: (mode: SessionMode) => void }) {
  const [isLocked, setIsLocked] = useState(true);
  const [shellReady, setShellReady] = useState(false);
  const [hasUnlockedOnce, setHasUnlockedOnce] = useState(false);
  const windows = useWindowStore((state) => state.windows);
  const fullscreenActive = hasMaximizedWindow(windows);
  const showShell = hasUnlockedOnce || !isLocked;
  const { track } = useAnalytics();
  useContentUnlockNotifications(isLocked);

  useEffect(() => {
    track({ eventType: analyticsEvents.deviceOpened });
    track({ eventType: analyticsEvents.loginViewed });
  }, [track]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setShellReady(true));
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const preventBrowserZoom = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    };
    const preventGestureZoom = (event: Event) => event.preventDefault();

    window.addEventListener("wheel", preventBrowserZoom, { passive: false });
    window.addEventListener("gesturestart", preventGestureZoom, { passive: false });
    window.addEventListener("gesturechange", preventGestureZoom, { passive: false });
    window.addEventListener("gestureend", preventGestureZoom, { passive: false });

    return () => {
      window.removeEventListener("wheel", preventBrowserZoom);
      window.removeEventListener("gesturestart", preventGestureZoom);
      window.removeEventListener("gesturechange", preventGestureZoom);
      window.removeEventListener("gestureend", preventGestureZoom);
    };
  }, []);

  useEffect(() => {
    if (isLocked) {
      return;
    }

    let timer: number | undefined;

    const lockDevice = (eventType: string) => {
      track({ eventType });
      track({ eventType: "AUTO_LOCK_TRIGGERED" });
      track({ eventType: analyticsEvents.deviceLocked });
      setIsLocked(true);
    };

    const scheduleLock = (delay: number, eventType: string) => {
      if (timer) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(() => lockDevice(eventType), delay);
    };

    const resetFocusedTimer = () => {
      scheduleLock(focusedAutoLockMs, "FOCUSED_INACTIVITY_LOCK_TRIGGERED");
    };

    const handleBlur = () => {
      track({ eventType: "WINDOW_BLUR_LOCK_ARMED", metadata: { delayMs: blurredAutoLockMs } });
      scheduleLock(blurredAutoLockMs, "WINDOW_BLUR_LOCK_TRIGGERED");
    };

    const handleFocus = () => {
      track({ eventType: "WINDOW_FOCUS_LOCK_DISARMED" });
      resetFocusedTimer();
    };

    resetFocusedTimer();
    window.addEventListener("mousemove", resetFocusedTimer);
    window.addEventListener("keydown", resetFocusedTimer);
    window.addEventListener("pointerdown", resetFocusedTimer);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
      window.removeEventListener("mousemove", resetFocusedTimer);
      window.removeEventListener("keydown", resetFocusedTimer);
      window.removeEventListener("pointerdown", resetFocusedTimer);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isLocked, track]);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-black text-white">
      {showShell ? (
        <>
          <div className={fullscreenActive ? "pointer-events-none opacity-0 transition-opacity duration-300" : "opacity-100 transition-opacity duration-300"}>
            <Desktop />
          </div>
          {!fullscreenActive ? <MenuBar isLocked={isLocked} onLock={() => setIsLocked(true)} /> : null}
          <WindowLayer />
          {!fullscreenActive ? <Dock /> : null}
          <NotificationStack />
        </>
      ) : null}
      <AnimatePresence mode="wait">
        {isLocked ? (
          <LockScreen
            key="lock-screen"
            ready={shellReady}
            onUnlocked={(mode) => {
              onSessionModeChange(mode);
              setHasUnlockedOnce(true);
              setIsLocked(false);
            }}
          />
        ) : null}
      </AnimatePresence>
    </main>
  );
}

export function DesktopShellSimulator() {
  const sessionId = useMemo(() => createSessionId(), []);
  const [sessionMode, setSessionMode] = useState<SessionMode>(() => readStoredSessionMode());

  const updateSessionMode = (mode: SessionMode) => {
    persistSessionMode(mode);
    setSessionMode(mode);
  };

  return (
    <AnalyticsProvider sessionId={sessionId} disabled={sessionMode === "test"}>
      <SessionModeProvider mode={sessionMode}>
        <SimulatorSurface onSessionModeChange={updateSessionMode} />
      </SessionModeProvider>
    </AnalyticsProvider>
  );
}
